import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { applyTheme as applyColorTheme } from '../utils/themeUtils';
import { useAuth } from './AuthContext';

export type Theme = 'light' | 'dark' | 'system';
export type ColorTheme = 'light-beige' | 'light-blue' | 'light-silver' | 'glass-blue';
export type DateFormat = 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
export type TimeFormat = '12h' | '24h';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sound: boolean;
}

interface UserPreferences {
  theme: Theme;
  colorTheme: ColorTheme;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  notifications: NotificationSettings;
  compactMode: boolean;
}

interface SettingsContextType {
  preferences: UserPreferences & { autoSave: boolean };
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  updateColorTheme: (theme: ColorTheme) => Promise<void>;
  validateColorTheme: (theme: string) => theme is ColorTheme;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  colorTheme: 'glass-blue',
  dateFormat: 'MM/dd/yyyy',
  timeFormat: '12h',
  notifications: {
    email: true,
    push: true,
    sound: false,
  },
  compactMode: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // Safely get auth context - it might not be available during initial render
  let user = null;
  let isAuthenticated = false;
  try {
    const authContext = useAuth();
    user = authContext.user;
    isAuthenticated = authContext.isAuthenticated;
  } catch {
    // AuthContext not available yet, use defaults
    console.debug('AuthContext not available yet, using defaults');
  }

  const validateColorTheme = (theme: string): theme is ColorTheme => {
    return theme === 'light-beige' || theme === 'light-blue' || theme === 'light-silver' || theme === 'glass-blue';
  };

  // Load preferences from user data or localStorage on mount and when user changes
  useEffect(() => {
    try {
      let loadedPreferences = { ...defaultPreferences };

      if (isAuthenticated && user?.themePreference) {
        // User is logged in and has a theme preference - use it as the source of truth
        if (validateColorTheme(user.themePreference)) {
          loadedPreferences.colorTheme = user.themePreference;
          console.log('Loaded theme from database:', user.themePreference);
        }
      } else {
        // No user or no theme preference - try localStorage as fallback
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
          const parsed = JSON.parse(savedPreferences);
          loadedPreferences = { ...defaultPreferences, ...parsed };
          //console.log('Loaded theme from localStorage (fallback):', loadedPreferences.colorTheme);
        }
      }

      setPreferences(loadedPreferences);
      // Apply the loaded color theme immediately
      //console.log('Applying theme:', loadedPreferences.colorTheme);
      applyColorTheme(loadedPreferences.colorTheme);
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      // Apply default theme on error
      applyColorTheme(defaultPreferences.colorTheme);
    }
  }, [user, isAuthenticated]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }, [preferences]);

  // Listen for localStorage changes from other windows/tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userPreferences' && e.newValue) {
        try {
          const newPreferences = JSON.parse(e.newValue);
          if (newPreferences.colorTheme && validateColorTheme(newPreferences.colorTheme)) {
            setPreferences(prev => ({ ...prev, colorTheme: newPreferences.colorTheme }));
            applyColorTheme(newPreferences.colorTheme);
          }
        } catch (error) {
          console.error('Failed to sync preferences from other window:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Light/dark/system theme logic removed - using only color themes now

  // Apply color theme
  useEffect(() => {
    const success = applyColorTheme(preferences.colorTheme);
    if (!success) {
      console.warn(`Failed to apply color theme: ${preferences.colorTheme}. Falling back to default.`);
    }
  }, [preferences.colorTheme]);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateColorTheme = async (theme: ColorTheme): Promise<void> => {
    if (!validateColorTheme(theme)) {
      console.warn(`Invalid color theme: ${theme}. Falling back to default.`);
      theme = 'light-beige';
    }

    console.log('Updating color theme to:', theme);

    // Apply theme immediately for instant feedback
    applyColorTheme(theme);

    // Update local state immediately
    updatePreference('colorTheme', theme);

    // Save to localStorage for immediate persistence
    try {
      const updatedPreferences = { ...preferences, colorTheme: theme };
      localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));
      console.log('Saved theme to localStorage:', theme);
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }

    // CRITICAL: Save to backend and wait for completion
    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          console.log('Saving theme to database...', theme);
          const response = await fetch('/api/users/me/theme', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ themePreference: theme }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to save theme preference to backend:', response.status, errorText);
            throw new Error(`Failed to save theme: ${response.status}`);
          } else {
            console.log('Successfully saved theme to database:', theme);

            // Force refresh the user object to ensure it has the latest theme
            // This ensures new windows will load the correct theme
            try {
              const verifyResponse = await fetch('/api/auth/verify', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (verifyResponse.ok) {
                const data = await verifyResponse.json();
                console.log('Refreshed user object with new theme:', data.user.themePreference);
              }
            } catch (refreshError) {
              console.warn('Failed to refresh user object:', refreshError);
            }
          }
        }
      } catch (error) {
        console.error('Error saving theme preference to database:', error);
        // Don't throw the error - let the UI update succeed even if backend fails
      }
    }
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
  };

  const exportSettings = (): string => {
    return JSON.stringify(preferences, null, 2);
  };

  const importSettings = (settingsJson: string): boolean => {
    try {
      const imported = JSON.parse(settingsJson);
      // Validate the imported settings structure
      const validatedSettings = { ...defaultPreferences, ...imported };

      // Validate color theme specifically
      if (imported.colorTheme && !validateColorTheme(imported.colorTheme)) {
        validatedSettings.colorTheme = defaultPreferences.colorTheme;
      }

      setPreferences(validatedSettings);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  };

  const value: SettingsContextType = {
    preferences: { ...preferences, autoSave: true },
    updatePreference,
    updateColorTheme,
    validateColorTheme,
    resetToDefaults,
    exportSettings,
    importSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};