import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, User, Globe, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

import { cn } from '../utils/cn';

interface SettingsDropdownProps {
  className?: string;
}

export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({ className }) => {
  const { t } = useLanguage();
  const { logout, user } = useAuth();
  const { preferences: _preferences } = useSettings();

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Settings Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDropdown}
        className={cn(
          'text-secondary-700 hover:text-primary-600',
          isOpen && 'bg-primary-50 text-primary-600'
        )}
        aria-label={t('menu.settings')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Settings className="h-5 w-5" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-secondary-200 rounded-lg shadow-lg z-50">
          {/* User Info Section */}
          {user && (
            <div className="px-4 py-3 border-b border-secondary-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {user.name || user.username}
                  </p>
                  <p className="text-xs text-secondary-600 truncate">
                    {user.role?.name || 'User'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="py-2">
            {/* Language Toggle */}
            <div className="px-2">
              <div className="flex items-center px-2 py-2 text-sm text-secondary-700">
                <Globe className="h-4 w-4 mr-3" />
                <span className="flex-1">{t('navigation.language')}</span>
              </div>
              <div className="ml-7">
                <LanguageToggle />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-secondary-200 my-2"></div>

            {/* User Management - Only show for admin users (level 3) */}
            {user && user.role?.level === 3 && (
              <>
                <button
                  className="w-full flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/user-management');
                  }}
                >
                  <Users className="h-4 w-4 mr-3" />
                  {t('userManagement.title')}
                </button>
                <button
                  className="w-full flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/mobile-user-management');
                  }}
                >
                  <Users className="h-4 w-4 mr-3" />
                  {t('mobileUserManagement.title')}
                </button>
              </>
            )}

            {/* System Settings */}
            <button
              className="w-full flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
              onClick={() => {
                setIsOpen(false);
                navigate('/settings');
              }}
            >
              <Settings className="h-4 w-4 mr-3" />
              {t('menu.systemSettings')}
            </button>

            {/* Divider */}
            <div className="border-t border-secondary-200 my-2"></div>

            {/* Logout */}
            <button
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              {t('auth.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};