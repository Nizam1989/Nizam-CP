import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ManufacturingDashboard } from './components/Manufacturing/ManufacturingDashboard';
import { NewJobForm } from './components/Jobs/NewJobForm';
import { ManufacturingSteps } from './components/Jobs/ManufacturingSteps';
import { JobSearch } from './components/Jobs/JobSearch';
import { JobHistory } from './components/Jobs/JobHistory';
import { DossierAutomationPage } from './components/Dossier/DossierAutomationPage';
import { SettingsPage } from './components/Settings/SettingsPage';
import { QualityNotificationPage } from './components/QualityNotification/QualityNotificationPage';
import { AnalyticsPage } from './components/Analytics/AnalyticsPage';
import { UserManagementPage } from './components/UserManagement/UserManagementPage';
import { ErrorBoundary } from './components/ErrorBoundary';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <ManufacturingDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/jobs/new" element={
        <ProtectedRoute>
          <NewJobForm />
        </ProtectedRoute>
      } />
      <Route path="/jobs/search" element={
        <ProtectedRoute>
          <JobSearch />
        </ProtectedRoute>
      } />
      <Route path="/jobs/history" element={
        <ProtectedRoute>
          <JobHistory />
        </ProtectedRoute>
      } />
      <Route path="/dossier" element={
        <ProtectedRoute>
          <DossierAutomationPage />
        </ProtectedRoute>
      } />
      <Route path="/quality-notification" element={
        <ProtectedRoute>
          <QualityNotificationPage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />
     <Route path="/analytics" element={
       <ProtectedRoute>
         <AnalyticsPage />
       </ProtectedRoute>
     } />
     <Route path="/users" element={
       <ProtectedRoute>
         <ErrorBoundary>
           <UserManagementPage />
         </ErrorBoundary>
       </ProtectedRoute>
     } />
      <Route path="/jobs/:id" element={
        <ProtectedRoute>
          <ManufacturingSteps />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;