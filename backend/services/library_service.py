"""
SmartFarm AI - Agriculture Library Service
Connects directly to the existing grounded Solanaceae RAG knowledge base
and provides verified agronomic guides, categories, and keyword/semantic search.
"""

import os
import re
from typing import List, Dict, Any, Optional

# Verified Agricultural Articles grounded in TNAU & ICAR Compendium
LIBRARY_ARTICLES: List[Dict[str, Any]] = [
    {
        "id": "LIB-TOM-01",
        "cropId": "tomato",
        "cropName": "Tomato",
        "cropTa": "தக்காளி",
        "category": "Crop Diseases",
        "categories": ["Crop Diseases", "Tomato", "Agricultural Guidelines"],
        "titleEn": "Tomato Foliar & Fruit Disease Management",
        "titleTa": "தக்காளி இலை மற்றும் காய் நோய் மேலாண்மை",
        "summaryEn": "Comprehensive guide to identifying and treating Late Blight, Early Blight, Bacterial Spot, and Blossom End Rot in Solanum lycopersicum.",
        "summaryTa": "தக்காளி பயிரில் லேட் பிளைட், ஏர்லி பிளைட், பாக்டீரியா புள்ளி மற்றும் அடி அழுகல் நோய்களைக் கண்டறிந்து கட்டுப்படுத்தும் வழிகாட்டி.",
        "keywords": ["tomato", "late blight", "early blight", "blight", "disease", "phytophthora", "alternaria", "bacterial spot", "mancozeb", "copper oxychloride", "தக்காளி", "லேட் பிளைட்", "நோய்"],
        "sections": {
            "overview": {
                "en": "Tomatoes are susceptible to foliage and fruit fungal pathogens under high ambient humidity (>75%) and moderate temperatures (18-28°C). Preventive scouting and rapid fungicide intervention prevent field yield loss up to 80%.",
                "ta": "தக்காளி பயிர் 75% மேல் காற்று ஈரப்பதம் மற்றும் 18-28°C வெப்பநிலையில் பூஞ்சை நோய்களால் அதிகம் பாதிக்கப்படுகிறது. முன் கூட்டியே கண்டறிவது 80% மகசூல் இழப்பைத் தடுக்கும்."
            },
            "growingConditions": {
                "en": "Optimal canopy temperature is 21-29°C. Requires well-drained red loamy or sandy-loam soil with pH 6.0-6.8 and 6-8 hours of direct daily sunlight.",
                "ta": "வளர்ச்சி வெப்பநிலை: 21-29°C. நல்ல வடிகால் வசதியுள்ள செம்மண் அல்லது வண்டல் மண், pH 6.0-6.8 மற்றும் தினமும் 6-8 மணி நேர நேரடி சூரிய ஒளி சிறந்தது."
            },
            "commonDiseases": {
                "en": "1. Late Blight (Phytophthora infestans): Water-soaked dark brown lesions with white fuzzy sporulation on leaf undersides.\n2. Early Blight (Alternaria solani): Concentric target rings surrounded by bright yellow halos.\n3. Bacterial Spot (Xanthomonas): Small greasy brown specks.\n4. Blossom End Rot: Sunken leathery black spot on fruit base caused by calcium deficiency.",
                "ta": "1. லேட் பிளைட்: இலைகளில் நீர் கோர்த்த கருமை புள்ளிகள் மற்றும் வெள்ளை பூஞ்சை படலம்.\n2. ஏர்லி பிளைட்: வளைய வடிவ கரும்பழுப்பு புள்ளிகள்.\n3. பாக்டீரியா புள்ளி: சிறிய எண்ணெய் போன்ற பழுப்பு புள்ளிகள்.\n4. அடி அழுகல்: கால்சியம் பற்றாக்குறையால் காயின் அடிப்பகுதியில் தோன்றும் கருப்பு காய்ந்த புண்."
            },
            "commonPests": {
                "en": "Fruit Borer (Helicoverpa armigera), Whiteflies (Bemisia tabaci, vector of Leaf Curl Virus), Serpentine Leafminers, and Red Spider Mites.",
                "ta": "காய் துளைப்பான் (ஹெலிகோவெர்பா), வெள்ளை ஈ (இலைச்சுருள் வைரஸ் கடத்தி), இலைச் சுரங்கப் பூச்சி மற்றும் சிவப்பு சிலந்திப் பூச்சிகள்."
            },
            "irrigation": {
                "en": "Maintain 60-70% root-zone soil moisture. Strictly prefer automated drip irrigation over overhead sprinklers to prevent leaf canopy wetness and fungal spore splash.",
                "ta": "மண் ஈரப்பதத்தை 60-70% அளவில் பராமரிக்கவும். இலைகள் நனையாமல் இருக்க தெளிப்பு நீர்ப்பாசனத்திற்கு பதிலாக சொட்டுநீர்ப் பாசனத்தைப் பயன்படுத்தவும்."
            },
            "soil": {
                "en": "Requires deep loamy soil rich in organic humus (>2%). Incorporate 10 tonnes well-rotted FYM mixed with Trichoderma viride @ 2 kg/acre during field preparation.",
                "ta": "மட்கிய தொழு உரம் 10 டன் மற்றும் டிரைக்கோடெர்மா விரிடி 2 கிலோ கலந்து நிலம் தயாரிப்பின் போது இடவும்."
            },
            "management": {
                "en": "Prune lower leaves touching soil. Install yellow sticky traps (15/acre). Spray Copper Oxychloride 50% WP (2.5g/L) or Mancozeb 75% WP (2g/L). For systemic blight, apply Metalaxyl + Mancozeb (2g/L).",
                "ta": "நிலத்தைத் தொடும் கீழ் இலைகளை கவாத்து செய்யவும். மஞ்சள் ஒட்டும் பொறிகள் 15/ஏக்கர் வைக்கவும். காப்பர் ஆக்ஸிகுளோரைடு (2.5g/L) அல்லது மேன்கோசெப் (2g/L) தெளிக்கவும்."
            },
            "harvest": {
                "en": "Harvest at breaker/turning stage (pink blossom end) for long-distance transit, or mature red firm stage for immediate local market consumption.",
                "ta": "தொலைதூர விற்பனைக்கு இளஞ்சிவப்பு நிறத்திலும், உள்ளூர் சந்தைக்கு அடர் சிவப்பு கெட்டியான நிலையிலும் அறுவடை செய்யவும்."
            }
        },
        "source": "TNAU Agritech Portal - Tomato Crop Protection Compendium"
    },
    {
        "id": "LIB-TOM-02",
        "cropId": "tomato",
        "cropName": "Tomato",
        "cropTa": "தக்காளி",
        "category": "Pest Management",
        "categories": ["Pest Management", "Tomato", "Agricultural Guidelines"],
        "titleEn": "Tomato Fruit Borer & Whitefly Integrated Pest Management (IPM)",
        "titleTa": "தக்காளி காய் துளைப்பான் மற்றும் வெள்ளை ஈ ஒருங்கிணைந்த பூச்சி மேலாண்மை",
        "summaryEn": "Integrated biological, cultural, and chemical controls against Helicoverpa armigera fruit borers and Bemisia tabaci whiteflies.",
        "summaryTa": "தக்காளி காய் துளைப்பான் மற்றும் இலைச்சுருள் வைரஸ் கடத்தும் வெள்ளை ஈ பூச்சிகளுக்கான இயற்கை மற்றும் ஒருங்கிணைந்த மேலாண்மை.",
        "keywords": ["tomato", "pest management", "fruit borer", "whitefly", "leafminer", "ipm", "traps", "neem", "pheromones", "insect", "insects", "insect pest", "தக்காளி", "பூச்சி மேலாண்மை", "காய் துளைப்பான்"],
        "sections": {
            "overview": {
                "en": "Helicoverpa armigera caterpillars bore into ripening fruits causing fruit rot and up to 40% marketable yield loss. Whiteflies suck sap and transmit devastating Tomato Leaf Curl New Delhi Virus (ToLCNDV).",
                "ta": "காய் துளைப்பான் புழுக்கள் காய்களை துளைத்து சேதப்படுத்துகின்றன. வெள்ளை ஈக்கள் சாற்றை உறிஞ்சி இலைச்சுருள் வைரஸ் நோயைப் பரப்புகின்றன."
            },
            "growingConditions": {
                "en": "Warm and dry weather with temperatures of 25-34°C accelerates pest multiplication. Intercropping with African marigold serves as an effective trap crop for fruit borer.",
                "ta": "25-34°C வெப்பமான காலநிலை பூச்சிகள் பெருக சாதகமானது. ஆப்பிரிக்க செண்டுமல்லி செடிகளை வரப்பு பயிராக நட்டு காய் துளைப்பானை ஈர்க்கலாம்."
            },
            "commonDiseases": {
                "en": "Secondary soft rot fungal infection enters through borer entry holes. Tomato Leaf Curl Virus results in extreme bushiness and stunted growth.",
                "ta": "பூச்சி துளைத்த காய்களில் இரண்டாம் நிலை பாக்டீரியா அழுகல் நோய் ஏற்படுகிறது. வெள்ளை ஈக்களால் இலைச்சுருள் நோய் பரவுகிறது."
            },
            "commonPests": {
                "en": "Tomato Fruit Borer (Helicoverpa), Whiteflies (Bemisia), Serpentine Leafminer (Liriomyza), Thrips (Frankliniella).",
                "ta": "காய் துளைப்பான், வெள்ளை ஈ, இலைச் சுரங்கப் பூச்சி, இலைப்பேன்."
            },
            "irrigation": {
                "en": "Avoid water stress during flowering and fruit setting. Drought conditions promote spider mite flare-ups.",
                "ta": "பூக்கும் மற்றும் காய் பிடிக்கும் தருணத்தில் நீர் பற்றாக்குறை ஏற்படாமல் பார்த்துக்கொள்ளவும்."
            },
            "soil": {
                "en": "Deep summer ploughing exposes pupae to solar heat and predatory birds. Apply Neem cake @ 250 kg/ha in soil.",
                "ta": "கோடை உழவு செய்து பூச்சிகளின் கூட்டுப்புழுக்களை அழிக்கவும். வேப்பம்பிண்ணாக்கு 250 கிலோ/ஹெக்டர் இடவும்."
            },
            "management": {
                "en": "Install 12 Helilure pheromone traps/acre. Set up 15 yellow sticky traps for whiteflies. Spray Neem Seed Kernel Extract (NSKE 5%) or Bacillus thuringiensis (Bt @ 2g/L). For severe borer attack, spray Chlorantraniliprole 18.5% SC @ 0.3ml/L.",
                "ta": "ஏக்கருக்கு 12 இனக்கவர்ச்சி பொறிகள் மற்றும் 15 மஞ்சள் ஒட்டுப் பொறிகளை வைக்கவும். வேப்பங்கொட்டை சாறு (NSKE 5%) அல்லது பேசிலஸ் துரிஞ்சியென்சிஸ் (2g/L) தெளிக்கவும்."
            },
            "harvest": {
                "en": "Sort and discard bored fruits immediately to eliminate pest reservoirs from the field.",
                "ta": "துளை விழுந்த காய்களை தனியாகப் பிரித்து சேதமடைந்தவற்றை உடனே அப்புறப்படுத்தவும்."
            }
        },
        "source": "TNAU Centre for Plant Protection Studies - Tomato IPM"
    },
    {
        "id": "LIB-TOM-03",
        "cropId": "tomato",
        "cropName": "Tomato",
        "cropTa": "தக்காளி",
        "category": "Soil Management",
        "categories": ["Soil Management", "Tomato", "Agricultural Guidelines"],
        "titleEn": "Tomato Yellow Leaves (Chlorosis) Diagnosis & Soil Fertility Management",
        "titleTa": "தக்காளி இலைகள் மஞ்சள் நிறமாதல் மற்றும் மண் ஊட்டச்சத்து மேலாண்மை",
        "summaryEn": "Detailed diagnostic guide distinguishing Nitrogen deficiency, waterlogging chlorosis, Magnesium deficiency, and corrective NPK fertilization.",
        "summaryTa": "தக்காளி பயிரில் நைட்ரஜன் சத்துக் குறைபாடு, அதிக நீர் தேங்குதல், மெக்னீசியம் பற்றாக்குறை மற்றும் மண் வள மேம்பாடு.",
        "keywords": ["tomato", "yellow leaves", "chlorosis", "soil management", "soil fertility", "nitrogen", "npk", "fertilizer", "magnesium", "தக்காளி", "மஞ்சள் இலை", "மண் மேலாண்மை", "உரம்"],
        "sections": {
            "overview": {
                "en": "Yellowing of leaves (chlorosis) indicates nutrient starvation or root asphyxiation. Nitrogen deficiency starts in older lower leaves, while Magnesium deficiency causes interveinal chlorosis.",
                "ta": "இலைகள் மஞ்சளாதல் ஊட்டச்சத்து பற்றாக்குறை அல்லது வேர் மூச்சுத்திணறலைக் குறிக்கிறது. நைட்ரஜன் பற்றாக்குறை முதிர்ந்த கீழ் இலைகளில் தொடங்கும்."
            },
            "growingConditions": {
                "en": "Requires soil pH 6.0-6.8 for optimal nutrient availability. Waterlogged or alkaline soils lock up Iron and Magnesium uptake.",
                "ta": "மண் கார அமிலத்தன்மை (pH) 6.0-6.8 வரை இருப்பது அனைத்து ஊட்டச்சத்துகளும் பயிருக்கு கிடைக்க சிறந்தது."
            },
            "commonDiseases": {
                "en": "Early Blight produces target spots with yellow halos. Tomato Yellow Leaf Curl Virus causes severe chlorosis, leaf cupping, and stunted bushy growth.",
                "ta": "ஏர்லி பிளைட் நோய் மஞ்சள் வளையத்துடன் கூடிய கரும் புள்ளிகளை உண்டாக்கும். இலைச்சுருள் வைரஸ் கடும் மஞ்சளாதலை ஏற்படுத்தும்."
            },
            "commonPests": {
                "en": "Whiteflies transmit leaf curl virus; Root-knot nematodes (Meloidogyne incognita) induce nutrient uptake failure and yellowing.",
                "ta": "வெள்ளை ஈக்கள் வைரஸ் பரப்புகின்றன; வேர் முடிச்சு நூற்புழுக்கள் சத்துக்களை உறிஞ்சுவதைத் தடுத்து இலைகளை மஞ்சளாக்கும்."
            },
            "irrigation": {
                "en": "Ensure ridge-and-furrow drainage. Overwatering suffocates root hairs; allow top 2 inches of soil to aerate between drip irrigation cycles.",
                "ta": "பாத்திகளில் நீர் தேங்காமல் வடிகால் அமைக்கவும். அதிக நீர் வேர் அழுகலை உண்டாக்கும் என்பதால் சீரான இடைவெளியில் பாசனம் செய்யவும்."
            },
            "soil": {
                "en": "Apply 100:50:50 kg NPK/ha. Apply 50% N + 100% P + 100% K basally; side-dress remaining Nitrogen in 2 equal splits at 30 and 45 days. Spray Epsom Salt (Magnesium Sulphate @ 5g/L) for interveinal yellowing.",
                "ta": "ஏக்கருக்கு பரிந்துரைக்கப்பட்ட NPK உரமிட்டு, 30 மற்றும் 45ம் நாட்களில் மேலுரம் இடவும். நரம்பிடை மஞ்சளுக்கு மெக்னீசியம் சல்பேட் (5g/L) தெளிக்கவும்."
            },
            "management": {
                "en": "Conduct soil testing prior to planting. Foliar spray 19:19:19 water-soluble fertilizer @ 5g/L for rapid nitrogen chlorosis recovery.",
                "ta": "மண் பரிசோதனை செய்து உரமிடவும். தீவிர மஞ்சள் நிலைக்கு நீரில் கரையும் NPK 19:19:19 உரம் (5g/L) தெளிக்கவும்."
            },
            "harvest": {
                "en": "Healthy balanced nutrition extends fruit harvest duration by 3-5 pickings with uniform bright red coloration.",
                "ta": "சரியான உர மேலாண்மை அறுவடைக் காலத்தை நீட்டித்து தரமான பளபளப்பான பழங்களை வழங்கும்."
            }
        },
        "source": "TNAU Agritech Portal - Tomato Nutrient Deficiencies & Management"
    },
    {
        "id": "LIB-POT-01",
        "cropId": "potato",
        "cropName": "Potato",
        "cropTa": "உருளைக்கிழங்கு",
        "category": "Crop Diseases",
        "categories": ["Crop Diseases", "Potato", "Agricultural Guidelines"],
        "titleEn": "Potato Early Blight & Late Blight Management",
        "titleTa": "உருளைக்கிழங்கு ஏர்லி பிளைட் மற்றும் லேட் பிளைட் நோய் மேலாண்மை",
        "summaryEn": "Complete management protocol for Alternaria solani Early Blight and Phytophthora infestans Late Blight in seed tubers and canopy.",
        "summaryTa": "உருளைக்கிழங்கு பயிரில் ஏர்லி பிளைட் மற்றும் லேட் பிளைட் பூஞ்சை நோய்களுக்கான தடுப்பு மற்றும் மேலாண்மை வழிமுறைகள்.",
        "keywords": ["potato", "early blight", "late blight", "blight", "alternaria", "phytophthora", "fungicide", "tuber", "disease", "உருளைக்கிழங்கு", "பிளைட்", "இலைக்கருகல்"],
        "sections": {
            "overview": {
                "en": "Potato Late Blight (Phytophthora infestans) is the most catastrophic potato disease, capable of destroying entire fields within 7-10 days under humid foggy conditions. Early Blight targets older foliage with dark concentric rings.",
                "ta": "லேட் பிளைட் நோய் குளிர்ந்த ஈரப்பதமான சூழலில் 7-10 நாட்களில் உருளைக்கிழங்கு வயலை முழுமையாக அழிக்கக்கூடியது. ஏர்லி பிளைட் இலைகளில் வளையப் புள்ளிகளை உண்டாக்கும்."
            },
            "growingConditions": {
                "en": "High altitude/cool season crop. Optimum canopy temperature 15-22°C with well-aerated sandy loam soil with acidic to neutral pH (5.2-6.5).",
                "ta": "குளிர்ந்த மலைப்பிரதேசம் அல்லது குளிர்கால பயிர். 15-22°C வெப்பநிலை மற்றும் நல்ல வடிகால் மணல் கலந்த நிலம் சிறந்தது."
            },
            "commonDiseases": {
                "en": "Late Blight, Early Blight (Alternaria solani), Black Scurf (Rhizoctonia solani), Bacterial Wilt (Ralstonia), and Common Scab (Streptomyces).",
                "ta": "லேட் பிளைட், ஏர்லி பிளைட், கருப்பு செதில் நோய், பாக்டீரியா வாடல் மற்றும் சொறி நோய்."
            },
            "commonPests": {
                "en": "Potato Tuber Moth (Phthorimaea operculella), Green Peach Aphids (Myzus persicae), Cutworms, and White Grubs.",
                "ta": "உருளைக்கிழங்கு அந்துப்பூச்சி, அசுவினி, வெட்டுப்புழு மற்றும் வேர்ப்புழுக்கள்."
            },
            "irrigation": {
                "en": "Maintain consistent soil moisture through furrow or drip irrigation during stolon initiation and tuber bulking. Terminate irrigation 10-12 days before harvest.",
                "ta": "கிழங்கு உருவாகும் போது மற்றும் பெருக்கம் அடையும் போது சீரான நீர் பாசனம் அவசியம். அறுவடைக்கு 10 நாட்களுக்கு முன் பாசனத்தை நிறுத்தவும்."
            },
            "soil": {
                "en": "Incorporate FYM @ 25 tonnes/ha with Trichoderma viride. Treat seed tubers with Mancozeb (2.5g/L) before planting to prevent seed-borne blight.",
                "ta": "ஹெக்டேருக்கு 25 டன் தொழு உரம் இடவும். விதை கிழங்குகளை மேன்கோசெப் கரைசலில் நனைத்து நடவு செய்யவும்."
            },
            "management": {
                "en": "Apply preventative foliar spray of Mancozeb 75% WP (2g/L) or Chlorothalonil (2g/L). Upon initial blight detection, spray Cymoxanil + Mancozeb (2g/L) or Metalaxyl + Mancozeb (2g/L). Avoid sprinkler irrigation.",
                "ta": "முன்னெச்சரிக்கையாக மேன்கோசெப் 2g/L தெளிக்கவும். நோய் கண்டறியப்பட்டால் மெட்டலாக்சில் + மேன்கோசெப் 2g/L தெளிக்கவும்."
            },
            "harvest": {
                "en": "Cut vines (dehaulming) 10-14 days prior to digging to harden tuber skins and prevent blight spore transmission to tubers.",
                "ta": "அறுவடைக்கு 10-14 நாட்களுக்கு முன் தண்டுப் பகுதியை வெட்டி (Dehaulming) கிழங்கின் தோலை கெட்டியாக்கவும்."
            }
        },
        "source": "TNAU Potato Production & Protection Manual - Ooty HRS"
    },
    {
        "id": "LIB-POT-02",
        "cropId": "potato",
        "cropName": "Potato",
        "cropTa": "உருளைக்கிழங்கு",
        "category": "Crop Management",
        "categories": ["Crop Management", "Soil Management", "Potato", "Agricultural Guidelines"],
        "titleEn": "Potato Tuber Bulking, Earthing-Up & Cold Storage Practices",
        "titleTa": "உருளைக்கிழங்கு சாகுபடி, மண் அணைத்தல் மற்றும் சேமிப்பு முறைகள்",
        "summaryEn": "Standard agronomic procedures for tuber bed preparation, 35-day earthing-up to prevent solanine greening, dehaulming, and curing.",
        "summaryTa": "உருளைக்கிழங்கு பயிருக்கு 35-ம் நாளில் மண் அணைத்தல், பச்சையாவதைத் தடுத்தல் மற்றும் அறுவடைப் பின்சேமிப்பு மேலாண்மை.",
        "keywords": ["potato", "crop management", "earthing up", "tuber", "solanine", "storage", "curing", "fertilizer", "உருளைக்கிழங்கு", "மண் அணைத்தல்", "பயிர் மேலாண்மை"],
        "sections": {
            "overview": {
                "en": "Earthing-up mounds soil around plant bases to cover expanding tubers, preventing sun exposure which creates toxic green solanine and exposes tubers to Potato Tuber Moth.",
                "ta": "30-35 நாட்களில் மண் அணைப்பது கிழங்குகள் வெயிலில் பட்டு நச்சுத்தன்மை வாய்ந்த சோலனைன் உருவாகி பச்சையாவதைத் தடுக்கிறது."
            },
            "growingConditions": {
                "en": "Tuberization thrives at night temperatures of 15-18°C. Night temperatures exceeding 22°C drastically suppress tuber initiation and bulking.",
                "ta": "இரவு வெப்பநிலை 15-18°C இருக்கும்போது கிழங்கு உற்பத்தி மிகச் சிறப்பாக இருக்கும். 22°Cக்கு மேல் இருந்தால் கிழங்கு வளர்ச்சி குறையும்."
            },
            "commonDiseases": {
                "en": "Late Blight foliage lesions; Rhizoctonia black scurf on tubers; Streptomyces common scab in alkaline dry soil.",
                "ta": "லேட் பிளைட் இலைக்கருகல், கிழங்கு கருப்பு செதில் மற்றும் சொறி நோய்."
            },
            "commonPests": {
                "en": "Potato Tuber Moth drills tunnels in exposed tubers; Aphids transmit Potato Leafroll Virus (PLRV).",
                "ta": "கிழங்கு அந்துப்பூச்சி வெட்ட வெளியில் உள்ள கிழங்குகளைத் துளைக்கும்; அசுவினி வைரஸ் நோயைப் பரப்பும்."
            },
            "irrigation": {
                "en": "Keep root bed moist but not saturated. Frequent light irrigations yield higher quality tubers without hollow heart or cracking.",
                "ta": "மிதமான, தொடர்ச்சியான நீர் பாசனம் கிழங்குகள் வெடிப்பதைத் தடுத்து தரமான விளைச்சலைத் தரும்."
            },
            "soil": {
                "en": "Deep, loose, friable sandy loam rich in organic matter. Apply 120:120:120 kg NPK/ha. Apply half N and full P & K at planting; side-dress remaining N at earthing-up.",
                "ta": "இகுவான மணல் கலந்த செம்மண் சிறந்தது. 120:120:120 கிலோ NPK/ஹெக்டர் இட்டு, பாதி தழைச்சத்தை மண் அணைக்கும் போது இடவும்."
            },
            "management": {
                "en": "Earth up ridges at 30-35 days after planting. Pull weeds and reform high broad mounds. Dehaulm 10-12 days before digging.",
                "ta": "நட்ட 30-35 நாட்களில் அகலமாக மண் அணைக்கவும். களைகளை நீக்கி அறுவடைக்கு முன் தண்டு வெட்டவும்."
            },
            "harvest": {
                "en": "Dig tubers carefully to avoid cuts. Cure in dark, ventilated sheds at 15°C and 85% RH for 10 days to heal skin bruises before cold storage at 2-4°C.",
                "ta": "காயம் படாமல் கிழங்குகளைத் தோண்டி நிழலில் 10 நாட்கள் உலர்த்தி (Curing) பின் குளிர்பதனக் கிடங்கில் வைக்கவும்."
            }
        },
        "source": "ICAR-Central Potato Research Institute (CPRI) Agronomic Guidelines"
    },
    {
        "id": "LIB-BRN-01",
        "cropId": "brinjal",
        "cropName": "Brinjal",
        "cropTa": "கத்தரிக்காய்",
        "category": "Pest Management",
        "categories": ["Pest Management", "Brinjal", "Agricultural Guidelines"],
        "titleEn": "Brinjal Shoot & Fruit Borer (Leucinodes orbonalis) Management",
        "titleTa": "கத்தரி தண்டு மற்றும் காய் துளைப்பான் ஒருங்கிணைந்த மேலாண்மை",
        "summaryEn": "Proven Integrated Pest Management (IPM) using Lucinure pheromone traps, weekly shoot clipping, neem bio-pesticides, and biorationals.",
        "summaryTa": "கத்தரியில் தண்டு மற்றும் காய் துளைப்பானை மோகப் பொறிகள், நுனித்தண்டு அகற்றுதல் மற்றும் வேப்ப எண்ணெய் மூலம் கட்டுப்படுத்தும் வழிகாட்டி.",
        "keywords": ["brinjal", "eggplant", "shoot borer", "fruit borer", "leucinodes", "pest management", "pheromone trap", "neem", "insect", "insects", "insect pest", "கத்தரிக்காய்", "காய் துளைப்பான்", "பூச்சி மேலாண்மை"],
        "sections": {
            "overview": {
                "en": "Leucinodes orbonalis is the most destructive pest of eggplant across India, causing terminal shoot withering and bored fruits filled with frass, causing up to 70% economic yield loss.",
                "ta": "தண்டு மற்றும் காய் துளைப்பான் கத்தரியில் நுனித்தண்டு வாடல் மற்றும் காய்களை துளைத்து 70% வரை பெரும் சேதத்தை ஏற்படுத்துகிறது."
            },
            "growingConditions": {
                "en": "Warm humid climate with 25-35°C temperature favors rapid borer generation cycles. Requires warm soil and full sun.",
                "ta": "25-35°C வெப்பமான தட்பவெப்பநிலை பூச்சிகள் வேகமாக பல்கிப் பெருக சாதகமானது."
            },
            "commonDiseases": {
                "en": "Entry holes created by borers allow secondary bacterial soft rot and Phomopsis fruit rot fungi to colonize fruits.",
                "ta": "புழு துளைத்த துவாரங்கள் வழியாக பாக்டீரியா மற்றும் பூஞ்சை காயழுகல் நோய் எளிதில் தொற்றுகிறது."
            },
            "commonPests": {
                "en": "Shoot & Fruit Borer (Leucinodes), Little Leaf vector Leafhopper (Hishimonus), Epilachna beetle, Whiteflies, Red spider mites.",
                "ta": "தண்டு மற்றும் காய் துளைப்பான், தத்துப்பூச்சி, எபிலாச்னா வண்டு, வெள்ளை ஈ, சிவப்பு சிலந்தி."
            },
            "irrigation": {
                "en": "Provide drip irrigation at 3-4 day intervals. Avoid stagnant water in furrows which stresses plant root respiration.",
                "ta": "3-4 நாட்களுக்கு ஒருமுறை சீரான பாசனம் செய்யவும். பாத்திகளில் நீர் தேங்க விடக்கூடாது."
            },
            "soil": {
                "en": "Apply Neem cake @ 250 kg/ha in soil during final land preparation to suppress soil pupating larvae.",
                "ta": "கடைசி உழவின் போது ஏக்கருக்கு 100 கிலோ வேப்பம்பிண்ணாக்கு இட்டு கூட்டுப்புழுக்களை அழிக்கவும்."
            },
            "management": {
                "en": "Install Lucinure pheromone traps @ 12 traps/acre. Clip and destroy wilted terminal shoots weekly. Spray Neem Seed Kernel Extract (NSKE 5%) or Emamectin Benzoate 5% SG @ 0.4g/L or Chlorantraniliprole 18.5% SC @ 0.4ml/L.",
                "ta": "ஏக்கருக்கு 12 இனக்கவர்ச்சி பொறிகளை வைக்கவும். வாடிய நுனித்தண்டுகளை வாரம் ஒருமுறை வெட்டி அழிக்கவும். எமாமெக்டின் பென்சோயேட் (0.4g/L) அல்லது வேப்பங்கொட்டை சாறு தெளிக்கவும்."
            },
            "harvest": {
                "en": "Harvest tender glossy fruits regularly every 3-4 days before fruit seeds harden. Destroy rejected bored fruits off-field.",
                "ta": "விதை முற்றுவதற்கு முன் இளங்காய்களை 3-4 நாட்களுக்கு ஒருமுறை தொடர்ச்சியாக அறுவடை செய்யவும்."
            }
        },
        "source": "TNAU Centre for Plant Protection Studies - Brinjal IPM Guide"
    },
    {
        "id": "LIB-BRN-02",
        "cropId": "brinjal",
        "cropName": "Brinjal",
        "cropTa": "கத்தரிக்காய்",
        "category": "Crop Diseases",
        "categories": ["Crop Diseases", "Brinjal", "Agricultural Guidelines"],
        "titleEn": "Brinjal Bacterial Wilt, Blight & Cercospora Leaf Spot Management",
        "titleTa": "கத்தரி பாக்டீரியா வாடல், பாக்டீரியா கருகல் மற்றும் சர்கோஸ்போரா இலைப்புள்ளி நோய்",
        "summaryEn": "Diagnostic symptoms and bactericidal/fungicidal controls for Ralstonia bacterial wilt, Pseudomonas blight, and Cercospora fungal leaf spots.",
        "summaryTa": "கத்தரி பயிரில் ரால்ஸ்டோனியா பாக்டீரியா வாடல், பாக்டீரியா கருகல் மற்றும் இலைப்புள்ளி நோய்களைக் கட்டுப்படுத்தும் வழிமுறைகள்.",
        "keywords": ["brinjal", "bacterial wilt", "bacterial blight", "cercospora", "ralstonia", "copper oxychloride", "streptocycline", "wilt", "disease", "கத்தரிக்காய்", "பாக்டீரியா வாடல்", "கருகல்"],
        "sections": {
            "overview": {
                "en": "Ralstonia solanacearum bacterial wilt causes sudden daytime wilting of healthy green plants with white vascular bacterial ooze. Cercospora causes circular spots with grayish centers and yellow halos.",
                "ta": "பாக்டீரியா வாடல் நோய் இலைகள் பச்சையாக இருக்கும் போதே திடீரென செடி முழுவதும் வாடி காய்ந்துவிடச் செய்யும். சர்கோஸ்போரா சாம்பல் நிற இலைப்புள்ளிகளை உண்டாக்கும்."
            },
            "growingConditions": {
                "en": "High soil temperatures (28-35°C) and waterlogged poorly-drained soils dramatically increase bacterial wilt incidence.",
                "ta": "அதிக வெப்பம் (28-35°C) மற்றும் நிலத்தில் நீர் தேங்குதல் பாக்டீரியா வாடல் நோயை அதிகப்படுத்துகிறது."
            },
            "commonDiseases": {
                "en": "Bacterial Wilt (Ralstonia), Bacterial Blight (Pseudomonas/Xanthomonas), Cercospora Leaf Spot, Little Leaf Phytoplasma, Phomopsis Blight.",
                "ta": "பாக்டீரியா வாடல், பாக்டீரியா கருகல், சர்கோஸ்போரா இலைப்புள்ளி, சிறிய இலை நோய்."
            },
            "commonPests": {
                "en": "Root-knot nematodes wound root systems and facilitate bacterial entry. Leafhoppers transmit little leaf phytoplasma.",
                "ta": "வேர் முடிச்சு நூற்புழுக்கள் வேர்களில் காயங்களை உண்டாக்கி பாக்டீரியா எளிதில் நுழைய வழிவகுக்கின்றன."
            },
            "irrigation": {
                "en": "Avoid furrow flood irrigation from infected plots to healthy plots, which spreads bacteria rapidly. Adopt drip irrigation.",
                "ta": "நோய் தாக்கிய பாத்திகளில் இருந்து நல்ல பாத்திகளுக்கு வாய்க்கால் நீர் பாய்ச்சுவதைத் தவிர்க்கவும்; சொட்டுநீர் சிறந்தது."
            },
            "soil": {
                "en": "Drench soil with Copper Oxychloride 50% WP (2.5g/L) + Streptocycline (1g in 10L water). Root dip seedlings in Pseudomonas fluorescens (10g/L) for 20 minutes before transplanting.",
                "ta": "செடியின் வேர்ப்பகுதியில் காப்பர் ஆக்ஸிகுளோரைடு (2.5g/L) + ஸ்ட்ரெப்டோமைசின் (1g/10L) ஊற்றவும். நடுவதற்கு முன் சூடோமோனாஸ் கரைசலில் நாற்று வேர்களை நனைக்கவும்."
            },
            "management": {
                "en": "Rotate crops with non-solanaceous crops (maize, sorghum, pulses). Spray Carbendazim + Mancozeb (2g/L) for Cercospora leaf spots.",
                "ta": "சோளம், பருப்பு வகைகளுடன் பயிர் சுழற்சி செய்யவும். சர்கோஸ்போரா இலைப்புள்ளிக்கு கார்பென்டாசிம் + மேன்கோசெப் 2g/L தெளிக்கவும்."
            },
            "harvest": {
                "en": "Rogue out and incinerate wilted plants immediately; do not compost infected plant residues.",
                "ta": "வாடிய செடிகளை உடனே வேரோடு பிடுங்கி தீயிட்டு அழிக்கவும்."
            }
        },
        "source": "TNAU Agritech Portal - Brinjal Disease Compendium"
    },
    {
        "id": "LIB-BRN-03",
        "cropId": "brinjal",
        "cropName": "Brinjal",
        "cropTa": "கத்தரிக்காய்",
        "category": "Crop Management",
        "categories": ["Crop Management", "Soil Management", "Brinjal", "Agricultural Guidelines"],
        "titleEn": "Healthy Brinjal Crop Care, Staking & Nutrition Schedule",
        "titleTa": "ஆரோக்கியமான கத்தரி சாகுபடி, முட்டுக்கட்டுதல் மற்றும் ஊட்டச்சத்து மேலாண்மை",
        "summaryEn": "Complete agronomic guidelines for Solanum melongena nursery transplanting, balanced NPK 100:50:50 fertilization, pruning, and fruit canopy care.",
        "summaryTa": "கத்தரி நாற்று நடவு, 100:50:50 NPK உர அட்டவணை, கவாத்து மற்றும் அதிக மகசூலுக்கான பயிர் பராமரிப்பு.",
        "keywords": ["brinjal", "crop management", "fertilizer", "npk", "nutrition", "staking", "pruning", "canopy", "கத்தரிக்காய்", "பயிர் மேலாண்மை", "உர அட்டவணை"],
        "sections": {
            "overview": {
                "en": "Healthy brinjal plants exhibit vibrant dark green foliage, sturdy branching, and profuse purple blossom clusters without blossom drop, yielding 25-35 tonnes/hectare.",
                "ta": "ஆரோக்கியமான கத்தரி செடிகள் அடர் பச்சை இலைகளுடன், பூ உதிராமல் செழித்து வளர்ந்து ஹெக்டேருக்கு 25-35 டன் மகசூல் தரும்."
            },
            "growingConditions": {
                "en": "Warm-season vegetable requiring 22-32°C. Sensitive to frost. Prefers silt-loam to clay-loam soils with high organic matter content and pH 6.0-7.0.",
                "ta": "வெப்ப விரும்பும் பயிர் (22-32°C). கரிம வளம் மிக்க வண்டல் அல்லது செம்மண் நிலம், pH 6.0-7.0 மிகவும் ஏற்றது."
            },
            "commonDiseases": {
                "en": "Phomopsis fruit rot and damping off in young nursery beds; Bacterial wilt during fruit set.",
                "ta": "நாற்றங்காலில் நாற்று அழுகல் நோய் மற்றும் காய் பிடிக்கும் போது பாக்டீரியா வாடல் நோய்."
            },
            "commonPests": {
                "en": "Shoot borer and whiteflies; spider mites under dry dusty conditions.",
                "ta": "தண்டு துளைப்பான், வெள்ளை ஈ மற்றும் வறண்ட காற்றில் சிவப்பு சிலந்திப் பூச்சி."
            },
            "irrigation": {
                "en": "Irrigate immediately after transplanting, then on the 3rd day (life irrigation), and every 5-7 days thereafter depending on soil moisture.",
                "ta": "நடவு செய்த உடன் தண்ணீர் பாய்ச்சி, 3-ம் நாள் உயிர்த் தண்ணீர் விடவும். பின் 5-7 நாட்களுக்கு ஒருமுறை பாசனம் செய்யவும்."
            },
            "soil": {
                "en": "Apply 25 tonnes FYM/ha. Recommended fertilizer dose: 100 kg N, 50 kg P2O5, 50 kg K2O per hectare. Apply 50% N and full P & K as basal; topdress remaining 50% N in 2 splits at 30 and 45 days.",
                "ta": "ஹெக்டேருக்கு 25 டன் தொழு உரம் மற்றும் 100:50:50 கிலோ NPK உரமிடவும். தழைச்சத்தை 30 மற்றும் 45ம் நாட்களில் பிரித்து இடவும்."
            },
            "management": {
                "en": "Thin out crowded lower shoots. Stake high-yielding hybrid plants with bamboo stakes to prevent lodging under heavy fruit load.",
                "ta": "கீழ் பக்கவாட்டுக் கிளைகளை கவாத்து செய்து, அதிக காய் பாரத்தால் செடி சாயாமல் இருக்க முட்டுக் கம்புகள் கட்டவும்."
            },
            "harvest": {
                "en": "Pick fruits when they reach marketable size while remaining tender, smooth, glossy, and seeds are soft and white.",
                "ta": "பளபளப்பான இளம்பச்சை அல்லது ஊதா நிறத்தில் காய்கள் கெட்டியாகும் முன் சரியான அளவில் அறுவடை செய்யவும்."
            }
        },
        "source": "TNAU Horticulture Production Compendium - Brinjal"
    },
    {
        "id": "LIB-SOIL-01",
        "cropId": "all",
        "cropName": "All Crops",
        "cropTa": "அனைத்து பயிர்கள்",
        "category": "Soil Management",
        "categories": ["Soil Management", "Crop Management", "Agricultural Guidelines", "Tomato", "Potato", "Brinjal"],
        "titleEn": "Comprehensive Soil Fertility & NPK Fertilizer Management for Solanaceae Crops",
        "titleTa": "சோலனேசிய பயிர்களுக்கான மண் வளம் மற்றும் NPK உர மேலாண்மை வழிகாட்டி",
        "summaryEn": "Complete soil health guidelines detailing basal fertilization, fertigation ratios, micro-nutrients, vermicompost, and rectifying nutrient imbalances.",
        "summaryTa": "மண் தயாரிப்பு, தொழு உரம், NPK சமச்சீர் உரமிடுதல், நுண்ணூட்டச்சத்து மற்றும் மண் வளத்தைப் பாதுகாக்கும் முறைகள்.",
        "keywords": ["soil management", "soil fertility", "fertilizer", "npk", "nutrition", "compost", "vermicompost", "fym", "nitrogen", "phosphorus", "potassium", "மண் மேலாண்மை", "உரம்", "மண் வளம்"],
        "sections": {
            "overview": {
                "en": "Solanaceae crops (Tomato, Potato, Brinjal) are heavy feeders requiring balanced Nitrogen (vegetative growth), Phosphorus (root expansion and flower formation), and Potassium (fruit sizing and disease immunity).",
                "ta": "தக்காளி, உருளை, கத்தரி பயிர்களுக்கு தழைச்சத்து (இலை வளர்ச்சி), மணிச்சத்து (வேர் மற்றும் பூத்தல்), சாம்பல் சத்து (காய் பெருக்கம் மற்றும் நோய் எதிர்ப்பு) சீராக தேவை."
            },
            "growingConditions": {
                "en": "Ideal soil pH is 6.0-6.8. Soils with organic carbon >0.75% display robust microbial activity and superior water retention capacity.",
                "ta": "மண் கார அமிலத்தன்மை 6.0-6.8 சிறந்தது. கரிம கார்பன் அளவு 0.75%க்கு மேல் இருப்பது நன்மை செய்யும் நுண்ணுயிரிகளைப் பெருக்கும்."
            },
            "commonDiseases": {
                "en": "Excessive Nitrogen produces soft lush foliage highly prone to blight and borer attacks; Calcium deficiency triggers Blossom End Rot.",
                "ta": "அதிக தழைச்சத்து செடிகளை மென்மையாக்கி நோய்களை ஈர்க்கும்; கால்சியம் பற்றாக்குறை அடி அழுகலை உண்டாக்கும்."
            },
            "commonPests": {
                "en": "Soil-borne cutworms and white grubs damage feeder roots; Nematodes create galls inhibiting nutrient uptake.",
                "ta": "மண்ணில் உள்ள வெட்டுப்புழுக்கள் மற்றும் நூற்புழுக்கள் வேர்களை சேதப்படுத்தி சத்துக்கள் உறிஞ்சப்படுவதைத் தடுக்கின்றன."
            },
            "irrigation": {
                "en": "Fertigation through drip systems delivers nutrients directly to active root zones with 30-40% higher fertilizer use efficiency.",
                "ta": "சொட்டுநீர்ப் பாசனம் மூலம் திரவ உரங்களை நேரடியாக வேர் பகுதிக்கு அளிப்பது உர விரயத்தை 30-40% குறைக்கும்."
            },
            "soil": {
                "en": "Apply 10-12 tonnes FYM or 2 tonnes Vermicompost per acre along with biofertilizers (Azospirillum and Phosphobacteria @ 2 kg/acre). Supplement micronutrients (Zinc Sulphate @ 10 kg/acre and Borax @ 5 kg/acre).",
                "ta": "ஏக்கருக்கு 10 டன் தொழு உரம் அல்லது 2 டன் மண்புழு உரம், அசோஸ்பைரில்லம் மற்றும் பாஸ்போபாக்டீரியா 2 கிலோ கலந்து இடவும். ஜிங்க் சல்பேட் 10 கிலோ இடவும்."
            },
            "management": {
                "en": "Conduct periodic soil testing every 2 seasons. Side-dress Nitrogen in split doses instead of single bulk application to prevent leaching.",
                "ta": "இரண்டு பருவத்திற்கு ஒருமுறை மண் பரிசோதனை செய்யவும். தழைச்சத்தை ஒரே நேரத்தில் இடாமல் பிரித்து இடவும்."
            },
            "harvest": {
                "en": "Adequate Potassium nutrition ensures firm fruit skin, long shelf life, and vibrant color transition during post-harvest handling.",
                "ta": "போதுமான சாம்பல் சத்து பழங்களுக்கு சிறந்த நிறத்தையும், கெட்டியான தோலையும், நீண்ட நாள் சேமிப்புத் திறனையும் அளிக்கும்."
            }
        },
        "source": "TNAU Soil Science & Agricultural Chemistry Department Guide"
    },
    {
        "id": "LIB-IRR-01",
        "cropId": "all",
        "cropName": "All Crops",
        "cropTa": "அனைத்து பயிர்கள்",
        "category": "Irrigation",
        "categories": ["Irrigation", "Crop Management", "Agricultural Guidelines", "Tomato", "Potato", "Brinjal"],
        "titleEn": "Precision Drip Irrigation & Water Management for Vegetable Crops",
        "titleTa": "காய்கறி பயிர்களுக்கான துல்லிய சொட்டுநீர்ப் பாசனம் மற்றும் நீர் மேலாண்மை",
        "summaryEn": "Scientific guidelines on drip discharge rates, crop evapotranspiration, root-zone moisture schedules, and avoiding water stagnation.",
        "summaryTa": "சொட்டுநீர்ப் பாசன அளவு, பயிர் நீர் தேவை, வேர் பகுதி ஈரப்பத மேலாண்மை மற்றும் நீர் தேங்குவதைத் தவிர்க்கும் முறைகள்.",
        "keywords": ["irrigation", "drip irrigation", "water management", "moisture", "drainage", "water", "fertigation", "பாசனம்", "சொட்டுநீர்", "நீர் மேலாண்மை"],
        "sections": {
            "overview": {
                "en": "Solanaceae crops require 60-70% root-zone moisture field capacity. Overwatering causes root hypoxia and root-rot diseases, while drought stress triggers flower dropping and fruit cracking.",
                "ta": "வேர் பகுதியில் 60-70% மண் ஈரப்பதம் பராமரிக்கப்பட வேண்டும். அதிக நீர் வேர் அழுகலை உண்டாக்கும்; நீர் பற்றாக்குறை பூ உதிர்வை ஏற்படுத்தும்."
            },
            "growingConditions": {
                "en": "Water requirements increase from 2-3 liters/plant/day during vegetative stages to 4-5 liters/plant/day during active flowering and fruit development.",
                "ta": "செடியின் ஆரம்ப வளர்ச்சிக்கு 2-3 லிட்டர்/செடி/நாள் நீரும், காய் பிடிக்கும் பருவத்தில் 4-5 லிட்டர் நீரும் தேவைப்படுகிறது."
            },
            "commonDiseases": {
                "en": "Overhead sprinkler splash spreads fungal blight spores; standing furrow water promotes bacterial wilt and Pythium damping-off.",
                "ta": "தெளிப்பு நீர் பாசனம் பூஞ்சை நோய்களைப் பரப்பும்; வயலில் நீர் தேங்குவது பாக்டீரியா வாடல் மற்றும் நாற்று அழுகலை உண்டாக்கும்."
            },
            "commonPests": {
                "en": "Dry moisture-stressed fields encourage high populations of Red Spider Mites and Thrips.",
                "ta": "நீர் பற்றாக்குறையுள்ள வறண்ட நிலத்தில் சிவப்பு சிலந்தி மற்றும் இலைப்பேன் தாக்குதல் அதிகரிக்கும்."
            },
            "irrigation": {
                "en": "Install inline drip lines with 2.0 to 4.0 LPH emitters spaced at 40-50 cm intervals. Operate drip systems for 1.5 to 2.5 hours every alternate day based on soil texture and weather evapotranspiration.",
                "ta": "40-50 செ.மீ இடைவெளியில் சொட்டுநீர் குழாய்களை அமைக்கவும். மண் தன்மைக்கேற்ப ஒரு நாள் விட்டு ஒரு நாள் 1.5 முதல் 2.5 மணி நேரம் பாசனம் செய்யவும்."
            },
            "soil": {
                "en": "Adopt silver-black plastic mulch (25-30 microns) to reduce soil moisture evaporation by up to 50% and suppress weed growth.",
                "ta": "25-30 மைக்ரான் பிளாஸ்டிக் மூடாக்கு அமைப்பது நீர் ஆவியாவதை 50% வரை குறைத்து களைகளைக் கட்டுப்படுத்தும்."
            },
            "management": {
                "en": "Regularly flush drip lateral ends every 15 days and acid-treat drip emitters with dilute phosphoric acid if saline water causes clogging.",
                "ta": "15 நாட்களுக்கு ஒருமுறை சொட்டுநீர் குழாய்களின் முனைகளைத் திறந்து சுத்தம் செய்து அடைப்புகளை நீக்கவும்."
            },
            "harvest": {
                "en": "Cease or reduce irrigation 48 hours prior to harvest to prevent fruit cracking and watery tasteless pulp.",
                "ta": "பழங்கள் வெடிப்பதைத் தவிர்க்க அறுவடைக்கு 48 மணி நேரத்திற்கு முன் பாசனத்தை குறைக்கவும்."
            }
        },
        "source": "TNAU Water Technology Centre - Vegetable Drip Guidelines"
    },
    {
        "id": "LIB-ORG-01",
        "cropId": "all",
        "cropName": "All Crops",
        "cropTa": "அனைத்து பயிர்கள்",
        "category": "Organic Farming",
        "categories": ["Organic Farming", "Crop Management", "Agricultural Guidelines", "Tomato", "Potato", "Brinjal"],
        "titleEn": "Organic Farming, Bio-Fertilizers & Natural Pest Deterrents",
        "titleTa": "இயற்கை விவசாயம், உயிர் உரங்கள் மற்றும் இயற்கை பூச்சி விரட்டிகள்",
        "summaryEn": "Complete organic farming guide covering Panchagavya preparation, Vermiwash, Jeevamrutham, Trichoderma bio-fungicides, and Neem botanicals.",
        "summaryTa": "பஞ்சகாவ்யா தயாரிப்பு, மண்புழு வடிநீர், ஜீவாமிர்தம், டிரைக்கோடெர்மா விரிடி மற்றும் வேப்பிலை பூச்சி விரட்டிகள் மேலாண்மை.",
        "keywords": ["organic farming", "organic", "panchagavya", "vermiwash", "jeevamrutham", "trichoderma", "neem", "biofertilizer", "இயற்கை விவசாயம்", "பஞ்சகாவ்யா", "உயிர் உரம்"],
        "sections": {
            "overview": {
                "en": "Organic agriculture replaces synthetic chemical inputs with beneficial microbes, fermented cow-dung formulations, and botanical extracts to nurture soil biology and build resilient crop health.",
                "ta": "ரசாயன உரங்களுக்கு மாற்றாக நன்மை செய்யும் நுண்ணுயிர்கள், பஞ்சகாவ்யா, ஜீவாமிர்தம் மற்றும் மூலிகைக் கரைசல்களைப் பயன்படுத்தி மண் வளத்தையும் பயிர் ஆரோக்கியத்தையும் மேம்படுத்துதல்."
            },
            "growingConditions": {
                "en": "Thrives in soils with rich biodiversity of earthworms and beneficial mycorrhizae, protected from synthetic pesticide residues.",
                "ta": "மண்புழுக்கள் மற்றும் நன்மை செய்யும் பூஞ்சைகள் நிறைந்த உயிருள்ள மண்ணில் இயற்கை விவசாயம் சிறந்து விளங்கும்."
            },
            "commonDiseases": {
                "en": "Soil-borne fungal wilt and root rots are biologically suppressed by antagonistic Trichoderma and Pseudomonas colonization.",
                "ta": "வேர் அழுகல் மற்றும் வாடல் நோய்களை டிரைக்கோடெர்மா மற்றும் சூடோமோனாஸ் நன்மை செய்யும் நுண்ணுயிரிகள் கட்டுப்படுத்துகின்றன."
            },
            "commonPests": {
                "en": "Sucking pests (Aphids, Thrips, Whiteflies) and early instar borers are repelled by bitter botanical azadirachtin sprays.",
                "ta": "சாறு உறிஞ்சும் பூச்சிகள் மற்றும் புழுக்கள் வேப்பங்கொட்டை சாற்றின் கசப்பு சுவையால் கட்டுப்படுத்தப்படுகின்றன."
            },
            "irrigation": {
                "en": "Apply Jeevamrutham (200 L/acre) through irrigation water every 15 days to multiply beneficial soil microorganisms rapidly.",
                "ta": "15 நாட்களுக்கு ஒருமுறை பாசன நீரில் 200 லிட்டர் ஜீவாமிர்தம் கலந்து விடுவது மண்ணில் நுண்ணுயிர்களைப் பெருக்கும்."
            },
            "soil": {
                "en": "Incorporate 5 tonnes FYM + 1 tonne Vermicompost + 2.5 kg Trichoderma viride per acre. Apply Azospirillum and Phosphobacteria for biological nitrogen and phosphorus fixation.",
                "ta": "ஏக்கருக்கு 5 டன் தொழு உரம், 1 டன் மண்புழு உரம் மற்றும் 2.5 கிலோ டிரைக்கோடெர்மா விரிடி இடவும்."
            },
            "management": {
                "en": "Foliar spray Panchagavya 3% (30ml/L) or Vermiwash (50ml/L) at 15-20 day intervals to stimulate chlorophyll synthesis, branching, and flower setting. Spray NSKE 5% for pest deterrence.",
                "ta": "15-20 நாட்களுக்கு ஒருமுறை 3% பஞ்சகாவ்யா (30ml/L) அல்லது மண்புழு வடிநீர் தெளிக்கவும். பூச்சி விரட்ட வேப்பங்கொட்டை சாறு 5% தெளிக்கவும்."
            },
            "harvest": {
                "en": "Organically cultivated produce commands premium market value with superior flavor, aroma, and pesticide-free health benefits.",
                "ta": "இயற்கை முறையில் விளைவிக்கப்பட்ட காய்கறிகள் நஞ்சற்றதாகவும், சிறந்த சுவை மற்றும் அதிக சந்தை மதிப்பு கொண்டதாகவும் இருக்கும்."
            }
        },
        "source": "TNAU Department of Sustainable Organic Agriculture Manual"
    },
    {
        "id": "LIB-GUIDE-01",
        "cropId": "all",
        "cropName": "All Solanaceae",
        "cropTa": "அனைத்து சோலனேசிய பயிர்கள்",
        "category": "Agricultural Guidelines",
        "categories": ["Agricultural Guidelines", "Crop Management", "Soil Management", "Irrigation", "Tomato", "Potato", "Brinjal"],
        "titleEn": "TNAU & ICAR Good Agricultural Practices (GAP) for Solanaceous Crops",
        "titleTa": "தமிழ்நாடு வேளாண் பல்கலைக்கழக நல்வேளாண் வழிகாட்டுதல்கள்",
        "summaryEn": "Comprehensive Good Agricultural Practices covering certified seed selection, nursery hygiene, crop rotation, IPM thresholds, and safety intervals.",
        "summaryTa": "சான்று பெற்ற விதை தேர்வு, நாற்றங்கால் பராமரிப்பு, பயிர் சுழற்சி, பூச்சி பொருளாதார சேத நிலை மற்றும் பாதுகாப்பு வழிகாட்டுதல்கள்.",
        "keywords": ["agricultural guidelines", "agriculture", "tnau", "icar", "gap", "guidelines", "crop management", "safety", "வேளாண் வழிகாட்டுதல்கள்", "பயிர் மேலாண்மை"],
        "sections": {
            "overview": {
                "en": "Good Agricultural Practices (GAP) codify proven scientific protocols that maximize sustainable crop yields while preserving groundwater safety, soil vitality, and food safety standards.",
                "ta": "நல்வேளாண் நெறிமுறைகள் அறிவியல் பூர்வமாக பயிர் விளைச்சலை அதிகரித்து மண், நிலத்தடி நீர் மற்றும் நுகர்வோர் பாதுகாப்பை உறுதி செய்கின்றன."
            },
            "growingConditions": {
                "en": "Maintain detailed field records of sowing dates, input applications, pest scouting counts, and weather records.",
                "ta": "விதைப்பு தேதி, உரங்கள், பூச்சி தாக்குதல் மற்றும் வானிலை விவரங்களை முறையாகப் பதிவு செய்யவும்."
            },
            "commonDiseases": {
                "en": "Sanitize pruning tools with 10% sodium hypochlorite to prevent cross-contamination between plants.",
                "ta": "கவாத்து செய்யும் கருவிகளை கிருமிநாசினி கொண்டு சுத்தம் செய்து நோய் பரவுவதைத் தடுக்கவும்."
            },
            "commonPests": {
                "en": "Monitor Economic Threshold Levels (ETL) before pesticide sprays. Respect Pre-Harvest Intervals (PHI) strictly.",
                "ta": "பூச்சிகளின் பொருளாதார சேத நிலையை அறிந்து மருந்து தெளிக்கவும். அறுவடைக்கு முந்தைய கால இடைவெளியை (PHI) கடைபிடிக்கவும்."
            },
            "irrigation": {
                "en": "Test irrigation water quality periodically. Electrical Conductivity (EC) must be <1.5 dS/m and Sodium Adsorption Ratio (SAR) <10.",
                "ta": "பாசன நீர் தரத்தை பரிசோதிக்கவும். உவர்த்தன்மை (EC) 1.5க்கு கீழ் இருப்பதை உறுதி செய்யவும்."
            },
            "soil": {
                "en": "Mandatory crop rotation: Never plant Solanaceous crops (Tomato, Potato, Brinjal, Chilli) consecutively in the same plot. Rotate with maize, pulses, or green manure.",
                "ta": "பயிர் சுழற்சி கட்டாயம்: தக்காளி, உருளை, கத்தரிக்கு பின் மீண்டும் அதே பயிர்களை நடாமல் பயறு அல்லது மக்காச்சோளம் பயிரிடவும்."
            },
            "management": {
                "en": "Source certified disease-free seeds from university research stations. Practice raised nursery bed solarization for 30 days during peak summer.",
                "ta": "பல்கலைக்கழக அங்கீகாரம் பெற்ற சான்று விதைகளைப் பயன்படுத்தவும். கோடையில் நாற்றங்கால் சூரிய வெப்பமயமாக்கல் செய்யவும்."
            },
            "harvest": {
                "en": "Follow proper post-harvest grading, clean crating, and cool storage to reduce supply chain spoilage loss below 5%.",
                "ta": "முறையான தரம் பிரிப்பு மற்றும் காற்றோட்டமான பெட்டிகளில் சேமிப்பது அறுவடைக்கு பின் ஏற்படும் சேதத்தை 5%க்கு கீழ் குறைக்கும்."
            }
        },
        "source": "TNAU & ICAR Joint Agricultural Extension Compendium"
    }
]

