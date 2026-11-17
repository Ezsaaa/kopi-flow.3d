import React, { useState } from 'react';
import {
  X,
  Award,
  Gift,
  History,
  CheckCircle2,
  Ticket,
  TrendingUp,
  RotateCcw,
  User,
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { LOYALTY_REWARDS } from '../../constants/initialData';
import { InlineEdit } from '../common/InlineEdit';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    cafeConfig,
    loyaltyProfile,
    updateCustomerName,
    redeemLoyaltyReward,
    cancelActiveReward,
  } = useCafe();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');

  if (!isOpen) return null;

  const getTierInfo = (lifetime: number) => {
    if (lifetime >= 500) {
      return { name: 'Gold Roaster', color: 'text-amber-300', nextLabel: 'Tier Tertinggi Tercapai', progress: 100 };
    }
    if (lifetime >= 250) {
      return {
        name: 'Silver Barista',
        color: 'text-slate-200',
        nextLabel: `${500 - lifetime} poin lagi ke Gold Roaster`,
        progress: Math.min(100, Math.round((lifetime / 500) * 100)),
      };
    }
    return {
      name: 'Bronze Member',
      color: 'text-amber-200',
      nextLabel: `${250 - lifetime} poin lagi ke Silver Barista`,
      progress: Math.min(100, Math.round((lifetime / 250) * 100)),
    };
  };

  const tier = getTierInfo(loyaltyProfile.lifetimePoints);

  const handleRedeem = (reward: (typeof LOYALTY_REWARDS)[number]) => {
    const result = redeemLoyaltyReward(reward);
    setFeedback({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header / Member Card */}
        <div className="bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 text-white p-5 relative">
          <button
            onClick={onClose}
            aria-label="Tutup profil"
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-amber-300/90 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>{tier.name} · {cafeConfig.name}</span>
              </div>
              <InlineEdit
                value={loyaltyProfile.customerName}
                onSave={updateCustomerName}
                tag="h2"
                className="text-lg font-bold font-serif-display text-white"
              />
            </div>
          </div>

          {/* Points Balance Card */}
          <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[11px] text-amber-200/80 font-medium">Saldo Poin Loyalitas Anda</div>
                <div className="text-3xl font-black font-mono tabular-nums text-amber-300 leading-tight mt-0.5">
                  {loyaltyProfile.points.toLocaleString('id-ID')} <span className="text-sm font-bold text-amber-100">Poin</span>
                </div>
              </div>
              <div className="text-right text-[10px] text-amber-100/80">
                <div>Total Akumulasi</div>
                <div className="font-mono font-bold text-white tabular-nums">
                  {loyaltyProfile.lifetimePoints.toLocaleString('id-ID')} Pts
                </div>
              </div>
            </div>

            {/* Tier Progress */}
            <div className="space-y-1 pt-1">
              <div className="w-full h-1.5 bg-amber-950/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-300"
                  style={{ width: `${tier.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-amber-200/80">
                <span>{tier.nextLabel}</span>
                <span>1 Poin / Rp 1.000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Active Voucher Notice */}
        {loyaltyProfile.activeReward && (
          <div className="mx-4 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-950">
                  Voucher Aktif: {loyaltyProfile.activeReward.title}
                </div>
                <div className="text-[10px] text-emerald-800">
                  Otomatis memotong tagihan di keranjang (min. Rp {loyaltyProfile.activeReward.minOrderAmount.toLocaleString('id-ID')})
                </div>
              </div>
            </div>
            <button
              onClick={cancelActiveReward}
              title="Batalkan & kembalikan poin"
              className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 text-[10px] font-bold flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Batal</span>
            </button>
          </div>
        )}

        {/* Segmented Sub-tabs */}
        <div className="px-4 pt-4">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('rewards')}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'rewards'
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Tukar Poin Diskon</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Poin ({loyaltyProfile.history.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'rewards' ? (
            <>
              <p className="text-[11px] text-slate-500">
                Tukarkan poin loyalitas Anda menjadi voucher potongan harga langsung pada pembayaran QRIS berikutnya.
              </p>

              {LOYALTY_REWARDS.map((reward) => {
                const canAfford = loyaltyProfile.points >= reward.pointsCost;
                const isAlreadyActive = loyaltyProfile.activeReward?.id === reward.id;
                const hasOtherActive = Boolean(loyaltyProfile.activeReward && !isAlreadyActive);

                return (
                  <div
                    key={reward.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isAlreadyActive
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-amber-50/40 border-amber-200/70'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{reward.title}</h4>
                        <span className="text-[10px] font-mono font-bold text-amber-900">
                          · {reward.pointsCost} Poin
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{reward.description}</p>
                    </div>

                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canAfford || isAlreadyActive || hasOtherActive}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                        isAlreadyActive
                          ? 'bg-emerald-600 text-white cursor-default'
                          : canAfford && !hasOtherActive
                          ? 'bg-amber-900 hover:bg-amber-950 text-white shadow-xs active:scale-95'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isAlreadyActive ? 'Aktif' : canAfford ? 'Tukar Poin' : 'Poin Kurang'}
                    </button>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="space-y-2.5">
              {loyaltyProfile.history.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">
                  Belum ada riwayat transaksi poin.
                </div>
              ) : (
                loyaltyProfile.history.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.type === 'earn'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.type === 'earn' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <Ticket className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {tx.description}
                        </div>
                        <div className="text-[10px] text-slate-500">{tx.timestamp}</div>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-black font-mono tabular-nums shrink-0 ${
                        tx.type === 'earn' ? 'text-emerald-700' : 'text-amber-800'
                      }`}
                    >
                      {tx.type === 'earn' ? '+' : '-'}{tx.points} Poin
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
