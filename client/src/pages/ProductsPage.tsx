import { useEffect, useState, type FormEvent } from 'react';
import { usePosStore } from '../store/usePosStore';
import { toNumber, type Product } from '../types/pos';
import { ConfirmModal } from '../components/ConfirmModal';

export const ProductsPage = () => {
  const user = usePosStore((state) => state.user);
  const products = usePosStore((state) => state.products);
  const categories = usePosStore((state) => state.categories);
  const createProduct = usePosStore((state) => state.createProduct);
  const updateProduct = usePosStore((state) => state.updateProduct);
  const deleteProduct = usePosStore((state) => state.deleteProduct);
  const toggleProduct = usePosStore((state) => state.toggleProduct);
  const error = usePosStore((state) => state.error);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 0);
  const [viewCategoryId, setViewCategoryId] = useState<number | 'all'>('all');
  const [notice, setNotice] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; price?: string; category?: string }>({});
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const canManageProducts = user?.role === 'admin' || user?.role === 'manager';
  const visibleProducts = viewCategoryId === 'all' ? products : products.filter((product) => product.category_id === viewCategoryId);

  useEffect(() => { if (!categoryId && categories[0]) setCategoryId(categories[0].id); }, [categories, categoryId]);

  const resetForm = () => { setEditingId(null); setName(''); setPrice(''); setImageUrl(''); setFormErrors({}); if (categories[0]) setCategoryId(categories[0].id); };
  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(String(product.base_price));
    setImageUrl(product.image_url || '');
    setCategoryId(product.category_id);
    setFormErrors({});
    setNotice('');
  };

  const submitProduct = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedName = name.trim();
    const numericPrice = Number(price);
    const nextErrors = {
      ...(!normalizedName ? { name: 'กรุณากรอกชื่อสินค้า' } : {}),
      ...(!price || !Number.isFinite(numericPrice) || numericPrice <= 0 ? { price: 'กรุณากรอกราคาให้มากกว่า 0 บาท' } : {}),
      ...(!categoryId ? { category: 'กรุณาเลือกหมวดหมู่สินค้า' } : {}),
    };
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const payload = { category_id: categoryId, name: normalizedName, base_price: numericPrice, image_url: imageUrl.trim() || undefined };
    const succeeded = editingId ? await updateProduct(editingId, payload) : await createProduct(payload);
    if (succeeded) {
      setNotice(editingId ? 'บันทึกการแก้ไขสินค้าแล้ว' : 'เพิ่มสินค้าแล้ว');
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    if (await deleteProduct(pendingDelete.id)) {
      if (editingId === pendingDelete.id) resetForm();
      setNotice(`ดำเนินการลบ “${pendingDelete.name}” แล้ว`);
      setPendingDelete(null);
    }
    setDeleting(false);
  };

  return <div className="space-y-4 overflow-auto">
    {canManageProducts && <form className="bg-white rounded-3xl border border-slate-100 p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3" onSubmit={(event) => void submitProduct(event)}>
      <div><input value={name} onChange={(event) => { setName(event.target.value); setFormErrors((current) => ({ ...current, name: undefined })); }} placeholder="ชื่อสินค้า" aria-label="ชื่อสินค้า" aria-invalid={!!formErrors.name} className={`w-full rounded-xl border px-3 py-2 text-sm ${formErrors.name ? 'border-rose-500' : 'border-slate-200'}`} />{formErrors.name && <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>}</div>
      <div><input value={price} onChange={(event) => { setPrice(event.target.value); setFormErrors((current) => ({ ...current, price: undefined })); }} type="number" min="0.01" step="0.01" placeholder="ราคาตั้งต้น" aria-label="ราคาตั้งต้น" aria-invalid={!!formErrors.price} className={`w-full rounded-xl border px-3 py-2 text-sm ${formErrors.price ? 'border-rose-500' : 'border-slate-200'}`} />{formErrors.price && <p className="mt-1 text-xs text-rose-600">{formErrors.price}</p>}</div>
      <div><select value={categoryId} onChange={(event) => { setCategoryId(Number(event.target.value)); setFormErrors((current) => ({ ...current, category: undefined })); }} aria-label="หมวดหมู่สินค้า" aria-invalid={!!formErrors.category} className={`w-full rounded-xl border px-3 py-2 text-sm ${formErrors.category ? 'border-rose-500' : 'border-slate-200'}`}><option value={0} disabled>เลือกหมวดหมู่</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{formErrors.category && <p className="mt-1 text-xs text-rose-600">{formErrors.category}</p>}</div>
      <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} type="url" placeholder="ลิงก์รูปภาพ (ถ้ามี)" aria-label="ลิงก์รูปภาพ" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <div className="flex gap-2"><button disabled={!categories.length} className="flex-1 rounded-xl bg-orange-500 text-white font-bold text-sm py-2 disabled:opacity-40">{editingId ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</button>{editingId && <button type="button" onClick={resetForm} className="rounded-xl bg-slate-100 px-3 text-sm">ยกเลิก</button>}</div>
    </form>}
    {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}

    <div className="bg-white rounded-3xl border border-slate-100 p-5">
      <div className="flex flex-col gap-3 mb-4"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">แคตตาล็อกสินค้า</h3><span className="text-xs text-slate-400">{visibleProducts.length} รายการ</span></div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="เลือกหมวดหมู่สินค้า">
          <button type="button" onClick={() => setViewCategoryId('all')} aria-pressed={viewCategoryId === 'all'} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${viewCategoryId === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>ทั้งหมด ({products.length})</button>
          {categories.map((category) => { const count = products.filter((product) => product.category_id === category.id).length; const selected = viewCategoryId === category.id; return <button key={category.id} type="button" onClick={() => setViewCategoryId(category.id)} aria-pressed={selected} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${selected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{category.name} ({count})</button>; })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibleProducts.map((product) => <div key={product.id} className="flex items-center gap-3 border border-slate-100 rounded-2xl p-3">
          <img src={product.image_url || ''} alt={product.name} className="w-14 h-14 rounded-xl object-cover bg-slate-100" />
          <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{product.name}</p><p className="text-xs text-slate-500">{product.category?.name} · ฿{toNumber(product.base_price).toLocaleString()}</p></div>
          {canManageProducts && <div className="flex flex-wrap justify-end gap-1.5"><button type="button" onClick={() => startEditing(product)} className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-blue-50 text-blue-600">แก้ไข</button><button type="button" onClick={() => setPendingDelete(product)} className="text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-rose-50 text-rose-600">ลบ</button><button type="button" onClick={() => void toggleProduct(product)} className={product.is_active ? 'text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-emerald-50 text-emerald-600' : 'text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-slate-100 text-slate-500'}>{product.is_active ? 'เปิดขาย' : 'ปิดขาย'}</button></div>}
        </div>)}
        {visibleProducts.length === 0 && <p className="col-span-full py-8 text-center text-sm text-slate-400">{viewCategoryId === 'all' ? 'ยังไม่มีสินค้าในระบบ' : 'ยังไม่มีสินค้าในหมวดหมู่นี้'}</p>}
      </div>
    </div>
    {pendingDelete && <ConfirmModal title="ยืนยันการลบสินค้า" description={`ต้องการลบ “${pendingDelete.name}” ใช่ไหม?\nหากสินค้านี้มีประวัติการขาย ระบบจะปิดการขายและเก็บข้อมูลบิลเดิมไว้`} confirmLabel="ลบสินค้า" onConfirm={() => void handleDelete()} onCancel={() => setPendingDelete(null)} busy={deleting} />}
  </div>;
};
