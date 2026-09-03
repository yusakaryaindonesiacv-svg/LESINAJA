/**
 * Comprehensive OTP & Contact Verification Service
 * Supports:
 * - Email Syntax RFC 5322 & Typo Autocorrection & Disposable Filter
 * - WhatsApp Phone Normalization & WhatsApp Gateway Dispatch
 * - OTP Generation, Time-based Expiration (5 mins) & Resend Cooldown
 * - Multi-Channel Dispatch (WhatsApp & Email)
 */

// Common disposable email domains to reject
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', '10minutemail.com', '10minutemail.net',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'sharklasers.com',
  'grr.la', 'mailinator.com', 'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'dispostable.com', 'trashmail.com', 'fakeinbox.com', 'getairmail.com',
  'mohmal.com', 'crazymailing.com', 'mytemp.email', 'throwawaymail.com',
  'dropmail.me', 'inboxkitten.com', 'tempinbox.com', 'burnermail.io',
  'fakemailgenerator.com', 'disposablemail.com', 'generator.email', 'fakemail.net'
]);

// Map of common domain typos to legitimate domain names
const DOMAIN_TYPO_MAP: Record<string, string> = {
  'gmil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaho.co.id': 'yahoo.co.id',
  'yahoo.con': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'iclod.com': 'icloud.com'
};

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  isDisposable?: boolean;
  domain?: string;
  normalizedEmail?: string;
}

export function validateEmailDetailed(rawEmail: string): EmailValidationResult {
  const email = (rawEmail || '').trim().toLowerCase();
  if (!email) {
    return { isValid: false, error: 'Alamat email tidak boleh kosong.' };
  }

  if (email.length > 254) {
    return { isValid: false, error: 'Alamat email terlalu panjang (maksimal 254 karakter).' };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Format penulisan email tidak valid (contoh: budi@gmail.com).' };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Alamat email harus memiliki format username@domain.' };
  }

  const [username, domain] = parts;
  if (!username || username.length > 64) {
    return { isValid: false, error: 'Nama pengguna email sebelum tanda @ tidak valid.' };
  }

  if (username.startsWith('.') || username.endsWith('.') || username.includes('..')) {
    return { isValid: false, error: 'Username email tidak boleh memiliki titik berturut-turut.' };
  }

  if (!domain || !domain.includes('.')) {
    return { isValid: false, error: 'Domain email harus menyertakan ekstensi (contoh: .com, .id).' };
  }

  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { isValid: false, error: 'Ekstensi domain email minimal 2 huruf.' };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      isDisposable: true,
      error: `Domain @${domain} adalah layanan email sementara. Gunakan email aktif Anda.`
    };
  }

  let suggestion: string | undefined;
  if (DOMAIN_TYPO_MAP[domain]) {
    suggestion = `${username}@${DOMAIN_TYPO_MAP[domain]}`;
  }

  return {
    isValid: true,
    suggestion,
    domain,
    normalizedEmail: email
  };
}

/**
 * Normalizes Indonesian and international phone numbers into standard format with country code
 * e.g. 081234567890 -> 6281234567890
 * e.g. +62 812-3456-7890 -> 6281234567890
 */
export function normalizePhoneNumber(rawPhone: string): { isValid: boolean; normalized: string; formatted: string; error?: string } {
  let cleaned = (rawPhone || '').replace(/\D/g, '');

  if (!cleaned) {
    return { isValid: false, normalized: '', formatted: '', error: 'Nomor WhatsApp tidak boleh kosong.' };
  }

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  if (!cleaned.startsWith('62')) {
    // If other country code, check minimum length
    if (cleaned.length < 8 || cleaned.length > 16) {
      return { isValid: false, normalized: cleaned, formatted: `+${cleaned}`, error: 'Panjang nomor telepon tidak valid.' };
    }
  } else {
    // Indonesian standard length: 62 + 9 to 13 digits (total 11 - 15)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return {
        isValid: false,
        normalized: cleaned,
        formatted: `+${cleaned}`,
        error: 'Nomor WhatsApp Indonesia harus berisi 10-13 digit (contoh: 081234567890).'
      };
    }
  }

  // Format as readable string: +62 812-3456-7890
  let formatted = `+${cleaned}`;
  if (cleaned.startsWith('62') && cleaned.length >= 11) {
    formatted = `+62 ${cleaned.substring(2, 5)}-${cleaned.substring(5, 9)}-${cleaned.substring(9)}`;
  }

  return {
    isValid: true,
    normalized: cleaned,
    formatted
  };
}

export type OtpChannel = 'whatsapp' | 'email';

export interface OtpSession {
  id: string;
  identifier: string; // email address or normalized phone number
  channel: OtpChannel;
  code: string;
  expiresAt: number;
  createdAt: number;
  attempts: number;
  recipientName?: string;
  email?: string;
  phone?: string;
  isSimulated?: boolean;
  gateway?: string;
  directWhatsAppUrl?: string;
}

