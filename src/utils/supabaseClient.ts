import { createClient, SupabaseClient, User as SupabaseAuthUser, Session as SupabaseSession } from '@supabase/supabase-js';
import {
  Course,
  CourseBundle,
  CategoryItem,
  User,
  Transaction,
  StudentProgress,
  Certificate,
  SupabaseConfig,
  WebsiteSettings,
  PaymentSettings,
  CarouselSlide,
  LiveSession,
  CustomPage,
  CertificateDesignSettings,
  InstructorApplication,
  InstructorApplicationStatus,
  CourseVerificationStatus
} from '../types';

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

/**
 * Detects and retrieves Supabase credentials from:
 * 1. Vite import.meta.env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY for Vercel / Client Builds)
 * 2. Node process.env (SUPABASE_URL, SUPABASE_ANON_KEY)
 */
export function getEnvSupabaseConfig(): {
  projectUrl: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'vite_env' | 'process_env' | 'none';
} {
  let projectUrl = '';
  let anonKey = '';
  let source: 'vite_env' | 'process_env' | 'none' = 'none';

  // 1. Vite import.meta.env (Standard in Vercel client build)
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const env = (import.meta as any).env;
      projectUrl = (
        env.VITE_SUPABASE_URL ||
        env.VITE_SUPABASE_PROJECT_URL ||
        env.SUPABASE_URL ||
        ''
      ).trim();

      anonKey = (
        env.VITE_SUPABASE_ANON_KEY ||
        env.VITE_SUPABASE_KEY ||
        env.SUPABASE_ANON_KEY ||
        ''
      ).trim();

      if (projectUrl && anonKey) {
        source = 'vite_env';
      }
    }
  } catch {}

  // 2. Node / process.env fallback (in case of SSR or Vite define injection)
  if (!projectUrl || !anonKey) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        const pUrl = (
          process.env.VITE_SUPABASE_URL ||
          process.env.SUPABASE_URL ||
          process.env.VITE_SUPABASE_PROJECT_URL ||
          process.env.SUPABASE_PROJECT_URL ||
          ''
        ).trim();

        const pKey = (
          process.env.VITE_SUPABASE_ANON_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          process.env.VITE_SUPABASE_KEY ||
          process.env.SUPABASE_KEY ||
          ''
        ).trim();

        if (pUrl && pKey) {
          projectUrl = pUrl;
          anonKey = pKey;
          source = 'process_env';
        }
      }
    } catch {}
  }

  return {
    projectUrl,
    anonKey,
    isConfigured: Boolean(projectUrl && anonKey),
    source
  };
}

/**
 * Resolves effective Supabase credentials prioritizing:
 * 1. Explicit arguments (if passed & non-empty)
 * 2. LocalStorage override ('lesinaja_supabase_v2')
 * 3. Environment variables (VITE_SUPABASE_URL, SUPABASE_URL)
 */
export function resolveEffectiveSupabaseConfig(config?: { projectUrl?: string; url?: string; anonKey?: string }): {
  projectUrl: string;
  anonKey: string;
  isFromEnv: boolean;
} {
  let url = (config?.projectUrl || config?.url || '').trim();
  let key = (config?.anonKey || '').trim();

  // If argument is missing, check localStorage
  if (!url || !key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('lesinaja_supabase_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.projectUrl || parsed?.url) {
            url = url || (parsed.projectUrl || parsed.url || '').trim();
          }
          if (parsed?.anonKey) {
            key = key || (parsed.anonKey || '').trim();
          }
        }
      }
    } catch {}
  }

  // If still missing, fallback to Environment Variables (Vercel / Vite env)
  let isFromEnv = false;
  if (!url || !key) {
    const env = getEnvSupabaseConfig();
    if (env.isConfigured) {
      url = url || env.projectUrl;
      key = key || env.anonKey;
      isFromEnv = true;
    }
  }

  return { projectUrl: url, anonKey: key, isFromEnv };
}

export function getSupabaseClient(config?: { projectUrl?: string; url?: string; anonKey?: string }): SupabaseClient | null {
  const { projectUrl: url, anonKey: key } = resolveEffectiveSupabaseConfig(config);

  if (!url || !key) {
    return null;
  }

  // Basic validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

/**
 * ============================================================================
 * SUPABASE AUTHENTICATION HELPERS (Email Confirmation & Password System)
 * ============================================================================
 */

export interface SupabaseAuthResult {
  success: boolean;
  user?: SupabaseAuthUser | null;
  session?: SupabaseSession | null;
  needsEmailConfirmation?: boolean;
  message: string;
  error?: string;
  isDatabaseTriggerError?: boolean;
}

/**
 * Safely resolves the application origin for Supabase Auth redirects.
 * Guarantees that internal development iframe origins like aistudio.google.com are never used as redirect destinations.
 */
export function getSafeAppOrigin(): string {
  if (typeof window === 'undefined') {
    return 'https://lesinaja.vercel.app';
  }

  const origin = window.location.origin;
  // If running inside Google AI Studio parent frame or if origin is aistudio.google.com or undefined, use production Vercel live URL
  if (!origin || origin.includes('aistudio.google.com') || origin === 'null') {
    return 'https://lesinaja.vercel.app';
  }

  return origin;
}

/**
 * Sign up a new student/user with Supabase Auth (Triggering Supabase Confirmation Email)
 */
export async function signUpWithSupabaseEmail(
  params: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    institution?: string;
    role?: 'admin' | 'student' | 'instructor';
  },
  config?: SupabaseConfig
): Promise<SupabaseAuthResult> {
  const client = getSupabaseClient(config);
  if (!client) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi. Hubungkan Project URL dan Anon Key di Pengaturan Supabase terlebih dahulu.'
    };
  }

  try {
    const redirectUrl = getSafeAppOrigin();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.name.trim();

    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: params.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: cleanName,
          full_name: cleanName,
          phone: params.phone?.trim() || '',
          institution: params.institution?.trim() || '',
          role: params.role || 'student'
        }
      }
    });

    if (error) {
      const errMsg = error.message || '';
      const isDbTriggerError =
        errMsg.toLowerCase().includes('database error saving new user') ||
        errMsg.toLowerCase().includes('database error') ||
        (error as any).status === 500;

      if (isDbTriggerError) {
        console.warn('[Supabase Auth] Trigger error on auth.users during signUp. Retrying with minimal options...', error);
        
        // Attempt a clean retry without user metadata to bypass trigger crashes
        try {
          const retryRes = await client.auth.signUp({
            email: cleanEmail,
            password: params.password,
            options: {
              emailRedirectTo: redirectUrl
            }
          });

          if (retryRes.data?.user) {
            const isEmailConfirmed = Boolean(retryRes.data.user.email_confirmed_at || retryRes.data.session);
            return {
              success: true,
              user: retryRes.data.user,
              session: retryRes.data.session,
              needsEmailConfirmation: !isEmailConfirmed,
              message: isEmailConfirmed
                ? 'Pendaftaran berhasil dan akun langsung aktif!'
                : `Email konfirmasi telah dikirim ke ${cleanEmail}.`
            };
          }
        } catch (retryErr) {
          console.warn('[Supabase Auth] Retry without metadata encountered issue:', retryErr);
        }

        return {
          success: false,
          error: error.message,
          isDatabaseTriggerError: true,
          message: `Database Supabase mengalami kendala pada trigger sinkronisasi (${errMsg}).`
        };
      }

      return {
        success: false,
        error: error.message,
        message: `Gagal mendaftar: ${error.message}`
      };
    }

    // If Supabase has "Confirm email" enabled, session will be null and user.identities will indicate email not confirmed
    const isEmailConfirmed = Boolean(data.user?.email_confirmed_at || data.session);

    return {
      success: true,
      user: data.user,
      session: data.session,
      needsEmailConfirmation: !isEmailConfirmed,
      message: isEmailConfirmed
        ? 'Pendaftaran berhasil dan akun langsung aktif!'
        : `Email konfirmasi telah dikirim ke ${params.email}. Silakan buka kotak masuk email Anda dan klik tautan konfirmasi untuk mengaktifkan akun.`
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      message: `Terjadi kesalahan saat registrasi: ${err.message}`
    };
  }
}

/**
 * Sign in existing user with Supabase Auth
 */
export async function signInWithSupabaseEmail(
  email: string,
  password: string,
  config?: SupabaseConfig
): Promise<SupabaseAuthResult> {
  const client = getSupabaseClient(config);
  if (!client) {
    return {
      success: false,
      message: 'Supabase belum terhubung. Silakan isi Project URL & Anon Key di Admin Dashboard.'
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          needsEmailConfirmation: true,
          error: error.message,
          message: 'Email Anda belum dikonfirmasi! Silakan periksa inbox email Anda dan klik link verifikasi dari Supabase.'
        };
      }
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return {
          success: false,
          error: error.message,
          message: 'Email atau kata sandi (password) salah. Silakan periksa kembali.'
        };
      }
      return {
        success: false,
        error: error.message,
        message: `Gagal masuk: ${error.message}`
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      message: 'Berhasil masuk dengan akun Supabase.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      message: `Terjadi kesalahan saat login: ${err.message}`
    };
  }
}

/**
 * Resend confirmation email for a user
 */
export async function resendSupabaseConfirmation(
  email: string,
  config?: SupabaseConfig
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient(config);
  if (!client) {
    return { success: false, message: 'Supabase belum dikonfigurasi.' };
  }

  try {
    const redirectUrl = getSafeAppOrigin();
    const { error } = await client.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      return { success: false, message: `Gagal mengirim ulang email konfirmasi: ${error.message}` };
    }

    return {
      success: true,
      message: `Tautan konfirmasi baru berhasil dikirim ke ${email}. Silakan periksa kotak masuk & folder spam Anda.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengirim ulang email konfirmasi.' };
  }
}

/**
 * Send password reset email
 */
export async function sendSupabasePasswordReset(
  email: string,
  config?: SupabaseConfig
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient(config);
  if (!client) {
    return { success: false, message: 'Supabase belum dikonfigurasi.' };
  }

  try {
    const redirectUrl = getSafeAppOrigin();
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl
    });

    if (error) {
      return { success: false, message: `Gagal mengirim email reset: ${error.message}` };
    }

    return {
      success: true,
      message: `Tautan reset kata sandi telah dikirim ke ${email}. Silakan cek email Anda.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengirim email reset kata sandi.' };
  }
}

/**
 * Sign out from Supabase Auth
 */
export async function signOutFromSupabase(config?: SupabaseConfig): Promise<void> {
  const client = getSupabaseClient(config);
  if (client) {
    try {
      await client.auth.signOut();
    } catch (err) {
      console.warn('Error signing out from Supabase Auth:', err);
    }
  }
}

/**
 * Test connectivity to Supabase and check if tables exist & RLS permissions
 */
