// Vercel Serverless Function: Pakasir Webhook Events Query
// Path: /api/pakasir/events

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // If Supabase is available, query recent completed transactions from Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseKey) {
      try {
        const queryUrl = `${supabaseUrl}/rest/v1/transactions?select=*&order=created_at.desc&limit=20`;
        const sbRes = await fetch(queryUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        if (sbRes.ok) {
          const rows = await sbRes.json();
          const events = rows.map((r: any) => ({
            amount: r.amount || r.total_payment,
            order_id: r.order_id || r.id,
            project: process.env.PAKASIR_PROJECT_SLUG || '',
            status: r.status,
            payment_method: r.payment_method || 'qris',
            completed_at: r.paid_at || r.created_at,
            received_at: r.created_at
          }));
          return res.status(200).json({ success: true, events });
        }
      } catch (sbErr) {
        console.warn('Supabase events query note:', sbErr);
      }
    }

    return res.status(200).json({ success: true, events: [] });
  } catch (err: any) {
    return res.status(200).json({ success: true, events: [], error: err.message });
  }
}
