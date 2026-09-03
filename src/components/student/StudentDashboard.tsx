import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportToCsv } from '../../utils/exportUtils';
import {
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  Calendar,
  Download,
  FileSpreadsheet,
  Printer,
  PlayCircle,
  Sparkles,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Mail
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onOpenAuth }) => {
  const {
    currentUser,
    courses,
    progressMap,
    certificates,
    liveSessions,
    getStudentCourseProgress,
    navigateTo,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'courses' | 'report' | 'certificates' | 'live'>('courses');

  if (!currentUser) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800 shadow-sm">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard Siswa Terproteksi</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          Silakan masuk dengan akun terdaftar Anda untuk melihat kursus aktif, sertifikat kelulusan, dan laporan belajar.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onOpenAuth ? onOpenAuth('login') : navigateTo('home')}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            Masuk Akun
          </button>
          <button
            onClick={() => onOpenAuth ? onOpenAuth('register') : navigateTo('home')}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Daftar Siswa Baru
          </button>
          <button
            onClick={() => navigateTo('courses')}
            className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold rounded-xl transition"
          >
            Lihat Katalog Kursus
          </button>
        </div>
      </div>
    );
  }

  const enrolledCourses = courses.filter(c =>
    currentUser.enrolledCourseIds?.includes(c.id)
  );

  const studentCerts = certificates.filter(c =>
    c.studentId === currentUser.id ||
    (currentUser.name && c.studentName?.toLowerCase() === currentUser.name?.toLowerCase()) ||
    (currentUser.email && (c as any).studentEmail?.toLowerCase() === currentUser.email?.toLowerCase())
  );
  const myLiveSessions = liveSessions.filter(s =>
    s.registeredStudentIds.includes(currentUser.id)
  );

  // Calculate global summary stats
  let totalCompletedModules = 0;
  let totalModulesAll = 0;

  enrolledCourses.forEach(c => {
    const p = getStudentCourseProgress(c.id);
    totalCompletedModules += p.completedCount;
    totalModulesAll += p.totalCount;
  });

  const overallProgress = totalModulesAll > 0
    ? Math.round((totalCompletedModules / totalModulesAll) * 100)
    : 0;

  const handleExportReportExcel = () => {
    const reportData = enrolledCourses.map((c, idx) => {
      const p = getStudentCourseProgress(c.id);
      const progKey = `${currentUser.id}_${c.id}`;
      const prog = progressMap[progKey];
      return {
        No: idx + 1,
        Nama_Siswa: currentUser.name,
        Email_Siswa: currentUser.email,
        Institusi: currentUser.institution || 'Umum',
        Judul_Kursus: c.title,
        Kategori: c.category,
        Modul_Selesai: `${p.completedCount} dari ${p.totalCount}`,
        Persentase_Progres: `${p.percentage}%`,
        Status_Kelulusan: p.percentage >= 100 ? 'LULUS' : 'SEDANG BELAJAR',
        Tanggal_Daftar: prog?.enrolledAt || '-',
        Terakhir_Aktif: prog?.lastActiveAt || '-'
      };
    });

    exportToCsv(`Laporan_Perkembangan_${currentUser.name.replace(/\s+/g, '_')}`, reportData);
    showToast('Laporan perkembangan siswa berhasil diekspor ke format Excel/CSV!');
  };

  return (
    <div id="student-dashboard-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover border-2 border-blue-500/40 shadow-lg"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Portal Siswa LESIN AJA</span>
                </div>
                {currentUser.isEmailVerified && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Email Terverifikasi</span>
                  </div>
                )}
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
                Halo, {currentUser.name}! 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
                <span>{currentUser.institution || 'Pelajar Mandiri'}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {currentUser.email}
                </span>
                <span>•</span>
                <span>Terus tingkatkan kompetensi skill digital Anda.</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleExportReportExcel}
              className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Unduh Rapor Excel</span>
            </button>
            <button
              onClick={() => navigateTo('courses')}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Jelajahi Kursus Lain</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">Aktif</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {enrolledCourses.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Kursus Terdaftar</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{overallProgress}%</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {totalCompletedModules} <span className="text-xs font-normal text-slate-400">/ {totalModulesAll} Modul</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Penyelesaian Modul</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-500">
            <Award className="w-5 h-5" />
            <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">Resmi</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {studentCerts.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">E-Sertifikat Terbit</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-rose-500">
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">Live</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {myLiveSessions.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Jadwal Sesi Live Terdaftar</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'courses'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Kelas Saya ({enrolledCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'report'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Laporan Perkembangan</span>
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'certificates'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Sertifikat Saya ({studentCerts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'live'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Sesi Live Saya ({myLiveSessions.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-heading font-bold text-lg text-slate-800 dark:text-slate-200">
                Belum Ada Kursus yang Diikuti
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Daftar sekarang ke kursus pilihan Anda untuk mulai belajar dan mendapatkan e-sertifikat.
              </p>
              <button
                onClick={() => navigateTo('courses')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-blue-500/20 transition"
              >
                Pilih Kursus Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
              {enrolledCourses.map(course => {
                const progress = getStudentCourseProgress(course.id);
                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 sm:top-3 left-1.5 sm:left-3 text-[8px] sm:text-[10px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm truncate max-w-[100px]">
                        {course.category}
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-5 space-y-2 sm:space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1 sm:space-y-2">
                        <h4 className="font-heading font-bold text-xs sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {course.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500">
                          <img
                            src={course.instructor.avatar}
                            alt={course.instructor.name}
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
                          />
                          <span className="truncate max-w-[80px] sm:max-w-none">{course.instructor.name}</span>
                        </div>
                      </div>

                      <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] sm:text-xs font-bold">
                            <span className="text-slate-500">Progres:</span>
                            <span className="text-blue-600 dark:text-blue-400">
                              {progress.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 sm:h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => navigateTo('course-player', { courseId: course.id })}
                            className="flex-1 py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-md sm:rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[10px] sm:text-xs shadow-sm sm:shadow-lg sm:shadow-blue-500/20 transition flex items-center justify-center gap-1"
                          >
                            <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Buka Kelas</span>
                          </button>

                          {(() => {
                            const courseCert = studentCerts.find(c => c.courseId === course.id);
                            if (courseCert) {
                              return (
                                <button
                                  onClick={() => navigateTo('view-certificate', { certNumber: courseCert.certificateNumber })}
                                  className="p-1.5 sm:p-2.5 rounded-md sm:rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm shrink-0 flex items-center gap-1"
                                  title="Lihat & Download E-Sertifikat Resmi"
                                >
                                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                                  <span className="hidden sm:inline text-[11px] font-bold">Sertifikat</span>
                                </button>
                              );
                            }
                            if (progress.canClaimCertificate) {
                              return (
                                <button
                                  onClick={() => navigateTo('course-player', { courseId: course.id })}
                                  className="p-1.5 sm:p-2.5 rounded-md sm:rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition shadow-sm shrink-0 flex items-center gap-1"
                                  title="Klaim E-Sertifikat"
                                >
                                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
                                  <span className="hidden sm:inline text-[11px] font-bold">Klaim</span>
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Report */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  Rapor Evaluasi & Perkembangan Siswa
                </h3>
                <p className="text-xs text-slate-500">
                  Data perkembangan belajar resmi LESIN AJA (Tersinkronisasi otomatis dengan Google Sheets & Database).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportReportExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ekspor Excel / CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Rapor</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Kursus</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Penyelesaian</th>
                    <th className="p-3">Skor Kuis Rata-rata</th>
                    <th className="p-3">Status Sertifikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {enrolledCourses.map(c => {
                    const p = getStudentCourseProgress(c.id);
                    const progKey = `${currentUser.id}_${c.id}`;
                    const scores = Object.values(progressMap[progKey]?.quizScores || {}) as number[];
                    const avgScore = scores.length > 0
                      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
                      : '-';

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white max-w-xs">
                          {c.title}
                        </td>
                        <td className="p-3 text-slate-500">{c.category}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-600 dark:text-blue-400">{p.percentage}%</span>
                            <span className="text-slate-400">({p.completedCount}/{p.totalCount})</span>
                          </div>
                        </td>
                        <td className="p-3 font-bold text-emerald-600">
                          {avgScore !== '-' ? `${avgScore}/100` : 'Belum Ada Kuis'}
                        </td>
                        <td className="p-3">
                          {p.percentage >= 100 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              Lulus & Berhak Sertifikat
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              Sedang Berjalan
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Certificates */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {studentCerts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
              <Award className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-heading font-bold text-lg text-slate-800 dark:text-slate-200">
                Belum Ada Sertifikat yang Diklaim
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Selesaikan 100% video modul dan lulus ujian kuis di modul akhir untuk menerbitkan sertifikat resmi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studentCerts.map(cert => (
                <div
                  key={cert.id}
                  className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-slate-900/90 border-2 border-amber-400/40 dark:border-amber-500/30 shadow-lg space-y-4 flex flex-col justify-between group hover:border-amber-400 transition-all duration-300"
                >
                  {/* Decorative subtle corner gold touch */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/15 via-transparent to-transparent pointer-events-none" />

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-xs">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Terverifikasi 3D</span>
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {cert.certificateNumber}
                      </span>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center text-amber-400">
                          <Award className="w-6 h-6" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {cert.courseTitle}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Mentor: <strong className="text-slate-700 dark:text-slate-200">{cert.instructorName}</strong> • {cert.issueDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20">
                        Predikat: {cert.grade}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/20">
                        Skor: {cert.score}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo('view-certificate', { certNumber: cert.certificateNumber })}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer relative z-10"
                  >
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>Buka & Unduh E-Sertifikat 3D</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Live Sessions */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {myLiveSessions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-heading font-bold text-lg text-slate-800 dark:text-slate-200">
                Belum Terdaftar di Sesi Live
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Daftar ke jadwal live mentoring interaktif mingguan untuk tanya jawab langsung dengan mentor.
              </p>
              <button
                onClick={() => navigateTo('live-sessions')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-blue-500/20 transition"
              >
                Lihat Jadwal Sesi Live
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myLiveSessions.map(session => (
                <div
                  key={session.id}
                  className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                      {session.platform}
                    </span>
                    <span className="text-xs font-semibold text-rose-500">
                      {session.date} • {session.time}
                    </span>
                  </div>

                  <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    {session.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {session.description}
                  </p>

                  <a
                    href={session.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Masuk Link Room ({session.platform})</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
