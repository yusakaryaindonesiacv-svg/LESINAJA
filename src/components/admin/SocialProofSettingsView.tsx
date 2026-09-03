import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SocialProofPopupSettings } from '../../types';
import {
  Bell,
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Eye,
  Check,
  RefreshCw,
  Play,
  RotateCcw,
  Sliders,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const SocialProofSettingsView: React.FC = () => {
  const {
    websiteSettings,
    updateWebsiteSettings,
    courses,
    transactions,
    showToast,
    saveWebsiteSettingsToSupabase
  } = useApp();

  const currentConfig: SocialProofPopupSettings = websiteSettings.socialProofPopup || {
    enabled: true,
    displayIntervalSeconds: 12,
    displayDurationSeconds: 5,
    includeRealOrders: true,
    fakeNames: [
      'Daniel',
      'Rizky Pratama',
      'Siti Rahmawati',
      'Budi Santoso',
      'Putri Ayu',
      'Dimas Aditya',
      'Nadia Safitri',
      'Fajar Hidayat',
      'Anisa Maharani',
      'Kevin Wijaya',
      'Maya Puspita',
      'Agus Setiawan',
      'Dewi Lestari',
      'Bayu Nugroho',
      'Clara Novita',
      'Rio Ferdinan'
    ],
    fakeCities: [
      'Semarang',
      'Jakarta',
      'Surabaya',
      'Bandung',
      'Medan',
      'Yogyakarta',
      'Makassar',
      'Denpasar',
      'Malang',
      'Solo',
      'Palembang',
      'Bekasi',
      'Tangerang',
      'Depok',
      'Bogor',
      'Balikpapan'
    ],
    fakeTimeAgoPool: [
      'Baru saja',
      '1 menit yang lalu',
      '2 menit yang lalu',
      '4 menit yang lalu',
      '7 menit yang lalu',
      '12 menit yang lalu'
    ],
    position: 'bottom-left',
    soundEnabled: false
  };

  const [enabled, setEnabled] = useState(currentConfig.enabled);
  const [includeRealOrders, setIncludeRealOrders] = useState(currentConfig.includeRealOrders);
  const [displayIntervalSeconds, setDisplayIntervalSeconds] = useState(currentConfig.displayIntervalSeconds || 12);
  const [displayDurationSeconds, setDisplayDurationSeconds] = useState(currentConfig.displayDurationSeconds || 5);
  const [fakeNamesText, setFakeNamesText] = useState((currentConfig.fakeNames || []).join('\n'));
  const [fakeCitiesText, setFakeCitiesText] = useState((currentConfig.fakeCities || []).join('\n'));
  const [fakeTimeAgoText, setFakeTimeAgoText] = useState((currentConfig.fakeTimeAgoPool || []).join('\n'));

  const [isSaving, setIsSaving] = useState(false);
  const [previewSample, setPreviewSample] = useState<{
    name: string;
    city: string;
    courseTitle: string;
    courseThumbnail: string;
    timeAgo: string;
    isReal: boolean;
  }>({
    name: 'Daniel',
    city: 'Semarang',
    courseTitle: courses[0]?.title || 'Full-Stack Web & Mobile Developer',
    courseThumbnail: courses[0]?.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    timeAgo: 'Baru saja',
    isReal: false
  });

  const generateNewPreview = (isRealSample: boolean = false) => {
    const names = fakeNamesText.split('\n').map(s => s.trim()).filter(Boolean);
    const cities = fakeCitiesText.split('\n').map(s => s.trim()).filter(Boolean);
    const timePool = fakeTimeAgoText.split('\n').map(s => s.trim()).filter(Boolean);

    const randomName = names[Math.floor(Math.random() * names.length)] || 'Daniel';
    const randomCity = cities[Math.floor(Math.random() * cities.length)] || 'Semarang';
    const randomTime = timePool[Math.floor(Math.random() * timePool.length)] || 'Baru saja';
    const randomCourse = courses[Math.floor(Math.random() * courses.length)] || {
      title: 'Full-Stack Web & Mobile Developer',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'
    };

    setPreviewSample({
      name: isRealSample ? 'Sarah Amalia' : randomName,
      city: isRealSample ? '' : randomCity,
      courseTitle: randomCourse.title,
      courseThumbnail: randomCourse.thumbnail,
      timeAgo: isRealSample ? 'Baru saja' : randomTime,
      isReal: isRealSample
    });
  };

  const handleResetDefaults = () => {
    if (confirm('Kembalikan pengaturan notifikasi fake order ke default pabrik?')) {
      const defaultNames = [
        'Daniel',
        'Rizky Pratama',
        'Siti Rahmawati',
        'Budi Santoso',
        'Putri Ayu',
        'Dimas Aditya',
        'Nadia Safitri',
        'Fajar Hidayat',
        'Anisa Maharani',
        'Kevin Wijaya',
        'Maya Puspita',
        'Agus Setiawan',
        'Dewi Lestari',
        'Bayu Nugroho',
        'Clara Novita',
        'Rio Ferdinan'
      ];
      const defaultCities = [
        'Semarang',
        'Jakarta',
        'Surabaya',
        'Bandung',
        'Medan',
        'Yogyakarta',
        'Makassar',
        'Denpasar',
        'Malang',
        'Solo',
        'Palembang',
        'Bekasi',
        'Tangerang',
        'Depok',
        'Bogor',
        'Balikpapan'
      ];
      const defaultTimes = [
        'Baru saja',
        '1 menit yang lalu',
        '2 menit yang lalu',
        '4 menit yang lalu',
        '7 menit yang lalu',
        '12 menit yang lalu'
      ];

      setEnabled(true);
      setIncludeRealOrders(true);
      setDisplayIntervalSeconds(12);
      setDisplayDurationSeconds(5);
      setFakeNamesText(defaultNames.join('\n'));
      setFakeCitiesText(defaultCities.join('\n'));
      setFakeTimeAgoText(defaultTimes.join('\n'));

      showToast('Form telah direset ke default. Klik "Simpan Pengaturan" untuk menerapkan.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const names = fakeNamesText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
      const cities = fakeCitiesText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
      const timePool = fakeTimeAgoText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const updatedSettings: SocialProofPopupSettings = {
        enabled,
        includeRealOrders,
        displayIntervalSeconds: Math.max(4, Number(displayIntervalSeconds) || 12),
        displayDurationSeconds: Math.max(2, Number(displayDurationSeconds) || 5),
        fakeNames: names.length > 0 ? names : ['Daniel', 'Rizky', 'Siti Rahma'],
        fakeCities: cities.length > 0 ? cities : ['Semarang', 'Jakarta', 'Surabaya'],
        fakeTimeAgoPool: timePool.length > 0 ? timePool : ['Baru saja', '2 menit yang lalu'],
        position: 'bottom-left',
        soundEnabled: false
      };

      updateWebsiteSettings({
        socialProofPopup: updatedSettings
      });

      if (saveWebsiteSettingsToSupabase) {
        await saveWebsiteSettingsToSupabase();
      }

      showToast('✅ Pengaturan Notifikasi Fake & Real Order berhasil disimpan!');
    } catch (err: any) {
      showToast('Gagal menyimpan pengaturan: ' + (err?.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  const completedTransactions = transactions.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-amber-500" />
            <span>Notifikasi Fake & Real Order (Social Proof)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Atur popup notifikasi pendaftaran kursus di pojok kiri bawah untuk meningkatkan kepercayaan calon siswa dan konversi penjualan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
            title="Reset ke pengaturan awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Settings on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Settings Controls */}
        <div className="lg:col-span-2 space-y-5">
          {/* Card 1: Master Toggle & Real Order Integration */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>Status & Integrasi Order</span>
            </h3>

            {/* Master Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Aktifkan Popup Notifikasi Order</span>
                  {enabled ? (
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      Nonaktif
                    </span>
                  )}
                </span>
                <p className="text-[11px] text-slate-500">
                  Memunculkan kartu notifikasi kecil secara berkala di pojok kiri bawah layar pengunjung.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Real Order Integration Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Tampilkan Order & Pendaftaran Nyata (Real Order)</span>
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Bila ada siswa yang menyelesaikan transaksi/pendaftaran riil, sistem otomatis memunculkan data nama siswa asli dan kursus yang didaftar dengan badge <strong>"✓ Riil"</strong>.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={includeRealOrders}
                  onChange={e => setIncludeRealOrders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Card 2: Interval & Timing */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pengaturan Waktu & Interval Kemunculan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Interval Input */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Jeda Kemunculan (Interval)
                  </label>
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                    {displayIntervalSeconds} Detik
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={displayIntervalSeconds}
                  onChange={e => setDisplayIntervalSeconds(parseInt(e.target.value) || 12)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-[10px] text-slate-500">
                  Waktu tunggu sebelum notifikasi berikutnya muncul (Rekomendasi: 10 - 15 detik).
                </p>
              </div>

              {/* Duration Input */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Durasi Tampil di Layar
                  </label>
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                    {displayDurationSeconds} Detik
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={displayDurationSeconds}
                  onChange={e => setDisplayDurationSeconds(parseInt(e.target.value) || 5)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <p className="text-[10px] text-slate-500">
                  Lama popup terlihat sebelum otomatis menghilang (Rekomendasi: 4 - 6 detik).
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Fake Names & Cities Customization */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Kustomisasi Data Pembeli (Pool Nama & Kota)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Names Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Daftar Nama Pembeli (1 baris = 1 nama)
                </label>
                <textarea
                  rows={8}
                  value={fakeNamesText}
                  onChange={e => setFakeNamesText(e.target.value)}
                  placeholder="Daniel&#10;Rizky Pratama&#10;Siti Rahmawati"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:border-blue-500 focus:outline-none resize-none font-mono"
                />
                <span className="text-[10px] text-slate-400">
                  Total: {fakeNamesText.split('\n').filter(s => s.trim()).length} nama terdaftar
                </span>
              </div>

              {/* Cities Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Daftar Kota / Daerah (1 baris = 1 kota)
                </label>
                <textarea
                  rows={8}
                  value={fakeCitiesText}
                  onChange={e => setFakeCitiesText(e.target.value)}
                  placeholder="Semarang&#10;Jakarta&#10;Surabaya"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:border-blue-500 focus:outline-none resize-none font-mono"
                />
                <span className="text-[10px] text-slate-400">
                  Total: {fakeCitiesText.split('\n').filter(s => s.trim()).length} kota terdaftar
                </span>
              </div>
            </div>

            {/* Time Ago Pool */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Variasi Waktu Pendaftaran (1 baris = 1 frasa)
              </label>
              <textarea
                rows={3}
                value={fakeTimeAgoText}
                onChange={e => setFakeTimeAgoText(e.target.value)}
                placeholder="Baru saja&#10;2 menit yang lalu&#10;5 menit yang lalu"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:border-blue-500 focus:outline-none resize-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Column: Live Interactive Preview & Real Orders Monitor */}
        <div className="space-y-5">
          {/* Live Preview Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                <span>Live Preview Tampilan</span>
              </h3>

              <button
                type="button"
                onClick={() => generateNewPreview(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1"
                title="Acak preview"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Acak</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Tampilan popup di pojok kiri bawah website:
            </p>

            {/* Visual Box Simulation */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center min-h-[140px]">
              {/* Actual Popup Simulation Card */}
              <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-3 w-full max-w-[280px] flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <img
                    src={previewSample.courseThumbnail}
                    alt={previewSample.courseTitle}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
                  />
                  {previewSample.isReal ? (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-2 h-2 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                      <Sparkles className="w-2 h-2 fill-white" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-[11px] text-slate-800 dark:text-slate-200 leading-snug line-clamp-1">
                    <strong className="font-bold text-slate-900 dark:text-white">
                      {previewSample.name}
                    </strong>{' '}
                    {previewSample.city ? (
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        dari {previewSample.city}
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        baru saja
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 line-clamp-1 mt-0.5">
                    Mendaftar {previewSample.courseTitle}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-slate-400 font-medium">
                      ⏱ {previewSample.timeAgo}
                    </span>
                    {previewSample.isReal && (
                      <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                        ✓ Riil
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Sample Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => generateNewPreview(false)}
                className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100"
              >
                Sample Fake Order
              </button>
              <button
                type="button"
                onClick={() => generateNewPreview(true)}
                className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100"
              >
                Sample Real Order
              </button>
            </div>
          </div>

          {/* Real Transactions Feed Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Antrean Order Riil Terverifikasi ({completedTransactions.length})</span>
            </h3>

            {completedTransactions.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs">
                Belum ada transaksi riil lunas. Saat ini sistem akan memunculkan simulasi notifikasi dari daftar pool nama di sebelah kiri.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {completedTransactions.slice(0, 5).map(trx => (
                  <div
                    key={trx.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {trx.studentName}
                      </p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 line-clamp-1">
                        {trx.courseTitle}
                      </p>
                      <span className="text-[9px] text-slate-400">
                        {new Date(trx.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                      Lunas
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
