import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CertificateDesignSettings, Certificate, CertificateCustomElement } from '../../types';
import { DEFAULT_CERTIFICATE_DESIGN } from '../../data/mockData';
import {
  SUPABASE_SQL_SCHEMA_CERTIFICATE_DESIGN,
  pushCertificateDesignToSupabase
} from '../../utils/supabaseClient';
import {
  Award,
  Palette,
  Layout,
  Type,
  ShieldCheck,
  QrCode,
  FileCheck,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  Check,
  Sliders,
  Smartphone,
  Monitor,
  Upload,
  Trash2,
  Plus,
  Minus,
  Move,
  Image as ImageIcon,
  Stamp,
  Star,
  CheckCircle2,
  Layers,
  X,
  Link2,
  GraduationCap,
  Sparkle,
  Database,
  Copy,
  Calendar,
  MapPin,
  ZoomIn,
  ZoomOut,
  Scaling,
  Maximize2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Preset Templates
const PRESET_TEMPLATES: {
  id: CertificateDesignSettings['templateStyle'];
  name: string;
  desc: string;
  previewBg: string;
  badge: string;
  config: Partial<CertificateDesignSettings>;
}[] = [
  {
    id: 'classic_gold',
    name: 'Royal Gold & Navy',
    desc: 'Desain klasik formal elegan dengan bingkai guilloche emas dan segel 3D fluted.',
    previewBg: 'from-amber-100 to-amber-50 border-amber-600',
    badge: 'Paling Populer',
    config: {
      templateStyle: 'classic_gold',
      primaryColor: '#0f172a',
      secondaryColor: '#d97706',
      accentColor: '#f59e0b',
      backgroundColor: '#fdfbf7',
      textColor: '#0f172a',
      borderStyle: 'ornate',
      borderThickness: 14,
      showGoldSeal: true,
      sealType: 'gold_3d',
      sealPosition: 'bottom_center',
      showRibbons: true,
      showWatermark: true,
      watermarkType: 'crest',
      showGuillocheBorder: true,
      showCornerOrnaments: true,
      fontFamily: 'serif'
    }
  },
  {
    id: 'royal_emerald',
    name: 'Emerald Prestige',
    desc: 'Nuansa hijau zamrud kehormatan akademik dengan aksen emas murni & pita mewah.',
    previewBg: 'from-emerald-100 to-teal-50 border-emerald-600',
    badge: 'Prestisius',
    config: {
      templateStyle: 'royal_emerald',
      primaryColor: '#064e3b',
      secondaryColor: '#059669',
      accentColor: '#d97706',
      backgroundColor: '#f6fdfa',
      textColor: '#064e3b',
      borderStyle: 'double',
      borderThickness: 16,
      showGoldSeal: true,
      sealType: 'gold_3d',
      sealPosition: 'bottom_center',
      showRibbons: true,
      showWatermark: true,
      watermarkType: 'crest',
      showGuillocheBorder: true,
      showCornerOrnaments: true,
      fontFamily: 'serif'
    }
  },
  {
    id: 'modern_minimal',
    name: 'Modern Bauhaus Minimalist',
    desc: 'Gaya visual bersih, tipografi presisi tinggi modern, tanpa dekorasi berlebihan.',
    previewBg: 'from-slate-100 to-white border-blue-600',
    badge: 'Modern & Clean',
    config: {
      templateStyle: 'modern_minimal',
      primaryColor: '#1e293b',
      secondaryColor: '#2563eb',
      accentColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderStyle: 'solid',
      borderThickness: 8,
      showGoldSeal: true,
      sealType: 'modern_badge',
      sealPosition: 'bottom_right',
      showRibbons: false,
      showWatermark: false,
      watermarkType: 'logo',
      showGuillocheBorder: false,
      showCornerOrnaments: false,
      fontFamily: 'sans'
    }
  },
  {
    id: 'tech_cyber',
    name: 'Tech Dark Obsidian',
    desc: 'Nuansa gelap cyber futuristik untuk bootcamp IT, coding, dan teknologi canggih.',
    previewBg: 'from-slate-900 to-indigo-950 border-cyan-500 text-white',
    badge: 'Khusus IT / Tech',
    config: {
      templateStyle: 'tech_cyber',
      primaryColor: '#030712',
      secondaryColor: '#06b6d4',
      accentColor: '#3b82f6',
      backgroundColor: '#090d16',
      textColor: '#f8fafc',
      borderStyle: 'solid',
      borderThickness: 10,
      showGoldSeal: true,
      sealType: 'modern_badge',
      sealPosition: 'bottom_center',
      showRibbons: false,
      showWatermark: true,
      watermarkType: 'custom',
      showGuillocheBorder: true,
      showCornerOrnaments: false,
      fontFamily: 'sans'
    }
  },
  {
    id: 'vintage_creed',
    name: 'Vintage Creed Parchment',
    desc: 'Gaya sertifikat arsip historis dengan tekstur kertas perkamen dan segel lilin wax.',
    previewBg: 'from-amber-200 to-yellow-100 border-amber-800',
    badge: 'Otentik Antik',
    config: {
      templateStyle: 'vintage_creed',
      primaryColor: '#451a03',
      secondaryColor: '#78350f',
      accentColor: '#b45309',
      backgroundColor: '#faf4e6',
      textColor: '#451a03',
      borderStyle: 'ornate',
      borderThickness: 18,
      showGoldSeal: true,
      sealType: 'wax_seal',
      sealPosition: 'bottom_center',
      showRibbons: false,
      showWatermark: true,
      watermarkType: 'crest',
      showGuillocheBorder: true,
      showCornerOrnaments: true,
      fontFamily: 'serif'
    }
  },
  {
    id: 'academic_slate',
    name: 'Academic University Slate',
    desc: 'Standar universitas dan akademi formal terakreditasi dengan stempel klasik.',
    previewBg: 'from-slate-100 to-slate-50 border-slate-700',
    badge: 'Standar Universitas',
    config: {
      templateStyle: 'academic_slate',
      primaryColor: '#0f172a',
      secondaryColor: '#334155',
      accentColor: '#0284c7',
      backgroundColor: '#f8fafc',
      textColor: '#0f172a',
      borderStyle: 'double',
      borderThickness: 12,
      showGoldSeal: true,
      sealType: 'classic_round',
      sealPosition: 'bottom_right',
      showRibbons: false,
      showWatermark: true,
      watermarkType: 'crest',
      showGuillocheBorder: true,
      showCornerOrnaments: true,
      fontFamily: 'serif'
    }
  }
];

export const CertificateDesignerView: React.FC = () => {
  const { websiteSettings, courses, updateCertificateDesign, showToast, supabaseConfig } = useApp();

  const currentConfig: CertificateDesignSettings = {
    ...DEFAULT_CERTIFICATE_DESIGN,
    ...(websiteSettings.certificateDesign || {})
  };

  const [formState, setFormState] = useState<CertificateDesignSettings>(currentConfig);
  const [activeTab, setActiveTab] = useState<
    'presets' | 'branding' | 'upload' | 'elements' | 'typography' | 'colors' | 'seal' | 'signatures'
  >('presets');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewCourseId, setPreviewCourseId] = useState<string>(courses[0]?.id || '');

  // Drag & drop on canvas state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number } | null>(null);

  // Add Element Modal state
  const [showAddElementModal, setShowAddElementModal] = useState(false);
  const [newElementType, setNewElementType] = useState<'text' | 'image' | 'badge' | 'divider' | 'stamp'>('text');
  const [newElementLabel, setNewElementLabel] = useState('');
  const [newElementContent, setNewElementContent] = useState('');

  // Confirmation & SQL schema modals
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // Logo source resolution
  const resolvedLogoUrl = formState.syncAppLogo !== false
    ? (websiteSettings.logoImageUrl || websiteSettings.appIconUrl || formState.customLogoImageUrl)
    : (formState.customLogoImageUrl || websiteSettings.logoImageUrl || websiteSettings.appIconUrl);

  const handleChange = (key: keyof CertificateDesignSettings, value: any) => {
    setFormState(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Convert uploaded image to Base64 Data URL for durable local & preview storage
  const handleFileUpload = (key: keyof CertificateDesignSettings, file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Mohon pilih file gambar yang valid (PNG, JPG, SVG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      handleChange(key, dataUrl);
      showToast('✅ Gambar berhasil diunggah dan terpasang pada sertifikat!');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (preset: (typeof PRESET_TEMPLATES)[0]) => {
    setFormState(prev => ({
      ...prev,
      ...preset.config
    }));
    showToast(`Preset "${preset.name}" diterapkan pada formulir!`);
  };

  const handleSave = () => {
    updateCertificateDesign(formState);
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const handleConfirmReset = () => {
    setFormState(DEFAULT_CERTIFICATE_DESIGN);
    updateCertificateDesign(DEFAULT_CERTIFICATE_DESIGN);
    setShowResetModal(false);
    showToast('✅ Desain sertifikat berhasil dikembalikan ke konfigurasi default!');
  };

  const handleSaveToSupabaseCloud = async () => {
    setIsSavingCloud(true);
    try {
      updateCertificateDesign(formState);
      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();
      if (url && key) {
        const res = await pushCertificateDesignToSupabase(formState, {
          ...supabaseConfig,
          projectUrl: url,
          anonKey: key
        });
        if (res.success) {
          showToast('🚀 Desain sertifikat berhasil disimpan ke Supabase Cloud (tersinkron di semua browser & device)!');
        } else {
          showToast(`⚠️ Tersimpan lokal. Catatan Supabase: ${res.error || 'Pastikan tabel certificate_design sudah dibuat.'}`);
        }
      } else {
        showToast('✅ Tersimpan di pengaturan lokal. Sambungkan Supabase di Pengaturan Database agar tersinkron multi-device.');
      }
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA_CERTIFICATE_DESIGN);
    setCopiedSql(true);
    showToast('📋 Skema SQL tabel certificate_design berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Element Offset Updater
  const updateElementOffset = (elementId: string, deltaX: number, deltaY: number) => {
    setFormState(prev => {
      const offsets = { ...(prev.elementOffsets || {}) };
      const current = offsets[elementId] || { x: 0, y: 0, visible: true };
      offsets[elementId] = {
        ...current,
        x: Math.round(deltaX),
        y: Math.round(deltaY)
      };
      return {
        ...prev,
        elementOffsets: offsets
      };
    });
  };

  const toggleElementVisibility = (elementId: string) => {
    setFormState(prev => {
      const offsets = { ...(prev.elementOffsets || {}) };
      const current = offsets[elementId] || { x: 0, y: 0, visible: true };
      offsets[elementId] = {
        ...current,
        visible: current.visible === false ? true : false
      };
      return {
        ...prev,
        elementOffsets: offsets
      };
    });
  };

  const resetElementPosition = (elementId: string) => {
    setFormState(prev => {
      const offsets = { ...(prev.elementOffsets || {}) };
      if (offsets[elementId]) {
        offsets[elementId] = { ...offsets[elementId], x: 0, y: 0 };
      }
      return {
        ...prev,
        elementOffsets: offsets
      };
    });
  };

  // Element Scale Updater (Supports both Standard & Custom Elements)
  const updateElementScale = (elementId: string, scale: number) => {
    const clampedScale = Math.max(0.2, Math.min(3.0, Number(scale.toFixed(2))));
    const isCustom = formState.customElements?.some(el => el.id === elementId);
    if (isCustom) {
      handleCustomElementChange(elementId, { scale: clampedScale });
      return;
    }
    setFormState(prev => {
      const offsets = { ...(prev.elementOffsets || {}) };
      const current = offsets[elementId] || { x: 0, y: 0, visible: true, scale: 1 };
      offsets[elementId] = {
        ...current,
        scale: clampedScale
      };
      return {
        ...prev,
        elementOffsets: offsets
      };
    });
  };

  // Nudge Scale up or down
  const nudgeScale = (elementId: string, delta: number) => {
    const isCustom = formState.customElements?.some(el => el.id === elementId);
    if (isCustom) {
      const currentEl = formState.customElements?.find(el => el.id === elementId);
      const currentScale = currentEl?.scale ?? 1;
      updateElementScale(elementId, currentScale + delta);
    } else {
      const currentOffset = formState.elementOffsets?.[elementId];
      const currentScale = currentOffset?.scale ?? 1;
      updateElementScale(elementId, currentScale + delta);
    }
  };

  // Element Font Size / Specific Dimension Updater
  const updateElementFontSize = (elementId: string, fontSize: number) => {
    const isCustom = formState.customElements?.some(el => el.id === elementId);
    if (isCustom) {
      handleCustomElementChange(elementId, { fontSize });
      return;
    }
    setFormState(prev => {
      const offsets = { ...(prev.elementOffsets || {}) };
      const current = offsets[elementId] || { x: 0, y: 0, visible: true };
      offsets[elementId] = {
        ...current,
        fontSize
      };
      return {
        ...prev,
        elementOffsets: offsets
      };
    });
  };

  // Element Custom Size / Dimension Updater (e.g. Logo, QR, Seal, Stamp)
  const updateElementSize = (elementId: string, size: number) => {
    const isCustom = formState.customElements?.some(el => el.id === elementId);
    if (isCustom) {
      handleCustomElementChange(elementId, { width: size, height: size });
      return;
    }
    setFormState(prev => {
      const offsets = { ...(prev.elementOffsets || {}) };
      const current = offsets[elementId] || { x: 0, y: 0, visible: true };
      offsets[elementId] = {
        ...current,
        size
      };
      return {
        ...prev,
        elementOffsets: offsets
      };
    });
  };

  // Reset Size to 100% / Default
  const resetElementSize = (elementId: string) => {
    const isCustom = formState.customElements?.some(el => el.id === elementId);
    if (isCustom) {
      handleCustomElementChange(elementId, { scale: 1, fontSize: undefined, width: undefined, height: undefined });
      showToast('Ukuran elemen direset ke default (100%).');
      return;
    }
    setFormState(prev => {
      const offsets = { ...(prev.elementOffsets || {}) };
      if (offsets[elementId]) {
        offsets[elementId] = {
          ...offsets[elementId],
          scale: 1,
          size: undefined,
          fontSize: undefined
        };
      }
      return {
        ...prev,
        elementOffsets: offsets
      };
    });
    showToast('Ukuran elemen direset ke default (100%).');
  };

  // Custom Element Management
  const handleAddCustomElement = () => {
    if (!newElementLabel.trim() && !newElementContent.trim()) {
      showToast('⚠️ Mohon isi label dan konten elemen baru.');
      return;
    }

    const newEl: CertificateCustomElement = {
      id: `custom-el-${Date.now()}`,
      type: newElementType,
      label: newElementLabel || 'Elemen Tambahan',
      content: newElementContent || (newElementType === 'badge' ? 'AKREDITASI A' : 'Teks Kustom Baru'),
      posX: 50, // default center
      posY: 50,
      fontSize: newElementType === 'text' ? 12 : undefined,
      fontWeight: 'bold',
      color: formState.textColor || '#0f172a',
      visible: true
    };

    setFormState(prev => ({
      ...prev,
      customElements: [...(prev.customElements || []), newEl]
    }));

    setShowAddElementModal(false);
    setNewElementLabel('');
    setNewElementContent('');
    setSelectedElementId(newEl.id);
    showToast(`✅ Elemen "${newEl.label}" berhasil ditambahkan! Anda dapat menggesernya.`);
  };

  const handleDeleteCustomElement = (id: string) => {
    setFormState(prev => ({
      ...prev,
      customElements: (prev.customElements || []).filter(el => el.id !== id)
    }));
    if (selectedElementId === id) setSelectedElementId(null);
    showToast('Elemen berhasil dihapus.');
  };

  const handleCustomElementChange = (id: string, updates: Partial<CertificateCustomElement>) => {
    setFormState(prev => ({
      ...prev,
      customElements: (prev.customElements || []).map(el => (el.id === id ? { ...el, ...updates } : el))
    }));
  };

  // Drag start handler on canvas
  const handleMouseDownOnElement = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    setIsDragging(true);

    const currentOffset = formState.elementOffsets?.[elementId] || { x: 0, y: 0 };
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialX: currentOffset.x,
      initialY: currentOffset.y
    };
  };

  // Mouse move handler on container
  const handleMouseMoveOnCanvas = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !selectedElementId) return;

    // Scale correction: Canvas has scale(0.68) on desktop or scale(0.52) on mobile
    const currentScale = previewDevice === 'mobile' ? 0.52 : 0.68;
    const deltaX = (e.clientX - dragStartRef.current.clientX) / currentScale;
    const deltaY = (e.clientY - dragStartRef.current.clientY) / currentScale;

    // Check if it's a custom element or a standard element
    const isCustom = formState.customElements?.some(el => el.id === selectedElementId);
    if (isCustom) {
      const el = formState.customElements?.find(item => item.id === selectedElementId);
      if (el) {
        // adjust posX and posY based on canvas dimensions 960x678
        const newX = Math.max(0, Math.min(100, (dragStartRef.current.initialX + deltaX / 9.6)));
        const newY = Math.max(0, Math.min(100, (dragStartRef.current.initialY + deltaY / 6.78)));
        handleCustomElementChange(selectedElementId, { posX: newX, posY: newY });
      }
    } else {
      updateElementOffset(
        selectedElementId,
        dragStartRef.current.initialX + deltaX,
        dragStartRef.current.initialY + deltaY
      );
    }
  };

  const handleMouseUpCanvas = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Selected course for preview
  const selectedCourse = courses.find(c => c.id === previewCourseId) || courses[0];
  const courseInstructorName = selectedCourse?.instructor?.name || 'Rian Pratama, S.Kom.';
  const courseInstructorTitle = selectedCourse?.instructor?.title || 'Senior Full-Stack Architect';

  // Lead Master Instructor sanitized single name
  const rawInstructorName =
    formState.useCourseInstructor !== false || !formState.leadInstructorName
      ? courseInstructorName
      : (formState.leadInstructorName || formState.signatureName || courseInstructorName);

  const sanitizeSingleName = (nameStr: string): string => {
    if (!nameStr) return 'Instruktur Utama';
    return nameStr.split(/\s+(?:&|and|dan|\/)\s+/i)[0].trim() || nameStr;
  };

  const singleLeadInstructorName = sanitizeSingleName(rawInstructorName);

  const singleLeadInstructorTitle =
    formState.useCourseInstructor !== false || !formState.leadInstructorTitle
      ? (courseInstructorTitle || 'Master Instructor')
      : (formState.leadInstructorTitle || formState.signatureTitle || courseInstructorTitle);

  // Mock certificate data for live preview
  const previewCert: Certificate = {
    id: 'cert-preview',
    certificateNumber: 'LSN/2026/CERT/78912',
    studentId: 'std-preview',
    studentName: 'Ahmad Faisal Pratama, S.Kom.',
    courseId: selectedCourse?.id || 'crs-preview',
    courseTitle: selectedCourse?.title || 'Mastery Full-Stack Web Architecture & Cloud Integration',
    instructorName: singleLeadInstructorName,
    instructorTitle: singleLeadInstructorTitle,
    issueDate: new Date().toISOString().slice(0, 10),
    grade: 'Dengan Pujian Tertinggi (Distinction - Grade A+)',
    score: 98,
    verificationHash: 'e7b92f814a60c239d10e58'
  };

  // Standard Elements metadata list for layer manager with sizing support
  const STANDARD_ELEMENTS = [
    {
      id: 'logo',
      label: 'Logo Instansi / Aplikasi',
      type: 'image' as const,
      defaultVisible: formState.showLogo !== false,
      sizeLabel: 'Ukuran Dimensi Logo (px)',
      minSize: 24,
      maxSize: 140,
      currentSize: formState.logoSize || 52,
      onSizeChange: (val: number) => handleChange('logoSize', val)
    },
    {
      id: 'header_title',
      label: 'Judul Dokumen Sertifikat',
      type: 'text' as const,
      defaultVisible: true,
      sizeLabel: 'Ukuran Font Judul (px)',
      minSize: 16,
      maxSize: 56,
      currentSize: formState.headerTitleFontSize || 30,
      onSizeChange: (val: number) => handleChange('headerTitleFontSize', val)
    },
    {
      id: 'subtitle',
      label: 'Subjudul & Pengantar',
      type: 'text' as const,
      defaultVisible: true,
      sizeLabel: 'Ukuran Font Subjudul (px)',
      minSize: 9,
      maxSize: 24,
      currentSize: formState.subtitleFontSize || 12,
      onSizeChange: (val: number) => handleChange('subtitleFontSize', val)
    },
    {
      id: 'reg_strip',
      label: 'Nomor Registrasi & Hash',
      type: 'text' as const,
      defaultVisible: true,
      sizeLabel: 'Ukuran Font Registrasi (px)',
      minSize: 8,
      maxSize: 20,
      currentSize: formState.regStripFontSize || 10,
      onSizeChange: (val: number) => handleChange('regStripFontSize', val)
    },
    {
      id: 'recipient_name',
      label: 'Nama Siswa Penerima',
      type: 'text' as const,
      defaultVisible: true,
      sizeLabel: 'Ukuran Font Nama Siswa (px)',
      minSize: 18,
      maxSize: 64,
      currentSize: formState.recipientNameFontSize || 36,
      onSizeChange: (val: number) => handleChange('recipientNameFontSize', val)
    },
    {
      id: 'course_title',
      label: 'Nama Kursus & Nilai Evaluasi',
      type: 'text' as const,
      defaultVisible: true,
      sizeLabel: 'Ukuran Font Nama Kursus (px)',
      minSize: 12,
      maxSize: 36,
      currentSize: formState.courseTitleFontSize || 20,
      onSizeChange: (val: number) => handleChange('courseTitleFontSize', val)
    },
    {
      id: 'qr_code',
      label: 'QR Code Verifikasi',
      type: 'qr' as const,
      defaultVisible: formState.showQrCode !== false,
      sizeLabel: 'Dimensi QR Code (px)',
      minSize: 32,
      maxSize: 120,
      currentSize: formState.qrCodeSize || 56,
      onSizeChange: (val: number) => handleChange('qrCodeSize', val)
    },
    {
      id: 'seal_medallion',
      label: 'Segel Keaslian 3D / Wax Seal',
      type: 'seal' as const,
      defaultVisible: formState.showGoldSeal !== false,
      sizeLabel: 'Dimensi Segel (px)',
      minSize: 36,
      maxSize: 140,
      currentSize: formState.sealSize || 80,
      onSizeChange: (val: number) => handleChange('sealSize', val)
    },
    {
      id: 'issue_place_date',
      label: 'Tempat & Tanggal Penandatanganan',
      type: 'text' as const,
      defaultVisible: formState.showIssueCityDate !== false,
      sizeLabel: 'Ukuran Font Tanggal (px)',
      minSize: 8,
      maxSize: 24,
      currentSize: formState.issueDateFontSize || 11,
      onSizeChange: (val: number) => handleChange('issueDateFontSize', val)
    },
    {
      id: 'instructor_title',
      label: 'Teks Jabatan Penandatangan',
      type: 'text' as const,
      defaultVisible: true,
      sizeLabel: 'Ukuran Font Jabatan (px)',
      minSize: 8,
      maxSize: 24,
      currentSize: formState.instructorTitleFontSize || 11,
      onSizeChange: (val: number) => handleChange('instructorTitleFontSize', val)
    },
    {
      id: 'signature_drawing',
      label: 'Goresan / Gambar Tanda Tangan',
      type: 'signature' as const,
      defaultVisible: true,
      sizeLabel: 'Tinggi Gambar Tanda Tangan (px)',
      minSize: 20,
      maxSize: 120,
      currentSize: formState.signatureHeight || 40,
      onSizeChange: (val: number) => handleChange('signatureHeight', val)
    },
    {
      id: 'signature_line',
      label: 'Garis Pembatas Tanda Tangan',
      type: 'divider' as const,
      defaultVisible: true,
      sizeLabel: 'Panjang Garis Bawah (px)',
      minSize: 60,
      maxSize: 320,
      currentSize: formState.signatureLineWidth || 200,
      onSizeChange: (val: number) => handleChange('signatureLineWidth', val)
    },
    {
      id: 'instructor_name',
      label: 'Nama Lengkap & Gelar Instruktur',
      type: 'text' as const,
      defaultVisible: true,
      sizeLabel: 'Ukuran Font Nama Instruktur (px)',
      minSize: 9,
      maxSize: 28,
      currentSize: formState.instructorNameFontSize || 13,
      onSizeChange: (val: number) => handleChange('instructorNameFontSize', val)
    },
    {
      id: 'stamp_seal',
      label: 'Cap Stempel Lembaga',
      type: 'image' as const,
      defaultVisible: formState.showStamp || Boolean(formState.customStampImageUrl),
      sizeLabel: 'Dimensi Stempel (px)',
      minSize: 30,
      maxSize: 140,
      currentSize: formState.stampSize || 64,
      onSizeChange: (val: number) => handleChange('stampSize', val)
    },
    {
      id: 'footer_note',
      label: 'Catatan Kaki (Footer Note)',
      type: 'text' as const,
      defaultVisible: Boolean(formState.customFooterNote),
      sizeLabel: 'Ukuran Font Catatan Kaki (px)',
      minSize: 8,
      maxSize: 20,
      currentSize: formState.footerNoteFontSize || 10,
      onSizeChange: (val: number) => handleChange('footerNoteFontSize', val)
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900/40 via-indigo-900/30 to-slate-900 border border-amber-500/30 p-6 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-heading font-black text-white">
              Studio Desain & Kustomisasi Sertifikat Resmi
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Atur elemen visual, logo otomatis, unggah stempel/segel/tanda tangan, serta sistem geser, drag & drop, tambah dan hapus elemen langsung pada sertifikat resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition border border-cyan-500/30 cursor-pointer shadow-sm hover:border-cyan-400"
            title="Lihat Skema Tabel Supabase untuk Desain Sertifikat"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Skema SQL Supabase</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer active:scale-95"
            title="Kembalikan semua pengaturan ke template default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
          <button
            onClick={handleSaveToSupabaseCloud}
            disabled={isSavingCloud}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingCloud ? 'Menyimpan Cloud...' : 'Simpan ke Supabase & Sistem'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls on Left (5 cols), Live Interactive Canvas on Right (7 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="xl:col-span-5 space-y-4">
          {/* Navigation Tabs */}
          <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl flex gap-1 text-xs font-bold overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'presets'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'branding'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Logo & Brand</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'upload'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Media</span>
            </button>
            <button
              onClick={() => setActiveTab('elements')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'elements'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kelola Elemen</span>
            </button>
            <button
              onClick={() => setActiveTab('typography')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'typography'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Teks</span>
            </button>
            <button
              onClick={() => setActiveTab('colors')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'colors'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Warna</span>
            </button>
            <button
              onClick={() => setActiveTab('seal')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'seal'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Segel</span>
            </button>
            <button
              onClick={() => setActiveTab('signatures')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'signatures'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Instruktur</span>
            </button>
          </div>

          {/* Form Content Panel */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
            {/* TAB 1: PRESET TEMPLATES */}
            {activeTab === 'presets' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Pilih Tema Template Desain</span>
                  <span className="text-[11px] text-amber-400">6 Template Siap Pakai</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                  {PRESET_TEMPLATES.map(tmpl => {
                    const isSelected = formState.templateStyle === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => handleApplyPreset(tmpl)}
                        className={`p-3.5 rounded-xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white">{tmpl.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold">
                              {tmpl.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{tmpl.desc}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${tmpl.previewBg} border`} />
                          <span className={`text-[11px] font-bold ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}>
                            {isSelected ? '✓ Terpilih' : 'Terapkan'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: LOGO & BRANDING (AUTO SYNC WITH APP LOGO) */}
            {activeTab === 'branding' && (
              <div className="space-y-4 text-xs">
                {/* Auto Sync Toggle */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.syncAppLogo !== false}
                        onChange={e => handleChange('syncAppLogo', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="text-sm font-bold text-white">
                        Sesuaikan Otomatis dengan Logo Aplikasi
                      </span>
                    </label>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-extrabold text-[10px]">
                      Otomatis
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Jika diaktifkan, logo pada sertifikat akan selalu otomatis tersinkronisasi dengan logo aplikasi resmi yang terpasang di menu Pengaturan Website (<strong>{websiteSettings.siteName || 'LESIN AJA'}</strong>).
                  </p>
                </div>

                {/* Logo Visibility & Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Tampilkan Logo</label>
                    <select
                      value={formState.showLogo !== false ? 'yes' : 'no'}
                      onChange={e => handleChange('showLogo', e.target.value === 'yes')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                    >
                      <option value="yes">Tampilkan Logo</option>
                      <option value="no">Sembunyikan Logo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Ukuran Logo ({formState.logoSize || 52}px)
                    </label>
                    <input
                      type="range"
                      min={32}
                      max={96}
                      value={formState.logoSize || 52}
                      onChange={e => handleChange('logoSize', Number(e.target.value))}
                      className="w-full mt-2 accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Logo Preview & Custom Upload if not synced */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold">Pratinjau Logo Aktif:</span>
                    <span className="text-[10px] text-slate-400">
                      {formState.syncAppLogo !== false ? 'Dari Logo Aplikasi' : 'Kustom Sertifikat'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white p-1.5 border-2 border-amber-500 shadow-md flex items-center justify-center">
                      {resolvedLogoUrl ? (
                        <img
                          src={resolvedLogoUrl}
                          alt="Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <GraduationCap className="w-8 h-8 text-amber-600" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-white font-bold text-xs truncate">
                        {websiteSettings.siteName || 'LESIN AJA'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formState.institutionTagline || 'LEMBAGA PENDIDIKAN & SERTIFIKASI RESMI'}
                      </p>
                    </div>
                  </div>

                  {/* Manual Logo Upload (if sync is disabled or to override) */}
                  {formState.syncAppLogo === false && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="block text-slate-400 text-[11px]">
                        Unggah File Logo Khusus Sertifikat (PNG Transparan):
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('customLogoImageUrl', file);
                        }}
                        className="w-full text-slate-400 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Institution Name & Tagline */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Nama Lembaga / Akademi</label>
                    <input
                      type="text"
                      value={formState.institutionName || ''}
                      onChange={e => handleChange('institutionName', e.target.value)}
                      placeholder="LESIN AJA"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Tagline Lembaga</label>
                    <input
                      type="text"
                      value={formState.institutionTagline || ''}
                      onChange={e => handleChange('institutionTagline', e.target.value)}
                      placeholder="LEMBAGA PENDIDIKAN & SERTIFIKASI KOMPETENSI RESMI"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: UPLOAD MEDIA ASSET HUB (SEGEL, TANDA TANGAN, WATERMARK, STEMPEL) */}
            {activeTab === 'upload' && (
              <div className="space-y-4 text-xs max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                <div className="text-slate-300 font-bold flex items-center justify-between">
                  <span>Kolom Upload Gambar Sertifikat</span>
                  <span className="text-[10px] text-amber-400">PNG / JPEG / SVG</span>
                </div>

                {/* 1. UPLOAD SEGEL / SEAL */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span className="text-white font-bold">1. Upload Gambar Segel / Medali Kustom</span>
                    </div>
                    {formState.customSealImageUrl && (
                      <button
                        onClick={() => handleChange('customSealImageUrl', '')}
                        className="text-rose-400 hover:text-rose-300 text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Ganti medali 3D standar dengan gambar segel emas/lilin transparan milik institusi Anda.
                  </p>
                  <div className="flex items-center gap-3">
                    {formState.customSealImageUrl ? (
                      <img
                        src={formState.customSealImageUrl}
                        alt="Seal"
                        className="w-12 h-12 object-contain rounded-lg border border-amber-500/50 bg-slate-900 p-1"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                        <Award className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('customSealImageUrl', file);
                        }}
                        className="w-full text-slate-400 text-[11px] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formState.customSealImageUrl || ''}
                        onChange={e => handleChange('customSealImageUrl', e.target.value)}
                        placeholder="Atau tempel URL gambar segel..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-[11px] focus:border-amber-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. UPLOAD TANDA TANGAN LEAD MASTER INSTRUCTOR */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-white font-bold">2. Upload Tanda Tangan Lead Master Instructor</span>
                    </div>
                    {formState.signatureImageUrl && (
                      <button
                        onClick={() => handleChange('signatureImageUrl', '')}
                        className="text-rose-400 hover:text-rose-300 text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Upload file tanda tangan asli berformat PNG transparan (tanpa background).
                  </p>
                  <div className="flex items-center gap-3">
                    {formState.signatureImageUrl ? (
                      <img
                        src={formState.signatureImageUrl}
                        alt="Signature"
                        className="w-20 h-10 object-contain rounded-lg border border-emerald-500/50 bg-white p-1"
                      />
                    ) : (
                      <div className="w-20 h-10 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                        <FileCheck className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('signatureImageUrl', file);
                        }}
                        className="w-full text-slate-400 text-[11px] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formState.signatureImageUrl || ''}
                        onChange={e => handleChange('signatureImageUrl', e.target.value)}
                        placeholder="Atau URL gambar tanda tangan..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-[11px] focus:border-amber-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. UPLOAD WATERMARK / BACKGROUND CREST */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span className="text-white font-bold">3. Upload Watermark / Security Background</span>
                    </div>
                    {formState.customWatermarkImageUrl && (
                      <button
                        onClick={() => handleChange('customWatermarkImageUrl', '')}
                        className="text-rose-400 hover:text-rose-300 text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Gambar lambang/logo transparan di bagian tengah latar belakang sertifikat.
                  </p>
                  <div className="flex items-center gap-3">
                    {formState.customWatermarkImageUrl ? (
                      <img
                        src={formState.customWatermarkImageUrl}
                        alt="Watermark"
                        className="w-12 h-12 object-contain rounded-lg border border-cyan-500/50 bg-slate-900 p-1 opacity-70"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('customWatermarkImageUrl', file);
                        }}
                        className="w-full text-slate-400 text-[11px] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. UPLOAD STEMPEL / CAP LEMBAGA */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stamp className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-bold">4. Upload Cap Stempel Basah Lembaga</span>
                    </div>
                    {formState.customStampImageUrl && (
                      <button
                        onClick={() => handleChange('customStampImageUrl', '')}
                        className="text-rose-400 hover:text-rose-300 text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Stempel resmi biru/merah/emas yang dicap di atas tanda tangan atau samping dokumen.
                  </p>
                  <div className="flex items-center gap-3">
                    {formState.customStampImageUrl ? (
                      <img
                        src={formState.customStampImageUrl}
                        alt="Stamp"
                        className="w-12 h-12 object-contain rounded-lg border border-purple-500/50 bg-slate-900 p-1"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                        <Stamp className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('customStampImageUrl', file);
                        }}
                        className="w-full text-slate-400 text-[11px] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-purple-500 file:text-slate-950 hover:file:bg-purple-400 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formState.customStampImageUrl || ''}
                        onChange={e => handleChange('customStampImageUrl', e.target.value)}
                        placeholder="Atau URL stempel..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-[11px] focus:border-amber-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: KELOLA ELEMEN, GESER, UBAH UKURAN, TAMBAH & HAPUS */}
            {activeTab === 'elements' && (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold block">Daftar Layer, Ukuran & Kontrol Elemen</span>
                    <span className="text-[10px] text-slate-400">
                      Klik elemen di kanvas atau pilih layer di bawah untuk mengubah ukuran (skala / font / dimensi) dan posisi
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddElementModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold flex items-center gap-1 transition cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Elemen</span>
                  </button>
                </div>

                {/* Layer List Accordion */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                  {/* Standard Elements List */}
                  {STANDARD_ELEMENTS.map(item => {
                    const offset = formState.elementOffsets?.[item.id] || { x: 0, y: 0, visible: item.defaultVisible, scale: 1 };
                    const isVisible = offset.visible !== false;
                    const isSelected = selectedElementId === item.id;
                    const currentScale = offset.scale ?? 1;
                    const scalePercent = Math.round(currentScale * 100);

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedElementId(item.id)}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/40'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                toggleElementVisibility(item.id);
                              }}
                              className={`p-1 rounded-md transition ${
                                isVisible ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-600 hover:bg-slate-800'
                              }`}
                              title={isVisible ? 'Sembunyikan Elemen' : 'Tampilkan Elemen'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <span className={`font-bold ${isVisible ? 'text-white' : 'text-slate-500 line-through'}`}>
                              {item.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${scalePercent !== 100 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400'}`}>
                              {scalePercent}%
                            </span>
                            {(offset.x !== 0 || offset.y !== 0) && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  resetElementPosition(item.id);
                                }}
                                className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                                title="Reset ke Posisi Default"
                              >
                                <RotateCcw className="w-2.5 h-2.5" /> Posisi
                              </button>
                            )}
                            <span className="text-[10px] font-mono text-slate-400">
                              X:{offset.x} Y:{offset.y}
                            </span>
                          </div>
                        </div>

                        {/* Expandable Controls when Selected */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-slate-800/90 space-y-3.5 text-[11px]">
                            {/* 1. UNIVERSAL ELEMENT SCALE (UKURAN SKALA % ELEMEN) */}
                            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                                  <Scaling className="w-3.5 h-3.5" />
                                  <span>Skala Ukuran Elemen (Zoom / Size)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black font-mono text-[11px]">
                                    {scalePercent}%
                                  </span>
                                  {scalePercent !== 100 && (
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        updateElementScale(item.id, 1);
                                      }}
                                      className="text-[10px] text-slate-400 hover:text-amber-300 underline"
                                      title="Kembalikan ke 100%"
                                    >
                                      Reset 100%
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    nudgeScale(item.id, -0.05);
                                  }}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer border border-slate-700"
                                  title="Perkecil (-5%)"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="range"
                                  min={0.3}
                                  max={2.5}
                                  step={0.05}
                                  value={currentScale}
                                  onChange={e => updateElementScale(item.id, Number(e.target.value))}
                                  className="flex-1 accent-amber-500 cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    nudgeScale(item.id, 0.05);
                                  }}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer border border-slate-700"
                                  title="Perbesar (+5%)"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Preset Scale Buttons */}
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                <span className="text-[10px] text-slate-400 mr-1">Preset:</span>
                                {[50, 75, 90, 100, 115, 130, 150, 200].map(pct => (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      updateElementScale(item.id, pct / 100);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                                      scalePercent === pct
                                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                  >
                                    {pct}%
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 2. SPECIFIC SIZE / FONT SIZE SLIDER */}
                            {item.sizeLabel && item.onSizeChange && (
                              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                                <div className="flex justify-between text-slate-300">
                                  <span className="font-semibold">{item.sizeLabel}</span>
                                  <span className="font-mono font-bold text-amber-400">{item.currentSize}px</span>
                                </div>
                                <input
                                  type="range"
                                  min={item.minSize}
                                  max={item.maxSize}
                                  value={item.currentSize}
                                  onChange={e => item.onSizeChange!(Number(e.target.value))}
                                  className="w-full accent-amber-500 cursor-pointer"
                                />
                              </div>
                            )}

                            {/* 3. COORDINATES / POSITION OFFSET (X & Y) */}
                            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between text-slate-300 font-semibold">
                                <div className="flex items-center gap-1.5">
                                  <Move className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Posisi Koordinat Elemen</span>
                                </div>
                                {(offset.x !== 0 || offset.y !== 0) && (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      resetElementPosition(item.id);
                                    }}
                                    className="text-[10px] text-amber-400 hover:underline"
                                  >
                                    Reset Posisi (0,0)
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="flex justify-between text-slate-400 mb-0.5">
                                    <span>Geser X</span>
                                    <span className="font-mono text-amber-400">{offset.x}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={-180}
                                    max={180}
                                    value={offset.x}
                                    onChange={e => updateElementOffset(item.id, Number(e.target.value), offset.y)}
                                    className="w-full accent-amber-500 cursor-pointer"
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between text-slate-400 mb-0.5">
                                    <span>Geser Y</span>
                                    <span className="font-mono text-amber-400">{offset.y}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={-150}
                                    max={150}
                                    value={offset.y}
                                    onChange={e => updateElementOffset(item.id, offset.x, Number(e.target.value))}
                                    className="w-full accent-amber-500 cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>

                            <p className="text-[10px] text-amber-400/90 italic flex items-center gap-1">
                              <Sparkle className="w-3 h-3 shrink-0" />
                              <span>Tips: Anda juga bisa langsung mengklik elemen pada kanvas preview untuk memperbesar/memperkecil dengan cepat.</span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Custom Added Elements List */}
                  {(formState.customElements || []).map(customEl => {
                    const isSelected = selectedElementId === customEl.id;
                    const customScale = customEl.scale ?? 1;
                    const scalePercent = Math.round(customScale * 100);

                    return (
                      <div
                        key={customEl.id}
                        onClick={() => setSelectedElementId(customEl.id)}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-500/10 shadow-md shadow-cyan-500/5 ring-1 ring-cyan-500/40'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-cyan-500/20 text-cyan-400 font-black text-[9px] uppercase">
                              {customEl.type}
                            </span>
                            <span className="font-bold text-white">{customEl.label}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${scalePercent !== 100 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400'}`}>
                              {scalePercent}%
                            </span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteCustomElement(customEl.id);
                              }}
                              className="text-rose-400 hover:text-rose-300 p-1"
                              title="Hapus Elemen Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Controls for Custom Element */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-slate-800/90 space-y-3.5 text-[11px]">
                            {/* 1. KONTEN ELEMEN */}
                            <div>
                              <label className="block text-slate-400 text-[10px] mb-1 font-bold">Konten / Isi Elemen:</label>
                              <input
                                type="text"
                                value={customEl.content}
                                onChange={e => handleCustomElementChange(customEl.id, { content: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs font-medium focus:border-cyan-500 outline-none"
                              />
                            </div>

                            {/* 2. SCALE / UKURAN ELEMEN KUSTOM */}
                            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                                  <Scaling className="w-3.5 h-3.5" />
                                  <span>Skala Ukuran Elemen Kustom</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black font-mono text-[11px]">
                                    {scalePercent}%
                                  </span>
                                  {scalePercent !== 100 && (
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        updateElementScale(customEl.id, 1);
                                      }}
                                      className="text-[10px] text-slate-400 hover:text-cyan-300 underline"
                                    >
                                      Reset 100%
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    nudgeScale(customEl.id, -0.05);
                                  }}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer border border-slate-700"
                                  title="Perkecil (-5%)"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="range"
                                  min={0.3}
                                  max={2.5}
                                  step={0.05}
                                  value={customScale}
                                  onChange={e => updateElementScale(customEl.id, Number(e.target.value))}
                                  className="flex-1 accent-cyan-500 cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    nudgeScale(customEl.id, 0.05);
                                  }}
                                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer border border-slate-700"
                                  title="Perbesar (+5%)"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Presets */}
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                <span className="text-[10px] text-slate-400 mr-1">Preset:</span>
                                {[50, 75, 100, 125, 150, 200].map(pct => (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      updateElementScale(customEl.id, pct / 100);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                                      scalePercent === pct
                                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                  >
                                    {pct}%
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* 3. FONT SIZE IF TEXT / BADGE */}
                            {(customEl.type === 'text' || customEl.type === 'badge') && (
                              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                                <div className="flex justify-between text-slate-300">
                                  <span className="font-semibold">Ukuran Font Huruf</span>
                                  <span className="font-mono font-bold text-cyan-400">{customEl.fontSize || 12}px</span>
                                </div>
                                <input
                                  type="range"
                                  min={8}
                                  max={48}
                                  value={customEl.fontSize || 12}
                                  onChange={e => handleCustomElementChange(customEl.id, { fontSize: Number(e.target.value) })}
                                  className="w-full accent-cyan-500 cursor-pointer"
                                />
                              </div>
                            )}

                            {/* 4. POSISI X & Y */}
                            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                              <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                                <Move className="w-3.5 h-3.5 text-slate-400" />
                                <span>Posisi Kanvas (% X & Y)</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="flex justify-between text-slate-400 mb-0.5">
                                    <span>Posisi X (%)</span>
                                    <span className="font-mono text-cyan-400">{Math.round(customEl.posX)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={customEl.posX}
                                    onChange={e => handleCustomElementChange(customEl.id, { posX: Number(e.target.value) })}
                                    className="w-full accent-cyan-500 cursor-pointer"
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between text-slate-400 mb-0.5">
                                    <span>Posisi Y (%)</span>
                                    <span className="font-mono text-cyan-400">{Math.round(customEl.posY)}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={customEl.posY}
                                    onChange={e => handleCustomElementChange(customEl.id, { posY: Number(e.target.value) })}
                                    className="w-full accent-cyan-500 cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: TYPOGRAPHY & TEXT */}
            {activeTab === 'typography' && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Judul Utama Dokumen Sertifikat
                  </label>
                  <input
                    type="text"
                    value={formState.customHeaderTitle || ''}
                    onChange={e => handleChange('customHeaderTitle', e.target.value)}
                    placeholder="SERTIFIKAT KELULUSAN RESMI"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Teks Subjudul Pengantar
                  </label>
                  <textarea
                    rows={2}
                    value={formState.customSubtitle || ''}
                    onChange={e => handleChange('customSubtitle', e.target.value)}
                    placeholder="Diberikan dengan hormat sebagai pengakuan dan bukti kelulusan atas pencapaian kompetensi dalam menyelesaikan seluruh materi dan ujian pada program:"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Keluarga Font (Font Family)
                    </label>
                    <select
                      value={formState.fontFamily || 'serif'}
                      onChange={e => handleChange('fontFamily', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none cursor-pointer"
                    >
                      <option value="serif">Serif Klasik (Playfair / Merriweather)</option>
                      <option value="sans">Sans-Serif Modern (Plus Jakarta / Inter)</option>
                      <option value="mono">Monospace Tech (JetBrains / Roboto Mono)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Catatan Kaki (Footer Note)
                    </label>
                    <input
                      type="text"
                      value={formState.customFooterNote || ''}
                      onChange={e => handleChange('customFooterNote', e.target.value)}
                      placeholder="Dokumen resmi berlisensi digital..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: COLORS & FRAME */}
            {activeTab === 'colors' && (
              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Warna Frame Utama</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formState.primaryColor || '#0f172a'}
                        onChange={e => handleChange('primaryColor', e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formState.primaryColor || ''}
                        onChange={e => handleChange('primaryColor', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Warna Aksen Emas/Border</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formState.accentColor || '#d97706'}
                        onChange={e => handleChange('accentColor', e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formState.accentColor || ''}
                        onChange={e => handleChange('accentColor', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Warna Latar Kanvas</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formState.backgroundColor || '#fdfbf7'}
                        onChange={e => handleChange('backgroundColor', e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formState.backgroundColor || ''}
                        onChange={e => handleChange('backgroundColor', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Warna Teks Utama</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formState.textColor || '#0f172a'}
                        onChange={e => handleChange('textColor', e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formState.textColor || ''}
                        onChange={e => handleChange('textColor', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Tipe Garis Bingkai (Frame)</label>
                    <select
                      value={formState.borderStyle || 'ornate'}
                      onChange={e => handleChange('borderStyle', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none cursor-pointer"
                    >
                      <option value="ornate">Ornamen Klasik (Multi-Tier)</option>
                      <option value="double">Garis Ganda (Double Border)</option>
                      <option value="solid">Tebal Solid (Modern Bold)</option>
                      <option value="dashed">Garis Elegan Halus (Dashed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Ketebalan Border ({formState.borderThickness || 14}px)
                    </label>
                    <input
                      type="range"
                      min={6}
                      max={24}
                      value={formState.borderThickness || 14}
                      onChange={e => handleChange('borderThickness', Number(e.target.value))}
                      className="w-full mt-2 accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SEALS & ORNAMENTS */}
            {activeTab === 'seal' && (
              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Model Segel Keaslian</label>
                    <select
                      value={formState.sealType || 'gold_3d'}
                      onChange={e => handleChange('sealType', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none cursor-pointer"
                    >
                      <option value="gold_3d">Medali Emas 3D (Ultra-Realistic)</option>
                      <option value="wax_seal">Segel Lilin Wax Kuno (Merah/Emas)</option>
                      <option value="classic_round">Stempel Bulat Tradisional</option>
                      <option value="modern_badge">Badge Hologram Modern</option>
                      <option value="minimal_stamp">Stamp Minimalis Elegan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Posisi Peletakan Segel</label>
                    <select
                      value={formState.sealPosition || 'bottom_center'}
                      onChange={e => handleChange('sealPosition', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none cursor-pointer"
                    >
                      <option value="bottom_center">Tengah Bawah (Center Stage)</option>
                      <option value="bottom_right">Sudut Kanan Bawah</option>
                      <option value="bottom_left">Sudut Kiri Bawah</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="block text-slate-300 font-bold">Elemen Pengaman & Ornamen:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={formState.showGoldSeal !== false}
                        onChange={e => handleChange('showGoldSeal', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="text-white font-semibold">Tampilkan Segel</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={formState.showRibbons !== false}
                        onChange={e => handleChange('showRibbons', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="text-white font-semibold">Pita Satin Medali</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={formState.showGuillocheBorder !== false}
                        onChange={e => handleChange('showGuillocheBorder', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="text-white font-semibold">Garis Guilloche</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={formState.showCornerOrnaments !== false}
                        onChange={e => handleChange('showCornerOrnaments', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="text-white font-semibold">Ornamen Sudut</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={formState.showWatermark !== false}
                        onChange={e => handleChange('showWatermark', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="text-white font-semibold">Watermark Background</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={formState.showQrCode !== false}
                        onChange={e => handleChange('showQrCode', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="text-white font-semibold">QR Code Verifikasi</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: SINGLE LEAD MASTER INSTRUCTOR (OTOMATIS SESUAI KURSUS ATAU MANUAL) */}
            {activeTab === 'signatures' && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400 font-bold">
                      <FileCheck className="w-4 h-4" />
                      <span>Nama Instruktur pada Sertifikat (1 Nama Tunggal)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold">
                      Format 1 Nama Resmi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Sistem memastikan sertifikat hanya memuat <strong>1 (satu) nama instruktur tunggal</strong> resmi untuk kepastian tanda tangan dan keabsahan dokumen standar akreditasi.
                  </p>
                </div>

                {/* Tempat (Kota) & Tanggal Penandatanganan */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <MapPin className="w-4 h-4" />
                      <span>Tempat (Kota) & Tanggal Penandatanganan</span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.showIssueCityDate !== false}
                        onChange={e => handleChange('showIssueCityDate', e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-300 font-semibold">Tampilkan di Sertifikat</span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[11px]">
                      Nama Kota Tempat Penandatanganan:
                    </label>
                    <input
                      type="text"
                      value={formState.issueCity || ''}
                      onChange={e => handleChange('issueCity', e.target.value)}
                      placeholder="Jakarta / Bandung / Surabaya"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                    />
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <label className="text-slate-300 font-bold text-[11px]">
                        Ukuran Font Tempat & Tanggal ({formState.issueDateFontSize || 11}px)
                      </label>
                      <span className="text-amber-400 font-mono text-xs">{formState.issueDateFontSize || 11}px</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={24}
                      value={formState.issueDateFontSize || 11}
                      onChange={e => handleChange('issueDateFontSize', Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <p className="text-[10.5px] text-slate-400">
                      Format pratinjau: <strong>{formState.issueCity || 'Jakarta'}, {previewCert.issueDate}</strong> (dapat digeser & diubah skalanya secara independen).
                    </p>
                  </div>
                </div>

                {/* Mode Selector Toggle */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="block text-slate-300 font-bold">Sumber Nama Instruktur:</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleChange('useCourseInstructor', true)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer ${
                        formState.useCourseInstructor !== false
                          ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          formState.useCourseInstructor !== false ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                        }`}>
                          {formState.useCourseInstructor !== false && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                        <span className="font-bold text-xs">Otomatis Sesuai Kursus</span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 pl-5 leading-tight">
                        Mengambil nama mentor langsung dari data kursus terkait (misal: Rian Pratama, S.Kom., Dr. Hendra Wijaya).
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChange('useCourseInstructor', false)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer ${
                        formState.useCourseInstructor === false
                          ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          formState.useCourseInstructor === false ? 'border-amber-500 bg-amber-500' : 'border-slate-600'
                        }`}>
                          {formState.useCourseInstructor === false && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                        <span className="font-bold text-xs">Manual / Kustom Tetap</span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 pl-5 leading-tight">
                        Tetapkan satu nama penanggung jawab / direktur tetap untuk seluruh sertifikat.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Conditional Fields based on Mode */}
                {formState.useCourseInstructor !== false ? (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mode Otomatis Aktif</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Sertifikat yang diterbitkan akan otomatis menampilkan nama mentor sesuai kursus masing-masing.
                    </p>
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="text-[10px] text-slate-400">Contoh data instruktur kursus saat ini:</div>
                      <div className="font-bold text-white text-xs">{selectedCourse?.instructor?.name || 'Rian Pratama, S.Kom.'}</div>
                      <div className="text-amber-400 text-[10.5px]">{selectedCourse?.instructor?.title || 'Senior Full-Stack Architect'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Nama Lengkap & Gelar Instruktur / Penanggung Jawab Tetap
                      </label>
                      <input
                        type="text"
                        value={formState.leadInstructorName || formState.signatureName || ''}
                        onChange={e => {
                          handleChange('leadInstructorName', e.target.value);
                          handleChange('signatureName', e.target.value);
                        }}
                        placeholder="Dr. Aris Prasetyo, M.Kom."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Teks Jabatan Penandatangan (LEAD MASTER INSTRUCTOR) */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Teks Jabatan Penandatangan (Diatas Tanda Tangan)
                    </label>
                    <input
                      type="text"
                      value={formState.leadInstructorTitle || formState.signatureTitle || 'LEAD MASTER INSTRUCTOR'}
                      onChange={e => {
                        handleChange('leadInstructorTitle', e.target.value);
                        handleChange('signatureTitle', e.target.value);
                      }}
                      placeholder="LEAD MASTER INSTRUCTOR"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none uppercase"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">
                      Posisi: Tepat di bawah tempat/tanggal dan di atas area tanda tangan.
                    </p>
                  </div>

                  {/* Font Size Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-bold text-[11px]">
                          Ukuran Teks Jabatan ({formState.instructorTitleFontSize || 11}px)
                        </label>
                      </div>
                      <input
                        type="range"
                        min={8}
                        max={24}
                        value={formState.instructorTitleFontSize || 11}
                        onChange={e => handleChange('instructorTitleFontSize', Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-bold text-[11px]">
                          Ukuran Nama Instruktur ({formState.instructorNameFontSize || 13}px)
                        </label>
                      </div>
                      <input
                        type="range"
                        min={9}
                        max={28}
                        value={formState.instructorNameFontSize || 13}
                        onChange={e => handleChange('instructorNameFontSize', Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Digital Signature Image Asset & Dimensions */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-300 font-bold text-xs">
                      Asset Gambar Tanda Tangan Resmi (PNG Transparan)
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">Tinggi: {formState.signatureHeight || 40}px</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formState.signatureImageUrl || ''}
                      onChange={e => handleChange('signatureImageUrl', e.target.value)}
                      placeholder="https://.../signature.png"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none font-mono text-[11px]"
                    />
                    <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 border border-slate-700">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('signatureImageUrl', file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">Tinggi Area / Gambar Tanda Tangan:</span>
                      <span className="font-mono text-amber-400">{formState.signatureHeight || 40}px</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={120}
                      value={formState.signatureHeight || 40}
                      onChange={e => handleChange('signatureHeight', Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Signature Underline Settings */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold text-xs">Garis Pembatas Tanda Tangan</span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      {formState.signatureLineWidth || 200}px × {formState.signatureLineThickness || 2}px
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Panjang Garis</span>
                        <span className="font-mono text-amber-400">{formState.signatureLineWidth || 200}px</span>
                      </div>
                      <input
                        type="range"
                        min={60}
                        max={320}
                        value={formState.signatureLineWidth || 200}
                        onChange={e => handleChange('signatureLineWidth', Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Ketebalan Garis</span>
                        <span className="font-mono text-amber-400">{formState.signatureLineThickness || 2}px</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={6}
                        value={formState.signatureLineThickness || 2}
                        onChange={e => handleChange('signatureLineThickness', Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Column with Interactive Canvas */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col justify-between">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Visual Studio Canvas</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold">
                    A4 Landscape
                  </span>
                </div>

                {/* Course Switcher for Live Automatic Instructor Testing */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">Tes Kursus:</span>
                  <select
                    value={previewCourseId}
                    onChange={e => setPreviewCourseId(e.target.value)}
                    className="bg-transparent text-xs text-amber-400 font-medium outline-none cursor-pointer max-w-[200px] truncate"
                    title="Pilih kursus untuk melihat pratinjau nama instruktur otomatis"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.title} ({c.instructor?.name || 'Instruktur'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedElementId && (
                  <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                    <Scaling className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ukuran:</span>
                    <button
                      type="button"
                      onClick={() => nudgeScale(selectedElementId, -0.05)}
                      className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer border border-amber-500/40 ml-1"
                      title="Perkecil (-5%)"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="font-mono px-1">
                      {Math.round(
                        ((formState.customElements?.find(e => e.id === selectedElementId)?.scale ??
                          formState.elementOffsets?.[selectedElementId]?.scale ??
                          1) * 100)
                      )}%
                    </span>
                    <button
                      type="button"
                      onClick={() => nudgeScale(selectedElementId, 0.05)}
                      className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer border border-amber-500/40"
                      title="Perbesar (+5%)"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => resetElementSize(selectedElementId)}
                      className="text-[10px] underline ml-1 text-slate-300 hover:text-white"
                      title="Reset Skala ke 100%"
                    >
                      100%
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedElementId(null)}
                      className="text-slate-400 hover:text-white ml-1 p-0.5"
                      title="Tutup Seleksi"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      previewDevice === 'desktop' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Tampilan Desktop"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Desktop</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      previewDevice === 'mobile' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Simulasi Mobile Responsive"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Ponsel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Canvas Viewport with Mouse Move / Drag & Drop listeners */}
            <div
              className="w-full overflow-x-auto py-4 flex justify-center custom-scrollbar bg-slate-950/60 rounded-xl my-2 p-2 relative select-none"
              onMouseMove={handleMouseMoveOnCanvas}
              onMouseUp={handleMouseUpCanvas}
              onMouseLeave={handleMouseUpCanvas}
            >
              <div
                style={{
                  transform: previewDevice === 'mobile' ? 'scale(0.52)' : 'scale(0.68)',
                  transformOrigin: 'top center',
                  marginBottom: previewDevice === 'mobile' ? '-240px' : '-160px'
                }}
              >
                {/* Visual Certificate Card Preview (Aspect Ratio 1.414:1) */}
                <div
                  id="admin-preview-cert"
                  onClick={() => setSelectedElementId(null)}
                  className="relative text-slate-950 rounded-2xl p-10 shadow-2xl overflow-hidden w-[960px] min-w-[960px] aspect-[1.414/1] flex flex-col justify-between transition-colors duration-200"
                  style={{
                    backgroundColor: formState.backgroundColor || '#fdfbf7',
                    color: formState.textColor || '#0f172a',
                    borderWidth: `${formState.borderThickness || 14}px`,
                    borderColor: formState.primaryColor || '#0f172a',
                    borderStyle:
                      formState.borderStyle === 'double'
                        ? 'double'
                        : formState.borderStyle === 'dashed'
                        ? 'dashed'
                        : 'solid',
                    fontFamily:
                      formState.fontFamily === 'mono'
                        ? 'monospace'
                        : formState.fontFamily === 'sans'
                        ? 'sans-serif'
                        : 'serif',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), inset 0 0 100px rgba(217, 119, 6, 0.05)'
                  }}
                >
                  {/* Inner Accent Perimeter */}
                  <div
                    className="absolute inset-2.5 pointer-events-none rounded-lg"
                    style={{ border: `2px solid ${formState.accentColor || '#d97706'}` }}
                  />

                  {/* Watermark Image or Crest */}
                  {formState.showWatermark && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                      {formState.customWatermarkImageUrl ? (
                        <img
                          src={formState.customWatermarkImageUrl}
                          alt="Watermark"
                          className="w-[340px] h-[340px] object-contain"
                        />
                      ) : (
                        <Award
                          className="w-[340px] h-[340px]"
                          style={{ color: formState.accentColor || '#d97706' }}
                        />
                      )}
                    </div>
                  )}

                  {/* Corner Baroque Ornaments */}
                  {formState.showCornerOrnaments && (
                    <>
                      <div className="absolute top-3 left-3 text-amber-600/80 pointer-events-none">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="absolute top-3 right-3 text-amber-600/80 pointer-events-none">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="absolute bottom-3 left-3 text-amber-600/80 pointer-events-none">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="absolute bottom-3 right-3 text-amber-600/80 pointer-events-none">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    </>
                  )}

                  {/* 1. Header Area (Logo & Official Titles) */}
                  <div className="relative z-10 text-center space-y-2">
                    {/* Official Logo Element */}
                    {formState.showLogo !== false && (
                      <div
                        onMouseDown={e => handleMouseDownOnElement('logo', e)}
                        style={{
                          transform: `translate(${formState.elementOffsets?.logo?.x || 0}px, ${
                            formState.elementOffsets?.logo?.y || 0
                          }px) scale(${formState.elementOffsets?.logo?.scale || 1})`,
                          transformOrigin: 'center center',
                          display: formState.elementOffsets?.logo?.visible === false ? 'none' : 'flex'
                        }}
                        className={`items-center justify-center gap-3 cursor-move inline-flex rounded-xl p-1 transition ${
                          selectedElementId === 'logo' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : ''
                        }`}
                      >
                        {resolvedLogoUrl ? (
                          <div
                            className="rounded-2xl bg-white shadow-md border-2 border-amber-500 flex items-center justify-center p-1.5"
                            style={{ height: `${formState.logoSize || 52}px` }}
                          >
                            <img
                              src={resolvedLogoUrl}
                              alt="Logo"
                              style={{ height: `${(formState.logoSize || 52) - 10}px` }}
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div
                            className="rounded-2xl bg-slate-900 border-2 border-amber-500 flex items-center justify-center p-2 text-amber-400"
                            style={{ height: `${formState.logoSize || 52}px`, width: `${formState.logoSize || 52}px` }}
                          >
                            <GraduationCap className="w-full h-full" />
                          </div>
                        )}

                        <div className="text-left shrink-0">
                          <h3
                            className="font-black text-lg tracking-wider uppercase text-slate-950 whitespace-nowrap"
                            style={{ color: formState.primaryColor || '#0f172a', whiteSpace: 'nowrap' }}
                          >
                            {formState.institutionName || websiteSettings.siteName || 'LESIN AJA'}
                          </h3>
                          <p className="text-[10px] font-bold tracking-widest uppercase text-amber-700 whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                            {formState.institutionTagline || 'LEMBAGA PENDIDIKAN & SERTIFIKASI RESMI'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Header Title Document */}
                    <div
                      onMouseDown={e => handleMouseDownOnElement('header_title', e)}
                      style={{
                        transform: `translate(${formState.elementOffsets?.header_title?.x || 0}px, ${
                          formState.elementOffsets?.header_title?.y || 0
                        }px) scale(${formState.elementOffsets?.header_title?.scale || 1})`,
                        transformOrigin: 'center center',
                        display: formState.elementOffsets?.header_title?.visible === false ? 'none' : 'block'
                      }}
                      className={`cursor-move rounded-xl p-1 transition ${
                        selectedElementId === 'header_title' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : ''
                      }`}
                    >
                      <h1
                        className="text-3xl font-black uppercase tracking-wider"
                        style={{
                          color: formState.primaryColor || '#0f172a',
                          fontSize: formState.headerTitleFontSize ? `${formState.headerTitleFontSize}px` : undefined
                        }}
                      >
                        {formState.customHeaderTitle || 'SERTIFIKAT KELULUSAN RESMI'}
                      </h1>
                    </div>

                    {/* Subtitle */}
                    <div
                      onMouseDown={e => handleMouseDownOnElement('subtitle', e)}
                      style={{
                        transform: `translate(${formState.elementOffsets?.subtitle?.x || 0}px, ${
                          formState.elementOffsets?.subtitle?.y || 0
                        }px) scale(${formState.elementOffsets?.subtitle?.scale || 1})`,
                        transformOrigin: 'center center',
                        display: formState.elementOffsets?.subtitle?.visible === false ? 'none' : 'block'
                      }}
                      className={`cursor-move rounded-xl p-1 transition ${
                        selectedElementId === 'subtitle' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : ''
                      }`}
                    >
                      <p
                        className="text-xs max-w-xl mx-auto opacity-80 leading-relaxed"
                        style={{
                          fontSize: formState.subtitleFontSize ? `${formState.subtitleFontSize}px` : undefined
                        }}
                      >
                        {formState.customSubtitle ||
                          'Diberikan dengan hormat sebagai pengakuan dan bukti kelulusan atas pencapaian kompetensi dalam menyelesaikan program:'}
                      </p>
                    </div>

                    {/* Reg Strip */}
                    <div
                      onMouseDown={e => handleMouseDownOnElement('reg_strip', e)}
                      style={{
                        transform: `translate(${formState.elementOffsets?.reg_strip?.x || 0}px, ${
                          formState.elementOffsets?.reg_strip?.y || 0
                        }px) scale(${formState.elementOffsets?.reg_strip?.scale || 1})`,
                        transformOrigin: 'center center',
                        display: formState.elementOffsets?.reg_strip?.visible === false ? 'none' : 'inline-block'
                      }}
                      className={`cursor-move rounded-full px-3 py-0.5 bg-amber-50 border border-amber-400/60 text-[10px] font-mono font-bold text-slate-700 shadow-xs ${
                        selectedElementId === 'reg_strip' ? 'ring-2 ring-amber-500 shadow-lg' : ''
                      }`}
                    >
                      <span style={{ fontSize: formState.regStripFontSize ? `${formState.regStripFontSize}px` : undefined }}>
                        No. Registrasi:{' '}
                      </span>
                      <strong
                        className="text-slate-950"
                        style={{ fontSize: formState.regStripFontSize ? `${formState.regStripFontSize}px` : undefined }}
                      >
                        {previewCert.certificateNumber}
                      </strong>
                    </div>
                  </div>

                  {/* 2. Recipient & Course Area */}
                  <div className="relative z-10 text-center space-y-3 my-auto">
                    {/* Recipient Name */}
                    <div
                      onMouseDown={e => handleMouseDownOnElement('recipient_name', e)}
                      style={{
                        transform: `translate(${formState.elementOffsets?.recipient_name?.x || 0}px, ${
                          formState.elementOffsets?.recipient_name?.y || 0
                        }px) scale(${formState.elementOffsets?.recipient_name?.scale || 1})`,
                        transformOrigin: 'center center',
                        display: formState.elementOffsets?.recipient_name?.visible === false ? 'none' : 'block'
                      }}
                      className={`cursor-move rounded-2xl p-1 transition ${
                        selectedElementId === 'recipient_name' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : ''
                      }`}
                    >
                      <p className="text-xs uppercase tracking-widest font-semibold opacity-70">
                        Diberikan Kepada Siswa Berprestasi:
                      </p>
                      <h2
                        className="text-4xl font-extrabold tracking-tight underline decoration-amber-500/60 decoration-2 underline-offset-8"
                        style={{
                          color: formState.primaryColor || '#0f172a',
                          fontSize: formState.recipientNameFontSize ? `${formState.recipientNameFontSize}px` : undefined
                        }}
                      >
                        {previewCert.studentName}
                      </h2>
                    </div>

                    {/* Course Title & Badges */}
                    <div
                      onMouseDown={e => handleMouseDownOnElement('course_title', e)}
                      style={{
                        transform: `translate(${formState.elementOffsets?.course_title?.x || 0}px, ${
                          formState.elementOffsets?.course_title?.y || 0
                        }px) scale(${formState.elementOffsets?.course_title?.scale || 1})`,
                        transformOrigin: 'center center',
                        display: formState.elementOffsets?.course_title?.visible === false ? 'none' : 'block'
                      }}
                      className={`cursor-move rounded-2xl p-1 transition ${
                        selectedElementId === 'course_title' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : ''
                      }`}
                    >
                      <p className="text-xs opacity-75">Telah menyelesaikan program keahlian:</p>
                      <h3
                        className="text-xl font-bold mt-0.5"
                        style={{
                          color: formState.accentColor || '#d97706',
                          fontSize: formState.courseTitleFontSize ? `${formState.courseTitleFontSize}px` : undefined
                        }}
                      >
                        {previewCert.courseTitle}
                      </h3>
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 border border-slate-900/10 text-xs font-bold">
                        <span>Predikat: {previewCert.grade}</span>
                        <span>•</span>
                        <span>Skor: {previewCert.score}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Custom Elements Rendered over Canvas */}
                  {(formState.customElements || []).map(customEl => {
                    if (customEl.visible === false) return null;
                    const isSelected = selectedElementId === customEl.id;

                    return (
                      <div
                        key={customEl.id}
                        onMouseDown={e => handleMouseDownOnElement(customEl.id, e)}
                        style={{
                          position: 'absolute',
                          left: `${customEl.posX}%`,
                          top: `${customEl.posY}%`,
                          transform: `translate(-50%, -50%) scale(${customEl.scale || 1})`,
                          transformOrigin: 'center center',
                          color: customEl.color || formState.textColor || '#0f172a',
                          zIndex: 20
                        }}
                        className={`cursor-move p-1.5 rounded-lg select-none transition ${
                          isSelected ? 'ring-2 ring-cyan-500 bg-cyan-500/20 shadow-lg' : 'hover:ring-1 hover:ring-slate-400'
                        }`}
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

                  {/* 3. Footer Area: Fixed 3-Zone (QR Code, 3D Gold Seal, Single Lead Master Instructor Signature) */}
                  <div className="relative z-10 flex items-end justify-between pt-4 border-t border-slate-900/10">
                    {/* Left: QR Code Verification */}
                    <div
                      onMouseDown={e => handleMouseDownOnElement('qr_code', e)}
                      style={{
                        transform: `translate(${formState.elementOffsets?.qr_code?.x || 0}px, ${
                          formState.elementOffsets?.qr_code?.y || 0
                        }px) scale(${formState.elementOffsets?.qr_code?.scale || 1})`,
                        transformOrigin: 'bottom left',
                        display: formState.elementOffsets?.qr_code?.visible === false ? 'none' : 'block'
                      }}
                      className={`text-left space-y-1 w-52 cursor-move rounded-xl p-1 transition ${
                        selectedElementId === 'qr_code' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : ''
                      }`}
                    >
                      {formState.showQrCode !== false && (
                        <div className="p-1.5 bg-white rounded-lg border border-slate-300 inline-block shadow-sm">
                          <QRCodeSVG
                            value={`https://verify.academy/cert/${previewCert.certificateNumber}`}
                            size={formState.qrCodeSize || 56}
                            level="M"
                          />
                        </div>
                      )}
                      <p className="text-[10px] font-mono font-bold opacity-75">
                        NO: {previewCert.certificateNumber}
                      </p>
                      <p className="text-[9px] opacity-60">Diterbitkan: {previewCert.issueDate}</p>
                    </div>

                    {/* Center: Medallion Seal (Custom Upload or 3D Gold Seal) */}
                    <div
                      onMouseDown={e => handleMouseDownOnElement('seal_medallion', e)}
                      style={{
                        transform: `translate(${formState.elementOffsets?.seal_medallion?.x || 0}px, ${
                          formState.elementOffsets?.seal_medallion?.y || 0
                        }px) scale(${formState.elementOffsets?.seal_medallion?.scale || 1})`,
                        transformOrigin: 'bottom center',
                        display: formState.elementOffsets?.seal_medallion?.visible === false ? 'none' : 'flex'
                      }}
                      className={`flex flex-col items-center justify-center cursor-move rounded-2xl p-1 transition ${
                        selectedElementId === 'seal_medallion' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : ''
                      }`}
                    >
                      {formState.showGoldSeal !== false && (
                        <>
                          {formState.customSealImageUrl ? (
                            <img
                              src={formState.customSealImageUrl}
                              alt="Official Seal"
                              style={{ width: `${formState.sealSize || 80}px`, height: `${formState.sealSize || 80}px` }}
                              className="object-contain drop-shadow-xl"
                            />
                          ) : (
                            <div
                              className="rounded-full flex flex-col items-center justify-center text-center shadow-lg border-2"
                              style={{
                                width: `${formState.sealSize || 80}px`,
                                height: `${formState.sealSize || 80}px`,
                                backgroundColor: formState.sealType === 'wax_seal' ? '#991b1b' : '#f59e0b',
                                borderColor: '#ffffff',
                                color: '#ffffff'
                              }}
                            >
                              <Award className="w-8 h-8 text-white filter drop-shadow" />
                              <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">
                                RESMI & VALID
                              </span>
                            </div>
                          )}
                          {formState.showRibbons !== false && !formState.customSealImageUrl && (
                            <div className="flex gap-1 -mt-1">
                              <div className="w-3 h-6 bg-blue-900 border border-amber-400 transform -rotate-12 rounded-b" />
                              <div className="w-3 h-6 bg-blue-900 border border-amber-400 transform rotate-12 rounded-b" />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Right: Modular Instructor & Signature Block (Separated Elements) */}
                    <div className="flex flex-col items-end text-right space-y-1 w-60">
                      {/* 1. Tempat (Kota) & Tanggal Penandatanganan */}
                      {formState.showIssueCityDate !== false && (
                        <div
                          onMouseDown={e => handleMouseDownOnElement('issue_place_date', e)}
                          style={{
                            transform: `translate(${
                              formState.elementOffsets?.issue_place_date?.x ?? formState.elementOffsets?.lead_signature?.x ?? 0
                            }px, ${
                              formState.elementOffsets?.issue_place_date?.y ?? formState.elementOffsets?.lead_signature?.y ?? 0
                            }px) scale(${formState.elementOffsets?.issue_place_date?.scale || 1})`,
                            transformOrigin: 'bottom right',
                            display: formState.elementOffsets?.issue_place_date?.visible === false ? 'none' : 'block'
                          }}
                          className={`cursor-move rounded-lg p-0.5 transition ${
                            selectedElementId === 'issue_place_date' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : 'hover:ring-1 hover:ring-slate-400/40'
                          }`}
                        >
                          <p
                            className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 pb-0.5"
                            style={{ fontSize: `${formState.issueDateFontSize || 11}px` }}
                          >
                            {formState.issueCity || 'Jakarta'}, {previewCert.issueDate}
                          </p>
                        </div>
                      )}

                      {/* 2. Teks LEAD MASTER INSTRUCTOR (Diatas Tanda Tangan, Dibawah Tempat/Tanggal) */}
                      <div
                        onMouseDown={e => handleMouseDownOnElement('instructor_title', e)}
                        style={{
                          transform: `translate(${formState.elementOffsets?.instructor_title?.x || 0}px, ${
                            formState.elementOffsets?.instructor_title?.y || 0
                          }px) scale(${formState.elementOffsets?.instructor_title?.scale || 1})`,
                          transformOrigin: 'bottom right',
                          display: formState.elementOffsets?.instructor_title?.visible === false ? 'none' : 'block'
                        }}
                        className={`cursor-move rounded-lg p-0.5 transition ${
                          selectedElementId === 'instructor_title' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : 'hover:ring-1 hover:ring-slate-400/40'
                        }`}
                      >
                        <p
                          className="font-black text-amber-800 uppercase tracking-wider leading-tight"
                          style={{ fontSize: `${formState.instructorTitleFontSize || 11}px` }}
                        >
                          {formState.leadInstructorTitle || formState.signatureTitle || 'LEAD MASTER INSTRUCTOR'}
                        </p>
                      </div>

                      {/* 3. Tanda Tangan */}
                      <div
                        onMouseDown={e => handleMouseDownOnElement('signature_drawing', e)}
                        style={{
                          transform: `translate(${formState.elementOffsets?.signature_drawing?.x || 0}px, ${
                            formState.elementOffsets?.signature_drawing?.y || 0
                          }px) scale(${formState.elementOffsets?.signature_drawing?.scale || 1})`,
                          transformOrigin: 'bottom right',
                          display: formState.elementOffsets?.signature_drawing?.visible === false ? 'none' : 'flex'
                        }}
                        className={`cursor-move rounded-lg p-1 transition items-center justify-end w-full ${
                          selectedElementId === 'signature_drawing' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : 'hover:ring-1 hover:ring-slate-400/40'
                        }`}
                      >
                        <div
                          className="flex items-center justify-end w-full pr-1"
                          style={{ height: `${formState.signatureHeight || 40}px` }}
                        >
                          {formState.signatureImageUrl ? (
                            <img
                              src={formState.signatureImageUrl}
                              alt="Signature"
                              style={{ maxHeight: `${formState.signatureHeight || 40}px` }}
                              className="object-contain"
                            />
                          ) : (
                            <span className="font-serif italic font-bold text-lg opacity-80 underline decoration-slate-400">
                              {singleLeadInstructorName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 4. Garis Pembatas Tanda Tangan */}
                      <div
                        onMouseDown={e => handleMouseDownOnElement('signature_line', e)}
                        style={{
                          transform: `translate(${formState.elementOffsets?.signature_line?.x || 0}px, ${
                            formState.elementOffsets?.signature_line?.y || 0
                          }px) scale(${formState.elementOffsets?.signature_line?.scale || 1})`,
                          transformOrigin: 'bottom right',
                          display: formState.elementOffsets?.signature_line?.visible === false ? 'none' : 'flex'
                        }}
                        className={`cursor-move rounded-sm py-1 transition flex justify-end w-full ${
                          selectedElementId === 'signature_line' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : 'hover:ring-1 hover:ring-slate-400/40'
                        }`}
                      >
                        <div
                          style={{
                            width: `${formState.signatureLineWidth || 200}px`,
                            borderBottomWidth: `${formState.signatureLineThickness || 2}px`
                          }}
                          className="border-slate-950/80"
                        />
                      </div>

                      {/* 5. Nama Instruktur */}
                      <div
                        onMouseDown={e => handleMouseDownOnElement('instructor_name', e)}
                        style={{
                          transform: `translate(${formState.elementOffsets?.instructor_name?.x || 0}px, ${
                            formState.elementOffsets?.instructor_name?.y || 0
                          }px) scale(${formState.elementOffsets?.instructor_name?.scale || 1})`,
                          transformOrigin: 'bottom right',
                          display: formState.elementOffsets?.instructor_name?.visible === false ? 'none' : 'block'
                        }}
                        className={`cursor-move rounded-lg p-0.5 transition ${
                          selectedElementId === 'instructor_name' ? 'ring-2 ring-amber-500 bg-amber-500/10 shadow-lg' : 'hover:ring-1 hover:ring-slate-400/40'
                        }`}
                      >
                        <p
                          className="font-black text-slate-950 uppercase tracking-wide pt-0.5"
                          style={{ fontSize: `${formState.instructorNameFontSize || 13}px` }}
                        >
                          {singleLeadInstructorName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stamp if configured */}
                  {formState.customStampImageUrl && (
                    <div
                      onMouseDown={e => handleMouseDownOnElement('stamp_seal', e)}
                      style={{
                        transform: `translate(${formState.elementOffsets?.stamp_seal?.x || 0}px, ${
                          formState.elementOffsets?.stamp_seal?.y || 0
                        }px) scale(${formState.elementOffsets?.stamp_seal?.scale || 1}) rotate(-8deg)`,
                        transformOrigin: 'center center',
                        display: formState.elementOffsets?.stamp_seal?.visible === false ? 'none' : 'block',
                        position: 'absolute',
                        bottom: '24px',
                        right: '180px',
                        zIndex: 15
                      }}
                      className={`cursor-move p-1 rounded-xl transition opacity-85 ${
                        selectedElementId === 'stamp_seal' ? 'ring-2 ring-purple-500 bg-purple-500/10 shadow-lg' : ''
                      }`}
                    >
                      <img
                        src={formState.customStampImageUrl}
                        alt="Stamp"
                        style={{ width: `${formState.stampSize || 64}px`, height: `${formState.stampSize || 64}px` }}
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                <span>Klik & geser elemen di kanvas untuk memindahkan posisi elemen secara presisi.</span>
              </span>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Konfigurasi</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Element Modal */}
      {showAddElementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading font-extrabold text-base">Tambah Elemen Kustom Baru</h3>
              </div>
              <button
                onClick={() => setShowAddElementModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Tipe Elemen</label>
                <select
                  value={newElementType}
                  onChange={e => setNewElementType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                >
                  <option value="text">Teks Kustom (Contoh: SK Akreditasi / Lokasi)</option>
                  <option value="badge">Badge / Pita Predikat (Contoh: DISTINCTION)</option>
                  <option value="divider">Garis Ornamen / Pembatas Emas</option>
                  <option value="image">Gambar / Logo Tambahan (Upload/URL)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Label Elemen</label>
                <input
                  type="text"
                  value={newElementLabel}
                  onChange={e => setNewElementLabel(e.target.value)}
                  placeholder="Contoh: No. SK Akreditasi"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                />
              </div>

              {newElementType !== 'divider' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    {newElementType === 'image' ? 'URL Gambar / Unggah File' : 'Konten / Teks'}
                  </label>
                  {newElementType === 'image' ? (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = ev => setNewElementContent(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-slate-400 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newElementContent}
                        onChange={e => setNewElementContent(e.target.value)}
                        placeholder="Atau masukkan URL gambar..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={newElementContent}
                      onChange={e => setNewElementContent(e.target.value)}
                      placeholder={
                        newElementType === 'badge' ? 'AKREDITASI UNGGUL A' : 'SK Kemenaker RI No. 512/2026'
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 outline-none"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddElementModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                onClick={handleAddCustomElement}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition shadow-md"
              >
                Tambahkan ke Sertifikat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Reset Default */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-white">Reset Desain ke Standar Default?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tindakan ini akan mengembalikan seluruh template, warna, ornamen, stempel, dan posisi elemen sertifikat ke pengaturan standar bawaan. Perubahan kustom akan ditimpa.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Ya, Reset ke Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Skema SQL Supabase */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                <Database className="w-5 h-5" />
                <span>Skema SQL Supabase: Tabel certificate_design</span>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Jalankan perintah SQL ini di menu <strong>SQL Editor</strong> pada dasbor <strong>Supabase</strong> Anda untuk membuat tabel penyimpanan konfigurasi desain sertifikat. Dengan tabel ini, seluruh desain sertifikat akan tersinkronisasi otomatis di semua browser dan perangkat.
            </p>

            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800 text-slate-200 text-xs p-4 rounded-xl font-mono overflow-x-auto max-h-64 leading-relaxed">
                {SUPABASE_SQL_SCHEMA_CERTIFICATE_DESIGN}
              </pre>
              <button
                onClick={handleCopySql}
                className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs">
              <span className="text-cyan-200">
                Tabel ini menggunakan ID tunggal <code>'default'</code> sehingga aman dari duplikasi konfigurasi.
              </span>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition ml-2 shrink-0 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
