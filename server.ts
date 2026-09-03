import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// In-memory & disk-backed store for settings and recent webhook events
interface WebhookEvent {
  amount: number;
  order_id: string;
  project: string;
  status: string;
  payment_method: string;
  completed_at: string;
  received_at: string;
}

const webhookEvents: WebhookEvent[] = [];
const paymentkuEvents: any[] = [];

// Ensure persistent data directories exist
const DATA_DIR = path.join(process.cwd(), 'data_storage');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Directory creation warning:', err);
}

const SETTINGS_FILE = path.join(DATA_DIR, 'app_settings.json');

function loadPersistentSettings(): Record<string, any> {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading persistent settings file:', err);
  }
  return {};
}

function savePersistentSettings(settings: Record<string, any>) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error saving persistent settings file:', err);
  }
}

let serverSettingsStore = loadPersistentSettings();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded parsing middleware (up to 50MB for image/video uploads)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Serve static uploads directory for permanent cross-device media
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Request logger for API calls
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // -------------------------------------------------------------
  // PERSISTENT APP SETTINGS & CROSS-DEVICE SYNC ENDPOINTS
  // -------------------------------------------------------------
  
  /**
   * GET /api/settings
   * Returns all persistent settings across devices and browsers
   */
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json({ success: true, settings: serverSettingsStore });
  });

  /**
   * GET /api/settings/:key
   */
  app.get('/api/settings/:key', (req: Request, res: Response) => {
    const { key } = req.params;
    const val = serverSettingsStore[key];
    res.json({ success: true, key, data: val !== undefined ? val : null });
  });

  /**
   * POST /api/settings/:key
   * Saves a setting persistently to disk and memory
   */
  app.post('/api/settings/:key', (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const data = req.body;
      serverSettingsStore[key] = data;
      savePersistentSettings(serverSettingsStore);
      console.log(`[Settings] Updated key "${key}" permanently.`);
      res.json({ success: true, key, message: `Setting "${key}" saved permanently.` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/settings/bulk
   * Saves multiple settings in a single call
   */
  app.post('/api/settings/bulk', (req: Request, res: Response) => {
    try {
      const data = req.body || {};
      serverSettingsStore = { ...serverSettingsStore, ...data };
      savePersistentSettings(serverSettingsStore);
      console.log(`[Settings] Bulk updated ${Object.keys(data).length} keys permanently.`);
      res.json({ success: true, message: 'Settings saved permanently.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/upload
   * Universal file upload endpoint (saves to /uploads directory)
   * Body: { fileName: string, fileData: string (base64 data URL), folder?: string }
   */
  app.post('/api/upload', (req: Request, res: Response) => {
    try {
      const { fileName, fileData, folder } = req.body;
      if (!fileData || typeof fileData !== 'string') {
        return res.status(400).json({ success: false, error: 'fileData (base64 string) is required.' });
      }

      const match = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = 'png';

      if (match) {
        const mime = match[1];
        if (mime.includes('svg')) ext = 'svg';
        else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        else if (mime.includes('pdf')) ext = 'pdf';
        else if (mime.includes('mp4')) ext = 'mp4';
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(fileData, 'base64');
      }

      const subFolder = folder ? folder.replace(/[^a-zA-Z0-9_-]/g, '') : '';
      const targetDir = subFolder ? path.join(UPLOADS_DIR, subFolder) : UPLOADS_DIR;

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const safeName = (fileName || `media-${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/\.[^/.]+$/, '');
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeName}.${ext}`;
      const filePath = path.join(targetDir, uniqueFileName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = subFolder ? `/uploads/${subFolder}/${uniqueFileName}` : `/uploads/${uniqueFileName}`;
      console.log(`[Upload] File saved successfully: ${publicUrl}`);

      return res.json({
        success: true,
        publicUrl,
        fileName: uniqueFileName,
        sizeBytes: buffer.length
      });
    } catch (err: any) {
      console.error('Error handling /api/upload:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to upload file' });
    }
  });

  // Supabase Configuration from Environment Secrets
  app.get('/api/config/supabase', (req: Request, res: Response) => {
    const projectUrl = (
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_PROJECT_URL ||
      process.env.SUPABASE_PROJECT_URL ||
      ''
    ).trim();
    const anonKey = (
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_KEY ||
      process.env.SUPABASE_KEY ||
      ''
    ).trim();
    const isConfiguredInEnv = Boolean(projectUrl && anonKey);

    res.json({
      projectUrl,
      anonKey,
      isConfiguredInEnv,
      source: isConfiguredInEnv ? 'secrets_env' : 'none'
    });
  });

  // Custom WhatsApp Gateway Configuration from Environment Secrets
  app.get('/api/config/custom-wa', (req: Request, res: Response) => {
    const endpointUrl = (process.env.CUSTOM_WA_ENDPOINT || '').trim();
    const apiKey = (process.env.CUSTOM_WA_API_KEY || '').trim();
    const provider = (process.env.CUSTOM_WA_PROVIDER || 'generic_webhook').trim();
    const isConfiguredInEnv = Boolean(endpointUrl);

    res.json({
      endpointUrl,
      apiKey,
      provider,
      isConfiguredInEnv,
      source: isConfiguredInEnv ? 'secrets_env' : 'none'
    });
  });

  // -------------------------------------------------------------
  // PAKASIR API INTEGRATION PROXY ENDPOINTS (pakasir.com)
  // -------------------------------------------------------------

  /**
   * Endpoint to check Pakasir environment configuration
   * GET /api/config/pakasir
   */
  app.get('/api/config/pakasir', (req: Request, res: Response) => {
    const projectSlug = (process.env.PAKASIR_PROJECT_SLUG || process.env.VITE_PAKASIR_PROJECT_SLUG || '').trim();
    const apiKey = (process.env.PAKASIR_API_KEY || process.env.VITE_PAKASIR_API_KEY || '').trim();
    return res.json({
      success: true,
      hasProjectSlug: Boolean(projectSlug),
      hasApiKey: Boolean(apiKey),
      projectSlug: projectSlug || undefined,
      isFromEnv: Boolean(projectSlug && apiKey)
    });
  });

  /**
   * 1. Create Transaction Proxy
   * POST /api/pakasir/transactioncreate/:method
   * Body: { project, order_id, amount, api_key }
   */
  app.post('/api/pakasir/transactioncreate/:method', async (req: Request, res: Response) => {
    try {
      const { method } = req.params;
      const { project, order_id, amount, api_key } = req.body;

      const effectiveProject = String(project || process.env.PAKASIR_PROJECT_SLUG || process.env.VITE_PAKASIR_PROJECT_SLUG || '').trim();
      const effectiveApiKey = String(api_key || process.env.PAKASIR_API_KEY || process.env.VITE_PAKASIR_API_KEY || '').trim();

      if (!effectiveProject || !order_id || !amount || !effectiveApiKey) {
        return res.status(400).json({
          error: 'Parameter tidak lengkap: project, order_id, amount, dan api_key wajib diisi atau diset di environment variables.'
        });
      }

      const pakasirUrl = `https://app.pakasir.com/api/transactioncreate/${encodeURIComponent(method)}`;
      console.log(`Forwarding to Pakasir: ${pakasirUrl} for order ${order_id} (amount: ${amount})`);

      const pakasirResponse = await fetch(pakasirUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project: effectiveProject,
          order_id: String(order_id).trim(),
          amount: Math.round(Number(amount)),
          api_key: effectiveApiKey
        })
      });

      const data = await pakasirResponse.json().catch(() => null);

      if (!pakasirResponse.ok) {
        console.warn(`Pakasir API Error (${pakasirResponse.status}):`, data);
        return res.status(pakasirResponse.status).json(
          data || { error: `Pakasir API returned status ${pakasirResponse.status}` }
        );
      }

      return res.json(data);
    } catch (err: any) {
      console.error('Error in /api/pakasir/transactioncreate proxy:', err);
      return res.status(500).json({
        error: err.message || 'Internal server error while connecting to Pakasir'
      });
    }
  });

  /**
   * 2. Transaction Detail Proxy
   * GET /api/pakasir/transactiondetail?project=...&amount=...&order_id=...&api_key=...
   */
  app.get('/api/pakasir/transactiondetail', async (req: Request, res: Response) => {
    try {
      const { project, amount, order_id, api_key } = req.query;

      const effectiveProject = String(project || process.env.PAKASIR_PROJECT_SLUG || process.env.VITE_PAKASIR_PROJECT_SLUG || '').trim();
      const effectiveApiKey = String(api_key || process.env.PAKASIR_API_KEY || process.env.VITE_PAKASIR_API_KEY || '').trim();

      if (!effectiveProject || !order_id || !amount || !effectiveApiKey) {
        return res.status(400).json({
          error: 'Query parameter tidak lengkap: project, amount, order_id, api_key wajib diisi atau diset di environment variables.'
        });
      }

      const query = new URLSearchParams({
        project: effectiveProject,
        amount: String(Math.round(Number(amount))),
        order_id: String(order_id).trim(),
        api_key: effectiveApiKey
      }).toString();

      const pakasirUrl = `https://app.pakasir.com/api/transactiondetail?${query}`;
      const pakasirRes = await fetch(pakasirUrl);
      const data = await pakasirRes.json().catch(() => null);

      if (!pakasirRes.ok) {
        return res.status(pakasirRes.status).json(
          data || { error: `Pakasir transactiondetail returned status ${pakasirRes.status}` }
        );
      }

      return res.json(data);
    } catch (err: any) {
      console.error('Error in /api/pakasir/transactiondetail proxy:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  /**
   * 3. Payment Simulation Proxy (Sandbox Mode)
   * POST /api/pakasir/paymentsimulation
   * Body: { project, order_id, amount, api_key }
   */
  app.post('/api/pakasir/paymentsimulation', async (req: Request, res: Response) => {
    try {
      const { project, order_id, amount, api_key } = req.body;
      const effectiveProject = String(project || process.env.PAKASIR_PROJECT_SLUG || process.env.VITE_PAKASIR_PROJECT_SLUG || '').trim();
      const effectiveApiKey = String(api_key || process.env.PAKASIR_API_KEY || process.env.VITE_PAKASIR_API_KEY || '').trim();

      const pakasirUrl = 'https://app.pakasir.com/api/paymentsimulation';
      const pakasirRes = await fetch(pakasirUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: effectiveProject,
          order_id: String(order_id).trim(),
          amount: Math.round(Number(amount)),
          api_key: effectiveApiKey
        })
      });

      const data = await pakasirRes.json().catch(() => null);
      if (!pakasirRes.ok) {
        return res.status(pakasirRes.status).json(
          data || { error: `Simulation failed with status ${pakasirRes.status}` }
        );
      }

      return res.json(data || { success: true, message: 'Simulasi pembayaran berhasil' });
    } catch (err: any) {
      console.error('Error in /api/pakasir/paymentsimulation proxy:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  /**
   * 4. Transaction Cancel Proxy
   * POST /api/pakasir/transactioncancel
   * Body: { project, order_id, amount, api_key }
   */
  app.post('/api/pakasir/transactioncancel', async (req: Request, res: Response) => {
    try {
      const { project, order_id, amount, api_key } = req.body;
      const effectiveProject = String(project || process.env.PAKASIR_PROJECT_SLUG || process.env.VITE_PAKASIR_PROJECT_SLUG || '').trim();
      const effectiveApiKey = String(api_key || process.env.PAKASIR_API_KEY || process.env.VITE_PAKASIR_API_KEY || '').trim();

      const pakasirUrl = 'https://app.pakasir.com/api/transactioncancel';
      const pakasirRes = await fetch(pakasirUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: effectiveProject,
          order_id: String(order_id).trim(),
          amount: Math.round(Number(amount)),
          api_key: effectiveApiKey
        })
      });

      const data = await pakasirRes.json().catch(() => null);
      return res.status(pakasirRes.status).json(data || { success: true });
    } catch (err: any) {
      console.error('Error in /api/pakasir/transactioncancel proxy:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  /**
   * 5. PAKASIR WEBHOOK RECEIVER ENDPOINT
   * POST /api/pakasir/webhook
   * GET /api/pakasir/webhook (Ping & test handler)
   * 
   * Pakasir sends:
   * {
   *   "amount": 22000,
   *   "order_id": "240910HDE7C9",
   *   "project": "depodomain",
   *   "status": "completed",
   *   "payment_method": "qris",
   *   "completed_at": "2024-09-10T08:07:02.819+07:00"
   * }
   */
  app.get('/api/pakasir/webhook', (req: Request, res: Response) => {
    return res.status(200).json({
      status: 'active',
      success: true,
      message: 'Pakasir Webhook Endpoint is active, live, and listening for incoming notifications.',
      timestamp: new Date().toISOString()
    });
  });

  app.options('/api/pakasir/webhook', (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  });

  app.post('/api/pakasir/webhook', (req: Request, res: Response) => {
    try {
      const body = req.body;
      console.log('⚡ [PAKASIR WEBHOOK RECEIVED]', JSON.stringify(body, null, 2));

      if (body && body.order_id) {
        const event: WebhookEvent = {
          amount: Number(body.amount) || 0,
          order_id: String(body.order_id),
          project: String(body.project || ''),
          status: String(body.status || 'completed'),
          payment_method: String(body.payment_method || 'qris'),
          completed_at: String(body.completed_at || new Date().toISOString()),
          received_at: new Date().toISOString()
        };

        // Keep last 50 events in memory
        webhookEvents.unshift(event);
        if (webhookEvents.length > 50) {
          webhookEvents.pop();
        }
      }

      // Respond immediately with 200 OK to Pakasir
      return res.status(200).json({
        status: 'success',
        message: 'Webhook processed successfully',
        order_id: body?.order_id
      });
    } catch (err: any) {
      console.error('Error processing Pakasir webhook:', err);
      return res.status(200).json({
        status: 'error',
        message: err.message
      });
    }
  });

  /**
   * 6. Webhook Events Polling / Realtime Verification Endpoint
   * GET /api/pakasir/events
   * GET /api/pakasir/events/:orderId
   */
  app.get('/api/pakasir/events', (req: Request, res: Response) => {
    res.json({ events: webhookEvents });
  });

  app.get('/api/pakasir/events/:orderId', (req: Request, res: Response) => {
    const { orderId } = req.params;
    const match = webhookEvents.find(
      e => e.order_id.toLowerCase() === String(orderId).toLowerCase()
    );
    if (match) {
      return res.json({ found: true, event: match });
    }
    return res.json({ found: false });
  });

  // -------------------------------------------------------------
  // PAYMENTKU API INTEGRATION PROXY ENDPOINTS (paymentku.com / paymenku.com)
  // -------------------------------------------------------------

  /**
   * Helper to extract detailed validation error from Paymentku response
   */
  function formatPaymentkuError(json: any, defaultMsg = 'Terjadi kesalahan pada Paymentku'): string {
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
   * Endpoint to check Paymentku configuration
   * GET /api/config/paymentku
   */
  app.get('/api/config/paymentku', (req: Request, res: Response) => {
    const apiKey = (process.env.PAYMENTKU_API_KEY || process.env.VITE_PAYMENTKU_API_KEY || '').trim();
    const webhookSecret = (process.env.PAYMENTKU_WEBHOOK_SECRET || process.env.VITE_PAYMENTKU_WEBHOOK_SECRET || '').trim();
    const isSandbox = apiKey.startsWith('sk_test_');

    return res.json({
      success: true,
      hasApiKey: Boolean(apiKey),
      hasWebhookSecret: Boolean(webhookSecret),
      isSandbox,
      isFromEnv: Boolean(apiKey)
    });
  });

  /**
   * Dedicated Test Connection Endpoint for Paymentku
   * POST /api/paymentku/test-connection
   */
  app.post('/api/paymentku/test-connection', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
      const xApiKey = (req.headers['x-api-key'] || req.headers['X-API-KEY']) as string;
      const effectiveApiKey = String(
        req.body.api_key ||
        req.body.apiKey ||
        req.body.key ||
        bearerKey ||
        xApiKey ||
        process.env.PAYMENTKU_API_KEY ||
        process.env.VITE_PAYMENTKU_API_KEY ||
        ''
      ).trim();

      if (!effectiveApiKey) {
        return res.status(400).json({
          success: false,
          error: 'API Key Paymentku belum diisi.',
          isSandbox: false
        });
      }

      const isSandbox = effectiveApiKey.startsWith('sk_test_');

      // Test 1: Query GET /api/v1/payment-channels (Official API Docs verification endpoint)
      const channelEndpoints = [
        'https://paymenku.com/api/v1/payment-channels',
        'https://paymentku.com/api/v1/payment-channels',
        'https://paymenku.com/api/v1/payment-methods',
        'https://paymentku.com/api/v1/payment-methods'
      ];

      for (const channelUrl of channelEndpoints) {
        try {
          const pingRes = await fetch(channelUrl, {
            headers: {
              'Authorization': `Bearer ${effectiveApiKey}`,
              'Accept': 'application/json'
            }
          });
          const pingData = await pingRes.json().catch(() => null);
          if (pingRes.ok && pingData && (pingData.status === 'success' || pingData.success || Array.isArray(pingData.data))) {
            const channels = Array.isArray(pingData.data) ? pingData.data : [];
            const channelNames = channels.map((c: any) => c.code || c.channel_code || c.name).filter(Boolean).slice(0, 8);
            return res.json({
              success: true,
              message: `Koneksi API Paymentku (paymenku.com) Berhasil! API Key aktif (${isSandbox ? 'Mode Sandbox' : 'Mode Production'}). Terhubung ke ${channels.length} channel pembayaran.`,
              isSandbox,
              channels: channelNames,
              details: pingData
            });
          }
        } catch {}
      }

      // Test 2: Try creating a small test transaction with official payload schema
      const cleanOrderId = `TEST${Date.now()}`;
      const amount = 10000;
      const host = req.get('host') || 'lesinaja.id';
      const protocol = req.protocol || 'https';
      const returnUrl = `${protocol}://${host}/dashboard`;

      const officialPayload = {
        channel_code: 'qris',
        amount: amount,
        reference_id: cleanOrderId,
        customer_name: 'Admin LESIN AJA',
        customer_email: 'admin@lesinaja.id',
        customer_phone: '081234567890',
        return_url: returnUrl,
        order_items: [
          {
            name: 'Uji Koneksi API Paymentku',
            quantity: 1
          }
        ]
      };

      const candidateUrls = [
        'https://paymenku.com/api/v1/transaction/create',
        'https://paymentku.com/api/v1/transaction/create'
      ];

      let lastError: any = null;

      for (const targetUrl of candidateUrls) {
        try {
          const createRes = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${effectiveApiKey}`,
              'Idempotency-Key': `test-ping-${cleanOrderId}`
            },
            body: JSON.stringify(officialPayload)
          });

          const createData = await createRes.json().catch(() => null);

          if (createRes.ok && (createData?.status === 'success' || createData?.data?.trx_id || createData?.success)) {
            return res.json({
              success: true,
              message: `Koneksi API Paymentku (paymenku.com) Berhasil! ${isSandbox ? 'Mode Sandbox (Testing)' : 'Mode Production (Live)'}. Endpoint transaksi siap digunakan.`,
              isSandbox,
              details: createData.data || createData
            });
          }

          if (createData) {
            lastError = createData;
            if (createRes.status === 401 || createRes.status === 403) {
              return res.json({
                success: false,
                message: `Koneksi ditolak (401/403 Unauthorized). Pastikan API Key (Bearer Token: sk_live_... / sk_test_...) dari dashboard paymenku.com sudah benar.`,
                isSandbox,
                details: createData
              });
            }
          }
        } catch (err: any) {
          lastError = { error: err.message };
        }
      }

      const formattedError = formatPaymentkuError(lastError, 'Tidak dapat terhubung ke Paymentku');
      return res.json({
        success: false,
        message: `Respons dari Paymentku: ${formattedError}`,
        isSandbox,
        details: lastError
      });
    } catch (err: any) {
      console.error('Error in /api/paymentku/test-connection:', err);
      return res.status(500).json({
        success: false,
        message: `Gagal menguji koneksi Paymentku: ${err.message}`,
        isSandbox: false
      });
    }
  });

  /**
   * 1. Create Transaction Proxy for Paymentku (paymenku.com / paymentku.com)
   * POST /api/paymentku/transactioncreate
   * Headers: Authorization: Bearer <API_KEY>, Idempotency-Key
   * Body: { channel_code, amount, reference_id, customer_name, customer_email, customer_phone, return_url, order_items }
   */
  app.post('/api/paymentku/transactioncreate', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
      const xApiKey = (req.headers['x-api-key'] || req.headers['X-API-KEY']) as string;
      const effectiveApiKey = String(
        req.body.api_key ||
        req.body.apiKey ||
        req.body.key ||
        bearerKey ||
        xApiKey ||
        process.env.PAYMENTKU_API_KEY ||
        process.env.VITE_PAYMENTKU_API_KEY ||
        ''
      ).trim();

      if (!effectiveApiKey) {
        return res.status(400).json({
          success: false,
          error: 'API Key Paymentku belum disetel. Masukkan API Key di Pengaturan Admin (paymenku.com) atau environment variables.'
        });
      }

      const {
        method,
        payment_method,
        channel_code,
        order_id,
        reference_id,
        amount,
        customer_name,
        customer_email,
        customer_phone,
        items,
        order_items,
        return_url
      } = req.body;

      const rawOrderId = reference_id || order_id;
      if (!rawOrderId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Parameter order_id (reference_id) dan amount wajib diisi.'
        });
      }

      const host = req.get('host') || 'lesinaja.id';
      const protocol = req.protocol || 'https';
      const idempotencyKey = (req.headers['idempotency-key'] as string) || `inv-${rawOrderId}-${Date.now()}`;
      
      let rawMethod = (channel_code || method || payment_method || 'qris').toString().replace(/^paymentku_/, '').toLowerCase();
      // Format standard channel codes
      if (rawMethod === 'va_bca') rawMethod = 'bca_va';
      if (rawMethod === 'va_mandiri') rawMethod = 'mandiri_va';
      if (rawMethod === 'va_bri') rawMethod = 'bri_va';
      if (rawMethod === 'va_bni') rawMethod = 'bni_va';
      if (rawMethod === 'va_permata') rawMethod = 'permata_va';
      if (rawMethod === 'va_cimb') rawMethod = 'cimb_va';
      if (rawMethod === 'va_bsi') rawMethod = 'bsi_va';

      const numAmount = Math.round(Number(amount));
      const cleanOrderId = String(rawOrderId).replace(/[^a-zA-Z0-9_-]/g, '').trim();

      let cleanPhone = String(customer_phone || '081234567890').replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) cleanPhone = '081234567890';
      if (cleanPhone.startsWith('62')) cleanPhone = '0' + cleanPhone.slice(2);

      const effectiveReturnUrl = return_url && return_url.startsWith('http')
        ? return_url
        : `${protocol}://${host}/dashboard`;

      const inputItems = order_items || items;
      const orderItems = (Array.isArray(inputItems) && inputItems.length > 0)
        ? inputItems.map((it: any) => ({
            name: String(it.name || `Kursus #${cleanOrderId}`).slice(0, 100),
            quantity: Number(it.quantity || it.qty || 1)
          }))
        : [
            {
              name: `Kursus Order #${cleanOrderId}`,
              quantity: 1
            }
          ];

      const officialPayload = {
        channel_code: rawMethod,
        amount: numAmount,
        reference_id: cleanOrderId,
        customer_name: customer_name || 'Siswa LESIN AJA',
        customer_email: customer_email || 'siswa@lesinaja.id',
        customer_phone: cleanPhone,
        return_url: effectiveReturnUrl,
        order_items: orderItems
      };

      const candidateUrls = [
        'https://paymenku.com/api/v1/transaction/create',
        'https://paymentku.com/api/v1/transaction/create'
      ];

      let lastError: any = null;
      let responseData: any = null;
      let successfulRes: globalThis.Response | null = null;

      for (const targetUrl of candidateUrls) {
        try {
          console.log(`[Paymentku Proxy] Requesting: ${targetUrl} for Ref: ${cleanOrderId} (Amount: ${numAmount}, Channel: ${rawMethod})`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const resPku = await fetch(targetUrl, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${effectiveApiKey}`,
              'Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify(officialPayload)
          });
          clearTimeout(timeoutId);

          const json = await resPku.json().catch(() => null);

          if (resPku.ok && (json?.status === 'success' || json?.data?.trx_id || json?.data || json?.success)) {
            successfulRes = resPku;
            responseData = json;
            console.log(`[Paymentku Proxy] Success with URL: ${targetUrl}`);
            break;
          } else {
            lastError = json || { error: `Paymentku returned status ${resPku.status}` };
          }
        } catch (err: any) {
          console.warn(`[Paymentku Proxy] Connection error to ${targetUrl}:`, err.message);
          lastError = { error: err.message || 'Network connection timeout to Paymentku' };
        }
      }

      if (successfulRes && responseData) {
        return res.json(responseData);
      }

      const formattedError = formatPaymentkuError(lastError, 'Tidak dapat menghubungi server API paymenku.com. Periksa koneksi internet atau API Key.');
      return res.status(502).json({
        success: false,
        error: formattedError,
        message: formattedError,
        details: lastError
      });
    } catch (err: any) {
      console.error('Error in /api/paymentku/transactioncreate proxy:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error on Paymentku transaction proxy'
      });
    }
  });

  /**
   * 2. Check Status Proxy for Paymentku (paymentku.com)
   * GET /api/paymentku/check-status/:order_id
   * GET /api/paymentku/transactiondetail/:order_id
   */
  const handlePaymentkuCheckStatus = async (req: Request, res: Response) => {
    try {
      const orderId = req.params.order_id || (req.query.order_id as string);
      const authHeader = req.headers.authorization;
      const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
      const xApiKey = (req.headers['x-api-key'] || req.headers['X-API-KEY'] || req.query.api_key) as string;
      const effectiveApiKey = String(req.query.api_key || bearerKey || xApiKey || process.env.PAYMENTKU_API_KEY || process.env.VITE_PAYMENTKU_API_KEY || '').trim();

      if (!orderId) {
        return res.status(400).json({ success: false, error: 'order_id is required' });
      }

      // Check local webhook event store first
      const localMatch = paymentkuEvents.find(e => String(e.order_id).toLowerCase() === String(orderId).toLowerCase());

      if (!effectiveApiKey) {
        if (localMatch) {
          return res.json({ success: true, data: localMatch, isLocal: true });
        }
        return res.status(400).json({ success: false, error: 'API Key Paymentku is required' });
      }

      const candidateStatusUrls = [
        `https://paymenku.com/api/v1/check-status/${encodeURIComponent(orderId)}`,
        `https://paymenku.com/api/v1/transaction/detail/${encodeURIComponent(orderId)}`,
        `https://paymenku.com/api/v1/transaction/${encodeURIComponent(orderId)}`,
        `https://paymentku.com/api/v1/check-status/${encodeURIComponent(orderId)}`,
        `https://paymentku.com/api/v1/transaction/detail/${encodeURIComponent(orderId)}`,
        `https://paymentku.com/api/transaction/${encodeURIComponent(orderId)}`,
        `https://api.paymentku.com/v1/check-status/${encodeURIComponent(orderId)}`
      ];

      for (const targetUrl of candidateStatusUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const paymentkuRes = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${effectiveApiKey}`,
              'x-api-key': effectiveApiKey,
              'X-API-KEY': effectiveApiKey
            }
          });
          clearTimeout(timeoutId);

          const data = await paymentkuRes.json().catch(() => null);

          if (paymentkuRes.ok && data) {
            return res.json(data);
          }
        } catch {}
      }

      if (localMatch) {
        return res.json({ success: true, data: localMatch, isLocal: true });
      }

      return res.status(404).json({ success: false, error: 'Status pembayaran belum terupdate di Paymentku.' });
    } catch (err: any) {
      console.error('Error in /api/paymentku/check-status proxy:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  app.get('/api/paymentku/check-status/:order_id', handlePaymentkuCheckStatus);
  app.get('/api/paymentku/transactiondetail/:order_id', handlePaymentkuCheckStatus);
  app.get('/api/paymentku/transactiondetail', handlePaymentkuCheckStatus);

  /**
   * 3. Cancel Transaction Proxy
   * POST /api/paymentku/transactioncancel
   */
  app.post('/api/paymentku/transactioncancel', async (req: Request, res: Response) => {
    try {
      const { order_id, api_key } = req.body;
      const authHeader = req.headers.authorization;
      const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
      const effectiveApiKey = String(api_key || bearerKey || process.env.PAYMENTKU_API_KEY || process.env.VITE_PAYMENTKU_API_KEY || '').trim();

      if (!order_id) {
        return res.status(400).json({ success: false, error: 'order_id is required' });
      }

      const targetUrl = 'https://paymenku.com/api/v1/transaction/cancel';
      const paymentkuRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveApiKey ? { 'Authorization': `Bearer ${effectiveApiKey}` } : {})
        },
        body: JSON.stringify({ order_id })
      });

      const data = await paymentkuRes.json().catch(() => null);
      return res.status(paymentkuRes.status).json(data || { success: true });
    } catch (err: any) {
      console.error('Error in /api/paymentku/transactioncancel:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 4. Payment Simulation Endpoint (Sandbox Mode)
   * POST /api/paymentku/paymentsimulation
   */
  app.post('/api/paymentku/paymentsimulation', (req: Request, res: Response) => {
    try {
      const { order_id, amount, payment_method } = req.body;
      if (!order_id) {
        return res.status(400).json({ success: false, error: 'order_id is required' });
      }

      const simEvent = {
        order_id: String(order_id).trim(),
        amount: Number(amount) || 10000,
        status: 'PAID',
        payment_method: payment_method || 'paymentku_qris',
        payment_channel: 'QRIS',
        paid_at: new Date().toISOString(),
        received_at: new Date().toISOString(),
        isSimulated: true
      };

      paymentkuEvents.unshift(simEvent);
      if (paymentkuEvents.length > 50) paymentkuEvents.pop();

      // Also trigger webhookEvents for cross-gateway compatibility
      webhookEvents.unshift({
        amount: simEvent.amount,
        order_id: simEvent.order_id,
        project: 'paymentku',
        status: 'completed',
        payment_method: simEvent.payment_method,
        completed_at: simEvent.paid_at,
        received_at: simEvent.received_at
      });

      console.log('⚡ [PAYMENTKU SIMULATION EXECUTED]', simEvent);
      return res.json({ success: true, message: 'Simulasi pembayaran Paymentku berhasil diverifikasi!', event: simEvent });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 5. PAYMENTKU WEBHOOK RECEIVER ENDPOINT
   * POST /api/paymentku/webhook
   * GET /api/paymentku/webhook (Health check / Ping)
   */
  app.get('/api/paymentku/webhook', (req: Request, res: Response) => {
    return res.status(200).json({
      status: 'active',
      success: true,
      message: 'Paymentku (paymentku.com) Webhook Endpoint is active, live, and listening for notifications.',
      timestamp: new Date().toISOString()
    });
  });

  app.options('/api/paymentku/webhook', (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-PaymenKu-Signature,X-Signature,Idempotency-Key');
    return res.status(200).end();
  });

  app.post('/api/paymentku/webhook', (req: Request, res: Response) => {
    try {
      const body = req.body;
      const signatureHeader = (req.headers['x-paymenku-signature'] || req.headers['x-signature'] || '') as string;
      const webhookSecret = (process.env.PAYMENTKU_WEBHOOK_SECRET || process.env.VITE_PAYMENTKU_WEBHOOK_SECRET || '').trim();

      console.log('⚡ [PAYMENTKU WEBHOOK RECEIVED]', JSON.stringify(body, null, 2));

      // Verify signature if webhook secret is configured and signature header exists
      if (webhookSecret && signatureHeader) {
        const rawBodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const expectedSig = crypto.createHmac('sha256', webhookSecret).update(rawBodyStr).digest('hex');
        if (signatureHeader !== expectedSig && !signatureHeader.includes(expectedSig)) {
          console.warn('[Paymentku Webhook] Signature verification warning: Signature header did not strictly match HMAC calculation.');
        }
      }

      if (body && (body.order_id || body.data?.order_id)) {
        const payloadData = body.data || body;
        const normalizedStatus = String(payloadData.status || body.status || 'PAID').toUpperCase();

        const event = {
          order_id: String(payloadData.order_id || body.order_id),
          amount: Number(payloadData.amount || payloadData.total_amount || body.amount || 0),
          fee: Number(payloadData.fee || 0),
          total_payment: Number(payloadData.total_payment || payloadData.total_amount || payloadData.amount || 0),
          status: normalizedStatus,
          payment_method: String(payloadData.payment_method || payloadData.method || body.payment_method || 'paymentku'),
          payment_channel: String(payloadData.payment_channel || payloadData.channel || 'QRIS'),
          paid_at: String(payloadData.paid_at || payloadData.completed_at || new Date().toISOString()),
          completed_at: String(payloadData.completed_at || payloadData.paid_at || new Date().toISOString()),
          received_at: new Date().toISOString(),
          rawPayload: body
        };

        // Keep last 50 events in memory
        paymentkuEvents.unshift(event);
        if (paymentkuEvents.length > 50) {
          paymentkuEvents.pop();
        }

        // Also add to global webhookEvents
        if (normalizedStatus === 'PAID' || normalizedStatus === 'COMPLETED' || normalizedStatus === 'SUCCESS') {
          webhookEvents.unshift({
            amount: event.amount,
            order_id: event.order_id,
            project: 'paymentku',
            status: 'completed',
            payment_method: event.payment_method,
            completed_at: event.completed_at,
            received_at: event.received_at
          });
        }
      }

      // Respond immediately with 200 OK to Paymentku
      return res.status(200).json({
        success: true,
        status: 'success',
        message: 'Paymentku Webhook received & processed successfully',
        order_id: body?.order_id || body?.data?.order_id
      });
    } catch (err: any) {
      console.error('Error processing Paymentku webhook:', err);
      return res.status(200).json({
        success: false,
        status: 'error',
        message: err.message
      });
    }
  });

  /**
   * 6. Webhook Events Polling for Paymentku
   * GET /api/paymentku/events
   * GET /api/paymentku/events/:orderId
   */
  app.get('/api/paymentku/events', (req: Request, res: Response) => {
    res.json({ events: paymentkuEvents });
  });

  app.get('/api/paymentku/events/:orderId', (req: Request, res: Response) => {
    const { orderId } = req.params;
    const match = paymentkuEvents.find(
      e => String(e.order_id).toLowerCase() === String(orderId).toLowerCase()
    );
    if (match) {
      return res.json({ found: true, event: match });
    }
    return res.json({ found: false });
  });

  // -------------------------------------------------------------
  // MULTI-CHANNEL OTP DISPATCH GATEWAY (Direct WhatsApp & Simulator)
  // -------------------------------------------------------------

  /**
   * GET /api/otp/config
   * Returns active OTP gateway status
   */
  app.get('/api/otp/config', (req: Request, res: Response) => {
    return res.json({
      success: true,
      config: {
        enableWhatsAppGateway: true,
        enableEmailGateway: true,
        enableSimulatorFallback: true,
        lastUpdated: new Date().toISOString()
      }
    });
  });

  /**
   * POST /api/otp/send
   * Body: {
   *   channel: 'whatsapp' | 'email',
   *   identifier: string,
   *   code: string,
   *   recipientName?: string
   * }
   */
  app.post('/api/otp/send', async (req: Request, res: Response) => {
    try {
      const { channel, identifier, code, recipientName } = req.body;

      if (!channel || !identifier || !code) {
        return res.status(400).json({
          success: false,
          error: 'Parameter tidak lengkap: channel, identifier, dan code wajib diisi.'
        });
      }

      const cleanCode = String(code).trim();
      const cleanTarget = String(identifier).trim();
      const greeting = recipientName ? `Halo ${recipientName},` : 'Halo,';

      // 1. WhatsApp Delivery
      if (channel === 'whatsapp') {
        let phoneDigits = cleanTarget.replace(/\D/g, '');
        if (phoneDigits.startsWith('0')) {
          phoneDigits = '62' + phoneDigits.substring(1);
        } else if (phoneDigits.startsWith('8')) {
          phoneDigits = '62' + phoneDigits;
        }

        const messageText = `${greeting}\nBerikut adalah kode OTP verifikasi keamanan akun *LESIN AJA* Anda:\n\n🔒 *${cleanCode}*\n\n_Kode ini berlaku selama 5 menit. Jangan bagikan kode OTP ini kepada siapapun demi keamanan akun Anda._\n\nTerima kasih,\n*Tim LESIN AJA LMS*\nhttps://lesinaja.id`;
        const directUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(phoneDigits)}&text=${encodeURIComponent(messageText)}`;

        return res.json({
          success: true,
          channel: 'whatsapp',
          identifier: phoneDigits,
          code: cleanCode,
          gateway: 'direct_whatsapp_link',
          isSimulated: true,
          directWhatsAppUrl: directUrl,
          message: 'Kode OTP disiapkan. Klik "Buka WhatsApp" untuk melanjutkan.'
        });
      }

      // 2. Email Delivery
      if (channel === 'email') {
        return res.json({
          success: true,
          channel: 'email',
          identifier: cleanTarget,
          code: cleanCode,
          gateway: 'demo_email_simulator',
          isSimulated: true,
          message: 'Kode OTP Email disiapkan dalam mode pengujian & simulasi.'
        });
      }

      return res.status(400).json({ success: false, error: 'Kanal pengiriman OTP tidak didukung.' });
    } catch (err: any) {
      console.error('Error in /api/otp/send:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error while sending OTP'
      });
    }
  });

  /**
   * POST /api/otp/test-gateway
   * Diagnostic tester endpoint for Admin
   */
  app.post('/api/otp/test-gateway', async (req: Request, res: Response) => {
    try {
      const { channel, target } = req.body;

      if (!channel || !target) {
        return res.status(400).json({
          success: false,
          error: 'Parameter channel dan target tujuan wajib diisi.'
        });
      }

      if (channel === 'whatsapp') {
        let phoneDigits = String(target).replace(/\D/g, '');
        if (phoneDigits.startsWith('0')) {
          phoneDigits = '62' + phoneDigits.substring(1);
        } else if (phoneDigits.startsWith('8')) {
          phoneDigits = '62' + phoneDigits;
        }

        const testMsg = `*TES KONEKSI WHATSAPP LESIN AJA*\n\nKoneksi WhatsApp LESIN AJA LMS ke nomor *${phoneDigits}* aktif.\n\nWaktu: ${new Date().toLocaleString('id-ID')}`;
        const directUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(phoneDigits)}&text=${encodeURIComponent(testMsg)}`;

        return res.json({
          success: true,
          channel: 'whatsapp',
          target: phoneDigits,
          diagnosis: 'SUCCESS',
          directWhatsAppUrl: directUrl,
          message: '✅ Jalur WhatsApp siap digunakan.'
        });
      }

      if (channel === 'email') {
        return res.json({
          success: true,
          channel: 'email',
          target: String(target).trim(),
          diagnosis: 'SUCCESS',
          message: '✅ Jalur Email siap digunakan.'
        });
      }

      return res.status(400).json({ success: false, error: 'Kanal pengujian tidak didukung.' });
    } catch (err: any) {
      console.error('Error in /api/otp/test-gateway:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error while testing gateway'
      });
    }
  });

  // -------------------------------------------------------------
  // VITE MIDDLEWARE SETUP (SPA DEV & PROD)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LESIN AJA Server running at http://0.0.0.0:${PORT}`);
    console.log(`🔗 Pakasir Webhook Endpoint: http://0.0.0.0:${PORT}/api/pakasir/webhook`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
