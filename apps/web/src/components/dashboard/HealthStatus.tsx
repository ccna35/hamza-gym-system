import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { getHealth } from '../../api/client';
import { Button } from '../ui/Button';

export function HealthStatus() {
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth });

  if (health.isPending) return <p className="mt-6 text-[#59665d]">جارٍ الاتصال بالخادم...</p>;
  if (health.isError)
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3 text-[#9b3d2e]">
        <p>تعذر الاتصال بالخادم.</p>
        <Button onClick={() => health.refetch()} variant="outline">
          <RefreshCw aria-hidden="true" size={17} /> إعادة المحاولة
        </Button>
      </div>
    );

  return (
    <p className="mt-6 text-[#3d6d4d]">
      الخادم متاح. حالة قاعدة البيانات: {health.data.database === 'ok' ? 'متاحة' : 'غير متاحة'}
    </p>
  );
}
