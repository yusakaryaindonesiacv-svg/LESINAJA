import React from 'react';
import { Course, StudentProgress } from '../../types';
import { Award, CheckCircle2, Lock, X } from 'lucide-react';

interface CertificateRequirementsModalProps {
  isOpen: boolean;
  course: Course;
  studentProgress?: StudentProgress;
  completedModuleIds: string[];
  totalPercentage: number;
  onClose: () => void;
  onSelectModule: (moduleId: string) => void;
}

export const CertificateRequirementsModal: React.FC<CertificateRequirementsModalProps> = ({
  isOpen,
  course,
  studentProgress,
  completedModuleIds,
  totalPercentage,
  onClose,
  onSelectModule
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-white">
                Syarat Kelulusan Sertifikat
              </h3>
              <p className="text-xs text-slate-400">
                Selesaikan semua syarat di bawah untuk membuka sertifikat resmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Requirements Checklist */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-300">
              <span>Progres Kelulusan Kursus:</span>
              <span className="text-blue-400 font-mono text-sm">{totalPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  totalPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${totalPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Daftar Modul & Ketentuan Video (Min. 90% Ditonton):
            </p>
            {course.modules.map((mod, idx) => {
              const isModCompleted = completedModuleIds.includes(mod.id);
              const watchPct = studentProgress?.videoWatchProgress?.[mod.id] || 0;
              const isVideoPassed = !mod.videoUrl || watchPct >= 90;
              const isQuizPassed = !mod.quiz || ((studentProgress?.quizScores?.[mod.quiz.id] ?? 0) >= (mod.quiz.minScoreToPass || 70));
              const isAllSatisfied = isVideoPassed && isQuizPassed && isModCompleted;

              return (
                <div
                  key={mod.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    isAllSatisfied
                      ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isAllSatisfied ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{idx + 1}. {mod.title}</p>
                      <div className="text-[11px] text-slate-400 space-y-0.5 mt-0.5">
                        {mod.videoUrl ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400">Video:</span>
                            <span className={`font-mono font-bold ${watchPct >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {watchPct}% / 90%
                            </span>
                            {watchPct >= 90 ? (
                              <span className="text-emerald-400 text-[10px] font-semibold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                                Syarat 90% Terpenuhi ✓
                              </span>
                            ) : (
                              <span className="text-amber-400 text-[10px] font-semibold bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800">
                                Wajib tonton {Math.max(0, 90 - watchPct)}% lagi
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Materi Teks / Lampiran Pelajaran</span>
                        )}
                        {mod.quiz && (
                          <div className="text-[10px] text-slate-400">
                            Ujian Kuis: skor min. {mod.quiz.minScoreToPass}% {
                              (studentProgress?.quizScores?.[mod.quiz.id] ?? 0) >= (mod.quiz.minScoreToPass || 70)
                                ? `(Lulus: ${studentProgress?.quizScores?.[mod.quiz.id]}%)`
                                : `(Belum Lulus)`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectModule(mod.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg shrink-0 transition"
                  >
                    Buka Modul
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
          >
            Lanjutkan Belajar
          </button>
        </div>
      </div>
    </div>
  );
};
