import { Dumbbell } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f0e8] p-4 text-[#17221d]">
      <section className="w-full max-w-md rounded-2xl border border-[#d9d2c4] bg-[#fffdf8] p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 text-xl font-semibold">
          <span className="grid size-10 place-items-center rounded-xl bg-[#315c45] text-white">
            <Dumbbell aria-hidden="true" size={22} />
          </span>
          <span>تسجيل دخول المالك</span>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
