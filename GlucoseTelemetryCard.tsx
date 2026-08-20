import React, { useState, useMemo, useRef } from 'react';
import { GlucoseReading } from '../types';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Zap,
  Footprints,
  Coffee,
  Sparkles,
  RefreshCw,
  Info,
  Clock,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GlucoseTelemetryCardProps {
  readings: GlucoseReading[];
  onAddReading: (reading: GlucoseReading) => void;
  onSimulateMealSpike: (foodName: string, carbGrams: number) => void;
  onSimulateExerciseWalk: () => void;
  onSimulateBiohack: (hackName: string) => void;
  sensorConnected: boolean;
  onToggleSensor: () => void;
}

export const GlucoseTelemetryCard: React.FC<GlucoseTelemetryCardProps> = ({
  readings,
  onSimulateMealSpike,
  onSimulateExerciseWalk,
  onSimulateBiohack,
  sensorConnected,
  onToggleSensor,
}) => {
  const [timeRange, setTimeRange] = useState<'3h' | '6h' | '12h' | '24h'>('24h');
  const [hoveredPoint, setHoveredPoint] = useState<GlucoseReading | null>(null);
  const [showSimControls, setShowSimControls] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Latest reading
  const latestReading = readings[readings.length - 1] || {
    value: 104,
    trend: 'Flat',
    rateOfChange: 0,
    timestamp: new Date().toISOString(),
  };

  // Filter readings by time range
  const filteredReadings = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    const count =
      timeRange === '3h' ? 36 : timeRange === '6h' ? 72 : timeRange === '12h' ? 144 : 288;
    return readings.slice(-count);
  }, [readings, timeRange]);

  // Target boundaries
  const TARGET_MIN = 70;
  const TARGET_MAX = 140;

  // Chart dimensions
  const width = 600;
  const height = 230;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Scale calculations
  const minVal = 50;
  const maxVal = 220;

  const getX = (index: number, total: number) => {
    if (total <= 1) return padding.left;
    return padding.left + (index / (total - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const ratio = (clamped - minVal) / (maxVal - minVal);
    return padding.top + (1 - ratio) * graphHeight;
  };

  // Build SVG Path for smooth curve
  const pathD = useMemo(() => {
    if (filteredReadings.length === 0) return '';
    const points = filteredReadings.map((r, i) => ({
      x: getX(i, filteredReadings.length),
      y: getY(r.value),
    }));

    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }, [filteredReadings]);

  // Area under the curve
  const areaD = useMemo(() => {
    if (!pathD || filteredReadings.length === 0) return '';
    const firstX = getX(0, filteredReadings.length);
    const lastX = getX(filteredReadings.length - 1, filteredReadings.length);
    const bottomY = getY(minVal);
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathD, filteredReadings]);

  // Determine status color and text
  const isHigh = latestReading.value > TARGET_MAX;
  const isLow = latestReading.value < TARGET_MIN;
  const statusColor = isHigh
    ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    : isLow
    ? 'text-rose-500 bg-rose-500/10 border-rose-500/30'
    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  const statusLabel = isHigh ? 'Elevated' : isLow ? 'Hypo Risk' : 'Optimal In-Range';

  // Render trend icon
  const renderTrendIcon = () => {
    switch (latestReading.trend) {
      case 'DoubleUp':
        return <ArrowUp className="w-5 h-5 text-amber-500 animate-bounce" />;
      case 'SingleUp':
        return <ArrowUp className="w-5 h-5 text-amber-500" />;
      case 'FortyFiveUp':
        return <ArrowUpRight className="w-5 h-5 text-emerald-500" />;
      case 'DoubleDown':
        return <ArrowDown className="w-5 h-5 text-rose-500 animate-bounce" />;
      case 'SingleDown':
        return <ArrowDown className="w-5 h-5 text-rose-500" />;
      case 'FortyFiveDown':
        return <ArrowDownRight className="w-5 h-5 text-emerald-500" />;
      default:
        return <ArrowRight className="w-5 h-5 text-emerald-500" />;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || filteredReadings.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgScaleX = width / rect.width;
    const currentSvgX = clientX * svgScaleX;

    const boundedX = Math.max(padding.left, Math.min(width - padding.right, currentSvgX));
    const ratio = (boundedX - padding.left) / graphWidth;
    const index = Math.round(ratio * (filteredReadings.length - 1));
    const point = filteredReadings[Math.max(0, Math.min(filteredReadings.length - 1, index))];
    setHoveredPoint(point);
  };

  return (
    <div id="cgm-telemetry-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
      {/* Top Bar: Sensor state & Time Range Selector */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Radio className={`w-3.5 h-3.5 ${sensorConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span>{sensorConnected ? 'CGM Stream Active' : 'CGM Paused'}</span>
          </div>
          <button
            onClick={onToggleSensor}
            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
          >
            {sensorConnected ? 'Pause' : 'Reconnect'}
          </button>
        </div>

        {/* Time range pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          {(['3h', '6h', '12h', '24h'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
                timeRange === r
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Glucose Telemetry Metric Display */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {hoveredPoint ? hoveredPoint.value : latestReading.value}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                mg / dL
              </span>
              <div className="flex items-center gap-1 font-semibold text-xs text-slate-600 dark:text-slate-300">
                {renderTrendIcon()}
                <span>
                  {latestReading.rateOfChange > 0 ? `+${latestReading.rateOfChange}` : latestReading.rateOfChange}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">mg/dL/min</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {hoveredPoint
                ? `Inspecting: ${new Date(hoveredPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Updated ${new Date(latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="text-right">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${statusColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {statusLabel}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Target: 70–140 mg/dL
          </div>
        </div>
      </div>

      {/* Interactive CGM SVG Chart */}
      <div className="relative w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* Gradient for area under curve */}
            <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Target range band pattern */}
            <linearGradient id="targetBandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Shaded Target Range Zone (70 - 140 mg/dL) */}
          <rect
            x={padding.left}
            y={getY(TARGET_MAX)}
            width={graphWidth}
            height={getY(TARGET_MIN) - getY(TARGET_MAX)}
            fill="url(#targetBandGradient)"
          />

          {/* Horizontal Reference Lines */}
          <line
            x1={padding.left}
            y1={getY(TARGET_MAX)}
            x2={width - padding.right}
            y2={getY(TARGET_MAX)}
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
          <text
            x={padding.left - 6}
            y={getY(TARGET_MAX) + 3}
            textAnchor="end"
            fontSize="10"
            fontWeight="600"
            className="fill-emerald-600 dark:fill-emerald-400"
          >
            140
          </text>

          <line
            x1={padding.left}
            y1={getY(TARGET_MIN)}
            x2={width - padding.right}
            y2={getY(TARGET_MIN)}
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />
          <text
            x={padding.left - 6}
            y={getY(TARGET_MIN) + 3}
            textAnchor="end"
            fontSize="10"
            fontWeight="600"
            className="fill-emerald-600 dark:fill-emerald-400"
          >
            70
          </text>

          <text
            x={padding.left - 6}
            y={getY(200) + 3}
            textAnchor="end"
            fontSize="10"
            className="fill-slate-400"
          >
            200
          </text>

          {/* Shaded Area */}
          {areaD && <path d={areaD} fill="url(#glucoseGradient)" />}

          {/* Smooth Glucose Curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Tagged Event Pins (Meals, Exercise) */}
          {filteredReadings.map((r, i) => {
            if (!r.eventType) return null;
            const cx = getX(i, filteredReadings.length);
            const cy = getY(r.value);

            return (
              <g key={r.id} className="cursor-pointer">
                <circle
                  cx={cx}
                  cy={cy}
                  r="5"
                  className={r.eventType === 'meal' ? 'fill-amber-500' : 'fill-blue-500'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="8"
                  className={r.eventType === 'meal' ? 'stroke-amber-500/40' : 'stroke-blue-500/40'}
                  fill="none"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Live pulse marker at latest reading */}
          {filteredReadings.length > 0 && !hoveredPoint && (
            <g>
              <circle
                cx={getX(filteredReadings.length - 1, filteredReadings.length)}
                cy={getY(latestReading.value)}
                r="4.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={getX(filteredReadings.length - 1, filteredReadings.length)}
                cy={getY(latestReading.value)}
                r="9"
                stroke="#10b981"
                strokeWidth="1.5"
                fill="none"
                className="animate-ping"
                style={{ transformOrigin: `${getX(filteredReadings.length - 1, filteredReadings.length)}px ${getY(latestReading.value)}px` }}
              />
            </g>
          )}

          {/* Hover Crosshair & Tooltip */}
          {hoveredPoint && (
            <g>
              {/* Vertical Scrubber Line */}
              {(() => {
                const idx = filteredReadings.findIndex((p) => p.id === hoveredPoint.id);
                const x = getX(idx, filteredReadings.length);
                const y = getY(hoveredPoint.value);

                return (
                  <>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={height - padding.bottom}
                      stroke="#64748b"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="#0f172a"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />
                  </>
                );
              })()}
            </g>
          )}

          {/* Time axis ticks */}
          {filteredReadings.length > 0 &&
            [0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const itemIdx = Math.min(
                filteredReadings.length - 1,
                Math.round(pct * (filteredReadings.length - 1))
              );
              const item = filteredReadings[itemIdx];
              if (!item) return null;
              const x = getX(itemIdx, filteredReadings.length);
              const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              });

              return (
                <text
                  key={idx}
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="9"
                  className="fill-slate-400 font-medium"
                >
                  {timeStr}
                </text>
              );
            })}
        </svg>
      </div>

      {/* Hovered event inspection banner */}
      {hoveredPoint && hoveredPoint.eventLabel && (
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">{hoveredPoint.eventLabel}</span>
          </div>
          <span className="font-mono font-bold">{hoveredPoint.value} mg/dL</span>
        </div>
      )}

      {/* Simulation & Interactive Biohack Toolbar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowSimControls(!showSimControls)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{showSimControls ? 'Hide Simulation Tools' : 'Simulate Glucose Events'}</span>
          </button>
          <span className="text-[11px] text-slate-400">Continuous 5-min Telemetry</span>
        </div>

        {showSimControls && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => {
                onSimulateMealSpike('Oat Milk Matcha + Pastry', 48);
                confetti({ particleCount: 20, spread: 60 });
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">Log Carb Spike</div>
                <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80">+38 mg/dL spike</div>
              </div>
            </button>

            <button
              onClick={() => {
                onSimulateExerciseWalk();
                confetti({ particleCount: 25, spread: 70 });
              }}
              className="flex items-center gap-2 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <Footprints className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate">15m Post-Meal Walk</div>
                <div className="text-[10px] text-blue-700/80 dark:text-blue-400/80">-25 mg/dL GLUT4 drop</div>
              </div>
            </button>

            <button
              onClick={() => {
                onSimulateBiohack('Apple Cider Vinegar & Fiber Preload');
                confetti({ particleCount: 20, spread: 60 });
              }}
              className="col-span-2 sm:col-span-1 flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">ACV Preload</div>
                <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">Blunt spike by 20%</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
