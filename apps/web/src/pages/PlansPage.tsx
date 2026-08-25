import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, CircleDollarSign, Pencil, Plus, Power, PowerOff } from 'lucide-react';
import { useState } from 'react';
import { disablePlan, enablePlan, getPlans, Plan } from '../api/client';
import { PlanFormModal } from '../components/plans/PlanFormModal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationControls,
} from '../components/ui/PageState';

const durations = [1, 3, 6, 12] as const;
const durationLabels = { 1: 'شهر', 3: '3 أشهر', 6: '6 أشهر', 12: '12 شهراً' };
const money = (minor: number) =>
  new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(minor / 100);

function PriceGrid({ plan }: { plan: Plan }) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {durations.map((duration) => {
        const price = plan.prices.find((item) => item.durationMonths === duration);
        return (
          <div className="rounded-lg bg-[#f4f0e8] p-3" key={duration}>
            <dt className="text-xs text-[#68736b]">{durationLabels[duration]}</dt>
            <dd className="mt-1 font-bold text-[#253d30]">{money(price?.priceMinor ?? 0)}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function PlansPage() {
  const client = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | undefined>();
  const [statusPlan, setStatusPlan] = useState<Plan | null>(null);
  const query = useQuery({
    queryKey: ['plans', filter, page],
    queryFn: () =>
      getPlans({ ...(filter !== 'all' ? { enabled: filter === 'enabled' } : {}), page, limit: 20 }),
  });
  const statusMutation = useMutation({
    mutationFn: (plan: Plan) => (plan.isEnabled ? disablePlan(plan.id) : enablePlan(plan.id)),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['plans'] }),
      ]);
      setStatusPlan(null);
    },
  });
  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setFormOpen(true);
  };

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[#68736b]">أسعار الاشتراكات ومددها المتاحة</p>
          <h1 className="mt-1 text-2xl font-bold">خطط الاشتراك</h1>
        </div>
        <Button onClick={openCreate} type="button">
          <Plus size={19} />
          إضافة خطة
        </Button>
      </header>
      <section className="mt-6 flex flex-wrap items-center gap-2" aria-label="تصفية الخطط">
        {(
          [
            ['all', 'كل الخطط'],
            ['enabled', 'المفعلة'],
            ['disabled', 'المعطلة'],
          ] as const
        ).map(([value, label]) => (
          <Button
            aria-pressed={filter === value}
            variant={filter === value ? 'primary' : 'outline'}
            key={value}
            onClick={() => {
              setFilter(value);
              setPage(1);
            }}
            type="button"
          >
            {label}
          </Button>
        ))}
      </section>
      <section className="mt-5">
        {query.isPending ? (
          <LoadingState label="جارٍ تحميل الخطط..." />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title="لا توجد خطط"
            description={
              filter === 'all'
                ? 'أضف أول خطة اشتراك وحدد أسعار المدد الأربع.'
                : 'لا توجد خطط مطابقة لهذا الفلتر.'
            }
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {query.data.items.map((plan) => (
                <Card
                  className={`p-5 ${plan.isEnabled ? '' : 'border-[#dfc8c3] opacity-90'}`}
                  key={plan.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`grid size-10 place-items-center rounded-xl ${plan.isEnabled ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'bg-[#eee8e4] text-[#806b65]'}`}
                        >
                          <CalendarRange size={20} />
                        </span>
                        <div>
                          <h2 className="truncate text-lg font-bold">{plan.name}</h2>
                          <Badge variant={plan.isEnabled ? 'success' : 'destructive'}>
                            {plan.isEnabled ? 'مفعلة للاشتراكات الجديدة' : 'معطلة'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CircleDollarSign className="text-[#9a7a36]" size={22} />
                  </div>
                  <div className="mt-5">
                    <PriceGrid plan={plan} />
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#e8e2d7] pt-4">
                    <Button variant="outline" onClick={() => openEdit(plan)} type="button">
                      <Pencil size={17} />
                      تعديل
                    </Button>
                    <Button
                      variant={plan.isEnabled ? 'destructive' : 'primary'}
                      onClick={() => setStatusPlan(plan)}
                      type="button"
                    >
                      {plan.isEnabled ? <PowerOff size={17} /> : <Power size={17} />}
                      {plan.isEnabled ? 'تعطيل' : 'تفعيل'}
                    </Button>
                  </div>
                </Card>
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
      <PlanFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} plan={editing} />
      <Modal
        isOpen={Boolean(statusPlan)}
        onClose={statusMutation.isPending ? () => undefined : () => setStatusPlan(null)}
        title={statusPlan?.isEnabled ? 'تعطيل الخطة' : 'تفعيل الخطة'}
      >
        <div
          className={`grid size-12 place-items-center rounded-xl ${statusPlan?.isEnabled ? 'bg-[#f7e3df] text-[#8b382c]' : 'bg-[var(--primary-soft)] text-[var(--primary)]'}`}
        >
          {statusPlan?.isEnabled ? <PowerOff size={23} /> : <Power size={23} />}
        </div>
        <p className="mt-4 font-semibold">
          {statusPlan?.isEnabled
            ? `تعطيل خطة «${statusPlan.name}»؟`
            : `تفعيل خطة «${statusPlan?.name}»؟`}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#68736b]">
          {statusPlan?.isEnabled
            ? 'لن تظهر الخطة عند إنشاء اشتراك جديد، ولن تتأثر الاشتراكات السابقة.'
            : 'ستظهر الخطة مجدداً ضمن خيارات الاشتراكات الجديدة.'}
        </p>
        {statusMutation.isError && (
          <p className="mt-3 rounded-lg bg-[#fff2ef] p-3 text-sm text-[#8b382c]">
            تعذر تغيير حالة الخطة. حاول مرة أخرى.
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="outline"
            disabled={statusMutation.isPending}
            onClick={() => setStatusPlan(null)}
            type="button"
          >
            إلغاء
          </Button>
          <Button
            variant={statusPlan?.isEnabled ? 'destructive' : 'primary'}
            disabled={statusMutation.isPending || !statusPlan}
            onClick={() => statusPlan && statusMutation.mutate(statusPlan)}
            type="button"
          >
            {statusMutation.isPending
              ? 'جارٍ التنفيذ...'
              : statusPlan?.isEnabled
                ? 'تأكيد التعطيل'
                : 'تأكيد التفعيل'}
          </Button>
        </div>
      </Modal>
    </main>
  );
}
