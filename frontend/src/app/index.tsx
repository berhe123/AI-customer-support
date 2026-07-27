import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { SocketProvider } from './providers/SocketProvider';
import { ProtectedRoute } from './providers/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from '@/pages/login/ui/LoginPage';
import { OverviewPage } from '@/pages/overview/ui/OverviewPage';
import { TicketsPage } from '@/pages/tickets/ui/TicketsPage';
import { TicketDetailPage } from '@/pages/ticket-detail/ui/TicketDetailPage';
import { CustomersPage } from '@/pages/customers/ui/CustomersPage';
import { CustomerDetailPage } from '@/pages/customer-detail/ui/CustomerDetailPage';
import { AnalyticsPage } from '@/pages/analytics/ui/AnalyticsPage';
import { SettingsPage } from '@/pages/settings/ui/SettingsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <AppProviders>
      <SocketProvider>
        <AppRouter />
      </SocketProvider>
    </AppProviders>
  );
}
