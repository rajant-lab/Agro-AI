import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";
import { WeatherDataPoint, CropThresholds } from "../types";

interface ThresholdChartProps {
  weatherData: WeatherDataPoint[];
  thresholds: CropThresholds;
  cropType: string;
}

export function ThresholdChart({ weatherData, thresholds, cropType }: ThresholdChartProps) {
  // Format data specifically for chart plotting
  const chartData = weatherData.map((pt) => ({
    name: pt.date.split(" ")[0] || pt.date,
    "Min Temp": pt.tempMin,
    "Max Temp": pt.tempMax,
    "Mean Temp": pt.temp,
    "Precipitation (mm)": pt.precipitation,
    "Wind Speed (km/h)": pt.windSpeed,
    "Humidity (%)": pt.humidity,
  }));

  // Determine standard reference line positions based on crop values
  const showFrostLine = thresholds.frostTemp !== undefined;
  const showHeatLine = thresholds.heatTemp !== undefined;
  const showWindLine = thresholds.windThreshold !== undefined;
  const showRainLine = thresholds.rainThreshold !== undefined;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm" id="threshold-chart-card">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Meteorological Alert Visualizer
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time overlay of daily forecast points against physiological stress limits for <span className="font-semibold">{cropType}</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Heat Limit: {thresholds.heatTemp}°C
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Frost Limit: {thresholds.frostTemp}°C
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium bg-sky-50 text-sky-600 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            Wind Load: {thresholds.windThreshold} km/h
          </span>
        </div>
      </div>

      <div className="w-full h-[320px] transition-all" id="charts-container">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: "#6B7280", fontSize: 11 }}
              tickLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis 
              yAxisId="left" 
              tick={{ fill: "#374151", fontSize: 11 }}
              label={{ value: "Temp (°C) / Wind (km/h)", angle: -90, position: "insideLeft", fill: "#6B7280", fontSize: 10, offset: 10 }}
              domain={["auto", "auto"]}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fill: "#0284C7", fontSize: 11 }}
              label={{ value: "Rainfall (mm)", angle: 90, position: "insideRight", fill: "#0284C7", fontSize: 10, offset: 10 }}
              domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax + 10))]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ fontWeight: "bold", color: "#1F2937" }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
            
            {/* Forecast plotting */}
            <Bar yAxisId="right" dataKey="Precipitation (mm)" fill="#0ea5e9" radius={[4, 4, 0, 0]} opacity={0.7} />
            <Line yAxisId="left" type="monotone" dataKey="Max Temp" stroke="#e11d48" strokeWidth={2.5} activeDot={{ r: 6 }} />
            <Line yAxisId="left" type="monotone" dataKey="Min Temp" stroke="#2563eb" strokeWidth={2.5} />
            <Line yAxisId="left" type="monotone" dataKey="Wind Speed (km/h)" stroke="#059669" strokeWidth={1.5} strokeDasharray="4 4" />

            {/* Physiological Stress Limit Threshold Overlays */}
            {showHeatLine && (
              <ReferenceLine 
                yAxisId="left" 
                y={thresholds.heatTemp} 
                stroke="#dc2626" 
                strokeDasharray="3 3"
                label={{ value: `Max Heat (${thresholds.heatTemp}C)`, fill:"#dc2626", fontSize: 9, position: "top" }} 
              />
            )}
            {showFrostLine && (
              <ReferenceLine 
                yAxisId="left" 
                y={thresholds.frostTemp} 
                stroke="#2563eb" 
                strokeDasharray="3 3" 
                label={{ value: `Frost Limit (${thresholds.frostTemp}C)`, fill:"#2563eb", fontSize: 9, position: "bottom" }}
              />
            )}
            {showWindLine && (
              <ReferenceLine 
                yAxisId="left" 
                y={thresholds.windThreshold} 
                stroke="#059669" 
                strokeDasharray="3 3" 
                label={{ value: `Lodging Wind (${thresholds.windThreshold}km/h)`, fill:"#059669", fontSize: 9, position: "top" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-4 text-[10px] text-zinc-500 dark:text-zinc-400 justify-center">
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-600 block"></span>
          <span>Max Temperature</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-600 block"></span>
          <span>Min Temperature</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-green-600 dashed-border block"></span>
          <span>Wind Speed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-sky-500 rounded-sm block"></span>
          <span>Rain Accumulation</span>
        </div>
      </div>
    </div>
  );
}
