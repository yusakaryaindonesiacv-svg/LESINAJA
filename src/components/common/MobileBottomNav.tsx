import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  BookOpen,
  Radio,
  GraduationCap,
  ShieldCheck,
  User,
  Award
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    currentView,
    navigateTo,
    currentUser,
    liveSessions
  } = useApp();

  const liveSessionsCount = liveSessions.filter(s => s.isLiveNow).length;
  const enrolledCoursesCount = currentUser?.enrolledCourseIds?.length || 0;

  const navItems = [
    {
      id: 'mob-nav-home',
      label: 'Beranda',
      view: 'home',
      icon: Home
    },
    {
      id: 'mob-nav-courses',
      label: 'Katalog',
      view: 'courses',
      icon: BookOpen
    },
    {
      id: 'mob-nav-live',
      label: 'Sesi Live',
      view: 'live-sessions',
      icon: Radio,
      badge: liveSessionsCount > 0 ? `${liveSessionsCount}` : undefined,
      isLiveBadge: liveSessionsCount > 0
    },
    {
      id: 'mob-nav-my-learning',
      label: 'Kelas Saya',
      view: currentUser?.role === 'admin' ? 'admin' : 'my-courses',
      icon: currentUser?.role === 'admin' ? ShieldCheck : GraduationCap,
      badge: currentUser?.role !== 'admin' && enrolledCoursesCount > 0 ? `${enrolledCoursesCount}` : undefined
    },
    {
      id: 'mob-nav-account',
      label: currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'instructor' ? 'Instruktur' : 'Akun',
      view: currentUser?.role === 'admin' ? 'admin' : currentUser?.role === 'instructor' ? 'instructor' : 'dashboard',
      icon: currentUser?.role === 'admin' ? ShieldCheck : User
    }
  ];

  return (
    <nav
      id="mobile-bottom-navigation-bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-colors duration-200 safe-area-pb"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {navItems.map(item => {
          const isItemActive =
            currentView === item.view ||
            (item.view === 'my-courses' && (currentView === 'my-courses' || currentView === 'dashboard')) ||
            (item.view === 'admin' && (currentView === 'admin' || currentView === 'admin-dashboard')) ||
            (item.view === 'instructor' && (currentView === 'instructor' || currentView === 'instructor-dashboard'));

          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              id={item.id}
              onClick={() => navigateTo(item.view)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 ${
                isItemActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isItemActive
                      ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400'
                      : ''
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Badge Number or Live indicator */}
                {item.badge && (
                  <span
                    className={`absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold text-white shadow-xs ${
                      item.isLiveBadge
                        ? 'bg-rose-500 animate-pulse'
                        : 'bg-blue-600 dark:bg-blue-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">
                {item.label}
              </span>

              {/* Active Dot Indicator */}
              {isItemActive && (
                <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mt-0.5 animate-in fade-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
