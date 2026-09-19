/**
 * SmartFarm AI - Gemini AI Farmer Assistant & RAG Serverless Handler
 * Routes: POST /api/chat, POST /api/backend/api/chat, GET /api/chat/status
 * Runs directly on Vercel serverless without requiring a GPU.
 * Uses process.env.GEMINI_API_KEY (server-side only).
 */

import dns from 'dns';

// Configure DNS fallback for Node environments where default resolver has issues
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

// Verified Solanaceae Agricultural Knowledge Base (TNAU & ICAR standards)
const AGRICULTURAL_KNOWLEDGE_BASE = [
  {
    id: "KB-TOM-01",
    crop: "Tomato",
    keywords: ["yellow", "leaves", "yellowing", "chlorosis", "tomato", "nitrogen", "waterlogging", "fertilizer", "மஞ்சள்", "இலைகள்", "தக்காளி", "நைட்ரஜன்", "உரம்"],
    primarySource: "TNAU Agritech Portal - Tomato Crop Protection & Nutrient Management Guide",
    contentEn: `Causes & Management of Yellow Leaves (Chlorosis) in Tomato:
1. Nitrogen (N) Deficiency: Older, lower leaves turn pale green then bright yellow. Apply well-decomposed Farmyard Manure (FYM) or vermicompost. Foliar spray of 19:19:19 NPK (4-5g/L) or urea (1-2%).
2. Overwatering / Poor Soil Drainage: Roots suffocate from excess water. Allow top 2 inches of soil to dry between irrigations; maintain 60-65% field capacity.
3. Early Blight (Alternaria solani): Dark brown target rings with yellow halo. Prune lower leaves; spray Mancozeb 75% WP (2g/L) or Chlorothalonil (2g/L).
4. Magnesium Deficiency: Interveinal chlorosis (veins stay green). Spray Magnesium Sulphate (Epsom Salt) at 5g/L.
5. Tomato Leaf Curl Virus: Upward curling and yellowing transmitted by Whitefly. Install yellow sticky traps (15/acre); spray Neem seed kernel extract (NSKE 5%) or Imidacloprid (0.3ml/L).`,
    contentTa: `தக்காளி செடிகளில் இலைகள் மஞ்சள் நிறமாக மாறுவதற்கான காரணங்கள் மற்றும் மேலாண்மை:
1. தழைச்சத்து (நைட்ரஜன்) குறைபாடு: கீழ் இலைகள் முதலில் மஞ்சளாகும். மக்கிய தொழு உரம் இடவும். NPK 19:19:19 உரத்தை லிட்டருக்கு 4-5 கிராம் வீதம் தெளிக்கவும்.
2. அதிக நீர் தேங்குதல்: வேர் அழுகலைத் தடுக்க பாசன இடைவெளியைச் சீராக்கி வடிகால் வசதி செய்யவும்.
3. ஏர்லி பிளைட் இலைக்கருகல்: வளைய வடிவ புள்ளிகள். மேன்கோசெப் (2g/L) பூஞ்சாணக்கொல்லி தெளிக்கவும்.
4. மெக்னீசியம் குறைபாடு: நரம்பிடை மஞ்சளாதல். மெக்னீசியம் சல்பேட் (5g/L) இலைகளில் தெளிக்கவும்.`
  },
  {
    id: "KB-TOM-02",
    crop: "Tomato",
    keywords: ["late blight", "early blight", "phytophthora", "alternaria", "blight", "fungal", "spots", "lesions", "mancozeb", "copper", "லேட் பிளைட்", "பூஞ்சை"],
    primarySource: "TNAU Crop Protection Compendium - Solanaceae Blights",
    contentEn: `Tomato Blight Diagnostics & Management:
1. Late Blight (Phytophthora infestans): Cool, humid weather (>75% RH, 18-24°C) causes rapid water-soaked dark lesions with white fungal mold under leaves. Preventative: Copper Oxychloride (3g/L) or Mancozeb 75% WP (2g/L). Curative: Metalaxyl + Mancozeb (2g/L) or Cymoxanil + Mancozeb.
2. Early Blight (Alternaria solani): Concentric brown rings on older leaves. Spray Chlorothalonil 2g/L or Azoxystrobin 1ml/L. Avoid overhead splash irrigation.`,
    contentTa: `தக்காளி பிளைட் நோய் மேலாண்மை:
1. லேட் பிளைட்: அதிக ஈரப்பதத்தில் இலைகளில் நீர் கோர்த்த கருமை புள்ளிகள். காப்பர் ஆக்ஸிகுளோரைடு (3g/L) அல்லது மேன்கோசெப் (2g/L) தெளிக்கவும்.
2. ஏர்லி பிளைட்: வளைய புள்ளிகள். குளோரோதலோனில் (2g/L) தெளிக்கவும்.`
  },
  {
    id: "KB-POT-01",
    crop: "Potato",
    keywords: ["potato", "tuber", "fertilizer", "early blight", "late blight", "urea", "potash", "உருளை", "உருளைக்கிழங்கு", "உரம்"],
    primarySource: "ICAR-CPRI / TNAU Potato Production Guidelines",
    contentEn: `Potato Nutrient & Crop Protection Management:
1. Fertilizer Schedule: Apply NPK in ratio 120:240:120 kg/ha for optimal tuber bulking. Apply full P and K with half N at planting; top-dress remaining N at earthing-up (30-35 days).
2. Late Blight (Phytophthora infestans): Saturated ridges favor infection. Spray Mancozeb (2g/L) or Metalaxyl-Mancozeb (2g/L). Ensure clean drainage furrows.
3. Early Blight: Spray Azoxystrobin (1ml/L) or Chlorothalonil (2g/L).`,
    contentTa: `உருளைக்கிழங்கு உரம் மற்றும் பயிர் பாதுகாப்பு மேலாண்மை:
1. உர மேலாண்மை: ஏக்கருக்கு பரிந்துரைக்கப்பட்ட NPK உரமிட்டு, 30-35 ஆம் நாளில் மண் அணைக்கும் போது மீதி தழைச்சத்து இடவும்.
2. லேட் பிளைட் நோய்: மேன்கோசெப் அல்லது மெட்டலாக்சில் பூஞ்சாணக்கொல்லி தெளிக்கவும்.`
  },
  {
    id: "KB-BRIN-01",
    crop: "Brinjal",
    keywords: ["brinjal", "eggplant", "shoot borer", "fruit borer", "little leaf", "wilt", "கத்தரி", "துளைப்பான்", "வாடல்"],
    primarySource: "TNAU Agritech Portal - Brinjal Integrated Pest & Disease Management",
    contentEn: `Brinjal (Eggplant) Crop Care & Protection:
1. Shoot and Fruit Borer (Leucinodes orbonalis): Clip and destroy withered shoots weekly. Install pheromone traps (12/acre). Spray Emamectin Benzoate 5% SG (0.4g/L) or Chlorantraniliprole 18.5% SC (0.3ml/L).
2. Bacterial Wilt (Ralstonia solanacearum): Drench nursery and transplanted ridges with Copper Hydroxide (2g/L) or Streptocycline (1g/10L).
3. Little Leaf Disease: Phytoplasma transmitted by leafhopper. Remove infected bushy plants; spray Dimethoate 30% EC (1.5ml/L).`,
    contentTa: `கத்தரி பயிர் பாதுகாப்பு மற்றும் பூச்சி மேலாண்மை:
1. தண்டு மற்றும் காய் துளைப்பான்: தாக்கப்பட்ட நுனித் தண்டுகளை வெட்டி அழிக்கவும். இனக்கவர்ச்சி பொறி (ஏக்கருக்கு 12) வைக்கவும். எமாமெக்டின் பென்சோயேட் (0.4g/L) தெளிக்கவும்.
2. பாக்டீரியா வாடல் நோய்: காப்பர் ஹைட்ராக்சைடு கொண்டு வேர் நனைக்கவும்.`
  }
];

