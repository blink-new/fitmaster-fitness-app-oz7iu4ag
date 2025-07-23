import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

export function Header({ title, showMenu = false, onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 z-40">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-3">
          {showMenu && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="p-2"
            >
              <Menu size={20} />
            </Button>
          )}
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>
        
        <Button variant="ghost" size="sm" className="p-2">
          <Bell size={20} />
        </Button>
      </div>
    </header>
  );
}