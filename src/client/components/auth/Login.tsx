import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { LanguageToggleCompact } from '../LanguageToggle';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const { t } = useLanguage();

  // Remove /login from URL
  useEffect(() => {
    if (window.location.pathname === '/login') {
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  // Clear error when component mounts or inputs change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [username, password, clearError]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      // Set flag to indicate successful login for navigation tracking
      sessionStorage.setItem('justLoggedIn', 'true');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = username.trim().length > 0 && password.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageToggleCompact />
        </div>
        <Card className="p-8">
          <div className="text-center mb-8">
            <Text variant="h1" className="text-2xl font-bold text-gray-900 mb-2">
              {t('header.managerApp')}
            </Text>
            <Text variant="body" className="text-gray-600">
              {t('auth.login')}
            </Text>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.id')}
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.id')}
                required
                autoComplete="username"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.password')}
                required
                autoComplete="current-password"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <Text variant="body" className="text-red-700 text-sm">
                  {error}
                </Text>
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common.status.loading')}
                </div>
              ) : (
                t('auth.login')
              )}
            </Button>
          </form>


        </Card>
      </div>
    </div>
  );
}