function retrieveRagContext(query = '', language = 'en') {
  const clean = query.toLowerCase();
  const scored = AGRICULTURAL_KNOWLEDGE_BASE.map((kb) => {
    let score = 0;
    for (const kw of kb.keywords) {
      if (clean.includes(kw.toLowerCase())) score += 1;
    }
    return { ...kb, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter((s) => s.score > 0).slice(0, 2);

  if (matched.length === 0) {
    return { contextText: '', primarySource: 'SmartFarm Agricultural Knowledge Base' };
  }

  const isTa = language === 'ta';
  const contextText = matched.map((m) => (isTa ? m.contentTa : m.contentEn)).join('\n\n---\n\n');
  const primarySource = matched[0].primarySource;

  return { contextText, primarySource };
}

export async function executeRagGeminiQuery(message, language = 'en', history = []) {
  const normLang = language === 'ta' ? 'ta' : 'en';
  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  const { contextText, primarySource } = retrieveRagContext(message, normLang);

  // Build conversation history context
  let historyPromptSection = '';
  if (Array.isArray(history) && history.length > 0) {
    const recentTurns = history.slice(-6);
    const historyLines = [];
    for (const h of recentTurns) {
      const role = h.sender === 'user' ? 'Farmer' : 'Assistant';
      const textVal = (h.text || '').trim();
      if (textVal) {
        historyLines.append ? historyLines.append(`${role}: ${textVal}`) : historyLines.push(`${role}: ${textVal}`);
      }
    }
    if (historyLines.length > 0) {
      historyPromptSection = `RECENT CONVERSATION HISTORY:\n----------------------------------------\n${historyLines.join('\n')}\n----------------------------------------\nNote: Use the conversation history above to understand context and resolve references (such as 'it', 'that crop', 'that disease', 'the fertilizer').\n\n`;
    }
  }

  // If API key is not configured, gracefully provide verified RAG knowledge
  if (!apiKey) {
    console.warn('[Gemini Chat] GEMINI_API_KEY is not set. Engaging verified Agricultural Knowledge Base fallback.');
    const fallbackText = normLang === 'ta'
      ? (contextText || "வணக்கம். நேரடி AI மொழி மாதிரி சேவை தற்காலிகமாக இணைக்கப்படவில்லை. உள்ளூர் வேளாண் விரிவாக்க அலுவலர் அல்லது TNAU ஆலோசனையைப் பெறவும்.")
      : (contextText || "Note: Direct AI model inference is temporarily unconfigured. Please consult local agricultural extension officers or ICAR/TNAU advisories for precise recommendations.");

    return {
      text: fallbackText,
      source: contextText ? `Verified Knowledge Base • ${primarySource}` : 'SmartFarm AI Advisor',
      usedModel: 'Knowledge Base Fallback',
    };
  }

  // Build system instruction & prompt
  const langName = normLang === 'ta' ? 'Tamil (தமிழ்)' : 'English';
  const systemInstruction = contextText
    ? `You are the SmartFarm AI Agricultural Assistant, an expert decision support advisor for Indian and global farming.
Scope: You support ALL agriculture questions. Ground your answer primarily in the provided Verified Agricultural Knowledge Base context.
Language & Script Directive:
- You MUST respond strictly in ${langName}.
- If Tamil (ta) is selected, provide your complete response in natural, fluent, grammatically correct, farmer-friendly Tamil script (தமிழ்).
- If English (en) is selected, provide your response in clear, concise English.
- Tanglish Comprehension: Farmers may ask questions in Tanglish (Tamil words written in English/Latin script, e.g. 'tomato ku eppo water kudukanum?', 'nel payiruku enna fertilizer use panlam?'). You MUST understand Tanglish questions accurately and respond in the selected language.
Source Integrity Directive:
- Ground specific disease and crop management in the provided Verified Knowledge Base context.
- Do NOT invent institutional citations unless explicitly present in the retrieved context.
Structuring Directive:
Keep answers practical and structured:
1. Identification & Cause (அறிகுறிகள் & காரணங்கள்)
2. Recommended Management & Remedies (மேலாண்மை முறைகள் & தீர்வுகள்)
3. Preventive & Cultural Practices (வருமுன் காக்கும் மேலாண்மை & பராமரிப்பு)
Safety Note: Mention that exact dosages and application may vary based on crop variety, growth stage, soil conditions, and local agricultural extension guidance.
Tone: Respectful, reassuring, practical, and farmer-first.`
    : `You are the SmartFarm AI Agricultural Assistant, a comprehensive general agricultural expert assisting farmers with ALL crops (cereals like rice, wheat, maize; cash crops like sugarcane, cotton; fruits like banana, mango, citrus; vegetables like onion, chilli, tomato, potato, brinjal, okra; pulses, oilseeds, spices), soil science, irrigation, fertilizers, weather impacts, and agronomy.
Scope Directive:
- You support ANY agricultural question asked by the farmer. Never restrict answers to Solanaceae crops.
- Never tell the farmer you only answer tomato, potato, or brinjal questions. Never reject a valid agricultural inquiry.
Language & Script Directive:
- You MUST respond strictly in ${langName}.
- If Tamil (ta) is selected, provide your complete response in natural, fluent, grammatically correct, farmer-friendly Tamil script (தமிழ்).
- If English (en) is selected, provide your response in clear, concise English.
- Tanglish Comprehension: Farmers may ask questions in Tanglish (Tamil words written in English/Latin script, e.g. 'tomato ku eppo water kudukanum?', 'nel payiruku enna fertilizer use panlam?', 'chilli ilai manjal aaguthu enna pannanum?'). You MUST understand Tanglish questions accurately and respond in the selected language.
Agricultural Accuracy & Safety Directive:
- Provide sound, practical agronomic guidance.
- Do NOT invent exact chemical dosages or institutional citations.
- For fertilizers and pesticides, explain active ingredients or general guidelines, and advise following product labels and local agricultural extension / TNAU / ICAR recommendations.
Response Formatting:
- Keep answers farmer-friendly: brief explanation + key action steps + practical advice.
Tone: Helpful, respectful, practical, scientific yet accessible, and farmer-first.`;

  const userPrompt = contextText
    ? `${historyPromptSection}VERIFIED AGRICULTURAL KNOWLEDGE BASE CONTEXT:\n----------------------------------------\n${contextText}\n----------------------------------------\n\nFARMER QUESTION: ${message}\n\nPlease provide your verified agricultural advice in ${langName}.`
    : `${historyPromptSection}FARMER QUESTION: ${message}\n\nPlease provide your expert agricultural advice in ${langName}.`;

  // Candidate models matching backend/routes/chat.py
  const configuredModel = (process.env.LLM_MODEL || 'gemini-3.8-flash').trim();
  const candidateModels = [
    configuredModel,
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];
  const uniqueModels = [...new Set(candidateModels)];

  let aiText = null;
  let usedModel = uniqueModels[0];
  let lastError = null;

  for (const model of uniqueModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
          },
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(25000) : undefined,
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data?.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text) {
          aiText = text.trim();
          usedModel = model;
          break;
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        lastError = errData?.error?.message || `HTTP ${response.status}`;
        continue;
      }
    } catch (err) {
      lastError = err?.message || err;
      continue;
    }
  }

  if (!aiText) {
    console.warn('[Gemini Chat] API calls failed on candidate models:', lastError);
    if (contextText) {
      return {
        text: normLang === 'ta'
          ? `குறிப்பு: நேரடி AI சேவை தற்காலிகமாக இணைக்கப்படவில்லை. வேளாண் தரவுத்தள பரிந்துரைகள்:\n\n${contextText}`
          : `Note: Direct AI model inference is temporarily unavailable. Verified Knowledge Base recommendations:\n\n${contextText}`,
        source: `Verified Knowledge Base • ${primarySource}`,
        usedModel: 'Knowledge Base Fallback',
      };
    }

    return {
      text: normLang === 'ta'
        ? 'மன்னிக்கவும், AI விவசாய ஆலோசனை சேவையை தற்போது இணைக்க முடியவில்லை. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
        : 'Agricultural advisory service is temporarily unavailable. Please try again in a few moments.',
      source: 'System Notice',
      usedModel: 'Fallback',
    };
  }

  // Accurate source label
  const sourceLabel = contextText
    ? `Verified Knowledge Base • ${primarySource}`
    : `SmartFarm AI Advisor • ${usedModel}`;

  return {
    text: aiText,
    source: sourceLabel,
    usedModel,
  };
}

