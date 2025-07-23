import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { blink } from '@/blink/client'
import { Exercise, MuscleGroup, LoadType, ExerciseType } from '@/types'

const muscleGroups: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Грудь' },
  { value: 'back', label: 'Спина' },
  { value: 'legs', label: 'Ноги' },
  { value: 'shoulders', label: 'Плечи' },
  { value: 'arms', label: 'Руки' },
  { value: 'abs', label: 'Пресс' },
  { value: 'cardio', label: 'Кардио' }
]

const loadTypes: { value: LoadType; label: string }[] = [
  { value: 'bodyweight', label: 'Свой вес' },
  { value: 'additional_weight', label: 'Доп. вес' },
  { value: 'resistance_band', label: 'Резина' },
  { value: 'machine', label: 'Тренажер' }
]

const exerciseTypes: { value: ExerciseType; label: string }[] = [
  { value: 'main', label: 'Основное' },
  { value: 'auxiliary', label: 'Вспомогательное' },
  { value: 'isolation', label: 'Изолированное' }
]

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all')
  const [selectedLoadType, setSelectedLoadType] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: 'chest' as MuscleGroup,
    loadType: 'bodyweight' as LoadType,
    technique: '',
    videoUrl: '',
    sets: 3,
    reps: 10,
    exerciseType: 'main' as ExerciseType,
    machineName: '',
    machineSettings: '',
    comment: ''
  })

  const loadExercises = useCallback(async () => {
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
  }, [])

  const filterExercises = useCallback(() => {
    let filtered = exercises

    if (searchTerm) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedMuscleGroup !== 'all') {
      filtered = filtered.filter(exercise => exercise.muscleGroup === selectedMuscleGroup)
    }

    if (selectedLoadType !== 'all') {
      filtered = filtered.filter(exercise => exercise.loadType === selectedLoadType)
    }

    setFilteredExercises(filtered)
  }, [exercises, searchTerm, selectedMuscleGroup, selectedLoadType])

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      muscleGroup: 'chest',
      loadType: 'bodyweight',
      technique: '',
      videoUrl: '',
      sets: 3,
      reps: 10,
      exerciseType: 'main',
      machineName: '',
      machineSettings: '',
      comment: ''
    })
  }, [])

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

  useEffect(() => {
    filterExercises()
  }, [filterExercises])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = await blink.auth.me()
      
      if (editingExercise) {
        await blink.db.exercises.update(editingExercise.id, {
          ...formData,
          updatedAt: new Date().toISOString()
        })
      } else {
        await blink.db.exercises.create({
          ...formData,
          userId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }

      await loadExercises()
      resetForm()
      setIsAddDialogOpen(false)
      setEditingExercise(null)
    } catch (error) {
      console.error('Error saving exercise:', error)
    }
  }

  const handleEdit = (exercise: Exercise) => {
    setFormData({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      loadType: exercise.loadType,
      technique: exercise.technique,
      videoUrl: exercise.videoUrl || '',
      sets: exercise.sets,
      reps: exercise.reps,
      exerciseType: exercise.exerciseType,
      machineName: exercise.machineName || '',
      machineSettings: exercise.machineSettings || '',
      comment: exercise.comment || ''
    })
    setEditingExercise(exercise)
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (exerciseId: string) => {
    if (confirm('Вы уверены, что хотите удалить это упражнение?')) {
      try {
        await blink.db.exercises.delete(exerciseId)
        await loadExercises()
      } catch (error) {
        console.error('Error deleting exercise:', error)
      }
    }
  }

  const getMuscleGroupLabel = (group: MuscleGroup) => {
    return muscleGroups.find(g => g.value === group)?.label || group
  }

  const getLoadTypeLabel = (type: LoadType) => {
    return loadTypes.find(t => t.value === type)?.label || type
  }

  const getExerciseTypeLabel = (type: ExerciseType) => {
    return exerciseTypes.find(t => t.value === type)?.label || type
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Упражнения</h1>
          <p className="text-gray-600">Управляйте базой упражнений</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExercise ? 'Редактировать упражнение' : 'Добавить упражнение'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название упражнения</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="muscleGroup">Группа мышц</Label>
                  <Select
                    value={formData.muscleGroup}
                    onValueChange={(value: MuscleGroup) => setFormData({ ...formData, muscleGroup: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {muscleGroups.map(group => (
                        <SelectItem key={group.value} value={group.value}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loadType">Тип нагрузки</Label>
                  <Select
                    value={formData.loadType}
                    onValueChange={(value: LoadType) => setFormData({ ...formData, loadType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {loadTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exerciseType">Тип упражнения</Label>
                  <Select
                    value={formData.exerciseType}
                    onValueChange={(value: ExerciseType) => setFormData({ ...formData, exerciseType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exerciseTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sets">Подходы</Label>
                  <Input
                    id="sets"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.sets}
                    onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reps">Повторения</Label>
                  <Input
                    id="reps"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.reps}
                    onChange={(e) => setFormData({ ...formData, reps: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              {formData.loadType === 'machine' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="machineName">Название тренажера</Label>
                    <Input
                      id="machineName"
                      value={formData.machineName}
                      onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="machineSettings">Настройки тренажера</Label>
                    <Input
                      id="machineSettings"
                      value={formData.machineSettings}
                      onChange={(e) => setFormData({ ...formData, machineSettings: e.target.value })}
                      placeholder="Угол наклона, высота и т.д."
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="technique">Техника выполнения</Label>
                <Textarea
                  id="technique"
                  value={formData.technique}
                  onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Ссылка на видео (опционально)</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Комментарий (опционально)</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={2}
                  placeholder="Дополнительные заметки об упражнении..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingExercise(null)
                    resetForm()
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingExercise ? 'Сохранить' : 'Добавить'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Поиск упражнений..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Группа мышц" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все группы</SelectItem>
            {muscleGroups.map(group => (
              <SelectItem key={group.value} value={group.value}>
                {group.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedLoadType} onValueChange={setSelectedLoadType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Тип нагрузки" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {loadTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Exercise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                    {exercise.name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getMuscleGroupLabel(exercise.muscleGroup)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getLoadTypeLabel(exercise.loadType)}
                    </Badge>
                    <Badge className={`text-xs ${getExerciseTypeColor(exercise.exerciseType)}`}>
                      {getExerciseTypeLabel(exercise.exerciseType)}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(exercise)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(exercise.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Подходы × Повторения</span>
                  <span className="font-medium">{exercise.sets} × {exercise.reps}</span>
                </div>
                
                {exercise.machineName && (
                  <div className="text-sm">
                    <span className="text-gray-600">Тренажер: </span>
                    <span className="font-medium">{exercise.machineName}</span>
                  </div>
                )}

                <div className="text-sm text-gray-700">
                  <p className="line-clamp-2">{exercise.technique}</p>
                </div>

                {exercise.comment && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Комментарий: </span>
                    {exercise.comment}
                  </div>
                )}

                {exercise.videoUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(exercise.videoUrl, '_blank')}
                  >
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Посмотреть видео
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {exercises.length === 0 ? 'Нет упражнений' : 'Упражнения не найдены'}
          </h3>
          <p className="text-gray-600 mb-4">
            {exercises.length === 0 
              ? 'Добавьте первое упражнение в вашу базу'
              : 'Попробуйте изменить фильтры поиска'
            }
          </p>
          {exercises.length === 0 && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Добавить упражнение
            </Button>
          )}
        </div>
      )}
    </div>
  )
}