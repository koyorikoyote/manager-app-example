import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { SSRDataProvider } from './contexts/SSRDataContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { ToastProvider } from './contexts/ToastContext';
import { HighPriorityComplaintsProvider } from './contexts/HighPriorityComplaintsContext';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout';
import { ErrorToast } from './components/ErrorDisplay';

import { ComplaintDetails, ComplaintForm, DailyRecord, InquiriesNotifications, InquiryForm, SearchResults, StaffList, PropertyList, DocumentDetail, DocumentList, DestinationList, InteractionRecords, Settings, AttendanceDashboard, Summary, Manual, UserManagement, MobileUserManagement } from './components/pages';
import { StaffDetailPage } from './components/pages/StaffDetailPage';
import { StaffNewPage } from './components/pages/StaffNewPage';
import { DestinationDetailPage } from './components/pages/DestinationDetailPage';
import { DestinationNewPage } from './components/pages/DestinationNewPage';
import { PropertyDetailPage } from './components/pages/PropertyDetailPage';
import { PropertyNewPage } from './components/pages/PropertyNewPage';

interface AppProps {
  initialData?: {
    routeType: string;
    stats: {
      users: number;
      staff: number;
      properties: number;
    };
    timestamp: string;
    error?: string;
    // Route-specific data
    properties?: any[];
    total?: number;
    property?: any;
    staff?: any[];
    contracts?: any[];
    contract?: any;
    recentActivities?: {
      recentStaff: any[];
      recentProperties: unknown[];
    };
    systemConfigurations?: unknown[];
  };
}

function App({ initialData }: AppProps) {
  // Store initial data for client-side hydration without DOM typings
  if (typeof (globalThis as any).window !== 'undefined' && initialData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window.__INITIAL_DATA__ = initialData;
  }

  return (
    <ErrorProvider>
      <SSRDataProvider initialData={initialData}>
        <LanguageProvider>
          <AuthProvider>
            <SettingsProvider>
              <HighPriorityComplaintsProvider>
                <ToastProvider>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ComplaintDetails />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/complaint-details"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ComplaintDetails />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    {/* Dashboard redirect for backward compatibility */}
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    <Route
                      path="/complaints/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ComplaintForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/complaints/:id/edit"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ComplaintForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/daily-record"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <DailyRecord />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />



                    <Route
                      path="/inquiries-notifications"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <InquiriesNotifications />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/inquiries-notifications/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <InquiryForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/inquiries-notifications/:id/edit"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <InquiryForm />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/search"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <SearchResults />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/staff"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <StaffList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/staff/new"
                      element={
                        <ProtectedRoute>
                          <StaffNewPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/staff/:id"
                      element={
                        <ProtectedRoute>
                          <StaffDetailPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/staff/:id/edit"
                      element={
                        <ProtectedRoute>
                          <StaffDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/residences"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <PropertyList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/residences/:id"
                      element={
                        <ProtectedRoute>
                          <PropertyDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/residences/new"
                      element={
                        <ProtectedRoute>
                          <PropertyNewPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/residences/:id/edit"
                      element={
                        <ProtectedRoute>
                          <PropertyDetailPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/destinations"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <DestinationList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/destinations/:id"
                      element={
                        <ProtectedRoute>
                          <DestinationDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/destinations/new"
                      element={
                        <ProtectedRoute>
                          <DestinationNewPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/destinations/:id/edit"
                      element={
                        <ProtectedRoute>
                          <DestinationDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/residence/new"
                      element={
                        <ProtectedRoute>
                          <PropertyNewPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/residence/:id/edit"
                      element={
                        <ProtectedRoute>
                          <PropertyDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    {/* Legacy routes for backward compatibility */}
                    <Route
                      path="/properties"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <PropertyList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/contracts"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <DocumentList />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/contract/:id"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <DocumentDetail />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/interactions"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <InteractionRecords />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Settings />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/user-management"
                      element={
                        <ProtectedRoute minRoleLevel={3}>
                          <Layout>
                            <UserManagement />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/mobile-user-management"
                      element={
                        <ProtectedRoute minRoleLevel={3}>
                          <Layout>
                            <MobileUserManagement />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/attendance"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <AttendanceDashboard />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/summary"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Summary />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/manual"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Manual />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                  <ErrorToast />
                </ToastProvider>
              </HighPriorityComplaintsProvider>
            </SettingsProvider>
          </AuthProvider>
        </LanguageProvider>
      </SSRDataProvider>
    </ErrorProvider>
  );
}

export default App;
