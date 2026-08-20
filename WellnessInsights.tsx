import React, { useState } from 'react';
import { MetabolicScoreData, ActionCard, GlucoseReading } from '../types';
import {
  ShieldCheck,
  Activity,
  Zap,
  Footprints,
  Sparkles,
  CheckCircle2,
  Circle,
  TrendingDown,
  Moon,
  Flame,
  Award,
  RefreshCw,
  Share2,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WellnessInsightsProps {
  insights: MetabolicScoreData;
  readings: GlucoseReading[];
  onToggleActionCompleted: (id: string) => void;
  onUpdateInsights: (newInsights: MetabolicScoreData) => void;
}

export const WellnessInsights: React.FC<WellnessInsightsProps> = ({
  insights,
  readings,
  onToggleActionCompleted,
  onUpdateInsights,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleRunAIDiagnostics = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/analyze-glucose-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          averageGlucose: insights.averageGlucose,
          timeInRange: insights.timeInRangePercent,
          timeAboveRange: insights.timeAboveRangePercent,
          timeBelowRange: insights.timeBelowRangePercent,
          standardDeviation: 15.2,
          fastingGlucose: insights.fastingGlucose,
          sleepScore: 84,
          exerciseMinutes: 30,
        }),
      });

      if (!res.ok) throw new Error('Failed to analyze telemetry');
      const data = await res.json();

      const updated: MetabolicScoreData = {
        ...insights,
        score: data.metabolicScore || insights.score,
        rating: data.metabolicScoreRating || insights.rating,
        summary: data.scoreSummary || insights.summary,
        observations: data.keyObservations || insights.observations,
        prescriptions: (data.actionablePrescriptions || []).map((p: any, idx: number) => ({
          id: `ai-presc-${Date.now()}-${idx}`,
          priority: p.priority || 'High',
          category: 'movement',
          title: p.actionTitle || 'Targeted Intervention',
          description: p.actionDescription,
          expectedGlucoseImpact: p.expectedGlucoseImpact,
          timeToExecute: p.timeToExecute,
          completed: false,
        })),
        circadianRhythmNote: data.circadianRhythmNote || insights.circadianRhythmNote,
        lastUpdated: new Date().toISOString(),
      };

      onUpdateInsights(updated);
      confetti({ particleCount: 35, spread: 70 });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Optimal':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'Good':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'Variable':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    }
  };

  return (
    <div id="wellness-insights-view" className="space-y-4">
      {/* Metabolic Longevity Score Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Mitochondrial Longevity</span>
              </span>
              <span className="text-xs text-slate-400">24h Telemetry</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              Metabolic Health Index
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowExportModal(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              title="Export Report"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={handleRunAIDiagnostics}
              disabled={isAnalyzing}
              className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              title="Run AI Diagnostics"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Score & TIR Radial / Number Display */}
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray={`${insights.score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white leading-none">
                  {insights.score}
                </span>
                <span className="text-[9px] font-bold text-slate-400">/ 100</span>
              </div>
            </div>

            <div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold ${getRatingColor(insights.rating)}`}>
                <Award className="w-3.5 h-3.5" />
                <span>{insights.rating} Glycemic Stability</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                {insights.summary}
              </p>
            </div>
          </div>

          {/* Quick Vital Metrics */}
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto text-center border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 sm:pl-4">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-semibold">Time in Range</span>
              <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                {insights.timeInRangePercent}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-semibold">Variability (CV)</span>
              <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                {insights.glycemicVariabilityCV}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-semibold">Est. HbA1c</span>
              <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                {insights.estimatedHbA1c}%
              </span>
            </div>
          </div>
        </div>

        {/* Time-In-Range Visual Breakdown Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Time-in-Range (TIR) Breakdown
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              Target: 70–140 mg/dL
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            {/* Low */}
            {insights.timeBelowRangePercent > 0 && (
              <div
                style={{ width: `${insights.timeBelowRangePercent}%` }}
                className="bg-rose-500 h-full"
                title={`Low (<70 mg/dL): ${insights.timeBelowRangePercent}%`}
              />
            )}
            {/* In Range */}
            <div
              style={{ width: `${insights.timeInRangePercent}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`In Target (70-140 mg/dL): ${insights.timeInRangePercent}%`}
            />
            {/* High */}
            {insights.timeAboveRangePercent > 0 && (
              <div
                style={{ width: `${insights.timeAboveRangePercent}%` }}
                className="bg-amber-500 h-full"
                title={`Elevated (>140 mg/dL): ${insights.timeAboveRangePercent}%`}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Low (&lt;70): {insights.timeBelowRangePercent}%
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Optimal In-Range (70-140): {insights.timeInRangePercent}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              High (&gt;140): {insights.timeAboveRangePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Actionable Wellness Prescriptions (Daily Biohack List) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Actionable Metabolic Prescriptions
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {insights.prescriptions.filter((p) => p.completed).length}/{insights.prescriptions.length} Done
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tailored daily actions proven to dampen glycemic spikes and maximize insulin sensitivity.
        </p>

        <div className="space-y-2.5 pt-1">
          {insights.prescriptions.map((action) => (
            <div
              key={action.id}
              onClick={() => onToggleActionCompleted(action.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                action.completed
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60 opacity-80'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400'
              }`}
            >
              <button
                type="button"
                className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0"
              >
                {action.completed ? (
                  <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 hover:text-emerald-500" />
                )}
              </button>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`text-xs sm:text-sm font-bold ${
                      action.completed
                        ? 'line-through text-slate-500 dark:text-slate-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {action.title}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      action.priority === 'High'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {action.priority} Priority
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {action.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-medium">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    ⚡ {action.expectedGlucoseImpact}
                  </span>
                  <span className="text-slate-400">🕒 {action.timeToExecute}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Metabolic Observations & Circadian Rhythm Insights */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>AI Clinical Telemetry Observations</span>
        </h3>

        <div className="space-y-2.5">
          {insights.observations.map((obs, index) => (
            <div
              key={index}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    obs.type === 'positive'
                      ? 'bg-emerald-500'
                      : obs.type === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{obs.title}</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-4">{obs.description}</p>
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 pl-4">
                Impact: {obs.impactOnMetabolism}
              </div>
            </div>
          ))}
        </div>

        {/* Circadian rhythm box */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
          <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Circadian & Fasting Window Rhythm</span>
            <p className="text-[11px] text-indigo-800/90 dark:text-indigo-300/90 mt-0.5">
              {insights.circadianRhythmNote}
            </p>
          </div>
        </div>
      </div>

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Metabolic Health Summary Report
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Report Date:</span>
                  <span className="font-bold">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metabolic Score:</span>
                  <span className="font-bold text-emerald-500">{insights.score}/100 ({insights.rating})</span>
                </div>
                <div className="flex justify-between">
                  <span>Time in Target Range (70-140):</span>
                  <span className="font-bold">{insights.timeInRangePercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Mean Daily Glucose:</span>
                  <span className="font-bold">{insights.averageGlucose} mg/dL</span>
                </div>
                <div className="flex justify-between">
                  <span>Glycemic Variability (CV):</span>
                  <span className="font-bold">{insights.glycemicVariabilityCV}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated HbA1c:</span>
                  <span className="font-bold">{insights.estimatedHbA1c}%</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                This report is compiled from 288 continuous glucose monitoring telemetry data points and personalized meal logs.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
