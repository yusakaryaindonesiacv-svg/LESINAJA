import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, CheckCircle2, X } from 'lucide-react';

interface NotificationPayload {
  id: string;
  name: string;
  city?: string;
  courseTitle: string;
  courseThumbnail: string;
  courseId: string;
  timeAgo: string;
  isReal: boolean;
  avatarText: string;
}

export const SocialProofPopup: React.FC = () => {
  const {
    websiteSettings,
    courses,
    transactions,
    users,
    navigateTo,
    currentView
  } = useApp();

  const config = websiteSettings.socialProofPopup;
  const isEnabled = config?.enabled ?? true;
  const displayInterval = Math.max(5, config?.displayIntervalSeconds ?? 12) * 1000;
  const displayDuration = Math.max(3, config?.displayDurationSeconds ?? 5) * 1000;
  const includeRealOrders = config?.includeRealOrders ?? true;

  const [currentNotif, setCurrentNotif] = useState<NotificationPayload | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedRealOrderIdsRef = useRef<Set<string>>(new Set());

  // Generate a random fake notification or retrieve latest real order
  const generateNotification = useCallback((): NotificationPayload | null => {
    if (courses.length === 0) return null;

    // 1. Check if there are real completed transactions or enrollments that haven't been shown yet
    if (includeRealOrders && transactions.length > 0) {
      const completedTrxs = transactions.filter(t => t.status === 'completed');
      const unshownReal = completedTrxs.find(t => !processedRealOrderIdsRef.current.has(t.id));

      if (unshownReal) {
        processedRealOrderIdsRef.current.add(unshownReal.id);
        const matchedCourse = courses.find(c => c.id === unshownReal.courseId) || courses[0];
        const studentName = unshownReal.studentName || 'Siswa Baru';
        const initials = studentName
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'S';

        return {
          id: `real-${unshownReal.id}-${Date.now()}`,
          name: studentName,
          city: undefined,
          courseTitle: matchedCourse.title,
          courseThumbnail: matchedCourse.thumbnail,
          courseId: matchedCourse.id,
          timeAgo: 'Baru saja',
          isReal: true,
          avatarText: initials
        };
      }
    }

    // 2. Fallback: Generate realistic social proof from pool
    const fakeNames = config?.fakeNames && config.fakeNames.length > 0
      ? config.fakeNames
      : ['Daniel', 'Rizky', 'Siti Rahma', 'Budi Santoso', 'Putri Ayu', 'Dimas', 'Nadia', 'Kevin'];

    const fakeCities = config?.fakeCities && config.fakeCities.length > 0
      ? config.fakeCities
      : ['Semarang', 'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Yogyakarta', 'Makassar', 'Denpasar'];

    const timeAgoList = config?.fakeTimeAgoPool && config.fakeTimeAgoPool.length > 0
      ? config.fakeTimeAgoPool
      : ['Baru saja', '1 menit yang lalu', '2 menit yang lalu', '4 menit yang lalu', '7 menit yang lalu'];

    const randomName = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    const randomCity = fakeCities[Math.floor(Math.random() * fakeCities.length)];
    const randomTime = timeAgoList[Math.floor(Math.random() * timeAgoList.length)];
    const randomCourse = courses[Math.floor(Math.random() * courses.length)];

    const initials = randomName
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'D';

    return {
      id: `fake-${Date.now()}-${Math.random()}`,
      name: randomName,
      city: randomCity,
      courseTitle: randomCourse.title,
      courseThumbnail: randomCourse.thumbnail,
      courseId: randomCourse.id,
      timeAgo: randomTime,
      isReal: false,
      avatarText: initials
    };
  }, [courses, transactions, includeRealOrders, config]);

  // Trigger popup cycle
  const showNextNotification = useCallback(() => {
    if (!isEnabled || sessionDismissed || courses.length === 0) return;

    // Don't disturb user during focused course video playback
    if (currentView === 'course-player') return;

    const notif = generateNotification();
    if (!notif) return;

    setCurrentNotif(notif);
    setIsVisible(true);

    // Auto-hide after displayDuration
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isHovered) {
        setIsVisible(false);
      }
    }, displayDuration);
  }, [isEnabled, sessionDismissed, courses.length, currentView, generateNotification, displayDuration, isHovered]);

  // Main interval loop
  useEffect(() => {
    if (!isEnabled || sessionDismissed || courses.length === 0) {
      setIsVisible(false);
      return;
    }

    // Initial delay before first popup
    const initialTimer = setTimeout(() => {
      showNextNotification();
    }, 3500);

    const intervalTimer = setInterval(() => {
      if (!isHovered) {
        showNextNotification();
      }
    }, displayInterval);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    };
  }, [isEnabled, sessionDismissed, courses.length, displayInterval, showNextNotification, isHovered]);

  // Handle unhover hide
  useEffect(() => {
    if (!isHovered && isVisible) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, displayDuration);
    }
  }, [isHovered, isVisible, displayDuration]);

  // Listen to real-time new transactions
  useEffect(() => {
    if (!isEnabled || !includeRealOrders || transactions.length === 0) return;
    const latestCompleted = transactions.find(
      t => t.status === 'completed' && !processedRealOrderIdsRef.current.has(t.id)
    );
    if (latestCompleted) {
      showNextNotification();
    }
  }, [transactions, isEnabled, includeRealOrders, showNextNotification]);

  if (!isEnabled || sessionDismissed || !currentNotif || courses.length === 0) {
    return null;
  }

  const handleClick = () => {
    if (currentNotif.courseId) {
      navigateTo('course-detail', { courseId: currentNotif.courseId });
      setIsVisible(false);
    }
  };

  return (
    <div
      id="social-proof-order-popup"
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed bottom-20 md:bottom-5 left-3 md:left-5 z-40 transition-all duration-500 ease-out transform ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
      }`}
    >
      <div
        onClick={handleClick}
        className="group relative cursor-pointer bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-900/10 dark:shadow-black/40 rounded-2xl p-2.5 sm:p-3 max-w-[290px] sm:max-w-[310px] flex items-center gap-2.5 hover:border-blue-500/60 dark:hover:border-blue-400/60 transition-all"
      >
        {/* Course Thumbnail or Student Avatar */}
        <div className="relative shrink-0">
          <img
            src={currentNotif.courseThumbnail}
            alt={currentNotif.courseTitle}
            className="w-11 h-11 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
          />
          {currentNotif.isReal ? (
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm"
              title="Pendaftaran Riil Terverifikasi"
            >
              <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          ) : (
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm"
              title="Pendaftaran Baru"
            >
              <Sparkles className="w-2.5 h-2.5 fill-white" />
            </span>
          )}
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 leading-snug line-clamp-1">
            <span className="font-extrabold text-slate-900 dark:text-white">
              {currentNotif.name}
            </span>{' '}
            {currentNotif.city ? (
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                dari {currentNotif.city}
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                baru saja
              </span>
            )}
          </p>

          <p className="text-[10px] sm:text-[11px] font-semibold text-blue-600 dark:text-blue-400 line-clamp-1 mt-0.5 group-hover:underline">
            Mendaftar {currentNotif.courseTitle}
          </p>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
              ⏱ {currentNotif.timeAgo}
            </span>
            {currentNotif.isReal && (
              <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                ✓ Riil
              </span>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="absolute top-1.5 right-1.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Tutup notifikasi"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
