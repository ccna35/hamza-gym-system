import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

export function LoadingState({ label = 'جارٍ تحميل البيانات...' }: { label?: string }) {
  return (
    <Card className="grid min-h-48 place-items-center p-6 text-[#59665d]">
      <div className="flex items-center gap-3">
        <LoaderCircle className="animate-spin" size={20} />
        {label}
      </div>
    </Card>
  );
}
export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-xl border border-[#e6b7ae] bg-[#fff8f6] p-6 text-center">
      <div>
        <AlertCircle className="mx-auto text-[#9b3d2e]" />
        <p className="mt-3 font-semibold">تعذر تحميل البيانات</p>
        <p className="mt-1 text-sm text-[#6f5a55]">تحقق من الاتصال وحاول مرة أخرى.</p>
        {onRetry && (
          <Button className="mt-4" variant="outline" onClick={onRetry}>
            إعادة المحاولة
          </Button>
        )}
      </div>
    </div>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-[#c7bfb1] bg-[#fffdf8] p-6 text-center">
      <div>
        <Inbox className="mx-auto text-[#7b887f]" />
        <p className="mt-3 font-semibold">{title}</p>
        <p className="mt-1 text-sm text-[#59665d]">{description}</p>
      </div>
    </div>
  );
}

export function PaginationControls({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="صفحات النتائج" className="mt-5 flex items-center justify-center gap-3">
      <Button variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        السابق
      </Button>
      <span className="text-sm text-[#59665d]">
        صفحة {page} من {totalPages}
      </span>
      <Button variant="outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        التالي
      </Button>
    </nav>
  );
}
