import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SuccessCheckmark3D: React.FC = () => {
  useEffect(() => {
    confetti({
      particleCount: 65,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#10B981', '#F59E0B', '#3B82F6', '#34D399'],
    });
  }, []);

  return (
    <div className="w-[160px] h-[128px] mx-auto flex items-center justify-center relative select-none">
      {/* Futuristic Outer Halo */}
      <div className="absolute w-28 h-28 rounded-full border-2 border-emerald-400/50 animate-[spin_6s_linear_infinite]" />
      <div className="absolute w-24 h-24 rounded-full bg-emerald-400/20 blur-xl" />

      {/* 3D Layered Emerald Sphere Badge */}
      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 shadow-[0_14px_30px_rgba(16,185,129,0.45),inset_0_3px_8px_rgba(255,255,255,0.5)] flex items-center justify-center animate-bounce">
        <Check className="w-10 h-10 text-white stroke-[3.5] drop-shadow-md" />
      </div>
    </div>
  );
};
