export type ViewMode = 'customer' | 'kitchen' | 'admin';

export type Category = 'Kopi' | 'Non-Kopi' | 'Makanan Ringan' | 'Makanan Berat';

export type BrandTheme = 'espresso' | 'matcha' | 'caramel' | 'berry' | 'dark-roast';

export interface BrandThemeConfig {
  id: BrandTheme;
  name: string;
  primary: string;
  primaryBg: string;
  primaryText: string;
  accent: string;
  badgeBg: string;
  gradient: string;
}

export interface StorePolicies {
  operatingHours: string;
  paymentPolicy: string;
  taxAndService: string;
  customizationPolicy: string;
  allergenPolicy: string;
  wifiAndSeatingPolicy: string;
}

export interface CafeConfig {
  name: string;
  tagline: string;
  baristaName: string;
  wifiPassword: string;
  brandTheme: BrandTheme;
  tableNumber: string;
  address: string;
  phone: string;
  policies: StorePolicies;
}

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  imageUrl: string;
  caffeine?: 'Tinggi' | 'Sedang' | 'Rendah' | 'Bebas Kafein';
  sweetness?: 'Normal' | 'Less Sugar' | 'No Sugar';
  calories?: string;
  isAvailable: boolean;
  isPopular?: boolean;
  stock: number;
  lowStockThreshold?: number;
}

export interface CartItem {
  cartId: string; // unique ID in cart
  menuItem: MenuItem;
  quantity: number;
  selectedSize: 'Regular' | 'Large';
  sizePrice: number; // calculated item price * size multiplier
  sugarLevel: 'Normal (100%)' | 'Less Sugar (50%)' | 'No Sugar (0%)';
  iceLevel: 'Normal Ice' | 'Less Ice' | 'No Ice';
  notes: string;
}

export type PaymentMethod = 'QRIS' | 'Bayar di Kasir';

export type OrderStatus = 'Pesanan Diterima' | 'Sedang Dibuat' | 'Siap Diantar';

export interface Order {
  id: string; // e.g. ORD-9402
  tableNumber: string;
  cafeName: string;
  items: CartItem[];
  subtotal?: number;
  discountAmount?: number;
  pointsRedeemed?: number;
  pointsEarned?: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string; // timestamp ISO or formatted
  paymentMethod: PaymentMethod;
  paymentStatus: 'Lunas - QRIS' | 'Lunas - Kasir' | 'Bayar di Kasir' | 'Pending';
  customerName?: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountAmount: number;
  minOrderAmount: number;
}

export interface LoyaltyTransaction {
  id: string;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
  timestamp: string;
}

export interface LoyaltyProfile {
  customerName: string;
  points: number;
  lifetimePoints: number;
  activeReward: LoyaltyReward | null;
  history: LoyaltyTransaction[];
}

