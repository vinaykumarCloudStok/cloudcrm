import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import AppShell from './components/layout/AppShell';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './utils/ProtectedRoute';
import { useAuthStore } from './store/authStore';

const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const AccountListPage = React.lazy(() => import('./pages/accounts/AccountListPage'));
const AccountDetailPage = React.lazy(() => import('./pages/accounts/AccountDetailPage'));
const ContactListPage = React.lazy(() => import('./pages/contacts/ContactListPage'));
const ContactDetailPage = React.lazy(() => import('./pages/contacts/ContactDetailPage'));
const LeadListPage = React.lazy(() => import('./pages/leads/LeadListPage'));
const LeadDetailPage = React.lazy(() => import('./pages/leads/LeadDetailPage'));
const OpportunityListPage = React.lazy(() => import('./pages/opportunities/OpportunityListPage'));
const PipelineKanbanPage = React.lazy(() => import('./pages/opportunities/PipelineKanbanPage'));
const ForecastPage = React.lazy(() => import('./pages/opportunities/ForecastPage'));
const OpportunityDetailPage = React.lazy(() => import('./pages/opportunities/OpportunityDetailPage'));
const CampaignListPage = React.lazy(() => import('./pages/campaigns/CampaignListPage'));
const CampaignDetailPage = React.lazy(() => import('./pages/campaigns/CampaignDetailPage'));
const TaskListPage = React.lazy(() => import('./pages/tasks/TaskListPage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));
const SAValidationPage = React.lazy(() => import('./pages/opportunities/SAValidationPage'));

export default function App() {
  const loadUser = useAuthStore((s) => s.loadUser);
const token = useAuthStore((s) => s.token);

useEffect(() => {
  if (token) {
    loadUser();
  }
}, [token]);
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
   <Routes>
  <Route path="/login" element={<LoginPage />} />

  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<AppShell />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />

      <Route path="accounts" element={<AccountListPage />} />
      <Route path="accounts/:id" element={<AccountDetailPage />} />

      <Route path="contacts" element={<ContactListPage />} />
      <Route path="contacts/:id" element={<ContactDetailPage />} />

      <Route path="leads" element={<LeadListPage />} />
      <Route path="leads/:id" element={<LeadDetailPage />} />

      <Route path="opportunities" element={<OpportunityListPage />} />
      <Route path="opportunities/pipeline" element={<PipelineKanbanPage />} />
      <Route path="opportunities/forecast" element={<ForecastPage />} />
      <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
      <Route path="opportunities/:id/validation" element={<SAValidationPage />} />

      <Route path="campaigns" element={<CampaignListPage />} />
      <Route path="campaigns/:id" element={<CampaignDetailPage />} />

      <Route path="tasks" element={<TaskListPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
  </Route>
</Routes>
    </Suspense>
  );
}
