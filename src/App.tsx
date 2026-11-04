import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, MessageSquare, Link2, 
  History as HistoryIcon, AlertOctagon, Trash2, Camera, 
  ShieldAlert, ExternalLink, Zap, PhoneCall, Mic, MicOff,
  BookOpen, Type, X
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { scoreMessage, type ScanResult } from './engine/score';
import { analyzeLink, type LinkAnalysis } from './engine/links';
import { analyzeUpi, type UpiAnalysis } from './engine/upi';
import { analyzePhone, type PhoneAnalysis } from './engine/phone';
import { createSpeechRecognizer } from './lib/stt';
import { ResultCard } from './components/ResultCard';
import { CallGuard } from './components/CallGuard';
import { ComplaintHelper } from './components/ComplaintHelper';
import { PracticeMode } from './components/PracticeMode';
import { FamilyShareCard } from './components/FamilyShareCard';
import { db, type HistoryItem } from './lib/db';
import './i18n';

type EntityResultType = (LinkAnalysis | UpiAnalysis | PhoneAnalysis) & { reminderNotice?: string };

export default function App() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<'message' | 'entity' | 'callguard' | 'practice' | 'emergency' | 'history'>('message');

  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  const [entityInput, setEntityInput] = useState('');
  const [entityType, setEntityType] = useState<'link' | 'upi' | 'phone'>('link');
  const [entityResult, setEntityResult] = useState<EntityResultType | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const quickSamples = [
    { labelKey: 'sample_elec', text: 'Dear customer your electricity power will be disconnected tonight at 9:30 PM from EB office call 9876543210 immediately' },
    { labelKey: 'sample_kyc', text: 'Dear SBI User, your YONO account is suspended today. Click here to update PAN and KYC: http://bit.ly/sbi-kyc-fix' },
    { labelKey: 'sample_cashback', text: 'Congratulations! You received cashback of Rs 4,999 in PhonePe. Enter UPI PIN to claim money.' },
    { labelKey: 'sample_arrest', text: 'Mumbai Police Customs. Illegal parcel seized on your Aadhaar card. Digital arrest warrant issued.' },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get('text') || params.get('title') || params.get('url');
    if (sharedText) {
      setInputText(sharedText);
      handleMessageScan(sharedText);
    }
    loadHistory();
  }, [tab]);

  const loadHistory = async () => {
    const all = await db.history.reverse().limit(30).toArray();
    setHistoryItems(all);
  };

  const handleMessageScan = async (textToScan?: string) => {
    const target = textToScan || inputText;
    if (!target.trim()) return;
    const scan = scoreMessage(target);
    setResult(scan);

    await db.history.add({
      text: target.slice(0, 80),
      verdict: scan.verdict,
      score: scan.score,
      timestamp: new Date(),
    });
  };

  const handleVoiceInput = () => {
    const recognizer = createSpeechRecognizer(i18n.language);
    if (!recognizer.isSupported) {
      alert(i18n.language === 'te' ? 'వాయిస్ గుర్తింపు గూగుల్ క్రోమ్‌లో మాత్రమే పనిచేస్తుంది.' : i18n.language === 'hi' ? 'आवाज़ पहचान केवल गूगल क्रोम पर काम करती है।' : 'Speech recognition is supported directly in Google Chrome on Android.');
      return;
    }

    if (isListening) {
      recognizer.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognizer.startListening(
        (transcript) => {
          setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
          setIsListening(false);
        },
        () => setIsListening(false)
      );
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const ocrLang = i18n.language === 'te' ? 'tel' : i18n.language === 'hi' ? 'hin' : 'eng';
      const worker = await createWorker(ocrLang);
      const ret = await worker.recognize(file);
      await worker.terminate();

      setInputText(ret.data.text);
      handleMessageScan(ret.data.text);
    } catch (err) {
      console.error(err);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleEntityScan = () => {
    if (!entityInput.trim()) return;
    if (entityType === 'link') setEntityResult(analyzeLink(entityInput));
    if (entityType === 'upi') setEntityResult(analyzeUpi(entityInput));
    if (entityType === 'phone') setEntityResult(analyzePhone(entityInput, true));
  };

  const clearHistory = async () => {
    await db.history.clear();
    setHistoryItems([]);
  };

  const textScaleClass = textSize === 'xlarge' ? 'text-lg sm:text-xl' : textSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base';

  return (
    <div className={`min-h-screen bg-[#f8fafc] text-slate-900 pb-20 ${textScaleClass}`}>
      {/* Precision Locked Header for Mobile & Desktop */}
      <header className="bg-white border-b-2 border-red-600/20 shadow-sm sticky top-0 z-50">
        <div className="w-full max-w-5xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
          
          {/* App Logo & Multilingual Brand Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-600 text-white rounded-xl shadow-md shadow-red-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 truncate">
                  {t('app_title')}
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 shrink-0">
                  {t('badge_offline')}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold truncate hidden xs:block">
                {t('badge_sub')}
              </p>
            </div>
          </div>

          {/* Text Size & Language Switcher */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setTextSize((s) => (s === 'normal' ? 'large' : s === 'large' ? 'xlarge' : 'normal'))}
              className="h-8 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-black text-[11px] flex items-center gap-0.5 border border-slate-200 transition-colors"
              title="Change Text Size"
              aria-label="Toggle text size"
            >
              <Type className="w-3.5 h-3.5 text-slate-600" />
              <span>{textSize === 'xlarge' ? 'A++' : textSize === 'large' ? 'A+' : 'A'}</span>
            </button>

            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {[
                { code: 'en', label: 'EN' },
                { code: 'te', label: 'తె' },
                { code: 'hi', label: 'हि' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`h-7 px-2.5 text-xs font-black rounded-md transition-all flex items-center justify-center ${
                    i18n.language === lang.code 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </header>

      {/* Main Responsive Body Container */}
      <main className="w-full max-w-5xl mx-auto px-2.5 sm:px-6 pt-4 sm:pt-6">
        {/* Navigation Tabs */}
        <nav className="flex sm:grid sm:grid-cols-6 gap-1.5 mb-5 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
          {[
            { id: 'message', label: t('tab_scan'), icon: MessageSquare },
            { id: 'entity', label: t('tab_target'), icon: Link2 },
            { id: 'callguard', label: t('tab_callguard'), icon: ShieldAlert },
            { id: 'practice', label: t('tab_quiz'), icon: BookOpen },
            { id: 'emergency', label: t('tab_emergency'), icon: AlertOctagon },
            { id: 'history', label: t('tab_history'), icon: HistoryIcon },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as any)}
                className={`flex flex-col items-center justify-center py-2 px-3 sm:px-2 rounded-xl font-black text-[11px] sm:text-xs min-h-[48px] shrink-0 sm:shrink transition-all ${
                  active 
                    ? 'bg-red-600 text-white shadow-md shadow-red-200' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab 1: Message Scanner */}
        {tab === 'message' && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-red-600" /> {t('one_tap_heading')}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {quickSamples.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(s.text);
                      handleMessageScan(s.text);
                    }}
                    className="p-2.5 sm:p-3 text-[11px] sm:text-xs font-bold rounded-xl sm:rounded-2xl bg-white border border-slate-200 text-slate-800 hover:border-red-600 hover:text-red-600 transition-all text-left shadow-sm active:scale-95"
                  >
                    {t(s.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="relative">
                <textarea
                  rows={4}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('input_placeholder')}
                  className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl placeholder-slate-400 font-medium focus:outline-none focus:border-red-600 focus:bg-white transition-all resize-none leading-relaxed text-sm sm:text-base"
                />
                {inputText && (
                  <button 
                    onClick={() => { setInputText(''); setResult(null); }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300"
                    title={t('clear_input')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => handleMessageScan()}
                  className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-[0.98] min-h-[48px] text-sm sm:text-base"
                >
                  {t('check_btn')}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleVoiceInput}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl font-bold min-h-[48px] border-2 transition-all ${
                      isListening
                        ? 'bg-red-600 text-white border-red-600 animate-pulse'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                    title={t('btn_voice')}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-red-600" />}
                    <span className="text-xs">{isListening ? t('btn_listening') : t('btn_voice')}</span>
                  </button>

                  <label className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl sm:rounded-2xl cursor-pointer min-h-[48px] border-2 border-slate-200 transition-all shadow-sm">
                    <Camera className="w-4 h-4 text-red-600" />
                    <span className="text-xs">{ocrLoading ? t('btn_scanning') : t('btn_ocr')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={ocrLoading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {result && (
              <>
                <ResultCard
                  score={result.score}
                  verdict={result.verdict}
                  reasons={result.reasons}
                  matchedCategories={result.matchedCategories}
                />
                {result.verdict === 'Likely Scam' && (
                  <FamilyShareCard
                    scamText={inputText}
                    category={result.matchedCategories[0] || 'Scam Alert'}
                    reasons={result.reasons}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: Target Checker */}
        {tab === 'entity' && (
          <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">{t('target_title')}</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{t('target_sub')}</p>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-xl sm:rounded-2xl border border-slate-200">
              {(['link', 'upi', 'phone'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setEntityType(type);
                    setEntityResult(null);
                  }}
                  className={`flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black uppercase text-xs transition-all ${
                    entityType === type 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type === 'link' ? t('target_type_link') : type === 'upi' ? t('target_type_upi') : t('target_type_phone')}
                </button>
              ))}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <input
                type="text"
                value={entityInput}
                onChange={(e) => setEntityInput(e.target.value)}
                placeholder={
                  entityType === 'link' 
                    ? t('target_ph_link') 
                    : entityType === 'upi' 
                    ? t('target_ph_upi') 
                    : t('target_ph_phone')
                }
                className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-slate-900 placeholder-slate-400 font-medium focus:border-red-600 outline-none text-sm sm:text-base"
              />

              <button
                onClick={handleEntityScan}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl min-h-[48px] shadow-md transition-all text-sm"
              >
                {t('target_analyze_btn')} {entityType === 'link' ? t('target_type_link') : entityType === 'upi' ? t('target_type_upi') : t('target_type_phone')}
              </button>
            </div>

            {entityResult && (
              <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 ${
                entityResult.isSuspicious 
                  ? 'bg-red-50 border-red-500 text-red-950' 
                  : 'bg-emerald-50 border-emerald-500 text-emerald-950'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-black text-base sm:text-lg">
                    {entityResult.isSuspicious ? t('target_suspicious') : t('target_safe')}
                  </span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    entityResult.isSuspicious ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {t('target_risk_label')}: {entityResult.riskScore}/100
                  </span>
                </div>

                {entityResult.reminderNotice && (
                  <p className="mt-2 text-xs sm:text-sm font-bold text-red-700">
                    {t(entityResult.reminderNotice)}
                  </p>
                )}

                {entityResult.reasons.length > 0 && (
                  <ul className="mt-2.5 space-y-1 list-disc list-inside text-xs font-bold text-slate-700">
                    {entityResult.reasons.map((r: string, idx: number) => (
                      <li key={idx}>{t(r)}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Call Guard */}
        {tab === 'callguard' && <CallGuard />}

        {/* Tab 4: Practice Quiz */}
        {tab === 'practice' && <PracticeMode />}

        {/* Tab 5: Emergency Action Hub & Complaint Helper */}
        {tab === 'emergency' && (
          <div className="space-y-5">
            <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-red-600 shadow-xl">
              <div className="flex items-center gap-2.5 text-red-600 mb-2">
                <AlertOctagon className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{t('emergency_title')}</h2>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-4 sm:mb-6">
                {t('emergency_sub')}
              </p>

              <div className="space-y-3">
                <a
                  href="tel:1930"
                  className="flex items-center justify-center gap-2 p-3.5 sm:p-4 bg-red-600 hover:bg-red-700 text-white font-black text-center text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-lg shadow-red-200 transition-transform active:scale-[0.98] min-h-[48px]"
                >
                  <PhoneCall className="w-5 h-5 shrink-0" />
                  <span>{t('emergency_1930')}</span>
                </a>

                <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl">
                  <p className="font-bold text-xs sm:text-sm text-slate-900">{t('emergency_step1_title')}</p>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-1">{t('emergency_step1_desc')}</p>
                </div>

                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3.5 sm:p-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-center rounded-xl sm:rounded-2xl min-h-[48px] shadow-sm text-xs sm:text-sm"
                >
                  <span>{t('emergency_portal')}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                </a>
              </div>
            </div>

            <ComplaintHelper />
          </div>
        )}

        {/* Tab 6: On-Device Storage History */}
        {tab === 'history' && (
          <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900">{t('history_title')}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">{t('history_sub')}</p>
              </div>
              {historyItems.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('clear_history')}</span>
                </button>
              )}
            </div>

            {historyItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl text-xs sm:text-sm">
                {t('history_empty')}
              </div>
            ) : (
              <div className="space-y-2">
                {historyItems.map((item) => (
                  <div key={item.id} className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">{item.text}</p>
                      <span className="text-[10px] text-slate-500 font-semibold">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-3 py-1 rounded-full shrink-0 ${
                        item.verdict === 'Likely Scam'
                          ? 'bg-red-600 text-white'
                          : item.verdict === 'Suspicious'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {item.verdict === 'Likely Scam' ? t('verdict_scam') : item.verdict === 'Suspicious' ? t('verdict_suspicious') : t('verdict_safe')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="w-full max-w-5xl mx-auto px-4 mt-8 text-center text-slate-400 text-[10px] sm:text-xs font-semibold leading-relaxed">
        {t('footer_disclaimer')}
      </footer>
    </div>
  );
}