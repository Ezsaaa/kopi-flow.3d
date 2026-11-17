import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CafeConfig,
  MenuItem,
  CartItem,
  Order,
  ViewMode,
  OrderStatus,
  LoyaltyProfile,
  LoyaltyReward,
  StorePolicies,
  PaymentMethod,
} from '../types';
import {
  DEFAULT_CAFE_CONFIG,
  DEFAULT_STORE_POLICIES,
  INITIAL_MENU_ITEMS,
  DEFAULT_LOW_STOCK_THRESHOLD,
} from '../constants/initialData';

interface CafeContextType {
  cafeConfig: CafeConfig;
  updateCafeConfig: (newConfig: Partial<CafeConfig>) => void;
  updateStorePolicies: (updates: Partial<StorePolicies>) => void;
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  toggleMenuAvailability: (id: string) => void;
  updateMenuPrice: (id: string, newPrice: number) => void;
  updateMenuStock: (id: string, newStock: number) => void;
  restockMenuItem: (id: string, addAmount?: number) => void;
  lowStockThreshold: number;
  updateLowStockThreshold: (threshold: number) => void;
  lowStockItems: MenuItem[];
  outOfStockItems: MenuItem[];
  isLowStockAlertDismissed: boolean;
  dismissLowStockAlert: () => void;
  cart: CartItem[];
  addToCart: (
    menuItem: MenuItem,
    selectedSize: 'Regular' | 'Large',
    sugarLevel: CartItem['sugarLevel'],
    iceLevel: CartItem['iceLevel'],
    notes: string
  ) => void;
  removeFromCart: (cartId: string) => void;
  updateCartQuantity: (cartId: string, delta: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  appliedDiscount: number;
  cartTotal: number;
  orders: Order[];
  placeOrder: (paymentMethod?: PaymentMethod) => Order;
  verifyOrderPayment: (orderId: string) => Promise<boolean>;
  confirmCashierPayment: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  isDemoModalOpen: boolean;
  setIsDemoModalOpen: (open: boolean) => void;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  todayRevenue: number;
  todayOrderCount: number;
  loyaltyProfile: LoyaltyProfile;
  updateCustomerName: (name: string) => void;
  redeemLoyaltyReward: (reward: LoyaltyReward) => { success: boolean; message: string };
  cancelActiveReward: () => void;
}

const CafeContext = createContext<CafeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_CONFIG = 'kopiflow_cafe_config_v2';
const LOCAL_STORAGE_KEY_MENU = 'kopiflow_menu_items_v2';
const LOCAL_STORAGE_KEY_ORDERS = 'kopiflow_orders_v2';
const LOCAL_STORAGE_KEY_THRESHOLD = 'kopiflow_low_stock_threshold_v1';
const LOCAL_STORAGE_KEY_LOYALTY = 'kopiflow_loyalty_profile_v1';

const DEFAULT_LOYALTY_PROFILE: LoyaltyProfile = {
  customerName: 'Tamu Spesial',
  points: 150,
  lifetimePoints: 150,
  activeReward: null,
  history: [
    {
      id: 'loy-welcome',
      type: 'earn',
      points: 150,
      description: 'Bonus Member Baru KopiFlow Loyalty',
      timestamp: 'Hari ini',
    },
  ],
};

// Seed sample orders for realistic live presentation
const SEED_ORDERS: Order[] = [
  {
    id: 'ORD-8801',
    tableNumber: 'Meja 02',
    cafeName: 'Kopi Senja Utama',
    items: [
      {
        cartId: 'c-seed-1',
        menuItem: INITIAL_MENU_ITEMS[0],
        quantity: 2,
        selectedSize: 'Regular',
        sizePrice: 22000,
        sugarLevel: 'Less Sugar (50%)',
        iceLevel: 'Normal Ice',
        notes: 'Sedikit es ya',
      },
      {
        cartId: 'c-seed-2',
        menuItem: INITIAL_MENU_ITEMS[7],
        quantity: 1,
        selectedSize: 'Regular',
        sizePrice: 23000,
        sugarLevel: 'No Sugar (0%)',
        iceLevel: 'No Ice',
        notes: 'Hangatkan croissant',
      },
    ],
    totalAmount: 67000,
    status: 'Sedang Dibuat',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    paymentMethod: 'QRIS',
    paymentStatus: 'Lunas - QRIS',
    customerName: 'Pelanggan Meja 02',
  },
  {
    id: 'ORD-8802',
    tableNumber: 'Meja 06',
    cafeName: 'Kopi Senja Utama',
    items: [
      {
        cartId: 'c-seed-3',
        menuItem: INITIAL_MENU_ITEMS[4],
        quantity: 1,
        selectedSize: 'Large',
        sizePrice: 32000,
        sugarLevel: 'Normal (100%)',
        iceLevel: 'Normal Ice',
        notes: 'Extra creamy',
      },
    ],
    totalAmount: 32000,
    status: 'Pesanan Diterima',
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    paymentMethod: 'QRIS',
    paymentStatus: 'Lunas - QRIS',
    customerName: 'Pelanggan Meja 06',
  },
];

function normalizeOrderStatus(status: string): OrderStatus {
  if (status === 'Menunggu Dibuat' || status === 'Pesanan Diterima') return 'Pesanan Diterima';
  if (status === 'Sedang Disiapkan' || status === 'Sedang Dibuat') return 'Sedang Dibuat';
  if (status === 'Siap Diantar ke Meja' || status === 'Siap Diantar') return 'Siap Diantar';
  return 'Pesanan Diterima';
}

function normalizeOrders(rawOrders: any[]): Order[] {
  return (rawOrders || []).map((o) => ({
    ...o,
    status: normalizeOrderStatus(o?.status),
    paymentMethod: o?.paymentMethod || 'QRIS',
  }));
}

function normalizeMenuItems(items: MenuItem[]): MenuItem[] {
  return items.map((item) => {
    const fallback = INITIAL_MENU_ITEMS.find((m) => m.id === item.id);
    const stock = typeof item.stock === 'number' ? item.stock : fallback?.stock ?? 15;
    return {
      ...item,
      stock,
    };
  });
}

function normalizeCafeConfig(raw: any): CafeConfig {
  return {
    ...DEFAULT_CAFE_CONFIG,
    ...(raw || {}),
    policies: {
      ...DEFAULT_STORE_POLICIES,
      ...((raw && raw.policies) || {}),
    },
  };
}

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load config from localStorage
  const [cafeConfig, setCafeConfig] = useState<CafeConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
      if (saved) return normalizeCafeConfig(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to parse localStorage config');
    }
    return DEFAULT_CAFE_CONFIG;
  });

  // Load menu items from localStorage (normalized with stock)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_MENU);
      if (saved) return normalizeMenuItems(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to parse localStorage menu');
    }
    return INITIAL_MENU_ITEMS;
  });

  // Load orders from localStorage
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ORDERS);
      if (saved) return normalizeOrders(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to parse localStorage orders');
    }
    return SEED_ORDERS;
  });

  // Load low stock threshold
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_THRESHOLD);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed >= 1) return parsed;
      }
    } catch (e) {}
    return DEFAULT_LOW_STOCK_THRESHOLD;
  });

  // Load loyalty profile
  const [loyaltyProfile, setLoyaltyProfile] = useState<LoyaltyProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LOYALTY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LOYALTY_PROFILE;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>('customer');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isLowStockAlertDismissed, setIsLowStockAlertDismissed] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(cafeConfig));
    } catch (e) {}
  }, [cafeConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_MENU, JSON.stringify(menuItems));
    } catch (e) {}
  }, [menuItems]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_THRESHOLD, String(lowStockThreshold));
    } catch (e) {}
  }, [lowStockThreshold]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_LOYALTY, JSON.stringify(loyaltyProfile));
    } catch (e) {}
  }, [loyaltyProfile]);

  const lowStockItems = menuItems.filter(
    (item) => item.isAvailable && item.stock > 0 && item.stock <= lowStockThreshold
  );
  const outOfStockItems = menuItems.filter((item) => !item.isAvailable || item.stock <= 0);

  // Re-open alert automatically whenever new items hit low stock
  useEffect(() => {
    if (lowStockItems.length > 0 || outOfStockItems.length > 0) {
      setIsLowStockAlertDismissed(false);
    }
  }, [lowStockItems.length, outOfStockItems.length]);

  const updateCafeConfig = (newConfig: Partial<CafeConfig>) => {
    setCafeConfig((prev) => ({
      ...prev,
      ...newConfig,
      policies: newConfig.policies
        ? { ...prev.policies, ...newConfig.policies }
        : prev.policies,
    }));
  };

  const updateStorePolicies = (updates: Partial<StorePolicies>) => {
    setCafeConfig((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        ...updates,
      },
    }));
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `m_${Date.now()}`,
      stock: typeof item.stock === 'number' ? item.stock : 15,
    };
    setMenuItems((prev) => [newItem, ...prev]);
  };

  const toggleMenuAvailability = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextAvail = !item.isAvailable;
        return {
          ...item,
          isAvailable: nextAvail,
          stock: nextAvail && item.stock <= 0 ? lowStockThreshold + 5 : item.stock,
        };
      })
    );
  };

  const updateMenuPrice = (id: string, newPrice: number) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: newPrice } : item))
    );
  };

  const updateMenuStock = (id: string, newStock: number) => {
    const clamped = Math.max(0, newStock);
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stock: clamped,
              isAvailable: clamped > 0 ? true : false,
            }
          : item
      )
    );
  };

  const restockMenuItem = (id: string, addAmount = 10) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stock: item.stock + addAmount,
              isAvailable: true,
            }
          : item
      )
    );
  };

  const updateLowStockThreshold = (threshold: number) => {
    const safe = Math.max(1, Math.min(50, threshold));
    setLowStockThreshold(safe);
    setIsLowStockAlertDismissed(false);
  };

  const dismissLowStockAlert = () => setIsLowStockAlertDismissed(true);

  const addToCart = (
    menuItem: MenuItem,
    selectedSize: 'Regular' | 'Large',
    sugarLevel: CartItem['sugarLevel'],
    iceLevel: CartItem['iceLevel'],
    notes: string
  ) => {
    if (!menuItem.isAvailable || menuItem.stock <= 0) return;

    const basePrice = menuItem.price;
    const sizePrice = selectedSize === 'Large' ? basePrice + 5000 : basePrice;

    const cartId = `${menuItem.id}-${selectedSize}-${sugarLevel}-${iceLevel}-${notes.trim()}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.cartId === cartId);
      const currentQtyInCart = prev
        .filter((i) => i.menuItem.id === menuItem.id)
        .reduce((sum, i) => sum + i.quantity, 0);

      if (currentQtyInCart >= menuItem.stock) {
        return prev;
      }

      if (existing) {
        return prev.map((i) =>
          i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          cartId,
          menuItem,
          quantity: 1,
          selectedSize,
          sizePrice,
          sugarLevel,
          iceLevel,
          notes: notes.trim(),
        },
      ];
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const updateCartQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            if (delta > 0) {
              const liveMenu = menuItems.find((m) => m.id === item.menuItem.id);
              const totalForMenu = prev
                .filter((i) => i.menuItem.id === item.menuItem.id)
                .reduce((sum, i) => sum + i.quantity, 0);
              if (liveMenu && totalForMenu >= liveMenu.stock) {
                return item;
              }
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.sizePrice * item.quantity, 0);

  const activeReward = loyaltyProfile.activeReward;
  const appliedDiscount =
    activeReward && cartSubtotal >= activeReward.minOrderAmount
      ? Math.min(activeReward.discountAmount, cartSubtotal)
      : 0;
  const cartTotal = Math.max(0, cartSubtotal - appliedDiscount);

  const updateCustomerName = (name: string) => {
    setLoyaltyProfile((prev) => ({
      ...prev,
      customerName: name.trim() || 'Tamu Spesial',
    }));
  };

  const redeemLoyaltyReward = (reward: LoyaltyReward): { success: boolean; message: string } => {
    if (loyaltyProfile.points < reward.pointsCost) {
      return { success: false, message: 'Poin Anda belum mencukupi untuk hadiah ini.' };
    }
    if (loyaltyProfile.activeReward) {
      return {
        success: false,
        message: `Voucher "${loyaltyProfile.activeReward.title}" sedang aktif. Gunakan atau batalkan terlebih dahulu.`,
      };
    }

    const tx = {
      id: `loy-${Date.now()}`,
      type: 'redeem' as const,
      points: reward.pointsCost,
      description: `Tukar ${reward.title}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setLoyaltyProfile((prev) => ({
      ...prev,
      points: prev.points - reward.pointsCost,
      activeReward: reward,
      history: [tx, ...prev.history],
    }));

    return {
      success: true,
      message: `Berhasil menukar ${reward.pointsCost} poin untuk ${reward.title}!`,
    };
  };

  const cancelActiveReward = () => {
    if (!loyaltyProfile.activeReward) return;
    const refund = loyaltyProfile.activeReward.pointsCost;
    const title = loyaltyProfile.activeReward.title;

    setLoyaltyProfile((prev) => ({
      ...prev,
      points: prev.points + refund,
      activeReward: null,
      history: [
        {
          id: `loy-refund-${Date.now()}`,
          type: 'earn',
          points: refund,
          description: `Pengembalian Voucher ${title}`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.history,
      ],
    }));
  };

  const decrementStockForOrder = (targetOrder: Order) => {
    const qtyByMenuId: Record<string, number> = {};
    targetOrder.items.forEach((cartItem) => {
      qtyByMenuId[cartItem.menuItem.id] =
        (qtyByMenuId[cartItem.menuItem.id] || 0) + cartItem.quantity;
    });

    setMenuItems((prev) =>
      prev.map((menu) => {
        const bought = qtyByMenuId[menu.id];
        if (!bought) return menu;
        const remaining = Math.max(0, menu.stock - bought);
        return {
          ...menu,
          stock: remaining,
          isAvailable: remaining > 0 ? menu.isAvailable : false,
        };
      })
    );
  };

  const awardLoyaltyPointsForOrder = (targetOrder: Order) => {
    const ptsToAdd =
      typeof targetOrder.pointsEarned === 'number'
        ? targetOrder.pointsEarned
        : Math.max(5, Math.floor(targetOrder.totalAmount / 1000));

    setLoyaltyProfile((prev) => ({
      ...prev,
      points: prev.points + ptsToAdd,
      lifetimePoints: prev.lifetimePoints + ptsToAdd,
      history: [
        {
          id: `loy-earn-${Date.now()}`,
          type: 'earn',
          points: ptsToAdd,
          description: `Pesanan ${targetOrder.id} (${targetOrder.cafeName})`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.history,
      ],
    }));
  };

  const placeOrder = (paymentMethod: PaymentMethod = 'QRIS'): Order => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const earnedPoints = Math.max(5, Math.floor(cartTotal / 1000));
    const redeemedPts = appliedDiscount > 0 && activeReward ? activeReward.pointsCost : 0;

    const newOrder: Order = {
      id: `ORD-${randomNum}`,
      tableNumber: cafeConfig.tableNumber,
      cafeName: cafeConfig.name,
      items: [...cart],
      subtotal: cartSubtotal,
      discountAmount: appliedDiscount,
      pointsRedeemed: redeemedPts,
      pointsEarned: earnedPoints,
      totalAmount: cartTotal,
      status: 'Pesanan Diterima',
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod,
      paymentStatus: paymentMethod === 'Bayar di Kasir' ? 'Bayar di Kasir' : 'Pending',
      customerName: `${loyaltyProfile.customerName} (${cafeConfig.tableNumber})`,
    };

    // Consume active voucher if discount was applied
    if (appliedDiscount > 0 && activeReward) {
      setLoyaltyProfile((prev) => ({
        ...prev,
        activeReward: null,
      }));
    }

    // For Pay at Cashier, reserve stock immediately since order goes straight to KDS/Cashier
    if (paymentMethod === 'Bayar di Kasir') {
      decrementStockForOrder(newOrder);
    }

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    clearCart();
    return newOrder;
  };

  const finalizeOrderPaymentEffects = (orderId: string, paidStatus: 'Lunas - QRIS' | 'Lunas - Kasir' = 'Lunas - QRIS') => {
    const targetOrder = orders.find((o) => o.id === orderId) || activeOrder;
    if (
      !targetOrder ||
      targetOrder.paymentStatus === 'Lunas - QRIS' ||
      targetOrder.paymentStatus === 'Lunas - Kasir'
    ) {
      return;
    }

    const wasAlreadyQueuedAtCashier = targetOrder.paymentStatus === 'Bayar di Kasir';

    // 1. Mark order paid
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: paidStatus } : o))
    );
    if (activeOrder && activeOrder.id === orderId) {
      setActiveOrder((prev) => (prev ? { ...prev, paymentStatus: paidStatus } : null));
    }

    // 2. Automatically decrement stock if not already reserved at cashier order creation
    if (!wasAlreadyQueuedAtCashier) {
      decrementStockForOrder(targetOrder);
    }

    // 3. Award loyalty points
    awardLoyaltyPointsForOrder(targetOrder);
  };

  const verifyOrderPayment = async (orderId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/qris/verify-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: activeOrder?.totalAmount || 0,
          cafeName: cafeConfig.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        finalizeOrderPaymentEffects(orderId, 'Lunas - QRIS');
        return true;
      }
    } catch (e) {
      console.error('Webhook error:', e);
    }
    // Fallback sync
    finalizeOrderPaymentEffects(orderId, 'Lunas - QRIS');
    return true;
  };

  const confirmCashierPayment = (orderId: string) => {
    finalizeOrderPaymentEffects(orderId, 'Lunas - Kasir');
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    if (activeOrder && activeOrder.id === orderId) {
      setActiveOrder((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const paidOrders = orders.filter(
    (o) => o.paymentStatus === 'Lunas - QRIS' || o.paymentStatus === 'Lunas - Kasir'
  );
  const todayRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const todayOrderCount = paidOrders.length;

  return (
    <CafeContext.Provider
      value={{
        cafeConfig,
        updateCafeConfig,
        updateStorePolicies,
        menuItems,
        addMenuItem,
        toggleMenuAvailability,
        updateMenuPrice,
        updateMenuStock,
        restockMenuItem,
        lowStockThreshold,
        updateLowStockThreshold,
        lowStockItems,
        outOfStockItems,
        isLowStockAlertDismissed,
        dismissLowStockAlert,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        appliedDiscount,
        cartTotal,
        orders,
        placeOrder,
        verifyOrderPayment,
        confirmCashierPayment,
        updateOrderStatus,
        activeView,
        setActiveView,
        isDemoModalOpen,
        setIsDemoModalOpen,
        activeOrder,
        setActiveOrder,
        todayRevenue,
        todayOrderCount,
        loyaltyProfile,
        updateCustomerName,
        redeemLoyaltyReward,
        cancelActiveReward,
      }}
    >
      {children}
    </CafeContext.Provider>
  );
};

export const useCafe = () => {
  const context = useContext(CafeContext);
  if (!context) {
    throw new Error('useCafe must be used within a CafeProvider');
  }
  return context;
};
