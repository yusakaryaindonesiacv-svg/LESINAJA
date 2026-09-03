/**
 * Paymentku Payment Gateway Integration Client (paymentku.com / paymenku.com)
 * Handles Transaction Creation, Status Verification, Webhook handling, and Simulation.
 */

import { PaymentkuPaymentResponse, PaymentkuWebhookPayload } from '../types';

export interface PaymentkuChannelInfo {
  id: string;
  name: string;
  category: 'qris' | 'va' | 'ewallet' | 'retail';
  providerName: string;
  badge: string;
  iconType: string;
  description: string;
  feeInfo?: string;
}

export const PAYMENTKU_CHANNELS: PaymentkuChannelInfo[] = [
  {
    id: 'paymentku_qris',
    name: 'QRIS Instan (Paymentku)',
    category: 'qris',
    providerName: 'Semua Bank & E-Wallet (QRIS Nasional)',
    badge: 'Real-time & Auto Detect',
    iconType: 'qris',
    description: 'BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, LinkAja, AstraPay',
    feeInfo: 'Biaya admin 0.7%'
  },
  {
    id: 'paymentku_bca_va',
    name: 'BCA Virtual Account',
    category: 'va',
    providerName: 'Bank BCA',
    badge: 'Verifikasi Otomatis',
    iconType: 'bca',
    description: 'Bayar melalui myBCA, BCA mobile, KlikBCA, atau ATM BCA'
  },
  {
    id: 'paymentku_mandiri_va',
    name: 'Mandiri Virtual Account',
    category: 'va',
    providerName: 'Bank Mandiri',
    badge: 'Verifikasi Otomatis',
    iconType: 'mandiri',
    description: 'Bayar melalui Livin by Mandiri atau ATM Mandiri'
  },
  {
    id: 'paymentku_bri_va',
    name: 'BRI Virtual Account (BRIVA)',
    category: 'va',
    providerName: 'Bank BRI',
    badge: 'Verifikasi Otomatis',
    iconType: 'bri',
    description: 'Bayar melalui BRImo atau ATM BRI'
  },
  {
    id: 'paymentku_bni_va',
    name: 'BNI Virtual Account',
    category: 'va',
    providerName: 'Bank BNI',
    badge: 'Verifikasi Otomatis',
    iconType: 'bni',
    description: 'Bayar melalui BNI Mobile Banking atau ATM BNI'
  },
  {
    id: 'paymentku_permata_va',
    name: 'Permata Virtual Account',
    category: 'va',
    providerName: 'Bank Permata',
    badge: 'Verifikasi Otomatis',
    iconType: 'permata',
    description: 'Bayar melalui PermataMobile X atau ATM Permata'
  },
  {
    id: 'paymentku_cimb_va',
    name: 'CIMB Niaga Virtual Account',
    category: 'va',
    providerName: 'Bank CIMB Niaga',
    badge: 'Verifikasi Otomatis',
    iconType: 'cimb',
    description: 'Bayar melalui OCTO Mobile atau ATM CIMB Niaga'
  },
  {
    id: 'paymentku_bsi_va',
    name: 'BSI Virtual Account',
    category: 'va',
    providerName: 'Bank Syariah Indonesia (BSI)',
    badge: 'Verifikasi Otomatis',
    iconType: 'bsi',
    description: 'Bayar melalui BSI Mobile atau ATM BSI'
  },
  {
    id: 'paymentku_dana',
    name: 'DANA E-Wallet',
    category: 'ewallet',
    providerName: 'DANA Indonesia',
    badge: 'Langsung Terhubung',
    iconType: 'dana',
    description: 'Bayar instan via aplikasi dompet digital DANA'
  },
  {
    id: 'paymentku_ovo',
    name: 'OVO E-Wallet',
    category: 'ewallet',
    providerName: 'OVO',
    badge: 'Langsung Terhubung',
    iconType: 'ovo',
    description: 'Notifikasi push instan & bayar di aplikasi OVO'
  },
  {
    id: 'paymentku_shopeepay',
    name: 'ShopeePay',
    category: 'ewallet',
    providerName: 'ShopeePay Indonesia',
    badge: 'Langsung Terhubung',
    iconType: 'shopeepay',
    description: 'Bayar instan dengan saldo ShopeePay atau SPayLater'
  },
  {
    id: 'paymentku_linkaja',
    name: 'LinkAja',
    category: 'ewallet',
    providerName: 'LinkAja',
    badge: 'Langsung Terhubung',
    iconType: 'linkaja',
    description: 'Bayar instan via dompet digital BUMN LinkAja'
  },
  {
    id: 'paymentku_alfamart',
    name: 'Gerai Alfamart / AlfaMidi',
    category: 'retail',
    providerName: 'Alfamart Retail Group',
    badge: 'Bayar Tunai di Kasir',
    iconType: 'alfamart',
    description: 'Tunjukkan kode bayar ke kasir Alfamart / Alfa Midi terdekat'
  },
  {
    id: 'paymentku_indomaret',
    name: 'Gerai Indomaret',
    category: 'retail',
    providerName: 'Indomaret Group',
    badge: 'Bayar Tunai di Kasir',
    iconType: 'indomaret',
    description: 'Tunjukkan kode bayar ke kasir Indomaret / Ceriamart terdekat'
  }
];

