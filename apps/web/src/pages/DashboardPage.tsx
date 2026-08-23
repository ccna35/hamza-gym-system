import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Owner } from '../api/client';
import { PasswordChangeModal } from '../components/auth/PasswordChangeModal';
import { HealthStatus } from '../components/dashboard/HealthStatus';

export function DashboardPage() {
  const owner = useOutletContext<Owner>();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <>
      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#59665d]">مرحباً، {owner.username}</p>
            <h1 className="mt-1 text-2xl font-semibold">لوحة التحكم</h1>
          </div>
          <span className="rounded-full bg-[#e5eee6] px-3 py-1 text-sm text-[#315c45]">
            البيانات الأساسية
          </span>
        </div>

        {owner.mustChangePassword && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#d4a95b] bg-[#fff4d6] p-4">
            <div>
              <p className="font-semibold">يرجى تغيير كلمة المرور المؤقتة.</p>
              <p className="mt-1 text-sm text-[#6d5a32]">حافظ على حساب الإدارة محمياً.</p>
            </div>
            <button
              className="min-h-11 rounded-lg bg-[#315c45] px-4 font-semibold text-white hover:bg-[#234633]"
              onClick={() => setIsPasswordModalOpen(true)}
              type="button"
            >
              تغيير كلمة المرور
            </button>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="حالة النظام">
          <div className="rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-5">
            <p className="text-sm text-[#59665d]">حالة النظام</p>
            <p className="mt-2 text-xl font-semibold">جاهز للعمل</p>
          </div>
          <div className="rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-5">
            <p className="text-sm text-[#59665d]">المستخدم الحالي</p>
            <p className="mt-2 text-xl font-semibold">{owner.username}</p>
          </div>
          <div className="rounded-xl border border-[#d9d2c4] bg-[#fffdf8] p-5">
            <p className="text-sm text-[#59665d]">المرحلة الحالية</p>
            <p className="mt-2 text-xl font-semibold">تجهيز النظام</p>
          </div>
        </section>
        <HealthStatus />
      </main>
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}
