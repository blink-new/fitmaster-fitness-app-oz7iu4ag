import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Calendar, Target, Clock } from 'lucide-react';
import { blink } from '@/blink/client';

interface HomePageProps {
  onPageChange?: (page: string) => void;
}

export function HomePage({ onPageChange }: HomePageProps = {}) {
  const [stats, setStats] = useState({
    totalExercises: 0,
    workoutsThisWeek: 0,
    totalWorkouts: 0,
    averageWorkoutTime: 0
  });

  const loadStats = async () => {
    try {
      const user = await blink.auth.me();
      
      // Загружаем статистику упражнений
      const exercises = await blink.db.exercises.list({
        where: { userId: user.id }
      });
      
      // Загружаем статистику тренировок
      const workouts = await blink.db.workouts.list({
        where: { userId: user.id }
      });

      setStats({
        totalExercises: exercises.length,
        workoutsThisWeek: workouts.filter(w => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(w.createdAt) > weekAgo;
        }).length,
        totalWorkouts: workouts.length,
        averageWorkoutTime: 45 // Заглушка
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Добро пожаловать в FitMaster! 💪
        </h2>
        <p className="text-gray-600">
          Готовы к новой тренировке?
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target size={16} />
              Упражнения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalExercises}
            </div>
            <p className="text-xs text-gray-500">в базе данных</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar size={16} />
              За неделю
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {stats.workoutsThisWeek}
            </div>
            <p className="text-xs text-gray-500">тренировок</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp size={16} />
              Всего
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalWorkouts}
            </div>
            <p className="text-xs text-gray-500">тренировок</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock size={16} />
              Среднее время
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.averageWorkoutTime}
            </div>
            <p className="text-xs text-gray-500">минут</p>
          </CardContent>
        </Card>
      </div>

      {/* Прогресс недели */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Прогресс недели</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Тренировки</span>
              <span>{stats.workoutsThisWeek}/4</span>
            </div>
            <Progress value={(stats.workoutsThisWeek / 4) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Быстрые действия */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Быстрые действия</h3>
        
        <Button 
          className="w-full h-12 text-base" 
          size="lg"
          onClick={() => onPageChange?.('generator')}
        >
          🏃‍♂️ Начать тренировку
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-12"
            onClick={() => onPageChange?.('exercises')}
          >
            ➕ Добавить упражнение
          </Button>
          <Button 
            variant="outline" 
            className="h-12"
            onClick={() => onPageChange?.('generator')}
          >
            ⚡ Генератор тренировок
          </Button>
        </div>
      </div>
    </div>
  );
}