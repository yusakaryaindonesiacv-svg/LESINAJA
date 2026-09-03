import React, { useState, useEffect } from 'react';
import { Course } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/exportUtils';
import { trackFBViewContent } from '../../utils/facebookPixel';
import {
  Star,
  Users,
  Clock,
  BookOpen,
  Award,
  Play,
  Lock,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  FileText,
  Paperclip,
  Package,
  Sparkles,
  Layers,
  Heart
} from 'lucide-react';

interface CourseDetailViewProps {
  courseId: string;
  onEnroll: (course: Course) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  courseId,
  onEnroll
}) => {
  const { courses, currentUser, navigateTo, getBundlesForCourse, getEffectiveBundleCourses } = useApp();
  const course = courses.find(c => c.id === courseId);

  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Track Facebook ViewContent event on mount
  useEffect(() => {
    if (course) {
      trackFBViewContent(course);
    }
  }, [course?.id]);

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h2 className="text-xl font-bold">Kursus Tidak Ditemukan</h2>
        <button
          onClick={() => navigateTo('courses')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  const isEnrolled = currentUser?.role === 'admin' || (currentUser?.enrolledCourseIds?.includes(course.id) ?? false);
  const totalDurationMinutes = course.modules.reduce((acc, m) => acc + (m.durationMinutes || 15), 0);
  const hours = Math.floor(totalDurationMinutes / 60);
  const minutes = totalDurationMinutes % 60;

  const applicableBundles = getBundlesForCourse(course.id).filter(b => b.isActive);

  return (
    <div id="course-detail-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigateTo('courses')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Kembali ke Katalog Kursus</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details & Syllabus */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Info */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Level: {course.level}
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 ml-auto">
                <Star className="w-4 h-4 fill-amber-500" />
                <span>{(course.rating || 5.0).toFixed(1)}</span>
                <span className="text-slate-400">({(course.studentsCount || 0).toLocaleString('id-ID')} Siswa)</span>
              </div>
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-slate-900 dark:text-white leading-tight">
              {course.title}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {course.description}
            </p>

            {/* Instructor Info */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/40"
              />
              <div>
                <p className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  {course.instructor.name}
                </p>
                <p className="text-xs text-slate-500">{course.instructor.title}</p>
              </div>
            </div>
          </div>

          {/* Syllabus Curriculum Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  Kurikulum & Modul Kursus
                </h3>
                <p className="text-xs text-slate-500">
                  {course.modules.length} Modul Pembelajaran • Total {hours} jam {minutes} menit
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {course.modules.map((mod, idx) => (
                <div
                  key={mod.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mt-0.5">
                      {mod.quiz ? <HelpCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                        {idx + 1}. {mod.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {mod.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {mod.duration}
                        </span>
                        {mod.materi && (
                          <span className="flex items-center gap-1 text-blue-500 font-semibold">
                            <FileText className="w-3 h-3" />
                            Materi Teks
                          </span>
                        )}
                        {mod.resources && mod.resources.length > 0 && (
                          <span className={`flex items-center gap-1 font-semibold ${
                            isEnrolled
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            <Paperclip className="w-3 h-3" />
                            {mod.resources.length} Lampiran {isEnrolled ? 'Siap Unduh' : '(Khusus Siswa)'}
                          </span>
                        )}
                        {mod.quiz && (
                          <span className="text-amber-500 font-bold">Ujian Evaluasi Kelulusan</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {mod.isPreview ? (
                      <button
                        onClick={() => navigateTo('course-player', { courseId: course.id, moduleId: mod.id })}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-xs font-bold whitespace-nowrap transition border border-blue-500/20"
                      >
                        Pratinjau Gratis
                      </button>
                    ) : isEnrolled ? (
                      <button
                        onClick={() => navigateTo('course-player', { courseId: course.id, moduleId: mod.id })}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold whitespace-nowrap"
                      >
                        Buka Materi
                      </button>
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sticky Card: Pricing & Checkout Box */}
        <div className="space-y-6">
          <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            {/* Thumbnail Preview */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <button
                  onClick={() => navigateTo('course-player', { courseId: course.id })}
                  className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg hover:scale-110 transition"
                >
                  <Play className="w-5 h-5 ml-1 fill-blue-600" />
                </button>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-1">
              {course.allowCustomPrice ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm mb-1 border border-emerald-500/20">
                    <Heart className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                    <span>Bayar Seikhlasnya</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tentukan sendiri nominal pembayaran Anda saat checkout.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
                      {formatRupiah(course.price)}
                    </span>
                    {course.originalPrice > course.price && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatRupiah(course.originalPrice)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    ✓ Akses Penuh Selamanya & Update Materi
                  </p>
                </>
              )}
            </div>

            {/* Action CTA */}
            {isEnrolled ? (
              <button
                onClick={() => navigateTo('course-player', { courseId: course.id })}
                className="w-full py-3.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Lanjutkan Belajar Sekarang</span>
              </button>
            ) : (
              <button
                onClick={() => onEnroll(course)}
                className={`w-full py-3.5 px-4 rounded-lg text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                  course.allowCustomPrice
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                }`}
              >
                {course.allowCustomPrice ? (
                  <>
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Bayar Seikhlasnya & Beli</span>
                  </>
                ) : (
                  <>
                    <span>Daftar Kursus Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {/* Benefits List */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{course.modules.length} Video Pelajaran HD Terstruktur</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Akses Sesi Tanya Jawab & Forum Diskusi</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Kuis Ujian Evaluasi Pemahaman</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span>E-Sertifikat Kelulusan Resmi Terverifikasi</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Payment Gateway Instan via QRIS Pakasir</span>
              </div>
            </div>

            {/* Attached Manual Bundling Callout */}
            {!isEnrolled && course.attachedBundleCourses && course.attachedBundleCourses.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tawaran Bundling Spesial Kursus</span>
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-white">
                    DISKON KHUSUS
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-500/30 dark:border-amber-500/20 space-y-2.5">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    Dapatkan kursus pilihan di bawah ini dengan harga spesial lebih murah saat checkout:
                  </p>

                  <div className="space-y-1.5">
                    {course.attachedBundleCourses.map((addon, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 pr-2">
                          + {addon.courseTitle || 'Kursus Tambahan'}
                        </span>
                        <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {formatRupiah(addon.specialPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnroll(course)}
                    className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shadow-xs text-center"
                  >
                    Beli Kursus & Pilih Bundling
                  </button>
                </div>
              </div>
            )}

            {/* Applicable Bundles Callout */}
            {!isEnrolled && applicableBundles.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Paket Bundling Tersedia</span>
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                    SUPER HEMAT
                  </span>
                </div>

                {applicableBundles.map(bundle => {
                  const bCourses = getEffectiveBundleCourses(bundle);
                  const originalVal = bundle.originalPrice || bCourses.reduce((sum, c) => sum + (c.price || 0), 0);
                  const savings = Math.max(0, originalVal - bundle.price);

                  return (
                    <div
                      key={bundle.id}
                      className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-blue-500/10 border border-amber-500/30 dark:border-amber-500/20 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {bundle.title}
                        </h4>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 shrink-0 font-mono">
                          {formatRupiah(bundle.price)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {bundle.description || `Dapatkan ${bCourses.length} kursus sekaligus dengan harga hemat.`}
                      </p>

                      {/* DAFTAR KURSUS YANG ANDA DAPATKAN */}
                      {bCourses.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-500/20 space-y-1.5">
                          <p className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 tracking-wider flex items-center gap-1">
                            <Package className="w-3 h-3 text-amber-500" />
                            <span>DAFTAR KURSUS YANG ANDA DAPATKAN:</span>
                          </p>
                          <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
                            {bCourses.map((bc, idx) => (
                              <li
                                key={bc.id}
                                className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-start gap-1.5 leading-snug"
                              >
                                <span className="text-amber-600 dark:text-amber-400 shrink-0 text-[10px]">•</span>
                                <span className="uppercase">{bc.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1">
                          <Package className="w-3 h-3 text-blue-500" />
                          <span>{bCourses.length} Kursus Lengkap</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onEnroll(course)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] transition cursor-pointer shadow-xs"
                        >
                          Pilih Paket Ini
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