export async function testSupabaseConnection(
  projectUrl?: string,
  anonKey?: string
): Promise<{
  success: boolean;
  message: string;
  tablesStatus?: Record<string, { exists: boolean; rlsOk: boolean; error?: string }>;
  allTablesOk?: boolean;
}> {
  const { projectUrl: url, anonKey: key, isFromEnv } = resolveEffectiveSupabaseConfig({ projectUrl, anonKey });

  if (!url || !key) {
    return {
      success: false,
      message: 'Project URL atau Anon Public Key masih kosong. Silakan atur Environment Variable Vercel (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) atau isi formulir di atas.'
    };
  }

  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return {
      success: false,
      message: 'Format Project URL tidak valid. Pastikan diawali dengan https://... (contoh: https://abcdefghijkl.supabase.co)'
    };
  }

  const client = getSupabaseClient({ projectUrl: url, anonKey: key });
  if (!client) {
    return {
      success: false,
      message: 'Gagal menginisialisasi Supabase Client. Periksa kembali format URL dan Anon Key Anda.'
    };
  }

  const tables = ['categories', 'courses', 'users', 'transactions', 'student_progress', 'certificates', 'settings', 'live_sessions', 'custom_pages', 'course_bundles'];
  const tablesStatus: Record<string, { exists: boolean; rlsOk: boolean; error?: string }> = {};

  try {
    const testPromise = async () => {
      for (const table of tables) {
        try {
          const selectColumn = table === 'settings' ? 'key' : 'id';
          const { error } = await client.from(table).select(selectColumn).limit(1);
          if (!error) {
            tablesStatus[table] = { exists: true, rlsOk: true };
          } else if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
            tablesStatus[table] = { exists: false, rlsOk: false, error: 'Tabel belum dibuat di database Supabase' };
          } else if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied') || error.message?.toLowerCase().includes('violates row-level security')) {
            tablesStatus[table] = { exists: true, rlsOk: false, error: 'RLS Policy memblokir akses anon' };
          } else {
            tablesStatus[table] = { exists: false, rlsOk: false, error: error.message };
          }
        } catch (err: any) {
          tablesStatus[table] = { exists: false, rlsOk: false, error: err?.message || 'Error' };
        }
      }
    };

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Koneksi timeout (lebih dari 8 detik). Pastikan URL Supabase aktif dan dapat diakses.')),
        8000
      )
    );

    await Promise.race([testPromise(), timeoutPromise]);

    const missingTables = tables.filter(t => !tablesStatus[t]?.exists);
    const rlsBlockedTables = tables.filter(t => tablesStatus[t]?.exists && !tablesStatus[t]?.rlsOk);

    if (missingTables.length === 0 && rlsBlockedTables.length === 0) {
      return {
        success: true,
        message: `Koneksi Supabase Berhasil! Seluruh ${tables.length} tabel (${tables.join(', ')}) aktif dan siap digunakan.`,
        tablesStatus,
        allTablesOk: true
      };
    }

    if (missingTables.length > 0) {
      return {
        success: false,
        message: `Terkoneksi ke Supabase, namun ${missingTables.length} tabel belum dibuat: [${missingTables.join(', ')}]. Jalankan skrip SQL lengkap di bawah pada SQL Editor Supabase.`,
        tablesStatus,
        allTablesOk: false
      };
    }

    if (rlsBlockedTables.length > 0) {
      return {
        success: false,
        message: `Tabel ditemukan, namun RLS memblokir: [${rlsBlockedTables.join(', ')}]. Jalankan policy SQL di bawah agar website diizinkan membaca/menulis.`,
        tablesStatus,
        allTablesOk: false
      };
    }

    return {
      success: true,
      message: 'Koneksi ke Supabase berhasil!',
      tablesStatus,
      allTablesOk: true
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi server Supabase: ${err?.message || err}. Periksa Project URL dan Anon Key Anda.`,
      tablesStatus
    };
  }
}

/**
 * Course mapping functions between TypeScript and PostgreSQL
 */
function courseToRow(c: Course) {
  const cleanSlug = (c.slug || c.title || c.id || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `course-${c.id || Date.now()}`;

  return {
    id: String(c.id),
    title: String(c.title || 'Kursus Tanpa Judul'),
    slug: cleanSlug,
    description: String(c.description || ''),
    category: String(c.category || 'Web & Mobile Dev'),
    level: String(c.level || 'Semua Level'),
    instructor_id: c.instructorId || c.instructor?.id || 'inst-1',
    instructor: typeof c.instructor === 'object' && c.instructor !== null ? {
      id: c.instructor.id || c.instructorId || 'inst-1',
      name: c.instructor.name || 'Mentor Ahli',
      title: c.instructor.title || 'Instruktur LESIN AJA',
      avatar: c.instructor.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      signatureUrl: c.instructor.signatureUrl || '',
      certificateUrl: c.instructor.certificateUrl || ''
    } : {
      id: 'inst-1',
      name: 'Instruktur LESIN AJA',
      title: 'Mentor Ahli',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    thumbnail: String(c.thumbnail || ''),
    price: Number(c.price || 0),
    original_price: Number(c.originalPrice || 0),
    allow_custom_price: Boolean(c.allowCustomPrice),
    min_custom_price: Number(c.minCustomPrice || 0),
    suggested_custom_prices: Array.isArray(c.suggestedCustomPrices) ? c.suggestedCustomPrices : [],
    attached_bundle_courses: Array.isArray(c.attachedBundleCourses) ? c.attachedBundleCourses : [],
    rating: Number(c.rating || 5.0),
    students_count: Number(c.studentsCount || 0),
    modules: Array.isArray(c.modules) ? c.modules : [],
    certificate_available: c.certificateAvailable ?? true,
    tags: Array.isArray(c.tags) ? c.tags : [],
    is_featured: Boolean(c.isFeatured),
    is_popular: Boolean(c.isPopular),
    verification_status: c.verificationStatus || 'approved',
    rejection_reason: c.rejectionReason || null,
    verified_at: c.verifiedAt || null,
    verified_by: c.verifiedBy || null,
    status: c.status || (c.verificationStatus === 'pending' ? 'pending' : (c.verificationStatus === 'rejected' ? 'rejected' : 'published')),
    created_at: c.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function courseToLegacyRow(c: Course) {
  const row = courseToRow(c);
  const instructor = row.instructor;
  const { instructor: _, ...rest } = row;
  return {
    ...rest,
    instructor_id: instructor?.id || 'inst-1',
    instructor_name: instructor?.name || 'Mentor Ahli',
    instructor_title: instructor?.title || 'Instruktur LESIN AJA',
    instructor_avatar: instructor?.avatar || ''
  };
}

function courseToMinimalRow(c: Course) {
  const row = courseToRow(c);
  const { instructor: _, allow_custom_price: _acp, min_custom_price: _mcp, suggested_custom_prices: _scp, ...rest } = row;
  return rest;
}

function rowToCourse(row: any): Course {
  let instructorObj = {
    id: 'inst-default',
    name: 'Instruktur LESIN AJA',
    title: 'Mentor Ahli',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    certificateUrl: ''
  };

  if (row.instructor && typeof row.instructor === 'object') {
    instructorObj = {
      id: row.instructor.id || 'inst-default',
      name: row.instructor.name || 'Instruktur LESIN AJA',
      title: row.instructor.title || 'Mentor Ahli',
      avatar: row.instructor.avatar || instructorObj.avatar,
      certificateUrl: row.instructor.certificateUrl || ''
    };
  } else if (row.instructor_name) {
    instructorObj = {
      id: row.instructor_id || 'inst-default',
      name: row.instructor_name,
      title: row.instructor_title || 'Mentor Ahli',
      avatar: row.instructor_avatar || instructorObj.avatar,
      certificateUrl: ''
    };
  }

  let modulesList: any[] = [];
  if (Array.isArray(row.modules)) {
    modulesList = row.modules;
  } else if (typeof row.modules === 'string') {
    try {
      modulesList = JSON.parse(row.modules);
    } catch {
      modulesList = [];
    }
  }

  let suggestedPrices: number[] = [];
  if (Array.isArray(row.suggested_custom_prices)) {
    suggestedPrices = row.suggested_custom_prices;
  } else if (Array.isArray(row.suggestedCustomPrices)) {
    suggestedPrices = row.suggestedCustomPrices;
  } else if (typeof row.suggested_custom_prices === 'string') {
    try {
      suggestedPrices = JSON.parse(row.suggested_custom_prices);
    } catch {
      suggestedPrices = [];
    }
  }

  const allowCustomPrice = Boolean(row.allow_custom_price ?? row.allowCustomPrice ?? false);
  const minCustomPrice = Number(row.min_custom_price ?? row.minCustomPrice ?? 0);

  let attachedBundles: any[] = [];
  if (Array.isArray(row.attached_bundle_courses)) {
    attachedBundles = row.attached_bundle_courses;
  } else if (Array.isArray(row.attachedBundleCourses)) {
    attachedBundles = row.attachedBundleCourses;
  } else if (typeof row.attached_bundle_courses === 'string') {
    try {
      attachedBundles = JSON.parse(row.attached_bundle_courses);
    } catch {
      attachedBundles = [];
    }
  }

  const verificationStatus: CourseVerificationStatus = (row.verification_status || row.verificationStatus || 'approved') as CourseVerificationStatus;

  return {
    id: String(row.id),
    title: row.title || 'Tanpa Judul',
    slug: row.slug || String(row.id),
    description: row.description || '',
    category: row.category || 'Web & Mobile Dev',
    level: row.level || 'Semua Level',
    instructorId: row.instructor_id || row.instructorId || instructorObj.id,
    instructor: instructorObj,
    thumbnail: row.thumbnail || '',
    price: Number(row.price || 0),
    originalPrice: Number(row.original_price ?? row.originalPrice ?? 0),
    allowCustomPrice: allowCustomPrice,
    minCustomPrice: minCustomPrice,
    suggestedCustomPrices: suggestedPrices.length > 0 ? suggestedPrices : undefined,
    attachedBundleCourses: attachedBundles.length > 0 ? attachedBundles : undefined,
    rating: Number(row.rating || 5.0),
    studentsCount: Number(row.students_count ?? row.studentsCount ?? 0),
    modules: modulesList,
    certificateAvailable: row.certificate_available ?? row.certificateAvailable ?? true,
    tags: Array.isArray(row.tags) ? row.tags : [],
    isFeatured: Boolean(row.is_featured ?? row.isFeatured),
    isPopular: Boolean(row.is_popular ?? row.isPopular),
    verificationStatus,
    rejectionReason: row.rejection_reason || row.rejectionReason || undefined,
    verifiedAt: row.verified_at || row.verifiedAt || undefined,
    verifiedBy: row.verified_by || row.verifiedBy || undefined,
    status: row.status || (verificationStatus === 'pending' ? 'pending' : (verificationStatus === 'rejected' ? 'rejected' : 'published')),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
  };
}

/**
 * Category mapping functions
 */
function categoryToRow(cat: CategoryItem) {
  return {
    id: String(cat.id),
    name: String(cat.name || ''),
    slug: (cat.slug || cat.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || `cat-${cat.id}`,
    description: String(cat.description || ''),
    icon: String(cat.icon || 'Folder'),
    color: String(cat.color || 'blue'),
    order_num: Number(cat.order || 0),
    is_active: cat.isActive ?? true,
    created_at: new Date().toISOString()
  };
}

function rowToCategory(row: any): CategoryItem {
  return {
    id: String(row.id),
    name: row.name || '',
    slug: row.slug || (row.name ? row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : String(row.id)),
    description: row.description || '',
    icon: row.icon || 'Folder',
    color: row.color || 'blue',
    order: Number(row.order_num ?? row.order ?? 0),
    isActive: row.is_active ?? row.isActive ?? true
  };
}

/**
 * PUSH / UPSERT a single course into Supabase
 */
export async function pushCourseToSupabase(
  course: Course,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string; details?: any }> {
  const { projectUrl: url, anonKey: key } = resolveEffectiveSupabaseConfig(config);

  if (!url || !key) {
    return {
      success: false,
      error: 'Project URL atau Anon Public Key Supabase belum diisi. Setel di Environment Variable Vercel (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) atau buka Pengaturan Supabase di Admin Dashboard.'
    };
  }

  const client = getSupabaseClient({ ...config, projectUrl: url, anonKey: key });
  if (!client) {
    return { success: false, error: 'Gagal menginisialisasi koneksi Supabase Client.' };
  }

  try {
    const row = courseToRow(course);

    // Primary attempt: Upsert by ID
    let { error: upsertError } = await client
      .from('courses')
      .upsert(row, { onConflict: 'id' });

    // Fallback 1: If instructor or custom price columns don't exist in Supabase schema cache
    if (upsertError && (
      upsertError.message?.includes('instructor') ||
      upsertError.message?.includes('allow_custom_price') ||
      upsertError.message?.includes('min_custom_price') ||
      upsertError.message?.includes('suggested_custom_prices') ||
      upsertError.message?.includes('schema cache') ||
      upsertError.message?.includes('column')
    )) {
      console.warn('Retrying course upsert with legacy format fallback...');
      const legacyRow = courseToLegacyRow(course);
      const { error: legErr } = await client.from('courses').upsert(legacyRow, { onConflict: 'id' });
      if (!legErr) {
        // Also backup custom price settings to settings table
        await backupCourseCustomPricing(course, config);
        return { success: true };
      }

      // Fallback 2: minimal row without instructor & custom price columns
      const minRow = courseToMinimalRow(course);
      const { error: minErr } = await client.from('courses').upsert(minRow, { onConflict: 'id' });
      if (!minErr) {
        // Also backup custom price settings to settings table
        await backupCourseCustomPricing(course, config);
        return { success: true };
      }
      upsertError = legErr || minErr;
    }

    if (!upsertError) {
      // Backup custom price settings as dual-layer guarantee
      backupCourseCustomPricing(course, config).catch(() => {});
      return { success: true };
    }

    console.warn('Supabase upsert failed, attempting fallback...', upsertError);

    // If upsert failed due to missing table, RLS, or constraint
    if (upsertError.code === '42P01') {
      return {
        success: false,
        error: 'Tabel "courses" belum dibuat di Supabase. Salin dan jalankan skrip SQL di Admin Dashboard -> Pengaturan Supabase.',
        details: upsertError
      };
    }

    if (upsertError.code === '42501' || upsertError.message?.toLowerCase().includes('permission denied') || upsertError.message?.toLowerCase().includes('violates row-level security')) {
      return {
        success: false,
        error: 'Akses ditolak oleh RLS Policy Supabase. Jalankan skrip RLS di SQL Editor Supabase untuk mengizinkan insert publik (anon).',
        details: upsertError
      };
    }

    if (upsertError.code === '23505') {
      // Slug conflict: try regenerating a unique slug and retry
      const retryRow = {
        ...row,
        slug: `${row.slug}-${Date.now().toString().slice(-4)}`
      };
      const { error: retryErr } = await client.from('courses').upsert(retryRow, { onConflict: 'id' });
      if (!retryErr) return { success: true };
      return {
        success: false,
        error: `Gagal menyimpan kursus: Duplikasi slug (${upsertError.details || upsertError.message})`,
        details: upsertError
      };
    }

    // Try fallback: check if record exists, then update or insert
    const { data: existing } = await client.from('courses').select('id').eq('id', row.id).maybeSingle();
    if (existing) {
      const { error: updateErr } = await client.from('courses').update(row).eq('id', row.id);
      if (!updateErr) return { success: true };
      return { success: false, error: updateErr.message, details: updateErr };
    } else {
      const { error: insertErr } = await client.from('courses').insert(row);
      if (!insertErr) return { success: true };
      return { success: false, error: insertErr.message, details: insertErr };
    }
  } catch (err: any) {
    console.error('pushCourseToSupabase catch error:', err);
    return { success: false, error: err?.message || 'Gagal menyimpan kursus ke Supabase' };
  }
}

/**
 * Helper to backup course custom pricing to settings table as dual-layer guarantee
 */
async function backupCourseCustomPricing(course: Course, config?: SupabaseConfig) {
  try {
    const existing = await fetchSettingFromSupabase<Record<string, { allowCustomPrice?: boolean; minCustomPrice?: number; suggestedCustomPrices?: number[] }>>('courses_custom_pricing', config);
    const map = existing.data || {};
    map[course.id] = {
      allowCustomPrice: Boolean(course.allowCustomPrice),
      minCustomPrice: Number(course.minCustomPrice || 0),
      suggestedCustomPrices: course.suggestedCustomPrices
    };
    await pushSettingToSupabase('courses_custom_pricing', map, config);
  } catch (e) {
    console.warn('Backup course custom pricing note:', e);
  }
}

/**
 * DELETE a course from Supabase
 */
export async function deleteCourseFromSupabase(
  courseId: string,
  config: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { error } = await client.from('courses').delete().eq('id', courseId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * FETCH all courses from Supabase
 */
export async function fetchCoursesFromSupabase(
  config: SupabaseConfig
): Promise<{ success: boolean; data?: Course[]; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    let courses = (data || []).map(rowToCourse);

    // Fallback merge with courses_custom_pricing from settings if any course was stored before table schema migration
    try {
      const customPricingRes = await fetchSettingFromSupabase<Record<string, { allowCustomPrice?: boolean; minCustomPrice?: number; suggestedCustomPrices?: number[] }>>('courses_custom_pricing', config);
      if (customPricingRes.success && customPricingRes.data) {
        const pricingMap = customPricingRes.data;
        courses = courses.map(c => {
          const customMeta = pricingMap[c.id];
          if (customMeta && (c.allowCustomPrice === undefined || c.allowCustomPrice === false)) {
            return {
              ...c,
              allowCustomPrice: customMeta.allowCustomPrice ?? c.allowCustomPrice,
              minCustomPrice: customMeta.minCustomPrice !== undefined ? customMeta.minCustomPrice : c.minCustomPrice,
              suggestedCustomPrices: customMeta.suggestedCustomPrices || c.suggestedCustomPrices
            };
          }
          return c;
        });
      }
    } catch {}

    return { success: true, data: courses };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * PUSH / UPSERT a category to Supabase
 */
export async function pushCategoryToSupabase(
  category: CategoryItem,
  config: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const row = categoryToRow(category);
    const { error } = await client.from('categories').upsert(row, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * DELETE a category from Supabase
 */
export async function deleteCategoryFromSupabase(
  categoryId: string,
  config: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { error } = await client.from('categories').delete().eq('id', categoryId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * User mapping functions
 */
function userToRow(u: User) {
  return {
    id: String(u.id),
    name: String(u.name || ''),
    email: String(u.email || '').toLowerCase().trim(),
    role: String(u.role || 'student'),
    avatar: String(u.avatar || ''),
    phone: String(u.phone || ''),
    enrolled_course_ids: Array.isArray(u.enrolledCourseIds) ? u.enrolledCourseIds : [],
    bio: String(u.bio || ''),
    institution: String(u.institution || ''),
    title: String(u.title || ''),
    signature_url: String(u.signatureUrl || ''),
    instructor_status: u.instructorStatus || null,
    instructor_certificate_url: u.instructorCertificateUrl || null,
    instructor_certificate_name: u.instructorCertificateName || null,
    instructor_specialization: u.instructorSpecialization || null,
    instructor_specializations: u.instructorSpecializations || null,
    instructor_certificates: u.instructorCertificates || null,
    instructor_rejection_reason: u.instructorRejectionReason || null,
    instructor_applied_at: u.instructorAppliedAt || null,
    instructor_verified_at: u.instructorVerifiedAt || null,
    balance: Number(u.balance || 0),
    bank_account: u.bankAccount || null,
    created_at: u.createdAt || new Date().toISOString()
  };
}

function rowToUser(row: any): User {
  let enrolledIds: string[] = [];
  if (Array.isArray(row.enrolled_course_ids)) {
    enrolledIds = row.enrolled_course_ids;
  } else if (typeof row.enrolled_course_ids === 'string') {
    try {
      enrolledIds = JSON.parse(row.enrolled_course_ids);
    } catch {
      enrolledIds = [];
    }
  }

  let bankAcc = row.bank_account || row.bankAccount;
  if (typeof bankAcc === 'string') {
    try {
      bankAcc = JSON.parse(bankAcc);
    } catch {
      bankAcc = undefined;
    }
  }

  let instSpecs = row.instructor_specializations || row.instructorSpecializations;
  if (typeof instSpecs === 'string') {
    try {
      instSpecs = JSON.parse(instSpecs);
    } catch {
      instSpecs = instSpecs.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  let instCerts = row.instructor_certificates || row.instructorCertificates;
  if (typeof instCerts === 'string') {
    try {
      instCerts = JSON.parse(instCerts);
    } catch {
      instCerts = undefined;
    }
  }

  return {
    id: String(row.id),
    name: row.name || '',
    email: row.email || '',
    role: (row.role as any) || 'student',
    avatar: row.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(row.name || row.email)}`,
    phone: row.phone || '',
    enrolledCourseIds: enrolledIds,
    bio: row.bio || '',
    institution: row.institution || '',
    title: row.title || undefined,
    signatureUrl: row.signature_url || row.signatureUrl || undefined,
    instructorStatus: row.instructor_status || row.instructorStatus || undefined,
    instructorCertificateUrl: row.instructor_certificate_url || row.instructorCertificateUrl || undefined,
    instructorCertificateName: row.instructor_certificate_name || row.instructorCertificateName || undefined,
    instructorCertificates: Array.isArray(instCerts) ? instCerts : undefined,
    instructorSpecialization: row.instructor_specialization || row.instructorSpecialization || undefined,
    instructorSpecializations: Array.isArray(instSpecs) ? instSpecs : undefined,
    instructorRejectionReason: row.instructor_rejection_reason || row.instructorRejectionReason || undefined,
    instructorAppliedAt: row.instructor_applied_at || row.instructorAppliedAt || undefined,
    instructorVerifiedAt: row.instructor_verified_at || row.instructorVerifiedAt || undefined,
    balance: Number(row.balance || 0),
    bankAccount: bankAcc || undefined,
    createdAt: row.created_at || new Date().toISOString()
  };
}

