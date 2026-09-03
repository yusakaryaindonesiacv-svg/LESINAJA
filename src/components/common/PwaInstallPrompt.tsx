import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  X,
  Smartphone,
  Share,
  PlusSquare,
  Sparkles,
  CheckCircle,
  GraduationCap
} from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const { websiteSettings, showToast } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone / PWA installed mode
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isRunningStandalone);

    // If already installed as PWA, don't show the prompt
    if (isRunningStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Detect mobile screen or user agent
    const isMobile = isIosDevice || /android|webos|blackberry|iemobile|opera mini/i.test(userAgent) || window.innerWidth <= 768;

    // Capture standard PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Auto-show install prompt on mobile
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If on mobile and no beforeinstallprompt triggered within 1.5s, still show install notification for mobile users
    const timer = setTimeout(() => {
      if (isMobile && !isRunningStandalone) {
        setIsVisible(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('🎉 Aplikasi LESIN AJA berhasil dipasang di layar utama ponsel Anda!');
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      // Show iOS step-by-step installation instructions
      setIsIosModalOpen(true);
    } else {
      // Fallback guide for Android / other mobile browsers
      showToast('💡 Buka menu browser (titik tiga) lalu pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama".');
    }
  };

  if (isStandalone || !isVisible) return null;

  const appIcon = websiteSettings.logoImageUrl || websiteSettings.appIconUrl;

  return (
    <>
      {/* Mobile Floating Install Banner */}
      <div
        id="pwa-mobile-install-banner"
        className="fixed top-3 left-3 right-3 sm:top-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in fade-in slide-in-from-top-4 duration-300"
      >
        <div className="bg-slate-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-blue-500/40 backdrop-blur-xl flex items-center justify-between gap-3">
          {/* App Icon */}
          <div className="shrink-0 relative">
            {appIcon ? (
              <img
                src={appIcon}
                alt="App Icon"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="w-12 h-12 rounded-xl object-contain bg-slate-800 p-1 border border-slate-700 shadow-md ring-2 ring-blue-500/40"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md ring-2 ring-blue-500/40">
                <GraduationCap className="w-6 h-6" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[9px]">
              ✓
            </span>
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-xs sm:text-sm text-white truncate">
                {websiteSettings.siteName || 'LESIN AJA'}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight mt-0.5 line-clamp-1">
              Pasang di Layar Ponsel & Belajar Lebih Cepat
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="pwa-install-action-btn"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-blue-500/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 animate-pulse"
            >
              <Download className="w-3.5 h-3.5" />
              <span>INSTALL</span>
            </button>
            <button
              id="pwa-dismiss-btn"
              onClick={() => setIsVisible(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {isIosModalOpen && (
        <div
          id="ios-pwa-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-700 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="font-heading font-extrabold text-base">
                  Cara Install di iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => setIsIosModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ikuti 3 langkah mudah berikut untuk menambahkan aplikasi <strong>{websiteSettings.siteName || 'LESIN AJA'}</strong> ke layar utama iPhone Anda:
            </p>

            <div className="space-y-3 pt-1">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Ketuk tombol Bagikan (Share)</span>
                    <Share className="w-3.5 h-3.5 text-blue-400 inline" />
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ikon kotak berpanah ke atas di bagian bawah layar browser Safari.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Pilih "Tambahkan ke Layar Utama"</span>
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" />
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gulir ke bawah pada menu pop-up dan klik "Add to Home Screen".
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <p className="font-bold text-white">
                    Ketuk "Tambah" (Add) di Pojok Kanan Atas
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ikon aplikasi akan langsung tampil di layar depan handphone Anda!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsIosModalOpen(false);
                setIsVisible(false);
              }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
