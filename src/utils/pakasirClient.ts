/**
 * Pakasir Payment Gateway Integration Client (pakasir.com)
 * Handles Transaction Creation, Status Verification, Webhook handling, and Simulation.
 */

import { PakasirApiMethod, PakasirPaymentResponse, PakasirWebhookPayload } from '../types';

export interface PakasirMethodInfo {
  id: PakasirApiMethod;
  name: string;
  category: 'qris' | 'va';
  bankName: string;
  badge: string;
  iconType: string;
  description: string;
}

export const PAKASIR_PAYMENT_METHODS: PakasirMethodInfo[] = [
  {
    id: 'qris',
    name: 'QRIS Instan',
    category: 'qris',
    bankName: 'Semua Bank & e-Wallet',
    badge: 'Otomatis Realtime',
    iconType: 'qris',
    description: 'BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, LinkAja'
  },
  {
    id: 'bri_va',
    name: 'BRI Virtual Account',
    category: 'va',
    bankName: 'Bank BRI',
    badge: 'Verifikasi Otomatis',
    iconType: 'bri',
    description: 'Bayar melalui BRImo, ATM BRI, atau Internet Banking BRI'
  },
  {
    id: 'bni_va',
    name: 'BNI Virtual Account',
    category: 'va',
    bankName: 'Bank BNI',
    badge: 'Verifikasi Otomatis',
    iconType: 'bni',
    description: 'Bayar melalui BNI Mobile Banking atau ATM BNI'
  },
  {
    id: 'cimb_niaga_va',
    name: 'CIMB Niaga Virtual Account',
    category: 'va',
    bankName: 'Bank CIMB Niaga',
    badge: 'Verifikasi Otomatis',
    iconType: 'cimb',
    description: 'Bayar melalui OCTO Mobile atau ATM CIMB Niaga'
  },
  {
    id: 'permata_va',
    name: 'Permata Virtual Account',
    category: 'va',
    bankName: 'Bank Permata',
    badge: 'Verifikasi Otomatis',
    iconType: 'permata',
    description: 'Bayar melalui PermataMobile X atau ATM Permata'
  },
  {
    id: 'maybank_va',
    name: 'Maybank Virtual Account',
    category: 'va',
    bankName: 'Bank Maybank',
    badge: 'Verifikasi Otomatis',
    iconType: 'maybank',
    description: 'Bayar melalui M2U ID App atau ATM Maybank'
  },
  {
    id: 'bnc_va',
    name: 'BNC (Neo Bank) Virtual Account',
    category: 'va',
    bankName: 'Bank Neo Commerce',
    badge: 'Verifikasi Otomatis',
    iconType: 'bnc',
    description: 'Bayar melalui aplikasi Neobank atau transfer bank'
  },
  {
    id: 'sampoerna_va',
    name: 'Sahabat Sampoerna Virtual Account',
    category: 'va',
    bankName: 'Bank Sahabat Sampoerna',
    badge: 'Verifikasi Otomatis',
    iconType: 'sampoerna',
    description: 'Bayar melalui transfer antarbank / Sampoerna Mobile'
  },
  {
    id: 'atm_bersama_va',
    name: 'ATM Bersama Virtual Account',
    category: 'va',
    bankName: 'Jaringan ATM Bersama',
    badge: 'Verifikasi Otomatis',
    iconType: 'atm_bersama',
    description: 'Mendukung transfer dari seluruh bank anggota ATM Bersama'
  },
  {
    id: 'artha_graha_va',
    name: 'Artha Graha Virtual Account',
    category: 'va',
    bankName: 'Bank Artha Graha',
    badge: 'Verifikasi Otomatis',
    iconType: 'artha_graha',
    description: 'Bayar melalui agi mobile atau ATM Artha Graha'
  }
];

export interface CreateTransactionParams {
  method: PakasirApiMethod | string;
  project?: string;
  order_id: string;
  amount: number;
  api_key?: string;
}

export interface EnvPakasirConfig {
  projectSlug: string;
  apiKey: string;
  isFromEnv: boolean;
  envSource: 'vite_env' | 'process_env' | 'none';
}

/**
 * Reads Pakasir configuration from environment variables (Vercel / Vite / Container)
 */
