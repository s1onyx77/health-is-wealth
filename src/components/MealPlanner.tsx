import React, { useState } from 'react';
import { MealPlan, PlannedMeal, UserProfile, MealItem } from '../types';
import {
  Sparkles,
  RefreshCw,
  Clock,
  Flame,
  Zap,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  Calendar,
  SlidersHorizontal,
  Info,
  Droplet
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MealPlannerProps {
  mealPlan: MealPlan;
  currentGlucose: number;
  glucoseTrend: string;
  timeInRangePercent: number;
  profile: UserProfile;
  onUpdatePlan: (newPlan: MealPlan) => void;
  onAddPlannedMealToLog: (meal: MealItem) => void;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({
  mealPlan,
  currentGlucose,
  glucoseTrend,
  timeInRangePercent,
  profile,
  onUpdatePlan,
  onAddPlannedMealToLog,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState(profile.dietaryPreference);
  const [expandedMealIndex, setExpandedMealIndex] = useState<number | null>(0);
  const [addedMeals, setAddedMeals] = useState<{ [key: string]: boolean }>({});
  const [showConfig, setShowConfig] = useState(false);
  const [targetCalories, setTargetCalories] = useState(profile.targetCalorieBudget);
  const [targetCarbs, setTargetCarbs] = useState(profile.targetCarbBudget);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerateAIPlan = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gemini/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentGlucose,
          glucoseTrend,
          timeInRangePercent,
          dietaryPreference: selectedDiet,
          allergies: profile.allergies,
          dailyCalorieTarget: targetCalories,
          targetCarbLimit: targetCarbs,
        }),
      });

      if (!res.ok) {
        console.warn('Backend returned non-OK status, parsing fallback if available');
      }
      const data = await res.json();

      const updatedPlan: MealPlan = {
        id: `plan-${Date.now()}`,
        dayTitle: data.dayTitle || 'Personalized Glucose Stabilization Plan',
        generatedAt: new Date().toISOString(),
        glucoseStateAssessment: data.glucoseStateAssessment || `Generated specifically for your current glucose level of ${currentGlucose} mg/dL.`,
        targetDailyMacros: data.targetDailyMacros || {
          calories: targetCalories,
          carbs: targetCarbs,
          protein: 130,
          fat: 75,
          fiber: 35,
          avgGlycemicLoad: 7,
        },
        meals: data.meals || mealPlan.meals,
        dailySpikeMitigationRule: data.dailySpikeMitigationRule || 'Eat your vegetable fiber first, protein/fats second, carbs last.',
        hydrationGoalLiters: data.hydrationGoalLiters || 2.5,
        dietPreference: selectedDiet,
      };

      onUpdatePlan(updatedPlan);
      confetti({ particleCount: 30, spread: 60 });
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Could not connect to the meal planner service. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogPlannedMeal = (meal: PlannedMeal, index: number) => {
    const newMeal: MealItem = {
      id: `planned-log-${Date.now()}-${index}`,
      name: meal.recipeName,
      mealType: meal.mealType.toLowerCase() as MealItem['mealType'],
      timestamp: new Date().toISOString(),
      calories: meal.calories,
      carbs: meal.carbs,
      netCarbs: Math.max(0, meal.carbs - meal.fiber),
      fiber: meal.fiber,
      protein: meal.protein,
      fat: meal.fat,
      glycemicIndex: 35,
      glycemicLoad: meal.glycemicLoad,
      predictedSpikeMgDl: parseInt(meal.predictedGlucosePeak.replace(/[^0-9]/g, '')) || 16,
      spikeRisk: meal.glycemicLoad < 10 ? 'Low' : 'Moderate',
      glycemicScore: 92,
      sequencingAdvice: meal.sequencingGuide,
      biohackTips: [meal.cgmTip],
      ingredients: meal.ingredients.map((i) => `${i.name} (${i.amount})`),
    };

    onAddPlannedMealToLog(newMeal);
    setAddedMeals((prev) => ({ ...prev, [meal.recipeName]: true }));
    confetti({ particleCount: 20, spread: 50 });
  };

  return (
    <div id="meal-planner-view" className="space-y-4">
      {/* Plan Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>AI Glucose-Responsive</span>
              </span>
              <span className="text-xs text-slate-400">Adaptive Plan</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              {mealPlan.dayTitle}
            </h2>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            title="Configure Diet Preferences"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Glucose Context Pill */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Live Glucose Telemetry Context</span>
            <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
              {mealPlan.glucoseStateAssessment}
            </p>
          </div>
        </div>

        {/* Preferences Drawer */}
        {showConfig && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Personalize AI Planner Parameters
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Dietary Framework:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  'Mediterranean Low-GI',
                  'Low Carb / Keto-Flex',
                  'Plant-Forward',
                  'Zone Balanced',
                  'Intermittent Fasting',
                ].map((diet) => (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => setSelectedDiet(diet as any)}
                    className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border text-left truncate transition-all ${
                      selectedDiet === diet
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Calorie Target: {targetCalories} kcal
                </label>
                <input
                  type="range"
                  min="1400"
                  max="3200"
                  step="50"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Carb Cap: {targetCarbs}g / day
                </label>
                <input
                  type="range"
                  min="30"
                  max="250"
                  step="10"
                  value={targetCarbs}
                  onChange={(e) => setTargetCarbs(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error message banner if any */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Generate / Regenerate AI Button */}
        <button
          onClick={handleGenerateAIPlan}
          disabled={isGenerating}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Glucose-Stabilizing Recipes with Gemini...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Regenerate Meal Plan for Current Glucose ({currentGlucose} mg/dL)</span>
            </>
          )}
        </button>

        {/* Daily Spike Rule & Hydration Target */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
            <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Golden Spike Mitigation Rule
            </span>
            <p className="text-[11px] mt-0.5">{mealPlan.dailySpikeMitigationRule}</p>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 flex items-center justify-between">
            <div>
              <span className="font-bold block text-[11px] uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Daily Hydration Goal
              </span>
              <p className="text-[11px] mt-0.5">Dilutes blood glucose concentration</p>
            </div>
            <div className="flex items-center gap-1 font-mono font-bold text-sm text-blue-600 dark:text-blue-300">
              <Droplet className="w-4 h-4 text-blue-500" />
              <span>{mealPlan.hydrationGoalLiters} L</span>
            </div>
          </div>
        </div>
      </div>

      {/* Planned Meals List */}
      <div className="space-y-3">
        {mealPlan.meals.map((meal, index) => {
          const isExpanded = expandedMealIndex === index;
          const isAdded = addedMeals[meal.recipeName];

          return (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 transition-all"
            >
              {/* Meal header & trigger */}
              <div
                onClick={() => setExpandedMealIndex(isExpanded ? null : index)}
                className="flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {meal.mealType}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {meal.timeWindow}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {meal.recipeName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {meal.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {meal.calories} kcal
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Peak: {meal.predictedGlucosePeak}
                  </div>
                  <div className="mt-1 flex justify-end">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Macro Bar */}
              <div className="grid grid-cols-4 gap-2 text-center p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-amber-500 font-sans block">Carbs</span>
                  <span className="font-bold text-slate-900 dark:text-white">{meal.carbs}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500 font-sans block">Fiber</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{meal.fiber}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-500 font-sans block">Protein</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{meal.protein}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-500 font-sans block">Fat</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{meal.fat}g</span>
                </div>
              </div>

              {/* Expanded detail section: Ingredients with Glycemic Benefits & Recipe steps */}
              {isExpanded && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in">
                  {/* Ingredients with metabolic benefits */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      Metabolically Optimized Ingredients:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {meal.ingredients.map((ing, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                            <span>{ing.name}</span>
                            <span className="text-slate-400 font-mono text-[11px]">{ing.amount}</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {ing.glycemicBenefit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preparation Instructions */}
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      Preparation Steps:
                    </span>
                    <ol className="space-y-1 pl-4 list-decimal text-[11px] text-slate-500 dark:text-slate-400">
                      {meal.instructions.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Food sequencing guide */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200">
                    <div className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Food Sequencing (Spike Defense)</span>
                    </div>
                    <p className="text-[11px] mt-0.5">{meal.sequencingGuide}</p>
                  </div>

                  {/* CGM Proactive Tip */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <Zap className="w-3.5 h-3.5" />
                      <span>CGM Continuous Coach Tip</span>
                    </div>
                    <p className="text-[11px] mt-0.5">{meal.cgmTip}</p>
                  </div>

                  {/* Action Button: Add to Food Log */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleLogPlannedMeal(meal, index)}
                      disabled={isAdded}
                      className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                        isAdded
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-600/20'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Logged to Today's Diary</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Eat & Log This Recipe</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
