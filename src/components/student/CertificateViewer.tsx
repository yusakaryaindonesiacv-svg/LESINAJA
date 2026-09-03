import React, { useRef, useState, useEffect } from 'react';
import { Certificate, CertificateDesignSettings } from '../../types';
import { useApp } from '../../context/AppContext';
import { DEFAULT_CERTIFICATE_DESIGN } from '../../data/mockData';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import {
  Award,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Lock,
  Copy,
  Star,
  GraduationCap,
  Download,
  FileImage,
  FileText,
  Smartphone,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Sliders
} from 'lucide-react';

interface CertificateViewerProps {
  certificate: Certificate;
  onBack?: () => void;
}

/**
 * Ultra-Realistic 3D Gold Seal of Authenticity ("RESMI & VALID")
 */
const AuthenticitySeal3D: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-center cursor-pointer group select-none transition-transform duration-300 hover:scale-105"
      title="Klik untuk verifikasi keaslian dokumen 3D"
    >
      <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
        {/* Hanging Satin Ribbons below the medal */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-28 sm:w-32 flex justify-center gap-1.5 pointer-events-none z-0">
          {/* Left Ribbon */}
          <div
            className="w-8 sm:w-9 h-16 sm:h-20 bg-gradient-to-b from-blue-950 via-blue-900 to-slate-950 border-x-2 border-amber-400 shadow-2xl transform -rotate-12 -translate-x-2.5 origin-top relative overflow-hidden"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
              filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.5))'
            }}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1.5 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 opacity-80" />
            <div className="w-full h-full bg-gradient-to-r from-black/30 via-white/20 to-black/30" />
          </div>
          {/* Right Ribbon */}
          <div
            className="w-8 sm:w-9 h-16 sm:h-20 bg-gradient-to-b from-blue-950 via-blue-900 to-slate-950 border-x-2 border-amber-400 shadow-2xl transform rotate-12 translate-x-2.5 origin-top relative overflow-hidden"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
              filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.5))'
            }}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1.5 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 opacity-80" />
            <div className="w-full h-full bg-gradient-to-r from-black/30 via-white/20 to-black/30" />
          </div>
        </div>

        {/* 3D Realistic Embossed Medallion Disc */}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full relative z-10 filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]"
        >
          <defs>
            <radialGradient id="real-gold-radial" cx="32%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="15%" stopColor="#fff8db" />
              <stop offset="35%" stopColor="#f5c756" />
              <stop offset="60%" stopColor="#c68a1b" />
              <stop offset="85%" stopColor="#8d5403" />
              <stop offset="100%" stopColor="#4e2c00" />
            </radialGradient>

            <linearGradient id="real-gold-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="20%" stopColor="#fde047" />
              <stop offset="45%" stopColor="#b45309" />
              <stop offset="65%" stopColor="#fef08a" />
              <stop offset="85%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>

            <linearGradient id="real-bevel-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
            </linearGradient>

            <radialGradient id="real-inner-core" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            <path id="seal-text-top-3d" d="M 30,100 A 70,70 0 1,1 170,100" fill="none" />
            <path id="seal-text-bottom-3d" d="M 170,100 A 70,70 0 1,1 30,100" fill="none" />
          </defs>

          {/* 32-point Outer Rosette Starburst Teeth */}
          <g transform="translate(100, 100)">
            {Array.from({ length: 32 }).map((_, i) => (
              <polygon
                key={i}
                points="0,-98 6,-84 -6,-84"
                fill="url(#real-gold-radial)"
                transform={`rotate(${i * 11.25})`}
                stroke="#713f12"
                strokeWidth="0.75"
              />
            ))}
          </g>

          <circle cx="100" cy="100" r="86" fill="url(#real-gold-radial)" stroke="#78350f" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="84" fill="none" stroke="url(#real-bevel-light)" strokeWidth="3.5" />
          <circle cx="100" cy="100" r="77" fill="#582900" />
          <circle cx="100" cy="100" r="76" fill="url(#real-gold-metallic)" />
          <circle cx="100" cy="100" r="63" fill="none" stroke="#78350f" strokeWidth="1.5" strokeDasharray="3,2" />

          <text
            fontSize="9"
            fontFamily="'Montserrat', sans-serif"
            fontWeight="900"
            letterSpacing="2.5"
            fill="#3b1d00"
            style={{ filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.85))' }}
          >
            <textPath href="#seal-text-top-3d" startOffset="50%" textAnchor="middle">
              ★ RESMI & VALID ★
            </textPath>
          </text>
          <text
            fontSize="7.5"
            fontFamily="'Montserrat', sans-serif"
            fontWeight="900"
            letterSpacing="1.8"
            fill="#3b1d00"
            style={{ filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.85))' }}
          >
            <textPath href="#seal-text-bottom-3d" startOffset="50%" textAnchor="middle">
              ★ KEASLIAN TERJAMIN 100% ★
            </textPath>
          </text>

          <circle cx="100" cy="100" r="51" fill="url(#real-inner-core)" stroke="url(#real-gold-metallic)" strokeWidth="3" />
          <circle cx="100" cy="100" r="49" fill="none" stroke="#fef08a" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.75" />

          <g transform="translate(100, 96)">
            <path d="M -23,13 C -28,5 -26,-9 -20,-19 C -18,-13 -20,-4 -15,7 Z" fill="url(#real-gold-metallic)" />
            <path d="M -19,19 C -28,15 -30,4 -28,-5 C -24,-3 -22,6 -13,13 Z" fill="url(#real-gold-metallic)" />
            <path d="M 23,13 C 28,5 26,-9 20,-19 C 18,-13 20,-4 15,7 Z" fill="url(#real-gold-metallic)" />
            <path d="M 19,19 C 28,15 30,4 28,-5 C 24,-3 22,6 13,13 Z" fill="url(#real-gold-metallic)" />

            <path
              d="M 0,-26 L 18,-15 L 18,5 C 18,18 9,27 0,31 C -9,27 -18,18 -18,5 L -18,-15 Z"
              fill="url(#real-gold-radial)"
              stroke="#3b1d00"
              strokeWidth="1.2"
              filter="drop-shadow(0 3px 5px rgba(0,0,0,0.6))"
            />
            <path d="M 0,-22 L 14,-13 L 14,4 C 14,15 7,22 0,26 C -7,22 -14,15 -14,4 L -14,-13 Z" fill="#090d16" />
            <path
              d="M -7,2 L -2,7 L 8,-4"
              fill="none"
              stroke="url(#real-gold-radial)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
            />
            <polygon
              points="0,-30 2.5,-24 8,-24 3.5,-20.5 5.5,-15 0,-18.5 -5.5,-15 -3.5,-20.5 -8,-24 -2.5,-24"
              fill="#fff9d2"
              stroke="#78350f"
              strokeWidth="0.6"
            />
          </g>

          <path d="M 28,52 Q 100,12 172,52 A 86,86 0 0,0 28,52 Z" fill="url(#real-bevel-light)" opacity="0.4" pointerEvents="none" />
        </svg>

        <div className="absolute -bottom-2.5 z-20 px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 border border-amber-400/80 shadow-xl text-[8.5px] font-black tracking-widest uppercase flex items-center gap-1 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
          <Sparkles className="w-2.5 h-2.5 text-amber-400 group-hover:text-slate-950" />
          <span>RESMI & VALID 3D</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Classical Baroque Corner Filigree Ornament
 */