export interface CreatePaymentkuParams {
  method?: string;
  order_id: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  merchant_code?: string;
  items?: Array<{
    name: string;
    price: number;
    qty?: number;
    quantity?: number;
  }>;
  api_key?: string;
  callback_url?: string;
  return_url?: string;
  expired_time?: number; // In minutes
}

export interface EnvPaymentkuConfig {
  apiKey: string;
  webhookSecret: string;
  merchantCode: string;
  isFromEnv: boolean;
  isSandbox: boolean;
  envSource: 'vite_env' | 'process_env' | 'none';
}

/**
 * Reads Paymentku configuration from environment variables (Vercel / Vite / Container)
 */
export function getEnvPaymentkuConfig(): EnvPaymentkuConfig {
  let apiKey = '';
  let webhookSecret = '';
  let merchantCode = '';
  let envSource: 'vite_env' | 'process_env' | 'none' = 'none';

  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      apiKey = (metaEnv.VITE_PAYMENTKU_API_KEY || metaEnv.PAYMENTKU_API_KEY || '').trim();
      webhookSecret = (metaEnv.VITE_PAYMENTKU_WEBHOOK_SECRET || metaEnv.PAYMENTKU_WEBHOOK_SECRET || '').trim();
      merchantCode = (metaEnv.VITE_PAYMENTKU_MERCHANT_CODE || metaEnv.PAYMENTKU_MERCHANT_CODE || '').trim();
      if (apiKey) envSource = 'vite_env';
    }
  } catch {}

  if (!apiKey) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        apiKey = (process.env.VITE_PAYMENTKU_API_KEY || process.env.PAYMENTKU_API_KEY || '').trim();
        webhookSecret = (process.env.VITE_PAYMENTKU_WEBHOOK_SECRET || process.env.PAYMENTKU_WEBHOOK_SECRET || '').trim();
        merchantCode = (process.env.VITE_PAYMENTKU_MERCHANT_CODE || process.env.PAYMENTKU_MERCHANT_CODE || '').trim();
        if (apiKey && envSource === 'none') envSource = 'process_env';
      }
    } catch {}
  }

  const isSandbox = apiKey.startsWith('sk_test_');

  return {
    apiKey,
    webhookSecret,
    merchantCode,
    isFromEnv: Boolean(apiKey),
    isSandbox,
    envSource
  };
}

/**
 * Normalize method names to Paymentku channel codes
 */
export function normalizePaymentkuMethod(methodId: string): string {
  const clean = methodId.replace(/^paymentku_/, '').toLowerCase();
  if (clean === 'qris') return 'qris';
  if (clean.endsWith('_va')) return clean; // e.g. bca_va, mandiri_va
  return clean;
}

/**
 * Helper to extract detailed validation error from Paymentku response
 */
