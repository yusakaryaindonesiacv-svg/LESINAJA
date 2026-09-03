import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Course, User, LiveSession, CarouselSlide, BankAccount } from '../../types';
import { formatRupiah, exportToCsv } from '../../utils/exportUtils';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../../utils/googleSheetsSync';
import {
  SUPABASE_SQL_SCHEMA_FULL,
  SUPABASE_SQL_SCHEMA_FIX_COURSES,
  SUPABASE_SQL_SCHEMA_SETTINGS_ONLY,
  SUPABASE_SQL_SCHEMA_FIX_AUTH_USER_TRIGGER,
  SUPABASE_SQL_STORAGE_SETUP,
  SUPABASE_SQL_SCHEMA_INSTRUCTOR_VERIFICATION,
  uploadFileToSupabaseStorage,
  getSafeAppOrigin,
  testSupabaseConnection
} from '../../utils/supabaseClient';
import { readFileAsDataUrl } from '../../utils/fileHelpers';
import { getEnvPakasirConfig, createPakasirTransaction } from '../../utils/pakasirClient';
import {
  getEnvPaymentkuConfig,
  createPaymentkuTransaction,
  testPaymentkuConnection,
  PAYMENTKU_CHANNELS
} from '../../utils/paymentkuClient';
import { CourseEditorModal } from './CourseEditorModal';
import { CourseStatsAndStudentsModal } from './CourseStatsAndStudentsModal';
import { CategoryManagementView } from './CategoryManagementView';
import { SocialProofSettingsView } from './SocialProofSettingsView';
import { BundleManagementView } from './BundleManagementView';
import { CertificateDesignerView } from './CertificateDesignerView';
import { FacebookPixelSettingsView } from './FacebookPixelSettingsView';
import { InstructorVerificationView } from './InstructorVerificationView';
import {
  LayoutDashboard,
  Settings,
  Bell,
  BookOpen,
  Users,
  CreditCard,
  FileText,
  Video,
  Radio,
  Image as ImageIcon,
  Sparkles,
  Sheet,
  Database,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Zap,
  Lock,
  RotateCcw,
  QrCode,
  Globe,
  AlertTriangle,
  Server,
  Tag,
  Cloud,
  Layers,
  ArrowDownToLine,
  ArrowUpToLine,
  Upload,
  GraduationCap,
  Mail,
  Send,
  Key,
  Eye,
  EyeOff,
  Link as LinkIcon,
  HelpCircle,
  PlayCircle,
  Bot,
  Save,
  Star,
  Flame,
  UserPlus,
  Package,
  Award,
  Palette,
  Wallet,
  Store,
  Building2,
  Smartphone
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    courses,
    deleteCourse,
    recalculateAllCoursesStats,
    updateCourseStats,
    courseBundles,
    categories,
    users,
    updateUserRole,
    deleteUser,
    instructorApplications,
    transactions,
    approveTransaction,
    liveSessions,
    deleteLiveSession,
    addLiveSession,
    websiteSettings,
    updateWebsiteSettings,
    paymentSettings,
    updatePaymentSettings,
    payoutRequests,
    processPayoutRequest,
    customPages,
    updateCustomPage,
    saveWebsiteSettingsToSupabase,
    savePaymentSettingsToSupabase,
    saveCarouselToSupabase,
    saveRunningTextToSupabase,
    saveLiveSessionsToSupabase,
    saveCustomPagesToSupabase,
    saveCategoriesToSupabase,
    saveUsersToSupabase,
    saveCoursesToSupabase,
    saveInstructorApplicationsToSupabase,
    sheetsConfig,
    updateSheetsConfig,
    syncToGoogleSheets,
    supabaseConfig,
    updateSupabaseConfig,
    loadSupabaseFromSecrets,
    testSupabase,
    syncToSupabase,
    syncFromSupabase,
    loadSampleCourses,
    clearAllDataAndReset,
    navigateTo,
    showToast
  } = useApp();

  const [activeMenu, setActiveMenu] = useState<
    | 'overview'
    | 'courses'
    | 'instructor_verification'
    | 'course_stats'
    | 'social_proof'
    | 'bundles'
    | 'categories'
    | 'certificate_designer'
    | 'facebook_pixel'
    | 'users'
    | 'payments'
    | 'website'
    | 'running_text'
    | 'carousel'
    | 'pages'
    | 'live_sessions'
    | 'database_sync'
  >('overview');

  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isSyncingPush, setIsSyncingPush] = useState(false);
  const [isSyncingPull, setIsSyncingPull] = useState(false);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);

  // Stats and Student Modal
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedCourseForStats, setSelectedCourseForStats] = useState<Course | null>(null);

  // Granular Save Loading States for each menu
  const [isSavingCourses, setIsSavingCourses] = useState(false);
  const [isSavingUsers, setIsSavingUsers] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isSavingRunningText, setIsSavingRunningText] = useState(false);
  const [isSavingCarousel, setIsSavingCarousel] = useState(false);
  const [isSavingLiveSessions, setIsSavingLiveSessions] = useState(false);
  const [isSavingPages, setIsSavingPages] = useState(false);
  const [isSavingWebsite, setIsSavingWebsite] = useState(false);
  const [isSavingOverview, setIsSavingOverview] = useState(false);
  const [testDiagnosticResult, setTestDiagnosticResult] = useState<{
    success: boolean;
    message: string;
    testedAt: string;
    tablesStatus?: Record<string, { exists: boolean; rlsOk: boolean; error?: string }>;
  } | null>(null);

  // Course Editor modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<Course | null>(null);

  // Live session modal state
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [newLiveTitle, setNewLiveTitle] = useState('');
  const [newLiveCourseId, setNewLiveCourseId] = useState(courses[0]?.id || '');
  const [newLiveDate, setNewLiveDate] = useState('2026-08-30');
  const [newLiveTime, setNewLiveTime] = useState('19:30 WIB');
  const [newLiveUrl, setNewLiveUrl] = useState('https://meet.google.com/lesin-aja-live');
  const [newLivePlatform, setNewLivePlatform] = useState<'Google Meet' | 'Zoom'>('Google Meet');

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Payment Gateway Settings Sub-tab & Diagnostics State
  const [paymentSubTab, setPaymentSubTab] = useState<'gateway_selection' | 'paymentku' | 'pakasir' | 'manual_banks' | 'commission'>('gateway_selection');
  const [showPaymentkuApiKey, setShowPaymentkuApiKey] = useState(false);
  const [paymentkuLogs, setPaymentkuLogs] = useState<any[]>([]);
  const [isLoadingPaymentkuLogs, setIsLoadingPaymentkuLogs] = useState(false);
  const [testPaymentkuWebhookResult, setTestPaymentkuWebhookResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testPaymentkuApiResult, setTestPaymentkuApiResult] = useState<{ success: boolean; message: string; isSandbox?: boolean; details?: any } | null>(null);
  const [isTestingPaymentkuApi, setIsTestingPaymentkuApi] = useState(false);

  // Pakasir Webhook & Diagnostics State
  const [pakasirLogs, setPakasirLogs] = useState<any[]>([]);
  const [isLoadingPakasirLogs, setIsLoadingPakasirLogs] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchPaymentkuLogs = async () => {
    setIsLoadingPaymentkuLogs(true);
    try {
      const res = await fetch('/api/paymentku/events');
      if (res.ok) {
        const data = await res.json();
        setPaymentkuLogs(data.events || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingPaymentkuLogs(false);
    }
  };

  const handleSendPaymentkuTestWebhook = async () => {
    try {
      const sampleOrderId = transactions[0]?.orderId || `PKU-TEST-${Date.now().toString().slice(-6)}`;
      const sampleAmount = transactions[0]?.amount || 99000;
      const samplePayload = {
        order_id: sampleOrderId,
        amount: sampleAmount,
        total_amount: sampleAmount,
        fee: 700,
        status: 'PAID',
        payment_method: 'paymentku_qris',
        payment_channel: 'QRIS',
        paid_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      const res = await fetch('/api/paymentku/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(paymentSettings.paymentkuWebhookSecret ? { 'X-PaymenKu-Signature': 'simulated_sig' } : {})
        },
        body: JSON.stringify(samplePayload)
      });

      if (res.ok) {
        setTestPaymentkuWebhookResult({
          success: true,
          message: `✅ Webhook Paymentku test berhasil diterima & dicatat untuk order ${sampleOrderId}!`
        });
        showToast('✅ Webhook receiver Paymentku terverifikasi aktif!');
        fetchPaymentkuLogs();
      } else {
        setTestPaymentkuWebhookResult({
          success: false,
          message: `Webhook endpoint mengembalikan status ${res.status}`
        });
      }
    } catch (err: any) {
      setTestPaymentkuWebhookResult({
        success: false,
        message: err.message || 'Gagal mengirim test webhook Paymentku'
      });
    }
  };

  const handleTestPaymentkuConnection = async () => {
    const envPku = getEnvPaymentkuConfig();
    const effectiveKey = (paymentSettings.paymentkuApiKey || envPku.apiKey || '').trim();
    const effectiveMerchant = (paymentSettings.paymentkuMerchantCode || envPku.merchantCode || '').trim();

    if (!effectiveKey) {
      showToast('⚠️ Masukkan API Key Paymentku terlebih dahulu!');
      setTestPaymentkuApiResult({
        success: false,
        message: 'API Key Paymentku belum diisi di form ataupun environment variable VITE_PAYMENTKU_API_KEY.'
      });
      return;
    }

    setIsTestingPaymentkuApi(true);
    setTestPaymentkuApiResult(null);
    showToast('Menghubungi server paymentku.com...');

    try {
      const result = await testPaymentkuConnection({
        apiKey: effectiveKey,
        merchantCode: effectiveMerchant
      });
      setTestPaymentkuApiResult(result);
      if (result.success) {
        showToast('✅ Berhasil terhubung ke Paymentku!');
      } else {
        showToast(`❌ Gagal: ${result.message}`);
      }
    } catch (err: any) {
      setTestPaymentkuApiResult({
        success: false,
        message: err.message || 'Gagal menghubungi server API Paymentku'
      });
      showToast('❌ Gagal menghubungi Paymentku');
    } finally {
      setIsTestingPaymentkuApi(false);
    }
  };

  const fetchPakasirLogs = async () => {
    setIsLoadingPakasirLogs(true);
    try {
      const res = await fetch('/api/pakasir/events');
      if (res.ok) {
        const data = await res.json();
        setPakasirLogs(data.events || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingPakasirLogs(false);
    }
  };

  const handleSendTestWebhook = async () => {
    try {
      const sampleOrderId = transactions[0]?.orderId || `INV${Date.now().toString().slice(-6)}`;
      const sampleAmount = transactions[0]?.amount || 99000;
      const samplePayload = {
        amount: sampleAmount,
        order_id: sampleOrderId,
        project: paymentSettings.pakasirProjectSlug || 'depodomain',
        status: 'completed',
        payment_method: 'qris',
        completed_at: new Date().toISOString()
      };

      const res = await fetch('/api/pakasir/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload)
      });

      if (res.ok) {
        setTestWebhookResult({
          success: true,
          message: `Webhook test berhasil dikirim & diproses untuk order ${sampleOrderId}!`
        });
        showToast('✅ Webhook callback Pakasir terverifikasi aktif!');
        fetchPakasirLogs();
      } else {
        setTestWebhookResult({
          success: false,
          message: `Webhook endpoint mengembalikan status ${res.status}`
        });
      }
    } catch (err: any) {
      setTestWebhookResult({
        success: false,
        message: err.message || 'Gagal mengirim test webhook'
      });
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Teks berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Financial Stats
  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalStudents = users.filter(u => u.role === 'student').length;

  const handleCreateLiveSession = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCourse = courses.find(c => c.id === newLiveCourseId);
    if (!targetCourse || !newLiveTitle.trim()) return;

    addLiveSession({
      title: newLiveTitle,
      courseId: targetCourse.id,
      courseTitle: targetCourse.title,
      instructorName: targetCourse.instructor.name,
      instructorAvatar: targetCourse.instructor.avatar,
      date: newLiveDate,
      time: newLiveTime,
      durationMinutes: 90,
      meetUrl: newLiveUrl,
      platform: newLivePlatform,
      description: `Sesi live mentoring interaktif membahas materi ${targetCourse.title}.`,
      maxAttendees: 150,
      registeredStudentIds: []
    });

    setIsLiveModalOpen(false);
    setNewLiveTitle('');
  };

  const handleExportUsers = () => {
    const data = users.map((u, idx) => ({
      No: idx + 1,
      ID: u.id,
      Nama_Lengkap: u.name,
      Email: u.email,
      Peran: u.role,
      No_HP: u.phone || '-',
      Institusi: u.institution || 'Umum',
      Jumlah_Kursus_Diikuti: u.enrolledCourseIds?.length || 0,
      Tanggal_Daftar: u.createdAt
    }));
    exportToCsv('Data_Pengguna_LesinAja', data);
    showToast('Data pengguna berhasil diekspor!');
  };

  const handleExportTransactions = () => {
    const data = transactions.map((t, idx) => ({
      No: idx + 1,
      Kode_Transaksi: t.transactionCode,
      Nama_Siswa: t.studentName,
      Email_Siswa: t.studentEmail,
      Judul_Kursus: t.courseTitle,
      Nominal_Rp: t.amount,
      Metode_Pembayaran: t.paymentMethod,
      Status: t.status,
      Tanggal_Transaksi: t.createdAt,
      Waktu_Bayar: t.paidAt || '-'
    }));
    exportToCsv('Laporan_Transaksi_LesinAja', data);
    showToast('Laporan transaksi berhasil diekspor!');
  };

  // Strict Admin Authorization Check
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800 shadow-lg">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Akses Ditolak: Khusus Super Admin</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Hanya akun Administrator terdaftar yang memiliki izin untuk membuka Panel Admin. Siswa tidak diperbolehkan mengakses atau beralih ke panel ini.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigateTo('home')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            Kembali ke Beranda
          </button>
          <button
            onClick={() => navigateTo('courses')}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Lihat Katalog Kursus
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-container" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-4 sm:p-6 border-r border-slate-800 shrink-0 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-sm text-white">
              PANEL ADMIN
            </h2>
            <p className="text-[10px] text-blue-400 font-semibold">
              LESIN AJA LMS Manager
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1 text-xs font-semibold">
          <button
            onClick={() => setActiveMenu('overview')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 transition ${
              activeMenu === 'overview'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Ikhtisar & Statistik</span>
          </button>

          <button
            onClick={() => setActiveMenu('courses')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 transition ${
              activeMenu === 'courses'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kelola Kursus & Video ({courses.length})</span>
          </button>

          <button
            id="admin-menu-instructor-verification"
            onClick={() => setActiveMenu('instructor_verification')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition ${
              activeMenu === 'instructor_verification'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
                : 'hover:bg-slate-800 text-amber-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Verifikasi Instruktur</span>
            </div>
            {instructorApplications.filter(a => a.status === 'pending').length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {instructorApplications.filter(a => a.status === 'pending').length} Baru
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold">
                {instructorApplications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMenu('course_stats')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition ${
              activeMenu === 'course_stats'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
                : 'hover:bg-slate-800 text-amber-400 hover:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Kelola Siswa & Rating ⭐</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400/20 text-amber-300">
              PRO
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('social_proof')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition ${
              activeMenu === 'social_proof'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
                : 'hover:bg-slate-800 text-amber-400 hover:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Notifikasi Order (Social Proof)</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
              websiteSettings.socialProofPopup?.enabled ?? true
                ? 'bg-emerald-400/20 text-emerald-400'
                : 'bg-slate-700 text-slate-400'
            }`}>
              {websiteSettings.socialProofPopup?.enabled ?? true ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('bundles')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition ${
              activeMenu === 'bundles'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Paket Bundling Kursus</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeMenu === 'bundles' ? 'bg-white text-blue-600' : 'bg-slate-800 text-slate-300'
            }`}>
              {courseBundles?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('categories')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition ${
              activeMenu === 'categories'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-cyan-400" />
              <span>Kategori Kursus</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeMenu === 'categories' ? 'bg-white text-blue-600' : 'bg-slate-800 text-slate-300'
            }`}>
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('certificate_designer')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition ${
              activeMenu === 'certificate_designer'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
                : 'hover:bg-slate-800 text-amber-400 hover:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Desain Sertifikat (Studio)</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400/20 text-amber-300">
              NEW
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('users')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 transition ${
              activeMenu === 'users'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manajemen Siswa ({totalStudents})</span>
          </button>

          <button
            onClick={() => setActiveMenu('payments')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between gap-2.5 transition ${
              activeMenu === 'payments'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Payment Gateway</span>
            </div>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
              {paymentSettings.activeGateway === 'paymentku'
                ? 'Paymentku'
                : paymentSettings.activeGateway === 'both'
                ? 'Pku + Pks'
                : paymentSettings.activeGateway === 'manual'
                ? 'Manual'
                : 'Pakasir'}
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('facebook_pixel')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between gap-2.5 transition ${
              activeMenu === 'facebook_pixel'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>Facebook Pixel & Meta Ads</span>
            </div>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-400/30">
              ADS
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('live_sessions')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 transition ${
              activeMenu === 'live_sessions'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4 text-rose-400" />
            <span>Jadwal Sesi Live ({liveSessions.length})</span>
          </button>

          <button
            onClick={() => setActiveMenu('running_text')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 transition ${
              activeMenu === 'running_text'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Running Text & Banner</span>
          </button>

          <button
            onClick={() => setActiveMenu('carousel')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 transition ${
              activeMenu === 'carousel'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <span>Image Carousel Slider</span>
          </button>

          <button
            onClick={() => setActiveMenu('pages')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 transition ${
              activeMenu === 'pages'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Halaman CMS (Page Builder)</span>
          </button>

          <button
            onClick={() => setActiveMenu('website')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 transition ${
              activeMenu === 'website'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Website</span>
          </button>

          <button
            onClick={() => setActiveMenu('database_sync')}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 transition ${
              activeMenu === 'database_sync'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Database & Google Sheets</span>
          </button>
        </nav>

        {/* Clean Slate Purge Data Button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              if (
                window.confirm(
                  'PERINGATAN: Apakah Anda yakin ingin MENGOSONGKAN SELURUH DATA (kursus, akun, transaksi, kategori) dan mereset ke kondisi pabrik (Clean Slate)? Pendaftar berikutnya akan otomatis menjadi Super Admin.'
                )
              ) {
                clearAllDataAndReset();
              }
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg border border-rose-800/40 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 transition text-[11px] font-semibold flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Reset Bersih / Kosongkan Data</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Work Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
        {/* OVERVIEW TAB */}
        {activeMenu === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Ringkasan & Analitik LMS
                </h1>
                <p className="text-xs text-slate-500">
                  Pantau pertumbuhan pendaftaran, pendapatan gateway, dan aktivitas siswa.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    setIsSavingOverview(true);
                    await syncToSupabase();
                    setIsSavingOverview(false);
                  }}
                  disabled={isSavingOverview}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                  title="Simpan seluruh data LMS ke database Supabase Cloud"
                >
                  <Save className={`w-4 h-4 ${isSavingOverview ? 'animate-spin' : ''}`} />
                  <span>{isSavingOverview ? 'Menyimpan...' : 'Simpan Semua ke Supabase'}</span>
                </button>
                <button
                  onClick={handleExportTransactions}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ekspor Transaksi Excel</span>
                </button>
                <button
                  onClick={() => syncToGoogleSheets()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Sync Google Sheets</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-blue-600">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded text-blue-600">
                    Lunas
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatRupiah(totalRevenue)}
                </p>
                <p className="text-xs text-slate-500">Total Pendapatan Terverifikasi</p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-emerald-600">
                  <Users className="w-5 h-5" />
                  <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded text-emerald-600">
                    Aktif
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {totalStudents} Siswa
                </p>
                <p className="text-xs text-slate-500">Siswa Terdaftar</p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-amber-500">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded text-amber-600">
                    Katalog
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {courses.length} Kursus
                </p>
                <p className="text-xs text-slate-500">Kursus Video Aktif</p>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-rose-500">
                  <Radio className="w-5 h-5" />
                  <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded text-rose-600">
                    Live
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {liveSessions.length} Jadwal
                </p>
                <p className="text-xs text-slate-500">Sesi Live Mentoring</p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  Daftar Transaksi Terbaru
                </h3>
                <span className="text-xs text-slate-400">Total: {transactions.length} Pesanan</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Kode Order</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">Kursus</th>
                      <th className="p-3">Nominal</th>
                      <th className="p-3">Metode</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.map(trx => (
                      <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {trx.transactionCode}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900 dark:text-white">{trx.studentName}</p>
                          <p className="text-[10px] text-slate-400">{trx.studentEmail}</p>
                        </td>
                        <td className="p-3 max-w-xs truncate font-medium text-slate-700 dark:text-slate-300">
                          {trx.courseTitle}
                        </td>
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                          {formatRupiah(trx.amount)}
                        </td>
                        <td className="p-3 uppercase font-bold text-slate-600 dark:text-slate-300">
                          {trx.paymentMethod}
                        </td>
                        <td className="p-3">
                          {trx.status === 'completed' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              LUNAS
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {trx.status === 'pending' && (
                            <button
                              onClick={() => approveTransaction(trx.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                            >
                              Setujui
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* COURSES TAB */}
        {activeMenu === 'courses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Pengaturan & Fitur Kursus
                </h2>
                <p className="text-xs text-slate-500">
                  Tambah kursus baru, kelola modul video YouTube, dan konfigurasi ujian kuis kelulusan.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    setIsSavingCourses(true);
                    await saveCoursesToSupabase();
                    setIsSavingCourses(false);
                  }}
                  disabled={isSavingCourses}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Simpan seluruh data kursus dan modul langsung ke database Supabase Cloud"
                >
                  <Save className={`w-4 h-4 ${isSavingCourses ? 'animate-spin' : ''}`} />
                  <span>{isSavingCourses ? 'Menyimpan...' : 'Simpan Kursus ke Supabase'}</span>
                </button>
                <button
                  onClick={async () => {
                    setIsSyncingPull(true);
                    await syncFromSupabase();
                    setIsSyncingPull(false);
                  }}
                  disabled={isSyncingPull}
                  className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Tarik semua kursus dari database Supabase Cloud"
                >
                  <ArrowDownToLine className={`w-3.5 h-3.5 ${isSyncingPull ? 'animate-spin' : ''}`} />
                  <span>{isSyncingPull ? 'Memuat...' : 'Tarik dari Supabase'}</span>
                </button>
                <button
                  onClick={async () => {
                    setIsSyncingPush(true);
                    await syncToSupabase();
                    setIsSyncingPush(false);
                  }}
                  disabled={isSyncingPush}
                  className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Sinkronkan semua kursus ke Supabase Cloud"
                >
                  <ArrowUpToLine className={`w-3.5 h-3.5 ${isSyncingPush ? 'animate-spin' : ''}`} />
                  <span>{isSyncingPush ? 'Menyinkronkan...' : 'Kirim ke Supabase'}</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCourseForEdit(null);
                    setIsCourseModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kursus Baru</span>
                </button>
              </div>
            </div>

            {courses.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                  <PlayCircle className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                    Belum Ada Kursus Terdaftar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Anda dapat membuat kursus baru dari nol, menarik data yang sudah ada dari database Supabase Cloud, atau memuat 3 kursus sampel siap pakai.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedCourseForEdit(null);
                      setIsCourseModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Kursus Baru</span>
                  </button>
                  <button
                    onClick={loadSampleCourses}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Muat 3 Kursus Sampel Siap Pakai</span>
                  </button>
                  <button
                    onClick={syncFromSupabase}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Tarik dari Supabase</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map(c => {
                const materiCount = c.modules.filter(m => m.materi && m.materi.trim().length > 0).length;
                const quizCount = c.modules.filter(m => m.quiz).length;

                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="flex gap-3.5 items-start">
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            {c.category}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {c.level}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate">
                          {c.title}
                        </h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                          {formatRupiah(c.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                          {c.modules.length} Modul
                        </span>
                        {materiCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                            {materiCount} Materi Teks
                          </span>
                        )}
                        {quizCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                            {quizCount} Ujian Kuis
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedCourseForStats(c);
                            setIsStatsModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition flex items-center gap-1.5 font-bold text-xs"
                          title="Kelola Siswa Terdaftar & Rating (Social Proof)"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{c.rating?.toFixed(1) || '5.0'}</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <Users className="w-3.5 h-3.5" />
                          <span>{c.studentsCount?.toLocaleString('id-ID') || 0}</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourseForEdit(c);
                            setIsCourseModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          title="Edit Kursus & Materi"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCourse(c.id)}
                          className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-100 transition"
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
            )}
          </div>
        )}

        {/* INSTRUCTOR APPLICATIONS & COURSE VERIFICATION TAB */}
        {activeMenu === 'instructor_verification' && <InstructorVerificationView />}

        {/* COURSE STATS & SOCIAL PROOF MANAGEMENT TAB */}
        {activeMenu === 'course_stats' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span>Kelola Siswa & Rating Kursus</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                    Social Proof Booster
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Atur jumlah siswa terdaftar (display/fake booster), rating bintang, badge populer/unggulan, serta kelola daftar siswa riil per kursus.
                </p>
              </div>

              {/* Quick Bulk Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={recalculateAllCoursesStats}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-slate-700 shadow-sm"
                  title="Hitung ulang jumlah siswa otomatis berdasarkan akun terdaftar & transaksi lunas"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hitung Ulang Siswa Riil</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Setel rating seluruh kursus menjadi 4.9 ⭐?')) {
                      for (const c of courses) {
                        await updateCourseStats(c.id, { rating: 4.9 });
                      }
                      showToast('⭐ Semua kursus berhasil disetel ke rating 4.9!');
                    }
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
                  title="Ubah rating semua kursus menjadi 4.9 bintang secara massal"
                >
                  <Star className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Set Semua Rating 4.9</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsSavingCourses(true);
                    await saveCoursesToSupabase();
                    setIsSavingCourses(false);
                  }}
                  disabled={isSavingCourses}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                  title="Simpan seluruh statistik kursus ke database Supabase Cloud"
                >
                  <Save className={`w-4 h-4 ${isSavingCourses ? 'animate-spin' : ''}`} />
                  <span>{isSavingCourses ? 'Menyimpan...' : 'Simpan ke Supabase'}</span>
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">
                  💡 Tips Meningkatkan Konversi Pendaftaran & Social Proof:
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Angka siswa terdaftar dan rating yang tinggi terbukti meningkatkan kepercayaan calon pendaftar di halaman katalog dan checkout. Anda dapat mengatur angka tampilan (booster) atau melihat daftar siswa nyata dengan menekan tombol <strong>"Kelola Siswa & Rating"</strong> pada tiap kursus.
                </p>
              </div>
            </div>

            {/* Courses Table / Cards Grid */}
            {courses.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum ada kursus yang dibuat.
                </p>
                <button
                  onClick={() => {
                    setSelectedCourseForEdit(null);
                    setIsCourseModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Kursus Pertama</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map(c => {
                  const realEnrolledCount = users.filter(u => u.enrolledCourseIds?.includes(c.id)).length;
                  const completedTrxCount = transactions.filter(t => t.courseId === c.id && t.status === 'completed').length;
                  const totalTrxRevenue = transactions
                    .filter(t => t.courseId === c.id && t.status === 'completed')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                  return (
                    <div
                      key={c.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-amber-400/60 dark:hover:border-amber-500/50 transition"
                    >
                      {/* Top Info */}
                      <div className="flex items-start gap-3">
                        <img
                          src={c.thumbnail}
                          alt={c.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {c.category}
                            </span>
                            {c.isPopular && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" />
                                Populer
                              </span>
                            )}
                            {c.isFeatured && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                Unggulan
                              </span>
                            )}
                          </div>
                          <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                            {c.title}
                          </h4>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                            {formatRupiah(c.price)}
                          </p>
                        </div>
                      </div>

                      {/* Stats Overview Pill Boxes */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80">
                          <p className="text-[10px] font-semibold text-slate-500">Rating Tampilan</p>
                          <p className="text-sm font-extrabold text-amber-500 flex items-center justify-center gap-1 mt-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            {c.rating?.toFixed(1) || '5.0'}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80">
                          <p className="text-[10px] font-semibold text-slate-500">Siswa Tampilan</p>
                          <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                            {c.studentsCount?.toLocaleString('id-ID') || 0}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80">
                          <p className="text-[10px] font-semibold text-slate-500">Siswa Riil Akun</p>
                          <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {realEnrolledCount} Siswa
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <span className="text-[11px] text-slate-500 font-medium">
                          Omset: {formatRupiah(totalTrxRevenue)} ({completedTrxCount} Lunas)
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCourseForStats(c);
                              setIsStatsModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Kelola Siswa & Rating</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SOCIAL PROOF FAKE & REAL ORDER NOTIFICATIONS TAB */}
        {activeMenu === 'social_proof' && (
          <SocialProofSettingsView />
        )}

        {/* BUNDLES & PROMO PACKAGES TAB */}
        {activeMenu === 'bundles' && (
          <BundleManagementView />
        )}

        {/* CATEGORIES TAB */}
        {activeMenu === 'categories' && (
          <CategoryManagementView />
        )}

        {/* USERS TAB */}
        {activeMenu === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Manajemen Siswa & Pengguna
                </h2>
                <p className="text-xs text-slate-500">
                  Daftar seluruh akun siswa, admin, dan pengajar terdaftar di platform LESIN AJA.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    setIsSavingUsers(true);
                    await saveUsersToSupabase();
                    setIsSavingUsers(false);
                  }}
                  disabled={isSavingUsers}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                  title="Simpan seluruh data siswa dan akun terdaftar ke database Supabase Cloud"
                >
                  <Save className={`w-4 h-4 ${isSavingUsers ? 'animate-spin' : ''}`} />
                  <span>{isSavingUsers ? 'Menyimpan...' : 'Simpan Siswa ke Supabase'}</span>
                </button>
                <button
                  onClick={handleExportUsers}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ekspor Pengguna (Excel / CSV)</span>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Pengguna</th>
                      <th className="p-3">Email & HP</th>
                      <th className="p-3">Peran (Role)</th>
                      <th className="p-3">Institusi</th>
                      <th className="p-3">Kursus Diikuti</th>
                      <th className="p-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                          <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">{u.email}</p>
                          <p className="text-[10px] text-slate-400">{u.phone || '-'}</p>
                        </td>
                        <td className="p-3">
                          {u.id === currentUser?.id ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              {u.role} (Anda)
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={e => updateUserRole(u.id, e.target.value as any)}
                              className={`text-[11px] font-bold rounded-lg px-2 py-1 border transition focus:outline-none focus:ring-1 cursor-pointer ${
                                u.role === 'admin'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                  : u.role === 'instructor'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              }`}
                            >
                              <option value="student">Siswa (student)</option>
                              <option value="instructor">Instruktur (instructor)</option>
                              <option value="admin">Admin (admin)</option>
                            </select>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {u.institution || 'Umum'}
                        </td>
                        <td className="p-3 font-bold text-blue-600">
                          {u.enrolledCourseIds?.length || 0} Kelas
                        </td>
                        <td className="p-3">
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT GATEWAY TAB */}
        {activeMenu === 'payments' && (
          <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Zap className="w-6 h-6 text-amber-500" />
                  <span>Pengaturan Payment Gateway</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kelola integrasi gateway pembayaran otomatis (<strong>Paymentku</strong> & <strong>Pakasir</strong>), pilih gateway aktif saat checkout, kelola nomor rekening manual, serta atur komisi platform.
                </p>
              </div>

              <button
                onClick={async () => {
                  setIsSavingPayment(true);
                  await savePaymentSettingsToSupabase(paymentSettings);
                  setIsSavingPayment(false);
                  showToast('✅ Pengaturan payment gateway berhasil disimpan ke Supabase!');
                }}
                disabled={isSavingPayment}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50 self-start sm:self-auto shrink-0 cursor-pointer"
                title="Simpan pengaturan payment gateway ke database Supabase Cloud"
              >
                <Save className={`w-4 h-4 ${isSavingPayment ? 'animate-spin' : ''}`} />
                <span>{isSavingPayment ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
              </button>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto text-xs font-bold scrollbar-none">
              <button
                type="button"
                onClick={() => setPaymentSubTab('gateway_selection')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  paymentSubTab === 'gateway_selection'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Pilihan Gateway Aktif</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-extrabold bg-white/20 text-white">
                  {paymentSettings.activeGateway === 'paymentku'
                    ? 'Paymentku'
                    : paymentSettings.activeGateway === 'both'
                    ? 'Semua'
                    : paymentSettings.activeGateway === 'manual'
                    ? 'Manual'
                    : 'Pakasir'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentSubTab('paymentku')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  paymentSubTab === 'paymentku'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Wallet className="w-4 h-4 text-indigo-400" />
                <span>Paymentku (paymentku.com)</span>
                {paymentSettings.enablePaymentku && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPaymentSubTab('pakasir')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  paymentSubTab === 'pakasir'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4 text-sky-400" />
                <span>Pakasir (pakasir.com)</span>
                {paymentSettings.enablePakasir && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPaymentSubTab('manual_banks')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  paymentSubTab === 'manual_banks'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Rekening Bank Manual</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentSubTab('commission')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  paymentSubTab === 'commission'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Komisi Platform</span>
              </button>
            </div>

            {/* TAB 1: ACTIVE GATEWAY SELECTION */}
            {paymentSubTab === 'gateway_selection' && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>Pilih Opsi Payment Gateway Utama (Checkout Siswa)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Tentukan gateway yang akan digunakan saat siswa menekan tombol "Beli Kursus" atau "Checkout". Anda dapat memilih salah satu atau mengaktifkan keduanya sekaligus.
                    </p>
                  </div>

                  {/* 4 Gateway Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: Paymentku (paymentku.com) */}
                    <div
                      onClick={() => {
                        updatePaymentSettings({
                          activeGateway: 'paymentku',
                          enablePaymentku: true,
                          enablePakasir: false
                        });
                        showToast('✅ Paymentku (paymentku.com) dipilih sebagai opsi pembayaran aktif!');
                      }}
                      className={`p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                        paymentSettings.activeGateway === 'paymentku' || (!paymentSettings.activeGateway && paymentSettings.enablePaymentku)
                          ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-md shadow-indigo-600/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
                              <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Paymentku.com</h4>
                              <span className="text-[11px] text-slate-400 font-mono">paymentku.com API</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                            Rekomendasi
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Gateway modern dengan dukungan terlengkap: QRIS Dinamis Instan, 8+ Virtual Account Otomatis (BCA, Mandiri, BRI, BNI, Permata, CIMB, BSI), E-Wallet (DANA, OVO, ShopeePay), dan Minimarket (Alfamart, Indomaret).
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">QRIS Instan</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">8+ Bank VA</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">E-Wallet</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Retail Outlet</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="active_gateway"
                            checked={paymentSettings.activeGateway === 'paymentku' || (!paymentSettings.activeGateway && paymentSettings.enablePaymentku && !paymentSettings.enablePakasir)}
                            onChange={() => {
                              updatePaymentSettings({
                                activeGateway: 'paymentku',
                                enablePaymentku: true,
                                enablePakasir: false
                              });
                            }}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Gunakan Paymentku Saja
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentSubTab('paymentku');
                          }}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>Atur Kredensial</span>
                          <Settings className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Option 2: Pakasir (pakasir.com) */}
                    <div
                      onClick={() => {
                        updatePaymentSettings({
                          activeGateway: 'pakasir',
                          enablePakasir: true,
                          enablePaymentku: false
                        });
                        showToast('✅ Pakasir (pakasir.com) dipilih sebagai opsi pembayaran aktif!');
                      }}
                      className={`p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                        paymentSettings.activeGateway === 'pakasir' || (!paymentSettings.activeGateway && !paymentSettings.enablePaymentku && paymentSettings.enablePakasir)
                          ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-md shadow-blue-600/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
                              <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pakasir.com</h4>
                              <span className="text-[11px] text-slate-400 font-mono">pakasir.com API</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                            QRIS & VA
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Gateway QRIS & Virtual Account otomatis melalui project slug & API key Pakasir dengan verifikasi instan via webhook.
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">QRIS Dinamis</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Virtual Account</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Webhook Realtime</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="active_gateway"
                            checked={paymentSettings.activeGateway === 'pakasir' || (!paymentSettings.activeGateway && !paymentSettings.enablePaymentku && paymentSettings.enablePakasir)}
                            onChange={() => {
                              updatePaymentSettings({
                                activeGateway: 'pakasir',
                                enablePakasir: true,
                                enablePaymentku: false
                              });
                            }}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Gunakan Pakasir Saja
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentSubTab('pakasir');
                          }}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span>Atur Kredensial</span>
                          <Settings className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Option 3: Keduanya Aktif (Paymentku + Pakasir) */}
                    <div
                      onClick={() => {
                        updatePaymentSettings({
                          activeGateway: 'both',
                          enablePaymentku: true,
                          enablePakasir: true
                        });
                        showToast('✅ Opsi Keduanya Aktif (Paymentku + Pakasir) berhasil disetel!');
                      }}
                      className={`p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                        paymentSettings.activeGateway === 'both'
                          ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-md shadow-emerald-600/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
                              <Zap className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Keduanya Aktif (Paymentku + Pakasir)</h4>
                              <span className="text-[11px] text-slate-400">Pilihan Maksimal Siswa</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                            Hybrid
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Siswa bebas memilih channel pembayaran baik dari Paymentku (QRIS, VA Bank, E-Wallet) maupun Pakasir secara bersamaan di popup checkout.
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Semua Saluran Pembayaran</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Auto Redundancy</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="active_gateway"
                            checked={paymentSettings.activeGateway === 'both'}
                            onChange={() => {
                              updatePaymentSettings({
                                activeGateway: 'both',
                                enablePaymentku: true,
                                enablePakasir: true
                              });
                            }}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Aktifkan Keduanya Bersama
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-600 font-bold">Direkomendasikan</span>
                      </div>
                    </div>

                    {/* Option 4: Manual Bank Transfer Saja */}
                    <div
                      onClick={() => {
                        updatePaymentSettings({
                          activeGateway: 'manual',
                          enableManualBank: true,
                          enablePaymentku: false,
                          enablePakasir: false
                        });
                        showToast('✅ Transfer Manual Rekening Bank dipilih!');
                      }}
                      className={`p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                        paymentSettings.activeGateway === 'manual'
                          ? 'border-amber-600 bg-amber-50/40 dark:bg-amber-950/30 shadow-md shadow-amber-600/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-sm">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Transfer Manual Rekening</h4>
                              <span className="text-[11px] text-slate-400">Verifikasi Admin Manual</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                            Manual
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Siswa mentransfer ke rekening bank admin (BCA, Mandiri, BRI, dll.) lalu mengunggah bukti transfer untuk diverifikasi oleh admin di menu Transaksi.
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">BCA, Mandiri, BRI, BNI</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Upload Bukti Transfer</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="active_gateway"
                            checked={paymentSettings.activeGateway === 'manual'}
                            onChange={() => {
                              updatePaymentSettings({
                                activeGateway: 'manual',
                                enableManualBank: true
                              });
                            }}
                            className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Hanya Transfer Manual
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentSubTab('manual_banks');
                          }}
                          className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>Kelola Rekening</span>
                          <Settings className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Summary Banner */}
                <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <p className="font-bold text-blue-900 dark:text-blue-200">
                        Status Konfigurasi Saat Ini:
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 text-[11px]">
                        Opsi Aktif: <strong>{paymentSettings.activeGateway === 'paymentku' ? 'Paymentku (paymentku.com)' : paymentSettings.activeGateway === 'both' ? 'Keduanya (Paymentku + Pakasir)' : paymentSettings.activeGateway === 'manual' ? 'Transfer Manual Bank' : 'Pakasir (pakasir.com)'}</strong>
                        {' • '}
                        Paymentku: {paymentSettings.paymentkuApiKey ? <span className="text-emerald-600 font-bold">API Key Terisi ({paymentSettings.paymentkuEnvironment || 'production'})</span> : <span className="text-amber-600 font-bold">API Key Belum Diisi</span>}
                        {' • '}
                        Pakasir: {paymentSettings.pakasirApiKey ? <span className="text-emerald-600 font-bold">API Key Terisi</span> : <span className="text-slate-400">Belum Diisi</span>}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (paymentSettings.activeGateway === 'paymentku') setPaymentSubTab('paymentku');
                      else if (paymentSettings.activeGateway === 'pakasir') setPaymentSubTab('pakasir');
                      else if (paymentSettings.activeGateway === 'manual') setPaymentSubTab('manual_banks');
                      else setPaymentSubTab('paymentku');
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
                  >
                    Buka Detail Kredensial &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: PAYMENTKU (paymentku.com) SETTINGS */}
            {paymentSubTab === 'paymentku' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
                {/* Enable Gateway Toggle */}
                <div className="flex items-center justify-between p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-indigo-950 dark:text-indigo-200">
                        Aktifkan Payment Gateway Paymentku (paymentku.com)
                      </h4>
                      <p className="text-xs text-indigo-700 dark:text-indigo-400">
                        Mendukung QRIS Dinamis Instan, 8+ Virtual Account Bank (BCA, Mandiri, BRI, BNI, Permata, CIMB, BSI), E-Wallet, dan Retail Outlet.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings.enablePaymentku !== false}
                    onChange={e => updatePaymentSettings({ enablePaymentku: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Vercel Environment Variables Card for Paymentku */}
                <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
                    <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Environment Variables Vercel / Container (Direkomendasikan):</span>
                  </div>
                  <p className="text-indigo-800 dark:text-indigo-300 text-[11px] leading-relaxed">
                    Anda dapat menyimpan API Key langsung di form di bawah ini, atau menambahkan variabel di <em>Vercel &rarr; Settings &rarr; Environment Variables</em> agar transaksi otomatis aktif:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block">API Key Bearer Token:</span>
                        <strong className="text-indigo-600 dark:text-indigo-400">VITE_PAYMENTKU_API_KEY</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('VITE_PAYMENTKU_API_KEY', 'vite_pku_key')}
                        className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                        title="Salin Key"
                      >
                        {copiedKey === 'vite_pku_key' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Webhook Secret (Opsional):</span>
                        <strong className="text-indigo-600 dark:text-indigo-400">VITE_PAYMENTKU_WEBHOOK_SECRET</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('VITE_PAYMENTKU_WEBHOOK_SECRET', 'vite_pku_sec')}
                        className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                        title="Salin Key"
                      >
                        {copiedKey === 'vite_pku_sec' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Fields for Paymentku */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* API Key */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                          API Key Paymentku (Bearer Token) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Format: sk_live_... (Live) atau sk_test_... (Sandbox)
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPaymentkuApiKey ? 'text' : 'password'}
                          value={paymentSettings.paymentkuApiKey || ''}
                          onChange={e => updatePaymentSettings({ paymentkuApiKey: e.target.value })}
                          placeholder="sk_live_xxxxxxxxxxxxxxxxxxxxxx atau sk_test_xxxxxxxxxx"
                          className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPaymentkuApiKey(!showPaymentkuApiKey)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showPaymentkuApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Dapatkan API Key dari dashboard <a href="https://paymentku.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">paymentku.com</a> pada menu Integrasi / API.
                      </p>
                    </div>

                    {/* Merchant Code */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Kode Merchant / ID (Opsional)
                      </label>
                      <input
                        type="text"
                        value={paymentSettings.paymentkuMerchantCode || ''}
                        onChange={e => updatePaymentSettings({ paymentkuMerchantCode: e.target.value })}
                        placeholder="Contoh: PKU-MERCHANT-001"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs"
                      />
                    </div>

                    {/* Webhook Secret */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Webhook Secret Signature (Opsional)
                      </label>
                      <input
                        type="password"
                        value={paymentSettings.paymentkuWebhookSecret || ''}
                        onChange={e => updatePaymentSettings({ paymentkuWebhookSecret: e.target.value })}
                        placeholder="whsec_xxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs"
                      />
                    </div>

                    {/* Environment */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Mode Lingkungan (Environment)
                      </label>
                      <select
                        value={paymentSettings.paymentkuEnvironment || 'production'}
                        onChange={e => updatePaymentSettings({ paymentkuEnvironment: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-medium text-xs"
                      >
                        <option value="production">Production (Live - Transaksi Asli Rp)</option>
                        <option value="sandbox">Sandbox (Testing / Prefix sk_test_)</option>
                      </select>
                    </div>

                    {/* Channels Multi-checkbox */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                        Metode Pembayaran Yang Diaktifkan
                      </label>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentSettings.enablePaymentkuQris !== false}
                            onChange={e => updatePaymentSettings({ enablePaymentkuQris: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300 font-medium">QRIS Dinamis</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentSettings.enablePaymentkuVa !== false}
                            onChange={e => updatePaymentSettings({ enablePaymentkuVa: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300 font-medium">Virtual Account (8+ Bank)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentSettings.enablePaymentkuEwallet !== false}
                            onChange={e => updatePaymentSettings({ enablePaymentkuEwallet: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300 font-medium">E-Wallet (DANA/OVO/Shopee)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentSettings.enablePaymentkuRetail !== false}
                            onChange={e => updatePaymentSettings({ enablePaymentkuRetail: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300 font-medium">Retail (Alfamart/Indomaret)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Webhook Endpoint Info & Auto URL */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                        <Globe className="w-4 h-4 text-indigo-500" />
                        <span>Webhook Callback URL Resmi (Notifikasi Paymentku)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `${typeof window !== 'undefined' ? window.location.origin : ''}/api/paymentku/webhook`,
                            'pku_webhook'
                          )
                        }
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedKey === 'pku_webhook' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Salin URL Webhook</span>
                      </button>
                    </div>

                    <code className="block p-2.5 bg-slate-900 text-indigo-300 rounded-lg font-mono text-[11px] select-all break-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/api/paymentku/webhook` : 'https://lesinaja.id/api/paymentku/webhook'}
                    </code>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        💡 Tempelkan URL di atas ke <strong>Dashboard Paymentku &rarr; Pengaturan Webhook / Callback URL</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={handleSendPaymentkuTestWebhook}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/50 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Uji Webhook Endpoint</span>
                      </button>
                    </div>

                    {testPaymentkuWebhookResult && (
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                          testPaymentkuWebhookResult.success
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200'
                        }`}
                      >
                        {testPaymentkuWebhookResult.success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span>{testPaymentkuWebhookResult.message}</span>
                      </div>
                    )}

                    {/* Test API Connection directly to paymentku.com */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-slate-700 dark:text-slate-300 font-bold text-xs">Uji Koneksi & Transaksi API ke paymentku.com Langsung</p>
                        <p className="text-[11px] text-slate-500">
                          Memverifikasi Bearer Token API Key ke server Paymentku ({paymentSettings.paymentkuApiKey ? `${paymentSettings.paymentkuApiKey.slice(0, 8)}...` : 'Belum diisi'}).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestPaymentkuConnection}
                        disabled={isTestingPaymentkuApi}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTestingPaymentkuApi ? 'animate-spin' : ''}`} />
                        <span>{isTestingPaymentkuApi ? 'Menghubungi...' : 'Uji Koneksi API Paymentku'}</span>
                      </button>
                    </div>

                    {testPaymentkuApiResult && (
                      <div
                        className={`p-3 rounded-xl text-xs space-y-1.5 ${
                          testPaymentkuApiResult.success
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold">
                          {testPaymentkuApiResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                          <span>{testPaymentkuApiResult.message}</span>
                        </div>
                        {testPaymentkuApiResult.details && (
                          <pre className="p-2 rounded bg-black/10 dark:bg-black/30 font-mono text-[10px] overflow-x-auto">
                            {JSON.stringify(testPaymentkuApiResult.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Live Webhook Receiver Logs for Paymentku */}
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                        <span className="font-bold text-xs text-slate-200">
                          Live Webhook Receiver Log Paymentku ({paymentkuLogs.length} event)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={fetchPaymentkuLogs}
                        disabled={isLoadingPaymentkuLogs}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 px-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingPaymentkuLogs ? 'animate-spin' : ''}`} />
                        <span>Refresh Log</span>
                      </button>
                    </div>

                    {paymentkuLogs.length === 0 ? (
                      <p className="text-[11px] text-slate-400 font-mono py-2">
                        Belum ada notifikasi webhook yang diterima dari Paymentku. Klik "Uji Webhook Endpoint" di atas untuk simulasi payload.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto font-mono text-[11px]">
                        {paymentkuLogs.map((log, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] font-bold">
                                {log.status?.toUpperCase() || 'PAID'}
                              </span>
                              <span className="text-slate-300 font-bold">{log.order_id}</span>
                              <span className="text-slate-400">({log.payment_channel || log.payment_method || 'QRIS'})</span>
                            </div>
                            <div className="text-right text-[10px] text-slate-400">
                              <span className="text-emerald-400 font-bold">{formatRupiah(log.amount || log.total_amount)}</span> •{' '}
                              <span>{new Date(log.received_at || log.paid_at || Date.now()).toLocaleTimeString('id-ID')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Step-by-Step Paymentku Integration Guide */}
                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-indigo-600" />
                      <span>Dokumentasi & Panduan API Paymentku (paymentku.com)</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="w-6 h-6 rounded-md bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs">
                          1
                        </div>
                        <h5 className="font-bold text-slate-900 dark:text-white">Dapatkan API Key</h5>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          Buka <a href="https://paymentku.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">paymentku.com</a>, masuk ke dashboard merchant, dan salin <strong>API Key (Bearer Token)</strong> ke formulir di atas.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="w-6 h-6 rounded-md bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs">
                          2
                        </div>
                        <h5 className="font-bold text-slate-900 dark:text-white">Pasang Webhook URL</h5>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          Di dashboard Paymentku, masukkan URL Webhook Callback ke menu pengaturan webhook agar notifikasi pembayaran diterima secara instan.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="w-6 h-6 rounded-md bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs">
                          3
                        </div>
                        <h5 className="font-bold text-slate-900 dark:text-white">Auto Aktivasi Kelas</h5>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          Saat siswa membayar QRIS, VA, atau E-Wallet, webhook secara otomatis memvalidasi transaksi dan membuka akses kelas bagi siswa seketika!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PAKASIR (pakasir.com) SETTINGS */}
            {paymentSubTab === 'pakasir' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-blue-950 dark:text-blue-200">
                        Aktifkan Gateway Pakasir (pakasir.com)
                      </h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Mendukung QRIS Instan (Semua Bank & e-Wallet), 9+ Virtual Account Otomatis, dan Webhook Realtime.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings.enablePakasir}
                    onChange={e => updatePaymentSettings({ enablePakasir: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Vercel Environment Variables Card for Pakasir */}
                <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
                    <Key className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Environment Variables Vercel (Opsional / Recommended):</span>
                  </div>
                  <p className="text-blue-800 dark:text-blue-400 text-[11px] leading-relaxed">
                    Jika Anda menggunakan Vercel, selain mengisi form di bawah, Anda juga dapat menambahkan credentials di <em>Vercel &rarr; Settings &rarr; Environment Variables</em>:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Key 1:</span>
                        <strong className="text-blue-600 dark:text-blue-400">VITE_PAKASIR_PROJECT_SLUG</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('VITE_PAKASIR_PROJECT_SLUG', 'vite_pks_slug')}
                        className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Salin Key"
                      >
                        {copiedKey === 'vite_pks_slug' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Key 2:</span>
                        <strong className="text-blue-600 dark:text-blue-400">VITE_PAKASIR_API_KEY</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('VITE_PAKASIR_API_KEY', 'vite_pks_key')}
                        className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Salin Key"
                      >
                        {copiedKey === 'vite_pks_key' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Project Slug / Nama Proyek di Pakasir *
                      </label>
                      <input
                        type="text"
                        value={paymentSettings.pakasirProjectSlug || paymentSettings.pakasirMerchantCode || ''}
                        onChange={e =>
                          updatePaymentSettings({
                            pakasirProjectSlug: e.target.value,
                            pakasirMerchantCode: e.target.value
                          })
                        }
                        placeholder="Contoh: depodomain"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Sesuai parameter <code className="text-blue-500 font-mono font-bold">project</code> di API Pakasir (tertera di URL detail proyek).
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Pakasir API Key (Secret Key) *
                      </label>
                      <input
                        type="password"
                        value={paymentSettings.pakasirApiKey}
                        onChange={e => updatePaymentSettings({ pakasirApiKey: e.target.value })}
                        placeholder="Contoh: pks_live_xxxxxxxx atau key dari detail proyek"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Ditemukan pada menu Detail Proyek di dashboard Pakasir.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mode Environment
                      </label>
                      <select
                        value={paymentSettings.pakasirEnvironment}
                        onChange={e => updatePaymentSettings({ pakasirEnvironment: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-medium"
                      >
                        <option value="sandbox">Sandbox (Testing & Simulasi API)</option>
                        <option value="production">Production (Transaksi Rupiah Asli)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fitur Pembayaran Aktif
                      </label>
                      <div className="flex items-center gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentSettings.enableQris !== false}
                            onChange={e => updatePaymentSettings({ enableQris: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300">QRIS Dinamis</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentSettings.enableVirtualAccount !== false}
                            onChange={e => updatePaymentSettings({ enableVirtualAccount: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300">Virtual Account</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Webhook Endpoint Info & Auto URL */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-blue-500" />
                        <span>Webhook Callback URL Resmi (Notifikasi Pakasir)</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              `${typeof window !== 'undefined' ? window.location.origin : ''}/api/pakasir/webhook`,
                              'pakasir_webhook'
                            )
                          }
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-[11px] flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedKey === 'pakasir_webhook' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Salin URL Webhook</span>
                        </button>
                      </div>
                    </div>

                    <code className="block p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] select-all break-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/api/pakasir/webhook` : 'https://lesinaja.id/api/pakasir/webhook'}
                    </code>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        💡 Salin URL di atas lalu masukkan ke <strong>Dashboard Pakasir → Edit Proyek → Webhook URL</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={handleSendTestWebhook}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Uji Webhook Endpoint</span>
                      </button>
                    </div>

                    {testWebhookResult && (
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                          testWebhookResult.success
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200'
                        }`}
                      >
                        {testWebhookResult.success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span>{testWebhookResult.message}</span>
                      </div>
                    )}

                    {/* Test API Create QRIS Transaction to Pakasir */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-slate-700 dark:text-slate-300 font-bold text-xs">Uji Buat Transaksi QRIS ke Pakasir Langsung</p>
                        <p className="text-[11px] text-slate-500">Mengecek koneksi API Key & Project Slug ke server Pakasir ({paymentSettings.pakasirProjectSlug || 'Belum diisi'}).</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const envCfg = getEnvPakasirConfig();
                          const pSlug = (paymentSettings.pakasirProjectSlug || paymentSettings.pakasirMerchantCode || envCfg.projectSlug || '').trim();
                          const aKey = (paymentSettings.pakasirApiKey || envCfg.apiKey || '').trim();
                          if (!pSlug || !aKey) {
                            showToast('⚠️ Masukkan Project Slug & API Key Pakasir terlebih dahulu!');
                            return;
                          }
                          const testOrderId = `TEST${Date.now().toString().slice(-6)}`;
                          showToast('Menghubungi API Pakasir...');
                          const res = await createPakasirTransaction({
                            method: 'qris',
                            project: pSlug,
                            order_id: testOrderId,
                            amount: 10000,
                            api_key: aKey
                          });
                          if (res.success && res.data) {
                            setTestWebhookResult({
                              success: true,
                              message: `✅ Sukses menghubungi Pakasir! QRIS terbuat untuk Order: ${res.data.order_id}, Total: Rp ${(res.data.total_payment || 10000).toLocaleString('id-ID')}`
                            });
                            showToast('✅ Berhasil terhubung ke API Pakasir!');
                          } else {
                            setTestWebhookResult({
                              success: false,
                              message: `❌ Pakasir Error: ${res.error || 'Gagal membuat transaksi'}`
                            });
                            showToast(`❌ Gagal: ${res.error || 'Periksa API Key / Project Slug'}`);
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/50 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        <span>Uji Koneksi API Pakasir</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Webhook Event Logs Viewer */}
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-bold text-xs text-slate-200">
                          Live Webhook Receiver Log ({pakasirLogs.length} event)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={fetchPakasirLogs}
                        disabled={isLoadingPakasirLogs}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 px-2 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingPakasirLogs ? 'animate-spin' : ''}`} />
                        <span>Refresh Log</span>
                      </button>
                    </div>

                    {pakasirLogs.length === 0 ? (
                      <p className="text-[11px] text-slate-400 font-mono py-2">
                        Belum ada notifikasi webhook yang diterima dari Pakasir. Klik "Uji Webhook Endpoint" di atas untuk mencoba.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto font-mono text-[11px]">
                        {pakasirLogs.map((log, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                                {log.status?.toUpperCase()}
                              </span>
                              <span className="text-slate-300 font-bold">{log.order_id}</span>
                              <span className="text-slate-400">({log.payment_method})</span>
                            </div>
                            <div className="text-right text-[10px] text-slate-400">
                              <span className="text-emerald-400 font-bold">{formatRupiah(log.amount)}</span> •{' '}
                              <span>{new Date(log.received_at || log.completed_at).toLocaleTimeString('id-ID')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: MANUAL BANK ACCOUNTS */}
            {paymentSubTab === 'manual_banks' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between p-4 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-600 text-white shadow-xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-amber-950 dark:text-amber-200">
                        Aktifkan Metode Transfer Manual Rekening Bank
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Siswa dapat memilih rekening bank tujuan, mentransfer dana manual, dan mengunggah struk bukti transfer.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings.enableManualBank !== false}
                    onChange={e => updatePaymentSettings({ enableManualBank: e.target.checked })}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                {/* List of Bank Accounts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      Daftar Rekening Bank Tujuan Transfer ({paymentSettings.bankAccounts?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newBank: BankAccount = {
                          id: `bank-${Date.now()}`,
                          bankName: 'BCA',
                          accountNumber: '',
                          accountHolder: 'PT LESIN AJA INDONESIA',
                          isActive: true,
                          description: 'Transfer ke rekening BCA, konfirmasi otomatis/manual'
                        };
                        updatePaymentSettings({
                          bankAccounts: [...(paymentSettings.bankAccounts || []), newBank]
                        });
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Rekening Bank</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(!paymentSettings.bankAccounts || paymentSettings.bankAccounts.length === 0) ? (
                      <p className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                        Belum ada rekening bank yang ditambahkan. Klik "Tambah Rekening Bank" di atas.
                      </p>
                    ) : (
                      paymentSettings.bankAccounts.map((bank, index) => (
                        <div
                          key={bank.id || index}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Nama Bank
                              </label>
                              <input
                                type="text"
                                value={bank.bankName}
                                onChange={e => {
                                  const updated = [...(paymentSettings.bankAccounts || [])];
                                  updated[index] = { ...updated[index], bankName: e.target.value };
                                  updatePaymentSettings({ bankAccounts: updated });
                                }}
                                placeholder="BCA / Mandiri / BRI / BNI / BSI"
                                className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-bold"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Nomor Rekening
                              </label>
                              <input
                                type="text"
                                value={bank.accountNumber}
                                onChange={e => {
                                  const updated = [...(paymentSettings.bankAccounts || [])];
                                  updated[index] = { ...updated[index], accountNumber: e.target.value };
                                  updatePaymentSettings({ bankAccounts: updated });
                                }}
                                placeholder="1234567890"
                                className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Atas Nama (Pemilik)
                              </label>
                              <input
                                type="text"
                                value={bank.accountHolder}
                                onChange={e => {
                                  const updated = [...(paymentSettings.bankAccounts || [])];
                                  updated[index] = { ...updated[index], accountHolder: e.target.value };
                                  updatePaymentSettings({ bankAccounts: updated });
                                }}
                                placeholder="PT LESIN AJA INDONESIA"
                                className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-bold"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <input
                              type="text"
                              value={bank.description || ''}
                              onChange={e => {
                                const updated = [...(paymentSettings.bankAccounts || [])];
                                updated[index] = { ...updated[index], description: e.target.value };
                                updatePaymentSettings({ bankAccounts: updated });
                              }}
                              placeholder="Keterangan tambahan (opsional, contoh: Cabang Jakarta Pusat)"
                              className="text-[11px] p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex-1 mr-3"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const updated = (paymentSettings.bankAccounts || []).filter((_, i) => i !== index);
                                updatePaymentSettings({ bankAccounts: updated });
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="Hapus Rekening"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: COMMISSION & PAYOUT SETTINGS */}
            {paymentSubTab === 'commission' && (
              <div className="space-y-6">
                {/* PLATFORM COMMISSION SETTINGS & INSTRUCTOR REVENUE SHARE */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                          Pengaturan Potongan Komisi Platform & Instruktur
                        </h3>
                        <p className="text-xs text-slate-500">
                          Tentukan persentase potongan bagi hasil untuk setiap transaksi kursus milik instruktur terdaftar.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        setIsSavingPayment(true);
                        await savePaymentSettingsToSupabase(paymentSettings);
                        setIsSavingPayment(false);
                        showToast('✅ Pengaturan komisi & payment gateway berhasil disimpan!');
                      }}
                      disabled={isSavingPayment}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition disabled:opacity-50 self-start sm:self-auto shrink-0 cursor-pointer"
                    >
                      <Save className={`w-3.5 h-3.5 ${isSavingPayment ? 'animate-spin' : ''}`} />
                      <span>{isSavingPayment ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                          Persentase Potongan Platform Admin (%) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={paymentSettings.platformCommissionPercentage ?? 10}
                            onChange={e => {
                              const val = Math.min(100, Math.max(0, Number(e.target.value)));
                              updatePaymentSettings({ platformCommissionPercentage: val });
                            }}
                            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-extrabold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-3.5 top-2.5 text-slate-400 font-extrabold text-sm">
                            %
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Contoh: Diisi 10, maka Admin menerima 10% dan Instruktur menerima 90% dari nilai transaksi kursus.
                        </p>
                      </div>

                      {/* Quick percentage buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preset Cepat:</span>
                        {[0, 5, 10, 15, 20, 30].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => updatePaymentSettings({ platformCommissionPercentage: pct })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
                              (paymentSettings.platformCommissionPercentage ?? 10) === pct
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Simulation Breakdown Preview */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
                      <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Simulasi Pembagian Bagi Hasil (Contoh Kursus Rp 100.000)
                      </span>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
                          <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Hak Admin Platform ({paymentSettings.platformCommissionPercentage ?? 10}%)</span>
                          </span>
                          <span className="font-mono font-extrabold text-blue-700 dark:text-blue-300">
                            {formatRupiah(100000 * ((paymentSettings.platformCommissionPercentage ?? 10) / 100))}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Hak Saldo Instruktur ({100 - (paymentSettings.platformCommissionPercentage ?? 10)}%)</span>
                          </span>
                          <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-300">
                            {formatRupiah(100000 * ((100 - (paymentSettings.platformCommissionPercentage ?? 10)) / 100))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* INSTRUCTOR PAYOUT REQUESTS LIST & APPROVAL */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <ArrowDownToLine className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                          Pengajuan Pencairan Saldo Instruktur (Payout Requests)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Daftar permohonan penarikan dana komisi dari para instruktur yang terdaftar.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto">
                      Total: {payoutRequests.length} Permohonan
                    </span>
                  </div>

                  {payoutRequests.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      Belum ada permohonan pencairan saldo dari instruktur.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 uppercase font-bold">
                            <th className="py-2.5 px-3">Tanggal</th>
                            <th className="py-2.5 px-3">Instruktur</th>
                            <th className="py-2.5 px-3">Nominal Tarik</th>
                            <th className="py-2.5 px-3">Rekening Tujuan</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Aksi Admin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {payoutRequests.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-3 px-3 whitespace-nowrap">
                                {new Date(p.requestedAt || p.createdAt || new Date()).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 dark:text-white">{p.instructorName}</div>
                                <div className="text-[10px] text-slate-400">{p.instructorEmail}</div>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                                {formatRupiah(p.amount)}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold">{p.bankName || p.bankAccount?.bankName} - {p.accountNumber || p.bankAccount?.accountNumber}</div>
                                <div className="text-[10px] text-slate-400">a/n {p.accountHolder || p.bankAccount?.accountHolder}</div>
                              </td>
                              <td className="py-3 px-3">
                                {(p.status === 'approved' || p.status === 'completed') && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                    Selesai / Ditransfer
                                  </span>
                                )}
                                {p.status === 'pending' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                                    Menunggu Verifikasi
                                  </span>
                                )}
                                {p.status === 'rejected' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                                    Ditolak
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {p.status === 'pending' ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Setujui pencairan ${formatRupiah(p.amount)} untuk ${p.instructorName}? Pastikan Anda sudah mentransfer ke rekening tujuan.`)) {
                                          processPayoutRequest(p.id, 'approved', 'Transfer telah diverifikasi & disetujui');
                                        }
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition shadow-xs"
                                    >
                                      Setujui & Selesai
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const reason = prompt('Alasan penolakan (saldo akan otomatis dikembalikan ke instruktur):', 'Rekening tidak valid / tidak sesuai');
                                        if (reason !== null) {
                                          processPayoutRequest(p.id, 'rejected', reason || 'Ditolak admin');
                                        }
                                      }}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold transition shadow-xs"
                                    >
                                      Tolak
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Telah diproses</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RUNNING TEXT TAB */}
        {activeMenu === 'running_text' && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Pengaturan Running Text (Announcement Ticker)
                </h2>
                <p className="text-xs text-slate-500">
                  Ubah teks pengumuman berjalan di bagian atas halaman website.
                </p>
              </div>

              <button
                onClick={async () => {
                  setIsSavingRunningText(true);
                  await saveRunningTextToSupabase(websiteSettings.runningText);
                  setIsSavingRunningText(false);
                }}
                disabled={isSavingRunningText}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50 self-start sm:self-auto shrink-0"
                title="Simpan pengaturan running text ke database Supabase Cloud"
              >
                <Save className={`w-4 h-4 ${isSavingRunningText ? 'animate-spin' : ''}`} />
                <span>{isSavingRunningText ? 'Menyimpan...' : 'Simpan Running Text ke Supabase'}</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Status Running Text Aktif
                </span>
                <input
                  type="checkbox"
                  checked={websiteSettings.runningText.enabled}
                  onChange={e =>
                    updateWebsiteSettings({
                      runningText: { ...websiteSettings.runningText, enabled: e.target.checked }
                    })
                  }
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Teks Pengumuman
                </label>
                <textarea
                  rows={3}
                  value={websiteSettings.runningText.text}
                  onChange={e =>
                    updateWebsiteSettings({
                      runningText: { ...websiteSettings.runningText, text: e.target.value }
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Label Tombol Tautan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={websiteSettings.runningText.linkText || ''}
                    onChange={e =>
                      updateWebsiteSettings({
                        runningText: { ...websiteSettings.runningText, linkText: e.target.value }
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kecepatan Animasi (Detik)
                  </label>
                  <input
                    type="number"
                    value={websiteSettings.runningText.speed || 25}
                    onChange={e =>
                      updateWebsiteSettings({
                        runningText: { ...websiteSettings.runningText, speed: Number(e.target.value) }
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    setIsSavingRunningText(true);
                    await saveRunningTextToSupabase(websiteSettings.runningText);
                    setIsSavingRunningText(false);
                  }}
                  disabled={isSavingRunningText}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${isSavingRunningText ? 'animate-spin' : ''}`} />
                  <span>{isSavingRunningText ? 'Menyimpan...' : 'Simpan Perubahan Running Text'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IMAGE CAROUSEL TAB */}
        {activeMenu === 'carousel' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Pengaturan Image Carousel Banner
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola gambar slide banner promo utama pada beranda LESIN AJA.
                </p>
              </div>

              <button
                onClick={async () => {
                  setIsSavingCarousel(true);
                  await saveCarouselToSupabase(websiteSettings.carouselSlides);
                  setIsSavingCarousel(false);
                }}
                disabled={isSavingCarousel}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50 self-start sm:self-auto shrink-0"
                title="Simpan slide banner carousel ke database Supabase Cloud"
              >
                <Save className={`w-4 h-4 ${isSavingCarousel ? 'animate-spin' : ''}`} />
                <span>{isSavingCarousel ? 'Menyimpan...' : 'Simpan Carousel ke Supabase'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {websiteSettings.carouselSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="aspect-video rounded-lg overflow-hidden relative bg-slate-900">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-black/60 text-white">
                      Slide #{idx + 1}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <input
                      type="text"
                      value={slide.title}
                      onChange={e => {
                        const updated = websiteSettings.carouselSlides.map(s =>
                          s.id === slide.id ? { ...s, title: e.target.value } : s
                        );
                        updateWebsiteSettings({ carouselSlides: updated });
                      }}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border font-bold"
                    />
                    <input
                      type="text"
                      value={slide.subtitle}
                      onChange={e => {
                        const updated = websiteSettings.carouselSlides.map(s =>
                          s.id === slide.id ? { ...s, subtitle: e.target.value } : s
                        );
                        updateWebsiteSettings({ carouselSlides: updated });
                      }}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border text-slate-500"
                    />
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="url"
                        value={slide.imageUrl}
                        onChange={e => {
                          const updated = websiteSettings.carouselSlides.map(s =>
                            s.id === slide.id ? { ...s, imageUrl: e.target.value } : s
                          );
                          updateWebsiteSettings({ carouselSlides: updated });
                        }}
                        placeholder="URL Gambar Banner..."
                        className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border font-mono text-[11px]"
                      />
                      <label className="px-2.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold text-xs border border-blue-200 dark:border-blue-800 flex items-center gap-1 cursor-pointer transition shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const res = await uploadFileToSupabaseStorage(file, 'thumbnails');
                              const finalUrl = res.success && res.publicUrl ? res.publicUrl : await readFileAsDataUrl(file);
                              const updated = websiteSettings.carouselSlides.map(s =>
                                s.id === slide.id ? { ...s, imageUrl: finalUrl } : s
                              );
                              updateWebsiteSettings({ carouselSlides: updated });
                              showToast('Gambar slide carousel berhasil diperbarui!');
                            } catch {
                              const dataUrl = await readFileAsDataUrl(file);
                              const updated = websiteSettings.carouselSlides.map(s =>
                                s.id === slide.id ? { ...s, imageUrl: dataUrl } : s
                              );
                              updateWebsiteSettings({ carouselSlides: updated });
                            }
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE SESSIONS TAB */}
        {activeMenu === 'live_sessions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Jadwal Sesi Mentoring Live
                </h2>
                <p className="text-xs text-slate-500">
                  Buat jadwal bedah kasus tatap muka online dengan tautan Google Meet / Zoom.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    setIsSavingLiveSessions(true);
                    await saveLiveSessionsToSupabase(liveSessions);
                    setIsSavingLiveSessions(false);
                  }}
                  disabled={isSavingLiveSessions}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Simpan daftar jadwal sesi live mentoring ke database Supabase Cloud"
                >
                  <Save className={`w-4 h-4 ${isSavingLiveSessions ? 'animate-spin' : ''}`} />
                  <span>{isSavingLiveSessions ? 'Menyimpan...' : 'Simpan Jadwal ke Supabase'}</span>
                </button>

                <button
                  onClick={() => setIsLiveModalOpen(true)}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg shadow-md flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Jadwalkan Sesi Baru</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveSessions.map(session => (
                <div
                  key={session.id}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {session.platform}
                      </span>
                      <span className="text-xs text-rose-500 font-bold">
                        {session.date} • {session.time}
                      </span>
                    </div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      {session.title}
                    </h4>
                    <p className="text-xs text-slate-500">{session.courseTitle}</p>
                    <p className="text-xs text-blue-600 font-semibold font-mono truncate">
                      {session.meetUrl}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400">
                      {session.registeredStudentIds.length} Siswa Terdaftar
                    </span>
                    <button
                      onClick={() => deleteLiveSession(session.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CMS PAGES TAB */}
        {activeMenu === 'pages' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Halaman Statis CMS & Page Builder
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola konten teks halaman Tentang Kami, FAQ, dan Syarat & Ketentuan.
                </p>
              </div>

              <button
                onClick={async () => {
                  setIsSavingPages(true);
                  await saveCustomPagesToSupabase(customPages);
                  setIsSavingPages(false);
                }}
                disabled={isSavingPages}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50 self-start sm:self-auto shrink-0"
                title="Simpan seluruh halaman statis CMS ke database Supabase Cloud"
              >
                <Save className={`w-4 h-4 ${isSavingPages ? 'animate-spin' : ''}`} />
                <span>{isSavingPages ? 'Menyimpan...' : 'Simpan Halaman ke Supabase'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {customPages.map(page => (
                <div
                  key={page.id}
                  className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                      {page.title} (/{page.slug})
                    </h4>
                    <button
                      onClick={() => navigateTo('custom-page', { slug: page.slug })}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Lihat Halaman</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={page.content}
                    onChange={e => updateCustomPage(page.id, e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border font-mono"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsSavingPages(true);
                        await saveCustomPagesToSupabase(customPages);
                        setIsSavingPages(false);
                      }}
                      disabled={isSavingPages}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Save className={`w-3.5 h-3.5 ${isSavingPages ? 'animate-spin' : ''}`} />
                      <span>{isSavingPages ? 'Menyimpan...' : `Simpan ${page.title}`}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEBSITE SETTINGS TAB */}
        {activeMenu === 'website' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                  Pengaturan Umum & Identitas Logo Aplikasi
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola logo aplikasi, ikon aplikasi ponsel (PWA), identitas merk, email kontak, dan teks hak cipta.
                </p>
              </div>

              <button
                onClick={async () => {
                  setIsSavingWebsite(true);
                  await saveWebsiteSettingsToSupabase(websiteSettings);
                  setIsSavingWebsite(false);
                }}
                disabled={isSavingWebsite}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50 self-start sm:self-auto shrink-0"
                title="Simpan pengaturan website dan branding ke database Supabase Cloud"
              >
                <Save className={`w-4 h-4 ${isSavingWebsite ? 'animate-spin' : ''}`} />
                <span>{isSavingWebsite ? 'Menyimpan...' : 'Simpan Pengaturan ke Supabase'}</span>
              </button>
            </div>

            {/* Quick Access to Social Proof Fake & Real Order Notifications */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Notifikasi Fake & Real Order (Social Proof)</span>
                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                      websiteSettings.socialProofPopup?.enabled ?? true
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {websiteSettings.socialProofPopup?.enabled ?? true ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Popup kecil di pojok kiri bawah yang memunculkan pendaftar kursus riil & simulasi fake order.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu('social_proof')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Kelola Notifikasi Order</span>
                <span>→</span>
              </button>
            </div>

            {/* LOGO & PWA ICON MANAGER CARD */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                      Logo Aplikasi & Ikon Aplikasi Ponsel (PWA)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ganti logo utama LMS yang otomatis disamakan sebagai ikon aplikasi pada layar ponsel (PWA Homescreen Icon).
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  Sinkron Otomatis PWA
                </span>
              </div>

              {/* Logo Upload & Input Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      URL Gambar Logo / Ikon Aplikasi
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={websiteSettings.logoImageUrl || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const updated = {
                            ...websiteSettings,
                            logoImageUrl: val,
                            appIconUrl: val
                          };
                          updateWebsiteSettings({
                            logoImageUrl: val,
                            appIconUrl: val
                          });
                        }}
                        placeholder="https://domain.com/logo.png atau upload file di samping"
                        className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                      <label className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-blue-500/20 shrink-0">
                        <Upload className="w-4 h-4" />
                        <span>Unggah Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            showToast('⏳ Memproses & mengunggah logo ke Supabase Storage...');
                            try {
                              const uploadRes = await uploadFileToSupabaseStorage(file, 'thumbnails', supabaseConfig);
                              let finalUrl = uploadRes.success && uploadRes.publicUrl ? uploadRes.publicUrl : '';
                              if (!finalUrl) {
                                finalUrl = await readFileAsDataUrl(file);
                              }
                              const updated = {
                                ...websiteSettings,
                                logoImageUrl: finalUrl,
                                appIconUrl: finalUrl
                              };
                              updateWebsiteSettings({
                                logoImageUrl: finalUrl,
                                appIconUrl: finalUrl
                              });
                              await saveWebsiteSettingsToSupabase(updated);
                              showToast('✅ Logo aplikasi berhasil diunggah & tersimpan permanen di Supabase Cloud!');
                            } catch (err: any) {
                              const dataUrl = await readFileAsDataUrl(file);
                              const updated = {
                                ...websiteSettings,
                                logoImageUrl: dataUrl,
                                appIconUrl: dataUrl
                              };
                              updateWebsiteSettings({
                                logoImageUrl: dataUrl,
                                appIconUrl: dataUrl
                              });
                              await saveWebsiteSettingsToSupabase(updated);
                              showToast('✅ Logo berhasil diubah!');
                            }
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          await saveWebsiteSettingsToSupabase();
                          showToast('✅ Logo & Pengaturan Website berhasil disinkronkan ke Supabase Cloud!');
                        }}
                        className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 shrink-0"
                        title="Simpan perubahan logo ke Supabase Database Cloud sekarang"
                      >
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">Simpan Cloud</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Format disarankan: PNG, JPG, SVG, atau WebP (aspek rasio persegi 1:1 untuk hasil terbaik di HP).
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Teks Nama Logo (Brand Text)
                    </label>
                    <input
                      type="text"
                      value={websiteSettings.logoText || 'LESIN AJA'}
                      onChange={e => updateWebsiteSettings({ logoText: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>

                  {/* Quick Preset Logos */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Pilihan Logo Preset Populer (Klik untuk Menerapkan):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const url = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=256&auto=format&fit=crop&q=80';
                          const updated = { ...websiteSettings, logoImageUrl: url, appIconUrl: url };
                          updateWebsiteSettings({ logoImageUrl: url, appIconUrl: url });
                          await saveWebsiteSettingsToSupabase(updated);
                          showToast('Logo Pendidikan Digital diterapkan & tersimpan di Supabase!');
                        }}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 flex items-center gap-2 text-left text-xs transition group"
                      >
                        <img
                          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=64&auto=format&fit=crop&q=80"
                          alt="Edu"
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <span className="font-medium text-[11px] truncate">Edu Tech</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const url = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=256&auto=format&fit=crop&q=80';
                          const updated = { ...websiteSettings, logoImageUrl: url, appIconUrl: url };
                          updateWebsiteSettings({ logoImageUrl: url, appIconUrl: url });
                          await saveWebsiteSettingsToSupabase(updated);
                          showToast('Logo Academy diterapkan & tersimpan di Supabase!');
                        }}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 flex items-center gap-2 text-left text-xs transition group"
                      >
                        <img
                          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=64&auto=format&fit=crop&q=80"
                          alt="Academy"
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <span className="font-medium text-[11px] truncate">Academy</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const url = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=256&auto=format&fit=crop&q=80';
                          const updated = { ...websiteSettings, logoImageUrl: url, appIconUrl: url };
                          updateWebsiteSettings({ logoImageUrl: url, appIconUrl: url });
                          await saveWebsiteSettingsToSupabase(updated);
                          showToast('Logo Smart Learning diterapkan & tersimpan di Supabase!');
                        }}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 flex items-center gap-2 text-left text-xs transition group"
                      >
                        <img
                          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=64&auto=format&fit=crop&q=80"
                          alt="Class"
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <span className="font-medium text-[11px] truncate">Smart Learn</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const updated = { ...websiteSettings, logoImageUrl: '', appIconUrl: '' };
                          updateWebsiteSettings({ logoImageUrl: '', appIconUrl: '' });
                          await saveWebsiteSettingsToSupabase(updated);
                          showToast('Reset ke Logo Default (Graduation Emblem)');
                        }}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-500 flex items-center gap-2 text-left text-xs transition text-slate-500"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-[11px]">Reset Default</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* LIVE PREVIEW: SMARTPHONE HOMESCREEN & NAVBAR */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    Pratinjau Ikon di Layar Handphone (PWA)
                  </h4>

                  {/* Realistic Mobile Icon Frame */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700 text-center flex flex-col items-center justify-center space-y-3 shadow-inner">
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 p-1.5 shadow-2xl border border-white/20 flex items-center justify-center overflow-hidden ring-4 ring-blue-500/30">
                        {websiteSettings.logoImageUrl || websiteSettings.appIconUrl ? (
                          <img
                            src={websiteSettings.logoImageUrl || websiteSettings.appIconUrl}
                            alt="Preview"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            className="w-full h-full object-contain rounded-xl"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                            <GraduationCap className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-900">
                        ✓
                      </span>
                    </div>

                    <div>
                      <p className="font-bold text-xs text-white">
                        {websiteSettings.siteName || 'LESIN AJA'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Ikon Aplikasi di Layar Utama HP
                      </p>
                    </div>

                    <div className="w-full pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-medium flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Otomatis Tersinkron ke PWA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* General Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                Informasi Kontak & Footer Platform
              </h3>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Platform LMS
                </label>
                <input
                  type="text"
                  value={websiteSettings.siteName}
                  onChange={e => updateWebsiteSettings({ siteName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline Website
                </label>
                <input
                  type="text"
                  value={websiteSettings.siteTagline}
                  onChange={e => updateWebsiteSettings({ siteTagline: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Kontak Support
                  </label>
                  <input
                    type="email"
                    value={websiteSettings.contactEmail}
                    onChange={e => updateWebsiteSettings({ contactEmail: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No WhatsApp Bantuan
                  </label>
                  <input
                    type="text"
                    value={websiteSettings.contactPhone}
                    onChange={e => updateWebsiteSettings({ contactPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Kantor & Lembaga
                </label>
                <input
                  type="text"
                  value={websiteSettings.contactAddress}
                  onChange={e => updateWebsiteSettings({ contactAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teks Hak Cipta Footer
                </label>
                <input
                  type="text"
                  value={websiteSettings.footerCopyright}
                  onChange={e => updateWebsiteSettings({ footerCopyright: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    setIsSavingWebsite(true);
                    await saveWebsiteSettingsToSupabase(websiteSettings);
                    setIsSavingWebsite(false);
                  }}
                  disabled={isSavingWebsite}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${isSavingWebsite ? 'animate-spin' : ''}`} />
                  <span>{isSavingWebsite ? 'Menyimpan...' : 'Simpan Semua Pengaturan Website'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CERTIFICATE DESIGNER STUDIO TAB */}
        {activeMenu === 'certificate_designer' && (
          <CertificateDesignerView />
        )}

        {/* FACEBOOK PIXEL & META ADS TAB */}
        {activeMenu === 'facebook_pixel' && (
          <FacebookPixelSettingsView />
        )}

        {/* DATABASE & GOOGLE SHEETS TAB */}
        {activeMenu === 'database_sync' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                Integrasi Database Cloud: Supabase (PostgreSQL) & Google Sheets
              </h2>
              <p className="text-xs text-slate-500">
                Pilih atau gabungkan penyimpanan cloud PostgreSQL Supabase dan sinkronisasi spreadsheet otomatis Google Sheets.
              </p>
            </div>

            {/* Supabase Connection Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                      Konfigurasi Supabase Cloud (PostgreSQL)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Hubungkan database cloud Supabase untuk persistensi kursus, kategori, akun siswa, dan transaksi secara real-time.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {supabaseConfig.isConnected ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Terhubung & Aktif</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                      Belum Terhubung
                    </span>
                  )}
                </div>
              </div>

              {/* Vercel & Environment Variables / Secrets Integration Banner */}
              <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
                    <Key className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Environment Variables Vercel: <code>VITE_SUPABASE_URL</code> &amp; <code>VITE_SUPABASE_ANON_KEY</code></span>
                  </div>
                  <button
                    type="button"
                    disabled={isLoadingSecrets}
                    onClick={async () => {
                      setIsLoadingSecrets(true);
                      await loadSupabaseFromSecrets();
                      setIsLoadingSecrets(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSecrets ? 'animate-spin' : ''}`} />
                    <span>{isLoadingSecrets ? 'Memeriksa Env...' : 'Muat Ulang dari Env / Secrets'}</span>
                  </button>
                </div>
                <p className="text-blue-800 dark:text-blue-400 text-[11px] leading-relaxed">
                  Aplikasi ini <strong>100% siap dideploy ke Vercel</strong>! Untuk mengisi konfigurasi Supabase secara otomatis saat dideploy ke Vercel, buka <em>Vercel Project Dashboard &rarr; Settings &rarr; Environment Variables</em>, lalu tambahkan:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Key 1:</span>
                      <strong className="text-blue-600 dark:text-blue-400">VITE_SUPABASE_URL</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('VITE_SUPABASE_URL', 'vite_url')}
                      className="p-1 text-slate-500 hover:text-blue-600"
                      title="Salin Key"
                    >
                      {copiedKey === 'vite_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Key 2:</span>
                      <strong className="text-blue-600 dark:text-blue-400">VITE_SUPABASE_ANON_KEY</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('VITE_SUPABASE_ANON_KEY', 'vite_key')}
                      className="p-1 text-slate-500 hover:text-blue-600"
                      title="Salin Key"
                    >
                      {copiedKey === 'vite_key' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {(supabaseConfig.isFromEnv || supabaseConfig.isFromSecrets) && (
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] pt-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Kredensial aktif saat ini dimuat otomatis dari Environment Variables (Vercel / Vite / Secrets).</span>
                  </div>
                )}
              </div>

              {/* Diagnostic Box: Kenapa Kursus Baru Belum Masuk Supabase */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Kenapa Kursus yang Dibuat di Website Belum Masuk ke Supabase?</span>
                </div>
                <p className="text-amber-800 dark:text-amber-400 text-[11px] leading-relaxed">
                  Ada 3 syarat utama agar kursus baru langsung masuk ke database Supabase:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900/80 dark:text-amber-300/80 pl-1 font-medium">
                  <li><strong>Kredensial Aktif:</strong> Isi <em>Project URL (SUPABASE_URL)</em> dan <em>Anon Public Key (SUPABASE_ANON_KEY)</em> di bawah ini lalu klik tombol <strong>"Uji Koneksi &amp; Status Tabel"</strong>.</li>
                  <li><strong>Tabel Dibuat:</strong> Tabel <code>courses</code> dan <code>categories</code> harus sudah dibuat melalui SQL Editor Supabase.</li>
                  <li><strong>Row Level Security (RLS) Diizinkan:</strong> Skrip SQL kami di bawah sudah menyertakan policy <code>FOR ALL USING (true) WITH CHECK (true)</code> sehingga website diizinkan memasukkan kursus secara publik/anon tanpa ditolak oleh database.</li>
                </ol>
              </div>

              <div className="space-y-4 text-xs pt-1">
                {/* Kolom 1: SUPABASE_URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Supabase Project URL (<code>SUPABASE_URL</code>) *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Env: SUPABASE_URL</span>
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      value={supabaseConfig.projectUrl || supabaseConfig.url || ''}
                      onChange={e => updateSupabaseConfig({ projectUrl: e.target.value, url: e.target.value })}
                      placeholder="https://xyzcompanyid.supabase.co"
                      className="w-full p-2.5 pl-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dapatkan di Supabase Dashboard: <em>Project Settings → API → Project URL</em> (atau diisi di Secrets AI Studio sebagai <code>SUPABASE_URL</code>).
                  </p>
                </div>

                {/* Kolom 2: SUPABASE_ANON_KEY */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Supabase Anon Public API Key (<code>SUPABASE_ANON_KEY</code>) *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Env: SUPABASE_ANON_KEY</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showAnonKey ? 'text' : 'password'}
                      value={supabaseConfig.anonKey || ''}
                      onChange={e => updateSupabaseConfig({ anonKey: e.target.value })}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full p-2.5 pl-3 pr-10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnonKey(prev => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      title={showAnonKey ? 'Sembunyikan Key' : 'Tampilkan Key'}
                    >
                      {showAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dapatkan di Supabase Dashboard: <em>Project Settings → API → Project API Keys (anon public)</em> (atau diisi di Secrets AI Studio sebagai <code>SUPABASE_ANON_KEY</code>).
                  </p>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isTestingSupabase}
                    onClick={async () => {
                      setIsTestingSupabase(true);
                      const res = await testSupabase();
                      // Extract or fetch diagnostic tables
                      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
                      const key = (supabaseConfig.anonKey || '').trim();
                      if (url && key) {
                        try {
                          const detailed = await testSupabaseConnection(url, key);
                          setTestDiagnosticResult({
                            success: detailed.success,
                            message: detailed.message,
                            testedAt: new Date().toLocaleTimeString('id-ID'),
                            tablesStatus: detailed.tablesStatus
                          });
                        } catch {
                          setTestDiagnosticResult({
                            success: res.success,
                            message: res.message,
                            testedAt: new Date().toLocaleTimeString('id-ID')
                          });
                        }
                      } else {
                        setTestDiagnosticResult({
                          success: false,
                          message: 'Project URL dan Anon Key belum diisi.',
                          testedAt: new Date().toLocaleTimeString('id-ID')
                        });
                      }
                      setIsTestingSupabase(false);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    <CheckCircle className={`w-4 h-4 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                    <span>{isTestingSupabase ? 'Sedang Menguji Koneksi...' : 'Uji Koneksi & Status Tabel'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSyncingPush}
                    onClick={async () => {
                      setIsSyncingPush(true);
                      await syncToSupabase();
                      setIsSyncingPush(false);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-md shadow-blue-600/20 disabled:opacity-50"
                  >
                    <ArrowUpToLine className={`w-4 h-4 ${isSyncingPush ? 'animate-spin' : ''}`} />
                    <span>{isSyncingPush ? 'Mengirim Data...' : `Kirim Semua ke Supabase (${courses.length} Kursus, ${categories.length} Kategori)`}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSyncingPull}
                    onClick={async () => {
                      setIsSyncingPull(true);
                      await syncFromSupabase();
                      setIsSyncingPull(false);
                    }}
                    className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <ArrowDownToLine className={`w-4 h-4 ${isSyncingPull ? 'animate-spin' : ''}`} />
                    <span>{isSyncingPull ? 'Memuat Data...' : 'Tarik Data dari Supabase (Pull)'}</span>
                  </button>
                </div>

                {/* DIAGNOSTIC RESULTS REPORT CARD */}
                {testDiagnosticResult && (
                  <div className={`p-4 rounded-xl border transition-all ${
                    testDiagnosticResult.success
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60'
                      : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60'
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        {testDiagnosticResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                        <div>
                          <h4 className={`font-bold text-xs ${
                            testDiagnosticResult.success ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'
                          }`}>
                            {testDiagnosticResult.success ? 'Hasil Diagnostik: Database Siap Digunakan' : 'Hasil Diagnostik: Perlu Tindakan'}
                          </h4>
                          <p className={`text-[11px] mt-0.5 leading-relaxed ${
                            testDiagnosticResult.success ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-800 dark:text-rose-400'
                          }`}>
                            {testDiagnosticResult.message}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {testDiagnosticResult.testedAt}
                      </span>
                    </div>

                    {testDiagnosticResult.tablesStatus && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(testDiagnosticResult.tablesStatus).map(([tbl, info]: [string, any]) => (
                          <div
                            key={tbl}
                            className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                              info?.exists && info?.rlsOk
                                ? 'bg-white/80 dark:bg-slate-900/80 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                                : 'bg-white/80 dark:bg-slate-900/80 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            <span className="font-mono font-bold">{tbl}</span>
                            <span className="flex items-center gap-1 font-semibold text-[10px]">
                              {info?.exists && info?.rlsOk ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>OK</span>
                                </>
                              ) : !info?.exists ? (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Belum Ada</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>RLS Blokir</span>
                                </>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {supabaseConfig.lastSyncedAt && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    🕒 Terakhir disinkronkan: {new Date(supabaseConfig.lastSyncedAt).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>

            {/* Supabase Step-by-Step Guide & Auth Setup */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" />
                  <span>Panduan Integrasi Supabase &amp; Email Authentication</span>
                </h3>
              </div>

              {/* Supabase Email Confirmation Highlight */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                      Sistem Autentikasi &amp; Konfirmasi Email Supabase Aktif
                    </h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
                      Siswa yang mendaftar akan menerima email aktivasi resmi otomatis dari Supabase Auth dengan tombol verifikasi untuk mengaktifkan akun.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                    <span>Buat Project di Supabase</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Buka <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">supabase.com</a>, buat akun gratis dan klik <strong>New Project</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                    <span>Jalankan SQL Schema di SQL Editor</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Klik menu <strong>SQL Editor</strong> di Supabase, lalu salin dan jalankan skrip SQL di bawah untuk membuat tabel <code>categories</code>, <code>courses</code>, <code>users</code>, <code>transactions</code>, dan trigger sinkronisasi otomatis dari <code>auth.users</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                    <span>Aktifkan Email Confirmations &amp; Site URL</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Di Supabase, buka <strong>Authentication &gt; Providers &gt; Email</strong> dan aktifkan <em>"Confirm email"</em>. Lalu buka <strong>URL Configuration</strong> dan masukkan URL website LESIN AJA Anda.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">4</span>
                    <span>Real-time Sync &amp; Auto Login</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Ketika calon siswa mengklik tombol di email konfirmasi, mereka otomatis masuk ke platform LESIN AJA secara instan dan data tersinkron ke cloud.
                  </p>
                </div>
              </div>
            </div>

            {/* QUICK FIX: Solusi Error 404 saat Klik Konfirmasi Email (URL Configuration Supabase) */}
            <div className="bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl p-6 border border-blue-500/30 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Quick Fix: Atasi Error 404 di aistudio.google.com saat Klik Email Konfirmasi</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        Wajib Diatur di Supabase
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Jika saat siswa mengklik link email masuk ke <code>aistudio.google.com/404</code>, itu karena <strong>Site URL</strong> di Supabase diisi dengan alamat Google AI Studio (editor) alih-alih alamat web aplikasi Anda.
                    </p>
                  </div>
                </div>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-sm"
                >
                  <span>Buka Supabase URL Config</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        1. Salin ke Kolom <strong>Site URL</strong> di Supabase:
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(getSafeAppOrigin(), 'admin_site_url')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        {copiedKey === 'admin_site_url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'admin_site_url' ? 'Tersalin' : 'Salin Site URL'}</span>
                      </button>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-blue-600 dark:text-blue-400 break-all select-all font-bold">
                      {getSafeAppOrigin()}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        2. Salin ke Kolom <strong>Redirect URLs</strong> di Supabase:
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${getSafeAppOrigin()}/**`, 'admin_redirect_url')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        {copiedKey === 'admin_redirect_url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'admin_redirect_url' ? 'Tersalin' : 'Salin Wildcard'}</span>
                      </button>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 break-all select-all font-bold">
                      {getSafeAppOrigin()}/**
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <strong>Cara Ubah di Supabase:</strong> Masuk ke <strong>Authentication &gt; URL Configuration</strong>, tempel <em>Site URL</em> di atas, tambahkan <em>Redirect URLs</em> dengan wildcard <code>/**</code>, lalu klik <strong>Save</strong>. Setelah itu klik email konfirmasi akan langsung membuka website LESIN AJA dan siswa otomatis masuk.
                </div>
              </div>
            </div>

            {/* FITUR BARU: Tabel instructor_applications & Kolom Verifikasi Kursus */}
            <div className="bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl p-6 border border-amber-500/40 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Skema SQL: Pendaftaran &amp; Verifikasi Instruktur (Ijazah/Sertifikat)</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                        Fitur Baru
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Jalankan skrip ini di <strong>Supabase SQL Editor</strong> untuk membuat tabel <code>instructor_applications</code> dan kolom verifikasi kursus <code>verification_status</code>, <code>rejection_reason</code>, <code>instructor_id</code>:
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="copy-sql-instructor-verification-btn"
                  onClick={() => copyToClipboard(SUPABASE_SQL_SCHEMA_INSTRUCTOR_VERIFICATION, 'supabase_instructor_verification_sql')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-sm"
                >
                  {copiedKey === 'supabase_instructor_verification_sql' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>Salin Query Verifikasi Instruktur</span>
                </button>
              </div>

              <pre className="p-3.5 bg-slate-950 text-amber-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 border border-slate-800">
                {SUPABASE_SQL_SCHEMA_INSTRUCTOR_VERIFICATION}
              </pre>
            </div>

            {/* QUICK FIX: Perbaikan Trigger Pendaftaran Pengguna / "Database error saving new user" */}
            <div className="bg-rose-500/5 dark:bg-rose-500/10 rounded-2xl p-6 border border-rose-500/30 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Quick Fix: Atasi "Database error saving new user" (Trigger Registrasi Siswa)</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                        Penting
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Jika saat siswa mendaftar muncul pesan <em>"Database error saving new user"</em>, jalankan query di bawah ini di <strong>Supabase SQL Editor</strong> untuk memperbaiki trigger sinkronisasi:
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="copy-sql-fix-auth-trigger-btn"
                  onClick={() => copyToClipboard(SUPABASE_SQL_SCHEMA_FIX_AUTH_USER_TRIGGER, 'supabase_auth_fix_sql')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-sm"
                >
                  {copiedKey === 'supabase_auth_fix_sql' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>Salin Query Perbaikan Pendaftaran</span>
                </button>
              </div>

              <pre className="p-3.5 bg-slate-950 text-rose-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                {SUPABASE_SQL_SCHEMA_FIX_AUTH_USER_TRIGGER}
              </pre>
            </div>

            {/* QUICK FIX: Kolom 'instructor' & Schema Reload */}
            <div className="bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl p-6 border border-amber-500/30 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Quick Fix: Tambahkan Kolom 'instructor' & Reload Schema Cache</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                        1-Click SQL
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Jika muncul error <em>"Could not find the 'instructor' column in schema cache"</em>, jalankan query singkat ini di Supabase SQL Editor:
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(SUPABASE_SQL_SCHEMA_FIX_COURSES, 'supabase_fix_sql')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-sm"
                >
                  {copiedKey === 'supabase_fix_sql' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>Salin Query Perbaikan</span>
                </button>
              </div>

              <pre className="p-3.5 bg-slate-950 text-amber-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                {SUPABASE_SQL_SCHEMA_FIX_COURSES}
              </pre>
            </div>

            {/* QUICK FIX: Tabel 'settings', 'live_sessions' & 'custom_pages' */}
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/30 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Quick Fix: Buat Tabel 'settings', 'live_sessions' &amp; 'custom_pages'</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        Solusi Catatan Supabase
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Jika muncul catatan <em>"Could not find the table 'public.settings' in the schema cache"</em>, jalankan query singkat ini di Supabase SQL Editor:
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(SUPABASE_SQL_SCHEMA_SETTINGS_ONLY, 'supabase_settings_sql')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-sm"
                >
                  {copiedKey === 'supabase_settings_sql' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>Salin Query Tabel Settings</span>
                </button>
              </div>

              <pre className="p-3.5 bg-slate-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                {SUPABASE_SQL_SCHEMA_SETTINGS_ONLY}
              </pre>
            </div>

            {/* STORAGE BUCKET SETUP: 'lesin-media' (Upload Video, Banner & Avatar) */}
            <div className="bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl p-6 border border-blue-500/30 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Setup Supabase Storage Bucket: 'lesin-media'</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        Video, Banner & Foto Profil
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Jalankan query ini di SQL Editor Supabase untuk membuat bucket penyimpanan media publik (Video Modul, Banner Thumbnail, Foto Profil & Lampiran).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(SUPABASE_SQL_STORAGE_SETUP, 'supabase_storage_sql')}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-sm"
                >
                  {copiedKey === 'supabase_storage_sql' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>Salin Skrip Storage Bucket</span>
                </button>
              </div>

              <pre className="p-3.5 bg-slate-950 text-blue-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                {SUPABASE_SQL_STORAGE_SETUP}
              </pre>
            </div>

            {/* Supabase Schema Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Skema SQL Lengkap Supabase (DDL + Kategori + RLS Policies)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(SUPABASE_SQL_SCHEMA_FULL, 'supabase_sql')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition"
                >
                  {copiedKey === 'supabase_sql' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>Salin Skrip SQL Lengkap</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Salin dan jalankan skrip SQL ini di <strong>SQL Editor</strong> Supabase Anda. Skrip ini sudah mencakup tabel <code>categories</code>, <code>courses</code>, <code>users</code>, <code>transactions</code>, <code>student_progress</code>, <code>certificates</code>, beserta seluruh <strong>Policy RLS</strong> agar operasi tulis/baca dari website berjalan mulus.
              </p>

              <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800">
                {SUPABASE_SQL_SCHEMA_FULL}
              </pre>
            </div>

            {/* Google Sheets Sync Box */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sheet className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Google Sheets Auto-Sync (CRUD Tanpa Server)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(GOOGLE_APPS_SCRIPT_TEMPLATE, 'gas_script')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-medium text-xs flex items-center gap-1 hover:bg-emerald-100"
                >
                  {copiedKey === 'gas_script' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>Salin Google Apps Script</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Skrip Google Apps Script ini secara otomatis meng-create tab <code>USERS</code>, <code>COURSES</code>, <code>TRANSACTIONS</code>, dan <code>PROGRESS</code> pada spreadsheet Anda serta melayani webhook POST/GET.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Google Apps Script Web App URL (Endpoint API)
                  </label>
                  <input
                    type="url"
                    value={sheetsConfig.webAppUrl}
                    onChange={e => updateSheetsConfig({ webAppUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border font-mono text-[11px]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => syncToGoogleSheets()}
                  className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Sinkronkan Seluruh Data ke Google Sheets Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CourseEditorModal
        key={selectedCourseForEdit ? selectedCourseForEdit.id : 'new-course-modal'}
        isOpen={isCourseModalOpen}
        course={selectedCourseForEdit}
        onClose={() => setIsCourseModalOpen(false)}
      />

      {/* Live Session Create Modal */}
      {isLiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Jadwalkan Sesi Live Baru
            </h3>
            <form onSubmit={handleCreateLiveSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Judul Sesi Live *</label>
                <input
                  type="text"
                  required
                  value={newLiveTitle}
                  onChange={e => setNewLiveTitle(e.target.value)}
                  placeholder="Contoh: Bedah Kode React & Deploy Cloud"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Pilih Kursus Terkait</label>
                <select
                  value={newLiveCourseId}
                  onChange={e => setNewLiveCourseId(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Tanggal (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={newLiveDate}
                    onChange={e => setNewLiveDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Waktu (WIB)</label>
                  <input
                    type="text"
                    value={newLiveTime}
                    onChange={e => setNewLiveTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Platform</label>
                <select
                  value={newLivePlatform}
                  onChange={e => setNewLivePlatform(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom Meeting</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Link Room Pertemuan</label>
                <input
                  type="url"
                  value={newLiveUrl}
                  onChange={e => setNewLiveUrl(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLiveModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl"
                >
                  Jadwalkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Stats & Students Roster Modal */}
      <CourseStatsAndStudentsModal
        isOpen={isStatsModalOpen}
        course={selectedCourseForStats}
        onClose={() => {
          setIsStatsModalOpen(false);
          setSelectedCourseForStats(null);
        }}
      />
    </div>
  );
};
