export type Role = 'admin' | 'student' | 'instructor';

export type InstructorApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface SpecializationCertificate {
  specialization: string;
  certificateUrl: string;
  certificateName?: string;
}

export interface InstructorApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  title: string; // Gelar / Jabatan Profesional (e.g. 'Senior Software Architect', 'S.Kom., M.T.')
  institution?: string; // Institusi / Perusahaan / Kampus
  specialization: string; // Bidang Keahlian (e.g. 'Web Development', 'Data Science & AI')
  specializations?: string[]; // Daftar bidang keahlian (Maksimal 5)
  bio?: string; // Pengalaman & ringkasan keahlian
  certificateUrl: string; // URL file ijazah/sertifikat yang diunggah
  certificateName?: string; // Nama file ijazah/sertifikat
  certificates?: SpecializationCertificate[]; // Berkas sertifikat/ijazah per bidang keahlian
  idCardUrl?: string; // KTP / Identitas resmi pendukung (opsional)
  signatureUrl?: string; // Tanda tangan digital calon instruktur (untuk e-sertifikat kursus)
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  status: InstructorApplicationStatus;
  rejectionReason?: string; // Catatan penolakan jika ditolak admin
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  phone?: string;
  enrolledCourseIds: string[];
  createdAt: string;
  bio?: string;
  institution?: string;
  isEmailVerified?: boolean;
  emailVerifiedAt?: string;
  title?: string; // Gelar / Jabatan instruktur (e.g. 'Lead Full-Stack Developer')
  signatureUrl?: string; // Tanda tangan digital transparan untuk e-sertifikat
  balance?: number; // Saldo komisi pendapatan kursus (Rp)
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  // Instructor Verification Status
  instructorStatus?: InstructorApplicationStatus;
  instructorCertificateUrl?: string;
  instructorCertificateName?: string;
  instructorCertificates?: SpecializationCertificate[]; // Berkas sertifikat/ijazah per bidang
  instructorSpecialization?: string;
  instructorSpecializations?: string[]; // Daftar bidang keahlian instruktur (Maksimal 5)
  instructorRejectionReason?: string;
  instructorAppliedAt?: string;
  instructorVerifiedAt?: string;
}

export type CourseCategory = string;

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string; // e.g. 'blue', 'emerald', 'amber', 'purple', 'rose', 'indigo', 'cyan'
  order?: number;
  isActive?: boolean;
}

export type ResourceType =
  | 'pdf'
  | 'excel'
  | 'word'
  | 'powerpoint'
  | 'image'
  | 'zip'
  | 'link'
  | 'drive'
  | 'audio'
  | 'video'
  | 'code'
  | 'other';

export interface ResourceItem {
  id: string;
  name: string;
  url: string;
  type: ResourceType;
  size?: string;
  fileType?: string;
  uploadedAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  minScoreToPass: number; // e.g. 75
  questions: QuizQuestion[];
  timeLimitMinutes?: number;
}

export interface CourseModule {
  id: string;
  title: string;
  duration: string; // e.g. "15:30"
  durationMinutes: number;
  isPreview?: boolean;
  videoUrl: string; // YouTube embed or direct video URL
  videoType: 'youtube' | 'drive' | 'mp4';
  description: string;
  materi?: string; // Teks materi pelajaran, artikel, rangkuman, catatan pendukung, atau code snippet
  resources: ResourceItem[];
  quiz?: Quiz;
}

export interface AttachedBundleCourse {
  courseId: string;
  specialPrice: number; // Harga spesial saat dibeli bundling bersama kursus ini
  courseTitle?: string;
  thumbnail?: string;
  originalPrice?: number;
}

