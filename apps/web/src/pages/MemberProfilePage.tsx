import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArrowRight,
  CalendarDays,
  Camera,
  Pencil,
  RotateCcw,
  WalletCards,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { archiveMember, getMember, getMemberAuditLog, restoreMember } from '../api/client';
import { MemberAvatar } from '../components/members/MemberAvatar';
import { MemberFormModal } from '../components/members/MemberFormModal';
import { PhotoUploadModal } from '../components/members/PhotoUploadModal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/PageState';

const money = (minor: number) =>
  new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(minor / 100);
const date = (value: string) =>
  new Intl.DateTimeFormat('ar-EG', { dateStyle: 'long' }).format(new Date(`${value}T12:00:00Z`));
const actionLabels: Record<string, string> = {
  MEMBER_CREATED: 'إنشاء العضو',
  MEMBER_UPDATED: 'تعديل البيانات',
  MEMBER_ARCHIVED: 'أرشفة العضو',
  MEMBER_RESTORED: 'استعادة العضو',
};

export function MemberProfilePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const { memberId = '' } = useParams();
  const client = useQueryClient();
  const member = useQuery({ queryKey: ['member', memberId], queryFn: () => getMember(memberId) });
  const audit = useQuery({
    queryKey: ['member-audit', memberId],
    queryFn: () => getMemberAuditLog(memberId),
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
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315c45]"
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
              {value.isArchived && (
                <span className="rounded-full bg-[#f7e3df] px-2.5 py-1 text-xs font-semibold text-[#8b382c]">
                  مؤرشف
                </span>
              )}
            </div>
            <p className="mt-1 text-[#59665d]" dir="ltr">
              {value.phone}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:mr-auto sm:flex-row">
            <button
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#bcb4a6] px-4 font-semibold"
              onClick={() => setPhotoOpen(true)}
              type="button"
            >
              <Camera size={17} />
              {value.photoUrl ? 'تغيير الصورة' : 'إضافة صورة'}
            </button>
            <button
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#bcb4a6] px-4 font-semibold"
              onClick={() => setFormOpen(true)}
              type="button"
            >
              <Pencil size={17} />
              تعديل البيانات
            </button>
            <button
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 font-semibold ${value.isArchived ? 'bg-[#315c45] text-white' : 'border border-[#d09b91] text-[#8b382c]'}`}
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate()}
            >
              {value.isArchived ? <RotateCcw size={17} /> : <Archive size={17} />}
              {value.isArchived ? 'استعادة العضو' : 'أرشفة العضو'}
            </button>
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
            className={`mt-3 text-2xl font-bold ${value.outstandingBalanceMinor > 0 ? 'text-[#9b3d2e]' : 'text-[#315c45]'}`}
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
        <div className="mb-3">
          <h2 className="text-xl font-bold">سجل عمليات العضو</h2>
          <p className="mt-1 text-sm text-[#68736b]">
            التعديلات والأرشفة والاستعادة محفوظة زمنياً.
          </p>
        </div>
        {audit.isPending ? (
          <LoadingState />
        ) : audit.isError ? (
          <ErrorState onRetry={() => audit.refetch()} />
        ) : audit.data.items.length === 0 ? (
          <EmptyState title="لا توجد عمليات مسجلة" description="ستظهر تغييرات بيانات العضو هنا." />
        ) : (
          <div className="space-y-3">
            {audit.data.items.map((item) => (
              <article
                className="rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-4"
                key={item.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{actionLabels[item.action] ?? item.action}</p>
                  <time className="text-sm text-[#68736b]">
                    {new Intl.DateTimeFormat('ar-EG', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(item.createdAt))}
                  </time>
                </div>
                {item.metadata?.reason ? (
                  <p className="mt-2 text-sm text-[#59665d]">
                    السبب: {String(item.metadata.reason)}
                  </p>
                ) : null}
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
    </main>
  );
}
