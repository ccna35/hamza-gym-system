import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArrowRight,
  CalendarDays,
  Camera,
  Pencil,
  RotateCcw,
  WalletCards,
  Plus,
  Ban,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import {
  archiveMember,
  getMember,
  getMemberAuditLog,
  getPayments,
  getSubscriptions,
  Payment,
  restoreMember,
} from '../api/client';
import { MemberAvatar } from '../components/members/MemberAvatar';
import { MemberFormModal } from '../components/members/MemberFormModal';
import { PhotoUploadModal } from '../components/members/PhotoUploadModal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/PageState';
import { SubscriptionFormModal } from '../components/subscriptions/SubscriptionFormModal';
import { PaymentFormModal } from '../components/payments/PaymentFormModal';
import { VoidPaymentModal } from '../components/payments/VoidPaymentModal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const money = (minor: number) =>
  new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(minor / 100);
const date = (value: string) =>
  new Intl.DateTimeFormat('ar-EG', { dateStyle: 'long' }).format(new Date(`${value}T12:00:00Z`));
const actionLabels: Record<string, string> = {
  MEMBER_CREATED: 'إنشاء العضو',
  MEMBER_UPDATED: 'تعديل البيانات',
  MEMBER_ARCHIVED: 'أرشفة العضو',
  MEMBER_RESTORED: 'استعادة العضو',
  PAYMENT_CREATED: 'تسجيل دفعة',
  PAYMENT_VOIDED: 'إلغاء دفعة',
  SUBSCRIPTION_CREATED: 'إنشاء اشتراك',
  SUBSCRIPTION_UPDATED: 'تعديل اشتراك',
  SUBSCRIPTION_VOIDED: 'إلغاء اشتراك',
};