export type CourseVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: CourseCategory;
  level: 'Pemula' | 'Menengah' | 'Lanjutan' | 'Semua Level';
  instructorId?: string; // ID user instruktur resmi terdaftar
  instructor: {
    id: string;
    name: string;
    avatar: string;
    title: string;
    signatureUrl?: string;
    certificateUrl?: string; // Salinan sertifikat/ijazah instruktur
  };
  signatureUrl?: string; // Tanda tangan instruktur langsung pada kursus
  thumbnail: string;
  price: number;
  originalPrice: number;
  allowCustomPrice?: boolean; // Fitur Bayar Seikhlasnya (Pay What You Want)
  minCustomPrice?: number;    // Minimal nominal pembayaran oleh buyer (misal Rp 10.000)
  suggestedCustomPrices?: number[]; // Pilihan nominal cepat e.g. [20000, 50000, 100000]
  attachedBundleCourses?: AttachedBundleCourse[]; // Fitur Bundling Manual dengan harga khusus
  rating: number;
  studentsCount: number;
  modules: CourseModule[];
  certificateAvailable: boolean;
  tags: string[];
  isFeatured?: boolean;
  isPopular?: boolean;
  // Course Verification by Admin
  verificationStatus?: CourseVerificationStatus; // 'pending' | 'approved' | 'rejected'
  rejectionReason?: string; // Alasan penolakan admin (misal tidak sesuai sertifikat instruktur)
  verifiedAt?: string;
  verifiedBy?: string;
  status?: 'published' | 'draft' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface LiveSession {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  instructorAvatar: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM WIB
  durationMinutes: number;
  meetUrl: string;
  platform: 'Google Meet' | 'Zoom' | 'YouTube Live';
  description: string;
  maxAttendees: number;
  registeredStudentIds: string[];
  isLiveNow?: boolean;
  isCompleted?: boolean;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  instructorTitle?: string;
  signatureUrl?: string;
  issueDate: string;
  grade: string; // e.g. 'Sangat Memuaskan (A)'
  score: number;
  verificationHash: string;
  createdAt?: string;
}

export type CertificateTemplateStyle =
  | 'royal_gold'
  | 'classic_gold'
  | 'navy_executive'
  | 'royal_emerald'
  | 'emerald_heritage'
  | 'crimson_burgundy'
  | 'minimalist_titanium'
  | 'modern_dark'
  | 'modern_minimal'
  | 'tech_cyber'
  | 'vintage_creed'
  | 'academic_slate';

export interface CertificateCustomElement {
  id: string;
  type: 'text' | 'image' | 'badge' | 'divider' | 'stamp';
  label: string;
  content: string; // text content or image data URL
  posX: number; // percentage (0-100) or offset in px
  posY: number; // percentage (0-100) or offset in px
  width?: number;
  height?: number;
  scale?: number; // scale multiplier e.g. 1.0, 1.2
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'black';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  align?: 'left' | 'center' | 'right';
  visible: boolean;
}

