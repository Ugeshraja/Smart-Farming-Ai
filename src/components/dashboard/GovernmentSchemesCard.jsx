import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Building2,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { VERIFIED_GOVERNMENT_SCHEMES, evaluateSchemeEligibility } from '../../services/schemesData';

export default function GovernmentSchemesCard() {
  const { fieldProfile } = useAuth();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  // Evaluate schemes deterministically based on active field profile
  const { evaluatedSchemes, likelyEligibleCount } = useMemo(() => {
    let count = 0;
    const list = VERIFIED_GOVERNMENT_SCHEMES.map(scheme => {
      const evaluation = evaluateSchemeEligibility(scheme, fieldProfile);
      if (evaluation.status === 'likely_eligible') {
        count++;
      }
      return {
        ...scheme,
        evaluation
      };
    });

    // Sort: likely eligible first
    list.sort((a, b) => {
      if (a.evaluation.status === 'likely_eligible' && b.evaluation.status !== 'likely_eligible') return -1;
      if (a.evaluation.status !== 'likely_eligible' && b.evaluation.status === 'likely_eligible') return 1;
      return 0;
    });

    return {
      evaluatedSchemes: list,
      likelyEligibleCount: count
    };
  }, [fieldProfile]);

  // Top 3 preview schemes for the dashboard card
  const previewSchemes = evaluatedSchemes.slice(0, 3);

  const getStatusBadge = (evaluation) => {
    if (evaluation.status === 'likely_eligible') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          {isTa ? "தகுதியுடையது" : "✓ Likely Eligible"}
        </span>
      );
    } else if (evaluation.status === 'check_required') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          {isTa ? "விவரங்கள் தேவை" : "? Check Required"}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
          <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
          {isTa ? "தகுதியற்றது" : "✕ Not Eligible"}
        </span>
      );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                {isTa ? "அரசு நலத்திட்டங்கள்" : "GOVT. SCHEMES"}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap shrink-0">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                  GOV.IN Verified
                </span>
                <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {isTa ? "மானியங்கள் & உதவி" : "Subsidies & Grants"}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/government-schemes"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs whitespace-nowrap shrink-0"
          >
            <span>{isTa ? "திட்டங்கள்" : "View Schemes"}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>

        {/* Dynamic Profile-Matched Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3.5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {likelyEligibleCount}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {isTa
                    ? `${likelyEligibleCount} அரசுத் திட்டங்கள் உங்கள் பண்ணைக்கு தகுதியுடையவை`
                    : `${likelyEligibleCount} schemes may be relevant to your profile`}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {isTa
                    ? `பயிர்: ${fieldProfile?.crop_type || 'கத்தரி'} | நிலம்: ${fieldProfile?.field_size || 2.0} ஏக்கர் | மாநிலம்: ${fieldProfile?.field_location || 'தமிழ்நாடு'}`
                    : `Matched for ${fieldProfile?.crop_type || 'Brinjal'} • ${fieldProfile?.field_size || 2.0} ${fieldProfile?.field_size_unit || 'Acre'} • ${fieldProfile?.field_location || 'Tamil Nadu'}`}
                </p>
              </div>
            </div>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {isTa ? "தானியங்கி சரிபார்ப்பு" : "Automated Rules"}
            </span>
          </div>
        </div>

        {/* Top Schemes Preview Cards */}
        <div className="space-y-2.5 mb-4">
          {previewSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {isTa && scheme.nameTa ? scheme.nameTa : scheme.name}
                    </span>
                    {getStatusBadge(scheme.evaluation)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
                    {isTa && scheme.benefitsTa ? scheme.benefitsTa : scheme.benefits}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {scheme.category}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                      {scheme.officialDomain || (scheme.officialWebsite ? scheme.officialWebsite.replace('https://', '') : '')}
                    </span>
                  </div>
                </div>

                <a
                  href={scheme.applicationUrl || scheme.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  aria-label={`Official portal for ${scheme.name}`}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50 transition-colors flex-shrink-0"
                  title={`Open verified portal: ${scheme.applicationUrl || scheme.officialWebsite}`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / CTA and Disclaimer */}
      <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[10.5px] text-gray-400 dark:text-gray-500 leading-tight flex-1">
            {isTa
              ? "*விதிகள் வழிகாட்டுதலுக்கு மட்டுமே. இறுதித் தகுதி அரசு விதிகளுக்கு உட்பட்டது."
              : "*Rule-based recommendations. Final eligibility is determined by official authorities."}
          </p>
          <Link
            to="/government-schemes"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
          >
            <span>{isTa ? "அனைத்து திட்டங்களையும் காண்க" : "View Schemes"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
