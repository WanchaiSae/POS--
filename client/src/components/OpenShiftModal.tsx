import { useState } from 'react';
import { usePosStore } from '../store/usePosStore';

export const OpenShiftModal = () => {
  const user = usePosStore((state) => state.user);
  const openShift = usePosStore((state) => state.openShift);
  const logout = usePosStore((state) => state.logout);
  const loading = usePosStore((state) => state.loading);
  const error = usePosStore((state) => state.error);
  const [amount, setAmount] = useState('2000');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-800">เปิดกะทำงาน</h3>
        <p className="text-sm text-slate-500 mt-1">สวัสดี {user?.name} กรุณากรอกเงินทอนเริ่มต้นในลิ้นชัก</p>
        <label className="block text-xs font-semibold text-slate-600 mt-4 mb-1">เงินสดเริ่มต้นในลิ้นชัก (บาท)</label>
        <input type="number" min={0} value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold" />
        {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={logout} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium">ออกจากระบบ</button>
          <button type="button" disabled={loading} onClick={() => void openShift(Number(amount) || 0)} className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold disabled:opacity-40">เปิดกะ</button>
        </div>
      </div>
    </div>
  );
};