export interface CertificateDesignSettings {
  templateStyle: CertificateTemplateStyle;
  institutionName: string;
  institutionTagline: string;
  institutionSubtext: string;
  syncAppLogo?: boolean; // automatically sync with website logo
  showLogo?: boolean;
  logoSize?: number;
  customLogoImageUrl?: string;
  customHeaderTitle?: string;
  customSubtitle?: string;
  customFooterNote?: string;
  certificateTitle: string;
  certificateSubtitle: string;
  citationText: string;
  useCourseInstructor?: boolean; // When true (default), automatically uses the specific course's instructor name & title
  leadInstructorName?: string; // Strictly 1 single name (optional override)
  leadInstructorTitle?: string; // e.g. 'Lead Master Instructor'
  issueCity?: string; // e.g. 'Jakarta'
  showIssueCityDate?: boolean; // Show signing place & date above signature
  issueDateFontSize?: number; // Font size in px for Issue Place & Date (e.g. 11)
  instructorTitleFontSize?: number; // Font size in px for Lead Master Instructor title (e.g. 11)
  instructorNameFontSize?: number; // Font size in px for Instructor Name (e.g. 13)
  signatureLineWidth?: number; // Width in px for signature underline (e.g. 200)
  signatureLineThickness?: number; // Thickness in px for signature underline (e.g. 2)
  headerTitleFontSize?: number; // Font size in px for main header title (e.g. 28)
  subtitleFontSize?: number; // Font size in px for subtitle (e.g. 12)
  recipientNameFontSize?: number; // Font size in px for student recipient name (e.g. 36)
  courseTitleFontSize?: number; // Font size in px for course title plaque (e.g. 20)
  regStripFontSize?: number; // Font size in px for registration strip (e.g. 10)
  qrCodeSize?: number; // Size in px for QR code (e.g. 56)
  sealSize?: number; // Size in px for seal medallion (e.g. 80)
  stampSize?: number; // Size in px for stamp seal (e.g. 64)
  signatureHeight?: number; // Height in px for signature area (e.g. 40)
  footerNoteFontSize?: number; // Font size in px for footer note (e.g. 10)
  instructorName?: string;
  instructorTitle?: string;
  signatureName?: string;
  signatureTitle?: string;
  signature1Name?: string;
  signature1Title?: string;
  directorName?: string;
  directorTitle?: string;
  primaryColor: string; // e.g. '#b45309'
  secondaryColor: string; // e.g. '#1e3a8a'
  accentColor: string; // e.g. '#f59e0b'
  backgroundColor?: string; // e.g. '#fbfbfa'
  textColor?: string;
  borderStyle?: 'solid' | 'double' | 'dashed' | 'ornate' | 'minimal';
  borderThickness?: number;
  plaqueBgColor?: string;
  show3DSeal?: boolean;
  showGoldSeal?: boolean;
  sealType?: string;
  sealStyle?: '3d_gold_ribbon' | 'modern_round' | 'classic_star' | 'vintage_stamp' | 'gold_3d';
  sealPosition?: 'bottom_center' | 'bottom_left' | 'bottom_right';
  sealTextTop?: string;
  sealTextBottom?: string;
  customSealImageUrl?: string;
  showRibbons?: boolean;
  showWatermark?: boolean;
  watermarkType?: 'award' | 'logo' | 'shield' | 'graduation' | 'crest' | 'custom';
  customWatermarkImageUrl?: string;
  watermarkOpacity?: number;
  showPerimeterFiligree?: boolean;
  showGuillocheBorder?: boolean;
  showCornerOrnaments?: boolean;
  showCenterCrowns?: boolean;
  showQrCode?: boolean;
  qrPosition?: 'bottom_left' | 'bottom_right' | 'bottom_center';
  showGradeBadge?: boolean;
  showScoreBadge?: boolean;
  showStatusBadge?: boolean;
  fontFamily?: string;
  fontFamilyTitle?: 'Cinzel' | 'Playfair Display' | 'Montserrat' | 'Outfit';
  fontFamilyRecipient?: 'Playfair Display' | 'Cinzel' | 'Montserrat' | 'Great Vibes';
  signatureStyle?: 'calligraphy' | 'clean_line' | 'custom_image';
  signatureImageUrl?: string;
  directorSignatureUrl?: string;
  customSignatureImageUrl?: string;
  customStampImageUrl?: string;
  showStamp?: boolean;
  customElements?: CertificateCustomElement[];
  elementOffsets?: Record<
    string,
    {
      x: number;
      y: number;
      visible?: boolean;
      scale?: number; // scale multiplier e.g. 1.0, 1.25, 0.8
      fontSize?: number;
      size?: number;
      width?: number;
      height?: number;
    }
  >;
}

export type PakasirApiMethod =
  | 'qris'
  | 'bni_va'
  | 'bri_va'
  | 'cimb_niaga_va'
  | 'permata_va'
  | 'maybank_va'
  | 'bnc_va'
  | 'sampoerna_va'
  | 'atm_bersama_va'
  | 'artha_graha_va';

export type PaymentMethodType =
  | 'pakasir'
  | 'qris'
  | 'bni_va'
  | 'bri_va'
  | 'cimb_niaga_va'
  | 'permata_va'
  | 'maybank_va'
  | 'bnc_va'
  | 'sampoerna_va'
  | 'atm_bersama_va'
  | 'artha_graha_va'
  | 'bca'
  | 'mandiri'
  | 'gopay'
  | 'dana'
  | 'paymentku'
  | 'paymentku_qris'
  | 'paymentku_bca_va'
  | 'paymentku_bni_va'
  | 'paymentku_bri_va'
  | 'paymentku_mandiri_va'
  | 'paymentku_permata_va'
  | 'paymentku_cimb_va'
  | 'paymentku_bsi_va'
  | 'paymentku_dana'
  | 'paymentku_ovo'
  | 'paymentku_shopeepay'
  | 'paymentku_linkaja'
  | 'paymentku_astrapay'
  | 'paymentku_alfamart'
  | 'paymentku_indomaret';

export interface PaymentkuPaymentResponse {
  status?: string;
  success?: boolean;
  message?: string;
  data?: {
    trx_id?: string;
    reference_id?: string;
    order_id?: string;
    amount?: string | number;
    fee?: number;
    total_amount?: number;
    total_payment?: number;
    payment_method?: string;
    payment_channel?: string;
    payment_number?: string;
    payment_url?: string;
    pay_url?: string;
    checkout_url?: string;
    qr_url?: string;
    qr_string?: string;
    qr_image?: string;
    va_number?: string;
    account_number?: string;
    payment_info?: {
      bank?: string;
      va_number?: string;
      qr_string?: string;
      qr_url?: string;
      qr_image?: string;
      pay_code?: string;
      expiration_date?: string;
      [key: string]: any;
    };
    status?: string;
    expired_at?: string;
    expires_at?: string;
    instructions?: Array<{
      title: string;
      steps: string[];
    }>;
    [key: string]: any;
  };
  error?: string;
  [key: string]: any;
}

