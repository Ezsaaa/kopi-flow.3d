import React, { useState } from 'react';
import { X, Sparkles, Store, User, Wifi, Palette, Check } from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { THEME_CONFIGS } from '../../constants/initialData';
import { BrandTheme } from '../../types';

export const DemoSetupModal: React.FC = () => {
  const { cafeConfig, updateCafeConfig, isDemoModalOpen, setIsDemoModalOpen } = useCafe();

  const [form, setForm] = useState({
    name: cafeConfig.name,
    tagline: cafeConfig.tagline,
    baristaName: cafeConfig.baristaName,
    wifiPassword: cafeConfig.wifiPassword,
    brandTheme: cafeConfig.brandTheme,
    tableNumber: cafeConfig.tableNumber,
  });

  if (!isDemoModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCafeConfig(form);
    setIsDemoModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-amber-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white p-6 relative">
          <button
            onClick={() => setIsDemoModalOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-500/30 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Pengaturan Profil Kafe
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif-display">Ubah Identitas Kafe</h2>
          <p className="text-xs text-amber-200/90 mt-1">
            Ubah identitas kafe secara live di hadapan pemilik kafe untuk demonstrasi produk yang realistis.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <Store className="w-3.5 h-3.5 text-amber-700" /> Nama Kafe
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Kopi Kenangan Mantan, Woodland Roasters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              Tagline / Slogan Kafe
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="Contoh: Cita Rasa Kopi Nusantara"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-amber-700" /> Head Barista / Kasir
              </label>
              <input
                type="text"
                value={form.baristaName}
                onChange={(e) => setForm({ ...form, baristaName: e.target.value })}
                placeholder="Contoh: Budi Barista"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 text-xs font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <Wifi className="w-3.5 h-3.5 text-amber-700" /> Password Wi-Fi
              </label>
              <input
                type="text"
                value={form.wifiPassword}
                onChange={(e) => setForm({ ...form, wifiPassword: e.target.value })}
                placeholder="Contoh: kopisenja123"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 text-xs font-medium focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <Palette className="w-3.5 h-3.5 text-amber-700" /> Pilihan Warna Brand (Theme)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(THEME_CONFIGS).map((theme) => {
                const isSelected = form.brandTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setForm({ ...form, brandTheme: theme.id as BrandTheme })}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 shadow-xs flex items-center justify-center text-white text-[10px]"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </span>
                    <span className="truncate text-slate-800">{theme.name.split(' (')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-900 hover:bg-amber-950 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Simpan & Terapkan Identitas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
