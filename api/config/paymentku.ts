// Vercel Serverless Function: Paymentku Config Check
// Path: /api/config/paymentku

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = (process.env.PAYMENTKU_API_KEY || process.env.VITE_PAYMENTKU_API_KEY || '').trim();
  const webhookSecret = (process.env.PAYMENTKU_WEBHOOK_SECRET || process.env.VITE_PAYMENTKU_WEBHOOK_SECRET || '').trim();
  const isSandbox = apiKey.startsWith('sk_test_');

  return res.status(200).json({
    success: true,
    hasApiKey: Boolean(apiKey),
    hasWebhookSecret: Boolean(webhookSecret),
    isSandbox,
    isFromEnv: Boolean(apiKey)
  });
}
