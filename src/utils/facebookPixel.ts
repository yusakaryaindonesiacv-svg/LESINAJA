import { Course, Transaction, FacebookPixelSettings } from '../types';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

let isInitialized = false;
let currentPixelId = '';
let currentTestEventCode = '';

/**
 * Injects Meta / Facebook Pixel base script into the document head safely.
 */
export function injectFacebookPixelScript(): void {
  if (typeof window === 'undefined') return;
  if (window.fbq) return;

  try {
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s);
      } else {
        b.head.appendChild(t);
      }
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
  } catch (err) {
    console.warn('[Facebook Pixel] Failed to inject base script:', err);
  }
}

/**
 * Initializes or updates Facebook Pixel with the given settings.
 */
export function initFacebookPixel(config?: FacebookPixelSettings): boolean {
  if (typeof window === 'undefined') return false;

  const cleanPixelId = (config?.pixelId || '').trim().replace(/[^0-9]/g, '');

  if (!config || !config.enabled || !cleanPixelId) {
    // Disabled or empty Pixel ID
    currentPixelId = '';
    currentTestEventCode = '';
    return false;
  }

  try {
    injectFacebookPixelScript();

    if (!window.fbq) return false;

    // Set test event code if provided
    if (config.testEventCode && config.testEventCode.trim()) {
      currentTestEventCode = config.testEventCode.trim();
      window.fbq('set', 'testEventCode', currentTestEventCode);
    }

    if (currentPixelId !== cleanPixelId) {
      currentPixelId = cleanPixelId;
      window.fbq('init', cleanPixelId);
      isInitialized = true;
      console.log(`[Facebook Pixel] Initialized with Pixel ID: ${cleanPixelId}`);

      if (config.trackPageView ?? true) {
        window.fbq('track', 'PageView');
      }
    }

    return true;
  } catch (err) {
    console.warn('[Facebook Pixel] Error initializing pixel:', err);
    return false;
  }
}

/**
 * Generic event tracker with safety checks
 */
export function trackFacebookCustomEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.fbq || !currentPixelId) return;

  try {
    if (params) {
      window.fbq('trackCustom', eventName, params);
    } else {
      window.fbq('trackCustom', eventName);
    }
  } catch (err) {
    console.warn(`[Facebook Pixel] Custom event "${eventName}" failed:`, err);
  }
}

/**
 * Tracks standard PageView event
 */
export function trackFBPageView(pageName?: string): void {
  if (typeof window === 'undefined' || !window.fbq || !currentPixelId) return;

  try {
    if (pageName) {
      window.fbq('track', 'PageView', {
        page_title: pageName,
        page_path: window.location.pathname
      });
    } else {
      window.fbq('track', 'PageView');
    }
  } catch (err) {
    console.warn('[Facebook Pixel] PageView error:', err);
  }
}

/**
 * Tracks ViewContent when student views a Course Detail page
 */
export function trackFBViewContent(course: Partial<Course>): void {
  if (typeof window === 'undefined' || !window.fbq || !currentPixelId || !course) return;

  try {
    window.fbq('track', 'ViewContent', {
      content_name: course.title || 'Kursus LESIN AJA',
      content_category: course.category || 'Online Course',
      content_ids: [course.id || 'course-item'],
      content_type: 'product',
      value: Number(course.price || course.minCustomPrice || 0),
      currency: 'IDR'
    });
    console.log(`[Facebook Pixel] Tracked ViewContent: "${course.title}"`);
  } catch (err) {
    console.warn('[Facebook Pixel] ViewContent error:', err);
  }
}

/**
 * Tracks InitiateCheckout when user opens checkout modal for single course or bundle
 */
