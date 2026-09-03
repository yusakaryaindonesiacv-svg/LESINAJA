import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SpecializationCertificate } from '../../types';
import {
  X,
  GraduationCap,
  Mail,
  User as UserIcon,
  Phone,
  Building,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  RefreshCw,
  Send,
  ExternalLink,
  Info,
  Upload,
  Award,
  FileText,
  CreditCard,
  Check,
  Image as ImageIcon,
  Plus,
  Tag,
  PenTool
} from 'lucide-react';
import {
  signUpWithSupabaseEmail,
  signInWithSupabaseEmail,
  resendSupabaseConfirmation,
  sendSupabasePasswordReset,
  uploadFileToSupabaseStorage
} from '../../utils/supabaseClient';
import { readFileAsDataUrl } from '../../utils/fileHelpers';
import { SupabaseTutorialModal } from './SupabaseTutorialModal';

export const SPECIALIZATION_OPTIONS = [
  'Kimia Industri & Rekayasa Proses',
  'Web Developer & Full-Stack Engineering',
  'Konten Kreator, Video Editing & YouTube',
  'Data Science, Machine Learning & AI',
  'Desain Grafis, UI/UX & 3D Modeling',
  'Digital Marketing, SEO & Copywriting',
  'Akuntansi, Pajak & Analisis Keuangan',
  'Bisnis, Manajemen & Kewirausahaan',
  'Bahasa Asing (Inggris, Mandarin, Jepang, Korea, Arab, Jerman)',
  'Pertanian Modern, Hidroponik & Agribisnis',
  'Teknik Mesin, Otomotif & Mekatronika',
  'Teknik Elektro, PLC, IoT & Robotika',
  'Farmasi, Kedokteran & Ilmu Kesehatan',
  'Kuliner, Tata Boga & Bakery Pastry',
  'Fotografi & Sinematografi Profesional',
  'Musik, Audio Production & Sound Engineering',
  'Hukum Bisnis, Kontrak & Legalitas Usaha',
  'Pendidikan, Keguruan & Kurikulum Pembelajaran',
  'Pengembangan Diri, Leadership & Public Speaking',
  'Sains, Fisika & Matematika Terapan',
  'Kebugaran, Olahraga & Ilmu Nutrisi',
  'Lainnya (Ketik Manual)'
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'register_instructor';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { login, registerStudent, applyAsInstructor, users, supabaseConfig, showToast } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'register_instructor' | 'forgot' | 'confirmation_sent'>(initialMode);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Student form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regInstitution, setRegInstitution] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Register Instructor form state
  const [instName, setInstName] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [instPhone, setInstPhone] = useState('');
  const [instInstitution, setInstInstitution] = useState('');
  const [instTitle, setInstTitle] = useState('');
  const [instSpecializations, setInstSpecializations] = useState<string[]>([]);
  const [selectedDropdownSpec, setSelectedDropdownSpec] = useState('');
  const [customSpecInput, setCustomSpecInput] = useState('');
  const [isCustomSpecMode, setIsCustomSpecMode] = useState(false);
  const [instBio, setInstBio] = useState('');
  const [instPassword, setInstPassword] = useState('');
  const [showInstPassword, setShowInstPassword] = useState(false);
  const [instCertificateUrl, setInstCertificateUrl] = useState('');
  const [instCertificateName, setInstCertificateName] = useState('');
  const [instCertificatesBySpec, setInstCertificatesBySpec] = useState<Record<string, { url: string; name: string; isUploading?: boolean }>>({});
  const [instIdCardUrl, setInstIdCardUrl] = useState('');
  const [instIdCardName, setInstIdCardName] = useState('');
  const [instSignatureUrl, setInstSignatureUrl] = useState('');
  const [instSignatureName, setInstSignatureName] = useState('');
  const [instBankName, setInstBankName] = useState('BCA');
  const [instAccountNumber, setInstAccountNumber] = useState('');
  const [instAccountHolder, setInstAccountHolder] = useState('');
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [isUploadingIdCard, setIsUploadingIdCard] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const certInputRef = useRef<HTMLInputElement>(null);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');

  // Confirmation screen state
  const [lastRegisteredEmail, setLastRegisteredEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setSelectedDropdownSpec('');
      setCustomSpecInput('');
      setIsCustomSpecMode(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Handle Certificate Upload per specialization
  const handleSpecCertificateUpload = async (spec: string, file: File) => {
    if (!file) return;

    setInstCertificatesBySpec(prev => ({
      ...prev,
      [spec]: { url: prev[spec]?.url || '', name: file.name, isUploading: true }
    }));

    try {
      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();

      if (url && key) {
        const uploadRes = await uploadFileToSupabaseStorage(file, 'certificates', { ...supabaseConfig, projectUrl: url, anonKey: key });
        if (uploadRes.success && uploadRes.publicUrl) {
          setInstCertificatesBySpec(prev => ({
            ...prev,
            [spec]: { url: uploadRes.publicUrl!, name: file.name, isUploading: false }
          }));
          showToast(`✅ Berkas sertifikat untuk "${spec}" berhasil diunggah!`);
          return;
        }
      }

      // Fallback: Read as base64 data URL
      const dataUrl = await readFileAsDataUrl(file);
      setInstCertificatesBySpec(prev => ({
        ...prev,
        [spec]: { url: dataUrl, name: file.name, isUploading: false }
      }));
      showToast(`✅ Berkas sertifikat untuk "${spec}" berhasil dimuat!`);
    } catch (err: any) {
      showToast(`⚠️ Gagal membaca berkas untuk "${spec}": ` + err.message);
      setInstCertificatesBySpec(prev => ({
        ...prev,
        [spec]: { url: prev[spec]?.url || '', name: prev[spec]?.name || '', isUploading: false }
      }));
    }
  };

  const handleSpecCertificateUrlChange = (spec: string, rawUrl: string) => {
    setInstCertificatesBySpec(prev => ({
      ...prev,
      [spec]: {
        url: rawUrl,
        name: rawUrl ? (prev[spec]?.name && prev[spec]?.name !== '' ? prev[spec].name : `Link Dokumen ${spec}`) : '',
        isUploading: false
      }
    }));
  };

  const handleClearSpecCertificate = (spec: string) => {
    setInstCertificatesBySpec(prev => ({
      ...prev,
      [spec]: { url: '', name: '', isUploading: false }
    }));
  };

  // Handle Certificate Upload (Legacy fallback)
  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCert(true);
    try {
      setInstCertificateName(file.name);
      // If Supabase Storage is configured, upload to storage bucket
      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();

      if (url && key) {
        const uploadRes = await uploadFileToSupabaseStorage(file, 'certificates', { ...supabaseConfig, projectUrl: url, anonKey: key });
        if (uploadRes.success && uploadRes.publicUrl) {
          setInstCertificateUrl(uploadRes.publicUrl);
          showToast('✅ Dokumen sertifikat/ijazah berhasil diunggah ke Supabase Cloud!');
          setIsUploadingCert(false);
          return;
        }
      }

      // Fallback: Read as base64 data URL
      const dataUrl = await readFileAsDataUrl(file);
      setInstCertificateUrl(dataUrl);
      showToast('✅ Dokumen sertifikat/ijazah berhasil dimuat!');
    } catch (err: any) {
      showToast('⚠️ Gagal membaca berkas: ' + err.message);
    } finally {
      setIsUploadingCert(false);
    }
  };

  // Handle ID Card (KTP) Upload
  const handleIdCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingIdCard(true);
    try {
      setInstIdCardName(file.name);
      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();

      if (url && key) {
        const uploadRes = await uploadFileToSupabaseStorage(file, 'id_cards', { ...supabaseConfig, projectUrl: url, anonKey: key });
        if (uploadRes.success && uploadRes.publicUrl) {
          setInstIdCardUrl(uploadRes.publicUrl);
          showToast('✅ Dokumen KTP berhasil diunggah ke Supabase Cloud!');
          setIsUploadingIdCard(false);
          return;
        }
      }

      const dataUrl = await readFileAsDataUrl(file);
      setInstIdCardUrl(dataUrl);
      showToast('✅ Dokumen KTP berhasil dimuat!');
    } catch (err: any) {
      showToast('⚠️ Gagal membaca berkas KTP: ' + err.message);
    } finally {
      setIsUploadingIdCard(false);
    }
  };

  // Handle Signature Upload
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('File tanda tangan harus berupa gambar (PNG/JPG transparan direkomendasikan).');
      return;
    }

    setIsUploadingSignature(true);
    try {
      setInstSignatureName(file.name);
      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();

      if (url && key) {
        const uploadRes = await uploadFileToSupabaseStorage(file, 'media', { ...supabaseConfig, projectUrl: url, anonKey: key });
        if (uploadRes.success && uploadRes.publicUrl) {
          setInstSignatureUrl(uploadRes.publicUrl);
          showToast('✅ Tanda tangan digital berhasil diunggah ke Supabase Cloud!');
          setIsUploadingSignature(false);
          return;
        }
      }

      const dataUrl = await readFileAsDataUrl(file);
      setInstSignatureUrl(dataUrl);
      showToast('✅ Tanda tangan digital berhasil dimuat!');
    } catch (err: any) {
      showToast('⚠️ Gagal membaca berkas tanda tangan: ' + err.message);
    } finally {
      setIsUploadingSignature(false);
    }
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = loginEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setErrorMessage('Silakan masukkan alamat email Anda.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. If Supabase is connected and password provided, try Supabase Auth first
      if (supabaseConfig.projectUrl && supabaseConfig.anonKey && loginPassword) {
        const authRes = await signInWithSupabaseEmail(emailTrimmed, loginPassword, supabaseConfig);
        
        if (!authRes.success) {
          if (authRes.needsEmailConfirmation) {
            setLastRegisteredEmail(emailTrimmed);
            setMode('confirmation_sent');
            setIsLoading(false);
            return;
          }
          setErrorMessage(authRes.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
          setIsLoading(false);
          return;
        }

        // Supabase login success
        showToast('✅ Berhasil masuk ke akun LESIN AJA.');
        setIsLoading(false);
        onClose();
        return;
      }

      // 2. Direct local login fallback (if user exists in local database or password was bypassed)
      const success = login(emailTrimmed);
      if (success) {
        setIsLoading(false);
        onClose();
      } else {
        setErrorMessage('Akun belum terdaftar. Silakan lakukan pendaftaran terlebih dahulu.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat masuk.');
      setIsLoading(false);
    }
  };

  // Handle Registration Student submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const name = regName.trim();
    const email = regEmail.trim().toLowerCase();
    const phone = regPhone.trim();
    const institution = regInstitution.trim();
    const password = regPassword.trim();

    if (!name) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Format email tidak valid.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. If Supabase is configured, use Supabase Auth to send email confirmation
      if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
        const isSuperAdminEmail = email.toLowerCase() === 'lesinaja2@gmail.com';
        const authRes = await signUpWithSupabaseEmail(
          {
            email,
            password,
            name,
            phone,
            institution,
            role: isSuperAdminEmail ? 'admin' : 'student'
          },
          supabaseConfig
        );

        if (!authRes.success) {
          const isDbTriggerError =
            authRes.isDatabaseTriggerError ||
            authRes.error?.toLowerCase().includes('database error') ||
            authRes.message?.toLowerCase().includes('database error');

          if (isDbTriggerError) {
            // Auto-recovery: If Supabase auth trigger failed, register student into platform & Supabase public.users directly
            console.warn('[Registration Recovery] Auth trigger error detected, recovering via direct user profile creation...');
            registerStudent(name, email, phone, institution, true);
            showToast('🎉 Pendaftaran berhasil! Akun Anda langsung aktif dan dapat digunakan.');
            setIsLoading(false);
            onClose();
            return;
          }

          if (authRes.error?.toLowerCase().includes('already registered') || authRes.message?.toLowerCase().includes('already registered')) {
            setErrorMessage('Email ini sudah terdaftar. Silakan pindah ke tab "Masuk" menggunakan email & kata sandi Anda.');
          } else {
            setErrorMessage(authRes.message);
          }
          setIsLoading(false);
          return;
        }

        // If email confirmation is required by Supabase
        if (authRes.needsEmailConfirmation) {
          setLastRegisteredEmail(email);
          setMode('confirmation_sent');
          setIsLoading(false);
          return;
        }

        // If email confirmation is disabled in Supabase, auto-login immediately
        registerStudent(name, email, phone, institution, true);
        showToast('🎉 Pendaftaran berhasil! Akun Anda langsung aktif.');
        setIsLoading(false);
        onClose();
        return;
      }

      // 2. If Supabase is not yet configured, register locally
      registerStudent(name, email, phone, institution, true);
      showToast('🎉 Pendaftaran berhasil!');
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendaftar.');
      setIsLoading(false);
    }
  };

  // Helper to add specialization (max 5)
  const handleAddSpecialization = (specToAdd: string) => {
    const trimmed = specToAdd.trim();
    if (!trimmed) return;
    if (trimmed === 'Lainnya (Ketik Manual)') {
      setIsCustomSpecMode(true);
      return;
    }
    if (instSpecializations.includes(trimmed)) {
      showToast('Bidang keahlian ini sudah ada di dalam pilihan Anda.');
      return;
    }
    if (instSpecializations.length >= 5) {
      showToast('⚠️ Satu akun instruktur dapat memilih maksimal 5 bidang keahlian.');
      return;
    }
    setInstSpecializations(prev => [...prev, trimmed]);
    setSelectedDropdownSpec('');
    setCustomSpecInput('');
    setIsCustomSpecMode(false);
  };

  const handleRemoveSpecialization = (specToRemove: string) => {
    setInstSpecializations(prev => prev.filter(s => s !== specToRemove));
    setInstCertificatesBySpec(prev => {
      const copy = { ...prev };
      delete copy[specToRemove];
      return copy;
    });
  };

  // Handle Instructor Registration submission
  const handleInstructorRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const name = instName.trim();
    const email = instEmail.trim().toLowerCase();
    const phone = instPhone.trim();
    const institution = instInstitution.trim() || 'Umum';
    const title = instTitle.trim() || '';
    const bio = instBio.trim();
    const password = instPassword.trim();

    if (!name) {
      setErrorMessage('Nama lengkap instruktur wajib diisi.');
      return;
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Format email tidak valid.');
      return;
    }
    if (instSpecializations.length === 0) {
      setErrorMessage('Pilih minimal 1 bidang keahlian utama (maksimal 5 bidang keahlian).');
      return;
    }
    if (instSpecializations.length > 5) {
      setErrorMessage('Maksimal 5 bidang keahlian yang dapat dipilih untuk satu akun instruktur.');
      return;
    }

    // Validate that every chosen specialization has a certificate uploaded or specified
    const missingSpecs = instSpecializations.filter(s => !instCertificatesBySpec[s]?.url?.trim() && (!instCertificateUrl.trim() || instSpecializations.length > 1));
    if (missingSpecs.length > 0) {
      setErrorMessage(`Wajib mengunggah berkas Sertifikat Keahlian / Ijazah untuk setiap bidang keahlian yang Anda pilih (${instSpecializations.length} bidang = ${instSpecializations.length} sertifikat). Bidang yang belum memiliki berkas: ${missingSpecs.join(', ')}`);
      return;
    }

    if (!instIdCardUrl.trim()) {
      setErrorMessage('Wajib mengunggah Kartu Identitas (KTP) untuk verifikasi identitas resmi instruktur!');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    const primarySpecialization = instSpecializations.join(', ');

    // Build the certificates array
    const certificatesList: SpecializationCertificate[] = instSpecializations.map(spec => {
      const specData = instCertificatesBySpec[spec];
      return {
        specialization: spec,
        certificateUrl: specData?.url?.trim() || instCertificateUrl.trim() || '',
        certificateName: specData?.name?.trim() || instCertificateName || `Sertifikat ${spec}`
      };
    });

    const primaryCertUrl = certificatesList[0]?.certificateUrl || instCertificateUrl.trim() || '';
    const primaryCertName = certificatesList[0]?.certificateName || instCertificateName || 'Sertifikat/Ijazah Keahlian';

    try {
      // 1. If Supabase is configured, create Supabase auth account
      if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
        await signUpWithSupabaseEmail(
          {
            email,
            password,
            name,
            phone,
            institution,
            role: 'student' // starts as student until admin approves!
          },
          supabaseConfig
        ).catch(err => console.warn('[Supabase Auth Instructor Signup Note]', err));
      }

      // 2. Apply as instructor in AppContext
      const bankDetails = instAccountNumber.trim() ? {
        bankName: instBankName,
        accountNumber: instAccountNumber.trim(),
        accountHolder: instAccountHolder.trim() || name
      } : undefined;

      const res = await applyAsInstructor({
        name,
        email,
        phone,
        institution,
        title,
        specialization: primarySpecialization,
        specializations: instSpecializations,
        bio,
        certificateUrl: primaryCertUrl,
        certificateName: primaryCertName,
        certificates: certificatesList,
        idCardUrl: instIdCardUrl || undefined,
        signatureUrl: instSignatureUrl || undefined,
        bankAccount: bankDetails
      });

      setIsLoading(false);

      if (res.success) {
        setSuccessMessage('🎉 Berkas pendaftaran instruktur berhasil dikirim! Tim Admin LESIN AJA akan meninjau dan memverifikasi sertifikat Anda sebelum aktivasi.');
        showToast('📄 Berkas pendaftaran instruktur berhasil diajukan untuk verifikasi Admin!');
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengajukan pendaftaran instruktur.');
      setIsLoading(false);
    }
  };

  // Handle Resend Confirmation
  const handleResendConfirmation = async () => {
    if (!lastRegisteredEmail) return;
    setIsResending(true);
    const res = await resendSupabaseConfirmation(lastRegisteredEmail, supabaseConfig);
    setIsResending(false);
    if (res.success) {
      showToast('✅ Tautan konfirmasi baru berhasil dikirim ke email Anda!');
      setSuccessMessage('Email konfirmasi baru telah dikirim. Silakan cek inbox/spam Anda.');
    } else {
      showToast(`⚠️ ${res.message}`);
      setErrorMessage(res.message);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setErrorMessage('Masukkan email akun Anda.');
      return;
    }

    setIsLoading(true);
    const res = await sendSupabasePasswordReset(email, supabaseConfig);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(`Tautan reset kata sandi telah dikirim ke ${email}. Silakan cek email Anda.`);
    } else {
      setErrorMessage(res.message);
    }
  };

  // Quick Open Email Provider
  const getEmailProviderUrl = (email: string) => {
    if (email.includes('@gmail.com')) return 'https://mail.google.com';
    if (email.includes('@yahoo.com') || email.includes('@ymail.com')) return 'https://mail.yahoo.com';
    if (email.includes('@outlook.com') || email.includes('@hotmail.com')) return 'https://outlook.live.com';
    return null;
  };

  const emailProviderUrl = getEmailProviderUrl(lastRegisteredEmail || regEmail || loginEmail);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white relative flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                {mode === 'register_instructor' ? (
                  <Award className="w-7 h-7 text-amber-300" />
                ) : (
                  <GraduationCap className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-xl text-white">
                  {mode === 'login' && 'Masuk Akun'}
                  {mode === 'register' && 'Daftar Akun Siswa'}
                  {mode === 'register_instructor' && 'Pendaftaran Khusus Instruktur'}
                  {mode === 'forgot' && 'Reset Kata Sandi'}
                  {mode === 'confirmation_sent' && 'Cek Email Anda'}
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5">
                  {mode === 'login' && 'Akses materi video, kuis & sertifikat Anda'}
                  {mode === 'register' && 'Buat akun siswa dan mulai belajar kursus terbaik'}
                  {mode === 'register_instructor' && 'Wajib upload Sertifikat/Ijazah & KTP resmi serta verifikasi admin'}
                  {mode === 'forgot' && 'Kami akan mengirimkan instruksi reset ke email Anda'}
                  {mode === 'confirmation_sent' && 'Tautan aktivasi telah dikirim oleh Supabase Auth'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            {mode !== 'confirmation_sent' && (
              <div className="flex items-center gap-1 mt-5 p-1 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition whitespace-nowrap text-center ${
                    mode === 'login'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition whitespace-nowrap text-center ${
                    mode === 'register'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Daftar Siswa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register_instructor');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center justify-center gap-1 ${
                    mode === 'register_instructor'
                      ? 'bg-amber-400 text-slate-900 shadow-sm'
                      : 'text-amber-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Daftar Instruktur</span>
                </button>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto space-y-4 text-xs">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <div className="flex-1 font-medium">{successMessage}</div>
              </div>
            )}

            {/* 1. CONFIRMATION SENT SCREEN */}
            {mode === 'confirmation_sent' && (
              <div className="space-y-4 py-2 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                  <Mail className="w-8 h-8 animate-bounce" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Konfirmasi Email Dikirim!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Kami telah mengirim tautan aktivasi akun ke email:
                  </p>
                  <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                    {lastRegisteredEmail}
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl text-left space-y-2 text-[11px] text-blue-900 dark:text-blue-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Langkah Selanjutnya:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-300">
                    <li>Buka kotak masuk (inbox) atau folder spam email Anda.</li>
                    <li>Klik tautan atau tombol <strong>"Confirm your mail"</strong>.</li>
                    <li>Setelah diklik, Anda akan otomatis masuk ke LMS LESIN AJA!</li>
                  </ol>
                </div>

                <div className="space-y-2 pt-2">
                  {emailProviderUrl && (
                    <a
                      href={emailProviderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka Email ({lastRegisteredEmail.includes('@gmail.com') ? 'Gmail' : 'Kotak Masuk'})</span>
                    </a>
                  )}

                  <button
                    type="button"
                    disabled={isResending}
                    onClick={handleResendConfirmation}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{isResending ? 'Mengirim Ulang...' : 'Kirim Ulang Email Konfirmasi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-slate-500 hover:text-indigo-600 font-bold pt-2 block mx-auto"
                  >
                    Kembali ke Halaman Masuk
                  </button>
                </div>
              </div>
            )}

            {/* 2. LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Kata Sandi (Password)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setMode('forgot');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Lupa Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 mt-2 text-xs"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Masuk ke Akun</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 3. REGISTER STUDENT FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nama Lengkap Siswa <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Alamat Email Aktif <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="nama@email.com (link konfirmasi akan dikirim ke sini)"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      No. WhatsApp / HP
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        placeholder="0812xxxxxxx"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Instansi / Sekolah
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={regInstitution}
                        onChange={e => setRegInstitution(e.target.value)}
                        placeholder="Umum / SMAN 1"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Buat Kata Sandi (Password) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Email konfirmasi resmi akan dikirim oleh Supabase Auth untuk mengaktifkan akun.</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 mt-2 text-xs"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Daftar &amp; Kirim Email Konfirmasi</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 4. REGISTER INSTRUCTOR FORM */}
            {mode === 'register_instructor' && (
              <form onSubmit={handleInstructorRegisterSubmit} className="space-y-3.5">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-[11px] text-amber-900 dark:text-amber-200 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Verifikasi Kualifikasi & Identitas Instruktur LESIN AJA</span>
                  </div>
                  <p className="leading-relaxed text-amber-800 dark:text-amber-300/90 text-[10.5px]">
                    Setiap pengajar wajib mengunggah <strong>Sertifikat Keahlian / Ijazah</strong> dan <strong>Kartu Identitas (KTP)</strong> resmi. Tim Admin akan memverifikasi keabsahan dokumen sebelum mengaktifkan akun dan hak publikasi kursus.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={instName}
                        onChange={e => setInstName(e.target.value)}
                        placeholder="Contoh: Dr. Sarah Wijaya, M.Kom"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Alamat Email Aktif <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={instEmail}
                        onChange={e => setInstEmail(e.target.value)}
                        placeholder="instruktur@email.com"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Gelar / Jabatan Profesional <span className="text-slate-400 font-normal text-[10px] lowercase">(opsional)</span>
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={instTitle}
                      onChange={e => setInstTitle(e.target.value)}
                      placeholder="Contoh: S.T., M.Kom, Praktisi Industri, Lead Engineer, dll"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* BIDANG KEAHLIAN (MAX 5 BIDANG) */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/5 to-slate-50 dark:from-amber-500/10 dark:to-slate-800/40 border border-amber-300/80 dark:border-amber-700/60 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Bidang Keahlian Instruktur</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        instSpecializations.length >= 5
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : instSpecializations.length > 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {instSpecializations.length === 5
                        ? '✅ Maksimal 5/5 Terpilih'
                        : `Dipilih: ${instSpecializations.length} dari maks. 5 bidang`}
                    </span>
                  </div>

                  {/* Active Chips List */}
                  <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    {instSpecializations.length === 0 ? (
                      <span className="text-slate-400 italic text-[11px] py-0.5">
                        Belum ada bidang keahlian yang dipilih. Silakan pilih dari dropdown di bawah (maks. 5).
                      </span>
                    ) : (
                      instSpecializations.map(spec => (
                        <span
                          key={spec}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 dark:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 animate-in fade-in zoom-in-95 duration-150"
                        >
                          <Tag className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>{spec}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialization(spec)}
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
                  {instSpecializations.length < 5 ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <select
                          value={selectedDropdownSpec}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'Lainnya (Ketik Manual)') {
                              setIsCustomSpecMode(true);
                              setSelectedDropdownSpec('');
                            } else if (val) {
                              handleAddSpecialization(val);
                            }
                          }}
                          className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-900 dark:text-white cursor-pointer"
                        >
                          <option value="">+ Tambah Bidang Keahlian dari Daftar ({SPECIALIZATION_OPTIONS.length - 1} Opsi)...</option>
                          {SPECIALIZATION_OPTIONS.filter(opt => !instSpecializations.includes(opt)).map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Manual Input if toggled */}
                      {isCustomSpecMode && (
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl space-y-2 animate-in fade-in duration-150">
                          <label className="block text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                            Ketikkan Bidang Keahlian Spesifik Anda:
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={customSpecInput}
                              onChange={e => setCustomSpecInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (customSpecInput.trim()) {
                                    handleAddSpecialization(customSpecInput.trim());
                                  }
                                }
                              }}
                              placeholder="Contoh: Sabun & Pembersih Rumah Tangga / Arduino IoT"
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-400 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (customSpecInput.trim()) {
                                  handleAddSpecialization(customSpecInput.trim());
                                }
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition"
                            >
                              + Tambahkan
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsCustomSpecMode(false)}
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
                      <span>Anda telah memilih batas maksimal <strong>5 bidang keahlian</strong>. Hapus salah satu tag di atas jika ingin mengganti.</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      No. WhatsApp / HP
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={instPhone}
                        onChange={e => setInstPhone(e.target.value)}
                        placeholder="0812xxxxxxx"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Instansi / Perusahaan
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={instInstitution}
                        onChange={e => setInstInstitution(e.target.value)}
                        placeholder="Universitas / Tech Company"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* DOKUMEN SERTIFIKAT / IJAZAH (WAJIB SESUAI BIDANG KEAHLIAN) */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span>Upload Sertifikat / Ijazah Keahlian</span>
                      <span className="text-rose-500 font-bold">*Wajib</span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-500">
                      {instSpecializations.length > 0
                        ? `${instSpecializations.filter(s => instCertificatesBySpec[s]?.url?.trim()).length}/${instSpecializations.length} Terunggah`
                        : '0 Bidang'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Setiap bidang keahlian yang Anda pilih wajib dilengkapi 1 bukti sertifikat / ijazah kompetensi resmi ({instSpecializations.length || 0} bidang = {instSpecializations.length || 0} berkas).
                  </p>

                  {instSpecializations.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center space-y-1">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto" />
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        Belum Memilih Bidang Keahlian
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Silakan pilih minimal 1 bidang keahlian pada opsi di atas. Kolom upload sertifikat akan otomatis dibuat sesuai bidang yang Anda tentukan.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {instSpecializations.map((spec, index) => {
                        const certData = instCertificatesBySpec[spec];
                        const hasUploaded = Boolean(certData?.url?.trim());
                        const isUploading = Boolean(certData?.isUploading);

                        return (
                          <div
                            key={spec}
                            className={`p-3 rounded-xl bg-white dark:bg-slate-900 border transition ${
                              hasUploaded
                                ? 'border-emerald-300 dark:border-emerald-800 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 min-w-0 pr-2">
                                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black shrink-0">
                                  {index + 1}
                                </span>
                                <span className="truncate">{spec}</span>
                              </span>
                              {hasUploaded ? (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Terunggah</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                  <span>Wajib Diisi</span>
                                </span>
                              )}
                            </div>

                            {hasUploaded ? (
                              <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 truncate">
                                  <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {certData?.name || `Sertifikat ${spec}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {certData?.url?.startsWith('http') && (
                                    <a
                                      href={certData.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 px-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center gap-1 hover:underline"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>Lihat</span>
                                    </a>
                                  )}
                                  <label className="cursor-pointer px-2 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300">
                                    <span>Ganti</span>
                                    <input
                                      type="file"
                                      accept="image/*,application/pdf"
                                      className="hidden"
                                      onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) handleSpecCertificateUpload(spec, file);
                                      }}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleClearSpecCertificate(spec)}
                                    className="p-1 px-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <label
                                  className={`w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-600 hover:border-amber-500 rounded-xl flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 bg-slate-50 dark:bg-slate-800/60 transition font-bold text-xs cursor-pointer ${
                                    isUploading ? 'opacity-60 pointer-events-none' : ''
                                  }`}
                                >
                                  <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce text-amber-500' : 'text-slate-400'}`} />
                                  <span>
                                    {isUploading
                                      ? `Mengunggah berkas untuk ${spec}...`
                                      : `Pilih Berkas Sertifikat / Ijazah (${spec})`}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    disabled={isUploading}
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      if (file) handleSpecCertificateUpload(spec, file);
                                    }}
                                  />
                                </label>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 shrink-0">Atau URL:</span>
                                  <input
                                    type="url"
                                    value={certData?.url || ''}
                                    onChange={e => handleSpecCertificateUrlChange(spec, e.target.value)}
                                    placeholder={`https://drive.google.com/... link sertifikat ${spec}`}
                                    className="flex-1 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* DOKUMEN KTP (WAJIB) */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>Upload Kartu Identitas (KTP)</span>
                      <span className="text-rose-500 font-bold">*Wajib</span>
                    </label>
                    {instIdCardUrl && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Terunggah
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={idCardInputRef}
                    onChange={handleIdCardUpload}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />

                  {instIdCardUrl ? (
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800/80 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                          {instIdCardName || 'Dokumen KTP Terunggah'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {instIdCardUrl.startsWith('http') && (
                          <a
                            href={instIdCardUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:underline rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Lihat</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => idCardInputRef.current?.click()}
                          className="px-2 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                        >
                          Ganti
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => idCardInputRef.current?.click()}
                        disabled={isUploadingIdCard}
                        className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-semibold transition shadow-sm"
                      >
                        <Upload className={`w-3.5 h-3.5 ${isUploadingIdCard ? 'animate-bounce' : 'text-amber-500'}`} />
                        <span>{isUploadingIdCard ? 'Mengunggah KTP...' : 'Pilih Berkas / Foto KTP (JPG, PNG, PDF)'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 shrink-0">Atau URL:</span>
                        <input
                          type="url"
                          value={instIdCardUrl}
                          onChange={e => {
                            setInstIdCardUrl(e.target.value);
                            setInstIdCardName('Link Dokumen KTP Eksternal');
                          }}
                          placeholder="https://drive.google.com/... atau link foto KTP"
                          className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Format: JPG, PNG, atau PDF. Dokumen KTP hanya digunakan secara rahasia oleh tim admin untuk verifikasi identitas resmi pengajar.
                  </p>
                </div>

                {/* UPLOAD TANDA TANGAN DIGITAL */}
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/70 dark:border-amber-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Upload Tanda Tangan Digital Pengajar</span>
                      <span className="text-[10px] font-normal text-amber-700/80 dark:text-amber-400/80 lowercase">(disarankan)</span>
                    </label>
                    {instSignatureUrl && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Siap Digunakan
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={signatureInputRef}
                    onChange={handleSignatureUpload}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />

                  {instSignatureUrl ? (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {instSignatureName || 'Tanda Tangan Digital Terpasang'}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => signatureInputRef.current?.click()}
                            className="px-2 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                          >
                            Ganti
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInstSignatureUrl('');
                              setInstSignatureName('');
                            }}
                            className="px-2 py-1 text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>

                      {/* Live Preview Box */}
                      <div className="h-20 w-full rounded-lg bg-white border border-dashed border-amber-200 dark:border-slate-700 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                        <img
                          src={instSignatureUrl}
                          alt="Tanda Tangan Pengajar"
                          className="max-h-full max-w-full object-contain filter contrast-125"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        disabled={isUploadingSignature}
                        className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-semibold transition shadow-sm"
                      >
                        <Upload className={`w-3.5 h-3.5 ${isUploadingSignature ? 'animate-bounce' : 'text-amber-500'}`} />
                        <span>{isUploadingSignature ? 'Mengunggah Tanda Tangan...' : 'Unggah File Tanda Tangan (PNG Transparan/JPG)'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 shrink-0">Atau URL:</span>
                        <input
                          type="url"
                          value={instSignatureUrl}
                          onChange={e => {
                            setInstSignatureUrl(e.target.value);
                            setInstSignatureName('Link Tanda Tangan');
                          }}
                          placeholder="https://... link gambar tanda tangan"
                          className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    💡 Gambar tanda tangan Anda akan ditinjau oleh Admin untuk persetujuan dan dicantumkan pada <strong>e-Sertifikat Kelulusan</strong> siswa untuk kursus yang Anda ajarkan.
                  </p>
                </div>

                {/* REKENING BANK */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <span>Rekening Bank Penarikan Saldo (Bagi Hasil Kursus)</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <select
                        value={instBankName}
                        onChange={e => setInstBankName(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="BCA">BCA</option>
                        <option value="Mandiri">Mandiri</option>
                        <option value="BRI">BRI</option>
                        <option value="BNI">BNI</option>
                        <option value="BSI">BSI</option>
                        <option value="CIMB Niaga">CIMB</option>
                        <option value="Bank Jago">Jago</option>
                        <option value="DANA">DANA</option>
                        <option value="GoPay">GoPay</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={instAccountNumber}
                        onChange={e => setInstAccountNumber(e.target.value)}
                        placeholder="Nomor Rekening / E-Wallet"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={instAccountHolder}
                      onChange={e => setInstAccountHolder(e.target.value)}
                      placeholder="Nama Pemilik Rekening (Sesuai Buku Tabungan)"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Buat Kata Sandi Akun <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showInstPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={instPassword}
                      onChange={e => setInstPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowInstPassword(!showInstPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showInstPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50 mt-2 text-xs"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Kirim Berkas Pendaftaran Instruktur</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 5. FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Masukkan email akun Anda. Supabase Auth akan mengirimkan link untuk membuat kata sandi baru.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Alamat Email Akun
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 text-xs"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Kirim Tautan Reset Password</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full text-center text-xs text-slate-500 hover:text-indigo-600 font-bold pt-1"
                >
                  Kembali ke Halaman Masuk
                </button>
              </form>
            )}

            {/* Supabase Tutorial Helper Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsTutorialOpen(true)}
                className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tutorial Setting Supabase Email Auth</span>
              </button>

              <span className="text-[10px] text-slate-400">
                {supabaseConfig.isConnected ? '🟢 Supabase Aktif' : '⚪ Cloud Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Setup Tutorial Modal */}
      <SupabaseTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </>
  );
};
