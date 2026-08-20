export interface GlucoseReading {
  id: string;
  timestamp: string; // ISO string
  value: number; // mg/dL
  trend: 'DoubleUp' | 'SingleUp' | 'FortyFiveUp' | 'Flat' | 'FortyFiveDown' | 'SingleDown' | 'DoubleDown';
  rateOfChange: number; // mg/dL per min (e.g. +1.4)
  notes?: string;
  eventType?: 'meal' | 'exercise' | 'insulin' | 'fasting' | 'sleep' | 'biohack';
  eventLabel?: string;
}

export interface MealItem {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
  calories: number;
  carbs: number; // g
  netCarbs: number; // g
  fiber: number; // g
  protein: number; // g
  fat: number; // g
  glycemicIndex: number; // 0 - 100
  glycemicLoad: number; // 0 - 50
  predictedSpikeMgDl: number;
  actualSpikeMgDl?: number;
  spikeRisk: 'Low' | 'Moderate' | 'High';
  glycemicScore: number; // 0 - 100 (100 is best)
  sequencingAdvice?: string;
  biohackTips?: string[];
  imageUrl?: string;
  ingredients?: string[];
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalCarbs: number;
  totalFiber: number;
  totalProtein: number;
  totalFat: number;
  averageGlycemicLoad: number;
  targetCalories: number;
  targetCarbs: number;
  targetProtein: number;
  targetFat: number;
  targetFiber: number;
}

export interface PlannedMeal {
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  timeWindow: string;
  recipeName: string;
  description: string;
  prepTimeMinutes: number;
  calories: number;
  carbs: number;
  fiber: number;
  protein: number;
  fat: number;
  glycemicLoad: number;
  predictedGlucosePeak: string;
  ingredients: { name: string; amount: string; glycemicBenefit: string }[];
  instructions: string[];
  sequencingGuide: string;
  cgmTip: string;
}

export interface MealPlan {
  id: string;
  dayTitle: string;
  generatedAt: string;
  glucoseStateAssessment: string;
  targetDailyMacros: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
    avgGlycemicLoad: number;
  };
  meals: PlannedMeal[];
  dailySpikeMitigationRule: string;
  hydrationGoalLiters: number;
  dietPreference: string;
}

export interface ActionCard {
  id: string;
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  category: 'nutrition' | 'movement' | 'sleep' | 'fasting';
  description: string;
  expectedGlucoseImpact: string;
  timeToExecute: string;
  completed?: boolean;
}

export interface MetabolicScoreData {
  score: number; // 0 - 100
  rating: 'Optimal' | 'Good' | 'Needs Attention' | 'Variable';
  timeInRangePercent: number; // 70-140 mg/dL target
  timeAboveRangePercent: number;
  timeBelowRangePercent: number;
  averageGlucose: number;
  glycemicVariabilityCV: number; // Coefficient of Variation % (ideal < 20%)
  estimatedHbA1c: number;
  fastingGlucose: number;
  summary: string;
  observations: {
    type: 'positive' | 'warning' | 'opportunity';
    title: string;
    description: string;
    impactOnMetabolism: string;
  }[];
  prescriptions: ActionCard[];
  circadianRhythmNote: string;
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  contextGlucose?: number;
}

export interface UserProfile {
  name: string;
  age: number;
  dietaryPreference: 'Mediterranean Low-GI' | 'Low Carb / Keto-Flex' | 'Plant-Forward' | 'Zone Balanced' | 'Intermittent Fasting';
  allergies: string;
  targetCalorieBudget: number;
  targetCarbBudget: number;
  targetProteinBudget: number;
  targetFatBudget: number;
  targetFiberBudget: number;
  targetGlucoseRange: { min: number; max: number }; // usually 70 - 140
  cgmSensorName: string;
  cgmConnected: boolean;
  sensorDaysRemaining: number;
  simulationSpeed: 'normal' | 'fast' | 'paused';
}
