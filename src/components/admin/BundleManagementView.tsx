import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CourseBundle, BundleType, Course } from '../../types';
import { formatRupiah } from '../../utils/exportUtils';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Tag,
  Layers,
  Sparkles,
  DollarSign,
  Cloud,
  RefreshCw,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
  Info
} from 'lucide-react';

export const BundleManagementView: React.FC = () => {
  const {
    courseBundles,
    courses,
    categories,
    addBundle,
    updateBundle,
    deleteBundle,
    getEffectiveBundleCourses,
    saveBundlesToSupabase,
    supabaseConfig,
    showToast
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<CourseBundle | null>(null);
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  const [expandedBundleId, setExpandedBundleId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bundleType, setBundleType] = useState<BundleType>('all_courses');
  const [targetCategory, setTargetCategory] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [price, setPrice] = useState<number>(199000);
  const [originalPrice, setOriginalPrice] = useState<number>(500000);
  const [badge, setBadge] = useState('Paling Hemat • 70% OFF');
  const [showInCheckout, setShowInCheckout] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingBundle(null);
    setTitle('');
    setDescription('Dapatkan akses ke seluruh materi kursus dengan harga paket super hemat.');
    setBundleType('all_courses');
    setTargetCategory(categories[0]?.name || '');
    setSelectedCourseIds([]);
    setPrice(249000);
    setOriginalPrice(courses.reduce((sum, c) => sum + (c.price || 0), 0) || 750000);
    setBadge('Paling Hemat • 70% OFF');
    setShowInCheckout(true);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (bundle: CourseBundle) => {
    setEditingBundle(bundle);
    setTitle(bundle.title);
    setDescription(bundle.description || '');
    setBundleType(bundle.bundleType);
    setTargetCategory(bundle.targetCategory || '');
    setSelectedCourseIds(bundle.courseIds || []);
    setPrice(bundle.price);
    setOriginalPrice(bundle.originalPrice || 0);
    setBadge(bundle.badge || '');
    setShowInCheckout(bundle.showInCheckout ?? true);
    setIsActive(bundle.isActive ?? true);
    setIsModalOpen(true);
  };

  const calculateAutoOriginalPrice = (type: BundleType, cat: string, ids: string[]) => {
    if (type === 'all_courses') {
      return courses.reduce((sum, c) => sum + (c.price || 0), 0);
    }
    if (type === 'category') {
      const match = courses.filter(c => c.category && c.category.trim().toLowerCase() === (cat || '').trim().toLowerCase());
      return match.reduce((sum, c) => sum + (c.price || 0), 0);
    }
    if (type === 'custom') {
      const match = courses.filter(c => ids.includes(c.id));
      return match.reduce((sum, c) => sum + (c.price || 0), 0);
    }
    return 0;
  };

  const handleBundleTypeChange = (newType: BundleType) => {
    setBundleType(newType);
    const cat = targetCategory || categories[0]?.name || '';
    const autoPrice = calculateAutoOriginalPrice(newType, cat, selectedCourseIds);
    if (autoPrice > 0) {
      setOriginalPrice(autoPrice);
      setPrice(Math.round(autoPrice * 0.45)); // 55% discount suggestion
    }
  };

  const handleCategoryChange = (cat: string) => {
    setTargetCategory(cat);
    const autoPrice = calculateAutoOriginalPrice('category', cat, selectedCourseIds);
    if (autoPrice > 0) {
      setOriginalPrice(autoPrice);
      setPrice(Math.round(autoPrice * 0.5));
    }
  };

  const handleToggleCourse = (courseId: string) => {
    const updated = selectedCourseIds.includes(courseId)
      ? selectedCourseIds.filter(id => id !== courseId)
      : [...selectedCourseIds, courseId];
    setSelectedCourseIds(updated);
    const autoPrice = calculateAutoOriginalPrice('custom', targetCategory, updated);
    if (autoPrice > 0) {
      setOriginalPrice(autoPrice);
      setPrice(Math.round(autoPrice * 0.5));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('⚠️ Judul paket bundling harus diisi.');
      return;
    }
    if (price < 0) {
      showToast('⚠️ Harga paket tidak valid.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      bundleType,
      targetCategory: bundleType === 'category' ? targetCategory : undefined,
      courseIds: bundleType === 'custom' ? selectedCourseIds : undefined,
      price: Number(price),
      originalPrice: Number(originalPrice) || Number(price),
      badge: badge.trim(),
      showInCheckout,
      isActive
    };

    if (editingBundle) {
      updateBundle(editingBundle.id, payload);
    } else {
      addBundle(payload);
    }

    setIsModalOpen(false);
  };

  const handleSaveToSupabase = async () => {
    setIsSavingSupabase(true);
    await saveBundlesToSupabase();
    setIsSavingSupabase(false);
  };

  const handleDelete = (id: string, bundleTitle: string) => {
    if (window.confirm(`Yakin ingin menghapus paket bundling "${bundleTitle}"?`)) {
      deleteBundle(id);
    }
  };

  return (
    <div id="bundle-management-view" className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-lg border border-blue-800">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-white/10 text-white border border-white/20 shadow-inner">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-base sm:text-lg flex items-center gap-2">
              <span>Paket Pembelian Bundling Kursus</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                PRO FITUR
              </span>
            </h2>
            <p className="text-xs text-blue-200 mt-0.5 max-w-xl">
              Buat paket bundling satu kategori kursus atau seluruh kursus dengan harga promo yang ditentukan admin. Paket otomatis ditampilkan di halaman checkout kursus satuan.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Paket Baru</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToSupabase}
            disabled={isSavingSupabase}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Simpan data paket bundling ke Supabase Cloud"
          >
            {isSavingSupabase ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Cloud className="w-4 h-4 text-cyan-300" />
            )}
            <span>Simpan ke Supabase</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Bagaimana sistem paket bundling bekerja?
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Ketika siswa membuka modal checkout untuk membeli 1 kursus satuan, sistem akan otomatis mencocokkan kursus tersebut dengan paket bundling yang relevan (misal paket kategori yang sama atau paket all-access). Siswa dapat memilih untuk beralih ke paket bundling dan saat transaksi selesai, <strong>seluruh kursus yang ada di dalam paket akan langsung terbuka otomatis</strong> pada akun siswa.
          </p>
        </div>
      </div>

      {/* List of Bundles */}
      {courseBundles.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-bold text-base text-slate-800 dark:text-white">
            Belum Ada Paket Bundling
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Klik tombol "Tambah Paket Baru" di atas untuk membuat paket bundling kategori atau all-access pertama Anda.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Paket Bundling Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {courseBundles.map(bundle => {
            const includedCourses = getEffectiveBundleCourses(bundle);
            const isExpanded = expandedBundleId === bundle.id;
            const originalVal = bundle.originalPrice || includedCourses.reduce((sum, c) => sum + (c.price || 0), 0);
            const savings = Math.max(0, originalVal - bundle.price);
            const discountPercent = originalVal > 0 ? Math.round((savings / originalVal) * 100) : 0;

            return (
              <div
                key={bundle.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition shadow-sm overflow-hidden ${
                  bundle.isActive
                    ? 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {bundle.badge && (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                          {bundle.badge}
                        </span>
                      )}

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        bundle.bundleType === 'all_courses'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20'
                          : bundle.bundleType === 'category'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20'
                      }`}>
                        {bundle.bundleType === 'all_courses'
                          ? '🌐 Seluruh Kursus Platform'
                          : bundle.bundleType === 'category'
                          ? `📂 Kategori: ${bundle.targetCategory}`
                          : '🎯 Pilihan Manual'}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        bundle.isActive
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {bundle.isActive ? '● Aktif' : '○ Nonaktif'}
                      </span>

                      {bundle.showInCheckout && (
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                          ✓ Tampil di Checkout Satuan
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                      {bundle.title}
                    </h3>

                    {bundle.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                        {bundle.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>{includedCourses.length} Kursus Termasuk</span>
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Hemat {formatRupiah(savings)} ({discountPercent}% OFF)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Pricing & Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left lg:text-right">
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading font-extrabold text-xl sm:text-2xl text-blue-600 dark:text-blue-400">
                          {formatRupiah(bundle.price)}
                        </span>
                        {originalVal > bundle.price && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatRupiah(originalVal)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Harga Paket Promo Siswa
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedBundleId(isExpanded ? null : bundle.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>{isExpanded ? 'Tutup Daftar' : 'Lihat Kursus'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(bundle)}
                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-semibold transition cursor-pointer"
                        title="Edit Paket"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(bundle.id, bundle.title)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold transition cursor-pointer"
                        title="Hapus Paket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Course List inside Bundle */}
                {isExpanded && (
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span>Daftar Kursus di Dalam Paket Ini ({includedCourses.length})</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Total Nilai Asli: <strong>{formatRupiah(originalVal)}</strong>
                      </span>
                    </div>

                    {includedCourses.length === 0 ? (
                      <p className="text-xs text-amber-500">
                        Tidak ada kursus yang cocok dengan filter paket ini. Tambahkan kursus dengan kategori terkait.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {includedCourses.map(c => (
                          <div
                            key={c.id}
                            className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs"
                          >
                            <img
                              src={c.thumbnail}
                              alt={c.title}
                              className="w-12 h-12 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                                {c.category}
                              </span>
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {c.title}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Harga Satuan: {formatRupiah(c.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Bundle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-white">
                    {editingBundle ? 'Edit Paket Bundling' : 'Tambah Paket Bundling Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Atur cakupan kursus, harga promo, dan visibilitas di checkout
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-800 dark:text-slate-200 flex-1">
              <div>
                <label className="block font-bold mb-1 text-slate-900 dark:text-white">
                  Judul Paket Bundling <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Paket Lengkap Web & Mobile Mastery"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  Deskripsi Singkat Paket
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Jelaskan keuntungan membeli paket ini..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Bundle Type Selector */}
              <div>
                <label className="block font-bold mb-1.5 text-slate-900 dark:text-white">
                  Cakupan Isi Paket (Tipe Bundling)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1 ${
                      bundleType === 'all_courses'
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bType"
                        checked={bundleType === 'all_courses'}
                        onChange={() => handleBundleTypeChange('all_courses')}
                        className="text-blue-600"
                      />
                      <span>Seluruh Kursus</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Semua kursus platform ({courses.length} kursus)
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1 ${
                      bundleType === 'category'
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bType"
                        checked={bundleType === 'category'}
                        onChange={() => handleBundleTypeChange('category')}
                        className="text-blue-600"
                      />
                      <span>Satu Kategori</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Semua kursus dalam 1 kategori
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1 ${
                      bundleType === 'custom'
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bType"
                        checked={bundleType === 'custom'}
                        onChange={() => handleBundleTypeChange('custom')}
                        className="text-blue-600"
                      />
                      <span>Pilihan Manual</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Pilih kursus tertentu
                    </span>
                  </label>
                </div>
              </div>

              {/* Category selector if bundleType is category */}
              {bundleType === 'category' && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block font-bold">
                    Pilih Kategori Kursus Target:
                  </label>
                  <select
                    value={targetCategory}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name} ({courses.filter(c => c.category === cat.name).length} Kursus)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom course selector if bundleType is custom */}
              {bundleType === 'custom' && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block font-bold">
                    Centang Kursus Yang Masuk ke Paket ({selectedCourseIds.length} terpilih):
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {courses.map(c => {
                      const isChecked = selectedCourseIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition ${
                            isChecked
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCourse(c.id)}
                              className="text-blue-600 rounded"
                            />
                            <span className="truncate font-medium">{c.title}</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 shrink-0 font-mono">
                            {formatRupiah(c.price)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pricing row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold mb-1">
                    Harga Asli Total (Sebelum Diskon)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={originalPrice}
                    onChange={e => setOriginalPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Akumulasi harga satuan kursus ({formatRupiah(originalPrice)})
                  </p>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-blue-600 dark:text-blue-400">
                    Harga Promo Paket Bundling <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono font-extrabold text-sm"
                  />
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    Harga yang dibayar siswa: {formatRupiah(price)}
                  </p>
                </div>
              </div>

              {/* Badge label */}
              <div>
                <label className="block font-bold mb-1">
                  Label Badge Promosi
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={e => setBadge(e.target.value)}
                  placeholder="Contoh: Paling Hemat • 70% OFF"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInCheckout}
                    onChange={e => setShowInCheckout(e.target.checked)}
                    className="text-blue-600 rounded"
                  />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Tampilkan tawaran paket ini pada halaman Checkout pembelian satuan
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="text-blue-600 rounded"
                  />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Status Paket Aktif & Siap Dibeli Siswa
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md shadow-blue-500/20"
                >
                  {editingBundle ? 'Simpan Perubahan' : 'Buat Paket Bundling'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
