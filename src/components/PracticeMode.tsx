import { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import quizData from '../data/quiz.json';

export const PracticeMode = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = quizData[currentIndex];

  const handleAnswer = (ans: boolean) => {
    setSelectedAnswer(ans);
    if (ans === currentQ.isScam) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    if (currentIndex + 1 < quizData.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <div className="bg-white p-8 rounded-3xl border-2 border-red-600 shadow-xl text-center space-y-4">
        <ShieldCheck className="w-16 h-16 text-red-600 mx-auto" />
        <h2 className="text-2xl font-black text-slate-900">Practice Completed!</h2>
        <p className="text-lg font-bold text-slate-700">
          Your Scam Detection Score: <span className="text-red-600 text-2xl font-black">{score}</span> / {quizData.length}
        </p>
        <p className="text-sm text-slate-500 font-semibold max-w-md mx-auto">
          {score >= 18
            ? 'Outstanding! You can spot almost every real-world trick used by cyber fraudsters in India.'
            : 'Good effort! Review the explanations to keep yourself and your family protected.'}
        </p>
        <button
          onClick={restartQuiz}
          className="flex items-center justify-center gap-2 mx-auto px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-md min-h-[48px]"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-black uppercase text-red-600 tracking-wider">Spot The Scam Quiz</span>
          <h2 className="text-lg font-black text-slate-900">Question {currentIndex + 1} of {quizData.length}</h2>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-700">
          Score: {score}
        </span>
      </div>

      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
        <p className="text-base font-bold text-slate-900 leading-relaxed">
          {currentQ.scenario}
        </p>
      </div>

      {selectedAnswer === null ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAnswer(true)}
            className="flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-base rounded-2xl shadow-md transition-all active:scale-95 min-h-[48px]"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>It's a SCAM</span>
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl shadow-md transition-all active:scale-95 min-h-[48px]"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>It's GENUINE</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
              selectedAnswer === currentQ.isScam
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : 'bg-red-50 border-red-500 text-red-950'
            }`}
          >
            {selectedAnswer === currentQ.isScam ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-black text-sm">
                {selectedAnswer === currentQ.isScam ? 'Correct Verdict!' : 'Incorrect Verdict!'}
              </p>
              <p className="text-xs font-semibold mt-1 leading-relaxed">{currentQ.explanation}</p>
            </div>
          </div>

          <button
            onClick={nextQuestion}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-2xl min-h-[48px] shadow-md transition-all"
          >
            {currentIndex + 1 === quizData.length ? 'View Final Results' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  );
};