import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Share2, Download, ShieldAlert, Check } from 'lucide-react';

interface FamilyShareCardProps {
  scamText: string;
  category: string;
  reasons: string[];
}

export const FamilyShareCard = ({ scamText, category, reasons }: FamilyShareCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const downloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `Scam_Alert_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const shareTextToWhatsApp = () => {
    const text = `🚨 *SCAM ALERT FOR FAMILY* 🚨\n\n*Type:* ${category.replace(/_/g, ' ').toUpperCase()}\n\n*Suspicious Message:*\n"${scamText.slice(0, 120)}..."\n\n⚠️ *Key Risks:* ${reasons.slice(0, 2).join(', ')}\n\n🛡️ Verified using Scam Shield India.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-black text-slate-900">Family Warning Card</h3>
          <p className="text-xs text-slate-500 font-semibold">Share this verified alert to family WhatsApp groups.</p>
        </div>
      </div>

      {/* Capture Template */}
      <div
        ref={cardRef}
        className="p-6 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl shadow-lg space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-white shrink-0" />
            <div>
              <h4 className="text-lg font-black tracking-wide">SCAM ALERT</h4>
              <p className="text-[10px] text-red-100 font-bold uppercase tracking-wider">Scam Shield India Verified</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-white/20 rounded-full border border-white/30">
            {category.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="p-3 bg-white/10 rounded-xl border border-white/20">
          <p className="text-xs font-semibold text-red-50 italic">
            "{scamText.slice(0, 100)}..."
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-black uppercase text-amber-300">Why This Is Dangerous:</p>
          <ul className="text-xs space-y-0.5 text-white font-bold list-disc list-inside">
            {reasons.slice(0, 2).map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
            <li>Never enter UPI PIN to receive money.</li>
            <li>In case of loss, call 1930 immediately.</li>
          </ul>
        </div>
      </div>

      {/* Share / Download Actions */}
      <div className="flex gap-3">
        <button
          onClick={shareTextToWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl min-h-[48px] shadow-md transition-all"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          <span>Share to WhatsApp</span>
        </button>
        <button
          onClick={downloadImage}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl min-h-[48px] shadow-md transition-all"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Generating...' : 'Save Warning Image'}</span>
        </button>
      </div>
    </div>
  );
};