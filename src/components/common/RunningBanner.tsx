import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight } from 'lucide-react';

export const RunningBanner: React.FC = () => {
  const { websiteSettings, navigateTo } = useApp();
  const { runningText } = websiteSettings;

  if (!runningText || !runningText.enabled) return null;

  return (
    <div id="lesinaja-running-banner" className="bg-blue-600 text-white text-xs py-2 px-4 overflow-hidden border-b border-blue-700 relative z-30 shadow-xs">
      <div className="flex items-center">
        <div className="flex items-center gap-1.5 shrink-0 bg-white/20 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-widest mr-3 border border-white/30">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Pengumuman</span>
        </div>

        <div className="overflow-hidden whitespace-nowrap w-full relative">
          <div
            className="animate-marquee inline-block font-bold text-xs uppercase tracking-wider text-white/95"
            style={{ '--marquee-speed': `${runningText.speed || 25}s` } as React.CSSProperties}
          >
            <span className="mr-12">{runningText.text}</span>
            <span className="mr-12">{runningText.text}</span>
          </div>
        </div>

        {runningText.linkText && (
          <button
            id="running-banner-link-btn"
            onClick={() => navigateTo('courses')}
            className="hidden md:inline-flex items-center gap-1 shrink-0 ml-3 bg-white text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-md text-xs font-bold transition shadow-xs"
          >
            <span>{runningText.linkText}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