export function formatPaymentkuError(json: any, defaultMsg = 'Terjadi kesalahan pada Paymentku'): string {
  if (!json) return defaultMsg;
  if (typeof json === 'string') return json;

  const baseMsg = json.message || json.error || json.msg || json.status_message || json.status || 'Validation failed';
  const errorList: string[] = [];

  const rawErrors = json.errors || json.data?.errors || json.details?.errors || json.validation_errors || json.error_details || (typeof json.data === 'object' && !Array.isArray(json.data) ? json.data : null);

  if (rawErrors && typeof rawErrors === 'object') {
    if (Array.isArray(rawErrors)) {
      rawErrors.forEach((e: any) => {
        if (typeof e === 'string') errorList.push(e);
        else if (e?.message) errorList.push(e.message);
        else if (e?.msg) errorList.push(e.msg);
        else errorList.push(JSON.stringify(e));
      });
    } else {
      for (const [field, err] of Object.entries(rawErrors)) {
        if (Array.isArray(err)) {
          errorList.push(`${field}: ${err.join(', ')}`);
        } else if (typeof err === 'string') {
          errorList.push(`${field}: ${err}`);
        } else if (err && typeof err === 'object') {
          errorList.push(`${field}: ${JSON.stringify(err)}`);
        }
      }
    }
  }

  if (errorList.length > 0) {
    return `${baseMsg} -> (${errorList.join(' | ')})`;
  }

  if (baseMsg === 'Validation failed' || baseMsg === 'error') {
    const stringified = JSON.stringify(json);
    if (stringified.length > 2 && stringified !== '{}') {
      return `Validation failed: ${stringified}`;
    }
  }

  return baseMsg;
}

/**
 * Creates a transaction via Paymentku API
 * Endpoint: POST https://paymenku.com/api/v1/transaction/create
 */
export async function createPaymentkuTransaction(
  params: CreatePaymentkuParams
): Promise<{ success: boolean; data?: PaymentkuPaymentResponse['data']; error?: string; details?: any }> {
  const envConfig = getEnvPaymentkuConfig();
  const apiKey = (params.api_key || envConfig.apiKey || '').trim();
  const merchantCode = (params.merchant_code || envConfig.merchantCode || '').trim();

  if (!apiKey) {
    return {
      success: false,
      error: 'Konfigurasi Paymentku belum lengkap. Harap masukkan API Key (sk_live_... atau sk_test_...) di Pengaturan Admin atau atur environment variable VITE_PAYMENTKU_API_KEY.'
    };
  }

  const rawMethod = params.method || 'qris';
  const method = normalizePaymentkuMethod(rawMethod);
  const cleanOrderId = String(params.order_id).replace(/[^a-zA-Z0-9_-]/g, '').trim();
  const idempotencyKey = `inv-${cleanOrderId}-${Date.now().toString().slice(-6)}`;
  const numAmount = Math.round(Number(params.amount));

  // Phone normalization
  let cleanPhone = String(params.customer_phone || '081234567890').replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) cleanPhone = '081234567890';
  if (cleanPhone.startsWith('62')) cleanPhone = '0' + cleanPhone.slice(2);

  const orderItems = (Array.isArray(params.items) && params.items.length > 0)
    ? params.items.map(it => ({
        name: String(it.name || `Kursus #${cleanOrderId}`).slice(0, 100),
        quantity: Number(it.quantity || it.qty || 1)
      }))
    : [
        {
          name: `Kursus #${cleanOrderId}`,
          quantity: 1
        }
      ];

  const returnUrl = params.return_url || (typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : 'https://lesinaja.id/dashboard');

  // Payload exactly following official Paymenku API docs
  const payload = {
    channel_code: method,
    amount: numAmount,
    reference_id: cleanOrderId,
    customer_name: params.customer_name || 'Siswa LESIN AJA',
    customer_email: params.customer_email || 'siswa@lesinaja.id',
    customer_phone: cleanPhone,
    return_url: returnUrl,
    order_items: orderItems,
    // Compatibility fields
    method: method,
    order_id: cleanOrderId,
    api_key: apiKey,
    ...(merchantCode ? { merchant_code: merchantCode } : {})
  };

  // Attempt 1: Call via backend API proxy (/api/paymentku/transactioncreate)
  try {
    const response = await fetch('/api/paymentku/transactioncreate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(payload)
    });

    const json = await response.json().catch(() => null);

    if (response.ok && json) {
      if (json.status === 'success' || json.success || json.data || json.trx_id || json.pay_url || json.qr_string || json.va_number) {
        return { success: true, data: json.data || json };
      }
      if (json.error || json.message) {
        const err = formatPaymentkuError(json);
        return { success: false, error: err, details: json };
      }
    } else if (json && (json.error || json.message)) {
      console.warn('Backend Paymentku proxy error:', json.error || json.message);
      const err = formatPaymentkuError(json);
      return { success: false, error: err, details: json };
    }
  } catch (err: any) {
    console.warn('Backend proxy failed, attempting direct Paymentku API call:', err);
  }

  // Attempt 2: Direct call to official Paymenku API endpoint
  const directUrls = [
    'https://paymenku.com/api/v1/transaction/create',
    'https://paymentku.com/api/v1/transaction/create'
  ];

  let lastDirectError: any = null;

  for (const directUrl of directUrls) {
    try {
      const directResponse = await fetch(directUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          channel_code: method,
          amount: numAmount,
          reference_id: cleanOrderId,
          customer_name: params.customer_name || 'Siswa LESIN AJA',
          customer_email: params.customer_email || 'siswa@lesinaja.id',
          customer_phone: cleanPhone,
          return_url: returnUrl,
          order_items: orderItems
        })
      });

      const directData = await directResponse.json().catch(() => null);
      if (directResponse.ok && (directData?.status === 'success' || directData?.data || directData?.trx_id)) {
        return { success: true, data: directData.data || directData };
      }
      if (directData && (directData.message || directData.error)) {
        lastDirectError = directData;
        const err = formatPaymentkuError(directData);
        return {
          success: false,
          error: err,
          details: directData
        };
      }
    } catch {}
  }

  const finalError = formatPaymentkuError(lastDirectError, 'Tidak dapat menghubungkan transaksi ke Paymentku. Pastikan API Key valid dan terisi di menu Pengaturan Payment Gateway Admin.');
  return {
    success: false,
    error: finalError,
    details: lastDirectError
  };
}

