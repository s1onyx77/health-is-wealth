import { GlucoseReading, MealItem, MealPlan, ActionCard, UserProfile, MetabolicScoreData } from '../types';
import { generateInitial24HourReadings, computeMetabolicMetrics, computeMetabolicScore } from './glucoseSimulator';
import { defaultMeals, defaultPersonalizedMealPlan, defaultActionCards, defaultUserProfile } from './defaultData';

const STORAGE_KEYS = {
  READINGS: 'glucofit_readings_v1',
  MEALS: 'glucofit_meals_v1',
  MEAL_PLAN: 'glucofit_meal_plan_v1',
  ACTIONS: 'glucofit_actions_v1',
  PROFILE: 'glucofit_profile_v1',
  INSIGHTS: 'glucofit_insights_v1',
};

export function loadReadings(): GlucoseReading[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.READINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load readings from localStorage', e);
  }
  const initial = generateInitial24HourReadings();
  saveReadings(initial);
  return initial;
}

export function saveReadings(readings: GlucoseReading[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.READINGS, JSON.stringify(readings));
  } catch (e) {
    console.error('Failed to save readings to localStorage', e);
  }
}

export function loadMeals(): MealItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load meals from localStorage', e);
  }
  saveMeals(defaultMeals);
  return defaultMeals;
}

export function saveMeals(meals: MealItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
  } catch (e) {
    console.error('Failed to save meals to localStorage', e);
  }
}

export function loadMealPlan(): MealPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEAL_PLAN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.meals) return parsed;
    }
  } catch (e) {
    console.error('Failed to load meal plan from localStorage', e);
  }
  saveMealPlan(defaultPersonalizedMealPlan);
  return defaultPersonalizedMealPlan;
}

export function saveMealPlan(plan: MealPlan): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEAL_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.error('Failed to save meal plan to localStorage', e);
  }
}

export function loadActionCards(): ActionCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load action cards from localStorage', e);
  }
  saveActionCards(defaultActionCards);
  return defaultActionCards;
}

export function saveActionCards(cards: ActionCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save action cards to localStorage', e);
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) return parsed;
    }
  } catch (e) {
    console.error('Failed to load user profile from localStorage', e);
  }
  saveUserProfile(defaultUserProfile);
  return defaultUserProfile;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile to localStorage', e);
  }
}

export function computeCurrentMetabolicData(readings: GlucoseReading[], meals: MealItem[]): MetabolicScoreData {
  const metrics = computeMetabolicMetrics(readings);
  const totalFiber = meals.reduce((acc, m) => acc + (m.fiber || 0), 0);
  const scoreInfo = computeMetabolicScore(metrics, totalFiber);

  return {
    score: scoreInfo.score,
    rating: scoreInfo.rating,
    timeInRangePercent: metrics.timeInRange,
    timeAboveRangePercent: metrics.timeAboveRange,
    timeBelowRangePercent: metrics.timeBelowRange,
    averageGlucose: metrics.averageGlucose,
    glycemicVariabilityCV: metrics.glycemicVariabilityCV,
    estimatedHbA1c: metrics.estimatedHbA1c,
    fastingGlucose: readings[0]?.value || 92,
    summary: scoreInfo.summary,
    observations: [
      {
        type: 'positive',
        title: 'Outstanding Daytime Glycemic Stability',
        description: `${metrics.timeInRange}% of your readings today stayed strictly within your optimal metabolic target (70–140 mg/dL).`,
        impactOnMetabolism: 'Protects vascular endothelial lining and prevents chronic insulin hypersecretion.',
      },
      {
        type: 'opportunity',
        title: 'Post-Meal Walking Synergism',
        description: 'Post-meal activity blunts postprandial glucose excursions by facilitating GLUT4 transporter recruitment.',
        impactOnMetabolism: 'Decreases glycemic variability by up to 28%.',
      },
      {
        type: 'warning',
        title: 'Nocturnal Baseline Shift',
        description: 'Late meals after 8 PM may slightly elevate overnight resting glucose and reduce deep slow-wave sleep duration.',
        impactOnMetabolism: 'Higher morning insulin resistance.',
      }
    ],
    prescriptions: loadActionCards(),
    circadianRhythmNote: 'Your morning fasting glucose baseline is currently 92 mg/dL. Eating within an 10-hour window (8 AM to 6 PM) promotes metabolic flexibility and autophagy.',
    lastUpdated: new Date().toISOString(),
  };
}
