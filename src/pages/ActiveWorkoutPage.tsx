import React, { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, Check, X, Timer, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { blink } from '@/blink/client'
import { Workout, Exercise, WorkoutExercise } from '@/types'

interface ActiveWorkoutExercise extends WorkoutExercise {
  exercise: Exercise
  currentSet: number
  setResults: { weight: number; completed: boolean }[]
}

export default function ActiveWorkoutPage() {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<ActiveWorkoutExercise[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(90) // Default 90 seconds
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerFinished, setTimerFinished] = useState(false)

  const loadActiveWorkout = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const workouts = await blink.db.workouts.list({
        where: { userId: user.id, status: 'active' },
        orderBy: { createdAt: 'desc' },
        limit: 1
      })

      if (workouts.length === 0) {
        // No active workout, redirect to generator
        window.location.hash = '#/generator'
        return
      }

      const activeWorkout = workouts[0]
      setWorkout(activeWorkout)

      // Load exercise details
      const exerciseDetails = await Promise.all(
        activeWorkout.exercises.map(async (workoutEx) => {
          const exercise = await blink.db.exercises.list({
            where: { id: workoutEx.exerciseId },
            limit: 1
          })
          
          return {
            ...workoutEx,
            exercise: exercise[0],
            currentSet: 0,
            setResults: Array(workoutEx.sets).fill(null).map(() => ({
              weight: workoutEx.weight || 0,
              completed: false
            }))
          }
        })
      )

      setExercises(exerciseDetails)
    } catch (error) {
      console.error('Error loading active workout:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadActiveWorkout()
  }, [loadActiveWorkout])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsTimerRunning(false)
            setTimerFinished(true)
            // Play notification sound (browser notification)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Время отдыха закончилось!', {
                body: 'Готовы к следующему подходу?',
                icon: '/favicon.svg'
              })
            }
            return 0
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timeLeft])

  const startTimer = () => {
    setTimeLeft(timerSeconds)
    setIsTimerRunning(true)
    setTimerFinished(false)
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimeLeft(timerSeconds)
    setTimerFinished(false)
  }

  const updateSetWeight = (exerciseIndex: number, setIndex: number, weight: number) => {
    setExercises(exercises.map((ex, exIndex) => 
      exIndex === exerciseIndex 
        ? {
            ...ex,
            setResults: ex.setResults.map((set, sIndex) => 
              sIndex === setIndex ? { ...set, weight } : set
            )
          }
        : ex
    ))
  }

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    setExercises(exercises.map((ex, exIndex) => 
      exIndex === exerciseIndex 
        ? {
            ...ex,
            setResults: ex.setResults.map((set, sIndex) => 
              sIndex === setIndex ? { ...set, completed: true } : set
            ),
            currentSet: Math.min(setIndex + 1, ex.sets - 1)
          }
        : ex
    ))

    // Auto-start timer after completing a set (except for the last set of the exercise)
    const exercise = exercises[exerciseIndex]
    if (setIndex < exercise.sets - 1) {
      startTimer()
    }
  }

  const uncompleteSet = (exerciseIndex: number, setIndex: number) => {
    setExercises(exercises.map((ex, exIndex) => 
      exIndex === exerciseIndex 
        ? {
            ...ex,
            setResults: ex.setResults.map((set, sIndex) => 
              sIndex === setIndex ? { ...set, completed: false } : set
            )
          }
        : ex
    ))
  }

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      resetTimer()
    }
  }

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1)
      resetTimer()
    }
  }

  const finishWorkout = async () => {
    if (!workout) return

    try {
      // Update workout status and save results
      await blink.db.workouts.update(workout.id, {
        status: 'completed',
        exercises: exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.setResults[0]?.weight || 0, // Use weight from first set
          completed: ex.setResults.every(set => set.completed)
        })),
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Navigate back to home
      window.location.hash = '#/'
    } catch (error) {
      console.error('Error finishing workout:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getWorkoutProgress = () => {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)
    const completedSets = exercises.reduce((sum, ex) => 
      sum + ex.setResults.filter(set => set.completed).length, 0
    )
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!workout || exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Нет активной тренировки
        </h3>
        <p className="text-gray-600 mb-4">
          Создайте новую тренировку, чтобы начать
        </p>
        <Button onClick={() => window.location.hash = '#/generator'} className="bg-primary hover:bg-primary/90">
          Создать тренировку
        </Button>
      </div>
    )
  }

  const currentExercise = exercises[currentExerciseIndex]
  const progress = getWorkoutProgress()

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{workout.name}</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <span>Упражнение {currentExerciseIndex + 1} из {exercises.length}</span>
          <Badge variant="secondary">{Math.round(progress)}% завершено</Badge>
        </div>
        <Progress value={progress} className="mt-3" />
      </div>

      {/* Timer Card */}
      <Card className={`${timerFinished ? 'border-accent bg-accent/5' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              Таймер отдыха
            </div>
            <Select
              value={timerSeconds.toString()}
              onValueChange={(value) => {
                const newTime = parseInt(value)
                setTimerSeconds(newTime)
                if (!isTimerRunning) {
                  setTimeLeft(newTime)
                }
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30с</SelectItem>
                <SelectItem value="45">45с</SelectItem>
                <SelectItem value="60">1м</SelectItem>
                <SelectItem value="90">1.5м</SelectItem>
                <SelectItem value="120">2м</SelectItem>
                <SelectItem value="180">3м</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-4xl font-bold mb-4 ${
              timerFinished ? 'text-accent animate-pulse' : 
              timeLeft <= 10 && timeLeft > 0 ? 'text-red-500' : 'text-gray-900'
            }`}>
              {formatTime(timeLeft)}
            </div>
            <div className="flex justify-center gap-2">
              <Button
                onClick={isTimerRunning ? pauseTimer : startTimer}
                variant={isTimerRunning ? "outline" : "default"}
                className={!isTimerRunning ? "bg-accent hover:bg-accent/90" : ""}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button onClick={resetTimer} variant="outline">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            {timerFinished && (
              <p className="text-accent font-medium mt-2 animate-pulse">
                Время отдыха закончилось!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💪</span>
              {currentExercise.exercise.name}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={previousExercise}
                disabled={currentExerciseIndex === 0}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={nextExercise}
                disabled={currentExerciseIndex === exercises.length - 1}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">{currentExercise.exercise.technique}</p>
            {currentExercise.exercise.videoUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentExercise.exercise.videoUrl, '_blank')}
              >
                Посмотреть видео
              </Button>
            )}
          </div>

          {/* Sets */}
          <div className="space-y-3">
            <h4 className="font-medium">Подходы</h4>
            {currentExercise.setResults.map((set, setIndex) => (
              <div
                key={setIndex}
                className={`p-3 rounded-lg border transition-all ${
                  set.completed 
                    ? 'border-green-200 bg-green-50' 
                    : setIndex === currentExercise.currentSet
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={set.completed ? "default" : "outline"} className="w-12 justify-center">
                      {setIndex + 1}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {currentExercise.reps} повторений
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`weight-${setIndex}`} className="text-sm">
                        Вес:
                      </Label>
                      <Input
                        id={`weight-${setIndex}`}
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSetWeight(currentExerciseIndex, setIndex, parseFloat(e.target.value) || 0)}
                        className="w-20 h-8"
                        step="0.5"
                        min="0"
                      />
                      <span className="text-sm text-gray-500">кг</span>
                    </div>
                    
                    <Button
                      onClick={() => set.completed 
                        ? uncompleteSet(currentExerciseIndex, setIndex)
                        : completeSet(currentExerciseIndex, setIndex)
                      }
                      variant={set.completed ? "outline" : "default"}
                      size="sm"
                      className={set.completed ? "text-green-600" : "bg-accent hover:bg-accent/90"}
                    >
                      {set.completed ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exercise Navigation */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={previousExercise}
          disabled={currentExerciseIndex === 0}
          variant="outline"
          className="h-12"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Предыдущее
        </Button>
        <Button
          onClick={nextExercise}
          disabled={currentExerciseIndex === exercises.length - 1}
          variant="outline"
          className="h-12"
        >
          Следующее
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Finish Workout */}
      <div className="text-center pt-4">
        <Button
          onClick={finishWorkout}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          Завершить тренировку
        </Button>
      </div>

      {/* Exercise List */}
      <Card>
        <CardHeader>
          <CardTitle>Все упражнения</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {exercises.map((exercise, index) => {
              const completedSets = exercise.setResults.filter(set => set.completed).length
              const isActive = index === currentExerciseIndex
              
              return (
                <div
                  key={exercise.exerciseId}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isActive 
                      ? 'border-primary bg-primary/5' 
                      : completedSets === exercise.sets
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCurrentExerciseIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{exercise.exercise.name}</h4>
                      <p className="text-sm text-gray-600">
                        {exercise.sets} × {exercise.reps}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={completedSets === exercise.sets ? "default" : "outline"}>
                        {completedSets}/{exercise.sets}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}