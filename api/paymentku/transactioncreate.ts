// Vercel Serverless Function: Paymentku Transaction Create Proxy
// Path: /api/paymentku/transactioncreate

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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Idempotency-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const authHeader = req.headers.authorization;
    const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
    const xApiKey = req.headers['x-api-key'] || req.headers['X-API-KEY'];
    const effectiveApiKey = String(req.body?.api_key || req.body?.apiKey || req.body?.key || bearerKey || xApiKey || process.env.PAYMENTKU_API_KEY || process.env.VITE_PAYMENTKU_API_KEY || '').trim();

    if (!effectiveApiKey) {
      return res.status(400).json({
        success: false,
        error: 'API Key Paymentku belum disetel. Sediakan di Authorization header, body, atau environment variables.'
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
    } = req.body || {};

    const rawOrderId = reference_id || order_id;
    if (!rawOrderId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Parameter order_id (reference_id) dan amount wajib diisi.'
      });
    }

    const cleanOrderId = String(rawOrderId).replace(/[^a-zA-Z0-9_-]/g, '').trim();
    const numAmount = Math.round(Number(amount));
    
    let rawMethod = (channel_code || method || payment_method || 'qris').toString().replace(/^paymentku_/, '').toLowerCase();
    if (rawMethod === 'va_bca') rawMethod = 'bca_va';
    if (rawMethod === 'va_mandiri') rawMethod = 'mandiri_va';
    if (rawMethod === 'va_bri') rawMethod = 'bri_va';
    if (rawMethod === 'va_bni') rawMethod = 'bni_va';
    if (rawMethod === 'va_permata') rawMethod = 'permata_va';
    if (rawMethod === 'va_cimb') rawMethod = 'cimb_va';
    if (rawMethod === 'va_bsi') rawMethod = 'bsi_va';

    const idempotencyKey = req.headers['idempotency-key'] || `inv-${cleanOrderId}-${Date.now()}`;

    let cleanPhone = String(customer_phone || '081234567890').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) cleanPhone = '081234567890';
    if (cleanPhone.startsWith('62')) cleanPhone = '0' + cleanPhone.slice(2);

    const inputItems = order_items || items;
    const orderItemsList = (Array.isArray(inputItems) && inputItems.length > 0)
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

    const effectiveReturnUrl = return_url && return_url.startsWith('http')
      ? return_url
      : `https://${req.headers.host || 'lesinaja.id'}/dashboard`;

    const officialPayload = {
      channel_code: rawMethod,
      amount: numAmount,
      reference_id: cleanOrderId,
      customer_name: customer_name || 'Siswa LESIN AJA',
      customer_email: customer_email || 'siswa@lesinaja.id',
      customer_phone: cleanPhone,
      return_url: effectiveReturnUrl,
      order_items: orderItemsList
    };

    const targetUrls = [
      'https://paymenku.com/api/v1/transaction/create',
      'https://paymentku.com/api/v1/transaction/create'
    ];

    let lastError: any = null;
    let successfulData: any = null;

    for (const targetUrl of targetUrls) {
      try {
        const paymentkuRes = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${effectiveApiKey}`,
            'Idempotency-Key': String(idempotencyKey)
          },
          body: JSON.stringify(officialPayload)
        });

        const responseData = await paymentkuRes.json().catch(() => null);

        if (paymentkuRes.ok && (responseData?.status === 'success' || responseData?.data?.trx_id || responseData?.success)) {
          successfulData = responseData;
          break;
        }

        if (responseData) {
          lastError = responseData;
        }
      } catch (e: any) {
        lastError = { error: e.message };
      }
      if (successfulData) break;
    }

    if (successfulData) {
      return res.status(200).json(successfulData);
    }

    const formatted = formatPaymentkuError(lastError, 'Tidak dapat menghubungi server API paymenku.com');
    return res.status(502).json({
      success: false,
      error: formatted,
      message: formatted,
      details: lastError
    });
  } catch (err: any) {
    console.error('Error in /api/paymentku/transactioncreate serverless:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while connecting to Paymentku'
    });
  }
}
