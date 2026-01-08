import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Calendar, Bell } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';

interface MobileBottomNavProps {
  className?: string;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  className,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      icon: <Users className="h-5 w-5" />,
      label: t('navigation.staff'),
      path: '/staff',
      isActive: location.pathname.startsWith('/staff'),
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: t('dailyRecord.title'),
      path: '/daily-record',
      isActive: location.pathname.startsWith('/daily-record'),
    },
    {
      icon: <Bell className="h-5 w-5" />,
      label: t('inquiriesNotifications.title'),
      path: '/inquiries-notifications',
      isActive: location.pathname.startsWith('/inquiries-notifications'),
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-mobile-bottom-nav',
      'bg-white border-t border-secondary-200 shadow-lg',
      'safe-area-bottom',
      'lg:hidden', // Hide on desktop
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(item.path)}
            className={cn(
              'flex flex-col items-center justify-center space-y-1 px-3 py-2 min-h-[60px] flex-1',
              'touch-manipulation transition-all duration-200',
              item.isActive
                ? 'text-primary-600 bg-primary-50'
                : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50'
            )}
          >
            <div className={cn(
              'transition-transform duration-200',
              item.isActive ? 'scale-110' : 'scale-100'
            )}>
              {item.icon}
            </div>
            <span className="text-xs font-medium leading-none">
              {item.label}
            </span>
          </Button>
        ))}
      </div>
    </nav>
  );
};