import { LogOut, Menu, X } from 'lucide-react';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Brand, Navigation } from './Navigation';

interface AppShellProps extends PropsWithChildren {
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export function AppShell({ children, onLogout, isLoggingOut }: AppShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-[#f4f0e8] text-[#17221d]">
      <aside className="fixed inset-y-0 right-0 hidden w-64 border-l border-[#d9d2c4] bg-[#fffdf8] p-6 lg:block">
        <Brand />
        <Navigation />
      </aside>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="إغلاق القائمة"
            className="absolute inset-0 bg-[#17221d]/45"
            onClick={() => setIsMenuOpen(false)}
            type="button"
          />
          <aside className="relative h-full w-[min(85vw,320px)] border-l border-[#d9d2c4] bg-[#fffdf8] p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <Brand />
              <button
                aria-label="إغلاق القائمة"
                className="rounded-lg p-2 hover:bg-[#f1ede5]"
                onClick={() => setIsMenuOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </div>
            <Navigation onNavigate={() => setIsMenuOpen(false)} />
            <button
              className="mt-8 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-3 text-[#9b3d2e] hover:bg-[#f9e9e5]"
              disabled={isLoggingOut}
              onClick={onLogout}
              type="button"
            >
              <LogOut aria-hidden="true" size={19} /> تسجيل الخروج
            </button>
          </aside>
        </div>
      )}

      <div className="lg:mr-64">
        <header className="flex h-16 items-center justify-between border-b border-[#d9d2c4] bg-[#fffdf8] px-4 lg:hidden">
          <button
            aria-label="فتح القائمة"
            className="rounded-lg p-2 hover:bg-[#f1ede5]"
            onClick={() => setIsMenuOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" size={22} />
          </button>
          <span className="font-semibold">لوحة الإدارة</span>
          <button
            aria-label="تسجيل الخروج"
            className="rounded-lg p-2 text-[#9b3d2e] hover:bg-[#f9e9e5]"
            disabled={isLoggingOut}
            onClick={onLogout}
            type="button"
          >
            <LogOut aria-hidden="true" size={19} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
