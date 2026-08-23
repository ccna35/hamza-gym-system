import { BarChart3, ClipboardList, Dumbbell, ScrollText, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface NavigationProps {
  onNavigate?: () => void;
}

const items = [
  { label: 'لوحة التحكم', to: '/', icon: BarChart3 },
  { label: 'الأعضاء', to: '/members', icon: Users },
  { label: 'الخطط', to: '/plans', icon: ClipboardList },
  { label: 'سجل العمليات', to: '/audit-logs', icon: ScrollText },
];

export function Navigation({ onNavigate }: NavigationProps) {
  return (
    <nav aria-label="التنقل الرئيسي" className="mt-10 space-y-2">
      {items.map(({ label, to, icon: Icon }) => (
        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${isActive ? 'bg-[#dce9df] font-semibold text-[#234633]' : 'hover:bg-[#f1ede5]'}`
          }
          key={to}
          onClick={onNavigate}
          to={to}
        >
          <Icon aria-hidden="true" size={19} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Brand() {
  return (
    <div className="flex items-center gap-3 text-lg font-semibold">
      <span className="grid size-9 place-items-center rounded-xl bg-[#315c45] text-white">
        <Dumbbell aria-hidden="true" size={20} />
      </span>
      <span>نظام إدارة الجيم</span>
    </div>
  );
}
