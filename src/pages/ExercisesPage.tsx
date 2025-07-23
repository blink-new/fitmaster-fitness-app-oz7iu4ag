import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Dumbbell, Target, Zap } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { blink } from '../blink/client'
import { Exercise } from '../types'

const MUSCLE_GROUPS = [
  'грудь', 'спина', 'ноги', 'плечи', 'руки', 'пресс', 'кардио'
]

const LOAD_TYPES = [
  'свой вес', 'доп. вес', 'резина', 'тренажер'
]

const EXERCISE_TYPES = [
  'основное', 'вспомогательное', 'изолированное'
]

const getExerciseTypeColor = (type: string) => {
  switch (type) {
    case 'основное': return 'bg-orange-100 text-orange-800'
    case 'вспомогательное': return 'bg-blue-100 text-blue-800'
    case 'изолированное': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getExerciseTypeIcon = (type: string) => {
  switch (type) {
    case 'основное': return <Dumbbell className="w-3 h-3" />
    case 'вспомогательное': return <Target className="w-3 h-3" />
    case 'изолированное': return <Zap className="w-3 h-3" />
    default: return null
  }
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all')
  const [selectedLoadType, setSelectedLoadType] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  
  // Форма для добавления/редактирования упражнения
  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: '',
    loadType: '',
    technique: '',
    videoUrl: '',
    sets: 3,
    reps: 10,
    exerciseType: '',
    equipmentName: '',
    equipmentSettings: '',
    comment: ''
  })

  // Загрузка упражнений
  const loadExercises = async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      const result = await blink.db.exercises.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setExercises(result)
    } catch (error) {
      console.error('Ошибка загрузки упражнений:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExercises()
  }, [])

  // Фильтрация упражнений
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMuscleGroup = selectedMuscleGroup === 'all' || exercise.muscleGroup === selectedMuscleGroup
    const matchesLoadType = selectedLoadType === 'all' || exercise.loadType === selectedLoadType
    return matchesSearch && matchesMuscleGroup && matchesLoadType
  })

  // Сброс формы
  const resetForm = () => {
    setFormData({
      name: '',
      muscleGroup: '',
      loadType: '',
      technique: '',
      videoUrl: '',
      sets: 3,
      reps: 10,
      exerciseType: '',
      equipmentName: '',
      equipmentSettings: '',
      comment: ''
    })
    setEditingExercise(null)
  }

  // Открытие формы редактирования
  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setFormData({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      loadType: exercise.loadType,
      technique: exercise.technique || '',
      videoUrl: exercise.videoUrl || '',
      sets: exercise.sets,
      reps: exercise.reps,
      exerciseType: exercise.exerciseType,
      equipmentName: exercise.equipmentName || '',
      equipmentSettings: exercise.equipmentSettings || '',
      comment: exercise.comment || ''
    })
    setIsAddDialogOpen(true)
  }

  // Сохранение упражнения
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.muscleGroup || !formData.loadType || !formData.exerciseType) {
      alert('Пожалуйста, заполните все обязательные поля')
      return
    }

    try {
      const user = await blink.auth.me()
      
      const exerciseData = {
        ...formData,
        userId: user.id,
        lastWeight: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (editingExercise) {
        // Обновление существующего упражнения
        await blink.db.exercises.update(editingExercise.id, {
          ...exerciseData,
          updatedAt: new Date().toISOString()
        })
      } else {
        // Создание нового упражнения
        await blink.db.exercises.create(exerciseData)
      }

      // Перезагрузка списка упражнений
      await loadExercises()
      
      // Закрытие диалога и сброс формы
      setIsAddDialogOpen(false)
      resetForm()
      
    } catch (error) {
      console.error('Ошибка сохранения упражнения:', error)
      alert('Ошибка при сохранении упражнения')
    }
  }

  // Удаление упражнения
  const handleDelete = async (exerciseId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это упражнение?')) {
      return
    }

    try {
      await blink.db.exercises.delete(exerciseId)
      await loadExercises()
    } catch (error) {
      console.error('Ошибка удаления упражнения:', error)
      alert('Ошибка при удалении упражнения')
    }
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Заголовок и кнопка добавления */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Упражнения</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Добавить упражнение
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExercise ? 'Редактировать упражнение' : 'Добавить упражнение'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Название упражнения */}
              <div>
                <Label htmlFor="name">Название упражнения *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: Жим лежа"
                  required
                />
              </div>

              {/* Группа мышц */}
              <div>
                <Label htmlFor="muscleGroup">Группа мышц *</Label>
                <Select value={formData.muscleGroup} onValueChange={(value) => setFormData({ ...formData, muscleGroup: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите группу мышц" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Тип нагрузки */}
              <div>
                <Label htmlFor="loadType">Тип нагрузки *</Label>
                <Select value={formData.loadType} onValueChange={(value) => setFormData({ ...formData, loadType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип нагрузки" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAD_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Тип упражнения */}
              <div>
                <Label htmlFor="exerciseType">Тип упражнения *</Label>
                <Select value={formData.exerciseType} onValueChange={(value) => setFormData({ ...formData, exerciseType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип упражнения" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Подходы и повторения */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sets">Подходы</Label>
                  <Input
                    id="sets"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.sets}
                    onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 3 })}
                  />
                </div>
                <div>
                  <Label htmlFor="reps">Повторения</Label>
                  <Input
                    id="reps"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.reps}
                    onChange={(e) => setFormData({ ...formData, reps: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>

              {/* Техника выполнения */}
              <div>
                <Label htmlFor="technique">Техника выполнения</Label>
                <Textarea
                  id="technique"
                  value={formData.technique}
                  onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                  placeholder="Описание техники выполнения упражнения"
                  rows={3}
                />
              </div>

              {/* Видео */}
              <div>
                <Label htmlFor="videoUrl">Ссылка на видео</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              {/* Название тренажера */}
              <div>
                <Label htmlFor="equipmentName">Название тренажера</Label>
                <Input
                  id="equipmentName"
                  value={formData.equipmentName}
                  onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                  placeholder="Например: Скамья для жима"
                />
              </div>

              {/* Настройки тренажера */}
              <div>
                <Label htmlFor="equipmentSettings">Настройки тренажера</Label>
                <Input
                  id="equipmentSettings"
                  value={formData.equipmentSettings}
                  onChange={(e) => setFormData({ ...formData, equipmentSettings: e.target.value })}
                  placeholder="Например: Угол наклона 30°"
                />
              </div>

              {/* Комментарий */}
              <div>
                <Label htmlFor="comment">Комментарий</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Дополнительные заметки об упражнении"
                  rows={2}
                />
              </div>

              {/* Кнопки */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingExercise ? 'Сохранить изменения' : 'Добавить упражнение'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Поиск и фильтры */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Поиск упражнений..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Группа мышц" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все группы</SelectItem>
                {MUSCLE_GROUPS.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Select value={selectedLoadType} onValueChange={setSelectedLoadType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Тип нагрузки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {LOAD_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Список упражнений */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка упражнений...</p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {exercises.length === 0 ? 'Нет упражнений' : 'Упражнения не найдены'}
          </h3>
          <p className="text-gray-600 mb-4">
            {exercises.length === 0 
              ? 'Добавьте первое упражнение, чтобы начать тренировки'
              : 'Попробуйте изменить параметры поиска'
            }
          </p>
          {exercises.length === 0 && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Добавить упражнение
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                    {exercise.name}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(exercise)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exercise.id)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {exercise.muscleGroup}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {exercise.loadType}
                  </Badge>
                  <Badge className={`text-xs flex items-center gap-1 ${getExerciseTypeColor(exercise.exerciseType)}`}>
                    {getExerciseTypeIcon(exercise.exerciseType)}
                    {exercise.exerciseType}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Подходы:</span>
                    <span className="font-medium">{exercise.sets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Повторения:</span>
                    <span className="font-medium">{exercise.reps}</span>
                  </div>
                  {exercise.lastWeight > 0 && (
                    <div className="flex justify-between">
                      <span>Последний вес:</span>
                      <span className="font-medium text-primary">{exercise.lastWeight} кг</span>
                    </div>
                  )}
                  {exercise.equipmentName && (
                    <div className="flex justify-between">
                      <span>Тренажер:</span>
                      <span className="font-medium">{exercise.equipmentName}</span>
                    </div>
                  )}
                </div>
                
                {exercise.technique && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                    <strong>Техника:</strong> {exercise.technique}
                  </div>
                )}
                
                {exercise.comment && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    <strong>Комментарий:</strong> {exercise.comment}
                  </div>
                )}
                
                {exercise.videoUrl && (
                  <div className="mt-3">
                    <a
                      href={exercise.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      📹 Посмотреть видео
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}