import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, type ApiResponse } from '../api/client';
import type {
  ApiPaymentMethod,
  CartItem,
  Category,
  Customer,
  Ingredient,
  OrderRecord,
  Product,
  ProductOption,
  RecipeIngredient,
  Shift,
  User,
} from '../types/pos';
import { lineSubtotal } from '../types/pos';

interface PosState {
  user: User | null;
  accessToken: string | null;
  shift: Shift | null;
  categories: Category[];
  products: Product[];
  options: ProductOption[];
  customers: Customer[];
  orders: OrderRecord[];
  ingredients: Ingredient[];
  recipes: RecipeIngredient[];
  users: User[];
  shifts: Shift[];
  cart: CartItem[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;
  lastOrder: OrderRecord | null;

  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  openShift: (startAmount: number) => Promise<boolean>;
  closeShift: (actualAmount: number) => Promise<Shift | null>;
  bootstrap: () => Promise<void>;
  fetchCatalog: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchCustomers: (phone?: string) => Promise<void>;
  fetchInventory: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchShifts: () => Promise<void>;
  addToCart: (product: Product, options: ProductOption[]) => void;
  updateQuantity: (lineId: string, delta: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  registerCustomer: (payload: {
    phone_number: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<Customer | null>;
  checkout: (paymentMethod: ApiPaymentMethod) => Promise<OrderRecord | null>;
  createProduct: (payload: {
    category_id: number;
    name: string;
    base_price: number;
    image_url?: string;
  }) => Promise<boolean>;
  updateProduct: (id: number, payload: {
    category_id: number;
    name: string;
    base_price: number;
    image_url?: string;
  }) => Promise<boolean>;
  deleteProduct: (id: number) => Promise<boolean>;
  toggleProduct: (product: Product) => Promise<void>;
}

const makeLineId = (productId: number, optionIds: number[]) =>
  `${productId}-${[...optionIds].sort((a, b) => a - b).join('_') || 'plain'}`;

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      shift: null,
      categories: [],
      products: [],
      options: [],
      customers: [],
      orders: [],
      ingredients: [],
      recipes: [],
      users: [],
      shifts: [],
      cart: [],
      selectedCustomer: null,
      loading: false,
      error: null,
      lastOrder: null,

      login: async (pin) => {
        set({ error: null, loading: true });
        try {
          const res = await api.post<ApiResponse<User & { access_token: string }>>('/users/login', {
            pin_code: pin,
          });
          const user = res.data.data;
          const accessToken = res.data.data.access_token;
          const shiftRes = await api.get<ApiResponse<Shift[]>>('/shifts', {
            params: { user_id: user.id, open: true },
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          set({
            user,
            accessToken,
            shift: shiftRes.data.data[0] || null,
            loading: false,
          });
          await get().bootstrap();
          return true;
        } catch (err: unknown) {
          const message =
            axiosMessage(err, "รหัส PIN ไม่ถูกต้องหรือเข้าสู่ระบบไม่ได้");
          set({ error: message, loading: false });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          shift: null,
          cart: [],
          selectedCustomer: null,
          lastOrder: null,
        });
      },

      openShift: async (startAmount) => {
        const user = get().user;
        if (!user) return false;
        set({ loading: true, error: null });
        try {
          const res = await api.post<ApiResponse<Shift>>('/shifts', {
            user_id: user.id,
            start_amount: startAmount,
          });
          set({ shift: res.data.data, loading: false });
          return true;
        } catch (err) {
          set({ error: axiosMessage(err, "เปิดกะไม่สำเร็จ"), loading: false });
          return false;
        }
      },

      closeShift: async (actualAmount) => {
        const shift = get().shift;
        if (!shift) return null;
        try {
          const res = await api.post<ApiResponse<Shift>>(`/shifts/${shift.id}/close`, {
            actual_amount: actualAmount,
          });
          set({ shift: null });
          return res.data.data;
        } catch (err) {
          set({ error: axiosMessage(err, "ปิดกะไม่สำเร็จ") });
          return null;
        }
      },

      bootstrap: async () => {
        await Promise.all([
          get().fetchCatalog(),
          get().fetchCustomers(),
          get().fetchOrders(),
        ]);
      },

      fetchCatalog: async () => {
        const [cats, prods, opts] = await Promise.all([
          api.get<ApiResponse<Category[]>>('/categories'),
          api.get<ApiResponse<Product[]>>('/products'),
          api.get<ApiResponse<ProductOption[]>>('/product-options'),
        ]);
        set({
          categories: cats.data.data.filter((c) => c.is_active),
          products: prods.data.data,
          options: opts.data.data.filter((o) => o.is_active),
        });
      },

      fetchOrders: async () => {
        const res = await api.get<ApiResponse<OrderRecord[]>>('/orders');
        set({ orders: res.data.data });
      },

      fetchCustomers: async (phone) => {
        const res = await api.get<ApiResponse<Customer[]>>('/customers', {
          params: phone ? { phone } : undefined,
        });
        set({ customers: res.data.data });
      },

      fetchInventory: async () => {
        const [ings, recipes] = await Promise.all([
          api.get<ApiResponse<Ingredient[]>>('/ingredients'),
          api.get<ApiResponse<RecipeIngredient[]>>('/recipe-ingredients'),
        ]);
        set({ ingredients: ings.data.data, recipes: recipes.data.data });
      },

      fetchUsers: async () => {
        const res = await api.get<ApiResponse<User[]>>('/users', {
          headers: { Authorization: `Bearer ${get().accessToken || ''}` },
        });
        set({ users: res.data.data });
      },

      fetchShifts: async () => {
        const res = await api.get<ApiResponse<Shift[]>>('/shifts');
        set({ shifts: res.data.data });
      },

      addToCart: (product, options) => {
        const lineId = makeLineId(
          product.id,
          options.map((o) => o.id),
        );
        const existing = get().cart.find((item) => item.lineId === lineId);
        if (existing) {
          set({
            cart: get().cart.map((item) =>
              item.lineId === lineId
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          });
          return;
        }
        set({
          cart: [...get().cart, { lineId, product, quantity: 1, options }],
        });
      },

      updateQuantity: (lineId, delta) => {
        set({
          cart: get()
            .cart.map((item) =>
              item.lineId === lineId
                ? { ...item, quantity: item.quantity + delta }
                : item,
            )
            .filter((item) => item.quantity > 0),
        });
      },

      removeLine: (lineId) => {
        set({ cart: get().cart.filter((item) => item.lineId !== lineId) });
      },

      clearCart: () => set({ cart: [], selectedCustomer: null }),

      setCustomer: (customer) => set({ selectedCustomer: customer }),

      registerCustomer: async (payload) => {
        try {
          const res = await api.post<ApiResponse<Customer>>('/customers', payload);
          const customer = res.data.data;
          await get().fetchCustomers();
          set({ selectedCustomer: customer });
          return customer;
        } catch (err) {
          set({ error: axiosMessage(err, "สมัครสมาชิกไม่สำเร็จ") });
          return null;
        }
      },

      checkout: async (paymentMethod) => {
        const { cart, user, shift, selectedCustomer } = get();
        if (!cart.length) return null;
        set({ loading: true, error: null });
        try {
          const res = await api.post<ApiResponse<OrderRecord>>('/orders/checkout', {
            shift_id: shift?.id,
            user_id: user?.id,
            customer_id: selectedCustomer?.id,
            payment_method: paymentMethod,
            items: cart.map((item) => ({
              product_id: item.product.id,
              quantity: item.quantity,
              option_ids: item.options.map((o) => o.id),
            })),
          });
          const order = res.data.data;
          set({
            cart: [],
            selectedCustomer: selectedCustomer
              ? {
                  ...selectedCustomer,
                  points: selectedCustomer.points + (order.points_earned || 0),
                }
              : null,
            lastOrder: order,
            loading: false,
          });
          await Promise.all([get().fetchOrders(), get().fetchCatalog(), get().fetchCustomers()]);
          return order;
        } catch (err) {
          set({ error: axiosMessage(err, "ชำระเงินไม่สำเร็จ"), loading: false });
          return null;
        }
      },

      createProduct: async (payload) => {
        try {
          await api.post('/products', payload);
          await get().fetchCatalog();
          return true;
        } catch (err) {
          set({ error: axiosMessage(err, "เพิ่มสินค้าไม่สำเร็จ") });
          return false;
        }
      },

      updateProduct: async (id, payload) => {
        try {
          await api.put(`/products/${id}`, payload);
          await get().fetchCatalog();
          return true;
        } catch (err) {
          set({ error: axiosMessage(err, 'แก้ไขสินค้าไม่สำเร็จ') });
          return false;
        }
      },

      deleteProduct: async (id) => {
        try {
          await api.delete(`/products/${id}`);
          await get().fetchCatalog();
          return true;
        } catch (err) {
          set({ error: axiosMessage(err, 'ลบสินค้าไม่สำเร็จ') });
          return false;
        }
      },

      toggleProduct: async (product) => {
        await api.put(`/products/${product.id}`, { is_active: !product.is_active });
        await get().fetchCatalog();
      },
    }),
    {
      name: 'pos-nam-session',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        shift: state.shift,
      }),
    },
  ),
);

export const cartTotals = (cart: CartItem[], customer: Customer | null) => {
  const subtotal = cart.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const rate = customer?.tier === 'Gold' ? 0.05 : customer?.tier === 'Silver' ? 0.03 : 0;
  const discount = Number((subtotal * rate).toFixed(2));
  const net = Math.max(0, subtotal - discount);
  const points = customer ? Math.floor(net / 10) : 0;
  return { subtotal, discount, net, points };
};

const axiosMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'object' && err && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    const message = response?.data?.message;
    return message && !message.includes(String.fromCharCode(65533)) ? message : fallback;
  }
  return fallback;
};

