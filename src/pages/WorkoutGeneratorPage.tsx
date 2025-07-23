import React, { useState, useEffect } from 'react'
import { Zap, Plus, Minus, Shuffle, Play, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { blink } from '@/blink/client'
import { Exercise, MuscleGroup, ExerciseType, Workout } from '@/types'

const muscleGroups: { value: MuscleGroup; label: string; icon: string }[] = [
  { value: 'chest', label: 'Грудь', icon: '💪' },
  { value: 'back', label: 'Спина', icon: '🏋️' },
  { value: 'legs', label: 'Ноги', icon: '🦵' },
  { value: 'shoulders', label: 'Плечи', icon: '🤸' },
  { value: 'arms', label: 'Руки', icon: '💪' },
  { value: 'abs', label: 'Пресс', icon: '🔥' },
  { value: 'cardio', label: 'Кардио', icon: '❤️' }
]

interface MuscleGroupSelection {
  muscleGroup: MuscleGroup
  exerciseCount: number
}

interface GeneratedExercise extends Exercise {
  isReplaced?: boolean
}

export default function WorkoutGeneratorPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroupSelection[]>([])
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const loadExercises = async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.exercises.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setExercises(data)
    } catch (error) {
      console.error('Error loading exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExercises()
  }, [])

  const addMuscleGroup = (muscleGroup: MuscleGroup) => {
    if (!selectedMuscleGroups.find(mg => mg.muscleGroup === muscleGroup)) {
      setSelectedMuscleGroups([...selectedMuscleGroups, { muscleGroup, exerciseCount: 2 }])
    }
  }

  const removeMuscleGroup = (muscleGroup: MuscleGroup) => {
    setSelectedMuscleGroups(selectedMuscleGroups.filter(mg => mg.muscleGroup !== muscleGroup))
  }

  const updateExerciseCount = (muscleGroup: MuscleGroup, count: number) => {
    setSelectedMuscleGroups(selectedMuscleGroups.map(mg => 
      mg.muscleGroup === muscleGroup ? { ...mg, exerciseCount: Math.max(1, Math.min(4, count)) } : mg
    ))
  }

  const generateWorkout = async () => {
    if (selectedMuscleGroups.length === 0) return

    setGenerating(true)
    try {
      const workout: GeneratedExercise[] = []

      for (const selection of selectedMuscleGroups) {
        const muscleGroupExercises = exercises.filter(ex => ex.muscleGroup === selection.muscleGroup)
        
        if (muscleGroupExercises.length === 0) continue

        // Prioritize exercise types: main -> auxiliary -> isolation
        const mainExercises = muscleGroupExercises.filter(ex => ex.exerciseType === 'main')
        const auxiliaryExercises = muscleGroupExercises.filter(ex => ex.exerciseType === 'auxiliary')
        const isolationExercises = muscleGroupExercises.filter(ex => ex.exerciseType === 'isolation')

        const selectedExercises: GeneratedExercise[] = []
        let remainingCount = selection.exerciseCount

        // Add main exercises first
        if (remainingCount > 0 && mainExercises.length > 0) {
          const mainCount = Math.min(remainingCount, Math.max(1, Math.floor(selection.exerciseCount * 0.4)))
          const shuffledMain = [...mainExercises].sort(() => Math.random() - 0.5)
          selectedExercises.push(...shuffledMain.slice(0, mainCount))
          remainingCount -= mainCount
        }

        // Add auxiliary exercises
        if (remainingCount > 0 && auxiliaryExercises.length > 0) {
          const auxCount = Math.min(remainingCount, Math.max(1, Math.floor(selection.exerciseCount * 0.4)))
          const shuffledAux = [...auxiliaryExercises].sort(() => Math.random() - 0.5)
          selectedExercises.push(...shuffledAux.slice(0, auxCount))
          remainingCount -= auxCount
        }

        // Fill remaining with isolation exercises
        if (remainingCount > 0 && isolationExercises.length > 0) {
          const shuffledIso = [...isolationExercises].sort(() => Math.random() - 0.5)
          selectedExercises.push(...shuffledIso.slice(0, remainingCount))
        }

        // If still not enough exercises, fill with any available
        if (selectedExercises.length < selection.exerciseCount) {
          const remaining = selection.exerciseCount - selectedExercises.length
          const usedIds = selectedExercises.map(ex => ex.id)
          const availableExercises = muscleGroupExercises.filter(ex => !usedIds.includes(ex.id))
          const shuffledAvailable = [...availableExercises].sort(() => Math.random() - 0.5)
          selectedExercises.push(...shuffledAvailable.slice(0, remaining))
        }

        workout.push(...selectedExercises)
      }

      setGeneratedWorkout(workout)
    } catch (error) {
      console.error('Error generating workout:', error)
    } finally {
      setGenerating(false)
    }
  }

  const replaceExercise = (exerciseToReplace: GeneratedExercise) => {
    const sameTypeExercises = exercises.filter(ex => 
      ex.muscleGroup === exerciseToReplace.muscleGroup &&
      ex.exerciseType === exerciseToReplace.exerciseType &&
      ex.id !== exerciseToReplace.id &&
      !generatedWorkout.find(genEx => genEx.id === ex.id)
    )

    if (sameTypeExercises.length === 0) {
      // If no same type exercises, try any from same muscle group
      const sameMuscleExercises = exercises.filter(ex => 
        ex.muscleGroup === exerciseToReplace.muscleGroup &&
        ex.id !== exerciseToReplace.id &&
        !generatedWorkout.find(genEx => genEx.id === ex.id)
      )
      
      if (sameMuscleExercises.length === 0) return

      const randomExercise = sameMuscleExercises[Math.floor(Math.random() * sameMuscleExercises.length)]
      setGeneratedWorkout(generatedWorkout.map(ex => 
        ex.id === exerciseToReplace.id 
          ? { ...randomExercise, isReplaced: true }
          : ex
      ))
    } else {
      const randomExercise = sameTypeExercises[Math.floor(Math.random() * sameTypeExercises.length)]
      setGeneratedWorkout(generatedWorkout.map(ex => 
        ex.id === exerciseToReplace.id 
          ? { ...randomExercise, isReplaced: true }
          : ex
      ))
    }
  }

  const startWorkout = async () => {
    if (generatedWorkout.length === 0) return

    try {
      const user = await blink.auth.me()
      const workout: Workout = {
        userId: user.id,
        name: `Тренировка ${new Date().toLocaleDateString()}`,
        exercises: generatedWorkout.map(ex => ({
          exerciseId: ex.id,
          sets: ex.sets,
          reps: ex.reps,
          weight: 0,
          completed: false
        })),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.workouts.create(workout)
      
      // Navigate to active workout (we'll implement this page next)
      window.location.hash = '#/workout'
    } catch (error) {
      console.error('Error starting workout:', error)
    }
  }

  const getMuscleGroupLabel = (group: MuscleGroup) => {
    return muscleGroups.find(g => g.value === group)?.label || group
  }

  const getMuscleGroupIcon = (group: MuscleGroup) => {
    return muscleGroups.find(g => g.value === group)?.icon || '💪'
  }

  const getExerciseTypeLabel = (type: ExerciseType) => {
    switch (type) {
      case 'main': return 'Основное'
      case 'auxiliary': return 'Вспомогательное'
      case 'isolation': return 'Изолированное'
      default: return type
    }
  }

  const getExerciseTypeColor = (type: ExerciseType) => {
    switch (type) {
      case 'main': return 'bg-orange-100 text-orange-800'
      case 'auxiliary': return 'bg-blue-100 text-blue-800'
      case 'isolation': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Генератор тренировок</h1>
        <p className="text-gray-600">Создайте персональную тренировку по выбранным группам мышц</p>
      </div>

      {/* Muscle Group Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Выберите группы мышц
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {muscleGroups.map((group) => {
              const isSelected = selectedMuscleGroups.find(mg => mg.muscleGroup === group.value)
              const exerciseCount = exercises.filter(ex => ex.muscleGroup === group.value).length
              
              return (
                <Button
                  key={group.value}
                  variant={isSelected ? "default" : "outline"}
                  className={`h-auto p-4 flex flex-col items-center gap-2 ${
                    isSelected ? 'bg-primary text-white' : ''
                  } ${exerciseCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => isSelected ? removeMuscleGroup(group.value) : addMuscleGroup(group.value)}
                  disabled={exerciseCount === 0}
                >
                  <span className="text-2xl">{group.icon}</span>
                  <span className="text-sm font-medium">{group.label}</span>
                  <span className="text-xs opacity-75">({exerciseCount})</span>
                </Button>
              )
            })}
          </div>

          {/* Exercise Count Controls */}
          {selectedMuscleGroups.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium text-gray-900">Количество упражнений</h4>
              {selectedMuscleGroups.map((selection) => (
                <div key={selection.muscleGroup} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getMuscleGroupIcon(selection.muscleGroup)}</span>
                    <span className="font-medium">{getMuscleGroupLabel(selection.muscleGroup)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateExerciseCount(selection.muscleGroup, selection.exerciseCount - 1)}
                      disabled={selection.exerciseCount <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{selection.exerciseCount}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateExerciseCount(selection.muscleGroup, selection.exerciseCount + 1)}
                      disabled={selection.exerciseCount >= 4}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={generateWorkout}
              disabled={selectedMuscleGroups.length === 0 || generating}
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Генерируем...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Сгенерировать тренировку
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Workout */}
      {generatedWorkout.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span>Ваша тренировка</span>
                <Badge variant="secondary">{generatedWorkout.length} упражнений</Badge>
              </CardTitle>
              <Button
                onClick={startWorkout}
                className="bg-accent hover:bg-accent/90"
              >
                <Play className="w-4 h-4 mr-2" />
                Начать тренировку
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedWorkout.map((exercise, index) => (
                <div
                  key={`${exercise.id}-${index}`}
                  className={`p-4 rounded-lg border transition-all ${
                    exercise.isReplaced ? 'border-accent bg-accent/5' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getMuscleGroupIcon(exercise.muscleGroup)}</span>
                        <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                        {exercise.isReplaced && (
                          <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground">
                            Заменено
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {getMuscleGroupLabel(exercise.muscleGroup)}
                        </Badge>
                        <Badge className={`text-xs ${getExerciseTypeColor(exercise.exerciseType)}`}>
                          {getExerciseTypeLabel(exercise.exerciseType)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {exercise.sets} × {exercise.reps}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">
                        {exercise.technique}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => replaceExercise(exercise)}
                      className="ml-2"
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-6">
              <Button
                onClick={startWorkout}
                size="lg"
                className="bg-accent hover:bg-accent/90"
              >
                <Play className="w-4 h-4 mr-2" />
                Начать тренировку
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {exercises.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Нет упражнений для генерации
          </h3>
          <p className="text-gray-600 mb-4">
            Добавьте упражнения в базу, чтобы создавать тренировки
          </p>
          <Button onClick={() => window.location.hash = '#/exercises'} className="bg-primary hover:bg-primary/90">
            Добавить упражнения
          </Button>
        </div>
      )}
    </div>
  )
}