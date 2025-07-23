import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { HomePage } from '@/pages/HomePage';
import ExercisesPage from '@/pages/ExercisesPage';
import WorkoutGeneratorPage from '@/pages/WorkoutGeneratorPage';
import ActiveWorkoutPage from '@/pages/ActiveWorkoutPage';
import { blink } from '@/blink/client';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      setLoading(state.isLoading);
    });
    return unsubscribe;
  }, []);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'home': return 'FitMaster';
      case 'exercises': return 'Упражнения';
      case 'generator': return 'Генератор тренировок';
      case 'workout': return 'Активная тренировка';
      case 'profile': return 'Профиль';
      default: return 'FitMaster';
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onPageChange={setCurrentPage} />;
      case 'exercises': return <ExercisesPage />;
      case 'generator': return <WorkoutGeneratorPage />;
      case 'workout': return <ActiveWorkoutPage />;
      case 'profile': return <div className="text-center py-20 text-gray-500">Профиль в разработке</div>;
      default: return <HomePage onPageChange={setCurrentPage} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка FitMaster...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">💪</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">FitMaster</h1>
          <p className="text-gray-600 mb-8">
            Современное фитнес-приложение для управления тренировками и упражнениями
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Войти в приложение
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title={getPageTitle()} />
      
      <main className="pt-16 pb-20 px-4">
        <div className="max-w-md mx-auto">
          {renderCurrentPage()}
        </div>
      </main>
      
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />
    </div>
  );
}

export default App;