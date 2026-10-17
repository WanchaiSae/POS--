import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api/client';
import { useMemo } from 'react';
import { usePosStore } from '../store/usePosStore';
import { toNumber } from '../types/pos';

export const InventoryPage = () => {
  const ingredients = usePosStore((state) => state.ingredients);
  const recipes = usePosStore((state) => state.recipes);
  const products = usePosStore((state) => state.products);
  const fetchInventory = usePosStore((state) => state.fetchInventory);
  const fetchCatalog = usePosStore((state) => state.fetchCatalog);
  const [ingredientId, setIngredientId] = useState<number | null>(null);
  const [ingredientName, setIngredientName] = useState('');
  const [unit, setUnit] = useState('g');
  const [stock, setStock] = useState('0');
  const [threshold, setThreshold] = useState('100');
  const [productId, setProductId] = useState<number | ''>('');
  const [recipeIngredientId, setRecipeIngredientId] = useState<number | ''>('');
  const [quantityRequired, setQuantityRequired] = useState('');
  const [recipeId, setRecipeId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientSort, setIngredientSort] = useState<'desc' | 'asc'>('desc');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeSort, setRecipeSort] = useState<'desc' | 'asc'>('desc');
  const [adjustAmount, setAdjustAmount] = useState('1');

  useEffect(() => { void fetchInventory(); void fetchCatalog(); }, [fetchInventory, fetchCatalog]);
  const lowStockCount = ingredients.filter((item) => toNumber(item.stock_quantity) <= toNumber(item.min_threshold)).length;
  const filteredIngredients = useMemo(() => {
    const query = ingredientSearch.trim().toLocaleLowerCase('th-TH');
    return ingredients.filter((item) => !query || `${item.name} ${item.unit}`.toLocaleLowerCase('th-TH').includes(query))
      .sort((a, b) => (toNumber(a.stock_quantity) - toNumber(b.stock_quantity)) * (ingredientSort === 'desc' ? -1 : 1));
  }, [ingredients, ingredientSearch, ingredientSort]);
  const filteredRecipes = useMemo(() => {
    const query = recipeSearch.trim().toLocaleLowerCase('th-TH');
    return recipes.filter((recipe) => {
      const productName = recipe.product?.name || products.find((item) => item.id === recipe.product_id)?.name || '';
      const ingredientName = recipe.ingredient?.name || ingredients.find((item) => item.id === recipe.ingredient_id)?.name || '';
      return !query || `${productName} ${ingredientName}`.toLocaleLowerCase('th-TH').includes(query);
    }).sort((a, b) => (toNumber(a.quantity_required) - toNumber(b.quantity_required)) * (recipeSort === 'desc' ? -1 : 1));
  }, [recipes, recipeSearch, recipeSort, products, ingredients]);
  const formatUpdatedAt = (value?: string | null) => value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  const resetIngredient = () => { setIngredientId(null); setIngredientName(''); setUnit('g'); setStock('0'); setThreshold('100'); };
  const resetRecipe = () => { setRecipeId(null); setProductId(''); setRecipeIngredientId(''); setQuantityRequired(''); };

  const adjustIngredientStock = async (id: number, current: number | string, direction: 1 | -1) => {
    const amount = Number(adjustAmount);
    if (!Number.isFinite(amount) || amount <= 0) { setError('กรุณาระบุจำนวนที่ต้องการปรับให้มากกว่า 0'); return; }
    const next = toNumber(current) + amount * direction;
    if (next < 0) { setError('จำนวนคงเหลือไม่สามารถติดลบได้'); return; }
    setError(''); setNotice('');
    try {
      await api.put(`/ingredients/${id}`, { stock_quantity: Number(next.toFixed(2)) });
      await fetchInventory();
      setNotice(`ปรับสต็อกวัตถุดิบแล้ว · ${new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}`);
    } catch { setError('ปรับจำนวนวัตถุดิบไม่สำเร็จ กรุณาลองใหม่'); }
  };

  const adjustRecipeQuantity = async (id: number, current: number | string, direction: 1 | -1) => {
    const amount = Number(adjustAmount);
    if (!Number.isFinite(amount) || amount <= 0) { setError('กรุณาระบุจำนวนที่ต้องการปรับให้มากกว่า 0'); return; }
    const next = toNumber(current) + amount * direction;
    if (next <= 0) { setError('ปริมาณในสูตรต้องมากกว่า 0'); return; }
    setError(''); setNotice('');
    try {
      await api.put(`/recipe-ingredients/${id}`, { quantity_required: Number(next.toFixed(2)) });
      await fetchInventory();
      setNotice(`ปรับปริมาณสูตรแล้ว · ${new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}`);
    } catch { setError('ปรับปริมาณสูตรไม่สำเร็จ กรุณาลองใหม่'); }
  };

  const saveIngredient = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setNotice(''); setSaving(true);
    try {
      const payload = { name: ingredientName.trim(), unit: unit.trim(), stock_quantity: Number(stock), min_threshold: Number(threshold) };
      if (ingredientId) await api.put(`/ingredients/${ingredientId}`, payload);
      else await api.post('/ingredients', payload);
      await fetchInventory(); resetIngredient(); setNotice(ingredientId ? 'บันทึกการแก้ไขวัตถุดิบแล้ว' : 'เพิ่มวัตถุดิบแล้ว');
    } catch { setError('บันทึกวัตถุดิบไม่สำเร็จ กรุณาตรวจสอบข้อมูลและการเชื่อมต่อ'); }
    finally { setSaving(false); }
  };

  const saveRecipe = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setNotice(''); setSaving(true);
    try {
      const payload = { product_id: Number(productId), ingredient_id: Number(recipeIngredientId), quantity_required: Number(quantityRequired) };
      if (recipeId) await api.put(`/recipe-ingredients/${recipeId}`, payload);
      else await api.post('/recipe-ingredients', payload);
      await fetchInventory(); resetRecipe(); setNotice(recipeId ? 'บันทึกการแก้ไขสูตรแล้ว' : 'เพิ่มวัตถุดิบในสูตรแล้ว');
    } catch { setError('บันทึกสูตรไม่สำเร็จ กรุณาตรวจสอบข้อมูลและการเชื่อมต่อ'); }
    finally { setSaving(false); }
  };

  const removeRecipe = async (id: number) => {
    setError(''); setNotice('');
    try { await api.delete(`/recipe-ingredients/${id}`); await fetchInventory(); if (recipeId === id) resetRecipe(); setNotice('นำวัตถุดิบออกจากสูตรแล้ว'); }
    catch { setError('ลบรายการสูตรไม่สำเร็จ'); }
  };

  return <div className="space-y-4 overflow-auto">
    <header><h2 className="text-xl font-bold">คลังสินค้า</h2><p className="text-sm text-slate-500 mt-1">จัดการวัตถุดิบ ปริมาณคงเหลือ และสูตรการผลิต</p></header>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="bg-white rounded-3xl border border-slate-100 p-5"><p className="text-xs text-slate-500">วัตถุดิบทั้งหมด</p><p className="text-2xl font-black">{ingredients.length}</p></div><div className="bg-white rounded-3xl border border-slate-100 p-5"><p className="text-xs text-slate-500">วัตถุดิบใกล้หมด</p><p className="text-2xl font-black text-rose-500">{lowStockCount}</p></div></div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
    <section className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
      <div><h3 className="font-bold">วัตถุดิบ</h3><p className="text-xs text-slate-500 mt-1">เพิ่มวัตถุดิบ กำหนดหน่วย ปริมาณคงเหลือ และระดับแจ้งเตือน</p></div>
      <form onSubmit={saveIngredient} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        <label className="text-xs font-semibold text-slate-600 xl:col-span-2">ชื่อวัตถุดิบ<input value={ingredientName} onChange={(event) => setIngredientName(event.target.value)} placeholder="เช่น เมล็ดกาแฟ" required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-600">หน่วยนับ<input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="เช่น กรัม, มล., ชิ้น" required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-600">จำนวนคงเหลือเริ่มต้น<input value={stock} onChange={(event) => setStock(event.target.value)} type="number" min="0" step="0.01" placeholder="0" required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-600">แจ้งเตือนเมื่อเหลือต่ำกว่า<input value={threshold} onChange={(event) => setThreshold(event.target.value)} type="number" min="0" step="0.01" placeholder="100" required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
        <div className="flex items-end gap-2"><button disabled={saving} className="flex-1 rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50">{ingredientId ? 'บันทึก' : 'เพิ่มวัตถุดิบ'}</button>{ingredientId && <button type="button" onClick={resetIngredient} className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm">ยกเลิก</button>}</div>
      </form>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-slate-600">ค้นหาวัตถุดิบ<input value={ingredientSearch} onChange={(event) => setIngredientSearch(event.target.value)} placeholder="ค้นหาชื่อหรือหน่วยนับ" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-600">เรียงตามจำนวนคงเหลือ<select value={ingredientSort} onChange={(event) => setIngredientSort(event.target.value as 'desc' | 'asc')} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal"><option value="desc">มากไปน้อย</option><option value="asc">น้อยไปมาก</option></select></label>
        <label className="text-xs font-semibold text-slate-600">จำนวนที่เพิ่ม/ลดต่อครั้ง<input value={adjustAmount} onChange={(event) => setAdjustAmount(event.target.value)} type="number" min="0.01" step="0.01" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm min-w-[900px]"><thead className="text-left text-xs text-slate-500 border-b"><tr><th className="py-2">วัตถุดิบ</th><th>คงเหลือ</th><th>หน่วย</th><th>เตือนเมื่อเหลือ</th><th>สถานะ</th><th>ปรับสต็อก</th><th>อัปเดตล่าสุด</th><th></th></tr></thead><tbody>
        {filteredIngredients.map((item) => { const low = toNumber(item.stock_quantity) <= toNumber(item.min_threshold); return <tr key={item.id} className="border-b border-slate-50"><td className="py-2 font-medium">{item.name}</td><td className={low ? 'font-bold text-rose-600' : ''}>{toNumber(item.stock_quantity).toLocaleString()}</td><td>{item.unit}</td><td>{toNumber(item.min_threshold).toLocaleString()}</td><td>{low ? 'ใกล้หมด' : 'ปกติ'}</td><td><div className="flex gap-1.5"><button type="button" aria-label={`ลด ${item.name}`} onClick={() => void adjustIngredientStock(item.id, item.stock_quantity, -1)} className="h-8 w-8 rounded-lg border border-slate-200 font-bold text-slate-600">−</button><button type="button" aria-label={`เพิ่ม ${item.name}`} onClick={() => void adjustIngredientStock(item.id, item.stock_quantity, 1)} className="h-8 w-8 rounded-lg bg-orange-50 font-bold text-orange-600">+</button></div></td><td className="whitespace-nowrap text-xs text-slate-500">{formatUpdatedAt(item.last_updated_at)}</td><td className="text-right"><button type="button" onClick={() => { setIngredientId(item.id); setIngredientName(item.name); setUnit(item.unit); setStock(String(item.stock_quantity)); setThreshold(String(item.min_threshold)); }} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold">แก้ไข</button></td></tr>; })}
        {filteredIngredients.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-slate-400">{ingredients.length ? 'ไม่พบวัตถุดิบที่ค้นหา' : 'ยังไม่มีวัตถุดิบ'}</td></tr>}</tbody></table></div>
    </section>
    <section className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
      <div><h3 className="font-bold">สูตรการผลิต</h3><p className="text-xs text-slate-500 mt-1">กำหนดว่าสินค้าแต่ละรายการใช้วัตถุดิบเท่าไรต่อหนึ่งแก้วหรือหนึ่งจาน</p></div>
      <form onSubmit={saveRecipe} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <label className="text-xs font-semibold text-slate-600">สินค้า<select value={productId} onChange={(event) => setProductId(Number(event.target.value) || '')} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"><option value="">เลือกสินค้าที่ต้องการกำหนดสูตร</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">วัตถุดิบ<select value={recipeIngredientId} onChange={(event) => setRecipeIngredientId(Number(event.target.value) || '')} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal"><option value="">เลือกวัตถุดิบที่ใช้</option>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">ปริมาณวัตถุดิบต่อสินค้า<input value={quantityRequired} onChange={(event) => setQuantityRequired(event.target.value)} type="number" min="0.01" step="0.01" required placeholder="เช่น 15" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
        <div className="flex items-end gap-2"><button disabled={saving || !products.length || !ingredients.length} className="flex-1 rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50">{recipeId ? 'บันทึกสูตร' : 'เพิ่มลงในสูตร'}</button>{recipeId && <button type="button" onClick={resetRecipe} className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm">ยกเลิก</button>}</div>
      </form>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><label className="text-xs font-semibold text-slate-600">ค้นหาสินค้าหรือวัตถุดิบในสูตร<input value={recipeSearch} onChange={(event) => setRecipeSearch(event.target.value)} placeholder="พิมพ์ชื่อสินค้า/วัตถุดิบ" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" /></label><label className="text-xs font-semibold text-slate-600">เรียงตามปริมาณที่ใช้<select value={recipeSort} onChange={(event) => setRecipeSort(event.target.value as 'desc' | 'asc')} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal"><option value="desc">มากไปน้อย</option><option value="asc">น้อยไปมาก</option></select></label><label className="text-xs font-semibold text-slate-600">จำนวนที่เพิ่ม/ลดในสูตร<input value={adjustAmount} onChange={(event) => setAdjustAmount(event.target.value)} type="number" min="0.01" step="0.01" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal" /></label></div>
      <div className="overflow-x-auto"><table className="w-full text-sm min-w-[840px]"><thead className="text-left text-xs text-slate-500 border-b"><tr><th className="py-2">สินค้า</th><th>วัตถุดิบ</th><th>ปริมาณต่อชิ้น</th><th>ปรับปริมาณ</th><th>อัปเดตล่าสุด</th><th></th></tr></thead><tbody>
        {filteredRecipes.map((recipe) => <tr key={recipe.id} className="border-b border-slate-50"><td className="py-2">{recipe.product?.name || products.find((item) => item.id === recipe.product_id)?.name || '—'}</td><td>{recipe.ingredient?.name || ingredients.find((item) => item.id === recipe.ingredient_id)?.name || '—'}</td><td>{toNumber(recipe.quantity_required).toLocaleString()} {recipe.ingredient?.unit || ingredients.find((item) => item.id === recipe.ingredient_id)?.unit}</td><td><div className="flex gap-1.5"><button type="button" aria-label="ลดปริมาณในสูตร" onClick={() => void adjustRecipeQuantity(recipe.id, recipe.quantity_required, -1)} className="h-8 w-8 rounded-lg border border-slate-200 font-bold text-slate-600">−</button><button type="button" aria-label="เพิ่มปริมาณในสูตร" onClick={() => void adjustRecipeQuantity(recipe.id, recipe.quantity_required, 1)} className="h-8 w-8 rounded-lg bg-orange-50 font-bold text-orange-600">+</button></div></td><td className="whitespace-nowrap text-xs text-slate-500">{formatUpdatedAt(recipe.last_updated_at)}</td><td className="text-right whitespace-nowrap"><button type="button" onClick={() => { setRecipeId(recipe.id); setProductId(recipe.product_id); setRecipeIngredientId(recipe.ingredient_id); setQuantityRequired(String(recipe.quantity_required)); }} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold">แก้ไข</button><button type="button" onClick={() => void removeRecipe(recipe.id)} className="ml-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">ลบ</button></td></tr>)}
        {filteredRecipes.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-400">{recipes.length ? 'ไม่พบสูตรที่ค้นหา' : 'ยังไม่มีสูตรสินค้า'}</td></tr>}</tbody></table></div>
    </section>
  </div>;
};