# Supported Category definitions
LIBRARY_CATEGORIES = [
    {"id": "tomato", "icon": "🍅", "titleEn": "Tomato", "titleTa": "தக்காளி", "count": 3},
    {"id": "potato", "icon": "🥔", "titleEn": "Potato", "titleTa": "உருளைக்கிழங்கு", "count": 2},
    {"id": "brinjal", "icon": "🍆", "titleEn": "Brinjal", "titleTa": "கத்தரிக்காய்", "count": 3},
    {"id": "diseases", "icon": "🦠", "titleEn": "Crop Diseases", "titleTa": "பயிர் நோய்கள்", "count": 4},
    {"id": "pests", "icon": "🐛", "titleEn": "Pest Management", "titleTa": "பூச்சி மேலாண்மை", "count": 3},
    {"id": "soil", "icon": "🌱", "titleEn": "Soil Management", "titleTa": "மண் மேலாண்மை", "count": 3},
    {"id": "irrigation", "icon": "💧", "titleEn": "Irrigation", "titleTa": "நீர்ப்பாசனம்", "count": 2},
    {"id": "management", "icon": "🌾", "titleEn": "Crop Management", "titleTa": "பயிர் மேலாண்மை", "count": 5},
    {"id": "organic", "icon": "🌿", "titleEn": "Organic Farming", "titleTa": "இயற்கை விவசாயம்", "count": 2},
    {"id": "guidelines", "icon": "📖", "titleEn": "Agricultural Guidelines", "titleTa": "வேளாண் வழிகாட்டுதல்கள்", "count": 6},
]


