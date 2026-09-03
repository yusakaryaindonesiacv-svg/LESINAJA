import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
  Smartphone,
  Send,
  ExternalLink,
  HelpCircle,
  Check
} from 'lucide-react';
import {
  OtpSession,
  OtpChannel,
  verifyOtpCode,
  generateOtpSession,
  getWhatsAppOtpUrl,
  normalizePhoneNumber,
  dispatchOtpToGateway
} from '../../utils/otpService';
import { OtpTutorialModal } from './OtpTutorialModal';
import { useApp } from '../../context/AppContext';

interface OtpVerificationModalProps {
  isOpen: boolean;
  channel: OtpChannel;
  identifier: string; // phone or email
  studentName?: string;
  email?: string;
  phone?: string;
  initialSession: OtpSession | null;
  onSuccess: (verifiedIdentifier: string, verifiedChannel: OtpChannel) => void;
  onCancel: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  channel: initialChannel,
  identifier: initialIdentifier,
  studentName,
  email,
  phone,
  initialSession,
  onSuccess,
  onCancel
}) => {
  const { websiteSettings, showToast } = useApp();
  const [session, setSession] = useState<OtpSession | null>(initialSession);
  const [currentChannel, setCurrentChannel] = useState<OtpChannel>(initialChannel);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState<number>(30); // 30s cooldown
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchInfo, setDispatchInfo] = useState<{
    gateway?: string;
    isSimulated?: boolean;
    message?: string;
  } | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setSession(initialSession);
    setCurrentChannel(initialChannel);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMsg(null);
    setHasOpenedWhatsApp(false);

    if (initialSession && isOpen) {
      const remainingSeconds = Math.max(0, Math.floor((initialSession.expiresAt - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);

      // Trigger dispatch to backend
      setIsDispatching(true);
      dispatchOtpToGateway(initialSession).then(res => {
        setIsDispatching(false);
        setDispatchInfo({
          gateway: res.gateway,
          isSimulated: res.isSimulated,
          message: res.message
        });
      }).catch(() => {
        setIsDispatching(false);
      });
    }
  }, [initialSession, initialChannel, isOpen, websiteSettings]);

  // Expiration countdown
  useEffect(() => {
    if (!isOpen || !session) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, session]);

  // Resend cooldown countdown
  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;

    const resendTimer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(resendTimer);
  }, [isOpen, resendCooldown]);

  // Auto focus first input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    }
  }, [isOpen]);

  if (!isOpen || !session) return null;

  const activePhone = phone || (currentChannel === 'whatsapp' ? initialIdentifier : '');
  const activeEmail = email || (currentChannel === 'email' ? initialIdentifier : '');

  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // Handle paste of whole 6-digit code
      const pastedChars = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedChars[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pastedChars.length, 5);
      inputRefs.current[nextIndex]?.focus();

      if (pastedChars.length === 6) {
        handleVerify(pastedChars.join(''));
      }
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setErrorMsg(null);

    // Auto advance to next input box
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits are filled
    if (cleanVal && index === 5 && newDigits.every(d => d !== '')) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (codeToVerify?: string) => {
    const fullCode = codeToVerify || otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Harap masukkan lengkap 6 digit kode OTP verifikasi.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    setTimeout(() => {
      const result = verifyOtpCode(session, fullCode);
      if (result.success) {
        setIsVerifying(false);
        showToast('Verifikasi OTP berhasil! Mengarahkan...');
        onSuccess(session.identifier, currentChannel);
      } else {
        setIsVerifying(false);
        setErrorMsg(result.error || 'Kode OTP tidak valid.');
      }
    }, 300);
  };

  const handleResend = (targetChannel: OtpChannel = currentChannel) => {
    if (resendCooldown > 0) return;

    const targetIdentifier = targetChannel === 'whatsapp' ? (activePhone || initialIdentifier) : (activeEmail || initialIdentifier);
    const newSession = generateOtpSession(targetChannel, targetIdentifier, {
      name: studentName,
      email: activeEmail,
      phone: activePhone
    });

    setSession(newSession);
    setCurrentChannel(targetChannel);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMsg(null);
    setResendCooldown(30);
    setHasOpenedWhatsApp(false);
    const remaining = Math.max(0, Math.floor((newSession.expiresAt - Date.now()) / 1000));
    setTimeLeft(remaining);

    // Dispatch to gateway
    dispatchOtpToGateway(newSession);

    setSuccessNotice(`Kode OTP baru telah disiapkan untuk ${targetChannel === 'whatsapp' ? 'WhatsApp' : 'Email'} Anda.`);
    setTimeout(() => setSuccessNotice(null), 4000);
    inputRefs.current[0]?.focus();
  };

  const handleOpenWhatsApp = () => {
    if (!activePhone || !session) return;
    const url = session.directWhatsAppUrl || getWhatsAppOtpUrl(activePhone, session.code, studentName);
    window.open(url, '_blank', 'noopener,noreferrer');
    setHasOpenedWhatsApp(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div id="otp-verification-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          id="otp-verification-modal-card"
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div
            className={`p-6 text-white text-center relative shrink-0 transition-colors ${
              currentChannel === 'whatsapp'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700'
            }`}
          >
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner border border-white/20">
              {currentChannel === 'whatsapp' ? (
                <Smartphone className="w-7 h-7 text-white" />
              ) : (
                <Mail className="w-7 h-7 text-white" />
              )}
            </div>

            <h3 className="font-heading font-extrabold text-xl">
              Verifikasi Kode OTP Keamanan
            </h3>

            <p className="text-xs text-white/90 mt-1 max-w-xs mx-auto leading-relaxed">
              Kode OTP 6-digit disiapkan untuk{' '}
              <span className="font-bold underline decoration-white/50">
                {currentChannel === 'whatsapp' ? 'Nomor WhatsApp' : 'Kotak Masuk Email'}
              </span>
              : <br />
              <strong className="font-mono text-sm tracking-wide text-white bg-black/20 px-2 py-0.5 rounded-lg inline-block mt-1">
                {currentChannel === 'whatsapp' ? activePhone : activeEmail}
              </strong>
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Status delivery instructions (Real Dispatch Guidance) */}
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${
                currentChannel === 'whatsapp'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {currentChannel === 'whatsapp' ? (
                  <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">
                      {currentChannel === 'whatsapp'
                        ? 'Pengiriman WhatsApp OTP'
                        : 'Pemeriksaan Email Masuk (Inbox)'}
                    </p>
                    {isDispatching && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Mengirim pesan...</span>
                      </span>
                    )}
                  </div>

                  {currentChannel === 'whatsapp' && (
                    <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                      Kode OTP telah dipersiapkan. Klik tombol hijau di bawah untuk langsung membuka WhatsApp.
                    </p>
                  )}

                  {currentChannel === 'email' && (
                    <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                      Periksa kotak masuk email Anda (termasuk folder spam jika perlu), atau gunakan tombol kirim ulang OTP.
                    </p>
                  )}
                </div>
              </div>

              {/* Action button for quick WhatsApp access */}
              {currentChannel === 'whatsapp' && (
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Buka WhatsApp Sekarang</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  {hasOpenedWhatsApp && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp dibuka</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Success alert message upon resend */}
            {successNotice && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* 6 Digit OTP Inputs */}
            <div>
              <label className="block text-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                Ketik 6 Digit Angka Kode OTP
              </label>

              <div className="flex justify-center gap-2 sm:gap-2.5">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => {
                      inputRefs.current[idx] = el;
                    }}
                    id={`otp-digit-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    onPaste={e => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text');
                      handleDigitChange(idx, text);
                    }}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border ${
                      errorMsg
                        ? 'border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300'
                        : digit
                        ? currentChannel === 'whatsapp'
                          ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                          : 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden transition shadow-xs`}
                  />
                ))}
              </div>

              {errorMsg && (
                <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Timer & Switch Channel Options */}
            <div className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Berlaku: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatTime(timeLeft)}</strong>
                  </span>
                </div>

                <button
                  onClick={() => handleResend(currentChannel)}
                  disabled={resendCooldown > 0}
                  className={`font-semibold flex items-center gap-1 transition ${
                    resendCooldown > 0
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : 'text-blue-600 dark:text-blue-400 hover:underline'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform'}`} />
                  <span>{resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim Ulang OTP'}</span>
                </button>
              </div>

              {/* Channel switcher (Switch to WhatsApp or Email) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Kanal lain:</span>
                {currentChannel === 'email' && activePhone ? (
                  <button
                    type="button"
                    onClick={() => handleResend('whatsapp')}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Ganti Kirim ke WhatsApp ({activePhone})</span>
                  </button>
                ) : currentChannel === 'whatsapp' && activeEmail ? (
                  <button
                    type="button"
                    onClick={() => handleResend('email')}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Ganti Kirim ke Email ({activeEmail})</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Verification CTA & Tutorial link */}
            <div className="pt-1 space-y-2.5">
              <button
                id="submit-otp-code-btn"
                onClick={() => handleVerify()}
                disabled={isVerifying || timeLeft <= 0}
                className={`w-full py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 ${
                  currentChannel === 'whatsapp'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                } disabled:opacity-50`}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Kode OTP...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verifikasi & Lanjutkan</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsTutorialOpen(true)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 inline-flex items-center gap-1 hover:underline transition"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Panduan & Cara Kerja Gateway OTP</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Modal */}
      <OtpTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </>
  );
};


