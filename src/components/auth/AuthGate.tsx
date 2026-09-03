import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Mail,
  User as UserIcon,
  Phone,
  Building,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle2,
  BookOpen,
  Radio,
  Award,
  Sun,
  Moon
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const {
    users,
    login,
    registerStudent,
    websiteSettings,
    isDarkMode,
    toggleDarkMode
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regInstitution, setRegInstitution] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!loginEmail.trim()) {
      setErrorMessage('Harap masukkan alamat email.');
      return;
    }

    const trimmed = loginEmail.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === trimmed);

    if (!existing) {
      setErrorMessage('⚠️ Email ini belum terdaftar di sistem! Hanya pengguna yang telah terdaftar yang dapat masuk. Silakan klik "Daftar Akun Baru".');
      return;
    }

    login(trimmed);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMessage('Nama lengkap dan email wajib diisi.');
      return;
    }

    registerStudent(regName.trim(), regEmail.trim(), regPhone.trim(), regInstitution.trim());
  };

  const logoSrc = websiteSettings.logoImageUrl || websiteSettings.appIconUrl;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={websiteSettings.siteName || 'LESIN AJA'}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              className="w-10 h-10 rounded-xl object-contain bg-slate-800 p-1 border border-slate-700 shadow-md"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-500/25">
              <GraduationCap className="w-6 h-6" />
            </div>
          )}
          <div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              {websiteSettings.logoText || 'LESIN AJA'}
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PORTAL RESMI
              </span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {websiteSettings.siteTagline || 'Learning Management System Terdepan'}
            </p>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
          title="Ubah Tema"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* Left Side: Brand Story & Security Banner */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Akses Khusus Pengguna Terdaftar</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
            Tingkatkan Skill Digital & Raih <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">Sertifikasi Resmi</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Aplikasi LMS interaktif dengan kurikulum terstruktur, video materi praktis, sesi live mentoring tatap muka, dan ujian kuis kelulusan e-sertifikat ber-QR Code.
          </p>

          {/* Key Advantages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Materi Video Praktis</h4>
                <p className="text-[11px] text-slate-400">Belajar kapan saja sesuai ritme Anda.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Live Mentoring</h4>
                <p className="text-[11px] text-slate-400">Tanya jawab langsung bersama praktisi.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">E-Sertifikat Resmi</h4>
                <p className="text-[11px] text-slate-400">Verifikasi online dengan QR Code.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">PWA & Navigasi Mobile</h4>
                <p className="text-[11px] text-slate-400">Bisa diinstall di HP seperti aplikasi asli.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Box (Login or Register) */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-700/80 mb-6">
              <button
                id="auth-gate-tab-login"
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Masuk (Akun Terdaftar)
              </button>
              <button
                id="auth-gate-tab-register"
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daftar Akun Baru
              </button>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium leading-relaxed flex items-start gap-2.5 animate-in fade-in">
                <span className="text-base leading-none">⚠️</span>
                <div>{errorMessage}</div>
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="authgate-login-email"
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={loginEmail}
                      onChange={e => {
                        setLoginEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-900/90 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    *Hanya akun yang telah terdaftar yang dapat masuk ke aplikasi.
                  </p>
                </div>

                <button
                  id="authgate-submit-login-btn"
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <span>Masuk ke Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-3 border-t border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold hover:underline"
                  >
                    Belum punya akun? Daftar sebagai siswa baru
                  </button>
                </div>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Lengkap *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="authgate-reg-name"
                      type="text"
                      required
                      placeholder="Nama Lengkap Anda"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-900/90 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Alamat Email Aktif *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="authgate-reg-email"
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-900/90 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="authgate-reg-phone"
                      type="tel"
                      placeholder="0812xxxxxxxx"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-900/90 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Asal Sekolah / Universitas / Instansi
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="authgate-reg-institution"
                      type="text"
                      placeholder="Contoh: Universitas Indonesia / Umum"
                      value={regInstitution}
                      onChange={e => setRegInstitution(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-900/90 text-white rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  id="authgate-submit-register-btn"
                  type="submit"
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Daftar & Langsung Masuk</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold hover:underline"
                  >
                    Sudah punya akun terdaftar? Masuk disini
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        <p>{websiteSettings.footerCopyright || '© 2026 LESIN AJA LMS. All Rights Reserved.'}</p>
      </footer>
    </div>
  );
};
