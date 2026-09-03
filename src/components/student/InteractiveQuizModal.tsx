import React, { useState, useEffect } from 'react';
import { Quiz } from '../../types';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import {
  X,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';

interface InteractiveQuizModalProps {
  isOpen: boolean;
  quiz: Quiz | null;
  courseId: string;
  onClose: () => void;
  onSuccessClaimCert?: () => void;
}

export const InteractiveQuizModal: React.FC<InteractiveQuizModalProps> = ({
  isOpen,
  quiz,
  courseId,
  onClose,
  onSuccessClaimCert
}) => {
  const { saveQuizScore, claimCertificate, getStudentCourseProgress, showToast } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(() => (quiz?.timeLimitMinutes || 15) * 60);

  // Reset state when opening
  useEffect(() => {
    if (isOpen && quiz) {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setScore(0);
      setTimeLeft((quiz.timeLimitMinutes || 15) * 60);
    }
  }, [isOpen, quiz]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isSubmitted, timeLeft]);

  if (!isOpen || !quiz) return null;

  const totalQuestions = quiz.questions.length;
  const currentQ = quiz.questions[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / totalQuestions) * 100);
    setScore(finalScore);
    setIsSubmitted(true);

    const isPassed = saveQuizScore(courseId, quiz.id, finalScore);

    if (isPassed) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // Fallback
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isPassed = score >= quiz.minScoreToPass;

  return (
    <div id="quiz-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="quiz-modal-card"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Kuis Evaluasi Kelulusan
              </span>
              <span className="text-xs text-slate-400">
                Passing Grade: {quiz.minScoreToPass}%
              </span>
            </div>
            <h3 className="font-heading font-bold text-base text-white mt-1">
              {quiz.title}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {!isSubmitted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-amber-400">
                <Clock className="w-4 h-4" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isSubmitted ? (
            <>
              {/* Progress Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>
                    Soal {currentIndex + 1} dari {totalQuestions}
                  </span>
                  <span>
                    {Object.keys(selectedAnswers).length}/{totalQuestions} Terjawab
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-heading font-semibold text-base text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.question}
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Results Screen */
            <div className="text-center py-4 space-y-6 animate-in zoom-in-95 duration-200">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
                  isPassed
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                }`}
              >
                {isPassed ? <Award className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
              </div>

              <div>
                <span
                  className={`text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${
                    isPassed
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {isPassed ? 'LULUS EVALUASI' : 'BELUM LULUS'}
                </span>
                <h3 className="font-heading font-extrabold text-3xl text-slate-900 dark:text-white mt-3">
                  Skor Anda: {score} / 100
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {isPassed
                    ? 'Selamat! Anda telah memenuhi standar kelulusan materi kursus dan berhak mengklaim E-Sertifikat resmi.'
                    : `Nilai minimum kelulusan adalah ${quiz.minScoreToPass}. Silakan pelajari kembali video materi dan ulangi kuis.`}
                </p>
              </div>

              {/* Explanations List */}
              <div className="text-left space-y-3 pt-2">
                <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500">
                  Pembahasan Soal Kuis:
                </h5>
                {quiz.questions.map((q, idx) => {
                  const userAns = selectedAnswers[idx];
                  const isCorrect = userAns === q.correctIndex;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1"
                    >
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {idx + 1}. {q.question}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 pl-6 text-[11px]">
                        <strong>Jawaban Benar:</strong> {q.options[q.correctIndex]}
                      </p>
                      <p className="text-indigo-600 dark:text-indigo-400 pl-6 text-[11px] italic">
                        💡 {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {!isSubmitted ? (
            <>
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Sebelumnya
              </button>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition flex items-center gap-1.5"
                >
                  <span>Selanjutnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Kirim & Periksa Nilai</span>
                </button>
              )}
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setCurrentIndex(0);
                  setSelectedAnswers({});
                  setTimeLeft((quiz.timeLimitMinutes || 15) * 60);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ulangi Kuis</span>
              </button>

              {isPassed ? (
                (() => {
                  const courseProgress = getStudentCourseProgress(courseId);
                  if (courseProgress.canClaimCertificate) {
                    return (
                      <button
                        onClick={() => {
                          const cert = claimCertificate(courseId);
                          onClose();
                          if (cert && onSuccessClaimCert) onSuccessClaimCert();
                        }}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
                      >
                        <Award className="w-4 h-4" />
                        <span>Klaim & Lihat E-Sertifikat Resmi</span>
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => {
                        onClose();
                        if (courseProgress.unmetRequirements.length > 0) {
                          showToast(`ℹ️ Lulus kuis! ${courseProgress.unmetRequirements[0]}`);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Lulus Kuis! Lanjutkan Materi Lainnya (Video min. 90%)</span>
                    </button>
                  );
                })()
              ) : (
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Tutup & Pelajari Ulang
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
