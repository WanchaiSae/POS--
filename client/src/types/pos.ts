export interface User {
  id: number;
  name: string;
  role: string;
  is_active?: boolean;
  deactivated_at?: string | null;
  shift_count?: number;
  order_count?: number;
  created_at?: string | null;
}

export interface Category {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  base_price: number | string;
  image_url?: string | null;
  is_active: boolean;
  category?: Category;
}

export interface ProductOption {
  id: number;
  group_name: string;
  name: string;
  extra_price: number | string;
  is_active: boolean;
}

export interface Customer {
  id: number;
  phone_number: string;
  first_name?: string | null;
  last_name?: string | null;
  points: number;
  tier: string;
  created_at?: string | null;
}

export interface Shift {
  id: number;
  user_id: number;
  start_amount: number | string;
  end_amount?: number | string | null;
  actual_amount?: number | string | null;
  opened_at?: string | null;
  closed_at?: string | null;
  user?: User;
  summary?: {
    order_count: number;
    total_sales: number;
    cash_sales: number;
    expected_drawer: number;
    actual_amount: number;
    difference: number;
  };
}

export interface OrderItemOption {
  id: number;
  order_item_id: number;
  option_id: number;
  extra_price: number | string;
  product_option?: ProductOption;
}

export interface OrderItemRecord {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
  product?: Product;
  selected_options?: OrderItemOption[];
}

export interface OrderRecord {
  id: number;
  order_number: string;
  shift_id?: number | null;
  user_id?: number | null;
  customer_id?: number | null;
  total_amount: number | string;
  discount_amount: number | string;
  net_amount: number | string;
  payment_method: string;
  payment_status: string;
  points_earned: number;
  created_at?: string | null;
  user?: User;
  customer?: Customer | null;
  items?: OrderItemRecord[];
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stock_quantity: number | string;
  min_threshold: number | string;
  last_updated_at?: string | null;
}

export interface RecipeIngredient {
  id: number;
  product_id: number;
  ingredient_id: number;
  stock_quantity: number | string;
  quantity_required: number | string;
  last_updated_at?: string | null;
  product?: Product;
  ingredient?: Ingredient;
}

export interface CartItem {
  lineId: string;
  product: Product;
  quantity: number;
  options: ProductOption[];
}

export type UiPaymentMethod = 'cash' | 'promptpay' | 'credit';
export type ApiPaymentMethod = 'CASH' | 'QR_CODE' | 'CREDIT_CARD';

export const mapPaymentMethod = (method: UiPaymentMethod): ApiPaymentMethod => {
  if (method === 'promptpay') return 'QR_CODE';
  if (method === 'credit') return 'CREDIT_CARD';
  return 'CASH';
};

export const toNumber = (value: unknown): number => Number(value ?? 0);

export const lineUnitPrice = (item: CartItem): number => {
  const extra = item.options.reduce((sum, opt) => sum + toNumber(opt.extra_price), 0);
  return toNumber(item.product.base_price) + extra;
};

export const lineSubtotal = (item: CartItem): number => lineUnitPrice(item) * item.quantity;

export const categoryIcon = (name: string): string => {
  if (name.includes('เครื่องดื่ม')) return 'cup';
  if (name.includes('อาหาร')) return 'bowl';
  if (name.includes('เบเกอรี่')) return 'bread';
  if (name.includes('หวาน')) return 'sweet';
  return 'more';
};
