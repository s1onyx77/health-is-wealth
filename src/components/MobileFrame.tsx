import React, { useState, useEffect } from 'react';
import {
  Activity,
  Utensils,
  Sparkles,
  ShieldCheck,
  Bot,
  Plus,
  Wifi,
  Battery,
  Smartphone,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface MobileFrameProps {
  activeTab: 'cgm' | 'nutrition' | 'meal-plan' | 'insights' | 'coach';
  onChangeTab: (tab: 'cgm' | 'nutrition' | 'meal-plan' | 'insights' | 'coach') => void;
  onOpenScanner: () => void;
  children: React.ReactNode;
  headerContent: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  activeTab,
  onChangeTab,
  onOpenScanner,
  children,
  headerContent,
}) => {
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'cgm' as const, label: 'CGM Live', icon: Activity },
    { id: 'nutrition' as const, label: 'Nutrition', icon: Utensils },
    { id: 'meal-plan' as const, label: 'AI Planner', icon: Sparkles },
    { id: 'insights' as const, label: 'Insights', icon: ShieldCheck },
    { id: 'coach' as const, label: 'AI Coach', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-0 sm:p-4 md:p-6 select-none font-sans">
      {/* Top Frame Control Bar (Desktop/Tablet) */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md md:max-w-2xl lg:max-w-4xl mb-3 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">GlucoFit Mobile Experience</span>
        </div>
        <button
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/80 transition-colors text-xs font-medium"
        >
          {isPhoneFrame ? (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Expand Layout</span>
            </>
          ) : (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phone Frame Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[430px] rounded-none sm:rounded-[44px] shadow-2xl border-0 sm:border-[8px] border-slate-800 bg-slate-900 overflow-hidden ring-1 ring-slate-700/50'
            : 'max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden'
        } flex flex-col min-h-screen sm:min-h-[860px] sm:max-h-[92vh]`}
      >
        {/* Smartphone Status Bar (Top notch) */}
        {isPhoneFrame && (
          <div className="pt-2 px-6 pb-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-between text-xs font-semibold shrink-0 select-none border-b border-transparent">
            <span>{currentTime || '09:41'}</span>
            {/* Dynamic Island / Notch */}
            <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] text-emerald-400 font-mono font-bold tracking-tighter">CGM 5m</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        )}

        {/* App Header */}
        {headerContent}

        {/* Scrollable Main Content View */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shrink-0 relative z-30">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {item.id === 'cgm' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Home Bar Indicator (Phone mode) */}
        {isPhoneFrame && (
          <div className="py-1 bg-white dark:bg-slate-900 flex justify-center shrink-0">
            <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
