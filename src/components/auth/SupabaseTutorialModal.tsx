import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Key,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Settings,
  Sparkles,
  ChevronRight,
  Info,
  Server,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSafeAppOrigin } from '../../utils/supabaseClient';

interface SupabaseTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseTutorialModal: React.FC<SupabaseTutorialModalProps> = ({
  isOpen,
  onClose
}) => {
  const { websiteSettings, supabaseConfig, showToast } = useApp();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const appOrigin = getSafeAppOrigin();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`✅ ${label} berhasil disalin!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = [
    {
      id: 1,
      title: '1. Aktifkan Email Auth & Konfirmasi Email',
      desc: 'Pengaturan wajib di Supabase agar email konfirmasi otomatis terkirim saat siswa mendaftar.'
    },
    {
      id: 2,
      title: '2. Set Redirect URLs (URL Website Anda)',
      desc: 'Agar link di email konfirmasi mengarahkan siswa kembali ke platform LESIN AJA.'
    },
    {
      id: 3,
      title: '3. Custom Template Email & SMTP (Opsional)',
      desc: 'Gunakan email pengirim resmi Anda sendiri (Gmail, Resend, Brevo) tanpa limit.'
    },
    {
      id: 4,
      title: '4. Hubungkan ke Panel Admin',
      desc: 'Masukkan Project URL & Anon Public Key ke Panel Admin LESIN AJA.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white">
                Panduan Setting Supabase Email Authentication
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Konfirmasi email pendaftaran siswa menggunakan Supabase Auth 100% Resmi &amp; Otomatis
              </p>
            </div>
          </div>

          {/* Quick Step Indicators */}
          <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-white/15">
            {steps.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                  activeStep === s.id
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <span>Langkah {s.id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* STEP 1: Enable Email Confirmation */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                    Langkah 1: Mengaktifkan Konfirmasi Email di Supabase
                  </h4>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Supabase menyediakan server email bawaan gratis (built-in) yang langsung dapat mengirim email aktivasi ke Gmail/Yahoo siswa.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pl-1">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Buka Dashboard Supabase Project Anda:
                    </p>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs transition text-xs"
                    >
                      <span>Buka Supabase Dashboard</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Masuk ke Menu Authentication &gt; Providers &gt; Email:
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Di sidebar kiri, klik icon <strong>Authentication</strong> (gembok) &gt; pilih menu <strong>Providers</strong> &gt; klik opsi <strong>Email</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Pastikan opsi berikut dalam posisi <strong>ON (Aktif)</strong>:
                    </p>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 font-medium">
                      <div className="flex items-center justify-between">
                        <span>✅ <strong>Enable Email provider</strong></span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">Enabled</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>✅ <strong>Confirm email</strong></span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">Enabled</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      *Klik tombol <strong>Save</strong> di pojok kanan bawah setelah mengubah setelan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Set Redirect URLs */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm">
                    Langkah 2: Mengatur URL Redirect Website (Wajib agar tidak Error 404)
                  </h4>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
                    Supabase perlu mengetahui alamat website Anda agar setelah siswa menekan tombol "Confirm your mail" di email mereka, browser otomatis membuka website LESIN AJA dan siswa langsung login.
                  </p>
                </div>
              </div>

              {/* Warning Alert against using aistudio.google.com */}
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
                <Info className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-rose-950 dark:text-rose-100">
                    ⚠️ Kenapa muncul error 404 di aistudio.google.com?
                  </div>
                  <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                    Alamat <code>aistudio.google.com</code> adalah URL workspace editor pengembang, bukan URL website aplikasi kursus Anda. Jika kolom <strong>Site URL</strong> di Supabase diisi dengan <code>aistudio.google.com</code>, link verifikasi email akan diarahkan ke Google AI Studio sehingga muncul halaman <strong>404 Not Found</strong>.
                  </p>
                  <p className="text-[11px] text-rose-800 dark:text-rose-300 font-bold">
                    👉 Solusi: Gunakan URL Aplikasi Asli di bawah ini untuk kolom <em>Site URL</em> dan <em>Redirect URLs</em> di Supabase.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pl-1">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Buka menu Authentication &gt; URL Configuration:
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Di sidebar Supabase, klik <strong>Authentication</strong> &gt; pilih submenu <strong>URL Configuration</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="w-full space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Isi <strong>Site URL</strong> &amp; <strong>Redirect URLs</strong> dengan URL Website Anda:
                    </p>
                    
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            1. Kolom "Site URL" (Salin &amp; Paste ke Supabase):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(appOrigin, 'Site URL')}
                            className="px-2.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs"
                          >
                            {copiedKey === 'Site URL' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'Site URL' ? 'Tersalin' : 'Salin URL'}</span>
                          </button>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-blue-600 dark:text-blue-400 break-all select-all font-bold">
                          {appOrigin}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            2. Kolom "Redirect URLs" (Tambahkan URL + wildcard /**):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`${appOrigin}/**`, 'Redirect URL Wildcard')}
                            className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs"
                          >
                            {copiedKey === 'Redirect URL Wildcard' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'Redirect URL Wildcard' ? 'Tersalin' : 'Salin Wildcard'}</span>
                          </button>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 break-all select-all font-bold">
                          {appOrigin}/**
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          *Tambahkan juga <code>http://localhost:3000/**</code> dan domain produksi/Vercel Anda jika ada.
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
                      <strong>Penjelasan Tanda Bintang <code>/**</code> (Wildcard):</strong>
                      <p className="mt-0.5 text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed">
                        Tanda <code>/**</code> berarti mengizinkan Supabase mengarahkan siswa ke halaman mana saja di website Anda setelah klik email (seperti halaman utama, dashboard, atau halaman kursus) dengan aman.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Email Template & Custom SMTP */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5 p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl">
                <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-purple-900 dark:text-purple-200 text-sm">
                    Langkah 3: Menyesuaikan Template Email &amp; Custom SMTP
                  </h4>
                  <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
                    Ubah teks email aktivasi menjadi Bahasa Indonesia dan atur pengirim resmi kursus Anda.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pl-1">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-purple-500" />
                    <span>Ubah Bahasa Email (Email Templates)</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Masuk ke <strong>Authentication &gt; Email Templates &gt; Confirm signup</strong>. Anda dapat mengganti Subject menjadi:
                  </p>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border font-mono text-[11px] text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Konfirmasi Akun Siswa LESIN AJA Anda</span>
                    <button
                      onClick={() => handleCopy('Konfirmasi Akun Siswa LESIN AJA Anda', 'Subject Email')}
                      className="text-purple-600 font-bold text-[10px] hover:underline"
                    >
                      Salin
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Server className="w-4 h-4 text-purple-500" />
                    <span>Cara Mengganti Nama Pengirim Email (Sender Name)</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Agar email yang diterima siswa muncul dengan nama <strong>"LESIN AJA"</strong> (bukan default Supabase Auth) dan menggunakan email resmi Anda:
                  </p>
                  
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-[11px]">
                    <div className="font-bold text-purple-700 dark:text-purple-300">
                      Opsi A: Menggunakan Gmail Resmi Anda (Gratis &amp; Instan)
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1 text-[11px]">
                      <li>Masuk ke <strong>Authentication &gt; Providers &gt; Email &gt; Enable Custom SMTP</strong> (aktifkan toggle).</li>
                      <li><strong>Sender Name:</strong> Isi dengan <code>LESIN AJA Official</code>.</li>
                      <li><strong>Sender Email:</strong> Isi dengan email Gmail Anda (contoh: <code>kursus.lesinaja@gmail.com</code>).</li>
                      <li><strong>Host:</strong> <code>smtp.gmail.com</code> &nbsp;|&nbsp; <strong>Port:</strong> <code>587</code></li>
                      <li><strong>User:</strong> Alamat Gmail Anda &nbsp;|&nbsp; <strong>Pass:</strong> 16-digit Google App Password.</li>
                    </ol>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                    <div className="font-bold text-emerald-700 dark:text-emerald-300">
                      Opsi B: Menggunakan Layanan Resend / Brevo (Kapasitas 3.000+ Email/Bulan Gratis)
                    </div>
                    <p className="text-slate-500 text-[10px] leading-relaxed">
                      Daftar gratis di <strong>resend.com</strong>, buat API Key SMTP, lalu masukkan ke kolom Custom SMTP Supabase. Nama pengirim bisa diatur bebas seperti <code>Admin LESIN AJA &lt;no-reply@domainanda.com&gt;</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Connect to Admin Panel */}
          {activeStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
                <Key className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                    Langkah 4: Hubungkan Kredensial ke Panel Admin
                  </h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                    Salin Project URL dan Anon Key dari Supabase ke Panel Admin LESIN AJA.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pl-1">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Di Supabase Dashboard, buka <strong>Project Settings &gt; API</strong>:
                </p>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-900 dark:text-white mb-0.5">1. Project URL</p>
                    <p className="text-[11px] text-slate-500 font-mono">https://xxxxxxxxxxxx.supabase.co</p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-900 dark:text-white mb-0.5">2. Project API Keys (anon public)</p>
                    <p className="text-[11px] text-slate-500 font-mono">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-emerald-900 dark:text-emerald-300">Status Terkoneksi Saat Ini:</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      {supabaseConfig.isConnected ? '✅ Supabase Cloud Terhubung & Aktif' : '⚠️ Belum Terhubung'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition disabled:opacity-30"
          >
            Kembali
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Langkah {activeStep} dari 4</span>
          </div>

          {activeStep < 4 ? (
            <button
              type="button"
              onClick={() => setActiveStep(prev => Math.min(4, prev + 1))}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-emerald-600/20 transition"
            >
              <span>Lanjut</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition"
            >
              Selesai &amp; Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
