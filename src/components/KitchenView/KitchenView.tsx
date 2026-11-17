import React from 'react';
import { Clock, CheckCircle2, AlertCircle, ChefHat, MapPin, Banknote } from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { InlineEdit } from '../common/InlineEdit';
import { Order, OrderStatus } from '../../types';

export const KitchenView: React.FC = () => {
  const { cafeConfig, updateCafeConfig, orders, updateOrderStatus, confirmCashierPayment } = useCafe();

  const activeKitchenOrders = orders.filter(
    (o) =>
      o.paymentStatus === 'Lunas - QRIS' ||
      o.paymentStatus === 'Lunas - Kasir' ||
      o.paymentStatus === 'Bayar di Kasir'
  );

  const pendingOrders = activeKitchenOrders.filter((o) => o.status === 'Pesanan Diterima');
  const preparingOrders = activeKitchenOrders.filter((o) => o.status === 'Sedang Dibuat');
  const completedOrders = activeKitchenOrders.filter((o) => o.status === 'Siap Diantar');

  const activeTables = Array.from(
    new Set(
      activeKitchenOrders
        .filter((o) => o.status !== 'Siap Diantar')
        .map((o) => o.tableNumber)
    )
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg">
              <ChefHat className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Layar Pesanan Dapur & Barista
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <InlineEdit
                value={cafeConfig.name}
                onSave={(val) => updateCafeConfig({ name: val })}
                tag="h2"
                className="text-2xl font-bold font-serif-display text-white tracking-tight"
              />
              <p className="text-xs text-slate-400 mt-0.5">
                Semua pesanan pelanggan (QRIS & Bayar di Kasir) masuk otomatis lengkap dengan nomor meja.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700 text-center">
              <div className="text-xs text-slate-400 font-medium">Pesanan Diterima</div>
              <div className="text-xl font-bold font-mono text-amber-400">{pendingOrders.length}</div>
            </div>
            <div className="bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700 text-center">
              <div className="text-xs text-slate-400 font-medium">Sedang Dibuat</div>
              <div className="text-xl font-bold font-mono text-blue-400">{preparingOrders.length}</div>
            </div>
            <div className="bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700 text-center">
              <div className="text-xs text-slate-400 font-medium">Siap Diantar</div>
              <div className="text-xl font-bold font-mono text-emerald-400">{completedOrders.length}</div>
            </div>
          </div>
        </div>

        {/* Active Tables Bar */}
        <div className="bg-slate-800/70 rounded-2xl px-4 py-3 border border-slate-700/80 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mr-1">
            <MapPin className="w-4 h-4" />
            <span>Daftar Meja Aktif:</span>
          </div>
          {activeTables.length === 0 ? (
            <span className="text-xs text-slate-400">Semua pesanan meja sudah selesai diantar.</span>
          ) : (
            activeTables.map((table) => (
              <span
                key={table}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold"
              >
                {table}
              </span>
            ))
          )}
        </div>

        {/* 3-Column Order Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* COLUMN 1: PESANAN DITERIMA */}
          <div className="bg-slate-800/80 rounded-3xl p-4 border border-slate-700/80 flex flex-col h-[680px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>1. Pesanan Diterima</span>
              </div>
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center border border-amber-500/40">
                {pendingOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {pendingOrders.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-12">
                  Belum ada pesanan baru. Coba buat pesanan dari tampilan Pelanggan!
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={updateOrderStatus}
                    onConfirmCashier={confirmCashierPayment}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: SEDANG DIBUAT */}
          <div className="bg-slate-800/80 rounded-3xl p-4 border border-slate-700/80 flex flex-col h-[680px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Clock className="w-4 h-4" />
                <span>2. Sedang Dibuat</span>
              </div>
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/40">
                {preparingOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {preparingOrders.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-12">
                  Tidak ada pesanan yang sedang diracik.
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={updateOrderStatus}
                    onConfirmCashier={confirmCashierPayment}
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: SIAP DIANTAR */}
          <div className="bg-slate-800/80 rounded-3xl p-4 border border-slate-700/80 flex flex-col h-[680px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>3. Siap Diantar</span>
              </div>
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-500/40">
                {completedOrders.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {completedOrders.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-12">
                  Belum ada pesanan siap diantar.
                </div>
              ) : (
                completedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={updateOrderStatus}
                    onConfirmCashier={confirmCashierPayment}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onConfirmCashier: (id: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus, onConfirmCashier }) => {
  const isUnpaidCashier = order.paymentStatus === 'Bayar di Kasir';
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 shadow-md animate-fadeIn space-y-3">
      {/* Top Card Info: Prominent Table Number Badge */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl shrink-0 shadow-xs flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-950 shrink-0" />
            <div className="leading-none">
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-amber-950/80">
                Meja Tujuan
              </div>
              <div className="font-black text-sm tracking-tight mt-0.5">{order.tableNumber}</div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="font-mono text-xs text-slate-200 font-bold truncate">{order.id}</div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isUnpaidCashier
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {order.paymentStatus}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                • {totalItems} item
              </span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 shrink-0 pt-0.5">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{order.createdAt}</span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 text-xs">
        {order.items.map((item, i) => (
          <div key={i} className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="flex justify-between items-start font-bold text-slate-200">
              <span>
                <span className="text-amber-400 text-sm font-extrabold mr-1">{item.quantity}x</span>{' '}
                {item.menuItem.name}{' '}
                <span className="text-slate-400 font-medium text-[11px]">({item.selectedSize})</span>
              </span>
            </div>
            {(item.menuItem.category === 'Kopi' || item.menuItem.category === 'Non-Kopi') && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                {item.sugarLevel.split(' ')[0]} • {item.iceLevel}
              </div>
            )}
            {item.notes && (
              <div className="text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md mt-1 font-sans">
                Catatan: {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total & Action Buttons */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-mono">
          <span className="text-slate-400 text-[10px]">
            {isUnpaidCashier ? 'Tagihan Kasir:' : 'Total Lunas:'}
          </span>
          <div className={`font-bold ${isUnpaidCashier ? 'text-amber-300' : 'text-emerald-400'}`}>
            Rp {order.totalAmount.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isUnpaidCashier && (
            <button
              onClick={() => onConfirmCashier(order.id)}
              className="px-2.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold text-[11px] flex items-center gap-1 transition-colors"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Tandai Lunas</span>
            </button>
          )}

          {order.status === 'Pesanan Diterima' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'Sedang Dibuat')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1"
            >
              <span>Mulai Buat</span>
            </button>
          )}

          {order.status === 'Sedang Dibuat' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'Siap Diantar')}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Siap Diantar</span>
            </button>
          )}

          {order.status === 'Siap Diantar' && (
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
              ✓ Siap Diantar ke {order.tableNumber}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
