/**
 * SmartFarm AI - Client-side Field Agronomic Suitability Evaluator
 * Grounded in verified TNAU (Tamil Nadu Agricultural University) & ICAR agronomic standards.
 * Pure deterministic client-side implementation matching backend/services/field_evaluator.py.
 */

export const VERIFIED_CROP_REQUIREMENTS = {
  Brinjal: {
    crop_name_en: "Brinjal",
    crop_name_ta: "கத்தரிக்காய்",
    npk_unit: "kg/ha",
    ph: {
      optimal_min: 6.0,
      optimal_max: 7.0,
      tolerable_min: 5.5,
      tolerable_max: 7.5,
      desc: "6.0 – 7.0 (slightly acidic to neutral)"
    },
    water_capacity: {
      optimal_min: 60.0,
      optimal_max: 80.0,
      tolerable_min: 50.0,
      tolerable_max: 85.0,
      desc: "60% – 80% available root-zone moisture"
    },
    nitrogen: {
      optimal_min: 70,
      optimal_max: 130,
      tolerable_min: 55,
      tolerable_max: 160,
      recommended: 100,
      desc: "70 – 130 kg/ha (TNAU recommended basal + split: 100 kg/ha)"
    },
    phosphorus: {
      optimal_min: 30,
      optimal_max: 70,
      tolerable_min: 20,
      tolerable_max: 90,
      recommended: 50,
      desc: "30 – 70 kg/ha (TNAU recommended: 50 kg/ha)"
    },
    potassium: {
      optimal_min: 30,
      optimal_max: 70,
      tolerable_min: 20,
      tolerable_max: 90,
      recommended: 50,
      desc: "30 – 70 kg/ha (TNAU recommended: 50 kg/ha)"
    },
    soil_types: {
      good: ["Loamy", "Red Loamy", "Sandy Loam", "Alluvial", "Clay Loam"],
      borderline: ["Black Cotton", "Black Soil"],
      poor: ["Clay", "Heavy Clay", "Sandy", "Gravelly"]
    },
    irrigation_methods: {
      good: ["Drip", "Sprinkler"],
      borderline: ["Flood", "Furrow"],
      poor: ["Rain-fed"]
    },
    seasons: {
      good: ["Kharif", "Rabi", "Zaid / Summer", "Zaid", "Summer"],
      borderline: [],
      poor: []
    }
  },
  Tomato: {
    crop_name_en: "Tomato",
    crop_name_ta: "தக்காளி",
    npk_unit: "kg/ha",
    ph: {
      optimal_min: 6.0,
      optimal_max: 6.8,
      tolerable_min: 5.5,
      tolerable_max: 7.2,
      desc: "6.0 – 6.8 (TNAU standard; pH > 7.2 induces iron chlorosis and blossom end rot)"
    },
    water_capacity: {
      optimal_min: 60.0,
      optimal_max: 75.0,
      tolerable_min: 50.0,
      tolerable_max: 80.0,
      desc: "60% – 75% root-zone moisture"
    },
    nitrogen: {
      optimal_min: 70,
      optimal_max: 130,
      tolerable_min: 55,
      tolerable_max: 160,
      recommended: 100,
      desc: "70 – 130 kg/ha (TNAU recommended: 100 kg/ha)"
    },
    phosphorus: {
      optimal_min: 30,
      optimal_max: 70,
      tolerable_min: 20,
      tolerable_max: 90,
      recommended: 50,
      desc: "30 – 70 kg/ha (TNAU recommended: 50 kg/ha)"
    },
    potassium: {
      optimal_min: 35,
      optimal_max: 80,
      tolerable_min: 25,
      tolerable_max: 100,
      recommended: 50,
      desc: "35 – 80 kg/ha (Tomatoes require adequate potassium for firm fruit walls)"
    },
    soil_types: {
      good: ["Red Loamy", "Loamy", "Sandy Loam", "Alluvial"],
      borderline: ["Clay Loam", "Black Soil", "Black Cotton"],
      poor: ["Clay", "Heavy Clay", "Sandy", "Gravelly"]
    },
    irrigation_methods: {
      good: ["Drip"],
      borderline: ["Flood", "Furrow"],
      poor: ["Sprinkler", "Rain-fed"]
    },
    seasons: {
      good: ["Rabi", "Kharif"],
      borderline: ["Zaid / Summer", "Zaid", "Summer"],
      poor: []
    }
  },
  Potato: {
    crop_name_en: "Potato",
    crop_name_ta: "உருளைக்கிழங்கு",
    npk_unit: "kg/ha",
    ph: {
      optimal_min: 5.0,
      optimal_max: 6.5,
      tolerable_min: 4.8,
      tolerable_max: 6.8,
      desc: "5.0 – 6.5 (CPRI/TNAU standard; pH > 6.8 induces Common Scab Streptomyces)"
    },
    water_capacity: {
      optimal_min: 65.0,
      optimal_max: 80.0,
      tolerable_min: 55.0,
      tolerable_max: 85.0,
      desc: "65% – 80% consistent moisture without saturation"
    },
    nitrogen: {
      optimal_min: 90,
      optimal_max: 150,
      tolerable_min: 70,
      tolerable_max: 180,
      recommended: 120,
      desc: "90 – 150 kg/ha (CPRI recommended: 120 kg/ha; excess N delays tuber bulking)"
    },
    phosphorus: {
      optimal_min: 80,
      optimal_max: 150,
      tolerable_min: 55,
      tolerable_max: 180,
      recommended: 120,
      desc: "80 – 150 kg/ha (Potato has high phosphorus demand for stolon and tuber initiation)"
    },
    potassium: {
      optimal_min: 80,
      optimal_max: 150,
      tolerable_min: 60,
      tolerable_max: 180,
      recommended: 120,
      desc: "80 – 150 kg/ha (Critical for tuber starch synthesis and disease resistance)"
    },
    soil_types: {
      good: ["Sandy Loam", "Loamy", "Alluvial"],
      borderline: ["Red Loamy"],
      poor: ["Clay", "Heavy Clay", "Black Cotton", "Black Soil", "Sandy", "Gravelly"]
    },
    irrigation_methods: {
      good: ["Furrow", "Drip"],
      borderline: ["Flood"],
      poor: ["Sprinkler", "Rain-fed"]
    },
    seasons: {
      good: ["Rabi"],
      borderline: ["Kharif"],
      poor: ["Zaid / Summer", "Zaid", "Summer"]
    }
  }
};

/**
 * Extracts numeric float percentage from numbers or strings like '72%', '72', or numeric 0.
 * IMPORTANT: 0 is a valid number and must return 0!
 */
export function parseWaterPercentage(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const s = String(value).trim();
  if (s === '') return null;
  const match = s.match(/[-+]?\d*\.?\d+/);
  if (match) {
    const val = parseFloat(match[0]);
    return Number.isFinite(val) ? val : null;
  }
  return null;
}

