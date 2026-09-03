import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_PROJECT_URL || env.SUPABASE_PROJECT_URL || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_KEY || env.SUPABASE_KEY || '';
  const pakasirSlug = env.VITE_PAKASIR_PROJECT_SLUG || env.PAKASIR_PROJECT_SLUG || '';
  const pakasirApiKey = env.VITE_PAKASIR_API_KEY || env.PAKASIR_API_KEY || '';
  const paymentkuApiKey = env.VITE_PAYMENTKU_API_KEY || env.PAYMENTKU_API_KEY || '';
  const paymentkuWebhookSecret = env.VITE_PAYMENTKU_WEBHOOK_SECRET || env.PAYMENTKU_WEBHOOK_SECRET || '';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.VITE_PAKASIR_PROJECT_SLUG': JSON.stringify(pakasirSlug),
      'process.env.VITE_PAKASIR_API_KEY': JSON.stringify(pakasirApiKey),
      'process.env.PAKASIR_PROJECT_SLUG': JSON.stringify(pakasirSlug),
      'process.env.PAKASIR_API_KEY': JSON.stringify(pakasirApiKey),
      'process.env.VITE_PAYMENTKU_API_KEY': JSON.stringify(paymentkuApiKey),
      'process.env.VITE_PAYMENTKU_WEBHOOK_SECRET': JSON.stringify(paymentkuWebhookSecret),
      'process.env.PAYMENTKU_API_KEY': JSON.stringify(paymentkuApiKey),
      'process.env.PAYMENTKU_WEBHOOK_SECRET': JSON.stringify(paymentkuWebhookSecret),
      'process.env': JSON.stringify({
        VITE_SUPABASE_URL: supabaseUrl,
        VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
        SUPABASE_URL: supabaseUrl,
        SUPABASE_ANON_KEY: supabaseAnonKey,
        VITE_PAKASIR_PROJECT_SLUG: pakasirSlug,
        VITE_PAKASIR_API_KEY: pakasirApiKey,
        PAKASIR_PROJECT_SLUG: pakasirSlug,
        PAKASIR_API_KEY: pakasirApiKey,
        VITE_PAYMENTKU_API_KEY: paymentkuApiKey,
        VITE_PAYMENTKU_WEBHOOK_SECRET: paymentkuWebhookSecret,
        PAYMENTKU_API_KEY: paymentkuApiKey,
        PAYMENTKU_WEBHOOK_SECRET: paymentkuWebhookSecret,
        NODE_ENV: mode
      }),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-pdf': ['jspdf', 'html-to-image'],
            'vendor-supabase': ['@supabase/supabase-js']
          },
        },
      },
    },
  };
});
