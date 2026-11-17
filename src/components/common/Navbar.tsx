import React from 'react';
import { Coffee, Smartphone, UtensilsCrossed, LayoutDashboard, Sparkles } from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { ViewMode } from '../../types';

export const Navbar: React.FC = () => {
  const { activeView, setActiveView, setIsDemoModalOpen, orders, lowStockItems, outOfStockItems } = useCafe();

  const pendingCount = orders.filter(
    (o) =>
      o.status === 'Pesanan Diterima' &&
      (o.paymentStatus === 'Lunas - QRIS' ||
        o.paymentStatus === 'Lunas - Kasir' ||
        o.paymentStatus === 'Bayar di Kasir')
  ).length;
  const stockAlertCount = lowStockItems.length + outOfStockItems.length;

  return (
    <header className="sticky top-0 z-40 bg-amber-950/95 backdrop-blur-md text-white border-b border-amber-800/40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-amber-950 shadow-md">
            <Coffee className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-display font-bold text-lg tracking-tight text-amber-100 whitespace-nowrap">
                KopiFlow 3D
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-800/60 text-amber-300 border border-amber-700/50">
                Mode Demo
              </span>
            </div>
            <p className="text-[11px] text-amber-300/80 truncate max-w-[180px] sm:max-w-xs">
              Sistem Pemesanan Mandiri Kafe
            </p>
          </div>
        </div>

        {/* Zone 2: View Mode Segmented Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-amber-900/60 rounded-2xl border border-amber-800/50">
          <button
            onClick={() => setActiveView('customer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'customer'
                ? 'bg-amber-100 text-amber-950 shadow-sm'
                : 'text-amber-200/90 hover:text-white hover:bg-amber-800/40'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pelanggan (HP)</span>
          </button>

          <button
            onClick={() => setActiveView('kitchen')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 relative whitespace-nowrap shrink-0 ${
              activeView === 'kitchen'
                ? 'bg-amber-100 text-amber-950 shadow-sm'
                : 'text-amber-200/90 hover:text-white hover:bg-amber-800/40'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Layar Dapur</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('admin')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'admin'
                ? 'bg-amber-100 text-amber-950 shadow-sm'
                : 'text-amber-200/90 hover:text-white hover:bg-amber-800/40'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Admin Kafe</span>
            {stockAlertCount > 0 && (
              <span
                title={`${stockAlertCount} menu stok menipis / habis`}
                className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center tabular-nums"
              >
                {stockAlertCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Quick Pitch Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsDemoModalOpen(true)}
            title="Klik untuk ubah Nama Kafe & Identitas saat presentasi langsung"
            className="px-3.5 py-2 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-900" />
            <span className="hidden sm:inline">⚡ Ganti Nama Kafe (Demo)</span>
            <span className="sm:hidden">⚡ Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
