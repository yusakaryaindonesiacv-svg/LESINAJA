// Vercel Serverless Function: Pakasir Transaction Detail Proxy
// Path: /api/pakasir/transactiondetail

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { project, amount, order_id, api_key } = req.query || {};

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

    if (!effectiveProject || !order_id || !amount || !effectiveApiKey) {
      return res.status(400).json({
        error: 'Query parameter tidak lengkap: project, amount, order_id, api_key wajib diisi atau diset di Environment Variables Vercel.'
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

    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[Vercel Serverless] Error in transactiondetail:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
