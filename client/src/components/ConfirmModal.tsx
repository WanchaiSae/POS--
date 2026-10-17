import { useEffect } from 'react';
import { CloseIcon, TrashIcon } from './Icons';

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export const ConfirmModal = ({ title, description, confirmLabel = 'ยืนยัน', cancelLabel = 'ยกเลิก', onConfirm, onCancel, busy = false }: ConfirmModalProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onCancel]);

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-describedby="confirm-modal-description" className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-900/20">
      <div className="flex justify-end px-4 pt-4"><button type="button" aria-label="ปิดหน้าต่าง" onClick={onCancel} disabled={busy} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"><CloseIcon className="h-5 w-5" /></button></div>
      <div className="px-7 pb-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-8 ring-rose-50/60"><TrashIcon className="h-6 w-6" /></div>
        <h2 id="confirm-modal-title" className="text-lg font-bold text-slate-800">{title}</h2>
        <p id="confirm-modal-description" className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-6 flex gap-3"><button type="button" onClick={onCancel} disabled={busy} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">{cancelLabel}</button><button type="button" onClick={onConfirm} disabled={busy} className="flex-1 rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-600 disabled:opacity-60">{busy ? 'กำลังดำเนินการ…' : confirmLabel}</button></div>
      </div>
    </section>
  </div>;
};