/**
 * Validates field inputs before evaluation.
 * Returns { isValid, errorEn, errorTa }.
 */
export function validateFieldInputs(fieldData) {
  if (!fieldData || typeof fieldData !== 'object') {
    return {
      isValid: false,
      errorEn: "Invalid field profile format.",
      errorTa: "தவறான நில விவர வடிவம்."
    };
  }

  const crop = fieldData.crop_type;
  if (!crop || !String(crop).trim()) {
    return {
      isValid: false,
      errorEn: "Please select a crop type before evaluating field suitability.",
      errorTa: "மதிப்பீடு செய்ய பயிர் வகையைத் தேர்ந்தெடுக்கவும்."
    };
  }

  // Soil pH validation
  const rawPh = fieldData.soil_ph;
  if (rawPh === null || rawPh === undefined || String(rawPh).trim() === "") {
    return {
      isValid: false,
      errorEn: "Please enter soil pH before evaluating field suitability.",
      errorTa: "மதிப்பீடு செய்ய மண்ணின் pH அளவை உள்ளிடவும்."
    };
  }
  const ph = parseFloat(rawPh);
  if (!Number.isFinite(ph)) {
    return {
      isValid: false,
      errorEn: "Soil pH must be a valid numeric value.",
      errorTa: "மண் pH சரியான எண்ணாக இருக்க வேண்டும்."
    };
  }
  if (ph < 3.0 || ph > 11.0) {
    return {
      isValid: false,
      errorEn: `Soil pH (${ph}) is outside the feasible agronomic range (3.0 to 11.0).`,
      errorTa: `மண் pH (${ph}) சாத்தியமான 3.0 முதல் 11.0 வரம்பிற்கு வெளியே உள்ளது.`
    };
  }

  // Water capacity validation (0 to 100%)
  const rawWater = fieldData.water_capacity;
  const waterVal = parseWaterPercentage(rawWater);
  if (waterVal === null || !Number.isFinite(waterVal)) {
    return {
      isValid: false,
      errorEn: "Please enter a valid soil water capacity percentage (0% to 100%).",
      errorTa: "சரியான மண் நீர் கொள்ளளவு சதவீதத்தை (0% - 100%) உள்ளிடவும்."
    };
  }
  if (waterVal < 0 || waterVal > 100) {
    return {
      isValid: false,
      errorEn: `Water capacity (${waterVal}%) must be between 0% and 100%.`,
      errorTa: `நீர் கொள்ளளவு (${waterVal}%) 0% முதல் 100%க்குள் இருக்க வேண்டும்.`
    };
  }

  // NPK validation
  const nutrients = [
    { key: "npk_nitrogen", nameEn: "Nitrogen (N)", nameTa: "நைட்ரஜன் (N)" },
    { key: "npk_phosphorus", nameEn: "Phosphorus (P)", nameTa: "பாஸ்பரஸ் (P)" },
    { key: "npk_potassium", nameEn: "Potassium (K)", nameTa: "பொட்டாசியம் (K)" }
  ];

  for (const item of nutrients) {
    const rawVal = fieldData[item.key];
    if (rawVal === null || rawVal === undefined || String(rawVal).trim() === "") {
      return {
        isValid: false,
        errorEn: `Please enter a value for ${item.nameEn}.`,
        errorTa: `${item.nameTa} மதிப்பினை உள்ளிடவும்.`
      };
    }
    const val = parseFloat(rawVal);
    if (!Number.isFinite(val)) {
      return {
        isValid: false,
        errorEn: `${item.nameEn} must be a valid non-negative number.`,
        errorTa: `${item.nameTa} சரியான எண்ணாக இருக்க வேண்டும்.`
      };
    }
    if (val < 0) {
      return {
        isValid: false,
        errorEn: `${item.nameEn} cannot be negative.`,
        errorTa: `${item.nameTa} மதிப்பு எதிர்மறையாக இருக்க முடியாது.`
      };
    }
  }

  // Field size validation
  const rawSize = fieldData.field_size;
  if (rawSize !== null && rawSize !== undefined && String(rawSize).trim() !== "") {
    const sizeVal = parseFloat(rawSize);
    if (!Number.isFinite(sizeVal)) {
      return {
        isValid: false,
        errorEn: "Field size must be a valid number.",
        errorTa: "நில அளவு சரியான எண்ணாக இருக்க வேண்டும்."
      };
    }
    if (sizeVal <= 0) {
      return {
        isValid: false,
        errorEn: "Field size must be greater than zero.",
        errorTa: "நில அளவு பூஜ்ஜியத்தை விட அதிகமாக இருக்க வேண்டும்."
      };
    }
  }

  return { isValid: true, errorEn: null, errorTa: null };
}

/**
 * Authoritative client-side evaluation of field suitability for the selected crop.
 * Grounded in TNAU/ICAR agronomic standards.
 */
