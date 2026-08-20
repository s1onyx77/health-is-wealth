import { GlucoseReading } from '../types';

export function generateInitial24HourReadings(): GlucoseReading[] {
  const readings: GlucoseReading[] = [];
  const now = new Date();
  // Generate 288 points (5-min intervals over 24 hours)
  const totalPoints = 288;
  const intervalMinutes = 5;

  const startTime = new Date(now.getTime() - (totalPoints * intervalMinutes * 60 * 1000));

  // Baseline fasting glucose around 88 - 94 mg/dL
  let currentVal = 92;

  // Scheduled simulated events over the 24 hours:
  // - 07:30 Breakfast (Oatmeal & Berries, moderate spike to ~138 mg/dL)
  // - 12:45 Lunch (Grilled Chicken Salad + Quinoa, mild bump to ~118 mg/dL)
  // - 15:30 Afternoon Walk (Exercise dip to ~86 mg/dL)
  // - 19:15 Dinner (Pasta with creamy sauce - high spike to ~162 mg/dL followed by recovery)
  // - 23:00 Sleep stabilization (85-92 mg/dL)

  for (let i = 0; i < totalPoints; i++) {
    const pointTime = new Date(startTime.getTime() + (i * intervalMinutes * 60 * 1000));
    const hours = pointTime.getHours() + pointTime.getMinutes() / 60;

    let targetBase = 90;
    let eventType: GlucoseReading['eventType'] | undefined = undefined;
    let eventLabel: string | undefined = undefined;

    // Circadian dawn phenomenon (05:00 - 07:00)
    if (hours >= 5 && hours < 7.5) {
      targetBase = 96 + Math.sin((hours - 5) / 2.5 * Math.PI) * 12;
    } 
    // Breakfast event (07:30 - 10:00)
    else if (hours >= 7.5 && hours < 10) {
      const progress = (hours - 7.5) / 2.5;
      if (progress < 0.15) {
        eventType = 'meal';
        eventLabel = 'Breakfast: Protein Chia & Berries';
      }
      targetBase = 92 + Math.sin(progress * Math.PI) * 36;
    }
    // Lunch event (12:30 - 15:00)
    else if (hours >= 12.5 && hours < 15) {
      const progress = (hours - 12.5) / 2.5;
      if (progress < 0.15) {
        eventType = 'meal';
        eventLabel = 'Lunch: Mediterranean Salmon Bowl';
      }
      targetBase = 94 + Math.sin(progress * Math.PI) * 26;
    }
    // Afternoon Movement (15:30 - 16:30)
    else if (hours >= 15.5 && hours < 16.5) {
      if (hours >= 15.5 && hours < 15.7) {
        eventType = 'exercise';
        eventLabel = '15-min Brisk Post-Lunch Walk';
      }
      targetBase = 84;
    }
    // Dinner event (19:00 - 22:00)
    else if (hours >= 19.0 && hours < 22.0) {
      const progress = (hours - 19.0) / 3.0;
      if (progress < 0.12) {
        eventType = 'meal';
        eventLabel = 'Dinner: Herb Roast Chicken & Veggies';
      }
      targetBase = 96 + Math.sin(progress * Math.PI) * 34;
    }
    // Night Sleep
    else {
      targetBase = 88 + Math.sin(i * 0.1) * 3;
    }

    // Add gentle physiological micro-fluctuations (0.5 - 1.5 mg/dL)
    const microNoise = (Math.sin(i * 0.5) + Math.cos(i * 0.3)) * 1.5;
    const computedVal = Math.round(targetBase + microNoise);

    // Calculate trend & rate of change from previous reading
    const prevVal = readings.length > 0 ? readings[readings.length - 1].value : computedVal;
    const diff = computedVal - prevVal;
    const rateOfChange = Number((diff / intervalMinutes).toFixed(2));

    let trend: GlucoseReading['trend'] = 'Flat';
    if (diff >= 3) trend = 'DoubleUp';
    else if (diff >= 1.8) trend = 'SingleUp';
    else if (diff >= 0.8) trend = 'FortyFiveUp';
    else if (diff <= -3) trend = 'DoubleDown';
    else if (diff <= -1.8) trend = 'SingleDown';
    else if (diff <= -0.8) trend = 'FortyFiveDown';

    readings.push({
      id: `reading-${pointTime.getTime()}`,
      timestamp: pointTime.toISOString(),
      value: Math.max(65, Math.min(220, computedVal)),
      trend,
      rateOfChange,
      eventType,
      eventLabel,
    });
  }

  return readings;
}