/**
 * PUSH / UPSERT a single user into Supabase
 */
export async function pushUserToSupabase(
  user: User,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const { projectUrl: url, anonKey: key } = resolveEffectiveSupabaseConfig(config);

  if (!url || !key) {
    return {
      success: false,
      error: 'Project URL atau Anon Public Key Supabase belum diisi. Setel di Environment Variable Vercel (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) atau di Admin Dashboard.'
    };
  }

  const client = getSupabaseClient({ ...config, projectUrl: url, anonKey: key });
  if (!client) {
    return { success: false, error: 'Gagal menginisialisasi koneksi Supabase Client.' };
  }

  try {
    const row = userToRow(user);
    let { error } = await client.from('users').upsert(row, { onConflict: 'id' });
    
    // If schema cache error occurs due to missing columns in older Supabase table (e.g. balance, bank_account, instructor_*)
    if (error && (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST204')) {
      console.warn('[Supabase users fallback] Retrying with sanitized base user fields:', error.message);
      const baseRow: Record<string, any> = {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        avatar: row.avatar,
        phone: row.phone,
        enrolled_course_ids: row.enrolled_course_ids,
        bio: row.bio,
        institution: row.institution,
        created_at: row.created_at
      };
      const retryResult = await client.from('users').upsert(baseRow, { onConflict: 'id' });
      if (!retryResult.error) {
        return { success: true };
      }
      error = retryResult.error;
    }

    if (error) {
      console.warn('Upsert user to Supabase error:', error);
      if (error.code === '42P01') {
        return {
          success: false,
          error: 'Tabel "users" belum dibuat di Supabase. Salin dan jalankan skrip SQL di Admin Dashboard -> Pengaturan Supabase.'
        };
      }
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        return {
          success: false,
          error: 'Akses ditolak oleh RLS Policy Supabase pada tabel "users". Pastikan policy diaktifkan.'
        };
      }
      // Fallback if conflict on email
      const { data: existing } = await client.from('users').select('id').eq('email', row.email).maybeSingle();
      if (existing) {
        const { error: updateErr } = await client.from('users').update(row).eq('id', existing.id);
        if (!updateErr) return { success: true };
        return { success: false, error: updateErr.message };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('pushUserToSupabase error:', err);
    return { success: false, error: err?.message || 'Gagal menyimpan data pengguna ke Supabase' };
  }
}

/**
 * FETCH all users from Supabase
 */
export async function fetchUsersFromSupabase(
  config: SupabaseConfig
): Promise<{ success: boolean; data?: User[]; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return { success: false, error: error.message };
    const users = (data || []).map(rowToUser);
    return { success: true, data: users };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * FETCH single user by email from Supabase
 */
export async function fetchUserByEmailFromSupabase(
  email: string,
  config?: SupabaseConfig
): Promise<{ success: boolean; data?: User; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await client
      .from('users')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    if (!data) return { success: true, data: undefined };
    return { success: true, data: rowToUser(data) };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * DELETE a user from Supabase
 */
export async function deleteUserFromSupabase(
  userId: string,
  config: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { error } = await client.from('users').delete().eq('id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Transaction helpers and Supabase functions
 */
function transactionToRow(t: Transaction) {
  return {
    id: String(t.id),
    transaction_code: String(t.transactionCode || t.id),
    student_id: String(t.studentId || ''),
    student_name: String(t.studentName || ''),
    student_email: String(t.studentEmail || '').toLowerCase().trim(),
    course_id: String(t.courseId || ''),
    course_title: String(t.courseTitle || ''),
    amount: Number(t.amount || 0),
    payment_method: String(t.paymentMethod || 'Manual Transfer'),
    status: String(t.status || 'pending'),
    payment_details: {
      ...(t.paymentDetails || {}),
      instructorId: t.instructorId || null,
      platformFee: t.platformFee !== undefined ? t.platformFee : null,
      instructorShare: t.instructorShare !== undefined ? t.instructorShare : null,
      manualBundledCourseIds: t.manualBundledCourseIds || [],
      isBundle: Boolean(t.isBundle),
      bundleId: t.bundleId || null,
      enrolledCourseIds: t.enrolledCourseIds || [],
      orderId: t.orderId || null,
      totalPayment: t.totalPayment !== undefined ? t.totalPayment : t.amount,
      buyerPhone: t.buyerPhone || null
    },
    created_at: t.createdAt || new Date().toISOString(),
    paid_at: t.paidAt || null
  };
}

function rowToTransaction(row: any): Transaction {
  const details = typeof row.payment_details === 'object' && row.payment_details !== null
    ? row.payment_details
    : {};

  let enrolledIds = details.enrolledCourseIds || [];
  if (!Array.isArray(enrolledIds)) enrolledIds = [];

  return {
    id: String(row.id),
    transactionCode: row.transaction_code || row.id,
    orderId: details.orderId || row.transaction_code,
    studentId: row.student_id || '',
    studentName: row.student_name || '',
    studentEmail: row.student_email || '',
    courseId: row.course_id || '',
    courseTitle: row.course_title || '',
    instructorId: details.instructorId || row.instructor_id || undefined,
    platformFee: details.platformFee !== null && details.platformFee !== undefined ? Number(details.platformFee) : (row.platform_fee ? Number(row.platform_fee) : undefined),
    instructorShare: details.instructorShare !== null && details.instructorShare !== undefined ? Number(details.instructorShare) : (row.instructor_share ? Number(row.instructor_share) : undefined),
    manualBundledCourseIds: details.manualBundledCourseIds || undefined,
    isBundle: Boolean(details.isBundle),
    bundleId: details.bundleId || undefined,
    enrolledCourseIds: enrolledIds.length > 0 ? enrolledIds : [row.course_id],
    amount: Number(row.amount || 0),
    totalPayment: details.totalPayment !== undefined ? Number(details.totalPayment) : Number(row.amount || 0),
    paymentMethod: row.payment_method || 'manual_transfer',
    status: (row.status as any) || 'pending',
    createdAt: row.created_at || new Date().toISOString(),
    paidAt: row.paid_at || undefined,
    buyerPhone: details.buyerPhone || undefined,
    paymentDetails: details
  };
}

/**
 * PUSH single transaction to Supabase
 */
export async function pushTransactionToSupabase(
  trx: Transaction,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const row = transactionToRow(trx);
    const { error } = await client.from('transactions').upsert(row, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan transaksi ke Supabase' };
  }
}

/**
 * FETCH all transactions from Supabase
 */
export async function fetchTransactionsFromSupabase(
  config?: SupabaseConfig
): Promise<{ success: boolean; data?: Transaction[]; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    const trxs = (data || []).map(rowToTransaction);
    return { success: true, data: trxs };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Certificate helpers and Supabase functions
 */
function certificateToRow(c: Certificate) {
  return {
    id: String(c.id),
    certificate_number: String(c.certificateNumber || c.id),
    student_id: String(c.studentId || ''),
    student_name: String(c.studentName || ''),
    course_id: String(c.courseId || ''),
    course_title: String(c.courseTitle || ''),
    instructor_name: String(c.instructorName || 'Lead Master Instructor'),
    issue_date: String(c.issueDate || new Date().toISOString().split('T')[0]),
    grade: String(c.grade || 'A+ (Istimewa)'),
    score: Number(c.score || 100),
    verification_hash: String(c.verificationHash || `CERT-${c.id}`),
    created_at: c.createdAt || new Date().toISOString()
  };
}

function rowToCertificate(row: any): Certificate {
  return {
    id: String(row.id),
    certificateNumber: row.certificate_number || row.id,
    studentId: row.student_id || '',
    studentName: row.student_name || '',
    courseId: row.course_id || '',
    courseTitle: row.course_title || '',
    instructorName: row.instructor_name || '',
    issueDate: row.issue_date || '',
    grade: row.grade || 'A+ (Istimewa)',
    score: Number(row.score || 100),
    verificationHash: row.verification_hash || `CERT-${row.id}`,
    createdAt: row.created_at || new Date().toISOString()
  };
}

/**
 * PUSH single certificate to Supabase
 */
export async function pushCertificateToSupabase(
  cert: Certificate,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const row = certificateToRow(cert);
    const { error } = await client.from('certificates').upsert(row, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan sertifikat ke Supabase' };
  }
}

/**
 * FETCH all certificates from Supabase
 */
export async function fetchCertificatesFromSupabase(
  config?: SupabaseConfig
): Promise<{ success: boolean; data?: Certificate[]; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    const certs = (data || []).map(rowToCertificate);
    return { success: true, data: certs };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Student Progress helpers and Supabase functions
 */
function progressToRow(p: StudentProgress) {
  return {
    id: `${p.studentId}_${p.courseId}`,
    course_id: String(p.courseId),
    student_id: String(p.studentId),
    completed_module_ids: Array.isArray(p.completedModuleIds) ? p.completedModuleIds : [],
    quiz_scores: p.quizScores || {},
    last_watched_module_id: p.lastWatchedModuleId || null,
    certificate_claimed: Boolean(p.certificateClaimed),
    enrolled_at: p.enrolledAt || new Date().toISOString(),
    last_active_at: p.lastActiveAt || new Date().toISOString(),
    notes: {
      ...(p.notes || {}),
      _videoWatchProgress: p.videoWatchProgress || {},
      _maxWatchedSeconds: p.maxWatchedSeconds || {}
    }
  };
}

function rowToProgress(row: any): StudentProgress {
  const notesObj = typeof row.notes === 'object' && row.notes !== null ? row.notes : {};
  const { _videoWatchProgress, _maxWatchedSeconds, ...cleanNotes } = notesObj;

  return {
    courseId: row.course_id || '',
    studentId: row.student_id || '',
    completedModuleIds: Array.isArray(row.completed_module_ids) ? row.completed_module_ids : [],
    quizScores: typeof row.quiz_scores === 'object' && row.quiz_scores !== null ? row.quiz_scores : {},
    videoWatchProgress: _videoWatchProgress || {},
    maxWatchedSeconds: _maxWatchedSeconds || {},
    lastWatchedModuleId: row.last_watched_module_id || undefined,
    certificateClaimed: Boolean(row.certificate_claimed),
    enrolledAt: row.enrolled_at || new Date().toISOString(),
    lastActiveAt: row.last_active_at || new Date().toISOString(),
    notes: cleanNotes
  };
}

/**
 * PUSH student progress record to Supabase
 */
export async function pushProgressToSupabase(
  progress: StudentProgress,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const row = progressToRow(progress);
    const { error } = await client.from('student_progress').upsert(row, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan progres ke Supabase' };
  }
}

/**
 * FETCH all student progress records from Supabase as a map
 */
export async function fetchProgressFromSupabase(
  config?: SupabaseConfig
): Promise<{ success: boolean; data?: Record<string, StudentProgress>; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('student_progress')
      .select('*');

    if (error) return { success: false, error: error.message };
    const map: Record<string, StudentProgress> = {};
    (data || []).forEach(row => {
      const p = rowToProgress(row);
      if (p.studentId && p.courseId) {
        map[`${p.studentId}_${p.courseId}`] = p;
      }
    });
    return { success: true, data: map };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * FETCH all categories from Supabase
 */
export async function fetchCategoriesFromSupabase(
  config: SupabaseConfig
): Promise<{ success: boolean; data?: CategoryItem[]; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('order_num', { ascending: true });

    if (error) return { success: false, error: error.message };
    const categories = (data || []).map(rowToCategory);
    return { success: true, data: categories };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * PUSH / UPSERT Generic Key-Value Settings to Supabase
 */
export async function pushSettingToSupabase(
  key: string,
  value: any,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Kredensial Supabase (URL & Key) belum diisi.' };

  try {
    const row = {
      key: String(key),
      value: typeof value === 'object' && value !== null ? value : { val: value },
      updated_at: new Date().toISOString()
    };

    const { error } = await client.from('settings').upsert(row, { onConflict: 'key' });
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          error: 'Tabel "settings" belum dibuat di Supabase. Jalankan skrip SQL di Admin Dashboard -> Pengaturan Supabase.'
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan pengaturan ke Supabase' };
  }
}

/**
 * FETCH Generic Key-Value Setting from Supabase
 */
export async function fetchSettingFromSupabase<T = any>(
  key: string,
  config?: SupabaseConfig
): Promise<{ success: boolean; data?: T; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    if (!data) return { success: true, data: undefined };
    return { success: true, data: data.value as T };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * PUSH Website Settings to Supabase (Logo, Branding, Contact, Social Links)
 */
export async function pushWebsiteSettingsToSupabase(
  settings: WebsiteSettings,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  return pushSettingToSupabase('website_settings', settings, config);
}

/**
 * PUSH Payment Gateway Settings to Supabase (Pakasir, QRIS, Bank Accounts)
 */
export async function pushPaymentSettingsToSupabase(
  settings: PaymentSettings,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  return pushSettingToSupabase('payment_settings', settings, config);
}

/**
 * PUSH Carousel Slides to Supabase
 */
export async function pushCarouselSlidesToSupabase(
  slides: CarouselSlide[],
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  return pushSettingToSupabase('carousel_slides', slides, config);
}

/**
 * PUSH Running Text Settings to Supabase
 */
export async function pushRunningTextToSupabase(
  runningText: WebsiteSettings['runningText'],
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  return pushSettingToSupabase('running_text', runningText, config);
}

/**
 * PUSH Certificate Design Settings to Supabase (Dual storage: public.certificate_design table + public.settings backup)
 */
export async function pushCertificateDesignToSupabase(
  design: CertificateDesignSettings,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Kredensial Supabase (URL & Key) belum diisi.' };

  try {
    // 1. Try dedicated table 'certificate_design'
    const row = {
      id: 'default',
      template_style: design.templateStyle || 'royal_gold',
      institution_name: design.institutionName || 'LESIN AJA',
      institution_tagline: design.institutionTagline || '',
      certificate_title: design.certificateTitle || 'SERTIFIKAT KELULUSAN & KOMPETENSI',
      certificate_subtitle: design.certificateSubtitle || 'CERTIFICATE OF COMPLETION & PROFESSIONAL MASTERY',
      citation_text: design.citationText || '',
      lead_instructor_name: design.leadInstructorName || '',
      lead_instructor_title: design.leadInstructorTitle || 'LEAD MASTER INSTRUCTOR',
      issue_city: design.issueCity || 'Jakarta',
      instructor_title_font_size: Number(design.instructorTitleFontSize || 11),
      instructor_name_font_size: Number(design.instructorNameFontSize || 13),
      primary_color: design.primaryColor || '#b45309',
      secondary_color: design.secondaryColor || '#0f172a',
      accent_color: design.accentColor || '#f59e0b',
      settings: design,
      updated_at: new Date().toISOString()
    };

    const { error: tableError } = await client
      .from('certificate_design')
      .upsert(row, { onConflict: 'id' });

    if (!tableError) {
      // Also save to settings table as dual-layer backup
      await pushSettingToSupabase('certificate_design', design, config);
      return { success: true };
    }

    console.warn('certificate_design table upsert warning, saving to settings table backup...', tableError);

    // 2. Fallback to settings table key-value store
    return await pushSettingToSupabase('certificate_design', design, config);
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan desain sertifikat ke Supabase' };
  }
}

/**
 * FETCH Certificate Design Settings from Supabase
 */
export async function fetchCertificateDesignFromSupabase(
  config?: SupabaseConfig
): Promise<{ success: boolean; data?: CertificateDesignSettings; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    // 1. Try dedicated table 'certificate_design'
    const { data, error } = await client
      .from('certificate_design')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (!error && data) {
      if (data.settings && typeof data.settings === 'object') {
        return {
          success: true,
          data: {
            ...data.settings,
            issueCity: data.issue_city || data.settings.issueCity || 'Jakarta',
            leadInstructorTitle: data.lead_instructor_title || data.settings.leadInstructorTitle || 'LEAD MASTER INSTRUCTOR',
            instructorTitleFontSize: data.instructor_title_font_size || data.settings.instructorTitleFontSize || 11,
            instructorNameFontSize: data.instructor_name_font_size || data.settings.instructorNameFontSize || 13
          }
        };
      }
    }

    // 2. Fallback: Check settings table
    const settingRes = await fetchSettingFromSupabase<CertificateDesignSettings>('certificate_design', config);
    if (settingRes.success && settingRes.data) {
      return { success: true, data: settingRes.data };
    }

    // 3. Fallback: Check inside website_settings
    const webSettingRes = await fetchSettingFromSupabase<WebsiteSettings>('website_settings', config);
    if (webSettingRes.success && webSettingRes.data?.certificateDesign) {
      return { success: true, data: webSettingRes.data.certificateDesign };
    }

    return { success: true, data: undefined };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * PUSH Course Bundles to Supabase (Dual storage: public.course_bundles table + public.settings backup)
 */
export async function pushBundlesToSupabase(
  bundles: CourseBundle[],
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Kredensial Supabase (URL & Key) belum diisi.' };

  try {
    // 1. Try upserting to dedicated table 'course_bundles'
    const rows = bundles.map(b => ({
      id: String(b.id),
      title: String(b.title || ''),
      slug: b.slug || `bundle-${b.id}`,
      description: String(b.description || ''),
      bundle_type: String(b.bundleType || 'all_courses'),
      target_category: b.targetCategory ? String(b.targetCategory) : null,
      course_ids: Array.isArray(b.courseIds) ? b.courseIds : [],
      price: Number(b.price || 0),
      original_price: Number(b.originalPrice || 0),
      thumbnail: b.thumbnail || '',
      badge: b.badge || '',
      show_in_checkout: b.showInCheckout ?? true,
      is_active: b.isActive ?? true,
      created_at: b.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    if (rows.length > 0) {
      const { error: tableError } = await client.from('course_bundles').upsert(rows, { onConflict: 'id' });
      if (!tableError) {
        // Also update settings table as dual-layer backup
        await pushSettingToSupabase('course_bundles', bundles, config);
        return { success: true };
      }
      console.warn('course_bundles table upsert warning, saving to settings table...', tableError);
    }

    // Fallback to settings table key-value store
    return await pushSettingToSupabase('course_bundles', bundles, config);
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan paket bundling ke Supabase' };
  }
}

/**
 * FETCH Course Bundles from Supabase
 */
export async function fetchBundlesFromSupabase(
  config?: SupabaseConfig
): Promise<{ success: boolean; data?: CourseBundle[]; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    // 1. Check dedicated table 'course_bundles'
    const { data, error } = await client
      .from('course_bundles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const bundles: CourseBundle[] = data.map(r => ({
        id: String(r.id),
        title: r.title || '',
        slug: r.slug || undefined,
        description: r.description || '',
        bundleType: (r.bundle_type as any) || 'all_courses',
        targetCategory: r.target_category || undefined,
        courseIds: Array.isArray(r.course_ids) ? r.course_ids : [],
        price: Number(r.price || 0),
        originalPrice: Number(r.original_price || 0),
        thumbnail: r.thumbnail || '',
        badge: r.badge || '',
        showInCheckout: r.show_in_checkout ?? true,
        isActive: r.is_active ?? true,
        createdAt: r.created_at || new Date().toISOString(),
        updatedAt: r.updated_at || new Date().toISOString()
      }));
      return { success: true, data: bundles };
    }

    // 2. Fallback: Check settings table
    const settingRes = await fetchSettingFromSupabase<CourseBundle[]>('course_bundles', config);
    if (settingRes.success && settingRes.data && Array.isArray(settingRes.data)) {
      return { success: true, data: settingRes.data };
    }

    return { success: true, data: [] };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * DELETE Single Bundle from Supabase
 */
export async function deleteBundleFromSupabase(
  bundleId: string,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    await client.from('course_bundles').delete().eq('id', bundleId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * PUSH Live Sessions to Supabase
 */
export async function pushLiveSessionsToSupabase(
  sessions: LiveSession[],
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Kredensial Supabase (URL & Key) belum diisi.' };

  try {
    // 1. Try dedicated table 'live_sessions'
    const rows = sessions.map(s => ({
      id: String(s.id),
      title: String(s.title || ''),
      course_id: String(s.courseId || ''),
      course_title: String(s.courseTitle || ''),
      instructor_name: String(s.instructorName || ''),
      instructor_avatar: String(s.instructorAvatar || ''),
      date: String(s.date || ''),
      time: String(s.time || ''),
      duration_minutes: Number(s.durationMinutes || 90),
      meet_url: String(s.meetUrl || ''),
      platform: String(s.platform || 'Google Meet'),
      description: String(s.description || ''),
      max_attendees: Number(s.maxAttendees || 150),
      registered_student_ids: Array.isArray(s.registeredStudentIds) ? s.registeredStudentIds : [],
      is_live_now: Boolean(s.isLiveNow),
      is_completed: Boolean(s.isCompleted),
      created_at: new Date().toISOString()
    }));

    if (rows.length > 0) {
      const { error: tableError } = await client.from('live_sessions').upsert(rows, { onConflict: 'id' });
      if (!tableError) {
        // Also keep backup in settings table
        await pushSettingToSupabase('live_sessions', sessions, config);
        return { success: true };
      }
      console.warn('live_sessions table upsert warning, saving to settings table...', tableError);
    }

    // Fallback to settings table
    return await pushSettingToSupabase('live_sessions', sessions, config);
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan sesi live ke Supabase' };
  }
}

/**
 * FETCH Live Sessions from Supabase
 */
export async function fetchLiveSessionsFromSupabase(
  config?: SupabaseConfig
): Promise<{ success: boolean; data?: LiveSession[]; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('live_sessions')
      .select('*')
      .order('date', { ascending: true });

    if (!error && data && data.length > 0) {
      const sessions: LiveSession[] = data.map(r => ({
        id: String(r.id),
        title: r.title || '',
        courseId: r.course_id || '',
        courseTitle: r.course_title || '',
        instructorName: r.instructor_name || '',
        instructorAvatar: r.instructor_avatar || '',
        date: r.date || '',
        time: r.time || '',
        durationMinutes: Number(r.duration_minutes || 90),
        meetUrl: r.meet_url || '',
        platform: r.platform || 'Google Meet',
        description: r.description || '',
        maxAttendees: Number(r.max_attendees || 150),
        registeredStudentIds: Array.isArray(r.registered_student_ids) ? r.registered_student_ids : [],
        isLiveNow: Boolean(r.is_live_now),
        isCompleted: Boolean(r.is_completed)
      }));
      return { success: true, data: sessions };
    }

    // Fallback: Check settings table
    const settingRes = await fetchSettingFromSupabase<LiveSession[]>('live_sessions', config);
    if (settingRes.success && settingRes.data) {
      return { success: true, data: settingRes.data };
    }

    return { success: true, data: [] };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * PUSH Custom CMS Pages to Supabase
 */
export async function pushCustomPagesToSupabase(
  pages: CustomPage[],
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Kredensial Supabase (URL & Key) belum diisi.' };

  try {
    const rows = pages.map(p => ({
      id: String(p.id),
      title: String(p.title || ''),
      slug: String(p.slug || ''),
      content: String(p.content || ''),
      is_published: p.isPublished ?? true,
      updated_at: new Date().toISOString()
    }));

    if (rows.length > 0) {
      const { error: tableError } = await client.from('custom_pages').upsert(rows, { onConflict: 'id' });
      if (!tableError) {
        await pushSettingToSupabase('custom_pages', pages, config);
        return { success: true };
      }
      console.warn('custom_pages table upsert warning, saving to settings table...', tableError);
    }

    return await pushSettingToSupabase('custom_pages', pages, config);
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan halaman CMS ke Supabase' };
  }
}

/**
 * FETCH Custom CMS Pages from Supabase
 */
export async function fetchCustomPagesFromSupabase(
  config?: SupabaseConfig
): Promise<{ success: boolean; data?: CustomPage[]; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('custom_pages')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const pages: CustomPage[] = data.map(r => ({
        id: String(r.id),
        title: r.title || '',
        slug: r.slug || '',
        content: r.content || '',
        isPublished: r.is_published ?? true,
        updatedAt: r.updated_at || new Date().toISOString()
      }));
      return { success: true, data: pages };
    }

    // Fallback: Check settings table
    const settingRes = await fetchSettingFromSupabase<CustomPage[]>('custom_pages', config);
    if (settingRes.success && settingRes.data) {
      return { success: true, data: settingRes.data };
    }

    return { success: true, data: [] };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * PUSH All Categories to Supabase
 */
export async function pushAllCategoriesToSupabase(
  categories: CategoryItem[],
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Kredensial Supabase (URL & Key) belum diisi.' };

  try {
    const rows = categories.map(categoryToRow);
    const { error } = await client.from('categories').upsert(rows, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan kategori ke Supabase' };
  }
}

/**
 * PUSH All Users to Supabase
 */
export async function pushAllUsersToSupabase(
  users: User[],
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Kredensial Supabase (URL & Key) belum diisi.' };

  try {
    const rowsctl = users.map(userToRow);
    let { error } = await client.from('users').upsert(rowsctl, { onConflict: 'id' });
    
    if (error && (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST204')) {
      console.warn('[Supabase pushAllUsers fallback] Retrying with sanitized base user fields:', error.message);
      const baseRows = rowsctl.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        avatar: row.avatar,
        phone: row.phone,
        enrolled_course_ids: row.enrolled_course_ids,
        bio: row.bio,
        institution: row.institution,
        created_at: row.created_at
      }));
      const retryResult = await client.from('users').upsert(baseRows, { onConflict: 'id' });
      if (!retryResult.error) {
        return { success: true };
      }
      error = retryResult.error;
    }

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan pengguna ke Supabase' };
  }
}

/**
 * Instructor Application mapping functions
 */
function instructorApplicationToRow(app: InstructorApplication) {
  return {
    id: String(app.id),
    user_id: String(app.userId),
    name: String(app.name || ''),
    email: String(app.email || '').toLowerCase().trim(),
    phone: String(app.phone || ''),
    title: String(app.title || ''),
    institution: String(app.institution || ''),
    specialization: String(app.specialization || ''),
    specializations: app.specializations || null,
    bio: String(app.bio || ''),
    certificate_url: String(app.certificateUrl || ''),
    certificate_name: String(app.certificateName || ''),
    certificates: app.certificates || null,
    id_card_url: String(app.idCardUrl || ''),
    signature_url: String(app.signatureUrl || ''),
    bank_account: app.bankAccount || null,
    status: String(app.status || 'pending'),
    rejection_reason: app.rejectionReason || null,
    applied_at: app.appliedAt || new Date().toISOString(),
    reviewed_at: app.reviewedAt || null,
    reviewed_by: app.reviewedBy || null
  };
}

function rowToInstructorApplication(row: any): InstructorApplication {
  let bankAcc = row.bank_account || row.bankAccount;
  if (typeof bankAcc === 'string') {
    try {
      bankAcc = JSON.parse(bankAcc);
    } catch {
      bankAcc = undefined;
    }
  }

  let specs = row.specializations;
  if (typeof specs === 'string') {
    try {
      specs = JSON.parse(specs);
    } catch {
      specs = specs.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  let certs = row.certificates;
  if (typeof certs === 'string') {
    try {
      certs = JSON.parse(certs);
    } catch {
      certs = undefined;
    }
  }

  return {
    id: String(row.id),
    userId: String(row.user_id || row.userId),
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    title: row.title || '',
    institution: row.institution || '',
    specialization: row.specialization || '',
    specializations: Array.isArray(specs) ? specs : undefined,
    bio: row.bio || '',
    certificateUrl: row.certificate_url || row.certificateUrl || '',
    certificateName: row.certificate_name || row.certificateName || '',
    certificates: Array.isArray(certs) ? certs : undefined,
    idCardUrl: row.id_card_url || row.idCardUrl || undefined,
    signatureUrl: row.signature_url || row.signatureUrl || undefined,
    bankAccount: bankAcc || undefined,
    status: (row.status || 'pending') as InstructorApplicationStatus,
    rejectionReason: row.rejection_reason || row.rejectionReason || undefined,
    appliedAt: row.applied_at || row.appliedAt || new Date().toISOString(),
    reviewedAt: row.reviewed_at || row.reviewedAt || undefined,
    reviewedBy: row.reviewed_by || row.reviewedBy || undefined
  };
}

/**
 * PUSH single Instructor Application to Supabase
 */
export async function pushInstructorApplicationToSupabase(
  app: InstructorApplication,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const { projectUrl: url, anonKey: key } = resolveEffectiveSupabaseConfig(config);
  if (!url || !key) return { success: false, error: 'Kredensial Supabase belum diisi.' };

  const client = getSupabaseClient({ ...config, projectUrl: url, anonKey: key });
  if (!client) return { success: false, error: 'Gagal inisialisasi Supabase Client.' };

  try {
    const row = instructorApplicationToRow(app);
    let { error } = await client.from('instructor_applications').upsert(row, { onConflict: 'id' });

    // If column missing in older table schema (e.g. specializations, certificates, bank_account)
    if (error && (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST204')) {
      const sanitizedRow = {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        title: row.title,
        institution: row.institution,
        specialization: row.specialization,
        bio: row.bio,
        certificate_url: row.certificate_url,
        certificate_name: row.certificate_name,
        id_card_url: row.id_card_url,
        signature_url: row.signature_url,
        status: row.status,
        applied_at: row.applied_at
      };
      const retryResult = await client.from('instructor_applications').upsert(sanitizedRow, { onConflict: 'id' });
      if (!retryResult.error) {
        error = null;
      }
    }

    // Dual-Layer Backup: Always update settings table 'instructor_applications_list' and `instructor_app_${app.id}`
    try {
      const existingListRes = await fetchSettingFromSupabase<InstructorApplication[]>('instructor_applications_list', config);
      const existingList = Array.isArray(existingListRes.data) ? existingListRes.data : [];
      const updatedList = [
        app,
        ...existingList.filter(a => a.id !== app.id && a.email.toLowerCase() !== app.email.toLowerCase())
      ];
      await pushSettingToSupabase('instructor_applications_list', updatedList, config);
      await pushSettingToSupabase(`instructor_app_${app.id}`, app, config);
    } catch {}

    if (error) {
      console.warn('[pushInstructorApplicationToSupabase error, saved to settings fallback]:', error.message);
      return { success: true };
    }
    return { success: true };
  } catch (err: any) {
    // Fallback: save to settings
    try {
      await pushSettingToSupabase(`instructor_app_${app.id}`, app, config);
      return { success: true };
    } catch {}
    return { success: false, error: err?.message || 'Gagal menyimpan aplikasi instruktur ke Supabase' };
  }
}

/**
 * FETCH All Instructor Applications from Supabase with Triple-Layer Reconciliation
 */
export async function fetchInstructorApplicationsFromSupabase(
  config?: SupabaseConfig
): Promise<{ success: boolean; data?: InstructorApplication[]; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  const appMap = new Map<string, InstructorApplication>();

  // 1. Fetch from settings backup first
  try {
    const settingRes = await fetchSettingFromSupabase<InstructorApplication[]>('instructor_applications_list', config);
    if (settingRes.success && Array.isArray(settingRes.data)) {
      settingRes.data.forEach(a => {
        if (a && a.email) {
          appMap.set(a.email.toLowerCase().trim(), a);
        }
      });
    }
  } catch {}

  // 2. Fetch from dedicated table 'instructor_applications'
  try {
    const { data, error } = await client
      .from('instructor_applications')
      .select('*')
      .order('applied_at', { ascending: false });

    if (!error && data && Array.isArray(data)) {
      data.map(rowToInstructorApplication).forEach(a => {
        if (a && a.email) {
          appMap.set(a.email.toLowerCase().trim(), a);
        }
      });
    }
  } catch (err: any) {
    console.warn('[fetchInstructorApplications dedicated table note]:', err?.message);
  }

  // 3. Reconcile from 'users' table (any user with instructor data or status)
  try {
    const { data: usersData } = await client.from('users').select('*');
    if (usersData && Array.isArray(usersData)) {
      usersData.forEach(uRow => {
        const u = rowToUser(uRow);
        const email = u.email.toLowerCase().trim();
        const hasInstData = Boolean(
          u.instructorStatus ||
          u.instructorCertificateUrl ||
          (u.instructorCertificates && u.instructorCertificates.length > 0) ||
          u.role === 'instructor'
        );
        if (hasInstData && (!appMap.has(email) || !appMap.get(email)?.certificateUrl)) {
          const specsList = u.instructorSpecializations && u.instructorSpecializations.length > 0
            ? u.instructorSpecializations
            : (u.instructorSpecialization ? [u.instructorSpecialization] : ['Umum']);
          
          const primaryCertUrl = u.instructorCertificates?.[0]?.certificateUrl || u.instructorCertificateUrl || '';
          const primaryCertName = u.instructorCertificates?.[0]?.certificateName || u.instructorCertificateName || 'Sertifikat Keahlian';

          appMap.set(email, {
            id: `app-user-${u.id}`,
            userId: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            title: u.title || (u.role === 'instructor' ? 'Instruktur Resmi' : 'Calon Instruktur'),
            institution: u.institution || 'Umum',
            specialization: u.instructorSpecialization || specsList.join(', '),
            specializations: specsList,
            bio: u.bio || '',
            certificateUrl: primaryCertUrl,
            certificateName: primaryCertName,
            certificates: u.instructorCertificates,
            idCardUrl: undefined,
            signatureUrl: u.signatureUrl,
            bankAccount: u.bankAccount,
            status: (u.instructorStatus || (u.role === 'instructor' ? 'approved' : 'pending')) as InstructorApplicationStatus,
            rejectionReason: u.instructorRejectionReason,
            appliedAt: u.instructorAppliedAt || u.createdAt || new Date().toISOString(),
            reviewedAt: u.instructorVerifiedAt,
            reviewedBy: u.instructorVerifiedAt ? 'Admin' : undefined
          });
        }
      });
    }
  } catch {}

  const merged = Array.from(appMap.values()).sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  );

  return { success: true, data: merged };
}

/**
 * DELETE Instructor Application from Supabase
 */
export async function deleteInstructorApplicationFromSupabase(
  appId: string,
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi' };

  try {
    const { error } = await client.from('instructor_applications').delete().eq('id', appId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * PUSH All Instructor Applications to Supabase
 */
export async function pushAllInstructorApplicationsToSupabase(
  apps: InstructorApplication[],
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Kredensial Supabase belum diisi.' };

  try {
    const rows = apps.map(instructorApplicationToRow);
    if (rows.length > 0) {
      const { error } = await client.from('instructor_applications').upsert(rows, { onConflict: 'id' });
      if (!error) {
        await pushSettingToSupabase('instructor_applications_list', apps, config);
        return { success: true };
      }
    }
    await pushSettingToSupabase('instructor_applications_list', apps, config);
    return { success: true };
  } catch (err: any) {
    try {
      await pushSettingToSupabase('instructor_applications_list', apps, config);
      return { success: true };
    } catch {}
    return { success: false, error: err?.message || 'Gagal menyimpan pengajuan instruktur ke Supabase' };
  }
}

/**
 * PUSH All Courses to Supabase
 */
export async function pushAllCoursesToSupabase(
  courses: Course[],
  config?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { success: false, error: 'Kredensial Supabase (URL & Key) belum diisi.' };

  try {
    const rows = courses.map(courseToRow);
    let { error } = await client.from('courses').upsert(rows, { onConflict: 'id' });

    if (error && (error.message?.includes('instructor') || error.message?.includes('schema cache'))) {
      const legacyRows = courses.map(courseToLegacyRow);
      const { error: legErr } = await client.from('courses').upsert(legacyRows, { onConflict: 'id' });
      if (!legErr) return { success: true };
      const minRows = courses.map(courseToMinimalRow);
      const { error: minErr } = await client.from('courses').upsert(minRows, { onConflict: 'id' });
      if (!minErr) return { success: true };
      error = legErr || minErr;
    }

    if (error) {
      let saved = 0;
      let lastErr = error.message;
      for (const c of courses) {
        const res = await pushCourseToSupabase(c, config);
        if (res.success) saved++;
        else lastErr = res.error || lastErr;
      }
      if (saved > 0) return { success: true };
      return { success: false, error: lastErr };
    }

    // Also sync full custom pricing map to settings table
    const pricingMap: Record<string, any> = {};
    courses.forEach(c => {
      pricingMap[c.id] = {
        allowCustomPrice: Boolean(c.allowCustomPrice),
        minCustomPrice: Number(c.minCustomPrice || 0),
        suggestedCustomPrices: c.suggestedCustomPrices
      };
    });
    pushSettingToSupabase('courses_custom_pricing', pricingMap, config).catch(() => {});

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menyimpan kursus ke Supabase' };
  }
}

/**
 * SYNC ALL (Courses, Categories, Users, Transactions, Settings, Live Sessions, Pages, Bundles) to Supabase
 */
export async function syncAllToSupabase(
  data: {
    courses: Course[];
    categories: CategoryItem[];
    users?: User[];
    transactions?: Transaction[];
    certificates?: Certificate[];
    progressMap?: Record<string, StudentProgress>;
    websiteSettings?: WebsiteSettings;
    paymentSettings?: PaymentSettings;
    liveSessions?: LiveSession[];
    customPages?: CustomPage[];
    courseBundles?: CourseBundle[];
  },
  config: SupabaseConfig
): Promise<{ success: boolean; message: string; details?: any }> {
  const client = getSupabaseClient(config);
  if (!client) {
    return { success: false, message: 'Kredensial Supabase (URL & Key) belum diisi.' };
  }

  const results: Record<string, string> = {};

  try {
    // 1. Sync Categories
    if (data.categories && data.categories.length > 0) {
      const rows = data.categories.map(categoryToRow);
      const { error } = await client.from('categories').upsert(rows, { onConflict: 'id' });
      results.categories = error ? `Gagal: ${error.message}` : `Sukses (${rows.length} kategori)`;
    }

    // 2. Sync Courses
    if (data.courses && data.courses.length > 0) {
      const rows = data.courses.map(courseToRow);
      let { error } = await client.from('courses').upsert(rows, { onConflict: 'id' });

      // Fallback 1: If instructor column is missing in schema cache
      if (error && (error.message?.includes('instructor') || error.message?.includes('schema cache'))) {
        console.warn('Retrying bulk courses sync with legacy instructor format...');
        const legacyRows = data.courses.map(courseToLegacyRow);
        const { error: legErr } = await client.from('courses').upsert(legacyRows, { onConflict: 'id' });
        if (!legErr) {
          error = null;
        } else {
          // Fallback 2: minimal rows without instructor
          const minRows = data.courses.map(courseToMinimalRow);
          const { error: minErr } = await client.from('courses').upsert(minRows, { onConflict: 'id' });
          if (!minErr) {
            error = null;
          } else {
            error = legErr || minErr;
          }
        }
      }

      // If bulk still failed, try individual upserts so partial success is preserved
      if (error) {
        console.warn('Bulk courses upsert failed, attempting individual item sync...');
        let savedCount = 0;
        let lastErr = error.message;
        for (const c of data.courses) {
          const res = await pushCourseToSupabase(c, config);
          if (res.success) savedCount++;
          else lastErr = res.error || lastErr;
        }
        if (savedCount > 0) {
          results.courses = savedCount === data.courses.length
            ? `Sukses (${savedCount} kursus via fallback)`
            : `Sukses sebagian (${savedCount}/${data.courses.length} kursus). Error: ${lastErr}`;
        } else {
          results.courses = `Gagal: ${error.message}`;
        }
      } else {
        results.courses = `Sukses (${rows.length} kursus)`;
      }
    } else {
      results.courses = '0 kursus untuk dikirim';
    }

    // 3. Sync Users
    if (data.users && data.users.length > 0) {
      const userRows = data.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar || '',
        phone: u.phone || '',
        enrolled_course_ids: u.enrolledCourseIds || [],
        bio: u.bio || '',
        institution: u.institution || '',
        created_at: u.createdAt || new Date().toISOString()
      }));
      const { error } = await client.from('users').upsert(userRows, { onConflict: 'id' });
      results.users = error ? `Gagal: ${error.message}` : `Sukses (${userRows.length} user)`;
    }

    // 4. Sync Transactions
    if (data.transactions && data.transactions.length > 0) {
      const trxRows = data.transactions.map(transactionToRow);
      const { error } = await client.from('transactions').upsert(trxRows, { onConflict: 'id' });
      results.transactions = error ? `Gagal: ${error.message}` : `Sukses (${trxRows.length} transaksi)`;
    }

    // 5. Sync Certificates
    if (data.certificates && data.certificates.length > 0) {
      const certRows = data.certificates.map(certificateToRow);
      const { error } = await client.from('certificates').upsert(certRows, { onConflict: 'id' });
      results.certificates = error ? `Gagal: ${error.message}` : `Sukses (${certRows.length} sertifikat)`;
    }

    // 6. Sync Student Progress
    if (data.progressMap && Object.keys(data.progressMap).length > 0) {
      const progRows = Object.values(data.progressMap).map(progressToRow);
      const { error } = await client.from('student_progress').upsert(progRows, { onConflict: 'id' });
      results.student_progress = error ? `Gagal: ${error.message}` : `Sukses (${progRows.length} progres)`;
    }

    // 7. Sync Settings (Website & Payment)
    if (data.websiteSettings) {
      const wRes = await pushWebsiteSettingsToSupabase(data.websiteSettings, config);
      results.websiteSettings = wRes.success ? 'Sukses' : `Gagal: ${wRes.error}`;
    }
    if (data.paymentSettings) {
      const pRes = await pushPaymentSettingsToSupabase(data.paymentSettings, config);
      results.paymentSettings = pRes.success ? 'Sukses' : `Gagal: ${pRes.error}`;
    }

    // 8. Sync Live Sessions, Custom Pages & Bundles
    if (data.liveSessions && data.liveSessions.length > 0) {
      const lRes = await pushLiveSessionsToSupabase(data.liveSessions, config);
      results.liveSessions = lRes.success ? `Sukses (${data.liveSessions.length} sesi)` : `Gagal: ${lRes.error}`;
    }
    if (data.customPages && data.customPages.length > 0) {
      const pageRes = await pushCustomPagesToSupabase(data.customPages, config);
      results.customPages = pageRes.success ? `Sukses (${data.customPages.length} halaman)` : `Gagal: ${pageRes.error}`;
    }
    if (data.courseBundles && data.courseBundles.length > 0) {
      const bRes = await pushBundlesToSupabase(data.courseBundles, config);
      results.courseBundles = bRes.success ? `Sukses (${data.courseBundles.length} paket)` : `Gagal: ${bRes.error}`;
    }

    const hasError = Object.values(results).some(r => r.startsWith('Gagal'));

    return {
      success: !hasError,
      message: hasError
        ? `Sinkronisasi sebagian selesai dengan catatan: ${JSON.stringify(results)}`
        : `Sinkronisasi Supabase Berhasil! Seluruh data kursus, kategori, pengguna, transaksi, sertifikat, progres belajar, paket bundling, dan pengaturan telah tersimpan aman di cloud.`,
      details: results
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Terjadi kendala saat sinkronisasi: ${err?.message || err}`
    };
  }
}

/**
 * Upload file langsung ke Supabase Storage (Video, Thumbnail, Avatar, Materi)
 * Menggunakan bucket 'lesin-media' (atau custom) dengan URL publik CDN.
 */
export async function uploadFileToSupabaseStorage(
  file: File,
  folder: 'videos' | 'thumbnails' | 'avatars' | 'resources' | 'media' | 'certificates' | 'id_cards',
  customConfig?: { projectUrl: string; anonKey: string }
): Promise<{ success: boolean; publicUrl?: string; error?: string; fileName?: string; sizeFormatted?: string }> {
  // 1. Try Supabase Storage first if config is provided or saved
  let config = customConfig;
  if (!config || !config.projectUrl || !config.anonKey) {
    try {
      const saved = localStorage.getItem('lesinaja_supabase_v2');
      if (saved) {
        config = JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }

  const envConfig = getEnvSupabaseConfig();
  const effectiveUrl = config?.projectUrl || envConfig.projectUrl;
  const effectiveKey = config?.anonKey || envConfig.anonKey;

  if (effectiveUrl && effectiveKey) {
    const client = getSupabaseClient({ projectUrl: effectiveUrl, anonKey: effectiveKey });
    if (client) {
      const bucket = 'lesin-media';
      const cleanFileName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/^-+|-+$/g, '') || `file-${Date.now()}`;
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const filePath = `${folder}/${timestamp}_${randomSuffix}_${cleanFileName}`;

      try {
        const { error: uploadError } = await client.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || undefined
          });

        if (!uploadError) {
          const { data: publicData } = client.storage.from(bucket).getPublicUrl(filePath);
          if (publicData?.publicUrl) {
            return {
              success: true,
              publicUrl: publicData.publicUrl,
              fileName: file.name
            };
          }
        } else {
          console.warn('Supabase storage upload failed, trying server API fallback...', uploadError.message);
        }
      } catch (err: any) {
        console.warn('Supabase storage error, switching to server upload fallback:', err?.message);
      }
    }
  }

  // 2. Server API Upload Fallback (/api/upload -> /uploads/...)
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileData: base64,
        folder
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.publicUrl) {
        return {
          success: true,
          publicUrl: data.publicUrl,
          fileName: data.fileName || file.name
        };
      }
    }
  } catch (err: any) {
    console.warn('Server upload fallback failed:', err?.message);
  }

  // 3. Last resort: Return dataUrl
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return {
      success: true,
      publicUrl: dataUrl,
      fileName: file.name
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal memproses file unggahan.'
    };
  }
}

export const SUPABASE_SQL_STORAGE_SETUP = `-- =========================================================
-- SETUP STORAGE BUCKET: 'lesin-media' (Video, Thumbnail, Avatar)
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================

-- 1. Buat bucket 'lesin-media' dengan akses publik
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesin-media',
  'lesin-media',
  true,
  524288000, -- Limit 500 MB per file video/materi
  NULL
)
ON CONFLICT (id) DO UPDATE 
SET public = true, file_size_limit = 524288000;

-- 2. Kebijakan RLS Storage agar publik bisa membaca (SELECT/GET)
DROP POLICY IF EXISTS "Public View lesin-media" ON storage.objects;
CREATE POLICY "Public View lesin-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesin-media');

-- 3. Kebijakan RLS Storage agar Admin/Aplikasi bisa mengunggah & mengupdate file
DROP POLICY IF EXISTS "Public Upload lesin-media" ON storage.objects;
CREATE POLICY "Public Upload lesin-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lesin-media');

DROP POLICY IF EXISTS "Public Update lesin-media" ON storage.objects;
CREATE POLICY "Public Update lesin-media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lesin-media')
WITH CHECK (bucket_id = 'lesin-media');

DROP POLICY IF EXISTS "Public Delete lesin-media" ON storage.objects;
CREATE POLICY "Public Delete lesin-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'lesin-media');
`;

export const SUPABASE_SQL_SCHEMA_FULL = `-- =========================================================
-- SKEMA LENGKAP SUPABASE POSTGRESQL UNTUK LMS LESIN AJA
-- Termasuk Tabel Kategori, Kursus, User, Transaksi, Progres & Sertifikat
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run (Ctrl+Enter)
-- =========================================================

-- 1. Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabel Kategori Kursus (Categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Tag',
  color TEXT DEFAULT 'blue',
  order_num INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Categories Access" ON public.categories;
CREATE POLICY "Public Categories Access" ON public.categories FOR ALL USING (true) WITH CHECK (true);


-- 3. Tabel Kursus (Courses)
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  level TEXT DEFAULT 'Semua Level',
  instructor JSONB NOT NULL DEFAULT '{}'::jsonb,
  thumbnail TEXT,
  price NUMERIC DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  allow_custom_price BOOLEAN DEFAULT false,
  min_custom_price NUMERIC DEFAULT 0,
  suggested_custom_prices JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC DEFAULT 5.0,
  students_count INTEGER DEFAULT 0,
  modules JSONB DEFAULT '[]'::jsonb,
  certificate_available BOOLEAN DEFAULT true,
  tags JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'approved',
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pastikan kolom-kolom tabel courses selalu lengkap jika sebelumnya dibuat dengan versi lama
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS instructor JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS allow_custom_price BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS min_custom_price NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS suggested_custom_prices JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS certificate_available BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'approved';
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- Lepas foreign key lama pada courses jika ada (misal foreign key ke auth.users/profiles yang memblokir penambahan kursus)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT constraint_name FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'courses' AND constraint_type = 'FOREIGN KEY') LOOP
        EXECUTE 'ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Courses Access" ON public.courses;
CREATE POLICY "Public Courses Access" ON public.courses FOR ALL USING (true) WITH CHECK (true);


-- 4. Tabel Pengguna (Users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student',
  avatar TEXT,
  phone TEXT,
  enrolled_course_ids JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  institution TEXT,
  title TEXT,
  signature_url TEXT,
  instructor_status TEXT,
  instructor_certificate_url TEXT,
  instructor_certificate_name TEXT,
  instructor_specialization TEXT,
  instructor_specializations JSONB DEFAULT '[]'::jsonb,
  instructor_certificates JSONB DEFAULT '[]'::jsonb,
  instructor_id_card_url TEXT,
  instructor_rejection_reason TEXT,
  instructor_applied_at TIMESTAMPTZ,
  instructor_verified_at TIMESTAMPTZ,
  balance NUMERIC DEFAULT 0,
  bank_account JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_status TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_certificate_url TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_certificate_name TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_specialization TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_specializations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_certificates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_id_card_url TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_rejection_reason TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_applied_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_verified_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS bank_account JSONB;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Users Access" ON public.users;
CREATE POLICY "Public Users Access" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 4b. Tabel Pendaftaran & Verifikasi Instruktur (Instructor Applications)
CREATE TABLE IF NOT EXISTS public.instructor_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  title TEXT DEFAULT '',
  institution TEXT DEFAULT '',
  specialization TEXT NOT NULL,
  specializations JSONB DEFAULT '[]'::jsonb,
  bio TEXT DEFAULT '',
  certificate_url TEXT NOT NULL,
  certificate_name TEXT DEFAULT '',
  certificates JSONB DEFAULT '[]'::jsonb,
  id_card_url TEXT DEFAULT '',
  signature_url TEXT DEFAULT '',
  bank_account JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

ALTER TABLE IF EXISTS public.instructor_applications ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE IF EXISTS public.instructor_applications ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.instructor_applications ADD COLUMN IF NOT EXISTS certificate_url TEXT;
ALTER TABLE IF EXISTS public.instructor_applications ADD COLUMN IF NOT EXISTS certificate_name TEXT;
ALTER TABLE IF EXISTS public.instructor_applications ADD COLUMN IF NOT EXISTS certificates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.instructor_applications ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE IF EXISTS public.instructor_applications ADD COLUMN IF NOT EXISTS id_card_url TEXT;
ALTER TABLE IF EXISTS public.instructor_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE IF EXISTS public.instructor_applications ADD COLUMN IF NOT EXISTS bank_account JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.instructor_applications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS public.instructor_applications ADD COLUMN IF NOT EXISTS institution TEXT;

ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Instructor Applications Access" ON public.instructor_applications;
CREATE POLICY "Public Instructor Applications Access" ON public.instructor_applications FOR ALL USING (true) WITH CHECK (true);

-- 4b. Otomatisasi Sinkronisasi Akun dari Supabase Auth (auth.users -> public.users)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (id, name, email, role, avatar, phone, institution, enrolled_course_ids, created_at)
    VALUES (
      new.id::text,
      COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(COALESCE(new.email, 'siswa'), '@', 1)),
      COALESCE(new.email, new.id::text || '@siswa.local'),
      COALESCE(new.raw_user_meta_data->>'role', 'student'),
      COALESCE(new.raw_user_meta_data->>'avatar', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || md5(COALESCE(new.email, new.id::text))),
      COALESCE(new.raw_user_meta_data->>'phone', ''),
      COALESCE(new.raw_user_meta_data->>'institution', 'Umum'),
      '[]'::jsonb,
      COALESCE(new.created_at, now())
    )
    ON CONFLICT (email) DO UPDATE
    SET
      name = EXCLUDED.name,
      phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.users.phone END,
      institution = CASE WHEN EXCLUDED.institution <> '' THEN EXCLUDED.institution ELSE public.users.institution END;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: Do not fail auth.users creation even if public.users insert encounters an issue
    RAISE WARNING 'handle_new_auth_user exception: %', SQLERRM;
  END;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- 5. Tabel Transaksi Pembayaran (Transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  transaction_code TEXT UNIQUE NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  paid_at TIMESTAMPTZ
);

ALTER TABLE IF EXISTS public.transactions ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.transactions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Transactions Access" ON public.transactions;
CREATE POLICY "Public Transactions Access" ON public.transactions FOR ALL USING (true) WITH CHECK (true);


-- 6. Tabel Progres Belajar Siswa (Student Progress)
CREATE TABLE IF NOT EXISTS public.student_progress (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  completed_module_ids JSONB DEFAULT '[]'::jsonb,
  quiz_scores JSONB DEFAULT '{}'::jsonb,
  last_watched_module_id TEXT,
  certificate_claimed BOOLEAN DEFAULT false,
  enrolled_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Progress Access" ON public.student_progress;
CREATE POLICY "Public Progress Access" ON public.student_progress FOR ALL USING (true) WITH CHECK (true);


-- 7. Tabel Sertifikat (Certificates)
CREATE TABLE IF NOT EXISTS public.certificates (
  id TEXT PRIMARY KEY,
  certificate_number TEXT UNIQUE NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  grade TEXT NOT NULL,
  score NUMERIC NOT NULL,
  verification_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Certificates Access" ON public.certificates;
CREATE POLICY "Public Certificates Access" ON public.certificates FOR ALL USING (true) WITH CHECK (true);


-- 8. Tabel Pengaturan Sistem & Website (Settings)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Settings Access" ON public.settings;
CREATE POLICY "Public Settings Access" ON public.settings FOR ALL USING (true) WITH CHECK (true);


-- 9. Tabel Sesi Live Mentoring (Live Sessions)
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  course_id TEXT DEFAULT '',
  course_title TEXT DEFAULT '',
  instructor_name TEXT DEFAULT '',
  instructor_avatar TEXT DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 90,
  meet_url TEXT DEFAULT '',
  platform TEXT DEFAULT 'Google Meet',
  description TEXT DEFAULT '',
  max_attendees INTEGER DEFAULT 150,
  registered_student_ids JSONB DEFAULT '[]'::jsonb,
  is_live_now BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Live Sessions Access" ON public.live_sessions;
CREATE POLICY "Public Live Sessions Access" ON public.live_sessions FOR ALL USING (true) WITH CHECK (true);


--// 10. Tabel Halaman Kustom CMS (Custom Pages)
CREATE TABLE IF NOT EXISTS public.custom_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Custom Pages Access" ON public.custom_pages;
CREATE POLICY "Public Custom Pages Access" ON public.custom_pages FOR ALL USING (true) WITH CHECK (true);


-- 11. Tabel Paket Bundling Kursus (Course Bundles)
CREATE TABLE IF NOT EXISTS public.course_bundles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  bundle_type TEXT NOT NULL DEFAULT 'all_courses',
  target_category TEXT,
  course_ids JSONB DEFAULT '[]'::jsonb,
  price NUMERIC DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  thumbnail TEXT,
  badge TEXT,
  show_in_checkout BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.course_bundles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Course Bundles Access" ON public.course_bundles;
CREATE POLICY "Public Course Bundles Access" ON public.course_bundles FOR ALL USING (true) WITH CHECK (true);


-- 12. Tabel Desain Sertifikat (Certificate Design Settings)
CREATE TABLE IF NOT EXISTS public.certificate_design (
  id TEXT PRIMARY KEY DEFAULT 'default',
  template_style TEXT DEFAULT 'royal_gold',
  institution_name TEXT DEFAULT 'LESIN AJA',
  institution_tagline TEXT,
  certificate_title TEXT DEFAULT 'SERTIFIKAT KELULUSAN & KOMPETENSI',
  certificate_subtitle TEXT DEFAULT 'CERTIFICATE OF COMPLETION & PROFESSIONAL MASTERY',
  citation_text TEXT,
  lead_instructor_name TEXT DEFAULT '',
  lead_instructor_title TEXT DEFAULT 'LEAD MASTER INSTRUCTOR',
  issue_city TEXT DEFAULT 'Jakarta',
  instructor_title_font_size INTEGER DEFAULT 11,
  instructor_name_font_size INTEGER DEFAULT 13,
  primary_color TEXT DEFAULT '#b45309',
  secondary_color TEXT DEFAULT '#0f172a',
  accent_color TEXT DEFAULT '#f59e0b',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.certificate_design ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Certificate Design Access" ON public.certificate_design;
CREATE POLICY "Public Certificate Design Access" ON public.certificate_design FOR ALL USING (true) WITH CHECK (true);


-- 13. Tabel Permohonan Penarikan Saldo Instruktur (Instructor Payout Requests)
CREATE TABLE IF NOT EXISTS public.instructor_payout_requests (
  id TEXT PRIMARY KEY,
  instructor_id TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  instructor_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  proof_image_url TEXT,
  requested_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_at TIMESTAMPTZ,
  processed_by TEXT
);

ALTER TABLE public.instructor_payout_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Instructor Payout Requests Access" ON public.instructor_payout_requests;
CREATE POLICY "Public Instructor Payout Requests Access" ON public.instructor_payout_requests FOR ALL USING (true) WITH CHECK (true);

-- Muat ulang schema cache PostgREST agar semua kolom langsung terbaca
NOTIFY pgrst, 'reload schema';
`;

export const SUPABASE_SQL_SCHEMA_FIX_COURSES = `-- =========================================================
-- QUICK FIX: TAMBAHKAN KOLOM INSTRUCTOR & RELOAD SCHEMA POSTGREST
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run (Ctrl+Enter)
-- =========================================================

-- 1. Tambahkan kolom instructor (JSONB) dan kolom pendukung lainnya jika belum ada
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS instructor JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS certificate_available BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

-- 2. Pastikan RLS mengizinkan insert & update
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Courses Access" ON public.courses;
CREATE POLICY "Public Courses Access" ON public.courses FOR ALL USING (true) WITH CHECK (true);

-- 3. Muat ulang PostgREST schema cache agar kolom instructor langsung terdeteksi
NOTIFY pgrst, 'reload schema';
`;

export const SUPABASE_SQL_SCHEMA_CERTIFICATE_DESIGN = `-- =========================================================
-- SKEMA TABEL KHUSUS DESAIN SERTIFIKAT (CERTIFICATE DESIGN)
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run (Ctrl+Enter)
-- =========================================================

-- 1. Tabel Khusus Desain Sertifikat (Menyimpan Tata Letak, Kota, Font, Warna & Tanda Tangan)
CREATE TABLE IF NOT EXISTS public.certificate_design (
  id TEXT PRIMARY KEY DEFAULT 'default',
  template_style TEXT DEFAULT 'royal_gold',
  institution_name TEXT DEFAULT 'LESIN AJA',
  institution_tagline TEXT,
  certificate_title TEXT DEFAULT 'SERTIFIKAT KELULUSAN & KOMPETENSI',
  certificate_subtitle TEXT DEFAULT 'CERTIFICATE OF COMPLETION & PROFESSIONAL MASTERY',
  citation_text TEXT,
  lead_instructor_name TEXT DEFAULT '',
  lead_instructor_title TEXT DEFAULT 'LEAD MASTER INSTRUCTOR',
  issue_city TEXT DEFAULT 'Jakarta',
  instructor_title_font_size INTEGER DEFAULT 11,
  instructor_name_font_size INTEGER DEFAULT 13,
  primary_color TEXT DEFAULT '#b45309',
  secondary_color TEXT DEFAULT '#0f172a',
  accent_color TEXT DEFAULT '#f59e0b',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan Row Level Security (RLS) & Kebijakan Publik
ALTER TABLE public.certificate_design ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Certificate Design Access" ON public.certificate_design;
CREATE POLICY "Public Certificate Design Access" ON public.certificate_design FOR ALL USING (true) WITH CHECK (true);

-- 3. Cadangan Tabel Settings (Dual-Layer Sync)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Settings Access" ON public.settings;
CREATE POLICY "Public Settings Access" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- 4. Muat ulang PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`;

export const SUPABASE_SQL_SCHEMA_SETTINGS_ONLY = `-- =========================================================
-- QUICK FIX: BUAT TABEL 'settings', 'certificate_design', 'live_sessions', 'custom_pages' & 'course_bundles'
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run (Ctrl+Enter)
-- =========================================================

-- 1. Tabel Pengaturan Sistem & Website (Settings)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Settings Access" ON public.settings;
CREATE POLICY "Public Settings Access" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabel Desain Sertifikat (Certificate Design)
CREATE TABLE IF NOT EXISTS public.certificate_design (
  id TEXT PRIMARY KEY DEFAULT 'default',
  template_style TEXT DEFAULT 'royal_gold',
  institution_name TEXT DEFAULT 'LESIN AJA',
  institution_tagline TEXT,
  certificate_title TEXT DEFAULT 'SERTIFIKAT KELULUSAN & KOMPETENSI',
  certificate_subtitle TEXT DEFAULT 'CERTIFICATE OF COMPLETION & PROFESSIONAL MASTERY',
  citation_text TEXT,
  lead_instructor_name TEXT DEFAULT '',
  lead_instructor_title TEXT DEFAULT 'LEAD MASTER INSTRUCTOR',
  issue_city TEXT DEFAULT 'Jakarta',
  instructor_title_font_size INTEGER DEFAULT 11,
  instructor_name_font_size INTEGER DEFAULT 13,
  primary_color TEXT DEFAULT '#b45309',
  secondary_color TEXT DEFAULT '#0f172a',
  accent_color TEXT DEFAULT '#f59e0b',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.certificate_design ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Certificate Design Access" ON public.certificate_design;
CREATE POLICY "Public Certificate Design Access" ON public.certificate_design FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabel Sesi Live (Live Sessions)
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  course_id TEXT DEFAULT '',
  course_title TEXT DEFAULT '',
  instructor_name TEXT DEFAULT '',
  instructor_avatar TEXT DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 90,
  meet_url TEXT DEFAULT '',
  platform TEXT DEFAULT 'Google Meet',
  description TEXT DEFAULT '',
  max_attendees INTEGER DEFAULT 150,
  registered_student_ids JSONB DEFAULT '[]'::jsonb,
  is_live_now BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Live Sessions Access" ON public.live_sessions;
CREATE POLICY "Public Live Sessions Access" ON public.live_sessions FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabel Halaman Kustom CMS (Custom Pages)
CREATE TABLE IF NOT EXISTS public.custom_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Custom Pages Access" ON public.custom_pages;
CREATE POLICY "Public Custom Pages Access" ON public.custom_pages FOR ALL USING (true) WITH CHECK (true);

-- 4. Tabel Paket Bundling Kursus (Course Bundles)
CREATE TABLE IF NOT EXISTS public.course_bundles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  bundle_type TEXT NOT NULL DEFAULT 'all_courses',
  target_category TEXT,
  course_ids JSONB DEFAULT '[]'::jsonb,
  price NUMERIC DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  thumbnail TEXT,
  badge TEXT,
  show_in_checkout BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.course_bundles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Course Bundles Access" ON public.course_bundles;
CREATE POLICY "Public Course Bundles Access" ON public.course_bundles FOR ALL USING (true) WITH CHECK (true);

-- 5. Muat ulang PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`;

export const SUPABASE_SQL_SCHEMA_BUNDLES_ONLY = `-- =========================================================
-- QUICK FIX: BUAT TABEL 'course_bundles' UNTUK PENGATURAN PAKET BUNDLING
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run (Ctrl+Enter)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.course_bundles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  bundle_type TEXT NOT NULL DEFAULT 'all_courses',
  target_category TEXT,
  course_ids JSONB DEFAULT '[]'::jsonb,
  price NUMERIC DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  thumbnail TEXT,
  badge TEXT,
  show_in_checkout BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.course_bundles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Course Bundles Access" ON public.course_bundles;
CREATE POLICY "Public Course Bundles Access" ON public.course_bundles FOR ALL USING (true) WITH CHECK (true);

-- Muat ulang schema cache PostgREST
NOTIFY pgrst, 'reload schema';
`;

export const SUPABASE_SQL_SCHEMA_FIX_AUTH_USER_TRIGGER = `-- =========================================================
-- QUICK FIX: PERBAIKI TRIGGER REGISTRASI PENGGUNA BARU SUPABASE
-- Solusi untuk Error: "Database error saving new user" (Gagal Mendaftar)
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run (Ctrl+Enter)
-- =========================================================

-- 1. Pastikan tabel public.users ada dengan semua kolom yang dibutuhkan
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student',
  avatar TEXT,
  phone TEXT,
  enrolled_course_ids JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  institution TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Pastikan kolom-kolom penting ada jika tabel sudah dibuat sebelumnya
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS enrolled_course_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;

-- 3. Buka izin akses Row Level Security (RLS) untuk public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Users Access" ON public.users;
CREATE POLICY "Public Users Access" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 4. Hapus trigger lama yang mungkin menyebabkan error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_sync ON auth.users;

-- 5. Buat function trigger dengan EXCEPTION HANDLER (Anti-Crash saat pendaftaran)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (id, name, email, role, avatar, phone, institution, enrolled_course_ids, created_at)
    VALUES (
      new.id::text,
      COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(COALESCE(new.email, 'siswa'), '@', 1)),
      COALESCE(new.email, new.id::text || '@siswa.local'),
      COALESCE(new.raw_user_meta_data->>'role', 'student'),
      COALESCE(new.raw_user_meta_data->>'avatar', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || md5(COALESCE(new.email, new.id::text))),
      COALESCE(new.raw_user_meta_data->>'phone', ''),
      COALESCE(new.raw_user_meta_data->>'institution', 'Umum'),
      '[]'::jsonb,
      COALESCE(new.created_at, now())
    )
    ON CONFLICT (email) DO UPDATE
    SET
      name = EXCLUDED.name,
      phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.users.phone END,
      institution = CASE WHEN EXCLUDED.institution <> '' THEN EXCLUDED.institution ELSE public.users.institution END;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback aman: Jangan biarkan kegagalan sinkronisasi membatalkan pembuatan akun di auth.users!
    RAISE WARNING 'handle_new_auth_user warning: %', SQLERRM;
  END;
  RETURN new;
END;
$$;

-- 6. Pasang kembali trigger aman ke auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 7. Muat ulang PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`;

export const SUPABASE_SQL_SCHEMA_INSTRUCTOR_VERIFICATION = `-- =========================================================
-- SKEMA KHUSUS PENDAFTARAN & VERIFIKASI INSTRUKTUR DAN KURSUS
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run (Ctrl+Enter)
-- =========================================================

-- 1. Tabel Pendaftaran & Pengajuan Verifikasi Instruktur
CREATE TABLE IF NOT EXISTS public.instructor_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  title TEXT DEFAULT '',
  institution TEXT DEFAULT '',
  specialization TEXT NOT NULL,
  bio TEXT DEFAULT '',
  certificate_url TEXT NOT NULL,
  certificate_name TEXT DEFAULT '',
  id_card_url TEXT DEFAULT '',
  bank_account JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  rejection_reason TEXT,
  applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

-- 2. Aktifkan RLS untuk instructor_applications
ALTER TABLE public.instructor_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Instructor Applications Access" ON public.instructor_applications;
CREATE POLICY "Public Instructor Applications Access" ON public.instructor_applications FOR ALL USING (true) WITH CHECK (true);

-- 3. Tambahkan kolom verifikasi instruktur pada tabel users
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_status TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_certificate_url TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_certificate_name TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_specialization TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_rejection_reason TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_applied_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS instructor_verified_at TIMESTAMPTZ;

-- 4. Tambahkan kolom status verifikasi pada tabel courses
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'approved';
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE IF EXISTS public.courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- 5. Muat ulang PostgREST schema cache agar kolom dan tabel baru langsung aktif
NOTIFY pgrst, 'reload schema';
`;

