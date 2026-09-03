import React, { useState } from 'react';
import { Course, CourseModule, ResourceItem, ResourceType } from '../../types';
import { useApp } from '../../context/AppContext';
import { InteractiveQuizModal } from './InteractiveQuizModal';
import { DiscussionForum } from './DiscussionForum';
import { ProtectedVideoPlayer, formatSecondsToTime } from './ProtectedVideoPlayer';
import { CertificateRequirementsModal } from './CertificateRequirementsModal';
import { getFileBadgeInfo } from '../../utils/fileHelpers';
import {
  Play,
  CheckCircle,
  CheckCircle2,
  Lock,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  FolderArchive,
  Code,
  File,
  MessageSquare,
  HelpCircle,
  Award,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Edit3,
  Paperclip,
  Eye,
  X,
  Maximize2
} from 'lucide-react';

interface CoursePlayerViewProps {
  courseId: string;
  initialModuleId?: string;
  onOpenCheckout?: (course: Course) => void;
}

export const CoursePlayerView: React.FC<CoursePlayerViewProps> = ({
  courseId,
  initialModuleId,
  onOpenCheckout
}) => {
  const {
    courses,
    currentUser,
    progressMap,
    certificates,
    markModuleCompleted,
    updateVideoWatchProgress,
    saveModuleNote,
    claimCertificate,
    getStudentCourseProgress,
    navigateTo,
    showToast
  } = useApp();

  const course = courses.find(c => c.id === courseId);
  const isEnrolled = currentUser?.role === 'admin' || (currentUser?.enrolledCourseIds?.includes(courseId) ?? false);

  const [activeModuleId, setActiveModuleId] = useState<string>(() => {
    if (initialModuleId) return initialModuleId;
    return course?.modules[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<'materi' | 'overview' | 'notes' | 'resources' | 'discussion'>('materi');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [isRequirementsModalOpen, setIsRequirementsModalOpen] = useState(false);

  const handleLockedDownloadClick = (e: React.MouseEvent, fileName?: string) => {
    e.preventDefault();
    e.stopPropagation();
    showToast(`🔒 Akses Ditolak: Anda belum terdaftar di kursus ini. Silakan daftar untuk mengunduh lampiran "${fileName || 'materi'}"`);
    if (onOpenCheckout && course) {
      onOpenCheckout(course);
    }
  };

  const renderFileIcon = (type?: ResourceType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-400" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'word':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'powerpoint':
        return <Presentation className="w-4 h-4 text-orange-400" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'zip':
        return <FolderArchive className="w-4 h-4 text-amber-400" />;
      case 'code':
        return <Code className="w-4 h-4 text-teal-400" />;
      case 'drive':
      case 'link':
        return <ExternalLink className="w-4 h-4 text-sky-400" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Kursus Tidak Ditemukan</h2>
        <button
          onClick={() => navigateTo('courses')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Katalog Kursus
        </button>
      </div>
    );
  }

  const activeModuleIndex = course.modules.findIndex(m => m.id === activeModuleId);
  const activeModule: CourseModule | undefined = course.modules[activeModuleIndex] || course.modules[0];

  // Match existing certificate across devices (by studentId, student name, or email)
  const existingCert = certificates.find(c =>
    c.courseId === courseId &&
    (c.studentId === currentUser?.id ||
     (currentUser?.name && c.studentName?.toLowerCase() === currentUser.name?.toLowerCase()) ||
     (currentUser?.email && (c as any).studentEmail?.toLowerCase() === currentUser.email?.toLowerCase()))
  );

  const progressKey = `${currentUser?.id || 'guest'}_${courseId}`;
  let studentProgress = progressMap[progressKey];
  if (!studentProgress && currentUser) {
    const matchKey = Object.keys(progressMap).find(k =>
      k.endsWith(`_${courseId}`) &&
      (k.startsWith(`${currentUser.id}_`) || (currentUser.email && k.startsWith(`${currentUser.email}_`)))
    );
    if (matchKey) {
      studentProgress = progressMap[matchKey];
    }
  }

  // If a certificate is already issued for this course, all modules are fully unlocked & completed
  const completedModuleIds = existingCert
    ? course.modules.map(m => m.id)
    : (studentProgress?.completedModuleIds || []);
  const isCurrentCompleted = completedModuleIds.includes(activeModule?.id || '');

  const progressStats = getStudentCourseProgress(courseId);

  // Active module watch percentage
  const currentModuleWatchPct = existingCert ? 100 : (studentProgress?.videoWatchProgress?.[activeModule?.id || ''] || 0);
  const currentModuleMaxSeconds = studentProgress?.maxWatchedSeconds?.[activeModule?.id || ''] || 0;

  // Note for active module
  const currentNote = studentProgress?.notes?.[activeModule?.id || ''] || '';
  const [noteText, setNoteText] = useState(currentNote);

  // Update noteText when active module changes
  React.useEffect(() => {
    setNoteText(studentProgress?.notes?.[activeModule?.id || ''] || '');
  }, [activeModule?.id, studentProgress?.notes]);

  const handleSaveNote = () => {
    if (!activeModule) return;
    saveModuleNote(courseId, activeModule.id, noteText);
  };

  const handleNextModule = () => {
    if (activeModuleIndex < course.modules.length - 1) {
      const nextMod = course.modules[activeModuleIndex + 1];
      setActiveModuleId(nextMod.id);
    }
  };

  const handlePrevModule = () => {
    if (activeModuleIndex > 0) {
      const prevMod = course.modules[activeModuleIndex - 1];
      setActiveModuleId(prevMod.id);
    }
  };

  // Helper to format YouTube URL into embed link
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`;
    }
    return url;
  };

  // Check if URL is direct video (Supabase Storage, MP4, WebM, blob, etc.)
  const isDirectVideo = (url?: string) => {
    if (!url) return false;
    const clean = url.toLowerCase().split('?')[0];
    return (
      clean.endsWith('.mp4') ||
      clean.endsWith('.webm') ||
      clean.endsWith('.ogg') ||
      clean.endsWith('.mov') ||
      clean.endsWith('.m4v') ||
      clean.endsWith('.mkv') ||
      url.includes('supabase.co/storage') ||
      url.startsWith('data:video/') ||
      url.startsWith('blob:')
    );
  };

  const isModuleLocked = !isEnrolled && !activeModule?.isPreview;

  return (
    <div id="course-player-container" className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigateTo('courses')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-sm sm:text-base text-white truncate">
              {course.title}
            </h1>
            <p className="text-xs text-blue-400 truncate">
              {activeModule?.title || 'Memuat Modul...'}
            </p>
          </div>
        </div>

        {/* Progress & Certificate trigger */}
        <div className="flex items-center gap-3">
          {isEnrolled && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Total Kelulusan:</span>
              <div className="w-28 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    progressStats.percentage === 100 || existingCert ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${existingCert ? 100 : progressStats.percentage}%` }}
                />
              </div>
              <span className="text-xs font-bold text-emerald-400">
                {existingCert ? 100 : progressStats.percentage}%
              </span>
            </div>
          )}

          {isEnrolled && (
            existingCert ? (
              <button
                onClick={() => navigateTo('view-certificate', { certNumber: existingCert.certificateNumber })}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition"
                title="Buka dan unduh sertifikat resmi"
              >
                <Award className="w-4 h-4" />
                <span>Lihat & Unduh Sertifikat</span>
              </button>
            ) : progressStats.canClaimCertificate ? (
              <button
                onClick={() => {
                  const cert = claimCertificate(courseId);
                  if (cert) {
                    navigateTo('view-certificate', { certNumber: cert.certificateNumber });
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 animate-pulse transition"
              >
                <Award className="w-4 h-4" />
                <span>Klaim Sertifikat Resmi</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRequirementsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center gap-1.5 transition"
                title="Lihat syarat kelulusan dan klaim sertifikat"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Syarat Sertifikat ({progressStats.percentage}%)</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Player Grid */}
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 pt-0 sm:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left / Center Video Stage & Tabs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Box - Full-width on mobile for maximum view size */}
            <div className="relative aspect-video w-full bg-black rounded-none sm:rounded-2xl overflow-hidden shadow-2xl border-b sm:border border-slate-800 flex items-center justify-center">
              {isModuleLocked ? (
                <div className="p-8 text-center space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-full bg-slate-800/80 text-amber-400 flex items-center justify-center mx-auto">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-white">
                      Modul Ini Terkunci
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Silakan daftarkan diri pada kursus ini untuk membuka seluruh video, kuis ujian, dan e-sertifikat resmi.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenCheckout && onOpenCheckout(course)}
                    className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-500/20 transition"
                  >
                    Daftar Kursus Sekarang
                  </button>
                </div>
              ) : activeModule?.quiz ? (
                /* Quiz Announcement in Stage */
                <div className="p-8 text-center space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center mx-auto border border-blue-700/50">
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-xl text-white">
                      {activeModule.quiz.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Modul ini berisi {activeModule.quiz.questions.length} butir soal evaluasi pemahaman (Passing grade: {activeModule.quiz.minScoreToPass}%).
                    </p>
                  </div>
                  <button
                    onClick={() => setIsQuizOpen(true)}
                    className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mulai Pengerjaan Kuis</span>
                  </button>
                </div>
              ) : activeModule?.videoUrl ? (
                <ProtectedVideoPlayer
                  key={activeModule.id}
                  videoUrl={activeModule.videoUrl}
                  title={activeModule.title}
                  courseId={courseId}
                  moduleId={activeModule.id}
                  duration={activeModule.duration}
                  durationMinutes={activeModule.durationMinutes}
                  isCompleted={isCurrentCompleted}
                  savedWatchPct={currentModuleWatchPct}
                  savedMaxSeconds={currentModuleMaxSeconds}
                  onProgressUpdate={(pct, seconds) => {
                    updateVideoWatchProgress(courseId, activeModule.id, pct, seconds);
                  }}
                  onReached90={() => {
                    showToast(`🎉 Hebat! Anda telah menonton 90% materi "${activeModule.title}". Modul otomatis terselesaikan dan E-Sertifikat kini terbuka!`);
                  }}
                />
              ) : (
                <div className="text-slate-500 text-xs">Video tidak tersedia untuk modul ini.</div>
              )}
            </div>

            {/* Video Controls & Mark Completed Bar */}
            <div className="px-4 sm:px-0 space-y-4">
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevModule}
                    disabled={activeModuleIndex === 0}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-300 disabled:opacity-40 flex items-center gap-1 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                  <button
                    onClick={handleNextModule}
                    disabled={activeModuleIndex === course.modules.length - 1}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-300 disabled:opacity-40 flex items-center gap-1 transition"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {isEnrolled && activeModule && (
                  <div className="flex items-center gap-2">
                    {activeModule.quiz ? (
                      <button
                        onClick={() => setIsQuizOpen(true)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md transition"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Buka Soal Kuis</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (activeModule.videoUrl && currentModuleWatchPct < 90) {
                            showToast(`⏳ Harap tonton video materi minimal 90% terlebih dahulu (saat ini ${currentModuleWatchPct}%).`);
                            return;
                          }
                          markModuleCompleted(courseId, activeModule.id);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                          isCurrentCompleted
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
                            : currentModuleWatchPct >= 90
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25'
                            : 'bg-slate-700 hover:bg-slate-600 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isCurrentCompleted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Telah Selesai Dipelajari</span>
                          </>
                        ) : currentModuleWatchPct >= 90 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Tandai Selesai (90%+)</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Tonton Video min. 90% ({currentModuleWatchPct}%/90%)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Tabs: Materi, Overview, Notes, Resources, Q&A */}
              <div className="bg-slate-800/80 rounded-xl p-4 sm:p-6 border border-slate-700/60 space-y-4">
              <div className="flex border-b border-slate-700 gap-4 text-xs font-bold overflow-x-auto">
                <button
                  onClick={() => setActiveTab('materi')}
                  className={`pb-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'materi'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Materi Pelajaran</span>
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 border-b-2 transition whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ringkasan Modul
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`pb-3 border-b-2 transition flex items-center gap-1 whitespace-nowrap ${
                    activeTab === 'notes'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Catatan Saya</span>
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`pb-3 border-b-2 transition flex items-center gap-1 whitespace-nowrap ${
                    activeTab === 'resources'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lampiran ({activeModule?.resources?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('discussion')}
                  className={`pb-3 border-b-2 transition flex items-center gap-1 whitespace-nowrap ${
                    activeTab === 'discussion'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Diskusi Tanya Jawab</span>
                </button>
              </div>

              {activeTab === 'materi' && (
                <div className="space-y-5">
                  <div className="border-b border-slate-700/60 pb-3">
                    <h3 className="font-heading font-bold text-lg text-white">
                      {activeModule?.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Bahan Bacaan, Rangkuman Konsep, dan Panduan Belajar Modul
                    </p>
                  </div>

                  {activeModule?.materi ? (
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-3 selection:bg-blue-600 selection:text-white shadow-inner">
                      {activeModule.materi}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-slate-900/50 border border-dashed border-slate-700 text-center space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-300 font-medium">
                        Instruktur belum menambahkan teks materi bacaan khusus untuk modul ini.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Silakan tonton video pembelajaran di atas atau unduh lampiran materi yang tersedia di bawah.
                      </p>
                    </div>
                  )}

                  {/* Lampiran File Terkait Materi (PDF, Excel, Word, Image, dll) */}
                  {activeModule?.resources && activeModule.resources.length > 0 && (
                    <div className="bg-slate-900/80 rounded-xl p-4 sm:p-5 border border-slate-700/80 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-blue-400" />
                          <span>File & Lampiran Materi Pembelajaran</span>
                        </h4>
                        {isEnrolled ? (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{activeModule.resources.length} File Siap Unduh</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Khusus Siswa Terdaftar</span>
                          </span>
                        )}
                      </div>

                      {!isEnrolled && (
                        <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-center justify-between gap-3 text-xs">
                          <p className="text-slate-300 text-[11px]">
                            🔒 File lampiran modul ini terkunci. Daftarkan diri Anda pada kursus ini untuk mengunduh semua materi pembelajaran.
                          </p>
                          <button
                            type="button"
                            onClick={() => onOpenCheckout && onOpenCheckout(course)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md text-[11px] shrink-0 transition"
                          >
                            Daftar Kelas
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeModule.resources.map(res => {
                          const badge = getFileBadgeInfo(res.type);
                          const isImage = res.type === 'image';

                          return (
                            <div
                              key={res.id}
                              className={`p-3 bg-slate-800/90 hover:bg-slate-800 rounded-xl border flex items-center justify-between gap-3 transition group ${
                                !isEnrolled ? 'border-amber-900/40 bg-slate-900/60' : 'border-slate-700/80'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {isImage && res.url.startsWith('data:image') ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage({ url: res.url, name: res.name })}
                                    className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-600 shrink-0 group-hover:ring-2 group-hover:ring-purple-500/50 transition cursor-zoom-in"
                                    title="Klik untuk melihat pratinjau gambar"
                                  >
                                    <img
                                      src={res.url}
                                      alt={res.name}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  </button>
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-700">
                                    {renderFileIcon(res.type)}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-white truncate" title={res.name}>
                                    {res.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}>
                                      {badge.label}
                                    </span>
                                    {res.size && (
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {res.size}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isImage && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage({ url: res.url, name: res.name })}
                                    className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition"
                                    title="Lihat Gambar"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {isEnrolled ? (
                                  <a
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={res.name}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Unduh</span>
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={e => handleLockedDownloadClick(e, res.name)}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition"
                                    title="Unduhan terkunci untuk pengguna non-terdaftar"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Terkunci</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-lg text-white">
                    {activeModule?.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeModule?.description || 'Tidak ada deskripsi modul tambahan.'}
                  </p>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Tulis rangkuman atau poin penting dari modul ini. Catatan tersimpan otomatis di browser Anda.
                  </p>
                  <textarea
                    rows={6}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Tulis catatan Anda di sini..."
                    className="w-full p-3.5 text-xs sm:text-sm bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNote}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition shadow-lg shadow-blue-500/20"
                    >
                      Simpan Catatan
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-700/60 pb-3 gap-2">
                    <div>
                      <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                        <span>Daftar Berkas & Lampiran Modul</span>
                        {isEnrolled ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Akses Penuh
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Khusus Siswa Terdaftar</span>
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Unduh PDF modul, file latihan Excel, dokumen Word, gambar, maupun arsip ZIP.
                      </p>
                    </div>
                    {isEnrolled && activeModule?.resources && activeModule.resources.length > 0 && (
                      <span className="text-xs text-slate-400 font-medium">
                        {activeModule.resources.length} File Tersedia
                      </span>
                    )}
                  </div>

                  {!isEnrolled && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-heading font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                            <span>Akses Unduh Berkas Lampiran Terkunci</span>
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 max-w-xl">
                            Anda sedang melihat pratinjau gratis. Untuk mengunduh seluruh file lampiran (PDF, Excel, Word, source code, dan materi latihan), silakan daftar pada kursus ini.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenCheckout && onOpenCheckout(course)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shrink-0 transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Daftar Kelas Sekarang</span>
                      </button>
                    </div>
                  )}

                  {!activeModule?.resources || activeModule.resources.length === 0 ? (
                    <div className="p-8 rounded-xl bg-slate-900/50 border border-dashed border-slate-700 text-center space-y-2">
                      <FolderArchive className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-300 font-medium">
                        Tidak ada file lampiran untuk modul ini.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Instruktur dapat mengunggah file PDF, Excel, Word, atau Gambar melalui panel Admin Dashboard.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeModule.resources.map(res => {
                        const badge = getFileBadgeInfo(res.type);
                        const isImage = res.type === 'image';

                        return (
                          <div
                            key={res.id}
                            className={`p-4 rounded-xl border flex flex-col justify-between gap-3 group transition ${
                              !isEnrolled
                                ? 'bg-slate-900/80 border-amber-900/40 hover:border-amber-700/60'
                                : 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {isImage && res.url.startsWith('data:image') ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({ url: res.url, name: res.name })}
                                  className="w-12 h-12 rounded-lg overflow-hidden border border-slate-600 shrink-0 cursor-zoom-in group-hover:ring-2 group-hover:ring-purple-500/50 transition"
                                  title="Lihat Pratinjau Gambar"
                                >
                                  <img
                                    src={res.url}
                                    alt={res.name}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                                  {renderFileIcon(res.type)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white break-words line-clamp-2" title={res.name}>
                                  {res.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}>
                                    {badge.label}
                                  </span>
                                  {res.size && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {res.size}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                              {isImage && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({ url: res.url, name: res.name })}
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Lihat Pratinjau</span>
                                </button>
                              )}
                              {isEnrolled ? (
                                <a
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={res.name}
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Unduh File</span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={e => handleLockedDownloadClick(e, res.name)}
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Daftar Untuk Unduh</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'discussion' && (
                <DiscussionForum courseId={courseId} moduleId={activeModule?.id} />
              )}
            </div>
          </div>
        </div>

          {/* Right Curriculum Playlist Drawer */}
          <div className="space-y-4 px-4 sm:px-0">
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Daftar Modul Kursus</span>
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  {completedModuleIds.length}/{course.modules.length} Selesai
                </span>
              </div>

              {/* Module List Items */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {course.modules.map((mod, idx) => {
                  const isActive = mod.id === activeModuleId;
                  const isCompleted = completedModuleIds.includes(mod.id);
                  const isLocked = !isEnrolled && !mod.isPreview;

                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModuleId(mod.id)}
                      className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                        isActive
                          ? 'border-blue-500 bg-blue-950/60 text-white font-bold ring-1 ring-blue-500/50'
                          : 'border-slate-700/50 bg-slate-900/60 hover:bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4 text-slate-500" />
                        ) : mod.quiz ? (
                          <HelpCircle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Play className="w-4 h-4 text-blue-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold truncate">
                            {idx + 1}. {mod.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 flex-wrap">
                          <span>{mod.duration}</span>
                          {mod.videoUrl && isEnrolled && (() => {
                            const watchPct = studentProgress?.videoWatchProgress?.[mod.id] || 0;
                            const watchedSec = studentProgress?.maxWatchedSeconds?.[mod.id] || 0;
                            const isPassed = watchPct >= 90;
                            return (
                              <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9.5px] ${
                                isPassed
                                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800 text-amber-300 border border-slate-700'
                              }`}>
                                {watchedSec > 0 ? `${formatSecondsToTime(watchedSec)} (${watchPct}%)` : `${watchPct}%`} {isPassed ? '✓' : '(min. 90%)'}
                              </span>
                            );
                          })()}
                          {mod.isPreview && (
                            <span className="text-blue-300 font-bold bg-blue-900/60 px-1.5 py-0.2 rounded">
                              Gratis Preview
                            </span>
                          )}
                          {mod.quiz && (
                            <span className="text-amber-300 font-bold bg-amber-950/80 px-1.5 py-0.2 rounded">
                              Ujian Kuis
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Requirements Modal */}
      <CertificateRequirementsModal
        isOpen={isRequirementsModalOpen}
        course={course}
        studentProgress={studentProgress}
        completedModuleIds={completedModuleIds}
        totalPercentage={progressStats.percentage}
        onClose={() => setIsRequirementsModalOpen(false)}
        onSelectModule={modId => setActiveModuleId(modId)}
      />

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate">
                  {previewImage.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isEnrolled ? (
                  <a
                    href={previewImage.url}
                    download={previewImage.name}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Gambar</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={e => handleLockedDownloadClick(e, previewImage.name)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Daftar Untuk Unduh</span>
                  </button>
                )}
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[calc(90vh-60px)] bg-slate-950">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[75vh] max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {activeModule?.quiz && (
        <InteractiveQuizModal
          isOpen={isQuizOpen}
          quiz={activeModule.quiz}
          courseId={courseId}
          onClose={() => setIsQuizOpen(false)}
          onSuccessClaimCert={() => {
            const cert = claimCertificate(courseId);
            if (cert) {
              navigateTo('view-certificate', { certNumber: cert.certificateNumber });
            }
          }}
        />
      )}
    </div>
  );
};
