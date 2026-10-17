import type { ReactNode } from 'react';
import { StoreIcon, OrderIcon, ProductBoxIcon, CustomerIcon, ReportIcon, SettingIcon } from './Icons';
import { usePosStore } from '../store/usePosStore';

export type NavItemKey = 'pos' | 'orders' | 'products' | 'customers' | 'inventory' | 'reports' | 'closeShift' | 'shiftHistory' | 'settings';

interface SidebarProps {
  activeNav: NavItemKey;
  onNavChange: (key: NavItemKey) => void;
}

export const Sidebar = ({ activeNav, onNavChange }: SidebarProps) => {
  const user = usePosStore((state) => state.user);
  const menuItems: { id: NavItemKey; label: string; icon: ReactNode }[] = [
    { id: 'pos', label: 'ขายสินค้า', icon: <StoreIcon className="w-5 h-5" /> },
    { id: 'orders', label: 'รายการสั่งซื้อ', icon: <OrderIcon className="w-5 h-5" /> },
    { id: 'products', label: 'สินค้า', icon: <ProductBoxIcon className="w-5 h-5" /> },
    { id: 'customers', label: 'สมาชิก', icon: <CustomerIcon className="w-5 h-5" /> },
    { id: 'inventory', label: 'คลังสินค้า', icon: <ProductBoxIcon className="w-5 h-5" /> },
    { id: 'reports', label: 'รายงาน', icon: <ReportIcon className="w-5 h-5" /> },
    ...(user?.role === 'staff' ? [{ id: 'closeShift' as const, label: 'ปิดกะ', icon: <SettingIcon className="w-5 h-5" /> }] : []),
    ...(user?.role === 'admin' || user?.role === 'manager' ? [{ id: 'shiftHistory' as const, label: 'ประวัติกะ', icon: <ReportIcon className="w-5 h-5" /> }] : []),
    ...(user?.role === 'admin' ? [{ id: 'settings' as const, label: 'ตั้งค่า', icon: <SettingIcon className="w-5 h-5" /> }] : []),
  ];

  return (
    <aside className="pos-sidebar fixed inset-x-0 bottom-0 z-40 h-[68px] border-t border-slate-100 bg-white px-1.5 py-1.5 select-none lg:static lg:h-auto lg:w-52 lg:flex-shrink-0 lg:flex lg:flex-col lg:justify-between lg:border-r lg:border-t-0 lg:px-3 lg:py-4">
      <div className="pos-sidebar-menu flex h-full items-stretch gap-1 overflow-x-auto lg:h-auto lg:flex-col lg:gap-1.5 lg:overflow-visible">
        {menuItems.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavChange(item.id)}
              className={active
                ? 'pos-sidebar-button flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-orange-500 px-2 py-1 text-[10px] font-semibold text-white shadow-md shadow-orange-500/20 lg:w-full lg:flex-none lg:flex-row lg:justify-start lg:gap-3.5 lg:rounded-2xl lg:px-4 lg:py-3 lg:text-sm'
                : 'pos-sidebar-button flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50 lg:w-full lg:flex-none lg:flex-row lg:justify-start lg:gap-3.5 lg:rounded-2xl lg:px-4 lg:py-3 lg:text-sm'}
            >
              <span className={`${active ? 'text-white' : 'text-slate-400'} [&>svg]:h-5 [&>svg]:w-5`}>{item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="pos-sidebar-footer hidden px-4 py-2 pt-3 text-center text-xs text-slate-400 lg:block lg:border-t lg:border-slate-100">POS NAM v1.0</div>
    </aside>
  );
};

