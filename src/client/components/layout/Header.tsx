import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Search, Users, Calendar, Bell } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { SettingsDropdown } from '../SettingsDropdown';

import { cn } from '../../utils/cn';

interface HeaderProps {
  onLeftSidebarToggle: () => void;
  isLeftSidebarOpen: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onLeftSidebarToggle,
  isLeftSidebarOpen,
  className,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Mobile search state
  const [mobileSearchKeyword, setMobileSearchKeyword] = useState('');

  // Handle mobile search submission
  const handleMobileSearch = () => {
    if (mobileSearchKeyword.trim()) {
      navigate(`/search?q=${encodeURIComponent(mobileSearchKeyword.trim())}`);
      setMobileSearchKeyword(''); // Clear search after navigation
    }
  };

  // Handle Enter key press
  const handleMobileSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMobileSearch();
    }
  };

  return (
    <header className={cn(
      'bg-white border-b border-secondary-200 shadow-sm px-4 py-3 flex items-center relative z-50',
      className
    )}>
      {/* Left Section - Menu Toggle and Logo */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLeftSidebarToggle}
          className="lg:hidden"
          aria-label={isLeftSidebarOpen ? t('sidebar.closeNavigationMenu') : t('sidebar.openNavigationMenu')}
        >
          {isLeftSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Logo/Brand Area */}
        <button
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
          aria-label={t('header.goToHome')}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <h1 className="text-xl font-semibold text-secondary-900 hidden sm:block">
            {t('header.managerApp')}
          </h1>
        </button>
      </div>

      {/* Center Section - Mobile Search (fills available space) or Desktop Navigation */}
      <div className="flex-1 flex items-center justify-center ml-4 mr-0 lg:mx-4">
        {/* Mobile Search Input - Fills available space on mobile */}
        <div className="relative w-full max-w-none lg:hidden">
          <input
            type="text"
            value={mobileSearchKeyword}
            onChange={(e) => setMobileSearchKeyword(e.target.value)}
            onKeyDown={handleMobileSearchKeyDown}
            placeholder={t('header.mobileSearchPlaceholder')}
            className="w-full pl-4 pr-12 py-3 text-base border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
          />
          <button
            onClick={handleMobileSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-500 hover:text-primary-600 transition-colors p-1"
            aria-label={t('header.search')}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop Navigation - Only visible on desktop */}
        <nav className="hidden lg:flex items-center space-x-6">
          <button
            className={cn(
              "flex flex-row items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              location.pathname === '/staff'
                ? "text-primary-600 bg-primary-100"
                : "text-secondary-700 hover:text-primary-600 hover:bg-primary-100"
            )}
            onClick={() => navigate('/staff')}
          >
            <Users className="h-4 w-4" />
            <span>{t('navigation.staff')}</span>
          </button>
          <button
            className={cn(
              "flex flex-row items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              location.pathname === '/daily-record'
                ? "text-primary-600 bg-primary-100"
                : "text-secondary-700 hover:text-primary-600 hover:bg-primary-100"
            )}
            onClick={() => navigate('/daily-record')}
          >
            <Calendar className="h-4 w-4" />
            <span>{t('dailyRecord.title')}</span>
          </button>
          <button
            className={cn(
              "flex flex-row items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              location.pathname === '/inquiries-notifications'
                ? "text-primary-600 bg-primary-100"
                : "text-secondary-700 hover:text-primary-600 hover:bg-primary-100"
            )}
            onClick={() => navigate('/inquiries-notifications')}
          >
            <Bell className="h-4 w-4" />
            <span>{t('inquiriesNotifications.title')}</span>
          </button>
        </nav>
      </div>

      {/* Right Section - Desktop Search and Settings */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* Desktop Search Button - Only visible on desktop */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/search')}
          className="hidden lg:flex text-secondary-700 hover:text-primary-600"
          aria-label={t('header.search')}
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Settings Dropdown */}
        <SettingsDropdown />
      </div>
    </header>
  );
};
