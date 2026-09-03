import React, { useState, useEffect } from 'react';
import { Course, User } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/exportUtils';
import {
  X,
  Star,
  Users,
  UserPlus,
  Trash2,
  Save,
  CheckCircle2,
  Sparkles,
  Award,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  DollarSign,
  Search,
  RefreshCw,
  Flame,
  Check,
  AlertCircle
} from 'lucide-react';

interface CourseStatsAndStudentsModalProps {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
}

export const CourseStatsAndStudentsModal: React.FC<CourseStatsAndStudentsModalProps> = ({
  isOpen,
  course,
  onClose
}) => {
  const {
    users,
    transactions,
    enrollStudentToCourse,
    unenrollStudentFromCourse,
    updateCourseStats,
    getStudentCourseProgress,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'stats' | 'students' | 'transactions'>('stats');

  // Form Stats State
  const [studentsCount, setStudentsCount] = useState<number>(course?.studentsCount || 0);
  const [rating, setRating] = useState<number>(course?.rating || 5.0);
  const [isPopular, setIsPopular] = useState<boolean>(course?.isPopular || false);
  const [isFeatured, setIsFeatured] = useState<boolean>(course?.isFeatured || false);
  const [isSavingStats, setIsSavingStats] = useState(false);

  // Manual Enroll State
  const [selectedUserIdToEnroll, setSelectedUserIdToEnroll] = useState<string>('');
  const [customEmailToEnroll, setCustomEmailToEnroll] = useState<string>('');
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Sync state whenever course changes or modal opens
  useEffect(() => {
    if (!course) return;
    setStudentsCount(course.studentsCount ?? 0);
    setRating(course.rating ?? 5.0);
    setIsPopular(course.isPopular ?? false);
    setIsFeatured(course.isFeatured ?? false);
    setSelectedUserIdToEnroll('');
    setCustomEmailToEnroll('');
    setSearchStudentQuery('');
  }, [course, isOpen]);

  if (!isOpen || !course) return null;

  // Real enrolled students
  const enrolledUsers = users.filter(u => u.enrolledCourseIds?.includes(course.id));
  const unenrolledUsers = users.filter(u => !u.enrolledCourseIds?.includes(course.id));

  // Filtered enrolled students for search
  const filteredEnrolledUsers = enrolledUsers.filter(u =>
    u.name.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
    (u.institution && u.institution.toLowerCase().includes(searchStudentQuery.toLowerCase()))
  );

  // Real course transactions
  const courseTransactions = transactions.filter(t => t.courseId === course.id);
  const completedTrxCount = courseTransactions.filter(t => t.status === 'completed').length;
  const totalRevenue = courseTransactions
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  // Save Stats Handler
  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStats(true);
    try {
      await updateCourseStats(course.id, {
        studentsCount: Number(studentsCount),
        rating: Number(rating),
        isPopular,
        isFeatured
      });
    } catch (err: any) {
      showToast(`Gagal menyimpan: ${err?.message || 'Error'}`);
    } finally {
      setIsSavingStats(false);
    }
  };

  // Quick Booster Helpers
  const addStudents = (amount: number) => {
    setStudentsCount(prev => Math.max(0, Number(prev || 0) + amount));
  };

  const setPresetStudents = (count: number) => {
    setStudentsCount(count);
  };

  const handleEnrollStudent = async () => {
    const target = selectedUserIdToEnroll || customEmailToEnroll.trim();
    if (!target) {
      showToast('Pilih pengguna atau masukkan email siswa yang ingin didaftarkan.');
      return;
    }

    setIsEnrolling(true);
    try {
      const ok = await enrollStudentToCourse(course.id, target);
      if (ok) {
        setSelectedUserIdToEnroll('');
        setCustomEmailToEnroll('');
        // Also update local studentsCount state to reflect change
        setStudentsCount(prev => (prev || 0) + 1);
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUnenrollStudent = async (userId: string, userName: string) => {
    if (confirm(`Apakah Anda yakin ingin mencabut akses kursus "${course.title}" untuk ${userName}?`)) {
      await unenrollStudentFromCourse(course.id, userId);
      setStudentsCount(prev => Math.max(0, (prev || 1) - 1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-150 my-auto">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  {course.category}
                </span>
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-500" />
                  {course.rating.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  {course.studentsCount.toLocaleString('id-ID')} Siswa
                </span>
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {course.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Pengaturan Rating & Siswa (Social Proof)</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Siswa Terdaftar ({enrolledUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Transaksi & Pendapatan ({completedTrxCount})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: STATS & SOCIAL PROOF BOOSTER */}
          {activeTab === 'stats' && (
            <form onSubmit={handleSaveStats} className="space-y-6">
              
              {/* Card 1: Student Count Booster */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Jumlah Siswa Terdaftar (Display & Social Proof)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Angka ini tampil di Katalog Kursus, Kartu Kursus, dan Halaman Detail untuk meningkatkan daya tarik pendaftar.
                    </p>
                  </div>
                  
                  <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold shrink-0">
                    Siswa Riil Akun: {enrolledUsers.length} Siswa
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jumlah Angka Siswa Tampilan:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={studentsCount}
                        onChange={e => setStudentsCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-4 pr-16 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        Siswa
                      </span>
                    </div>
                  </div>

                  {/* Quick Booster Chips */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      ⚡ Tambah Instan (Quick Booster):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => addStudents(50)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 transition"
                      >
                        +50
                      </button>
                      <button
                        type="button"
                        onClick={() => addStudents(100)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 transition"
                      >
                        +100
                      </button>
                      <button
                        type="button"
                        onClick={() => addStudents(500)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 transition"
                      >
                        +500
                      </button>
                      <button
                        type="button"
                        onClick={() => addStudents(1000)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 transition"
                      >
                        +1.000
                      </button>
                    </div>
                  </div>
                </div>

                {/* Presets */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Preset Cepat:</span>
                  <button
                    type="button"
                    onClick={() => setPresetStudents(enrolledUsers.length)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
                  >
                    Reset ke Siswa Riil ({enrolledUsers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetStudents(750)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
                  >
                    750 Siswa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetStudents(1420)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
                  >
                    1.420 Siswa (Best Seller)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetStudents(3500)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
                  >
                    3.500 Siswa (Trending)
                  </button>
                </div>
              </div>

              {/* Card 2: Rating Bintang Setting */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Rating Ulasan Kursus (1.0 - 5.0)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rating bintang yang ditampilkan di kartu kursus dan halaman detail.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nilai Rating Bintang:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        value={rating}
                        onChange={e => setRating(Math.min(5, Math.max(1, parseFloat(e.target.value) || 5.0)))}
                        className="w-32 px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-base font-bold text-amber-500 focus:border-amber-500 focus:outline-none"
                      />

                      {/* Visual Stars */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            className={`w-5 h-5 ${
                              s <= Math.round(rating)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preset Ratings */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500">
                      ⭐ Preset Rating Favorit:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRating(4.7)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                          rating === 4.7
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        4.7 ⭐
                      </button>
                      <button
                        type="button"
                        onClick={() => setRating(4.8)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                          rating === 4.8
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        4.8 ⭐
                      </button>
                      <button
                        type="button"
                        onClick={() => setRating(4.9)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                          rating === 4.9
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        4.9 ⭐ (Rekomendasi)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRating(5.0)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                          rating === 5.0
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        5.0 ⭐ (Sempurna)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Badges & Tags */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Badge & Label Promosi</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500 transition">
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={e => setIsPopular(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                          Populer
                        </span>
                        <span>Tampilkan Badge Populer</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Menampilkan pita oranye "Populer" pada thumbnail kartu katalog.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500 transition">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={e => setIsFeatured(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black uppercase">
                          Unggulan
                        </span>
                        <span>Tampilkan di Bagian Unggulan</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mempromosikan kursus di barisan paling atas dan banner utama.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isSavingStats}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${isSavingStats ? 'animate-spin' : ''}`} />
                  <span>{isSavingStats ? 'Menyimpan ke Supabase...' : 'Simpan Statistik & Rating'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REAL ENROLLED STUDENTS LIST & MANUAL ENROLL */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              
              {/* Form Manual Enroll */}
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Pendaftaran Siswa Manual (Beri Akses Langsung)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Daftarkan akun pengguna yang sudah ada atau masukkan email baru untuk memberikan akses gratis/manual ke kursus ini.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Select from existing user */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pilih dari Akun Terdaftar:
                    </label>
                    <select
                      value={selectedUserIdToEnroll}
                      onChange={e => {
                        setSelectedUserIdToEnroll(e.target.value);
                        if (e.target.value) setCustomEmailToEnroll('');
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Akun Siswa --</option>
                      {unenrolledUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email}) - {u.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Or Input new email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Atau Masukkan Email Siswa Baru:
                    </label>
                    <input
                      type="email"
                      placeholder="contoh: siswa@gmail.com"
                      value={customEmailToEnroll}
                      onChange={e => {
                        setCustomEmailToEnroll(e.target.value);
                        if (e.target.value) setSelectedUserIdToEnroll('');
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleEnrollStudent}
                    disabled={isEnrolling || (!selectedUserIdToEnroll && !customEmailToEnroll.trim())}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isEnrolling ? 'Mendaftarkan...' : '+ Berikan Akses Kursus'}</span>
                  </button>
                </div>
              </div>

              {/* Search & Enrolled Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Daftar Siswa Terdaftar ({enrolledUsers.length} Siswa Riil)</span>
                  </h4>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama atau email siswa..."
                      value={searchStudentQuery}
                      onChange={e => setSearchStudentQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {filteredEnrolledUsers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {searchStudentQuery ? 'Tidak ada siswa yang cocok dengan pencarian.' : 'Belum ada siswa yang terdaftar di kursus ini.'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Gunakan form di atas untuk menambahkan siswa manual, atau atur angka tampilan pada tab "Pengaturan Rating & Siswa".
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700 text-[10px]">
                        <tr>
                          <th className="p-3">Siswa</th>
                          <th className="p-3">Institusi</th>
                          <th className="p-3">Progress Belajar</th>
                          <th className="p-3">Tanggal Daftar</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredEnrolledUsers.map(student => {
                          const progress = getStudentCourseProgress(course.id, student.id);
                          return (
                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={student.avatar}
                                    alt={student.name}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                                  />
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{student.name}</p>
                                    <p className="text-[10px] text-slate-400">{student.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">
                                {student.institution || 'Umum'}
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {progress.completedCount}/{progress.totalCount || course.modules.length} Modul
                                    </span>
                                    <span className="text-blue-600 dark:text-blue-400">
                                      {progress.percentage}%
                                    </span>
                                  </div>
                                  <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    <div
                                      className="h-full bg-blue-600 rounded-full transition-all"
                                      style={{ width: `${progress.percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-slate-500 text-[11px]">
                                {new Date(student.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleUnenrollStudent(student.id, student.name)}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 transition"
                                  title="Cabut Akses Kursus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSACTIONS & REVENUE */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <p className="text-xs text-slate-500">Total Pendapatan Terverifikasi:</p>
                  <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                    {formatRupiah(totalRevenue)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <p className="text-xs text-slate-500">Total Pesanan Lunas:</p>
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {completedTrxCount} Pesanan
                  </p>
                </div>
              </div>

              {courseTransactions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <DollarSign className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Belum ada riwayat transaksi untuk kursus ini.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700 text-[10px]">
                      <tr>
                        <th className="p-3">Kode Order</th>
                        <th className="p-3">Nama Pembeli</th>
                        <th className="p-3">Nominal</th>
                        <th className="p-3">Metode</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {courseTransactions.map(trx => (
                        <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {trx.transactionCode}
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-900 dark:text-white">{trx.studentName}</p>
                            <p className="text-[10px] text-slate-400">{trx.studentEmail}</p>
                          </td>
                          <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                            {formatRupiah(trx.amount)}
                          </td>
                          <td className="p-3 uppercase font-bold text-slate-600 dark:text-slate-300">
                            {trx.paymentMethod}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                trx.status === 'completed'
                                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                                  : trx.status === 'pending'
                                  ? 'bg-amber-50 dark:bg-amber-950 text-amber-600'
                                  : 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                              }`}
                            >
                              {trx.status === 'completed' ? 'LUNAS' : trx.status === 'pending' ? 'PENDING' : 'BATAL'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {new Date(trx.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
