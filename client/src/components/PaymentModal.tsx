import { useEffect, useState } from 'react';
import type { CartItem, UiPaymentMethod } from '../types/pos';
import { lineSubtotal, mapPaymentMethod } from '../types/pos';
import { CheckIcon, CloseIcon } from './Icons';
import { usePosStore } from '../store/usePosStore';
import { api, type ApiResponse } from '../api/client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalAmount: number;
  onSuccess: () => void;
}

export const PaymentModal = ({ isOpen, onClose, items, totalAmount, onSuccess }: PaymentModalProps) => {
  const checkout = usePosStore((state) => state.checkout);
  const lastOrder = usePosStore((state) => state.lastOrder);
  const loading = usePosStore((state) => state.loading);
  const error = usePosStore((state) => state.error);
  const user = usePosStore((state) => state.user);
  const accessToken = usePosStore((state) => state.accessToken);
  const [method, setMethod] = useState<UiPaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState(totalAmount);
  const [paid, setPaid] = useState(false);
  const [receiptItems, setReceiptItems] = useState<CartItem[]>(items);
  const [showKeypad, setShowKeypad] = useState(false);
  const [firstKey, setFirstKey] = useState(true);
  const [promptPayPayload, setPromptPayPayload] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && method === 'promptpay') {
      setPromptPayPayload(null);
      void api.get<ApiResponse<{ payload: string | null }>>('/settings/promptpay/qr', {
        params: { amount: totalAmount },
        headers: { Authorization: `Bearer ${accessToken || ''}` },
      }).then((response) => setPromptPayPayload(response.data.data.payload))
        .catch(() => setPromptPayPayload(null));
    }
  }, [isOpen, method, totalAmount, user?.id, accessToken]);

  useEffect(() => {
    if (isOpen) {
      setCashReceived(totalAmount);
      setPaid(false);
      setShowKeypad(false);
      setFirstKey(true);
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;
  const change = Math.max(0, cashReceived - totalAmount);
  const enoughCash = method !== 'cash' || cashReceived >= totalAmount;

  const press = (key: string) => {
    if (key === 'C') { setCashReceived(0); setFirstKey(false); return; }
    if (key === 'backspace') { setCashReceived((value) => Math.floor(value / 10)); setFirstKey(false); return; }
    setCashReceived((value) => {
      const next = Number((firstKey || value === 0 ? '' : String(value)) + key);
      return Number.isFinite(next) ? next : value;
    });
    setFirstKey(false);
  };

  const pay = async () => {
    if (!enoughCash) return;
    const snapshot = items;
    const order = await checkout(mapPaymentMethod(method));
    if (order) { setReceiptItems(snapshot); setPaid(true); }
  };

  const finish = () => {
    setPaid(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[94dvh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{paid ? 'ใบเสร็จรับเงิน' : 'ชำระเงิน'}</h3>
          <button type="button" aria-label="ปิด" onClick={onClose} className="p-1 rounded-full text-slate-400"><CloseIcon className="w-5 h-5" /></button>
        </div>
        {paid ? (
          <div className="p-6 text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4"><CheckIcon className="w-8 h-8" /></div>
            <h4 className="text-xl font-bold text-slate-800 mb-1">ชำระเงินสำเร็จ</h4>
            <p className="text-xs text-slate-500 mb-4">เลขที่อ้างอิง: {lastOrder?.order_number || '-'}</p>
            <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs space-y-2 mb-6 border border-slate-100">
              <div className="flex justify-between font-semibold text-slate-700 pb-2 border-b"><span>รายการ ({receiptItems.length})</span><span>จำนวนเงิน</span></div>
              {receiptItems.map((item) => <div key={item.lineId} className="flex justify-between text-slate-600"><span>{item.product.name} × {item.quantity}</span><span>฿{lineSubtotal(item).toLocaleString()}</span></div>)}
              <div className="pt-2 border-t flex justify-between font-bold text-sm"><span>ยอดชำระ</span><span className="text-orange-500">฿{totalAmount.toLocaleString()}</span></div>
              {method === 'cash' && <><div className="flex justify-between text-slate-500"><span>รับเงินมา</span><span>฿{cashReceived.toLocaleString()}</span></div><div className="flex justify-between text-emerald-600 font-semibold"><span>เงินทอน</span><span>฿{change.toLocaleString()}</span></div></>}
            </div>
            <button type="button" onClick={finish} className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-bold">เริ่มรายการใหม่</button>
          </div>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            <div className="text-center pb-4 border-b"><span className="text-xs font-medium text-slate-500">ยอดที่ต้องชำระ</span><p className="text-4xl font-extrabold text-orange-500 mt-1">฿{totalAmount.toLocaleString()}</p></div>
            <div className="grid grid-cols-3 gap-2.5">
              {([
                ['cash', 'เงินสด'], ['promptpay', 'พร้อมเพย์ QR'], ['credit', 'บัตรเครดิต'],
              ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => { setMethod(value); setShowKeypad(false); }} className={method === value ? 'py-3 px-2 rounded-2xl border border-orange-500 bg-orange-50 text-orange-600 text-xs font-semibold' : 'py-3 px-2 rounded-2xl border border-slate-200 text-slate-600 text-xs'}>{label}</button>)}
            </div>
            {method === 'cash' && <div className="space-y-3">
              <div className="flex items-center justify-between"><label className="text-xs font-semibold text-slate-700">จำนวนเงินที่รับ</label><button type="button" onClick={() => setShowKeypad((shown) => !shown)} className="text-xs text-orange-600">{showKeypad ? 'ซ่อนแป้นตัวเลข' : 'เปิดแป้นตัวเลข'}</button></div>
              <input readOnly value={cashReceived.toLocaleString()} aria-label="จำนวนเงินที่รับ" onFocus={() => { setShowKeypad(true); setFirstKey(true); }} className="w-full text-center text-2xl font-black rounded-2xl py-2.5 bg-slate-50 border border-slate-200" />
              <div className="flex gap-2">{[totalAmount, 300, 500, 1000].map((amount, index) => <button key={index} type="button" onClick={() => { setCashReceived(amount); setFirstKey(true); }} className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700">{index === 0 ? 'พอดี' : '฿' + amount.toLocaleString()}</button>)}</div>
              {showKeypad && <div className="grid grid-cols-3 gap-2">{['1','2','3','4','5','6','7','8','9','C','0','backspace'].map((key) => <button key={key} type="button" onClick={() => press(key)} className="py-3 rounded-xl bg-slate-100 font-bold">{key === 'backspace' ? 'ลบ' : key}</button>)}</div>}
              <p className={enoughCash ? 'text-xs text-emerald-600' : 'text-xs text-rose-500'}>เงินทอน: ฿{change.toLocaleString()}</p>
            </div>}
            {method === 'promptpay' && <div className="text-center space-y-2">
              {promptPayPayload ? <img className="mx-auto w-40 h-40" alt="QR พร้อมเพย์" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(promptPayPayload)}`} /> : <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">ตั้งค่าเบอร์พร้อมเพย์ของร้านก่อน จึงจะสร้าง QR รับเงินได้</p>}
              <p className="text-xs font-semibold text-slate-700">{promptPayPayload ? `สแกน QR เพื่อชำระ ฿${totalAmount.toFixed(2)}` : 'ยังไม่ได้ตั้งค่าเบอร์พร้อมเพย์ หรือโหลด QR ไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ'}</p>
            </div>}
            {method === 'credit' && <p className="text-center text-sm text-slate-600 py-6">ชำระผ่านเครื่องรูดบัตร EDC</p>}
            {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
            <button type="button" onClick={() => void pay()} disabled={!enoughCash || loading} className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-bold disabled:opacity-40">{loading ? 'กำลังดำเนินการ...' : 'ยืนยันการชำระเงิน'}</button>
          </div>
        )}
      </div>
    </div>
  );
};
