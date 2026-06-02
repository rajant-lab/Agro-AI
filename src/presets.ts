import { CropMetadata, WeatherDataPoint, CropThresholds } from "./types";

export interface CropTemplate {
  name: string;
  stages: string[];
  thresholds: CropThresholds;
  description: string;
  defaultLocation: string;
}

export const CROP_TEMPLATES: Record<string, CropTemplate> = {
  Wheat: {
    name: "Wheat (Triticum aestivum)",
    stages: ["Germination & Emergence", "Tillering", "Stem Elongation", "Flowering (Anthesis)", "Grain Filling", "Maturity & Harvest"],
    thresholds: {
      frostTemp: -1.5,
      heatTemp: 30.0,
      rainThreshold: 50.0,
      windThreshold: 30.0
    },
    description: "Highly sensitive to spring frost during anthesis (causes visual head damage and sterility) and hot, dry winds speed-ripening grains.",
    defaultLocation: "Saskatchewan, Canada"
  },
  Corn: {
    name: "Corn / Maize (Zea mays)",
    stages: ["Vegetative (V1-V18)", "Tasseling (VT)", "Silking & Pollination (R1)", "Milking & Doughing (R2-R4)", "Dent Stage (R5)", "Physiological Maturity (R6)"],
    thresholds: {
      frostTemp: 0.0,
      heatTemp: 35.0,
      rainThreshold: 65.0,
      windThreshold: 45.0
    },
    description: "Extremely sensitive to heatwaves during silking (desiccates silks, renders pollen infertile). Yield snaps occur under heavy storm lodging.",
    defaultLocation: "Iowa Corn Belt, USA"
  },
  Rice: {
    name: "Rice (Oryza sativa)",
    stages: ["Seedling Emergence", "Tillering Phase", "Panicle Initiation", "Flowering & Milk Stage", "Dough Stage", "Physiological Ripening"],
    thresholds: {
      frostTemp: 10.0, // High temperature crop, chiling injury below 10C
      heatTemp: 36.0,
      rainThreshold: 110.0,
      windThreshold: 40.0
    },
    description: "Demands continuous shallow warmth; sensitive to chilling shocks under 10°C. Heavy winds right before harvest trigger lodging (crop falling into mud).",
    defaultLocation: "Mekong Delta, Vietnam"
  },
  Tomatoes: {
    name: "Horticultural Tomatoes (Solanum lycopersicum)",
    stages: ["Transplant Recovery", "Vegetative Growth", "Flower Bud Initiation", "Flowering & Fruit Set", "Green Fruit Sizing", "Red Fruit Ripening & Harvest"],
    thresholds: {
      frostTemp: 1.0,  // Vine damage
      heatTemp: 32.0,
      rainThreshold: 40.0,
      windThreshold: 25.0
    },
    description: "Vulnerable to frost. Temperatures over 32°C split flowers. Saturated rootzones lead to immediate oxygen starvation (anoxia), root rot, and split fruits.",
    defaultLocation: "Central Valley, California, USA"
  },
  Soybeans: {
    name: "Soybeans (Glycine max)",
    stages: ["Emergence & Unifoliate (VE-VC)", "Vigorous Vegetative (V1-V5)", "Flowering (R1-R2)", "Pod Development (R3-R4)", "Seed Filling (R5-R6)", "Harvest Readiness (R7-R8)"],
    thresholds: {
      frostTemp: -1.0,
      heatTemp: 35.0,
      rainThreshold: 60.0,
      windThreshold: 38.0
    },
    description: "Relatively hardy, but frost kills cotyledons in early stages and excessive heat during flowering triggers rapid flower abortion.",
    defaultLocation: "Mato Grosso, Brazil"
  },
  Mangoes: {
    name: "Mangoes (Alphonso / Hapus)",
    stages: ["Flowering & Panicle Initiation", "Fruit Set & Pea Stage", "Fruit Development (Marble Stage)", "Maturity & Pre-Harvest Ripening"],
    thresholds: {
      frostTemp: 4.0,  // Severe vegetative chill injury
      heatTemp: 41.0,  // Extreme sunburn & spongy tissue
      rainThreshold: 30.0,  // Off-season showers rot blossoms
      windThreshold: 22.0   // Extreme mechanical fruit drop
    },
    description: "Highly sensitive to unseasonal pre-monsoon rainfall (causes devastating powdery mildew and anthracnose rot) and heavy storms causing major fruit-drop.",
    defaultLocation: "Ratnagiri, Maharashtra, India"
  },
  Cotton: {
    name: "Cotton (Gossypium hirsutum)",
    stages: ["Seedling Emergence", "Squaring (Bud Formation)", "Flowering & Boll Development", "Boll Opening & Harvest Ready"],
    thresholds: {
      frostTemp: 4.5,
      heatTemp: 39.0,
      rainThreshold: 75.0,
      windThreshold: 35.0
    },
    description: "Vulnerable to high waterlogging / stagnation which delays squaring, and dry winds which stress buds causing square shedding.",
    defaultLocation: "Yavatmal, Nagpur, India"
  },
  Chickpeas: {
    name: "Chickpeas (Cicer arietinum)",
    stages: ["Germination & Emergence", "Vegetative Growth", "Flowering (Anthesis)", "Pod Initiation & Filling", "Maturity & Dry Harvest"],
    thresholds: {
      frostTemp: 2.0,  // Sensitive to radiation frost pockets
      heatTemp: 33.0,  // High temperature pod sterility
      rainThreshold: 25.0,  // Winter rains trigger Ascochyta blight plagues
      windThreshold: 30.0
    },
    description: "Vulnerable to sudden ground-level radiation frosts in Central India and unseasonal showers that raise blight disease pressure.",
    defaultLocation: "Indore, Madhya Pradesh, India"
  }
};

