import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
    
    // Auto-recover from chunk load errors (Vite dynamic import failures) once
    const errorMsg = error?.message || '';
    if (
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Importing a module script failed') ||
      errorMsg.includes('error loading dynamically imported module') ||
      errorMsg.includes('Loading chunk')
    ) {
      const reloadKey = 'lesinaja_last_chunk_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || (now - Number(lastReload) > 10000)) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
        return;
      }
    }

    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (e) {
      console.warn('Error clearing service workers on reload:', e);
    }
    window.location.reload();
  };

  handleResetAndClear = async () => {
    try {
      // Clear Service Worker caches if any
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Unregister Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      // Clear all lesinaja local storage keys
      const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('lesinaja') || k.startsWith('lesin_aja'));
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch (e) {
      console.warn('Error during reset:', e);
    }
    // Hard reload
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
                Aplikasi Sedang Memulihkan Diri
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Terjadi kendala saat memuat aset atau data aplikasi. Silakan tekan tombol di bawah untuk menyegarkan tampilan.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all duration-150 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                onClick={this.handleResetAndClear}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-150 border border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Bersihkan Cache Browser & Mulai Ulang</span>
              </button>
            </div>

            {this.state.error && (
              <details className="text-left bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 max-h-36 overflow-y-auto">
                <summary className="cursor-pointer font-bold text-slate-500 hover:text-slate-300">
                  Detail Teknis (Diagnostik)
                </summary>
                <p className="mt-2 font-mono text-rose-400 break-all">
                  {this.state.error.toString()}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
