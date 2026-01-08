import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './ui/Button';
import { useSettings, Theme } from '../contexts/SettingsContext';
import { cn } from '../utils/cn';

interface ThemeToggleProps {
  className?: string;
  variant?: 'dropdown' | 'buttons' | 'compact';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className, 
  variant = 'buttons' 
}) => {
  const { preferences, updatePreference } = useSettings();

  const handleThemeChange = (theme: Theme) => {
    updatePreference('theme', theme);
  };

  const getThemeIcon = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  if (variant === 'compact') {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(preferences.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleThemeChange(nextTheme)}
        className={cn('text-secondary-700 hover:text-primary-600', className)}
        aria-label={`Switch to ${getThemeLabel(nextTheme)} theme`}
      >
        {getThemeIcon(preferences.theme)}
      </Button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={cn('space-y-1', className)}>
        {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
          <button
            key={theme}
            onClick={() => handleThemeChange(theme)}
            className={cn(
              'w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors',
              preferences.theme === theme
                ? 'bg-primary-100 text-primary-900'
                : 'text-secondary-700 hover:bg-secondary-50'
            )}
          >
            <span className="mr-3">{getThemeIcon(theme)}</span>
            <span>{getThemeLabel(theme)}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default buttons variant
  return (
    <div className={cn('flex space-x-2', className)}>
      {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
        <Button
          key={theme}
          variant={preferences.theme === theme ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleThemeChange(theme)}
          className="flex items-center space-x-2"
        >
          {getThemeIcon(theme)}
          <span>{getThemeLabel(theme)}</span>
        </Button>
      ))}
    </div>
  );
};