const CornerFiligreeOrnament: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 120" className={`w-20 h-20 sm:w-28 sm:h-28 pointer-events-none ${className}`} fill="none">
    <defs>
      <linearGradient id="ornament-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff5b8" />
        <stop offset="30%" stopColor="#f59e0b" />
        <stop offset="70%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>
    <path d="M 6,114 L 6,6 L 114,6" stroke="url(#ornament-gold-grad)" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M 14,106 L 14,14 L 106,14" stroke="url(#ornament-gold-grad)" strokeWidth="1.5" strokeDasharray="3,3" />
    <path d="M 22,98 L 22,22 L 98,22" stroke="url(#ornament-gold-grad)" strokeWidth="1" />
    <path d="M 6,6 C 35,6 40,25 28,38 C 16,50 35,55 48,42 C 60,30 52,10 6,6 Z" fill="url(#ornament-gold-grad)" opacity="0.9" />
    <path d="M 32,32 C 45,32 55,42 45,55 C 35,65 50,75 65,60" stroke="url(#ornament-gold-grad)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="28" cy="28" r="5" fill="#fef08a" stroke="#78350f" strokeWidth="1" />
    <circle cx="10" cy="10" r="3.5" fill="#f59e0b" />
    <circle cx="52" cy="14" r="2.5" fill="#f59e0b" />
    <circle cx="14" cy="52" r="2.5" fill="#f59e0b" />
  </svg>
);

/**
 * Top/Bottom Center Classical Crest Filigree
 */
const CenterCrownCrest: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 200 40" className={`w-36 sm:w-52 h-7 sm:h-9 pointer-events-none ${className}`} fill="none">
    <defs>
      <linearGradient id="crown-gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="transparent" />
        <stop offset="30%" stopColor="#d97706" />
        <stop offset="50%" stopColor="#fef08a" />
        <stop offset="70%" stopColor="#d97706" />
        <stop offset="100%" stopColor="transparent" />
      </linearGradient>
    </defs>
    <path d="M 10,20 Q 70,5 90,25 Q 100,5 110,25 Q 130,5 190,20" stroke="url(#crown-gold)" strokeWidth="2" strokeLinecap="round" />
    <path d="M 30,24 Q 80,14 100,30 Q 120,14 170,24" stroke="url(#crown-gold)" strokeWidth="1" strokeDasharray="2,2" />
    <polygon points="100,6 103,13 110,14 105,19 107,26 100,22 93,26 95,19 90,14 97,13" fill="#fef08a" stroke="#78350f" strokeWidth="0.8" />
    <circle cx="60" cy="18" r="2.5" fill="#f59e0b" />
    <circle cx="140" cy="18" r="2.5" fill="#f59e0b" />
  </svg>
);

/**
 * Repeating Classical Guilloche Border Patterns along All 4 Sides
 */
const GuillochePerimeterBorders: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none select-none z-0">
    <div className="absolute top-2 sm:top-3 inset-x-24 sm:inset-x-32 h-2.5 flex items-center justify-center opacity-80">
      <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-xs" />
    </div>
    <div className="absolute bottom-2 sm:bottom-3 inset-x-24 sm:inset-x-32 h-2.5 flex items-center justify-center opacity-80">
      <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-xs" />
    </div>
    <div className="absolute left-2 sm:left-3 inset-y-24 sm:inset-y-32 w-2.5 flex items-center justify-center opacity-80">
      <div className="h-full w-[3px] bg-gradient-to-b from-transparent via-amber-500 to-transparent shadow-xs" />
    </div>
    <div className="absolute right-2 sm:right-3 inset-y-24 sm:inset-y-32 w-2.5 flex items-center justify-center opacity-80">
      <div className="h-full w-[3px] bg-gradient-to-b from-transparent via-amber-500 to-transparent shadow-xs" />
    </div>
  </div>
);

