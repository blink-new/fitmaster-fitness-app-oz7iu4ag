import { useState } from 'react';
import { Home, Dumbbell, Zap, Play, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'exercises', label: 'Упражнения', icon: Dumbbell },
  { id: 'generator', label: 'Генератор', icon: Zap },
  { id: 'workout', label: 'Тренировка', icon: Play },
  { id: 'profile', label: 'Профиль', icon: User },
];

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}