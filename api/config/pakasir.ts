// Vercel Serverless Function: Pakasir Configuration Check
// Path: /api/config/pakasir

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

  const projectSlug = (process.env.PAKASIR_PROJECT_SLUG || process.env.VITE_PAKASIR_PROJECT_SLUG || '').trim();
  const apiKey = (process.env.PAKASIR_API_KEY || process.env.VITE_PAKASIR_API_KEY || '').trim();

  return res.status(200).json({
    success: true,
    hasProjectSlug: Boolean(projectSlug),
    hasApiKey: Boolean(apiKey),
    projectSlug: projectSlug || undefined,
    isFromEnv: Boolean(projectSlug && apiKey)
  });
}