export interface ScenarioPreset {
  id: string;
  name: string;
  subtitle: string;
  cropType: string;
  growthStage: string;
  defaultLocation: string;
  weatherForecast: WeatherDataPoint[];
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "mango_storm",
    name: "Konkan Pre-Monsoon Storm",
    subtitle: "Sudden strong winds and pre-monsoon convective rainfall crashing mature alphonso mangoes.",
    cropType: "Mangoes",
    growthStage: "Fruit Set & Pea Stage",
    defaultLocation: "Ratnagiri, Maharashtra, India",
    weatherForecast: [
      { date: "Day 1 (May 28)", temp: 31, tempMax: 35, tempMin: 27, precipitation: 0, windSpeed: 12, humidity: 72 },
      { date: "Day 2 (May 29)", temp: 29, tempMax: 33, tempMin: 25, precipitation: 18, windSpeed: 28, humidity: 85 },
      { date: "Day 3 (May 30)", temp: 26, tempMax: 28, tempMin: 23, precipitation: 52, windSpeed: 38, humidity: 96 },
      { date: "Day 4 (May 31)", temp: 28, tempMax: 32, tempMin: 24, precipitation: 15, windSpeed: 24, humidity: 89 },
      { date: "Day 5 (Jun 01)", temp: 30, tempMax: 34, tempMin: 26, precipitation: 3, windSpeed: 15, humidity: 78 }
    ]
  },
  {
    id: "chana_frost",
    name: "Madhya Pradesh Radiation Frost",
    subtitle: "A sudden high-pressure cold wave setting freezing dew on winter gram fields.",
    cropType: "Chickpeas",
    growthStage: "Pod Initiation & Filling",
    defaultLocation: "Indore, Madhya Pradesh, India",
    weatherForecast: [
      { date: "Day 1 (Jan 10)", temp: 15, tempMax: 23, tempMin: 8, precipitation: 0, windSpeed: 7, humidity: 45 },
      { date: "Day 2 (Jan 11)", temp: 11, tempMax: 18, tempMin: 3.5, precipitation: 0, windSpeed: 9, humidity: 55 },
      { date: "Day 3 (Jan 12)", temp: 6, tempMax: 11, tempMin: 1.2, precipitation: 0, windSpeed: 5, humidity: 68 },
      { date: "Day 4 (Jan 13)", temp: 9, tempMax: 14, tempMin: 2.8, precipitation: 0, windSpeed: 8, humidity: 60 },
      { date: "Day 5 (Jan 14)", temp: 14, tempMax: 20, tempMin: 6, precipitation: 0, windSpeed: 10, humidity: 52 }
    ]
  },
  {
    id: "cotton_deluge",
    name: "Deccan Cotton Waterlogging",
    subtitle: "Intense monsoon low-pressure trough triggering deep rootzone anoxia and square shedding.",
    cropType: "Cotton",
    growthStage: "Flowering & Boll Development",
    defaultLocation: "Yavatmal, Maharashtra, India",
    weatherForecast: [
      { date: "Day 1 (Aug 15)", temp: 27, tempMax: 31, tempMin: 23, precipitation: 12, windSpeed: 14, humidity: 85 },
      { date: "Day 2 (Aug 16)", temp: 24, tempMax: 27, tempMin: 22, precipitation: 85, windSpeed: 25, humidity: 98 },
      { date: "Day 3 (Aug 17)", temp: 23, tempMax: 25, tempMin: 21, precipitation: 110, windSpeed: 21, humidity: 99 },
      { date: "Day 4 (Aug 18)", temp: 25, tempMax: 28, tempMin: 22, precipitation: 35, windSpeed: 16, humidity: 92 },
      { date: "Day 5 (Aug 19)", temp: 27, tempMax: 30, tempMin: 23, precipitation: 10, windSpeed: 11, humidity: 82 }
    ]
  },
  {
    id: "wheat_frost",
    name: "Spring Flowering Frost Shock",
    subtitle: "Late-spring chilling spell hitting cold-vulnerable anthesis flowering.",
    cropType: "Wheat",
    growthStage: "Flowering (Anthesis)",
    defaultLocation: "Saskatchewan, Canada",
    weatherForecast: [
      { date: "Day 1 (May 28)", temp: 12, tempMax: 16, tempMin: 6, precipitation: 0, windSpeed: 15, humidity: 60 },
      { date: "Day 2 (May 29)", temp: 8, tempMax: 11, tempMin: 3, precipitation: 4, windSpeed: 22, humidity: 75 },
      { date: "Day 3 (May 30)", temp: 1, tempMax: 4, tempMin: -2.5, precipitation: 1, windSpeed: 10, humidity: 85 },
      { date: "Day 4 (May 31)", temp: 2, tempMax: 5, tempMin: -1.8, precipitation: 0, windSpeed: 8, humidity: 90 },
      { date: "Day 5 (Jun 01)", temp: 7, tempMax: 12, tempMin: 2, precipitation: 0, windSpeed: 12, humidity: 70 }
    ]
  },
  {
    id: "corn_heat",
    name: "Mid-Summer Silking Heatwave",
    subtitle: "Oppressive triple-digit atmospheric pressure blocking kernel setting.",
    cropType: "Corn",
    growthStage: "Silking & Pollination (R1)",
    defaultLocation: "Iowa Corn Belt, USA",
    weatherForecast: [
      { date: "Day 1 (Jul 15)", temp: 28, tempMax: 33, tempMin: 20, precipitation: 0, windSpeed: 10, humidity: 82 },
      { date: "Day 2 (Jul 16)", temp: 32, tempMax: 37, tempMin: 23, precipitation: 0, windSpeed: 8, humidity: 88 },
      { date: "Day 3 (Jul 17)", temp: 34, tempMax: 39.5, tempMin: 25, precipitation: 0, windSpeed: 5, humidity: 90 },
      { date: "Day 4 (Jul 18)", temp: 33, tempMax: 38, tempMin: 24, precipitation: 0, windSpeed: 6, humidity: 85 },
      { date: "Day 5 (Jul 19)", temp: 31, tempMax: 35, tempMin: 22, precipitation: 12, windSpeed: 18, humidity: 75 }
    ]
  },
  {
    id: "tomato_torrent",
    name: "Heavy Torrent Soil Saturation",
    subtitle: "High precipitation deluge choking roots and splitting maturing crops.",
    cropType: "Tomatoes",
    growthStage: "Red Fruit Ripening & Harvest",
    defaultLocation: "Sacramento Valley, California",
    weatherForecast: [
      { date: "Day 1 (Aug 10)", temp: 25, tempMax: 30, tempMin: 18, precipitation: 2, windSpeed: 15, humidity: 70 },
      { date: "Day 2 (Aug 11)", temp: 21, tempMax: 24, tempMin: 16, precipitation: 65, windSpeed: 28, humidity: 98 },
      { date: "Day 3 (Aug 12)", temp: 19, tempMax: 22, tempMin: 15, precipitation: 35, windSpeed: 20, humidity: 95 },
      { date: "Day 4 (Aug 13)", temp: 22, tempMax: 26, tempMin: 16, precipitation: 8, windSpeed: 12, humidity: 85 },
      { date: "Day 5 (Aug 14)", temp: 24, tempMax: 29, tempMin: 17, precipitation: 0, windSpeed: 10, humidity: 75 }
    ]
  },
  {
    id: "rice_typhoon",
    name: "Canopy Collapse Storm Winds",
    subtitle: "High-gust storm fronts pushing mature rice stalks into severe lodging.",
    cropType: "Rice",
    growthStage: "Physiological Ripening",
    defaultLocation: "An Giang Province, Vietnam",
    weatherForecast: [
      { date: "Day 1 (Oct 02)", temp: 27, tempMax: 31, tempMin: 24, precipitation: 10, windSpeed: 12, humidity: 85 },
      { date: "Day 2 (Oct 03)", temp: 25, tempMax: 28, tempMin: 23, precipitation: 45, windSpeed: 25, humidity: 90 },
      { date: "Day 3 (Oct 04)", temp: 23, tempMax: 25, tempMin: 22, precipitation: 80, windSpeed: 52, humidity: 95 },
      { date: "Day 4 (Oct 05)", temp: 24, tempMax: 27, tempMin: 23, precipitation: 50, windSpeed: 38, humidity: 92 },
      { date: "Day 5 (Oct 06)", temp: 27, tempMax: 30, tempMin: 24, precipitation: 15, windSpeed: 15, humidity: 85 }
    ]
  },
  {
    id: "soybeans_optimal",
    name: "Perfect Horticultural Climate",
    subtitle: "Mild temperatures and uniform showers supporting maximum physiological yield.",
    cropType: "Soybeans",
    growthStage: "Pod Development (R3-R4)",
    defaultLocation: "Sorriso, Mato Grosso, Brazil",
    weatherForecast: [
      { date: "Day 1 (Feb 12)", temp: 24, tempMax: 28, tempMin: 19, precipitation: 4, windSpeed: 12, humidity: 65 },
      { date: "Day 2 (Feb 13)", temp: 25, tempMax: 29, tempMin: 20, precipitation: 2, windSpeed: 10, humidity: 62 },
      { date: "Day 3 (Feb 14)", temp: 26, tempMax: 30, tempMin: 21, precipitation: 0, windSpeed: 8, humidity: 58 },
      { date: "Day 4 (Feb 15)", temp: 24, tempMax: 28, tempMin: 19, precipitation: 5, windSpeed: 14, humidity: 70 },
      { date: "Day 5 (Feb 16)", temp: 25, tempMax: 29, tempMin: 20, precipitation: 1, windSpeed: 11, humidity: 64 }
    ]
  }
];
