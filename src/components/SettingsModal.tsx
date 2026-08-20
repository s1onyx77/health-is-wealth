import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  X,
  User,
  Radio,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Shield,
  Zap,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onResetDemoData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onResetDemoData,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    confetti({ particleCount: 25, spread: 50 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Profile & CGM Settings</h3>
              <p className="text-xs text-slate-400">Personalize metabolic thresholds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* User Name & Age */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Dietary Preference */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Dietary Strategy
            </label>
            <select
              value={formData.dietaryPreference}
              onChange={(e) => setFormData({ ...formData, dietaryPreference: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="Mediterranean Low-GI">Mediterranean Low-GI (Recommended)</option>
              <option value="Low Carb / Keto-Flex">Low Carb / Keto-Flex</option>
              <option value="Plant-Forward">Plant-Forward / Whole Food</option>
              <option value="Zone Balanced">Zone Balanced (40-30-30)</option>
              <option value="Intermittent Fasting">Intermittent Fasting 16:8</option>
            </select>
          </div>

          {/* Calorie & Macro Budgets */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Daily Nutritional Targets
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Calorie Budget (kcal)</label>
                <input
                  type="number"
                  value={formData.targetCalorieBudget}
                  onChange={(e) => setFormData({ ...formData, targetCalorieBudget: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Daily Carb Cap (g)</label>
                <input
                  type="number"
                  value={formData.targetCarbBudget}
                  onChange={(e) => setFormData({ ...formData, targetCarbBudget: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Daily Protein (g)</label>
                <input
                  type="number"
                  value={formData.targetProteinBudget}
                  onChange={(e) => setFormData({ ...formData, targetProteinBudget: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Daily Fiber Target (g)</label>
                <input
                  type="number"
                  value={formData.targetFiberBudget}
                  onChange={(e) => setFormData({ ...formData, targetFiberBudget: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>
            </div>
          </div>

          {/* CGM Sensor Device Info */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {formData.cgmSensorName}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                {formData.sensorDaysRemaining} days left
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Calibrated for 5-min continuous glucose telemetry with adaptive spike prediction.
            </p>
          </div>

          {/* Reset Demo Data Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all glucose readings and meals back to initial demo dataset?')) {
                  onResetDemoData();
                  onClose();
                }
              }}
              className="w-full py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default Demo State</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