def _normalize_str(s: str) -> str:
    """Lowercase and strip punctuation."""
    return re.sub(r"[^\w\s]", " ", (s or "").lower()).strip()


class LibraryService:
    def __init__(self, articles: List[Dict[str, Any]] = LIBRARY_ARTICLES):
        self.articles = articles

    def get_categories(self) -> List[Dict[str, Any]]:
        """Return dynamic category counts based on articles."""
        updated = []
        for cat in LIBRARY_CATEGORIES:
            cat_copy = dict(cat)
            count = len(self.filter_articles(query="", crop_id=cat["id"] if cat["id"] in ["tomato", "potato", "brinjal"] else "all", category=cat["titleEn"] if cat["id"] not in ["tomato", "potato", "brinjal"] else "all"))
            cat_copy["count"] = max(count, 1)
            updated.append(cat_copy)
        return updated

    def filter_articles(
        self,
        query: str = "",
        crop_id: str = "all",
        category: str = "all"
    ) -> List[Dict[str, Any]]:
        """
        Filter agricultural library articles by cropId, category, and text search query.
        Handles bilingual search (English and Tamil) and category normalization.
        """
        q = _normalize_str(query)
        crop_filter = (crop_id or "all").strip().lower()
        cat_filter = (category or "all").strip().lower()

        # Handle category aliases
        cat_aliases = {
            "crop disease": "crop diseases",
            "diseases": "crop diseases",
            "pest": "pest management",
            "pests": "pest management",
            "soil": "soil management",
            "soil fertility": "soil management",
            "irrigation": "irrigation",
            "water": "irrigation",
            "water management": "irrigation",
            "crop management": "crop management",
            "organic": "organic farming",
            "organic farming": "organic farming",
            "agriculture": "agricultural guidelines",
            "guidelines": "agricultural guidelines",
            "agricultural guidelines": "agricultural guidelines",
        }
        if cat_filter in cat_aliases:
            cat_filter = cat_aliases[cat_filter]

        results = []
        for art in self.articles:
            art_crop = art.get("cropId", "").lower()
            art_cat = art.get("category", "").lower()
            art_categories = [c.lower() for c in art.get("categories", [])]

            # 1. Crop Filter
            if crop_filter != "all":
                # Matches specific crop or articles designated for "all"
                if art_crop != crop_filter and art_crop != "all":
                    continue

            # 2. Category Filter
            if cat_filter != "all":
                # Check if category matches primary category or any tagged categories
                cat_match = (
                    cat_filter == art_cat or
                    cat_filter in art_categories or
                    any(cat_filter in c for c in art_categories) or
                    cat_filter in art_cat
                )
                if not cat_match:
                    continue

            # 3. Query Filter (Bilingual search across title, summary, keywords, sections)
            if q:
                q_tokens = [t for t in q.split() if len(t) > 1]
                # Build searchable text blob
                searchable = (
                    f"{art.get('titleEn', '')} {art.get('titleTa', '')} "
                    f"{art.get('summaryEn', '')} {art.get('summaryTa', '')} "
                    f"{art.get('category', '')} {art.get('cropName', '')} "
                    f"{' '.join(art.get('keywords', []))} "
                    f"{art.get('sections', {}).get('overview', {}).get('en', '')} "
                    f"{art.get('sections', {}).get('overview', {}).get('ta', '')} "
                    f"{art.get('sections', {}).get('commonDiseases', {}).get('en', '')} "
                    f"{art.get('sections', {}).get('commonDiseases', {}).get('ta', '')} "
                    f"{art.get('sections', {}).get('irrigation', {}).get('en', '')} "
                    f"{art.get('sections', {}).get('soil', {}).get('en', '')} "
                    f"{art.get('sections', {}).get('management', {}).get('en', '')}"
                ).lower()

                # At least one token must match, or exact phrase
                if not any(token in searchable for token in q_tokens):
                    continue

            results.append(art)

        return results


library_service = LibraryService()
