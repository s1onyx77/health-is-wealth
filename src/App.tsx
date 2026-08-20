import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GlucoseReading, MealItem, MealPlan, UserProfile, MetabolicScoreData } from './types';
import {
  loadReadings,
  saveReadings,
  loadMeals,
  saveMeals,
  loadMealPlan,
  saveMealPlan,
  loadUserProfile,
  saveUserProfile,
  computeCurrentMetabolicData,
} from './utils/storage';
import { computeMetabolicMetrics } from './utils/glucoseSimulator';
import { MobileFrame } from './components/MobileFrame';
import { HeaderBar } from './components/HeaderBar';
import { GlucoseTelemetryCard } from './components/GlucoseTelemetryCard';
import { NutritionTracker } from './components/NutritionTracker';
import { MealPlanner } from './components/MealPlanner';
import { WellnessInsights } from './components/WellnessInsights';
import { MetabolicCoach } from './components/MetabolicCoach';
import { FoodScannerModal } from './components/FoodScannerModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [readings, setReadings] = useState<GlucoseReading[]>(() => loadReadings());
  const [meals, setMeals] = useState<MealItem[]>(() => loadMeals());
  const [mealPlan, setMealPlan] = useState<MealPlan>(() => loadMealPlan());
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());
  const [insights, setInsights] = useState<MetabolicScoreData>(() =>
    computeCurrentMetabolicData(loadReadings(), loadMeals())
  );

  const [activeTab, setActiveTab] = useState<'cgm' | 'nutrition' | 'meal-plan' | 'insights' | 'coach'>('cgm');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sensorConnected, setSensorConnected] = useState(profile.cgmConnected);

  // Latest reading
  const latestReading = readings[readings.length - 1] || {
    id: 'latest',
    timestamp: new Date().toISOString(),
    value: 104,
    trend: 'Flat',
    rateOfChange: 0,
  };

  // Metrics
  const metrics = useMemo(() => computeMetabolicMetrics(readings), [readings]);

  // Persist whenever data changes
  useEffect(() => {
    saveReadings(readings);
  }, [readings]);

  useEffect(() => {
    saveMeals(meals);
    setInsights(computeCurrentMetabolicData(readings, meals));
  }, [meals]);

  useEffect(() => {
    saveMealPlan(mealPlan);
  }, [mealPlan]);

  useEffect(() => {
    saveUserProfile(profile);
  }, [profile]);

  // Real-time live CGM Telemetry Ticker (Simulates live Dexcom/Freestyle 5-min sensor updates)
  useEffect(() => {
    if (!sensorConnected) return;

    const interval = setInterval(() => {
      setReadings((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];

        // Physiological micro-drift
        const drift = (Math.random() - 0.49) * 2;
        let nextVal = Math.round(last.value + drift);
        nextVal = Math.max(65, Math.min(210, nextVal));

        const diff = nextVal - last.value;
        const rateOfChange = Number((diff / 5).toFixed(2));

        let trend: GlucoseReading['trend'] = 'Flat';
        if (diff >= 2.5) trend = 'SingleUp';
        else if (diff >= 0.8) trend = 'FortyFiveUp';
        else if (diff <= -2.5) trend = 'SingleDown';
        else if (diff <= -0.8) trend = 'FortyFiveDown';

        const newPoint: GlucoseReading = {
          id: `reading-${Date.now()}`,
          timestamp: new Date().toISOString(),
          value: nextVal,
          trend,
          rateOfChange,
        };

        // Keep 288 points window (24 hours)
        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 6000); // 6s interval for lively UI

    return () => clearInterval(interval);
  }, [sensorConnected]);

  // Handler: Add custom reading
  const handleAddReading = (newReading: GlucoseReading) => {
    setReadings((prev) => [...prev.slice(1), newReading]);
  };

  // Handler: Simulate meal spike
  const handleSimulateMealSpike = (foodName: string, carbGrams: number) => {
    setReadings((prev) => {
      const last = prev[prev.length - 1];
      const rise = Math.min(65, Math.round(carbGrams * 0.75));
      const spikeVal = Math.min(200, last.value + rise);

      const spikePoint: GlucoseReading = {
        id: `reading-${Date.now()}`,
        timestamp: new Date().toISOString(),
        value: spikeVal,
        trend: rise > 30 ? 'DoubleUp' : 'SingleUp',
        rateOfChange: Number((rise / 15).toFixed(2)),
        eventType: 'meal',
        eventLabel: `Spike: ${foodName} (+${rise} mg/dL)`,
      };

      return [...prev.slice(1), spikePoint];
    });
  };

  // Handler: Simulate post-meal walk
  const handleSimulateExerciseWalk = () => {
    setReadings((prev) => {
      const last = prev[prev.length - 1];
      const drop = 24;
      const dropVal = Math.max(78, last.value - drop);

      const walkPoint: GlucoseReading = {
        id: `reading-${Date.now()}`,
        timestamp: new Date().toISOString(),
        value: dropVal,
        trend: 'SingleDown',
        rateOfChange: -1.6,
        eventType: 'exercise',
        eventLabel: '15m Brisk Post-Meal Walk (-24 mg/dL)',
      };

      return [...prev.slice(1), walkPoint];
    });
  };

  // Handler: Simulate biohack
  const handleSimulateBiohack = (hackName: string) => {
    setReadings((prev) => {
      const last = prev[prev.length - 1];
      const biohackPoint: GlucoseReading = {
        id: `reading-${Date.now()}`,
        timestamp: new Date().toISOString(),
        value: Math.max(82, last.value - 6),
        trend: 'Flat',
        rateOfChange: -0.2,
        eventType: 'biohack',
        eventLabel: `Biohack: ${hackName}`,
      };

      return [...prev.slice(1), biohackPoint];
    });
  };

  // Handler: Add Meal from Scanner or Planner
  const handleAddMeal = (newMeal: MealItem) => {
    setMeals((prev) => [newMeal, ...prev]);

    // Tag event on CGM curve
    setReadings((prev) => {
      const last = prev[prev.length - 1];
      const mealSpike = newMeal.predictedSpikeMgDl || 16;
      const pointVal = Math.min(190, last.value + mealSpike);

      const eventPoint: GlucoseReading = {
        id: `reading-${Date.now()}`,
        timestamp: new Date().toISOString(),
        value: pointVal,
        trend: mealSpike > 25 ? 'SingleUp' : 'FortyFiveUp',
        rateOfChange: Number((mealSpike / 20).toFixed(2)),
        eventType: 'meal',
        eventLabel: `${newMeal.name} (+${mealSpike} mg/dL)`,
      };

      return [...prev.slice(1), eventPoint];
    });
  };

  // Handler: Delete Meal
  const handleDeleteMeal = (mealId: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== mealId));
  };

  // Handler: Toggle Action Completion
  const handleToggleActionCompleted = (actionId: string) => {
    setInsights((prev) => ({
      ...prev,
      prescriptions: prev.prescriptions.map((p) =>
        p.id === actionId ? { ...p, completed: !p.completed } : p
      ),
    }));
  };

  // Handler: Reset demo data
  const handleResetDemoData = () => {
    localStorage.clear();
    setReadings(loadReadings());
    setMeals(loadMeals());
    setMealPlan(loadMealPlan());
    setProfile(loadUserProfile());
    setInsights(computeCurrentMetabolicData(loadReadings(), loadMeals()));
  };

  return (
    <MobileFrame
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      onOpenScanner={() => setIsScannerOpen(true)}
      headerContent={
        <HeaderBar
          profile={profile}
          latestReading={latestReading}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
        />
      }
    >
      {/* Active Tab View Rendering */}
      {activeTab === 'cgm' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <GlucoseTelemetryCard
            readings={readings}
            onAddReading={handleAddReading}
            onSimulateMealSpike={handleSimulateMealSpike}
            onSimulateExerciseWalk={handleSimulateExerciseWalk}
            onSimulateBiohack={handleSimulateBiohack}
            sensorConnected={sensorConnected}
            onToggleSensor={() => setSensorConnected(!sensorConnected)}
          />

          {/* Quick Glucostatic Overview Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Metabolic Telemetry Summary
              </h3>
              <button
                onClick={() => setActiveTab('insights')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View Full Diagnostics →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-semibold block">Time in Range</span>
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {metrics.timeInRange}%
                </span>
                <span className="text-[9px] text-slate-400 font-medium">70-140 mg/dL</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-semibold block">Variability (CV)</span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                  {metrics.glycemicVariabilityCV}%
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Target &lt; 20%</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-semibold block">Est. HbA1c</span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                  {metrics.estimatedHbA1c}%
                </span>
                <span className="text-[9px] text-slate-400 font-medium">Optimal &lt; 5.4%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nutrition' && (
        <div className="animate-in fade-in duration-200">
          <NutritionTracker
            meals={meals}
            profile={profile}
            onOpenScanner={() => setIsScannerOpen(true)}
            onDeleteMeal={handleDeleteMeal}
            currentGlucose={latestReading.value}
          />
        </div>
      )}

      {activeTab === 'meal-plan' && (
        <div className="animate-in fade-in duration-200">
          <MealPlanner
            mealPlan={mealPlan}
            currentGlucose={latestReading.value}
            glucoseTrend={latestReading.trend}
            timeInRangePercent={metrics.timeInRange}
            profile={profile}
            onUpdatePlan={setMealPlan}
            onAddPlannedMealToLog={handleAddMeal}
          />
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="animate-in fade-in duration-200">
          <WellnessInsights
            insights={insights}
            readings={readings}
            onToggleActionCompleted={handleToggleActionCompleted}
            onUpdateInsights={setInsights}
          />
        </div>
      )}

      {activeTab === 'coach' && (
        <div className="animate-in fade-in duration-200">
          <MetabolicCoach
            currentGlucose={latestReading.value}
            glucoseTrend={latestReading.trend}
            timeInRangePercent={metrics.timeInRange}
            dailyGlycemicLoad={meals.reduce((sum, m) => sum + (m.glycemicLoad || 0), 0)}
            recentMeals={meals}
            profile={profile}
          />
        </div>
      )}

      {/* Multimodal AI Food Scanner Modal */}
      <FoodScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAddMeal={handleAddMeal}
        currentGlucose={latestReading.value}
      />

      {/* User Settings & Profile Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={setProfile}
        onResetDemoData={handleResetDemoData}
      />
    </MobileFrame>
  );
}
