// Vercel Serverless Function: Paymentku Check Status Proxy
// Path: /api/paymentku/checkstatus

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const orderId = req.query.order_id || req.query.orderId;
  const authHeader = req.headers.authorization;
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
  const effectiveApiKey = String(req.query.api_key || bearerKey || process.env.PAYMENTKU_API_KEY || process.env.VITE_PAYMENTKU_API_KEY || '').trim();

  if (!orderId) {
    return res.status(400).json({ success: false, error: 'order_id is required' });
  }

  if (!effectiveApiKey) {
    return res.status(400).json({ success: false, error: 'API Key Paymentku is required' });
  }

  try {
    const targetUrl = `https://paymenku.com/api/v1/check-status/${encodeURIComponent(orderId)}`;
    const paymentkuRes = await fetch(targetUrl, {
      headers: {
        'Authorization': `Bearer ${effectiveApiKey}`
      }
    });

    const data = await paymentkuRes.json().catch(() => null);
    return res.status(paymentkuRes.status).json(data || { success: false });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
