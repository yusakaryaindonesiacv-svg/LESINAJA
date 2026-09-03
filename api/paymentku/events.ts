// Vercel Serverless Function: Paymentku Events Polling Endpoint
// Path: /api/paymentku/events

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { orderId } = req.query;

  // If Supabase is available, query transactions table
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (supabaseUrl && supabaseKey && orderId) {
    try {
      const resDb = await fetch(`${supabaseUrl}/rest/v1/transactions?order_id=eq.${encodeURIComponent(orderId)}&select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const data = await resDb.json();
      if (Array.isArray(data) && data.length > 0) {
        const tx = data[0];
        return res.status(200).json({
          found: true,
          event: {
            order_id: tx.order_id,
            status: tx.status,
            amount: tx.total_payment || tx.amount,
            completed_at: tx.paid_at || tx.created_at
          }
        });
      }
    } catch (e) {
      console.warn('Error fetching events from database:', e);
    }
  }

  return res.status(200).json({ events: [], found: false });
}
