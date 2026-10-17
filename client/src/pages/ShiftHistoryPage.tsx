import { useEffect, useMemo, useState } from 'react';
import { usePosStore } from '../store/usePosStore';
import { toNumber } from '../types/pos';

export const ShiftHistoryPage = () => {
  const shifts = usePosStore((state) => state.shifts);
  const fetchShifts = usePosStore((state) => state.fetchShifts);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  useEffect(() => { void fetchShifts(); }, [fetchShifts]);

  const filteredShifts = useMemo(() => {
    const from = startDate ? new Date(`${startDate}T${startTime}:00`) : null;
    const to = endDate ? new Date(`${endDate}T${endTime}:59`) : null;
    const query = search.trim().toLocaleLowerCase('th-TH');
    return shifts.filter((shift) => {
      const employeeName = (shift.user?.name || `พนักงาน #${shift.user_id}`).toLocaleLowerCase('th-TH');
      if (query && !employeeName.includes(query)) return false;
      const dateText = shift.opened_at || '';
      const thaiDate = dateText.match(/^(\d{2})\/(\d{2})\/(\d{4})\s-\s(\d{2}):(\d{2})$/);
      const openedAt = thaiDate
        ? new Date(Number(thaiDate[3]) - 543, Number(thaiDate[2]) - 1, Number(thaiDate[1]), Number(thaiDate[4]), Number(thaiDate[5]))
        : new Date(dateText);
      if (Number.isNaN(openedAt.getTime())) return !from && !to;
      return (!from || openedAt >= from) && (!to || openedAt <= to);
    }).sort((a, b) => (b.id - a.id));
  }, [shifts, search, startDate, endDate, startTime, endTime]);

  return <div className="space-y-4 overflow-auto">
    <header>
      <h2 className="text-xl font-bold">ประวัติเวลาเปิด-ปิดกะ</h2>
      <p className="mt-1 text-sm text-slate-500">ตรวจสอบเวลาที่พนักงานเริ่มและสิ้นสุดกะแต่ละครั้ง</p>
    </header>
    <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 sm:p-5">
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2 xl:col-span-1">ค้นหาพนักงาน<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="พิมพ์ชื่อพนักงาน" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" /></label>
        <label className="text-xs font-semibold text-slate-600">ตั้งแต่วันที่<input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" /></label>
        <label className="text-xs font-semibold text-slate-600">เวลาเริ่ม<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" /></label>
        <label className="text-xs font-semibold text-slate-600">ถึงวันที่<input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" /></label>
        <label className="text-xs font-semibold text-slate-600">เวลาสิ้นสุด<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" /></label>
      </div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-bold">รายการกะพนักงาน</h3>
        <span className="text-xs text-slate-500">แสดง {filteredShifts.length.toLocaleString()} / {shifts.length.toLocaleString()} กะ</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b text-left text-xs text-slate-500">
            <tr><th className="px-3 py-3">พนักงาน</th><th className="px-3">เวลาเปิดกะ</th><th className="px-3">เวลาปิดกะ</th><th className="px-3 text-right">เงินเริ่มต้น</th><th className="px-3 text-right">ยอดนับเงินจริง</th><th className="px-3">สถานะ</th></tr>
          </thead>
          <tbody>
            {filteredShifts.map((shift) => <tr key={shift.id} className="border-b border-slate-50 last:border-0">
              <td className="px-3 py-3 font-medium">{shift.user?.name || `พนักงาน #${shift.user_id}`}</td>
              <td className="whitespace-nowrap px-3 text-slate-600">{shift.opened_at || '—'}</td>
              <td className="whitespace-nowrap px-3 text-slate-600">{shift.closed_at || '—'}</td>
              <td className="whitespace-nowrap px-3 text-right">฿{toNumber(shift.start_amount).toLocaleString()}</td>
              <td className="whitespace-nowrap px-3 text-right">{shift.actual_amount != null ? `฿${toNumber(shift.actual_amount).toLocaleString()}` : '—'}</td>
              <td className="px-3"><span className={shift.closed_at ? 'rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600' : 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700'}>{shift.closed_at ? 'ปิดกะแล้ว' : 'กำลังเปิดกะ'}</span></td>
            </tr>)}
            {filteredShifts.length === 0 && <tr><td colSpan={6} className="px-3 py-10 text-center text-slate-400">{shifts.length ? 'ไม่พบประวัติกะที่ตรงกับเงื่อนไข' : 'ยังไม่มีประวัติกะ'}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
};
