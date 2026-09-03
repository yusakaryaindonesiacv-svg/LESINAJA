import React from 'react';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import { HeroCarousel } from './HeroCarousel';
import { CourseCard } from './CourseCard';
import { LiveSessionsSection } from './LiveSessionsSection';
import { FeaturesOverview } from './FeaturesOverview';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  PlayCircle,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface HomeViewProps {
  onEnroll: (course: Course) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onEnroll }) => {
  const { courses, navigateTo } = useApp();

  const approvedCourses = courses.filter(
    c => !c.verificationStatus || c.verificationStatus === 'approved'
  );
  const popularCourses = approvedCourses.slice(0, 6);

  return (
    <div id="home-view-container" className="space-y-14 pb-16">
      {/* 1. Hero Carousel Banner Slider */}
      <HeroCarousel />

      {/* 2. Trust Stats Numbers Bar */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="p-4 sm:p-7 rounded-2xl bg-white dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80">
          <div className="flex flex-col items-center sm:items-start p-2 sm:px-4 space-y-0.5">
            <div className="font-heading font-extrabold text-xl sm:text-3xl tracking-tight text-blue-600 dark:text-blue-400">
              15.000+
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Siswa & Profesional</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">Aktif belajar bulanan</span>
          </div>
          <div className="flex flex-col items-center sm:items-start p-2 sm:px-4 space-y-0.5">
            <div className="font-heading font-extrabold text-xl sm:text-3xl tracking-tight text-emerald-600 dark:text-emerald-400">
              98.4%
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Tingkat Kepuasan</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">Ulasan bintang 4.9/5</span>
          </div>
          <div className="flex flex-col items-center sm:items-start p-2 sm:px-4 space-y-0.5">
            <div className="font-heading font-extrabold text-xl sm:text-3xl tracking-tight text-amber-500 dark:text-amber-400">
              50+
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Modul Siap Kerja</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">Studi kasus nyata</span>
          </div>
          <div className="flex flex-col items-center sm:items-start p-2 sm:px-4 space-y-0.5">
            <div className="font-heading font-extrabold text-xl sm:text-3xl tracking-tight text-indigo-600 dark:text-indigo-400">
              100%
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">E-Sertifikat Resmi</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">Verifikasi QR Code</span>
          </div>
        </div>
      </section>

      {/* 3. Featured / Popular Courses */}
      <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 space-y-4 sm:space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-2">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Program Terpopuler</span>
            </div>
            <h2 className="font-heading font-extrabold text-xl sm:text-3xl text-slate-900 dark:text-white">
              Kursus Pilihan Terbaik Minggu Ini
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">
              Kurikulum video praktis berstandar industri dengan materi berorientasi portofolio kerja.
            </p>
          </div>

          <button
            onClick={() => navigateTo('courses')}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 self-start md:self-auto shrink-0"
          >
            <span>Lihat Semua ({courses.length})</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Grid or Clean Empty State */}
        {popularCourses.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
            {popularCourses.map(course => (
              <CourseCard key={course.id} course={course} onEnroll={onEnroll} />
            ))}
          </div>
        ) : (
          <div className="p-6 sm:p-12 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 sm:space-y-4 shadow-sm">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                Katalog Kursus Siap Dipublikasikan
              </h3>
              <p className="text-xs text-slate-500">
                Platform LESIN AJA siap digunakan! Belum ada kursus aktif. Masuk sebagai Admin untuk mulai menambahkan materi video, modul, dan kuis.
              </p>
            </div>
            <button
              onClick={() => navigateTo('admin')}
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Buka Panel Admin & Buat Kursus</span>
            </button>
          </div>
        )}
      </section>

      {/* 4. Live Sessions & Mentoring */}
      <LiveSessionsSection />

      {/* 5. Features Overview */}
      <FeaturesOverview />

      {/* 6. Instant CTA Banner */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white p-6 sm:p-14 text-center space-y-4 sm:space-y-6 shadow-xl border border-slate-800 flex flex-col justify-center items-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/15 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-2 sm:space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
              Investasi Masa Depan
            </span>
            <h2 className="font-heading font-extrabold text-xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-snug">
              Siap Memulai Perjalanan Belajar Anda?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
              Bergabunglah dengan ribuan talenta di LESIN AJA. Akses materi video selamanya, ikuti ujian evaluasi kuis, dan dapatkan sertifikat resmi.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 pt-1">
            <button
              onClick={() => navigateTo('courses')}
              className="bg-blue-600 text-white px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span>Mulai Belajar Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateTo('custom-page', { slug: 'faq' })}
              className="px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl bg-slate-800/90 text-slate-200 font-medium text-xs sm:text-sm border border-slate-700 hover:bg-slate-700/90 hover:text-white active:scale-[0.98] transition-all"
            >
              Tanya Jawab (FAQ)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