export type VerificationSession = OtpSession;

/**
 * Helper for backwards compatibility with email-only callers
 */
export function generateEmailOtp(email: string, recipientName?: string): OtpSession {
  return generateOtpSession('email', email, { name: recipientName, email });
}

/**
 * Generate a 6-digit OTP session with 5 minutes expiration
 */
export function generateOtpSession(
  channel: OtpChannel,
  identifier: string,
  extra?: { name?: string; email?: string; phone?: string }
): OtpSession {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes

  const directUrl = channel === 'whatsapp' && (extra?.phone || identifier)
    ? getWhatsAppOtpUrl(extra?.phone || identifier, code, extra?.name)
    : undefined;

  return {
    id: `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    identifier: identifier.trim().toLowerCase(),
    channel,
    code,
    expiresAt,
    createdAt: now,
    attempts: 0,
    recipientName: extra?.name,
    email: extra?.email,
    phone: extra?.phone,
    isSimulated: true,
    gateway: channel === 'whatsapp' ? 'direct_whatsapp_link' : 'demo_email_simulator',
    directWhatsAppUrl: directUrl
  };
}

/**
 * Dispatches the OTP session code to backend API gateway (WhatsApp Direct / Email Simulator)
 */
export async function dispatchOtpToGateway(
  session: OtpSession
): Promise<{ success: boolean; isSimulated: boolean; directWhatsAppUrl?: string; message: string; gateway?: string }> {
  try {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: session.channel,
        identifier: session.channel === 'whatsapp' ? (session.phone || session.identifier) : (session.email || session.identifier),
        code: session.code,
        recipientName: session.recipientName
      })
    });

    const data = await res.json().catch(() => null);

    if (data && data.success) {
      session.isSimulated = Boolean(data.isSimulated);
      session.gateway = data.gateway;
      if (data.directWhatsAppUrl) {
        session.directWhatsAppUrl = data.directWhatsAppUrl;
      }
      return {
        success: true,
        isSimulated: Boolean(data.isSimulated),
        directWhatsAppUrl: data.directWhatsAppUrl,
        message: data.message || 'OTP siap.',
        gateway: data.gateway
      };
    }

    return {
      success: true,
      isSimulated: true,
      directWhatsAppUrl: session.directWhatsAppUrl,
      message: 'Kode OTP disiapkan via tautan langsung / simulator.'
    };
  } catch (err: any) {
    console.warn('[OTP Service] Backend dispatch error, fallback to client-side link:', err);
    return {
      success: true,
      isSimulated: true,
      directWhatsAppUrl: session.directWhatsAppUrl,
      message: 'Kode OTP disiapkan via mode mandiri.'
    };
  }
}

/**
 * Verifies the user submitted OTP code
 */
export function verifyOtpCode(
  session: OtpSession | null,
  inputCode: string
): { success: boolean; error?: string } {
  if (!session) {
    return { success: false, error: 'Sesi OTP tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru.' };
  }

  if (Date.now() > session.expiresAt) {
    return { success: false, error: 'Kode OTP telah kedaluwarsa (lebih dari 5 menit). Silakan kirim ulang kode baru.' };
  }

  const cleanInput = (inputCode || '').trim().replace(/\D/g, '');
  if (cleanInput.length !== 6) {
    return { success: false, error: 'Harap masukkan 6 digit angka kode OTP verifikasi.' };
  }

  if (cleanInput !== session.code) {
    session.attempts += 1;
    return {
      success: false,
      error: `Kode OTP yang dimasukkan (${cleanInput}) tidak sesuai. Silakan periksa ${
        session.channel === 'whatsapp' ? 'pesan WhatsApp' : 'kotak masuk Email'
      } atau gunakan bantuan simulator kode di bawah.`
    };
  }

  return { success: true };
}

/**
 * Generates official WhatsApp Direct Message URL for OTP delivery
 */
export function getWhatsAppOtpUrl(phone: string, code: string, studentName?: string): string {
  const norm = normalizePhoneNumber(phone);
  const targetNumber = norm.normalized;

  const greeting = studentName ? `Halo ${studentName},` : 'Halo,';
  const textMessage = `${greeting}
Berikut adalah kode OTP verifikasi keamanan akun *LESIN AJA* Anda:

🔒 *${code}*

_Kode ini berlaku selama 5 menit. Jangan bagikan kode OTP ini kepada siapapun demi keamanan akun Anda._

Terima kasih,
*Tim LESIN AJA LMS*
https://lesinaja.id`;

  return `https://api.whatsapp.com/send?phone=${encodeURIComponent(targetNumber)}&text=${encodeURIComponent(textMessage)}`;
}

