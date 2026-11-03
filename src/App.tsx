import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, MessageSquare, Link2, 
  History as HistoryIcon, AlertOctagon, Trash2, Camera, 
  ShieldAlert, ExternalLink, Zap, PhoneCall, RefreshCw, X
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { scoreMessage, type ScanResult } from './engine/score';
import { analyzeLink, type LinkAnalysis } from './engine/links';
import { analyzeUpi, type UpiAnalysis } from './engine/upi';
import { analyzePhone, type PhoneAnalysis } from './engine/phone';
import { ResultCard } from './components/ResultCard';
import { CallGuard } from './components/CallGuard';
import { ComplaintHelper } from './components/ComplaintHelper';
import { db, type HistoryItem } from './lib/db';
import './i18n';

type EntityResultType = (LinkAnalysis | UpiAnalysis | PhoneAnalysis) & { reminderNotice?: string };

const QUICK_SAMPLES = [
  { label: '⚡ Electricity Cut', text: 'Dear customer your electricity power will be disconnected tonight at 9:30 PM from EB office call 9876543210 immediately' },
  { label: '🏦 SBI KYC Block', text: 'Dear SBI User, your YONO account is suspended today. Click here to update PAN and KYC: http://bit.ly/sbi-kyc-fix' },
  { label: '💸 UPI Cashback', text: 'Congratulations! You received cashback of Rs 4,999 in PhonePe. Enter UPI PIN to claim money.' },
  { label: '🚨 Digital Arrest', text: 'Mumbai Police Customs. Illegal parcel seized on your Aadhaar card. Digital arrest warrant issued.' },
];

