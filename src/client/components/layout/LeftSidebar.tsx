import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Search,
  X,
  BarChart3,
  Calendar,
  BookOpen,
  MapPin,
  MessageSquare,
  Building
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlassBlue } from '../../hooks/useGlassBlue';
import { cn } from '../../utils/cn';

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  subItems?: MenuItemProps[];
  isExpanded?: boolean;
  onToggle?: () => void;
}



const MenuItem: React.FC<MenuItemProps & { isActive?: boolean }> = ({
  icon,
  label,
  onClick,
  subItems,
  isExpanded = false,
  onToggle,
  isActive = false
}) => {
  const hasChildren = subItems && subItems.length > 0;

  return (
    <div className="w-full">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-left px-3 py-2 h-auto min-h-[44px]",
          isActive
            ? "text-primary-600 bg-primary-100"
            : "text-secondary-700 hover:text-primary-600 hover:bg-primary-50"
        )}
        onClick={hasChildren ? onToggle : onClick}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          {hasChildren && (
            isExpanded ?
              <ChevronDown className="h-4 w-4" /> :
              <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </Button>

      {hasChildren && isExpanded && (
        <div className="ml-6 mt-1 space-y-1 border-l border-secondary-200 pl-4">
          {subItems.map((child, index) => (
            <MenuItem
              key={index}
              icon={child.icon}
              label={child.label}
              onClick={child.onClick}
              subItems={child.subItems}
              isExpanded={child.isExpanded}
              onToggle={child.onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  onClose,
  className,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isGlassBlue = useGlassBlue();
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchKeyword.trim())}`);
      onClose(); // Close sidebar on mobile after search
    }
  };

  // Primary navigation items - all navigation items in one group
  const primaryMenuItems: MenuItemProps[] = [
    {
      icon: <MapPin className="h-5 w-5" />,
      label: t('navigation.destinations'),
      onClick: () => {
        navigate('/destinations');
        onClose(); // Close sidebar on mobile after navigation
      }
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: t('navigation.interactions'),
      onClick: () => {
        navigate('/interactions');
        onClose(); // Close sidebar on mobile after navigation
      }
    },
    {
      icon: <Building className="h-5 w-5" />,
      label: t('navigation.residences'),
      onClick: () => {
        navigate('/residences');
        onClose(); // Close sidebar on mobile after navigation
      }
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: t('menu.attendance'),
      onClick: () => {
        navigate('/attendance');
        onClose(); // Close sidebar on mobile after navigation
      }
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: t('menu.manual'),
      onClick: () => {
        navigate('/manual');
        onClose(); // Close sidebar on mobile after navigation
      }
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: t('menu.summary'),
      onClick: () => {
        navigate('/summary');
        onClose(); // Close sidebar on mobile after navigation
      }
    }
  ];

  const menuItems: MenuItemProps[] = [];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-secondary-200 shadow-lg z-50 transition-transform duration-300 ease-in-out",
        "w-80 pt-16", // pt-16 to account for header height
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0 lg:pt-0 lg:z-auto",
        className
      )}>
        {/* Mobile Close Button */}
        <div className="lg:hidden absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={t('sidebar.closeSidebar')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col h-full">
          {/* Search Section - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block p-4 border-b border-secondary-200">
            <div className="space-y-3">
              <Input
                placeholder={t('search.keyword')}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                startIcon={<Search className="h-4 w-4" />}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                className={`w-full ${isGlassBlue ? 'glass-blue-search-button' : ''}`}
                size="sm"
              >
                {t('search.searchResults')}
              </Button>
            </div>
          </div>

          {/* Primary Navigation Section */}
          <div className="p-4 border-b border-secondary-200">
            <nav className="space-y-2">
              {primaryMenuItems.map((item, index) => {
                // Determine if this menu item is active based on current path
                let isActive = false;
                if (item.label === t('navigation.destinations')) {
                  isActive = location.pathname === '/destinations' || location.pathname.startsWith('/destinations/');
                } else if (item.label === t('navigation.interactions')) {
                  isActive = location.pathname === '/interactions' || location.pathname.startsWith('/interaction');
                } else if (item.label === t('navigation.residences')) {
                  isActive = location.pathname === '/residences' || location.pathname.startsWith('/residence');
                } else if (item.label === t('menu.attendance')) {
                  isActive = location.pathname === '/attendance' || location.pathname.startsWith('/attendance');
                } else if (item.label === t('menu.manual')) {
                  isActive = location.pathname === '/manual' || location.pathname.startsWith('/manual');
                } else if (item.label === t('menu.summary')) {
                  isActive = location.pathname === '/summary' || location.pathname.startsWith('/summary');
                }

                return (
                  <MenuItem
                    key={index}
                    icon={item.icon}
                    label={item.label}
                    onClick={item.onClick}
                    subItems={item.subItems}
                    isExpanded={item.isExpanded}
                    onToggle={item.onToggle}
                    isActive={isActive}
                  />
                );
              })}
            </nav>
          </div>



          {/* Legacy Navigation Menu (if any additional items) */}
          {menuItems.length > 0 && (
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {menuItems.map((item, index) => (
                  <MenuItem
                    key={index}
                    icon={item.icon}
                    label={item.label}
                    onClick={item.onClick}
                    subItems={item.subItems}
                    isExpanded={item.isExpanded}
                    onToggle={item.onToggle}
                  />
                ))}
              </div>
            </nav>
          )}
        </div>
      </aside>
    </>
  );
};