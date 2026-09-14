"""
SmartFarm AI - Agricultural RAG (Retrieval-Augmented Generation) Service
Maintains the Solanaceae agricultural knowledge base (Tomato, Potato, Brinjal)
and performs context retrieval to ground LLM responses with verified agronomic facts.
"""

import re
from typing import List, Dict, Any, Optional

# ==============================================================================
# VERIFIED AGRICULTURAL KNOWLEDGE BASE (TNAU & ICAR Standards)
# ==============================================================================
AGRICULTURAL_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
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
    }
]


NON_SOLANACEAE_CROPS = [
    "rice", "paddy", "sugarcane", "banana", "plantain", "cotton", "maize", "corn",
    "groundnut", "peanut", "onion", "wheat", "coconut", "mango", "millet", "ragi",
    "sorghum", "soybean", "ginger", "cardamom", "coffee", "tea", "papaya",
    "chilli", "chili", "pepper", "blackgram", "greengram", "chickpea",
    "நெல்", "அரிசி", "கரும்பு", "வாழை", "பருத்தி", "மக்காச்சோளம்", "வேர்க்கடலை",
    "நிலக்கடலை", "வெங்காயம்", "கோதுமை", "தென்னை", "மாங்காய்", "கேழ்வரகு", "உளுந்து"
]

SOLANACEAE_KEYWORDS = ["tomato", "தக்காளி", "potato", "உருளை", "brinjal", "eggplant", "கத்தரி"]


# ==============================================================================
# RAG RETRIEVAL ENGINE
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
        Retrieve top-k relevant knowledge passages from the agricultural knowledge base
        based on query terms, crop filter, and semantic token overlap.
        If a non-Solanaceae crop is queried without Solanaceae crops, returns has_context=False
        to allow general agricultural Gemini fallback.
        """
        query_lower = query.lower()

        # Check if the query specifically targets non-Solanaceae crops
        has_solanaceae = any(c in query_lower for c in SOLANACEAE_KEYWORDS) or (crop and any(c in crop.lower() for c in SOLANACEAE_KEYWORDS))
        has_non_solanaceae = any(c in query_lower for c in NON_SOLANACEAE_CROPS)

        if has_non_solanaceae and not has_solanaceae:
            # Query is about a crop not in Solanaceae RAG KB (e.g. Rice, Sugarcane, Banana)
            return {
                "query": query,
                "has_context": False,
                "top_k": 0,
                "context_text": "",
                "sources": [],
                "primary_source": None
            }

        query_tokens = self._tokenize(query)
        scored_articles = []

        for article in self.kb:
            score = 0.0

            # 1. Crop relevance boost
            article_crop = article.get("crop", "").lower()
            if crop and (crop.lower() in article_crop or article_crop == "all solanaceae"):
                score += 5.0
            elif any(c in query_lower for c in ["tomato", "தக்காளி"]) and "tomato" in article_crop:
                score += 8.0
            elif any(c in query_lower for c in ["potato", "உருளை"]) and "potato" in article_crop:
                score += 8.0
            elif any(c in query_lower for c in ["brinjal", "eggplant", "கத்தரி"]) and "brinjal" in article_crop:
                score += 8.0

            # 2. Symptom / keyword matching
            keywords = article.get("keywords", [])
            matched_keywords = []
            for kw in keywords:
                if kw in query_lower:
                    score += 4.0
                    matched_keywords.append(kw)

            # 3. Title token overlap
            title = article.get("titleEn", "").lower() + " " + article.get("titleTa", "")
            title_tokens = self._tokenize(title)
            title_overlap = len(query_tokens.intersection(title_tokens))
            score += title_overlap * 3.0

            # 4. Content token overlap
            content = article.get("contentEn", "").lower() + " " + article.get("contentTa", "")
            content_tokens = self._tokenize(content)
            content_overlap = len(query_tokens.intersection(content_tokens))
            score += content_overlap * 1.0

            # Minimum score threshold to consider a verified context match
            if score >= 6.0:
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
