/**
 * SmartFarm AI - Verified Government Agriculture Schemes Dataset & Evaluator
 * Contains verified national and state schemes with official .gov.in / .nic.in portals
 * and deterministic, rule-based eligibility evaluation.
 */

export const VERIFIED_GOVERNMENT_SCHEMES = [
  {
    id: "SCHEME-001",
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    nameTa: "பிரதம மந்திரி கிசான் சம்மான் நிதி (PM-KISAN)",
    agency: "Ministry of Agriculture & Farmers Welfare, Govt. of India",
    agencyTa: "வேளாண்மை மற்றும் விவசாயிகள் நல அமைச்சகம், இந்திய அரசு",
    category: "Income & Financial Support",
    categoryTa: "வருமான ஆதரவு",
    state: "All India",
    description: "Central Sector Scheme providing income support to all landholding farmers' families to procure farm inputs and meet domestic needs.",
    descriptionTa: "விவசாய இடுபொருட்கள் மற்றும் பண்ணை செலவுகளுக்காக அனைத்து நில உரிமையாளர் விவசாயக் குடும்பங்களுக்கும் மத்திய அரசின் நேரடி நிதி உதவித் திட்டம்.",
    benefits: "₹6,000 per year directly transferred to farmer's Aadhaar-seeded bank account in three equal installments of ₹2,000 every 4 months.",
    benefitsTa: "ஆண்டுக்கு ₹6,000 மூன்று தவணைகளாக (தலா ₹2,000) 4 மாதங்களுக்கு ஒருமுறை நேரடியாக விவசாயியின் வங்கிக் கணக்கில் வரவு வைக்கப்படுகிறது.",
    eligibilitySummary: "All landholding farmer families with cultivable agricultural land in their name. Excludes institutional landowners, income tax payees, and constitutional post holders.",
    eligibilitySummaryTa: "விவசாய நில உரிமை உள்ள அனைத்து விவசாயக் குடும்பங்களும் தகுதியுடையவர்கள். வருமான வரி செலுத்துவோர் மற்றும் அரசு ஊழியர்களுக்கு விலக்கு.",
    requiredDocuments: [
      "Aadhaar Card",
      "Land Ownership Record (Patta / Chitta / Land Registration)",
      "Active Bank Account Passbook (Aadhaar-linked)",
      "Mobile Number linked with Aadhaar"
    ],
    officialWebsite: "https://pmkisan.gov.in",
    applicationUrl: "https://pmkisan.gov.in/RegistrationFormNew.aspx",
    officialDomain: "pmkisan.gov.in",
    linkStatus: "verified",
    officialUrl: "https://pmkisan.gov.in",
    hasOfficialPortal: true,
    rules: {
      minLandSize: 0.01,
      maxLandSize: null,
      supportedStates: ["All India"],
      supportedCrops: ["All"]
    }
  },
  {
    id: "SCHEME-002",
    name: "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) - Per Drop More Crop",
    nameTa: "பிரதம மந்திரி கிருஷி சிஞ்சாயி யோஜனா - சொட்டுநீர் பாசன திட்டம்",
    agency: "Department of Agriculture & Farmers Welfare / State Horticulture Depts",
    agencyTa: "தோட்டக்கலை மற்றும் பண்ணைப் பயிர்கள் துறை, தமிழ்நாடு",
    category: "Irrigation & Water Management",
    categoryTa: "நீர்ப்பாசன மேலாண்மை",
    state: "All India",
    description: "Promotes micro-irrigation technologies (Drip and Sprinkler systems) to maximize water-use efficiency, conserve water, and enhance crop productivity.",
    descriptionTa: "நீர் பயன்பாட்டுத் திறனை அதிகரிக்கவும் பயிர் மகசூலை பெருக்கவும் சொட்டுநீர் மற்றும் தெளிப்பு நீர்ப்பாசன தொழில்நுட்பங்களுக்கான அரசு மானியத் திட்டம்.",
    benefits: "Up to 55% to 100% subsidy on installation of micro-irrigation systems. In Tamil Nadu, small and marginal farmers receive 100% subsidy; other farmers receive 75% subsidy.",
    benefitsTa: "சொட்டுநீர்ப் பாசனக் கருவிகளுக்கு 55% முதல் 100% வரை மானியம். தமிழ்நாட்டில் சிறு/குறு விவசாயிகளுக்கு 100% முழு மானியம் வழங்கப்படுகிறது.",
    eligibilitySummary: "Farmers possessing cultivable land with an assured water source (borewell, open well, or farm pond). High priority for horticultural crops (Brinjal, Tomato, Potato).",
    eligibilitySummaryTa: "பாசன நீர் ஆதாரம் மற்றும் விவசாய நிலம் வைத்துள்ள விவசாயிகள். காய்கறி மற்றும் தோட்டக்கலைப் பயிர்களுக்கு முன்னுரிமை.",
    requiredDocuments: [
      "Land Patta and Chitta",
      "Field Map / FMB Sketch",
      "Adangal Extract from Village Administrative Officer (VAO)",
      "Aadhaar Card & Passport Size Photo",
      "Bank Passbook Copy",
      "Soil & Water Test Report (if available)"
    ],
    officialWebsite: "https://pmksy.gov.in",
    applicationUrl: null,
    officialDomain: "pmksy.gov.in",
    linkStatus: "verified",
    officialUrl: "https://pmksy.gov.in",
    hasOfficialPortal: true,
    rules: {
      minLandSize: 0.25,
      maxLandSize: 12.5,
      supportedStates: ["All India", "Tamil Nadu", "Andhra Pradesh", "Karnataka", "Maharashtra", "Uttar Pradesh"],
      supportedCrops: ["Brinjal", "Tomato", "Potato", "Vegetables", "Horticulture", "All"]
    }
  },
  {
    id: "SCHEME-003",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY) - Crop Insurance",
    nameTa: "பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டம் (PMFBY)",
    agency: "Ministry of Agriculture & Farmers Welfare / General Insurance Corporation",
    agencyTa: "வேளாண்மை மற்றும் விவசாயிகள் நல அமைச்சகம்",
    category: "Crop Insurance & Risk Mitigation",
    categoryTa: "பயிர் காப்பீடு",
    state: "All India",
    description: "Comprehensive risk insurance covering yield losses due to non-preventable natural perils: droughts, dry spells, floods, pests, and localized calamities.",
    descriptionTa: "வறட்சி, வெள்ளம், பூச்சித் தாக்குதல் மற்றும் இயற்கை இடர்பாடுகளால் ஏற்படும் பயிர் இழப்புகளுக்கு முழுமையான காப்பீட்டுப் பாதுகாப்பு திட்டம்.",
    benefits: "Maximum actuarial premium subsidy. Farmers pay nominal premium: 2% for Kharif crops, 1.5% for Rabi crops, and 5% for annual commercial/horticultural crops.",
    benefitsTa: "குறைந்த காப்பீட்டுக் கட்டணம்: காரிஃப் பயிர்களுக்கு 2%, ரபி பயிர்களுக்கு 1.5% மற்றும் தோட்டக்கலைப் பயிர்களுக்கு 5% மட்டுமே விவசாயி பங்கு.",
    eligibilitySummary: "All farmers including sharecroppers and tenant farmers growing notified crops (including Tomato, Potato, Brinjal) in notified insurance units/blocks.",
    eligibilitySummaryTa: "அறிவிக்கப்பட்ட வட்டாரங்களில் அறிவிக்கப்பட்ட பயிர்களை சாகுபடி செய்யும் அனைத்து விவசாயிகள் மற்றும் குத்தகை விவசாயிகள்.",
    requiredDocuments: [
      "Land Possession Certificate / Patta / Lease Agreement",
      "Sowing Certificate issued by Village Administrative Officer",
      "Aadhaar Card",
      "Bank Account Details (Bank Passbook)",
      "Crop Sowing Declaration Form"
    ],
    officialWebsite: "https://pmfby.gov.in",
    applicationUrl: "https://pmfby.gov.in/farmerRegistration",
    officialDomain: "pmfby.gov.in",
    linkStatus: "verified",
    officialUrl: "https://pmfby.gov.in",
    hasOfficialPortal: true,
    rules: {
      minLandSize: 0.1,
      maxLandSize: null,
      supportedStates: ["All India"],
      supportedCrops: ["Tomato", "Potato", "Brinjal", "All"]
    }
  },
  {
    id: "SCHEME-004",
    name: "Soil Health Card Scheme (SHC)",
    nameTa: "மண் வள அட்டை திட்டம் (Soil Health Card)",
    agency: "Department of Agriculture, Cooperation & Farmers Welfare",
    agencyTa: "விவசாயம் மற்றும் விவசாயிகள் நலத்துறை",
    category: "Soil Health & Nutrient Management",
    categoryTa: "மண் வளம்",
    state: "All India",
    description: "Provides soil nutrient status cards to farmers every 2-3 years, guiding balanced and customized application of Macro (N, P, K) and Micro nutrients.",
    descriptionTa: "மண்ணின் 12 முக்கிய ஊட்டச்சத்துக்களின் அளவை பரிசோதித்து உர பரிந்துரைகளுடன் விவசாயிகளுக்கு இலவச மண் வள அட்டை வழங்கும் திட்டம்.",
    benefits: "Free testing of soil samples for 12 parameters (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, OC) with tailored fertilizer dose guidelines to cut cultivation cost by 15-25%.",
    benefitsTa: "12 வகையான ஊட்டச்சத்து பரிசோதனை முற்றிலும் இலவசம். சீரான உரப் பரிந்துரை மூலம் சாகுபடி செலவு 20% வரை குறைகிறது.",
    eligibilitySummary: "All practicing farmers across all States and Union Territories with agricultural land.",
    eligibilitySummaryTa: "விவசாய நிலம் வைத்துள்ள அனைத்து விவசாயிகளும் இத்திட்டத்தில் மண் மாதிரி கொடுத்து பயன்பெறலாம்.",
    requiredDocuments: [
      "Farmer Aadhaar Card",
      "Field Survey Number / Patta Details",
      "Mobile Number for SMS updates"
    ],
    officialWebsite: "https://soilhealth.dac.gov.in",
    applicationUrl: null,
    officialDomain: "soilhealth.dac.gov.in",
    linkStatus: "verified",
    officialUrl: "https://soilhealth.dac.gov.in",
    hasOfficialPortal: true,
    rules: {
      minLandSize: 0.01,
      maxLandSize: null,
      supportedStates: ["All India"],
      supportedCrops: ["All"]
    }
  },
  {
    id: "SCHEME-005",
    name: "Paramparagat Krishi Vikas Yojana (PKVY) - Organic Farming",
    nameTa: "பாரம்பரிய கிருஷி விகாஸ் யோஜனா - இயற்கை விவசாய திட்டம்",
    agency: "National Centre of Organic Farming (NCOF), Govt. of India",
    agencyTa: "தேசிய இயற்கை விவசாய மையம்",
    category: "Organic Farming & Sustainability",
    categoryTa: "இயற்கை விவசாயம்",
    state: "All India",
    description: "Promotes organic farming through cluster approach and Participatory Guarantee System (PGS) certification, eliminating chemical fertilizers and pesticides.",
    descriptionTa: "இரசாயன உரங்கள் இன்றி இயற்கை விவசாயம் செய்ய குழு அமைத்து நிதி உதவி மற்றும் அங்ககச் சான்றிதழ் வழங்கும் திட்டம்.",
    benefits: "₹50,000 per hectare for 3 years: ₹31,000 given directly for organic inputs (bio-fertilizers, vermicompost, botanical extracts) and ₹8,800 for certification and branding.",
    benefitsTa: "ஹெக்டேருக்கு 3 ஆண்டுகளில் ₹50,000 நிதி உதவி: இயற்கை உரம் வாங்க ₹31,000 நேரடி உதவி மற்றும் இயற்கை சான்றிதழ் வழங்கப்படுகிறது.",
    eligibilitySummary: "Farmers cultivating or transitioning to organic farming in clusters of 20 or more farmers covering minimum 20 hectares (50 acres).",
    eligibilitySummaryTa: "இயற்கை விவசாயம் செய்ய விரும்பும் விவசாயிகள். 20 விவசாயிகள் கொண்ட குழுவாக இணைந்து விண்ணப்பிக்கலாம்.",
    requiredDocuments: [
      "Aadhaar Card",
      "Land Record (Patta/Chitta)",
      "Farmer Group / Cluster Registration Agreement",
      "Bank Account Passbook"
    ],
    officialWebsite: "https://pgsindia-ncof.gov.in",
    applicationUrl: null,
    officialDomain: "pgsindia-ncof.gov.in",
    linkStatus: "verified",
    officialUrl: "https://pgsindia-ncof.gov.in",
    hasOfficialPortal: true,
    rules: {
      minLandSize: 0.5,
      maxLandSize: 5.0,
      supportedStates: ["All India"],
      supportedCrops: ["Brinjal", "Tomato", "Potato", "Vegetables", "All"]
    }
  },
  {
    id: "SCHEME-006",
    name: "Kisan Credit Card (KCC) Scheme",
    nameTa: "கிசான் கடன் அட்டை திட்டம் (Kisan Credit Card)",
    agency: "Reserve Bank of India (RBI) & NABARD",
    agencyTa: "நபார்டு மற்றும் கூட்டுறவு வங்கிகள்",
    category: "Agricultural Credit & Finance",
    categoryTa: "விவசாயக் கடன்",
    state: "All India",
    description: "Timely short-term crop loans for cultivation expenses, post-harvest costs, and maintenance of farm assets through scheduled commercial and cooperative banks.",
    descriptionTa: "பயிர்ச் சாகுபடி மற்றும் பண்ணை பராமரிப்பு செலவுகளுக்காக மிகக் குறைந்த வட்டியில் வங்கிகள் மூலம் வழங்கப்படும் குறுகிய கால பயிர்க்கடன்.",
    benefits: "Collateral-free agricultural loans up to ₹1,60,000 (up to ₹3,00,000 with land hypothecation) at an effective interest rate of 4% per annum upon prompt repayment.",
    benefitsTa: "ஈட்டுறுதி இல்லாமல் ₹1.60 லட்சம் வரை கடன். குறித்த காலத்தில் கடனைத் திருப்பிச் செலுத்தினால் 4% குறைந்த வட்டி மட்டுமே.",
    eligibilitySummary: "All farmers, individuals or joint borrowers, tenant farmers, oral lessees, and self-help group farmer clusters with active cultivation.",
    eligibilitySummaryTa: "விவசாயிகள், குத்தகை விவசாயிகள் மற்றும் சுய உதவிக்குழு உறுப்பினர்கள் அனைவரும் தகுதியுடையவர்கள்.",
    requiredDocuments: [
      "Completed KCC Application Form",
      "Two Passport Size Photographs",
      "Identity Proof (Aadhaar / Voter ID / Driving License)",
      "Address Proof (Aadhaar / Ration Card)",
      "Land Record certified by Revenue Authority (Patta, Chitta, Adangal)"
    ],
    officialWebsite: "https://agricoop.nic.in",
    applicationUrl: "https://www.jansamarth.in/kisan-credit-card-scheme",
    officialDomain: "jansamarth.in",
    linkStatus: "verified",
    officialUrl: "https://agricoop.nic.in",
    hasOfficialPortal: true,
    rules: {
      minLandSize: 0.25,
      maxLandSize: null,
      supportedStates: ["All India"],
      supportedCrops: ["All"]
    }
  },
  {
    id: "SCHEME-007",
    name: "Mission for Integrated Development of Horticulture (MIDH) - Tamil Nadu",
    nameTa: "ஒருங்கிணைந்த தோட்டக்கலை வளர்ச்சி இயக்கம் (MIDH) - தமிழ்நாடு",
    agency: "Department of Horticulture & Plantation Crops, Government of Tamil Nadu",
    agencyTa: "தோட்டக்கலைத் துறை, தமிழ்நாடு அரசு",
    category: "Horticulture & Seeds",
    categoryTa: "தோட்டக்கலை & விதைகள்",
    state: "Tamil Nadu",
    description: "State and Central joint mission for holistic growth of horticulture sector covering high-yielding hybrid seeds, vegetable nurseries, mulching, and shade nets.",
    descriptionTa: "உயர் ரக காய்கறி விதைகள், நிழல்வலை குடில்கள், நெகிழி நிலப்போர்வை அமைத்தல் போன்றவற்றுக்கு மானியம் வழங்கும் தமிழக அரசு திட்டம்.",
    benefits: "40% to 50% capital subsidy on vegetable cultivation inputs, high-yielding hybrid seed kits for Solanaceae crops (Brinjal, Tomato), plastic mulching, and shade net nurseries.",
    benefitsTa: "கத்தரி, தக்காளி காய்கறி விதை தொகுப்புகள், பிளாஸ்டிக் நிலப்போர்வை மற்றும் நிழல்வலை நாற்றங்கால்களுக்கு 50% வரை மானியம்.",
    eligibilitySummary: "Farmers in Tamil Nadu with registered patta land cultivating or establishing horticultural crops (Tomato, Brinjal, Potato, Chillies, Fruits).",
    eligibilitySummaryTa: "தமிழ்நாட்டில் விவசாய நிலம் உள்ள தோட்டக்கலை பயிர் சாகுபடி செய்யும் அனைத்து விவசாயிகள்.",
    requiredDocuments: [
      "Aadhaar Card",
      "Ration Card / Smart Card",
      "Patta & Chitta",
      "Adangal with cultivation details",
      "Bank Account Passbook"
    ],
    officialWebsite: "https://tnhorticulture.tn.gov.in",
    applicationUrl: "https://subsidy.tnhorticulture.in",
    officialDomain: "tnhorticulture.tn.gov.in",
    linkStatus: "verified",
    officialUrl: "https://tnhorticulture.tn.gov.in",
    hasOfficialPortal: true,
    rules: {
      minLandSize: 0.25,
      maxLandSize: 10.0,
      supportedStates: ["Tamil Nadu"],
      supportedCrops: ["Brinjal", "Tomato", "Potato", "Vegetables", "Horticulture"]
    }
  },
  {
    id: "SCHEME-008",
    name: "Agriculture Infrastructure Fund (AIF)",
    nameTa: "வேளாண் உட்கட்டமைப்பு நிதி திட்டம் (AIF)",
    agency: "Department of Agriculture & Farmers Welfare, Govt. of India",
    agencyTa: "வேளாண்மை மற்றும் விவசாயிகள் நல அமைச்சகம்",
    category: "Infrastructure & Post-Harvest",
    categoryTa: "பண்ணை உட்கட்டமைப்பு",
    state: "All India",
    description: "Pan-India financing facility for medium-long term debt financing for post-harvest management infrastructure and community farming assets.",
    descriptionTa: "குளிர்பதனக் கிடங்குகள், விளைபொருட்கள் சேமிப்பு மையங்கள் மற்றும் தரம்பிரிக்கும் கூடங்கள் அமைக்க நீண்ட கால கடன் உதவி திட்டம்.",
    benefits: "3% per annum interest subvention on loans up to ₹2 Crores for up to 7 years, along with credit guarantee coverage under CGTMSE.",
    benefitsTa: "₹2 கோடி வரையிலான கடன்களுக்கு 7 ஆண்டுகள் வரை 3% வட்டி மானியம் மற்றும் கடன் உத்தரவாதம் வழங்கப்படுகிறது.",
    eligibilitySummary: "Farmers, Farmer Producer Organizations (FPOs), Primary Agricultural Credit Societies (PACS), and Agri-entrepreneurs.",
    eligibilitySummaryTa: "விவசாயிகள், உழவர் உற்பத்தியாளர் நிறுவனங்கள் (FPO) மற்றும் வேளாண் தொழில்முனைவோர்.",
    requiredDocuments: [
      "Detailed Project Report (DPR)",
      "Land Title / Lease Agreement (minimum 10 years)",
      "KYC Documents (Aadhaar, PAN)",
      "Bank Financial Clearance"
    ],
    officialWebsite: "https://agriinfra.dac.gov.in",
    applicationUrl: "https://agriinfra.dac.gov.in/Home/BeneficiaryRegistration",
    officialDomain: "agriinfra.dac.gov.in",
    linkStatus: "verified",
    officialUrl: "https://agriinfra.dac.gov.in",
    hasOfficialPortal: true,
    rules: {
      minLandSize: 1.0,
      maxLandSize: null,
      supportedStates: ["All India"],
      supportedCrops: ["All"]
    }
  },
  {
    id: "SCHEME-009",
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    nameTa: "வேளாண் இயந்திரமயமாக்கல் உப-திட்டம் (SMAM)",
    agency: "Department of Agriculture & Farmers Welfare / State Agri Engineering Depts",
    agencyTa: "வேளாண் பொறியியல் துறை",
    category: "Farm Machinery & Equipment",
    categoryTa: "வேளாண் கருவிகள்",
    state: "All India",
    description: "Increases reach of farm mechanization to small and marginal farmers with subsidies on power tillers, rotavators, sprayers, and custom hiring centers.",
    descriptionTa: "பவர் டில்லர், ரோட்டவேட்டர், பேட்டரி தெளிப்பான்கள் போன்ற வேளாண் கருவிகள் வாங்க 40% முதல் 50% வரை மானியம் வழங்கும் திட்டம்.",
    benefits: "40% to 50% financial assistance for purchasing agricultural equipment (knapsack power sprayers, rotavators, tractors) and establishing Custom Hiring Centers.",
    benefitsTa: "மருந்து தெளிப்பான்கள், உழவு கருவிகள் வாங்க 40% முதல் 50% அரசு மானியம் வழங்கப்படுகிறது.",
    eligibilitySummary: "Small and marginal farmers, women farmers, and Scheduled Caste / Scheduled Tribe farmers get preferential subsidy allocations.",
    eligibilitySummaryTa: "சிறு, குறு விவசாயிகள் மற்றும் பெண் விவசாயிகளுக்கு முன்னுரிமை மானியம்.",
    requiredDocuments: [
      "Aadhaar Card",
      "Patta / Chitta",
      "Bank Passbook",
      "Quotation from Authorized Equipment Dealer"
    ],
    officialWebsite: "https://agrimachinery.nic.in",
    applicationUrl: "https://agrimachinery.nic.in/Index/FarmerRegistration",
    officialDomain: "agrimachinery.nic.in",
    linkStatus: "verified",
    officialUrl: "https://agrimachinery.nic.in",
    hasOfficialPortal: true,
    rules: {
      minLandSize: 0.5,
      maxLandSize: 10.0,
      supportedStates: ["All India"],
      supportedCrops: ["All"]
    }
  }
];

