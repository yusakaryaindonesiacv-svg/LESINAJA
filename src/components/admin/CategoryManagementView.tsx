import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryItem } from '../../types';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  BookOpen,
  Cloud,
  Layers,
  ArrowUpDown,
  Search,
  Sparkles,
  AlertTriangle,
  Code,
  Cpu,
  Palette,
  TrendingUp,
  Languages,
  GraduationCap,
  Globe,
  Video,
  Zap,
  Compass,
  Database,
  Terminal,
  Award,
  Save
} from 'lucide-react';

const ICON_OPTIONS = [
  { name: 'Tag', icon: Tag },
  { name: 'Code', icon: Code },
  { name: 'Cpu', icon: Cpu },
  { name: 'Palette', icon: Palette },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Languages', icon: Languages },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Globe', icon: Globe },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Video', icon: Video },
  { name: 'Zap', icon: Zap },
  { name: 'Compass', icon: Compass },
  { name: 'Database', icon: Database },
  { name: 'Terminal', icon: Terminal },
  { name: 'Award', icon: Award },
  { name: 'Sparkles', icon: Sparkles }
];

const COLOR_OPTIONS = [
  { name: 'Biru', value: 'blue', bg: 'bg-blue-500', text: 'text-blue-500', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { name: 'Ungu', value: 'purple', bg: 'bg-purple-500', text: 'text-purple-500', badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { name: 'Hijau Emerald', value: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { name: 'Amber Emas', value: 'amber', bg: 'bg-amber-500', text: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { name: 'Merah Rose', value: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-500', badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  { name: 'Cyan Langit', value: 'cyan', bg: 'bg-cyan-500', text: 'text-cyan-500', badge: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-500', text: 'text-pink-500', badge: 'bg-pink-500/10 text-pink-600 border-pink-500/20' }
];

export const CategoryManagementView: React.FC = () => {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    courses,
    supabaseConfig,
    syncToSupabase,
    saveCategoriesToSupabase,
    showToast
  } = useApp();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('blue');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState<number>(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('Tag');
    setColor('blue');
    setIsActive(true);
    setOrder(categories.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIcon(cat.icon || 'Tag');
    setColor(cat.color || 'blue');
    setIsActive(cat.isActive ?? true);
    setOrder(cat.order ?? 1);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      // Auto-generate slug for new categories
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama kategori wajib diisi.');
      return;
    }

    const finalSlug = slug.trim() || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        icon,
        color,
        isActive,
        order: Number(order) || 1
      });
    } else {
      addCategory({
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        icon,
        color,
        isActive,
        order: Number(order) || (categories.length + 1)
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (cat: CategoryItem) => {
    const courseCount = courses.filter(c => c.category === cat.name || c.category === cat.slug).length;
    if (courseCount > 0) {
      alert(`⚠️ Kategori "${cat.name}" sedang digunakan oleh ${courseCount} kursus. Harap ganti kategori kursus-kursus tersebut sebelum menghapusnya.`);
      return;
    }

    if (window.confirm(`Hapus kategori "${cat.name}"?`)) {
      deleteCategory(cat.id);
    }
  };

  const handleSaveToSupabase = async () => {
    setIsSavingSupabase(true);
    await saveCategoriesToSupabase(categories);
    setIsSavingSupabase(false);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncToSupabase();
    setIsSyncing(false);
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const getCourseCountForCategory = (cat: CategoryItem) => {
    return courses.filter(c => c.category === cat.name || c.category === cat.slug).length;
  };

  const renderIcon = (iconName?: string) => {
    const found = ICON_OPTIONS.find(i => i.name === iconName);
    const IconComp = found ? found.icon : Tag;
    return <IconComp className="w-4 h-4" />;
  };

  return (
    <div id="category-management-view" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Manajemen Taksonomi</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
            Kategori Kursus
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola klasifikasi program belajar, slug URL, ikon visual, dan simpan langsung ke Supabase Cloud.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSaveToSupabase}
            disabled={isSavingSupabase}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            title="Simpan seluruh data kategori ini langsung ke database Supabase Cloud"
          >
            <Save className={`w-4 h-4 ${isSavingSupabase ? 'animate-spin' : ''}`} />
            <span>{isSavingSupabase ? 'Menyimpan...' : 'Simpan Kategori ke Supabase'}</span>
          </button>

          {supabaseConfig.projectUrl && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Semua'}</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">
              {categories.length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Total Kategori Terdaftar</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">
              {categories.filter(c => c.isActive !== false).length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Kategori Aktif Ditampilkan</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">
              {courses.length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Kursus Menggunakan Kategori</div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari kategori atau slug..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Categories Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Tag className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Belum ada kategori kursus
            </h3>
            <p className="text-xs text-slate-500">
              Tambahkan kategori baru untuk mengelompokkan kursus dengan rapi.
            </p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Urutan</th>
                  <th className="py-3 px-4">Ikon & Kategori</th>
                  <th className="py-3 px-4">Slug URL</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4 text-center">Jumlah Kursus</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCategories.map(cat => {
                  const courseCount = getCourseCountForCategory(cat);
                  const colorObj = COLOR_OPTIONS.find(c => c.value === cat.color) || COLOR_OPTIONS[0];

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        #{cat.order || 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorObj.badge} border`}>
                            {renderIcon(cat.icon)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {cat.name}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize">
                              Tema: {colorObj.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                        /{cat.slug}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {cat.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          courseCount > 0
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {courseCount} Kursus
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {cat.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            <XCircle className="w-3 h-3" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Edit Kategori"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Kategori */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                    {editingCategory ? 'Edit Kategori Kursus' : 'Tambah Kategori Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kategori akan otomatis tersinkron ke Cloud Supabase jika aktif
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Contoh: Web & Mobile Development"
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Slug URL (Identifier) *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="contoh: web-mobile-dev"
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Kategori (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Penjelasan ringkas materi yang dicakup oleh kategori ini..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Ikon Visual
                </label>
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
                  {ICON_OPTIONS.map(opt => {
                    const IconComp = opt.icon;
                    const isSelected = icon === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setIcon(opt.name)}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow'
                            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                        title={opt.name}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Theme Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tema Warna Badge
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map(col => {
                    const isSelected = color === col.value;
                    return (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => setColor(col.value)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 text-[11px] font-medium transition ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${col.bg}`} />
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={order}
                    onChange={e => setOrder(parseInt(e.target.value) || 1)}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Aktif
                  </label>
                  <div className="flex items-center gap-2 h-9">
                    <input
                      type="checkbox"
                      id="isActiveCat"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <label htmlFor="isActiveCat" className="text-xs text-slate-700 dark:text-slate-300">
                      Tampilkan di Katalog
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20"
                >
                  {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
