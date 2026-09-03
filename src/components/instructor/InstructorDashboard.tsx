import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Course, Transaction, BankAccount } from '../../types';
import { formatRupiah } from '../../utils/exportUtils';
import { CourseEditorModal } from '../admin/CourseEditorModal';
import { uploadFileToSupabaseStorage } from '../../utils/supabaseClient';
import { readFileAsDataUrl } from '../../utils/fileHelpers';
import { SPECIALIZATION_OPTIONS } from '../auth/AuthModal';
import {
  LayoutDashboard,
  BookOpen,
  DollarSign,
  TrendingUp,
  CreditCard,
  PenTool,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  User as UserIcon,
  Award,
  Sparkles,
  ShieldCheck,
  Building2,
  AlertCircle,
  HelpCircle,
  FileText,
  Percent,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Loader2,
  Save,
  Users,
  Tag,
  X
} from 'lucide-react';

export const InstructorDashboard: React.FC = () => {
  const {
    currentUser,
    courses,
    transactions,
    payoutRequests,
    requestInstructorPayout,
    updateInstructorProfile,
    deleteCourse,
    paymentSettings,
    showToast,
    navigateTo
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'earnings' | 'payout' | 'signature'>('overview');
  
  // Course Editor Modal for Instructor
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<Course | null>(null);

  // Signature Upload State
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string>(currentUser?.signatureUrl || '');
  const [instructorTitle, setInstructorTitle] = useState<string>(currentUser?.title || 'Lead Master Instructor');
  const [instructorName, setInstructorName] = useState<string>(currentUser?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Payout Request Form State
  const [payoutAmount, setPayoutAmount] = useState<number>(100000);
  const [bankName, setBankName] = useState<string>(currentUser?.bankAccount?.bankName || 'BCA');
  const [accountNumber, setAccountNumber] = useState<string>(currentUser?.bankAccount?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState<string>(currentUser?.bankAccount?.accountHolder || currentUser?.name || '');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Specialization State (Max 5)
  const initialSpecs = currentUser?.instructorSpecializations && currentUser.instructorSpecializations.length > 0
    ? currentUser.instructorSpecializations
    : (currentUser?.instructorSpecialization || '').split(',').map(s => s.trim()).filter(Boolean);

  const [instructorSpecializations, setInstructorSpecializations] = useState<string[]>(
    initialSpecs.length > 0 ? initialSpecs : ['Kimia Industri & Rekayasa Proses']
  );
  const [selectedProfileSpec, setSelectedProfileSpec] = useState('');
  const [customProfileSpec, setCustomProfileSpec] = useState('');
  const [isCustomProfileSpecMode, setIsCustomProfileSpecMode] = useState(false);

  const handleAddProfileSpecialization = (specToAdd: string) => {
    const trimmed = specToAdd.trim();
    if (!trimmed) return;
    if (trimmed === 'Lainnya (Ketik Manual)') {
      setIsCustomProfileSpecMode(true);
      return;
    }
    if (instructorSpecializations.includes(trimmed)) {
      showToast('Bidang keahlian ini sudah ada di daftar profil Anda.');
      return;
    }
    if (instructorSpecializations.length >= 5) {
      showToast('⚠️ Satu akun instruktur dapat memilih maksimal 5 bidang keahlian.');
      return;
    }
    setInstructorSpecializations(prev => [...prev, trimmed]);
    setSelectedProfileSpec('');
    setCustomProfileSpec('');
    setIsCustomProfileSpecMode(false);
  };

  const handleRemoveProfileSpecialization = (specToRemove: string) => {
    setInstructorSpecializations(prev => prev.filter(s => s !== specToRemove));
  };

  // Filter courses owned by this instructor
  const myCourses = courses.filter(
    c => c.instructorId === currentUser?.id || c.instructor?.id === currentUser?.id || c.instructor?.name?.toLowerCase() === currentUser?.name?.toLowerCase()
  );

  const myCourseIds = myCourses.map(c => c.id);

  // Filter transactions related to instructor's courses
  const myTransactions = transactions.filter(
    t => myCourseIds.includes(t.courseId) || (t.enrolledCourseIds && t.enrolledCourseIds.some(cid => myCourseIds.includes(cid)))
  );

  const completedTransactions = myTransactions.filter(t => t.status === 'completed');

  // Calculate earnings
  const commissionRate = 1 - (paymentSettings.platformCommissionPercentage || 10) / 100;
  const platformRate = (paymentSettings.platformCommissionPercentage || 10) / 100;

  const totalSalesRevenue = completedTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalInstructorEarnings = completedTransactions.reduce((acc, t) => {
    if (t.instructorShare !== undefined) return acc + t.instructorShare;
    return acc + Math.round((t.amount || 0) * commissionRate);
  }, 0);

  const currentBalance = currentUser?.balance !== undefined ? currentUser.balance : totalInstructorEarnings;

  // Filter payout requests of current user
  const myPayouts = payoutRequests.filter(p => p.instructorId === currentUser?.id);
  const totalPaidOut = myPayouts
    .filter(p => p.status === 'approved' || p.status === 'completed')
    .reduce((acc, p) => acc + p.amount, 0);

  // Handle signature upload
  const handleSignatureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('File tanda tangan harus berupa gambar (PNG dengan background transparan direkomendasikan).');
      return;
    }

    setIsUploadingSignature(true);
    try {
      const res = await uploadFileToSupabaseStorage(file, 'media');
      if (res.success && res.publicUrl) {
        setSignaturePreview(res.publicUrl);
        showToast('Tanda tangan berhasil diunggah ke storage!');
      } else {
        const dataUrl = await readFileAsDataUrl(file);
        setSignaturePreview(dataUrl);
        showToast('Tanda tangan disimpan lokal.');
      }
    } catch (err: any) {
      const dataUrl = await readFileAsDataUrl(file);
      setSignaturePreview(dataUrl);
      showToast('Tanda tangan disimpan sementara.');
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleSaveSignatureAndProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSavingProfile(true);
    try {
      await updateInstructorProfile(currentUser.id, {
        name: instructorName.trim() || currentUser.name,
        title: instructorTitle.trim(),
        signatureUrl: signaturePreview,
        instructorSpecializations: instructorSpecializations,
        instructorSpecialization: instructorSpecializations.join(', '),
        bankAccount: {
          bankName,
          accountNumber,
          accountHolder
        }
      });
      showToast('✅ Profil, Bidang Keahlian & Tanda Tangan Instruktur berhasil disimpan!');
    } catch (err: any) {
      showToast(`Gagal menyimpan: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRequestPayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (payoutAmount < 50000) {
      showToast('Minimal penarikan saldo adalah Rp 50.000');
      return;
    }

    if (payoutAmount > currentBalance) {
      showToast('Saldo komisi Anda tidak mencukupi untuk jumlah penarikan ini.');
      return;
    }

    if (!accountNumber.trim() || !accountHolder.trim()) {
      showToast('Harap lengkapi nomor rekening dan nama pemilik rekening.');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const success = requestInstructorPayout(payoutAmount, {
        bankName,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim()
      });
      if (success) {
        setActiveTab('payout');
      }
    } catch (err: any) {
      showToast(`Gagal mengajukan penarikan: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Dashboard Instruktur */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shadow-xl shadow-blue-900/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1 shrink-0 overflow-hidden shadow-inner">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/80">
                  <UserIcon className="w-8 h-8" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight">
                  Dashboard Instruktur: {currentUser?.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Lead Master
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100/80 mt-0.5">
                {currentUser?.title || 'Instruktur Resmi LESIN AJA'} • Bagi Hasil Komisi Kursus:{' '}
                <strong className="text-white">{(commissionRate * 100).toFixed(0)}%</strong> (Admin Fee {(platformRate * 100).toFixed(0)}%)
              </p>
              {/* Instructor Specialization Badges */}
              {instructorSpecializations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {instructorSpecializations.map(spec => (
                    <span
                      key={spec}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/15 text-white backdrop-blur-sm border border-white/20"
                    >
                      <Tag className="w-2.5 h-2.5 opacity-80" />
                      <span>{spec}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => {
                setSelectedCourseForEdit(null);
                setIsCourseModalOpen(true);
              }}
              className="px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>+ Buat Kursus Baru</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Ringkasan & Finansial</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'courses'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kelola Kursus ({myCourses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'earnings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Riwayat Transaksi Siswa</span>
          </button>

          <button
            onClick={() => setActiveTab('payout')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'payout'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Tarik Saldo & Rekening</span>
          </button>

          <button
            onClick={() => setActiveTab('signature')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'signature'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Tanda Tangan Sertifikat</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & STATS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Saldo Tersedia</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(currentBalance)}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">Dapat ditarik ke bank</span>
                  <button
                    onClick={() => setActiveTab('payout')}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Tarik Dana &rarr;
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Komisi Didapat</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatRupiah(totalInstructorEarnings)}
                </div>
                <p className="text-[11px] text-slate-400">Akumulasi seluruh penjualan kursus</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Transaksi Siswa</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {completedTransactions.length}{' '}
                  <span className="text-xs font-normal text-slate-400">pembayaran selesai</span>
                </div>
                <p className="text-[11px] text-slate-400">Total omset: {formatRupiah(totalSalesRevenue)}</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Tanda Tangan Sertifikat</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <PenTool className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  {currentUser?.signatureUrl ? (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-4 h-4" /> Siap Diterbitkan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" /> Belum Diunggah
                    </span>
                  )}
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => setActiveTab('signature')}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Kelola Tanda Tangan &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Split Info Card */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-200">
                    Skema Bagi Hasil Transaksi Lesin Aja
                  </h4>
                  <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80">
                    Setiap kursus yang terjual otomatis dibagi: <strong>{(commissionRate * 100).toFixed(0)}%</strong> untuk Instruktur dan <strong>{(platformRate * 100).toFixed(0)}%</strong> untuk Platform Admin.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                  Bagi Hasil Aktif: {(commissionRate * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Quick Courses Preview */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Kursus Anda ({myCourses.length})
                </h3>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Lihat Semua Kursus &rarr;
                </button>
              </div>

              {myCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myCourses.slice(0, 3).map(course => (
                    <div
                      key={course.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-16 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                            {course.title}
                          </h4>
                          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {course.allowCustomPrice ? 'Bayar Seikhlasnya' : formatRupiah(course.price)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500">
                        <span>{course.modules?.length || 0} Modul</span>
                        <span>{course.studentsCount || 0} Siswa</span>
                        <button
                          onClick={() => {
                            setSelectedCourseForEdit(course);
                            setIsCourseModalOpen(true);
                          }}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          Edit &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 text-xs space-y-3">
                  <p>Anda belum memiliki kursus yang terdaftar.</p>
                  <button
                    onClick={() => {
                      setSelectedCourseForEdit(null);
                      setIsCourseModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"
                  >
                    + Buat Kursus Pertama Anda
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY COURSES */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Kelola Kursus Instruktur
                </h2>
                <p className="text-xs text-slate-500">
                  Buat kurikulum baru, upload video, kelola materi bacaan, dan tentukan bundling manual khusus.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedCourseForEdit(null);
                  setIsCourseModalOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Kursus Baru</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">
                  Kebijakan Verifikasi &amp; Kurasi Kursus Instruktur:
                </p>
                <p>
                  Setiap kursus yang Anda buat akan ditinjau oleh tim Admin untuk memastikan kesesuaian materi dengan sertifikat/ijazah kompetensi yang telah Anda unggah. Kursus akan otomatis tayang di katalog publik setelah disetujui.
                </p>
              </div>
            </div>

            {myCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myCourses.map(course => {
                  const isPending = course.verificationStatus === 'pending';
                  const isApproved = course.verificationStatus === 'approved' || (!course.verificationStatus && !course.instructorId);
                  const isRejected = course.verificationStatus === 'rejected';

                  return (
                    <div
                      key={course.id}
                      className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between space-y-4 ${
                        isPending
                          ? 'border-amber-400/80 dark:border-amber-600/80 bg-amber-50/10'
                          : isApproved
                          ? 'border-slate-200 dark:border-slate-800'
                          : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="aspect-video rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-black/70 text-white backdrop-blur-sm">
                            {course.category}
                          </span>
                          {course.allowCustomPrice && (
                            <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white">
                              Bayar Seikhlasnya
                            </span>
                          )}
                        </div>

                        {/* Verification Status Badge */}
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              isPending
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            }`}
                          >
                            {isPending && <Clock className="w-3 h-3 animate-spin" />}
                            {isApproved && <CheckCircle className="w-3 h-3" />}
                            {isRejected && <XCircle className="w-3 h-3" />}
                            <span>
                              {isPending
                                ? '⏳ Menunggu Verifikasi Admin'
                                : isApproved
                                ? '✓ Tayang di Katalog Publik'
                                : '✕ Ditolak Admin'}
                            </span>
                          </span>
                        </div>

                        {/* Rejection notice if rejected */}
                        {isRejected && course.rejectionReason && (
                          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                            <p className="font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Catatan Penolakan Admin:</span>
                            </p>
                            <p className="text-[11px]">{course.rejectionReason}</p>
                            <p className="text-[10px] text-rose-500 italic mt-1">
                              Silakan sesuaikan materi kursus dengan sertifikat/ijazah kompetensi Anda lalu ajukan ulang.
                            </p>
                          </div>
                        )}

                        <div>
                          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {course.description || 'Tidak ada deskripsi singkat.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                            {course.allowCustomPrice ? 'Bayar Seikhlasnya' : formatRupiah(course.price)}
                          </span>
                          <span className="text-slate-400 font-normal">
                            {course.studentsCount || 0} Siswa Terdaftar
                          </span>
                        </div>

                        {course.attachedBundleCourses && course.attachedBundleCourses.length > 0 && (
                          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-[11px] text-indigo-700 dark:text-indigo-300">
                            🎁 Bundling Khusus: <strong>{course.attachedBundleCourses.length} Kursus Add-on</strong>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                        <button
                          onClick={() => navigateTo('course-detail', { courseId: course.id })}
                          className="p-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
                          title="Lihat Pratinjau Halaman Kursus"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Pratinjau</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCourseForEdit(course);
                              setIsCourseModalOpen(true);
                            }}
                            className={`px-3 py-1.5 font-bold text-xs rounded-lg flex items-center gap-1 transition ${
                              isRejected
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{isRejected ? 'Perbaiki & Ajukan' : 'Edit Materi'}</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Yakin ingin menghapus kursus "${course.title}"?`)) {
                                deleteCourse(course.id);
                                showToast('Kursus berhasil dihapus.');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Hapus Kursus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 space-y-4">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Belum Ada Kursus Dibuat
                </h3>
                <p className="text-xs max-w-md mx-auto">
                  Mulai publikasikan keahlian Anda ke ribuan siswa di Lesin Aja. Dapatkan bagi hasil komisi otomatis dari setiap penjualan.
                </p>
                <button
                  onClick={() => {
                    setSelectedCourseForEdit(null);
                    setIsCourseModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  + Buat Kursus Baru Sekarang
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EARNINGS & TRANSACTIONS */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Riwayat Transaksi & Komisi Kursus
                </h2>
                <p className="text-xs text-slate-500">
                  Daftar seluruh siswa yang telah membeli kursus Anda beserta rincian bagi hasil komisi.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Order ID & Waktu</th>
                      <th className="py-3 px-4">Siswa</th>
                      <th className="py-3 px-4">Kursus</th>
                      <th className="py-3 px-4">Total Bayar</th>
                      <th className="py-3 px-4 text-emerald-600 dark:text-emerald-400">Komisi Anda ({(commissionRate * 100).toFixed(0)}%)</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {myTransactions.length > 0 ? (
                      myTransactions.map(trx => {
                        const targetCourse = courses.find(c => c.id === trx.courseId);
                        const instShare = trx.instructorShare !== undefined
                          ? trx.instructorShare
                          : Math.round((trx.amount || 0) * commissionRate);

                        return (
                          <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              <div className="font-bold text-slate-900 dark:text-white">{trx.orderId || trx.id}</div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(trx.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{trx.studentName}</div>
                              <div className="text-[11px] text-slate-400">{trx.studentEmail}</div>
                            </td>

                            <td className="py-3.5 px-4 max-w-[200px] truncate">
                              <div className="font-bold text-slate-900 dark:text-white truncate">
                                {trx.courseTitle || targetCourse?.title || 'Kursus'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Metode: {trx.paymentMethod?.toUpperCase()}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                              {formatRupiah(trx.amount)}
                            </td>

                            <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatRupiah(instShare)}
                            </td>

                            <td className="py-3.5 px-4">
                              {trx.status === 'completed' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  Berhasil
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  {trx.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          Belum ada transaksi pembelian untuk kursus Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYOUT / PENARIKAN SALDO */}
        {activeTab === 'payout' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Penarikan Saldo Komisi (Payout)
                </h2>
                <p className="text-xs text-slate-500">
                  Tarik komisi kursus Anda langsung ke rekening bank atau dompet digital (e-Wallet).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Request Payout */}
              <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    Saldo Tersedia Ditarik:
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(currentBalance)}
                  </div>
                </div>

                <form onSubmit={handleRequestPayoutSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jumlah Penarikan (Rp) *
                    </label>
                    <input
                      type="number"
                      min="50000"
                      step="10000"
                      max={currentBalance}
                      value={payoutAmount}
                      onChange={e => setPayoutAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Minimal penarikan: Rp 50.000</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Bank / e-Wallet *
                    </label>
                    <select
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:border-blue-500 focus:outline-none"
                    >
                      <option value="BCA">Bank BCA</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="BNI">Bank BNI</option>
                      <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                      <option value="CIMB">CIMB Niaga</option>
                      <option value="Permata">Bank Permata</option>
                      <option value="GoPay">GoPay</option>
                      <option value="OVO">OVO</option>
                      <option value="DANA">DANA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Rekening / HP *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="Contoh: 1234567890"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Pemilik Rekening *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountHolder}
                      onChange={e => setAccountHolder(e.target.value)}
                      placeholder="Nama sesuai buku rekening"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingPayout || currentBalance < 50000}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingPayout ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <DollarSign className="w-4 h-4" />
                    )}
                    <span>{isSubmittingPayout ? 'Memproses...' : 'Ajukan Penarikan Dana'}</span>
                  </button>
                </form>
              </div>

              {/* Payout History */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Riwayat Pengajuan Payout
                  </h3>
                  <span className="text-xs text-slate-400">
                    Total Dicairkan: <strong className="text-slate-900 dark:text-white">{formatRupiah(totalPaidOut)}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Jumlah</th>
                        <th className="py-2.5 px-3">Rekening Tujuan</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                      {myPayouts.length > 0 ? (
                        myPayouts.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-3">
                              {new Date(p.requestedAt || p.createdAt || new Date()).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                              {formatRupiah(p.amount)}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold">{p.bankName || p.bankAccount?.bankName} - {p.accountNumber || p.bankAccount?.accountNumber}</div>
                              <div className="text-[10px] text-slate-400">a/n {p.accountHolder || p.bankAccount?.accountHolder}</div>
                            </td>
                            <td className="py-3 px-3">
                              {(p.status === 'approved' || p.status === 'completed') && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                  Ditransfer / Sukses
                                </span>
                              )}
                              {p.status === 'pending' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                                  Menunggu Admin
                                </span>
                              )}
                              {p.status === 'rejected' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                                  Ditolak (Saldo Dikembalikan)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                            Belum ada riwayat penarikan dana.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SIGNATURE & PROFILE */}
        {activeTab === 'signature' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                Pengaturan Tanda Tangan E-Sertifikat & Profil Instruktur
              </h2>
              <p className="text-xs text-slate-500">
                Upload tanda tangan resmi Lead Master untuk dicantumkan secara otomatis pada e-sertifikat kelulusan siswa.
              </p>
            </div>

            <form onSubmit={handleSaveSignatureAndProfile} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap & Gelar Instruktur *
                  </label>
                  <input
                    type="text"
                    required
                    value={instructorName}
                    onChange={e => setInstructorName(e.target.value)}
                    placeholder="Contoh: Dr. Sarah Wijaya, M.Kom"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan / Gelar di Sertifikat *
                  </label>
                  <input
                    type="text"
                    required
                    value={instructorTitle}
                    onChange={e => setInstructorTitle(e.target.value)}
                    placeholder="Contoh: Lead Master Instructor"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bidang Keahlian Instruktur (Maksimal 5 Bidang) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Bidang Keahlian Instruktur</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih dan kelola hingga maksimal 5 bidang keahlian utama untuk profil instruktur Anda.
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      instructorSpecializations.length >= 5
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                        : instructorSpecializations.length > 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {instructorSpecializations.length === 5
                      ? '✅ Maksimal 5/5 Terpilih'
                      : `Dipilih: ${instructorSpecializations.length} dari maks. 5 bidang`}
                  </span>
                </div>

                {/* Active Chips List */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  {instructorSpecializations.length === 0 ? (
                    <span className="text-slate-400 italic text-[11px] py-0.5">
                      Belum ada bidang keahlian yang dipilih.
                    </span>
                  ) : (
                    instructorSpecializations.map(spec => (
                      <span
                        key={spec}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 dark:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80"
                      >
                        <Tag className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{spec}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProfileSpecialization(spec)}
                          className="p-0.5 hover:bg-amber-300 dark:hover:bg-amber-800 rounded text-amber-700 dark:text-amber-300 transition"
                          title={`Hapus ${spec}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Dropdown Selector if < 5 */}
                {instructorSpecializations.length < 5 ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        value={selectedProfileSpec}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'Lainnya (Ketik Manual)') {
                            setIsCustomProfileSpecMode(true);
                            setSelectedProfileSpec('');
                          } else if (val) {
                            handleAddProfileSpecialization(val);
                          }
                        }}
                        className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value="">+ Tambah Bidang Keahlian dari Katalog ({SPECIALIZATION_OPTIONS.length - 1} Pilihan)...</option>
                        {SPECIALIZATION_OPTIONS.filter(opt => !instructorSpecializations.includes(opt)).map(opt => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Manual Input if toggled */}
                    {isCustomProfileSpecMode && (
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl space-y-2 animate-in fade-in duration-150">
                        <label className="block text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                          Ketikkan Bidang Keahlian Spesifik Anda:
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={customProfileSpec}
                            onChange={e => setCustomProfileSpec(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (customProfileSpec.trim()) {
                                  handleAddProfileSpecialization(customProfileSpec.trim());
                                }
                              }
                            }}
                            placeholder="Contoh: Sabun & Pembersih Rumah Tangga / Arduino IoT"
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-400 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customProfileSpec.trim()) {
                                handleAddProfileSpecialization(customProfileSpec.trim());
                              }
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition"
                          >
                            + Tambahkan
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCustomProfileSpecMode(false)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-300/60 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Maksimal <strong>5 bidang keahlian</strong> telah dipilih. Hapus salah satu tag di atas jika ingin menambah bidang lainnya.</span>
                  </div>
                )}
              </div>

              {/* Upload Digital Signature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Media Gambar Tanda Tangan Digital *
                  </label>
                  <input
                    type="file"
                    ref={signatureInputRef}
                    onChange={handleSignatureFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    disabled={isUploadingSignature}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1.5 transition"
                  >
                    {isUploadingSignature ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingSignature ? 'Mengunggah...' : 'Upload File Tanda Tangan'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-48 h-24 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-2 relative">
                    {signaturePreview ? (
                      <img
                        src={signaturePreview}
                        alt="Tanda Tangan Instruktur"
                        className="max-h-full max-w-full object-contain dark:invert"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <PenTool className="w-6 h-6 mx-auto mb-1 opacity-40" />
                        <span className="text-[10px]">Belum ada tanda tangan</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={signaturePreview}
                      onChange={e => setSignaturePreview(e.target.value)}
                      placeholder="https://... atau upload gambar tanda tangan di samping"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500">
                      💡 Format yang disarankan: <strong>PNG dengan latar belakang transparan</strong> agar menyatu secara estetis pada template sertifikat.
                    </p>
                  </div>
                </div>
              </div>

              {/* Certificate Preview Card */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pratinjau Blok Tanda Tangan pada E-Sertifikat:
                </div>
                <div className="max-w-xs mx-auto p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center space-y-2 shadow-sm">
                  <div className="h-16 flex items-center justify-center">
                    {signaturePreview ? (
                      <img src={signaturePreview} alt="Tanda Tangan" className="h-14 object-contain dark:invert" />
                    ) : (
                      <span className="text-xs text-slate-400 italic">[ Tanda Tangan ]</span>
                    )}
                  </div>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-1">
                    <div className="font-bold text-slate-900 dark:text-white text-xs">{instructorName || 'Nama Instruktur'}</div>
                    <div className="text-[10px] text-slate-500">{instructorTitle || 'Lead Master Instructor'}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${isSavingProfile ? 'animate-spin' : ''}`} />
                  <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil & Tanda Tangan'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Course Editor Modal for Instructor */}
      {isCourseModalOpen && (
        <CourseEditorModal
          isOpen={isCourseModalOpen}
          course={selectedCourseForEdit}
          onClose={() => {
            setIsCourseModalOpen(false);
            setSelectedCourseForEdit(null);
          }}
        />
      )}
    </div>
  );
};