export async function handleGeminiChat(req, res, rawBody) {
  const cleanPath = (req.query?.path || '').toString().replace(/^\/+/, '');

  // Handle status check endpoint
  if (cleanPath.endsWith('/status') || cleanPath === 'status') {
    const key = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || '';
    return res.status(200).json({
      status: 'online',
      gemini_sdk_available: true,
      api_key_configured: Boolean(key),
      configured_model: process.env.LLM_MODEL || 'gemini-3.8-flash',
      rag_knowledge_base_size: AGRICULTURAL_KNOWLEDGE_BASE.length,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      status: 'method_not_allowed',
      message: 'Chat endpoint only accepts POST requests.',
    });
  }

  try {
    let payload = {};
    if (rawBody && rawBody.length > 0) {
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        payload = {};
      }
    }

    const message = (payload.message || '').trim();
    const language = payload.language === 'ta' ? 'ta' : 'en';
    const history = Array.isArray(payload.history) ? payload.history : [];

    if (!message) {
      return res.status(400).json({
        success: false,
        status: 'bad_request',
        message: 'Question message cannot be empty.',
      });
    }

    const advice = await executeRagGeminiQuery(message, language, history);

    return res.status(200).json({
      id: Date.now(),
      sender: 'ai',
      text: advice.text,
      source: advice.source,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (error) {
    console.error('[Gemini Chat] Handler error:', error?.message || error);
    return res.status(500).json({
      success: false,
      status: 'gemini_unavailable',
      message: 'AI assistant service error. Please try again.',
    });
  }
}
