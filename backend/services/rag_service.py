"""
SmartFarm AI - Agricultural RAG (Retrieval-Augmented Generation) Service
Maintains verified agricultural knowledge base across Solanaceae, Cereals, Cash Crops,
Horticulture, Oilseeds, and Vegetables (TNAU, ICAR, and Government extension standards)
and performs crop-first context retrieval to ground LLM responses with verified agronomic facts.
"""

import re
from typing import List, Dict, Any, Optional

# ==============================================================================
# VERIFIED AGRICULTURAL KNOWLEDGE BASE (TNAU & ICAR Standards)
# ==============================================================================
AGRICULTURAL_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    # --------------------------------------------------------------------------
    # 1. TOMATO (Solanaceae)
    # --------------------------------------------------------------------------
    {
        "id": "KB-TOM-01",
        "crop": "Tomato",
        "cropTa": "தக்காளி",
        "category": "Nutrient Deficiencies & Physiological Disorders",
        "titleEn": "Causes & Management of Yellow Leaves (Chlorosis) in Tomato Plants",
        "titleTa": "தக்காளி செடிகளில் இலைகள் மஞ்சள் நிறமாக மாறுவதற்கான காரணங்கள் மற்றும் மேலாண்மை",
        "keywords": [
            "yellow", "leaves", "yellowing", "chlorosis", "tomato", "causes",
            "pale", "nitrogen", "waterlogging", "overwatering", "magnesium", "iron",
            "மஞ்சள்", "இலைகள்", "தக்காளி", "நைட்ரஜன்", "பாசனம்"
        ],
        "contentEn": (
            "Yellow leaves (chlorosis) in tomato plants are caused by several distinct physiological and biotic factors:\n\n"
            "1. Nitrogen (N) Deficiency (Most Common Soil Cause):\n"
            "   - Symptoms: Older, lower leaves turn uniformly pale green and then bright yellow first. "
            "The yellowing progresses upwards to newer foliage. Plant growth is stunted and stems become thin and fibrous.\n"
            "   - Remedy: Side-dress with well-decomposed Farmyard Manure (FYM) or vermicompost. "
            "Apply water-soluble NPK 19:19:19 foliar spray at 4-5g per liter of water, or drench root zone with balanced nitrogen fertilizer.\n\n"
            "2. Overwatering and Poor Soil Drainage (Root Suffocation):\n"
            "   - Symptoms: Lower leaves turn yellow, appear limp or droopy, and roots develop brown water-logged tips due to oxygen starvation. "
            "Even though soil is wet, the plant cannot absorb nutrients.\n"
            "   - Remedy: Allow top 2 inches of root-zone soil to dry out between watering rounds. "
            "Maintain soil moisture at 60-65% capacity. Ensure ridges have unobstructed drainage furrows.\n\n"
            "3. Early Blight (Alternaria solani) Disease:\n"
            "   - Symptoms: Lower leaves develop dark brown spots with concentric target rings, surrounded by prominent bright yellow halos. "
            "Eventually affected leaves wither and drop.\n"
            "   - Remedy: Prune off lower yellowed and spotted leaves touching the ground. "
            "Spray Mancozeb 75% WP (2g/L) or Chlorothalonil (2g/L) in the early morning.\n\n"
            "4. Magnesium (Mg) & Micronutrient Deficiency:\n"
            "   - Symptoms: Interveinal chlorosis where leaf veins remain dark green while leaf tissue between veins turns yellow (on older leaves for Magnesium; on new upper leaves for Iron).\n"
            "   - Remedy: Foliar spray of Magnesium Sulphate (Epsom Salt) at 5g/L of water or micronutrient mixture (TNAU Tomato Micronutrient @ 5g/L).\n\n"
            "5. Tomato Leaf Curl Virus (ToLCV):\n"
            "   - Symptoms: Upward curling and crinkling of leaf margins accompanied by chlorosis and severe stunting.\n"
            "   - Remedy: Vector is Whitefly (Bemisia tabaci). Install yellow sticky traps (15 traps/acre) and spray Neem seed kernel extract (NSKE 5%) or Imidacloprid (0.3ml/L)."
        ),
        "contentTa": (
            "தக்காளி செடிகளில் இலைகள் மஞ்சள் நிறமாக மாறுவதற்கு முக்கிய காரணங்கள்:\n\n"
            "1. தழைச்சத்து (நைட்ரஜன்) குறைபாடு:\n"
            "   - அறிகுறிகள்: கீழ் பகுதியில் உள்ள முதிர்ந்த இலைகள் முதலில் வெளிர் பச்சை நிறமாகி பின் மஞ்சள் நிறமாக மாறும். வளர்ச்சி குன்றி தண்டு மெலிந்து காணப்படும்.\n"
            "   - தீர்வு: ஏக்கருக்கு மக்கிய தொழு உரம் அல்லது மண்புழு உரம் இடவும். NPK 19:19:19 உரத்தை லிட்டருக்கு 4-5 கிராம் வீதம் தண்ணீரில் கலந்து இலைகளில் தெளிக்கவும்.\n\n"
            "2. அதிக நீர் தேங்குதல் (வேர் மூச்சுத்திணறல்):\n"
            "   - அறிகுறிகள்: வேர் பகுதியில் அதிக நீர் தேங்குவதால் ஆக்ஸிஜன் பற்றாக்குறை ஏற்பட்டு சத்துக்களை உறிஞ்ச முடியாமல் இலைகள் மஞ்சளாகி தொங்கும்.\n"
            "   - தீர்வு: பாசன அளவை சீராக்கி மண் ஈரப்பதத்தை 60-65% என்ற அளவில் பராமரிக்கவும். பாத்திகளில் தேங்கும் நீரை வடிக்கவும்.\n\n"
            "3. ஏர்லி பிளைட் இலைக்கருகல் நோய் (Alternaria solani):\n"
            "   - அறிகுறிகள்: கீழ் இலைகளில் கருப்பு-பழுப்பு வளையப் புள்ளிகள் தோன்றி, சுற்றிலும் மஞ்சள் நிற வளையம் காணப்படும்.\n"
            "   - தீர்வு: பாதிக்கப்பட்ட கீழ் இலைகளை வெட்டி அகற்றவும். மேன்கோசெப் 75% WP (2g/L) பூஞ்சாணக்கொல்லி தெளிக்கவும்.\n\n"
            "4. மெக்னீசியம் / நுண்ணூட்டச்சத்து பற்றாக்குறை:\n"
            "   - அறிகுறிகள்: இலை நரம்புகள் பச்சையாக இருக்க, இடைப்பட்ட பகுதிகள் மஞ்சளாதல் (நரம்பிடை மஞ்சளாதல்).\n"
            "   - தீர்வு: மெக்னீசியம் சல்பேட் (Epsom salt) 5 கிராம்/லிட்டர் அல்லது நுண்ணூட்ட கலவை தெளிக்கவும்."
        ),
        "tnauReference": "TNAU Agritech Portal - Tomato Crop Protection & Nutrient Management Guide"
    },
    {
        "id": "KB-TOM-02",
        "crop": "Tomato",
        "cropTa": "தக்காளி",
        "category": "Fungal & Bacterial Diseases",
        "titleEn": "Tomato Late Blight & Early Blight Diagnostic and Treatment",
        "titleTa": "தக்காளி லேட் பிளைட் மற்றும் ஏர்லி பிளைட் நோய் மேலாண்மை",
        "keywords": [
            "late blight", "early blight", "phytophthora", "alternaria", "blight", "fungal",
            "spots", "lesions", "mancozeb", "copper", "லேட் பிளைட்", "பூஞ்சை", "புள்ளிகள்"
        ],
        "contentEn": (
            "Tomato Blight Diseases:\n"
            "1. Late Blight (Phytophthora infestans):\n"
            "   - High ambient humidity (>75%) and cool temperatures (18-24°C) trigger rapid water-soaked, dark purplish-brown lesions with white fuzzy mold on leaf undersides.\n"
            "   - Management: Apply Copper Oxychloride 50% WP (3g/L) or Mancozeb 75% WP (2g/L) preventatively. Under high disease pressure, use systemic Metalaxyl + Mancozeb (2g/L) or Cymoxanil + Mancozeb.\n"
            "2. Early Blight (Alternaria solani):\n"
            "   - Concentric dark brown target rings on older foliage with yellow margins.\n"
            "   - Management: Chlorothalonil 2g/L or Azoxystrobin 1ml/L. Avoid overhead splash irrigation."
        ),
        "contentTa": (
            "தக்காளி பிளைட் நோய்கள்:\n"
            "1. லேட் பிளைட் (Phytophthora infestans): அதிக ஈரப்பதம் (>75%) மற்றும் குளிர்ந்த காலநிலையில் இலைகளில் நீர் கோர்த்த கருமை புள்ளிகள் மற்றும் வெள்ளை பூஞ்சை படரும். காப்பர் ஆக்ஸிகுளோரைடு (3g/L) அல்லது மேன்கோசெப் (2g/L) தெளிக்கவும்.\n"
            "2. ஏர்லி பிளைட்: வளைய வடிவ கருப்பு புள்ளிகள். குளோரோதலோனில் (2g/L) தெளிக்கவும்."
        ),
        "tnauReference": "TNAU Crop Protection Compendium - Solanaceae Blights"
    },
    {
        "id": "KB-TOM-03",
        "crop": "Tomato",
        "cropTa": "தக்காளி",
        "category": "Pest Management",
        "titleEn": "Tomato Fruit Borer, Whitefly & Leafminer Management",
        "titleTa": "தக்காளி காய் துளைப்பான் மற்றும் வெள்ளை ஈ பூச்சி மேலாண்மை",
        "keywords": [
            "fruit borer", "whitefly", "leafminer", "pest", "caterpillar", "borer", "neem", "trap",
            "காய் துளைப்பான்", "வெள்ளை ஈ", "பூச்சி மேலாண்மை"
        ],
        "contentEn": (
            "Integrated Pest Management for Tomato:\n"
            "1. Fruit Borer (Helicoverpa armigera):\n"
            "   - Larvae bore into developing fruits creating circular holes. Install 12 Helicoverpa pheromone traps/acre. Spray Bacillus thuringiensis (Bt) @ 2g/L or Chlorantraniliprole 18.5% SC @ 0.3ml/L.\n"
            "2. Whiteflies (Bemisia tabaci):\n"
            "   - Vectors Tomato Leaf Curl Virus. Install yellow sticky traps @ 15/acre. Spray Neem oil (NSKE 5%) or Acetamiprid 20% SP @ 0.2g/L.\n"
            "3. Leafminers (Liriomyza trifolii):\n"
            "   - Serpentine white mines on foliage. Spray Neem Seed Kernel Extract (NSKE 5%) or Spinosad @ 0.4ml/L."
        ),
        "contentTa": (
            "தக்காளி ஒருங்கிணைந்த பூச்சி மேலாண்மை:\n"
            "1. காய் துளைப்பான்: ஏக்கருக்கு 12 இனக்கவர்ச்சி பொறிகள் வைக்கவும். பேசிலஸ் துரிஞ்சியென்சிஸ் (Bt 2g/L) அல்லது குளோரான்ட்ரனிலிப்ரோல் (0.3ml/L) தெளிக்கவும்.\n"
            "2. வெள்ளை ஈ: மஞ்சள் ஒட்டுப் பொறிகள் வைக்கவும். வேப்பங்கொட்டை சாறு (NSKE 5%) தெளிக்கவும்."
        ),
        "tnauReference": "TNAU Department of Agricultural Entomology"
    },

    # --------------------------------------------------------------------------
    # 2. POTATO (Solanaceae)
    # --------------------------------------------------------------------------
    {
        "id": "KB-POT-01",
        "crop": "Potato",
        "cropTa": "உருளைக்கிழங்கு",
        "category": "Crop Production & Disease Management",
        "titleEn": "Potato Early Blight, Late Blight & Tuber Quality Protection",
        "titleTa": "உருளைக்கிழங்கு இலைக்கருகல் நோய் மற்றும் கிழங்கு சேமிப்பு",
        "keywords": [
            "potato", "early blight", "late blight", "tuber", "earthing", "rot", "alternaria",
            "உருளைக்கிழங்கு", "கிழங்கு", "பிளைட்", "மண் அணைத்தல்"
        ],
        "contentEn": (
            "Potato Agronomic & Disease Best Practices:\n"
            "1. Foliage Blight Control: Alternaria solani produces target spots on leaves. Spray Chlorothalonil 2g/L or Mancozeb 2g/L.\n"
            "2. Greening Prevention: Mound soil (earthing-up) at 30-35 days to prevent sunlight from creating bitter solanine in shallow tubers.\n"
            "3. Dehaulming: Cut vines 10 days before digging to cure and toughen tuber skin.\n"
            "4. Storage: Cure dug tubers in shade at 15°C with 85% RH for 10 days before cold room storage."
        ),
        "contentTa": (
            "உருளைக்கிழங்கு சாகுபடி மற்றும் நோய் பாதுகாப்பு:\n"
            "1. இலைக்கருகல்: மேன்கோசெப் அல்லது குளோரோதலோனில் 2g/L தெளிக்கவும்.\n"
            "2. மண் அணைத்தல்: கிழங்குகள் சூரிய ஒளியில் பச்சையாவதைத் தடுக்க 30-35 நாளில் மண் அணைக்கவும்.\n"
            "3. தண்டு வெட்டுதல் (Dehaulming): அறுவடைக்கு 10 நாட்களுக்கு முன் தண்டுப் பகுதியை வெட்டி அகற்றவும்."
        ),
        "tnauReference": "Horticultural Research Station Ooty / TNAU Potato Production Guide"
    },

    # --------------------------------------------------------------------------
    # 3. BRINJAL (Solanaceae)
    # --------------------------------------------------------------------------
    {
        "id": "KB-BRN-01",
        "crop": "Brinjal",
        "cropTa": "கத்தரிக்காய்",
        "category": "Pest & Disease Management",
        "titleEn": "Brinjal Shoot & Fruit Borer, Little Leaf & Cercospora Leaf Spot",
        "titleTa": "கத்தரி தண்டு மற்றும் காய் துளைப்பான், சிறிய இலை நோய் மேலாண்மை",
        "keywords": [
            "brinjal", "eggplant", "shoot borer", "fruit borer", "little leaf", "cercospora", "cercospora leaf spot",
            "கத்தரிக்காய்", "துளைப்பான்", "சிறிய இலை நோய்", "சர்கோஸ்போரா"
        ],
        "contentEn": (
            "Brinjal Crop Health Management:\n"
            "1. Shoot & Fruit Borer (Leucinodes orbonalis):\n"
            "   - Wilted terminal shoots and bored fruits with frass. Clip and burn infested shoots weekly. Install Lucinure pheromone traps @ 12/acre. Spray Emamectin Benzoate 5% SG @ 0.4g/L.\n"
            "2. Little Leaf Disease (Phytoplasma):\n"
            "   - Severe leaf size reduction, leaves become phyllodic and bush-like. Vector is leafhopper (Hishimonus phycitis). Rogue out affected plants immediately and spray Dimethoate 30% EC (1.5ml/L) or Imidacloprid 17.8% SL (0.3ml/L).\n"
            "3. Cercospora Leaf Spot (Cercospora melongenae):\n"
            "   - Circular to irregular spots with grayish centers and dark brown margins. Spray Carbendazim 12% + Mancozeb 63% WP (2g/L) or Chlorothalonil 75% WP (2g/L)."
        ),
        "contentTa": (
            "கத்தரிக்காய் பயிர் பாதுகாப்பு:\n"
            "1. தண்டு மற்றும் காய் துளைப்பான்: வாடிய நுனித் தண்டுகளை வாரம் ஒருமுறை வெட்டி அழிக்கவும். ஏக்கருக்கு 12 மோகப் பொறிகள் வைக்கவும்.\n"
            "2. சிறிய இலை நோய்: தாக்கப்பட்ட செடிகளை உடனே பிடுங்கி அழிக்கவும். தத்துப்பூச்சியை கட்டுப்படுத்த மருந்து தெளிக்கவும்.\n"
            "3. சர்கோஸ்போரா இலைப்புள்ளி: கார்பென்டாசிம் + மேன்கோசெப் 2g/L தெளிக்கவும்."
        ),
        "tnauReference": "TNAU Centre for Plant Protection Studies - Brinjal Pest Management"
    },
    {
        "id": "KB-BRN-02",
        "crop": "Brinjal",
        "cropTa": "கத்தரிக்காய்",
        "category": "Bacterial Diseases",
        "titleEn": "Brinjal Bacterial Wilt, Bacterial Blight & Bacterial Leaf Spot Management",
        "titleTa": "கத்தரிக்காய் பாக்டீரியா வாடல், பாக்டீரியா கருகல் மற்றும் இலைப்புள்ளி மேலாண்மை",
        "keywords": [
            "bacterial blight", "bacterial leaf spot", "bacterial wilt", "ralstonia", "pseudomonas", "xanthomonas",
            "brinjal", "eggplant", "wilt", "blight", "பாக்டீரியா வாடல்", "பாக்டீரியா கருகல்", "கத்தரி"
        ],
        "contentEn": (
            "Brinjal Bacterial Disease Diagnosis & Management (TNAU & ICAR Guidelines):\n"
            "1. Bacterial Wilt (Ralstonia solanacearum):\n"
            "   - Symptoms: Rapid and sudden wilting of foliage during warm hours without significant prior yellowing. Vascular browning in split stems. White bacterial streaming observed from cut stem in water.\n"
            "   - Management: Drench root zone with Copper Oxychloride 50% WP (2.5g/L) or Streptocycline (1g/10L). Root-dip seedlings in Pseudomonas fluorescens (10g/L) before transplanting. Plant resistant varieties like Pant Samrat or Surya.\n"
            "2. Bacterial Blight (Pseudomonas / Xanthomonas spp.):\n"
            "   - Symptoms: Dark, water-soaked necrotic lesions along leaf margins spreading inward causing blight and leaf scorching.\n"
            "   - Management: Foliar spray of Copper Oxychloride (2.5g/L) combined with Streptocycline (100 ppm) at early disease onset. Maintain proper field drainage.\n"
            "3. Bacterial Leaf Spot (Xanthomonas campestris pv. vesicatoria):\n"
            "   - Symptoms: Small, angular, dark brown water-soaked spots with yellow chlorotic halos on foliage.\n"
            "   - Management: Spray Copper Hydroxide (2g/L) or Mancozeb + Copper Oxychloride (2g/L). Avoid overhead sprinkle irrigation."
        ),
        "contentTa": (
            "கத்தரிக்காய் பாக்டீரியா நோய் மேலாண்மை:\n"
            "1. பாக்டீரியா வாடல்: செடிகள் திடீரென வாடி காய்ந்துவிடும். தண்டுப் பகுதியை நீரில் வைத்தால் பாக்டீரியா கசிவு தெரியும். காப்பர் ஆக்ஸிகுளோரைடு (2.5g/L) வேர் நனைத்தல் செய்யவும்.\n"
            "2. பாக்டீரியா கருகல்: இலை ஓரங்களில் நீர் கோர்த்த கருமை கருகல் புள்ளிகள். காப்பர் ஆக்ஸிகுளோரைடு + ஸ்ட்ரெப்டோமைசின் தெளிக்கவும்.\n"
            "3. பாக்டீரியா இலைப்புள்ளி: மஞ்சள் வளையத்துடன் கூடிய பழுப்பு நிற புள்ளிகள். மேன்கோசெப் தெளிக்கவும்."
        ),
        "tnauReference": "TNAU Agritech Portal - Brinjal Crop Protection Compendium"
    },
    {
        "id": "KB-BRN-03",
        "crop": "Brinjal",
        "cropTa": "கத்தரிக்காய்",
        "category": "Viral & Fungal Foliar Diseases",
        "titleEn": "Brinjal Mosaic Virus & Powdery Mildew Management",
        "titleTa": "கத்தரிக்காய் மொசைக் வைரஸ் மற்றும் சாம்பல் நோய் மேலாண்மை",
        "keywords": [
            "mosaic virus", "mosaic", "powdery mildew", "leveillula", "aphid", "mildew", "brinjal",
            "eggplant", "மொசைக் வைரஸ்", "சாம்பல் நோய்", "கத்தரி"
        ],
        "contentEn": (
            "Brinjal Mosaic Virus & Powdery Mildew Control (TNAU & ICAR Guidelines):\n"
            "1. Brinjal Mosaic Virus:\n"
            "   - Symptoms: Mosaic mottling with alternating light green and dark green patches, leaf blistering, vein clearing, distorted crinkled leaves, and stunted plant growth.\n"
            "   - Vector: Transmitted primarily by aphids (Aphis gossypii). Non-persistent transmission.\n"
            "   - Management: Rogue out and destroy early infected plants immediately to prevent field spread. Install yellow sticky traps (15/acre). Spray Neem Seed Kernel Extract (NSKE 5%) or Thiamethoxam 25% WG (0.3g/L) or Dimethoate 30% EC (1.5ml/L) to control aphid vectors. Destroy solanaceous weed reservoirs around borders.\n"
            "2. Powdery Mildew (Leveillula taurica):\n"
            "   - Symptoms: White to grayish powdery fungal patches on lower and upper leaf surfaces, causing yellowing and premature defoliation under dry, warm conditions.\n"
            "   - Management: Spray Wettable Sulphur 80% WP (2.5g/L) or Dinocap 48% EC (1ml/L) or Azoxystrobin 23% SC (1ml/L). Repeat after 14 days if needed."
        ),
        "contentTa": (
            "கத்தரிக்காய் மொசைக் வைரஸ் மற்றும் சாம்பல் நோய் மேலாண்மை:\n"
            "1. மொசைக் வைரஸ்: இலைகளில் வெளிர் மற்றும் அடர் பச்சை நிற திட்டுகள் (மொசைக் வடிவம்), இலை சுருங்குதல். அசுவினி பூச்சியால் பரவுகிறது. பாதிக்கப்பட்ட செடிகளை பிடுங்கி எரிக்கவும். வேப்ப எண்ணெய் (NSKE 5%) அல்லது தயமீதாக்சம் தெளிக்கவும்.\n"
            "2. சாம்பல் நோய்: இலைகளின் மேற்பரப்பில் வெள்ளை சாம்பல் போன்ற பூஞ்சை படர்தல். நனையும் கந்தகம் (2.5g/L) தெளிக்கவும்."
        ),
        "tnauReference": "TNAU Centre for Plant Protection Studies - Brinjal Disease Management"
    },
    {
        "id": "KB-BRN-04",
        "crop": "Brinjal",
        "cropTa": "கத்தரிக்காய்",
        "category": "Crop Production & Canopy Health",
        "titleEn": "Healthy Brinjal Crop Maintenance & Optimal Agronomic Practices",
        "titleTa": "ஆரோக்கியமான கத்தரி சாகுபடி மற்றும் ஊட்டச்சத்து மேலாண்மை",
        "keywords": [
            "healthy", "brinjal", "eggplant", "nutrition", "fertilizer", "canopy", "yield",
            "ஆரோக்கியமான", "கத்தரி", "உர மேலாண்மை"
        ],
        "contentEn": (
            "Healthy Brinjal Crop Maintenance Guide (TNAU Recommendations):\n"
            "1. Foliage Characteristics: Uniform vibrant green foliage with robust stem development and balanced branching without chlorotic, necrotic, or distorted lesions.\n"
            "2. Nutrition Management: Apply balanced NPK at 100:50:50 kg/ha. Apply 50% N and full P & K as basal; top dress remaining N in two equal splits at 30 and 45 days after transplanting.\n"
            "3. Irrigation & Soil Health: Maintain soil moisture at 60-65% through drip irrigation. Mulch with silver-black plastic or dry crop residue to conserve moisture and suppress weeds.\n"
            "4. Preventative Bio-stimulation: Spray Panchagavya 3% (30ml/L) or Vermiwash (50ml/L) at 20-day intervals to boost natural immunity and flowering."
        ),
        "contentTa": (
            "ஆரோக்கியமான கத்தரி பயிர் பராமரிப்பு:\n"
            "1. ஆரோக்கியமான இலைகள்: சீரான அடர் பச்சை நிற இலைகள் மற்றும் நல்ல கிளை அமைப்பு.\n"
            "2. உர மேலாண்மை: ஏக்கருக்கு பரிந்துரைக்கப்பட்ட NPK உரமிட்டு, 30 மற்றும் 45ம் நாட்களில் மேலுரம் இடவும்.\n"
            "3. பாசனம்: சொட்டுநீர் பாசனம் மூலம் சீரான ஈரப்பதம் பராமரிக்கவும்; இயற்கை நோய் எதிர்ப்பு சக்தியை அதிகரிக்க பஞ்சகாவ்யா தெளிக்கவும்."
        ),
        "tnauReference": "TNAU Horticulture Crop Production Guide - Brinjal"
    },

    # --------------------------------------------------------------------------
    # 4. ALL SOLANACEAE (Soil, Irrigation & Organic)
    # --------------------------------------------------------------------------
    {
        "id": "KB-GEN-01",
        "crop": "All Solanaceae",
        "cropTa": "அனைத்து சோலனேசிய பயிர்கள்",
        "category": "Soil, Irrigation & Organic Remedies",
        "titleEn": "Optimal Solanaceae Soil, Drip Irrigation & Organic Bio-controls",
        "titleTa": "மண் வளம், சொட்டுநீர்ப் பாசனம் மற்றும் இயற்கை வேளாண் முறைகள்",
        "keywords": [
            "soil", "irrigation", "drip", "organic", "panchagavya", "trichoderma", "pseudomonas", "moisture",
            "மண்", "பாசனம்", "இயற்கை", "பஞ்சகாவ்யா", "டிரைக்கோடெர்மா"
        ],
        "contentEn": (
            "Solanaceae Farm Management Best Practices:\n"
            "1. Soil Preparation: Deep ploughing with 10 tonnes FYM compost + 2kg Trichoderma viride per acre to suppress soil-borne pathogens.\n"
            "2. Root-Zone Drip Irrigation: Solanaceae crops require 60-70% soil moisture. Avoid overhead watering to keep foliage dry and minimize fungal spore germination.\n"
            "3. Organic Bio-Protections:\n"
            "   - Spray Panchagavya 3% (30ml/L) as natural growth booster and plant immunity stimulant.\n"
            "   - Root dip seedlings in Pseudomonas fluorescens (5g/L) for 20 minutes prior to transplanting to prevent bacterial wilt."
        ),
        "contentTa": (
            "சோலனேசிய பயிர்களுக்கான இயற்கை மேலாண்மை:\n"
            "1. மண் தயாரிப்பு: ஏக்கருக்கு 10 டன் தொழு உரம் மற்றும் 2 கிலோ டிரைக்கோடெர்மா விரிடி இடவும்.\n"
            "2. சொட்டுநீர்ப் பாசனம்: இலைகளில் நீர் தெளிக்காமல் வேர் பகுதியில் 60-70% ஈரப்பதம் பராமரிக்கவும்.\n"
            "3. இயற்கை வழிமுறைகள்: 3% பஞ்சகாவ்யா தெளிக்கவும்; நடுவதற்கு முன் நாற்றுகளின் வேர்களை சூடோமோனாஸ் கரைசலில் நனைக்கவும்."
        ),
        "tnauReference": "TNAU Organic Farming Guidelines & Bio-inputs Guide"
    },

    # --------------------------------------------------------------------------
    # 5. RICE / PADDY (Cereals)
    # --------------------------------------------------------------------------
    {
        "id": "KB-RIC-01",
        "crop": "Rice",
        "cropTa": "நெல்",
        "category": "Crop Production, Nutrition & Pest Management",
        "titleEn": "Rice (Paddy) Nutrient Management, Water Scheduling & Pest Protection",
        "titleTa": "நெல் பயிர் உர மேலாண்மை, நீர் நிர்வாகம் மற்றும் பயிர் பாதுகாப்பு",
        "keywords": [
            "rice", "paddy", "fertilizer", "nutrient", "urea", "dap", "potash", "blast", "stem borer",
            "tillering", "panicle", "khaira", "zinc", "நெல்", "உரம்", "யூரியா", "குலைநோய்", "தண்டுத்துளைப்பான்"
        ],
        "contentEn": (
            "Rice (Paddy) Agronomic and Crop Protection Guidelines (TNAU & ICAR Standards):\n\n"
            "1. Soil & Climate:\n"
            "   - Heavy clayey loams or alluvial soils with high water retention capacity (pH 5.5–7.5). Warm, humid tropical climate with ample sunlight.\n\n"
            "2. Nutrient Management (Split Application):\n"
            "   - Basal Dose: Incorporate well-decomposed FYM (12.5 t/ha). Apply full Phosphorus (e.g., SSP or DAP), full or 50% Potassium (MOP), and 25% Nitrogen (Urea) at final puddling.\n"
            "   - First Top Dressing (Active Tillering Stage, 20–25 days after transplanting): Apply 35% Nitrogen to promote healthy tiller formation.\n"
            "   - Second Top Dressing (Panicle Initiation Stage, 40–45 DAT): Apply remaining Nitrogen and Potassium to ensure complete grain filling.\n"
            "   - Zinc Deficiency (Khaira Disease): Manifests as rusty-brown pigmentation on lower leaves. Apply Zinc Sulphate as recommended by local extension.\n\n"
            "3. Water Management:\n"
            "   - Maintain shallow water layer (2–3 cm) during transplanting and early tillering.\n"
            "   - Increase depth to 5 cm during panicle initiation through flowering. Drain field 10–15 days before harvest to facilitate uniform ripening and mechanization.\n\n"
            "4. Major Diseases & Pests:\n"
            "   - Blast (Pyricularia oryzae): Spindle-shaped lesions with gray centers and brown margins on leaves, and neck blast at panicle base. Avoid excessive nitrogen. Spray Tricyclazole or Carbendazim per official recommendations.\n"
            "   - Yellow Stem Borer (Scirpophaga incertulas): Causes 'dead hearts' in vegetative stage and 'white ears' during heading. Install pheromone traps (5/acre); release Trichogramma egg parasitoids."
        ),
        "contentTa": (
            "நெல் சாகுபடி, உர மேலாண்மை மற்றும் பயிர் பாதுகாப்பு (TNAU & ICAR வழிகாட்டுதல்):\n\n"
            "1. மண் மற்றும் பருவம்:\n"
            "   - களிமண் கலந்த வண்டல் மண் சிறந்தது. அதிக நீர் தேக்கும் திறன் கொண்ட நிலம் தேவை.\n\n"
            "2. உர நிர்வாகம்:\n"
            "   - அடியுரம்: கடைசி உழவின் போது மக்கிய தொழு உரம், முழு மணிச்சத்து (DAP/SSP), பாதி சாம்பல் சத்து (MOP) மற்றும் 25% தழைச்சத்து (யூரியா) இடவும்.\n"
            "   - முதல் மேலுரம் (நட்ட 20-25 ஆம் நாள் - தூர் கட்டும் பருவம்): தழைச்சத்து இடவும்.\n"
            "   - இரண்டாம் மேலுரம் (நட்ட 40-45 ஆம் நாள் - கதிர் உருவாகும் பருவம்): மீதி தழைச்சத்து மற்றும் சாம்பல் சத்து இடவும்.\n"
            "   - துத்தநாகக் குறைபாடு: இலைகளில் துரு போன்ற பழுப்பு நிறப் புள்ளிகள் தோன்றும். துத்தநாக சல்பேட் இடவும்.\n\n"
            "3. நீர் நிர்வாகம்:\n"
            "   - நட்டவுடன் 2-3 செ.மீ அளவிலும், தூர் கட்டும் மற்றும் கதிர் வரும் பருவத்தில் 5 செ.மீ அளவிலும் நீர் நிறுத்தவும். அறுவடைக்கு 10 நாட்களுக்கு முன் நீரை வடிக்கவும்.\n\n"
            "4. முக்கிய நோய்கள் மற்றும் பூச்சிகள்:\n"
            "   - குலைநோய் (Blast): இலைகளில் கண் வடிவப் புள்ளிகள். அதிக தழைச்சத்து இடுவதைத் தவிர்க்கவும். ட்ரைசைக்ளசோல் தெளிக்கவும்.\n"
            "   - தண்டுத்துளைப்பான்: குருத்து காய்ந்து வெண்கதிர் தோன்றும். ஏக்கருக்கு 5 இனக்கவர்ச்சி பொறிகள் வைக்கவும்."
        ),
        "tnauReference": "TNAU Agritech Portal - Paddy Expert System & ICAR-NRRI"
    },

    # --------------------------------------------------------------------------
    # 6. SUGARCANE (Cash Crops)
    # --------------------------------------------------------------------------
    {
        "id": "KB-SUG-01",
        "crop": "Sugarcane",
        "cropTa": "கரும்பு",
        "category": "Crop Production, Irrigation & Disease Control",
        "titleEn": "Sugarcane Irrigation Scheduling, Nutrient Management & Pest Protection",
        "titleTa": "கரும்பு பாசன மேலாண்மை, உர நிர்வாகம் மற்றும் பயிர் பாதுகாப்பு",
        "keywords": [
            "sugarcane", "cane", "irrigation", "water", "fertilizer", "red rot", "shoot borer",
            "earthing", "mulching", "sucrose", "கரும்பு", "பாசனம்", "நீர்", "செவ்வழுகல்", "தண்டுத்துளைப்பான்"
        ],
        "contentEn": (
            "Sugarcane Production & Irrigation Scheduling (TNAU & ICAR-SBI Guidelines):\n\n"
            "1. Soil & Climate:\n"
            "   - Deep, fertile, well-drained loams or clay loams with pH 6.5–7.5. Warm tropical climate with ample sunshine for sucrose synthesis.\n\n"
            "2. Irrigation Scheduling (Four Distinct Phases):\n"
            "   - Total water requirement ranges between 1,500 to 2,500 mm over 10–12 months.\n"
            "   - Germination Phase (0–35 DAP): Light, frequent irrigation to keep soil moist; avoid waterlogging seed setts.\n"
            "   - Tillering / Formative Phase (35–120 DAP): Critical moisture stage. Irrigate every 7–10 days in clay soils, 5–7 days in sandy soils.\n"
            "   - Grand Growth Phase (120–250 DAP): Highest water consumption period. Maintain regular irrigation to avoid stem elongation stoppage.\n"
            "   - Maturity / Ripening Phase (250 DAP to harvest): Reduce irrigation frequency; stop watering 20–30 days prior to cutting to concentrate sucrose and prevent lodging.\n"
            "   - Water Saving: Drip irrigation or Alternate Furrow Irrigation (AFI) saves 30–40% water while preserving yield.\n\n"
            "3. Nutrient & Cultural Management:\n"
            "   - Apply NPK in splits: full Phosphorus basal; Nitrogen and Potassium split across basal, 30, 60, and 90–120 days during final earthing-up.\n"
            "   - Trash Mulching: Spread dried cane trash (5 tonnes/ha) between rows to reduce evaporation and suppress weed germination.\n\n"
            "4. Disease & Pest Protection:\n"
            "   - Red Rot (Colletotrichum falcatum): Third and fourth leaves turn yellow and wither; internal stem pith exhibits longitudinal reddening with white cross patches. Use disease-free certified seed setts; dip setts in Carbendazim before planting.\n"
            "   - Early Shoot Borer (Chilo infuscatellus): Produces dead hearts in young tillers. Practice timely earthing-up and trash mulching."
        ),
        "contentTa": (
            "கரும்பு சாகுபடி மற்றும் நீர் நிர்வாகம் (TNAU & ICAR-SBI வழிகாட்டுதல்):\n\n"
            "1. மண் மற்றும் பருவம்:\n"
            "   - நல்ல வடிகால் வசதியுள்ள செம்மண் மற்றும் வண்டல் மண் சிறந்தது. சர்க்கரைச்சத்து கூட நல்ல சூரிய வெளிச்சம் தேவை.\n\n"
            "2. பாசன மேலாண்மை (4 முக்கிய பருவங்கள்):\n"
            "   - முளைப்புப் பருவம் (0-35 நாட்கள்): மிதமான நீர் பாசனம்; நீர் தேங்கக்கூடாது.\n"
            "   - தூர் கட்டும் பருவம் (35-120 நாட்கள்): 7-10 நாட்களுக்கு ஒருமுறை பாசனம். வளர்ச்சிக்கு நீர் மிக அவசியம்.\n"
            "   - தீவிர வளர்ச்சிப் பருவம் (120-250 நாட்கள்): அதிக நீர் தேவைப்படும் காலம். தண்டு வளர்ச்சிக்கு தடையின்றி நீர் பாய்ச்சவும்.\n"
            "   - முதிர்ச்சிப் பருவம் (250 நாட்கள் முதல் அறுவடை வரை): சர்க்கரைச்சத்து அதிகரிக்க அறுவடைக்கு 25 நாட்களுக்கு முன் பாசனத்தை நிறுத்தவும்.\n"
            "   - சொட்டுநீர் பாசனம் அல்லது மாற்றுப்பால் பாசனம் நீர் விரயத்தை 30-40% குறைக்கும்.\n\n"
            "3. உர நிர்வாகம் மற்றும் சோகை மூடாக்கு:\n"
            "   - தழை, மணி, சாம்பல் சத்துக்களை பிரித்து இடவும். 90-120 ஆம் நாளில் இறுதி மண் அணைப்பு செய்யவும்.\n"
            "   - கரும்பு சோகை மூடாக்கு இடுவதால் ஈரப்பதம் காக்கப்பட்டு களைகள் கட்டுப்படும்.\n\n"
            "4. பயிர் பாதுகாப்பு:\n"
            "   - செவ்வழுகல் நோய் (Red Rot): நடு இலைகள் மஞ்சளாகி காய்ந்துவிடும்; தண்டை பிளந்து பார்த்தால் உட்பகுதி சிவப்பாக வெள்ளை திட்டுகளுடன் காணப்படும். ஆரோக்கியமான கரணைகளை தேர்வு செய்து நடவும்.\n"
            "   - தண்டுத்துளைப்பான்: இளம் பயிரில் குருத்து காய்ந்துவிடும். மண் அணைத்தல் மூலம் கட்டுப்படுத்தலாம்."
        ),
        "tnauReference": "TNAU Agritech Portal - Sugarcane Production Guide & ICAR-SBI"
    },

    # --------------------------------------------------------------------------
    # 7. CHILLI (Vegetables / Spices)
    # --------------------------------------------------------------------------
    {
        "id": "KB-CHL-01",
        "crop": "Chilli",
        "cropTa": "மிளகாய்",
        "category": "Nutrient Deficiencies, Pests & Disease Management",
        "titleEn": "Chilli Nutrient Management, Yellow Leaves (Chlorosis), Pest & Disease Control",
        "titleTa": "மிளகாய் உர நிர்வாகம், இலை மஞ்சள் நோய் மற்றும் பூச்சி மேலாண்மை",
        "keywords": [
            "chilli", "chili", "pepper", "yellow leaves", "chlorosis", "thrips", "mites", "leaf curl",
            "anthracnose", "fruit rot", "dieback", "மிளகாய்", "மஞ்சள் இலை", "இலைச்சுருட்டல்", "இலைப்பேண்"
        ],
        "contentEn": (
            "Chilli Agronomy, Chlorosis Causes and Crop Health (TNAU & ICAR-IIHR Guidelines):\n\n"
            "1. Soil & Drainage Requirements:\n"
            "   - Well-drained sandy loam or clay loam rich in organic matter (pH 6.5–7.5). Chilli is highly vulnerable to waterlogging, which quickly causes root asphyxiation.\n\n"
            "2. Causes & Management of Yellow Leaves (Chlorosis):\n"
            "   - Nitrogen Deficiency: Uniform pale-green to yellow discoloration of older lower leaves progressing upward. Top-dress with nitrogen or apply water-soluble 19:19:19 (4-5g/L) foliar spray.\n"
            "   - Waterlogging / Poor Drainage: Stagnant water deprives roots of oxygen; leaves turn limp yellow and drop. Ensure ridges have clear drainage furrows; allow top 2 inches of soil to dry between irrigations.\n"
            "   - Sucking Pests (Thrips & Mites): Thrips feed on leaf undersides, causing leaf margins to curl upward with yellowing; Mites cause downward curling (inverted boat shape) and bronze discoloration. Install yellow/blue sticky traps; spray Neem Seed Kernel Extract (NSKE 5%) or approved acaricides.\n"
            "   - Chilli Leaf Curl Virus: Transmitted by whitefly (Bemisia tabaci). Leaves become puckered, curl upward, and show chlorotic patches with severe stunting. Control whitefly vectors with yellow sticky traps and rogue out infected plants.\n\n"
            "3. Major Diseases:\n"
            "   - Anthracnose / Fruit Rot / Dieback (Colletotrichum capsici): Circular sunken spots with concentric black acervuli on ripe fruits; twigs die back from tips downward. Spray Copper Oxychloride (2.5g/L) or Mancozeb (2g/L) at early fruit development."
        ),
        "contentTa": (
            "மிளகாய் சாகுபடி, இலை மஞ்சள் காரணங்கள் மற்றும் பயிர் பாதுகாப்பு (TNAU & ICAR-IIHR வழிகாட்டுதல்):\n\n"
            "1. மண் மற்றும் வடிகால்:\n"
            "   - நல்ல வடிகால் வசதியுள்ள செம்மண் மற்றும் மணல் கலந்த வண்டல் மண் சிறந்தது. நீர் தேங்கினால் வேர் அழுகல் ஏற்பட்டு செடி காய்ந்துவிடும்.\n\n"
            "2. இலைகள் மஞ்சள் நிறமாவதற்கான காரணங்கள்:\n"
            "   - தழைச்சத்து குறைபாடு: கீழ் இலைகள் முதலில் மஞ்சளாகும். NPK 19:19:19 உரத்தை இலைகளில் தெளிக்கவும்.\n"
            "   - நீர் தேங்குதல்: வேருக்குக் காற்று கிடைக்காமல் இலைகள் மஞ்சளாகி உதிரும். பாத்திகளில் தேங்கும் நீரை உடனே வடிக்கவும்.\n"
            "   - இலைப்பேண் மற்றும் சிலந்தி தாக்குதல்: இலைப்பேணால் இலைகள் மேல்நோக்கி சுருண்டு மஞ்சளாகும்; சிலந்தியால் கீழ்நோக்கி சுருண்டு படகு போல மாறும். வேப்பெண்ணெய் (NSKE 5%) தெளிக்கவும்.\n"
            "   - இலைச்சுருட்டல் வைரஸ்: வெள்ளை ஈக்களால் பரவுகிறது. பாதிக்கப்பட்ட செடிகளை பிடுங்கி அழிக்கவும்; மஞ்சள் ஒட்டுப்பொறிகள் வைக்கவும்.\n\n"
            "3. கனி அழுகல் மற்றும் நுனிக்கருகல் நோய் (Anthracnose):\n"
            "   - பழுத்த மிளகாயில் வட்ட வடிவ கருப்புப் புள்ளிகள் தோன்றும்; கிளைகள் நுனியிலிருந்து கீழ்நோக்கி கருகும். காப்பர் ஆக்ஸிகுளோரைடு அல்லது மேன்கோசெப் தெளிக்கவும்."
        ),
        "tnauReference": "TNAU Agritech Portal - Chilli Crop Protection Compendium & ICAR-IIHR"
    },

    # --------------------------------------------------------------------------
    # 8. MAIZE (Cereals)
    # --------------------------------------------------------------------------
    {
        "id": "KB-MAI-01",
        "crop": "Maize",
        "cropTa": "மக்காச்சோளம்",
        "category": "Crop Production, Irrigation & Fall Armyworm Management",
        "titleEn": "Maize Production, Irrigation Critical Stages & Fall Armyworm Management",
        "titleTa": "மக்காச்சோளம் சாகுபடி, பாசன நிலைகள் மற்றும் படைப்புழு மேலாண்மை",
        "keywords": [
            "maize", "corn", "fall armyworm", "spodoptera", "tasseling", "silking", "downy mildew",
            "turcicum", "leaf blight", "மக்காச்சோளம்", "படைப்புழு", "பாசனம்"
        ],
        "contentEn": (
            "Maize Production & Crop Protection Guidelines (ICAR-IIMR & TNAU Standards):\n\n"
            "1. Soil & Climate:\n"
            "   - Deep, fertile, well-drained loams rich in organic matter with pH 6.0–7.5. Maize cannot tolerate waterlogging or severe drought.\n\n"
            "2. Critical Irrigation Stages:\n"
            "   - Knee-High Stage (30–35 DAS): Rapid vegetative stem growth.\n"
            "   - Tasseling Stage (45–50 DAS): Male flower emergence. Water stress inhibits pollen production.\n"
            "   - Silking & Cob Development Stage (60–70 DAS): Most critical moisture period. Drought stress here causes poor seed set and barren cobs.\n\n"
            "3. Major Pests & Integrated Management:\n"
            "   - Fall Armyworm (Spodoptera frugiperda): Larvae feed deep in leaf whorls, creating large ragged shot-holes and abundant sawdust-like frass. Management: Deep summer ploughing; intercrop with cowpea or pulses; install pheromone traps (5/acre); apply Bacillus thuringiensis (Bt) or Metarhizium anisopliae in early instars; apply approved insecticides directed into whorls if threshold is crossed.\n\n"
            "4. Major Diseases:\n"
            "   - Turcicum Leaf Blight (Exserohilum turcicum): Long, elliptical, grayish-green or tan lesions on foliage. Avoid dense planting; spray Mancozeb per official guidelines.\n"
            "   - Downy Mildew / Crazy Top: Chlorotic striping on leaves and abnormal tassel proliferation. Practice seed treatment with Metalaxyl."
        ),
        "contentTa": (
            "மக்காச்சோளம் சாகுபடி மற்றும் படைப்புழு மேலாண்மை (ICAR-IIMR & TNAU வழிகாட்டுதல்):\n\n"
            "1. மண் மற்றும் பருவம்:\n"
            "   - நல்ல வடிகால் வசதியுள்ள வளமான செம்மண் மற்றும் வண்டல் மண் சிறந்தது. நீர் தேங்கக்கூடாது.\n\n"
            "2. முக்கிய பாசன பருவங்கள்:\n"
            "   - முழங்கால் உயரப் பருவம் (30-35 நாட்கள்): தண்டு வளர்ச்சி பருவம்.\n"
            "   - பூக்கும் பருவம் (45-50 நாட்கள்): ஆண் பூக்கள் தோன்றும் பருவம்.\n"
            "   - பால் பிடிக்கும் பருவம் (60-70 நாட்கள்): மணிகள் உருவாகும் மிக முக்கியமான பாசன நிலை. இந்நேரத்தில் நீர் பற்றாக்குறை ஏற்பட்டால் மணிகள் பிடிக்காது.\n\n"
            "3. படைப்புழு மேலாண்மை (Fall Armyworm):\n"
            "   - புழுக்கள் குருத்து இலைகளை தின்று சல்லடை போல ஆக்கும்; புழுக்களின் கழிவுகள் குருத்தில் காணப்படும். ஏக்கருக்கு 5 மோகப் பொறிகள் வைக்கவும்; பேசிலஸ் துரிஞ்சியென்சிஸ் (Bt) தெளிக்கவும்.\n\n"
            "4. முக்கிய நோய்கள்:\n"
            "   - இலைக்கருகல் நோய்: இலைகளில் நீள்வட்ட சாம்பல்-பழுப்பு நிறப் புள்ளிகள் தோன்றும். மேன்கோசெப் தெளிக்கவும்."
        ),
        "tnauReference": "ICAR-Indian Institute of Maize Research (IIMR) & TNAU Agritech Portal"
    },

    # --------------------------------------------------------------------------
    # 9. WHEAT (Cereals)
    # --------------------------------------------------------------------------
    {
        "id": "KB-WHT-01",
        "crop": "Wheat",
        "cropTa": "கோதுமை",
        "category": "Crop Production, Irrigation Stages & Rust Diseases",
        "titleEn": "Wheat Critical Irrigation Stages, Rust Diseases & Balanced Fertilization",
        "titleTa": "கோதுமை பாசன நிலைகள், துரு நோய் மற்றும் உர மேலாண்மை",
        "keywords": [
            "wheat", "irrigation", "cri", "crown root", "rust", "stripe rust", "yellow rust",
            "loose smut", "fertilizer", "கோதுமை", "பாசனம்", "துரு நோய்"
        ],
        "contentEn": (
            "Wheat Production & Disease Guidelines (ICAR-IIWBR Standards):\n\n"
            "1. Soil & Climate:\n"
            "   - Well-drained loams and clay loams with neutral pH (6.5–7.5). Requires cool winter temperatures during vegetative phase and warm, sunny weather for grain maturation.\n\n"
            "2. Critical Irrigation Stages (CRI Stage Priority):\n"
            "   - Crown Root Initiation (CRI) at 20–25 DAS: The single most vital irrigation. Moisture stress at CRI reduces tillering by up to 40%.\n"
            "   - Tillering Stage (40–45 DAS).\n"
            "   - Late Jointing Stage (60–65 DAS).\n"
            "   - Flowering / Heading Stage (80–85 DAS).\n"
            "   - Milking Stage (100–105 DAS).\n\n"
            "3. Major Diseases & Management:\n"
            "   - Stripe Rust / Yellow Rust (Puccinia striiformis): Yellow pustules arranged in linear stripes between leaf veins, rubbing off as yellow powder on fingers. Favored by cool temperatures (<20°C). Spray Propiconazole per official recommendation at disease onset.\n"
            "   - Brown / Leaf Rust (Puccinia triticina): Round, scattered orange-brown pustules on leaf surface.\n"
            "   - Loose Smut (Ustilago tritici): Entire earhead converted into black powdery soot mass. Treat seeds with Carboxin + Thiram before sowing."
        ),
        "contentTa": (
            "கோதுமை சாகுபடி மற்றும் துரு நோய் மேலாண்மை (ICAR-IIWBR வழிகாட்டுதல்):\n\n"
            "1. மண் மற்றும் பருவம்:\n"
            "   - நல்ல வடிகால் வசதியுள்ள வண்டல் மண் சிறந்தது. மிதமான குளிர்காலம் மற்றும் அறுவடையின் போது நல்ல வெயில் தேவை.\n\n"
            "2. முக்கிய பாசன நிலைகள் (CRI பருவம்):\n"
            "   - முடி வேர் விடும் பருவம் (CRI - 20-25 நாட்கள்): மிக முக்கியமான பாசனம்; இதில் நீர் பற்றாக்குறை ஏற்பட்டால் தூர்கள் குறையும்.\n"
            "   - தூர் கட்டும் பருவம் (40-45 நாட்கள்).\n"
            "   - பூக்கும் பருவம் (80-85 நாட்கள்).\n"
            "   - பால் பிடிக்கும் பருவம் (100-105 நாட்கள்).\n\n"
            "3. முக்கிய நோய்கள்:\n"
            "   - மஞ்சள் துரு நோய் (Yellow Rust): இலை நரம்புகளுக்கு இடையே மஞ்சள் நிற வரிப் புள்ளிகள் தோன்றும்; தொட்டால் மஞ்சள் பொடி ஒட்டும். ப்ரோபிகோனசோல் தெளிக்கவும்.\n"
            "   - கரிப்பூட்டை நோய் (Loose Smut): கதிர்கள் கருப்பு தூளாக மாறும். விதைகளை திராம் அல்லது கார்பாக்சின் கொண்டு விதைநேர்த்தி செய்யவும்."
        ),
        "tnauReference": "ICAR-Indian Institute of Wheat and Barley Research (IIWBR) & TNAU Agritech Portal"
    },

    # --------------------------------------------------------------------------
    # 10. COTTON (Commercial / Fiber Crops)
    # --------------------------------------------------------------------------
    {
        "id": "KB-COT-01",
        "crop": "Cotton",
        "cropTa": "பருத்தி",
        "category": "Soil Suitability, Bollworm & Sucking Pest Management",
        "titleEn": "Cotton Soil Suitability, Bollworm Complex & Sucking Pest Management",
        "titleTa": "பருத்தி மண் பொருத்தம், காய்ப்புழு மற்றும் சாறு உறிஞ்சும் பூச்சி மேலாண்மை",
        "keywords": [
            "cotton", "bollworm", "pink bollworm", "jassid", "whitefly", "aphid", "bacterial blight",
            "square", "boll", "பருத்தி", "காய்ப்புழு", "சாறு உறிஞ்சும் பூச்சி"
        ],
        "contentEn": (
            "Cotton Production & Integrated Pest Management (TNAU & ICAR-CICR Guidelines):\n\n"
            "1. Soil Suitability & Climate:\n"
            "   - Deep black cotton soils (Vertisols) or fertile sandy loams with depth >90 cm and good internal drainage. Warm, humid climate during vegetative growth; dry weather during boll bursting.\n\n"
            "2. Critical Irrigation Stages:\n"
            "   - Square Formation Stage (40–45 DAS) and Boll Development Stage (70–90 DAS). Avoid waterlogging, which triggers flower bud (square) and young boll shedding.\n\n"
            "3. Pest Management (Bollworm Complex & Sucking Pests):\n"
            "   - Pink Bollworm (Pectinophora gossypiella): Causes rosetted flowers and burrows into bolls, staining the lint. Install pheromone traps (5/acre for monitoring; 15/acre for mass trapping). Terminate crop by 150 days to prevent pest carry-over.\n"
            "   - Sucking Pests (Jassids, Aphids, Whiteflies, Thrips): Cause leaf yellowing, downward crinkling, and honeydew sooty mold. Spray Neem oil (NSKE 5%) or recommended systemic insecticides.\n\n"
            "4. Major Disease:\n"
            "   - Bacterial Blight / Angular Leaf Spot (Xanthomonas citri pv. malvacearum): Angular water-soaked spots bounded by leaf veins; produces black arm on stems. Spray Copper Oxychloride combined with Streptocycline at early onset."
        ),
        "contentTa": (
            "பருத்தி சாகுபடி மற்றும் பூச்சி மேலாண்மை (TNAU & ICAR-CICR வழிகாட்டுதல்):\n\n"
            "1. மண் மற்றும் பருவம்:\n"
            "   - ஆழமான கரிசல் மண் மற்றும் செம்மண் சிறந்தது. நல்ல வடிகால் வசதி இருக்க வேண்டும்.\n\n"
            "2. பாசன நிலைகள்:\n"
            "   - பூ மொட்டு உருவாகும் பருவம் (40-45 நாட்கள்) மற்றும் காய் பிடிக்கும் பருவம் (70-90 நாட்கள்). நீர் தேங்கினால் பூ மொட்டுகள் கொட்டிவிடும்.\n\n"
            "3. பூச்சி மேலாண்மை:\n"
            "   - இளஞ்சிவப்பு காய்ப்புழு (Pink Bollworm): பூக்கள் ரோஜா வடிவில் மாறும்; காய்களை துளைத்து பஞ்சை பாழாக்கும். ஏக்கருக்கு 5-15 இனக்கவர்ச்சி பொறிகள் வைக்கவும்.\n"
            "   - சாறு உறிஞ்சும் பூச்சிகள் (தத்துப்பூச்சி, வெள்ளை ஈ): இலைகள் சுருங்கி மஞ்சளாகும். வேப்பெண்ணெய் கரைசல் (NSKE 5%) தெளிக்கவும்.\n\n"
            "4. பாக்டீரியா இலைக்கருகல் நோய்:\n"
            "   - இலைகளில் கோண வடிவ நீர் கோர்த்த புள்ளிகள் தோன்றும். காப்பர் ஆக்ஸிகுளோரைடு + ஸ்ட்ரெப்டோமைசின் தெளிக்கவும்."
        ),
        "tnauReference": "TNAU Agritech Portal - Cotton Crop Protection Guide & ICAR-CICR"
    },

    # --------------------------------------------------------------------------
    # 11. GROUNDNUT (Oilseeds / Legumes)
    # --------------------------------------------------------------------------
    {
        "id": "KB-GND-01",
        "crop": "Groundnut",
        "cropTa": "நிலக்கடலை",
        "category": "Soil Suitability, Gypsum Application & Tikka Disease",
        "titleEn": "Groundnut Soil Requirements, Gypsum Application, Tikka Disease & Pest Control",
        "titleTa": "நிலக்கடலை மண் தேவைகள், ஜிப்சம் இடுதல் மற்றும் டிக்கா நோய் மேலாண்மை",
        "keywords": [
            "groundnut", "peanut", "soil", "sandy loam", "gypsum", "pegging", "pod", "tikka",
            "leaf spot", "rust", "நிலக்கடலை", "வேர்க்கடலை", "மண்", "ஜிப்சம்", "டிக்கா நோய்"
        ],
        "contentEn": (
            "Groundnut Production & Health Management (TNAU & ICAR-DGR Guidelines):\n\n"
            "1. Soil Requirements & Suitability:\n"
            "   - Well-drained, loose, friable sandy loam or red sandy loam soils with pH 6.0–7.5. Loose soil texture is indispensable to allow the peg (gynophore) to penetrate the soil easily and form well-filled pods. Heavy clays cause pod breakage during harvest.\n\n"
            "2. Nutrient Management & Gypsum Application:\n"
            "   - Apply Gypsum at 400 kg/ha (160 kg/acre) close to the root zone at the pegging stage (40–45 DAS), followed by earthing up.\n"
            "   - Importance: Gypsum provides essential Calcium and Sulphur. Calcium is absorbed directly by developing pods from the soil to fill kernels and prevent 'pops' (empty shells).\n\n"
            "3. Critical Irrigation Stages:\n"
            "   - Flowering (25–30 DAS), Pegging (40–45 DAS), and Pod Development (60–70 DAS). Avoid drought during peg penetration.\n\n"
            "4. Major Diseases:\n"
            "   - Tikka Leaf Spot (Cercospora arachidicola / Cercosporidium personatum): Circular dark spots with yellow halos (early leaf spot) and dark brown spots without halos (late leaf spot). Spray Mancozeb (2g/L) or Carbendazim (1g/L) or Chlorothalonil (2g/L).\n"
            "   - Rust (Puccinia arachidis): Orange pustules on leaf undersides."
        ),
        "contentTa": (
            "நிலக்கடலை சாகுபடி மற்றும் ஜிப்சம் இடுதல் (TNAU & ICAR-DGR வழிகாட்டுதல்):\n\n"
            "1. மண் தேவைகள்:\n"
            "   - நல்ல வடிகால் வசதியுள்ள மணல் கலந்த செம்மண் சிறந்தது. விழுதுகள் எளிதாக மண்ணிற்குள் இறங்கி காய்கள் பிடிக்க தளர்வான மண் அவசியம்.\n\n"
            "2. ஜிப்சம் இடுதல் (மிக முக்கியம்):\n"
            "   - நட்ட 40-45 ஆம் நாளில் (விழுது இறங்கும் பருவம்) ஏக்கருக்கு 160 கிலோ ஜிப்சம் இட்டு மண் அணைக்க வேண்டும்.\n"
            "   - ஜிப்சத்தில் உள்ள கால்சியம் மற்றும் கந்தகம் காய்களில் பருப்பு நன்றாக திரள உதவுகிறது; பதர் காய்கள் உருவாவதைத் தடுக்கிறது.\n\n"
            "3. பாசன நிலைகள்:\n"
            "   - பூக்கும் பருவம் (25-30 நாட்கள்), விழுது இறங்கும் பருவம் (40-45 நாட்கள்) மற்றும் காய் பிடிக்கும் பருவம்.\n\n"
            "4. டிக்கா இலைப்புள்ளி நோய் (Tikka Disease):\n"
            "   - இலைகளில் மஞ்சள் வளையத்துடன் கூடிய கரும்பழுப்பு நிறப் புள்ளிகள் தோன்றும். மேன்கோசெப் அல்லது கார்பென்டாசிம் தெளிக்கவும்."
        ),
        "tnauReference": "TNAU Agritech Portal - Groundnut Production Guide & ICAR-DGR"
    },

    # --------------------------------------------------------------------------
    # 12. BANANA (Horticulture / Fruits)
    # --------------------------------------------------------------------------
    {
        "id": "KB-BAN-01",
        "crop": "Banana",
        "cropTa": "வாழை",
        "category": "Soil, Irrigation & Disease Management",
        "titleEn": "Banana Soil, Drip Irrigation, Sigatoka Leaf Spot & Panama Wilt Management",
        "titleTa": "வாழை மண், சொட்டுநீர் பாசனம், சிகடோகா இலைப்புள்ளி மற்றும் பனாமா வாடல் நோய்",
        "keywords": [
            "banana", "plantain", "soil", "sigatoka", "panama wilt", "fusarium", "pseudostem borer",
            "sucker", "drip", "வாழை", "சிகடோகா", "பனாமா வாடல்", "தண்டு வண்டு"
        ],
        "contentEn": (
            "Banana Production & Disease Management (ICAR-NRCB & TNAU Guidelines):\n\n"
            "1. Soil & Climate:\n"
            "   - Deep, fertile, well-drained loamy soil rich in organic matter with depth >1 m and pH 6.5–7.5. Sensitive to waterlogging and soil salinity.\n\n"
            "2. Irrigation Management:\n"
            "   - High water-demanding crop. Apply 20–25 liters of water/plant/day through drip irrigation. Maintain uniform root-zone moisture without stagnation.\n\n"
            "3. Major Diseases & Management:\n"
            "   - Sigatoka Leaf Spot (Pseudocercospora musae): Yellowish spindle streaks that enlarge into dark brown elliptical spots with grayish centers and yellow halos, leading to premature leaf drying. Spray Propiconazole (1ml/L) or Carbendazim (1g/L) with mineral oil adjuvant.\n"
            "   - Panama Wilt (Fusarium oxysporum f. sp. cubense): Yellowing of lower leaves beginning from margins; longitudinal splitting of pseudostem base; vascular discoloration in cut rhizomes. Use disease-free tissue culture plantlets; drench soil with Trichoderma viride or Pseudomonas fluorescens.\n\n"
            "4. Major Pest:\n"
            "   - Banana Pseudostem Borer (Odoiporus longicollis): Larvae bore into pseudostem, causing jelly exudation and weakening the stem. Practice field sanitation; install longitudinal pseudostem trap splits."
        ),
        "contentTa": (
            "வாழை சாகுபடி மற்றும் நோய் மேலாண்மை (ICAR-NRCB & TNAU வழிகாட்டுதல்):\n\n"
            "1. மண் மற்றும் பருவம்:\n"
            "   - ஆழமான வண்டல் மற்றும் செம்மண் சிறந்தது. வடிகால் வசதி மிக அவசியம்; நீர் தேங்கினால் வேர் அழுகும்.\n\n"
            "2. நீர் நிர்வாகம்:\n"
            "   - அதிக நீர் தேவைப்படும் பயிர். சொட்டுநீர் பாசனம் மூலம் செடிக்கு நாளொன்றுக்கு 20-25 லிட்டர் நீர் வழங்கவும்.\n\n"
            "3. முக்கிய நோய்கள்:\n"
            "   - சிகடோகா இலைப்புள்ளி நோய் (Sigatoka Leaf Spot): இலைகளில் நீள்வட்ட பழுப்புப் புள்ளிகள் தோன்றி இலைகள் காய்ந்துவிடும். ப்ரோபிகோனசோல் அல்லது கார்பென்டாசிம் தெளிக்கவும்.\n"
            "   - பனாமா வாடல் நோய் (Panama Wilt): கீழ் இலைகள் மஞ்சளாகி தண்டின் அடிப்பகுதி பிளக்கும். ஆரோக்கியமான திசுவளர்ப்பு கன்றுகளை நடவும்; வேர்ப்பகுதியில் டிரைக்கோடெர்மா விரிடி இடவும்.\n\n"
            "4. தண்டு துளைப்பான் வண்டு:\n"
            "   - தண்டில் துளைகள் இட்டு பிசின் போன்ற திரவம் வழியும். பாதிக்கப்பட்ட கன்றுகளை அகற்றி சுத்தமாக பராமரிக்கவும்."
        ),
        "tnauReference": "ICAR-National Research Centre for Banana (NRCB) & TNAU Horticulture Guide"
    },

    # --------------------------------------------------------------------------
    # 13. COCONUT (Plantation Crops)
    # --------------------------------------------------------------------------
    {
        "id": "KB-COC-01",
        "crop": "Coconut",
        "cropTa": "தென்னை",
        "category": "Soil Suitability, Basin Irrigation & Pest Control",
        "titleEn": "Coconut Soil Suitability, Basin Irrigation, Rhinoceros Beetle & Basal Stem Rot",
        "titleTa": "தென்னை மண் பொருத்தம், பாசனம், காண்டாமிருக வண்டு மற்றும் தஞ்சாவூர் வாடல் நோய்",
        "keywords": [
            "coconut", "palm", "soil", "basin", "rhinoceros beetle", "red palm weevil", "bud rot",
            "tanjore wilt", "basal stem rot", "ganoderma", "தென்னை", "காண்டாமிருக வண்டு", "தஞ்சாவூர் வாடல்", "மண்"
        ],
        "contentEn": (
            "Coconut Agronomy & Health Management (TNAU & ICAR-CPCRI Guidelines):\n\n"
            "1. Soil Suitability:\n"
            "   - Deep, well-drained sandy loams, alluvial, red sandy loams, and coastal sandy soils with minimum 1.5–2 meter depth. Water table should be between 1.5 to 3 meters. Heavy clay soils or highly alkaline soils are unsuitable.\n\n"
            "2. Irrigation & Moisture Conservation:\n"
            "   - Adult palm requires 45–50 liters/day under drip irrigation, or 200 liters every 4–5 days via basin irrigation. Bury coconut husks (layer of 100 husks/palm) in circular basins around palms to conserve soil moisture.\n\n"
            "3. Major Pests:\n"
            "   - Rhinoceros Beetle (Oryctes rhinoceros): Feeds on tender unopened fronds, producing characteristic geometric V-shaped cuts. Hook out beetles from crowns; apply neem cake + sand mixture (1:2) in leaf axils.\n"
            "   - Red Palm Weevil (Rhynchophorus ferrugineus): Internal trunk feeding with extrusion of chewed fibers and fermented odor. Treat wounds and maintain strict field hygiene.\n\n"
            "4. Major Diseases:\n"
            "   - Basal Stem Rot / Tanjore Wilt (Ganoderma lucidum): Lower fronds wither and droop; reddish-brown viscous fluid oozes from trunk base. Practice root feeding with Hexaconazole or Carbendazim; apply Trichoderma viride enriched FYM to soil.\n"
            "   - Bud Rot (Phytophthora palmivora): Heart leaf rots and collapses. Apply Bordeaux paste or Copper Oxychloride to crown."
        ),
        "contentTa": (
            "தென்னை சாகுபடி மற்றும் பயிர் பாதுகாப்பு (TNAU & ICAR-CPCRI வழிகாட்டுதல்):\n\n"
            "1. மண் பொருத்தம்:\n"
            "   - நல்ல ஆழமுள்ள செம்மண், வண்டல் மண் மற்றும் கடலோர மணல் கலந்த மண் சிறந்தது. நீர் தேங்கும் களிமண் நிலங்கள் உகந்தவை அல்ல.\n\n"
            "2. பாசனம் மற்றும் மட்டை மூடாக்கு:\n"
            "   - ஒரு மரத்திற்கு நாளொன்றுக்கு சொட்டுநீர் மூலம் 45-50 லிட்டர் நீர் தேவைப்படும். மரத்தைச் சுற்றி தென்னை மட்டைகளை அடுக்கி வைத்தால் ஈரப்பதம் காக்கப்படும்.\n\n"
            "3. முக்கிய பூச்சிகள்:\n"
            "   - காண்டாமிருக வண்டு (Rhinoceros Beetle): விரிந்த மட்டைகளில் ஆங்கில 'V' வடிவ வெட்டுக்கள் காணப்படும். வண்டு கொக்கியால் வண்டுகளை வெளியேற்றி, இலை இடுக்குகளில் வேப்பங்கொட்டை தூள் + மணல் கலவை இடவும்.\n"
            "   - சிவப்பு கூன் வண்டு: தண்டில் துளைகள் ஏற்பட்டு சக்கை மற்றும் துர்நாற்ற திரவம் வழியும்.\n\n"
            "4. முக்கிய நோய்கள்:\n"
            "   - தஞ்சாவூர் வாடல் நோய் (Tanjore Wilt): கீழ் மட்டைகள் காய்ந்து தொங்கும்; தண்டுப் பகுதியில் பழுப்பு நிற பிசின் போன்ற திரவம் வழியும். ஹெக்சாகோனசோல் வேர் மூலம் ஊட்டவும்; டிரைக்கோடெர்மா விரிடி இடவும்.\n"
            "   - குருத்தழுகல் நோய்: நடுக்குருத்து அழுகிவிடும். காப்பர் ஆக்ஸிகுளோரைடு தெளிக்கவும்."
        ),
        "tnauReference": "TNAU Agritech Portal - Coconut Expert System & ICAR-CPCRI"
    },

    # --------------------------------------------------------------------------
    # 14. ONION (Vegetables / Bulbs)
    # --------------------------------------------------------------------------
    {
        "id": "KB-ONI-01",
        "crop": "Onion",
        "cropTa": "வெங்காயம்",
        "category": "Soil, Irrigation, Purple Blotch & Thrips Management",
        "titleEn": "Onion Soil Requirements, Irrigation, Purple Blotch & Thrips Management",
        "titleTa": "வெங்காயம் மண் தேவைகள், பாசனம், ஊதா நிற கருகல் மற்றும் இலைப்பேண் மேலாண்மை",
        "keywords": [
            "onion", "shallot", "soil", "purple blotch", "thrips", "bulb", "curing", "irrigation",
            "வெங்காயம்", "ஊதா கருகல்", "இலைப்பேண்", "மண்"
        ],
        "contentEn": (
            "Onion Agronomy & Crop Protection (TNAU & ICAR-DOGR Guidelines):\n\n"
            "1. Soil Requirements & Bed Preparation:\n"
            "   - Loose, friable sandy loam or alluvial soil with high organic matter, good drainage, and pH 6.5–7.5. Heavy clay soils impede bulb expansion and lead to deformed, splitting bulbs.\n\n"
            "2. Water Management & Irrigation:\n"
            "   - Frequent light irrigations. Critical moisture periods: Vegetative growth and Bulb enlargement. Avoid water stress during bulb bulking to prevent splitting. Discontinue irrigation 10–15 days before harvest for proper field curing.\n\n"
            "3. Major Pests:\n"
            "   - Onion Thrips (Thrips tabaci): Nymphs and adults lacerate foliage, producing silvery white blotches and curling of leaf tips. Install blue or yellow sticky traps; spray Neem oil (NSKE 5%) or approved systemic insecticides.\n\n"
            "4. Major Disease:\n"
            "   - Purple Blotch (Alternaria porri): Small, sunken water-soaked lesions that turn purple in the center with yellow chlorotic margins on foliage and flower stalks. Favored by high humidity (>80%) and warm temperatures (25–30°C). Spray Mancozeb (2g/L) or Chlorothalonil (2g/L) combined with a sticker/spreader agent.\n\n"
            "5. Harvesting & Curing:\n"
            "   - Harvest when 50% of the crop foliage falls over (neck fall). Cure bulbs in shade for 10–15 days until necks dry thoroughly before storage."
        ),
        "contentTa": (
            "வெங்காயம் சாகுபடி மற்றும் பயிர் பாதுகாப்பு (TNAU & ICAR-DOGR வழிகாட்டுதல்):\n\n"
            "1. மண் தேவைகள்:\n"
            "   - நல்ல வடிகால் வசதியுள்ள தளர்வான மணல் கலந்த செம்மண் மற்றும் வண்டல் மண் சிறந்தது. களிமண் நிலத்தில் கிழங்குகள் ஒழுங்கற்ற வடிவில் மாறும்.\n\n"
            "2. நீர் நிர்வாகம்:\n"
            "   - சீரான இடைவெளியில் மிதமான நீர் பாய்ச்ச வேண்டும். கிழங்கு ஊறும் பருவத்தில் நீர் மிக அவசியம். அறுவடைக்கு 10-15 நாட்களுக்கு முன் பாசனத்தை நிறுத்த வேண்டும்.\n\n"
            "3. இலைப்பேண் பூச்சி (Thrips):\n"
            "   - இலைகளில் வெள்ளி போன்ற வெண் புள்ளிகள் தோன்றி நுனிகள் சுருளும். நீல அல்லது மஞ்சள் ஒட்டுப்பொறிகள் வைக்கவும்; வேப்பெண்ணெய் தெளிக்கவும்.\n\n"
            "4. ஊதா நிற இலைக்கருகல் நோய் (Purple Blotch):\n"
            "   - இலைகளில் ஊதா நிற மையப்பகுதியுடன் கூடிய புள்ளிகள் தோன்றி இலைகள் கருகும். மேன்கோசெப் அல்லது குளோரோதலோனில் தெளிக்கவும்.\n\n"
            "5. அறுவடை மற்றும் பதப்படுத்துதல்:\n"
            "   - 50% தாள் மடங்கி விழும்போது அறுவடை செய்து, நிழலில் 10-15 நாட்கள் உலர்த்தி சேமிக்கவும்."
        ),
        "tnauReference": "TNAU Agritech Portal - Onion Production Compendium & ICAR-DOGR"
    }
]


