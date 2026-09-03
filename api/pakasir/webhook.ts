// Vercel Serverless Function: Pakasir Webhook Receiver Endpoint
// Path: /api/pakasir/webhook

export default async function handler(req: any, res: any) {
  // Setup standard CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle browser preflight CORS check
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET / Ping test request
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      success: true,
      message: 'Pakasir Webhook Endpoint is live, active, and listening on Vercel!',
      timestamp: new Date().toISOString(),
      instructions: 'Pasang URL ini pada menu Dashboard Pakasir -> Edit Proyek -> Webhook URL'
    });
  }

  // Handle POST notification from Pakasir or Webhook Tester
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }

      console.log('⚡ [VERCEL PAKASIR WEBHOOK RECEIVED]', JSON.stringify(body, null, 2));

      const orderId = body?.order_id || body?.orderId;
      const amount = Number(body?.amount) || 0;
      const status = body?.status || 'completed';
      const paymentMethod = body?.payment_method || body?.paymentMethod || 'qris';
      const completedAt = body?.completed_at || new Date().toISOString();

      // If Supabase is configured in environment variables, optionally sync transaction status directly to database
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

      if (supabaseUrl && supabaseKey && orderId) {
        try {
          const updateUrl = `${supabaseUrl}/rest/v1/transactions?order_id=eq.${encodeURIComponent(orderId)}`;
          await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              status: status,
              paid_at: completedAt,
              total_payment: amount
            })
          });
          console.log(`[Webhook Supabase Sync] Updated order ${orderId} status to ${status}`);
        } catch (dbErr) {
          console.warn('[Webhook Supabase Sync Note]:', dbErr);
        }
      }

      // Always return 200 OK to Pakasir so it acknowledges successful delivery
      return res.status(200).json({
        status: 'success',
        message: 'Webhook processed successfully',
        order_id: orderId,
        received_status: status,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error in Pakasir Webhook Handler:', err);
      // Return 200 with error notes to avoid repeated retry storms from gateway
      return res.status(200).json({
        status: 'error',
        message: err.message || 'Webhook processed with notes'
      });
    }
  }

  // Any other methods
  return res.status(200).json({
    status: 'received',
    method: req.method,
    message: 'Endpoint online'
  });
}
