import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Role,
  Course,
  CourseBundle,
  BundleType,
  LiveSession,
  WebsiteSettings,
  PaymentSettings,
  CustomPage,
  Discussion,
  Transaction,
  PaymentMethodType,
  Certificate,
  CertificateDesignSettings,
  StudentProgress,
  GoogleSheetsConfig,
  SupabaseConfig,
  DirectChatMessage,
  CourseModule,
  ResourceItem,
  CategoryItem,
  InstructorPayoutRequest,
  InstructorApplication,
  InstructorApplicationStatus,
  CourseVerificationStatus,
  SpecializationCertificate
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_COURSES,
  INITIAL_BUNDLES,
  SAMPLE_COURSES,
  INITIAL_CATEGORIES,
  INITIAL_LIVE_SESSIONS,
  INITIAL_WEBSITE_SETTINGS,
  DEFAULT_CERTIFICATE_DESIGN,
  INITIAL_PAYMENT_SETTINGS,
  INITIAL_CUSTOM_PAGES,
  INITIAL_DISCUSSIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_PROGRESS,
  INITIAL_CERTIFICATES
} from '../data/mockData';
import { initFacebookPixel, trackFBCompleteRegistration } from '../utils/facebookPixel';
import { getEnvPaymentkuConfig } from '../utils/paymentkuClient';
import {
  getSupabaseClient,
  getEnvSupabaseConfig,
  resolveEffectiveSupabaseConfig,
  testSupabaseConnection as testSupabaseApi,
  pushCourseToSupabase,
  deleteCourseFromSupabase,
  pushCategoryToSupabase,
  deleteCategoryFromSupabase,
  fetchCoursesFromSupabase,
  fetchCategoriesFromSupabase,
  pushUserToSupabase,
  fetchUsersFromSupabase,
  fetchUserByEmailFromSupabase,
  deleteUserFromSupabase,
  pushTransactionToSupabase,
  fetchTransactionsFromSupabase,
  pushCertificateToSupabase,
  fetchCertificatesFromSupabase,
  pushProgressToSupabase,
  fetchProgressFromSupabase,
  syncAllToSupabase,
  pushWebsiteSettingsToSupabase,
  pushPaymentSettingsToSupabase,
  pushCarouselSlidesToSupabase,
  pushRunningTextToSupabase,
  pushBundlesToSupabase,
  fetchBundlesFromSupabase,
  deleteBundleFromSupabase,
  pushLiveSessionsToSupabase,
  fetchLiveSessionsFromSupabase,
  pushCustomPagesToSupabase,
  fetchCustomPagesFromSupabase,
  pushCertificateDesignToSupabase,
  fetchCertificateDesignFromSupabase,
  pushAllCategoriesToSupabase,
  pushAllUsersToSupabase,
  pushAllCoursesToSupabase,
  pushInstructorApplicationToSupabase,
  fetchInstructorApplicationsFromSupabase,
  pushAllInstructorApplicationsToSupabase,
  deleteInstructorApplicationFromSupabase,
  fetchSettingFromSupabase
} from '../utils/supabaseClient';

interface AppContextType {
  // Auth & User State
  currentUser: User | null;
  users: User[];
  login: (email: string) => boolean;
  logout: () => void;
  registerStudent: (name: string, email: string, phone: string, institution?: string, autoNavigate?: boolean) => User;
  updateUserProfile: (updatedUser: Partial<User>) => void;
  updateUserRole: (userId: string, newRole: Role) => void;
  deleteUser: (userId: string) => void;
  clearAllDataAndReset: () => void;

