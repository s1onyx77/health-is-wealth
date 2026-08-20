import React, { useState, useRef } from 'react';
import { MealItem } from '../types';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  Check,
  AlertTriangle,
  Flame,
  Zap,
  Clock,
  ChevronRight,
  Info,
  Layers,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { sampleFoodGallery } from '../utils/defaultData';
import confetti from 'canvas-confetti';

interface FoodScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMeal: (meal: MealItem) => void;
  currentGlucose: number;
}

export const FoodScannerModal: React.FC<FoodScannerModalProps> = ({
  isOpen,
  onClose,
  onAddMeal,
  currentGlucose,
}) => {
  const [activeTab, setActiveTab] = useState<'ai-vision' | 'ai-text' | 'gallery'>('ai-vision');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealItem['mealType']>('lunch');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof sampleFoodGallery[0]) => {
    setSelectedImage(sample.image);
    setTextDescription(sample.description);
    setActiveTab('ai-vision');
  };

  const handleRunAnalysis = async () => {
    if (!selectedImage && !textDescription.trim()) {
      setErrorMsg('Please upload a food photo, select a sample, or enter a description.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gemini/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealDescription: textDescription.trim() || undefined,
          imageBase64: selectedImage || undefined,
          currentGlucose,
          dietaryGoals: 'Maintain stable blood glucose, minimize insulin spike, promote metabolic longevity',
        }),
      });

      if (!res.ok) {
        throw new Error('Analysis failed. Please try again.');
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to analyze meal with Gemini AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndLog = () => {
    if (!analysisResult) return;

    const newMeal: MealItem = {
      id: `meal-${Date.now()}`,
      name: analysisResult.foodName || textDescription || 'Custom AI Meal',
      mealType: selectedMealType,
      timestamp: new Date().toISOString(),
      calories: Number(analysisResult.calories) || 350,
      carbs: Number(analysisResult.carbs) || 25,
      netCarbs: Number(analysisResult.netCarbs) || (analysisResult.carbs - (analysisResult.fiber || 0)),
      fiber: Number(analysisResult.fiber) || 6,
      protein: Number(analysisResult.protein) || 25,
      fat: Number(analysisResult.fat) || 15,
      glycemicIndex: Number(analysisResult.glycemicIndex) || 35,
      glycemicLoad: Number(analysisResult.glycemicLoad) || 7,
      predictedSpikeMgDl: Number(analysisResult.predictedSpikeMgDl) || 18,
      spikeRisk: analysisResult.spikeRisk || 'Low',
      glycemicScore: Number(analysisResult.glycemicScore) || 85,
      sequencingAdvice: analysisResult.sequencingAdvice,
      biohackTips: analysisResult.biohackTips || [],
      ingredients: analysisResult.ingredientsDetected || [],
      imageUrl: selectedImage || undefined,
    };

    onAddMeal(newMeal);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Nutrition & Glucose Scanner</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Baseline: <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{currentGlucose} mg/dL</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* If analysis result is available, show the report */}
          {analysisResult ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300">
                      AI Metabolic Analysis
                    </span>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {analysisResult.foodName}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {analysisResult.portionSize || '1 Serving'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {analysisResult.glycemicScore}/100
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Glycemic Score
                    </div>
                  </div>
                </div>
              </div>

              {/* Predicted Spike & Risk Card */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                    <span>Predicted Peak</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    +{analysisResult.predictedSpikeMgDl} <span className="text-xs font-normal">mg/dL</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    Est. Peak: {currentGlucose + Number(analysisResult.predictedSpikeMgDl)} mg/dL
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Glycemic Load (GL)</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {analysisResult.glycemicLoad} <span className="text-xs font-normal font-sans text-emerald-600 dark:text-emerald-400">({analysisResult.spikeRisk} Risk)</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    GI: {analysisResult.glycemicIndex} / 100
                  </div>
                </div>
              </div>

              {/* Macro breakdown grid */}
              <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Calories</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {analysisResult.calories}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-500">Net Carbs</div>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                    {analysisResult.netCarbs || analysisResult.carbs}g
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-blue-500">Protein</div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                    {analysisResult.protein}g
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-500">Fiber</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {analysisResult.fiber}g
                  </div>
                </div>
              </div>

              {/* Sequencing Guide & Biohack Hacks */}
              {analysisResult.sequencingAdvice && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                    <Layers className="w-4 h-4" />
                    <span>Food Sequencing Strategy (Spike Blunter)</span>
                  </div>
                  <p>{analysisResult.sequencingAdvice}</p>
                </div>
              )}

              {analysisResult.biohackTips && analysisResult.biohackTips.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Actionable Spike Reduction Hacks</span>
                  </div>
                  {analysisResult.biohackTips.map((tip: string, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Meal Type selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Log this meal as:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedMealType(type)}
                      className={`py-1.5 text-xs font-semibold rounded-xl capitalize transition-all border ${
                        selectedMealType === type
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Input Methods: AI Vision / Description / Sample Gallery */
            <div className="space-y-4">
              {/* Tab selector */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setActiveTab('ai-vision')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'ai-vision'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Photo / Vision</span>
                </button>

                <button
                  onClick={() => setActiveTab('ai-text')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'ai-text'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Describe</span>
                </button>

                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'gallery'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Test Foods</span>
                </button>
              </div>

              {/* Tab 1: Vision Photo Upload */}
              {activeTab === 'ai-vision' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {selectedImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 aspect-video group">
                      <img
                        src={selectedImage}
                        alt="Food to analyze"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-slate-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 bg-slate-900/70 backdrop-blur-xs text-white text-xs rounded-xl flex items-center justify-between">
                        <span>Photo loaded ready for AI analysis</span>
                        <span className="font-semibold text-emerald-400">Ready</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors bg-slate-50 dark:bg-slate-800/40"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Upload or snap a food photo
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Gemini AI will detect ingredients, calculate glycemic index & predicted spike.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Optional context or portion notes:
                    </label>
                    <input
                      type="text"
                      value={textDescription}
                      onChange={(e) => setTextDescription(e.target.value)}
                      placeholder="e.g. Added 1 tbsp olive oil, no sauce"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Text prompt description */}
              {activeTab === 'ai-text' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Describe your meal in natural language:
                    </label>
                    <textarea
                      rows={4}
                      value={textDescription}
                      onChange={(e) => setTextDescription(e.target.value)}
                      placeholder="e.g. 2 pasture-raised eggs scrambled with spinach, half an avocado on 1 slice of sourdough toast, and a black coffee."
                      className="w-full p-3.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Greek yogurt with wild blueberries & walnuts',
                      'Grilled ribeye with asparagus & sweet potato',
                      'Chicken Caesar salad with no croutons',
                      'Oatmeal with banana, peanut butter & honey',
                    ].map((example, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTextDescription(example)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Sample Food Gallery */}
              {activeTab === 'gallery' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click any sample item to test immediate multi-nutrient & glucose spike AI analysis:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {sampleFoodGallery.map((sample, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectSample(sample)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50 dark:bg-slate-800/60 cursor-pointer transition-all flex flex-col justify-between"
                      >
                        <div className="aspect-4/3 rounded-lg overflow-hidden mb-2 bg-slate-200">
                          <img src={sample.image} alt={sample.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {sample.name}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>{sample.calories} kcal</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{sample.spike}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          {analysisResult ? (
            <>
              <button
                type="button"
                onClick={() => setAnalysisResult(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Re-Analyze
              </button>
              <button
                type="button"
                onClick={handleConfirmAndLog}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Save to Meal Tracker</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isLoading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Metabolic Scan</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
