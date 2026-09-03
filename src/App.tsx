import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Course } from './types';
import { trackFBPageView } from './utils/facebookPixel';

// Common Components
import { RunningBanner } from './components/common/RunningBanner';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { SocialProofPopup } from './components/common/SocialProofPopup';

// Views
import { HomeView } from './components/home/HomeView';
import { CourseCatalogView } from './components/home/CourseCatalogView';
import { CourseDetailView } from './components/home/CourseDetailView';
import { LiveSessionsSection } from './components/home/LiveSessionsSection';
import { CustomPageView } from './components/home/CustomPageView';
import { CoursePlayerView } from './components/student/CoursePlayerView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { CertificateViewer } from './components/student/CertificateViewer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { InstructorDashboard } from './components/instructor/InstructorDashboard';

const MainLayout: React.FC = () => {
  const {
    currentUser,
    currentView,
    viewParams,
    certificates,
    navigateTo,
    toastMessage,
    hideToast
  } = useApp();

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'register_instructor'>('login');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState<Course | null>(null);

  // Register PWA service worker safely without aggressive auto-reload loops
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          // Check for service worker updates gracefully
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Service worker updated in background
                  console.log('[PWA] Versi baru aplikasi siap digunakan.');
                }
              });
            }
          });
        })
        .catch(err => {
          console.log('[PWA] Service worker registration note:', err);
        });
    }
  }, []);

  // Track page view changes for Facebook Pixel
  useEffect(() => {
    trackFBPageView(currentView);
  }, [currentView]);

  const handleOpenAuth = (mode: 'login' | 'register' | 'register_instructor' = 'login') => {
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };

  const handleEnrollCourse = (course: Course) => {
    setSelectedCourseForCheckout(course);
    setIsCheckoutOpen(true);
  };

  // Find certificate for view-certificate route
  const currentCert = viewParams.certNumber
    ? certificates.find(c => c.certificateNumber.toLowerCase() === String(viewParams.certNumber).toLowerCase())
    : (viewParams.courseId && currentUser
        ? certificates.find(c => c.courseId === viewParams.courseId && (c.studentId === currentUser.id || c.studentName?.toLowerCase() === currentUser.name?.toLowerCase()))
        : certificates[0]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 pb-16 md:pb-0">
      {/* 1. Running Announcement Bar */}
      <RunningBanner />

      {/* 2. Main Navigation Bar */}
      <Navbar onOpenAuth={handleOpenAuth} />

      {/* 3. Mobile PWA Install Notification Prompt */}
      <PwaInstallPrompt />

      {/* 4. Main Dynamic Content View */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView onEnroll={handleEnrollCourse} />
        )}

        {currentView === 'courses' && (
          <CourseCatalogView onEnroll={handleEnrollCourse} />
        )}

        {currentView === 'course-detail' && viewParams.courseId && (
          <CourseDetailView
            courseId={viewParams.courseId}
            onEnroll={handleEnrollCourse}
          />
        )}

        {currentView === 'course-player' && viewParams.courseId && (
          <CoursePlayerView
            courseId={viewParams.courseId}
            initialModuleId={viewParams.moduleId}
            onOpenCheckout={handleEnrollCourse}
          />
        )}

        {currentView === 'live-sessions' && (
          <div className="py-8">
            <LiveSessionsSection />
          </div>
        )}

        {(currentView === 'student-dashboard' || currentView === 'dashboard' || currentView === 'my-courses' || currentView === 'my-certificates') && (
          <StudentDashboard onOpenAuth={handleOpenAuth} />
        )}

        {(currentView === 'admin-dashboard' || currentView === 'admin') && (
          <AdminDashboard />
        )}

        {(currentView === 'instructor-dashboard' || currentView === 'instructor') && (
          <InstructorDashboard />
        )}

        {currentView === 'verify-certificate' && (
          <CustomPageView slug="faq" />
        )}

        {currentView === 'view-certificate' && (
          currentCert ? (
            <CertificateViewer
              certificate={currentCert}
              onBack={() => navigateTo('student-dashboard')}
            />
          ) : (
            <div className="max-w-md mx-auto py-16 text-center">
              <h3 className="font-bold text-base">Sertifikat Tidak Ditemukan</h3>
              <button
                onClick={() => navigateTo('student-dashboard')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Kembali ke Dashboard
              </button>
            </div>
          )
        )}

        {currentView === 'custom-page' && (
          <CustomPageView slug={viewParams.slug || 'tentang-kami'} />
        )}
      </main>

      {/* 5. Global Footer */}
      <Footer />

      {/* 6. Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* 7. Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authInitialMode}
        onClose={() => setIsAuthOpen(false)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        course={selectedCourseForCheckout}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedCourseForCheckout(null);
        }}
        onSuccess={() => {
          if (selectedCourseForCheckout) {
            navigateTo('course-player', { courseId: selectedCourseForCheckout.id });
          }
        }}
      />

      {/* 8. Social Proof Order Notification Popup (Bottom-Left) */}
      <SocialProofPopup />

      {/* 9. Toast Notification Popup */}
      {toastMessage && (
        <div
          id="toast-notification-banner"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <p className="text-xs font-medium leading-relaxed">{toastMessage}</p>
          <button
            onClick={hideToast}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
