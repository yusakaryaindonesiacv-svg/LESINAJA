import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Zap,
  Download,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { websiteSettings, navigateTo } = useApp();
  const [logoFailed, setLogoFailed] = React.useState(false);

  React.useEffect(() => {
    setLogoFailed(false);
  }, [websiteSettings.logoImageUrl, websiteSettings.appIconUrl]);

  return (
    <footer id="main-footer" className="bg-slate-950 text-slate-300 border-t border-slate-800 pt-6 sm:pt-12 pb-6 sm:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-8 mb-6 sm:mb-12">
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-2 space-y-2.5 sm:space-y-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {(websiteSettings.logoImageUrl || websiteSettings.appIconUrl) && !logoFailed ? (
                <img
                  src={websiteSettings.logoImageUrl || websiteSettings.appIconUrl}
                  alt={websiteSettings.siteName || 'LESIN AJA'}
                  onError={() => setLogoFailed(true)}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  loading="lazy"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-contain bg-slate-900 p-0.5 sm:p-1 border border-slate-800 shadow-md"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl text-white shadow-lg shadow-blue-500/20">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              )}
              <div>
                <span className="font-heading font-extrabold text-base sm:text-xl tracking-tight text-white">
                  {websiteSettings.logoText || 'LESIN AJA'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-blue-400 block font-bold uppercase tracking-wider">
                  {websiteSettings.siteTagline || 'Professional Learning Management System'}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm line-clamp-2 sm:line-clamp-none">
              {websiteSettings.siteDescription}
            </p>

            <div className="space-y-1 sm:space-y-2 text-[11px] sm:text-xs text-slate-400 pt-1 sm:pt-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                <span className="truncate">{websiteSettings.contactEmail}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                <span>{websiteSettings.contactPhone}</span>
              </div>
              <div className="flex items-start gap-1.5 sm:gap-2">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1 sm:line-clamp-none">{websiteSettings.contactAddress}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 space-y-2 sm:space-y-3">
            <h4 className="font-heading text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
              Navigasi
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
              <li>
                <button
                  onClick={() => navigateTo('courses')}
                  className="hover:text-blue-400 transition text-left"
                >
                  Katalog Kursus
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('live-sessions')}
                  className="hover:text-blue-400 transition text-left"
                >
                  Jadwal Sesi Live
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('verify-certificate')}
                  className="hover:text-blue-400 transition text-left"
                >
                  Verifikasi Sertifikat
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="hover:text-blue-400 transition text-left"
                >
                  Portal Siswa
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('admin')}
                  className="hover:text-blue-400 transition text-left"
                >
                  Panel Admin
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="col-span-1 space-y-2 sm:space-y-3">
            <h4 className="font-heading text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
              Kategori
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
              <li>
                <button
                  onClick={() => navigateTo('courses', { category: 'Web & Mobile Dev' })}
                  className="hover:text-blue-400 transition text-left"
                >
                  Web & Mobile Dev
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('courses', { category: 'Data Science & AI' })}
                  className="hover:text-blue-400 transition text-left"
                >
                  Data Science & AI
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('courses', { category: 'Desain Grafis & UI/UX' })}
                  className="hover:text-blue-400 transition text-left"
                >
                  UI/UX & Figma
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('courses', { category: 'Digital Marketing & Bisnis' })}
                  className="hover:text-blue-400 transition text-left"
                >
                  Digital Marketing
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('courses', { category: 'Bahasa Asing' })}
                  className="hover:text-blue-400 transition text-left"
                >
                  Bahasa & TOEFL
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Integration Badges */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 space-y-2 sm:space-y-4 pt-1 sm:pt-0">
            <h4 className="font-heading text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
              Halaman & Info
            </h4>
            <div className="flex flex-wrap sm:flex-col gap-2 sm:gap-2 text-[11px] sm:text-xs">
              <button
                onClick={() => navigateTo('custom-page', { slug: 'tentang-kami' })}
                className="hover:text-blue-400 transition text-left"
              >
                Tentang Kami
              </button>
              <span className="text-slate-600 sm:hidden">•</span>
              <button
                onClick={() => navigateTo('custom-page', { slug: 'syarat-ketentuan' })}
                className="hover:text-blue-400 transition text-left"
              >
                Syarat & Ketentuan
              </button>
              <span className="text-slate-600 sm:hidden">•</span>
              <button
                onClick={() => navigateTo('custom-page', { slug: 'faq' })}
                className="hover:text-blue-400 transition text-left"
              >
                Tanya Jawab (FAQ)
              </button>
            </div>

            <div className="pt-1">
              <div className="flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 bg-blue-600/10 rounded text-[9px] sm:text-[10px] font-bold text-blue-400 border border-blue-500/20">
                  Pakasir Gateway
                </span>
                <span className="px-1.5 py-0.5 bg-slate-900 rounded text-[9px] sm:text-[10px] font-bold text-emerald-400 border border-slate-800">
                  QRIS Instant
                </span>
                <span className="px-1.5 py-0.5 bg-slate-900 rounded text-[9px] sm:text-[10px] font-bold text-blue-400 border border-slate-800">
                  Supabase DB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-4 sm:pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-400 text-center sm:text-left">
          <p>{websiteSettings.footerCopyright}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> PWA Ready
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-blue-400 font-medium">Sync Google Sheets & Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