export function evaluateFieldSuitability(fieldData) {
  if (!fieldData || typeof fieldData !== 'object') {
    fieldData = {};
  }

  // 1. Input Validation
  const validation = validateFieldInputs(fieldData);
  if (!validation.isValid) {
    return {
      valid: false,
      overall_status: "Validation Error",
      overall_status_ta: "உள்ளீட்டு பிழை",
      suitable: false,
      status_level: "invalid",
      npk_unit: "kg/ha",
      water_capacity_definition: "Available Soil Moisture / Water Holding Capacity (%)",
      message: validation.errorEn,
      message_ta: validation.errorTa,
      checks: [],
      improvements: [
        {
          parameter: "Input Validation",
          status: "poor",
          issue: validation.errorEn,
          issue_ta: validation.errorTa,
          action: "Correct the input values before evaluating.",
          action_ta: "மதிப்பீடு செய்வதற்கு முன் சரியான மதிப்புகளை உள்ளிடவும்."
        }
      ],
      recommendations: [
        "Please enter valid field measurements to obtain an accurate agronomic suitability assessment."
      ],
      recommendations_ta: [
        "சரியான விவசாய பொருத்த மதிப்பீட்டைப் பெற சரியான நில அளவீடுகளை உள்ளிடவும்."
      ]
    };
  }

  const cropInput = String(fieldData.crop_type || "").trim();

  // Find matching crop case-insensitively
  let matchedCropKey = null;
  for (const k of Object.keys(VERIFIED_CROP_REQUIREMENTS)) {
    if (k.toLowerCase() === cropInput.toLowerCase()) {
      matchedCropKey = k;
      break;
    }
  }

  // 2. Check for Unsupported Crop
  if (!matchedCropKey) {
    return {
      valid: true,
      overall_status: "Assessment unavailable for this crop",
      overall_status_ta: "இந்த பயிருக்கான மதிப்பீடு கிடைக்கவில்லை",
      suitable: false,
      status_level: "unavailable",
      crop_type: cropInput,
      npk_unit: "kg/ha",
      water_capacity_definition: "Available Soil Moisture / Water Holding Capacity (%)",
      message: `Verified suitability rules are not currently available for ${cropInput || 'this crop'}.`,
      message_ta: `${cropInput || 'இந்த பயிருக்கான'} சரிபார்க்கப்பட்ட பொருத்த விதிகள் தற்போது கிடைக்கவில்லை.`,
      checks: [],
      improvements: [
        {
          parameter: "Crop Verification",
          status: "borderline",
          issue: `No verified TNAU/ICAR agronomic rule profile is loaded for '${cropInput}'. Supported verified crops: Brinjal, Tomato, Potato.`,
          issue_ta: `'${cropInput}' பயிருக்கான சரிபார்க்கப்பட்ட TNAU/ICAR விதிகள் ஏற்றப்படவில்லை. ஆதரிக்கப்படும் பயிர்கள்: கத்தரிக்காய், தக்காளி, உருளைக்கிழங்கு.`,
          action: "Select a supported crop (Brinjal, Tomato, or Potato) for a verified scientific assessment.",
          action_ta: "சரிபார்க்கப்பட்ட அறிவியல் மதிப்பீட்டிற்கு ஆதரிக்கப்படும் பயிரைத் தேர்ந்தெடுக்கவும்."
        }
      ],
      recommendations: [
        `Verified suitability rules are not currently available for ${cropInput}. Please select Brinjal, Tomato, or Potato for scientific suitability checks.`
      ],
      recommendations_ta: [
        `${cropInput} பயிருக்கான சரிபார்க்கப்பட்ட விதிகள் தற்போது இல்லை. கத்தரிக்காய், தக்காளி அல்லது உருளைக்கிழங்கைத் தேர்ந்தெடுக்கவும்.`
      ]
    };
  }

  const rules = VERIFIED_CROP_REQUIREMENTS[matchedCropKey];
  const cropNameEn = rules.crop_name_en;
  const cropNameTa = rules.crop_name_ta;

  const checks = [];
  const improvements = [];

  const addCheck = (param, value, status, recRange, msgEn, msgTa, actionEn, actionTa, isCritical = false) => {
    checks.push({
      parameter: param,
      value: value,
      status: status,
      is_critical: isCritical,
      recommended_range: recRange,
      message: msgEn,
      message_ta: msgTa
    });

    if (status === "poor" || status === "borderline") {
      improvements.push({
        parameter: param,
        status: status,
        is_critical: isCritical,
        issue: msgEn,
        issue_ta: msgTa,
        action: actionEn || msgEn,
        action_ta: actionTa || msgTa
      });
    }
  };

  // --- 1. Soil pH Evaluation (Critical) ---
  const phVal = parseFloat(fieldData.soil_ph);
  const phRules = rules.ph;
  const optMin = phRules.optimal_min;
  const optMax = phRules.optimal_max;
  const tolMin = phRules.tolerable_min;
  const tolMax = phRules.tolerable_max;

  let phStatus = "good";
  let phMsgEn = "";
  let phMsgTa = "";
  let phActEn = null;
  let phActTa = null;

  if (phVal >= optMin && phVal <= optMax) {
    phStatus = "good";
    phMsgEn = `Soil pH (${phVal.toFixed(1)}) is optimal for ${cropNameEn} (${optMin}–${optMax}).`;
    phMsgTa = `மண்ணின் pH (${phVal.toFixed(1)}) ${cropNameTa} பயிருக்கு மிகவும் உகந்த நிலையில் உள்ளது (${optMin}–${optMax}).`;
  } else if (phVal >= tolMin && phVal < optMin) {
    phStatus = "borderline";
    phMsgEn = `Soil pH (${phVal.toFixed(1)}) is slightly acidic for ${cropNameEn}. Recommended range: ${optMin}–${optMax}.`;
    phMsgTa = `மண்ணின் pH (${phVal.toFixed(1)}) சற்றே அமிலத்தன்மையில் உள்ளது. பரிந்துரைக்கப்படும் அளவு: ${optMin}–${optMax}.`;
    phActEn = "Apply agricultural lime (calcium carbonate) or dolomite to gently raise soil pH.";
    phActTa = "மண்ணின் அமிலத்தன்மையைக் குறைக்க விவசாய சுண்ணாம்பு (Lime) இடவும்.";
  } else if (phVal > optMax && phVal <= tolMax) {
    phStatus = "borderline";
    phMsgEn = `Soil pH (${phVal.toFixed(1)}) is slightly alkaline for ${cropNameEn}. Recommended range: ${optMin}–${optMax}.`;
    phMsgTa = `மண்ணின் pH (${phVal.toFixed(1)}) சற்றே காரத்தன்மையில் உள்ளது. பரிந்துரைக்கப்படும் அளவு: ${optMin}–${optMax}.`;
    phActEn = "Incorporate organic farmyard manure (FYM) or green manure to moderate alkaline pH.";
    phActTa = "மண்ணின் காரத்தன்மையைக் குறைக்க மட்கிய தொழு உரம் அல்லது தழை உரம் இடவும்.";
  } else if (phVal < tolMin) {
    phStatus = "poor";
    phMsgEn = `Soil pH (${phVal.toFixed(1)}) is severely acidic for ${cropNameEn} (below ${tolMin}). Stunts root development and locks phosphorus.`;
    phMsgTa = `மண்ணின் pH (${phVal.toFixed(1)}) மிக அதிக அமிலத்தன்மை கொண்டது (${tolMin}க்கு கீழ்). வேர் வளர்ச்சியை பாதிக்கும்.`;
    phActEn = "Apply agricultural lime @ 1–2 tonnes/ha and well-rotted compost before transplanting to bring pH above 6.0.";
    phActTa = "மண்ணின் pH அளவை 6.0க்கு மேல் உயர்த்த ஹெக்டேருக்கு 1-2 டன் சுண்ணாம்பு மற்றும் தொழு உரம் இடவும்.";
  } else {
    // phVal > tolMax
    phStatus = "poor";
    if (matchedCropKey === "Potato") {
      phMsgEn = `Soil pH (${phVal.toFixed(1)}) is too high for Potato (> ${tolMax}). Alkaline soil strongly triggers devastating Common Scab (Streptomyces scabies) disease.`;
      phMsgTa = `மண்ணின் pH (${phVal.toFixed(1)}) உருளைக்கிழங்குக்கு மிக அதிகம். கார மண் கொடிய சொறி நோயை (Common Scab) உண்டாக்கும்.`;
      phActEn = "Apply elemental agricultural sulfur (200-300 kg/ha) or gypsum to acidify soil to pH 5.2–6.2 before tuber planting.";
      phActTa = "கிழங்கு நடுவதற்கு முன் கந்தகம் (Sulfur) அல்லது ஜிப்சம் இட்டு pH அளவை 5.2–6.2 வரை குறைக்கவும்.";
    } else {
      phMsgEn = `Soil pH (${phVal.toFixed(1)}) is too high for ${cropNameEn} (> ${tolMax}). Induces severe micronutrient (Iron/Zinc) chlorosis.`;
      phMsgTa = `மண்ணின் pH (${phVal.toFixed(1)}) ${cropNameTa} பயிருக்கு மிக அதிகம். இது இரும்பு மற்றும் துத்தநாக பற்றாக்குறையை ஏற்படுத்தும்.`;
      phActEn = "Apply agricultural gypsum or elemental sulfur along with heavy organic compost to reduce pH toward optimal range.";
      phActTa = "மண்ணின் pH அளவைக் குறைக்க ஜிப்சம் அல்லது கந்தகத்துடன் அதிக கரிம உரங்களை இடவும்.";
    }
  }

  addCheck(
    "Soil pH",
    phVal,
    phStatus,
    phRules.desc,
    phMsgEn,
    phMsgTa,
    phActEn,
    phActTa,
    true
  );

  // --- 2. Water Capacity / Availability Evaluation (Critical) ---
  // CRITICAL: 0 is a valid number, do NOT default 0 to 72!
  const parsedWater = parseWaterPercentage(fieldData.water_capacity);
  const waterVal = parsedWater !== null ? parsedWater : 72.0;

  const wRules = rules.water_capacity;
  const wOptMin = wRules.optimal_min;
  const wOptMax = wRules.optimal_max;
  const wTolMin = wRules.tolerable_min;
  const wTolMax = wRules.tolerable_max;

  let wStatus = "good";
  let wMsgEn = "";
  let wMsgTa = "";
  let wActEn = null;
  let wActTa = null;

  if (waterVal >= wOptMin && waterVal <= wOptMax) {
    wStatus = "good";
    wMsgEn = `Water capacity (${Math.round(waterVal)}%) is in the optimal range (${Math.round(wOptMin)}%–${Math.round(wOptMax)}%).`;
    wMsgTa = `மண் நீர் கொள்ளளவு (${Math.round(waterVal)}%) உகந்த வரம்பில் உள்ளது (${Math.round(wOptMin)}%–${Math.round(wOptMax)}%).`;
  } else if (waterVal >= wTolMin && waterVal < wOptMin) {
    wStatus = "borderline";
    wMsgEn = `Water capacity (${Math.round(waterVal)}%) is slightly low. Recommended: ${Math.round(wOptMin)}%–${Math.round(wOptMax)}%.`;
    wMsgTa = `நீர் கொள்ளளவு (${Math.round(waterVal)}%) சற்றே குறைவாக உள்ளது. பரிந்துரை: ${Math.round(wOptMin)}%–${Math.round(wOptMax)}%.`;
    wActEn = "Increase irrigation frequency and incorporate organic matter/mulch to enhance moisture retention.";
    wActTa = "நீர் பாசன இடைவெளியைக் குறைத்து மூடாக்கு அல்லது மட்கிய உரம் இட்டு ஈரப்பதத்தை அதிகரிக்கவும்.";
  } else if (waterVal > wOptMax && waterVal <= wTolMax) {
    wStatus = "borderline";
    wMsgEn = `Water capacity (${Math.round(waterVal)}%) is on the higher side. Ensure soil does not remain saturated.`;
    wMsgTa = `நீர் கொள்ளளவு (${Math.round(waterVal)}%) அதிகமாக உள்ளது. நிலத்தில் நீர் தேங்காமல் பார்த்துக் கொள்ளவும்.`;
    wActEn = "Improve furrow drainage to avoid standing water around root zones.";
    wActTa = "வேர்ப்பகுதியில் நீர் தேங்குவதைத் தவிர்க்க வடிகால் வசதியை மேம்படுத்தவும்.";
  } else if (waterVal < wTolMin) {
    wStatus = "poor";
    wMsgEn = `Water capacity (${Math.round(waterVal)}%) is insufficient for ${cropNameEn} (below ${Math.round(wTolMin)}%). Risk of severe drought stress and crop failure.`;
    wMsgTa = `நீர் கொள்ளளவு (${Math.round(waterVal)}%) ${cropNameTa} பயிருக்கு போதுமானதாக இல்லை (${Math.round(wTolMin)}%க்கு கீழ்). வறட்சி ஏற்படும் அபாயம்.`;
    wActEn = "Ensure dependable irrigation source (drip system) and pre-soak planting ridges before sowing.";
    wActTa = "விதைப்பதற்கு முன் சொட்டுநீர்ப் பாசனம் அல்லது தேவையான நீர் ஆதாரம் அமைத்து நிலத்தை ஈரப்பதமாக்கவும்.";
  } else {
    // waterVal > wTolMax
    wStatus = "poor";
    wMsgEn = `Water capacity (${Math.round(waterVal)}%) is excessive (> ${Math.round(wTolMax)}%). Severe waterlogging induces root rot and bacterial wilt.`;
    wMsgTa = `நீர் கொள்ளளவு (${Math.round(waterVal)}%) மிக அதிகம் (${Math.round(wTolMax)}%க்கு மேல்). அதிக நீர் தேங்குவது வேரழுகல் மற்றும் வாடல் நோயை உண்டாக்கும்.`;
    wActEn = "Construct deep drainage channels and raised beds to evacuate surplus water.";
    wActTa = "அதிகப்படியான நீரை வெளியேற்ற ஆழமான வடிகால் வாய்க்கால்களை அமைக்கவும்.";
  }

  addCheck(
    "Water Capacity",
    `${Math.round(waterVal)}%`,
    wStatus,
    wRules.desc,
    wMsgEn,
    wMsgTa,
    wActEn,
    wActTa,
    true
  );

  // --- 3. Nitrogen (N) Evaluation (Critical) ---
  const nRaw = parseFloat(fieldData.npk_nitrogen);
  const nVal = Number.isFinite(nRaw) ? nRaw : 80;
  const nRules = rules.nitrogen;

  let nStatus = "good";
  let nMsgEn = "";
  let nMsgTa = "";
  let nActEn = null;
  let nActTa = null;

  if (nVal >= nRules.optimal_min && nVal <= nRules.optimal_max) {
    nStatus = "good";
    nMsgEn = `Nitrogen level (${Math.round(nVal)} kg/ha) is suitable for ${cropNameEn}.`;
    nMsgTa = `நைட்ரஜன் அளவு (${Math.round(nVal)} kg/ha) ${cropNameTa} பயிருக்கு போதுமானதாக உள்ளது.`;
  } else if (nVal >= nRules.tolerable_min && nVal < nRules.optimal_min) {
    nStatus = "borderline";
    nMsgEn = `Nitrogen level (${Math.round(nVal)} kg/ha) is slightly low for ${cropNameEn}. Recommended: ${nRules.optimal_min}–${nRules.optimal_max} kg/ha.`;
    nMsgTa = `நைட்ரஜன் அளவு (${Math.round(nVal)} kg/ha) சற்றே குறைவாக உள்ளது. பரிந்துரை: ${nRules.optimal_min}–${nRules.optimal_max} kg/ha.`;
    nActEn = `Supplement with basal Neem-coated Urea or well-decomposed manure to reach ${nRules.recommended} kg/ha.`;
    nActTa = `வேப்பம்பூசிய யூரியா அல்லது தொழு உரமிட்டு ${nRules.recommended} kg/ha அளவை அடையவும்.`;
  } else if (nVal > nRules.optimal_max && nVal <= nRules.tolerable_max) {
    nStatus = "borderline";
    nMsgEn = `Nitrogen level (${Math.round(nVal)} kg/ha) is on the higher side. Avoid excess vegetative growth.`;
    nMsgTa = `நைட்ரஜன் அளவு (${Math.round(nVal)} kg/ha) அதிகமாக உள்ளது. அதிக தழை வளர்ச்சி பூப்பிடிப்பை தாமதப்படுத்தலாம்.`;
    nActEn = "Reduce topdress urea applications and balance with potash.";
    nActTa = "யூரியா இடுவதைக் குறைத்து பொட்டாஷ் உரத்தை சமநிலையில் இடவும்.";
  } else if (nVal < nRules.tolerable_min) {
    nStatus = "poor";
    nMsgEn = `Nitrogen availability (${Math.round(nVal)} kg/ha) is critically low for ${cropNameEn} (below ${nRules.tolerable_min} kg/ha). Causes severe stunting and chlorosis.`;
    nMsgTa = `நைட்ரஜன் சத்து (${Math.round(nVal)} kg/ha) மிகவும் குறைவாக உள்ளது (${nRules.tolerable_min} kg/haக்கு கீழ்). பயிர் வளர்ச்சி குன்றி இலைகள் மஞ்சளாகும்.`;
    nActEn = `Increase nitrogen availability before planting. Apply basal dose of Nitrogen (Urea/Compost) to achieve at least ${nRules.optimal_min} kg/ha.`;
    nActTa = `நடவுக்கு முன் தழைச்சத்து அளவை அதிகரிக்கவும். குறைந்தபட்சம் ${nRules.optimal_min} kg/ha கிடைக்கும்படி யூரியா இடவும்.`;
  } else {
    // nVal > nRules.tolerable_max
    nStatus = "poor";
    nMsgEn = `Nitrogen level (${Math.round(nVal)} kg/ha) is dangerously excessive. Increases pest/disease susceptibility and delays flowering.`;
    nMsgTa = `நைட்ரஜன் அளவு (${Math.round(nVal)} kg/ha) மிக அதிகமாக உள்ளது. பூச்சி தாக்குதல் மற்றும் நோய் அபாயத்தை அதிகரிக்கும்.`;
    nActEn = "Do not apply any additional nitrogen fertilizers; flush soil if necessary.";
    nActTa = "கூடுதல் நைட்ரஜன் உரங்கள் எதையும் இடவேண்டாம்.";
  }

  addCheck(
    "Nitrogen (N)",
    `${Math.round(nVal)} kg/ha`,
    nStatus,
    nRules.desc,
    nMsgEn,
    nMsgTa,
    nActEn,
    nActTa,
    true
  );

  // --- 4. Phosphorus (P) Evaluation ---
  const pRaw = parseFloat(fieldData.npk_phosphorus);
  const pVal = Number.isFinite(pRaw) ? pRaw : 40;
  const pRules = rules.phosphorus;

  let pStatus = "good";
  let pMsgEn = "";
  let pMsgTa = "";
  let pActEn = null;
  let pActTa = null;

  if (pVal >= pRules.optimal_min && pVal <= pRules.optimal_max) {
    pStatus = "good";
    pMsgEn = `Phosphorus level (${Math.round(pVal)} kg/ha) is optimal for ${cropNameEn}.`;
    pMsgTa = `பாஸ்பரஸ் அளவு (${Math.round(pVal)} kg/ha) ${cropNameTa} பயிருக்கு உகந்ததாக உள்ளது.`;
  } else if (pVal >= pRules.tolerable_min && pVal < pRules.optimal_min) {
    pStatus = "borderline";
    pMsgEn = `Phosphorus (${Math.round(pVal)} kg/ha) is slightly below optimal (${pRules.optimal_min}–${pRules.optimal_max} kg/ha).`;
    pMsgTa = `பாஸ்பரஸ் (${Math.round(pVal)} kg/ha) சற்றே குறைவாக உள்ளது (${pRules.optimal_min}–${pRules.optimal_max} kg/ha).`;
    pActEn = `Apply Single Super Phosphate (SSP) or DAP to reach recommended ${pRules.recommended} kg/ha.`;
    pActTa = `சூப்பர் பாஸ்பேட் (SSP) அல்லது DAP இட்டு ${pRules.recommended} kg/ha அளவை அடையவும்.`;
  } else if (pVal > pRules.optimal_max && pVal <= pRules.tolerable_max) {
    pStatus = "borderline";
    pMsgEn = `Phosphorus (${Math.round(pVal)} kg/ha) is high but acceptable.`;
    pMsgTa = `பாஸ்பரஸ் (${Math.round(pVal)} kg/ha) அதிகமாக இருந்தாலும் ஏற்கக்கூடியது.`;
    pActEn = "Avoid additional phosphate applications.";
    pActTa = "கூடுதல் பாஸ்பேட் உரங்களை இட வேண்டாம்.";
  } else if (pVal < pRules.tolerable_min) {
    pStatus = "poor";
    pMsgEn = `Phosphorus (${Math.round(pVal)} kg/ha) is severely deficient (below ${pRules.tolerable_min} kg/ha). Prevents healthy root establishment.`;
    pMsgTa = `பாஸ்பரஸ் (${Math.round(pVal)} kg/ha) மிகக் குறைவாக உள்ளது ({pRules.tolerable_min} kg/haக்கு கீழ்). வேர் வளர்ச்சியை முடக்கும்.`;
    pActEn = "Incorporate basal Single Super Phosphate (SSP @ 250 kg/ha) into soil before planting.";
    pActTa = "நடவுக்கு முன் நிலத்தில் சிங்கிள் சூப்பர் பாஸ்பேட் (SSP) அடியுரமாக இடவும்.";
  } else {
    // pVal > pRules.tolerable_max
    pStatus = "poor";
    pMsgEn = `Phosphorus level (${Math.round(pVal)} kg/ha) is excessively high; interferes with micronutrient uptake.`;
    pMsgTa = `பாஸ்பரஸ் (${Math.round(pVal)} kg/ha) அளவுக்கு அதிகமாக உள்ளது.`;
    pActEn = "Do not apply phosphatic fertilizer.";
    pActTa = "பாஸ்பேட் உரங்களை இட வேண்டாம்.";
  }

  addCheck(
    "Phosphorus (P)",
    `${Math.round(pVal)} kg/ha`,
    pStatus,
    pRules.desc,
    pMsgEn,
    pMsgTa,
    pActEn,
    pActTa,
    false
  );

  // --- 5. Potassium (K) Evaluation ---
  const kRaw = parseFloat(fieldData.npk_potassium);
  const kVal = Number.isFinite(kRaw) ? kRaw : 40;
  const kRules = rules.potassium;

  let kStatus = "good";
  let kMsgEn = "";
  let kMsgTa = "";
  let kActEn = null;
  let kActTa = null;

  if (kVal >= kRules.optimal_min && kVal <= kRules.optimal_max) {
    kStatus = "good";
    kMsgEn = `Potassium level (${Math.round(kVal)} kg/ha) is optimal for ${cropNameEn}.`;
    kMsgTa = `பொட்டாசியம் அளவு (${Math.round(kVal)} kg/ha) ${cropNameTa} பயிருக்கு உகந்ததாக உள்ளது.`;
  } else if (kVal >= kRules.tolerable_min && kVal < kRules.optimal_min) {
    kStatus = "borderline";
    kMsgEn = `Potassium (${Math.round(kVal)} kg/ha) is slightly low. Recommended: ${kRules.optimal_min}–${kRules.optimal_max} kg/ha.`;
    kMsgTa = `பொட்டாசியம் (${Math.round(kVal)} kg/ha) சற்றே குறைவாக உள்ளது. பரிந்துரை: ${kRules.optimal_min}–${kRules.optimal_max} kg/ha.`;
    kActEn = `Apply Muriate of Potash (MOP) to reach recommended ${kRules.recommended} kg/ha.`;
    kActTa = `பொட்டாஷ் (MOP) உரமிட்டு ${kRules.recommended} kg/ha அளவை அடையவும்.`;
  } else if (kVal > kRules.optimal_max && kVal <= kRules.tolerable_max) {
    kStatus = "borderline";
    kMsgEn = `Potassium (${Math.round(kVal)} kg/ha) is high but tolerable.`;
    kMsgTa = `பொட்டாசியம் (${Math.round(kVal)} kg/ha) சற்று அதிகமாக இருந்தாலும் ஏற்கக்கூடியது.`;
    kActEn = "Withhold additional potash.";
    kActTa = "கூடுதல் பொட்டாஷ் உரத்தை தவிர்க்கவும்.";
  } else if (kVal < kRules.tolerable_min) {
    kStatus = "poor";
    kMsgEn = `Potassium (${Math.round(kVal)} kg/ha) is severely deficient (below ${kRules.tolerable_min} kg/ha). Results in poor fruit firmness and disease vulnerability.`;
    kMsgTa = `பொட்டாசியம் (${Math.round(kVal)} kg/ha) மிகக் குறைவாக உள்ளது (${kRules.tolerable_min} kg/haக்கு கீழ்). காய் தரத்தைக் குறைக்கும்.`;
    kActEn = "Apply basal Muriate of Potash (MOP @ 60–80 kg/ha) to support sturdy stems and disease resistance.";
    kActTa = "காய் தரம் மற்றும் நோய் எதிர்ப்பிற்கு பொட்டாஷ் (MOP) அடியுரமாக இடவும்.";
  } else {
    // kVal > kRules.tolerable_max
    kStatus = "poor";
    kMsgEn = `Potassium (${Math.round(kVal)} kg/ha) is excessively high; blocks magnesium absorption.`;
    kMsgTa = `பொட்டாசியம் (${Math.round(kVal)} kg/ha) அளவுக்கு அதிகமாக உள்ளது.`;
    kActEn = "Skip potash fertilization.";
    kActTa = "பொட்டாஷ் உரமிடுவதைத் தவிர்க்கவும்.";
  }

  addCheck(
    "Potassium (K)",
    `${Math.round(kVal)} kg/ha`,
    kStatus,
    kRules.desc,
    kMsgEn,
    kMsgTa,
    kActEn,
    kActTa,
    false
  );

  // --- 6. Soil Type Evaluation (Critical) ---
  const soilInput = String(fieldData.soil_type || "Loamy").trim();
  const sRules = rules.soil_types;
  let soilStatus = "borderline";
  let soilMsgEn = `Soil type '${soilInput}' is acceptable for ${cropNameEn}.`;
  let soilMsgTa = `'${soilInput}' மண் வகை ${cropNameTa} பயிருக்கு ஏற்கத்தக்கது.`;
  let soilActEn = null;
  let soilActTa = null;

  const soilMatches = (list) => list.some(st => st.toLowerCase().includes(soilInput.toLowerCase()) || soilInput.toLowerCase().includes(st.toLowerCase()));

  if (soilMatches(sRules.good)) {
    soilStatus = "good";
    soilMsgEn = `Soil type '${soilInput}' provides optimal aeration and drainage for ${cropNameEn}.`;
    soilMsgTa = `'${soilInput}' மண் வகை ${cropNameTa} பயிரின் வேர் வளர்ச்சிக்கு உகந்த வடிகால் கொண்டது.`;
  } else if (soilMatches(sRules.poor)) {
    soilStatus = "poor";
    if (matchedCropKey === "Potato") {
      soilMsgEn = `Heavy clay/compact soil '${soilInput}' is unsuitable for Potato. Compacted soil deforms tubers and leads to rotting.`;
      soilMsgTa = "களிமண் நிலம் உருளைக்கிழங்கு கிழங்கு பெருக்கத்திற்கு ஏற்றதல்ல; கிழங்கு அழுகலை உண்டாக்கும்.";
      soilActEn = "Plant in loose, well-drained sandy loam or incorporate significant sand and compost to lighten soil texture.";
      soilActTa = "மணல் கலந்த வண்டல் மண்ணில் நடவு செய்யவும் அல்லது மண்ணை இலகுவாக்க மணல் மற்றும் மட்கிய உரம் சேர்க்கவும்.";
    } else {
      soilMsgEn = `Soil type '${soilInput}' has poor drainage or texture unsuitable for ${cropNameEn}.`;
      soilMsgTa = `'${soilInput}' மண் வகை வடிகால் வசதி குறைவால் ${cropNameTa} பயிருக்கு ஏற்றதல்ல.`;
      soilActEn = "Improve soil structure with liberal application of organic farmyard manure (25 tonnes/ha).";
      soilActTa = "மண்ணின் அமைப்பை மேம்படுத்த ஏக்கருக்கு அதிக தொழு உரம் இடவும்.";
    }
  } else {
    soilStatus = "borderline";
    soilMsgEn = `Soil type '${soilInput}' is borderline for ${cropNameEn}. Ensure ridge drainage.`;
    soilMsgTa = `'${soilInput}' மண் வகை மிதமானது. வடிகால் இருப்பதை உறுதி செய்யவும்.`;
    soilActEn = "Form raised broad beds to safeguard roots from excess compaction.";
    soilActTa = "பாத்திகளை உயர்த்தி அமைத்து வேர் அழுகலைத் தவிர்க்கவும்.";
  }

  addCheck(
    "Soil Type",
    soilInput,
    soilStatus,
    sRules.good.join(", "),
    soilMsgEn,
    soilMsgTa,
    soilActEn,
    soilActTa,
    true
  );

  // --- 7. Irrigation Method Compatibility ---
  const irrigInput = String(fieldData.irrigation_method || "Drip").trim();
  const iRules = rules.irrigation_methods;
  let irrigStatus = "borderline";
  let irrigMsgEn = `Irrigation method '${irrigInput}' is acceptable.`;
  let irrigMsgTa = `'${irrigInput}' பாசன முறை ஏற்கத்தக்கது.`;
  let irrigActEn = null;
  let irrigActTa = null;

  const irrigMatches = (list) => list.some(m => irrigInput.toLowerCase().includes(m.toLowerCase()));

  if (irrigMatches(iRules.good)) {
    irrigStatus = "good";
    irrigMsgEn = `'${irrigInput}' irrigation is highly compatible with ${cropNameEn}.`;
    irrigMsgTa = `'${irrigInput}' பாசன முறை ${cropNameTa} பயிருக்கு மிகவும் சிறந்தது.`;
  } else if (irrigMatches(iRules.poor)) {
    irrigStatus = "poor";
    if (irrigInput.toLowerCase().includes("sprinkler")) {
      irrigMsgEn = `Overhead sprinkler irrigation is contraindicated for ${cropNameEn}. Wetting foliage triggers rapid Early/Late Blight fungal outbreaks.`;
      irrigMsgTa = `தெளிப்பு நீர் பாசனம் ${cropNameTa} இலைகளை நனைத்து இலைக்கருகல் பூஞ்சை நோய்களை வேகமாக பரப்பும்.`;
      irrigActEn = "Switch to drip irrigation or ground furrow irrigation to keep the foliage canopy completely dry.";
      irrigActTa = "இலைகள் நனையாமல் இருக்க சொட்டுநீர் அல்லது வாய்க்கால் பாசனத்திற்கு மாறவும்.";
    } else if (irrigInput.toLowerCase().includes("rain-fed")) {
      irrigMsgEn = `Rain-fed cultivation is unviable for commercial ${cropNameEn}; drought during flowering causes severe blossom and fruit drop.`;
      irrigMsgTa = `மானாவாரி முறை ${cropNameTa} பயிருக்கு போதுமானதாக இல்லை; பூக்கள் உதிரும்.`;
      irrigActEn = "Arrange supplemental micro-irrigation before establishing commercial crop.";
      irrigActTa = "பயிர் வைப்பதற்கு முன் துணை பாசன வசதி ஏற்படுத்தவும்.";
    } else {
      irrigMsgEn = `Irrigation method '${irrigInput}' is unsuitable for ${cropNameEn}.`;
      irrigMsgTa = `'${irrigInput}' பாசன முறை ${cropNameTa} பயிருக்கு உகந்ததல்ல.`;
      irrigActEn = "Adopt drip or furrow irrigation.";
      irrigActTa = "சொட்டுநீர் அல்லது வாய்க்கால் பாசனத்தை தேர்வு செய்யவும்.";
    }
  } else {
    irrigStatus = "borderline";
    irrigMsgEn = `'${irrigInput}' is acceptable but monitor for standing water.`;
    irrigMsgTa = `'${irrigInput}' பாசனம் ஏற்கக்கூடியது, ஆனால் நீர் தேங்காமல் கவனிக்கவும்.`;
    irrigActEn = "Regulate water flow to prevent stagnation around stem collars.";
    irrigActTa = "தண்டுப் பகுதியில் நீர் தேங்குவதைத் தடுக்க சீராக பாசனம் செய்யவும்.";
  }

  addCheck(
    "Irrigation Method",
    irrigInput,
    irrigStatus,
    iRules.good.join(", "),
    irrigMsgEn,
    irrigMsgTa,
    irrigActEn,
    irrigActTa,
    false
  );

  // --- 8. Season Compatibility (Critical) ---
  const seasonInput = String(fieldData.season || "Kharif").trim();
  const seasonRules = rules.seasons;
  let seasonStatus = "borderline";
  let seasonMsgEn = `Season '${seasonInput}' is acceptable for ${cropNameEn}.`;
  let seasonMsgTa = `'${seasonInput}' பருவம் ${cropNameTa} பயிருக்கு ஏற்கத்தக்கது.`;
  let seasonActEn = null;
  let seasonActTa = null;

  const seasonMatches = (list) => list.some(s => seasonInput.toLowerCase().includes(s.toLowerCase()));

  if (seasonMatches(seasonRules.good)) {
    seasonStatus = "good";
    seasonMsgEn = `'${seasonInput}' is the ideal growing season for ${cropNameEn}.`;
    seasonMsgTa = `'${seasonInput}' பருவம் ${cropNameTa} சாகுபடிக்கு மிகவும் உகந்த காலம்.`;
  } else if (seasonMatches(seasonRules.poor)) {
    seasonStatus = "poor";
    if (matchedCropKey === "Potato") {
      seasonMsgEn = `Summer / Zaid (${seasonInput}) is unsuitable for Potato in plains. Night temperatures > 22°C completely suppress tuberization.`;
      seasonMsgTa = "கோடை காலம் உருளைக்கிழங்கு கிழங்கு உற்பத்திக்கு உகந்ததல்ல. அதிக வெப்பம் கிழங்கு உருவாவதைத் தடுக்கும்.";
      seasonActEn = "Schedule potato planting during cool winter (Rabi) season, or in high-altitude cool climates only.";
      seasonActTa = "குளிர்கால கார்த்திகைப் பட்டத்தில் (Rabi) அல்லது குளிர்ந்த மலைப்பிரதேசங்களில் மட்டும் நடவு செய்யவும்.";
    } else {
      seasonMsgEn = `Season '${seasonInput}' is unfavorable for ${cropNameEn}.`;
      seasonMsgTa = `'${seasonInput}' பருவம் ${cropNameTa} பயிருக்கு உகந்ததல்ல.`;
      seasonActEn = `Plan cultivation during ${seasonRules.good.join(", ")}.`;
      seasonActTa = `${seasonRules.good.join(", ")} பருவத்தில் பயிரிட திட்டமிடவும்.`;
    }
  } else {
    seasonStatus = "borderline";
    if (matchedCropKey === "Tomato" && (seasonInput.toLowerCase().includes("zaid") || seasonInput.toLowerCase().includes("summer"))) {
      seasonMsgEn = "Summer season requires temperature management (shade netting or mulching) to prevent tomato blossom drop.";
      seasonMsgTa = "கோடைக்காலத்தில் தக்காளி பூக்கள் உதிர்வதைத் தடுக்க நிழல்வலை அல்லது மூடாக்கு அவசியம்.";
      seasonActEn = "Use shade net or heat-tolerant hybrid varieties.";
      seasonActTa = "நிழல்வலை அல்லது வெப்பத்தைத் தாங்கும் கலப்பின விதைகளைப் பயன்படுத்தவும்.";
    } else if (matchedCropKey === "Potato" && seasonInput.toLowerCase().includes("kharif")) {
      seasonMsgEn = "Kharif potato is only feasible in high altitude hills (e.g. Nilgiris/Ooty); plains require Rabi winter.";
      seasonMsgTa = "ஆடிப்பட்ட உருளைக்கிழங்கு மலைப்பிரதேசங்களில் (ஊட்டி) மட்டுமே சாத்தியம்; சமவெளியில் குளிர்காலம் தேவை.";
      seasonActEn = "Ensure local temperatures stay below 25°C during day and 18°C at night.";
      seasonActTa = "பகல் வெப்பநிலை 25°C மற்றும் இரவு 18°Cக்கு குறைவாக இருப்பதை உறுதி செய்யவும்.";
    } else {
      seasonMsgEn = `Season '${seasonInput}' is borderline for ${cropNameEn}.`;
      seasonMsgTa = `'${seasonInput}' பருவம் ${cropNameTa} பயிருக்கு மிதமானது.`;
    }
  }

  addCheck(
    "Season",
    seasonInput,
    seasonStatus,
    seasonRules.good.join(", "),
    seasonMsgEn,
    seasonMsgTa,
    seasonActEn,
    seasonActTa,
    true
  );

  // --- 9. Field Size & Location (Informational) ---
  const rawFieldSize = fieldData.field_size;
  const fSize = Number.isFinite(parseFloat(rawFieldSize)) ? parseFloat(rawFieldSize) : 2.0;
  const fUnit = String(fieldData.field_size_unit || "Acre").trim();
  const fLoc = String(fieldData.field_location || "Tamil Nadu").trim();

  checks.push({
    parameter: "Field Size & Location",
    value: `${fSize} ${fUnit} (${fLoc})`,
    status: "good",
    is_critical: false,
    recommended_range: "Feasible for standard production",
    message: `Land parcel size of ${fSize} ${fUnit} in ${fLoc} is adequate for commercial ${cropNameEn}.`,
    message_ta: `${fLoc} பகுதியில் உள்ள ${fSize} ${fUnit} நில அளவு ${cropNameTa} சாகுபடிக்கு போதுமானது.`
  });

  // --- Overall Decision Calculation ---
  const poorChecks = checks.filter(c => c.status === "poor");
  const borderlineChecks = checks.filter(c => c.status === "borderline");

  let overallStatus = "Suitable for Planting";
  let overallStatusTa = "நடவு செய்ய உகந்தது";
  let suitable = true;
  let statusLevel = "good";
  let message = "";
  let messageTa = "";

  if (poorChecks.length > 0) {
    overallStatus = "Not Suitable for Planting";
    overallStatusTa = "நடவு செய்ய ஏற்றதல்ல";
    suitable = false;
    statusLevel = "poor";
    const primaryIssues = poorChecks.map(c => c.parameter);
    message = `Field is not suitable for planting ${cropNameEn} due to critical deficiencies in: ${primaryIssues.join(", ")}.`;
    messageTa = `முக்கிய காரணிகளில் (${primaryIssues.join(", ")}) குறைபாடுகள் உள்ளதால் ${cropNameTa} பயிரிட இந்த நிலம் தற்போது ஏற்றதல்ல.`;
  } else if (borderlineChecks.length > 0) {
    overallStatus = "Suitable with Improvements";
    overallStatusTa = "மேம்பாடுகளுடன் பயிரிடலாம்";
    suitable = true;
    statusLevel = "borderline";
    const borderlineParams = borderlineChecks.map(c => c.parameter);
    message = `Field is suitable for ${cropNameEn} with minor improvements recommended for: ${borderlineParams.join(", ")}.`;
    messageTa = `சில முன்னேற்றங்களுடன் (${borderlineParams.join(", ")}) ${cropNameTa} பயிரிட இந்த நிலம் உகந்தது.`;
  } else {
    overallStatus = "Suitable for Planting";
    overallStatusTa = "நடவு செய்ய உகந்தது";
    suitable = true;
    statusLevel = "good";
    message = `All field parameters are within the recommended agronomic range for planting ${cropNameEn}.`;
    messageTa = `அனைத்து நில அளவீடுகளும் ${cropNameTa} சாகுபடிக்கு மிகவும் உகந்த நிலையில் உள்ளன.`;
  }

  // Recommendations
  const recommendations = [];
  const recommendationsTa = [];

  if (!suitable) {
    recommendations.push(`Improve the identified soil and field conditions before planting ${cropNameEn}.`);
    recommendationsTa.push(`${cropNameTa} பயிரிடுவதற்கு முன் மேற்கண்ட குறைபாடுகளை சரிசெய்து நிலத்தை தயார் செய்யவும்.`);
    for (const imp of improvements.slice(0, 3)) {
      recommendations.push(`${imp.parameter}: ${imp.action}`);
      recommendationsTa.push(`${imp.parameter}: ${imp.action_ta}`);
    }
  } else if (borderlineChecks.length > 0) {
    recommendations.push(`Your field can support ${cropNameEn}, but addressing borderline parameters will maximize harvest yield.`);
    recommendationsTa.push(`${cropNameTa} பயிரிடலாம், ஆனால் சுட்டிக்காட்டப்பட்ட அளவீடுகளை மேம்படுத்துவது அதிக மகசூலைத் தரும்.`);
    for (const imp of improvements.slice(0, 2)) {
      recommendations.push(`${imp.parameter}: ${imp.action}`);
      recommendationsTa.push(`${imp.parameter}: ${imp.action_ta}`);
    }
  } else {
    recommendations.push(`Your current field conditions are suitable for planting ${cropNameEn}.`);
    recommendationsTa.push(`தங்களின் தர்தோதைய நில சூழல் ${cropNameTa} பயிரிட மிகவும் உகந்ததாக உள்ளது.`);
    recommendations.push("Maintain routine irrigation and follow TNAU recommended basal fertilization schedule during sowing.");
    recommendationsTa.push("வழக்கமான பாசனத்தை பராமரித்து, விதைப்பின் போது பரிந்துரைக்கப்பட்ட அடியுரங்களை இடவும்.");
  }

  return {
    valid: true,
    crop_type: cropNameEn,
    overall_status: overallStatus,
    overall_status_ta: overallStatusTa,
    suitable: suitable,
    status_level: statusLevel,
    npk_unit: "kg/ha",
    water_capacity_definition: "Available Soil Moisture / Water Holding Capacity (%)",
    message: message,
    message_ta: messageTa,
    checks: checks,
    improvements: improvements,
    recommendations: recommendations,
    recommendations_ta: recommendationsTa
  };
}
