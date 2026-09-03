import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Award,
  Search,
  Menu,
  X,
  Radio,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'register' | 'register_instructor') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const {
    currentUser,
    logout,
    isDarkMode,
    toggleDarkMode,
    websiteSettings,
    currentView,
    navigateTo,
    liveSessions
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoImageFailed, setLogoImageFailed] = useState(false);

  // Reset logo failure state when the URL changes
  useEffect(() => {
    setLogoImageFailed(false);
  }, [websiteSettings.logoImageUrl, websiteSettings.appIconUrl]);

  const liveSessionsCount = liveSessions.filter(s => s.isLiveNow).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo('courses', { search: searchQuery.trim() });
    }
  };

  const navLinks = [
    { id: 'nav-home', label: 'Beranda', view: 'home' },
    { id: 'nav-courses', label: 'Katalog Kursus', view: 'courses' },
    {
      id: 'nav-live',
      label: 'Sesi Live',
      view: 'live-sessions',
      badge: liveSessionsCount > 0 ? `${liveSessionsCount} LIVE` : undefined
    },
    { id: 'nav-cert', label: 'Verifikasi Sertifikat', view: 'verify-certificate' },
    { id: 'nav-pages', label: 'Tentang & FAQ', view: 'custom-page', params: { slug: 'tentang-kami' } }
  ];

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="logo-brand-btn"
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2 sm:gap-3 text-left group focus:outline-none"
            >
              {(websiteSettings.logoImageUrl || websiteSettings.appIconUrl) && !logoImageFailed ? (
                <img
                  src={websiteSettings.logoImageUrl || websiteSettings.appIconUrl}
                  alt={websiteSettings.siteName || 'LESIN AJA'}
                  onError={() => setLogoImageFailed(true)}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  loading="eager"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-contain bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 border border-slate-200 dark:border-slate-700 shadow-sm sm:shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-base sm:text-xl text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200 shrink-0">
                  <GraduationCap className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
                </div>
              )}
              <div className="flex flex-col justify-center h-8 sm:h-10">
                <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
                  <span className="font-heading font-bold sm:font-extrabold text-sm sm:text-lg lg:text-xl tracking-tight text-slate-900 dark:text-white leading-none">
                    {websiteSettings.logoText || 'LESIN AJA'}
                  </span>
                  <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 leading-none">
                    LMS PRO
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase hidden sm:block leading-none mt-1">
                  {websiteSettings.siteTagline || 'Verified Learning Platform'}
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex items-center flex-1 max-w-xs xl:max-w-sm mx-4"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari Kursus..."
                className="w-full pl-9.5 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-full border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 xl:gap-2">
            {navLinks.map(link => {
              const isActive = currentView === link.view;
              return (
                <button
                  key={link.id}
                  id={link.id}
                  onClick={() => navigateTo(link.view, link.params)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/20 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                      <Radio className="w-2.5 h-2.5" />
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Direct Top Navbar Admin Button if user is Admin */}
            {currentUser?.role === 'admin' && (
              <button
                id="top-nav-admin-panel-btn"
                onClick={() => navigateTo('admin')}
                className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  currentView === 'admin' || currentView === 'admin-dashboard'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Panel Admin</span>
              </button>
            )}

            {/* Direct Top Navbar Instructor Button if user is Instructor */}
            {currentUser?.role === 'instructor' && (
              <button
                id="top-nav-instructor-panel-btn"
                onClick={() => navigateTo('instructor')}
                className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  currentView === 'instructor' || currentView === 'instructor-dashboard'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Panel Instruktur</span>
              </button>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleDarkMode}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              aria-label={isDarkMode ? "Ganti ke Mode Terang (Siang)" : "Ganti ke Mode Gelap (Malam)"}
              title={isDarkMode ? "Aktifkan Mode Siang (Terang)" : "Aktifkan Mode Malam (Gelap)"}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400 transform transition-transform duration-300 rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300 transform transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* User Profile or Login CTA */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
                  />
                </button>

                {isUserDropdownOpen && (
                  <div
                    id="user-profile-dropdown"
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                        {currentUser.role}
                      </span>
                    </div>

                    <div className="py-1">
                      {currentUser.role === 'admin' && (
                        <button
                          id="dropdown-admin-panel-btn"
                          onClick={() => {
                            navigateTo('admin');
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium"
                        >
                          <ShieldCheck className="w-4 h-4 text-blue-500" />
                          <span>Panel Admin & Pengaturan</span>
                        </button>
                      )}

                      {(currentUser.role === 'instructor' || currentUser.role === 'admin') && (
                        <button
                          id="dropdown-instructor-dashboard-btn"
                          onClick={() => {
                            navigateTo('instructor');
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2.5 font-medium"
                        >
                          <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                          <span>Dashboard Instruktur</span>
                        </button>
                      )}

                      <button
                        id="dropdown-student-dashboard-btn"
                        onClick={() => {
                          navigateTo('dashboard');
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-blue-500" />
                        <span>Dashboard Siswa</span>
                      </button>

                      {currentUser.role === 'student' && (
                        <button
                          id="dropdown-register-instructor-btn"
                          onClick={() => {
                            onOpenAuth('register_instructor');
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 font-medium"
                        >
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>Daftar Jadi Instruktur</span>
                        </button>
                      )}

                      <button
                        id="dropdown-my-courses-btn"
                        onClick={() => {
                          navigateTo('my-courses');
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium"
                      >
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>Kelas Saya ({currentUser.enrolledCourseIds?.length || 0})</span>
                      </button>

                      <button
                        id="dropdown-my-certs-btn"
                        onClick={() => {
                          navigateTo('my-certificates');
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-medium"
                      >
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Sertifikat Saya</span>
                      </button>

                      {/* Theme Toggle row in dropdown */}
                      <button
                        id="dropdown-theme-toggle-btn"
                        onClick={() => {
                          toggleDarkMode();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between font-medium"
                      >
                        <div className="flex items-center gap-2.5">
                          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                          <span>{isDarkMode ? 'Mode Siang (Terang)' : 'Mode Malam (Gelap)'}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700/80 font-bold uppercase">
                          {isDarkMode ? 'Dark' : 'Light'}
                        </span>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        id="dropdown-logout-btn"
                        onClick={() => {
                          logout();
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="navbar-register-instructor-btn"
                  onClick={() => onOpenAuth('register_instructor')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300/60 dark:border-amber-700/60 rounded-lg transition"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Jadi Instruktur</span>
                </button>
                <button
                  id="navbar-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Masuk
                </button>
                <button
                  id="navbar-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-colors"
                >
                  Daftar
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div id="mobile-menu-drawer" className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <form onSubmit={handleSearchSubmit} className="mb-3">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari materi kursus..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-transparent focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </form>

            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => {
                  navigateTo(link.view, link.params);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {link.badge}
                  </span>
                )}
              </button>
            ))}

            {/* Mobile Dark Mode Switch */}
            <div className="pt-2 pb-1 border-t border-slate-200 dark:border-slate-800">
              <button
                id="mobile-drawer-theme-toggle"
                onClick={() => {
                  toggleDarkMode();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-semibold"
              >
                <div className="flex items-center gap-2">
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                  <span>{isDarkMode ? 'Tampilan: Mode Gelap' : 'Tampilan: Mode Terang'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-[10px] font-bold shadow-xs">
                  {isDarkMode ? 'Ganti ke Siang' : 'Ganti ke Malam'}
                </span>
              </button>
            </div>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  navigateTo('admin');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Panel Admin & Pengaturan</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
