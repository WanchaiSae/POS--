import { useMemo, useState } from 'react';
import type { Product, ProductOption } from '../types/pos';
import { toNumber } from '../types/pos';
import { CloseIcon } from './Icons';

const canonicalGroup = (group: string) => {
  const key = group.trim().toLowerCase();
  if (['size', 'ขนาด'].includes(key)) return 'ขนาด';
  if (['sweetness', 'ความหวาน', 'ระดับความหวาน'].includes(key)) return 'ระดับความหวาน';
  if (['topping', 'ท็อปปิ้ง', 'ท็อปปิง'].includes(key)) return 'ท็อปปิง';
  return group.trim();
};

const optionKey = (group: string, option: ProductOption) => {
  if (group === 'ขนาด') {
    const size = option.name.match(/\b([SML])\b/i)?.[1]?.toUpperCase();
    if (size) return `size-${size}`;
  }
  if (group === 'ระดับความหวาน') {
    const percent = option.name.match(/(\d+)\s*%/)?.[1];
    if (percent) return `sweetness-${percent}`;
  }
  return option.name.trim().toLowerCase().replace(/\s+/g, ' ');
};

const optionLabel = (group: string, option: ProductOption) => {
  if (group === 'ขนาด') {
    const size = option.name.match(/\b([SML])\b/i)?.[1]?.toUpperCase();
    if (size) return `ขนาด ${size}`;
  }
  if (group === 'ระดับความหวาน') {
    const percent = option.name.match(/(\d+)\s*%/)?.[1];
    if (percent) return `หวาน ${percent}%`;
  }
  return option.name;
};

interface OptionModalProps {
  product: Product;
  options: ProductOption[];
  onClose: () => void;
  onConfirm: (selected: ProductOption[]) => void;
}

export const OptionModal = ({ product, options, onClose, onConfirm }: OptionModalProps) => {
  const groups = useMemo(() => {
    const grouped = new Map<string, ProductOption[]>();
    options.forEach((option) => {
      const group = canonicalGroup(option.group_name);
      const list = grouped.get(group) || [];
      if (!list.some((item) => optionKey(group, item) === optionKey(group, option))) {
        grouped.set(group, [...list, option]);
      }
    });
    return Array.from(grouped.entries());
  }, [options]);
  const [selected, setSelected] = useState<Record<string, number[]>>({});
  const resolved = groups.reduce<Record<string, number[]>>((result, [group, list]) => {
    result[group] = selected[group] ?? (group === 'ท็อปปิง' ? [] : list[0] ? [list[0].id] : []);
    return result;
  }, {});
  const toggle = (group: string, option: ProductOption) => setSelected((previous) => {
    const current = previous[group] ?? (group === 'ท็อปปิง' ? [] : groups.find(([name]) => name === group)?.[1].slice(0, 1).map((item) => item.id) ?? []);
    return { ...previous, [group]: group === 'ท็อปปิง'
      ? current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id]
      : [option.id] };
  });
  const chosen = options.filter((option) => Object.values(resolved).some((ids) => ids.includes(option.id)));
  const total = toNumber(product.base_price) + chosen.reduce((sum, option) => sum + toNumber(option.extra_price), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="max-h-[92dvh] w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div><h3 className="font-bold text-slate-800">{product.name}</h3><p className="text-xs text-slate-500">เลือกขนาด ความหวาน และท็อปปิง</p></div>
          <button type="button" aria-label="ปิด" onClick={onClose} className="p-1 text-slate-400"><CloseIcon className="w-5 h-5" /></button>
        </div>
        <div className="max-h-[60dvh] space-y-4 overflow-y-auto p-4 sm:p-5">
          {groups.map(([group, list]) => (
            <div key={group}>
              <p className="text-xs font-bold text-slate-600 mb-2">
                {group}
                {group === 'ท็อปปิง' ? ' (เลือกได้หลายอย่าง)' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {list.map((option) => {
                  const active = (resolved[group] || []).includes(option.id);
                  return <button key={option.id} type="button" onClick={() => toggle(group, option)} className={active ? 'px-3 py-2 rounded-xl border border-orange-500 bg-orange-50 text-orange-600 text-xs font-medium' : 'px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium'}>
                    {optionLabel(group, option)}{toNumber(option.extra_price) > 0 ? ' +฿' + toNumber(option.extra_price) : ''}
                  </button>;
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 sm:p-5">
          <span className="text-lg font-extrabold text-orange-500">฿{total.toLocaleString()}</span>
          <button type="button" onClick={() => onConfirm(chosen)} className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white sm:px-5">เพิ่มลงตะกร้า</button>
        </div>
      </div>
    </div>
  );
};
