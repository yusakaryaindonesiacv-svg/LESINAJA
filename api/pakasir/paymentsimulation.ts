// Vercel Serverless Function: Pakasir Payment Simulation Proxy
// Path: /api/pakasir/paymentsimulation

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const { project, order_id, amount, api_key } = body || {};
    const effectiveProject = String(
      project ||
      process.env.PAKASIR_PROJECT_SLUG ||
      process.env.VITE_PAKASIR_PROJECT_SLUG ||
      ''
    ).trim();

    const effectiveApiKey = String(
      api_key ||
      process.env.PAKASIR_API_KEY ||
      process.env.VITE_PAKASIR_API_KEY ||
      ''
    ).trim();

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

    return res.status(200).json(data || { success: true, message: 'Simulasi pembayaran berhasil' });
  } catch (err: any) {
    console.error('[Vercel Serverless] Error in paymentsimulation proxy:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