/**
 * Deterministic rule-based eligibility evaluation.
 * Compares field profile against scheme criteria without using generative AI.
 */
export function evaluateSchemeEligibility(scheme, fieldProfile) {
  if (!fieldProfile) {
    return {
      status: "check_required",
      code: "needs_profile",
      badge: "? Eligibility Check Required",
      message: "Eligibility Check Required: Add your field profile to get an indicative eligibility evaluation.",
      disclaimer: "Final eligibility is subject to verification by the government scheme authority."
    };
  }

  const rules = scheme.rules || {};
  const crop = (fieldProfile.crop_type || "").trim().toLowerCase();
  const location = (fieldProfile.field_location || "").trim().toLowerCase();

  // Acreage calculation
  const rawSize = parseFloat(fieldProfile.field_size) || 2.0;
  const unit = (fieldProfile.field_size_unit || "Acre").trim().toLowerCase();
  const acres = unit.includes("hectare") ? rawSize * 2.471 : rawSize;

  const supportedStates = (rules.supportedStates || ["All India"]).map(s => s.toLowerCase());
  const supportedCrops = (rules.supportedCrops || ["All"]).map(c => c.toLowerCase());
  const minAcres = rules.minLandSize;
  const maxAcres = rules.maxLandSize;

  // 1. State Check
  const stateMatch = supportedStates.includes("all india") || supportedStates.some(st => location.includes(st) || st.includes(location));
  if (!stateMatch && location) {
    return {
      status: "not_eligible",
      code: "state_mismatch",
      badge: "✕ Not Eligible",
      message: `Designated for ${rules.supportedStates?.join(", ")} and may not apply in your location (${fieldProfile.field_location}).`,
      disclaimer: "Final eligibility is subject to verification by the government scheme authority."
    };
  }

  // 2. Crop Check
  const cropMatch = supportedCrops.includes("all") || supportedCrops.some(c => crop.includes(c) || c.includes(crop));
  if (!cropMatch && crop) {
    return {
      status: "not_eligible",
      code: "crop_mismatch",
      badge: "✕ Not Eligible",
      message: `Targets ${rules.supportedCrops?.join(", ")} crops rather than ${fieldProfile.crop_type}.`,
      disclaimer: "Final eligibility is subject to verification by the government scheme authority."
    };
  }

  // 3. Land Size Check
  if (maxAcres !== null && maxAcres !== undefined && acres > maxAcres) {
    return {
      status: "not_eligible",
      code: "size_exceeded",
      badge: "✕ Not Eligible",
      message: `Scheme ceiling is ${maxAcres} Acres (current field size: ${acres.toFixed(1)} Acres).`,
      disclaimer: "Final eligibility is subject to verification by the government scheme authority."
    };
  }

  if (minAcres !== null && minAcres !== undefined && acres < minAcres) {
    return {
      status: "check_required",
      code: "size_threshold",
      badge: "? Eligibility Check Required",
      message: `Requires minimum landholding of ${minAcres} Acres. Verify local guidelines on the official portal.`,
      disclaimer: "Final eligibility is subject to verification by the government scheme authority."
    };
  }

  // 4. Success / Likely Eligible
  return {
    status: "likely_eligible",
    code: "matched_criteria",
    badge: "✓ Likely Eligible",
    message: "Likely eligible based on the information provided.",
    disclaimer: "The final decision belongs to the respective government scheme authority."
  };
}
