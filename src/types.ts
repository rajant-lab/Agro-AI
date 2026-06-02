export interface CropMetadata {
  type: string;
  growth_stage: string;
  location: string;
}

export interface WeatherDataPoint {
  date: string;
  temp: number;       // Average of the day
  tempMax: number;    // Maximum temperature
  tempMin: number;    // Minimum temperature
  precipitation: number; // Rain accumulation in mm
  windSpeed: number;  // Average wind speed in km/h
  humidity: number;   // Relative humidity %
}

export interface RiskLevelObj {
  level: "LOW" | "MEDIUM" | "HIGH";
  description: string;
}

export interface RiskBreakdown {
  temperature_stress: RiskLevelObj;
  moisture_stress: RiskLevelObj;
  physical_stress: RiskLevelObj;
}

export interface MitigationStep {
  timeframe: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  action_title: string;
  rationale: string;
  steps: string[];
}

export interface AnalysisResponse {
  summary_assessment: string;
  overall_risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  primary_threat_vector: string;
  risk_breakdown: RiskBreakdown;
  actionable_mitigation_timeline: MitigationStep[];
}

export interface CropThresholds {
  frostTemp: number;
  heatTemp: number;
  rainThreshold: number;
  windThreshold: number;
}
