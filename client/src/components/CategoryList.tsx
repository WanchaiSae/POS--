import type { Category } from '../types/pos';
import { categoryIcon } from '../types/pos';
import { DrinkCupIcon, FoodBowlIcon, BakeryBreadIcon, DessertSweetIcon, InfinityMoreIcon } from './Icons';

interface CategoryListProps {
  categories: Category[];
  selectedCategoryId: number | 'all';
  onSelectCategory: (id: number | 'all') => void;
}

export const CategoryList = ({ categories, selectedCategoryId, onSelectCategory }: CategoryListProps) => {
  const getCategoryIcon = (name: string) => {
    switch (name) {
      case 'cup': return <DrinkCupIcon className="w-6 h-6" />;
      case 'bowl': return <FoodBowlIcon className="w-6 h-6" />;
      case 'bread': return <BakeryBreadIcon className="w-6 h-6" />;
      case 'sweet': return <DessertSweetIcon className="w-6 h-6" />;
      default: return <InfinityMoreIcon className="w-6 h-6" />;
    }
  };
  const items = [
    { id: 'all' as const, name: 'ทั้งหมด', icon: 'more' },
    ...categories.map((category) => ({ id: category.id, name: category.name, icon: categoryIcon(category.name) })),
  ];

  return (
    <div className="mb-5">
      <h2 className="text-base font-bold text-slate-800 mb-3 tracking-tight select-none">หมวดหมู่สินค้า</h2>
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
        {items.map((category) => {
          const selected = selectedCategoryId === category.id;
          return (
            <button key={String(category.id)} type="button" onClick={() => onSelectCategory(category.id)} className={selected ? 'flex flex-col items-center justify-center min-w-[84px] md:min-w-[96px] h-20 px-3 rounded-2xl border border-orange-500 bg-orange-50/50 shadow-sm text-orange-600' : 'flex flex-col items-center justify-center min-w-[84px] md:min-w-[96px] h-20 px-3 rounded-2xl border border-slate-200/80 bg-white text-slate-600'}>
              <div className="mb-1.5">{getCategoryIcon(category.icon)}</div>
              <span className="text-xs font-medium">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