export function trackFBInitiateCheckout(item: {
  id: string;
  title: string;
  price: number;
  category?: string;
  isBundle?: boolean;
}): void {
  if (typeof window === 'undefined' || !window.fbq || !currentPixelId || !item) return;

  try {
    window.fbq('track', 'InitiateCheckout', {
      content_name: item.title,
      content_category: item.category || (item.isBundle ? 'Course Bundle' : 'Online Course'),
      content_ids: [item.id],
      content_type: 'product',
      num_items: 1,
      value: Number(item.price || 0),
      currency: 'IDR'
    });
    console.log(`[Facebook Pixel] Tracked InitiateCheckout: "${item.title}" (Rp ${item.price})`);
  } catch (err) {
    console.warn('[Facebook Pixel] InitiateCheckout error:', err);
  }
}

/**
 * Tracks Purchase event when payment is successfully verified or created
 */
export function trackFBPurchase(transaction: Partial<Transaction>): void {
  if (typeof window === 'undefined' || !window.fbq || !currentPixelId || !transaction) return;

  try {
    const amount = Number(transaction.totalPayment || transaction.amount || 0);
    window.fbq('track', 'Purchase', {
      content_name: transaction.courseTitle || 'Pembelian Kursus LMS',
      content_ids: [transaction.courseId || 'item'],
      content_type: 'product',
      value: amount,
      currency: 'IDR',
      order_id: transaction.orderId || transaction.transactionCode,
      num_items: 1
    });
    console.log(`[Facebook Pixel] Tracked Purchase: "${transaction.courseTitle}" - Rp ${amount} (Order: ${transaction.transactionCode})`);
  } catch (err) {
    console.warn('[Facebook Pixel] Purchase error:', err);
  }
}

/**
 * Tracks CompleteRegistration event when a new student registers an account
 */
export function trackFBCompleteRegistration(user: {
  name?: string;
  email?: string;
  role?: string;
}): void {
  if (typeof window === 'undefined' || !window.fbq || !currentPixelId || !user) return;

  try {
    window.fbq('track', 'CompleteRegistration', {
      content_name: 'Pendaftaran Siswa Baru',
      status: 'success'
    });
    console.log(`[Facebook Pixel] Tracked CompleteRegistration: ${user.name || user.email}`);
  } catch (err) {
    console.warn('[Facebook Pixel] CompleteRegistration error:', err);
  }
}

/**
 * Tracks Lead event (e.g. consultations or checkout intent)
 */
export function trackFBLead(lead: {
  title: string;
  value?: number;
  name?: string;
  email?: string;
}): void {
  if (typeof window === 'undefined' || !window.fbq || !currentPixelId) return;

  try {
    window.fbq('track', 'Lead', {
      content_name: lead.title,
      value: Number(lead.value || 0),
      currency: 'IDR'
    });
    console.log(`[Facebook Pixel] Tracked Lead: "${lead.title}"`);
  } catch (err) {
    console.warn('[Facebook Pixel] Lead error:', err);
  }
}

/**
 * Dispatches an instant test event to verify Pixel active connection in Facebook Events Manager
 */
export function sendFBTestEvent(pixelId: string, testEventCode?: string): { success: boolean; message: string } {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Window context tidak tersedia.' };
  }

  const cleanId = (pixelId || '').trim().replace(/[^0-9]/g, '');
  if (!cleanId) {
    return { success: false, message: 'Pixel ID tidak valid atau kosong.' };
  }

  try {
    injectFacebookPixelScript();

    if (testEventCode && testEventCode.trim()) {
      window.fbq('set', 'testEventCode', testEventCode.trim());
    }

    window.fbq('init', cleanId);
    window.fbq('trackCustom', 'LesinAjaPixelTest', {
      test_timestamp: new Date().toISOString(),
      platform: 'LESIN AJA LMS',
      status: 'active_and_verified'
    });

    return {
      success: true,
      message: `Test event 'LesinAjaPixelTest' berhasil dikirim ke Meta Events Manager untuk Pixel ID ${cleanId}!`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal mengirim test event: ${err?.message || 'Error tidak diketahui'}`
    };
  }
}
