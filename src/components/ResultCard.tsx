import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, Volume2, 
  Info, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { speakText } from '../lib/tts';

interface ResultCardProps {
  score: number;
  verdict: 'Safe' | 'Suspicious' | 'Likely Scam';
  reasons: string[];
  matchedCategories: string[];
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
  score, 
  verdict, 
  reasons, 
  matchedCategories 
}) => {
  const { t, i18n } = useTranslation();
  const [ttsHint, setTtsHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const primaryCategory = matchedCategories[0] || 'default_safe';

  // Fetch fully localized next steps directly from active language JSON (en, te, hi)
  const rawSteps = t(`steps.${primaryCategory}`, { returnObjects: true });
  const translatedSteps: string[] = Array.isArray(rawSteps) 
    ? rawSteps 
    : [t('steps.default_safe.0', 'No obvious scam signs found.'), t('steps.default_safe.1', 'Always verify the sender.')];

  const config = {
    Safe: {
      cardBorder: 'border-emerald-500',
      headerBg: 'bg-emerald-50 text-emerald-950',
      badge: 'bg-emerald-600 text-white',
      gaugeColor: 'bg-emerald-500',
      icon: <ShieldCheck className="w-10 h-10 text-emerald-600 shrink-0" />,
      label: t('verdict_safe'),
      subtext: 'No common scam triggers or fraud patterns were found in this text.',
    },
    Suspicious: {
      cardBorder: 'border-amber-500',
      headerBg: 'bg-amber-50 text-amber-950',
      badge: 'bg-amber-600 text-white',
      gaugeColor: 'bg-amber-500',
      icon: <AlertTriangle className="w-10 h-10 text-amber-600 shrink-0 animate-pulse" />,
      label: t('verdict_suspicious'),
      subtext: 'Contains suspicious language or links. Exercise high caution before taking action.',
    },
    'Likely Scam': {
      cardBorder: 'border-red-600',
      headerBg: 'bg-red-50 text-red-950',
      badge: 'bg-red-600 text-white shadow-md shadow-red-200',
      gaugeColor: 'bg-red-600',
      icon: <ShieldAlert className="w-10 h-10 text-red-600 shrink-0 animate-bounce" />,
      label: t('verdict_scam'),
      subtext: 'Dangerous high-risk threat signature detected. Do not click links or send funds.',
    },
  }[verdict];

  const handleSpeech = () => {
    setIsSpeaking(true);

    // Build the readout string entirely in the currently selected language
    const localizedReasons = reasons.map((r) => t(r)).join('. ');
    const localizedSteps = translatedSteps.join('. ');

    const textToRead = `${config.label}. ${t('voice_score_prefix', 'Risk score is')} ${score} ${t('voice_out_of_100', 'out of 100')}. ${localizedReasons}. ${t('voice_steps_prefix', 'Action steps:')} ${localizedSteps}`;

    const res = speakText(textToRead, i18n.language);
    if (res.needsVoiceHint) setTtsHint(true);
    setTimeout(() => setIsSpeaking(false), 5000);
  };

  return (
    <div className={`mt-6 bg-white rounded-3xl border-2 ${config.cardBorder} shadow-xl shadow-slate-200/60 overflow-hidden transition-all duration-300`}>
      {/* Threat Level Banner */}
      <div className={`p-6 sm:p-7 ${config.headerBg} border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${config.badge}`}>
                {config.label}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Threat Evaluation
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700 mt-1 max-w-md leading-snug">
              {config.subtext}
            </p>
          </div>
        </div>

        {/* Read Aloud Button */}
        <button
          onClick={handleSpeech}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm min-h-[48px] shadow-sm transition-all active:scale-95 ${
            isSpeaking 
              ? 'bg-red-600 text-white animate-pulse' 
              : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200'
          }`}
          aria-label={t('read_aloud')}
        >
          <Volume2 className="w-5 h-5 text-red-600" />
          <span>{isSpeaking ? 'Speaking...' : t('read_aloud')}</span>
        </button>
      </div>

      {ttsHint && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <Info className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Notice: Install Indian language voice pack (Telugu/Hindi) in device settings for local pronunciation.</span>
        </div>
      )}

      <div className="p-6 sm:p-8 space-y-6">
        {/* Dynamic Threat Score Meter */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">{t('risk_score')}</span>
            <span className="text-xl font-black text-slate-900">{score} <span className="text-xs text-slate-400 font-bold">/ 100</span></span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${config.gaugeColor}`} 
              style={{ width: `${Math.max(score, 6)}%` }}
            />
          </div>
        </div>

        {/* Reasons Flagged */}
        {reasons.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-slate-500 mb-3">
              <AlertCircle className="w-4 h-4 text-red-600" />
              {t('why_this_verdict')}
            </h4>
            <div className="space-y-2">
              {reasons.map((r, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50/50 border border-red-100 text-red-950 text-sm font-bold leading-relaxed"
                >
                  <div className="w-2 h-2 rounded-full bg-red-600 mt-2 shrink-0" />
                  <span>{t(r)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Localized Action Steps */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-slate-500 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {t('next_steps')}
          </h4>
          <div className="grid gap-2">
            {translatedSteps.map((step, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 text-sm font-bold"
              >
                <div className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};