export function computeMetabolicMetrics(readings: GlucoseReading[]) {
  if (!readings || readings.length === 0) {
    return {
      averageGlucose: 95,
      timeInRange: 95,
      timeAboveRange: 5,
      timeBelowRange: 0,
      standardDeviation: 14,
      glycemicVariabilityCV: 14.7,
      estimatedHbA1c: 5.1,
      minGlucose: 80,
      maxGlucose: 135,
    };
  }

  const values = readings.map((r) => r.value);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / values.length);

  // In Range: 70 - 140 mg/dL (ADA & CGM consensus standard for non-diabetic/optimal metabolic health)
  const inRangeCount = values.filter((v) => v >= 70 && v <= 140).length;
  const aboveRangeCount = values.filter((v) => v > 140).length;
  const belowRangeCount = values.filter((v) => v < 70).length;

  const timeInRange = Math.round((inRangeCount / values.length) * 100);
  const timeAboveRange = Math.round((aboveRangeCount / values.length) * 100);
  const timeBelowRange = Math.round((belowRangeCount / values.length) * 100);

  // Standard Deviation
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
  const standardDeviation = Math.round(Math.sqrt(variance) * 10) / 10;

  // Coefficient of Variation CV (%) = (SD / Mean) * 100
  const glycemicVariabilityCV =
    avg > 0 ? Math.round((standardDeviation / avg) * 1000) / 10 : 15;

  // Estimated HbA1c (%) = (Mean Glucose + 46.7) / 28.7 (Nathan et al.)
  const estimatedHbA1c = Math.round(((avg + 46.7) / 28.7) * 10) / 10;

  const minGlucose = Math.min(...values);
  const maxGlucose = Math.max(...values);

  return {
    averageGlucose: avg,
    timeInRange,
    timeAboveRange,
    timeBelowRange,
    standardDeviation,
    glycemicVariabilityCV,
    estimatedHbA1c,
    minGlucose,
    maxGlucose,
  };
}

export function computeMetabolicScore(metrics: ReturnType<typeof computeMetabolicMetrics>, fiberTotal: number = 28): {
  score: number;
  rating: 'Optimal' | 'Good' | 'Needs Attention' | 'Variable';
  summary: string;
} {
  // Score formula combining Time in Range (50%), Glycemic Variability (30%), Average Glucose (15%), Fiber (5%)
  let score = 0;
  
  // TIR contribution (max 50 pts)
  score += (metrics.timeInRange / 100) * 50;

  // Variability contribution (CV < 20% is ideal, max 30 pts)
  if (metrics.glycemicVariabilityCV <= 18) score += 30;
  else if (metrics.glycemicVariabilityCV <= 25) score += 24;
  else if (metrics.glycemicVariabilityCV <= 33) score += 15;
  else score += 5;

  // Average glucose contribution (85-105 mg/dL is optimal, max 15 pts)
  if (metrics.averageGlucose >= 85 && metrics.averageGlucose <= 105) score += 15;
  else if (metrics.averageGlucose <= 120) score += 10;
  else score += 4;

  // Fiber target bonus (5 pts)
  if (fiberTotal >= 25) score += 5;
  else score += Math.round((fiberTotal / 25) * 5);

  score = Math.min(100, Math.max(20, Math.round(score)));

  let rating: 'Optimal' | 'Good' | 'Needs Attention' | 'Variable' = 'Optimal';
  let summary = 'Your glucose levels are exceptionally stable with minimal glycemic fluctuations.';

  if (score >= 90) {
    rating = 'Optimal';
    summary = 'Superb metabolic stability! 90%+ Time-in-Range with low glycemic variability indicates high insulin sensitivity.';
  } else if (score >= 75) {
    rating = 'Good';
    summary = 'Solid glucose control. Consider pairing lunch carbs with fiber and taking a 10-minute post-meal stroll to reach 95%+ TIR.';
  } else if (score >= 60) {
    rating = 'Variable';
    summary = 'Elevated postprandial glucose excursions observed. Utilizing food sequencing and apple cider vinegar can flatten spikes.';
  } else {
    rating = 'Needs Attention';
    summary = 'Frequent glucose spikes above 140 mg/dL detected. We recommend focusing on low-glycemic meal plans.';
  }

  return { score, rating, summary };
}