  // Instructor Registration & Course Verification
  instructorApplications: InstructorApplication[];
  applyAsInstructor: (data: {
    name: string;
    email: string;
    phone?: string;
    title: string;
    institution?: string;
    specialization: string;
    specializations?: string[];
    bio?: string;
    certificateUrl: string;
    certificateName?: string;
    certificates?: SpecializationCertificate[];
    idCardUrl?: string;
    signatureUrl?: string;
    bankAccount?: { bankName: string; accountNumber: string; accountHolder: string };
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  approveInstructorApplication: (applicationId: string) => Promise<{ success: boolean; message: string }>;
  rejectInstructorApplication: (applicationId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  deleteInstructorApplication: (applicationId: string) => Promise<{ success: boolean; message: string }>;
  approveCourse: (courseId: string) => Promise<{ success: boolean; message: string }>;
  rejectCourse: (courseId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  submitCourseForVerification: (courseId: string) => Promise<{ success: boolean; message: string }>;
  saveInstructorApplicationsToSupabase: (appsOverride?: InstructorApplication[]) => Promise<{ success: boolean; message: string }>;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Categories Management
  categories: CategoryItem[];
  addCategory: (cat: Omit<CategoryItem, 'id'>) => CategoryItem;
  updateCategory: (id: string, updated: Partial<CategoryItem>) => void;
  deleteCategory: (id: string) => boolean;

  // Courses
  courses: Course[];
  addCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'> & { studentsCount?: number; rating?: number }) => Promise<Course> | Course;
  updateCourse: (courseId: string, updated: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  addModuleToCourse: (courseId: string, newModule: Omit<CourseModule, 'id'>) => void;
  loadSampleCourses: () => void;
  enrollStudentToCourse: (courseId: string, userIdOrEmail: string) => Promise<boolean>;
  unenrollStudentFromCourse: (courseId: string, userId: string) => Promise<boolean>;
  updateCourseStats: (courseId: string, stats: { studentsCount?: number; rating?: number; isPopular?: boolean; isFeatured?: boolean }) => Promise<void>;
  recalculateAllCoursesStats: () => void;

  // Bundles & Packages (Paket Pembelian Bundling)
  courseBundles: CourseBundle[];
  addBundle: (bundle: Omit<CourseBundle, 'id' | 'createdAt'>) => CourseBundle;
  updateBundle: (id: string, updated: Partial<CourseBundle>) => void;
  deleteBundle: (id: string) => void;
  getEffectiveBundleCourses: (bundle: CourseBundle) => Course[];
  getBundlesForCourse: (courseId: string) => CourseBundle[];
  saveBundlesToSupabase: (bundlesOverride?: CourseBundle[]) => Promise<{ success: boolean; message: string }>;

  // Student Progress & Learning
  progressMap: Record<string, StudentProgress>;
  markModuleCompleted: (courseId: string, moduleId: string) => void;
  updateVideoWatchProgress: (courseId: string, moduleId: string, percentage: number, currentSeconds?: number) => void;
  saveQuizScore: (courseId: string, quizId: string, score: number) => boolean;
  saveModuleNote: (courseId: string, moduleId: string, noteText: string) => void;
  claimCertificate: (courseId: string) => Certificate | null;
  getStudentCourseProgress: (courseId: string, studentId?: string) => {
    percentage: number;
    completedCount: number;
    totalCount: number;
    isPassed: boolean;
    allVideosWatched90: boolean;
    canClaimCertificate: boolean;
    unmetRequirements: string[];
  };

  // Certificates & Designer
  certificates: Certificate[];
  certificateDesignSettings: CertificateDesignSettings;
  getCertificateByNumber: (certNumber: string) => Certificate | undefined;
  updateCertificateDesign: (design: Partial<CertificateDesignSettings>) => void;

  // Live Sessions
  liveSessions: LiveSession[];
  registerForLiveSession: (sessionId: string) => void;
  addLiveSession: (session: Omit<LiveSession, 'id'>) => void;
  updateLiveSession: (sessionId: string, updated: Partial<LiveSession>) => void;
  deleteLiveSession: (sessionId: string) => void;

  // Discussions & Chat
  discussions: Discussion[];
  addDiscussion: (courseId: string, title: string, content: string, moduleId?: string) => void;
  addDiscussionReply: (discussionId: string, content: string) => void;
  chatMessages: DirectChatMessage[];
  sendChatMessage: (recipientId: string, message: string) => void;

  // Transactions & Checkout
  transactions: Transaction[];
  createTransaction: (
    courseId: string,
    paymentMethod: PaymentMethodType | string,
    customDetails?: Partial<Transaction>,
    userOverride?: User
  ) => Transaction;
  updateTransaction: (trxId: string, updated: Partial<Transaction>) => void;
  approveTransaction: (trxIdOrOrderId: string) => void;

  // Instructor Payout Requests & Profile
  payoutRequests: InstructorPayoutRequest[];
  requestInstructorPayout: (amount: number, bankDetails: { bankName: string; accountNumber: string; accountHolder: string }) => boolean;
  processPayoutRequest: (requestId: string, status: 'approved' | 'rejected', notes?: string) => void;
  updateInstructorProfile: (instructorId: string, profileData: Partial<User>) => void;

  // Settings
  websiteSettings: WebsiteSettings;
  updateWebsiteSettings: (settings: Partial<WebsiteSettings>) => void;
  paymentSettings: PaymentSettings;
  updatePaymentSettings: (settings: Partial<PaymentSettings>) => void;

  // Granular Save to Supabase for Each Menu
  saveWebsiteSettingsToSupabase: (settingsOverride?: WebsiteSettings) => Promise<{ success: boolean; message: string }>;
  savePaymentSettingsToSupabase: (settingsOverride?: PaymentSettings) => Promise<{ success: boolean; message: string }>;
  saveCarouselToSupabase: (slidesOverride?: any[]) => Promise<{ success: boolean; message: string }>;
  saveRunningTextToSupabase: (runningTextOverride?: any) => Promise<{ success: boolean; message: string }>;
  saveLiveSessionsToSupabase: (sessionsOverride?: LiveSession[]) => Promise<{ success: boolean; message: string }>;
  saveCustomPagesToSupabase: (pagesOverride?: CustomPage[]) => Promise<{ success: boolean; message: string }>;
  saveCategoriesToSupabase: (categoriesOverride?: CategoryItem[]) => Promise<{ success: boolean; message: string }>;
  saveUsersToSupabase: (usersOverride?: User[]) => Promise<{ success: boolean; message: string }>;
  saveCoursesToSupabase: (coursesOverride?: Course[]) => Promise<{ success: boolean; message: string }>;

  // CMS Pages
  customPages: CustomPage[];
  updateCustomPage: (pageId: string, content: string, title?: string, isPublished?: boolean) => void;

  // Integrations (Google Sheets & Supabase)
  sheetsConfig: GoogleSheetsConfig;
  updateSheetsConfig: (config: Partial<GoogleSheetsConfig>) => void;
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: Partial<SupabaseConfig>) => void;
  loadSupabaseFromSecrets: () => Promise<boolean>;
  testSupabase: () => Promise<{ success: boolean; message: string }>;
  syncToSupabase: () => Promise<{ success: boolean; message: string }>;
  syncFromSupabase: () => Promise<{ success: boolean; message: string }>;
  syncToGoogleSheets: () => Promise<{ success: boolean; message: string }>;

  // Active View Navigation State (SPA Routing)
  currentView: string;
  viewParams: Record<string, any>;
  navigateTo: (view: string, params?: Record<string, any>) => void;

  // Notification Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
  hideToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'lesinaja_users_v2',
  CURRENT_USER: 'lesinaja_current_user_v2',
  THEME: 'lesinaja_theme_v2',
  CATEGORIES: 'lesinaja_categories_v2',
  COURSES: 'lesinaja_courses_v2',
  BUNDLES: 'lesinaja_bundles_v2',
  PROGRESS: 'lesinaja_progress_v2',
  CERTIFICATES: 'lesinaja_certs_v2',
  LIVE: 'lesinaja_live_v2',
  DISCUSSIONS: 'lesinaja_disc_v2',
  TRANSACTIONS: 'lesinaja_trx_v2',
  SETTINGS: 'lesinaja_settings_v2',
  PAYMENT_SETTINGS: 'lesinaja_payments_v2',
  PAYOUTS: 'lesinaja_payouts_v2',
  PAGES: 'lesinaja_pages_v2',
  SHEETS: 'lesinaja_sheets_v2',
  SUPABASE: 'lesinaja_supabase_v2',
  CHATS: 'lesinaja_chats_v2',
  INSTRUCTOR_APPLICATIONS: 'lesinaja_inst_apps_v2'
};

// Safe LocalStorage Helpers to prevent QuotaExceededError and JSON parse crashes
function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return fallback;
  }
}

function safeLocalStorageSet(key: string, value: any) {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (err: any) {
    console.warn(`LocalStorage save error for key "${key}":`, err);
    // If QuotaExceededError when saving courses, sanitize large base64 resources to keep app running
    if (key === STORAGE_KEYS.COURSES && Array.isArray(value)) {
      try {
        const sanitizedCourses = value.map((course: Course) => ({
          ...course,
          modules: (course.modules || []).map((m: CourseModule) => ({
            ...m,
            resources: (m.resources || []).map((r: ResourceItem) => ({
              ...r,
              // Truncate heavy base64 strings if storage quota is full
              url: r.url && r.url.startsWith('data:') && r.url.length > 100000
                ? 'data:application/octet-stream;base64,DATA_URL_TRUNCATED_DUE_TO_STORAGE_QUOTA'
                : r.url
            }))
          }))
        }));
        localStorage.setItem(key, JSON.stringify(sanitizedCourses));
        console.warn('Courses successfully saved to local storage with sanitized file payloads.');
      } catch (retryErr) {
        console.error('Failed to write sanitized courses to local storage:', retryErr);
      }
    }
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved ? saved === 'dark' : false;
    } catch {
      return false;
    }
  });

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParams, setViewParams] = useState<Record<string, any>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Users State (cleansed of any legacy demo accounts)
  const [users, setUsers] = useState<User[]>(() => {
    const raw = safeLocalStorageGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const demoIds = ['usr_admin_default', 'usr_student_default', 'usr_instructor_default'];
    const demoEmails = ['admin@lesinaja.id', 'budi@gmail.com', 'sarah@lesinaja.id'];
    return (raw || []).filter(u => !demoIds.includes(u.id) && !demoEmails.includes(u.email.toLowerCase()));
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const raw = safeLocalStorageGet<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!raw) return null;
    const demoIds = ['usr_admin_default', 'usr_student_default', 'usr_instructor_default'];
    const demoEmails = ['admin@lesinaja.id', 'budi@gmail.com', 'sarah@lesinaja.id'];
    if (demoIds.includes(raw.id) || demoEmails.includes(raw.email.toLowerCase())) {
      return null;
    }
    return raw;
  });

  // Categories State
  const [categories, setCategories] = useState<CategoryItem[]>(() => safeLocalStorageGet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES));

  // Courses
  const [courses, setCourses] = useState<Course[]>(() => safeLocalStorageGet(STORAGE_KEYS.COURSES, INITIAL_COURSES));

  // Course Bundles (Paket Pembelian)
  const [courseBundles, setCourseBundles] = useState<CourseBundle[]>(() =>
    safeLocalStorageGet<CourseBundle[]>(STORAGE_KEYS.BUNDLES, INITIAL_BUNDLES)
  );

  // Progress
  const [progressMap, setProgressMap] = useState<Record<string, StudentProgress>>(() => safeLocalStorageGet(STORAGE_KEYS.PROGRESS, INITIAL_PROGRESS));

  // Certificates
  const [certificates, setCertificates] = useState<Certificate[]>(() => safeLocalStorageGet(STORAGE_KEYS.CERTIFICATES, INITIAL_CERTIFICATES));

  // Live Sessions
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>(() => safeLocalStorageGet(STORAGE_KEYS.LIVE, INITIAL_LIVE_SESSIONS));

  // Discussions
  const [discussions, setDiscussions] = useState<Discussion[]>(() => safeLocalStorageGet(STORAGE_KEYS.DISCUSSIONS, INITIAL_DISCUSSIONS));

  // Direct Chats
  const [chatMessages, setChatMessages] = useState<DirectChatMessage[]>(() => safeLocalStorageGet(STORAGE_KEYS.CHATS, []));

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => safeLocalStorageGet(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS));

  // Instructor Payout Requests
  const [payoutRequests, setPayoutRequests] = useState<InstructorPayoutRequest[]>(() => safeLocalStorageGet(STORAGE_KEYS.PAYOUTS, []));

  // Instructor Applications & Verifications
  const [instructorApplications, setInstructorApplications] = useState<InstructorApplication[]>(() =>
    safeLocalStorageGet<InstructorApplication[]>(STORAGE_KEYS.INSTRUCTOR_APPLICATIONS, [])
  );

  // Settings
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(() => {
    const raw = safeLocalStorageGet<Partial<WebsiteSettings>>(STORAGE_KEYS.SETTINGS, INITIAL_WEBSITE_SETTINGS);
    return {
      ...INITIAL_WEBSITE_SETTINGS,
      ...(raw || {}),
      logoImageUrl: raw?.logoImageUrl || INITIAL_WEBSITE_SETTINGS.logoImageUrl,
      appIconUrl: raw?.appIconUrl || raw?.logoImageUrl || INITIAL_WEBSITE_SETTINGS.appIconUrl,
      runningText: {
        ...INITIAL_WEBSITE_SETTINGS.runningText,
        ...(raw?.runningText || {})
      },
      carouselSlides: Array.isArray(raw?.carouselSlides) && raw.carouselSlides.length > 0
        ? raw.carouselSlides
        : INITIAL_WEBSITE_SETTINGS.carouselSlides,
      socialProofPopup: {
        ...INITIAL_WEBSITE_SETTINGS.socialProofPopup!,
        ...(raw?.socialProofPopup || {})
      }
    };
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => {
    const raw = safeLocalStorageGet<PaymentSettings>(STORAGE_KEYS.PAYMENT_SETTINGS, INITIAL_PAYMENT_SETTINGS);
    const envPaymentku = getEnvPaymentkuConfig();

    return {
      ...INITIAL_PAYMENT_SETTINGS,
      ...(raw || {}),
      paymentkuApiKey: raw?.paymentkuApiKey || envPaymentku.apiKey || INITIAL_PAYMENT_SETTINGS.paymentkuApiKey,
      paymentkuWebhookSecret: raw?.paymentkuWebhookSecret || envPaymentku.webhookSecret || INITIAL_PAYMENT_SETTINGS.paymentkuWebhookSecret,
      paymentkuEnvironment: raw?.paymentkuEnvironment || (envPaymentku.isSandbox ? 'sandbox' : 'production'),
      bankAccounts: Array.isArray(raw?.bankAccounts) && raw.bankAccounts.length > 0
        ? raw.bankAccounts
        : INITIAL_PAYMENT_SETTINGS.bankAccounts
    };
  });

  const [customPages, setCustomPages] = useState<CustomPage[]>(() => safeLocalStorageGet(STORAGE_KEYS.PAGES, INITIAL_CUSTOM_PAGES));

  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => safeLocalStorageGet(STORAGE_KEYS.SHEETS, {
    spreadsheetUrl: '',
    webAppUrl: '',
    autoSync: false,
    lastSyncedAt: undefined
  }));

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const saved = safeLocalStorageGet<SupabaseConfig>(STORAGE_KEYS.SUPABASE, {
      projectUrl: '',
      anonKey: '',
      isConnected: false,
      lastSyncedAt: undefined
    });

    const env = getEnvSupabaseConfig();
    const projectUrl = saved.projectUrl || saved.url || env.projectUrl || '';
    const anonKey = saved.anonKey || env.anonKey || '';
    const isFromEnv = Boolean(env.isConfigured && (!saved.projectUrl || saved.projectUrl === env.projectUrl));

    return {
      ...saved,
      projectUrl,
      url: projectUrl,
      anonKey,
      isConnected: Boolean(projectUrl && anonKey),
      isFromEnv: isFromEnv || Boolean(env.isConfigured),
      isFromSecrets: Boolean(env.isConfigured),
      hasEnvSecrets: Boolean(env.isConfigured),
      envSource: env.source
    };
  });

  // Purge any legacy demo accounts on mount and auto-detect Supabase Secrets
  useEffect(() => {
    const demoIds = ['usr_admin_default', 'usr_student_default', 'usr_instructor_default'];
    const demoEmails = ['admin@lesinaja.id', 'budi@gmail.com', 'sarah@lesinaja.id'];
    
    setUsers(prev => {
      const filtered = prev.filter(
        u => !demoIds.includes(u.id) && 
             !demoEmails.includes(u.email.toLowerCase()) && 
             !u.id.startsWith('usr_demo_')
      );
      if (filtered.length !== prev.length) {
        safeLocalStorageSet(STORAGE_KEYS.USERS, filtered);
      }
      return filtered;
    });

    setCurrentUser(prev => {
      if (!prev) return null;
      if (demoIds.includes(prev.id) || demoEmails.includes(prev.email.toLowerCase()) || prev.id.startsWith('usr_demo_')) {
        try {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        } catch {}
        return null;
      }
      return prev;
    });

    // Auto-detect Supabase credentials from Vite/Vercel Client Environment & Server Secrets
    const env = getEnvSupabaseConfig();
    if (env.isConfigured) {
      setSupabaseConfig(prev => ({
        ...prev,
        projectUrl: prev.projectUrl || env.projectUrl,
        url: prev.url || prev.projectUrl || env.projectUrl,
        anonKey: prev.anonKey || env.anonKey,
        isConnected: true,
        isFromEnv: true,
        hasEnvSecrets: true,
        envSource: env.source
      }));
    }

    // Load persistent settings from Server API safely (only if JSON is returned)
    fetch('/api/settings')
      .then(async res => {
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        if (data && data.success && data.settings) {
          const s = data.settings;
          if (s.website_settings) {
            setWebsiteSettings(prev => ({ ...prev, ...s.website_settings }));
          }
          if (s.payment_settings) {
            setPaymentSettings(prev => ({ ...prev, ...s.payment_settings }));
          }
          if (Array.isArray(s.custom_pages) && s.custom_pages.length > 0) {
            setCustomPages(s.custom_pages);
          }
          if (Array.isArray(s.live_sessions) && s.live_sessions.length > 0) {
            setLiveSessions(s.live_sessions);
          }
          if (Array.isArray(s.courses_data) && s.courses_data.length > 0) {
            setCourses(s.courses_data);
          }
        }
      })
      .catch(() => {
        // Silently catch in case static SPA on Vercel
      });

    // Also probe /api/config/supabase safely in case server environment variables are present
    fetch('/api/config/supabase')
      .then(async res => {
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        if (data && (data.projectUrl || data.anonKey)) {
          setSupabaseConfig(prev => {
            const projectUrl = prev.projectUrl || prev.url || data.projectUrl || '';
            const anonKey = prev.anonKey || data.anonKey || '';
            return {
              ...prev,
              projectUrl,
              url: projectUrl,
              anonKey,
              isConnected: Boolean(projectUrl && anonKey),
              isFromSecrets: Boolean(data.projectUrl && data.anonKey),
              hasEnvSecrets: Boolean(data.projectUrl && data.anonKey),
              isFromEnv: prev.isFromEnv || Boolean(data.projectUrl && data.anonKey),
              envSource: prev.envSource || (data.projectUrl ? 'api_secrets' : 'none')
            };
          });
        }
      })
      .catch(() => {
        // Silently catch in case endpoint is not reached in purely static SPA mode
      });
  }, []);

  // Sync to LocalStorage on updates
  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    if (currentUser) {
      safeLocalStorageSet(STORAGE_KEYS.CURRENT_USER, currentUser);
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } catch (err) {
        console.warn('Failed to remove current user:', err);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.COURSES, courses);
    try {
      fetch('/api/settings/courses_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courses)
      }).catch(() => {});
    } catch {}
  }, [courses]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.BUNDLES, courseBundles);
  }, [courseBundles]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.PROGRESS, progressMap);
  }, [progressMap]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.CERTIFICATES, certificates);
  }, [certificates]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.LIVE, liveSessions);
  }, [liveSessions]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.DISCUSSIONS, discussions);
  }, [discussions]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.CHATS, chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.INSTRUCTOR_APPLICATIONS, instructorApplications);
    if (supabaseConfig.projectUrl && supabaseConfig.anonKey && instructorApplications.length > 0) {
      pushAllInstructorApplicationsToSupabase(instructorApplications, supabaseConfig).catch(e => {
        console.warn('[Auto-sync instructor applications to Supabase error]:', e);
      });
    }
  }, [instructorApplications]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.PAYOUTS, payoutRequests);
  }, [payoutRequests]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.SETTINGS, websiteSettings);
    // Auto-initialize Facebook Pixel whenever settings change
    if (websiteSettings.facebookPixel?.enabled && websiteSettings.facebookPixel?.pixelId) {
      initFacebookPixel(websiteSettings.facebookPixel);
    }
  }, [websiteSettings]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.PAYMENT_SETTINGS, paymentSettings);
  }, [paymentSettings]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.PAGES, customPages);
  }, [customPages]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.SHEETS, sheetsConfig);
  }, [sheetsConfig]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.SUPABASE, supabaseConfig);

    // If Supabase client is available, attach auth listener to auto-login confirmed users
    const client = getSupabaseClient(supabaseConfig);
    if (!client) return;

    // Check current session on mount / config update (e.g. user clicked confirmation link in email)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes('error_description') || search.includes('error_description')) {
        const params = new URLSearchParams(hash.replace(/^#/, '') || search.replace(/^\?/, ''));
        const desc = params.get('error_description') || params.get('error') || '';
        if (desc) {
          console.warn('[Supabase Auth Callback Error]:', desc);
          showToast(`⚠️ Info Verifikasi: ${decodeURIComponent(desc.replace(/\+/g, ' '))}`);
        }
      }
    }

    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && session.user.email) {
        const authUser = session.user;
        const email = authUser.email!.toLowerCase();
        
        // Clean hash parameters from URL bar if present to keep URL clean
        if (typeof window !== 'undefined' && window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=signup'))) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        
        setUsers(prev => {
          const existing = prev.find(u => u.email.toLowerCase() === email);
          if (existing) {
            const updated: User = {
              ...existing,
              isEmailVerified: true,
              emailVerifiedAt: existing.emailVerifiedAt || new Date().toISOString()
            };
            setCurrentUser(updated);
            return prev.map(u => u.id === updated.id ? updated : u);
          } else {
            const meta = authUser.user_metadata || {};
            const isMainAdmin = email === 'lesinaja2@gmail.com';
            const resolvedRole: Role = (meta.role as any) || (isMainAdmin ? 'admin' : 'student');
            const newUser: User = {
              id: authUser.id,
              name: meta.name || meta.full_name || email.split('@')[0],
              email: email,
              phone: meta.phone || '',
              institution: meta.institution || (isMainAdmin ? 'Administrator LESIN AJA' : 'Umum'),
              role: resolvedRole,
              avatar: meta.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
              enrolledCourseIds: [],
              createdAt: authUser.created_at || new Date().toISOString(),
              bio: resolvedRole === 'admin' ? 'Super Administrator & Pemilik Platform LESIN AJA' : 'Siswa Belajar LESIN AJA',
              isEmailVerified: true,
              emailVerifiedAt: new Date().toISOString()
            };
            setCurrentUser(newUser);
            return [...prev, newUser];
          }
        });
      }
    }).catch(err => {
      console.log('[Supabase Auth] Session check note:', err);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && session.user.email) {
        const authUser = session.user;
        const email = authUser.email!.toLowerCase();

        setUsers(prev => {
          const existing = prev.find(u => u.email.toLowerCase() === email);
          if (existing) {
            const updated: User = {
              ...existing,
              isEmailVerified: true,
              emailVerifiedAt: existing.emailVerifiedAt || new Date().toISOString()
            };
            setCurrentUser(updated);
            showToast(`✅ Email terkonfirmasi! Selamat datang kembali, ${updated.name}.`);
            return prev.map(u => u.id === updated.id ? updated : u);
          } else {
            const meta = authUser.user_metadata || {};
            const isMainAdmin = email === 'lesinaja2@gmail.com';
            const resolvedRole: Role = (meta.role as any) || (isMainAdmin ? 'admin' : 'student');
            const newUser: User = {
              id: authUser.id,
              name: meta.name || meta.full_name || email.split('@')[0],
              email: email,
              phone: meta.phone || '',
              institution: meta.institution || (isMainAdmin ? 'Administrator LESIN AJA' : 'Umum'),
              role: resolvedRole,
              avatar: meta.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
              enrolledCourseIds: [],
              createdAt: authUser.created_at || new Date().toISOString(),
              bio: resolvedRole === 'admin' ? 'Super Administrator & Pemilik Platform LESIN AJA' : 'Siswa Belajar LESIN AJA',
              isEmailVerified: true,
              emailVerifiedAt: new Date().toISOString()
            };
            setCurrentUser(newUser);
            showToast(`🎉 Email berhasil dikonfirmasi! Akun Anda aktif.`);
            return [...prev, newUser];
          }
        });
      } else if (event === 'SIGNED_OUT') {
        // Handled via logout()
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseConfig]);

  // Auto-fetch all data (courses, categories, users, transactions, certs, progress, settings, live sessions, custom pages) from Supabase on mount/config update
  useEffect(() => {
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();
    if (!url || !key) return;

    let isMounted = true;
    const cfg = { ...supabaseConfig, projectUrl: url, anonKey: key };

    // Fetch Website Settings (Logo, Branding, Carousel, Running Text)
    fetchSettingFromSupabase<WebsiteSettings>('website_settings', cfg)
      .then(res => {
        if (isMounted && res.success && res.data) {
          setWebsiteSettings(prev => ({
            ...prev,
            ...res.data,
            logoImageUrl: res.data.logoImageUrl || prev.logoImageUrl || INITIAL_WEBSITE_SETTINGS.logoImageUrl,
            appIconUrl: res.data.appIconUrl || res.data.logoImageUrl || prev.appIconUrl || INITIAL_WEBSITE_SETTINGS.appIconUrl
          }));
        }
      })
      .catch(err => console.warn('[Supabase Auto-Fetch Website Settings]', err));

    // Fetch Payment Settings
    fetchSettingFromSupabase<PaymentSettings>('payment_settings', cfg)
      .then(res => {
        if (isMounted && res.success && res.data) {
          setPaymentSettings(prev => ({ ...prev, ...res.data }));
        }
      })
      .catch(err => console.warn('[Supabase Auto-Fetch Payment Settings]', err));

    // Fetch Certificate Design Settings
    fetchCertificateDesignFromSupabase(cfg)
      .then(res => {
        if (isMounted && res.success && res.data) {
          setWebsiteSettings(prev => ({
            ...prev,
            certificateDesign: {
              ...(prev.certificateDesign || DEFAULT_CERTIFICATE_DESIGN),
              ...res.data
            }
          }));
        }
      })
      .catch(err => console.warn('[Supabase Auto-Fetch Certificate Design]', err));

    // Fetch Courses
    fetchCoursesFromSupabase(cfg)
      .then(res => {
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setCourses(res.data);
        }
      })
      .catch(err => {
        console.warn('[Supabase Auto-Fetch Courses]', err);
      });

    // Fetch Categories
    fetchCategoriesFromSupabase(cfg)
      .then(res => {
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setCategories(res.data);
        }
      })
      .catch(err => {
        console.warn('[Supabase Auto-Fetch Categories]', err);
      });

    // Fetch Users, Transactions, Certificates, Progress for Cross-Device Consistency
    Promise.all([
      fetchUsersFromSupabase(cfg),
      fetchTransactionsFromSupabase(cfg),
      fetchCertificatesFromSupabase(cfg),
      fetchProgressFromSupabase(cfg)
    ]).then(([usersRes, trxRes, certsRes, progRes]) => {
      if (!isMounted) return;

      if (trxRes.success && trxRes.data && trxRes.data.length > 0) {
        setTransactions(trxRes.data);
      }

      if (certsRes.success && certsRes.data && certsRes.data.length > 0) {
        setCertificates(certsRes.data);
      }

      if (progRes.success && progRes.data) {
        setProgressMap(prev => ({ ...prev, ...progRes.data }));
      }

      if (usersRes.success && usersRes.data && usersRes.data.length > 0) {
        const cloudUsers = usersRes.data;
        const allTransactions = (trxRes.success && trxRes.data) ? trxRes.data : [];

        // Synchronize enrolledCourseIds from completed transactions into users
        const enrichedUsers = cloudUsers.map(u => {
          const userTrxs = allTransactions.filter(t =>
            (t.studentId === u.id || t.studentEmail.toLowerCase() === u.email.toLowerCase()) &&
            t.status === 'completed'
          );
          const enrolledSet = new Set(u.enrolledCourseIds || []);
          userTrxs.forEach(t => {
            if (t.isBundle && Array.isArray(t.enrolledCourseIds)) {
              t.enrolledCourseIds.forEach(id => enrolledSet.add(id));
            } else if (t.courseId) {
              enrolledSet.add(t.courseId);
            }
          });
          return { ...u, enrolledCourseIds: Array.from(enrolledSet) };
        });

        setUsers(enrichedUsers);

        // Reconcile and auto-populate instructorApplications from cloud users so nothing is lost
        setInstructorApplications(prevApps => {
          const appMap = new Map<string, InstructorApplication>();
          prevApps.forEach(a => appMap.set(a.email.toLowerCase(), a));

          enrichedUsers.forEach(u => {
            const uEmail = u.email.toLowerCase();
            const hasInstProfile = Boolean(
              u.instructorStatus ||
              u.instructorCertificateUrl ||
              u.role === 'instructor' ||
              u.signatureUrl
            );

            if (hasInstProfile && !appMap.has(uEmail)) {
              appMap.set(uEmail, {
                id: `app-user-${u.id}`,
                userId: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone || '',
                title: u.title || (u.role === 'instructor' ? 'Instruktur Resmi' : 'Calon Instruktur'),
                institution: u.institution || 'Umum',
                specialization: u.instructorSpecialization || 'Umum',
                specializations: u.instructorSpecializations || (u.instructorSpecialization ? [u.instructorSpecialization] : ['Umum']),
                bio: u.bio || '',
                certificateUrl: u.instructorCertificateUrl || '',
                certificateName: u.instructorCertificateName || 'Sertifikat/Ijazah Keahlian',
                idCardUrl: undefined,
                signatureUrl: u.signatureUrl || undefined,
                bankAccount: u.bankAccount || undefined,
                status: u.instructorStatus || (u.role === 'instructor' ? 'approved' : 'pending'),
                rejectionReason: u.instructorRejectionReason || undefined,
                appliedAt: u.instructorAppliedAt || u.createdAt || new Date().toISOString(),
                reviewedAt: u.instructorVerifiedAt || undefined,
                reviewedBy: u.instructorVerifiedAt ? 'Admin' : undefined
              });
            }
          });

          return Array.from(appMap.values());
        });

        // Update current user if logged in to immediately show all enrolled courses across devices
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const fresh = enrichedUsers.find(u => u.id === prevUser.id || u.email.toLowerCase() === prevUser.email.toLowerCase());
          if (fresh) {
            return {
              ...prevUser,
              ...fresh,
              enrolledCourseIds: fresh.enrolledCourseIds
            };
          }
          return prevUser;
        });
      }
    }).catch(err => console.warn('[Supabase Auto-Fetch Users & Sync]', err));

    // Fetch Instructor Applications directly
    fetchInstructorApplicationsFromSupabase(cfg)
      .then(res => {
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setInstructorApplications(prev => {
            const map = new Map<string, InstructorApplication>();
            prev.forEach(a => map.set(a.email.toLowerCase(), a));
            res.data!.forEach(a => map.set(a.email.toLowerCase(), a));
            return Array.from(map.values());
          });
        }
      })
      .catch(err => console.warn('[Supabase Auto-Fetch Instructor Applications]', err));

    // Fetch Live Sessions
    fetchLiveSessionsFromSupabase(cfg)
      .then(res => {
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setLiveSessions(res.data);
        }
      })
      .catch(err => console.warn('[Supabase Auto-Fetch Live Sessions]', err));

    // Fetch Custom Pages
    fetchCustomPagesFromSupabase(cfg)
      .then(res => {
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setCustomPages(res.data);
        }
      })
      .catch(err => console.warn('[Supabase Auto-Fetch Custom Pages]', err));

    // Fetch Course Bundles
    fetchBundlesFromSupabase(cfg)
      .then(res => {
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setCourseBundles(res.data);
        }
      })
      .catch(err => console.warn('[Supabase Auto-Fetch Course Bundles]', err));

    return () => {
      isMounted = false;
    };
  }, [supabaseConfig.projectUrl, supabaseConfig.url, supabaseConfig.anonKey]);

  // Dark Mode side-effect
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
      } catch {}
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, 'light');
      } catch {}
    }
  }, [isDarkMode]);

  // Synchronize dynamic favicon, apple-touch-icon, and PWA manifest with application logo
  useEffect(() => {
    const iconUrl =
      websiteSettings.appIconUrl ||
      websiteSettings.logoImageUrl ||
      INITIAL_WEBSITE_SETTINGS.appIconUrl ||
      INITIAL_WEBSITE_SETTINGS.logoImageUrl;

    if (iconUrl) {
      // Update all favicon links
      const faviconLinks = document.querySelectorAll("link[rel*='icon']");
      if (faviconLinks.length > 0) {
        faviconLinks.forEach(link => {
          (link as HTMLLinkElement).href = iconUrl;
        });
      } else {
        const linkIcon = document.createElement('link');
        linkIcon.rel = 'icon';
        linkIcon.href = iconUrl;
        document.head.appendChild(linkIcon);
      }

      // Update all Apple touch icons for mobile home screens
      const appleIcons = document.querySelectorAll("link[rel*='apple-touch-icon']");
      if (appleIcons.length > 0) {
        appleIcons.forEach(link => {
          (link as HTMLLinkElement).href = iconUrl;
        });
      } else {
        const appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.href = iconUrl;
        document.head.appendChild(appleIcon);
      }

      // Dynamic PWA Web App Manifest update for mobile homescreens
      try {
        const appName = websiteSettings.siteName || 'LESIN AJA';
        const dynamicManifest = {
          name: `${appName} - LMS Learning Management System`,
          short_name: appName,
          description:
            websiteSettings.siteDescription ||
            'Platform Belajar Kursus Online, Video Edukasi, Live Mentoring & E-Sertifikat Terverifikasi',
          start_url: '/',
          display: 'standalone',
          background_color: '#0f172a',
          theme_color: '#2563eb',
          orientation: 'portrait-primary',
          categories: ['education', 'productivity'],
          icons: [
            {
              src: iconUrl,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: iconUrl,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        };
        const blob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(blob);
        const manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
        if (manifestLink) {
          manifestLink.setAttribute('href', manifestURL);
        }
      } catch (err) {
        console.debug('[Dynamic Manifest Sync]', err);
      }
    }

    // Update document title
    if (websiteSettings.siteName) {
      document.title = `${websiteSettings.siteName} - Learning Management System`;
    }
  }, [websiteSettings.logoImageUrl, websiteSettings.appIconUrl, websiteSettings.siteName, websiteSettings.siteDescription]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const navigateTo = (view: string, params: Record<string, any> = {}) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Operations - Only registered users can login
  const login = (email: string, role?: 'admin' | 'student' | 'instructor') => {
    const trimmedEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === trimmedEmail);
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (existing) {
      setCurrentUser(existing);
      showToast(`Selamat datang kembali, ${existing.name}!`);
      if (existing.role === 'admin') {
        navigateTo('admin');
      } else {
        navigateTo('home');
      }

      // Background check for freshest user data & transactions in Supabase
      if (url && key) {
        fetchUserByEmailFromSupabase(trimmedEmail, { ...supabaseConfig, projectUrl: url, anonKey: key })
          .then(res => {
            if (res.success && res.data) {
              const fresh = res.data;
              setUsers(prev => prev.map(u => u.id === fresh.id || u.email.toLowerCase() === trimmedEmail ? fresh : u));
              setCurrentUser(prev => (prev && prev.email.toLowerCase() === trimmedEmail ? fresh : prev));
            }
          })
          .catch(e => console.warn('[Supabase Background User Refresh]', e));
      }
      return true;
    }

    // If not found in local memory (e.g., opened on a new mobile/desktop device), query Supabase cloud!
    if (url && key) {
      showToast('⏳ Memeriksa data akun di Supabase Cloud...');
      fetchUserByEmailFromSupabase(trimmedEmail, { ...supabaseConfig, projectUrl: url, anonKey: key })
        .then(res => {
          if (res.success && res.data) {
            const fetchedUser = res.data;
            setUsers(prev => {
              const exists = prev.some(u => u.id === fetchedUser.id || u.email.toLowerCase() === trimmedEmail);
              return exists ? prev.map(u => u.id === fetchedUser.id ? fetchedUser : u) : [...prev, fetchedUser];
            });
            setCurrentUser(fetchedUser);
            showToast(`Selamat datang kembali, ${fetchedUser.name}!`);
            if (fetchedUser.role === 'admin') {
              navigateTo('admin');
            } else {
              navigateTo('home');
            }
          } else {
            showToast('⚠️ Akun tidak ditemukan! Hanya user yang sudah terdaftar yang dapat masuk. Silakan mendaftar terlebih dahulu.');
          }
        })
        .catch(() => {
          showToast('⚠️ Akun tidak ditemukan! Hanya user yang sudah terdaftar yang dapat masuk. Silakan mendaftar terlebih dahulu.');
        });
      return true;
    }
    
    // If user is not found in registered users list
    showToast('⚠️ Akun tidak ditemukan! Hanya user yang sudah terdaftar yang dapat masuk. Silakan mendaftar terlebih dahulu.');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Anda telah keluar.');
    navigateTo('home');
  };

  const registerStudent = (
    name: string,
    email: string,
    phone: string,
    institution?: string,
    autoNavigate: boolean = true
  ) => {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
      showToast(`Email telah terdaftar. Berhasil masuk sebagai ${existing.name}.`);
      if (autoNavigate) {
        if (existing.role === 'admin') {
          navigateTo('admin');
        } else {
          navigateTo('dashboard');
        }
      }
      return existing;
    }

    // Role assignment: Only primary owner email gets admin, all new registrations are strictly student
    const isMainAdmin = email.toLowerCase() === 'lesinaja2@gmail.com';
    const assignedRole: Role = isMainAdmin ? 'admin' : 'student';

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      phone,
      institution: institution || (isMainAdmin ? 'Administrator LESIN AJA' : 'Umum'),
      role: assignedRole,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      enrolledCourseIds: [],
      createdAt: new Date().toISOString(),
      bio: isMainAdmin ? 'Super Administrator & Pemilik Platform LESIN AJA' : 'Siswa Belajar LESIN AJA',
      isEmailVerified: true,
      emailVerifiedAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);

    // Track Facebook Pixel Complete Registration event
    if (websiteSettings.facebookPixel?.enabled && (websiteSettings.facebookPixel?.trackCompleteRegistration ?? true)) {
      trackFBCompleteRegistration({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      });
    }

    // Push new student/user to Supabase immediately in real-time
    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushUserToSupabase(newUser, supabaseConfig).then(res => {
        if (res.success) {
          console.log(`[Supabase] Student registration synced to cloud:`, newUser.email);
          showToast(`⚡ Akun siswa "${newUser.name}" berhasil tersimpan di Supabase Cloud!`);
        } else {
          console.warn(`[Supabase] Failed to push registered student:`, res.error);
        }
      });
    }

    if (autoNavigate) {
      if (assignedRole === 'admin') {
        showToast('Selamat datang, Administrator LESIN AJA!');
        navigateTo('admin');
      } else {
        showToast(`Registrasi sukses! Selamat datang, ${name}.`);
        navigateTo('dashboard');
      }
    } else {
      showToast(`Akun atas nama ${name} berhasil dibuat.`);
    }

    return newUser;
  };

  const clearAllDataAndReset = () => {
    // Reset all localStorage keys to clean slate
    Object.values(STORAGE_KEYS).forEach(k => {
      localStorage.removeItem(k);
    });
    setUsers([]);
    setCurrentUser(null);
    setCourses([]);
    setCourseBundles(INITIAL_BUNDLES);
    setProgressMap({});
    setCertificates([]);
    setLiveSessions([]);
    setDiscussions([]);
    setChatMessages([]);
    setTransactions([]);
    setWebsiteSettings(INITIAL_WEBSITE_SETTINGS);
    setPaymentSettings(INITIAL_PAYMENT_SETTINGS);
    setCustomPages(INITIAL_CUSTOM_PAGES);
    setSheetsConfig({ spreadsheetUrl: '', webAppUrl: '', autoSync: false });
    setSupabaseConfig({ projectUrl: '', anonKey: '', isConnected: false });
    showToast('🧹 Semua data dummy, akun, dan cache telah dibersihkan secara total!');
    navigateTo('home');
  };

  const updateUserRole = (userId: string, newRole: Role) => {
    setUsers(prev => {
      const updated = prev.map(u => (u.id === userId ? { ...u, role: newRole } : u));
      const targetUser = updated.find(u => u.id === userId);
      if (targetUser && supabaseConfig.projectUrl && supabaseConfig.anonKey) {
        pushUserToSupabase(targetUser, supabaseConfig);
      }
      return updated;
    });
    if (currentUser?.id === userId) {
      setCurrentUser(prev => (prev ? { ...prev, role: newRole } : null));
    }
    showToast(`Peran pengguna berhasil diubah menjadi "${newRole}".`);
  };

  const updateUserProfile = (updated: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));
    
    // Sync updated user to Supabase
    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushUserToSupabase(updatedUser, supabaseConfig);
    }
    
    showToast('Profil berhasil diperbarui.');
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      deleteUserFromSupabase(userId, supabaseConfig);
    }
    showToast('Pengguna berhasil dihapus.');
  };

  // Category Management
  const addCategory = (catData: Omit<CategoryItem, 'id'>) => {
    const newCat: CategoryItem = {
      ...catData,
      id: `cat-${Date.now()}`,
      slug: catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      isActive: catData.isActive ?? true,
      order: catData.order ?? (categories.length + 1)
    };
    setCategories(prev => [...prev, newCat]);
    showToast(`Kategori "${newCat.name}" berhasil ditambahkan!`);

    // Real-time Push to Supabase
    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushCategoryToSupabase(newCat, supabaseConfig).then(res => {
        if (res.success) {
          showToast(`⚡ Kategori "${newCat.name}" tersimpan di Supabase Cloud!`);
        } else {
          console.warn('Supabase category push failed:', res.error);
        }
      });
    }
    return newCat;
  };

  const updateCategory = (id: string, updated: Partial<CategoryItem>) => {
    setCategories(prev => {
      const next = prev.map(c => (c.id === id ? { ...c, ...updated } : c));
      const target = next.find(c => c.id === id);
      if (target && supabaseConfig.projectUrl && supabaseConfig.anonKey) {
        pushCategoryToSupabase(target, supabaseConfig);
      }
      return next;
    });
    showToast('Kategori berhasil diperbarui.');
  };

  const deleteCategory = (id: string): boolean => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return false;

    // Check if any courses use this category
    const isUsed = courses.some(c => c.category === cat.name || c.category === cat.slug);
    if (isUsed) {
      showToast(`⚠️ Kategori "${cat.name}" masih digunakan oleh ${courses.filter(c => c.category === cat.name || c.category === cat.slug).length} kursus aktif. Ubah kategori kursus tersebut terlebih dahulu.`);
      return false;
    }

    setCategories(prev => prev.filter(c => c.id !== id));
    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      deleteCategoryFromSupabase(id, supabaseConfig);
    }
    showToast(`Kategori "${cat.name}" berhasil dihapus.`);
    return true;
  };

  // Course Management
  const addCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'> & { studentsCount?: number; rating?: number }) => {
    const isInstructor = currentUser?.role === 'instructor';
    const initialVerificationStatus: CourseVerificationStatus = isInstructor 
      ? (courseData.verificationStatus || 'pending')
      : (courseData.verificationStatus || 'approved');
    
    const initialStatus = isInstructor 
      ? (courseData.status || 'pending')
      : (courseData.status || 'published');

    // Attach instructor certificate info if available from currentUser
    const instructorObj = {
      id: courseData.instructor?.id || (isInstructor ? currentUser?.id : undefined) || `inst-${Date.now()}`,
      name: courseData.instructor?.name || currentUser?.name || 'Instruktur',
      title: courseData.instructor?.title || currentUser?.title || 'Pengajar',
      avatar: courseData.instructor?.avatar || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      signatureUrl: courseData.instructor?.signatureUrl || currentUser?.signatureUrl || undefined,
      certificateUrl: courseData.instructor?.certificateUrl || currentUser?.instructorCertificateUrl || undefined
    };

    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now()}`,
      instructor: instructorObj,
      instructorId: courseData.instructorId || (isInstructor ? currentUser?.id : undefined),
      verificationStatus: initialVerificationStatus,
      status: initialStatus,
      rating: courseData.rating !== undefined ? Number(courseData.rating) : 5.0,
      studentsCount: courseData.studentsCount !== undefined ? Number(courseData.studentsCount) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCourses(prev => [newCourse, ...prev]);

    if (isInstructor) {
      showToast(`📝 Kursus "${newCourse.title}" berhasil diajukan! Menunggu peninjauan & verifikasi sertifikat oleh Admin.`);
    } else {
      showToast(`Kursus "${newCourse.title}" berhasil ditambahkan!`);
    }

    // Real-time Push to Supabase if configured
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (url && key) {
      showToast('⏳ Menyimpan kursus ke database Supabase Cloud...');
      const cfg = { ...supabaseConfig, projectUrl: url, url, anonKey: key };
      const res = await pushCourseToSupabase(newCourse, cfg);
      if (res.success) {
        showToast(`⚡ Kursus "${newCourse.title}" berhasil tersimpan ke tabel courses Supabase!`);
      } else {
        showToast(`⚠️ Kursus tersimpan di browser, namun gagal sync Supabase: ${res.error}`);
        console.error('Supabase pushCourse error:', res);
      }
    } else {
      showToast('ℹ️ Supabase belum terhubung. Kursus disimpan di penyimpanan lokal browser.');
    }

    return newCourse;
  };

  const approveCourse = async (courseId: string): Promise<{ success: boolean; message: string }> => {
    const target = courses.find(c => c.id === courseId);
    if (!target) return { success: false, message: 'Kursus tidak ditemukan' };

    const updatedCourse: Course = {
      ...target,
      verificationStatus: 'approved',
      status: 'published',
      rejectionReason: undefined,
      verifiedAt: new Date().toISOString(),
      verifiedBy: currentUser?.name || 'Admin LESIN AJA',
      updatedAt: new Date().toISOString()
    };

    setCourses(prev => prev.map(c => (c.id === courseId ? updatedCourse : c)));

    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();
    if (url && key) {
      const cfg = { ...supabaseConfig, projectUrl: url, anonKey: key };
      await pushCourseToSupabase(updatedCourse, cfg);
    }

    showToast(`✅ Kursus "${target.title}" telah disetujui & resmi dipublikasikan!`);
    return { success: true, message: 'Kursus berhasil disetujui.' };
  };

  const rejectCourse = async (courseId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const target = courses.find(c => c.id === courseId);
    if (!target) return { success: false, message: 'Kursus tidak ditemukan' };

    const updatedCourse: Course = {
      ...target,
      verificationStatus: 'rejected',
      status: 'rejected',
      rejectionReason: reason || 'Kualifikasi materi kursus tidak sesuai dengan sertifikat/ijazah instruktur.',
      verifiedAt: new Date().toISOString(),
      verifiedBy: currentUser?.name || 'Admin LESIN AJA',
      updatedAt: new Date().toISOString()
    };

    setCourses(prev => prev.map(c => (c.id === courseId ? updatedCourse : c)));

    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();
    if (url && key) {
      const cfg = { ...supabaseConfig, projectUrl: url, anonKey: key };
      await pushCourseToSupabase(updatedCourse, cfg);
    }

    showToast(`⚠️ Kursus "${target.title}" ditolak. Alasan: ${reason}`);
    return { success: true, message: 'Kursus berhasil ditolak.' };
  };

  const submitCourseForVerification = async (courseId: string): Promise<{ success: boolean; message: string }> => {
    const target = courses.find(c => c.id === courseId);
    if (!target) return { success: false, message: 'Kursus tidak ditemukan' };

    const updatedCourse: Course = {
      ...target,
      verificationStatus: 'pending',
      status: 'pending',
      rejectionReason: undefined,
      updatedAt: new Date().toISOString()
    };

    setCourses(prev => prev.map(c => (c.id === courseId ? updatedCourse : c)));

    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();
    if (url && key) {
      const cfg = { ...supabaseConfig, projectUrl: url, anonKey: key };
      await pushCourseToSupabase(updatedCourse, cfg);
    }

    showToast(`📤 Kursus "${target.title}" berhasil diajukan ulang untuk ditinjau oleh Admin.`);
    return { success: true, message: 'Kursus berhasil diajukan untuk verifikasi.' };
  };

  const updateCourse = async (courseId: string, updated: Partial<Course>) => {
    let targetToPush: Course | null = null;
    setCourses(prev => {
      const next = prev.map(c => {
        if (c.id === courseId) {
          const merged: Course = {
            ...c,
            ...updated,
            studentsCount: updated.studentsCount !== undefined ? Number(updated.studentsCount) : c.studentsCount,
            rating: updated.rating !== undefined ? Number(updated.rating) : c.rating,
            updatedAt: new Date().toISOString()
          };
          targetToPush = merged;
          return merged;
        }
        return c;
      });
      return next;
    });

    showToast('Data kursus berhasil diperbarui.');

    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (url && key && targetToPush) {
      const cfg = { ...supabaseConfig, projectUrl: url, url, anonKey: key };
      const res = await pushCourseToSupabase(targetToPush, cfg);
      if (res.success) {
        showToast('⚡ Perubahan kursus berhasil disimpan ke Supabase Cloud!');
      } else {
        showToast(`⚠️ Gagal update Supabase: ${res.error}`);
        console.error('Supabase update course error:', res);
      }
    }
  };

  const enrollStudentToCourse = async (courseId: string, userIdOrEmail: string): Promise<boolean> => {
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      showToast('Kursus tidak ditemukan.');
      return false;
    }

    const trimmed = userIdOrEmail.trim().toLowerCase();
    let targetUser = users.find(u => u.id === userIdOrEmail || u.email.toLowerCase() === trimmed);

    if (!targetUser) {
      if (trimmed.includes('@')) {
        const namePart = trimmed.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        targetUser = registerStudent(formattedName, trimmed, '', 'Umum', false);
      } else {
        showToast(`Pengguna dengan ID / email "${userIdOrEmail}" tidak ditemukan.`);
        return false;
      }
    }

    if (targetUser.enrolledCourseIds?.includes(courseId)) {
      showToast(`Siswa "${targetUser.name}" (${targetUser.email}) sudah terdaftar di kursus ini.`);
      return true;
    }

    const updatedEnrolled = [...(targetUser.enrolledCourseIds || []), courseId];
    const updatedUser: User = { ...targetUser, enrolledCourseIds: updatedEnrolled };

    setUsers(prev => prev.map(u => (u.id === targetUser!.id ? updatedUser : u)));
    if (currentUser?.id === targetUser.id) {
      setCurrentUser(updatedUser);
    }

    let updatedCourseObj: Course | null = null;
    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          const updated = { ...c, studentsCount: (c.studentsCount || 0) + 1, updatedAt: new Date().toISOString() };
          updatedCourseObj = updated;
          return updated;
        }
        return c;
      })
    );

    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushUserToSupabase(updatedUser, supabaseConfig);
      if (updatedCourseObj) {
        pushCourseToSupabase(updatedCourseObj, supabaseConfig);
      }
    }

    showToast(`✅ Siswa "${targetUser.name}" berhasil didaftarkan ke kursus "${course.title}"!`);
    return true;
  };

  const unenrollStudentFromCourse = async (courseId: string, userId: string): Promise<boolean> => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      showToast('Siswa tidak ditemukan.');
      return false;
    }

    const updatedEnrolled = (targetUser.enrolledCourseIds || []).filter(id => id !== courseId);
    const updatedUser: User = { ...targetUser, enrolledCourseIds: updatedEnrolled };

    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
    }

    let updatedCourseObj: Course | null = null;
    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          const updated = {
            ...c,
            studentsCount: Math.max(0, (c.studentsCount || 1) - 1),
            updatedAt: new Date().toISOString()
          };
          updatedCourseObj = updated;
          return updated;
        }
        return c;
      })
    );

    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushUserToSupabase(updatedUser, supabaseConfig);
      if (updatedCourseObj) {
        pushCourseToSupabase(updatedCourseObj, supabaseConfig);
      }
    }

    showToast(`Akses kursus untuk "${targetUser.name}" berhasil dicabut.`);
    return true;
  };

  const updateCourseStats = async (
    courseId: string,
    stats: { studentsCount?: number; rating?: number; isPopular?: boolean; isFeatured?: boolean }
  ) => {
    let targetToPush: Course | null = null;
    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          const merged: Course = {
            ...c,
            studentsCount:
              stats.studentsCount !== undefined
                ? Math.max(0, Math.round(Number(stats.studentsCount)))
                : c.studentsCount,
            rating: stats.rating !== undefined ? Math.min(5, Math.max(1, Number(stats.rating))) : c.rating,
            isPopular: stats.isPopular !== undefined ? stats.isPopular : c.isPopular,
            isFeatured: stats.isFeatured !== undefined ? stats.isFeatured : c.isFeatured,
            updatedAt: new Date().toISOString()
          };
          targetToPush = merged;
          return merged;
        }
        return c;
      })
    );

    if (supabaseConfig.projectUrl && supabaseConfig.anonKey && targetToPush) {
      await pushCourseToSupabase(targetToPush, supabaseConfig);
    }

    showToast('✅ Statistik kursus (Siswa & Rating) berhasil diperbarui dan disimpan!');
  };

  const recalculateAllCoursesStats = () => {
    let changed = 0;
    setCourses(prev =>
      prev.map(c => {
        const realEnrolledCount = users.filter(u => u.enrolledCourseIds?.includes(c.id)).length;
        const completedTrxCount = transactions.filter(t => t.courseId === c.id && t.status === 'completed').length;
        const actualCount = Math.max(realEnrolledCount, completedTrxCount);

        if (c.studentsCount < actualCount || (c.studentsCount === 0 && actualCount > 0)) {
          changed++;
          return { ...c, studentsCount: actualCount, updatedAt: new Date().toISOString() };
        }
        return c;
      })
    );

    showToast(`🔄 Sinkronisasi selesai: ${changed} kursus diperbarui dengan jumlah siswa riil.`);
  };

  const deleteCourse = async (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    showToast('Kursus berhasil dihapus.');

    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (url && key) {
      const cfg = { ...supabaseConfig, projectUrl: url, url, anonKey: key };
      const res = await deleteCourseFromSupabase(courseId, cfg);
      if (res.success) {
        showToast('⚡ Kursus juga telah dihapus dari tabel Supabase Cloud.');
      } else {
        console.warn('Supabase delete course failed:', res.error);
      }
    }
  };

  const addModuleToCourse = (courseId: string, newModule: Omit<CourseModule, 'id'>) => {
    const moduleWithId: CourseModule = {
      ...newModule,
      id: `mod-${Date.now()}`
    };
    setCourses(prev =>
      prev.map(c => {
        if (c.id === courseId) {
          return {
            ...c,
            modules: [...c.modules, moduleWithId],
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      })
    );
    showToast(`Modul "${moduleWithId.title}" berhasil ditambahkan!`);
  };

  const loadSampleCourses = () => {
    setCourses(SAMPLE_COURSES);
    showToast(`✅ Berhasil memuat ${SAMPLE_COURSES.length} kursus sampel siap pakai!`);
  };

  // Course Bundling & Packages Management
  const getEffectiveBundleCourses = useCallback((bundle: CourseBundle): Course[] => {
    if (!bundle) return [];
    if (bundle.bundleType === 'all_courses') {
      return courses;
    }
    if (bundle.bundleType === 'category') {
      const targetCat = (bundle.targetCategory || '').trim().toLowerCase();
      return courses.filter(c => c.category && c.category.trim().toLowerCase() === targetCat);
    }
    if (bundle.bundleType === 'custom') {
      const ids = Array.isArray(bundle.courseIds) ? bundle.courseIds : [];
      return courses.filter(c => ids.includes(c.id));
    }
    return [];
  }, [courses]);

  const getBundlesForCourse = useCallback((courseId: string): CourseBundle[] => {
    if (!courseId) return [];
    const currentCourse = courses.find(c => c.id === courseId);
    const courseCategory = (currentCourse?.category || '').trim().toLowerCase();

    return courseBundles.filter(bundle => {
      if (!bundle.isActive) return false;
      if (bundle.showInCheckout === false) return false;

      // 1. All Access Bundle (all_courses) is always shown across all courses
      if (bundle.bundleType === 'all_courses') {
        return true;
      }

      // 2. Category Bundle: ONLY show if bundle targetCategory matches current course's category
      if (bundle.bundleType === 'category') {
        const bundleCat = (bundle.targetCategory || '').trim().toLowerCase();
        return Boolean(bundleCat && courseCategory && bundleCat === courseCategory);
      }

      // 3. Custom Bundle: Only show if this specific course is in the bundle
      if (bundle.bundleType === 'custom') {
        const ids = Array.isArray(bundle.courseIds) ? bundle.courseIds : [];
        return ids.includes(courseId);
      }

      return false;
    });
  }, [courseBundles, courses]);

  const addBundle = (bundleData: Omit<CourseBundle, 'id' | 'createdAt'>): CourseBundle => {
    const newBundle: CourseBundle = {
      ...bundleData,
      id: `bundle-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updatedList = [newBundle, ...courseBundles];
    setCourseBundles(updatedList);
    showToast(`✅ Paket bundling "${newBundle.title}" berhasil dibuat!`);

    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushBundlesToSupabase(updatedList, supabaseConfig);
    }
    return newBundle;
  };

  const updateBundle = (id: string, updated: Partial<CourseBundle>) => {
    let updatedList: CourseBundle[] = [];
    setCourseBundles(prev => {
      updatedList = prev.map(b => (b.id === id ? { ...b, ...updated, updatedAt: new Date().toISOString() } : b));
      return updatedList;
    });
    showToast('Paket bundling berhasil diperbarui!');

    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushBundlesToSupabase(updatedList, supabaseConfig);
    }
  };

  const deleteBundle = (id: string) => {
    let updatedList: CourseBundle[] = [];
    setCourseBundles(prev => {
      updatedList = prev.filter(b => b.id !== id);
      return updatedList;
    });
    showToast('Paket bundling berhasil dihapus.');

    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      deleteBundleFromSupabase(id, supabaseConfig);
      pushBundlesToSupabase(updatedList, supabaseConfig);
    }
  };

  const saveBundlesToSupabase = async (bundlesOverride?: CourseBundle[]): Promise<{ success: boolean; message: string }> => {
    const target = bundlesOverride || courseBundles;
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (!url || !key) {
      const msg = 'Koneksi Supabase belum disetel. Buka menu Pengaturan Supabase untuk mengisi URL & Key.';
      showToast('⚠️ ' + msg);
      return { success: false, message: msg };
    }

    showToast('⏳ Menyimpan Paket Bundling ke Supabase...');
    const res = await pushBundlesToSupabase(target, { ...supabaseConfig, projectUrl: url, url, anonKey: key });
    if (res.success) {
      showToast(`✅ ${target.length} Paket Bundling berhasil disimpan ke Supabase!`);
      return { success: true, message: `${target.length} Paket Bundling berhasil tersimpan di Supabase Cloud.` };
    } else {
      showToast('❌ Gagal menyimpan ke Supabase: ' + (res.error || 'Terjadi kesalahan'));
      return { success: false, message: res.error || 'Gagal menyimpan ke Supabase' };
    }
  };

  // Student Progress & Anti-Seek Video Tracking
  const updateVideoWatchProgress = (courseId: string, moduleId: string, percentage: number, currentSeconds?: number) => {
    if (!currentUser) return;
    const progressKey = `${currentUser.id}_${courseId}`;
    const currentProgress = progressMap[progressKey] || {
      courseId,
      studentId: currentUser.id,
      completedModuleIds: [],
      videoWatchProgress: {},
      maxWatchedSeconds: {},
      quizScores: {},
      enrolledAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    const currentWatchMap = currentProgress.videoWatchProgress || {};
    const existingWatch = currentWatchMap[moduleId] || 0;
    const cleanPercent = Math.min(100, Math.max(existingWatch, Math.round(percentage)));

    const currentSecMap = currentProgress.maxWatchedSeconds || {};
    const existingSec = currentSecMap[moduleId] || 0;
    const newSec = Math.max(existingSec, currentSeconds || 0);

    const completed = new Set(currentProgress.completedModuleIds);
    // If watched >= 90%, automatically record as completed module!
    if (cleanPercent >= 90) {
      completed.add(moduleId);
    }

    const updatedProgress: StudentProgress = {
      ...currentProgress,
      videoWatchProgress: {
        ...currentWatchMap,
        [moduleId]: cleanPercent
      },
      maxWatchedSeconds: {
        ...currentSecMap,
        [moduleId]: newSec
      },
      completedModuleIds: Array.from(completed),
      lastWatchedModuleId: moduleId,
      lastActiveAt: new Date().toISOString()
    };

    setProgressMap(prev => ({
      ...prev,
      [progressKey]: updatedProgress
    }));

    // Synchronize to Supabase when completing or reaching major watch milestones (>= 90%)
    if (supabaseConfig.projectUrl && supabaseConfig.anonKey && (cleanPercent >= 90 || cleanPercent % 25 === 0)) {
      pushProgressToSupabase(updatedProgress, supabaseConfig).catch(e => console.warn('[Supabase PUSH Video Progress Error]', e));
    }
  };

  const markModuleCompleted = (courseId: string, moduleId: string) => {
    if (!currentUser) return;
    const targetCourse = courses.find(c => c.id === courseId);
    const targetModule = targetCourse?.modules.find(m => m.id === moduleId);

    const progressKey = `${currentUser.id}_${courseId}`;
    const currentProgress = progressMap[progressKey] || {
      courseId,
      studentId: currentUser.id,
      completedModuleIds: [],
      videoWatchProgress: {},
      maxWatchedSeconds: {},
      quizScores: {},
      enrolledAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    // If this module has a video, verify that it was watched >= 90%
    if (targetModule?.videoUrl && targetModule.videoUrl.trim() !== '') {
      const currentWatchPct = currentProgress.videoWatchProgress?.[moduleId] || 0;
      if (currentWatchPct < 90) {
        showToast(`⏳ Anda harus menonton video materi "${targetModule.title}" minimal 90% (saat ini ${currentWatchPct}%) sebelum menandainya selesai.`);
        return;
      }
    }

    const completed = new Set(currentProgress.completedModuleIds);
    completed.add(moduleId);

    const updatedProgress: StudentProgress = {
      ...currentProgress,
      completedModuleIds: Array.from(completed),
      lastWatchedModuleId: moduleId,
      lastActiveAt: new Date().toISOString()
    };

    setProgressMap(prev => ({
      ...prev,
      [progressKey]: updatedProgress
    }));

    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushProgressToSupabase(updatedProgress, supabaseConfig).catch(e => console.warn('[Supabase PUSH Module Complete Error]', e));
    }

    showToast('Progres modul disimpan!');
  };

  const saveQuizScore = (courseId: string, quizId: string, score: number): boolean => {
    if (!currentUser) return false;
    const progressKey = `${currentUser.id}_${courseId}`;
    const currentProgress = progressMap[progressKey] || {
      courseId,
      studentId: currentUser.id,
      completedModuleIds: [],
      videoWatchProgress: {},
      maxWatchedSeconds: {},
      quizScores: {},
      enrolledAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    const targetCourse = courses.find(c => c.id === courseId);
    const quizModule = targetCourse?.modules.find(m => m.quiz?.id === quizId);
    const minPass = quizModule?.quiz?.minScoreToPass || 75;

    const isPassed = score >= minPass;

    const updatedProgress: StudentProgress = {
      ...currentProgress,
      quizScores: {
        ...currentProgress.quizScores,
        [quizId]: score
      },
      lastActiveAt: new Date().toISOString()
    };

    if (isPassed && quizModule) {
      const completed = new Set(updatedProgress.completedModuleIds);
      completed.add(quizModule.id);
      updatedProgress.completedModuleIds = Array.from(completed);
    }

    setProgressMap(prev => ({
      ...prev,
      [progressKey]: updatedProgress
    }));

    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushProgressToSupabase(updatedProgress, supabaseConfig).catch(e => console.warn('[Supabase PUSH Quiz Score Error]', e));
    }

    if (isPassed) {
      showToast(`🎉 Selamat! Anda lulus kuis dengan skor ${score}/100!`);
    } else {
      showToast(`Skor Anda: ${score}/100. Nilai minimum kelulusan adalah ${minPass}. Anda dapat mencoba lagi.`);
    }

    return isPassed;
  };

  const saveModuleNote = (courseId: string, moduleId: string, noteText: string) => {
    if (!currentUser) return;
    const progressKey = `${currentUser.id}_${courseId}`;
    const currentProgress = progressMap[progressKey] || {
      courseId,
      studentId: currentUser.id,
      completedModuleIds: [],
      videoWatchProgress: {},
      maxWatchedSeconds: {},
      quizScores: {},
      enrolledAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    const updated: StudentProgress = {
      ...currentProgress,
      notes: {
        ...(currentProgress.notes || {}),
        [moduleId]: noteText
      },
      lastActiveAt: new Date().toISOString()
    };

    setProgressMap(prev => ({ ...prev, [progressKey]: updated }));

    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushProgressToSupabase(updated, supabaseConfig).catch(e => console.warn('[Supabase PUSH Note Error]', e));
    }

    showToast('Catatan belajar tersimpan.');
  };

  const getStudentCourseProgress = (courseId: string, studentId?: string) => {
    const targetStudentId = studentId || currentUser?.id;
    if (!targetStudentId) {
      return {
        percentage: 0,
        completedCount: 0,
        totalCount: 0,
        isPassed: false,
        allVideosWatched90: false,
        canClaimCertificate: false,
        unmetRequirements: ['Silakan login terlebih dahulu untuk melacak progres belajar.']
      };
    }

    const course = courses.find(c => c.id === courseId);
    if (!course || !course.modules.length) {
      return {
        percentage: 0,
        completedCount: 0,
        totalCount: 0,
        isPassed: false,
        allVideosWatched90: false,
        canClaimCertificate: false,
        unmetRequirements: ['Kursus ini belum memiliki materi modul aktif.']
      };
    }

    const totalCount = course.modules.length;

    // 0. If certificate is already issued for this user & course (synced from Cloud Supabase), instantly recognize full graduation
    const existingCert = certificates.find(c =>
      c.courseId === courseId &&
      (c.studentId === targetStudentId ||
       (currentUser?.name && c.studentName?.toLowerCase() === currentUser.name?.toLowerCase()) ||
       (currentUser?.email && (c as any).studentEmail?.toLowerCase() === currentUser.email?.toLowerCase()))
    );

    if (existingCert) {
      return {
        percentage: 100,
        completedCount: totalCount,
        totalCount,
        isPassed: true,
        allVideosWatched90: true,
        canClaimCertificate: true,
        unmetRequirements: []
      };
    }

    let progressKey = `${targetStudentId}_${courseId}`;
    let progress = progressMap[progressKey];

    // Fallback search across progressMap for same user
    if (!progress && currentUser) {
      const matchKey = Object.keys(progressMap).find(k =>
        k.endsWith(`_${courseId}`) &&
        (k.startsWith(`${currentUser.id}_`) || (currentUser.email && k.startsWith(`${currentUser.email}_`)))
      );
      if (matchKey) {
        progress = progressMap[matchKey];
      }
    }

    if (progress?.certificateClaimed) {
      return {
        percentage: 100,
        completedCount: totalCount,
        totalCount,
        isPassed: true,
        allVideosWatched90: true,
        canClaimCertificate: true,
        unmetRequirements: []
      };
    }

    const completedCount = progress?.completedModuleIds?.length || 0;
    const percentage = Math.min(100, Math.round((completedCount / totalCount) * 100));

    const unmet: string[] = [];

    // 1. Check video watch requirements (>= 90% watch time for each video module)
    const videoModules = course.modules.filter(m => m.videoUrl && m.videoUrl.trim() !== '');
    let allVideosWatched90 = true;
    for (const vm of videoModules) {
      const watchPct = progress?.videoWatchProgress?.[vm.id] || 0;
      if (watchPct < 90) {
        allVideosWatched90 = false;
        unmet.push(`Video "${vm.title}" baru ditonton ${watchPct}% (syarat kelulusan min. 90%)`);
      }
    }

    // 2. Check quiz passing requirements
    const quizModules = course.modules.filter(m => m.quiz);
    let allQuizzesPassed = true;
    if (quizModules.length > 0) {
      for (const qm of quizModules) {
        if (!qm.quiz) continue;
        const score = progress?.quizScores?.[qm.quiz.id] || 0;
        if (score < qm.quiz.minScoreToPass) {
          allQuizzesPassed = false;
          unmet.push(`Kuis "${qm.quiz.title}" belum lulus (Skor: ${score}, Min: ${qm.quiz.minScoreToPass})`);
        }
      }
    }

    // 3. Check overall completion
    const allModulesCompleted = completedCount >= totalCount;
    if (!allModulesCompleted && unmet.length === 0) {
      unmet.push(`Selesaikan seluruh ${totalCount} materi modul kursus`);
    }

    const canClaimCertificate = allVideosWatched90 && allQuizzesPassed && (course.certificateAvailable !== false) && percentage >= 100;

    return {
      percentage,
      completedCount,
      totalCount,
      isPassed: allQuizzesPassed,
      allVideosWatched90,
      canClaimCertificate,
      unmetRequirements: unmet
    };
  };

  const claimCertificate = (courseId: string): Certificate | null => {
    if (!currentUser) {
      showToast('⚠️ Silakan login terlebih dahulu untuk mengklaim sertifikat.');
      return null;
    }
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      showToast('⚠️ Kursus tidak ditemukan.');
      return null;
    }

    const existing = certificates.find(c =>
      c.courseId === courseId &&
      (c.studentId === currentUser.id ||
       (currentUser.name && c.studentName?.toLowerCase() === currentUser.name?.toLowerCase()) ||
       (currentUser.email && (c as any).studentEmail?.toLowerCase() === currentUser.email?.toLowerCase()))
    );
    if (existing) {
      return existing;
    }

    // Strict validation of course requirements (must watch min. 90% of videos and pass quizzes)
    const progress = getStudentCourseProgress(courseId, currentUser.id);
    if (!progress.canClaimCertificate) {
      if (progress.unmetRequirements.length > 0) {
        showToast(`⚠️ Syarat sertifikat belum terpenuhi: ${progress.unmetRequirements[0]}`);
      } else {
        showToast('⚠️ Anda harus menonton minimal 90% dari seluruh durasi video untuk mengklaim e-sertifikat.');
      }
      return null;
    }

    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      certificateNumber: `LSN/${new Date().getFullYear()}/CERT/${Math.floor(10000 + Math.random() * 90000)}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      courseId: course.id,
      courseTitle: course.title,
      instructorName: course.instructor?.name || 'Instruktur Kursus',
      instructorTitle: course.instructor?.title || 'Master Instructor & Penanggung Jawab Kursus',
      issueDate: new Date().toISOString().slice(0, 10),
      grade: 'Dengan Pujian (Grade A)',
      score: 95,
      verificationHash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString()
    };

    setCertificates(prev => [newCert, ...prev]);

    // Push new certificate to Supabase Cloud immediately
    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushCertificateToSupabase(newCert, supabaseConfig).catch(e => console.warn('[Supabase PUSH Certificate Error]', e));
    }

    // Mark in progress & push completed progress to Supabase
    const progressKey = `${currentUser.id}_${courseId}`;
    const updatedProgress: StudentProgress = {
      ...(progressMap[progressKey] || {
        courseId,
        studentId: currentUser.id,
        completedModuleIds: course.modules.map(m => m.id),
        videoWatchProgress: {},
        maxWatchedSeconds: {},
        quizScores: {},
        enrolledAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      }),
      certificateClaimed: true,
      completedModuleIds: course.modules.map(m => m.id),
      lastActiveAt: new Date().toISOString()
    };

    setProgressMap(prev => ({
      ...prev,
      [progressKey]: updatedProgress
    }));

    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushProgressToSupabase(updatedProgress, supabaseConfig).catch(e => console.warn('[Supabase PUSH Progress Cert Claim Error]', e));
    }

    showToast('🎉 Selamat! E-Sertifikat resmi Anda telah berhasil diterbitkan!');
    return newCert;
  };

  const getCertificateByNumber = (certNumber: string) => {
    return certificates.find(c => c.certificateNumber.toLowerCase() === certNumber.toLowerCase());
  };

  // Live Sessions
  const registerForLiveSession = (sessionId: string) => {
    if (!currentUser) {
      showToast('Silakan login terlebih dahulu untuk mendaftar sesi live.');
      return;
    }

    setLiveSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          const registered = new Set(s.registeredStudentIds);
          if (registered.has(currentUser.id)) {
            registered.delete(currentUser.id);
            showToast('Pendaftaran sesi live dibatalkan.');
          } else {
            registered.add(currentUser.id);
            showToast('Berhasil mendaftar sesi live! Pengingat telah dikirim ke email Anda.');
          }
          return { ...s, registeredStudentIds: Array.from(registered) };
        }
        return s;
      })
    );
  };

  const addLiveSession = (session: Omit<LiveSession, 'id'>) => {
    const newSession: LiveSession = {
      ...session,
      id: `live-${Date.now()}`,
      registeredStudentIds: []
    };
    setLiveSessions(prev => {
      const updated = [newSession, ...prev];
      fetch('/api/settings/live_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();
      if (url && key) {
        pushLiveSessionsToSupabase(updated, { ...supabaseConfig, projectUrl: url, anonKey: key }).catch(() => {});
      }
      return updated;
    });
    showToast('Jadwal sesi live berhasil ditambahkan!');
  };

  const updateLiveSession = (sessionId: string, updatedSession: Partial<LiveSession>) => {
    setLiveSessions(prev => {
      const updated = prev.map(s => (s.id === sessionId ? { ...s, ...updatedSession } : s));
      fetch('/api/settings/live_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();
      if (url && key) {
        pushLiveSessionsToSupabase(updated, { ...supabaseConfig, projectUrl: url, anonKey: key }).catch(() => {});
      }
      return updated;
    });
    showToast('Sesi live berhasil diperbarui.');
  };

  const deleteLiveSession = (sessionId: string) => {
    setLiveSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      fetch('/api/settings/live_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();
      if (url && key) {
        pushLiveSessionsToSupabase(updated, { ...supabaseConfig, projectUrl: url, anonKey: key }).catch(() => {});
      }
      return updated;
    });
    showToast('Sesi live dihapus.');
  };

  // Discussions
  const addDiscussion = (courseId: string, title: string, content: string, moduleId?: string) => {
    if (!currentUser) return;
    const newDiscussion: Discussion = {
      id: `disc-${Date.now()}`,
      courseId,
      moduleId,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentAvatar: currentUser.avatar,
      title,
      content,
      createdAt: new Date().toISOString(),
      replies: []
    };
    setDiscussions(prev => [newDiscussion, ...prev]);
    showToast('Topik diskusi berhasil dikirim!');
  };

  const addDiscussionReply = (discussionId: string, content: string) => {
    if (!currentUser) return;
    const reply = {
      id: `rep-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userRole: currentUser.role,
      content,
      createdAt: new Date().toISOString()
    };

    setDiscussions(prev =>
      prev.map(d =>
        d.id === discussionId ? { ...d, replies: [...d.replies, reply] } : d
      )
    );
    showToast('Balasan diskusi terkirim.');
  };

  const sendChatMessage = (recipientId: string, message: string) => {
    if (!currentUser) return;
    const newMsg: DirectChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId,
      message,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setChatMessages(prev => [...prev, newMsg]);

    // Simulated mentor reply if message sent to instructor
    if (currentUser.role === 'student') {
      setTimeout(() => {
        const autoReply: DirectChatMessage = {
          id: `msg-rep-${Date.now()}`,
          senderId: recipientId,
          senderName: 'Dr. Sarah Wijaya, M.Kom',
          senderRole: 'instructor',
          recipientId: currentUser.id,
          message: 'Pesan Anda sudah diterima! Mentor kami akan segera membalas atau Anda bisa menyampaikannya saat Sesi Live berikutnya.',
          timestamp: new Date().toISOString(),
          isRead: false
        };
        setChatMessages(curr => [...curr, autoReply]);
      }, 1500);
    }
  };

  // Transactions & Checkout
  const createTransaction = (
    courseId: string,
    paymentMethod: PaymentMethodType | string,
    customDetails?: Partial<Transaction>,
    userOverride?: User
  ): Transaction => {
    const activeUser = userOverride || currentUser;
    if (!activeUser) throw new Error('User not authenticated');

    let course = courses.find(c => c.id === courseId);
    let targetTitle = course?.title || '';
    let targetPrice = course?.price || 0;
    let isBundle = Boolean(customDetails?.isBundle || courseId.startsWith('bundle-'));
    let bundleId = customDetails?.bundleId || (courseId.startsWith('bundle-') ? courseId : undefined);
    let enrolledCourseIds = customDetails?.enrolledCourseIds || [];

    if (isBundle && bundleId) {
      const bundle = courseBundles.find(b => b.id === bundleId);
      if (bundle) {
        targetTitle = bundle.title;
        targetPrice = bundle.price;
        if (enrolledCourseIds.length === 0) {
          enrolledCourseIds = getEffectiveBundleCourses(bundle).map(c => c.id);
        }
      }
    }

    if (!course && !isBundle) {
      const bundle = courseBundles.find(b => b.id === courseId);
      if (bundle) {
        isBundle = true;
        bundleId = bundle.id;
        targetTitle = bundle.title;
        targetPrice = bundle.price;
        enrolledCourseIds = getEffectiveBundleCourses(bundle).map(c => c.id);
      } else {
        throw new Error('Course or Bundle not found');
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const orderId = `INV${datePrefix}${randomSuffix}`;
    const trxCode = `TRX-LSN-${orderId}`;

    const totalPay = customDetails?.totalPayment !== undefined ? customDetails.totalPayment : (customDetails?.amount !== undefined ? customDetails.amount : targetPrice);
    
    // Resolve instructor ID and calculate commission share
    const assignedInstructorId = course?.instructorId || course?.instructor?.id || undefined;
    const commissionPercent = paymentSettings.platformCommissionPercentage !== undefined ? paymentSettings.platformCommissionPercentage : 10;
    const platformFee = Math.round((totalPay * commissionPercent) / 100);
    const instructorShare = isBundle ? 0 : Math.max(0, totalPay - platformFee);

    const newTrx: Transaction = {
      id: `trx-${Date.now()}`,
      transactionCode: trxCode,
      orderId: orderId,
      studentId: activeUser.id,
      studentName: activeUser.name,
      studentEmail: activeUser.email,
      courseId: course?.id || courseId,
      courseTitle: customDetails?.courseTitle || targetTitle,
      instructorId: assignedInstructorId,
      platformFee,
      instructorShare,
      isBundle,
      bundleId,
      enrolledCourseIds: isBundle ? enrolledCourseIds : [courseId],
      amount: customDetails?.amount !== undefined ? customDetails.amount : targetPrice,
      totalPayment: totalPay,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paymentDetails: {
        pakasirOrderId: orderId,
        project: paymentSettings.pakasirProjectSlug || '',
        instructorId: assignedInstructorId,
        platformFee,
        instructorShare,
        ...customDetails?.paymentDetails
      },
      ...customDetails
    };

    setTransactions(prev => [newTrx, ...prev]);

    // Push new transaction to Supabase Cloud in real-time
    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushTransactionToSupabase(newTrx, supabaseConfig).catch(e => console.warn('[Supabase PUSH Trx Error]', e));
    }

    return newTrx;
  };

  const updateTransaction = (trxId: string, updated: Partial<Transaction>) => {
    let targetTrx: Transaction | null = null;
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === trxId || t.transactionCode === trxId || t.orderId === trxId) {
          const mod = { ...t, ...updated };
          targetTrx = mod;
          return mod;
        }
        return t;
      })
    );
    if (targetTrx && supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushTransactionToSupabase(targetTrx, supabaseConfig).catch(e => console.warn('[Supabase PUSH Trx Update Error]', e));
    }
  };

  const approveTransaction = (trxIdOrOrderId: string) => {
    const target = transactions.find(
      t =>
        t.id === trxIdOrOrderId ||
        t.transactionCode === trxIdOrOrderId ||
        t.orderId === trxIdOrOrderId ||
        t.paymentDetails?.pakasirOrderId === trxIdOrOrderId ||
        t.paymentDetails?.paymentkuOrderId === trxIdOrOrderId
    );
    if (!target) return;

    // Avoid duplicate approval
    if (target.status === 'completed') return;

    const completedTrx: Transaction = { ...target, status: 'completed', paidAt: new Date().toISOString() };

    setTransactions(prev =>
      prev.map(t =>
        t.id === target.id
          ? completedTrx
          : t
      )
    );

    // Push completed transaction to Supabase
    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushTransactionToSupabase(completedTrx, supabaseConfig).catch(e => console.warn('[Supabase PUSH Completed Trx Error]', e));
    }

    // Determine all courses to unlock
    const courseIdsToEnroll = target.isBundle && Array.isArray(target.enrolledCourseIds) && target.enrolledCourseIds.length > 0
      ? target.enrolledCourseIds
      : [target.courseId];

    // Enroll the student to course(s)
    const studentUser = users.find(u => u.id === target.studentId);
    if (studentUser) {
      const enrolled = new Set(studentUser.enrolledCourseIds || []);
      courseIdsToEnroll.forEach(cId => {
        if (cId) enrolled.add(cId);
      });
      const updatedStudent = { ...studentUser, enrolledCourseIds: Array.from(enrolled) };
      setUsers(prev => prev.map(u => (u.id === studentUser.id ? updatedStudent : u)));

      if (currentUser?.id === studentUser.id) {
        setCurrentUser(updatedStudent);
      }

      if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
        pushUserToSupabase(updatedStudent, supabaseConfig).catch(e => console.warn('[Supabase PUSH Enrolled User Error]', e));
      }
    }

    // Credit instructor commission to instructor balance if applicable
    const targetInstructorId = completedTrx.instructorId || (completedTrx.paymentDetails && completedTrx.paymentDetails.instructorId);
    const earnedShare = completedTrx.instructorShare !== undefined ? completedTrx.instructorShare : (completedTrx.paymentDetails?.instructorShare || 0);

    if (targetInstructorId && earnedShare > 0) {
      setUsers(prevUsers =>
        prevUsers.map(u => {
          if (u.id === targetInstructorId) {
            const updatedInstructor: User = {
              ...u,
              balance: (u.balance || 0) + earnedShare
            };
            if (currentUser?.id === u.id) {
              setCurrentUser(updatedInstructor);
            }
            if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
              pushUserToSupabase(updatedInstructor, supabaseConfig).catch(e => console.warn('[Supabase PUSH Instructor Balance Error]', e));
            }
            return updatedInstructor;
          }
          return u;
        })
      );
    }

    // Increment course students count for all unlocked courses
    setCourses(prev =>
      prev.map(c => {
        if (courseIdsToEnroll.includes(c.id)) {
          const updated = { ...c, studentsCount: (c.studentsCount || 0) + 1, updatedAt: new Date().toISOString() };
          if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
            pushCourseToSupabase(updated, supabaseConfig).catch(e => console.warn('[Supabase PUSH Course Error]', e));
          }
          return updated;
        }
        return c;
      })
    );

    showToast(`✅ Transaksi ${target.transactionCode} (${target.courseTitle}) Lunas! Akses ${courseIdsToEnroll.length} kursus dibuka.`);
  };

  // Instructor Payout Request Handler
  const requestInstructorPayout = (
    amount: number,
    bankDetails: { bankName: string; accountNumber: string; accountHolder: string }
  ): boolean => {
    if (!currentUser) {
      showToast('⚠️ Anda harus login terlebih dahulu.');
      return false;
    }
    const currentBalance = currentUser.balance || 0;
    if (currentBalance < amount) {
      showToast(`⚠️ Saldo komisi tidak mencukupi. Saldo Anda: Rp ${currentBalance.toLocaleString('id-ID')}`);
      return false;
    }
    if (amount < 50000) {
      showToast('⚠️ Minimal penarikan saldo komisi adalah Rp 50.000');
      return false;
    }

    const newReq: InstructorPayoutRequest = {
      id: `payout-${Date.now()}`,
      instructorId: currentUser.id,
      instructorName: currentUser.name,
      instructorEmail: currentUser.email,
      amount,
      bankName: bankDetails.bankName,
      accountNumber: bankDetails.accountNumber,
      accountHolder: bankDetails.accountHolder,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    // Deduct balance immediately
    const updatedUser: User = {
      ...currentUser,
      balance: Math.max(0, currentBalance - amount),
      bankAccount: bankDetails
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));
    setPayoutRequests(prev => [newReq, ...prev]);

    if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
      pushUserToSupabase(updatedUser, supabaseConfig).catch(e => console.warn('[Supabase PUSH User Payout Error]', e));
    }

    showToast(`✅ Permohonan penarikan saldo Rp ${amount.toLocaleString('id-ID')} berhasil diajukan! Admin akan segera memproses transfer.`);
    return true;
  };

  // Admin Payout Approval Handler
  const processPayoutRequest = (requestId: string, status: 'approved' | 'rejected', notes?: string) => {
    setPayoutRequests(prev =>
      prev.map(p => {
        if (p.id === requestId) {
          const updated: InstructorPayoutRequest = {
            ...p,
            status,
            processedAt: new Date().toISOString(),
            notes: notes || (status === 'approved' ? 'Pencairan dana telah disetujui & ditransfer.' : 'Permohonan ditolak.')
          };

          // If rejected, refund balance to instructor
          if (status === 'rejected') {
            setUsers(uList =>
              uList.map(u => {
                if (u.id === p.instructorId) {
                  const refunded: User = { ...u, balance: (u.balance || 0) + p.amount };
                  if (currentUser?.id === u.id) setCurrentUser(refunded);
                  if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
                    pushUserToSupabase(refunded, supabaseConfig).catch(e => console.warn('[Supabase PUSH Refund Error]', e));
                  }
                  return refunded;
                }
                return u;
              })
            );
          }
          return updated;
        }
        return p;
      })
    );
    showToast(status === 'approved' ? '✅ Permohonan payout berhasil disetujui & ditandai selesai!' : '⚠️ Permohonan payout ditolak dan saldo dikembalikan ke instruktur.');
  };

  // Update Instructor Profile (bio, title, signatureUrl, bankAccount)
  const updateInstructorProfile = (instructorId: string, profileData: Partial<User>) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === instructorId) {
          const updated: User = { ...u, ...profileData };
          if (currentUser?.id === instructorId) {
            setCurrentUser(updated);
          }
          if (supabaseConfig.projectUrl && supabaseConfig.anonKey) {
            pushUserToSupabase(updated, supabaseConfig).catch(e => console.warn('[Supabase PUSH Instructor Profile Error]', e));
          }
          return updated;
        }
        return u;
      })
    );
    showToast('✅ Profil & Tanda Tangan Digital Instruktur berhasil disimpan!');
  };

  // Instructor Registration Flow & Management
  const applyAsInstructor = async (data: {
    name: string;
    email: string;
    phone?: string;
    title: string;
    institution?: string;
    specialization: string;
    specializations?: string[];
    bio?: string;
    certificateUrl: string;
    certificateName?: string;
    certificates?: SpecializationCertificate[];
    idCardUrl?: string;
    signatureUrl?: string;
    bankAccount?: { bankName: string; accountNumber: string; accountHolder: string };
  }): Promise<{ success: boolean; message: string; user?: User }> => {
    const emailTrimmed = data.email.toLowerCase().trim();
    const specsList = data.specializations && data.specializations.length > 0
      ? data.specializations
      : data.specialization.split(',').map(s => s.trim()).filter(Boolean);

    // Find or create user
    let targetUser = users.find(u => u.email.toLowerCase() === emailTrimmed);
    if (!targetUser) {
      targetUser = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: emailTrimmed,
        role: 'student', // stays student until admin verifies!
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
        phone: data.phone || '',
        institution: data.institution || 'Umum',
        bio: data.bio || '',
        title: data.title || 'Calon Instruktur',
        instructorStatus: 'pending',
        instructorCertificateUrl: data.certificateUrl,
        instructorCertificateName: data.certificateName || 'Sertifikat/Ijazah',
        instructorCertificates: data.certificates,
        instructorSpecialization: data.specialization,
        instructorSpecializations: specsList,
        signatureUrl: data.signatureUrl || undefined,
        instructorAppliedAt: new Date().toISOString(),
        bankAccount: data.bankAccount,
        enrolledCourseIds: [],
        createdAt: new Date().toISOString()
      };
      setUsers(prev => [targetUser!, ...prev]);
    } else {
      targetUser = {
        ...targetUser,
        name: data.name || targetUser.name,
        phone: data.phone || targetUser.phone,
        title: data.title || targetUser.title,
        institution: data.institution || targetUser.institution,
        bio: data.bio || targetUser.bio,
        instructorStatus: 'pending',
        instructorCertificateUrl: data.certificateUrl,
        instructorCertificateName: data.certificateName || 'Sertifikat/Ijazah',
        instructorCertificates: data.certificates || targetUser.instructorCertificates,
        instructorSpecialization: data.specialization,
        instructorSpecializations: specsList,
        signatureUrl: data.signatureUrl || targetUser.signatureUrl,
        instructorAppliedAt: new Date().toISOString(),
        bankAccount: data.bankAccount || targetUser.bankAccount
      };
      setUsers(prev => prev.map(u => (u.id === targetUser!.id ? targetUser! : u)));
    }

    if (currentUser?.id === targetUser.id || currentUser?.email.toLowerCase() === emailTrimmed) {
      setCurrentUser(targetUser);
    }

    // Create or update application record
    const newApp: InstructorApplication = {
      id: `app-${Date.now()}`,
      userId: targetUser.id,
      name: data.name,
      email: emailTrimmed,
      phone: data.phone || '',
      title: data.title,
      institution: data.institution || '',
      specialization: data.specialization,
      specializations: specsList,
      bio: data.bio || '',
      certificateUrl: data.certificateUrl,
      certificateName: data.certificateName || 'Sertifikat / Ijazah Keahlian',
      certificates: data.certificates,
      idCardUrl: data.idCardUrl,
      signatureUrl: data.signatureUrl,
      bankAccount: data.bankAccount,
      status: 'pending',
      appliedAt: new Date().toISOString()
    };

    setInstructorApplications(prev => [newApp, ...prev.filter(a => a.email.toLowerCase() !== emailTrimmed)]);

    // Push user and application to Supabase Cloud
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();
    if (url && key) {
      const cfg = { ...supabaseConfig, projectUrl: url, anonKey: key };
      pushUserToSupabase(targetUser, cfg).catch(err => console.warn('[Supabase PUSH User App Error]', err));
      pushInstructorApplicationToSupabase(newApp, cfg).catch(err => console.warn('[Supabase PUSH Inst App Error]', err));
    }

    showToast('📄 Berkas pendaftaran instruktur berhasil dikirim! Menunggu verifikasi tim Admin.');
    return { success: true, message: 'Pendaftaran instruktur berhasil dikirim dan menunggu verifikasi.', user: targetUser };
  };

  const approveInstructorApplication = async (applicationId: string): Promise<{ success: boolean; message: string }> => {
    const app = instructorApplications.find(a => a.id === applicationId);
    if (!app) return { success: false, message: 'Aplikasi instruktur tidak ditemukan' };

    const updatedApp: InstructorApplication = {
      ...app,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser?.name || 'Admin LESIN AJA'
    };

    setInstructorApplications(prev => prev.map(a => (a.id === applicationId ? updatedApp : a)));

    // Upgrade target user role to instructor!
    let targetUser = users.find(u => u.id === app.userId || u.email.toLowerCase() === app.email.toLowerCase());
    if (targetUser) {
      const specsList = app.specializations && app.specializations.length > 0
        ? app.specializations
        : (app.specialization || '').split(',').map(s => s.trim()).filter(Boolean);

      const updatedUser: User = {
        ...targetUser,
        role: 'instructor',
        instructorStatus: 'approved',
        title: app.title || targetUser.title || 'Instruktur Resmi',
        institution: app.institution || targetUser.institution,
        instructorCertificateUrl: app.certificateUrl,
        instructorCertificateName: app.certificateName,
        instructorCertificates: app.certificates || targetUser.instructorCertificates,
        signatureUrl: app.signatureUrl || targetUser.signatureUrl,
        instructorSpecialization: app.specialization,
        instructorSpecializations: specsList,
        instructorVerifiedAt: new Date().toISOString(),
        instructorRejectionReason: undefined
      };
      setUsers(prev => prev.map(u => (u.id === targetUser!.id ? updatedUser : u)));
      if (currentUser?.id === targetUser.id || currentUser?.email.toLowerCase() === app.email.toLowerCase()) {
        setCurrentUser(updatedUser);
      }

      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();
      if (url && key) {
        const cfg = { ...supabaseConfig, projectUrl: url, anonKey: key };
        pushUserToSupabase(updatedUser, cfg).catch(e => console.warn('[Supabase PUSH Approved User Error]', e));
      }
    }

    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();
    if (url && key) {
      const cfg = { ...supabaseConfig, projectUrl: url, anonKey: key };
      pushInstructorApplicationToSupabase(updatedApp, cfg).catch(e => console.warn('[Supabase PUSH Approved App Error]', e));
    }

    showToast(`✅ Pendaftaran Instruktur "${app.name}" disetujui! Akun berhasil ditingkatkan menjadi Instruktur.`);
    return { success: true, message: 'Instruktur berhasil diverifikasi.' };
  };

  const rejectInstructorApplication = async (applicationId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const app = instructorApplications.find(a => a.id === applicationId);
    if (!app) return { success: false, message: 'Aplikasi instruktur tidak ditemukan' };

    const updatedApp: InstructorApplication = {
      ...app,
      status: 'rejected',
      rejectionReason: reason || 'Dokumen sertifikat/ijazah tidak memenuhi syarat kualifikasi instruktur.',
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser?.name || 'Admin LESIN AJA'
    };

    setInstructorApplications(prev => prev.map(a => (a.id === applicationId ? updatedApp : a)));

    let targetUser = users.find(u => u.id === app.userId || u.email.toLowerCase() === app.email.toLowerCase());
    if (targetUser) {
      const updatedUser: User = {
        ...targetUser,
        instructorStatus: 'rejected',
        instructorRejectionReason: reason
      };
      setUsers(prev => prev.map(u => (u.id === targetUser!.id ? updatedUser : u)));
      if (currentUser?.id === targetUser.id || currentUser?.email.toLowerCase() === app.email.toLowerCase()) {
        setCurrentUser(updatedUser);
      }

      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();
      if (url && key) {
        const cfg = { ...supabaseConfig, projectUrl: url, anonKey: key };
        pushUserToSupabase(updatedUser, cfg).catch(e => console.warn('[Supabase PUSH Rejected User Error]', e));
      }
    }

    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();
    if (url && key) {
      const cfg = { ...supabaseConfig, projectUrl: url, anonKey: key };
      pushInstructorApplicationToSupabase(updatedApp, cfg).catch(e => console.warn('[Supabase PUSH Rejected App Error]', e));
    }

    showToast(`⚠️ Pendaftaran Instruktur "${app.name}" ditolak. Alasan: ${reason}`);
    return { success: true, message: 'Aplikasi instruktur ditolak.' };
  };

  const deleteInstructorApplication = async (applicationId: string): Promise<{ success: boolean; message: string }> => {
    setInstructorApplications(prev => prev.filter(a => a.id !== applicationId));
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();
    if (url && key) {
      const cfg = { ...supabaseConfig, projectUrl: url, anonKey: key };
      deleteInstructorApplicationFromSupabase(applicationId, cfg).catch(() => {});
    }
    showToast('Data permohonan instruktur berhasil dihapus.');
    return { success: true, message: 'Data permohonan instruktur dihapus.' };
  };

  const saveInstructorApplicationsToSupabase = async (appsOverride?: InstructorApplication[]): Promise<{ success: boolean; message: string }> => {
    const targetApps = appsOverride || instructorApplications;
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();
    if (!url || !key) {
      return { success: false, message: 'Kredensial Supabase belum terhubung.' };
    }
    const res = await pushAllInstructorApplicationsToSupabase(targetApps, { ...supabaseConfig, projectUrl: url, anonKey: key });
    if (res.success) {
      showToast(`⚡ ${targetApps.length} Pengajuan instruktur berhasil disinkronkan ke Supabase!`);
      return { success: true, message: 'Berhasil menyimpan pengajuan instruktur ke Supabase.' };
    }
    return { success: false, message: res.error || 'Gagal menyimpan ke Supabase.' };
  };

  // Background Webhook Event Listener for Pakasir & Paymentku
  useEffect(() => {
    const interval = setInterval(async () => {
      const pendingTrxs = transactions.filter(t => t.status === 'pending');
      if (pendingTrxs.length === 0) return;

      // 1. Poll Pakasir Events
      try {
        const res = await fetch('/api/pakasir/events');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.events)) {
            data.events.forEach((evt: any) => {
              if (evt.status === 'completed' && evt.order_id) {
                const matched = pendingTrxs.find(
                  t =>
                    t.orderId?.toLowerCase() === evt.order_id.toLowerCase() ||
                    t.transactionCode?.toLowerCase() === evt.order_id.toLowerCase() ||
                    t.paymentDetails?.pakasirOrderId?.toLowerCase() === evt.order_id.toLowerCase() ||
                    t.paymentDetails?.paymentkuOrderId?.toLowerCase() === evt.order_id.toLowerCase()
                );
                if (matched) {
                  approveTransaction(matched.id);
                }
              }
            });
          }
        }
      } catch {
        // Silently catch background polling errors
      }

      // 2. Poll Paymentku Events
      try {
        const res = await fetch('/api/paymentku/events');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.events)) {
            data.events.forEach((evt: any) => {
              const statusStr = String(evt.status || '').toUpperCase();
              if ((statusStr === 'PAID' || statusStr === 'COMPLETED' || statusStr === 'SUCCESS') && evt.order_id) {
                const matched = pendingTrxs.find(
                  t =>
                    t.orderId?.toLowerCase() === String(evt.order_id).toLowerCase() ||
                    t.transactionCode?.toLowerCase() === String(evt.order_id).toLowerCase() ||
                    t.paymentDetails?.paymentkuOrderId?.toLowerCase() === String(evt.order_id).toLowerCase() ||
                    t.paymentDetails?.pakasirOrderId?.toLowerCase() === String(evt.order_id).toLowerCase()
                );
                if (matched) {
                  approveTransaction(matched.id);
                }
              }
            });
          }
        }
      } catch {
        // Silently catch background polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [transactions, users, currentUser]);

  // Settings with automatic Cloud (Supabase) & Server Persistence
  const updateWebsiteSettings = (updated: Partial<WebsiteSettings>) => {
    setWebsiteSettings(prev => {
      const merged = { ...prev, ...updated };

      // 1. Save to Server Persistent Storage
      fetch('/api/settings/website_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      }).catch(err => console.warn('Server settings save note:', err));

      // 2. Auto-sync to Supabase if connected
      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();
      if (url && key) {
        pushWebsiteSettingsToSupabase(merged, { ...supabaseConfig, projectUrl: url, anonKey: key })
          .then(res => {
            if (res.success) {
              console.log('[Supabase Auto-Sync] Website settings synced to Supabase Cloud.');
            }
          })
          .catch(err => console.warn('[Supabase Auto-Sync Error]', err));
      }

      return merged;
    });
    showToast('Pengaturan website berhasil disimpan & disinkronkan!');
  };

  const updatePaymentSettings = (updated: Partial<PaymentSettings>) => {
    setPaymentSettings(prev => {
      const merged = { ...prev, ...updated };

      // 1. Save to Server Persistent Storage
      fetch('/api/settings/payment_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      }).catch(err => console.warn('Server payment settings save note:', err));

      // 2. Auto-sync to Supabase if connected
      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();
      if (url && key) {
        pushPaymentSettingsToSupabase(merged, { ...supabaseConfig, projectUrl: url, anonKey: key })
          .then(res => {
            if (res.success) {
              console.log('[Supabase Auto-Sync] Payment settings synced to Supabase Cloud.');
            }
          })
          .catch(err => console.warn('[Supabase Auto-Sync Error]', err));
      }

      return merged;
    });
    showToast('Pengaturan payment gateway Pakasir & QRIS berhasil disimpan & disinkronkan!');
  };

  const updateCustomPage = (pageId: string, content: string, title?: string, isPublished?: boolean) => {
    setCustomPages(prev => {
      const updated = prev.map(p => {
        if (p.id === pageId) {
          return {
            ...p,
            content,
            title: title || p.title,
            isPublished: isPublished !== undefined ? isPublished : p.isPublished,
            updatedAt: new Date().toISOString().slice(0, 10)
          };
        }
        return p;
      });

      // Save to Server
      fetch('/api/settings/custom_pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});

      // Sync to Supabase
      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();
      if (url && key) {
        pushCustomPagesToSupabase(updated, { ...supabaseConfig, projectUrl: url, anonKey: key }).catch(() => {});
      }

      return updated;
    });
    showToast('Halaman berhasil diperbarui & disinkronkan.');
  };

  const updateSheetsConfig = (config: Partial<GoogleSheetsConfig>) => {
    setSheetsConfig(prev => ({ ...prev, ...config }));
    showToast('Pengaturan Google Sheets diperbarui.');
  };

  const updateSupabaseConfig = (config: Partial<SupabaseConfig>) => {
    setSupabaseConfig(prev => ({
      ...prev,
      ...config,
      // Keep both projectUrl and url in sync if either is passed
      projectUrl: config.projectUrl || config.url || prev.projectUrl || prev.url || '',
      url: config.projectUrl || config.url || prev.projectUrl || prev.url || ''
    }));
  };

  const loadSupabaseFromSecrets = async (): Promise<boolean> => {
    try {
      showToast('⏳ Memeriksa Environment Variables (Vercel / Vite) & Secrets...');
      // 1. Check client environment variables first
      const env = getEnvSupabaseConfig();
      if (env.isConfigured) {
        setSupabaseConfig(prev => ({
          ...prev,
          projectUrl: env.projectUrl,
          url: env.projectUrl,
          anonKey: env.anonKey,
          isConnected: true,
          isFromSecrets: true,
          hasEnvSecrets: true,
          isFromEnv: true,
          envSource: env.source
        }));
        showToast('✅ Berhasil memuat Supabase URL & Anon Key dari Environment Variables Vercel / Vite!');
        return true;
      }

      // 2. Check server-side endpoint
      const res = await fetch('/api/config/supabase');
      const data = await res.json();
      if (data && data.projectUrl && data.anonKey) {
        setSupabaseConfig(prev => ({
          ...prev,
          projectUrl: data.projectUrl,
          url: data.projectUrl,
          anonKey: data.anonKey,
          isConnected: true,
          isFromSecrets: true,
          hasEnvSecrets: true,
          isFromEnv: true,
          envSource: 'api_secrets'
        }));
        showToast('✅ Berhasil memuat Supabase URL & Anon Key dari Server / Environment!');
        return true;
      } else {
        showToast('ℹ️ Variabel VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diisi di Environment Variables.');
        return false;
      }
    } catch (err: any) {
      showToast('⚠️ Gagal mengambil environment variables: ' + err.message);
      return false;
    }
  };

  const syncToGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    showToast('⏳ Mengirim data sinkronisasi ke Google Sheets...');
    // Real async simulation / fetch to WebAppURL
    try {
      if (sheetsConfig.webAppUrl && sheetsConfig.webAppUrl.startsWith('http')) {
        // Attempt payload dispatch
        const payload = {
          action: 'SYNC_ALL',
          payload: {
            users,
            transactions,
            courses: courses.map(c => ({
              id: c.id,
              title: c.title,
              category: c.category,
              price: c.price,
              studentsCount: c.studentsCount
            }))
          }
        };
        // Use no-cors or JSON post if available
        try {
          await fetch(sheetsConfig.webAppUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch {
          // Fallback gracefully
        }
      }

      setSheetsConfig(prev => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      showToast('✅ Berhasil menyinkronkan data dengan Google Sheets!');
      return { success: true, message: 'Sinkronisasi Google Sheets Berhasil!' };
    } catch {
      return { success: false, message: 'Gagal sinkronisasi. Periksa URL Web App Google Sheets.' };
    }
  };

  const testSupabase = async (): Promise<{ success: boolean; message: string }> => {
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (!url || !key) {
      const msg = 'Harap isi Supabase Project URL dan Anon Public Key pada form di bawah terlebih dahulu!';
      showToast('⚠️ ' + msg);
      return { success: false, message: msg };
    }

    showToast('🔍 Menguji koneksi & memeriksa seluruh tabel Supabase Cloud...');
    const result = await testSupabaseApi(url, key);

    setSupabaseConfig(prev => ({
      ...prev,
      projectUrl: url,
      url: url,
      anonKey: key,
      isConnected: result.success,
      lastSyncStatus: result.success ? 'success' : 'error',
      lastSyncError: result.success ? undefined : result.message
    }));

    showToast(result.success ? '✅ ' + result.message : '⚠️ ' + result.message);
    return result;
  };

  const syncToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (!url || !key) {
      const msg = 'Harap isi Project URL dan Anon Key Supabase terlebih dahulu!';
      showToast('⚠️ ' + msg);
      return { success: false, message: msg };
    }

    showToast('⏳ Mengirim seluruh data (kursus, kategori, user, transaksi, sertifikat, progres, paket bundling) ke Supabase Cloud...');
    setSupabaseConfig(prev => ({ ...prev, lastSyncStatus: 'syncing' }));

    const res = await syncAllToSupabase(
      {
        courses,
        categories,
        users,
        transactions,
        certificates,
        progressMap,
        websiteSettings,
        paymentSettings,
        liveSessions,
        customPages,
        courseBundles
      },
      { ...supabaseConfig, projectUrl: url, url, anonKey: key }
    );

    // Also sync course bundles
    if (courseBundles && courseBundles.length > 0) {
      await pushBundlesToSupabase(courseBundles, { ...supabaseConfig, projectUrl: url, url, anonKey: key });
    }

    setSupabaseConfig(prev => ({
      ...prev,
      projectUrl: url,
      url: url,
      anonKey: key,
      isConnected: res.success,
      lastSyncedAt: res.success ? new Date().toISOString() : prev.lastSyncedAt,
      lastSyncStatus: res.success ? 'success' : 'error',
      lastSyncError: res.success ? undefined : res.message
    }));

    showToast(res.success ? '✅ ' + res.message : '⚠️ ' + res.message);
    return res;
  };

  const syncFromSupabase = async (): Promise<{ success: boolean; message: string }> => {
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (!url || !key) {
      const msg = 'Harap isi Project URL dan Anon Key Supabase terlebih dahulu!';
      showToast('⚠️ ' + msg);
      return { success: false, message: msg };
    }

    showToast('⏳ Mengambil data lengkap dari Supabase Cloud...');

    try {
      const currentCfg = { ...supabaseConfig, projectUrl: url, url, anonKey: key };
      const [coursesRes, catRes, usersRes, trxRes, certsRes, progRes, liveRes, pagesRes, webSettingsRes, paySettingsRes, bundlesRes, certDesignRes, instAppsRes] = await Promise.all([
        fetchCoursesFromSupabase(currentCfg),
        fetchCategoriesFromSupabase(currentCfg),
        fetchUsersFromSupabase(currentCfg),
        fetchTransactionsFromSupabase(currentCfg),
        fetchCertificatesFromSupabase(currentCfg),
        fetchProgressFromSupabase(currentCfg),
        fetchLiveSessionsFromSupabase(currentCfg),
        fetchCustomPagesFromSupabase(currentCfg),
        fetchSettingFromSupabase<WebsiteSettings>('website_settings', currentCfg),
        fetchSettingFromSupabase<PaymentSettings>('payment_settings', currentCfg),
        fetchBundlesFromSupabase(currentCfg),
        fetchCertificateDesignFromSupabase(currentCfg),
        fetchInstructorApplicationsFromSupabase(currentCfg)
      ]);

      if (coursesRes.success && coursesRes.data && coursesRes.data.length > 0) {
        setCourses(coursesRes.data);
      }

      if (instAppsRes.success && instAppsRes.data && instAppsRes.data.length > 0) {
        setInstructorApplications(instAppsRes.data);
      }

      if (catRes.success && catRes.data && catRes.data.length > 0) {
        setCategories(catRes.data);
      }

      if (trxRes.success && trxRes.data && trxRes.data.length > 0) {
        setTransactions(trxRes.data);
      }

      if (certsRes.success && certsRes.data && certsRes.data.length > 0) {
        setCertificates(certsRes.data);
      }

      if (progRes.success && progRes.data) {
        setProgressMap(prev => ({ ...prev, ...progRes.data }));
      }

      if (usersRes.success && usersRes.data && usersRes.data.length > 0) {
        const cloudUsers = usersRes.data;
        const allTransactions = (trxRes.success && trxRes.data) ? trxRes.data : [];

        // Synchronize enrolledCourseIds from completed transactions into users
        const enrichedUsers = cloudUsers.map(u => {
          const userTrxs = allTransactions.filter(t =>
            (t.studentId === u.id || t.studentEmail.toLowerCase() === u.email.toLowerCase()) &&
            t.status === 'completed'
          );
          const enrolledSet = new Set(u.enrolledCourseIds || []);
          userTrxs.forEach(t => {
            if (t.isBundle && Array.isArray(t.enrolledCourseIds)) {
              t.enrolledCourseIds.forEach(id => enrolledSet.add(id));
            } else if (t.courseId) {
              enrolledSet.add(t.courseId);
            }
          });
          return { ...u, enrolledCourseIds: Array.from(enrolledSet) };
        });

        setUsers(enrichedUsers);

        // Update current user if logged in to immediately show all enrolled courses across devices
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const fresh = enrichedUsers.find(u => u.id === prevUser.id || u.email.toLowerCase() === prevUser.email.toLowerCase());
          if (fresh) {
            return {
              ...prevUser,
              ...fresh,
              enrolledCourseIds: fresh.enrolledCourseIds
            };
          }
          return prevUser;
        });
      }

      if (liveRes.success && liveRes.data && liveRes.data.length > 0) {
        setLiveSessions(liveRes.data);
      }

      if (pagesRes.success && pagesRes.data && pagesRes.data.length > 0) {
        setCustomPages(pagesRes.data);
      }

      if (webSettingsRes.success && webSettingsRes.data) {
        setWebsiteSettings(prev => ({ ...prev, ...webSettingsRes.data }));
      }

      if (certDesignRes.success && certDesignRes.data) {
        setWebsiteSettings(prev => ({
          ...prev,
          certificateDesign: {
            ...(prev.certificateDesign || DEFAULT_CERTIFICATE_DESIGN),
            ...certDesignRes.data
          }
        }));
      }

      if (paySettingsRes.success && paySettingsRes.data) {
        setPaymentSettings(prev => ({ ...prev, ...paySettingsRes.data }));
      }

      if (bundlesRes.success && Array.isArray(bundlesRes.data) && bundlesRes.data.length > 0) {
        setCourseBundles(bundlesRes.data);
      }

      const msg = `Berhasil sinkronisasi! Memuat ${coursesRes.data?.length || 0} kursus, ${catRes.data?.length || 0} kategori, ${usersRes.data?.length || 0} pengguna, ${trxRes.data?.length || 0} transaksi, ${certsRes.data?.length || 0} sertifikat, dan pengaturan dari Supabase Cloud.`;
      showToast('✅ ' + msg);
      setSupabaseConfig(prev => ({
        ...prev,
        projectUrl: url,
        url: url,
        anonKey: key,
        isConnected: true,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'success'
      }));
      return { success: true, message: msg };
    } catch (err: any) {
      const errMsg = `Gagal memuat data dari Supabase: ${err?.message || err}`;
      showToast('❌ ' + errMsg);
      return { success: false, message: errMsg };
    }
  };

  // Granular Save to Supabase for Each Admin Menu
  const saveWebsiteSettingsToSupabase = async (settingsOverride?: WebsiteSettings): Promise<{ success: boolean; message: string }> => {
    const target = settingsOverride || websiteSettings;
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    // Save to Server Persistent Storage
    fetch('/api/settings/website_settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target)
    }).catch(err => console.warn('Server settings save note:', err));

    if (!url || !key) {
      const msg = 'Pengaturan website berhasil disimpan di penyimpanan server permanen. Hubungkan Supabase untuk cadangan Cloud.';
      showToast('✅ ' + msg);
      return { success: true, message: msg };
    }

    showToast('⏳ Menyimpan Pengaturan Website ke Supabase...');
    const res = await pushWebsiteSettingsToSupabase(target, { ...supabaseConfig, projectUrl: url, url, anonKey: key });
    if (res.success) {
      showToast('✅ Pengaturan Website berhasil disimpan ke Supabase & Server!');
      return { success: true, message: 'Pengaturan Website berhasil tersimpan di Supabase Cloud dan Server.' };
    } else {
      showToast('⚠️ Tersimpan di server lokal. Catatan Supabase: ' + (res.error || 'Terjadi kesalahan'));
      return { success: true, message: 'Tersimpan di server lokal.' };
    }
  };

  const savePaymentSettingsToSupabase = async (settingsOverride?: PaymentSettings): Promise<{ success: boolean; message: string }> => {
    const target = settingsOverride || paymentSettings;
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    // Save to Server Persistent Storage
    fetch('/api/settings/payment_settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target)
    }).catch(err => console.warn('Server settings save note:', err));

    if (!url || !key) {
      const msg = 'Pengaturan pembayaran berhasil disimpan di server. Hubungkan Supabase untuk cadangan Cloud.';
      showToast('✅ ' + msg);
      return { success: true, message: msg };
    }

    showToast('⏳ Menyimpan Pengaturan Pembayaran ke Supabase...');
    const res = await pushPaymentSettingsToSupabase(target, { ...supabaseConfig, projectUrl: url, url, anonKey: key });
    if (res.success) {
      showToast('✅ Pengaturan Pembayaran & Pakasir berhasil disimpan ke Supabase & Server!');
      return { success: true, message: 'Pengaturan Pembayaran berhasil tersimpan di Supabase Cloud & Server.' };
    } else {
      showToast('⚠️ Tersimpan di server lokal. Catatan Supabase: ' + (res.error || 'Terjadi kesalahan'));
      return { success: true, message: 'Tersimpan di server lokal.' };
    }
  };

  const saveCarouselToSupabase = async (slidesOverride?: any[]): Promise<{ success: boolean; message: string }> => {
    const slides = slidesOverride || websiteSettings.carouselSlides || [];
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    // Save to Server Persistent Storage
    const updatedWebSettings = { ...websiteSettings, carouselSlides: slides };
    fetch('/api/settings/website_settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedWebSettings)
    }).catch(err => console.warn('Server settings save note:', err));

    if (!url || !key) {
      const msg = 'Slide carousel berhasil disimpan di server. Hubungkan Supabase untuk cadangan Cloud.';
      showToast('✅ ' + msg);
      return { success: true, message: msg };
    }

    showToast('⏳ Menyimpan Banner Carousel ke Supabase...');
    const res = await pushCarouselSlidesToSupabase(slides, { ...supabaseConfig, projectUrl: url, url, anonKey: key });
    // Also save updated websiteSettings
    await pushWebsiteSettingsToSupabase(updatedWebSettings, { ...supabaseConfig, projectUrl: url, url, anonKey: key });

    if (res.success) {
      showToast('✅ Banner Carousel berhasil disimpan ke Supabase & Server!');
      return { success: true, message: 'Banner Carousel berhasil tersimpan di Supabase Cloud & Server.' };
    } else {
      showToast('⚠️ Tersimpan di server lokal. Catatan Supabase: ' + (res.error || 'Terjadi kesalahan'));
      return { success: true, message: 'Tersimpan di server lokal.' };
    }
  };

  const saveRunningTextToSupabase = async (runningTextOverride?: any): Promise<{ success: boolean; message: string }> => {
    const rText = runningTextOverride || websiteSettings.runningText;
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    // Save to Server Persistent Storage
    const updatedWebSettings = { ...websiteSettings, runningText: rText };
    fetch('/api/settings/website_settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedWebSettings)
    }).catch(err => console.warn('Server settings save note:', err));

    if (!url || !key) {
      const msg = 'Running text berhasil disimpan di server. Hubungkan Supabase untuk cadangan Cloud.';
      showToast('✅ ' + msg);
      return { success: true, message: msg };
    }

    showToast('⏳ Menyimpan Running Text ke Supabase...');
    const res = await pushRunningTextToSupabase(rText, { ...supabaseConfig, projectUrl: url, url, anonKey: key });
    // Also save updated websiteSettings
    await pushWebsiteSettingsToSupabase(updatedWebSettings, { ...supabaseConfig, projectUrl: url, url, anonKey: key });

    if (res.success) {
      showToast('✅ Running Text berhasil disimpan ke Supabase & Server!');
      return { success: true, message: 'Running Text berhasil tersimpan di Supabase Cloud & Server.' };
    } else {
      showToast('⚠️ Tersimpan di server lokal. Catatan Supabase: ' + (res.error || 'Terjadi kesalahan'));
      return { success: true, message: 'Tersimpan di server lokal.' };
    }
  };

  const saveLiveSessionsToSupabase = async (sessionsOverride?: LiveSession[]): Promise<{ success: boolean; message: string }> => {
    const target = sessionsOverride || liveSessions;
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (!url || !key) {
      const msg = 'Koneksi Supabase belum disetel. Buka menu Pengaturan Supabase untuk mengisi URL & Key.';
      showToast('⚠️ ' + msg);
      return { success: false, message: msg };
    }

    showToast('⏳ Menyimpan Jadwal Live Mentoring ke Supabase...');
    const res = await pushLiveSessionsToSupabase(target, { ...supabaseConfig, projectUrl: url, url, anonKey: key });
    if (res.success) {
      showToast(`✅ ${target.length} Jadwal Sesi Live berhasil disimpan ke Supabase!`);
      return { success: true, message: `${target.length} Jadwal Sesi Live berhasil tersimpan di Supabase Cloud.` };
    } else {
      showToast('❌ Gagal menyimpan ke Supabase: ' + (res.error || 'Terjadi kesalahan'));
      return { success: false, message: res.error || 'Gagal menyimpan ke Supabase' };
    }
  };

  const saveCustomPagesToSupabase = async (pagesOverride?: CustomPage[]): Promise<{ success: boolean; message: string }> => {
    const target = pagesOverride || customPages;
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (!url || !key) {
      const msg = 'Koneksi Supabase belum disetel. Buka menu Pengaturan Supabase untuk mengisi URL & Key.';
      showToast('⚠️ ' + msg);
      return { success: false, message: msg };
    }

    showToast('⏳ Menyimpan Halaman CMS ke Supabase...');
    const res = await pushCustomPagesToSupabase(target, { ...supabaseConfig, projectUrl: url, url, anonKey: key });
    if (res.success) {
      showToast(`✅ ${target.length} Halaman CMS berhasil disimpan ke Supabase!`);
      return { success: true, message: `${target.length} Halaman CMS berhasil tersimpan di Supabase Cloud.` };
    } else {
      showToast('❌ Gagal menyimpan ke Supabase: ' + (res.error || 'Terjadi kesalahan'));
      return { success: false, message: res.error || 'Gagal menyimpan ke Supabase' };
    }
  };

  const saveCategoriesToSupabase = async (categoriesOverride?: CategoryItem[]): Promise<{ success: boolean; message: string }> => {
    const target = categoriesOverride || categories;
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (!url || !key) {
      const msg = 'Koneksi Supabase belum disetel. Buka menu Pengaturan Supabase untuk mengisi URL & Key.';
      showToast('⚠️ ' + msg);
      return { success: false, message: msg };
    }

    showToast('⏳ Menyimpan Kategori ke Supabase...');
    const res = await pushAllCategoriesToSupabase(target, { ...supabaseConfig, projectUrl: url, url, anonKey: key });
    if (res.success) {
      showToast(`✅ ${target.length} Kategori berhasil disimpan ke Supabase!`);
      return { success: true, message: `${target.length} Kategori berhasil tersimpan di Supabase Cloud.` };
    } else {
      showToast('❌ Gagal menyimpan ke Supabase: ' + (res.error || 'Terjadi kesalahan'));
      return { success: false, message: res.error || 'Gagal menyimpan ke Supabase' };
    }
  };

  const saveUsersToSupabase = async (usersOverride?: User[]): Promise<{ success: boolean; message: string }> => {
    const target = usersOverride || users;
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (!url || !key) {
      const msg = 'Koneksi Supabase belum disetel. Buka menu Pengaturan Supabase untuk mengisi URL & Key.';
      showToast('⚠️ ' + msg);
      return { success: false, message: msg };
    }

    showToast('⏳ Menyimpan Data Pengguna/Siswa ke Supabase...');
    const res = await pushAllUsersToSupabase(target, { ...supabaseConfig, projectUrl: url, url, anonKey: key });
    if (res.success) {
      showToast(`✅ ${target.length} Pengguna/Siswa berhasil disimpan ke Supabase!`);
      return { success: true, message: `${target.length} Pengguna/Siswa berhasil tersimpan di Supabase Cloud.` };
    } else {
      showToast('❌ Gagal menyimpan ke Supabase: ' + (res.error || 'Terjadi kesalahan'));
      return { success: false, message: res.error || 'Gagal menyimpan ke Supabase' };
    }
  };

  const saveCoursesToSupabase = async (coursesOverride?: Course[]): Promise<{ success: boolean; message: string }> => {
    const target = coursesOverride || courses;
    const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
    const key = (supabaseConfig.anonKey || '').trim();

    if (!url || !key) {
      const msg = 'Koneksi Supabase belum disetel. Buka menu Pengaturan Supabase untuk mengisi URL & Key.';
      showToast('⚠️ ' + msg);
      return { success: false, message: msg };
    }

    showToast('⏳ Menyimpan Semua Kursus ke Supabase...');
    const res = await pushAllCoursesToSupabase(target, { ...supabaseConfig, projectUrl: url, url, anonKey: key });
    if (res.success) {
      showToast(`✅ ${target.length} Kursus berhasil disimpan ke Supabase!`);
      return { success: true, message: `${target.length} Kursus berhasil tersimpan di Supabase Cloud.` };
    } else {
      showToast('❌ Gagal menyimpan ke Supabase: ' + (res.error || 'Terjadi kesalahan'));
      return { success: false, message: res.error || 'Gagal menyimpan ke Supabase' };
    }
  };

  // Certificate Design Update
  const updateCertificateDesign = (designUpdate: Partial<CertificateDesignSettings>) => {
    setWebsiteSettings(prev => {
      const currentDesign = prev.certificateDesign || DEFAULT_CERTIFICATE_DESIGN;
      const mergedDesign: CertificateDesignSettings = {
        ...currentDesign,
        ...designUpdate
      };
      const updatedWebsite: WebsiteSettings = {
        ...prev,
        certificateDesign: mergedDesign
      };

      fetch('/api/settings/website_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWebsite)
      }).catch(err => console.warn('Server certificate design save note:', err));

      const url = (supabaseConfig.projectUrl || supabaseConfig.url || '').trim();
      const key = (supabaseConfig.anonKey || '').trim();
      if (url && key) {
        const supConfig = { ...supabaseConfig, projectUrl: url, anonKey: key };
        pushWebsiteSettingsToSupabase(updatedWebsite, supConfig).catch(() => {});
        pushCertificateDesignToSupabase(mergedDesign, supConfig).catch(() => {});
      }

      return updatedWebsite;
    });
    showToast('🎨 Desain template sertifikat berhasil disimpan & diperbarui!');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        registerStudent,
        updateUserProfile,
        updateUserRole,
        deleteUser,
        clearAllDataAndReset,
        instructorApplications,
        applyAsInstructor,
        approveInstructorApplication,
        rejectInstructorApplication,
        deleteInstructorApplication,
        approveCourse,
        rejectCourse,
        submitCourseForVerification,
        saveInstructorApplicationsToSupabase,
        isDarkMode,
        toggleDarkMode,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        courses,
        addCourse,
        updateCourse,
        deleteCourse,
        addModuleToCourse,
        loadSampleCourses,
        enrollStudentToCourse,
        unenrollStudentFromCourse,
        updateCourseStats,
        recalculateAllCoursesStats,
        courseBundles,
        addBundle,
        updateBundle,
        deleteBundle,
        getEffectiveBundleCourses,
        getBundlesForCourse,
        saveBundlesToSupabase,
        progressMap,
        markModuleCompleted,
        updateVideoWatchProgress,
        saveQuizScore,
        saveModuleNote,
        claimCertificate,
        getStudentCourseProgress,
        certificates,
        certificateDesignSettings: websiteSettings.certificateDesign || DEFAULT_CERTIFICATE_DESIGN,
        getCertificateByNumber,
        updateCertificateDesign,
        liveSessions,
        registerForLiveSession,
        addLiveSession,
        updateLiveSession,
        deleteLiveSession,
        discussions,
        addDiscussion,
        addDiscussionReply,
        chatMessages,
        sendChatMessage,
        transactions,
        createTransaction,
        updateTransaction,
        approveTransaction,
        payoutRequests,
        requestInstructorPayout,
        processPayoutRequest,
        updateInstructorProfile,
        websiteSettings,
        updateWebsiteSettings,
        paymentSettings,
        updatePaymentSettings,
        saveWebsiteSettingsToSupabase,
        savePaymentSettingsToSupabase,
        saveCarouselToSupabase,
        saveRunningTextToSupabase,
        saveLiveSessionsToSupabase,
        saveCustomPagesToSupabase,
        saveCategoriesToSupabase,
        saveUsersToSupabase,
        saveCoursesToSupabase,
        customPages,
        updateCustomPage,
        sheetsConfig,
        updateSheetsConfig,
        supabaseConfig,
        updateSupabaseConfig,
        loadSupabaseFromSecrets,
        testSupabase,
        syncToSupabase,
        syncFromSupabase,
        syncToGoogleSheets,
        currentView,
        viewParams,
        navigateTo,
        toastMessage,
        showToast,
        hideToast: () => setToastMessage(null)
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
