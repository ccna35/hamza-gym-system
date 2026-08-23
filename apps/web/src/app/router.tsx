import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthGate } from '../components/auth/AuthGate';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { ProtectedLayout } from '../components/layout/ProtectedLayout';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { MemberProfilePage } from '../pages/MemberProfilePage';
import { MembersPage } from '../pages/MembersPage';
import { PlansPage } from '../pages/PlansPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<AuthGate />}>
          <Route element={<ProtectedLayout />}>
            <Route element={<DashboardPage />} path="/" />
            <Route element={<MembersPage />} path="/members" />
            <Route element={<MemberProfilePage />} path="/members/:memberId" />
            <Route element={<AuditLogsPage />} path="/audit-logs" />
            <Route element={<PlansPage />} path="/plans" />
          </Route>
        </Route>
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}
