import React, { useState } from 'react';
import { MealItem, UserProfile } from '../types';
import {
  Plus,
  Flame,
  Zap,
  TrendingUp,
  Layers,
  Sparkles,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  Apple
} from 'lucide-react';

interface NutritionTrackerProps {
  meals: MealItem[];
  profile: UserProfile;
  onOpenScanner: () => void;
  onDeleteMeal: (mealId: string) => void;
  currentGlucose: number;
}

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({
  meals,
  profile,
  onOpenScanner,
  onDeleteMeal,
  currentGlucose,
}) => {
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  // Daily sums
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
  const totalFiber = meals.reduce((sum, m) => sum + (m.fiber || 0), 0);
  const totalNetCarbs = Math.max(0, totalCarbs - totalFiber);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat || 0), 0);
  const totalGlycemicLoad = meals.reduce((sum, m) => sum + (m.glycemicLoad || 0), 0);

  // GL Status
  const glRating =
    totalGlycemicLoad < 50
      ? { label: 'Optimal Low-GL', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' }
      : totalGlycemicLoad < 80
      ? { label: 'Moderate Glycemic Load', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' }
      : { label: 'High Glycemic Load', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' };

  // Calculate macro percentage progresses
  const calPercent = Math.min(100, Math.round((totalCalories / profile.targetCalorieBudget) * 100));
  const carbPercent = Math.min(100, Math.round((totalCarbs / profile.targetCarbBudget) * 100));
  const proteinPercent = Math.min(100, Math.round((totalProtein / profile.targetProteinBudget) * 100));
  const fiberPercent = Math.min(100, Math.round((totalFiber / profile.targetFiberBudget) * 100));

  const mealCategories: Array<{ title: string; type: MealItem['mealType'] }> = [
    { title: 'Breakfast', type: 'breakfast' },
    { title: 'Lunch', type: 'lunch' },
    { title: 'Dinner', type: 'dinner' },
    { title: 'Snacks & Biohacks', type: 'snack' },
  ];

  return (
    <div id="nutrition-tracker-view" className="space-y-4">
      {/* Daily Metabolic Nutrition Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Today's Nutrition & Glycemic Load</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized targets for steady insulin & mitochondrial energy
            </p>
          </div>
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>AI Food Log</span>
          </button>
        </div>

        {/* Glycemic Load & Calories Header Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Energy Intake</span>
              </span>
              <span className="font-mono text-[11px]">{calPercent}%</span>
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {totalCalories} <span className="text-xs font-normal text-slate-400">/ {profile.targetCalorieBudget} kcal</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${calPercent}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Daily Glycemic Load</span>
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${glRating.bg} ${glRating.color}`}>
                {glRating.label}
              </span>
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {totalGlycemicLoad} <span className="text-xs font-normal text-slate-400">GL units</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  totalGlycemicLoad < 50 ? 'bg-emerald-500' : totalGlycemicLoad < 80 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, (totalGlycemicLoad / 80) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4-Macro Progress Pill Grid */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {/* Net Carbs */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Net Carbs</div>
            <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
              {totalNetCarbs}g
            </div>
            <div className="text-[10px] text-slate-400">/ {profile.targetCarbBudget}g</div>
          </div>

          {/* Fiber */}
          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-center">
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Fiber</div>
            <div className="text-sm font-extrabold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
              {totalFiber}g
            </div>
            <div className="text-[10px] text-emerald-600/70">/ {profile.targetFiberBudget}g</div>
          </div>

          {/* Protein */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Protein</div>
            <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
              {totalProtein}g
            </div>
            <div className="text-[10px] text-slate-400">/ {profile.targetProteinBudget}g</div>
          </div>

          {/* Fat */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Fats</div>
            <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
              {totalFat}g
            </div>
            <div className="text-[10px] text-slate-400">/ {profile.targetFatBudget}g</div>
          </div>
        </div>
      </div>

      {/* Meals Logged Sections */}
      <div className="space-y-3">
        {mealCategories.map((cat) => {
          const categoryMeals = meals.filter((m) => m.mealType === cat.type);

          return (
            <div
              key={cat.type}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cat.title}</h3>
                  <span className="text-xs text-slate-400">({categoryMeals.length})</span>
                </div>
                <button
                  onClick={onOpenScanner}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {categoryMeals.length === 0 ? (
                <div className="py-4 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/80 rounded-2xl">
                  <p className="text-xs text-slate-400">No {cat.title.toLowerCase()} logged yet.</p>
                  <button
                    onClick={onOpenScanner}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Scan or Describe Meal</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {categoryMeals.map((meal) => {
                    const isExpanded = expandedMealId === meal.id;

                    return (
                      <div
                        key={meal.id}
                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 overflow-hidden transition-all"
                      >
                        <div
                          onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                          className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {meal.imageUrl ? (
                              <img
                                src={meal.imageUrl}
                                alt={meal.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Apple className="w-6 h-6" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {meal.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                                <span>{meal.calories} kcal</span>
                                <span>•</span>
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">{meal.netCarbs}g net carbs</span>
                                <span>•</span>
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">{meal.protein}g pro</span>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{meal.fiber}g fib</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-2">
                            <div>
                              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                Score: {meal.glycemicScore}/100
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Peak: +{meal.predictedSpikeMgDl} mg/dL
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded detail sheet */}
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                            {/* Glycemic stats */}
                            <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Glycemic Index</span>
                                <span className="font-bold text-slate-900 dark:text-white font-mono">{meal.glycemicIndex}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Glycemic Load</span>
                                <span className="font-bold text-slate-900 dark:text-white font-mono">{meal.glycemicLoad} (Low)</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Spike Risk</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{meal.spikeRisk}</span>
                              </div>
                            </div>

                            {/* Food sequencing advice */}
                            {meal.sequencingAdvice && (
                              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200">
                                <span className="font-bold block mb-0.5 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                  <Layers className="w-3.5 h-3.5" />
                                  <span>Food Sequencing Protocol</span>
                                </span>
                                <p className="text-[11px]">{meal.sequencingAdvice}</p>
                              </div>
                            )}

                            {/* Biohack tips */}
                            {meal.biohackTips && meal.biohackTips.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  <span>Metabolic Optimization Tips</span>
                                </span>
                                {meal.biohackTips.map((tip, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                    <span>{tip}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Delete Action */}
                            <div className="pt-1 flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteMeal(meal.id);
                                }}
                                className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove from log</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
