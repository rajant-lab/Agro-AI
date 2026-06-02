import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization helper for GoogleGenAI to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Local High-Fidelity Heuristics Engine (fallback & comparative baseline)
function runLocalAgronomicHeuristics(crop: any, forecast: any[]): any {
  const type = crop.type || "Wheat";
  const stage = crop.growth_stage || "Flowering";
  const location = crop.location || "Saskatchewan, Canada";

  // Critical values extract
  let maxTemp = -999;
  let minTemp = 999;
  let totalRain = 0;
  let maxWind = 0;
  let maxHumidity = 0;

  forecast.forEach(pt => {
    if (pt.tempMax > maxTemp) maxTemp = pt.tempMax;
    if (pt.tempMin < minTemp) minTemp = pt.tempMin;
    totalRain += pt.precipitation || 0;
    if (pt.windSpeed > maxWind) maxWind = pt.windSpeed;
    if (pt.humidity > maxHumidity) maxHumidity = pt.humidity;
  });

  // Default thresholds based on common crop types
  let frostThreshold = 0;
  let heatThreshold = 33;
  let rainThreshold = 50;
  let windThreshold = 35;

  const lowType = type.toLowerCase();
  if (lowType.includes("wheat")) {
    frostThreshold = -1.5;
    heatThreshold = 30.0;
    rainThreshold = 45.0;
    windThreshold = 30.0;
  } else if (lowType.includes("corn") || lowType.includes("maize")) {
    frostThreshold = 0.0;
    heatThreshold = 35.0;
    rainThreshold = 65.0;
    windThreshold = 45.0;
  } else if (lowType.includes("rice")) {
    frostThreshold = 10.0;
    heatThreshold = 36.0;
    rainThreshold = 100.0;
    windThreshold = 38.0;
  } else if (lowType.includes("tomato")) {
    frostThreshold = 1.0;
    heatThreshold = 32.0;
    rainThreshold = 35.0;
    windThreshold = 25.0;
  } else if (lowType.includes("soybean")) {
    frostThreshold = -1.0;
    heatThreshold = 35.0;
    rainThreshold = 55.0;
    windThreshold = 38.0;
  } else if (lowType.includes("mango")) {
    frostThreshold = 4.0;
    heatThreshold = 41.0;
    rainThreshold = 30.0;
    windThreshold = 22.0;
  } else if (lowType.includes("cotton")) {
    frostThreshold = 4.5;
    heatThreshold = 39.0;
    rainThreshold = 75.0;
    windThreshold = 35.0;
  } else if (lowType.includes("chickpea") || lowType.includes("chana") || lowType.includes("gram")) {
    frostThreshold = 2.0;
    heatThreshold = 33.0;
    rainThreshold = 25.0;
    windThreshold = 30.0;
  }

  // Calculate stress outcomes
  let tempStressLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let tempDesc = `Temperatures remain within the safe physiological operating envelope (${minTemp}°C to ${maxTemp}°C).`;
  
  if (minTemp <= frostThreshold) {
    tempStressLevel = "HIGH";
    tempDesc = `Critical exposure: Minimum temperature of ${minTemp}°C dropped below the sensitive frost threshold of ${frostThreshold}°C during ${stage}. This causes freezing cell injury, cellular lysis, or floral sterility in ${type}.`;
  } else if (minTemp <= frostThreshold + 2) {
    tempStressLevel = "MEDIUM";
    tempDesc = `Chilling stress detected: Low temperature of ${minTemp}°C is near the physiological threshold. Development activity will slow down significantly.`;
  } else if (maxTemp >= heatThreshold) {
    tempStressLevel = "HIGH";
    tempDesc = `Thermal shock: Maximum heat index of ${maxTemp}°C exceeds the ideal threshold of ${heatThreshold}°C. This spikes transpirational demand, triggers pollen desiccation, and forces stomatal closure in ${type}.`;
  } else if (maxTemp >= heatThreshold - 2) {
    tempStressLevel = "MEDIUM";
    tempDesc = `Mild thermal stress: Maximum temperature of ${maxTemp}°C will increase daily water demands (evapotranspiration spikes).`;
  }

  let moistureStressLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let moistDesc = `Adequate moisture budget. Cumulative rainfall over the window is ${totalRain.toFixed(1)}mm, sustaining soil tension without root waterlogging.`;

  if (totalRain >= rainThreshold) {
    moistureStressLevel = "HIGH";
    moistDesc = `Excess rain risk: Saturated root zones (${totalRain.toFixed(1)}mm heavy cumulative rainfall) starve soil of oxygen (anoxia). This promotes phytophthora root rot, fruit splitting, or cellular damping-off in ${type} at its current ${stage} stage.`;
  } else if (totalRain >= rainThreshold * 0.6) {
    moistureStressLevel = "MEDIUM";
    moistDesc = `Elevated soil moisture: Rainfall of ${totalRain.toFixed(1)}mm coupled with high humidity (${maxHumidity}%) creates favorable conditions for fungal pathogens (molds/blight). Dry ventilation needed.`;
  } else if (totalRain === 0 && maxTemp > 30) {
    moistureStressLevel = "HIGH";
    moistDesc = `Atmospheric dehydration: Cumulative rainfall is 0.0mm amidst high midday heat. Extreme soil tension will trigger dry leaf wilting or bud abortion unless supplementary irrigation is deployed.`;
  } else if (totalRain < 5 && maxTemp > 28) {
    moistureStressLevel = "MEDIUM";
    moistDesc = `Moderately dry soil dynamic: Monitor transpiration rate closely. Immediate irrigation cycle may be needed soon.`;
  }

  let physicalStressLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let physDesc = `Wind velocity averages ${maxWind} km/h, well below mechanical disruption levels. Plant structural integrity is secure.`;

  if (maxWind >= windThreshold) {
    physicalStressLevel = "HIGH";
    physDesc = `Mechanical wind danger: Wind velocities peaking at ${maxWind} km/h risk canopy collapse (lodging), root buckling, or green snap of heavy fruit stalks in ${type} (${stage}).`;
  } else if (maxWind >= windThreshold * 0.7) {
    physicalStressLevel = "MEDIUM";
    physDesc = `Moderate wind pressure: Air velocity of ${maxWind} km/h may disturb young leaves, cause light soil erosion, or dry out upper leaf canopies quickly.`;
  }

  // Determine overall risk level
  let overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  let highsCount = 0;
  if (tempStressLevel === "HIGH") highsCount++;
  if (moistureStressLevel === "HIGH") highsCount++;
  if (physicalStressLevel === "HIGH") highsCount++;

  if (highsCount >= 2 || (minTemp < frostThreshold - 2) || (totalRain > rainThreshold * 1.5)) {
    overallRisk = "CRITICAL";
  } else if (highsCount === 1) {
    overallRisk = "HIGH";
  } else if (tempStressLevel === "MEDIUM" || moistureStressLevel === "MEDIUM" || physicalStressLevel === "MEDIUM") {
    overallRisk = "MEDIUM";
  }

  // Derive primary threat vector
  let threatVector = "Optimal Climatic Envelope";
  if (minTemp <= frostThreshold) {
    threatVector = `${stage} Frost Injury`;
  } else if (maxTemp >= heatThreshold) {
    threatVector = "Pollen Heat Desiccation";
  } else if (totalRain >= rainThreshold) {
    threatVector = `${stage} Soil Waterlogging`;
  } else if (maxWind >= windThreshold) {
    threatVector = "Canopy Wind Lodging";
  } else if (totalRain === 0 && maxTemp > 30) {
    threatVector = "Acute Transpiration Deficit";
  } else if (overallRisk === "MEDIUM") {
    threatVector = "Atmospheric Disease Pressure";
  }

  // Build Actionable Mitigation Checklist
  const mitigation: any[] = [];

  // Immediate Action (Next 24 Hours)
  if (tempStressLevel === "HIGH" && minTemp <= frostThreshold) {
    mitigation.push({
      timeframe: "Immediate (Next 24 Hours)",
      priority: "HIGH",
      action_title: "Deploy Active Frost Defense Systems",
      rationale: `Sub-zero chilling forecasted (${minTemp}°C) crosses crop threshold (${frostThreshold}°C). Risk of severe head frost damage during ${stage}.`,
      steps: [
        "Ignite localized frost candles or smudge pots to increase near-canopy thermal radiation.",
        "Activate overnight overhead sprinklers to take advantage of the latent heat of fusion as water freezes on leaves.",
        "Secure lightweight frost blankets or row crop covers over micro-plots."
      ]
    });
  } else if (tempStressLevel === "HIGH" && maxTemp >= heatThreshold) {
    mitigation.push({
      timeframe: "Immediate (Next 24 Hours)",
      priority: "HIGH",
      action_title: "Initiate Heat-Dampening Pulse Irrigation",
      rationale: `Extreme temperature spike (${maxTemp}°C) triggers extreme plant transpiration and pollen sterility.`,
      steps: [
        "Pulse overhead sprinklers for 15-minute cycles during peak 12:00-15:00 hours to reduce ambient canopy temperature by 3-5°C.",
        "Increase drip irrigation volumes to offset forecasted evapotranspiration spikes.",
        "Apply solar-reflective kaolin clay spraying on leafy canopy layers if applicable."
      ]
    });
  } else if (moistureStressLevel === "HIGH" && totalRain >= rainThreshold) {
    mitigation.push({
      timeframe: "Immediate (Next 24 Hours)",
      priority: "HIGH",
      action_title: "Clear Basin Sump Outlets & Trenching",
      rationale: `Expected cloudburst of ${totalRain.toFixed(1)}mm threatens to flood soil rootzones and cause root rot (anoxia).`,
      steps: [
        "Clear all drainage ditches, drainage channels, and sediment logs.",
        "Excavate temporary relief drainage channels in soil basins that collect heavy run-off.",
        "De-energize fields if water pump stations are at risk of being submerged."
      ]
    });
  } else if (physicalStressLevel === "HIGH" && maxWind >= windThreshold) {
    mitigation.push({
      timeframe: "Immediate (Next 24 Hours)",
      priority: "HIGH",
      action_title: "Affix Plant Supports & Windbreak Guards",
      rationale: `Sustained high wind of ${maxWind} km/h will trigger catastrophic stem snap or canopy lodging in mature plants.`,
      steps: [
        "Tighten tomato trellises, stakes, and horizontal wire bounds.",
        "Install temporary shelter perimeter banners on the windward side of high-value acreage.",
        "Avoid any spray treatments or nitrogen fertilization that lowers stem lignification right before maximum wind."
      ]
    });
  } else {
    mitigation.push({
      timeframe: "Immediate (Next 24 Hours)",
      priority: "LOW",
      action_title: "Standard Soil Nutrient Monitoring",
      rationale: "Favorable forecast matches ideal growing parameters. Nutrient balance is our priority.",
      steps: [
        "Perform routine visual tissue checks across quadrants.",
        "Optimize slow-release fertigation programs to feed growth."
      ]
    });
  }

  // Short-term (48-72 Hours)
  if (totalRain > rainThreshold * 0.4 || maxHumidity > 85) {
    mitigation.push({
      timeframe: "Short-term (48-72 Hours)",
      priority: "MEDIUM",
      action_title: "Preemptive Fungal Spore Defense",
      rationale: `Moist canopy atmosphere and lingering wetness (Humidity ${maxHumidity}%) create ideal spore germination habitats.`,
      steps: [
        "Apply organic copper-based fungicides or biocontrol agents preemptively.",
        "Prune lower canopy suckers to facilitate high cross-ventilation flow.",
        "Halt any overhead irrigation until canopy leaves dry out completely."
      ]
    });
  } else if (totalRain === 0 && maxTemp > 30) {
    mitigation.push({
      timeframe: "Short-term (48-72 Hours)",
      priority: "HIGH",
      action_title: "Maximize Soil Moisture Retention",
      rationale: "Dry spell under extreme heat will induce stomatal shutdown and stop nutrient transport.",
      steps: [
        "Apply straw mulching or organic litter covering around the plant base to seal ground moisture.",
        "Verify drip irrigation pressures and fix leak spots.",
        "Apply organic seaweed kelp extract to elicit biochemical drought coping responses."
      ]
    });
  } else {
    mitigation.push({
      timeframe: "Short-term (48-72 Hours)",
      priority: "LOW",
      action_title: "Inter-row Soil Aeration",
      rationale: "Ensuring steady root soil structure with dry conditions.",
      steps: [
        "Run minimal hand-cultivators on shallow crust blocks.",
        "Uproot early visual weeds stealing space and moisture."
      ]
    });
  }

  // Monitoring Phase
  mitigation.push({
    timeframe: "Monitoring Phase",
    priority: "MEDIUM",
    action_title: "Post-Weather Physiological Recovery Auditing",
    rationale: "Evaluating structural and microbial post-event symptoms is vital to save remaining harvest potential.",
    steps: [
      "Inspect roots for early discoloration or sulfur-odor (signs of early anoxia root damage).",
      "Survey flower ovaries for necrosis or failure of pollen tube development.",
      "Document wind lodging angles; flag sections requiring physical crane stringing or immediate triage harvest."
    ]
  });

  return {
    summary_assessment: `${type} crops in ${location} currently at the highly vulnerable ${stage} growth stage face an overall ${overallRisk} stress concern. Our agro-meteorological forecast gauges primary vulnerability through ${threatVector}, which can heavily depress yield metrics if unmanaged.`,
    overall_risk_level: overallRisk,
    primary_threat_vector: threatVector,
    risk_breakdown: {
      temperature_stress: { level: tempStressLevel, description: tempDesc },
      moisture_stress: { level: moistureStressLevel, description: moistDesc },
      physical_stress: { level: physicalStressLevel, description: physDesc }
    },
    actionable_mitigation_timeline: mitigation
  };
}

