import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../hooks/useLocalization';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRole?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  minRoleLevel?: number;
}

export function ProtectedRoute({
  children,
  requiredPermissions: _requiredPermissions = [],
  requiredRole,
  minRoleLevel
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const { t } = useLocalization();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user.role.name !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('common.access.deniedTitle')}</h1>
          <p className="text-gray-600">{t('common.access.noPermission')}</p>
        </div>
      </div>
    );
  }

  // Check minimum role level access
  if (minRoleLevel && user.role.level < minRoleLevel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('common.access.deniedTitle')}</h1>
          <p className="text-gray-600">{t('common.access.insufficientPrivileges')}</p>
        </div>
      </div>
    );
  }

  // Note: Permission-based access removed since we're using role levels now
  // The role.level provides hierarchical access control

  return <>{children}</>;
}