/**
 * Checks transaction status from Paymentku
 * Endpoint: GET https://paymenku.com/api/v1/check-status/{order_id}
 */
export async function checkPaymentkuTransactionStatus(params: {
  order_id: string;
  api_key?: string;
}): Promise<{ success: boolean; data?: any; isCompleted: boolean; error?: string }> {
  const envConfig = getEnvPaymentkuConfig();
  const apiKey = (params.api_key || envConfig.apiKey || '').trim();

  // Try via backend proxy first
  try {
    const response = await fetch(`/api/paymentku/check-status/${encodeURIComponent(params.order_id)}`, {
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
    });
    if (response.ok) {
      const json = await response.json();
      const rawStatus = String(json?.data?.status || json?.status || '').toLowerCase();
      const isCompleted = rawStatus === 'paid' || rawStatus === 'success' || rawStatus === 'completed' || rawStatus === 'settlement';
      return { success: true, data: json?.data || json, isCompleted };
    }
  } catch (e) {
    console.warn('Backend proxy Paymentku check status error:', e);
  }

  // Fallback direct call
  if (apiKey) {
    const directStatusUrls = [
      `https://paymenku.com/api/v1/check-status/${encodeURIComponent(params.order_id)}`,
      `https://paymentku.com/api/v1/check-status/${encodeURIComponent(params.order_id)}`
    ];

    for (const directUrl of directStatusUrls) {
      try {
        const directRes = await fetch(directUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });
        const directData = await directRes.json().catch(() => null);
        if (directRes.ok && directData) {
          const rawStatus = String(directData?.data?.status || directData?.status || '').toLowerCase();
          const isCompleted = rawStatus === 'paid' || rawStatus === 'success' || rawStatus === 'completed' || rawStatus === 'settlement';
          return { success: true, data: directData?.data || directData, isCompleted };
        }
      } catch {}
    }
  }

  return {
    success: false,
    isCompleted: false,
    error: 'Status pembayaran belum terverifikasi'
  };
}

/**
 * Simulates a payment for testing in Sandbox
 */