export interface PaymentkuWebhookPayload {
  event?: string;
  trx_id?: string;
  reference_id?: string;
  order_id?: string;
  amount?: string | number;
  fee?: number;
  total_fee?: string | number;
  total_payment?: number;
  amount_received?: string | number;
  status?: 'pending' | 'paid' | 'expired' | 'cancelled' | 'failed' | 'refunded' | 'PAID' | 'COMPLETED' | 'completed' | 'FAILED' | 'EXPIRED' | 'PENDING' | string;
  payment_method?: string;
  payment_channel?: string;
  customer_name?: string;
  customer_email?: string;
  paid_at?: string;
  completed_at?: string;
  created_at?: string;
  signature?: string;
  [key: string]: any;
}

export interface PakasirPaymentResponse {
  payment?: {
    project: string;
    order_id: string;
    amount: number;
    fee: number;
    total_payment: number;
    payment_method: string;
    payment_number: string; // QR string or VA number
    expired_at: string;
  };
  error?: string;
  message?: string;
}

export interface PakasirWebhookPayload {
  amount: number;
  order_id: string;
  project: string;
  status: 'completed' | 'failed' | 'pending';
  payment_method: string;
  completed_at: string;
}

export type BundleType = 'all_courses' | 'category' | 'custom';

export interface CourseBundle {
  id: string;
  title: string;
  slug?: string;
  description: string;
  bundleType: BundleType;
  targetCategory?: string; // If bundleType === 'category'
  courseIds: string[]; // If bundleType === 'custom' or explicit list
  price: number; // Harga paket yang ditentukan admin (Rp)
  originalPrice?: number; // Nilai asli atau akumulasi harga coret (Rp)
  thumbnail?: string;
  badge?: string;
  badgeText?: string; // e.g. "Hemat 70%", "Best Value", "Semua Akses"
  showInCheckout?: boolean; // Tampilkan otomatis sebagai tawaran upsell di checkout satuan
  isActive: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  transactionCode: string;
  orderId?: string; // alias for Pakasir order_id
  studentId: string;
  studentName: string;
  studentEmail: string;
  buyerPhone?: string;
  courseId: string; // Course ID or bundle identifier (e.g. bundle-xxx)
  courseTitle: string;
  instructorId?: string; // ID Instruktur pemilik kursus
  platformFee?: number; // Potongan persentase komisi admin/platform (Rp)
  instructorShare?: number; // Saldo komisi bersih yang didapat instruktur (Rp)
  isBundle?: boolean;
  bundleId?: string;
  bundleType?: BundleType;
  enrolledCourseIds?: string[]; // IDs of all courses granted in this transaction
  manualBundledCourseIds?: string[]; // IDs of manual bundled courses
  amount: number;
  fee?: number;
  totalPayment?: number;
  paymentMethod: PaymentMethodType | string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: string;
  paidAt?: string;
  expiredAt?: string;
  paymentDetails?: {
    project?: string;
    pakasirOrderId?: string;
    paymentkuOrderId?: string;
    paymentkuMethod?: string;
    paymentkuPaymentUrl?: string;
    paymentkuQrisUrl?: string;
    paymentkuQrImage?: string;
    paymentkuVaNumber?: string;
    paymentkuChannel?: string;
    paymentkuFee?: number;
    paymentkuTotalPayment?: number;
    paymentkuExpiredAt?: string;
    qrisString?: string;
    paymentNumber?: string;
    vaNumber?: string;
    paymentCode?: string;
    checkoutUrl?: string;
    paymentUrl?: string;
    fee?: number;
    totalPayment?: number;
    instructorId?: string;
    platformFee?: number;
    instructorShare?: number;
    expiredAt?: string;
    rawResponse?: any;
  };
}

export interface DiscussionReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: Role;
  content: string;
  createdAt: string;
}

export interface Discussion {
  id: string;
  courseId: string;
  moduleId?: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  title: string;
  content: string;
  createdAt: string;
  replies: DiscussionReply[];
}

