import { Course, CourseBundle, LiveSession, User, WebsiteSettings, SocialProofPopupSettings, PaymentSettings, CustomPage, Discussion, Transaction, Certificate, StudentProgress, CategoryItem, CertificateDesignSettings } from '../types';

/**
 * CLEAN SLATE INITIAL DATA - All dummy courses, accounts, transactions removed.
 * First user to register will automatically become the Super Admin.
 */

export const INITIAL_BUNDLES: CourseBundle[] = [
  {
    id: 'bundle-all-access-pass',
    title: 'Paket All-Access Pass: Seluruh Kursus Platform',
    slug: 'all-access-pass-seluruh-kursus',
    description: 'Dapatkan akses seumur hidup ke SEMUA kursus yang ada saat ini dan semua kursus baru yang akan rilis mendatang. Termasuk video modul, file lampiran source code, sertifikat resmi, dan sesi tanya jawab mentor.',
    bundleType: 'all_courses',
    courseIds: [],
    price: 399000,
    originalPrice: 1299000,
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    badgeText: 'Paling Hemat • 70% OFF',
    showInCheckout: true,
    isActive: true,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bundle-category-web-dev',
    title: 'Paket Lengkap: Web & Mobile Developer Mastery',
    slug: 'paket-lengkap-web-mobile-dev',
    description: 'Kuasai seluruh kursus dalam kategori Web & Mobile Development dari frontend modern (React, Tailwind), backend API (Node.js, PostgreSQL), hingga aplikasi mobile.',
    bundleType: 'category',
    targetCategory: 'Web & Mobile Dev',
    courseIds: [],
    price: 249000,
    originalPrice: 798000,
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
    badgeText: 'Kategori Populer',
    showInCheckout: true,
    isActive: true,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'bundle-category-data-ai',
    title: 'Paket Lengkap: Data Science & AI Specialist',
    slug: 'paket-lengkap-data-science-ai',
    description: 'Akses seluruh kursus di kategori Data Science & Artificial Intelligence. Kuasai Python data analysis, Machine Learning, Deep Learning, dan Prompt Engineering AI modern.',
    bundleType: 'category',
    targetCategory: 'Data Science & AI',
    courseIds: [],
    price: 249000,
    originalPrice: 749000,
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=80',
    badgeText: 'Best Value AI',
    showInCheckout: true,
    isActive: true,
    isFeatured: false,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    name: 'Web & Mobile Dev',
    slug: 'web-mobile-dev',
    description: 'Frontend, Backend, React, Node.js, Flutter, Android, iOS, & Full-Stack Development',
    icon: 'Code',
    color: 'blue',
    order: 1,
    isActive: true
  },
  {
    id: 'cat-2',
    name: 'Data Science & AI',
    slug: 'data-science-ai',
    description: 'Python, Machine Learning, Deep Learning, Data Analytics, Prompt Engineering, & AI Tools',
    icon: 'Cpu',
    color: 'purple',
    order: 2,
    isActive: true
  },
  {
    id: 'cat-3',
    name: 'Desain Grafis & UI/UX',
    slug: 'desain-grafis-ui-ux',
    description: 'Figma, Adobe Illustrator, Photoshop, Design Systems, UX Research, & Prototyping',
    icon: 'Palette',
    color: 'pink',
    order: 3,
    isActive: true
  },
  {
    id: 'cat-4',
    name: 'Digital Marketing & Bisnis',
    slug: 'digital-marketing-bisnis',
    description: 'SEO, SEM, Meta Ads, TikTok Ads, Copywriting, Branding, & E-Commerce Strategy',
    icon: 'TrendingUp',
    color: 'emerald',
    order: 4,
    isActive: true
  },
  {
    id: 'cat-5',
    name: 'Bahasa Asing',
    slug: 'bahasa-asing',
    description: 'Bahasa Inggris TOEFL/IELTS, Bahasa Jepang JLPT, Bahasa Mandarin HSK, & Bahasa Korea',
    icon: 'Languages',
    color: 'amber',
    order: 5,
    isActive: true
  },
  {
    id: 'cat-6',
    name: 'Akademik & UTBK',
    slug: 'akademik-utbk',
    description: 'TPS, Penalaran Umum, Matematika, Fisika, Kimia, Biologi, & Persiapan Masuk PTN',
    icon: 'GraduationCap',
    color: 'indigo',
    order: 6,
    isActive: true
  }
];

