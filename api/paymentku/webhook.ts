// Vercel Serverless Function: Paymentku Webhook Receiver Endpoint
// Path: /api/paymentku/webhook

import * as crypto from 'crypto';

export default async function handler(req: any, res: any) {
  // Setup standard CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-PaymenKu-Signature, X-Signature, Idempotency-Key'
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
      message: 'Paymentku (paymentku.com) Webhook Endpoint is live, active, and listening on Vercel!',
      timestamp: new Date().toISOString(),
      instructions: 'Pasang URL ini pada menu Dashboard Paymentku -> Edit Proyek / Webhook -> Webhook Callback URL'
    });
  }

  // Handle POST notification from Paymentku
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

      console.log('⚡ [VERCEL PAYMENTKU WEBHOOK RECEIVED]', JSON.stringify(body, null, 2));

      const payloadData = body?.data || body;
      const orderId = payloadData?.order_id || body?.order_id || body?.orderId;
      const amount = Number(payloadData?.amount || payloadData?.total_amount || body?.amount) || 0;
      const rawStatus = String(payloadData?.status || body?.status || 'PAID').toUpperCase();
      const status = (rawStatus === 'PAID' || rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS') ? 'completed' : rawStatus.toLowerCase();
      const paymentMethod = payloadData?.payment_method || payloadData?.method || body?.payment_method || 'paymentku_qris';
      const completedAt = payloadData?.paid_at || payloadData?.completed_at || body?.completed_at || new Date().toISOString();

      // Signature verification if webhook secret is configured
      const signatureHeader = req.headers['x-paymenku-signature'] || req.headers['x-signature'];
      const webhookSecret = process.env.PAYMENTKU_WEBHOOK_SECRET || process.env.VITE_PAYMENTKU_WEBHOOK_SECRET || '';
      if (webhookSecret && signatureHeader) {
        const rawBodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const expectedSig = crypto.createHmac('sha256', webhookSecret).update(rawBodyStr).digest('hex');
        if (signatureHeader !== expectedSig && !signatureHeader.includes(expectedSig)) {
          console.warn('[Paymentku Webhook] Signature verification mismatch');
        }
      }

      // If Supabase is configured in environment variables, sync transaction status directly to database
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
          console.log(`[Webhook Supabase Sync] Updated Paymentku order ${orderId} status to ${status}`);
        } catch (dbErr) {
          console.warn('[Webhook Supabase Sync Note]:', dbErr);
        }
      }

      return res.status(200).json({
        status: 'success',
        message: 'Paymentku Webhook processed successfully',
        order_id: orderId,
        received_status: status,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error in Paymentku Webhook Handler:', err);
      return res.status(200).json({
        status: 'error',
        message: err.message || 'Webhook processed with notes'
      });
    }
  }

  return res.status(200).json({
    status: 'received',
    method: req.method,
    message: 'Paymentku endpoint online'
  });
}
