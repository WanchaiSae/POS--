import { useState } from 'react';
import { usePosStore } from '../store/usePosStore';

export const LoginScreen = () => {
  const [pin, setPin] = useState('');
  const login = usePosStore((state) => state.login);
  const loading = usePosStore((state) => state.loading);
  const error = usePosStore((state) => state.error);

  const press = (key: string) => {
    if (key === 'C') return setPin('');
    if (key === 'backspace') return setPin((current) => current.slice(0, -1));
    setPin((current) => current.length < 6 ? current + key : current);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center font-['Prompt',sans-serif] p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl border border-slate-100 shadow-xl p-6">
        <h1 className="text-3xl font-black text-center mb-1">POS NAM</h1>
        <p className="text-center text-sm text-slate-500 mb-5">กรอก PIN เพื่อเข้าสู่ระบบ</p>
        <div className="h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl tracking-[0.4em] font-bold text-slate-800 mb-3">
          {pin ? '●'.repeat(pin.length) : '----'}
        </div>
        {error && <p className="text-center text-xs text-rose-500 mb-3">{error}</p>}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'backspace'].map((key) => (
            <button key={key} type="button" onClick={() => press(key)} className="h-12 rounded-xl bg-white border border-slate-200 font-bold text-lg hover:bg-slate-50 active:scale-95">
              {key === 'backspace' ? 'ลบ' : key}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void login(pin)} disabled={pin.length < 4 || loading} className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold disabled:opacity-40">
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
        <p className="text-[11px] text-slate-400 text-center mt-4 leading-5">
          PIN ตัวอย่าง: พนักงาน 1234 / ผู้จัดการ 2222 / ผู้ดูแลระบบ 9999
        </p>
      </div>
    </div>
  );
};
