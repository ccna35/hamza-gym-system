import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentOwner } from '../../api/client';

export function AuthGate() {
  const owner = useQuery({ queryKey: ['owner'], queryFn: getCurrentOwner, retry: false });

  if (owner.isPending)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f0e8] p-6">
        جارٍ التحقق من الجلسة...
      </main>
    );
  if (owner.isError || !owner.data) return <Navigate replace to="/login" />;

  return <Outlet context={owner.data.owner} />;
}
