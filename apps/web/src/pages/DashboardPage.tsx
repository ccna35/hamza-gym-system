import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  getDashboardDebtors,
  getDashboardExpiring,
  getDashboardSummary,
  Owner,
} from '../api/client';
import { PasswordChangeModal } from '../components/auth/PasswordChangeModal';
import { MemberFormModal } from '../components/members/MemberFormModal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/PageState';
import { Button, buttonClassName } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const money = (minor: number) =>
  new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(minor / 100);
const number = (value: number) => new Intl.NumberFormat('ar-EG').format(value);
const date = (value: string) =>
  new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' }).format(
    new Date(`${value}T12:00:00Z`),
  );

export function DashboardPage() {
  const owner = useOutletContext<Owner>();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const summary = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getDashboardSummary });
  const debtors = useQuery({
    queryKey: ['dashboard', 'debtors'],
    queryFn: () => getDashboardDebtors(6),
  });
  const expiring = useQuery({
    queryKey: ['dashboard', 'expiring'],
    queryFn: () => getDashboardExpiring(6),
  });

  return (
    <>
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-[#68736b]">مرحباً، {owner.username}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">نظرة عامة على الصالة</h1>
            <p className="mt-2 text-sm text-[#59665d]">أهم ما يحتاج انتباهك اليوم، في مكان واحد.</p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button onClick={() => setMemberFormOpen(true)} type="button">
              <UserPlus size={18} />
              إضافة عضو
            </Button>
          </div>
        </header>
        {owner.mustChangePassword && (
          <section className="mt-5 flex flex-col gap-3 rounded-xl border border-[var(--secondary)] bg-[#fff4d6] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">غيّر كلمة المرور المؤقتة</p>
              <p className="mt-1 text-sm text-[#6d5a32]">خطوة واحدة لتأمين حساب الإدارة.</p>
            </div>
            <Button onClick={() => setPasswordOpen(true)} type="button">
              تغيير الآن
            </Button>
          </section>
        )}

        {summary.isPending ? (
          <div className="mt-6">
            <LoadingState label="جارٍ تجهيز لوحة التحكم..." />
          </div>
        ) : summary.isError ? (
          <div className="mt-6">
            <ErrorState onRetry={() => summary.refetch()} />
          </div>
        ) : (
          <>
            <section
              className="mt-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4"
              aria-label="المؤشرات الرئيسية"
            >
              <Kpi
                icon={Users}
                label="الأعضاء النشطون"
                value={number(summary.data.activeMembers)}
                hint={`${number(summary.data.newMembersThisMonth)} أعضاء جدد هذا الشهر`}
              />
              <Kpi
                icon={Clock3}
                label="تنتهي خلال 7 أيام"
                value={number(summary.data.expiringWithin7Days)}
                hint={`${number(summary.data.expiredMemberships)} اشتراكات منتهية`}
                attention={summary.data.expiringWithin7Days > 0}
              />
              <Kpi
                icon={CircleDollarSign}
                label="إيراد اليوم"
                value={money(summary.data.revenueTodayMinor)}
                hint="حسب تاريخ الدفع الفعلي"
              />
              <Kpi
                icon={TrendingUp}
                label="إيراد الشهر"
                value={money(summary.data.revenueThisMonthMinor)}
                hint="الدفعات الصالحة فقط"
              />
            </section>
            <section
              className={`mt-4 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between ${summary.data.totalOutstandingDebtMinor > 0 ? 'border-[#dfb6ad] bg-[#fff8f5]' : 'border-[#c9ddcf] bg-[#f7fbf7]'}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`rounded-lg p-2.5 ${summary.data.totalOutstandingDebtMinor > 0 ? 'bg-[#f7e3df] text-[#8b382c]' : 'bg-[#dcecdf] text-[#27613f]'}`}
                >
                  <WalletCards size={22} />
                </span>
                <div>
                  <p className="text-sm text-[#59665d]">إجمالي الرصيد المستحق</p>
                  <p className="mt-1 text-2xl font-bold">
                    {money(summary.data.totalOutstandingDebtMinor)}
                  </p>
                  <p className="mt-1 text-xs text-[#68736b]">
                    يشمل الأعضاء المؤرشفين للحفاظ على الحقوق المالية.
                  </p>
                </div>
              </div>
              <Link className={buttonClassName({ variant: 'outline' })} to="/members">
                عرض الأعضاء <ArrowLeft size={17} />
              </Link>
            </section>
          </>
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <DashboardList
            title="أرصدة تحتاج متابعة"
            description="الأعلى مديونية أولاً"
            icon={WalletCards}
            loading={debtors.isPending}
            error={debtors.isError}
            onRetry={() => debtors.refetch()}
            empty={debtors.data?.items.length === 0}
          >
            {debtors.data?.items.map((item) => (
              <Link
                className="flex min-h-16 items-center justify-between gap-3 border-t border-[#eee8dd] px-4 py-3 first:border-t-0 hover:bg-[#faf7f1]"
                key={item.memberId}
                to={`/members/${item.memberId}`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {item.name}
                    {item.isArchived && <span className="mr-2 text-xs text-[#8b382c]">مؤرشف</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-[#68736b]" dir="ltr">
                    {item.phone}
                  </p>
                </div>
                <p className="shrink-0 font-bold text-[#9b3d2e]">
                  {money(item.outstandingBalanceMinor)}
                </p>
              </Link>
            ))}
          </DashboardList>
          <DashboardList
            title="اشتراكات تنتهي قريباً"
            description="من اليوم وحتى 7 أيام"
            icon={CalendarClock}
            loading={expiring.isPending}
            error={expiring.isError}
            onRetry={() => expiring.refetch()}
            empty={expiring.data?.items.length === 0}
          >
            {expiring.data?.items.map((item) => (
              <Link
                className="flex min-h-16 items-center justify-between gap-3 border-t border-[#eee8dd] px-4 py-3 first:border-t-0 hover:bg-[#faf7f1]"
                key={item.subscriptionId}
                to={`/members/${item.memberId}`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.memberName}</p>
                  <p className="mt-0.5 text-sm text-[#68736b]">
                    {item.planName} · {date(item.endDate)}
                  </p>
                </div>
                <Badge
                  className="shrink-0"
                  variant={item.daysRemaining <= 2 ? 'destructive' : 'secondary'}
                >
                  {item.daysRemaining === 0 ? 'اليوم' : `متبقي ${number(item.daysRemaining)} يوم`}
                </Badge>
              </Link>
            ))}
          </DashboardList>
        </section>
      </main>
      <MemberFormModal isOpen={memberFormOpen} onClose={() => setMemberFormOpen(false)} />
      <PasswordChangeModal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </>
  );
}

type Icon = typeof Users;
function Kpi({
  icon: IconView,
  label,
  value,
  hint,
  attention = false,
}: {
  icon: Icon;
  label: string;
  value: string;
  hint: string;
  attention?: boolean;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm text-[#59665d]">
        <span
          className={`rounded-lg p-2 ${attention ? 'bg-[#fff0cf] text-[#795716]' : 'bg-[#e8f0ea] text-[var(--primary)]'}`}
        >
          <IconView size={18} />
        </span>
        {label}
      </div>
      <p className="mt-4 break-words text-2xl font-bold leading-tight">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#68736b]">{hint}</p>
    </Card>
  );
}
function DashboardList({
  title,
  description,
  icon: IconView,
  loading,
  error,
  onRetry,
  empty,
  children,
}: {
  title: string;
  description: string;
  icon: Icon;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  empty: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <header className="flex items-center gap-3 border-b border-[#e8e2d7] p-4">
        <span className="rounded-lg bg-[#e8f0ea] p-2 text-[var(--primary)]">
          <IconView size={19} />
        </span>
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="mt-0.5 text-xs text-[#68736b]">{description}</p>
        </div>
      </header>
      {loading ? (
        <div className="p-4">
          <LoadingState />
        </div>
      ) : error ? (
        <div className="p-4">
          <ErrorState onRetry={onRetry} />
        </div>
      ) : empty ? (
        <div className="p-4">
          <EmptyState
            title="لا توجد متابعة مطلوبة"
            description="كل شيء هادئ في هذه القائمة الآن."
          />
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
