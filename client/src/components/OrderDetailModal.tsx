import type { OrderRecord } from '../types/pos';
import { toNumber } from '../types/pos';
import { CloseIcon } from './Icons';

const paymentLabel = (value: string) => ({ CASH: 'เงินสด', QR_CODE: 'พร้อมเพย์ / QR', CREDIT_CARD: 'บัตรเครดิต' }[value] || value);

export const OrderDetailModal = ({ order, onClose }: { order: OrderRecord; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
      <header className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
        <div><h2 id="order-detail-title" className="font-bold">รายละเอียดคำสั่งซื้อ</h2><p className="mt-1 text-xs text-slate-500">{order.order_number} · {order.created_at || '—'}</p></div>
        <button type="button" aria-label="ปิดรายละเอียด" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><CloseIcon className="h-5 w-5" /></button>
      </header>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
          <div><p className="text-xs text-slate-500">ลูกค้า</p><p className="mt-1 font-medium">{order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || order.customer.phone_number : 'ลูกค้าทั่วไป'}</p></div>
          <div><p className="text-xs text-slate-500">พนักงาน</p><p className="mt-1 font-medium">{order.user?.name || '—'}</p></div>
          <div><p className="text-xs text-slate-500">ช่องทางชำระเงิน</p><p className="mt-1 font-medium">{paymentLabel(order.payment_method)}</p></div>
          <div><p className="text-xs text-slate-500">สถานะ</p><p className="mt-1 font-medium">{order.payment_status === 'COMPLETED' ? 'ชำระแล้ว' : order.payment_status}</p></div>
        </div>
        <div><h3 className="mb-2 font-bold">สินค้าในคำสั่งซื้อ</h3><div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm"><thead className="border-b text-left text-xs text-slate-500"><tr><th className="py-2">สินค้า / ตัวเลือก</th><th className="px-2 text-center">จำนวน</th><th className="px-2 text-right">ราคาต่อหน่วย</th><th className="py-2 text-right">รวม</th></tr></thead><tbody>
          {(order.items || []).map((item) => <tr key={item.id} className="border-b border-slate-50"><td className="py-3"><p className="font-medium">{item.product?.name || `สินค้า #${item.product_id}`}</p>{item.selected_options && item.selected_options.length > 0 && <p className="mt-1 text-xs text-slate-500">{item.selected_options.map((option) => option.product_option?.name).filter(Boolean).join(' · ')}</p>}</td><td className="px-2 text-center">{item.quantity}</td><td className="px-2 text-right whitespace-nowrap">฿{toNumber(item.unit_price).toLocaleString()}</td><td className="py-3 text-right font-medium whitespace-nowrap">฿{toNumber(item.subtotal).toLocaleString()}</td></tr>)}
          {(!order.items || order.items.length === 0) && <tr><td colSpan={4} className="py-6 text-center text-slate-400">ไม่พบรายละเอียดสินค้าในคำสั่งซื้อนี้</td></tr>}
        </tbody></table></div></div>
        <div className="ml-auto max-w-xs space-y-2 border-t border-slate-100 pt-3 text-sm"><div className="flex justify-between text-slate-500"><span>ยอดรวม</span><span>฿{toNumber(order.total_amount).toLocaleString()}</span></div><div className="flex justify-between text-slate-500"><span>ส่วนลด</span><span>฿{toNumber(order.discount_amount).toLocaleString()}</span></div><div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold"><span>ยอดสุทธิ</span><span className="text-orange-500">฿{toNumber(order.net_amount).toLocaleString()}</span></div></div>
      </div>
    </section>
  </div>
);
