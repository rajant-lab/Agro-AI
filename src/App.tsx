import { useState, useEffect } from "react";
import { 
  Sprout, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Printer, 
  Download, 
  ChevronRight, 
  Info, 
  HelpCircle,
  TrendingDown,
  Lock,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CropMetadata, WeatherDataPoint, AnalysisResponse } from "./types";
import { CROP_TEMPLATES, SCENARIO_PRESETS, ScenarioPreset } from "./presets";
import { ThresholdChart } from "./components/ThresholdChart";
import { MitigationTimeline } from "./components/MitigationTimeline";

// Pre-load the first scenario as an active baseline
const DEFAULT_PRESET = SCENARIO_PRESETS[0];

export default function App() {
  // Input fields
  const [selectedCropKey, setSelectedCropKey] = useState<string>("Wheat");
  const [growthStage, setGrowthStage] = useState<string>(DEFAULT_PRESET.growthStage);
  const [location, setLocation] = useState<string>(DEFAULT_PRESET.defaultLocation);
  const [weatherForecast, setWeatherForecast] = useState<WeatherDataPoint[]>(DEFAULT_PRESET.weatherForecast);
  
  // Custom manual metadata fields
  const [customCropName, setCustomCropName] = useState<string>("");
  const [isCustomCropMode, setIsCustomCropMode] = useState<boolean>(false);

  // Active weather Day selector tabs
  const [activeWeatherDayIndex, setActiveWeatherDayIndex] = useState<number>(0);

  // Analytical outputs
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);

  // Interactive guidance states
  const [scenarioPrompt, setScenarioPrompt] = useState<{ active: boolean; presetName: string } | null>(null);
  const [oldReportOutOfSync, setOldReportOutOfSync] = useState<boolean>(false);

  // Load baseline on mount
  useEffect(() => {
    loadPreset(DEFAULT_PRESET, true);
  }, []);

  const loadPreset = (preset: ScenarioPreset, autoExecute: boolean = false) => {
    setSelectedCropKey(preset.cropType);
    setGrowthStage(preset.growthStage);
    setLocation(preset.defaultLocation);
    setWeatherForecast(JSON.parse(JSON.stringify(preset.weatherForecast)));
    setIsCustomCropMode(false);
    setCustomCropName("");
    setActiveWeatherDayIndex(0);
    setApiError(null);
    if (autoExecute) {
      setScenarioPrompt(null);
      setOldReportOutOfSync(false);
      runAnalysisDirectly(preset.cropType, preset.growthStage, preset.defaultLocation, preset.weatherForecast);
    } else {
      setScenarioPrompt({ active: true, presetName: preset.name });
      setOldReportOutOfSync(true);
    }
  };

  const getActiveCropThresholds = () => {
    const template = CROP_TEMPLATES[selectedCropKey];
    if (template) {
      return template.thresholds;
    }
    // Custom fallbacks
    return {
      frostTemp: 0,
      heatTemp: 35,
      rainThreshold: 50,
      windThreshold: 35
    };
  };

  const runAnalysisDirectly = async (
    cType: string, 
    cStage: string, 
    cLoc: string, 
    cForecast: WeatherDataPoint[]
  ) => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await fetch("/api/analyze-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop_metadata: {
            type: cType,
            growth_stage: cStage,
            location: cLoc
          },
          weather_forecast: cForecast
        })
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || "Agricultural engine returned a non-ok endpoint status.");
      }

      const parsed: AnalysisResponse = await response.json();
      setAnalysisResult(parsed);
    } catch (err: any) {
      console.error(err);
      setApiError(err?.message || "Failed to establish a network analysis handshake.");
    } finally {
      setLoading(false);
    }
  };

  const executeSystemAnalysis = () => {
    setScenarioPrompt(null);
    setOldReportOutOfSync(false);
    const finalCropType = isCustomCropMode ? customCropName : CROP_TEMPLATES[selectedCropKey].name;
    runAnalysisDirectly(finalCropType, growthStage, location, weatherForecast);
  };

  const updateSelectedDayForecast = (field: keyof WeatherDataPoint, value: number) => {
    const updated = [...weatherForecast];
    const targetPoint = updated[activeWeatherDayIndex];
    
    // Ensure logical min < max boundaries when adjusting
    if (field === "tempMin" && value > targetPoint.tempMax) {
      targetPoint.tempMax = value;
    }
    if (field === "tempMax" && value < targetPoint.tempMin) {
      targetPoint.tempMin = value;
    }

    // Cast as number
    targetPoint[field] = value as any;

    // Recalculate average daily average if temperature variables shifted
    if (field === "tempMin" || field === "tempMax") {
      targetPoint.temp = parseFloat(((targetPoint.tempMin + targetPoint.tempMax) / 2).toFixed(1));
    }

    setWeatherForecast(updated);
    setOldReportOutOfSync(true);
  };

  // Status colors & helpers
  const getOverallRiskConfig = (level: string) => {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
        return {
          banner: "bg-red-600/10 text-red-700 border-red-500/20 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50",
          text: "text-red-700 dark:text-rose-400",
          border: "border-red-500",
          bg: "bg-red-500/10",
          badge: "bg-red-600 text-white animate-pulse"
        };
      case "HIGH":
        return {
          banner: "bg-orange-600/10 text-orange-700 border-orange-500/20 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
          text: "text-orange-600 dark:text-amber-400",
          border: "border-orange-500",
          bg: "bg-orange-500/10",
          badge: "bg-orange-500 text-white"
        };
      case "MEDIUM":
        return {
          banner: "bg-amber-600/10 text-amber-700 border-amber-500/20 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/50",
          text: "text-amber-600 dark:text-yellow-400",
          border: "border-amber-500",
          bg: "bg-amber-500/10",
          badge: "bg-amber-500 text-white"
        };
      default:
        return {
          banner: "bg-emerald-600/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
          text: "text-emerald-600 dark:text-emerald-400",
          border: "border-emerald-500",
          bg: "bg-emerald-500/10",
          badge: "bg-emerald-600 text-white"
        };
    }
  };

  const getRiskMeterColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "HIGH":
        return "bg-rose-500";
      case "MEDIUM":
        return "bg-amber-500";
      default:
        return "bg-emerald-500";
    }
  };

  const getRiskBg = (level: string) => {
    switch (level?.toUpperCase()) {
      case "HIGH":
        return "bg-rose-50/50 border-rose-200 dark:bg-rose-950/10 dark:border-rose-900/40";
      case "MEDIUM":
        return "bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/40";
      default:
        return "bg-emerald-50/30 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900/40";
    }
  };

  const downloadAnalysisJSON = () => {
    if (!analysisResult) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysisResult, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `agronomic_report_${selectedCropKey.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const triggerSystemPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 font-sans print:bg-white print:text-black">
      
      {/* Upper Technical Banner */}
      <nav className="bg-white dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 p-4 sticky top-0 z-40 backdrop-blur-md print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-inner">
              <Sprout size={22} className="stroke-2 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">AGRONOMIC AI</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">PRO EDITION</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-mono">Meteorological Threat & Mitigation Matrix</p>
            </div>
          </div>
          
          {/* Key status indicators */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-zinc-100 dark:bg-zinc-850 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-xs">
              <Lock size={12} className="text-zinc-400" />
              <span className="text-zinc-500 dark:text-zinc-400">Gemini Key:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Secure Config Active
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 tracking-wider font-mono uppercase hidden lg:block">System Clock: 2026-05-28</p>
          </div>
        </div>
      </nav>

      {/* Main Structural Workstation */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-20">
        
        {/* Dynamic Preset Scenarios Bar */}
        <section className="print:hidden">
          <div className="flex items-center gap-2 mb-3">
            <Compass size={16} className="text-emerald-600" />
            <h2 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-mono">
              Agro-Meteorological Simulation Scenarios
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" id="scenarios-grid">
            {SCENARIO_PRESETS.map((preset) => {
              const isActive = selectedCropKey === preset.cropType && growthStage === preset.growthStage;
              return (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    isActive
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-lg scale-[1.02] ring-2 ring-emerald-500/20"
                      : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isActive ? "text-emerald-100" : "text-zinc-400"}`}>
                      {preset.cropType} Scenario
                    </p>
                    <h3 className="text-sm font-bold leading-snug tracking-tight mb-2">
                      {preset.name}
                    </h3>
                  </div>
                  <p className={`text-[11px] line-clamp-2 leading-relaxed ${isActive ? "text-emerald-100/90" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {preset.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Master Content Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SETUP & PLANNER WORKSPACE (Left Side: 5 Columns) */}
          <div className="lg:col-span-5 space-y-6 print:hidden">
            
            {/* Dynamic Interactive Scenario Customization Prompt */}
            <AnimatePresence>
              {scenarioPrompt && scenarioPrompt.active && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-amber-500/10 border-2 border-dashed border-amber-500 rounded-xl p-4.5 text-xs space-y-3.5 print:hidden shadow-inner overflow-hidden"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0 animate-bounce" />
                    <div className="space-y-1">
                      <p className="font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-widest text-[10px]">
                        Scenario Loaded: "{scenarioPrompt.presetName}"
                      </p>
                      <p className="text-zinc-750 dark:text-zinc-300 leading-relaxed text-[11px]">
                        The scenario parameters have been loaded. Please <strong className="text-emerald-700 dark:text-emerald-400">review / update the "Crop Physiological Target"</strong> highlighted below to fit your microclimate, then click generate.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setScenarioPrompt(null)}
                      className="px-2.5 py-1.5 rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-200 text-[10px] font-bold uppercase transition"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={executeSystemAnalysis}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black uppercase tracking-widest transition shadow-md flex items-center gap-1.5 animate-pulse"
                    >
                      <RefreshCw size={11} className="animate-spin-slow" />
                      Generate Outputs
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Component 1: Crop Target Configurator */}
            <div 
              className={`bg-white dark:bg-zinc-900 rounded-xl border p-5 shadow-sm space-y-4 transition-all duration-300 ${
                scenarioPrompt?.active
                  ? "border-amber-500 ring-2 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.08)] scale-[1.01]"
                  : "border-zinc-200 dark:border-zinc-800"
              }`} 
              id="crop-config-card"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <Sprout className="text-emerald-600" size={18} />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Crop Physiological Target
                </h2>
                {scenarioPrompt?.active && (
                  <span className="ml-auto px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 animate-pulse">
                    Review Required
                  </span>
                )}
              </div>

              {/* Selector to choose preset templates */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                    Select Baseline Crop Template
                  </label>
                  <select
                    value={selectedCropKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCropKey(val);
                      const template = CROP_TEMPLATES[val];
                      setGrowthStage(template.stages[0]);
                      setLocation(template.defaultLocation);
                      setOldReportOutOfSync(true);
                    }}
                    className="w-full text-xs font-semibold p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Object.keys(CROP_TEMPLATES).map((key) => (
                      <option key={key} value={key}>
                        {CROP_TEMPLATES[key].name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Growth Stage selection */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                    Vulnerable Growth Stage
                  </label>
                  <select
                    value={growthStage}
                    onChange={(e) => {
                      setGrowthStage(e.target.value);
                      setOldReportOutOfSync(true);
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CROP_TEMPLATES[selectedCropKey].stages.map((stg) => (
                      <option key={stg} value={stg}>
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location field */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                    Microclimate Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setOldReportOutOfSync(true);
                      }}
                      className="w-full text-xs pl-8 pr-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Latitude: 50.45, Saskatchewan, CA"
                    />
                  </div>
                </div>

                {/* Description of current profile */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-900 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase">[Horticultural Profile]:</span>{" "}
                  {CROP_TEMPLATES[selectedCropKey].description}
                </div>
              </div>
            </div>

            {/* Component 2: 5-Day Meteorological Planner */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4" id="weather-planner-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Compass className="text-emerald-600" size={18} />
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Weather Forecast Editor
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  5-Day Time Series
                </span>
              </div>

              {/* Day Selection Tabs */}
              <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg">
                {weatherForecast.map((pt, idx) => {
                  const isDayActive = idx === activeWeatherDayIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveWeatherDayIndex(idx)}
                      className={`flex-1 text-center py-1.5 px-1 rounded-md text-xs font-bold transition-all ${
                        isDayActive
                          ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                      }`}
                    >
                      D{idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Day settings sliders & manual fields */}
              <div className="bg-zinc-50/70 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-900/60 space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-zinc-750 dark:text-zinc-350">
                    Day {activeWeatherDayIndex + 1} Details
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider">
                    {weatherForecast[activeWeatherDayIndex].date}
                  </span>
                </div>

                {/* Temperature settings dual scale */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="inline-flex items-center gap-1 text-zinc-500">
                      <Thermometer size={14} className="text-red-500" />
                      Temperature Min & Max
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {weatherForecast[activeWeatherDayIndex].tempMin}°C to {weatherForecast[activeWeatherDayIndex].tempMax}°C
                    </span>
                  </div>
                  
                  {/* Min Temp manual slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Min Daily Temperature (Overnight chill)</span>
                      <span>{weatherForecast[activeWeatherDayIndex].tempMin}°C</span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="25"
                      step="0.5"
                      value={weatherForecast[activeWeatherDayIndex].tempMin}
                      onChange={(e) => updateSelectedDayForecast("tempMin", parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-ew-resize h-1 bg-zinc-200 rounded-lg appearance-none dark:bg-zinc-850"
                    />
                  </div>

                  {/* Max Temp manual slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Max Daily Temperature (Midday sun)</span>
                      <span>{weatherForecast[activeWeatherDayIndex].tempMax}°C</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="48"
                      step="0.5"
                      value={weatherForecast[activeWeatherDayIndex].tempMax}
                      onChange={(e) => updateSelectedDayForecast("tempMax", parseFloat(e.target.value))}
                      className="w-full accent-rose-600 cursor-ew-resize h-1 bg-zinc-200 rounded-lg appearance-none dark:bg-zinc-850"
                    />
                  </div>
                </div>

                {/* Rain accumulator */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                  <div className="flex justify-between items-center text-xs">
                    <span className="inline-flex items-center gap-1 text-zinc-500">
                      <Droplets size={14} className="text-sky-500" />
                      Precipitation (mm/day)
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {weatherForecast[activeWeatherDayIndex].precipitation} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="140"
                    step="1"
                    value={weatherForecast[activeWeatherDayIndex].precipitation}
                    onChange={(e) => updateSelectedDayForecast("precipitation", valueAsNum(e.target.value))}
                    className="w-full accent-sky-500 cursor-ew-resize h-1 bg-zinc-200 rounded-lg appearance-none dark:bg-zinc-850"
                  />
                </div>

                {/* Wind velocities */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                  <div className="flex justify-between items-center text-xs">
                    <span className="inline-flex items-center gap-1 text-zinc-500">
                      <Wind size={14} className="text-emerald-500" />
                      Daily Peak Wind Gusts
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {weatherForecast[activeWeatherDayIndex].windSpeed} km/h
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="85"
                    step="1"
                    value={weatherForecast[activeWeatherDayIndex].windSpeed}
                    onChange={(e) => updateSelectedDayForecast("windSpeed", valueAsNum(e.target.value))}
                    className="w-full accent-emerald-500 cursor-ew-resize h-1 bg-zinc-200 rounded-lg appearance-none dark:bg-zinc-850"
                  />
                </div>

                {/* Humidity sliders */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                  <div className="flex justify-between items-center text-xs">
                    <span className="inline-flex items-center gap-1 text-zinc-500">
                      <TrendingDown size={14} className="text-indigo-400" />
                      Relative Humidity %
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {weatherForecast[activeWeatherDayIndex].humidity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={weatherForecast[activeWeatherDayIndex].humidity}
                    onChange={(e) => updateSelectedDayForecast("humidity", valueAsNum(e.target.value))}
                    className="w-full accent-indigo-500 cursor-ew-resize h-1 bg-zinc-200 rounded-lg appearance-none dark:bg-zinc-850"
                  />
                </div>
              </div>

              {/* Master Engage Button */}
              <button
                type="button"
                onClick={executeSystemAnalysis}
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-750 hover:to-emerald-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    Synthesizing Local Risk Matrix...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Execute Climatological Threat Synthesis
                  </>
                )}
              </button>
            </div>

            {/* Secret key settings guidance panel */}
            <div className="bg-zinc-100/90 dark:bg-zinc-900/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-4 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <Info size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold text-zinc-850 dark:text-zinc-300 uppercase tracking-tight">AI Reasoning System Mode</p>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
                    To unlock deep reasoning, you can add your official <strong className="text-zinc-850 dark:text-zinc-100">GEMINI_API_KEY</strong> in the <strong className="text-zinc-850 dark:text-zinc-200">Secrets panel</strong> (Settings icon in bottom/top workspace). The system automatically falls back to an offline rule-based horticultural model if a secret key is not supplied.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* ANALYTICS REPORT STUDIO BOARD (Right Side: 7 Columns) */}
          <div className="lg:col-span-7 space-y-6">

            {/* API / Loading states handler banner */}
            <AnimatePresence mode="popLayout">
              {loading && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 rounded-xl p-6 text-center space-y-3 print:hidden"
                >
                  <RefreshCw className="animate-spin text-emerald-600 block mx-auto stroke-[2.5]" size={36} />
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-wide">Agronomic Evaluation Active</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                      Consulting historical stress limits, stomatal resistance metrics, transpiration rates, and cell freezing limits to construct the mitigation timeline.
                    </p>
                  </div>
                </motion.div>
              )}

              {apiError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 dark:bg-rose-950/20 border border-red-200 dark:border-rose-900/40 rounded-xl p-4 text-xs text-red-700 dark:text-rose-400 flex items-start gap-3 print:hidden"
                >
                  <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Agronomic Evaluation Handshake Error</p>
                    <p className="leading-relaxed">{apiError}</p>
                    <button 
                      onClick={executeSystemAnalysis} 
                      className="mt-2 inline-flex items-center gap-1 font-extrabold underline text-[10px] uppercase tracking-wider"
                    >
                      <RefreshCw size={10} /> Retry Handshake
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dashboard output panel */}
            {analysisResult && !loading && (
              <div className="space-y-6" id="analytical-report-card">
                
                {/* Out of Sync Warning Alert */}
                {oldReportOutOfSync && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-amber-805 dark:text-amber-400"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5 animate-pulse" size={16} />
                      <div>
                        <p className="font-extrabold uppercase tracking-wide text-[10px]">Simulation Parameters Shifted</p>
                        <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed mt-0.5 font-normal">
                          The current report shown below was computed using historical values. Generate a new climatological threat synthesis report to execute on current crop and weather criteria.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={executeSystemAnalysis}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition shrink-0 shadow flex items-center gap-1.5"
                    >
                      <RefreshCw size={11} />
                      Generate Outputs
                    </button>
                  </motion.div>
                )}
                
                {/* 1. Header Risk Assessment Badge & Threat Vector banner */}
                <div 
                  className={`border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    getOverallRiskConfig(analysisResult.overall_risk_level).banner
                  }`}
                  id="risk-banner-widget"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono tracking-widest font-black uppercase text-zinc-500 dark:text-zinc-400">
                      Overall Structural Risk Matrix
                    </p>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h2 className="text-2xl font-black tracking-tight uppercase">
                        {analysisResult.overall_risk_level} LEVEL
                      </h2>
                      <span className="text-xs shrink-0 font-medium opacity-80">
                        ({analysisResult.primary_threat_vector})
                      </span>
                    </div>
                  </div>
                  
                  {/* Visual alert badge */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono uppercase bg-zinc-950/10 dark:bg-white/10 px-2 py-1 rounded text-zinc-500 dark:text-zinc-300 font-bold border border-zinc-500/10">
                      Engine: {analysisResult._engine || "Baseline Engine"}
                    </span>
                    <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                      getOverallRiskConfig(analysisResult.overall_risk_level).badge
                    }`}>
                      {analysisResult.overall_risk_level} THREAT
                    </div>
                  </div>
                </div>

                {/* 2. Bento Card: Summary & Primary Threat info */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5" id="assessment-bento-grid">
                  
                  {/* Summary card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm md:col-span-7 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-mono dark:text-zinc-400 text-zinc-505 uppercase font-bold tracking-widest block mb-1">
                        Executive Agricultural Assessment
                      </span>
                      <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans font-medium">
                        {analysisResult.summary_assessment}
                      </p>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Location Target: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{location}</span>
                    </div>
                  </div>

                  {/* Primary Threat card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm md:col-span-5 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-mono dark:text-zinc-400 text-zinc-550 uppercase font-bold tracking-widest block mb-1">
                        Critical Threat Vector
                      </span>
                      <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase leading-snug">
                        {analysisResult.primary_threat_vector}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                        Evaluated for {isCustomCropMode ? customCropName || "Horticultural Target" : CROP_TEMPLATES[selectedCropKey].name} at {growthStage} stage.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <Sprout size={13} className="shrink-0" />
                      Physiology Shock Monitor Active
                    </span>
                  </div>
                </div>

                {/* 3. Recharts Meteorological Alert Visualizer Chart */}
                <ThresholdChart 
                  weatherData={weatherForecast} 
                  thresholds={getActiveCropThresholds()}
                  cropType={isCustomCropMode ? customCropName || "Selected Crop" : selectedCropKey}
                />

                {/* 4. Stress Breakdown Panels (Thermal, Moisture, Physical) */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown size={14} className="text-zinc-500" />
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
                      Biological Stress Vector Breakdown
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="stress-breakdown-cards">
                    
                    {/* Temperature Stress Card */}
                    <div className={`border rounded-xl p-4.5 shadow-xs flex flex-col justify-between space-y-4 ${
                      getRiskBg(analysisResult.risk_breakdown.temperature_stress.level)
                    }`}>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250 uppercase flex items-center gap-1.5">
                            <Thermometer className="text-rose-500" size={14} />
                            Thermal Stress
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase ${
                            analysisResult.risk_breakdown.temperature_stress.level === "HIGH" 
                              ? "bg-red-100 text-red-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-yellow-950 dark:text-yellow-300"
                          }`}>
                            {analysisResult.risk_breakdown.temperature_stress.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                          {analysisResult.risk_breakdown.temperature_stress.description}
                        </p>
                      </div>
                      
                      {/* Stress Level Meter bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getRiskMeterColor(analysisResult.risk_breakdown.temperature_stress.level)}`}
                            style={{ 
                              width: analysisResult.risk_breakdown.temperature_stress.level === "HIGH" ? "100%" : 
                                     analysisResult.risk_breakdown.temperature_stress.level === "MEDIUM" ? "60%" : "20%" 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Moisture Stress Card */}
                    <div className={`border rounded-xl p-4.5 shadow-xs flex flex-col justify-between space-y-4 ${
                      getRiskBg(analysisResult.risk_breakdown.moisture_stress.level)
                    }`}>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250 uppercase flex items-center gap-1.5">
                            <Droplets className="text-sky-500" size={14} />
                            Moisture Stress
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase ${
                            analysisResult.risk_breakdown.moisture_stress.level === "HIGH" 
                              ? "bg-red-100 text-red-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-yellow-950 dark:text-yellow-300"
                          }`}>
                            {analysisResult.risk_breakdown.moisture_stress.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                          {analysisResult.risk_breakdown.moisture_stress.description}
                        </p>
                      </div>
                      
                      {/* Stress Level Meter bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getRiskMeterColor(analysisResult.risk_breakdown.moisture_stress.level)}`}
                            style={{ 
                              width: analysisResult.risk_breakdown.moisture_stress.level === "HIGH" ? "100%" : 
                                     analysisResult.risk_breakdown.moisture_stress.level === "MEDIUM" ? "60%" : "20%" 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Wind/Storm Physical Damage Card */}
                    <div className={`border rounded-xl p-4.5 shadow-xs flex flex-col justify-between space-y-4 ${
                      getRiskBg(analysisResult.risk_breakdown.physical_stress.level)
                    }`}>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250 uppercase flex items-center gap-1.5">
                            <Wind className="text-emerald-500" size={14} />
                            Physical Load
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase ${
                            analysisResult.risk_breakdown.physical_stress.level === "HIGH" 
                              ? "bg-red-100 text-red-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-yellow-950 dark:text-yellow-300"
                          }`}>
                            {analysisResult.risk_breakdown.physical_stress.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                          {analysisResult.risk_breakdown.physical_stress.description}
                        </p>
                      </div>
                      
                      {/* Stress Level Meter bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getRiskMeterColor(analysisResult.risk_breakdown.physical_stress.level)}`}
                            style={{ 
                              width: analysisResult.risk_breakdown.physical_stress.level === "HIGH" ? "100%" : 
                                     analysisResult.risk_breakdown.physical_stress.level === "MEDIUM" ? "60%" : "20%" 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 5. Core Checklist Timeline Component */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={14} className="text-zinc-500" />
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
                      Actionable Mitigation Sequence Checklist
                    </h3>
                  </div>
                  <MitigationTimeline timeline={analysisResult.actionable_mitigation_timeline} />
                </div>

                {/* 6. Action Utility Bar (JSON Download & PDF report generation) */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl print:hidden">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-800 dark:text-zinc-200">Export Certified Advisory Worksheet</h4>
                    <p className="text-[11px] text-zinc-450 dark:text-zinc-400">Save the analyzed mitigations for off-grid usage or field prints.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={downloadAnalysisJSON}
                      className="bg-white hover:bg-zinc-50 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                    >
                      <Download size={13} />
                      Raw JSON
                    </button>
                    <button
                      type="button"
                      onClick={triggerSystemPrint}
                      className="bg-zinc-900 hover:bg-zinc-950 text-white dark:bg-emerald-600 dark:hover:bg-emerald-650 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                    >
                      <Printer size={13} />
                      Print Advisory
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </main>

      {/* Styled Print Footer */}
      <footer className="hidden print:block text-center text-xs text-zinc-500 font-mono mt-20 pt-10 border-t border-zinc-200">
        <p>Agronomic Climate Mitigations Sheet — Digitally Synced via Local Weather Station Controls</p>
        <p>Current Verification Epoch: 2026-05-28</p>
      </footer>
    </div>
  );
}

// Small helper to safely extract number inputs
function valueAsNum(str: string): number {
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}
