import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar, type NavItemKey } from './components/Sidebar';
import { CategoryList } from './components/CategoryList';
import { ProductGrid } from './components/ProductGrid';
import { CartSidebar } from './components/CartSidebar';
import { PaymentModal } from './components/PaymentModal';
import { LoginScreen } from './components/LoginScreen';
import { OpenShiftModal } from './components/OpenShiftModal';
import { OptionModal } from './components/OptionModal';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { CustomersPage } from './pages/CustomersPage';
import { ReportsPage } from './pages/ReportsPage';
import { InventoryPage } from './pages/InventoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { CloseShiftPage } from './pages/CloseShiftPage';
import { ShiftHistoryPage } from './pages/ShiftHistoryPage';
import { cartTotals, usePosStore } from './store/usePosStore';
import { categoryIcon, type Product } from './types/pos';

export const App = () => {
  const user = usePosStore((s) => s.user);
  const accessToken = usePosStore((s) => s.accessToken);
  const logout = usePosStore((s) => s.logout);
  const shift = usePosStore((s) => s.shift);
  const products = usePosStore((s) => s.products);
  const categories = usePosStore((s) => s.categories);
  const options = usePosStore((s) => s.options);
  const cart = usePosStore((s) => s.cart);
  const selectedCustomer = usePosStore((s) => s.selectedCustomer);
  const bootstrap = usePosStore((s) => s.bootstrap);
  const addToCart = usePosStore((s) => s.addToCart);
  const updateQuantity = usePosStore((s) => s.updateQuantity);
  const removeLine = usePosStore((s) => s.removeLine);
  const clearCart = usePosStore((s) => s.clearCart);

  const [activeNav, setActiveNav] = useState<NavItemKey>('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [optionProduct, setOptionProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (user) void bootstrap();
  }, [user, bootstrap]);

  useEffect(() => {
    if (user && !accessToken) logout();
  }, [user, accessToken, logout]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeProducts.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q);
      const matchCat =
        selectedCategoryId === 'all' || p.category_id === selectedCategoryId;
      return matchSearch && matchCat;
    });
  }, [activeProducts, searchQuery, selectedCategoryId]);

  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const totals = cartTotals(cart, selectedCustomer);

  const handleAdd = (product: Product) => {
    if (options.length > 0 && categoryIcon(product.category?.name ?? '') === 'cup') {
      setOptionProduct(product);
      return;
    }
    addToCart(product, []);
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="h-[100dvh] min-h-[100svh] bg-[#f8f9fa] flex flex-col overflow-hidden font-['Prompt',sans-serif] text-slate-800">
      {!shift && <OpenShiftModal />}
      <Header
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
      />
      <div className="tablet-safe-area flex-1 flex min-h-0 overflow-hidden">
        <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
        <main className="flex-1 min-w-0 min-h-0 flex flex-col p-3 sm:p-4 lg:p-5 pb-24 min-[700px]:pb-5 overflow-y-auto">
          {activeNav === 'pos' && (
            <>
              <CategoryList
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={(id) => {
                  setSelectedCategoryId(id);
                  setCurrentPage(1);
                  setSearchQuery('');
                }}
              />
              <ProductGrid
                products={paginatedProducts}
                onAddToCart={handleAdd}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
          {activeNav === 'orders' && <OrdersPage />}
          {activeNav === 'products' && <ProductsPage />}
          {activeNav === 'customers' && <CustomersPage />}
          {activeNav === 'reports' && <ReportsPage />}
          {activeNav === 'closeShift' && user.role === 'staff' && <CloseShiftPage />}
          {activeNav === 'shiftHistory' && (user.role === 'admin' || user.role === 'manager') && <ShiftHistoryPage />}
          {activeNav === 'inventory' && <InventoryPage />}
          {activeNav === 'settings' && user.role === 'admin' && <SettingsPage />}
        </main>
        <CartSidebar
          className="hidden min-[700px]:flex min-[700px]:w-80 min-[900px]:w-[352px] xl:w-[400px]"
          items={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeLine}
          onClearCart={clearCart}
          onCheckout={() => setIsPaymentOpen(true)}
        />
      </div>
      <button type="button" onClick={() => setIsCartOpen(true)} className="fixed z-30 right-3 bottom-[76px] min-[700px]:hidden rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30">
        ตะกร้า · {cart.reduce((sum, item) => sum + item.quantity, 0)} · ฿{totals.net.toLocaleString()}
      </button>
      {isCartOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-2 sm:items-center sm:p-4 min-[700px]:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsCartOpen(false); }}>
        <CartSidebar className="flex h-[min(88dvh,760px)] w-full max-w-lg rounded-3xl" onClose={() => setIsCartOpen(false)} items={cart} onUpdateQuantity={updateQuantity} onRemoveItem={removeLine} onClearCart={clearCart} onCheckout={() => { setIsCartOpen(false); setIsPaymentOpen(true); }} />
      </div>}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        items={cart}
        totalAmount={totals.net}
        onSuccess={() => setIsPaymentOpen(false)}
      />
      {optionProduct && (
        <OptionModal
          product={optionProduct}
          options={options}
          onClose={() => setOptionProduct(null)}
          onConfirm={(selected) => {
            addToCart(optionProduct, selected);
            setOptionProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
