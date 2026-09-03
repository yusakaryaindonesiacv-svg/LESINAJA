import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Course, CourseCategory } from '../../types';
import { CourseCard } from './CourseCard';
import {
  Search,
  SlidersHorizontal,
  BookOpen,
  Sparkles,
  GraduationCap
} from 'lucide-react';

interface CourseCatalogViewProps {
  onEnroll: (course: Course) => void;
}

export const CourseCatalogView: React.FC<CourseCatalogViewProps> = ({ onEnroll }) => {
  const { courses, categories: appCategories } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedLevel, setSelectedLevel] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price_low' | 'price_high'>('popular');

  const categoryNames = useMemo(() => {
    return ['Semua', ...appCategories.map(c => c.name)];
  }, [appCategories]);

  const filteredCourses = useMemo(() => {
    return courses
      .filter(c => {
        // Only show approved courses (or default platform courses)
        const isApproved = !c.verificationStatus || c.verificationStatus === 'approved';
        if (!isApproved) return false;

        const matchesSearch =
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCat = selectedCategory === 'Semua' || c.category === selectedCategory;
        const matchesLevel = selectedLevel === 'Semua' || c.level === selectedLevel;

        return matchesSearch && matchesCat && matchesLevel;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        return b.studentsCount - a.studentsCount; // default popular
      });
  }, [courses, searchQuery, selectedCategory, selectedLevel, sortBy]);

  return (
    <div id="course-catalog-container" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2 sm:space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Katalog Lengkap Kursus</span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
          Tingkatkan Skill Bersama Para Ahli
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Pilih kurikulum video terarah, ikuti kuis evaluasi berkala, dan dapatkan E-Sertifikat resmi kompetensi Anda.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-3.5 sm:space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul kursus, topik teknologi, instruktur..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          {/* Level & Sort Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 font-medium text-slate-700 dark:text-slate-200 flex-1 sm:flex-initial focus:outline-none focus:border-blue-500"
            >
              <option value="Semua">Semua Level</option>
              <option value="Pemula">Pemula</option>
              <option value="Menengah">Menengah</option>
              <option value="Lanjutan">Lanjutan</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 font-medium text-slate-700 dark:text-slate-200 flex-1 sm:flex-initial focus:outline-none focus:border-blue-500"
            >
              <option value="popular">Paling Populer</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="price_low">Harga: Termurah</option>
              <option value="price_high">Harga: Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoryNames.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-3">
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-bold text-base sm:text-lg text-slate-800 dark:text-slate-200">
            Tidak Ada Kursus yang Sesuai
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Coba gunakan kata kunci pencarian lain atau ubah filter kategori di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} onEnroll={onEnroll} />
          ))}
        </div>
      )}
    </div>
  );
};
