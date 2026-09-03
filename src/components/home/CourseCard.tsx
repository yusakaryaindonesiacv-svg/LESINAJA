import React from 'react';
import { Course } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/exportUtils';
import {
  Star,
  Users,
  PlayCircle,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Heart
} from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onEnroll: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onEnroll }) => {
  const { currentUser, getStudentCourseProgress, navigateTo } = useApp();

  const isEnrolled = currentUser?.enrolledCourseIds?.includes(course.id);
  const progressInfo = isEnrolled ? getStudentCourseProgress(course.id) : null;

  const totalDurationMinutes = course.modules.reduce((acc, m) => acc + (m.durationMinutes || 15), 0);
  const hours = Math.floor(totalDurationMinutes / 60);
  const minutes = totalDurationMinutes % 60;
  const durationText = hours > 0 ? `${hours} jam ${minutes > 0 ? `${minutes} mnt` : ''}` : `${minutes} mnt`;

  return (
    <div
      id={`course-card-${course.id}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800/80">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between pointer-events-none gap-1">
          <span className="text-[9px] sm:text-[10px] bg-slate-900/80 text-white dark:text-blue-300 backdrop-blur-md border border-white/20 px-2 sm:px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-xs truncate max-w-[100px] sm:max-w-none">
            {course.category}
          </span>
          <div className="flex items-center gap-1">
            {course.allowCustomPrice && (
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white shadow-xs shrink-0 flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 fill-white" />
                <span>Seikhlasnya</span>
              </span>
            )}
            {course.isPopular && (
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 shadow-xs shrink-0">
                Populer
              </span>
            )}
          </div>
        </div>

        {/* Bottom Level & Duration */}
        <div className="absolute bottom-2 sm:bottom-2.5 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between text-[9px] sm:text-xs text-white/90 font-medium">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
            <span>{durationText}</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950/70 text-[9px] sm:text-[10px] font-semibold backdrop-blur-md border border-white/10">
            {course.level}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
        <div className="space-y-1.5 sm:space-y-2">
          {/* Rating & Students Count */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>{(course.rating || 5.0).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{(course.studentsCount || 0).toLocaleString('id-ID')} Siswa</span>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => navigateTo('course-detail', { courseId: course.id })}
            className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition leading-snug"
          >
            {course.title}
          </h3>

          {/* Description */}
          <p className="hidden sm:block text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Instructor & Certificate Feature */}
        <div className="pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={course.instructor.avatar}
              alt={course.instructor.name}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[80px] sm:max-w-[130px]">
                {course.instructor.name}
              </p>
              <p className="text-[9px] text-slate-400 truncate max-w-[130px] hidden sm:block">
                {course.instructor.title}
              </p>
            </div>
          </div>

          {course.certificateAvailable && (
            <span
              className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0"
              title="E-Sertifikat Resmi Terbit Setelah Selesai"
            >
              <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Sertifikat</span>
            </span>
          )}
        </div>

        {/* Enrolled Progress OR Pricing Action */}
        <div className="pt-1">
          {isEnrolled ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] sm:text-xs font-semibold">
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terdaftar
                </span>
                <span className="text-slate-600 dark:text-slate-300 text-xs">
                  {progressInfo?.percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressInfo?.percentage || 0}%` }}
                />
              </div>
              <button
                id={`continue-learning-btn-${course.id}`}
                onClick={() => navigateTo('course-player', { courseId: course.id })}
                className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 mt-2"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Lanjutkan Belajar</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div>
                {course.allowCustomPrice ? (
                  <div className="py-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                      <Heart className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                      <span>Bayar Seikhlasnya</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                      {formatRupiah(course.price)}
                    </div>
                    {course.originalPrice > course.price && (
                      <div className="text-[10px] text-slate-400 line-through">
                        {formatRupiah(course.originalPrice)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                id={`enroll-course-btn-${course.id}`}
                onClick={() => onEnroll(course)}
                className={`w-full sm:w-auto py-2 px-3.5 sm:px-4 rounded-xl active:scale-[0.98] text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-1.5 shrink-0 ${
                  course.allowCustomPrice
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                }`}
              >
                <span>{course.allowCustomPrice ? 'Bayar Seikhlasnya' : 'Daftar'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