export function getEnvPakasirConfig(): EnvPakasirConfig {
  let projectSlug = '';
  let apiKey = '';
  let envSource: 'vite_env' | 'process_env' | 'none' = 'none';

  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      projectSlug = (metaEnv.VITE_PAKASIR_PROJECT_SLUG || metaEnv.PAKASIR_PROJECT_SLUG || '').trim();
      apiKey = (metaEnv.VITE_PAKASIR_API_KEY || metaEnv.PAKASIR_API_KEY || '').trim();
      if (projectSlug || apiKey) envSource = 'vite_env';
    }
  } catch {}

  if (!projectSlug || !apiKey) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        if (!projectSlug) projectSlug = (process.env.VITE_PAKASIR_PROJECT_SLUG || process.env.PAKASIR_PROJECT_SLUG || '').trim();
        if (!apiKey) apiKey = (process.env.VITE_PAKASIR_API_KEY || process.env.PAKASIR_API_KEY || '').trim();
        if ((projectSlug || apiKey) && envSource === 'none') envSource = 'process_env';
      }
    } catch {}
  }

  return {
    projectSlug,
    apiKey,
    isFromEnv: Boolean(projectSlug && apiKey),
    envSource
  };
}

/**
 * Creates a transaction via Pakasir API
 * Endpoint: POST https://app.pakasir.com/api/transactioncreate/{method}
 */
export async function createPakasirTransaction(
  params: CreateTransactionParams
): Promise<{ success: boolean; data?: PakasirPaymentResponse['payment']; error?: string }> {
  const envConfig = getEnvPakasirConfig();
  const method = params.method || 'qris';
  const payload = {
    project: (params.project || envConfig.projectSlug || '').trim(),
    order_id: params.order_id,
    amount: Math.round(Number(params.amount)),
    api_key: (params.api_key || envConfig.apiKey || '').trim()
  };

  if (!payload.project || !payload.api_key) {
    return {
      success: false,
      error: 'Konfigurasi Pakasir belum lengkap. Harap masukkan Project Slug dan API Key di Pengaturan Admin atau atur environment variable VITE_PAKASIR_PROJECT_SLUG & VITE_PAKASIR_API_KEY.'
    };
  }

  // Attempt 1: Call via backend API proxy (/api/pakasir/transactioncreate/:method or /api/pakasir/transactioncreate)
  try {
    let response = await fetch(`/api/pakasir/transactioncreate/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // If 404/405 on dynamic subpath, fallback to query parameter on root transactioncreate endpoint
    if (!response.ok && (response.status === 404 || response.status === 405)) {
      response = await fetch(`/api/pakasir/transactioncreate?method=${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...payload, method })
      });
    }

    if (response.ok) {
      const data = await response.json();
      if (data && data.payment) {
        return { success: true, data: data.payment };
      }
      if (data && data.error) {
        return { success: false, error: data.error };
      }
    } else {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error || errJson.message || `Error status ${response.status}: ${response.statusText}`;
      console.warn('Backend Pakasir proxy returned non-200:', errMsg);
    }
  } catch (err: any) {
    console.warn('Backend proxy failed, attempting direct Pakasir API call:', err);
  }

  // Attempt 2: Direct call to Pakasir API
  try {
    const directUrl = `https://app.pakasir.com/api/transactioncreate/${method}`;
    const directResponse = await fetch(directUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const directData = await directResponse.json();
    if (directResponse.ok && directData?.payment) {
      return { success: true, data: directData.payment };
    }
    return {
      success: false,
      error: directData?.message || directData?.error || 'Gagal membuat transaksi di Pakasir.'
    };
  } catch (directErr: any) {
    console.error('Direct Pakasir API call error:', directErr);
    return {
      success: false,
      error: directErr.message || 'Tidak dapat terhubung ke server Pakasir (Network error / CORS).'
    };
  }
}

/**
 * Checks transaction detail from Pakasir
 * GET https://app.pakasir.com/api/transactiondetail?project={slug}&amount={amount}&order_id={order_id}&api_key={api_key}
 */
