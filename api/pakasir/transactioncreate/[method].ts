// Vercel Serverless Function: Pakasir Transaction Create Proxy
// Path: /api/pakasir/transactioncreate/[method]

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
    const methodParam = req.query?.method || body?.method || 'qris';
    const cleanMethod = Array.isArray(methodParam) ? methodParam[0] : methodParam;

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
        error: 'Parameter tidak lengkap: project, order_id, amount, dan api_key wajib diisi di request atau di Environment Variables Vercel (VITE_PAKASIR_PROJECT_SLUG & VITE_PAKASIR_API_KEY).'
      });
    }

    const pakasirUrl = `https://app.pakasir.com/api/transactioncreate/${encodeURIComponent(cleanMethod)}`;
    console.log(`[Vercel Serverless] Forwarding transactioncreate to Pakasir: ${pakasirUrl} for order ${order_id}`);

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
      console.warn(`[Vercel Serverless] Pakasir API error (${pakasirResponse.status}):`, data);
      return res.status(pakasirResponse.status).json(
        data || { error: `Pakasir API returned status ${pakasirResponse.status}` }
      );
    }

    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[Vercel Serverless] Error in transactioncreate proxy:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error while connecting to Pakasir API'
    });
  }
}