export const CertificateViewer: React.FC<CertificateViewerProps> = ({
  certificate,
  onBack
}) => {
  const { websiteSettings, certificateDesignSettings, courses, users, showToast, navigateTo } = useApp();
  const certRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [logoImageFailed, setLogoImageFailed] = useState(false);
  const [isDownloading, setIsDownloading] = useState<'png' | 'pdf' | null>(null);
  
  // Mobile landscape lock & responsive fit scale
  const [viewMode, setViewMode] = useState<'fit' | 'scroll'>('fit');
  const [scaleFactor, setScaleFactor] = useState<number>(1);

  // Active Design Settings from admin or default
  const design: CertificateDesignSettings = certificateDesignSettings || DEFAULT_CERTIFICATE_DESIGN;

  // Responsive scaling observer
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 16;
      const originalWidth = 1020;
      if (containerWidth < originalWidth && viewMode === 'fit') {
        const factor = Math.max(0.3, Math.min(1, containerWidth / originalWidth));
        setScaleFactor(factor);
      } else {
        setScaleFactor(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [viewMode]);

  // Capture unscaled full-page high-resolution certificate canvas (fixes mobile 1/9th size scale issue)
  const captureCertificateDataUrl = async (): Promise<string> => {
    if (!certRef.current) throw new Error('Certificate element not found');
    const el = certRef.current;
    
    // Save original styles
    const prevTransform = el.style.transform;
    const prevTransformOrigin = el.style.transformOrigin;

    try {
      // Temporarily remove scale transform so html-to-image captures full 1020x722 canvas
      el.style.transform = 'none';
      el.style.transformOrigin = '0 0';

      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 3.0,
        width: 1020,
        height: 722,
        backgroundColor: '#ffffff'
      });

      return dataUrl;
    } finally {
      // Restore styles immediately
      el.style.transform = prevTransform;
      el.style.transformOrigin = prevTransformOrigin;
    }
  };

  // Direct PNG Download (High-Res 3x Full Page)
  const handleDownloadPng = async () => {
    if (!certRef.current) return;
    try {
      setIsDownloading('png');
      showToast('Menyiapkan gambar sertifikat PNG beresolusi penuh (Full Page HD)...');
      
      const dataUrl = await captureCertificateDataUrl();

      const link = document.createElement('a');
      link.download = `Sertifikat-${certificate.studentName.replace(/\s+/g, '_')}-${certificate.certificateNumber}.png`;
      link.href = dataUrl;
      link.click();
      showToast('✅ Sertifikat PNG Full Page berhasil diunduh ke galeri perangkat Anda!');
    } catch (err) {
      console.error('PNG download error:', err);
      showToast('Gagal membuat gambar sertifikat. Silakan gunakan tombol Cetak/PDF.');
    } finally {
      setIsDownloading(null);
    }
  };

  // Direct PDF Download (A4 Landscape 297x210mm Full Page)
  const handleDownloadPdf = async () => {
    if (!certRef.current) return;
    try {
      setIsDownloading('pdf');
      showToast('Memproses file PDF A4 Lanskap resmi Full Page...');

      const dataUrl = await captureCertificateDataUrl();

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
      pdf.save(`Sertifikat-Resmi-${certificate.studentName.replace(/\s+/g, '_')}-${certificate.certificateNumber}.pdf`);
      showToast('✅ Sertifikat PDF resmi A4 Full Page berhasil diunduh!');
    } catch (err) {
      console.error('PDF download error:', err);
      showToast('Gagal mengekspor PDF. Membuka jendela dialog cetak sistem...');
      window.print();
    } finally {
      setIsDownloading(null);
    }
  };

  const handlePrint = async () => {
    if (!certRef.current) {
      window.print();
      return;
    }
    try {
      setIsDownloading('png');
      showToast('Menyiapkan dokumen cetak khusus sertifikat Full Page...');

      const dataUrl = await captureCertificateDataUrl();

      // Create isolated printing iframe to guarantee only the certificate is printed
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Sertifikat-${certificate.studentName.replace(/\s+/g, '_')}-${certificate.certificateNumber}</title>
    <style>
      @page {
        size: A4 landscape;
        margin: 0;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      img {
        width: 100vw;
        height: 100vh;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    </style>
  </head>
  <body>
    <img src="${dataUrl}" alt="Sertifikat Resmi" />
  </body>
</html>`);
        frameDoc.close();

        const img = frameDoc.querySelector('img');
        const triggerIframePrint = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            window.print();
          }
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 30000);
        };

        if (img?.complete) {
          triggerIframePrint();
        } else if (img) {
          img.onload = triggerIframePrint;
          img.onerror = () => {
            window.print();
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          };
        } else {
          triggerIframePrint();
        }
        showToast('✅ Membuka dialog cetak khusus dokumen sertifikat!');
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Print error:', err);
      window.print();
    } finally {
      setIsDownloading(null);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `E-Sertifikat Resmi ${websiteSettings.siteName || 'LESIN AJA'} - ${certificate.studentName}`,
        text: `Saya telah menyelesaikan kursus "${certificate.courseTitle}" dan memperoleh E-Sertifikat Terverifikasi resmi dari ${websiteSettings.siteName || 'LESIN AJA'}!`,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      showToast('Tautan verifikasi sertifikat berhasil disalin ke clipboard!');
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(certificate.verificationHash || certificate.certificateNumber);
    showToast('Hash verifikasi kriptografi berhasil disalin!');
  };

  const appLogoUrl =
    design.syncAppLogo !== false
      ? (websiteSettings.logoImageUrl || websiteSettings.appIconUrl || design.customLogoImageUrl)
      : (design.customLogoImageUrl || websiteSettings.logoImageUrl || websiteSettings.appIconUrl);

  // Find matching course for automatic instructor determination
  const matchedCourse = courses.find(
    c => c.id === certificate.courseId || (c.title && c.title.toLowerCase() === (certificate.courseTitle || '').toLowerCase())
  );

  // 1. Resolve raw instructor name:
  // - If useCourseInstructor is active (default true): prioritizes course instructor name
  // - Otherwise if admin explicitly set a custom override name, uses leadInstructorName
  const courseInstructorName =
    matchedCourse?.instructor?.name ||
    certificate.instructorName ||
    'Dr. Aris Prasetyo, M.Kom.';

  const resolvedInstructorRaw =
    design.useCourseInstructor !== false || !design.leadInstructorName
      ? courseInstructorName
      : (design.leadInstructorName || design.signatureName || courseInstructorName);

  // 2. Strict sanitization: ensure ONLY 1 single person name (clean accidental secondary names)
  const sanitizeSingleName = (nameStr: string): string => {
    if (!nameStr) return 'Instruktur Utama';
    // If the string contains " & " or " and " or " / ", take the first instructor
    const splitAmpersand = nameStr.split(/\s+(?:&|and|dan|\/)\s+/i)[0].trim();
    return splitAmpersand || nameStr;
  };

  const instructorCleanName = sanitizeSingleName(resolvedInstructorRaw);

  // 3. Resolve instructor title:
  const courseInstructorTitle =
    matchedCourse?.instructor?.title ||
    certificate.instructorTitle ||
    'Master Instructor & Penanggung Jawab Kursus';

  const instructorTitle =
    design.useCourseInstructor !== false || !design.leadInstructorTitle
      ? (courseInstructorTitle || 'Master Instructor')
      : (design.leadInstructorTitle || design.signatureTitle || courseInstructorTitle || 'Master Instructor');

  const courseInstructorUser = users?.find(
    u => (matchedCourse?.instructorId && u.id === matchedCourse.instructorId) || (matchedCourse?.instructor?.id && u.id === matchedCourse.instructor.id) || (u.name && u.name.toLowerCase() === courseInstructorName.toLowerCase())
  );

  const resolvedSignatureImageUrl =
    matchedCourse?.signatureUrl ||
    matchedCourse?.instructor?.signatureUrl ||
    courseInstructorUser?.signatureUrl ||
    certificate.signatureUrl ||
    design.signatureImageUrl;

  return (
    <div id="certificate-viewer-page" className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4">
      {/* Top Action Toolbar (Hidden during Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <button
              onClick={() => navigateTo('my-certificates')}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Daftar Sertifikat</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Dokumen Asli Terverifikasi</span>
          </div>
        </div>

        {/* Action Controls & Download Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Download PNG Button */}
          <button
            id="download-cert-png-btn"
            onClick={handleDownloadPng}
            disabled={isDownloading !== null}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isDownloading === 'png' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FileImage className="w-4 h-4 text-emerald-200" />
            )}
            <span>Download PNG</span>
          </button>

          {/* Download PDF Button */}
          <button
            id="download-cert-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={isDownloading !== null}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isDownloading === 'pdf' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FileText className="w-4 h-4 text-rose-200" />
            )}
            <span>Download PDF (A4)</span>
          </button>

          {/* Print Button */}
          <button
            id="print-cert-btn"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          {/* Audit Modal Button */}
          <button
            onClick={() => setShowSecurityModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden md:inline">Audit</span> Keaslian
          </button>

          {/* Share Button */}
          <button
            id="share-cert-btn"
            onClick={handleShare}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan</span>
          </button>
        </div>
      </div>

      {/* Landscape Lock & Mobile View Guide Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 print:hidden">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Format Dikunci Standar A4 Lanskap:</strong> Sertifikat selalu mempertahankan proporsi resmi horizontal (tidak berubah vertikal di HP).
          </span>
        </div>

        {/* View Toggle on Mobile */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(prev => (prev === 'fit' ? 'scroll' : 'fit'))}
            className="px-3 py-1 rounded-lg bg-amber-200/80 dark:bg-amber-950/80 text-amber-950 dark:text-amber-300 text-[11px] font-black border border-amber-400/40 flex items-center gap-1.5 cursor-pointer transition hover:bg-amber-300"
          >
            {viewMode === 'fit' ? (
              <>
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom 100% (Scroll)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Pas Layar HP (Fit)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCROLL/VIEWPORT WRAPPER FOR IDENTICAL LANDSCAPE RATIO ACROSS ALL DEVICES  */}
      {/* ========================================================================= */}
      <div
        ref={containerRef}
        className={`w-full ${viewMode === 'scroll' ? 'overflow-x-auto' : 'overflow-hidden'} pb-6 pt-1 flex justify-center custom-scrollbar`}
        style={
          viewMode === 'fit' && scaleFactor < 1
            ? {
                height: `${722 * scaleFactor + 20}px`
              }
            : undefined
        }
      >
        {/* Fixed Standard Landscape Canvas (Aspect Ratio 1.414 : 1 A4 Landscape 1020px x 722px) */}
        <div
          ref={certRef}
          id="printable-certificate-document"
          className="relative bg-[#fbfbfa] text-slate-950 rounded-2xl p-10 lg:p-14 shadow-2xl overflow-hidden select-none w-[1020px] min-w-[1020px] h-[722px] flex flex-col justify-between"
          style={{
            transform: viewMode === 'fit' && scaleFactor < 1 ? `scale(${scaleFactor})` : undefined,
            transformOrigin: 'top center',
            borderWidth: `${design.borderThickness || 14}px`,
            borderColor: design.primaryColor || '#0f172a',
            borderStyle: 'solid',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), inset 0 0 120px rgba(217, 119, 6, 0.06)'
          }}
        >
          {/* Multi-tier Ornamental Perimeter Frames */}
          {design.showCornerOrnaments && (
            <>
              <div className="absolute inset-2.5 border-2 border-amber-500 pointer-events-none rounded-lg" />
              <div className="absolute inset-4 border border-dashed border-amber-600/60 pointer-events-none rounded-md" />
              <div className="absolute inset-5.5 border border-slate-900/20 pointer-events-none rounded-sm" />
            </>
          )}

          {/* Perimeter Guilloche Lines on all 4 Edges */}
          {design.showGuillocheBorder && <GuillochePerimeterBorders />}

          {/* Security Micro-Pattern Guilloché Background */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, #0f172a 12%, transparent 13%), radial-gradient(circle at 0% 50%, #b45309 12%, transparent 13%), radial-gradient(circle at 100% 50%, #b45309 12%, transparent 13%)`,
              backgroundSize: '28px 28px'
            }}
          />

          {/* Center Watermark Crest or Custom Watermark */}
          {design.showWatermark && (
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
              {design.customWatermarkImageUrl ? (
                <img
                  src={design.customWatermarkImageUrl}
                  alt="Watermark"
                  className="w-[380px] h-[380px] object-contain"
                />
              ) : (
                <Award className="w-[380px] h-[380px] text-amber-700" />
              )}
            </div>
          )}

          {/* Top and Bottom Center Crown Filigrees */}
          {design.showCornerOrnaments && (
            <>
              <CenterCrownCrest className="absolute top-2 left-1/2 -translate-x-1/2" />
              <CenterCrownCrest className="absolute bottom-2 left-1/2 -translate-x-1/2 transform rotate-180" />
              <CornerFiligreeOrnament className="absolute top-3 left-3" />
              <CornerFiligreeOrnament className="absolute top-3 right-3 transform scale-x-[-1]" />
              <CornerFiligreeOrnament className="absolute bottom-3 left-3 transform scale-y-[-1]" />
              <CornerFiligreeOrnament className="absolute bottom-3 right-3 transform scale-x-[-1] scale-y-[-1]" />
            </>
          )}

          {/* ===================================================================== */}
          {/* Certificate Inner Body (Fixed Landscape Layout)                       */}
          {/* ===================================================================== */}
          <div className="relative z-10 text-center space-y-3 max-w-4xl mx-auto my-auto w-full">
            {/* 1. Official Header with App Logo & Official Institution Branding */}
            <div className="space-y-1.5">
              {/* Application Logo & Brand */}
              <div
                style={{
                  transform: `translate(${design.elementOffsets?.logo?.x || 0}px, ${
                    design.elementOffsets?.logo?.y || 0
                  }px) scale(${design.elementOffsets?.logo?.scale || 1})`,
                  transformOrigin: 'center center',
                  display: design.elementOffsets?.logo?.visible === false ? 'none' : 'flex'
                }}
                className="items-center justify-center gap-4"
              >
                {/* Application Logo */}
                {appLogoUrl && !logoImageFailed ? (
                  <div
                    className="relative rounded-2xl bg-white shadow-lg border-2 border-amber-500 flex items-center justify-center p-1.5"
                    style={{ height: `${design.logoSize || 52}px` }}
                  >
                    <img
                      src={appLogoUrl}
                      alt={websiteSettings.siteName || 'LESIN AJA'}
                      onError={() => setLogoImageFailed(true)}
                      style={{ height: `${(design.logoSize || 52) - 10}px` }}
                      className="object-contain rounded-xl"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl bg-gradient-to-br from-blue-950 to-slate-950 border-2 border-amber-400 p-2 shadow-lg flex items-center justify-center text-amber-400"
                    style={{ height: `${design.logoSize || 52}px`, width: `${design.logoSize || 52}px` }}
                  >
                    <GraduationCap className="w-full h-full" />
                  </div>
                )}

                <div className="text-left shrink-0">
                  <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
                    <h2
                      className="font-black text-2xl lg:text-3xl tracking-widest text-slate-950 uppercase whitespace-nowrap"
                      style={{
                        fontFamily: "'Cinzel', 'Montserrat', serif",
                        letterSpacing: '0.12em',
                        whiteSpace: 'nowrap',
                        color: design.primaryColor || '#0f172a'
                      }}
                    >
                      {design.institutionName || websiteSettings.siteName || websiteSettings.logoText || 'LESIN AJA'}
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs border border-amber-300 whitespace-nowrap shrink-0">
                      RESMI
                    </span>
                  </div>
                  <p
                    className="text-xs font-black tracking-[0.18em] uppercase text-amber-800 whitespace-nowrap"
                    style={{ fontFamily: "'Montserrat', sans-serif", whiteSpace: 'nowrap' }}
                  >
                    {design.institutionTagline || 'LEMBAGA PENDIDIKAN & SERTIFIKASI KOMPETENSI RESMI'}
                  </p>
                  <p className="text-[9.5px] text-slate-600 font-medium whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                    Terdaftar & Terverifikasi pada Basis Data Sertifikasi Digital Nasional
                  </p>
                </div>
              </div>

              {/* Classical Certificate Title Banner */}
              <div
                className="pt-0.5"
                style={{
                  transform: `translate(${design.elementOffsets?.header_title?.x || 0}px, ${
                    design.elementOffsets?.header_title?.y || 0
                  }px) scale(${design.elementOffsets?.header_title?.scale || 1})`,
                  transformOrigin: 'center center',
                  display: design.elementOffsets?.header_title?.visible === false ? 'none' : 'block'
                }}
              >
                <div className="inline-block relative">
                  <div
                    className="px-10 py-1.5 rounded-xl shadow-xl border-2 border-amber-400"
                    style={{
                      background: `linear-gradient(135deg, ${design.primaryColor || '#0f172a'}, #1e293b, ${design.primaryColor || '#0f172a'})`
                    }}
                  >
                    <h3
                      className="font-black text-xl lg:text-2xl tracking-[0.22em] text-amber-300 uppercase [text-shadow:_0_2px_4px_rgba(0,0,0,0.8)]"
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: design.headerTitleFontSize ? `${design.headerTitleFontSize}px` : undefined
                      }}
                    >
                      {design.certificateTitle || 'SERTIFIKAT KELULUSAN & KOMPETENSI'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Subtitle */}
              <div
                style={{
                  transform: `translate(${design.elementOffsets?.subtitle?.x || 0}px, ${
                    design.elementOffsets?.subtitle?.y || 0
                  }px) scale(${design.elementOffsets?.subtitle?.scale || 1})`,
                  transformOrigin: 'center center',
                  display: design.elementOffsets?.subtitle?.visible === false ? 'none' : 'block'
                }}
              >
                <p
                  className="text-[11px] font-bold text-slate-600 mt-1 tracking-[0.2em] uppercase"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: design.subtitleFontSize ? `${design.subtitleFontSize}px` : undefined
                  }}
                >
                  {design.certificateSubtitle || 'CERTIFICATE OF COMPLETION & PROFESSIONAL MASTERY'}
                </p>
              </div>

              {/* Serial Number Strip */}
              <div
                style={{
                  transform: `translate(${design.elementOffsets?.reg_strip?.x || 0}px, ${
                    design.elementOffsets?.reg_strip?.y || 0
                  }px) scale(${design.elementOffsets?.reg_strip?.scale || 1})`,
                  transformOrigin: 'center center',
                  display: design.elementOffsets?.reg_strip?.visible === false ? 'none' : 'inline-flex'
                }}
                className="items-center justify-center gap-2 text-xs font-mono font-bold text-slate-700 bg-amber-50 border border-amber-400/60 px-4 py-0.5 rounded-full shadow-xs whitespace-nowrap"
              >
                <span
                  className="text-amber-800 whitespace-nowrap"
                  style={{ fontSize: design.regStripFontSize ? `${design.regStripFontSize}px` : undefined }}
                >
                  No. Registrasi:
                </span>
                <strong
                  className="text-slate-950 whitespace-nowrap"
                  style={{ fontSize: design.regStripFontSize ? `${design.regStripFontSize}px` : undefined }}
                >
                  {certificate.certificateNumber}
                </strong>
              </div>
            </div>

            {/* 2. Recipient Presentation with Bold Display Serif */}
            <div
              className="space-y-1 pt-0.5"
              style={{
                transform: `translate(${design.elementOffsets?.recipient_name?.x || 0}px, ${
                  design.elementOffsets?.recipient_name?.y || 0
                }px) scale(${design.elementOffsets?.recipient_name?.scale || 1})`,
                transformOrigin: 'center center',
                display: design.elementOffsets?.recipient_name?.visible === false ? 'none' : 'block'
              }}
            >
              <p className="text-xs font-medium italic text-slate-600" style={{ fontFamily: "'Playfair Display', serif" }}>
                Diberikan dengan bangga dan penuh penghargaan kepada:
              </p>
              <div className="relative inline-block px-4">
                <h1
                  className="font-black text-4xl lg:text-5xl text-slate-950 tracking-tight capitalize leading-tight"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: 900,
                    textShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    color: design.primaryColor || '#0f172a',
                    fontSize: design.recipientNameFontSize ? `${design.recipientNameFontSize}px` : undefined
                  }}
                >
                  {certificate.studentName}
                </h1>
                {/* Golden Accent Divider */}
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="w-24 h-[2.5px] bg-gradient-to-r from-transparent via-amber-500 to-amber-600" />
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <div className="w-24 h-[2.5px] bg-gradient-to-l from-transparent via-amber-500 to-amber-600" />
                </div>
              </div>
            </div>

            {/* 3. Course Citation & Competency Narrative */}
            <div
              className="space-y-2 max-w-2xl mx-auto pt-0.5"
              style={{
                transform: `translate(${design.elementOffsets?.course_title?.x || 0}px, ${
                  design.elementOffsets?.course_title?.y || 0
                }px) scale(${design.elementOffsets?.course_title?.scale || 1})`,
                transformOrigin: 'center center',
                display: design.elementOffsets?.course_title?.visible === false ? 'none' : 'block'
              }}
            >
              <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                Atas keberhasilannya menyelesaikan seluruh rangkaian kurikulum, materi video interaktif, penugasan praktik, dan dinyatakan lulus evaluasi standar industri pada program keahlian:
              </p>

              {/* Course Title Plaque */}
              <div
                className="relative p-2.5 rounded-xl text-white shadow-xl border-2 border-amber-400 max-w-xl mx-auto"
                style={{
                  background: `linear-gradient(135deg, ${design.primaryColor || '#0f172a'}, #1e293b, ${design.primaryColor || '#0f172a'})`
                }}
              >
                <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <h4
                  className="font-black text-lg lg:text-xl text-white tracking-wide uppercase"
                  style={{
                    fontFamily: "'Montserrat', 'Cinzel', sans-serif",
                    fontSize: design.courseTitleFontSize ? `${design.courseTitleFontSize}px` : undefined
                  }}
                >
                  {certificate.courseTitle}
                </h4>
              </div>

              {/* Grade & Score Highlights */}
              <div className="flex items-center justify-center gap-3 pt-0.5">
                <span className="px-4 py-1 rounded-lg bg-emerald-100 border border-emerald-500 text-emerald-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Predikat: {certificate.grade}</span>
                </span>
                <span className="px-4 py-1 rounded-lg bg-blue-100 border border-blue-500 text-blue-950 text-xs font-black uppercase tracking-wider shadow-xs">
                  Skor Akhir: {certificate.score}%
                </span>
                <span className="px-4 py-1 rounded-lg bg-amber-100 border border-amber-500 text-amber-950 text-xs font-black uppercase tracking-wider shadow-xs">
                  Status: KOMPETEN
                </span>
              </div>
            </div>

            {/* 4. Verification Row: Fixed 3-column layout (QR Code, 3D Gold Seal, Single Straight Instructor) */}
            <div className="pt-3 grid grid-cols-3 items-end gap-6 border-t-2 border-amber-600/40 mt-3">
              {/* Left Column: Dynamic Verification QR Code */}
              <div
                style={{
                  transform: `translate(${design.elementOffsets?.qr_code?.x || 0}px, ${
                    design.elementOffsets?.qr_code?.y || 0
                  }px) scale(${design.elementOffsets?.qr_code?.scale || 1})`,
                  transformOrigin: 'bottom left',
                  display: design.elementOffsets?.qr_code?.visible === false ? 'none' : 'flex'
                }}
                className="flex flex-col items-start text-left space-y-1"
              >
                <div className="p-1.5 bg-white border-2 border-slate-900 rounded-xl shadow-md inline-block">
                  <QRCodeSVG
                    value={`VERIFIED_${websiteSettings.siteName || 'LESIN_AJA'}_CERT_${certificate.certificateNumber}_${certificate.verificationHash}`}
                    size={design.qrCodeSize || 64}
                    level="H"
                  />
                </div>
                <p className="text-[9.5px] text-slate-700 font-mono font-bold leading-tight max-w-[170px]">
                  Pindai QR untuk verifikasi keaslian di server resmi
                </p>
                <p className="text-[9.5px] font-bold text-slate-500">
                  Diterbitkan: {certificate.issueDate}
                </p>
              </div>

              {/* Center Column: Ultra-Realistic 3D Gold Seal or Custom Seal */}
              <div
                style={{
                  transform: `translate(${design.elementOffsets?.seal_medallion?.x || 0}px, ${
                    design.elementOffsets?.seal_medallion?.y || 0
                  }px) scale(${design.elementOffsets?.seal_medallion?.scale || 1})`,
                  transformOrigin: 'bottom center',
                  display: design.elementOffsets?.seal_medallion?.visible === false ? 'none' : 'flex'
                }}
                className="flex flex-col items-center justify-center"
              >
                {design.showGoldSeal && (
                  design.customSealImageUrl ? (
                    <img
                      src={design.customSealImageUrl}
                      alt="Segel Keaslian"
                      style={{ width: `${design.sealSize || 80}px`, height: `${design.sealSize || 80}px` }}
                      className="object-contain drop-shadow-xl cursor-pointer hover:scale-105 transition"
                      onClick={() => setShowSecurityModal(true)}
                    />
                  ) : (
                    <AuthenticitySeal3D onClick={() => setShowSecurityModal(true)} />
                  )
                )}
              </div>

              {/* Right Column: Lead Master Instructor Signature Block (Separated Elements) */}
              <div className="flex flex-col items-end text-right space-y-1 w-60">
                {/* 1. Tempat (Kota) & Tanggal Penandatanganan */}
                {design.showIssueCityDate !== false && (
                  <div
                    style={{
                      transform: `translate(${
                        design.elementOffsets?.issue_place_date?.x ?? design.elementOffsets?.lead_signature?.x ?? 0
                      }px, ${
                        design.elementOffsets?.issue_place_date?.y ?? design.elementOffsets?.lead_signature?.y ?? 0
                      }px) scale(${design.elementOffsets?.issue_place_date?.scale || 1})`,
                      transformOrigin: 'bottom right',
                      display: design.elementOffsets?.issue_place_date?.visible === false ? 'none' : 'block'
                    }}
                  >
                    <p
                      className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 pb-0.5"
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: `${design.issueDateFontSize || 11}px`
                      }}
                    >
                      {design.issueCity || 'Jakarta'}, {certificate.issueDate}
                    </p>
                  </div>
                )}

                {/* 2. Teks LEAD MASTER INSTRUCTOR (Di bawah Tempat/Tanggal, Di atas Tanda Tangan) */}
                <div
                  style={{
                    transform: `translate(${design.elementOffsets?.instructor_title?.x || 0}px, ${
                      design.elementOffsets?.instructor_title?.y || 0
                    }px) scale(${design.elementOffsets?.instructor_title?.scale || 1})`,
                    transformOrigin: 'bottom right',
                    display: design.elementOffsets?.instructor_title?.visible === false ? 'none' : 'block'
                  }}
                >
                  <p
                    className="font-black text-amber-800 uppercase tracking-wider leading-tight"
                    style={{
                      fontSize: `${design.instructorTitleFontSize || 11}px`,
                      fontFamily: "'Montserrat', sans-serif"
                    }}
                  >
                    {instructorTitle}
                  </p>
                </div>

                {/* 3. Tanda Tangan */}
                <div
                  style={{
                    transform: `translate(${design.elementOffsets?.signature_drawing?.x || 0}px, ${
                      design.elementOffsets?.signature_drawing?.y || 0
                    }px) scale(${design.elementOffsets?.signature_drawing?.scale || 1})`,
                    transformOrigin: 'bottom right',
                    display: design.elementOffsets?.signature_drawing?.visible === false ? 'none' : 'flex'
                  }}
                  className="items-center justify-end w-full"
                >
                  <div
                    className="flex items-center justify-end w-full pr-1"
                    style={{ height: `${design.signatureHeight || 40}px` }}
                  >
                    {resolvedSignatureImageUrl ? (
                      <img
                        src={resolvedSignatureImageUrl}
                        alt="Tanda Tangan Instruktur"
                        style={{ maxHeight: `${design.signatureHeight || 40}px` }}
                        className="object-contain"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 160 40"
                        style={{ height: `${design.signatureHeight || 40}px` }}
                        className="w-36 text-blue-950 pointer-events-none"
                        fill="none"
                      >
                        <path
                          d="M 10,28 C 30,10 50,35 70,18 C 90,5 110,30 130,15 C 145,2 155,20 160,25"
                          stroke="#1e3a8a"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M 25,32 C 60,28 100,32 150,30"
                          stroke="#1e3a8a"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* 4. Garis Pembatas */}
                <div
                  style={{
                    transform: `translate(${design.elementOffsets?.signature_line?.x || 0}px, ${
                      design.elementOffsets?.signature_line?.y || 0
                    }px) scale(${design.elementOffsets?.signature_line?.scale || 1})`,
                    transformOrigin: 'bottom right',
                    display: design.elementOffsets?.signature_line?.visible === false ? 'none' : 'flex'
                  }}
                  className="justify-end w-full"
                >
                  <div
                    style={{
                      width: `${design.signatureLineWidth || 200}px`,
                      borderBottomWidth: `${design.signatureLineThickness || 2}px`
                    }}
                    className="border-slate-950"
                  />
                </div>

                {/* 5. Nama Instruktur */}
                <div
                  style={{
                    transform: `translate(${design.elementOffsets?.instructor_name?.x || 0}px, ${
                      design.elementOffsets?.instructor_name?.y || 0
                    }px) scale(${design.elementOffsets?.instructor_name?.scale || 1})`,
                    transformOrigin: 'bottom right',
                    display: design.elementOffsets?.instructor_name?.visible === false ? 'none' : 'block'
                  }}
                >
                  <p
                    className="font-black text-slate-950 uppercase tracking-wide pt-0.5"
                    style={{
                      fontSize: `${design.instructorNameFontSize || 13}px`,
                      fontFamily: "'Montserrat', sans-serif"
                    }}
                  >
                    {instructorCleanName}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Added Elements */}
            {(design.customElements || []).map(customEl => {
              if (customEl.visible === false) return null;
              return (
                <div
                  key={customEl.id}
                  style={{
                    position: 'absolute',
                    left: `${customEl.posX}%`,
                    top: `${customEl.posY}%`,
                    transform: `translate(-50%, -50%) scale(${customEl.scale || 1})`,
                    transformOrigin: 'center center',
                    color: customEl.color || design.textColor || '#0f172a',
                    zIndex: 20
                  }}
                  className="pointer-events-none select-none"
                >
                  {customEl.type === 'text' && (
                    <span
                      className="font-bold whitespace-nowrap"
                      style={{ fontSize: `${customEl.fontSize || 12}px` }}
                    >
                      {customEl.content}
                    </span>
                  )}
                  {customEl.type === 'badge' && (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-md uppercase tracking-wider border border-amber-300">
                      {customEl.content}
                    </span>
                  )}
                  {customEl.type === 'image' && (
                    <img
                      src={customEl.content}
                      alt="Custom Asset"
                      style={{ maxHeight: `${customEl.height || 48}px` }}
                      className="object-contain"
                    />
                  )}
                  {customEl.type === 'divider' && (
                    <div
                      style={{ width: `${customEl.width || 128}px`, height: `${customEl.height || 2}px` }}
                      className="bg-amber-500"
                    />
                  )}
                </div>
              );
            })}

            {/* Stamp if configured */}
            {design.customStampImageUrl && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  right: '180px',
                  zIndex: 15,
                  transform: `translate(${design.elementOffsets?.stamp_seal?.x || 0}px, ${
                    design.elementOffsets?.stamp_seal?.y || 0
                  }px) scale(${design.elementOffsets?.stamp_seal?.scale || 1}) rotate(-8deg)`,
                  transformOrigin: 'center center',
                  display: design.elementOffsets?.stamp_seal?.visible === false ? 'none' : 'block'
                }}
                className="opacity-85 pointer-events-none"
              >
                <img
                  src={design.customStampImageUrl}
                  alt="Stamp"
                  style={{ width: `${design.stampSize || 64}px`, height: `${design.stampSize || 64}px` }}
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. Document Authenticity & Cryptographic Audit Modal                      */}
      {/* ========================================================================= */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-amber-500/40 shadow-2xl space-y-5 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base">
                    Verifikasi Keaslian Dokumen 3D
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sistem Integritas Kriptografi & Segel Digital Resmi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSecurityModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                    Status Sertifikat: ASLI & TERVERIFIKASI
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                    Sertifikat ini diterbitkan langsung oleh sistem {websiteSettings.siteName || 'LESIN AJA'} dan terdaftar pada database cloud.
                  </p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nama Siswa:</span>
                  <span className="font-bold">{certificate.studentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Program Kursus:</span>
                  <span className="font-bold text-right max-w-xs">{certificate.courseTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nomor Registrasi:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {certificate.certificateNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tanggal Terbit:</span>
                  <span className="font-semibold">{certificate.issueDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Skor Kelulusan:</span>
                  <span className="font-bold text-emerald-600">{certificate.score}% ({certificate.grade})</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">SHA-256 Hash Keamanan:</span>
                    <button
                      onClick={handleCopyHash}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Salin Hash</span>
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 break-all mt-1 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                    {certificate.verificationHash || `CERT-HASH-VERIFIED-${certificate.id}-${certificate.certificateNumber}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSecurityModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
