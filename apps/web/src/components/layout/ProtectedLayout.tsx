import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { logout, Owner } from '../../api/client';
import { AppShell } from './AppShell';

export function ProtectedLayout() {
  const owner = useOutletContext<Owner>();
  const client = useQueryClient();
  const navigate = useNavigate();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      client.removeQueries({ queryKey: ['owner'] });
      navigate('/login');
    },
  });
  return (
    <AppShell isLoggingOut={logoutMutation.isPending} onLogout={() => logoutMutation.mutate()}>
      <Outlet context={owner} />
    </AppShell>
  );
}
