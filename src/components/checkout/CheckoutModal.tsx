import React, { useState, useEffect, useRef } from 'react';
import { Course, Transaction, PaymentMethodType, User } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/exportUtils';
import {
  createPakasirTransaction,
  checkPakasirTransactionDetail,
  getEnvPakasirConfig,
  PAKASIR_PAYMENT_METHODS,
  PakasirMethodInfo
} from '../../utils/pakasirClient';
import {
  createPaymentkuTransaction,
  checkPaymentkuTransactionStatus,
  getEnvPaymentkuConfig,
  PAYMENTKU_CHANNELS,
  PaymentkuChannelInfo
} from '../../utils/paymentkuClient';
import {
  validateEmailDetailed,
  normalizePhoneNumber
} from '../../utils/otpService';
import {
  trackFBInitiateCheckout,
  trackFBPurchase,
  trackFBCompleteRegistration
} from '../../utils/facebookPixel';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  X,
  ShieldCheck,
  QrCode,
  Building2,
  CheckCircle,
  Zap,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  User as UserIcon,
  Mail,
  Phone,
  School,
  Sparkles,
  Package,
  Layers,
  CheckCircle2,
  Tag,
  Heart,
  Wallet,
  Store
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
  onSuccess: (courseId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  course,
  onClose,
  onSuccess
}) => {
  const {
    currentUser,
    courses,
    registerStudent,
    createTransaction,
    updateTransaction,
    approveTransaction,
    transactions,
    paymentSettings,
    courseBundles,
    getBundlesForCourse,
    getEffectiveBundleCourses,
    showToast
  } = useApp();

  const isPaymentkuActive =
    paymentSettings.activeGateway === 'paymentku' ||
    paymentSettings.activeGateway === 'both' ||
    (!paymentSettings.activeGateway && paymentSettings.enablePaymentku);

  const isPakasirActive =
    paymentSettings.activeGateway === 'pakasir' ||
    paymentSettings.activeGateway === 'both' ||
    (!paymentSettings.activeGateway && paymentSettings.enablePakasir);

  const isManualActive =
    paymentSettings.activeGateway === 'manual' ||
    paymentSettings.enableManualBank;

  const [studentName, setStudentName] = useState<string>('');
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [studentPhone, setStudentPhone] = useState<string>('');
  const [studentInstitution, setStudentInstitution] = useState<string>('');

  // Bundle purchase selection
  const [purchaseMode, setPurchaseMode] = useState<'single' | 'bundle'>('single');
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [expandedBundleCoursesId, setExpandedBundleCoursesId] = useState<string | null>(null);

  // Manual Attached Bundle Add-ons Selection
  const [selectedAttachedBundleCourseIds, setSelectedAttachedBundleCourseIds] = useState<string[]>([]);

  // Custom Price (Bayar Seikhlasnya) State
  const [customAmount, setCustomAmount] = useState<number>(() => {
    if (course?.allowCustomPrice) {
      return course.price > 0 ? course.price : (course.minCustomPrice || 25000);
    }
    return course?.price || 0;
  });

  // Email & Phone Validation States
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<string>('qris');
  const [selectedCategory, setSelectedCategory] = useState<'qris' | 'va' | 'ewallet' | 'retail' | 'manual'>('qris');
  const [step, setStep] = useState<'select' | 'pay' | 'success'>('select');
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('15:00');

  const pollTimerRef = useRef<any>(null);

  // Calculate applicable bundles for this course
  const applicableBundles = course
    ? getBundlesForCourse(course.id).filter(b => b.isActive)
    : [];

  const selectedBundle =
    purchaseMode === 'bundle'
      ? courseBundles.find(b => b.id === selectedBundleId) || applicableBundles[0] || null
      : null;

  const isCustomPriceActive = Boolean(course?.allowCustomPrice && purchaseMode === 'single');
  const baseEffectivePrice = selectedBundle
    ? selectedBundle.price
    : (isCustomPriceActive ? customAmount : (course?.price || 0));

  // Attached bundle courses calculation
  const attachedAddonCourses = (course?.attachedBundleCourses || []).map(att => {
    const fullCourse = courses.find(c => c.id === att.courseId);
    return {
      courseId: att.courseId,
      specialPrice: att.specialPrice,
      title: att.courseTitle || fullCourse?.title || 'Kursus Tambahan',
      thumbnail: att.thumbnail || fullCourse?.thumbnail || '',
      originalPrice: att.originalPrice || fullCourse?.price || fullCourse?.originalPrice || att.specialPrice * 1.5,
      fullCourse
    };
  });

  const attachedAddonTotal = purchaseMode === 'single'
    ? attachedAddonCourses
        .filter(att => selectedAttachedBundleCourseIds.includes(att.courseId))
        .reduce((sum, att) => sum + att.specialPrice, 0)
    : 0;

  const effectivePrice = baseEffectivePrice + attachedAddonTotal;

  const effectiveOriginalPrice = selectedBundle
    ? (selectedBundle.originalPrice || selectedBundle.price)
    : ((course?.originalPrice || course?.price || 0) + attachedAddonCourses
        .filter(att => selectedAttachedBundleCourseIds.includes(att.courseId))
        .reduce((sum, att) => sum + att.originalPrice, 0));
  const effectiveTitle = selectedBundle ? selectedBundle.title : (course?.title || '');
  const effectiveIncludedCourses = selectedBundle
    ? getEffectiveBundleCourses(selectedBundle)
    : (course ? [course] : []);

  // Handle email changes with real-time validation and typo detection
  const handleStudentEmailChange = (val: string) => {
    setStudentEmail(val);
    setErrorMessage(null);
    if (!val.trim()) {
      setEmailError(null);
      setEmailSuggestion(null);
      return;
    }
    const res = validateEmailDetailed(val);
    if (!res.isValid) {
      setEmailError(res.error || 'Format email tidak valid.');
      setEmailSuggestion(null);
    } else {
      setEmailError(null);
      setEmailSuggestion(res.suggestion || null);
    }
  };

  const handleApplySuggestion = (suggested: string) => {
    setStudentEmail(suggested);
    setEmailSuggestion(null);
    setEmailError(null);
  };

  // Sync current user info & custom price when available
  useEffect(() => {
    if (currentUser) {
      setStudentName(currentUser.name || '');
      setStudentEmail(currentUser.email || '');
      setStudentPhone(currentUser.phone || '');
      setStudentInstitution(currentUser.institution || '');
    }
  }, [currentUser, isOpen]);

  // Sync custom price amount when course changes or modal opens
  useEffect(() => {
    if (course) {
      if (course.allowCustomPrice) {
        setCustomAmount(course.price > 0 ? course.price : (course.minCustomPrice || 25000));
      } else {
        setCustomAmount(course.price || 0);
      }
    }
  }, [course?.id, course?.allowCustomPrice, isOpen]);

  // Track Facebook Pixel InitiateCheckout when checkout modal opens
  useEffect(() => {
    if (isOpen && course) {
      trackFBInitiateCheckout({
        id: selectedBundle ? selectedBundle.id : course.id,
        title: effectiveTitle,
        price: effectivePrice,
        category: course.category,
        isBundle: purchaseMode === 'bundle'
      });
    }
  }, [isOpen, course?.id, purchaseMode, selectedBundleId]);

  // Reset states when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setActiveTransaction(null);
      setErrorMessage(null);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    } else {
      // Sync initial category & method with active gateway setting
      if (paymentSettings.activeGateway === 'manual') {
        setSelectedCategory('manual');
        setSelectedMethod(paymentSettings.bankAccounts?.[0]?.id || 'bca_manual');
      } else if (paymentSettings.activeGateway === 'pakasir') {
        setSelectedCategory('qris');
        setSelectedMethod('qris');
      } else {
        // default to paymentku (for 'paymentku' or 'both')
        setSelectedCategory('qris');
        setSelectedMethod('paymentku_qris');
      }
    }
  }, [isOpen, paymentSettings.activeGateway]);

  // Expiration countdown
  useEffect(() => {
    if (step !== 'pay' || !activeTransaction) return;

    const expiresAt = activeTransaction.expiredAt
      ? new Date(activeTransaction.expiredAt).getTime()
      : Date.now() + 15 * 60 * 1000;

    const interval = setInterval(() => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft('00:00 (Kadaluarsa)');
        clearInterval(interval);
      } else {
        const mins = Math.floor((remaining / 1000 / 60) % 60);
        const secs = Math.floor((remaining / 1000) % 60);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [step, activeTransaction]);

  // Real-time Status Poller for Pending Transaction (Pakasir & Paymentku)
  useEffect(() => {
    if (step !== 'pay' || !activeTransaction) return;

    const orderId =
      activeTransaction.orderId ||
      activeTransaction.paymentDetails?.paymentkuOrderId ||
      activeTransaction.paymentDetails?.pakasirOrderId;
    if (!orderId) return;

    const isPaymentku =
      Boolean(activeTransaction.paymentDetails?.paymentkuOrderId) ||
      Boolean(activeTransaction.paymentDetails?.paymentkuMethod) ||
      selectedMethod.startsWith('paymentku_') ||
      selectedCategory === 'ewallet' ||
      selectedCategory === 'retail';

    pollTimerRef.current = setInterval(async () => {
      // 1. Check in-memory local state first
      const current = transactions.find(t => t.id === activeTransaction.id);
      if (current && current.status === 'completed') {
        handlePaymentSuccess(current);
        return;
      }

      // 2. Poll webhook events
      if (isPaymentku) {
        try {
          const res = await fetch(`/api/paymentku/events/${encodeURIComponent(orderId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.found && (data.event?.status === 'paid' || data.event?.status === 'completed' || data.event?.status === 'settlement')) {
              approveTransaction(activeTransaction.id);
              handlePaymentSuccess({ ...activeTransaction, status: 'completed' });
              return;
            }
          }
        } catch {
          // silently ignore
        }

        // Check Paymentku direct status API if key is set
        const envPku = getEnvPaymentkuConfig();
        const pkuApiKey = paymentSettings.paymentkuApiKey || envPku.apiKey;
        if (pkuApiKey) {
          try {
            const check = await checkPaymentkuTransactionStatus({
              order_id: orderId,
              api_key: pkuApiKey
            });
            if (check.isCompleted) {
              approveTransaction(activeTransaction.id);
              handlePaymentSuccess({ ...activeTransaction, status: 'completed' });
              return;
            }
          } catch {
            // ignore
          }
        }
      } else {
        // Poll Pakasir Webhook Events endpoint
        try {
          const res = await fetch(`/api/pakasir/events/${encodeURIComponent(orderId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.found && data.event?.status === 'completed') {
              approveTransaction(activeTransaction.id);
              handlePaymentSuccess({ ...activeTransaction, status: 'completed' });
              return;
            }
          }
        } catch (e) {
          // silently ignore poller network hiccups
        }

        // If Pakasir credentials exist, also check Pakasir detail API
        const envConfig = getEnvPakasirConfig();
        const projectSlug = paymentSettings.pakasirProjectSlug || paymentSettings.pakasirMerchantCode || envConfig.projectSlug;
        const apiKey = paymentSettings.pakasirApiKey || envConfig.apiKey;
        if (projectSlug && apiKey) {
          try {
            const check = await checkPakasirTransactionDetail({
              project: projectSlug,
              order_id: orderId,
              amount: activeTransaction.amount,
              api_key: apiKey
            });

            if (check.isCompleted) {
              approveTransaction(activeTransaction.id);
              handlePaymentSuccess({ ...activeTransaction, status: 'completed' });
            }
          } catch {
            // ignore
          }
        }
      }
    }, 3500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [step, activeTransaction, transactions, paymentSettings, selectedMethod, selectedCategory]);

  if (!isOpen || !course) return null;

  const handlePaymentSuccess = (completedTrx?: Transaction) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setStep('success');

    // Track Meta / Facebook Pixel Purchase event
    const trxToTrack = completedTrx || activeTransaction;
    if (trxToTrack) {
      trackFBPurchase(trxToTrack);
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore confetti errors
    }
  };

  const processOrderWithUser = async (activeUser: User) => {
    setIsLoading(true);
    setErrorMessage(null);

    const targetCourseId = selectedBundle ? selectedBundle.id : course.id;
    const targetAmount = effectivePrice;
    const targetTitle = selectedBundle
      ? effectiveTitle
      : (selectedAttachedBundleCourseIds.length > 0
          ? `${course.title} (+${selectedAttachedBundleCourseIds.length} Kursus Bundling)`
          : effectiveTitle);
    const targetEnrolledCourseIds = selectedBundle
      ? getEffectiveBundleCourses(selectedBundle).map(c => c.id)
      : [course.id, ...selectedAttachedBundleCourseIds];

    // Handle Free Course instant enrollment (Price = 0)
    if (targetAmount === 0) {
      try {
        const freeTrx = createTransaction(
          targetCourseId,
          'free',
          {
            isBundle: !!selectedBundle,
            bundleId: selectedBundle?.id,
            courseTitle: targetTitle,
            amount: 0,
            totalPayment: 0,
            enrolledCourseIds: targetEnrolledCourseIds
          },
          activeUser
        );
        approveTransaction(freeTrx.id);
        setActiveTransaction({ ...freeTrx, status: 'completed' });
        handlePaymentSuccess();
        showToast(`🎉 Pendaftaran "${targetTitle}" berhasil diaktifkan!`);
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal mendaftar kursus gratis.');
      }
      setIsLoading(false);
      return;
    }

    // Create local base transaction linked to activeUser
    const baseTrx = createTransaction(
      targetCourseId,
      selectedMethod as PaymentMethodType,
      {
        isBundle: !!selectedBundle,
        bundleId: selectedBundle?.id,
        courseTitle: targetTitle,
        amount: targetAmount,
        totalPayment: targetAmount,
        enrolledCourseIds: targetEnrolledCourseIds
      },
      activeUser
    );
    const orderId = baseTrx.orderId || `INV${Date.now().toString().slice(-6)}`;

    // Determine gateway provider
    const isManualMethod = selectedCategory === 'manual' || selectedMethod.includes('manual');
    const isPakasirExplicit = selectedMethod === 'qris' || selectedMethod.startsWith('pakasir_');
    const isPaymentkuExplicit = selectedMethod.startsWith('paymentku_') || selectedCategory === 'ewallet' || selectedCategory === 'retail';

    const isPaymentkuMethod =
      !isManualMethod &&
      (paymentSettings.activeGateway === 'paymentku' ||
       isPaymentkuExplicit ||
       (paymentSettings.activeGateway === 'both' && !isPakasirExplicit) ||
       (!isPakasirActive && (selectedCategory === 'qris' || selectedCategory === 'va')));

    const isPakasirMethod =
      !isManualMethod &&
      !isPaymentkuMethod &&
      (selectedCategory === 'qris' || selectedCategory === 'va');

    // === 1. PROCESS VIA PAYMENTKU GATEWAY ===
    if (isPaymentkuMethod) {
      const rawChannel = selectedMethod.replace('paymentku_', '');
      const envPku = getEnvPaymentkuConfig();
      const apiKey = (paymentSettings.paymentkuApiKey || envPku.apiKey || '').trim();

      try {
        const apiRes = await createPaymentkuTransaction({
          method: rawChannel,
          order_id: orderId,
          amount: targetAmount,
          customer_name: activeUser.name,
          customer_email: activeUser.email,
          customer_phone: activeUser.phone,
          api_key: apiKey,
          items: [
            {
              name: targetTitle,
              price: targetAmount,
              qty: 1
            }
          ]
        });

        if (apiRes.success && apiRes.data) {
          const p: any = apiRes.data;
          const paymentInfo = p.payment_info || {};
          const trxId = p.trx_id || p.order_id || orderId;
          const refId = p.reference_id || p.order_id || orderId;
          const vaNum = paymentInfo.va_number || p.va_number || (rawChannel.includes('va') ? (paymentInfo.payment_number || p.payment_number) : undefined);
          const qrStr = paymentInfo.qr_string || p.qr_string || (rawChannel === 'qris' ? (paymentInfo.payment_number || p.payment_number) : undefined);
          const qrUrl = paymentInfo.qr_url || paymentInfo.qr_image || p.qr_url || p.qr_image;
          const payCode = paymentInfo.pay_code || paymentInfo.payment_code || p.payment_code || p.payment_number;
          const payUrl = p.pay_url || p.checkout_url || p.payment_url;
          const expirationDate = paymentInfo.expiration_date || p.expired_at || p.expires_at;
          const totalAmount = Number(p.amount || p.total_payment || (targetAmount + (Number(p.fee) || 0)));

          const updatedTrx: Transaction = {
            ...baseTrx,
            fee: Number(p.total_fee || p.fee || 0),
            totalPayment: totalAmount,
            expiredAt: expirationDate,
            paymentDetails: {
              ...baseTrx.paymentDetails,
              paymentkuOrderId: trxId,
              paymentkuMethod: p.payment_channel || rawChannel,
              paymentNumber: vaNum || qrStr || payCode || p.payment_number,
              qrisString: qrStr,
              paymentkuQrImage: qrUrl,
              vaNumber: vaNum,
              paymentCode: payCode,
              checkoutUrl: payUrl,
              paymentUrl: payUrl,
              fee: Number(p.total_fee || p.fee || 0),
              totalPayment: totalAmount,
              expiredAt: expirationDate,
              rawResponse: p
            }
          };

          updateTransaction(baseTrx.id, updatedTrx);
          setActiveTransaction(updatedTrx);
          setStep('pay');
          setIsLoading(false);
          return;
        } else {
          console.warn('Paymentku API note:', apiRes.error);
          if (!apiKey) {
            setErrorMessage(
              '⚠️ Kredensial Paymentku belum diisi di Admin. Menggunakan mode simulasi pembayaran offline.'
            );
          } else {
            setErrorMessage(apiRes.error || 'Gagal memanggil API Paymentku. Menggunakan mode simulasi.');
          }
        }
      } catch (err: any) {
        console.error('Paymentku transaction error:', err);
        setErrorMessage(err.message || 'Koneksi ke Paymentku terganggu.');
      }
    }

    // === 2. PROCESS VIA PAKASIR GATEWAY ===
    if (isPakasirMethod) {
      const envConfig = getEnvPakasirConfig();
      const projectSlug = (paymentSettings.pakasirProjectSlug || paymentSettings.pakasirMerchantCode || envConfig.projectSlug || '').trim();
      const apiKey = (paymentSettings.pakasirApiKey || envConfig.apiKey || '').trim();

      try {
        const apiRes = await createPakasirTransaction({
          method: selectedMethod,
          project: projectSlug,
          order_id: orderId,
          amount: targetAmount,
          api_key: apiKey
        });

        if (apiRes.success && apiRes.data) {
          const p = apiRes.data;
          const updatedTrx: Transaction = {
            ...baseTrx,
            fee: p.fee || 0,
            totalPayment: p.total_payment || targetAmount,
            expiredAt: p.expired_at,
            paymentDetails: {
              ...baseTrx.paymentDetails,
              project: p.project || projectSlug,
              pakasirOrderId: p.order_id,
              paymentNumber: p.payment_number,
              qrisString: p.payment_method === 'qris' ? p.payment_number : undefined,
              vaNumber: p.payment_method !== 'qris' ? p.payment_number : undefined,
              fee: p.fee,
              totalPayment: p.total_payment,
              expiredAt: p.expired_at,
              rawResponse: p
            }
          };

          updateTransaction(baseTrx.id, updatedTrx);
          setActiveTransaction(updatedTrx);
          setStep('pay');
          setIsLoading(false);
          return;
        } else {
          console.warn('Pakasir API note:', apiRes.error);
          if (!projectSlug || !apiKey) {
            setErrorMessage(
              '⚠️ Kredensial Pakasir belum diisi. Menggunakan mode simulasi pembayaran offline.'
            );
          } else {
            setErrorMessage(apiRes.error || 'Gagal memanggil API Pakasir. Menggunakan mode simulasi.');
          }
        }
      } catch (err: any) {
        console.error('Create transaction exception:', err);
        setErrorMessage(err.message || 'Koneksi ke Pakasir terganggu.');
      }
    }

    // === 3. FALLBACK MOCK / SANDBOX STRUCTURE ===
    const fallbackQrisString = `00020101021226610016ID.CO.PAYMENTKU.WWW01189360091800216005230208216005230303UME51440014ID.CO.QRIS.WWW0215ID10243228429300303UME5204792953033605409${targetAmount}.005802ID5907LESINAJA6012JAKARTA61055439262230519SP25RZRATEQI2HQ65Q46304A079`;
    const fallbackVaNumber = `8809${Date.now().toString().slice(-8)}`;
    const fallbackCode = `PKU-${Date.now().toString().slice(-6)}`;

    const isQrisCategory = selectedCategory === 'qris' || selectedMethod.includes('qris');
    const isVaCategory = selectedCategory === 'va' || selectedMethod.includes('va');
    const isRetailCategory = selectedCategory === 'retail' || selectedMethod.includes('alfa') || selectedMethod.includes('indo');
    const isEwalletCategory = selectedCategory === 'ewallet' || selectedMethod.includes('dana') || selectedMethod.includes('ovo') || selectedMethod.includes('shopee');

    const fallbackTrx: Transaction = {
      ...baseTrx,
      totalPayment: targetAmount,
      paymentDetails: {
        ...baseTrx.paymentDetails,
        paymentkuOrderId: isPaymentkuMethod ? orderId : undefined,
        pakasirOrderId: isPakasirMethod ? orderId : undefined,
        paymentNumber: isQrisCategory ? fallbackQrisString : (isVaCategory ? fallbackVaNumber : fallbackCode),
        qrisString: isQrisCategory ? fallbackQrisString : undefined,
        vaNumber: isVaCategory ? fallbackVaNumber : undefined,
        paymentCode: isRetailCategory ? fallbackCode : undefined,
        checkoutUrl: isEwalletCategory ? `https://paymenku.com/checkout/${orderId}` : undefined,
        totalPayment: targetAmount
      }
    };

    updateTransaction(baseTrx.id, fallbackTrx);
    setActiveTransaction(fallbackTrx);
    setStep('pay');
    setIsLoading(false);
  };

  const handleCreateOrder = async () => {
    setErrorMessage(null);

    // Validate custom price if enabled
    if (course.allowCustomPrice && purchaseMode === 'single') {
      const minRequired = Number(course.minCustomPrice || 0);
      if (customAmount < minRequired) {
        setErrorMessage(`Nominal pembayaran seikhlasnya minimal adalah ${formatRupiah(minRequired)}.`);
        return;
      }
    }

    // If user is already logged in, proceed directly
    if (currentUser) {
      processOrderWithUser(currentUser);
      return;
    }

    // Otherwise validate student registration inputs
    if (!studentName.trim() || !studentEmail.trim() || !studentPhone.trim()) {
      setErrorMessage('Mohon lengkapi Nama Lengkap, Email Aktif, dan No. WhatsApp untuk pembuatan akun & akses kursus.');
      return;
    }

    const valResult = validateEmailDetailed(studentEmail);
    if (!valResult.isValid) {
      setErrorMessage(valResult.error || 'Format email tidak valid.');
      return;
    }

    const phoneNorm = normalizePhoneNumber(studentPhone);
    if (!phoneNorm.isValid) {
      setErrorMessage(phoneNorm.error || 'Nomor WhatsApp tidak valid.');
      return;
    }

    try {
      // Directly register student account without OTP block
      const activeUser = registerStudent(
        studentName.trim(),
        studentEmail.trim(),
        studentPhone.trim(),
        studentInstitution.trim(),
        false // do not auto navigate away from checkout modal
      );

      if (activeUser) {
        trackFBCompleteRegistration({
          name: studentName.trim(),
          email: studentEmail.trim(),
          role: 'student'
        });
        showToast(`✓ Akun untuk ${studentName.trim()} berhasil dibuat! Memproses pembayaran...`);
        processOrderWithUser(activeUser);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendaftarkan akun siswa.');
    }
  };

  const handleManualCheckStatus = async () => {
    if (!activeTransaction) return;
    setIsCheckingStatus(true);

    const orderId =
      activeTransaction.orderId ||
      activeTransaction.paymentDetails?.paymentkuOrderId ||
      activeTransaction.paymentDetails?.pakasirOrderId;

    const isPaymentku =
      Boolean(activeTransaction.paymentDetails?.paymentkuOrderId) ||
      Boolean(activeTransaction.paymentDetails?.paymentkuMethod) ||
      selectedMethod.startsWith('paymentku_') ||
      selectedCategory === 'ewallet' ||
      selectedCategory === 'retail';

    if (isPaymentku && orderId) {
      const envPku = getEnvPaymentkuConfig();
      const pkuApiKey = paymentSettings.paymentkuApiKey || envPku.apiKey;

      if (pkuApiKey) {
        const res = await checkPaymentkuTransactionStatus({
          order_id: orderId,
          api_key: pkuApiKey
        });

        if (res.isCompleted) {
          approveTransaction(activeTransaction.id);
          handlePaymentSuccess();
          showToast('🎉 Pembayaran berhasil diverifikasi oleh sistem Paymentku!');
          setIsCheckingStatus(false);
          return;
        } else {
          showToast(res.error || `Status: ${res.data?.status || 'Menunggu pembayaran dari pembeli...'}`);
        }
      } else {
        // Check event polling
        try {
          const evt = await fetch(`/api/paymentku/events/${encodeURIComponent(orderId)}`);
          if (evt.ok) {
            const data = await evt.json();
            if (data && data.found && (data.event?.status === 'paid' || data.event?.status === 'completed')) {
              approveTransaction(activeTransaction.id);
              handlePaymentSuccess();
              showToast('🎉 Pembayaran Paymentku berhasil diverifikasi!');
              setIsCheckingStatus(false);
              return;
            }
          }
        } catch {
          // ignore
        }
        showToast('Menunggu notifikasi pembayaran dari Paymentku...');
      }
    } else if (orderId) {
      const projectSlug = paymentSettings.pakasirProjectSlug || paymentSettings.pakasirMerchantCode;
      const apiKey = paymentSettings.pakasirApiKey;

      if (projectSlug && apiKey) {
        const res = await checkPakasirTransactionDetail({
          project: projectSlug,
          order_id: orderId,
          amount: activeTransaction.amount,
          api_key: apiKey
        });

        if (res.isCompleted) {
          approveTransaction(activeTransaction.id);
          handlePaymentSuccess();
          showToast('🎉 Pembayaran berhasil diverifikasi oleh sistem Pakasir!');
          setIsCheckingStatus(false);
          return;
        } else {
          showToast(res.error || 'Status: Menunggu pembayaran dari pembeli...');
        }
      } else {
        showToast('Menunggu notifikasi pembayaran dari gateway...');
      }
    }

    setIsCheckingStatus(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`Teks "${label}" berhasil disalin.`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleFinish = () => {
    onSuccess(course.id);
    onClose();
    setStep('select');
  };

  const isCurrentPaymentku =
    Boolean(activeTransaction?.paymentDetails?.paymentkuOrderId) ||
    Boolean(activeTransaction?.paymentDetails?.paymentkuMethod) ||
    selectedMethod.startsWith('paymentku_') ||
    selectedCategory === 'ewallet' ||
    selectedCategory === 'retail';

  const selectedPaymentkuInfo = PAYMENTKU_CHANNELS.find(m => m.id === selectedMethod);
  const selectedMethodInfo = selectedPaymentkuInfo || PAKASIR_PAYMENT_METHODS.find(m => m.id === selectedMethod);
  const qrisRawString =
    activeTransaction?.paymentDetails?.qrisString ||
    activeTransaction?.paymentDetails?.paymentNumber ||
    '';
  const vaNumber =
    activeTransaction?.paymentDetails?.vaNumber ||
    activeTransaction?.paymentDetails?.paymentNumber ||
    '';
  const paymentCode =
    activeTransaction?.paymentDetails?.paymentCode ||
    activeTransaction?.paymentDetails?.paymentNumber ||
    '';
  const checkoutUrl =
    activeTransaction?.paymentDetails?.checkoutUrl ||
    activeTransaction?.paymentDetails?.paymentUrl ||
    '';
  const totalBill = activeTransaction?.totalPayment || activeTransaction?.amount || course.price;
  const feeAmount = activeTransaction?.fee || 0;

  return (
    <div
      id="checkout-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="checkout-modal-container"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Checkout & Pembayaran</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  paymentSettings.activeGateway === 'paymentku'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : paymentSettings.activeGateway === 'pakasir'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : paymentSettings.activeGateway === 'manual'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {paymentSettings.activeGateway === 'paymentku'
                    ? 'Paymentku Gateway'
                    : paymentSettings.activeGateway === 'pakasir'
                    ? 'Pakasir Gateway'
                    : paymentSettings.activeGateway === 'manual'
                    ? 'Transfer Bank'
                    : 'Paymentku & Pakasir'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                LMS LESIN AJA • Transaksi Otomatis 24/7 Terenkripsi
              </p>
            </div>
          </div>
          <button
            id="close-checkout-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-900 dark:text-slate-100">
          {/* STEP 1: METHOD SELECTION */}
          {step === 'select' && (
            <>
              {/* Item & Bundling Option Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    Pilihan Paket Pembelian
                  </label>
                  {applicableBundles.length > 0 && (
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Hemat Hingga 70%</span>
                    </span>
                  )}
                </div>

                {/* Option 1: Single Course */}
                <div
                  onClick={() => setPurchaseMode('single')}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-3 ${
                    purchaseMode === 'single'
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-xs ring-1 ring-blue-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="purchaseMode"
                      checked={purchaseMode === 'single'}
                      onChange={() => setPurchaseMode('single')}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {course.allowCustomPrice ? 'Bayar Seikhlasnya' : 'Beli Satuan'}: {course.title}
                        </span>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-extrabold font-mono block ${course.allowCustomPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {formatRupiah(course.allowCustomPrice ? customAmount : course.price)}
                          </span>
                          {course.allowCustomPrice ? (
                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-500/20">
                              Seikhlasnya
                            </span>
                          ) : (
                            course.originalPrice > course.price && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatRupiah(course.originalPrice)}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {course.allowCustomPrice
                          ? `Tentukan harga Anda sendiri${course.minCustomPrice ? ` (Minimal ${formatRupiah(course.minCustomPrice)})` : ''}.`
                          : `Akses seumur hidup 1 kursus ini (${course.category}).`}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Custom Price Box if course allows custom price */}
                  {course.allowCustomPrice && purchaseMode === 'single' && (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="mt-1 p-3.5 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 dark:from-emerald-950/50 dark:to-teal-950/30 rounded-xl border border-emerald-500/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                            <Heart className="w-3.5 h-3.5 fill-white" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>Tentukan Nominal Pembayaran</span>
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {course.minCustomPrice && course.minCustomPrice > 0
                                ? `Batas minimal pembayaran yang diatur admin: ${formatRupiah(course.minCustomPrice)}`
                                : 'Tentukan nominal seikhlasnya secara fleksibel.'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          Suka-Suka
                        </span>
                      </div>

                      {/* Manual Amount Input */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Ketik Manual Nominal yang Ingin Anda Bayarkan (Rp) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 font-mono">
                            Rp
                          </span>
                          <input
                            id="custom-payment-input"
                            type="number"
                            min={course.minCustomPrice || 0}
                            step={1000}
                            value={customAmount || ''}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value));
                              setCustomAmount(val);
                              setErrorMessage(null);
                            }}
                            placeholder={`Minimal ${course.minCustomPrice || 0}`}
                            className="w-full pl-9 pr-3 py-1.5 text-sm font-extrabold font-mono rounded-lg border border-emerald-500/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                        {course.minCustomPrice && customAmount < course.minCustomPrice ? (
                          <p className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Nominal minimal pembayaran adalah {formatRupiah(course.minCustomPrice)}.</span>
                          </p>
                        ) : null}
                      </div>

                      {/* Suggested Chips */}
                      {((course.suggestedCustomPrices && course.suggestedCustomPrices.length > 0)
                        ? course.suggestedCustomPrices
                        : [20000, 50000, 100000, 200000]
                      ).length > 0 && (
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Pilihan Cepat:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {((course.suggestedCustomPrices && course.suggestedCustomPrices.length > 0)
                              ? course.suggestedCustomPrices
                              : [20000, 50000, 100000, 200000]
                            )
                              .filter(amt => amt >= (course.minCustomPrice || 0))
                              .map(suggestedAmt => (
                                <button
                                  key={suggestedAmt}
                                  type="button"
                                  onClick={() => {
                                    setCustomAmount(suggestedAmt);
                                    setErrorMessage(null);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
                                    customAmount === suggestedAmt
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                                  }`}
                                >
                                  {formatRupiah(suggestedAmt)}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Attached Bundles Special Price Add-ons */}
                  {purchaseMode === 'single' && attachedAddonCourses.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Tawaran Spesial Tambahan Kursus (Bundling Khusus)</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Hemat Spesial
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Centang kursus di bawah untuk langsung menambahkan ke paket belajar Anda dengan harga diskon khusus:
                      </p>

                      <div className="space-y-2">
                        {attachedAddonCourses.map(addon => {
                          const isChecked = selectedAttachedBundleCourseIds.includes(addon.courseId);
                          const discountAmt = Math.max(0, addon.originalPrice - addon.specialPrice);
                          return (
                            <label
                              key={addon.courseId}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                                isChecked
                                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-2xs'
                                  : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedAttachedBundleCourseIds(prev => [...prev, addon.courseId]);
                                    } else {
                                      setSelectedAttachedBundleCourseIds(prev => prev.filter(id => id !== addon.courseId));
                                    }
                                  }}
                                  className="rounded text-amber-600 focus:ring-amber-500 shrink-0"
                                />
                                {addon.thumbnail && (
                                  <img
                                    src={addon.thumbnail}
                                    alt={addon.title}
                                    className="w-10 h-8 object-cover rounded-md shrink-0 border border-slate-200 dark:border-slate-700"
                                  />
                                )}
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 block">
                                    + {addon.title}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    {discountAmt > 0 && (
                                      <span className="text-slate-400 line-through">
                                        {formatRupiah(addon.originalPrice)}
                                      </span>
                                    )}
                                    {discountAmt > 0 && (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                        (Hemat {formatRupiah(discountAmt)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono font-extrabold text-xs text-amber-600 dark:text-amber-400">
                                  +{formatRupiah(addon.specialPrice)}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 2+: Applicable Bundles */}
                {applicableBundles.map(bundle => {
                  const isSelected =
                    purchaseMode === 'bundle' &&
                    (selectedBundleId === bundle.id || (!selectedBundleId && applicableBundles[0]?.id === bundle.id));
                  const isCoursesExpanded = expandedBundleCoursesId === bundle.id;
                  const bundleCourses = getEffectiveBundleCourses(bundle);
                  const originalVal = bundle.originalPrice || bundleCourses.reduce((sum, c) => sum + (c.price || 0), 0);
                  const savings = Math.max(0, originalVal - bundle.price);
                  const discountPct = originalVal > 0 ? Math.round((savings / originalVal) * 100) : 0;

                  return (
                    <div
                      key={bundle.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        isSelected
                          ? 'bg-gradient-to-br from-amber-50/90 to-blue-50/60 dark:from-amber-950/30 dark:to-blue-950/30 border-amber-500 dark:border-amber-500 shadow-md ring-1 ring-amber-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
                      }`}
                    >
                      <div
                        onClick={() => {
                          setPurchaseMode('bundle');
                          setSelectedBundleId(bundle.id);
                        }}
                        className="flex items-start gap-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="purchaseMode"
                          checked={isSelected}
                          onChange={() => {
                            setPurchaseMode('bundle');
                            setSelectedBundleId(bundle.id);
                          }}
                          className="mt-1 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            {bundle.badge && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded bg-amber-500 text-slate-950 shadow-2xs">
                                {bundle.badge}
                              </span>
                            )}
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                              {bundle.bundleType === 'all_courses'
                                ? '🌐 Seluruh Kursus Platform'
                                : `📂 Kategori: ${bundle.targetCategory}`}
                            </span>
                            {discountPct > 0 && (
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                Diskon {discountPct}%
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                              {bundle.title}
                            </h4>
                            <div className="text-right shrink-0">
                              <span className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono block">
                                {formatRupiah(bundle.price)}
                              </span>
                              {originalVal > bundle.price && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  {formatRupiah(originalVal)}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {bundle.description || 'Dapatkan seluruh paket materi kursus dengan harga hemat super spesial.'}
                          </p>

                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Package className="w-3.5 h-3.5 text-blue-500" />
                              <span>Termasuk <strong>{bundleCourses.length} Kursus Sekaligus</strong></span>
                            </span>

                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setExpandedBundleCoursesId(isCoursesExpanded ? null : bundle.id);
                              }}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>
                                {isCoursesExpanded ? 'Tutup Daftar Kursus' : `Lihat ${bundleCourses.length} Kursus`}
                              </span>
                              {isCoursesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown list of courses inside bundle */}
                      {isCoursesExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50/90 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-amber-500" />
                            <span>DAFTAR KURSUS YANG ANDA DAPATKAN ({bundleCourses.length} KURSUS):</span>
                          </p>
                          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {bundleCourses.map((c, i) => (
                              <div
                                key={c.id}
                                className="flex items-start justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] gap-2.5"
                              >
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <img
                                    src={c.thumbnail}
                                    alt={c.title}
                                    className="w-9 h-9 rounded-md object-cover shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <span className="font-black text-slate-900 dark:text-white uppercase leading-tight block">
                                      {i + 1}. {c.title.toUpperCase()}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[9px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-500/20 uppercase font-bold">
                                        {c.category}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {c.modules?.length || 0} Modul Pelajaran
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[11px] text-slate-400 line-through shrink-0 font-mono ml-2">
                                  {formatRupiah(c.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {savings > 0 && (
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-[10px] sm:text-[11px] text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between border border-emerald-500/20">
                              <span>Total Nilai Asli ({bundleCourses.length} Kursus): {formatRupiah(originalVal)}</span>
                              <span className="text-emerald-600 dark:text-emerald-400">Hemat: {formatRupiah(savings)} ({discountPct}%)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Payment Method Category Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                  Pilih Saluran Pembayaran
                </label>
                <div className={`grid gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl ${
                  isPaymentkuActive ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-3'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('qris');
                      setSelectedMethod(isPakasirActive && !isPaymentkuActive ? 'qris' : 'paymentku_qris');
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                      selectedCategory === 'qris'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('va');
                      setSelectedMethod(isPakasirActive && !isPaymentkuActive ? 'bca_va' : 'paymentku_bca_va');
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                      selectedCategory === 'va'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Virtual Acc</span>
                  </button>

                  {isPaymentkuActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('ewallet');
                        setSelectedMethod('paymentku_dana');
                      }}
                      className={`py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                        selectedCategory === 'ewallet'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>E-Wallet</span>
                    </button>
                  )}

                  {isPaymentkuActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('retail');
                        setSelectedMethod('paymentku_alfamart');
                      }}
                      className={`py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                        selectedCategory === 'retail'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Minimarket</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('manual');
                      setSelectedMethod(paymentSettings.bankAccounts?.[0]?.id || 'bca_manual');
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                      !isPaymentkuActive ? 'col-span-1' : 'col-span-2 sm:col-span-1'
                    } ${
                      selectedCategory === 'manual'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Manual Bank</span>
                  </button>
                </div>
              </div>

              {/* Sub-Methods List */}
              <div className="space-y-2">
                {/* QRIS Category */}
                {selectedCategory === 'qris' && (
                  <div className="space-y-2">
                    {isPaymentkuActive && (
                      <label
                        className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                          selectedMethod === 'paymentku_qris'
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-600/10 shadow-xs ring-1 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="payMethod"
                            checked={selectedMethod === 'paymentku_qris'}
                            onChange={() => setSelectedMethod('paymentku_qris')}
                            className="mt-1 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                QRIS Instan Nasional (Paymentku)
                              </span>
                              <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.2 rounded">
                                Otomatis
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, LinkAja & Semua Bank
                            </p>
                          </div>
                        </div>
                        <QrCode className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      </label>
                    )}

                    {isPakasirActive && (
                      <label
                        className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                          selectedMethod === 'qris'
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-600/10 shadow-xs ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="payMethod"
                            checked={selectedMethod === 'qris'}
                            onChange={() => setSelectedMethod('qris')}
                            className="mt-1 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                QRIS Otomatis (Pakasir Gateway)
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Scan langsung menggunakan QR code instan Pakasir
                            </p>
                          </div>
                        </div>
                        <QrCode className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      </label>
                    )}
                  </div>
                )}

                {/* Virtual Account List */}
                {selectedCategory === 'va' && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {/* Paymentku Virtual Accounts */}
                    {PAYMENTKU_CHANNELS.filter(m => m.category === 'va').map(method => (
                      <label
                        key={method.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          selectedMethod === method.id
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-600/10 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payMethod"
                            checked={selectedMethod === method.id}
                            onChange={() => setSelectedMethod(method.id)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {method.name}
                            </span>
                            <p className="text-[10px] text-slate-400">{method.description}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                          VA Otomatis
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* E-Wallet List (Paymentku) */}
                {selectedCategory === 'ewallet' && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {PAYMENTKU_CHANNELS.filter(m => m.category === 'ewallet').map(method => (
                      <label
                        key={method.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          selectedMethod === method.id
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-600/10 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payMethod"
                            checked={selectedMethod === method.id}
                            onChange={() => setSelectedMethod(method.id)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {method.name}
                            </span>
                            <p className="text-[10px] text-slate-400">{method.description}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                          E-Wallet
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Retail Minimarket List (Paymentku) */}
                {selectedCategory === 'retail' && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {PAYMENTKU_CHANNELS.filter(m => m.category === 'retail').map(method => (
                      <label
                        key={method.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          selectedMethod === method.id
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-600/10 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payMethod"
                            checked={selectedMethod === method.id}
                            onChange={() => setSelectedMethod(method.id)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {method.name}
                            </span>
                            <p className="text-[10px] text-slate-400">{method.description}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                          Kasir Minimarket
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Manual Bank Transfer */}
                {selectedCategory === 'manual' && (
                  <div className="space-y-2">
                    {paymentSettings.bankAccounts.map(bank => (
                      <label
                        key={bank.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          selectedMethod === bank.id
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-600/10 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payMethod"
                            checked={selectedMethod === bank.id}
                            onChange={() => setSelectedMethod(bank.id)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {bank.bankName}
                            </span>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {bank.accountNumber} • {bank.accountHolder}
                            </p>
                          </div>
                        </div>
                        <Building2 className="w-4 h-4 text-slate-400" />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Student Profile Info / Automated Registration Form */}
              {!currentUser ? (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-slate-800/80 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 pb-1 border-b border-blue-200/60 dark:border-blue-900/40">
                    <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Data Pendaftar (Akun Baru Otomatis Dibuat)</span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-600 text-white">
                          Auto-Register
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Akun siswa dibuat secara otomatis dan akses kursus akan langsung aktif.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Lengkap Siswa <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          id="checkout-student-name"
                          type="text"
                          required
                          value={studentName}
                          onChange={e => setStudentName(e.target.value)}
                          placeholder="misal: Budi Santoso"
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Alamat Email Aktif <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Wajib Aktif & Valid</span>
                        </span>
                      </div>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          id="checkout-student-email"
                          type="email"
                          required
                          value={studentEmail}
                          onChange={e => handleStudentEmailChange(e.target.value)}
                          placeholder="budi@gmail.com"
                          className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border ${
                            emailError
                              ? 'border-rose-400 dark:border-rose-600 bg-rose-50/30'
                              : 'border-slate-300 dark:border-slate-700'
                          } bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium`}
                        />
                      </div>

                      {/* Typo Suggestion Box */}
                      {emailSuggestion && (
                        <div className="mt-1.5 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Maksud Anda: <strong>{emailSuggestion}</strong>?</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplySuggestion(emailSuggestion)}
                            className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] shadow-xs"
                          >
                            Gunakan ini
                          </button>
                        </div>
                      )}

                      {/* Email Validation Error */}
                      {emailError && (
                        <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{emailError}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        No. WhatsApp / HP <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          id="checkout-student-phone"
                          type="tel"
                          required
                          value={studentPhone}
                          onChange={e => setStudentPhone(e.target.value)}
                          placeholder="081234567890"
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Asal Sekolah / Instansi <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <div className="relative">
                        <School className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          id="checkout-student-institution"
                          type="text"
                          value={studentInstitution}
                          onChange={e => setStudentInstitution(e.target.value)}
                          placeholder="misal: SMA Negeri / Umum"
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-blue-100 dark:border-blue-900/30">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Akun Siswa Terhubung</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Aktif
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Nama Siswa:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {currentUser.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Email Akun:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {currentUser.email}
                    </span>
                  </div>
                  {currentUser.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">No. WhatsApp:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{currentUser.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              <button
                id="checkout-continue-btn"
                onClick={handleCreateOrder}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses Pendaftaran & Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {effectivePrice === 0
                        ? 'Daftar Sekarang (Gratis)'
                        : currentUser
                        ? `Lanjut ke Pembayaran (${formatRupiah(effectivePrice)})`
                        : `Buat Akun & Lanjut Bayar (${formatRupiah(effectivePrice)})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {/* STEP 2: PAYMENT SCREEN (QRIS / VA / TRANSFER) */}
          {step === 'pay' && activeTransaction && (
            <div className="space-y-4 text-center">
              {/* Payment Amount Card */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-1">
                <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-medium">
                    {activeTransaction.isBundle ? 'Paket Bundling' : 'Kursus'} • Total Tagihan
                  </span>
                  <span className="flex items-center gap-1 font-mono font-bold text-rose-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeLeft}</span>
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  {formatRupiah(totalBill)}
                </h2>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {activeTransaction.courseTitle || effectiveTitle}
                </p>
                {feeAmount > 0 && (
                  <p className="text-[10px] text-slate-400">
                    (Harga: {formatRupiah(activeTransaction.amount)} + Fee Gateway: {formatRupiah(feeAmount)})
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Order ID: <strong className="font-mono text-slate-700 dark:text-slate-200">{activeTransaction.orderId || activeTransaction.paymentDetails?.pakasirOrderId}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        activeTransaction.orderId || activeTransaction.paymentDetails?.pakasirOrderId || '',
                        'Order ID'
                      )
                    }
                    className="p-1 text-slate-400 hover:text-blue-600 transition"
                  >
                    {copiedText === 'Order ID' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* QRIS DISPLAY */}
              {selectedCategory === 'qris' && (
                <div className="p-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-xs mx-auto space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-700">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      QRIS STANDAR NASIONAL
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {isCurrentPaymentku ? 'Paymentku Auto-Route' : 'Pakasir API'}
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-inner">
                    {qrisRawString ? (
                      <QRCodeSVG
                        value={qrisRawString}
                        size={190}
                        level="M"
                        includeMargin={true}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-mono">
                        Memuat QRIS...
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 mt-1 font-mono font-semibold">
                      Scan dengan m-Banking / e-Wallet
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Buka BCA Mobile, Mandiri Livin', BRImo, BNI, GoPay, OVO, atau DANA lalu scan kode QR di atas.
                  </p>

                  {qrisRawString && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(qrisRawString, 'String QRIS')}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto font-medium"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedText === 'String QRIS' ? 'QR String Disalin!' : 'Salin String QRIS'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* VIRTUAL ACCOUNT DISPLAY */}
              {selectedCategory === 'va' && (
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-sm mx-auto space-y-4 text-left">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-700">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {selectedMethodInfo?.name || 'Virtual Account'}
                      </span>
                      <p className="text-[10px] text-slate-400">Pembayaran Otomatis</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      Verifikasi Realtime
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Nomor Virtual Account
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 tracking-wider">
                        {vaNumber || '8820 9182 3348 2910'}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(vaNumber || '8820918233482910', 'Nomor VA')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-blue-700 transition"
                      >
                        {copiedText === 'Nomor VA' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === 'Nomor VA' ? 'Disalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Panduan Pembayaran:</p>
                    <ol className="list-decimal list-inside space-y-0.5 pl-1">
                      <li>Buka m-Banking atau ATM bank Anda</li>
                      <li>Pilih menu <strong>Transfer → Virtual Account</strong></li>
                      <li>Masukkan Nomor VA di atas dengan nominal <strong>{formatRupiah(totalBill)}</strong></li>
                      <li>Konfirmasi pembayaran dan akses kursus akan langsung aktif</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* E-WALLET DISPLAY (Paymentku) */}
              {selectedCategory === 'ewallet' && (
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-sm mx-auto space-y-4 text-left">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-700">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {selectedMethodInfo?.name || 'E-Wallet Payment'}
                      </span>
                      <p className="text-[10px] text-slate-400">Paymentku Gateway</p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      Direct Pay
                    </span>
                  </div>

                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 text-center space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Silakan lanjutkan pembayaran melalui aplikasi {selectedMethodInfo?.name || 'E-Wallet'} Anda:
                    </p>
                    {checkoutUrl && (
                      <a
                        href={checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer"
                      >
                        <span>Buka Aplikasi & Bayar</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Petunjuk Pembayaran:</p>
                    <ol className="list-decimal list-inside space-y-0.5 pl-1">
                      <li>Pastikan saldo akun e-wallet Anda mencukupi <strong>{formatRupiah(totalBill)}</strong></li>
                      <li>Klik tombol bayar di atas atau konfirmasi notifikasi di ponsel Anda</li>
                      <li>Selesaikan pembayaran sebelum batas waktu berakhir</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* RETAIL MINIMARKET DISPLAY (Paymentku) */}
              {selectedCategory === 'retail' && (
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-sm mx-auto space-y-4 text-left">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-700">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {selectedMethodInfo?.name || 'Kasir Minimarket'}
                      </span>
                      <p className="text-[10px] text-slate-400">Pembayaran Kasir Offline</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                      Paymentku Retail
                    </span>
                  </div>

                  <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1">
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold tracking-wider">
                      Kode Pembayaran Kasir
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400 tracking-wider">
                        {paymentCode || 'PKU-8910283'}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentCode || 'PKU-8910283', 'Kode Pembayaran')}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-amber-700 transition"
                      >
                        {copiedText === 'Kode Pembayaran' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === 'Kode Pembayaran' ? 'Disalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Cara Bayar di Gerai:</p>
                    <ol className="list-decimal list-inside space-y-0.5 pl-1">
                      <li>Kunjungi gerai <strong>{selectedMethodInfo?.name || 'Minimarket'}</strong> terdekat</li>
                      <li>Sampaikan kepada kasir ingin melakukan <strong>Pembayaran Tagihan / LESIN AJA</strong></li>
                      <li>Tunjukkan Kode Pembayaran di atas dan bayar sebesar <strong>{formatRupiah(totalBill)}</strong></li>
                      <li>Simpan struk pembayaran sebagai bukti transaksi</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* MANUAL BANK TRANSFER DISPLAY */}
              {selectedCategory === 'manual' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-3">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Rekening Pembayaran Resmi LESIN AJA:
                  </p>
                  {paymentSettings.bankAccounts.map(b => (
                    <div
                      key={b.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{b.bankName}</p>
                        <p className="text-sm font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                          {b.accountNumber}
                        </p>
                        <p className="text-[10px] text-slate-400">a/n {b.accountHolder}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(b.accountNumber, b.bankName)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 hover:bg-slate-200"
                      >
                        {copiedText === b.bankName ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === b.bankName ? 'Disalin' : 'Salin'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons: Status Check */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  id="check-payment-status-btn"
                  onClick={handleManualCheckStatus}
                  disabled={isCheckingStatus}
                  className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  <span>{isCheckingStatus ? 'Memeriksa Gateway...' : 'Cek Status Pembayaran Sekarang'}</span>
                </button>

                <p className="text-[10px] text-slate-400 leading-relaxed text-center">
                  *Sistem secara otomatis mendeteksi verifikasi transaksi dari gateway ({isPaymentkuActive ? 'Paymentku' : 'Pakasir'}) dan langsung mengaktifkan akses kursus secara instan.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && activeTransaction && (
            <div className="space-y-4 text-center py-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
                  {activeTransaction.amount === 0 ? 'Pendaftaran Berhasil!' : 'Pembayaran Berhasil Diverifikasi!'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  {activeTransaction.isBundle ? (
                    <>
                      Selamat! Paket bundling <strong className="text-slate-800 dark:text-slate-200">{activeTransaction.courseTitle}</strong> telah aktif dan membuka akses ke seluruh kursus di dalamnya!
                    </>
                  ) : (
                    <>
                      Selamat! Anda kini telah terdaftar resmi dan memiliki akses penuh seumur hidup ke kursus{' '}
                      <strong className="text-slate-800 dark:text-slate-200">{activeTransaction.courseTitle || course.title}</strong>.
                    </>
                  )}
                </p>
              </div>

              {/* Show unlocked courses if bundle */}
              {activeTransaction.isBundle && effectiveIncludedCourses.length > 0 && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>{effectiveIncludedCourses.length} Kursus Berhasil Dibuka:</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      ✓ Siap Dipelajari
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                    {effectiveIncludedCourses.map(c => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]"
                      >
                        <img src={c.thumbnail} alt={c.title} className="w-6 h-6 rounded object-cover shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{c.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-left">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Akun pembelajaran atas nama <strong>{activeTransaction.studentName}</strong> (
                  <span className="font-mono">{activeTransaction.studentEmail}</span>) telah aktif otomatis.
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-left space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kode Transaksi:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeTransaction.transactionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-bold text-blue-600">{activeTransaction.orderId || activeTransaction.paymentDetails?.pakasirOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Pembayaran:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>LUNAS / COMPLETED</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Gateway:</span>
                  <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">
                    {activeTransaction.paymentMethod.replace('paymentku_', '').replace(/_/g, ' ')} (
                    {isCurrentPaymentku || activeTransaction.paymentMethod.startsWith('paymentku_') || activeTransaction.paymentDetails?.paymentkuOrderId
                      ? 'Paymentku Gateway'
                      : activeTransaction.paymentMethod.includes('manual')
                      ? 'Transfer Bank Manual'
                      : 'Pakasir Gateway'}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Bayar:</span>
                  <span>{new Date().toLocaleString('id-ID')}</span>
                </div>
              </div>

              <button
                id="start-learning-now-btn"
                onClick={handleFinish}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Mulai Belajar Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
