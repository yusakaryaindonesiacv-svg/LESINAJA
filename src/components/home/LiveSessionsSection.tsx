import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Radio,
  ExternalLink,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export const LiveSessionsSection: React.FC = () => {
  const { liveSessions, currentUser, registerForLiveSession, showToast } = useApp();

  const handleJoinSession = (meetUrl: string, title: string) => {
    showToast(`Membuka tautan live session: "${title}"`);
    window.open(meetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="live-sessions-section" className="py-8 sm:py-12 bg-slate-950 text-white rounded-xl sm:rounded-2xl mx-2.5 sm:mx-6 lg:mx-8 px-3.5 sm:px-10 border border-slate-800 shadow-xl sm:shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-2">
              <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse text-rose-400" />
              <span>Sesi Mentoring Langsung</span>
            </div>
            <h2 className="font-heading font-extrabold text-xl sm:text-3xl text-white">
              Jadwal Sesi Live & Bedah Kasus
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-0.5 sm:mt-1">
              Konsultasi langsung, tanya jawab koding, dan review portofolio tatap muka online bersama mentor praktisi.
            </p>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {liveSessions.map(session => {
            const isRegistered = currentUser && session.registeredStudentIds.includes(currentUser.id);

            return (
              <div
                key={session.id}
                id={`live-session-card-${session.id}`}
                className={`rounded-2xl p-5 sm:p-6 border flex flex-col justify-between transition-all duration-300 ${
                  session.isLiveNow
                    ? 'bg-slate-900/90 border-rose-500/50 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-600/10 text-blue-400 border border-blue-500/20">
                      {session.platform}
                    </span>
                    {session.isLiveNow ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded-full animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        SEDANG BERLANGSUNG
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">
                        {session.durationMinutes} Menit
                      </span>
                    )}
                  </div>

                  {/* Title & Course */}
                  <div>
                    <h3 className="font-heading font-bold text-base text-white line-clamp-2">
                      {session.title}
                    </h3>
                    <p className="text-xs text-blue-400 mt-1 font-medium truncate">
                      {session.courseTitle}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {session.description}
                  </p>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 py-2 border-y border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>{session.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>{session.time}</span>
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <img
                      src={session.instructorAvatar}
                      alt={session.instructorName}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/20"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {session.instructorName}
                      </p>
                      <p className="text-[10px] text-slate-400">Mentor Utama</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 mt-2">
                  {session.isLiveNow ? (
                    <button
                      id={`join-live-btn-${session.id}`}
                      onClick={() => handleJoinSession(session.meetUrl, session.title)}
                      className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Masuk Ruang Sesi Live Sekarang</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      id={`register-live-btn-${session.id}`}
                      onClick={() => registerForLiveSession(session.id)}
                      className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs transition flex items-center justify-center gap-1.5 ${
                        isRegistered
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      }`}
                    >
                      {isRegistered ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Sudah Terdaftar • Batalkan</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Daftar Pengingat Sesi</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
