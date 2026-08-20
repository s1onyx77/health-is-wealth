import React from 'react';
import { UserProfile, GlucoseReading } from '../types';
import {
  Activity,
  Sliders,
  Radio,
  Sparkles,
  Zap,
  TrendingUp,
  User,
  Heart
} from 'lucide-react';

interface HeaderBarProps {
  profile: UserProfile;
  latestReading: GlucoseReading;
  onOpenSettings: () => void;
  onOpenScanner: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  profile,
  latestReading,
  onOpenSettings,
  onOpenScanner,
}) => {
  const isTarget = latestReading.value >= 70 && latestReading.value <= 140;

  return (
    <header className="px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between transition-colors">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              GlucoFit <span className="text-emerald-500">AI</span>
            </h1>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              CGM
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Metabolic Precision</p>
        </div>
      </div>

      {/* Right side: Realtime Glucose badge & Settings */}
      <div className="flex items-center gap-2">
        {/* Live Glucose Chip */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-bold transition-all ${
            isTarget
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          <span>{latestReading.value}</span>
          <span className="text-[10px] font-normal text-slate-400 font-sans">mg/dL</span>
        </div>

        {/* Profile / Settings Button */}
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700"
          title="User Profile & Settings"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
