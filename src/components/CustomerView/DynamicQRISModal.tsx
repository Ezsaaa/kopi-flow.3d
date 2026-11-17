import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Store,
  Check,
  Wifi,
  Copy,
  Award,
  MapPin,
} from 'lucide-react';
import { Order } from '../../types';
import { useCafe } from '../../context/CafeContext';
import { SuccessCheckmark3D } from '../3d/SuccessCheckmark3D';

interface DynamicQRISModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const DynamicQRISModal: React.FC<DynamicQRISModalProps> = ({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const { cafeConfig, verifyOrderPayment, setActiveView } = useCafe();

  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [wifiCopied, setWifiCopied] = useState(false);

  // Reset timers and badges whenever a different order opens
  useEffect(() => {
    setTimeLeft(15 * 60);
    setSavedNotice(false);
    setWifiCopied(false);
  }, [order?.id]);

  const isPaid =
    order?.paymentStatus === 'Lunas - QRIS' || order?.paymentStatus === 'Lunas - Kasir';
  const isCashierOrder =
    order?.paymentMethod === 'Bayar di Kasir' && order?.paymentStatus === 'Bayar di Kasir';
  const showReceiptOrConfirmed = isPaid || isCashierOrder;

  useEffect(() => {
    if (!isOpen || showReceiptOrConfirmed || !order) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, showReceiptOrConfirmed, order]);

  if (!isOpen || !order) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const wifiNetworkName = `${cafeConfig.name.replace(/\s+/g, '_')}_Guest`;

  const handleConfirmQRISPayment = async () => {
    setIsVerifying(true);
    await verifyOrderPayment(order.id);
    setIsVerifying(false);
    onPaymentSuccess();
  };

  const handleCopyWifi = async () => {
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
      // Clipboard fallback safely ignored if blocked
    }
    setWifiCopied(true);
    setTimeout(() => setWifiCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(0, 0, 480, 96);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cafeConfig.name, 240, 46);
        ctx.font = '15px sans-serif';
        ctx.fillText(`QRIS PEMBAYARAN • ${order.tableNumber}`, 240, 74);

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`Rp ${order.totalAmount.toLocaleString('id-ID')}`, 240, 150);

        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 4;
        ctx.strokeRect(110, 180, 260, 260);
        ctx.fillStyle = '#0F172A';
        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            if ((r + c * 3) % 2 === 0 || (r < 3 && c < 3) || (r < 3 && c > 6) || (r > 6 && c < 3)) {
              ctx.fillRect(130 + c * 22, 200 + r * 22, 16, 16);
            }
          }
        }

        ctx.fillStyle = '#475569';
        ctx.font = '16px sans-serif';
        ctx.fillText(`No. Pesanan: ${order.id}`, 240, 490);
        ctx.fillText('Tunjukkan atau scan lewat aplikasi e-wallet / m-banking', 240, 524);

        const link = document.createElement('a');
        link.download = `QRIS-${order.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (e) {
      // Ignore canvas download issues in restricted iframes
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] shadow-2xl overflow-hidden border border-amber-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white p-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              {isCashierOrder ? (
                <Store className="w-4 h-4 text-amber-300" />
              ) : (
                <QrCode className="w-4 h-4 text-amber-300" />
              )}
              <h3 className="font-serif-display font-bold text-base text-amber-100">
                {isPaid
                  ? 'Pembayaran Berhasil'
                  : isCashierOrder
                  ? 'Pesanan Diterima (Bayar di Kasir)'
                  : 'Pembayaran QRIS'}
              </h3>
            </div>
            <p className="text-[11px] text-amber-300/80">
              {cafeConfig.name} • {order.tableNumber}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-full hover:bg-white/10 text-amber-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto flex-1">
          {!showReceiptOrConfirmed ? (
            <div className="p-5 text-center space-y-4">
              {/* Amount Banner */}
              <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200/80">
                <span className="text-xs text-amber-900/70 font-medium">Total Tagihan</span>
                <div className="text-2xl font-black font-mono text-amber-950 tracking-tight mt-0.5 tabular-nums">
                  Rp {order.totalAmount.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-emerald-800 font-semibold mt-1 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Terhubung dengan QRIS Resmi
                </div>
              </div>

              {/* QRIS Code Card */}
              <div className="relative bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-md inline-block max-w-[260px] mx-auto">
                <div className="bg-red-700 text-white text-[10px] font-extrabold uppercase py-0.5 px-3 rounded-t-xs tracking-widest mb-2">
                  QRIS - {cafeConfig.name}
                </div>

                <div className="w-48 h-48 bg-slate-950 rounded-xl p-2.5 mx-auto relative flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded-lg p-2 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-10 h-10 border-4 border-slate-900 bg-slate-900">
                        <div className="w-5 h-5 bg-white m-1">
                          <div className="w-2.5 h-2.5 bg-slate-900 m-1"></div>
                        </div>
                      </div>
                      <div className="w-10 h-10 border-4 border-slate-900 bg-slate-900">
                        <div className="w-5 h-5 bg-white m-1">
                          <div className="w-2.5 h-2.5 bg-slate-900 m-1"></div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center font-mono font-bold text-[10px] text-slate-800 my-1">
                      {order.id} • {order.tableNumber}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="w-10 h-10 border-4 border-slate-900 bg-slate-900">
                        <div className="w-5 h-5 bg-white m-1">
                          <div className="w-2.5 h-2.5 bg-slate-900 m-1"></div>
                        </div>
                      </div>
                      <div className="text-[9px] text-right font-bold text-slate-700">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-amber-900 text-amber-100 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                      ☕
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-500 font-medium">
                  Scan lewat GoPay, OVO, DANA, ShopeePay, atau M-Banking
                </div>
              </div>

              {/* Countdown timer */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-900 font-semibold bg-amber-100/70 py-1.5 px-3 rounded-xl max-w-xs mx-auto">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Batas Waktu Bayar: </span>
                <span className="font-mono text-sm text-red-700 font-extrabold">{formattedTime}</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleDownloadQR}
                  className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {savedNotice ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Gambar QRIS Tersimpan</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Simpan Gambar QRIS</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleConfirmQRISPayment}
                  disabled={isVerifying}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <span>Memproses Pembayaran...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Konfirmasi Pembayaran QRIS Sukses</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-500">
                  Setelah pembayaran selesai, struk digital & password WiFi kafe langsung muncul otomatis.
                </p>
              </div>
            </div>
          ) : (
            /* SUCCESS CONFIRMATION + AUTO WIFI PASSWORD + MODERN DIGITAL RECEIPT */
            <div className="p-5 space-y-4">
              <div className="text-center">
                <SuccessCheckmark3D />

                <h4 className="text-xl font-bold font-serif-display text-emerald-950 mt-1">
                  {isCashierOrder ? 'Pesanan Diterima!' : 'Pembayaran Berhasil!'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {isCashierOrder
                    ? `Pesanan Anda sedang disiapkan untuk ${order.tableNumber}. Silakan bayar di kasir sebesar Rp ${order.totalAmount.toLocaleString('id-ID')}.`
                    : `Terima kasih! Pesanan Anda telah lunas dan langsung masuk ke dapur untuk ${order.tableNumber}.`}
                </p>

                {/* Prominent Table, Order ID & Status Strip */}
                <div className="mt-3 grid grid-cols-3 gap-1.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-2 text-center">
                  <div className="bg-white rounded-xl py-1.5 px-2 border border-emerald-100">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Nomor Meja</div>
                    <div className="text-xs font-black text-amber-900 flex items-center justify-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{order.tableNumber}</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl py-1.5 px-2 border border-emerald-100">
                    <div className="text-[9px] uppercase font-bold text-slate-400">No. Pesanan</div>
                    <div className="text-xs font-mono font-bold text-slate-900 mt-0.5 truncate">
                      {order.id}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl py-1.5 px-2 border border-emerald-100">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Status</div>
                    <div className="text-[11px] font-bold text-emerald-700 mt-0.5 truncate">
                      {order.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* AUTO WIFI ACCESS REWARD CARD (Unlocked strictly after payment succeeds) */}
              {isPaid ? (
                <div className="bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 text-white rounded-2xl p-4 border border-amber-500/40 shadow-md space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shrink-0">
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-amber-100">
                          Akses WiFi Gratis {cafeConfig.name}
                        </div>
                        <div className="text-[11px] text-amber-200/90 font-mono truncate">
                          WiFi: <span className="font-bold text-white">{wifiNetworkName}</span> | Password:{' '}
                          <span className="font-bold text-amber-300">{cafeConfig.wifiPassword}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] text-amber-200/80">Password WiFi Kafe Hari Ini:</div>
                      <div className="font-mono font-black text-sm text-amber-300 tracking-wide truncate">
                        {cafeConfig.wifiPassword}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyWifi}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all ${
                        wifiCopied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-400 hover:bg-amber-300 text-amber-950'
                      }`}
                    >
                      {wifiCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] text-amber-950 leading-snug">
                    <div className="font-bold">Akses Password Wi-Fi Terkunci</div>
                    <p className="text-amber-900/80 mt-0.5">
                      Selesaikan pembayaran di kasir sebesar{' '}
                      <span className="font-bold">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </span>{' '}
                      untuk membuka password Wi-Fi kafe secara otomatis.
                    </p>
                  </div>
                </div>
              )}

              {/* MODERN DIGITAL RECEIPT CARD */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                {/* Receipt Header */}
                <div className="bg-white px-4 py-3 border-b border-dashed border-slate-300 text-center">
                  <div className="font-serif-display font-bold text-sm text-slate-900">
                    {cafeConfig.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {cafeConfig.address} • {cafeConfig.phone}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Barista / Kasir: {cafeConfig.baristaName}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span>
                      {isCashierOrder
                        ? 'RINGKASAN PESANAN • BAYAR DI KASIR'
                        : `STRUK DIGITAL • ${order.paymentStatus.toUpperCase()}`}
                    </span>
                  </div>
                </div>

                {/* Order Metadata Grid */}
                <div className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">No. Pesanan</span>
                      <span className="font-mono font-bold text-slate-900">{order.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Meja Pengantaran</span>
                      <span className="font-black text-amber-900">{order.tableNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Status Pesanan</span>
                      <span className="font-bold text-emerald-700">{order.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Waktu Order</span>
                      <span className="font-mono text-slate-700">{order.createdAt}</span>
                    </div>
                  </div>

                  {/* Itemized List */}
                  <div className="border-t border-b border-dashed border-slate-300 py-2.5 space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start gap-2 text-[11px]">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">
                            <span className="font-mono font-bold text-amber-900 mr-1">
                              {item.quantity}x
                            </span>
                            {item.menuItem.name}{' '}
                            <span className="text-slate-500 font-normal">({item.selectedSize})</span>
                          </div>
                          {(item.menuItem.category === 'Kopi' ||
                            item.menuItem.category === 'Non-Kopi') && (
                            <div className="text-[10px] text-slate-500">
                              {item.sugarLevel.split(' ')[0]} • {item.iceLevel}
                            </div>
                          )}
                          {item.notes && (
                            <div className="text-[10px] text-amber-800">Catatan: {item.notes}</div>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-800 whitespace-nowrap tabular-nums">
                          Rp {(item.sizePrice * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal, Discount & Grand Total */}
                  <div className="space-y-1">
                    {order.discountAmount && order.discountAmount > 0 ? (
                      <>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>Subtotal</span>
                          <span className="tabular-nums">
                            Rp{' '}
                            {(order.subtotal || order.totalAmount + order.discountAmount).toLocaleString(
                              'id-ID'
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-emerald-700 font-mono font-semibold">
                          <span>Diskon Poin Loyalitas</span>
                          <span className="tabular-nums">
                            - Rp {order.discountAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </>
                    ) : null}

                    <div className="flex justify-between items-center font-bold text-sm text-slate-900 pt-1">
                      <span>{isCashierOrder ? 'Total Bayar di Kasir' : 'Total Lunas'}</span>
                      <span
                        className={`font-mono text-base tabular-nums ${
                          isCashierOrder ? 'text-amber-900' : 'text-emerald-700'
                        }`}
                      >
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Loyalty Points Earned */}
                  <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between items-center text-[11px] text-amber-900 font-bold">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {isCashierOrder ? 'Estimasi Poin (saat lunas)' : 'Poin Loyalitas Diperoleh'}
                      </span>
                    </span>
                    <span className="font-mono">
                      +{order.pointsEarned || Math.max(5, Math.floor(order.totalAmount / 1000))} Poin
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Selesai & Pantau Status
                </button>
                <button
                  onClick={() => {
                    setActiveView('kitchen');
                    onClose();
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Layar Dapur</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
