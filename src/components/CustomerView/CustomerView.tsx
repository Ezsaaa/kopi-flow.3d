import React, { useState } from 'react';
import {
  Coffee,
  ShoppingBag,
  Bot,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Flame,
  Sparkles,
  MapPin,
  CheckCircle2,
  ChefHat,
  Bell,
  Wifi,
  Copy,
  Award,
  AlertTriangle,
  Ticket,
  QrCode,
  Store,
  X,
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { Category, MenuItem, CartItem, PaymentMethod } from '../../types';
import { HeroCoffeeCup3D } from '../3d/HeroCoffeeCup3D';
import { DrinkSize3DVisualizer } from '../3d/DrinkSize3DVisualizer';
import { InlineEdit } from '../common/InlineEdit';
import { BaristaAIChatModal } from './BaristaAIChatModal';
import { DynamicQRISModal } from './DynamicQRISModal';
import { CustomerProfileModal } from './CustomerProfileModal';

export const CustomerView: React.FC = () => {
  const {
    cafeConfig,
    updateCafeConfig,
    menuItems,
    lowStockThreshold,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    appliedDiscount,
    cartTotal,
    placeOrder,
    activeOrder,
    setActiveOrder,
    orders,
    loyaltyProfile,
    cancelActiveReward,
  } = useCafe();

  const [selectedCategory, setSelectedCategory] = useState<Category | 'Semua'>('Semua');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isQRISModalOpen, setIsQRISModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [wifiCopiedBanner, setWifiCopiedBanner] = useState(false);

  // Detail Modal customization state
  const [modalSize, setModalSize] = useState<'Regular' | 'Large'>('Regular');
  const [modalSugar, setModalSugar] = useState<CartItem['sugarLevel']>('Normal (100%)');
  const [modalIce, setModalIce] = useState<CartItem['iceLevel']>('Normal Ice');
  const [modalNotes, setModalNotes] = useState('');

  // Table switcher dropdown
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const tables = ['Meja 01', 'Meja 02', 'Meja 03', 'Meja 04', 'Meja 05', 'Meja 06', 'Meja 10', 'VIP Lounge'];

  const categories: (Category | 'Semua')[] = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan Ringan', 'Makanan Berat'];

  const filteredMenu = menuItems.filter((item) => {
    if (selectedCategory === 'Semua') return true;
    return item.category === selectedCategory;
  });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const openItemDetail = (item: MenuItem) => {
    if (!item.isAvailable || item.stock <= 0) return;
    setSelectedMenuItem(item);
    setModalSize('Regular');
    setModalSugar('Normal (100%)');
    setModalIce('Normal Ice');
    setModalNotes('');
  };

  const handleConfirmAddToCart = () => {
    if (!selectedMenuItem) return;
    const currentQtyInCart = cart
      .filter((i) => i.menuItem.id === selectedMenuItem.id)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (currentQtyInCart >= selectedMenuItem.stock) {
      setAddedToast(`Stok ${selectedMenuItem.name} maksimal (${selectedMenuItem.stock} porsi)`);
      setTimeout(() => setAddedToast(null), 2400);
      setSelectedMenuItem(null);
      return;
    }

    const itemName = selectedMenuItem.name;
    addToCart(selectedMenuItem, modalSize, modalSugar, modalIce, modalNotes);
    setSelectedMenuItem(null);
    setAddedToast(`${itemName} masuk ke keranjang`);
    setTimeout(() => setAddedToast(null), 2200);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    placeOrder(paymentMethod);
    setIsCartOpen(false);
    setIsQRISModalOpen(true);
  };

  // Find live order matching the active table
  const currentLiveOrder =
    activeOrder && activeOrder.tableNumber === cafeConfig.tableNumber
      ? activeOrder
      : orders.find((o) => o.tableNumber === cafeConfig.tableNumber) || null;

  const handleCopyTrackerWifi = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cafeConfig.wifiPassword);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = cafeConfig.wifiPassword;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
    } catch (e) {
      // Clipboard fallback safely ignored
    }
    setWifiCopiedBanner(true);
    setTimeout(() => setWifiCopiedBanner(false), 2500);
  };

  return (
    <div className="min-h-screen bg-amber-50/40 pb-28">
      {/* Mobile Frame Container for realistic presentation preview */}
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl border-x border-amber-200/60 relative flex flex-col">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white p-4 pt-5 rounded-b-3xl shadow-lg relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10">
            {/* Table Selector Chip */}
            <div className="flex items-center justify-between mb-3">
              <div className="relative">
                <button
                  onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{cafeConfig.tableNumber}</span>
                  <span className="text-[10px] bg-amber-500 text-amber-950 font-extrabold px-1.5 py-0.2 rounded-full">
                    Ganti Meja
                  </span>
                </button>

                {isTableDropdownOpen && (
                  <div className="absolute left-0 top-9 z-30 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 py-2 w-44 animate-fadeIn">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Daftar Meja
                    </div>
                    {tables.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          updateCafeConfig({ tableNumber: t });
                          setIsTableDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-xs text-left font-medium hover:bg-amber-50 flex items-center justify-between ${
                          cafeConfig.tableNumber === t ? 'text-amber-900 font-bold bg-amber-50' : ''
                        }`}
                      >
                        <span>{t}</span>
                        {cafeConfig.tableNumber === t && <Check className="w-3.5 h-3.5 text-amber-700" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-1.5 bg-amber-400/20 hover:bg-amber-400/30 px-3 py-1 rounded-full border border-amber-300/40 text-amber-200 text-xs font-bold transition-colors"
                title="Buka Profil & Poin Loyalitas"
              >
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-mono tabular-nums">{loyaltyProfile.points} Poin</span>
              </button>
            </div>

            {/* CAFE NAME (INLINE EDIT ON THE SPOT) */}
            <div className="mb-1">
              <InlineEdit
                value={cafeConfig.name}
                onSave={(val) => updateCafeConfig({ name: val })}
                tag="h1"
                className="text-2xl font-bold font-serif-display text-amber-100 tracking-tight"
              />
            </div>

            {/* CAFE TAGLINE (INLINE EDIT) */}
            <div className="text-xs text-amber-200/80">
              <InlineEdit
                value={cafeConfig.tagline}
                onSave={(val) => updateCafeConfig({ tagline: val })}
                tag="p"
                className="text-xs text-amber-200/80"
              />
            </div>
          </div>
        </div>

        {/* 3D HERO COFFEE CUP BANNER */}
        <div className="px-4 -mt-2">
          <div className="bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 rounded-3xl p-3 shadow-xl border border-amber-700/50 text-white relative overflow-hidden">
            <div className="flex items-center justify-between px-2 pt-1 mb-[-10px] relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Racikan Spesial Hari Ini</span>
              </div>
              <span className="text-[10px] bg-amber-800/80 text-amber-200 px-2 py-0.5 rounded-full border border-amber-600/40">
                Tampilan 3D
              </span>
            </div>

            {/* 3D Canvas */}
            <HeroCoffeeCup3D />
          </div>
        </div>

        {/* ADD-TO-CART BRIEF TOAST FEEDBACK */}
        {addedToast && (
          <div className="mx-4 mt-3 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{addedToast}</span>
          </div>
        )}

        {/* FRANCHISE-GRADE VISUAL ORDER STATUS TRACKER */}
        {currentLiveOrder && (() => {
          const stepIndex =
            currentLiveOrder.status === 'Siap Diantar'
              ? 2
              : currentLiveOrder.status === 'Sedang Dibuat'
              ? 1
              : 0;
          const progressWidth = stepIndex === 2 ? '100%' : stepIndex === 1 ? '50%' : '12%';
          const statusCaption =
            stepIndex === 2
              ? `Pesanan sudah siap & sedang diantar ke ${currentLiveOrder.tableNumber}!`
              : stepIndex === 1
              ? 'Barista sedang menyiapkan racikan pesanan Anda.'
              : currentLiveOrder.paymentStatus === 'Bayar di Kasir'
              ? `Pesanan diterima dapur. Silakan selesaikan pembayaran di kasir.`
              : `Pesanan diterima dan segera diproses oleh dapur.`;

          const steps = [
            { label: 'Pesanan Diterima', Icon: CheckCircle2 },
            { label: 'Sedang Dibuat', Icon: ChefHat },
            { label: 'Siap Diantar', Icon: Bell },
          ];

          return (
            <div className="mx-4 mt-4 p-4 bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 text-white rounded-3xl shadow-lg border border-emerald-500/40 animate-fadeIn space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold tracking-wide uppercase text-emerald-200 truncate">
                      Status Pesanan • {currentLiveOrder.id}
                    </div>
                    <div className="text-[10px] text-emerald-300/90 font-medium">
                      {currentLiveOrder.tableNumber} •{' '}
                      {currentLiveOrder.paymentStatus === 'Pending'
                        ? 'Menunggu Pembayaran QRIS'
                        : currentLiveOrder.paymentStatus}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveOrder(currentLiveOrder);
                    setIsQRISModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] text-white font-bold shrink-0 transition-colors"
                >
                  {currentLiveOrder.paymentStatus === 'Pending' ? 'Bayar QRIS' : 'Lihat Struk'}
                </button>
              </div>

              {/* Visual Progress Bar & Nodes */}
              <div className="relative pt-1">
                <div className="h-1.5 bg-emerald-950/80 rounded-full overflow-hidden mb-2.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: progressWidth }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {steps.map((step, idx) => {
                    const isDone = idx < stepIndex;
                    const isCurrent = idx === stepIndex;
                    const StepIcon = step.Icon;
                    return (
                      <div
                        key={step.label}
                        className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                            : isDone
                            ? 'bg-emerald-800/80 text-emerald-100 border-emerald-500/40'
                            : 'bg-emerald-950/50 text-emerald-400/70 border-emerald-800/40'
                        }`}
                      >
                        <StepIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold leading-tight">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] text-emerald-100/90 leading-snug">{statusCaption}</p>

              {/* Auto WiFi Access Strip strictly unlocked after payment succeeds */}
              {currentLiveOrder.paymentStatus === 'Lunas - QRIS' ||
              currentLiveOrder.paymentStatus === 'Lunas - Kasir' ? (
                <div className="bg-black/25 rounded-xl px-3 py-2.5 border border-white/15 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wifi className="w-4 h-4 text-amber-300 shrink-0" />
                    <div className="text-[11px] min-w-0">
                      <div className="text-emerald-200/85 truncate">
                        WiFi:{' '}
                        <span className="font-mono font-semibold text-white">
                          {cafeConfig.name.replace(/\s+/g, '_')}_Guest
                        </span>
                      </div>
                      <div className="truncate">
                        <span className="text-emerald-200/85 mr-1">Password:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {cafeConfig.wifiPassword}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTrackerWifi}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors ${
                      wifiCopiedBanner
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-400 hover:bg-amber-300 text-amber-950'
                    }`}
                  >
                    {wifiCopiedBanner ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin WiFi</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-black/20 rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2 text-[10px] text-emerald-200/85">
                  <Wifi className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
                  <span>
                    Password Wi-Fi kafe otomatis terbuka setelah pembayaran selesai.
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* CATEGORY TABS */}
        <div className="px-4 mt-5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-amber-900 text-white shadow-md scale-105'
                      : 'bg-white text-slate-700 hover:bg-amber-100/60 border border-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* MENU CATALOG GRID */}
        <div className="px-4 mt-3 flex-1 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>Menampilkan {filteredMenu.length} Pilihan Menu</span>
            <span>Harga dalam Rupiah</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredMenu.map((item) => {
              const isOutOfStock = !item.isAvailable || item.stock <= 0;
              const isAlmostSoldOut = !isOutOfStock && item.stock <= lowStockThreshold;

              return (
                <div
                  key={item.id}
                  onClick={() => openItemDetail(item)}
                  className={`bg-white rounded-2xl p-2.5 border shadow-sm transition-all duration-300 flex flex-col group relative overflow-hidden ${
                    isOutOfStock
                      ? 'border-slate-200 opacity-65 cursor-not-allowed'
                      : isAlmostSoldOut
                      ? 'border-amber-300 hover:shadow-md hover:-translate-y-1 cursor-pointer'
                      : 'border-amber-100 hover:shadow-md hover:-translate-y-1 cursor-pointer'
                  }`}
                >
                  {/* Status Tag (Almost Sold Out / Sold Out / Popular) */}
                  {isOutOfStock ? (
                    <span className="absolute top-3 left-3 z-10 bg-slate-900/90 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                      Sold Out
                    </span>
                  ) : isAlmostSoldOut ? (
                    <span className="absolute top-3 left-3 z-10 bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Almost Sold Out · Sisa {item.stock}</span>
                    </span>
                  ) : item.isPopular ? (
                    <span className="absolute top-3 left-3 z-10 bg-amber-500 text-amber-950 font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-xs">
                      ★ Best Seller
                    </span>
                  ) : null}

                  {/* Product Image */}
                  <div className="w-full h-32 rounded-xl overflow-hidden bg-amber-100/50 relative mb-2">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        isOutOfStock ? 'grayscale' : 'group-hover:scale-105'
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-amber-800">{item.category}</span>
                        {isAlmostSoldOut && (
                          <span className="text-rose-600 font-semibold normal-case">Stok menipis</span>
                        )}
                      </div>
                      <h3 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-amber-900 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs font-black font-mono tabular-nums text-amber-950">
                        Rp {item.price.toLocaleString('id-ID')}
                      </div>
                      <button
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          openItemDetail(item);
                        }}
                        className={`p-1.5 rounded-xl transition-colors shadow-2xs ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-amber-900 text-white hover:bg-amber-950'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FLOATING ACTION BUTTONS */}

        {/* 1. BARISTA AI ASSISTANT BUTTON */}
        <div
          className={`fixed left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex justify-end pointer-events-none z-30 transition-all ${
            cart.length > 0 ? 'bottom-24' : 'bottom-5'
          }`}
        >
          <button
            onClick={() => setIsAIChatOpen(true)}
            className="pointer-events-auto bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white px-4 py-2.5 rounded-full shadow-2xl border border-amber-400/40 flex items-center gap-2 hover:scale-105 transition-all active:scale-95 animate-pulse-subtle"
          >
            <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold pr-1">Tanya Barista AI</span>
          </button>
        </div>

        {/* 2. FLOATING BOTTOM CART BAR */}
        {cart.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[416px] z-40 bg-slate-950 text-white p-3.5 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-amber-800 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-amber-200" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center">
                  {cartItemCount}
                </span>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Total Pesanan ({cartItemCount} item)</div>
                <div className="text-base font-black font-mono text-amber-300">
                  Rp {cartTotal.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-amber-950 font-bold text-xs hover:from-amber-300 hover:to-amber-200 shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Lihat Keranjang</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ITEM CUSTOMIZATION MODAL (WITH 3D CUP SIZE VISUALIZER) */}
        {selectedMenuItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-200">
              <div className="relative h-44 bg-amber-100 overflow-hidden">
                <img
                  src={selectedMenuItem.imageUrl}
                  alt={selectedMenuItem.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedMenuItem(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/60 text-white hover:bg-slate-950 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-3 bg-amber-950/90 text-amber-200 text-xs font-semibold px-3 py-1 rounded-full">
                  {selectedMenuItem.category}
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold font-serif-display text-slate-900">
                      {selectedMenuItem.name}
                    </h3>
                    {selectedMenuItem.stock <= lowStockThreshold && selectedMenuItem.stock > 0 && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                        Almost Sold Out · Sisa {selectedMenuItem.stock}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{selectedMenuItem.description}</p>
                  <div className="text-lg font-black font-mono tabular-nums text-amber-950 mt-2">
                    Rp {(modalSize === 'Large' ? selectedMenuItem.price + 5000 : selectedMenuItem.price).toLocaleString('id-ID')}
                  </div>
                </div>

                {/* 3D CUP SIZE COMPARISON VISUALIZER */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                    1. Pilih Ukuran (Preview 3D)
                  </label>
                  <DrinkSize3DVisualizer selectedSize={modalSize} category={selectedMenuItem.category} />

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setModalSize('Regular')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        modalSize === 'Regular'
                          ? 'border-amber-800 bg-amber-50 text-amber-950 shadow-xs'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Regular (12 oz)
                      <div className="text-[10px] font-normal text-slate-500">Harga Standar</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalSize('Large')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        modalSize === 'Large'
                          ? 'border-amber-800 bg-amber-50 text-amber-950 shadow-xs'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Large (16 oz)
                      <div className="text-[10px] font-normal text-amber-700">+ Rp 5.000</div>
                    </button>
                  </div>
                </div>

                {/* SUGAR & ICE CUSTOMIZATION FOR ALL DRINKS */}
                {(selectedMenuItem.category === 'Kopi' || selectedMenuItem.category === 'Non-Kopi') && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                        2. Level Gula / Kemanisan
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Normal (100%)', 'Less Sugar (50%)', 'No Sugar (0%)'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setModalSugar(lvl)}
                            className={`p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                              modalSugar === lvl
                                ? 'border-amber-800 bg-amber-50 text-amber-950'
                                : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            {lvl.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                        3. Level Es Batu
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Normal Ice', 'Less Ice', 'No Ice'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setModalIce(lvl)}
                            className={`p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                              modalIce === lvl
                                ? 'border-amber-800 bg-amber-50 text-amber-950'
                                : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* NOTES */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                    Catatan Pesanan Khusus
                  </label>
                  <input
                    type="text"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="Contoh: extra es batu, pisahkan gula, tanpa bawang"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-800"
                  />
                </div>

                <button
                  onClick={handleConfirmAddToCart}
                  className="w-full py-3 rounded-2xl bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan ke Keranjang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CART DRAWER MODAL */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-amber-200">
              <div className="p-4 bg-gradient-to-r from-amber-900 to-amber-950 text-white rounded-t-3xl flex items-center justify-between">
                <div>
                  <h3 className="font-serif-display font-bold text-base text-amber-100">
                    Keranjang Pesanan ({cafeConfig.tableNumber})
                  </h3>
                  <p className="text-[11px] text-amber-300/80">{cafeConfig.name}</p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {cart.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Keranjang Masih Kosong</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Silakan pilih minuman atau makanan favorit Anda dari katalog menu.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="px-4 py-2 rounded-xl bg-amber-900 text-white text-xs font-bold hover:bg-amber-950 transition-colors"
                    >
                      Pilih Menu
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.cartId}
                      className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60"
                    >
                      <div className="flex-1 pr-3">
                        <h4 className="font-bold text-xs text-slate-900">{item.menuItem.name}</h4>
                        <div className="text-[10px] text-slate-500">
                          {item.selectedSize} • {item.sugarLevel.split(' ')[0]} • {item.iceLevel}
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-amber-800 font-medium">
                            Catatan: {item.notes}
                          </div>
                        )}
                        <div className="font-mono font-bold text-xs text-amber-950 mt-1">
                          Rp {(item.sizePrice * item.quantity).toLocaleString('id-ID')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
                        <button
                          onClick={() => updateCartQuantity(item.cartId, -1)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-700"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.cartId, 1)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 rounded-b-3xl">
                {/* Loyalty Voucher & Points Preview */}
                {loyaltyProfile.activeReward ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Ticket className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-emerald-950 truncate">
                          {loyaltyProfile.activeReward.title}
                        </div>
                        {appliedDiscount > 0 ? (
                          <div className="text-[10px] text-emerald-700">
                            Potongan aktif diterapkan (-Rp {appliedDiscount.toLocaleString('id-ID')})
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-800">
                            Tambah Rp {(loyaltyProfile.activeReward.minOrderAmount - cartSubtotal).toLocaleString('id-ID')} lagi untuk pakai voucher
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={cancelActiveReward}
                      className="text-[10px] font-bold text-slate-600 hover:text-rose-700 underline shrink-0"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsProfileOpen(true);
                    }}
                    className="w-full p-2.5 rounded-xl bg-amber-100/70 hover:bg-amber-100 border border-amber-200 flex items-center justify-between text-xs text-amber-950 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Award className="w-4 h-4 text-amber-700" />
                      <span>Punya {loyaltyProfile.points} Poin Loyalitas</span>
                    </span>
                    <span className="font-bold text-amber-800">Tukar Diskon →</span>
                  </button>
                )}

                {/* PAYMENT METHOD SELECTOR (QRIS vs BAYAR DI KASIR) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                        paymentMethod === 'QRIS'
                          ? 'border-amber-800 bg-amber-50 text-amber-950 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold">QRIS Instan</div>
                        <div className="text-[10px] text-slate-500">E-Wallet & M-Banking</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Bayar di Kasir')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                        paymentMethod === 'Bayar di Kasir'
                          ? 'border-amber-800 bg-amber-50 text-amber-950 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Store className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold">Bayar di Kasir</div>
                        <div className="text-[10px] text-slate-500">Tunai / Kartu Debit</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  {appliedDiscount > 0 && (
                    <>
                      <div className="flex justify-between text-slate-500 font-mono">
                        <span>Subtotal:</span>
                        <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-mono font-semibold">
                        <span>Diskon Poin:</span>
                        <span>- Rp {appliedDiscount.toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center text-sm font-black font-mono pt-1">
                    <span>TOTAL BAYAR:</span>
                    <span className="text-amber-950 text-lg">Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-[11px] text-amber-800 font-semibold flex items-center justify-between">
                    <span>Estimasi Poin Didapat:</span>
                    <span className="font-mono">+{Math.max(5, Math.floor(cartTotal / 1000))} Poin</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                    cart.length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-amber-400 to-amber-300 text-amber-950 hover:from-amber-300 hover:to-amber-200'
                  }`}
                >
                  <span>
                    {paymentMethod === 'QRIS'
                      ? 'Bayar Sekarang (QRIS)'
                      : 'Kirim Pesanan & Bayar di Kasir'}
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BARISTA AI ASSISTANT CHAT MODAL */}
        <BaristaAIChatModal
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          onSelectMenuItem={openItemDetail}
        />

        {/* CUSTOMER LOYALTY PROFILE MODAL */}
        <CustomerProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

        {/* DYNAMIC QRIS & PAYMENT CONFIRMATION MODAL */}
        <DynamicQRISModal
          order={activeOrder || currentLiveOrder}
          isOpen={isQRISModalOpen}
          onClose={() => setIsQRISModalOpen(false)}
          onPaymentSuccess={() => {
            // keep order active
          }}
        />
      </div>
    </div>
  );
};
