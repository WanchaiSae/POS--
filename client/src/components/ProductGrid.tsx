import type { Product } from '../types/pos';
import { PlusIcon } from './Icons';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ProductGrid = ({ products, onAddToCart, currentPage, totalPages, onPageChange }: ProductGridProps) => (
  <section className="flex-1 flex flex-col min-h-0">
    <div className="grid grid-cols-2 gap-3 sm:gap-4 min-[1150px]:grid-cols-3">
      {products.map((product) => (
        <button key={product.id} type="button" onClick={() => onAddToCart(product)} className="group text-left bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition">
          <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
            {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center text-4xl">☕</div>}
          </div>
          <div className="p-3 flex items-center justify-between gap-2">
            <div className="min-w-0"><p className="font-semibold text-sm truncate">{product.name}</p><p className="text-orange-600 font-bold mt-1">฿{Number(product.base_price).toLocaleString()}</p></div>
            <span className="w-9 h-9 shrink-0 rounded-xl bg-orange-500 text-white flex items-center justify-center"><PlusIcon className="w-4 h-4" /></span>
          </div>
        </button>
      ))}
      {products.length === 0 && <p className="col-span-full py-16 text-center text-slate-400">ไม่พบสินค้า</p>}
    </div>
    {totalPages > 1 && <div className="flex justify-center items-center gap-3 py-4"><button type="button" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className="px-3 py-1 rounded-lg bg-white disabled:opacity-40">ก่อนหน้า</button><span className="text-sm text-slate-500">หน้า {currentPage} / {totalPages}</span><button type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className="px-3 py-1 rounded-lg bg-white disabled:opacity-40">ถัดไป</button></div>}
  </section>
);
