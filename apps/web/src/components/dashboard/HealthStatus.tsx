import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { getHealth } from '../../api/client';

export function HealthStatus() {
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth });

  if (health.isPending) return <p className="mt-6 text-[#59665d]">جارٍ الاتصال بالخادم...</p>;
  if (health.isError)
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3 text-[#9b3d2e]">
        <p>تعذر الاتصال بالخادم.</p>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#c98b7d] px-3 py-2"
          onClick={() => health.refetch()}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={17} /> إعادة المحاولة
        </button>
      </div>
    );

  return (
    <p className="mt-6 text-[#3d6d4d]">
      الخادم متاح. حالة قاعدة البيانات: {health.data.database === 'ok' ? 'متاحة' : 'غير متاحة'}
    </p>
  );
}
