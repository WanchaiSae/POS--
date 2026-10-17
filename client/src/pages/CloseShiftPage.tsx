import { useState } from 'react';
import { usePosStore } from '../store/usePosStore';
import { toNumber } from '../types/pos';

export const CloseShiftPage = () => {
  const shift = usePosStore((state) => state.shift);
  const closeShift = usePosStore((state) => state.closeShift);
  const [actual, setActual] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!shift) return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6">
      <h2 className="text-lg font-bold">ปิดกะ</h2>
      <p className="mt-2 text-sm text-slate-500">ยังไม่มีกะที่เปิดอยู่</p>
    </section>
  );

  return (
    <section className="max-w-2xl rounded-3xl border border-slate-100 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold">ปิดกะ / ตรวจนับเงินสด</h2>
      <p className="mt-1 text-sm text-slate-500">นับเงินสดในลิ้นชักและกรอกยอดจริงเพื่อปิดกะ</p>
      <div className="mt-5 rounded-2xl bg-orange-50 p-4">
        <p className="text-sm text-slate-600">เงินสดเริ่มต้นในกะ</p>
        <p className="mt-1 text-2xl font-extrabold text-orange-600">฿{toNumber(shift.start_amount).toLocaleString()}</p>
      </div>
      <form className="mt-5 space-y-3" onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        const result = await closeShift(Number(actual) || 0);
        if (result) {
          setSummary(`ยอดระบบ ฿${toNumber(result.summary?.expected_drawer).toLocaleString()} · นับจริง ฿${toNumber(result.summary?.actual_amount).toLocaleString()} · ผลต่าง ฿${toNumber(result.summary?.difference).toLocaleString()}`);
        }
        setSaving(false);
      }}>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="actual-cash">เงินสดจริงในลิ้นชัก</label>
        <div className="flex flex-wrap gap-2">
          <input id="actual-cash" value={actual} onChange={(event) => setActual(event.target.value)} type="number" min="0" step="0.01" required placeholder="กรอกยอดเงินสด" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <button type="submit" disabled={saving} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'กำลังปิดกะ...' : 'ยืนยันปิดกะ'}</button>
        </div>
      </form>
      {summary && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{summary}</p>}
    </section>
  );
};
