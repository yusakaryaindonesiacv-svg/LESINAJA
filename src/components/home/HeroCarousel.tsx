import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

export const HeroCarousel: React.FC = () => {
  const { websiteSettings, navigateTo } = useApp();
  const rawSlides = Array.isArray(websiteSettings?.carouselSlides) ? websiteSettings.carouselSlides : [];
  const slides = rawSlides.filter(s => s && s.active);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (!slides.length) return null;

  const slide = slides[currentSlide] || slides[0];
  if (!slide) return null;

  return (
    <section
      id="hero-carousel-section"
      className="relative overflow-hidden rounded-xl sm:rounded-2xl mx-2.5 sm:mx-6 lg:mx-8 mt-2 sm:mt-6 bg-slate-950 border border-slate-800 shadow-xl sm:shadow-2xl"
    >
      {/* Background Image Container - 16:9 Landscape on mobile screens, 100% bright and vibrant */}
      <div className="relative aspect-[16/9] sm:aspect-auto sm:min-h-[460px] lg:min-h-[500px] flex items-center w-full overflow-hidden bg-slate-900">
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-100 brightness-[1.03] transform transition-transform duration-1000 scale-100 group-hover:scale-105"
        />
        {/* Soft, minimal gradient: focused only on the text area on the left to maximize overall image brightness */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent sm:from-black/65 sm:via-black/20 sm:to-transparent z-10 pointer-events-none" />
        {/* Very subtle bottom vignette for slide indicators */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none" />

        {/* Content with high contrast & crisp text legibility */}
        <div className="relative z-20 w-full max-w-2xl px-4 sm:px-12 lg:px-16 py-3 sm:py-12 space-y-2 sm:space-y-4 text-left flex flex-col justify-center h-full">
          {slide.badge && (
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-slate-950/85 border border-blue-400/50 text-blue-300 text-[8px] sm:text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md self-start shadow-lg shadow-black/50">
              <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-blue-400 shrink-0" />
              <span>{slide.badge}</span>
            </div>
          )}

          <h1 className="font-heading font-extrabold text-sm sm:text-3xl lg:text-5xl text-white tracking-tight leading-tight line-clamp-2 sm:line-clamp-none max-w-xs sm:max-w-none [text-shadow:_0_2px_12px_rgba(0,0,0,0.95),_0_1px_4px_rgba(0,0,0,0.95)]">
            {slide.title}
          </h1>

          <p className="text-[10px] sm:text-base text-white font-medium max-w-xl leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none hidden xs:block [text-shadow:_0_1px_8px_rgba(0,0,0,0.95),_0_1px_3px_rgba(0,0,0,0.95)]">
            {slide.subtitle}
          </p>

          <div className="flex items-center gap-1.5 sm:gap-3 pt-1 sm:pt-3">
            <button
              id="hero-cta-btn"
              onClick={() => {
                if (slide?.ctaLink && typeof slide.ctaLink === 'string' && slide.ctaLink.startsWith('#')) {
                  const targetView = slide.ctaLink.replace('#', '');
                  if (targetView === 'courses' || targetView === 'live-sessions') {
                    navigateTo(targetView);
                  } else {
                    navigateTo('courses');
                  }
                } else {
                  navigateTo('courses');
                }
              }}
              className="bg-blue-600 text-white px-3 py-1.5 sm:px-6 sm:py-3.5 rounded sm:rounded-xl text-[10px] sm:text-sm font-bold shadow-lg shadow-blue-600/40 hover:bg-blue-500 hover:shadow-blue-500/50 transition-all flex items-center gap-1 sm:gap-2 leading-none cursor-pointer active:scale-95"
            >
              <span>{slide.ctaText || 'Mulai Belajar'}</span>
              <ArrowRight className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
            </button>

            <button
              id="hero-live-sessions-btn"
              onClick={() => navigateTo('live-sessions')}
              className="px-2.5 py-1.5 sm:px-5 sm:py-3.5 rounded sm:rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white text-[10px] sm:text-sm font-bold border border-slate-600/80 hover:border-slate-500 transition-all backdrop-blur-md shadow-md leading-none cursor-pointer active:scale-95"
            >
              Jadwal Live
            </button>
          </div>
        </div>
      </div>

      {/* Slider Controls */}
      {slides.length > 1 && (
        <>
          <button
            id="prev-slide-btn"
            onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/80 hover:border-slate-500 transition-all backdrop-blur-md hidden sm:block cursor-pointer shadow-lg active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            id="next-slide-btn"
            onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/80 hover:border-slate-500 transition-all backdrop-blur-md hidden sm:block cursor-pointer shadow-lg active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === idx ? 'w-5 sm:w-8 bg-blue-500 shadow-md shadow-blue-500/50' : 'w-2 sm:w-2.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