export const INITIAL_USERS: User[] = [];

export const INITIAL_COURSES: Course[] = [];

export const SAMPLE_COURSES: Course[] = [
  {
    id: 'course-fullstack-react-node',
    title: 'Full-Stack Web Developer: Master React, Node.js & TypeScript',
    slug: 'fullstack-web-developer-react-node',
    description: 'Panduan lengkap membangun aplikasi web modern berskala produksi dari nol hingga deployment dengan arsitektur REST API, otentikasi JWT, dan database PostgreSQL.',
    category: 'Web & Mobile Dev',
    level: 'Semua Level',
    instructor: {
      id: 'inst-1',
      name: 'Rian Pratama, S.Kom.',
      title: 'Senior Full-Stack Architect',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    price: 199000,
    originalPrice: 499000,
    rating: 4.9,
    studentsCount: 1420,
    certificateAvailable: true,
    tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    isFeatured: true,
    isPopular: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [
      {
        id: 'mod-1-1',
        title: 'Pengenalan Ekosistem Web Modern & Setup Environment',
        description: 'Mempersiapkan tools, Node.js, Git, VS Code, dan struktur proyek.',
        duration: '15:30',
        durationMinutes: 15,
        videoUrl: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
        videoType: 'youtube',
        materi: 'Dalam modul ini Anda akan mempelajari dasar-dasar arsitektur web modern, client-server model, dan toolchain pengembangan.',
        resources: [
          { id: 'res-1', name: 'Panduan Setup Environment PDF', type: 'pdf', url: 'https://example.com/guide.pdf' }
        ]
      },
      {
        id: 'mod-1-2',
        title: 'Mastering React 18 & TypeScript dari Dasar ke Mahir',
        description: 'Komponen, hooks, state management, dan integrasi TypeScript secara mendalam.',
        duration: '28:45',
        durationMinutes: 28,
        videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
        videoType: 'youtube',
        materi: 'Pelajari konsep fundamental React: functional components, useState, useEffect, useCallback, memo, dan custom hooks.',
        resources: []
      },
      {
        id: 'mod-1-3',
        title: 'Evaluasi & Ujian Kelulusan Kuis Full-Stack',
        description: 'Uji pemahaman konsep web development untuk membuka sertifikat resmi.',
        duration: '10:00',
        durationMinutes: 10,
        videoUrl: '',
        videoType: 'youtube',
        materi: 'Selesaikan ujian kuis berikut untuk menguji kompetensi Anda sebelum mengklaim sertifikat kelulusan.',
        resources: [],
        quiz: {
          id: 'quiz-fullstack-1',
          title: 'Ujian Kuis Kompetensi Full-Stack Developer',
          minScoreToPass: 70,
          questions: [
            {
              id: 'quiz-1-1',
              question: 'Apa fungsi utama dari hook useEffect dalam React?',
              options: [
                'Untuk memanipulasi DOM secara langsung tanpa render ulang',
                'Untuk menangani efek samping (side effects) seperti fetch data dan listener',
                'Untuk menggantikan fungsi CSS styles',
                'Untuk menyimpan state lokal komponen'
              ],
              correctIndex: 1,
              explanation: 'useEffect digunakan untuk menangani side effects seperti pemanggilan API, subscription listener, atau pembaruan DOM manual setelah komponen di-render.'
            },
            {
              id: 'quiz-1-2',
              question: 'Protokol apa yang umumnya digunakan untuk komunikasi REST API modern?',
              options: ['FTP', 'SMTP', 'HTTP/HTTPS', 'SSH'],
              correctIndex: 2,
              explanation: 'REST API beroperasi di atas protokol HTTP/HTTPS dengan metode standar seperti GET, POST, PUT, DELETE.'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'course-data-science-python',
    title: 'Python for Data Science, AI & Machine Learning A-Z',
    slug: 'python-data-science-ai-machine-learning',
    description: 'Kuasai analisis data, visualisasi data, manipulasi dataset dengan Pandas & NumPy, serta implementasi model Machine Learning dengan Scikit-Learn.',
    category: 'Data Science & AI',
    level: 'Pemula',
    instructor: {
      id: 'inst-2',
      name: 'Dr. Hendra Wijaya',
      title: 'AI Researcher & Data Scientist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    price: 149000,
    originalPrice: 399000,
    rating: 4.85,
    studentsCount: 980,
    certificateAvailable: true,
    tags: ['Python', 'Data Science', 'Machine Learning', 'Pandas', 'AI'],
    isFeatured: true,
    isPopular: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [
      {
        id: 'mod-2-1',
        title: 'Dasar Python untuk Data Science & Analisis',
        description: 'Sintaks Python, tipe data, struktur kontrol, dan fungsi.',
        duration: '22:10',
        durationMinutes: 22,
        videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
        videoType: 'youtube',
        materi: 'Pengantar bahasa pemrograman Python dan lingkungan Jupyter Notebook / Google Colab.',
        resources: []
      },
      {
        id: 'mod-2-2',
        title: 'Data Wrangling & Eksplorasi dengan Pandas & NumPy',
        description: 'Teknik manipulasi data, cleaning dataset, dan visualisasi interaktif.',
        duration: '31:20',
        durationMinutes: 31,
        videoUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg',
        videoType: 'youtube',
        materi: 'Membaca data CSV/Excel, filtering, grouping, agregasi, dan visualisasi grafik.',
        resources: []
      }
    ]
  },
  {
    id: 'course-ui-ux-design-figma',
    title: 'UI/UX Design Specialist: Dari Riset hingga Prototyping di Figma',
    slug: 'ui-ux-design-specialist-figma',
    description: 'Pelajari proses desain produk digital kelas dunia, User Persona, Wireframing, Design System, Auto-layout Figma, dan Micro-interaction Prototype.',
    category: 'Desain Grafis & UI/UX',
    level: 'Semua Level',
    instructor: {
      id: 'inst-3',
      name: 'Amanda Stephanie',
      title: 'Lead Product Designer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    thumbnail: 'https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=800&auto=format&fit=crop&q=80',
    price: 129000,
    originalPrice: 349000,
    rating: 4.95,
    studentsCount: 1150,
    certificateAvailable: true,
    tags: ['Figma', 'UI Design', 'UX Research', 'Design System', 'Prototyping'],
    isFeatured: false,
    isPopular: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [
      {
        id: 'mod-3-1',
        title: 'Prinsip Desain Visual & UX Laws',
        description: 'Hirarki visual, tipografi, warna, whitespace, dan hukum psikologi UX.',
        duration: '19:40',
        durationMinutes: 19,
        videoUrl: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
        videoType: 'youtube',
        materi: 'Mempelajari prinsip-prinsip dasar desain antarmuka pengguna yang intuitif dan mudah digunakan.',
        resources: []
      }
    ]
  }
];

export const INITIAL_LIVE_SESSIONS: LiveSession[] = [];

export const INITIAL_DISCUSSIONS: Discussion[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_PROGRESS: Record<string, StudentProgress> = {};

export const INITIAL_CERTIFICATES: Certificate[] = [];

export const DEFAULT_CERTIFICATE_DESIGN: CertificateDesignSettings = {
  templateStyle: 'royal_gold',
  institutionName: 'LESIN AJA',
  institutionTagline: 'LEMBAGA PENDIDIKAN & SERTIFIKASI KOMPETENSI RESMI',
  institutionSubtext: 'Terdaftar & Terverifikasi pada Basis Data Sertifikasi Digital Nasional',
  syncAppLogo: true,
  showLogo: true,
  logoSize: 52,
  certificateTitle: 'SERTIFIKAT KELULUSAN & KOMPETENSI',
  certificateSubtitle: 'CERTIFICATE OF COMPLETION & PROFESSIONAL MASTERY',
  citationText: 'Diberikan dengan bangga dan penuh penghargaan atas keberhasilannya menyelesaikan seluruh rangkaian kurikulum, materi video interaktif, penugasan praktik, dan dinyatakan lulus evaluasi standar industri pada program keahlian:',
  useCourseInstructor: true,
  leadInstructorName: '',
  leadInstructorTitle: 'LEAD MASTER INSTRUCTOR',
  issueCity: 'Jakarta',
  showIssueCityDate: true,
  instructorTitleFontSize: 11,
  instructorNameFontSize: 13,
  signatureName: '',
  signatureTitle: 'LEAD MASTER INSTRUCTOR',
  instructorName: '',
  instructorTitle: 'LEAD MASTER INSTRUCTOR',
  primaryColor: '#b45309',
  secondaryColor: '#0f172a',
  accentColor: '#f59e0b',
  backgroundColor: '#fbfbfa',
  textColor: '#0f172a',
  plaqueBgColor: '#0f172a',
  show3DSeal: true,
  showGoldSeal: true,
  sealType: 'gold_3d',
  sealPosition: 'bottom_center',
  sealStyle: '3d_gold_ribbon',
  sealTextTop: 'RESMI & VALID',
  sealTextBottom: 'KEASLIAN TERJAMIN 100%',
  showRibbons: true,
  showWatermark: true,
  watermarkType: 'award',
  showPerimeterFiligree: true,
  showGuillocheBorder: true,
  showCornerOrnaments: true,
  showCenterCrowns: true,
  showQrCode: true,
  qrPosition: 'bottom_left',
  showGradeBadge: true,
  showScoreBadge: true,
  showStatusBadge: true,
  fontFamily: 'serif',
  fontFamilyTitle: 'Cinzel',
  fontFamilyRecipient: 'Playfair Display',
  signatureStyle: 'calligraphy',
  customSignatureImageUrl: '',
  customLogoImageUrl: '',
  customStampImageUrl: '',
  customSealImageUrl: '',
  customWatermarkImageUrl: '',
  borderThickness: 14,
  customElements: [],
  elementOffsets: {}
};

export const INITIAL_WEBSITE_SETTINGS: WebsiteSettings = {
  siteName: 'LESIN AJA',
  siteTagline: 'LMS Terdepan untuk Peningkatan Skill & Karier Digital',
  siteDescription: 'Platform Learning Management System terlengkap dengan materi video berkualitas tinggi, sesi mentoring live, kuis interaktif, dan e-sertifikat terverifikasi resmi.',
  contactEmail: 'admin@lesinaja.id',
  contactPhone: '+62 812-3456-7890',
  contactAddress: 'Gedung Menara Edukasi Nusantara, Jakarta',
  logoText: 'LESIN AJA',
  logoIcon: 'GraduationCap',
  logoImageUrl: 'https://lthrduzzgvasvaykqxvz.supabase.co/storage/v1/object/public/lesin-media/thumbnails/1787793978786_cgbphv_logo.png',
  appIconUrl: 'https://lthrduzzgvasvaykqxvz.supabase.co/storage/v1/object/public/lesin-media/thumbnails/1787793978786_cgbphv_logo.png',
  heroHeadline: 'Platform Belajar Skill Digital Terbaik di Indonesia',
  heroSubheadline: 'Akses materi video praktis, ikuti sesi live mentoring, selesaikan kuis interaktif, dan raih sertifikat resmi terverifikasi.',
  runningText: {
    enabled: true,
    text: '🎉 SELAMAT DATANG DI LESIN AJA LMS! Daftarkan akun Anda sekarang. Pembayaran instan didukung oleh Payment Gateway Pakasir QRIS & Virtual Account 🚀',
    speed: 25,
    linkText: 'Mulai Belajar',
    linkUrl: '#courses'
  },
  carouselSlides: [
    {
      id: 'slide-1',
      title: 'Upgrade Skill Digital Bersama Mentor Berpengalaman',
      subtitle: 'Kurikulum up-to-date berstandar industri dengan materi berbasis proyek nyata dan sertifikat resmi terverifikasi.',
      badge: '🔥 PLATFORM LMS TERPADU',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&auto=format&fit=crop&q=80',
      ctaText: 'Lihat Katalog Kursus',
      ctaLink: '#courses',
      active: true,
      order: 1
    },
    {
      id: 'slide-2',
      title: 'Sesi Live Mentoring & Konsultasi Interaktif',
      subtitle: 'Diskusi tatap muka online untuk membahas materi secara mendalam dan konsultasi praktis.',
      badge: '🎙️ LIVE INTERAKTIF',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&auto=format&fit=crop&q=80',
      ctaText: 'Jadwal Sesi Live',
      ctaLink: '#live-sessions',
      active: true,
      order: 2
    },
    {
      id: 'slide-3',
      title: 'E-Sertifikat Otomatis & Terverifikasi dengan QR Code',
      subtitle: 'Selesaikan video dan lulus kuis evaluasi untuk mengunduh sertifikat digital resmi siap cantum di CV & LinkedIn.',
      badge: '📜 SERTIFIKASI RESMI',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&auto=format&fit=crop&q=80',
      ctaText: 'Mulai Sekarang',
      ctaLink: '#courses',
      active: true,
      order: 3
    }
  ],
  socialLinks: {
    instagram: 'https://instagram.com/lesinaja.id',
    youtube: 'https://youtube.com/@lesinaja',
    telegram: 'https://t.me/lesinaja_community',
    whatsapp: 'https://wa.me/6281234567890',
    tiktok: 'https://tiktok.com/@lesinaja'
  },
  otpGateway: {
    enableWhatsAppGateway: true,
    enableEmailGateway: true,
    enableSimulatorFallback: true
  },
  socialProofPopup: {
    enabled: true,
    displayIntervalSeconds: 12,
    displayDurationSeconds: 5,
    includeRealOrders: true,
    fakeNames: [
      'Daniel',
      'Rizky Pratama',
      'Siti Rahmawati',
      'Budi Santoso',
      'Putri Ayu',
      'Dimas Aditya',
      'Nadia Safitri',
      'Fajar Hidayat',
      'Anisa Maharani',
      'Kevin Wijaya',
      'Maya Puspita',
      'Agus Setiawan',
      'Dewi Lestari',
      'Bayu Nugroho',
      'Clara Novita',
      'Rio Ferdinan'
    ],
    fakeCities: [
      'Semarang',
      'Jakarta',
      'Surabaya',
      'Bandung',
      'Medan',
      'Yogyakarta',
      'Makassar',
      'Denpasar',
      'Malang',
      'Solo',
      'Palembang',
      'Bekasi',
      'Tangerang',
      'Depok',
      'Bogor',
      'Balikpapan'
    ],
    fakeTimeAgoPool: [
      'Baru saja',
      '1 menit yang lalu',
      '2 menit yang lalu',
      '4 menit yang lalu',
      '7 menit yang lalu',
      '12 menit yang lalu'
    ],
    position: 'bottom-left',
    soundEnabled: false
  },
  certificateDesign: DEFAULT_CERTIFICATE_DESIGN,
  footerCopyright: '© 2026 LESIN AJA. Hak Cipta Dilindungi Undang-Undang.'
};

export const INITIAL_SOCIAL_PROOF_SETTINGS: SocialProofPopupSettings = INITIAL_WEBSITE_SETTINGS.socialProofPopup!;

export const INITIAL_PAYMENT_SETTINGS: PaymentSettings = {
  activeGateway: 'both',
  enablePakasir: true,
  pakasirApiKey: '',
  pakasirProjectSlug: '',
  pakasirMerchantCode: '',
  pakasirProjectCode: '',
  pakasirEnvironment: 'sandbox',
  enableQris: true,
  enableVirtualAccount: true,
  enableManualBank: true,
  platformCommissionPercentage: 10, // Komisi 10% admin platform, 90% instruktur
  enablePaymentku: true,
  paymentkuApiKey: '',
  paymentkuMerchantCode: '',
  paymentkuWebhookSecret: '',
  paymentkuEnvironment: 'production',
  enablePaymentkuQris: true,
  enablePaymentkuVa: true,
  enablePaymentkuEwallet: true,
  enablePaymentkuRetail: true,
  bankAccounts: [
    {
      id: 'bank-1',
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '8820 9182 334',
      accountHolder: 'PT LESIN AJA EDUKASI',
      isActive: true
    },
    {
      id: 'bank-2',
      bankName: 'Bank Mandiri',
      accountNumber: '137 00 2381928 1',
      accountHolder: 'PT LESIN AJA EDUKASI',
      isActive: true
    }
  ]
};

export const INITIAL_CUSTOM_PAGES: CustomPage[] = [
  {
    id: 'page-about',
    title: 'Tentang LESIN AJA',
    slug: 'tentang-kami',
    isPublished: true,
    updatedAt: '2026-01-01',
    content: `
# Tentang LESIN AJA

**LESIN AJA** adalah platform pembelajaran berbasis web (Learning Management System) terintegrasi yang dirancang untuk mempercepat penguasaan keahlian masa depan bagi pelajar, mahasiswa, dan profesional di Indonesia.

### Visi Kami
Mendemokratisasi akses pendidikan berkualitas tinggi dengan biaya terjangkau melalui teknologi digital terdepan.

### Misi Kami
1. Menyajikan materi pembelajaran yang terstruktur dan relevan dengan kebutuhan industri.
2. Menyediakan ekosistem belajar yang interaktif melalui sesi live mentoring, forum diskusi, dan evaluasi kuis.
3. Memberikan sertifikasi kompetensi digital yang terverifikasi dan diakui.
    `
  },
  {
    id: 'page-terms',
    title: 'Syarat & Ketentuan Layanan',
    slug: 'syarat-ketentuan',
    isPublished: true,
    updatedAt: '2026-01-01',
    content: `
# Syarat & Ketentuan Penggunaan LESIN AJA

Dengan mengakses dan mendaftar pada platform LESIN AJA, Anda menyetujui seluruh ketentuan berikut:
1. **Akun Pengguna:** Setiap pengguna bertanggung jawab menjaga kerahasiaan kata sandi dan kredensial login.
2. **Hak Kekayaan Intelektual:** Seluruh video, modul, dokumen, dan kuis adalah milik eksklusif LESIN AJA dan tidak boleh disebarluaskan tanpa izin tertulis.
3. **Sertifikat Kelulusan:** Diterbitkan secara sah setelah siswa menyelesaikan minimal 100% modul dan mencapai nilai kuis kelulusan (passing grade).
4. **Kebijakan Pembayaran:** Transaksi yang telah diverifikasi oleh gateway pembayaran (Pakasir/QRIS/Bank) bersifat final dan memberikan akses seumur hidup ke materi kursus.
    `
  },
  {
    id: 'page-faq',
    title: 'Pertanyaan yang Sering Diajukan (FAQ)',
    slug: 'faq',
    isPublished: true,
    updatedAt: '2026-01-01',
    content: `
# FAQ (Frequently Asked Questions)

### Q: Bagaimana cara mengakses video kursus setelah melakukan pembayaran?
A: Pembayaran melalui Pakasir QRIS otomatis diverifikasi dalam hitungan detik. Kursus akan langsung muncul di menu **Kelas Saya** di dashboard akun Anda.

### Q: Apakah video kursus dapat diakses selamanya (Lifetime Access)?
A: Ya! Anda mendapatkan akses seumur hidup dan dapat mengulang materi kapan saja sesuai kecepatan belajar Anda sendiri.

### Q: Bagaimana cara mengunduh E-Sertifikat?
A: Setelah menyelesaikan seluruh video pembelajaran dan lulus ujian kuis di modul akhir, tombol "Klaim & Unduh Sertifikat" akan aktif secara otomatis.

### Q: Apakah ada sesi tanya jawab dengan pengajar?
A: Tentu saja! Anda dapat menggunakan tab **Forum Diskusi**, fitur **Chat Mentor**, serta mengikuti **Sesi Live Interaktif** yang dijadwalkan secara rutin.
    `
  }
];
