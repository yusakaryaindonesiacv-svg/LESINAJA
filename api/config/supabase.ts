// Vercel Serverless Function: Supabase Configuration Check
// Path: /api/config/supabase

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

  const projectUrl = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_PROJECT_URL ||
    process.env.SUPABASE_PROJECT_URL ||
    ''
  ).trim();

  const anonKey = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim();

  const isConfiguredInEnv = Boolean(projectUrl && anonKey);

  return res.status(200).json({
    projectUrl,
    anonKey,
    isConfiguredInEnv,
    source: isConfiguredInEnv ? 'secrets_env' : 'none'
  });
}
