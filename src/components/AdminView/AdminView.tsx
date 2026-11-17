import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Plus,
  Edit,
  Eye,
  EyeOff,
  QrCode,
  Store,
  Layers,
  Sparkles,
  Printer,
  Check,
  AlertTriangle,
  BellRing,
  Minus,
  PackagePlus,
  X,
  ScrollText,
  RotateCcw,
  Banknote,
  MapPin,
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { Category, MenuItem } from '../../types';
import { DEFAULT_STORE_POLICIES } from '../../constants/initialData';
import { AcrylicQRStand3D } from '../3d/AcrylicQRStand3D';
import { InlineEdit } from '../common/InlineEdit';

export const AdminView: React.FC = () => {
  const {
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
    orders,
    confirmCashierPayment,
    todayRevenue,
    todayOrderCount,
    setIsDemoModalOpen,
  } = useCafe();

  const [activeTab, setActiveTab] = useState<'omzet' | 'menu' | 'qr-stand' | 'policies'>('omzet');
  const [qrDownloaded, setQrDownloaded] = useState(false);

  // Menu form state
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [newMenu, setNewMenu] = useState({
    name: '',
    category: 'Kopi' as Category,
    price: 25000,
    description: '',
    imageUrl: '/src/assets/images/coffee_espresso_latte_1794502599204.jpg',
    caffeine: 'Tinggi' as MenuItem['caffeine'],
    sweetness: 'Normal' as MenuItem['sweetness'],
    isAvailable: true,
    stock: 15,
  });

  // Table QR Stand generator state
  const [selectedQRTable, setSelectedQRTable] = useState('Meja 04');
  const tableOptions = Array.from({ length: 12 }, (_, i) => `Meja ${String(i + 1).padStart(2, '0')}`);

  const handleDownloadStandQR = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 512, 720);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(0, 0, 512, 120);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cafeConfig.name, 256, 68);
        ctx.font = '18px sans-serif';
        ctx.fillText('SCAN QR UNTUK PESAN & BAYAR', 256, 100);

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.roundRect(140, 145, 232, 56, 28);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(selectedQRTable, 256, 184);

        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 6;
        ctx.strokeRect(116, 230, 280, 280);
        ctx.fillStyle = '#1E1B18';
        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            if ((r * 3 + c * 5) % 2 === 0 || (r < 3 && c < 3) || (r < 3 && c > 6) || (r > 6 && c < 3)) {
              ctx.fillRect(142 + c * 23, 256 + r * 23, 17, 17);
            }
          }
        }

        ctx.fillStyle = '#334155';
        ctx.font = '22px sans-serif';
        ctx.fillText('Pesan Mandiri • QRIS & Bayar di Kasir', 256, 580);

        const link = document.createElement('a');
        link.download = `Stand-QR-${selectedQRTable.replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (e) {
      // Ignore canvas download issues in restricted iframes
    }
    setQrDownloaded(true);
    setTimeout(() => setQrDownloaded(false), 3000);
  };

  const handleAddMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenu.name.trim()) return;
    addMenuItem(newMenu);
    setIsAddMenuOpen(false);
    setNewMenu({
      name: '',
      category: 'Kopi',
      price: 25000,
      description: '',
      imageUrl: '/src/assets/images/coffee_espresso_latte_1794502599204.jpg',
      caffeine: 'Tinggi',
      sweetness: 'Normal',
      isAvailable: true,
      stock: 15,
    });
  };

  const avgBasketSize = todayOrderCount > 0 ? Math.round(todayRevenue / todayOrderCount) : 0;
  const alertedItems = [...outOfStockItems, ...lowStockItems];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-200">
                Panel Admin Kafe
              </span>
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="text-xs text-amber-800 font-bold underline hover:text-amber-950 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Ganti Identitas Kafe</span>
              </button>
            </div>
            <InlineEdit
              value={cafeConfig.name}
              onSave={(val) => updateCafeConfig({ name: val })}
              tag="h1"
              className="text-3xl font-bold font-serif-display text-slate-900 tracking-tight"
            />
            <p className="text-xs text-slate-500 mt-1">{cafeConfig.tagline} • {cafeConfig.address}</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('omzet')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'omzet' ? 'bg-amber-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Ringkasan & Meja
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'menu' ? 'bg-amber-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>☕ Kelola Menu</span>
              {alertedItems.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-mono tabular-nums">
                  {alertedItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('qr-stand')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'qr-stand' ? 'bg-amber-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🪑 Daftar Meja & QR
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'policies' ? 'bg-amber-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>Kebijakan Kafe</span>
            </button>
          </div>
        </div>

        {/* AUTOMATED LOW STOCK VISUAL NOTIFICATION ALERT */}
        {alertedItems.length > 0 && !isLowStockAlertDismissed && (
          <div
            role="alert"
            className="bg-amber-50 border border-rose-300 rounded-3xl p-4 sm:p-5 shadow-md space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-rose-950">
                      Peringatan Stok Menipis Otomatis ({alertedItems.length} Menu)
                    </h2>
                    <span className="text-[11px] font-medium text-rose-800">
                      Ambang batas aktif: ≤ {lowStockThreshold} porsi
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Menu di bawah ini otomatis ditandai <strong className="text-rose-800">"Almost Sold Out"</strong> di tampilan pelanggan hingga Anda melakukan restock.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeTab !== 'menu' && (
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="px-3 py-1.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold transition-colors"
                  >
                    Kelola Stok
                  </button>
                )}
                <button
                  onClick={dismissLowStockAlert}
                  aria-label="Tutup notifikasi stok"
                  className="p-1.5 rounded-xl text-slate-500 hover:bg-rose-100 hover:text-rose-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {alertedItems.map((item) => {
                const isZero = !item.isAvailable || item.stock <= 0;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-3 border border-rose-200 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[11px] font-semibold flex items-center gap-1.5 mt-0.5">
                        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isZero ? 'text-slate-700' : 'text-rose-600'}`} />
                        <span className={isZero ? 'text-slate-700' : 'text-rose-700'}>
                          {isZero ? 'Habis (Sold Out)' : `Sisa ${item.stock} · Almost Sold Out`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => restockMenuItem(item.id, 10)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold whitespace-nowrap shrink-0 flex items-center gap-1 transition-colors"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>+10</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 1: RINGKASAN OMZET OTOMATIS */}
        {activeTab === 'omzet' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Pendapatan Hari Ini
                  </span>
                  <div className="text-3xl font-black font-mono text-emerald-700 mt-1">
                    Rp {todayRevenue.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[11px] text-emerald-800 font-semibold mt-1 inline-block">
                    ✓ Otomatis bertambah tiap transaksi QRIS
                  </span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Jumlah Pesanan Lunas
                  </span>
                  <div className="text-3xl font-black font-mono text-amber-950 mt-1">
                    {todayOrderCount} Transaksi
                  </div>
                  <span className="text-[11px] text-amber-800 font-semibold mt-1 inline-block">
                    Tanpa perlu antre di meja kasir
                  </span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-8 h-8" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-blue-200 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Rata-rata Transaksi
                  </span>
                  <div className="text-3xl font-black font-mono text-blue-900 mt-1">
                    Rp {avgBasketSize.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[11px] text-blue-700 font-semibold mt-1 inline-block">
                    Per pesanan meja
                  </span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* LIVE DAFTAR MEJA & PESANAN TERKINI */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold font-serif-display text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-800" />
                    <span>Daftar Meja & Pesanan Masuk ({orders.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Nomor meja, rincian menu, metode pembayaran, dan status pesanan otomatis tercatat secara langsung.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-4">Nomor Meja</th>
                      <th className="p-4">No. Pesanan</th>
                      <th className="p-4">Menu Dipesan</th>
                      <th className="p-4">Metode Bayar</th>
                      <th className="p-4">Status Pesanan</th>
                      <th className="p-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          Belum ada pesanan masuk hari ini.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const isCashierPending = order.paymentStatus === 'Bayar di Kasir';
                        const isPaid =
                          order.paymentStatus === 'Lunas - QRIS' ||
                          order.paymentStatus === 'Lunas - Kasir';
                        return (
                          <tr key={order.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="p-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-extrabold border border-amber-200">
                                {order.tableNumber}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="font-mono font-bold text-slate-900">{order.id}</div>
                              <div className="text-[10px] text-slate-500">{order.createdAt}</div>
                            </td>
                            <td className="p-4 text-slate-700 max-w-xs">
                              {order.items.map((it) => `${it.quantity}x ${it.menuItem.name}`).join(', ')}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                    isPaid
                                      ? 'bg-emerald-100 text-emerald-900'
                                      : isCashierPending
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {order.paymentStatus === 'Pending'
                                    ? 'Menunggu QRIS'
                                    : order.paymentStatus}
                                </span>
                                {isCashierPending && (
                                  <button
                                    onClick={() => confirmCashierPayment(order.id)}
                                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                                  >
                                    <Banknote className="w-3 h-3" />
                                    <span>Terima Bayar</span>
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  order.status === 'Siap Diantar'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : order.status === 'Sedang Dibuat'
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              Rp {order.totalAmount.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Benefit Pitch Section */}
            <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white rounded-3xl p-6 shadow-xl border border-amber-800">
              <h3 className="text-xl font-bold font-serif-display text-amber-100">
                Keunggulan Operasional untuk Pemilik Kafe
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
                  <div className="font-bold text-amber-300 text-sm">⚡ Efisiensi Kerja Staf</div>
                  <p className="text-amber-100/80 leading-relaxed">
                    Mengurangi antrean di kasir hingga 70% sehingga barista bisa fokus meracik minuman terbaik.
                  </p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
                  <div className="font-bold text-amber-300 text-sm">🚀 Zero Salah Catat</div>
                  <p className="text-amber-100/80 leading-relaxed">
                    Nomor meja, pilihan ukuran, level gula, dan catatan khusus langsung tercatat otomatis ke dapur.
                  </p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-1">
                  <div className="font-bold text-amber-300 text-sm">💰 Peluang Omzet Naik</div>
                  <p className="text-amber-100/80 leading-relaxed">
                    Pelanggan bebas memilih menu, upgrade ukuran cup, dan mengumpulkan poin loyalitas langsung dari meja.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAJEMEN MENU & STOK */}
        {activeTab === 'menu' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-serif-display">
                  Kelola Menu {cafeConfig.name} ({menuItems.length} Item)
                </h2>
                <p className="text-xs text-slate-500">
                  Stok berkurang otomatis saat pesanan masuk dan memicu peringatan saat mencapai ambang batas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Low Stock Threshold Setting */}
                <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs shadow-2xs">
                  <span className="font-semibold text-slate-700 whitespace-nowrap">
                    Ambang Low Stock:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateLowStockThreshold(lowStockThreshold - 1)}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold w-6 text-center tabular-nums text-amber-950">
                      {lowStockThreshold}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateLowStockThreshold(lowStockThreshold + 1)}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddMenuOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Menu Baru</span>
                </button>
              </div>
            </div>

            {/* Menu Items Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-4">Item Menu</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Harga (Rp)</th>
                      <th className="p-4">Stok Tersisa</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {menuItems.map((item) => {
                      const isZero = !item.isAvailable || item.stock <= 0;
                      const isLow = !isZero && item.stock <= lowStockThreshold;

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isZero
                              ? 'bg-slate-50/70'
                              : isLow
                              ? 'bg-rose-50/40 hover:bg-rose-50/70'
                              : 'hover:bg-amber-50/40'
                          }`}
                        >
                          <td className="p-4 flex items-center gap-3">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{item.name}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1">{item.description}</div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 whitespace-nowrap">{item.category}</td>
                          <td className="p-4 font-mono font-bold tabular-nums text-amber-950 whitespace-nowrap">
                            <InlineEdit
                              value={`Rp ${item.price.toLocaleString('id-ID')}`}
                              onSave={(val) => {
                                const parsed = parseInt(val.replace(/[^0-9]/g, ''));
                                if (parsed) updateMenuPrice(item.id, parsed);
                              }}
                              tag="span"
                            />
                          </td>
                          <td className="p-4">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 border border-slate-200">
                              <button
                                type="button"
                                onClick={() => updateMenuStock(item.id, item.stock - 1)}
                                className="p-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-2xs"
                                title="Kurangi stok"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span
                                className={`font-mono font-bold tabular-nums w-8 text-center ${
                                  isZero ? 'text-slate-500' : isLow ? 'text-rose-700' : 'text-slate-900'
                                }`}
                              >
                                {item.stock}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateMenuStock(item.id, item.stock + 1)}
                                className="p-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 shadow-2xs"
                                title="Tambah stok"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => toggleMenuAvailability(item.id)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition-all whitespace-nowrap ${
                                isZero
                                  ? 'bg-slate-200 text-slate-800 border border-slate-300'
                                  : isLow
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              }`}
                            >
                              {isZero ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-slate-700" /> Habis (Sold Out)
                                </>
                              ) : isLow ? (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" /> Low Stock
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-emerald-700" /> Tersedia
                                </>
                              )}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => restockMenuItem(item.id, 10)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[11px] inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              <span>Restock +10</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DAFTAR MEJA & STAND QR 3D */}
        {activeTab === 'qr-stand' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Daftar Meja & Generator QR
                </span>
                <h3 className="text-2xl font-bold font-serif-display text-slate-900 mt-1">
                  Stand QR Kode Meja
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Tampilkan pratinjau stand akrilik 3D yang siap dipasang di setiap meja kafe.{' '}
                  <strong>{cafeConfig.name}</strong> dan nomor meja langsung muncul pada plat QR.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
                      Pilih Meja (Klik untuk Pratinjau)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {tableOptions.map((t) => {
                        const hasActiveOrder = orders.some(
                          (o) => o.tableNumber === t && o.status !== 'Siap Diantar'
                        );
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedQRTable(t)}
                            className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-all relative ${
                              selectedQRTable === t
                                ? 'bg-amber-900 text-white border-amber-900 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-400'
                            }`}
                          >
                            <span>{t}</span>
                            {hasActiveOrder && (
                              <span
                                title="Meja memiliki pesanan aktif"
                                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadStandQR}
                    className="w-full py-3 rounded-2xl bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {qrDownloaded ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Desain QR {selectedQRTable} Berhasil Diunduh!</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4" />
                        <span>Unduh / Cetak Desain QR {selectedQRTable}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3D ACRYLIC STAND CANVAS */}
              <div>
                <AcrylicQRStand3D cafeName={cafeConfig.name} tableNumber={selectedQRTable} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KEBIJAKAN KAFE & INFO OPERASIONAL */}
        {activeTab === 'policies' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-200">
                      Terhubung ke Barista AI
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-serif-display text-slate-900 mt-1">
                    Kebijakan Kafe & Info Operasional ({cafeConfig.name})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Informasi ini langsung digunakan asisten Barista AI untuk menjawab pertanyaan pelanggan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => updateStorePolicies(DEFAULT_STORE_POLICIES)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Alamat Lengkap Kafe
                  </label>
                  <input
                    type="text"
                    value={cafeConfig.address}
                    onChange={(e) => updateCafeConfig({ address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Nomor Telepon / WhatsApp Kafe
                  </label>
                  <input
                    type="text"
                    value={cafeConfig.phone}
                    onChange={(e) => updateCafeConfig({ phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Jam Operasional
                  </label>
                  <input
                    type="text"
                    value={cafeConfig.policies.operatingHours}
                    onChange={(e) => updateStorePolicies({ operatingHours: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Kebijakan Pajak & Biaya Layanan
                  </label>
                  <input
                    type="text"
                    value={cafeConfig.policies.taxAndService}
                    onChange={(e) => updateStorePolicies({ taxAndService: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Kebijakan Pembayaran
                  </label>
                  <textarea
                    rows={2}
                    value={cafeConfig.policies.paymentPolicy}
                    onChange={(e) => updateStorePolicies({ paymentPolicy: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Kustomisasi Minuman & Ukuran Cup
                  </label>
                  <textarea
                    rows={2}
                    value={cafeConfig.policies.customizationPolicy}
                    onChange={(e) => updateStorePolicies({ customizationPolicy: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Kebijakan Alergen & Bahan
                  </label>
                  <textarea
                    rows={2}
                    value={cafeConfig.policies.allergenPolicy}
                    onChange={(e) => updateStorePolicies({ allergenPolicy: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Kebijakan Wi-Fi & Area Duduk
                  </label>
                  <textarea
                    rows={2}
                    value={cafeConfig.policies.wifiAndSeatingPolicy}
                    onChange={(e) => updateStorePolicies({ wifiAndSeatingPolicy: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH MENU BARU */}
        {isAddMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-lg font-bold font-serif-display text-slate-900 mb-4">
                Tambah Menu Baru ({cafeConfig.name})
              </h3>
              <form onSubmit={handleAddMenuSubmit} className="space-y-3 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Menu</label>
                  <input
                    type="text"
                    required
                    value={newMenu.name}
                    onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
                    placeholder="Contoh: Sea Salt Caramel Cold Brew"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-800"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Kategori</label>
                    <select
                      value={newMenu.category}
                      onChange={(e) => setNewMenu({ ...newMenu, category: e.target.value as Category })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
                    >
                      <option value="Kopi">Kopi</option>
                      <option value="Non-Kopi">Non-Kopi</option>
                      <option value="Makanan Ringan">Makanan Ringan</option>
                      <option value="Makanan Berat">Makanan Berat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      value={newMenu.price}
                      onChange={(e) => setNewMenu({ ...newMenu, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Stok Awal</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={newMenu.stock}
                      onChange={(e) => setNewMenu({ ...newMenu, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Deskripsi Ringkas</label>
                  <textarea
                    rows={2}
                    value={newMenu.description}
                    onChange={(e) => setNewMenu({ ...newMenu, description: e.target.value })}
                    placeholder="Deskripsi bahan dan rasa makanan/minuman"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddMenuOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-bold shadow-md"
                  >
                    Simpan Menu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