# Comprehensive mapping of crop names and their multilingual aliases
CROP_ALIAS_MAP: Dict[str, List[str]] = {
    "tomato": ["tomato", "தக்காளி"],
    "potato": ["potato", "உருளை", "உருளைக்கிழங்கு"],
    "brinjal": ["brinjal", "eggplant", "aubergine", "கத்தரி", "கத்தரிக்காய்"],
    "rice": ["rice", "paddy", "நெல்", "அரிசி"],
    "sugarcane": ["sugarcane", "cane", "கரும்பு"],
    "chilli": ["chilli", "chili", "pepper", "capsicum", "மிளகாய்"],
    "maize": ["maize", "corn", "மக்காச்சோளம்"],
    "wheat": ["wheat", "கோதுமை"],
    "cotton": ["cotton", "பருத்தி"],
    "groundnut": ["groundnut", "peanut", "வேர்க்கடலை", "நிலக்கடலை"],
    "banana": ["banana", "plantain", "வாழை"],
    "coconut": ["coconut", "palm", "தென்னை"],
    "onion": ["onion", "shallot", "வெங்காயம்"]
}


# ==============================================================================
# RAG RETRIEVAL ENGINE (Crop-First Matching)
# ==============================================================================
class RAGService:
    def __init__(self, knowledge_base: List[Dict[str, Any]] = AGRICULTURAL_KNOWLEDGE_BASE):
        self.kb = knowledge_base

    def _tokenize(self, text: str) -> set:
        """Tokenize text into lower-case alphanumeric tokens."""
        clean = re.sub(r"[^\w\s]", " ", text.lower())
        tokens = set(t.strip() for t in clean.split() if len(t.strip()) > 2)
        # Filter out common stop words
        stop_words = {
            "the", "and", "for", "are", "with", "what", "how", "why", "can", "should",
            "which", "when", "about", "that", "this", "from", "plants", "plant", "crop"
        }
        return tokens - stop_words

    def retrieve_rag_context(
        self,
        query: str,
        crop: Optional[str] = None,
        top_k: int = 2,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Retrieve top-k relevant knowledge passages from the agricultural knowledge base.
        Enforces Crop-First Matching:
        - If a crop is explicitly specified or detected in the query, articles matching that crop
          receive strong priority (+25 points) and articles from other specific crops are excluded.
        - If no crop is specified, general topic-based matching is applied across all articles.
        - Returns has_context=False if no relevant match is found, allowing general Gemini fallback.
        """
        query_lower = query.lower()

        # Detect if the query specifically targets one or more crops
        detected_crops = set()
        if crop:
            c_low = crop.lower()
            for c_key, aliases in CROP_ALIAS_MAP.items():
                if any(a in c_low for a in aliases):
                    detected_crops.add(c_key)

        for c_key, aliases in CROP_ALIAS_MAP.items():
            if any(a in query_lower for a in aliases):
                detected_crops.add(c_key)

        query_tokens = self._tokenize(query)
        scored_articles = []

        for article in self.kb:
            article_crop_lower = article.get("crop", "").lower()

            is_exact_crop_match = False
            if detected_crops:
                is_exact_crop_match = any(c in article_crop_lower for c in detected_crops)
                # If a specific crop was queried (e.g. Rice) and this article belongs to a different crop (e.g. Tomato),
                # exclude it so generic words (water, fertilizer, pest, disease) never cross-match unrelated crops!
                if not is_exact_crop_match and article_crop_lower not in ("all solanaceae", "general"):
                    continue

            score = 0.0

            # 1. Crop relevance boost
            if is_exact_crop_match:
                score += 25.0
            elif not detected_crops and crop and crop.lower() in article_crop_lower:
                score += 20.0

            # 2. Symptom / keyword matching
            keywords = article.get("keywords", [])
            matched_keywords = []
            for kw in keywords:
                if kw.lower() in query_lower:
                    score += 4.0
                    matched_keywords.append(kw)

            # 3. Title token overlap
            title = (article.get("titleEn", "") + " " + article.get("titleTa", "")).lower()
            title_tokens = self._tokenize(title)
            title_overlap = len(query_tokens.intersection(title_tokens))
            score += title_overlap * 4.0

            # 4. Content token overlap
            content = (article.get("contentEn", "") + " " + article.get("contentTa", "")).lower()
            content_tokens = self._tokenize(content)
            content_overlap = len(query_tokens.intersection(content_tokens))
            score += content_overlap * 1.0

            # Minimum score threshold to consider a verified context match
            threshold = 15.0 if detected_crops else 6.0
            if score >= threshold:
                scored_articles.append((score, article, matched_keywords))

        # Sort descending by score
        scored_articles.sort(key=lambda x: x[0], reverse=True)
        top_results = scored_articles[:top_k]

        if not top_results:
            return {
                "query": query,
                "has_context": False,
                "top_k": 0,
                "context_text": "",
                "sources": [],
                "primary_source": None
            }

        # Format context for Gemini prompt injection
        context_snippets = []
        sources = []

        for score, art, _ in top_results:
            title = art.get("titleTa" if language == "ta" else "titleEn")
            content = art.get("contentTa" if language == "ta" else "contentEn")
            tnau_ref = art.get("tnauReference", "TNAU Agritech Portal")

            snippet = f"### [{art.get('crop')} - {title}]\n{content}\nSource: {tnau_ref}"
            context_snippets.append(snippet)
            sources.append(f"{art.get('crop')}: {title} ({tnau_ref})")

        fused_context = "\n\n".join(context_snippets)

        return {
            "query": query,
            "has_context": True,
            "top_k": len(top_results),
            "context_text": fused_context,
            "sources": sources,
            "primary_source": sources[0] if sources else "SmartFarm Agricultural Knowledge Base"
        }


# Singleton instance
rag_service = RAGService()
