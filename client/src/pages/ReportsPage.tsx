import { useEffect, useMemo, useState } from 'react';
import { usePosStore } from '../store/usePosStore';
import { toNumber, type OrderRecord } from '../types/pos';
import { OrderDetailModal } from '../components/OrderDetailModal';

const localDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseOrderDate = (value?: string | null) => {
  if (!value) return null;
  const thaiDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s-\s(\d{2}):(\d{2})$/);
  if (thaiDate) {
    const [, day, month, buddhistYear, hour, minute] = thaiDate;
    return new Date(Number(buddhistYear) - 543, Number(month) - 1, Number(day), Number(hour), Number(minute));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatOrderDate = (value?: string | null) => {
  const date = parseOrderDate(value);
  return date ? date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
};

const orderCustomer = (order: OrderRecord) => order.customer
  ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || order.customer.phone_number
  : 'ลูกค้าทั่วไป';

const csvCell = (value: string | number) => {
  let text = String(value);
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char] || char));

export const ReportsPage = () => {
  const orders = usePosStore((state) => state.orders);
  const fetchOrders = usePosStore((state) => state.fetchOrders);
  const today = localDateValue(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [showAllMenus, setShowAllMenus] = useState(false);
  const [menuPage, setMenuPage] = useState(1);
  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  const completedOrders = useMemo(() => {
    const from = startDate ? new Date(`${startDate}T${startTime || '00:00'}:00`) : null;
    const to = endDate ? new Date(`${endDate}T${endTime || '23:59'}:59`) : null;
    return orders.filter((order) => {
      if (order.payment_status !== 'COMPLETED') return false;
      const date = parseOrderDate(order.created_at);
      if (!date) return false;
      return (!from || date >= from) && (!to || date <= to);
    }).sort((a, b) => (parseOrderDate(b.created_at)?.getTime() || 0) - (parseOrderDate(a.created_at)?.getTime() || 0));
  }, [orders, startDate, endDate, startTime, endTime]);

  const sales = completedOrders.reduce((sum, order) => sum + toNumber(order.net_amount), 0);
  const averageOrder = completedOrders.length ? sales / completedOrders.length : 0;
  const salesByDay = useMemo(() => {
    const totals = new Map<string, number>();
    completedOrders.forEach((order) => {
      const date = parseOrderDate(order.created_at);
      if (!date) return;
      const key = localDateValue(date);
      totals.set(key, (totals.get(key) || 0) + toNumber(order.net_amount));
    });
    return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [completedOrders]);
  const menuSales = useMemo(() => {
    const totals = new Map<number, { name: string; quantity: number; sales: number }>();
    completedOrders.forEach((order) => order.items?.forEach((item) => {
      const current = totals.get(item.product_id) || {
        name: item.product?.name || `สินค้า #${item.product_id}`,
        quantity: 0,
        sales: 0,
      };
      current.quantity += toNumber(item.quantity);
      current.sales += toNumber(item.subtotal);
      totals.set(item.product_id, current);
    }));
    return [...totals.entries()].map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.quantity - a.quantity || b.sales - a.sales);
  }, [completedOrders]);
  const totalMenuItems = menuSales.reduce((sum, item) => sum + item.quantity, 0);
  const maxDaySales = Math.max(...salesByDay.map(([, amount]) => amount), 1);
  const maxMenuQuantity = Math.max(...menuSales.map((item) => item.quantity), 1);
  const menuPageSize = 10;
  const menuPageCount = Math.ceil(menuSales.length / menuPageSize);
  const currentMenuPage = Math.min(menuPage, Math.max(menuPageCount, 1));
  const pagedMenuSales = menuSales.slice((currentMenuPage - 1) * menuPageSize, currentMenuPage * menuPageSize);
  const setQuickRange = (days: number | null) => {
    setStartTime('00:00');
    setEndTime('23:59');
    if (days === null) {
      setStartDate('');
      setEndDate('');
      return;
    }
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    setStartDate(localDateValue(start));
    setEndDate(localDateValue(end));
  };
  const exportRows = completedOrders.map((order) => [
    order.order_number,
    formatOrderDate(order.created_at),
    orderCustomer(order),
    order.payment_method,
    toNumber(order.net_amount).toFixed(2),
  ]);
  const headers = ['เลขที่คำสั่งซื้อ', 'วันที่และเวลา', 'สมาชิก', 'วิธีชำระเงิน', 'ยอดสุทธิ (บาท)'];
  const exportName = `รายงานยอดขาย_${startDate || 'ทั้งหมด'}_${endDate || 'ทั้งหมด'}`;

  const exportCsv = () => {
    const content = [headers, ...exportRows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const tableRows = [headers, ...exportRows].map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join('')}</tr>`).join('');
    const workbook = `<html><head><meta charset="utf-8"></head><body><h2>รายงานยอดขาย</h2><p>ช่วงวันที่ ${escapeHtml(startDate || 'ทั้งหมด')} ถึง ${escapeHtml(endDate || 'ทั้งหมด')} เวลา ${escapeHtml(startTime || '00:00')} ถึง ${escapeHtml(endTime || '23:59')}</p><p>ยอดขายสุทธิ ฿${sales.toFixed(2)} | ${completedOrders.length} รายการ</p><table border="1"><thead>${tableRows.slice(0, tableRows.indexOf('</tr>') + 5)}</thead><tbody>${tableRows.slice(tableRows.indexOf('</tr>') + 5)}</tbody></table></body></html>`;
    const url = URL.createObjectURL(new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportName}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = exportRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join('')}</tr>`).join('');
    printWindow.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${escapeHtml(exportName)}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#1e293b}h1{font-size:22px}p{color:#475569}table{border-collapse:collapse;width:100%;margin-top:20px;font-size:12px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#f1f5f9}.amount{text-align:right}@media print{body{padding:0}}</style></head><body><h1>รายงานยอดขาย</h1><p>ช่วงวันที่ ${escapeHtml(startDate || 'ทั้งหมด')} ถึง ${escapeHtml(endDate || 'ทั้งหมด')} เวลา ${escapeHtml(startTime || '00:00')} ถึง ${escapeHtml(endTime || '23:59')}</p><p>ยอดขายสุทธิ ฿${sales.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ${completedOrders.length} รายการ · เฉลี่ย ฿${averageOrder.toFixed(2)}</p><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="5">ไม่มีรายการขายในช่วงเวลานี้</td></tr>`}</tbody></table><script>window.onload=()=>{window.print()}</script></body></html>`);
    printWindow.document.close();
  };

  return <div className="space-y-4 overflow-auto">
    <header><h2 className="text-xl font-bold">รายงาน</h2><p className="mt-1 text-sm text-slate-500">เลือกวันที่และช่วงเวลาที่ต้องการดู แล้วส่งออกรายงานได้</p></header>
    <section className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-semibold text-slate-600">ตั้งแต่วันที่<input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" /></label>
        <label className="text-xs font-semibold text-slate-600">เวลาเริ่ม<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" /></label>
        <label className="text-xs font-semibold text-slate-600">ถึงวันที่<input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" /></label>
        <label className="text-xs font-semibold text-slate-600">เวลาสิ้นสุด<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" /></label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold text-slate-500">ช่วงเวลา:</span>
        <button type="button" onClick={() => setQuickRange(1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600">วันนี้</button>
        <button type="button" onClick={() => setQuickRange(7)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600">7 วัน</button>
        <button type="button" onClick={() => setQuickRange(30)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600">30 วัน</button>
        <button type="button" onClick={() => setQuickRange(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600">ทั้งหมด</button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={exportCsv} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">ส่งออก CSV</button>
        <button type="button" onClick={exportExcel} className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100">ส่งออก Excel</button>
        <button type="button" onClick={exportPdf} className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100">ส่งออก PDF</button>
      </div>
    </section>
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="rounded-3xl border border-slate-100 bg-white p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div><h3 className="font-bold">กราฟยอดขายรายวัน</h3><p className="mt-1 text-xs text-slate-500">แสดงยอดสุทธิครบทุกวันที่มีรายการในช่วงเวลาที่เลือก · {salesByDay.length} วัน</p></div>
          <span className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-600">฿{sales.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</span>
        </div>
        {salesByDay.length ? <div className="flex h-48 items-end gap-2 overflow-x-auto border-b border-slate-100 px-1">
          {salesByDay.map(([day, amount]) => <div key={day} title={`${day}: ฿${amount.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`} className="flex h-full min-w-9 flex-1 flex-col items-center justify-end gap-2">
            <span className="max-w-14 truncate text-[10px] text-slate-500">฿{amount.toLocaleString('th-TH', { notation: 'compact', maximumFractionDigits: 1 })}</span>
            <div role="img" aria-label={`${day} ยอดขาย ${amount} บาท`} className="w-full max-w-12 rounded-t-lg bg-orange-400 transition-all hover:bg-orange-600" style={{ height: `${Math.max((amount / maxDaySales) * 72, 4)}%` }} />
            <span className="pb-2 text-[10px] text-slate-500">{day.slice(5)}</span>
          </div>)}
        </div> : <p className="py-12 text-center text-sm text-slate-400">ยังไม่มียอดขายในช่วงเวลานี้</p>}
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div><h3 className="font-bold">เมนูขายดี</h3><p className="mt-1 text-xs text-slate-500">จัดอันดับจากจำนวนที่ขายได้ในช่วงวันที่เลือก</p></div>
          <span className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">ขายแล้ว {totalMenuItems.toLocaleString()} ชิ้น</span>
        </div>
        {menuSales.length ? <div className="space-y-4">
          {menuSales.slice(0, 5).map((item, index) => <div key={item.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate"><span className="mr-2 text-xs font-bold text-slate-400">{index + 1}.</span>{item.name}</span><span className="shrink-0 font-semibold">{item.quantity.toLocaleString()} ชิ้น <span className="ml-2 text-xs font-normal text-slate-500">฿{item.sales.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</span></span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-400" style={{ width: `${(item.quantity / maxMenuQuantity) * 100}%` }} /></div>
          </div>)}
          {menuSales.length > 5 && <button type="button" onClick={() => { setMenuPage(1); setShowAllMenus(true); }} className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100">ดูเมนูทั้งหมด ({menuSales.length})</button>}
        </div> : <p className="py-12 text-center text-sm text-slate-400">ไม่มีรายละเอียดเมนูในรายการขายช่วงนี้</p>}
      </div>
    </section>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="rounded-3xl border border-slate-100 bg-white p-5"><p className="text-xs text-slate-500">ยอดขายสุทธิ</p><p className="text-2xl font-black text-orange-500">฿{sales.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</p></div>
      <div className="rounded-3xl border border-slate-100 bg-white p-5"><p className="text-xs text-slate-500">คำสั่งซื้อที่ชำระแล้ว</p><p className="text-2xl font-black">{completedOrders.length.toLocaleString()}</p></div>
      <div className="rounded-3xl border border-slate-100 bg-white p-5"><p className="text-xs text-slate-500">ยอดเฉลี่ยต่อคำสั่งซื้อ</p><p className="text-2xl font-black">฿{averageOrder.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</p></div>
    </div>
    <section className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">รายการขาย</h3><span className="text-xs text-slate-500">{completedOrders.length.toLocaleString()} รายการ</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] table-fixed text-sm"><thead className="border-b text-left text-xs text-slate-500"><tr><th className="w-40 px-3 py-3">เลขที่คำสั่งซื้อ</th><th className="w-48 px-3">วันที่และเวลา</th><th className="w-48 px-3">สมาชิก</th><th className="w-36 px-3">วิธีชำระเงิน</th><th className="w-36 px-3 text-right">ยอดสุทธิ</th></tr></thead><tbody>
        {completedOrders.map((order) => <tr key={order.id} role="button" tabIndex={0} aria-label={`ดูรายละเอียดคำสั่งซื้อ ${order.order_number}`} onClick={() => setSelectedOrder(order)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedOrder(order); } }} className="cursor-pointer border-b border-slate-50 hover:bg-orange-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400"><td className="whitespace-nowrap px-3 py-3 font-medium">{order.order_number}</td><td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{formatOrderDate(order.created_at)}</td><td className="truncate px-3 py-3">{orderCustomer(order)}</td><td className="whitespace-nowrap px-3 py-3">{order.payment_method}</td><td className="whitespace-nowrap px-3 py-3 text-right font-bold text-orange-500">฿{toNumber(order.net_amount).toLocaleString()}</td></tr>)}
        {completedOrders.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-400">ไม่พบรายการขายในวันที่และช่วงเวลาที่เลือก</td></tr>}</tbody></table></div>
    </section>
    {showAllMenus && <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAllMenus(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="all-menu-sales-title" className="flex h-[90dvh] max-h-[48rem] min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h2 id="all-menu-sales-title" className="text-lg font-bold">เมนูขายดีทั้งหมด</h2><p className="mt-1 text-xs text-slate-500">{menuSales.length} เมนู · ขายได้ {totalMenuItems.toLocaleString()} ชิ้นตามช่วงเวลาที่เลือก</p></div>
          <button type="button" autoFocus onClick={() => setShowAllMenus(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">ปิด</button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          {pagedMenuSales.map((item, index) => <div key={item.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate"><span className="mr-2 text-xs font-bold text-slate-400">{(currentMenuPage - 1) * menuPageSize + index + 1}.</span>{item.name}</span><span className="shrink-0 font-semibold">{item.quantity.toLocaleString()} ชิ้น <span className="ml-2 text-xs font-normal text-slate-500">฿{item.sales.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</span></span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-400" style={{ width: `${(item.quantity / maxMenuQuantity) * 100}%` }} /></div>
          </div>)}
        </div>
        {menuSales.length > menuPageSize && <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
          <button type="button" disabled={currentMenuPage === 1} onClick={() => setMenuPage((page) => Math.max(page - 1, 1))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">ก่อนหน้า</button>
          <span className="text-sm text-slate-600">หน้า {currentMenuPage} / {menuPageCount}</span>
          <button type="button" disabled={currentMenuPage === menuPageCount} onClick={() => setMenuPage((page) => Math.min(page + 1, menuPageCount))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">ถัดไป</button>
        </footer>}
      </section>
    </div>}
    {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
  </div>;
};
