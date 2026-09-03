import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Check,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface ProtectedVideoPlayerProps {
  videoUrl: string;
  title: string;
  courseId: string;
  moduleId: string;
  duration?: string;
  durationMinutes?: number;
  isCompleted: boolean;
  savedWatchPct: number;
  savedMaxSeconds: number;
  onProgressUpdate: (percentage: number, currentSeconds: number) => void;
  onReached90?: () => void;
}

// Helper to parse duration strings like "1:40", "01:40", "100 detik", "10:00", or durationMinutes into total seconds
export const parseDurationToSeconds = (durationStr?: string, durationMinutes?: number): number => {
  if (durationStr && typeof durationStr === 'string') {
    const clean = durationStr.trim().toLowerCase();
    
    // Pattern "MM:SS" or "HH:MM:SS"
    if (clean.includes(':')) {
      const parts = clean.split(':').map(p => parseInt(p, 10) || 0);
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }

    // Pattern "100 detik" or "100s" or "100"
    const matchSeconds = clean.match(/^(\d+)\s*(detik|s|sec|seconds)?$/);
    if (matchSeconds && matchSeconds[1]) {
      return parseInt(matchSeconds[1], 10);
    }

    // Pattern "5 menit" or "5m" or "5 mins"
    const matchMinutes = clean.match(/^(\d+(\.\d+)?)\s*(menit|m|min|mins|minutes)$/);
    if (matchMinutes && matchMinutes[1]) {
      return Math.round(parseFloat(matchMinutes[1]) * 60);
    }
  }

  if (durationMinutes && durationMinutes > 0) {
    return Math.round(durationMinutes * 60);
  }

  return 300; // Default 5 minutes (300s) fallback
};

export const formatSecondsToTime = (sec: number): string => {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const remainingS = s % 60;
  return `${m}:${remainingS < 10 ? '0' : ''}${remainingS}`;
};

