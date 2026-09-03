import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FacebookPixelSettings } from '../../types';
import { initFacebookPixel, sendFBTestEvent } from '../../utils/facebookPixel';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Save,
  Send,
  Eye,
  ShieldCheck,
  Globe,
  Sparkles,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';

export const FacebookPixelSettingsView: React.FC = () => {
  const { websiteSettings, updateWebsiteSettings, saveWebsiteSettingsToSupabase, showToast } = useApp();

  const currentPixel: FacebookPixelSettings = websiteSettings.facebookPixel || {
    enabled: false,
    pixelId: '',
    testEventCode: '',
    trackPageView: true,
    trackViewContent: true,
    trackInitiateCheckout: true,
    trackPurchase: true,
    trackCompleteRegistration: true,
    trackLead: true
  };

  const [pixelState, setPixelState] = useState<FacebookPixelSettings>(currentPixel);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleToggle = (enabled: boolean) => {
    const updated = { ...pixelState, enabled };
    setPixelState(updated);
    updateWebsiteSettings({ facebookPixel: updated });
    initFacebookPixel(updated);
  };

  const handleChange = (field: keyof FacebookPixelSettings, value: any) => {
    const updated = { ...pixelState, [field]: value };
    setPixelState(updated);
    updateWebsiteSettings({ facebookPixel: updated });
    initFacebookPixel(updated);
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setTestResult(null);
    try {
      const updatedSettings = {
        ...websiteSettings,
        facebookPixel: pixelState
      };
      updateWebsiteSettings({ facebookPixel: pixelState });
      initFacebookPixel(pixelState);
      const res = await saveWebsiteSettingsToSupabase(updatedSettings);
      if (res.success) {
        showToast('✓ Pengaturan Facebook Pixel berhasil disimpan ke Cloud!');
      } else {
        showToast(`⚠️ Tersimpan lokal: ${res.message}`);
      }
    } catch (err: any) {
      showToast(`Gagal menyimpan: ${err?.message || 'Error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = () => {
    if (!pixelState.pixelId.trim()) {
      showToast('⚠️ Masukkan Facebook Pixel ID terlebih dahulu.');
      return;
    }
    setIsSendingTest(true);
    const result = sendFBTestEvent(pixelState.pixelId, pixelState.testEventCode);
    setTestResult(result);
    setIsSendingTest(false);
    if (result.success) {
      showToast('✓ Test event berhasil dikirim ke Meta Events Manager!');
    } else {
      showToast(`⚠️ ${result.message}`);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Teks disalin ke clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div id="facebook-pixel-settings-container" className="space-y-8 max-w-5xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white flex items-center gap-2">
                <span>Integrasi Facebook Pixel (Meta Pixel & Ads)</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  PRO
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lacak efektivitas iklan Facebook & Instagram Ads, konversi penjualan kursus (Purchase), dan pendaftaran siswa secara otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {pixelState.enabled && pixelState.pixelId.trim() ? (
            <div className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-2 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pixel Aktif: {pixelState.pixelId}</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Pixel Nonaktif</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="space-y-0.5">
                <label className="font-heading font-extrabold text-sm text-slate-900 dark:text-white block cursor-pointer">
                  Aktifkan Facebook Pixel (Meta Pixel)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Secara otomatis memuat script pelacak Meta Pixel ke seluruh halaman platform LESIN AJA.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={pixelState.enabled}
                  onChange={e => handleToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Input Pixel ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Facebook Pixel ID / Meta Dataset ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pixelState.pixelId}
                  onChange={e => handleChange('pixelId', e.target.value)}
                  placeholder="Contoh: 892374619283745 (15-16 digit angka)"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-sm focus:border-blue-500 focus:outline-none text-slate-900 dark:text-white"
                />
                {pixelState.pixelId && (
                  <div className="absolute right-3 top-3 text-xs text-emerald-500 font-bold flex items-center gap-1 pointer-events-none">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Format Valid</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Dapatkan ID ini di menu <strong>Meta Events Manager &gt; Data Sources &gt; Dataset ID / Pixel ID</strong>.
              </p>
            </div>

            {/* Input Test Event Code (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Kode Uji Coba Event (Test Event Code - Opsional)</span>
                <span className="text-[10px] font-normal text-slate-400">Hanya untuk pengujian di Events Manager</span>
              </label>
              <input
                type="text"
                value={pixelState.testEventCode || ''}
                onChange={e => handleChange('testEventCode', e.target.value)}
                placeholder="Contoh: TEST12345 (Opsional)"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-sm focus:border-blue-500 focus:outline-none text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500">
                Jika diisi, semua event yang dikirim dari browser Anda akan langsung muncul di tab <strong>Test Events</strong> pada Meta Events Manager.
              </p>
            </div>

            {/* Granular Event Tracking Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Event E-Commerce & LMS yang Dilacak Otomatis:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pixelState.trackPageView ?? true}
                    onChange={e => handleChange('trackPageView', e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      PageView
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Lacak setiap kali pengunjung membuka halaman apa pun.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pixelState.trackViewContent ?? true}
                    onChange={e => handleChange('trackViewContent', e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      ViewContent
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Lacak saat calon siswa melihat detail silabus kursus.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pixelState.trackInitiateCheckout ?? true}
                    onChange={e => handleChange('trackInitiateCheckout', e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      InitiateCheckout
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Lacak saat calon siswa membuka modal pendaftaran / beli.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pixelState.trackPurchase ?? true}
                    onChange={e => handleChange('trackPurchase', e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Purchase (Omset Rupiah)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Mengirim konfirmasi pembayaran sukses lengkap dengan nominal IDR.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pixelState.trackCompleteRegistration ?? true}
                    onChange={e => handleChange('trackCompleteRegistration', e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      CompleteRegistration
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Lacak saat siswa baru selesai mendaftarkan akun.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pixelState.trackLead ?? true}
                    onChange={e => handleChange('trackLead', e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Lead (Prospek)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Lacak ketertarikan siswa saat mulai mengisi kontak.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Test Event Result Banner */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-800 dark:text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{testResult.message}</p>
                  {testResult.success && (
                    <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-400">
                      Buka tab <strong>Events Manager &gt; Test Events</strong> di Facebook untuk melihat event yang baru saja terkirim secara real-time.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSendingTest || !pixelState.pixelId.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-blue-500" />
                <span>{isSendingTest ? 'Mengirim...' : 'Kirim Test Event Uji Coba'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToCloud}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Pixel ke Supabase'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Step-by-Step Tutorial & Instructions */}
        <div className="space-y-6">
          {/* Tutorial Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-sm text-white">
                  Tutorial Memasang Facebook Pixel
                </h3>
                <p className="text-[10px] text-blue-300">
                  Panduan resmi 4 langkah mudah
                </p>
              </div>
            </div>

            <ol className="space-y-4 text-xs">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">Buka Meta Events Manager</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Kunjungi dashboard pengelola event resmi Facebook di browser Anda.
                  </p>
                  <a
                    href="https://business.facebook.com/events_manager2"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition mt-0.5"
                  >
                    <span>Buka Events Manager</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">Pilih / Buat Data Set (Pixel)</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Klik <strong>Connect Data Sources &gt; Web &gt; Masukkan Nama Pixel</strong> Anda.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">Salin Dataset ID / Pixel ID</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Temukan deretan 15–16 digit angka ID di bawah nama Pixel Anda (contoh: <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">123456789012345</code>).
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">Tempelkan & Simpan</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Paste ID tersebut ke kolom <strong>Facebook Pixel ID</strong> di samping kiri, lalu klik <strong>Simpan Pengaturan</strong>.
                  </p>
                </div>
              </li>
            </ol>

            {/* Chrome Extension Tip */}
            <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-800/40 text-[11px] space-y-1.5">
              <p className="font-bold text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Tips Pengujian dengan Chrome Extension</span>
              </p>
              <p className="text-slate-300 leading-relaxed">
                Pasang ekstensi <strong>Meta Pixel Helper</strong> di Google Chrome Anda untuk melihat status pixel langsung berubah menjadi hijau saat membuka halaman web ini.
              </p>
              <a
                href="https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 underline"
              >
                <span>Download Meta Pixel Helper Extension</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