export function MemberProfilePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentToVoid, setPaymentToVoid] = useState<Payment | null>(null);
  const { memberId = '' } = useParams();
  const client = useQueryClient();
  const member = useQuery({ queryKey: ['member', memberId], queryFn: () => getMember(memberId) });
  const audit = useQuery({
    queryKey: ['member-audit', memberId],
    queryFn: () => getMemberAuditLog(memberId),
    enabled: member.isSuccess,
  });
  const subscriptions = useQuery({
    queryKey: ['subscriptions', memberId],
    queryFn: () => getSubscriptions(memberId),
    enabled: member.isSuccess,
  });
  const payments = useQuery({
    queryKey: ['payments', memberId],
    queryFn: () => getPayments(memberId),
    enabled: member.isSuccess,
  });
  const statusMutation = useMutation({
    mutationFn: () => (member.data?.isArchived ? restoreMember(memberId) : archiveMember(memberId)),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['member', memberId] }),
        client.invalidateQueries({ queryKey: ['members'] }),
        client.invalidateQueries({ queryKey: ['member-audit', memberId] }),
      ]);
    },
  });
  if (member.isPending)
    return (
      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <LoadingState />
      </main>
    );
  if (member.isError)
    return (
      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <ErrorState onRetry={() => member.refetch()} />
      </main>
    );
  const value = member.data;
  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <Link
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--primary)]"
        to="/members"
      >
        <ArrowRight size={18} />
        كل الأعضاء
      </Link>
      <section className="mt-2 rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <MemberAvatar large name={value.name} photoUrl={value.photoUrl} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{value.name}</h1>
              {value.isArchived && <Badge variant="destructive">مؤرشف</Badge>}
            </div>
            <p className="mt-1 text-[#59665d]" dir="ltr">
              {value.phone}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:mr-auto sm:flex-row">
            <Button variant="outline" onClick={() => setPhotoOpen(true)} type="button">
              <Camera size={17} />
              {value.photoUrl ? 'تغيير الصورة' : 'إضافة صورة'}
            </Button>
            <Button variant="outline" onClick={() => setFormOpen(true)} type="button">
              <Pencil size={17} />
              تعديل البيانات
            </Button>
            <Button
              variant={value.isArchived ? 'primary' : 'destructive'}
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate()}
            >
              {value.isArchived ? <RotateCcw size={17} /> : <Archive size={17} />}
              {value.isArchived ? 'استعادة العضو' : 'أرشفة العضو'}
            </Button>
          </div>
        </div>
      </section>
      <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-5">
          <div className="flex items-center gap-2 text-[#59665d]">
            <CalendarDays size={18} />
            الاشتراك الحالي
          </div>
          <p className="mt-3 text-xl font-bold">
            {value.currentSubscription?.planNameSnapshot ?? 'لا يوجد اشتراك'}
          </p>
          <p className="mt-1 text-sm text-[#59665d]">
            {value.currentSubscription
              ? `ينتهي في ${date(value.currentSubscription.endDate)}`
              : 'يمكن إضافة اشتراك من ملف العضو'}
          </p>
        </article>
        <article className="rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-5">
          <div className="flex items-center gap-2 text-[#59665d]">
            <WalletCards size={18} />
            الرصيد المستحق
          </div>
          <p
            className={`mt-3 text-2xl font-bold ${value.outstandingBalanceMinor > 0 ? 'text-[#9b3d2e]' : 'text-[var(--primary)]'}`}
          >
            {money(value.outstandingBalanceMinor)}
          </p>
          <p className="mt-1 text-sm text-[#59665d]">الرصيد مشتق من الاشتراكات والمدفوعات</p>
        </article>
        <article className="rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-[#59665d]">بيانات العضوية</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[#68736b]">تاريخ الميلاد</dt>
              <dd className="mt-1 font-medium">{date(value.dateOfBirth)}</dd>
            </div>
            <div>
              <dt className="text-[#68736b]">تاريخ الانضمام</dt>
              <dd className="mt-1 font-medium">{date(value.joinDate)}</dd>
            </div>
            <div>
              <dt className="text-[#68736b]">الطول</dt>
              <dd className="mt-1 font-medium">{value.heightCm ? `${value.heightCm} سم` : '—'}</dd>
            </div>
            <div>
              <dt className="text-[#68736b]">الوزن</dt>
              <dd className="mt-1 font-medium">{value.weightKg ? `${value.weightKg} كجم` : '—'}</dd>
            </div>
          </dl>
        </article>
      </section>
      <section className="mt-6">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">الاشتراكات</h2>
            <p className="mt-1 text-sm text-[#68736b]">السجل الكامل للاشتراكات الحالية والسابقة.</p>
          </div>
          <Button onClick={() => setSubscriptionOpen(true)} type="button">
            <Plus size={18} />
            {value.currentSubscription || value.nextSubscription
              ? 'تجديد الاشتراك'
              : 'إضافة اشتراك'}
          </Button>
        </div>
        {subscriptions.isPending ? (
          <LoadingState />
        ) : subscriptions.isError ? (
          <ErrorState onRetry={() => subscriptions.refetch()} />
        ) : subscriptions.data.items.length === 0 ? (
          <EmptyState title="لا توجد اشتراكات" description="أضف أول اشتراك لهذا العضو." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {subscriptions.data.items.map((item) => (
              <article
                className="rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-4"
                key={item.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{item.planNameSnapshot}</p>
                    <p className="mt-1 text-sm text-[#68736b]">
                      {date(item.startDate)} — {date(item.endDate)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
                    {
                      { ACTIVE: 'نشط', SCHEDULED: 'مجدول', EXPIRED: 'منتهي', VOIDED: 'ملغي' }[
                        item.state
                      ]
                    }
                  </span>
                </div>
                <p className="mt-3 font-semibold">{money(item.agreedPriceMinor)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="mt-6">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">المدفوعات</h2>
            <p className="mt-1 text-sm text-[#68736b]">الدفعات النقدية وأرقام الإيصالات.</p>
          </div>
          <Button
            disabled={value.outstandingBalanceMinor <= 0}
            onClick={() => setPaymentOpen(true)}
            type="button"
          >
            <WalletCards size={18} /> تسجيل دفعة
          </Button>
        </div>
        {payments.isPending ? (
          <LoadingState />
        ) : payments.isError ? (
          <ErrorState onRetry={() => payments.refetch()} />
        ) : payments.data.items.length === 0 ? (
          <EmptyState title="لا توجد مدفوعات" description="ستظهر الدفعات النقدية المسجلة هنا." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {payments.data.items.map((item) => (
              <article
                className="rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-4"
                key={item.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{money(item.amountMinor)}</p>
                    <p className="mt-1 text-sm text-[#68736b]">{date(item.paymentDate)}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'VALID' ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'bg-[#f7e3df] text-[#8b382c]'}`}
                  >
                    {item.status === 'VALID' ? 'صالح' : 'ملغي'}
                  </span>
                </div>
                <p className="mt-3 font-mono text-sm" dir="ltr">
                  {item.receiptNumber}
                </p>
                <p className="mt-1 text-sm text-[#68736b]">
                  الرصيد بعد الدفع: {money(item.balanceAfterPaymentMinor)}
                </p>
                {item.status === 'VALID' && (
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="destructive"
                    onClick={() => setPaymentToVoid(item)}
                    type="button"
                  >
                    <Ban size={16} />
                    إلغاء الدفعة
                  </Button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      <MemberFormModal isOpen={formOpen} member={value} onClose={() => setFormOpen(false)} />
      <PhotoUploadModal
        isOpen={photoOpen}
        memberId={memberId}
        onClose={() => setPhotoOpen(false)}
      />
      <SubscriptionFormModal
        memberId={memberId}
        renewal={Boolean(value.currentSubscription || value.nextSubscription)}
        isOpen={subscriptionOpen}
        onClose={() => setSubscriptionOpen(false)}
      />
      <PaymentFormModal
        memberId={memberId}
        balanceMinor={value.outstandingBalanceMinor}
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
      />
      <VoidPaymentModal
        payment={paymentToVoid}
        memberId={memberId}
        isOpen={Boolean(paymentToVoid)}
        onClose={() => setPaymentToVoid(null)}
      />
    </main>
  );
}
