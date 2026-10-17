import { useState } from 'react';
import { cartTotals, usePosStore } from '../store/usePosStore';
import { lineSubtotal } from '../types/pos';
import { PlusIcon, MinusIcon, TrashIcon, CloseIcon } from './Icons';

export const CartSidebar = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  className,
  onClose,
}: {
  items: ReturnType<typeof usePosStore.getState>['cart'];
  onUpdateQuantity: (lineId: string, delta: number) => void;
  onRemoveItem: (lineId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  className?: string;
  onClose?: () => void;
}) => {
  const selectedCustomer = usePosStore((state) => state.selectedCustomer);
  const setCustomer = usePosStore((state) => state.setCustomer);
  const fetchCustomers = usePosStore((state) => state.fetchCustomers);
  const registerCustomer = usePosStore((state) => state.registerCustomer);
  const [phone, setPhone] = useState('');
  const totals = cartTotals(items, selectedCustomer);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const lookup = async () => {
    const normalizedPhone = phone.replace(/\D/g, '');
    await fetchCustomers(normalizedPhone);
    const found = usePosStore.getState().customers.find((customer) => customer.phone_number === normalizedPhone);
    if (found) setCustomer(found);
  };

  return (
    <aside className={`${className || 'w-80 xl:w-96'} min-w-0 bg-white border-l border-slate-100 flex-col justify-between p-4 sm:p-5 flex-shrink-0 overflow-hidden`}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">รายการในตะกร้า</h2>
          <div className="flex items-center gap-3">{items.length > 0 && <button type="button" onClick={onClearCart} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"><TrashIcon className="w-3.5 h-3.5" />ล้างตะกร้า</button>}{onClose && <button type="button" aria-label="ปิดตะกร้า" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><CloseIcon className="w-5 h-5" /></button>}</div>
        </div>

        <div className="py-3 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 mb-1">สมาชิก (ค้นหาด้วยเบอร์โทร)</p>
          <div className="flex gap-2">
            <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="numeric" placeholder="0812345678" aria-label="เบอร์โทรสมาชิก" className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
            <button type="button" onClick={() => void lookup()} className="px-2 rounded-lg bg-slate-100 text-xs font-semibold">ค้นหา</button>
          </div>
          {selectedCustomer ? (
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-semibold">{selectedCustomer.first_name} {selectedCustomer.last_name} · {selectedCustomer.tier} · {selectedCustomer.points} แต้ม</span>
              <button type="button" className="text-slate-400" onClick={() => setCustomer(null)}>นำออก</button>
            </div>
          ) : phone.replace(/\D/g, '').length >= 9 && (
            <button type="button" className="mt-2 text-[11px] text-orange-600 font-semibold" onClick={() => void registerCustomer({ phone_number: phone.replace(/\D/g, ''), first_name: 'ลูกค้าใหม่' })}>
              ไม่พบสมาชิก · สมัครสมาชิกใหม่
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto pr-1 mt-1 xl:max-h-[calc(100vh-430px)]">
          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-400"><span className="text-3xl block mb-2">🛒</span><p className="text-sm">ยังไม่มีสินค้าในตะกร้า</p></div>
          ) : items.map((item) => (
            <div key={item.lineId} className="py-3 flex items-center justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100"><img src={item.product.image_url || ''} alt={item.product.name} className="w-full h-full object-cover" /></div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-800 truncate">{item.product.name}</h4>
                {item.options.length > 0 && <p className="text-[10px] text-slate-400 truncate">{item.options.map((option) => option.name).join(', ')}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <button type="button" aria-label="ลดจำนวน" onClick={() => onUpdateQuantity(item.lineId, -1)} className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center"><MinusIcon className="w-3 h-3" /></button>
                  <span className="text-xs font-semibold min-w-4 text-center">{item.quantity}</span>
                  <button type="button" aria-label="เพิ่มจำนวน" onClick={() => onUpdateQuantity(item.lineId, 1)} className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center"><PlusIcon className="w-3 h-3" /></button>
                  <button type="button" aria-label="นำสินค้าออก" onClick={() => onRemoveItem(item.lineId)} className="text-slate-300 hover:text-rose-500 ml-1"><TrashIcon className="w-3 h-3" /></button>
                </div>
              </div>
              <span className="text-sm font-bold">฿{lineSubtotal(item).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 pt-3 sm:pt-4 border-t border-slate-100 space-y-2 sm:space-y-3">
        <div className="flex justify-between text-xs text-slate-500"><span>จำนวนสินค้า</span><span>{itemCount} รายการ · ฿{totals.subtotal.toLocaleString()}</span></div>
        <div className="flex justify-between text-xs text-slate-500"><span>ส่วนลดสมาชิก</span><span>฿{totals.discount.toLocaleString()}</span></div>
        {selectedCustomer && <div className="flex justify-between text-xs text-emerald-600"><span>แต้มที่จะได้รับ</span><span>+{totals.points}</span></div>}
        <div className="flex justify-between items-center pt-1"><span className="text-base font-bold">ยอดสุทธิ</span><span className="text-2xl font-extrabold text-orange-500">฿{totals.net.toLocaleString()}</span></div>
        <button type="button" onClick={onClearCart} disabled={!items.length} className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm disabled:opacity-40">ยกเลิกรายการ</button>
        <button type="button" onClick={onCheckout} disabled={!items.length} className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30 disabled:opacity-40">ชำระเงิน</button>
      </div>
    </aside>
  );
};
