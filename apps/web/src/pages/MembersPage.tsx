import { useQuery } from '@tanstack/react-query';
import { Filter, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getMembers, MemberListItem } from '../api/client';
import { MemberAvatar } from '../components/members/MemberAvatar';
import { MemberFormModal } from '../components/members/MemberFormModal';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationControls,
} from '../components/ui/PageState';

const stateLabels = {
  NONE: 'لا يوجد اشتراك',
  SCHEDULED: 'اشتراك قادم',
  ACTIVE: 'نشط',
  EXPIRED: 'منتهي',
} as const;
const stateStyles = {
  NONE: 'bg-[#eeeae2] text-[#59665d]',
  SCHEDULED: 'bg-[#e7edf7] text-[#35547a]',
  ACTIVE: 'bg-[#dcecdf] text-[#27613f]',
  EXPIRED: 'bg-[#f7e3df] text-[#8b382c]',
} as const;
const money = (minor: number) =>
  new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(minor / 100);
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(
        new Date(`${value}T12:00:00Z`),
      )
    : '—';

function MemberCard({ member }: { member: MemberListItem }) {
  return (
    <Link
      className="block rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-4 transition hover:border-[#8faa98] hover:shadow-sm"
      to={`/members/${member.id}`}
    >
      <div className="flex items-center gap-3">
        <MemberAvatar name={member.name} photoUrl={member.photoUrl} />
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{member.name}</h2>
          <p className="mt-0.5 text-sm text-[#59665d]" dir="ltr">
            {member.phone}
          </p>
        </div>
        <span
          className={`mr-auto rounded-full px-2.5 py-1 text-xs font-semibold ${stateStyles[member.subscriptionState]}`}
        >
          {stateLabels[member.subscriptionState]}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#eee8dd] pt-3 text-sm">
        <div>
          <p className="text-[#6d776f]">انتهاء الاشتراك</p>
          <p className="mt-1 font-medium">{date(member.subscriptionEndDate)}</p>
        </div>
        <div>
          <p className="text-[#6d776f]">الرصيد المستحق</p>
          <p
            className={`mt-1 font-semibold ${member.outstandingBalanceMinor > 0 ? 'text-[#9b3d2e]' : 'text-[#315c45]'}`}
          >
            {money(member.outstandingBalanceMinor)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function MembersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const [state, setState] = useState('');
  const [debt, setDebt] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['members', search, archived, state, debt, page],
    queryFn: () =>
      getMembers({
        archived,
        page,
        limit: 20,
        ...(search ? { search } : {}),
        ...(state ? { subscriptionState: state } : {}),
        ...(debt ? { hasDebt: debt === 'true' } : {}),
      }),
  });
  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[#68736b]">إدارة بيانات واشتراكات العملاء</p>
          <h1 className="mt-1 text-2xl font-bold">الأعضاء</h1>
        </div>
        <button
          className="flex min-h-11 items-center gap-2 rounded-lg bg-[#315c45] px-4 font-semibold text-white hover:bg-[#234633]"
          onClick={() => setFormOpen(true)}
          type="button"
        >
          <Plus size={19} />
          إضافة عضو
        </button>
      </header>
      <section
        className="mt-6 rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-4"
        aria-label="تصفية الأعضاء"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(140px,auto))]">
          <label className="relative">
            <span className="sr-only">البحث بالاسم أو الهاتف</span>
            <Search
              className="pointer-events-none absolute right-3 top-3 text-[#718078]"
              size={20}
            />
            <input
              className="min-h-11 w-full rounded-lg border border-[#c7bfb1] bg-white pr-10 pl-3 outline-none focus:border-[#315c45] focus:ring-2 focus:ring-[#315c45]/20"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="ابحث بالاسم أو رقم الهاتف"
              value={search}
            />
          </label>
          <label>
            <span className="sr-only">حالة الأرشفة</span>
            <select
              className="min-h-11 w-full rounded-lg border border-[#c7bfb1] bg-white px-3"
              onChange={(e) => {
                setArchived(e.target.value === 'true');
                setPage(1);
              }}
              value={String(archived)}
            >
              <option value="false">الأعضاء الحاليون</option>
              <option value="true">الأعضاء المؤرشفون</option>
            </select>
          </label>
          <label>
            <span className="sr-only">حالة الاشتراك</span>
            <select
              className="min-h-11 w-full rounded-lg border border-[#c7bfb1] bg-white px-3"
              onChange={(e) => updateFilter(setState, e.target.value)}
              value={state}
            >
              <option value="">كل الاشتراكات</option>
              <option value="ACTIVE">نشط</option>
              <option value="SCHEDULED">قادم</option>
              <option value="EXPIRED">منتهي</option>
              <option value="NONE">بدون اشتراك</option>
            </select>
          </label>
          <label>
            <span className="sr-only">حالة المديونية</span>
            <select
              className="min-h-11 w-full rounded-lg border border-[#c7bfb1] bg-white px-3"
              onChange={(e) => updateFilter(setDebt, e.target.value)}
              value={debt}
            >
              <option value="">كل الأرصدة</option>
              <option value="true">عليه مستحقات</option>
              <option value="false">بدون مستحقات</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-[#68736b]">
          <Filter size={15} />
          تتحدث النتائج تلقائياً عند تغيير الفلاتر
        </div>
      </section>
      <section className="mt-5">
        {query.isPending ? (
          <LoadingState label="جارٍ تحميل الأعضاء..." />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title="لا يوجد أعضاء"
            description="غيّر خيارات البحث أو أضف أول عضو للنظام."
          />
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {query.data.items.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
            <div className="hidden overflow-hidden rounded-xl border border-[#d9d2c4] bg-[#fffdf8] md:block">
              <table className="w-full text-right">
                <thead className="bg-[#f1ede5] text-sm text-[#59665d]">
                  <tr>
                    <th className="p-4">العضو</th>
                    <th className="p-4">الاشتراك</th>
                    <th className="p-4">تاريخ الانتهاء</th>
                    <th className="p-4">الرصيد المستحق</th>
                    <th className="p-4">
                      <span className="sr-only">فتح</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((member) => (
                    <tr className="border-t border-[#e8e2d7]" key={member.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <MemberAvatar name={member.name} photoUrl={member.photoUrl} />
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-sm text-[#68736b]" dir="ltr">
                              {member.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateStyles[member.subscriptionState]}`}
                        >
                          {stateLabels[member.subscriptionState]}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{date(member.subscriptionEndDate)}</td>
                      <td
                        className={`p-4 font-semibold ${member.outstandingBalanceMinor > 0 ? 'text-[#9b3d2e]' : ''}`}
                      >
                        {money(member.outstandingBalanceMinor)}
                      </td>
                      <td className="p-4">
                        <Link
                          className="font-semibold text-[#315c45] hover:underline"
                          to={`/members/${member.id}`}
                        >
                          فتح الملف
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              onPage={setPage}
              page={query.data.pagination.page}
              totalPages={query.data.pagination.totalPages}
            />
          </>
        )}
      </section>
      <MemberFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} />
    </main>
  );
}