export default function App() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<'message' | 'entity' | 'callguard' | 'emergency' | 'history'>('message');

  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const [entityInput, setEntityInput] = useState('');
  const [entityType, setEntityType] = useState<'link' | 'upi' | 'phone'>('link');
  const [entityResult, setEntityResult] = useState<EntityResultType | null>(null);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const worker = await createWorker('eng');
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-24">
      {/* Brand Header: White & Red */}
      <header className="bg-white border-b-2 border-red-600/20 shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-2xl shadow-md shadow-red-200">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">{t('app_title')}</h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  100% Offline
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{t('app_tagline')}</p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {[
              { code: 'en', label: 'English' },
              { code: 'te', label: 'తెలుగు' },
              { code: 'hi', label: 'हिंदी' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                  i18n.language === lang.code 
                    ? 'bg-red-600 text-white shadow-md shadow-red-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        {/* Navigation Tabs (5 Tabs - Clean White/Red Pill Style) */}
        <nav className="grid grid-cols-5 gap-1.5 mb-6 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          {[
            { id: 'message', label: t('tab_message'), icon: MessageSquare },
            { id: 'entity', label: 'Target', icon: Link2 },
            { id: 'callguard', label: 'Call Guard', icon: ShieldAlert },
            { id: 'emergency', label: t('tab_emergency'), icon: AlertOctagon },
            { id: 'history', label: t('tab_history'), icon: HistoryIcon },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as any)}
                className={`flex flex-col items-center justify-center py-2.5 rounded-xl font-black text-[11px] min-h-[48px] transition-all ${
                  active 
                    ? 'bg-red-600 text-white shadow-md shadow-red-200' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="truncate max-w-[65px]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab 1: Message Checker */}
        {tab === 'message' && (
          <div className="space-y-4">
            {/* Quick Test Chips */}
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-red-600" /> One-Tap Test Scams:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK_SAMPLES.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(s.text);
                      handleMessageScan(s.text);
                    }}
                    className="p-3 text-xs font-bold rounded-2xl bg-white border border-slate-200 text-slate-800 hover:border-red-600 hover:text-red-600 hover:shadow-md transition-all text-left shadow-sm active:scale-95"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Card */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
              <div className="relative">
                <textarea
                  rows={5}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('input_placeholder')}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-red-600 focus:bg-white transition-all resize-none leading-relaxed"
                />
                {inputText && (
                  <button 
                    onClick={() => { setInputText(''); setResult(null); }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleMessageScan()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-base py-4 rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-[0.98] min-h-[48px]"
                >
                  {t('check_btn')}
                </button>

                <label className="flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl cursor-pointer min-h-[48px] border-2 border-slate-200 transition-all shadow-sm">
                  <Camera className="w-5 h-5 text-red-600" />
                  <span className="text-sm">{ocrLoading ? 'Scanning...' : 'OCR Screenshot'}</span>
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

            {result && (
              <ResultCard
                score={result.score}
                verdict={result.verdict}
                reasons={result.reasons}
                matchedCategories={result.matchedCategories}
              />
            )}
          </div>
        )}

        {/* Tab 2: Specific Target Checker */}
        {tab === 'entity' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Specific Target Checker</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Isolate and analyze an individual link, phone number, or UPI ID.</p>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
              {(['link', 'upi', 'phone'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setEntityType(type);
                    setEntityResult(null);
                  }}
                  className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${
                    entityType === type 
                      ? 'bg-red-600 text-white shadow-md shadow-red-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={entityInput}
                onChange={(e) => setEntityInput(e.target.value)}
                placeholder={
                  entityType === 'link' 
                    ? 'e.g. sbi-kyc-alert.xyz' 
                    : entityType === 'upi' 
                    ? 'e.g. refund-care@upi' 
                    : 'e.g. +91 9876543210'
                }
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 font-medium focus:border-red-600 focus:bg-white outline-none"
              />

              <button
                onClick={handleEntityScan}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl min-h-[48px] shadow-md transition-all"
              >
                Analyze {entityType.toUpperCase()}
              </button>
            </div>

            {entityResult && (
              <div className={`p-6 rounded-2xl border-2 ${
                entityResult.isSuspicious 
                  ? 'bg-red-50 border-red-500 text-red-950' 
                  : 'bg-emerald-50 border-emerald-500 text-emerald-950'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg">
                    {entityResult.isSuspicious ? '⚠️ Suspicious Target' : '✅ Verified Structure'}
                  </span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${
                    entityResult.isSuspicious ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    Risk: {entityResult.riskScore}/100
                  </span>
                </div>

                {entityResult.reminderNotice && (
                  <p className="mt-3 text-sm font-bold text-red-700">
                    {t(entityResult.reminderNotice)}
                  </p>
                )}

                {entityResult.reasons.length > 0 && (
                  <ul className="mt-3 space-y-1 list-disc list-inside text-xs font-bold text-slate-700">
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

        {/* Tab 4: Emergency Action Hub */}
        {tab === 'emergency' && (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-red-600 shadow-xl shadow-red-100">
              <div className="flex items-center gap-3 text-red-600 mb-2">
                <AlertOctagon className="w-8 h-8" />
                <h2 className="text-2xl font-black text-slate-900">{t('emergency_title')}</h2>
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-6">
                Take these actions immediately to freeze fund transfers and prevent further loss:
              </p>

              <div className="space-y-3">
                <a
                  href="tel:1930"
                  className="flex items-center justify-center gap-2 p-4 bg-red-600 hover:bg-red-700 text-white font-black text-center text-base rounded-2xl shadow-lg shadow-red-200 transition-transform active:scale-[0.98] min-h-[48px]"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>{t('emergency_1930')}</span>
                </a>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="font-bold text-sm text-slate-900">1. {t('emergency_bank')}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Immediately request freezing of Net Banking, UPI IDs, and ATM debit cards.</p>
                </div>

                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-center rounded-2xl min-h-[48px] shadow-sm"
                >
                  <span>{t('emergency_portal')}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </div>

            <ComplaintHelper />
          </div>
        )}

        {/* Tab 5: Local Storage History */}
        {tab === 'history' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900">Past Checks (On-Device)</h3>
                <p className="text-xs text-slate-500 font-semibold">Stored locally in your browser's IndexedDB. Zero data sent to external servers.</p>
              </div>
              {historyItems.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('clear_history')}</span>
                </button>
              )}
            </div>

            {historyItems.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">
                No past checks recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {historyItems.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{item.text}</p>
                      <span className="text-[11px] text-slate-500 font-semibold">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-3 py-1 rounded-full shrink-0 ${
                        item.verdict === 'Likely Scam'
                          ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                          : item.verdict === 'Suspicious'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {item.verdict} ({item.score})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-4 mt-8 text-center text-slate-400 text-xs font-semibold leading-relaxed">
        Scam Shield is an automated offline heuristic checker designed for guidance. It is not a legal guarantee. In case of financial fraud, dial 1930 immediately[cite: 27].
      </footer>
    </div>
  );
}