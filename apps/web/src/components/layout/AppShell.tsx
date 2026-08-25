import { LogOut, Menu, X } from 'lucide-react';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Brand, Navigation } from './Navigation';
import { Button } from '../ui/Button';

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
      <aside className="fixed inset-y-0 right-0 hidden w-64 flex-col border-l border-[#d9d2c4] bg-[#fffdf8] p-6 lg:flex">
        <div>
          <Brand />
          <Navigation />
        </div>
        <Button
          className="mt-auto w-full justify-start"
          disabled={isLoggingOut}
          onClick={onLogout}
          variant="ghost"
        >
          <LogOut aria-hidden="true" size={19} />
          {isLoggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج'}
        </Button>
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
              <Button
                aria-label="إغلاق القائمة"
                onClick={() => setIsMenuOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X aria-hidden="true" size={21} />
              </Button>
            </div>
            <Navigation onNavigate={() => setIsMenuOpen(false)} />
            <Button
              className="mt-8 w-full justify-start"
              disabled={isLoggingOut}
              onClick={onLogout}
              variant="ghost"
            >
              <LogOut aria-hidden="true" size={19} /> تسجيل الخروج
            </Button>
          </aside>
        </div>
      )}

      <div className="lg:mr-64">
        <header className="flex h-16 items-center justify-between border-b border-[#d9d2c4] bg-[#fffdf8] px-4 lg:hidden">
          <Button
            aria-label="فتح القائمة"
            onClick={() => setIsMenuOpen(true)}
            size="icon"
            variant="ghost"
          >
            <Menu aria-hidden="true" size={22} />
          </Button>
          <span className="font-semibold">لوحة الإدارة</span>
          <span aria-hidden="true" className="size-10" />
        </header>
        {children}
      </div>
    </div>
  );
}
