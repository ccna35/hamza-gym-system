import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { AuditAction, AuditEntityType, AuditLogItem, getAuditLogs } from '../api/client';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationControls,
} from '../components/ui/PageState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/FormControl';

const entityLabels: Record<AuditEntityType, string> = {
  MEMBER: 'عضو',
  PLAN: 'خطة',
  SUBSCRIPTION: 'اشتراك',
  PAYMENT: 'دفعة',
};
const actionLabels: Record<AuditAction, string> = {
  MEMBER_CREATED: 'إنشاء عضو',
  MEMBER_UPDATED: 'تعديل عضو',
  MEMBER_ARCHIVED: 'أرشفة عضو',
  MEMBER_RESTORED: 'استعادة عضو',
  PLAN_CREATED: 'إنشاء خطة',
  PLAN_UPDATED: 'تعديل خطة',
  PLAN_ENABLED: 'تفعيل خطة',
  PLAN_DISABLED: 'تعطيل خطة',
  SUBSCRIPTION_CREATED: 'إنشاء اشتراك',
  SUBSCRIPTION_UPDATED: 'تعديل اشتراك',
  SUBSCRIPTION_VOIDED: 'إلغاء اشتراك خاطئ',
  PAYMENT_CREATED: 'تسجيل دفعة',
  PAYMENT_VOIDED: 'إلغاء دفعة خاطئة',
};
const actions = Object.entries(actionLabels) as [AuditAction, string][];
const fieldLabels: Record<string, string> = {
  name: 'الاسم',
  phone: 'الهاتف',
  gender: 'النوع',
  dateOfBirth: 'تاريخ الميلاد',
  joinDate: 'تاريخ الانضمام',
  heightCm: 'الطول',
  weightKg: 'الوزن',
  isArchived: 'الأرشفة',
  agreedPriceMinor: 'السعر المتفق عليه',
  amountMinor: 'المبلغ',
  reason: 'السبب',
};

function JsonDetails({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  if (!value || Object.keys(value).length === 0) return null;
  return (
    <div className="rounded-lg bg-[#f4f0e8] p-3">
      <h4 className="text-sm font-semibold text-[#59665d]">{title}</h4>
      <dl className="mt-2 space-y-2">
        {Object.entries(value).map(([key, raw]) => (
          <div className="grid grid-cols-[minmax(90px,0.6fr)_1fr] gap-3 text-sm" key={key}>
            <dt className="text-[#68736b]">{fieldLabels[key] ?? key}</dt>
            <dd className="break-all font-medium">
              {raw === null ? '—' : typeof raw === 'object' ? JSON.stringify(raw) : String(raw)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AuditCard({ item }: { item: AuditLogItem }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(item.before || item.after || item.metadata);
  return (
    <article className="rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{entityLabels[item.entityType]}</Badge>
            <h2 className="font-semibold">{actionLabels[item.action]}</h2>
          </div>
          <p className="mt-2 text-xs text-[#78827b]" dir="ltr">
            {item.entityId}
          </p>
        </div>
        <time className="text-sm text-[#59665d]">
          {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(
            new Date(item.createdAt),
          )}
        </time>
      </div>
      {hasDetails && (
        <Button
          aria-expanded={expanded}
          className="mt-3 w-full"
          onClick={() => setExpanded((value) => !value)}
          size="sm"
          variant="outline"
        >
          {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          {expanded ? 'إخفاء التفاصيل' : 'عرض قبل وبعد'}
        </Button>
      )}
      {expanded && (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <JsonDetails title="قبل العملية" value={item.before} />
          <JsonDetails title="بعد العملية" value={item.after} />
          <JsonDetails title="بيانات إضافية" value={item.metadata} />
        </div>
      )}
    </article>
  );
}

export function AuditLogsPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['audit-logs', entityType, action, from, to, page],
    queryFn: () =>
      getAuditLogs({
        page,
        limit: 20,
        ...(entityType ? { entityType: entityType as AuditEntityType } : {}),
        ...(action ? { action: action as AuditAction } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
  });
  const change = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm text-[#68736b]">سجل دائم للتغييرات المالية والإدارية</p>
        <h1 className="mt-1 text-2xl font-bold">سجل العمليات</h1>
      </header>
      <section
        className="mt-6 rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-4"
        aria-label="فلاتر سجل العمليات"
      >
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <SlidersHorizontal size={18} />
          تصفية السجل
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <span className="text-sm text-[#59665d]">نوع السجل</span>
            <Select
              className="mt-1"
              onChange={(e) => change(setEntityType)(e.target.value)}
              value={entityType}
            >
              <option value="">كل الأنواع</option>
              {Object.entries(entityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="text-sm text-[#59665d]">نوع العملية</span>
            <Select
              className="mt-1"
              onChange={(e) => change(setAction)(e.target.value)}
              value={action}
            >
              <option value="">كل العمليات</option>
              {actions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="text-sm text-[#59665d]">من تاريخ</span>
            <Input
              className="mt-1"
              max={to || undefined}
              onChange={(e) => change(setFrom)(e.target.value)}
              type="date"
              value={from}
            />
          </label>
          <label>
            <span className="text-sm text-[#59665d]">إلى تاريخ</span>
            <Input
              className="mt-1"
              min={from || undefined}
              onChange={(e) => change(setTo)(e.target.value)}
              type="date"
              value={to}
            />
          </label>
        </div>
      </section>
      <section className="mt-5">
        {query.isPending ? (
          <LoadingState label="جارٍ تحميل سجل العمليات..." />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title="لا توجد عمليات مطابقة"
            description="غيّر الفلاتر أو النطاق الزمني لعرض نتائج أخرى."
          />
        ) : (
          <>
            <div className="space-y-3">
              {query.data.items.map((item) => (
                <AuditCard item={item} key={item.id} />
              ))}
            </div>
            <PaginationControls
              onPage={setPage}
              page={query.data.pagination.page}
              totalPages={query.data.pagination.totalPages}
            />
          </>
        )}
      </section>
    </main>
  );
}