// API endpoint for analysis
app.post("/api/analyze-crop", async (req, res) => {
  const { crop_metadata, weather_forecast } = req.body;

  if (!crop_metadata || !weather_forecast || !Array.isArray(weather_forecast)) {
    return res.status(400).json({ 
      error: "Malformed request. Make sure both crop_metadata and a weather_forecast array are passed." 
    });
  }

  const aiClient = getGeminiClient();

  if (!aiClient) {
    console.log("No valid GEMINI_API_KEY detected. Running high-precision localized Agronomic Heuristics Engine.");
    const heuristicResponse = runLocalAgronomicHeuristics(crop_metadata, weather_forecast);
    // Include engine notice in the response header metadata for client transparency
    return res.json({
      ...heuristicResponse,
      _engine: "Local Horticultural Rules Engine"
    });
  }

  try {
    const { type, growth_stage, location } = crop_metadata;

    const systemInstruction = `You are an elite, highly credentialed Agronomic AI Agent and Senior Agro-Meteorologist specializing in food security, climate adaptation, and crop physiology.
Your primary directive is to run structural and scientific evaluations of daily meteorological forecasts against specific crop thresholds to produce a highly localized risk and mitigation matrix.

### Evaluation Criteria (Crop Physiology & Thresholds Guide):
- Wheat: Cold sensitive during flowering/anthesis (frost below -1.5°C risks head sterility and devastating losses). Extreme heat (>30°C) during grain filling halts development. Excessive waterlogging (heavy rains) causes rot or fungal growth.
- Corn/Maize: High temperatures (>35°C) during Pollination/Silking dries up pollen, causing poor seed/kernel set. Tall stalks face major green snap/lodging threats from wind speed/gusts (>45 km/h).
- Rice: Extremely cold-sensitive (below 10°C is highly damaging). Heat spikes above 36°C trigger spikelet sterility. Excessive water submergence during late growth ruins quality; high wind (>40 km/h) yields structural canopy collapse (lodging).
- Tomatoes: Warm season crop. Frost at 1°C kills vines instantly. Elevated heat (>32°C) causes blossom drop and fruit cracking. Heavy rain (>40mm) creates root rot and splits ripening skins. Extreme humidity (90%+) triggers blight mold warnings.
- Mangoes (Alphonso / Hapus): Highly vulnerable to unseasonal pre-monsoon rains (>30mm) during flowering or early fruiting, which trigger high localized humidity and devastate panicles with Anthracnose disease and mildew. Wind gusts exceeding 22 km/h during sizing cause severe fruit drop. Heat stress (>41°C) can cause sunburn or spongy tissue in the mature pulp.
- Cotton: Highly susceptible to root waterlogging/anaerobic soil conditions from monsoon downpours (>75mm), delaying squaring and inviting wilt. Sensitive to severe heat spikes (>39°C) combined with dry winds, causing square/boll shedding.
- Chickpeas (Chana / Gram): Winter pulse crop. Sensitive to mid-winter radiative frosts (temperatures under 2.0°C) which kill flowers and stunt pod-filling. Sudden winter showers (>25mm) spike moisture tension and propagate Ascochyta blight epidemics.
- Other crops: Model physiological responses dynamically for frost injury, acute dehydration/transpiration from dry winds, saturated soil conditions (anoxia), and severe storm physical lodging.

Assess each day of the meteorological forecast precisely. Detect critical thresholds.
Define the output risk level as: LOW, MEDIUM, HIGH, or CRITICAL overall risk. CRITICAL indicates immediate crop failure if no protective actions are taken.`;

    const requestPrompt = `You must yield your analysis strictly according to the specified JSON schema structure. No markdown formatting, backticks, or preamble text.

Crop Input Data:
Crop Type: ${type}
Current Stage: ${growth_stage}
Location: ${location}

Weather Forecast Input Data:
${JSON.stringify(weather_forecast, null, 2)}

Provide strict scientific assessments, risk levels, and custom physical/horticultural mitigation step-by-step checklists.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: requestPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary_assessment: {
              type: Type.STRING,
              description: "A concise, executive summary (2-3 sentences) of the overall threat level to food security or yield in this localized area over the forecast window."
            },
            overall_risk_level: {
              type: Type.STRING,
              description: "The calculated risk level based on weather severity and growth stage sensitivity. Must be one of: LOW, MEDIUM, HIGH, CRITICAL."
            },
            primary_threat_vector: {
              type: Type.STRING,
              description: "A 3-5 word name of the primary threat (e.g., Early Stage Root Rot, Flowering Frost Shock)."
            },
            risk_breakdown: {
              type: Type.OBJECT,
              properties: {
                temperature_stress: {
                  type: Type.OBJECT,
                  properties: {
                    level: { type: Type.STRING, description: "LOW, MEDIUM, or HIGH" },
                    description: { type: Type.STRING, description: "Detailed scientific analysis of temperature impact on the specific crop growth stage." }
                  },
                  required: ["level", "description"]
                },
                moisture_stress: {
                  type: Type.OBJECT,
                  properties: {
                    level: { type: Type.STRING, description: "LOW, MEDIUM, or HIGH" },
                    description: { type: Type.STRING, description: "Detailed scientific analysis of humidity, precipitation, wetness, or saturation risk on the crop/roots." }
                  },
                  required: ["level", "description"]
                },
                physical_stress: {
                  type: Type.OBJECT,
                  properties: {
                    level: { type: Type.STRING, description: "LOW, MEDIUM, or HIGH" },
                    description: { type: Type.STRING, description: "Detailed scientific analysis of wind mechanical damage, plant snap, lodging, or lodging threat from storm." }
                  },
                  required: ["level", "description"]
                }
              },
              required: ["temperature_stress", "moisture_stress", "physical_stress"]
            },
            actionable_mitigation_timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeframe: {
                    type: Type.STRING,
                    description: "Must be exactly 'Immediate (Next 24 Hours)', 'Short-term (48-72 Hours)', or 'Monitoring Phase'."
                  },
                  priority: {
                    type: Type.STRING,
                    description: "HIGH, MEDIUM, or LOW"
                  },
                  action_title: {
                    type: Type.STRING,
                    description: "The clear imperative action title for the farmer."
                  },
                  rationale: {
                    type: Type.STRING,
                    description: "Detailed description of why this action is required, referencing specific forecast data matched against crop physiology."
                  },
                  steps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Concrete step-by-step instructions to execute the mitigation."
                  }
                },
                required: ["timeframe", "priority", "action_title", "rationale", "steps"]
              }
            }
          },
          required: [
            "summary_assessment",
            "overall_risk_level",
            "primary_threat_vector",
            "risk_breakdown",
            "actionable_mitigation_timeline"
          ]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No textual analysis response returned from Gemini API");
    }

    const parsedJson = JSON.parse(textOutput.trim());
    res.json({
      ...parsedJson,
      _engine: "Gemini 3.5 AI Engine"
    });
  } catch (err: any) {
    console.error("Gemini model execution error, falling back dynamically:", err);
    // High-fidelity fallback on error to prevent broken front-end experience
    const heuristicResponse = runLocalAgronomicHeuristics(crop_metadata, weather_forecast);
    res.json({
      ...heuristicResponse,
      _engine: "Local Horticultural Rules Engine (AI Fallback Active)",
      _error: err?.message || "Gemini model error"
    });
  }
});

// Configure Vite integration inside custom server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring development environment via Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuring production environment folder serving...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Agronomic Agent online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
