import { useEffect, useState } from 'react';
import { usePosStore } from '../store/usePosStore';
import { toNumber, type OrderRecord } from '../types/pos';
import { OrderDetailModal } from '../components/OrderDetailModal';

const paymentLabel = (value: string) => ({ CASH: 'เงินสด', QR_CODE: 'พร้อมเพย์ / QR', CREDIT_CARD: 'บัตรเครดิต' }[value] || value);

export const OrdersPage = () => {
  const orders = usePosStore((state) => state.orders);
  const fetchOrders = usePosStore((state) => state.fetchOrders);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  return <div className="bg-white rounded-3xl border border-slate-100 p-5 overflow-auto">
    <h3 className="text-lg font-bold mb-4">รายการคำสั่งซื้อ</h3>
    <table className="w-full min-w-[820px] table-fixed text-sm">
      <thead className="text-left text-xs text-slate-500 border-b"><tr><th className="w-36 px-3 py-3">พนักงาน</th><th className="w-48 px-3">ลูกค้า</th><th className="w-36 px-3">ช่องทางชำระ</th><th className="w-32 px-3">สถานะ</th><th className="w-36 px-3 text-right">ยอดสุทธิ</th><th className="w-48 px-3">วันและเวลา</th></tr></thead>
      <tbody>{orders.map((order) => <tr key={order.id} role="button" tabIndex={0} aria-label={`ดูรายละเอียดคำสั่งซื้อ ${order.order_number}`} onClick={() => setSelectedOrder(order)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedOrder(order); } }} className="cursor-pointer border-b border-slate-50 hover:bg-orange-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400"><td className="px-3 py-3 truncate">{order.user?.name || '-'}</td><td className="px-3 py-3 truncate">{order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || order.customer.phone_number : 'ลูกค้าทั่วไป'}</td><td className="px-3 py-3 whitespace-nowrap">{paymentLabel(order.payment_method)}</td><td className="px-3 py-3 whitespace-nowrap">{order.payment_status === 'COMPLETED' ? 'ชำระแล้ว' : order.payment_status}</td><td className="px-3 py-3 text-right font-bold text-orange-500 whitespace-nowrap">฿{toNumber(order.net_amount).toLocaleString()}</td><td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{order.created_at || '—'}</td></tr>)}
      {orders.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-slate-400">ยังไม่มีรายการสั่งซื้อ</td></tr>}</tbody>
    </table>
    {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
  </div>;
};