export async function checkPakasirTransactionDetail(params: {
  project?: string;
  order_id: string;
  amount: number;
  api_key?: string;
}): Promise<{ success: boolean; transaction?: PakasirWebhookPayload; isCompleted: boolean; error?: string }> {
  const envConfig = getEnvPakasirConfig();
  const query = new URLSearchParams({
    project: (params.project || envConfig.projectSlug || '').trim(),
    order_id: params.order_id,
    amount: String(Math.round(Number(params.amount))),
    api_key: (params.api_key || envConfig.apiKey || '').trim()
  }).toString();

  // Try via backend proxy first
  try {
    const response = await fetch(`/api/pakasir/transactiondetail?${query}`);
    if (response.ok) {
      const data = await response.json();
      if (data?.transaction) {
        const isCompleted = data.transaction.status === 'completed';
        return { success: true, transaction: data.transaction, isCompleted };
      }
    }
  } catch (e) {
    console.warn('Backend proxy check detail error:', e);
  }

  // Fallback to direct Pakasir API
  try {
    const directUrl = `https://app.pakasir.com/api/transactiondetail?${query}`;
    const directRes = await fetch(directUrl);
    const directData = await directRes.json();
    if (directRes.ok && directData?.transaction) {
      const isCompleted = directData.transaction.status === 'completed';
      return { success: true, transaction: directData.transaction, isCompleted };
    }
    return {
      success: false,
      isCompleted: false,
      error: directData?.message || 'Transaksi belum ditemukan di sistem Pakasir'
    };
  } catch (err: any) {
    return {
      success: false,
      isCompleted: false,
      error: err.message || 'Gagal memeriksa status pembayaran'
    };
  }
}

/**
 * Simulates a payment in sandbox mode
 * POST https://app.pakasir.com/api/paymentsimulation
 */
export async function simulatePakasirPayment(params: {
  project?: string;
  order_id: string;
  amount: number;
  api_key?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const envConfig = getEnvPakasirConfig();
  const payload = {
    project: (params.project || envConfig.projectSlug || '').trim(),
    order_id: params.order_id,
    amount: Math.round(Number(params.amount)),
    api_key: (params.api_key || envConfig.apiKey || '').trim()
  };

  // Try via backend proxy
  try {
    const res = await fetch('/api/pakasir/paymentsimulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || 'Simulasi pembayaran berhasil dikirim.' };
    }
  } catch (e) {
    console.warn('Proxy simulation failed, trying direct:', e);
  }

  // Fallback direct
  try {
    const directRes = await fetch('https://app.pakasir.com/api/paymentsimulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await directRes.json();
    if (directRes.ok) {
      return { success: true, message: data?.message || 'Simulasi pembayaran berhasil di Pakasir!' };
    }
    return { success: false, error: data?.message || 'Simulasi pembayaran gagal' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal terhubung ke API simulasi Pakasir' };
  }
}

/**
 * Tests connection to Pakasir API with given credentials
 */
export async function testPakasirConnection(params: {
  projectSlug?: string;
  apiKey?: string;
}): Promise<{ success: boolean; message: string; details?: any }> {
  const envConfig = getEnvPakasirConfig();
  const project = (params.projectSlug || envConfig.projectSlug || '').trim();
  const apiKey = (params.apiKey || envConfig.apiKey || '').trim();

  if (!project) {
    return { success: false, message: 'Project Slug Pakasir belum diisi.' };
  }
  if (!apiKey) {
    return { success: false, message: 'API Key Pakasir belum diisi.' };
  }

  // Perform a test transaction query
  const testOrderId = `TEST-PING-${Date.now()}`;
  try {
    const res = await checkPakasirTransactionDetail({
      project,
      api_key: apiKey,
      order_id: testOrderId,
      amount: 10000
    });

    // If server responded (even if transaction not found, it means API key and project slug reached endpoint)
    if (res.error && res.error.toLowerCase().includes('tidak valid') || res.error?.toLowerCase().includes('unauthorized') || res.error?.toLowerCase().includes('forbidden')) {
      return {
        success: false,
        message: `Koneksi ditolak oleh Pakasir: ${res.error}. Periksa kembali Project Slug dan API Key Anda.`
      };
    }

    return {
      success: true,
      message: `Koneksi API Pakasir Berhasil! Project "${project}" siap memproses pembayaran.`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Koneksi gagal: ${err.message || 'Tidak dapat menghubungi server Pakasir'}`
    };
  }
}

/**
 * Helper to get the correct Webhook URL for the user to copy into Pakasir dashboard
 */
export function getPakasirWebhookUrl(customUrl?: string): string {
  if (customUrl && customUrl.trim()) {
    return customUrl.trim();
  }
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api/pakasir/webhook`;
  }
  return 'https://ais-pre-y4ao42fpmpfdpmczzppdnz-868533811635.asia-southeast1.run.app/api/pakasir/webhook';
}