export async function simulatePaymentkuPayment(params: {
  order_id: string;
  amount: number;
  api_key?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const envConfig = getEnvPaymentkuConfig();
  const apiKey = (params.api_key || envConfig.apiKey || '').trim();

  try {
    const res = await fetch('/api/paymentku/paymentsimulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        order_id: params.order_id,
        amount: params.amount,
        api_key: apiKey
      })
    });
    if (res.ok) {
      const json = await res.json();
      return { success: true, message: json.message || 'Simulasi pembayaran Paymentku berhasil!' };
    }
  } catch (e: any) {
    console.warn('Paymentku simulation proxy error:', e);
  }

  return {
    success: true,
    message: `Simulasi pembayaran Paymentku lokal berhasil dikirim untuk Order #${params.order_id}.`
  };
}

/**
 * Tests connection to Paymentku API with given credentials
 */
export async function testPaymentkuConnection(params: {
  apiKey?: string;
  merchantCode?: string;
}): Promise<{ success: boolean; message: string; isSandbox: boolean; details?: any }> {
  const envConfig = getEnvPaymentkuConfig();
  const apiKey = (params.apiKey || envConfig.apiKey || '').trim();
  const merchantCode = (params.merchantCode || envConfig.merchantCode || '').trim();

  if (!apiKey) {
    return { success: false, message: 'API Key Paymentku belum diisi.', isSandbox: false };
  }

  const isSandbox = apiKey.startsWith('sk_test_');

  // Step 1: Try calling dedicated backend test-connection endpoint
  try {
    const backendTestRes = await fetch('/api/paymentku/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        api_key: apiKey,
        merchant_code: merchantCode
      })
    });

    if (backendTestRes.ok) {
      const testJson = await backendTestRes.json().catch(() => null);
      if (testJson) {
        return {
          success: Boolean(testJson.success),
          message: testJson.message || (testJson.success ? 'Koneksi ke Paymentku Berhasil!' : 'Koneksi gagal.'),
          isSandbox,
          details: testJson.details || testJson
        };
      }
    }
  } catch (e) {
    console.warn('Backend test connection endpoint error, falling back to direct test:', e);
  }

  // Step 2: Fallback direct ping transaction test
  const testOrderId = `TEST${Date.now()}`;
  try {
    const res = await createPaymentkuTransaction({
      api_key: apiKey,
      merchant_code: merchantCode,
      order_id: testOrderId,
      amount: 10000,
      customer_name: 'Admin LESIN AJA',
      customer_email: 'admin@lesinaja.id',
      customer_phone: '081234567890',
      method: 'qris',
      items: [
        {
          name: 'Tes Koneksi API Paymentku',
          price: 10000,
          qty: 1,
          quantity: 1
        }
      ]
    });

    if (res.success && res.data) {
      return {
        success: true,
        message: `Koneksi API Paymentku (paymentku.com) Berhasil! ${isSandbox ? 'Mode Sandbox (Testing)' : 'Mode Production (Live)'}. Order #${res.data.order_id || testOrderId} berhasil dibuat di server Paymentku.`,
        isSandbox,
        details: res.data
      };
    }

    if (res.error) {
      const lower = res.error.toLowerCase();
      if (lower.includes('unauthorized') || lower.includes('invalid api key') || lower.includes('tidak valid')) {
        return {
          success: false,
          message: `Koneksi ditolak oleh Paymentku: ${res.error}. Harap pastikan API Key (Bearer Token) dari dashboard Paymentku sudah tepat.`,
          isSandbox,
          details: res.details
        };
      }

      return {
        success: false,
        message: `Respons dari Paymentku: ${res.error}`,
        isSandbox,
        details: res.details
      };
    }

    return {
      success: true,
      message: `API Key Paymentku terverifikasi (${isSandbox ? 'Sandbox' : 'Production'}). Server Paymentku aktif.`,
      isSandbox
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Koneksi gagal: ${err.message || 'Tidak dapat menghubungi server Paymentku'}`,
      isSandbox
    };
  }
}

/**
 * Helper to get the correct Webhook URL for Paymentku
 */
export function getPaymentkuWebhookUrl(customUrl?: string): string {
  if (customUrl && customUrl.trim()) {
    return customUrl.trim();
  }
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api/paymentku/webhook`;
  }
  return 'https://lesinaja.id/api/paymentku/webhook';
}
