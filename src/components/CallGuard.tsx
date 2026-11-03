import { useState } from 'react';
import { PhoneOff, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Question {
  id: string;
  text: string;
}

const QUESTIONS: Question[] = [
  { id: 'video', text: 'Are they demanding you stay on a Skype / WhatsApp video call?' },
  { id: 'arrest', text: 'Are they claiming to be CBI, Mumbai Police, or Customs threatening "Digital Arrest"?' },
  { id: 'transfer', text: 'Are they asking you to transfer funds to a "RBI secret safe account" for verification?' },
  { id: 'isolate', text: 'Are they ordering you not to tell family members or leave your room?' }
];

export const CallGuard = () => {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const toggle = (id: string, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  };

  const isScamCall = Object.values(answers).some((val) => val === true);

  return (
    <div className="bg-slate-900/90 p-6 md:p-8 rounded-3xl border-2 border-rose-500/50 shadow-2xl mt-4">
      <div className="flex items-center gap-3 text-rose-400 mb-4">
        <PhoneOff className="w-8 h-8 animate-pulse text-rose-500" />
        <div>
          <h2 className="text-xl font-black text-white">Live Call Interrupter</h2>
          <p className="text-xs text-slate-400 font-semibold">Someone calling you right now? Answer these quick questions:</p>
        </div>
      </div>

      <div className="space-y-3">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
            <span className="font-bold text-sm text-slate-200">{q.text}</span>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => toggle(q.id, true)}
                className={`px-4 py-2 rounded-xl font-black text-xs min-h-[42px] transition-all ${
                  answers[q.id] === true ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                YES
              </button>
              <button
                onClick={() => toggle(q.id, false)}
                className={`px-4 py-2 rounded-xl font-black text-xs min-h-[42px] transition-all ${
                  answers[q.id] === false ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                NO
              </button>
            </div>
          </div>
        ))}
      </div>

      {isScamCall && (
        <div className="mt-6 p-5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-2xl text-center shadow-xl shadow-rose-950/60 animate-bounce">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-white" />
          <h3 className="text-xl sm:text-2xl font-black tracking-wide uppercase">HANG UP THE CALL IMMEDIATELY!</h3>
          <p className="font-bold text-xs sm:text-sm mt-1 text-rose-100">
            "Digital Arrest" does not exist under Indian law. Real police never conduct video interrogations or demand money transfers.
          </p>
        </div>
      )}

      {Object.keys(answers).length === QUESTIONS.length && !isScamCall && (
        <div className="mt-6 p-4 bg-emerald-950/40 text-emerald-200 border border-emerald-500/40 rounded-2xl flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <p className="font-bold text-sm">
            No standard coercion or fake police markers found. However, never share OTPs, passwords, or bank account credentials.
          </p>
        </div>
      )}
    </div>
  );
};