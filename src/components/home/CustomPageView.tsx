import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, HelpCircle, FileText, ArrowLeft } from 'lucide-react';

interface CustomPageViewProps {
  slug: string;
}

export const CustomPageView: React.FC<CustomPageViewProps> = ({ slug }) => {
  const { customPages, navigateTo } = useApp();
  const page = customPages.find(p => p.slug === slug) || customPages[0];

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (!page) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h2 className="text-xl font-bold">Halaman Tidak Ditemukan</h2>
      </div>
    );
  }

  // Pre-configured structured FAQ items for interactive toggle if slug === 'faq'
  const faqItems = [
    {
      q: 'Bagaimana cara mendaftar dan mengikuti kursus di LESIN AJA?',
      a: 'Pilih kursus yang Anda inginkan dari katalog, klik "Daftar Kursus", dan selesaikan pembayaran melalui QRIS/Transfer Bank (Pakasir). Kursus akan otomatis aktif dalam hitungan detik!'
    },
    {
      q: 'Kapan E-Sertifikat resmi dapat diunduh?',
      a: 'E-Sertifikat resmi terbit otomatis setelah Anda menyelesaikan seluruh modul video dan lulus ujian kuis evaluasi dengan skor di atas passing grade (80%). Sertifikat dilengkapi kode unik dan QR verifikasi resmi.'
    },
    {
      q: 'Apakah materi video bisa diakses selamanya (Lifetime Access)?',
      a: 'Ya, seluruh kursus yang telah Anda beli mendapatkan akses selamanya termasuk pembaruan materi yang ditambahkan di masa mendatang tanpa biaya tambahan.'
    },
    {
      q: 'Bagaimana cara mengikuti sesi mentoring live?',
      a: 'Buka menu "Sesi Live", pilih sesi yang Anda minati, lalu klik "Daftar Pengingat Sesi". Ketika jadwal tiba, klik tombol "Masuk Ruang Sesi Live" untuk langsung terhubung ke Google Meet atau Zoom.'
    },
    {
      q: 'Apakah aplikasi LESIN AJA bisa di-install di HP (PWA)?',
      a: 'Tentu saja! LESIN AJA adalah Progressive Web App. Anda dapat meng-klik tombol "Install App" pada browser Android, iOS, atau PC untuk mengaksesnya seperti aplikasi native dengan cepat.'
    }
  ];

  return (
    <div id="custom-cms-page-container" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigateTo('home')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </button>

      {/* Content Box */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
            {page.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Terakhir Diperbarui: {new Date(page.updatedAt).toLocaleDateString('id-ID')}
          </p>
        </div>

        {slug === 'faq' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Berikut kumpulan pertanyaan umum yang sering ditanyakan seputar platform belajar LESIN AJA:
            </p>

            <div className="space-y-3 pt-2">
              {faqItems.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                    >
                      <div className="flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>{item.q}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {page.content}
          </div>
        )}
      </div>
    </div>
  );
};
