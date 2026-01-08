import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Palette,
  Globe,
  RotateCcw,
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings, ColorTheme } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

export const Settings: React.FC = () => {
  const { t, lang, setLang } = useLanguage();
  const { preferences, updatePreference, updateColorTheme, resetToDefaults } = useSettings();
  const { user } = useAuth();
  const _navigate = useNavigate();
  const [showThemeChangeSuccess, setShowThemeChangeSuccess] = useState(false);

  const handleNotificationChange = (key: keyof typeof preferences.notifications, value: boolean) => {
    updatePreference('notifications', {
      ...preferences.notifications,
      [key]: value,
    });
  };

  const handleColorThemeChange = async (theme: ColorTheme) => {
    try {
      await updateColorTheme(theme);
      setShowThemeChangeSuccess(true);
      setTimeout(() => setShowThemeChangeSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update color theme:', error);
    }
  };



  const handleResetToDefaults = () => {
    if (confirm(t('settings.resetConfirm'))) {
      resetToDefaults();
    }
  };



  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <SettingsIcon className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <Text variant="h1" className="text-2xl font-bold text-secondary-900">
            {t('settings.title')}
          </Text>
          <Text variant="body" className="text-secondary-600">
            {t('settings.subtitle')}
          </Text>
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <Card className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <User className="h-5 w-5 text-primary-600" />
            <Text variant="h3" className="text-lg font-semibold">
              {t('settings.profileInformation')}
            </Text>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text variant="body" className="text-secondary-600 mb-1">
                {t('settings.username')}
              </Text>
              <Text variant="body" className="font-medium">
                {user.username}
              </Text>
            </div>
            <div>
              <Text variant="body" className="text-secondary-600 mb-1">
                {t('settings.name')}
              </Text>
              <Text variant="body" className="font-medium">
                {user.name || t('settings.notSet')}
              </Text>
            </div>
            <div>
              <Text variant="body" className="text-secondary-600 mb-1">
                {t('settings.role')}
              </Text>
              <Text variant="body" className="font-medium capitalize">
                {user.role.name}
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* Language Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Globe className="h-5 w-5 text-primary-600" />
          <Text variant="h3" className="text-lg font-semibold">
            {t('settings.languageLocalization')}
          </Text>
        </div>
        <div className="space-y-4">
          <div>
            <Text variant="body" className="text-secondary-600 mb-2">
              {t('settings.interfaceLanguage')}
            </Text>
            <div className="flex space-x-2">
              <Button
                variant={lang === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => lang !== 'en' && setLang('en')}
              >
                {t('settings.english')}
              </Button>
              <Button
                variant={lang === 'ja' ? 'default' : 'outline'}
                size="sm"
                onClick={() => lang !== 'ja' && setLang('ja')}
              >
                {t('settings.japanese')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Palette className="h-5 w-5 text-primary-600" />
          <Text variant="h3" className="text-lg font-semibold">
            {t('settings.appearance')}
          </Text>
        </div>
        <div className="space-y-6">
          <div>
            <Text variant="body" className="text-secondary-600 mb-2">
              {t('settings.colorTheme')}
            </Text>

            {/* Theme Selection Cards */}
            <div className="space-y-3">
              <div className={`border rounded-lg p-4 cursor-pointer transition-all ${preferences.colorTheme === 'light-beige'
                ? 'border-primary-500 bg-primary-50'
                : 'border-secondary-200 hover:border-secondary-300'
                }`} onClick={() => handleColorThemeChange('light-beige')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="colorTheme-light-beige"
                      name="colorTheme"
                      value="light-beige"
                      checked={preferences.colorTheme === 'light-beige'}
                      onChange={() => handleColorThemeChange('light-beige')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <Text variant="body" className="font-medium text-secondary-900">
                        {t('settings.lightBeigeTheme')}
                      </Text>
                      <Text variant="body" className="text-sm text-secondary-600">
                        {t('settings.lightBeigeDescription')}
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-4 h-4 rounded-full bg-teal-500 border border-secondary-200"></div>
                      <div className="w-4 h-4 rounded-full bg-orange-500 border border-secondary-200"></div>
                      <div className="w-4 h-4 rounded-full bg-cyan-500 border border-secondary-200"></div>
                    </div>
                    {preferences.colorTheme === 'light-beige' && (
                      <div className="flex items-center space-x-1 text-primary-600">
                        <Check className="h-4 w-4" />
                        <Text variant="body" className="text-sm font-medium">
                          Active
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`border rounded-lg p-4 cursor-pointer transition-all ${preferences.colorTheme === 'light-blue'
                ? 'border-primary-500 bg-primary-50'
                : 'border-secondary-200 hover:border-secondary-300'
                }`} onClick={() => handleColorThemeChange('light-blue')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="colorTheme-light-blue"
                      name="colorTheme"
                      value="light-blue"
                      checked={preferences.colorTheme === 'light-blue'}
                      onChange={() => handleColorThemeChange('light-blue')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <Text variant="body" className="font-medium text-secondary-900">
                        {t('settings.lightBlueTheme')}
                      </Text>
                      <Text variant="body" className="text-sm text-secondary-600">
                        {t('settings.lightBlueDescription')}
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-4 h-4 rounded-full bg-blue-500 border border-secondary-200"></div>
                      <div className="w-4 h-4 rounded-full bg-sky-400 border border-secondary-200"></div>
                      <div className="w-4 h-4 rounded-full bg-teal-400 border border-secondary-200"></div>
                    </div>
                    {preferences.colorTheme === 'light-blue' && (
                      <div className="flex items-center space-x-1 text-primary-600">
                        <Check className="h-4 w-4" />
                        <Text variant="body" className="text-sm font-medium">
                          Active
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`border rounded-lg p-4 cursor-pointer transition-all ${preferences.colorTheme === 'light-silver'
                ? 'border-primary-500 bg-primary-50'
                : 'border-secondary-200 hover:border-secondary-300'
                }`} onClick={() => handleColorThemeChange('light-silver')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="colorTheme-light-silver"
                      name="colorTheme"
                      value="light-silver"
                      checked={preferences.colorTheme === 'light-silver'}
                      onChange={() => handleColorThemeChange('light-silver')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <Text variant="body" className="font-medium text-secondary-900">
                        {t('settings.notionStyleTheme')}
                      </Text>
                      <Text variant="body" className="text-sm text-secondary-600">
                        {t('settings.notionStyleDescription')}
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-4 h-4 rounded-full bg-slate-500 border border-secondary-200"></div>
                      <div className="w-4 h-4 rounded-full bg-blue-300 border border-secondary-200"></div>
                      <div className="w-4 h-4 rounded-full bg-slate-300 border border-secondary-200"></div>
                    </div>
                    {preferences.colorTheme === 'light-silver' && (
                      <div className="flex items-center space-x-1 text-primary-600">
                        <Check className="h-4 w-4" />
                        <Text variant="body" className="text-sm font-medium">
                          Active
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`border rounded-lg p-4 cursor-pointer transition-all ${preferences.colorTheme === 'glass-blue'
                ? 'border-primary-500 bg-primary-50'
                : 'border-secondary-200 hover:border-secondary-300'
                }`} onClick={() => handleColorThemeChange('glass-blue')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="colorTheme-glass-blue"
                      name="colorTheme"
                      value="glass-blue"
                      checked={preferences.colorTheme === 'glass-blue'}
                      onChange={() => handleColorThemeChange('glass-blue')}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <Text variant="body" className="font-medium text-secondary-900">
                        {t('settings.glassBlueTheme')}
                      </Text>
                      <Text variant="body" className="text-sm text-secondary-600">
                        {t('settings.glassBlueDescription')}
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-4 h-4 rounded-full bg-blue-500 border border-secondary-200"></div>
                      <div className="w-4 h-4 rounded-full bg-sky-400 border border-secondary-200"></div>
                      <div className="w-4 h-4 rounded-full bg-slate-400 border border-secondary-200"></div>
                    </div>
                    {preferences.colorTheme === 'glass-blue' && (
                      <div className="flex items-center space-x-1 text-primary-600">
                        <Check className="h-4 w-4" />
                        <Text variant="body" className="text-sm font-medium">
                          Active
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {showThemeChangeSuccess && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Text variant="body" className="text-green-800 text-sm">
                  {t('settings.themeChanged')}
                </Text>
              </div>
            )}
          </div>


        </div>
      </Card>



      {/* Notification Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Bell className="h-5 w-5 text-primary-600" />
          <Text variant="h3" className="text-lg font-semibold">
            {t('settings.notifications')}
          </Text>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={preferences.notifications.email}
              onChange={(e) => handleNotificationChange('email', e.target.checked)}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="emailNotifications" className="text-sm text-secondary-700">
              {t('settings.emailNotifications')}
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="pushNotifications"
              checked={preferences.notifications.push}
              onChange={(e) => handleNotificationChange('push', e.target.checked)}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="pushNotifications" className="text-sm text-secondary-700">
              {t('settings.pushNotifications')}
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="soundNotifications"
              checked={preferences.notifications.sound}
              onChange={(e) => handleNotificationChange('sound', e.target.checked)}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="soundNotifications" className="text-sm text-secondary-700">
              {t('settings.soundNotifications')}
            </label>
          </div>
        </div>
      </Card>


      {/* Reset Settings */}
      <Card className="p-6 border-red-200">
        <div className="flex items-center space-x-4 mb-4">
          <RotateCcw className="h-5 w-5 text-red-600" />
          <Text variant="h3" className="text-lg font-semibold text-red-900">
            {t('settings.resetSettings')}
          </Text>
        </div>
        <div className="space-y-4">
          <Text variant="body" className="text-secondary-600">
            {t('settings.resetDescription')}
          </Text>
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            className="text-red-600 border-red-300 hover:bg-red-50 flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t('settings.resetToDefaults')}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