export interface DirectChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  recipientId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface StudentProgress {
  courseId: string;
  studentId: string;
  completedModuleIds: string[];
  videoWatchProgress?: Record<string, number>; // moduleId -> watchPercentage (0-100)
  maxWatchedSeconds?: Record<string, number>; // moduleId -> highest watched timestamp
  quizScores: Record<string, number>; // quizId -> score (0-100)
  lastWatchedModuleId?: string;
  certificateClaimed?: boolean;
  enrolledAt: string;
  lastActiveAt: string;
  notes?: Record<string, string>; // moduleId -> noteText
}

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  active: boolean;
  order: number;
}

export interface OtpGatewaySettings {
  enableWhatsAppGateway: boolean;
  enableEmailGateway: boolean;
  enableSimulatorFallback?: boolean;
}

export interface SocialProofPopupSettings {
  enabled: boolean;
  displayIntervalSeconds: number; // e.g. 12
  displayDurationSeconds: number; // e.g. 5
  includeRealOrders: boolean;
  fakeNames: string[];
  fakeCities: string[];
  fakeTimeAgoPool: string[];
  position?: 'bottom-left' | 'bottom-right';
  soundEnabled?: boolean;
}

export interface FacebookPixelSettings {
  enabled: boolean;
  pixelId: string;
  testEventCode?: string;
  trackPageView?: boolean;
  trackViewContent?: boolean;
  trackInitiateCheckout?: boolean;
  trackPurchase?: boolean;
  trackCompleteRegistration?: boolean;
  trackLead?: boolean;
}

export interface WebsiteSettings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  logoText: string;
  logoIcon: string;
  logoImageUrl?: string;
  appIconUrl?: string;
  heroHeadline: string;
  heroSubheadline: string;
  runningText: {
    enabled: boolean;
    text: string;
    speed: number;
    linkText?: string;
    linkUrl?: string;
  };
  carouselSlides: CarouselSlide[];
  socialLinks: {
    instagram?: string;
    youtube?: string;
    telegram?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  otpGateway?: OtpGatewaySettings;
  socialProofPopup?: SocialProofPopupSettings;
  certificateDesign?: CertificateDesignSettings;
  facebookPixel?: FacebookPixelSettings;
  footerCopyright: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isActive: boolean;
  description?: string;
}

export interface PaymentSettings {
  // Primary Gateway Selection for Checkout
  activeGateway?: 'paymentku' | 'pakasir' | 'both' | 'manual';

  // Pakasir.com Config
  enablePakasir: boolean;
  pakasirApiKey: string;
  pakasirProjectSlug: string; // Project slug/name in Pakasir (e.g. "depodomain")
  pakasirMerchantCode?: string; // alias/legacy
  pakasirProjectCode?: string; // alias
  pakasirEnvironment: 'sandbox' | 'production';
  enableQris: boolean;
  enableVirtualAccount?: boolean;
  enableManualBank: boolean;
  bankAccounts: BankAccount[];
  platformCommissionPercentage?: number; // Persentase potongan komisi platform admin (misal 10 untuk 10%, instruktur dapat 90%)
  webhookUrlCustom?: string;
  isFromEnv?: boolean;
  envSource?: 'vite_env' | 'process_env' | 'api_secrets' | 'none';

  // Paymentku.com Integration Config
  enablePaymentku?: boolean;
  paymentkuApiKey?: string;
  paymentkuMerchantCode?: string; // Optional merchant code / project ID in Paymentku
  paymentkuWebhookSecret?: string;
  paymentkuEnvironment?: 'sandbox' | 'production';
  enablePaymentkuQris?: boolean;
  enablePaymentkuVa?: boolean;
  enablePaymentkuEwallet?: boolean;
  enablePaymentkuRetail?: boolean;
  paymentkuChannels?: string[];
  paymentkuWebhookUrlCustom?: string;
}

export interface InstructorPayoutRequest {
  id: string;
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  createdAt?: string;
  processedAt?: string;
  notes?: string;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface GoogleSheetsConfig {
  spreadsheetUrl: string;
  webAppUrl: string; // Google Apps Script URL
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface SupabaseConfig {
  projectUrl: string;
  url?: string; // alias
  anonKey: string;
  isConnected: boolean;
  autoSync?: boolean;
  lastSyncedAt?: string;
  lastSyncError?: string;
  lastSyncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  isFromSecrets?: boolean;
  hasEnvSecrets?: boolean;
  isFromEnv?: boolean;
  envSource?: 'vite_env' | 'process_env' | 'api_secrets' | 'none';
}
