import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Smartphone,
  Mail,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Zap,
  MessageSquare,
  ChevronRight,
  Send,
  Check
} from 'lucide-react';

interface OtpTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod?: (method: 'whatsapp' | 'email') => void;
}

export const OtpTutorialModal: React.FC<OtpTutorialModalProps> = ({
  isOpen,
  onClose,
  onSelectMethod
}) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'whatsapp' | 'email' | 'faq'>('steps');

  if (!isOpen) return null;

  const steps = [
    {
      step: '01',
      title: 'Pilih Jalur Pengiriman (WhatsApp / Email)',
      desc: 'Masukkan Email atau Nomor WhatsApp aktif Anda saat login atau checkout kursus. Pilih metode pengiriman yang paling cepat Anda akses.',
      icon: Smartphone,
      color: 'bg-emerald-500 text-white'
    },
    {
      step: '02',
      title: 'Periksa Pesan Masuk',
      desc: 'Buka aplikasi WhatsApp atau Kotak Masuk Email Anda. Sistem kami secara instan mengirimkan 6 digit angka kode rahasia.',
      icon: MessageSquare,
      color: 'bg-blue-500 text-white'
    },
    {
      step: '03',
      title: 'Masukkan 6 Digit Kode OTP',
      desc: 'Ketik atau tempelkan (paste) 6 angka kode tersebut ke dalam kotak verifikasi pada layar. Kode berlaku selama 5 menit.',
      icon: Lock,
      color: 'bg-indigo-500 text-white'
    },
    {
      step: '04',
      title: 'Akun & Kursus Langsung Aktif!',
      desc: 'Sistem langsung memverifikasi identitas Anda tanpa memerlukan password rumit. Anda langsung diarahkan ke materi belajar kursus.',
      icon: CheckCircle2,
      color: 'bg-purple-500 text-white'
    }
  ];

  return (
    <div id="otp-tutorial-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="otp-tutorial-card"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest text-emerald-200 flex items-center gap-1 border border-white/20">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span>Panduan Resmi Siswa</span>
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
            Tutorial & Cara Kerja Login via OTP
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-lg leading-relaxed">
            Sistem OTP (One-Time Password) mengirimkan kode akses sementara langsung ke WhatsApp atau Email Anda demi keamanan maksimal tanpa kata sandi yang mudah ditebak.
          </p>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('steps')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'steps'
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Langkah Cepat</span>
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp OTP</span>
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'email'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email OTP</span>
            </button>

            <button
              onClick={() => setActiveTab('faq')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'faq'
                  ? 'bg-white text-slate-800 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Solusi & FAQ</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {steps.map(s => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.step}
                      className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className={`w-8 h-8 rounded-xl ${s.color} flex items-center justify-center shadow-xs`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-mono text-xs font-black text-slate-400 dark:text-slate-500">
                            LANGKAH {s.step}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                          {s.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security Banner */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <strong className="block font-bold mb-0.5">Keamanan Tanpa Password</strong>
                  Anda tidak perlu lagi mengingat kata sandi yang rumit atau khawatir akun dicuri. Kode OTP selalu bersifat acak dan baru setiap kali Anda masuk.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
                <h4 className="font-heading font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Cara Menerima Kode via WhatsApp (Sangat Cepat & Praktis)</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                  <li>Pastikan Anda memasukkan nomor WhatsApp aktif (contoh: <code>081234567890</code>).</li>
                  <li>Sistem akan menyiapkan pesan resmi berisi 6 digit kode OTP.</li>
                  <li>Anda dapat mengklik tombol <strong>"Buka WhatsApp"</strong> pada modal jika ingin langsung membaca pesan.</li>
                  <li>Salin 6 angka kode tersebut dan tempelkan di kotak OTP aplikasi LESIN AJA.</li>
                </ol>
              </div>

              {/* WhatsApp Message Preview Mockup */}
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Contoh Tampilan Pesan WhatsApp yang Anda Terima:</span>
                </div>
                <div className="bg-[#DCF8C6] dark:bg-emerald-900/60 p-3.5 rounded-2xl rounded-tr-none text-slate-900 dark:text-slate-100 text-xs font-mono shadow-xs border border-emerald-200 dark:border-emerald-800">
                  <p className="font-bold text-slate-800 dark:text-white mb-1">Halo Siswa LESIN AJA,</p>
                  <p className="mb-2">Berikut adalah kode OTP verifikasi keamanan akun Anda:</p>
                  <div className="text-xl font-black tracking-widest text-emerald-800 dark:text-emerald-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl text-center border border-emerald-300 dark:border-emerald-700">
                    🔒 849201
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-2">
                    *Kode ini berlaku 5 menit. Jangan bagikan kode ini kepada siapapun.*
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl">
                <h4 className="font-heading font-bold text-sm text-blue-900 dark:text-blue-200 flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Cara Menerima Kode via Email</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-blue-800 dark:text-blue-300">
                  <li>Masukkan alamat email aktif Anda yang terdaftar pada sistem (contoh: <code>nama@gmail.com</code>).</li>
                  <li>Periksa Kotak Masuk (Inbox) dari pengirim <strong>LESIN AJA Security</strong>.</li>
                  <li>Jika tidak muncul dalam 1 menit, periksa folder <strong>Spam / Junk</strong> atau <strong>Promosi</strong>.</li>
                  <li>Ketikkan 6 digit angka OTP yang tercantum di email ke formulir aplikasi.</li>
                </ol>
              </div>

              {/* Email Message Preview Mockup */}
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span>Contoh Tampilan Email Masuk:</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl text-slate-900 dark:text-slate-100 text-xs shadow-xs border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400">no-reply@lesinaja.id</span>
                    <span className="text-[10px] text-slate-400">Subjek: Kode OTP Akses Pembelajaran</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Halo, gunakan kode verifikasi sekali pakai berikut untuk mengakses akun Anda:
                  </p>
                  <div className="text-xl font-black tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl text-center font-mono border border-blue-200 dark:border-blue-800">
                    632810
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/80">
                <h5 className="font-bold text-amber-900 dark:text-amber-300 mb-1.5 flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Kenapa tidak ada pesan OTP masuk ke WhatsApp atau Email?</span>
                </h5>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Pengiriman kode OTP menggunakan jalur tautan langsung WhatsApp dan sistem verifikasi email otomatis.
                </p>
                <div className="mt-2.5 pt-2.5 border-t border-amber-200/60 dark:border-amber-800/40 space-y-1.5">
                  <p className="font-bold text-amber-900 dark:text-amber-200">Cara verifikasi login:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    <li><strong>Untuk WhatsApp:</strong> Klik tombol hijau <em>"Buka WhatsApp Sekarang"</em> di jendela verifikasi untuk membuka chat WhatsApp resmi.</li>
                    <li><strong>Kirim Ulang Kode:</strong> Jika belum menerima kode dalam beberapa saat, klik tombol <em>"Kirim Ulang OTP"</em> atau beralih ke jalur Email.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/80">
                <h5 className="font-bold text-blue-900 dark:text-blue-300 mb-1.5 flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Bagaimana jika pesan WhatsApp tidak terbuka otomatis?</span>
                </h5>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Cukup klik tombol <strong>"Buka WhatsApp"</strong> yang muncul di kotak dialog OTP. Aplikasi WhatsApp Web atau WhatsApp di ponsel Anda akan otomatis terbuka dengan format pesan verifikasi siap kirim.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Berapa lama kode OTP berlaku?</span>
                </h5>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Setiap kode OTP berlaku tepat selama <strong>5 menit</strong> sejak dikirimkan. Jika waktu habis, silakan klik tombol kirim ulang kode baru.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Apakah aman menggunakan nomor WhatsApp & Email?</span>
                </h5>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sangat aman. Data identitas Anda hanya digunakan untuk verifikasi login, keamanan akun, dan penerbitan e-sertifikat resmi.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sistem Otentikasi Terenkripsi LESIN AJA</span>
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
          >
            <span>Saya Mengerti & Lanjutkan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
