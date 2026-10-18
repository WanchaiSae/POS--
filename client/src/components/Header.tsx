import {SearchIcon, UserIcon } from './Icons';
import { usePosStore } from '../store/usePosStore';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header = ({ searchQuery, onSearchChange }: HeaderProps) => {
  const user = usePosStore((state) => state.user);
  // const shift = usePosStore((state) => state.shift);
  const logout = usePosStore((state) => state.logout);

  return (
    <header className="relative z-20 flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-100 bg-white px-3 py-2 sm:px-4 lg:h-16 lg:flex-nowrap lg:px-6">
      <h1 className="shrink-0 select-none text-lg font-black tracking-tight text-slate-900 sm:text-xl lg:text-2xl">POS CAFE</h1>
      <div className="relative order-last w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-sm lg:w-80 lg:flex-none xl:w-96">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <SearchIcon className="w-4 h-4" />
        </div>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="ค้นหาสินค้า..."
          aria-label="ค้นหาสินค้า"
          className="w-full bg-slate-100/90 text-slate-700 placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:bg-white transition-all"
        />
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 lg:gap-4">
        {/* <button type="button" title={shift ? 'กะกำลังเปิดอยู่' : 'ไม่มีกะที่เปิดอยู่'} aria-label="สถานะกะ" className="relative rounded-full p-1.5 text-slate-600 hover:bg-slate-100 sm:p-2">
          <BellIcon className="w-5 h-5" />
          {shift && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white" />}
        </button> */}
        <div className="flex items-center gap-1.5 pl-1 text-slate-800 sm:gap-2.5 sm:pl-2">
          <div className="hidden h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 sm:flex">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="text-right">
            <p className="max-w-24 truncate text-xs font-semibold leading-tight sm:max-w-32 sm:text-sm">{user?.name || 'แคชเชียร์'}</p>
            <p className="text-[9px] uppercase text-slate-400 sm:text-[10px]">{user?.role}</p>
          </div>
          <button type="button" onClick={logout} className="ml-1 text-[10px] text-slate-400 hover:text-rose-500 sm:ml-2 sm:text-[11px]">ออกจากระบบ</button>
        </div>
      </div>
    </header>
  );
};