// Global YouTube API loader tracker
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const ProtectedVideoPlayer: React.FC<ProtectedVideoPlayerProps> = ({
  videoUrl,
  title,
  courseId,
  moduleId,
  duration: moduleDurationStr,
  durationMinutes: moduleDurationMinutes,
  isCompleted,
  savedWatchPct,
  savedMaxSeconds,
  onProgressUpdate,
  onReached90
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerInstanceRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<any>(null);

  // Stable callback refs so useEffect never triggers re-initialization of player
  const onProgressUpdateRef = useRef(onProgressUpdate);
  onProgressUpdateRef.current = onProgressUpdate;
  const onReached90Ref = useRef(onReached90);
  onReached90Ref.current = onReached90;

  const initialDuration = parseDurationToSeconds(moduleDurationStr, moduleDurationMinutes);
  const [videoDurationSec, setVideoDurationSec] = useState<number>(initialDuration || 100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentWatchedSec, setCurrentWatchedSec] = useState<number>(savedMaxSeconds || 0);
  const [currentPct, setCurrentPct] = useState<number>(savedWatchPct || 0);
  const [showSeekAlert, setShowSeekAlert] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState<boolean>((savedMaxSeconds || 0) > 0);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const maxWatchedRef = useRef<number>(savedMaxSeconds || 0);
  const seekAlertTimeoutRef = useRef<any>(null);
  const hasTriggered90Ref = useRef<boolean>((savedWatchPct || 0) >= 90);

  // Sync state when switching modules
  useEffect(() => {
    const savedSec = savedMaxSeconds || 0;
    maxWatchedRef.current = savedSec;
    setCurrentWatchedSec(savedSec);
    setCurrentPct(savedWatchPct || 0);
    setHasStartedPlaying(savedSec > 0);
    const parsedSec = parseDurationToSeconds(moduleDurationStr, moduleDurationMinutes);
    if (parsedSec > 0) {
      setVideoDurationSec(parsedSec);
    }
    if ((savedWatchPct || 0) >= 90) {
      hasTriggered90Ref.current = true;
    }
  }, [moduleId, moduleDurationStr, moduleDurationMinutes]);

  // Fullscreen event listener with vendor prefix support
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isDocFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls when playing
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  // Extract YouTube ID if any
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      return url.split('v=')[1]?.split('&')[0] || null;
    }
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0] || null;
    }
    if (url.includes('youtube.com/embed/')) {
      return url.split('youtube.com/embed/')[1]?.split('?')[0] || null;
    }
    return null;
  };

  const ytVideoId = extractYouTubeId(videoUrl);

  // Direct video detection
  const isDirect = (url: string) => {
    if (!url) return false;
    const clean = url.toLowerCase().split('?')[0];
    return (
      clean.endsWith('.mp4') ||
      clean.endsWith('.webm') ||
      clean.endsWith('.ogg') ||
      clean.endsWith('.mov') ||
      clean.endsWith('.m4v') ||
      clean.endsWith('.mkv') ||
      url.includes('supabase.co/storage') ||
      url.startsWith('data:video/') ||
      url.startsWith('blob:')
    );
  };

  const isDirectVideo = isDirect(videoUrl);

  const triggerSeekNotice = useCallback(() => {
    setShowSeekAlert(true);
    if (seekAlertTimeoutRef.current) clearTimeout(seekAlertTimeoutRef.current);
    seekAlertTimeoutRef.current = setTimeout(() => {
      setShowSeekAlert(false);
    }, 2500);
  }, []);

  // Update progress helper: calculates percentage and checks 90% threshold
  const recordProgress = useCallback((seconds: number, totalDuration: number) => {
    const validSec = Math.max(0, Math.floor(seconds));
    if (validSec > maxWatchedRef.current) {
      maxWatchedRef.current = validSec;
    }
    const effectiveSec = Math.max(validSec, maxWatchedRef.current);
    const duration = totalDuration > 0 ? totalDuration : videoDurationSec > 0 ? videoDurationSec : 100;
    const pct = Math.min(100, Math.round((effectiveSec / duration) * 100));

    setCurrentWatchedSec(effectiveSec);
    setCurrentPct(pct);
    if (onProgressUpdateRef.current) {
      onProgressUpdateRef.current(pct, effectiveSec);
    }

    // Reached 90% threshold
    if ((pct >= 90 || effectiveSec >= duration * 0.9) && !hasTriggered90Ref.current) {
      hasTriggered90Ref.current = true;
      if (onReached90Ref.current) {
        onReached90Ref.current();
      }
    }
  }, [videoDurationSec]);

  // ==========================================
  // 1. DIRECT HTML5 VIDEO LOGIC
  // ==========================================
  const handleHTML5Play = () => {
    setIsPlaying(true);
    setHasStartedPlaying(true);
  };

  const handleHTML5Pause = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      const current = Math.floor(videoRef.current.currentTime);
      recordProgress(current, videoRef.current.duration || videoDurationSec);
    }
  };

  const handleHTML5TimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const current = Math.floor(video.currentTime);
    const duration = video.duration || videoDurationSec;

    if (video.duration && Math.abs(video.duration - videoDurationSec) > 1) {
      setVideoDurationSec(Math.round(video.duration));
    }

    // Fast-forward protection
    if (current > maxWatchedRef.current + 4) {
      video.currentTime = maxWatchedRef.current;
      triggerSeekNotice();
      return;
    }

    recordProgress(current, duration);
  };

  const handleHTML5Seeking = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime > maxWatchedRef.current + 4) {
      video.currentTime = maxWatchedRef.current;
      triggerSeekNotice();
    }
  };

  const handleHTML5LoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.duration && video.duration > 0) {
      setVideoDurationSec(Math.round(video.duration));
    }
    // Resume playback from the exact second paused if previously watched
    if (savedMaxSeconds > 0 && savedMaxSeconds < (video.duration || 99999)) {
      video.currentTime = savedMaxSeconds;
      setCurrentWatchedSec(savedMaxSeconds);
    }
  };

  // ==========================================
  // 2. YOUTUBE IFRAME API INTEGRATION (Controls Disabled / Custom UI)
  // ==========================================
  useEffect(() => {
    if (isDirectVideo || !ytVideoId) return;

    let isMounted = true;
    const containerId = `yt-player-${moduleId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const createPlayer = () => {
      if (!window.YT || !window.YT.Player || !isMounted) return;
      const targetElem = document.getElementById(containerId);
      if (!targetElem) return;

      try {
        if (ytPlayerInstanceRef.current) {
          try {
            ytPlayerInstanceRef.current.destroy();
          } catch (e) {
            // ignore
          }
          ytPlayerInstanceRef.current = null;
        }

        ytPlayerInstanceRef.current = new window.YT.Player(containerId, {
          videoId: ytVideoId,
          playerVars: {
            autoplay: 0,
            controls: 0, // Hides native YouTube bar, logo, and 'Watch on YouTube' button!
            disablekb: 1, // Disables keyboard shortcuts that could open external YouTube tabs
            modestbranding: 1, // Minimizes YouTube branding
            rel: 0, // No related external videos
            playsinline: 1,
            enablejsapi: 1,
            fs: 0, // Custom fullscreen used instead
            iv_load_policy: 3, // Disable annotations
            origin: window.location.origin,
            start: savedMaxSeconds > 0 ? Math.floor(savedMaxSeconds) : 0
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              try {
                const dur = event.target.getDuration();
                if (dur && dur > 0) {
                  setVideoDurationSec(Math.round(dur));
                }
                if (savedMaxSeconds > 0) {
                  event.target.seekTo(savedMaxSeconds, true);
                }
              } catch (err) {
                console.warn('YT ready note:', err);
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              const state = event.data;
              // 1 = PLAYING
              if (state === 1) {
                setIsPlaying(true);
                setHasStartedPlaying(true);

                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = setInterval(() => {
                  try {
                    if (ytPlayerInstanceRef.current && ytPlayerInstanceRef.current.getCurrentTime) {
                      const curTime = Math.floor(ytPlayerInstanceRef.current.getCurrentTime());
                      const dur = Math.round(ytPlayerInstanceRef.current.getDuration() || videoDurationSec);

                      // Anti-seek check
                      if (curTime > maxWatchedRef.current + 5) {
                        ytPlayerInstanceRef.current.seekTo(maxWatchedRef.current, true);
                        triggerSeekNotice();
                        return;
                      }

                      recordProgress(curTime, dur);
                    }
                  } catch (e) {
                    // ignore
                  }
                }, 1000);
              } else {
                // PAUSED (2), ENDED (0), BUFFERING (3) -> pause timer immediately
                setIsPlaying(false);
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                }
                try {
                  if (ytPlayerInstanceRef.current && ytPlayerInstanceRef.current.getCurrentTime) {
                    const pausedTime = Math.floor(ytPlayerInstanceRef.current.getCurrentTime());
                    recordProgress(pausedTime, videoDurationSec);
                  }
                } catch (e) {
                  // ignore
                }
              }
            }
          }
        });
      } catch (err) {
        console.warn('YT init error:', err);
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    } else {
      createPlayer();
    }

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (ytPlayerInstanceRef.current) {
        try {
          ytPlayerInstanceRef.current.destroy();
        } catch (e) {
          // ignore
        }
        ytPlayerInstanceRef.current = null;
      }
    };
  }, [ytVideoId, isDirectVideo, moduleId]);

  // ==========================================
  // 3. UNIFIED PLAYBACK CONTROLS
  // ==========================================
  const togglePlay = () => {
    if (isDirectVideo) {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(e => console.warn(e));
        }
      }
    } else if (ytPlayerInstanceRef.current) {
      try {
        if (isPlaying) {
          ytPlayerInstanceRef.current.pauseVideo();
        } else {
          ytPlayerInstanceRef.current.playVideo();
        }
      } catch (e) {
        console.warn(e);
      }
    } else {
      setIsPlaying(!isPlaying);
      setHasStartedPlaying(true);
    }
  };

  const handleSeek = (newSec: number) => {
    const target = Math.max(0, Math.min(newSec, videoDurationSec));
    // Check anti-skip: cannot seek forward past highest watched seconds
    if (target > maxWatchedRef.current + 3) {
      triggerSeekNotice();
      return;
    }

    if (isDirectVideo && videoRef.current) {
      videoRef.current.currentTime = target;
    } else if (ytPlayerInstanceRef.current && ytPlayerInstanceRef.current.seekTo) {
      try {
        ytPlayerInstanceRef.current.seekTo(target, true);
      } catch (e) {
        console.warn(e);
      }
    }
    setCurrentWatchedSec(target);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (isDirectVideo && videoRef.current) {
      videoRef.current.volume = newVol / 100;
      videoRef.current.muted = newVol === 0;
    } else if (ytPlayerInstanceRef.current) {
      try {
        if (newVol === 0) {
          ytPlayerInstanceRef.current.mute();
        } else {
          ytPlayerInstanceRef.current.unMute();
          ytPlayerInstanceRef.current.setVolume(newVol);
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(volume > 0 ? volume : 80);
    } else {
      handleVolumeChange(0);
    }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current as any;
    if (!el) return;

    const isDocFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isDocFullscreen) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch((err: any) => console.warn(err));
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err: any) => console.warn(err));
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const target90Sec = Math.round(videoDurationSec * 0.9);
  const is90Reached = currentPct >= 90 || currentWatchedSec >= target90Sec;
  const ytContainerId = `yt-player-${moduleId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full flex flex-col justify-between bg-black select-none overflow-hidden group"
    >
      {/* Top Protective Header Bar: Auto-hides during playback to keep video view clear & unobstructed */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 px-3 sm:px-5 py-2 sm:py-3 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent flex items-center justify-between gap-2 transition-all duration-300 pointer-events-auto ${
          showControls || !isPlaying || isFullscreen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isFullscreen ? (
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition active:scale-95 border border-emerald-400/40"
              title="Kembali ke tampilan normal (Keluar Layar Penuh)"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          )}
          <span className="text-[11px] sm:text-xs font-bold text-slate-100 tracking-wide truncate max-w-[180px] sm:max-w-md drop-shadow">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Subtle LMS Protection Indicator */}
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-300 bg-slate-900/80 border border-slate-700/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow backdrop-blur-md flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Player Terproteksi LMS</span>
            <span className="sm:hidden text-[9.5px] text-cyan-300 font-bold">Terproteksi</span>
          </span>

          {/* Quick Fullscreen / Perlebar button in top header */}
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-[10px] sm:text-xs font-bold border border-slate-700 shadow flex items-center gap-1.5 transition active:scale-95"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Perlebar / Layar Penuh'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xs:inline">Kecilkan</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">Perlebar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Video Canvas Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-slate-950">
        {isDirectVideo ? (
          <video
            ref={videoRef}
            key={videoUrl}
            src={videoUrl}
            disablePictureInPicture
            playsInline
            onPlay={handleHTML5Play}
            onPause={handleHTML5Pause}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={handleHTML5TimeUpdate}
            onSeeking={handleHTML5Seeking}
            onSeeked={handleHTML5Seeking}
            onLoadedMetadata={handleHTML5LoadedMetadata}
            onContextMenu={e => e.preventDefault()}
            className="w-full h-full object-contain bg-black"
          >
            Browser Anda tidak mendukung pemutar video HTML5.
          </video>
        ) : ytVideoId ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* The YouTube iframe (pointer-events disabled so no YouTube links/share/channel can ever be clicked) */}
            <div
              id={ytContainerId}
              ref={ytPlayerContainerRef}
              className="w-full h-full pointer-events-none"
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <iframe
              src={videoUrl}
              title={title}
              className="w-full h-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; encrypted-media"
            />
          </div>
        )}

        {/* Global Click Shield: Clicking anywhere on video toggles Play/Pause safely without external YouTube interaction */}
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-20 cursor-pointer flex items-center justify-center bg-transparent"
        >
          {/* Big Center Play/Pause Indicator (visible when paused) */}
          {!isPlaying && (
            <div className="w-20 h-20 rounded-full bg-slate-950/80 border-2 border-emerald-500/80 text-emerald-400 flex items-center justify-center shadow-2xl backdrop-blur-md transition transform hover:scale-110 active:scale-95 group-hover:opacity-100">
              <Play className="w-10 h-10 translate-x-0.5 fill-emerald-400" />
            </div>
          )}
        </div>

        {/* Anti-Seek Warning Alert Overlay */}
        {showSeekAlert && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-rose-950/95 text-rose-200 border border-rose-600/80 rounded-xl shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 animate-bounce">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>⚠️ Video Terproteksi: Dilarang melompati materi yang belum ditonton!</span>
          </div>
        )}
      </div>

      {/* Modern Custom LMS Video Controls Bar */}
      <div
        className={`relative z-30 bg-slate-950/95 border-t border-slate-800/80 px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col gap-1.5 sm:gap-2 transition-all duration-300 backdrop-blur-lg ${
          showControls || !isPlaying || isFullscreen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        {/* Anti-Skip Progress Bar Scrubber */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            handleSeek(pos * (videoDurationSec || 1));
          }}
          className="relative w-full py-1 flex items-center group/bar cursor-pointer"
        >
          <div className="relative w-full h-2 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/50">
            {/* 90% Target Marker */}
            <div
              className="absolute top-0 bottom-0 left-[90%] w-1 bg-amber-400 z-10 shadow-sm"
              title="Syarat Kelulusan: 90% Durasi Video"
            />
            {/* Watched Progress Fill */}
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                is90Reached
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/40'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (currentWatchedSec / (videoDurationSec || 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Left Controls: Play/Pause, Rewind 10s, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play / Pause Button */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow active:scale-95"
              title={isPlaying ? 'Jeda (Pause)' : 'Putar (Play)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={() => handleSeek(currentWatchedSec - 10)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95"
              title="Putar Kembali 10 Detik"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white transition"
                title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-slate-200" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={e => handleVolumeChange(parseInt(e.target.value, 10))}
                className="hidden sm:block w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Clean Time Display */}
            <div className="flex items-center gap-1 text-slate-300 font-mono text-[10px] sm:text-[11px] bg-slate-900 px-2 py-1 rounded border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold text-white">{formatSecondsToTime(currentWatchedSec)}</span>
              <span className="text-slate-500">/</span>
              <span>{formatSecondsToTime(videoDurationSec)}</span>
            </div>
          </div>

          {/* Right Controls: Completion Badge & Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status Badge */}
            {is90Reached ? (
              <span className="px-2 sm:px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] sm:text-[10.5px] font-extrabold flex items-center gap-1 shadow-sm">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">Sertifikat Terbuka ✓</span>
                <span className="xs:hidden">90% ✓</span>
              </span>
            ) : (
              <span className="px-2 sm:px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[10px] sm:text-[10.5px] font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>{currentPct}%<span className="hidden xs:inline"> / 90%</span></span>
              </span>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg transition active:scale-95 flex items-center gap-1 ${
                isFullscreen
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={isFullscreen ? 'Kembali (Keluar Layar Penuh)' : 'Perlebar / Layar Penuh'}
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">Kembali</span>
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">Perlebar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
