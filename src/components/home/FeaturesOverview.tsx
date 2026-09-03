import React from 'react';
import {
  Smartphone,
  PlayCircle,
  HelpCircle,
  Award,
  Zap,
  Sheet,
  Users,
  ShieldCheck
} from 'lucide-react';

export const FeaturesOverview: React.FC = () => {
  const features = [
    {
      icon: PlayCircle,
      title: 'Materi Video Berkualitas HD',
      description: 'Akses ratusan modul video terstruktur dengan kecepatan pemutaran fleksibel, catatan interaktif, dan materi lampiran.',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: HelpCircle,
      title: 'Kuis & Ujian Interaktif',
      description: 'Uji pemahaman Anda dengan timer pengerjaan, skor instan otomatis, dan pembahasan mendalam pada tiap butir soal.',
      color: 'from-amber-500 to-orange-600'
    },
    {
      icon: Award,
      title: 'E-Sertifikat Terverifikasi QR',
      description: 'Klaim sertifikat kompetensi berformat resmi yang dapat divalidasi keasliannya dan diunduh dalam format PDF/PNG.',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      icon: Smartphone,
      title: 'Progressive Web App (PWA)',
      description: 'Dapat di-install langsung di smartphone & desktop dengan dukungan cache offline untuk belajar tanpa hambatan kuota.',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: Zap,
      title: 'Payment Gateway Pakasir & QRIS',
      description: 'Pendaftaran otomatis aktif dalam hitungan detik setelah scan QRIS atau transfer bank tanpa perlu konfirmasi manual.',
      color: 'from-rose-500 to-red-600'
    },
    {
      icon: Sheet,
      title: 'Auto-Sync Google Sheets & Cloud',
      description: 'Integrasi dua arah ke spreadsheet Google Sheets dan database cloud Supabase untuk pengelolaan data real-time.',
      color: 'from-cyan-500 to-blue-600'
    }
  ];

  return (
    <section id="features-overview-section" className="py-8 sm:py-16 max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-12 space-y-1.5 sm:space-y-3">
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-600/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-blue-200 dark:border-blue-500/20">
          Ekosistem Belajar Modern
        </span>
        <h2 className="font-heading font-extrabold text-xl sm:text-3xl lg:text-4xl text-slate-900 dark:text-white">
          Mengapa Belajar di LESIN AJA?
        </h2>
        <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Dirancang khusus untuk memberikan pengalaman belajar terbaik dari awal pendaftaran hingga sertifikasi siap karier.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300 space-y-3 sm:space-y-4 flex flex-col justify-start group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-lg text-slate-900 dark:text-white leading-tight">
                {feat.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
