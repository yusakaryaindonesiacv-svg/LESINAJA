import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Course, CourseModule, AttachedBundleCourse } from '../../types';
import { useApp } from '../../context/AppContext';
import { ModuleResourceManager } from './ModuleResourceManager';
import { uploadFileToSupabaseStorage } from '../../utils/supabaseClient';
import { readFileAsDataUrl } from '../../utils/fileHelpers';
import {
  X,
  Plus,
  Trash2,
  Save,
  HelpCircle,
  Video,
  FileText,
  BookOpen,
  Loader2,
  CheckCircle2,
  FolderArchive,
  Upload,
  Image as ImageIcon,
  User as UserIcon,
  Play,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Database,
  Star,
  Users,
  Flame,
  Heart,
  Layers,
  Percent,
  BadgeCheck,
  PenTool,
  Tag,
  ShieldAlert
} from 'lucide-react';

interface CourseEditorModalProps {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
}

export const CourseEditorModal: React.FC<CourseEditorModalProps> = ({
  isOpen,
  course,
  onClose
}) => {
  const { addCourse, updateCourse, categories, courses, users, currentUser, showToast } = useApp();
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [category, setCategory] = useState<string>(course?.category || (categories[0]?.name || 'Web & Mobile Dev'));
  const [level, setLevel] = useState<'Pemula' | 'Menengah' | 'Lanjutan' | 'Semua Level'>(course?.level || 'Semua Level');
  const [price, setPrice] = useState<number>(course?.price || 199000);
  const [originalPrice, setOriginalPrice] = useState<number>(course?.originalPrice || 500000);
  const [allowCustomPrice, setAllowCustomPrice] = useState<boolean>(course?.allowCustomPrice ?? false);
  const [minCustomPrice, setMinCustomPrice] = useState<number>(course?.minCustomPrice ?? 10000);
  const [suggestedCustomPricesStr, setSuggestedCustomPricesStr] = useState<string>(
    course?.suggestedCustomPrices && course.suggestedCustomPrices.length > 0
      ? course.suggestedCustomPrices.join(', ')
      : '20000, 50000, 100000, 200000'
  );
  const [thumbnail, setThumbnail] = useState(course?.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80');
  
  // Registered instructors filter (If logged in as instructor, only show the current instructor)
  const registeredInstructors = useMemo(() => {
    if (currentUser && currentUser.role === 'instructor') {
      return [currentUser];
    }
    const filtered = users.filter(u => u.role === 'instructor');
    return filtered.length > 0 ? filtered : users.filter(u => u.role === 'admin');
  }, [users, currentUser]);

  const [instructorId, setInstructorId] = useState<string>(
    course?.instructorId || course?.instructor?.id || (currentUser?.role === 'instructor' ? currentUser.id : (registeredInstructors[0]?.id || ''))
  );
  const [instructorName, setInstructorName] = useState(
    course?.instructor?.name || (currentUser?.role === 'instructor' ? currentUser.name : (registeredInstructors[0]?.name || 'Dr. Sarah Wijaya, M.Kom'))
  );
  const [instructorTitle, setInstructorTitle] = useState(
    course?.instructor?.title || (currentUser?.role === 'instructor' ? (currentUser.title || '') : (registeredInstructors[0]?.title || 'Senior Lead Instructor'))
  );
  const [instructorAvatar, setInstructorAvatar] = useState(
    course?.instructor?.avatar || (currentUser?.role === 'instructor' ? (currentUser.avatar || '') : (registeredInstructors[0]?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'))
  );
  const [instructorSignatureUrl, setInstructorSignatureUrl] = useState<string>(
    course?.instructor?.signatureUrl || (currentUser?.role === 'instructor' ? (currentUser.signatureUrl || '') : (registeredInstructors[0]?.signatureUrl || ''))
  );
  const [certificateAvailable, setCertificateAvailable] = useState(course?.certificateAvailable ?? true);

  // Manual Bundled Courses
  const [attachedBundleCourses, setAttachedBundleCourses] = useState<AttachedBundleCourse[]>(course?.attachedBundleCourses || []);
  const [selectedBundleCourseIdToAdd, setSelectedBundleCourseIdToAdd] = useState<string>('');
  const [specialBundlePriceToAdd, setSpecialBundlePriceToAdd] = useState<number>(49000);

  // Stats & Social Proof
  const [studentsCount, setStudentsCount] = useState<number>(course?.studentsCount ?? 0);
  const [rating, setRating] = useState<number>(course?.rating ?? 5.0);
  const [isPopular, setIsPopular] = useState<boolean>(course?.isPopular ?? false);
  const [isFeatured, setIsFeatured] = useState<boolean>(course?.isFeatured ?? false);

  // Check if current user has permission to edit this course (Instructors can only edit their own courses)
  const isAuthorizedToEdit = useMemo(() => {
    if (!course) return true; // Creating new course is allowed
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'instructor') {
      const cInstId = course.instructorId || course.instructor?.id;
      const cInstName = (course.instructor?.name || '').trim().toLowerCase();
      const currentUserName = (currentUser.name || '').trim().toLowerCase();
      
      return Boolean(
        (cInstId && cInstId === currentUser.id) ||
        (cInstName && currentUserName && cInstName === currentUserName)
      );
    }
    return false;
  }, [course, currentUser]);

  // Upload States
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadingVideoModuleId, setUploadingVideoModuleId] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Modules State
  const [modules, setModules] = useState<CourseModule[]>(course?.modules || [
    {
      id: 'mod-init-1',
      title: '1. Pengenalan Kurikulum & Setup Lingkungan',
      duration: '15:00',
      durationMinutes: 15,
      isPreview: true,
      videoUrl: 'https://www.youtube.com/watch?v=k5E2AVpwsko',
      videoType: 'youtube',
      description: 'Materi pengantar dan instalasi perangkat lunak pendukung.',
      materi: 'Selamat datang di modul pertama kursus ini!\n\n### 📌 Ringkasan Materi:\n1. Memahami roadmap belajar.\n2. Instalasi peralatan dan software yang dibutuhkan.\n3. Konfigurasi awal workspace dan tips belajar efektif.\n\nPastikan Anda menyimak penjelasan video dan membaca panduan ini hingga tuntas.',
      resources: []
    }
  ]);

  // Synchronize state with course prop whenever modal opens or course changes
  useEffect(() => {
    if (!isOpen) return;

    if (course) {
      setTitle(course.title || '');
      setDescription(course.description || '');
      setCategory(course.category || (categories[0]?.name || 'Web & Mobile Dev'));
      setLevel(course.level || 'Semua Level');
      setPrice(Number(course.price ?? 199000));
      setOriginalPrice(Number(course.originalPrice ?? 500000));
      setAllowCustomPrice(course.allowCustomPrice ?? false);
      setMinCustomPrice(course.minCustomPrice ?? 10000);
      setSuggestedCustomPricesStr(
        course.suggestedCustomPrices && course.suggestedCustomPrices.length > 0
          ? course.suggestedCustomPrices.join(', ')
          : '20000, 50000, 100000, 200000'
      );
      setThumbnail(course.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80');
      
      if (currentUser?.role === 'instructor') {
        setInstructorId(currentUser.id);
        setInstructorName(currentUser.name);
        setInstructorTitle(currentUser.title || '');
        setInstructorAvatar(currentUser.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80');
        setInstructorSignatureUrl(currentUser.signatureUrl || '');
      } else {
        const foundInst = users.find(u => u.id === (course.instructorId || course.instructor?.id));
        setInstructorId(course.instructorId || course.instructor?.id || (foundInst?.id || 'inst-1'));
        setInstructorName(course.instructor?.name || (foundInst?.name || 'Dr. Sarah Wijaya, M.Kom'));
        setInstructorTitle(course.instructor?.title || (foundInst?.title || 'Senior Lead Instructor'));
        setInstructorAvatar(course.instructor?.avatar || (foundInst?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'));
        setInstructorSignatureUrl(course.instructor?.signatureUrl || (foundInst?.signatureUrl || ''));
      }

      setAttachedBundleCourses(course.attachedBundleCourses ? [...course.attachedBundleCourses] : []);
      setCertificateAvailable(course.certificateAvailable ?? true);
      setStudentsCount(course.studentsCount ?? 0);
      setRating(course.rating ?? 5.0);
      setIsPopular(course.isPopular ?? false);
      setIsFeatured(course.isFeatured ?? false);
      setModules(
        course.modules && course.modules.length > 0
          ? JSON.parse(JSON.stringify(course.modules))
          : [
              {
                id: `mod-${Date.now()}-1`,
                title: '1. Pengenalan Kurikulum & Setup Lingkungan',
                duration: '15:00',
                durationMinutes: 15,
                isPreview: true,
                videoUrl: 'https://www.youtube.com/watch?v=k5E2AVpwsko',
                videoType: 'youtube',
                description: 'Materi pengantar dan instalasi perangkat lunak pendukung.',
                materi: 'Selamat datang di modul pertama kursus ini!\n\n### 📌 Ringkasan Materi:\n1. Memahami roadmap belajar.\n2. Instalasi peralatan dan software yang dibutuhkan.\n3. Konfigurasi awal workspace dan tips belajar efektif.\n\nPastikan Anda menyimak penjelasan video dan membaca panduan ini hingga tuntas.',
                resources: []
              }
            ]
      );
    } else {
      // Create new course default state
      setTitle('');
      setDescription('');
      setCategory(categories[0]?.name || 'Web & Mobile Dev');
      setLevel('Semua Level');
      setPrice(199000);
      setOriginalPrice(500000);
      setAllowCustomPrice(false);
      setMinCustomPrice(10000);
      setSuggestedCustomPricesStr('20000, 50000, 100000, 200000');
      setThumbnail('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80');
      
      if (currentUser?.role === 'instructor') {
        setInstructorId(currentUser.id);
        setInstructorName(currentUser.name);
        setInstructorTitle(currentUser.title || '');
        setInstructorAvatar(currentUser.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80');
        setInstructorSignatureUrl(currentUser.signatureUrl || '');
      } else {
        const firstInstructor = registeredInstructors[0];
        setInstructorId(firstInstructor ? firstInstructor.id : 'inst-1');
        setInstructorName(firstInstructor ? firstInstructor.name : 'Dr. Sarah Wijaya, M.Kom');
        setInstructorTitle(firstInstructor?.title || 'Senior Lead Instructor');
        setInstructorAvatar(firstInstructor?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80');
        setInstructorSignatureUrl(firstInstructor?.signatureUrl || '');
      }

      setAttachedBundleCourses([]);
      setCertificateAvailable(true);
      setStudentsCount(0);
      setRating(5.0);
      setIsPopular(false);
      setIsFeatured(false);
      setModules([
        {
          id: `mod-new-1`,
          title: '1. Pengenalan Kurikulum & Setup Lingkungan',
          duration: '15:00',
          durationMinutes: 15,
          isPreview: true,
          videoUrl: 'https://www.youtube.com/watch?v=k5E2AVpwsko',
          videoType: 'youtube',
          description: 'Materi pengantar dan instalasi perangkat lunak pendukung.',
          materi: 'Selamat datang di modul pertama kursus ini!\n\n### 📌 Ringkasan Materi:\n1. Memahami roadmap belajar.\n2. Instalasi peralatan dan software yang dibutuhkan.\n3. Konfigurasi awal workspace dan tips belajar efektif.\n\nPastikan Anda menyimak penjelasan video dan membaca panduan ini hingga tuntas.',
          resources: []
        }
      ]);
    }
  }, [course, isOpen, categories, users, currentUser]);

  const handleSelectInstructor = (selectedId: string) => {
    setInstructorId(selectedId);
    const inst = users.find(u => u.id === selectedId);
    if (inst) {
      setInstructorName(inst.name);
      setInstructorTitle(inst.title || 'Instruktur LESIN AJA');
      if (inst.avatar) setInstructorAvatar(inst.avatar);
      setInstructorSignatureUrl(inst.signatureUrl || '');
    }
  };

  const handleAddBundleCourse = () => {
    if (!selectedBundleCourseIdToAdd) {
      showToast('Pilih kursus yang ingin ditambahkan ke bundling manual.');
      return;
    }
    const target = courses.find(c => c.id === selectedBundleCourseIdToAdd);
    if (!target) return;

    if (attachedBundleCourses.some(b => b.courseId === target.id)) {
      showToast('Kursus ini sudah ada dalam daftar bundling.');
      return;
    }

    const newBundleItem: AttachedBundleCourse = {
      courseId: target.id,
      courseTitle: target.title,
      specialPrice: Math.max(0, Number(specialBundlePriceToAdd)),
      originalPrice: target.originalPrice || target.price,
      thumbnail: target.thumbnail
    };

    setAttachedBundleCourses(prev => [...prev, newBundleItem]);
    setSelectedBundleCourseIdToAdd('');
    showToast(`✅ Kursus "${target.title}" ditambahkan ke bundling spesial!`);
  };

  const handleRemoveBundleCourse = (courseIdToRemove: string) => {
    setAttachedBundleCourses(prev => prev.filter(b => b.courseId !== courseIdToRemove));
    showToast('Kursus dihapus dari daftar bundling.');
  };

  if (!isOpen) return null;

  // Handler Upload Gambar Banner Thumbnail
  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar (JPG, PNG, WebP, SVG).');
      return;
    }

    setIsUploadingThumbnail(true);
    try {
      const res = await uploadFileToSupabaseStorage(file, 'thumbnails');
      if (res.success && res.publicUrl) {
        setThumbnail(res.publicUrl);
        showToast('Gambar banner berhasil diunggah ke Supabase Storage!');
      } else {
        // Fallback ke local data URL
        const dataUrl = await readFileAsDataUrl(file);
        setThumbnail(dataUrl);
        showToast('Gambar banner disimpan lokal. Hubungkan Supabase di Dashboard untuk simpan ke CDN.');
      }
    } catch (err: any) {
      const dataUrl = await readFileAsDataUrl(file);
      setThumbnail(dataUrl);
      showToast('Gambar banner berhasil dipilih (Lokal).');
    } finally {
      setIsUploadingThumbnail(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  };

  // Handler Upload Foto Profil Instruktur
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('File foto profil harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadFileToSupabaseStorage(file, 'avatars');
      if (res.success && res.publicUrl) {
        setInstructorAvatar(res.publicUrl);
        showToast('Foto profil instruktur berhasil diunggah ke Supabase Storage!');
      } else {
        const dataUrl = await readFileAsDataUrl(file);
        setInstructorAvatar(dataUrl);
        showToast('Foto profil disimpan lokal. Hubungkan Supabase untuk simpan ke CDN.');
      }
    } catch (err: any) {
      const dataUrl = await readFileAsDataUrl(file);
      setInstructorAvatar(dataUrl);
      showToast('Foto profil instruktur berhasil dipilih (Lokal).');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Handler Upload Video Modul ke Supabase Storage
  const handleVideoUpload = async (moduleId: string, file: File) => {
    if (!file) return;

    // Check size limit: Supabase free tier usually allows up to 50MB-500MB
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 500) {
      showToast('Ukuran video melebihi batas 500 MB.');
      return;
    }

    setUploadingVideoModuleId(moduleId);
    try {
      const res = await uploadFileToSupabaseStorage(file, 'videos');
      if (res.success && res.publicUrl) {
        handleUpdateModule(moduleId, {
          videoUrl: res.publicUrl,
          videoType: 'supabase' as any
        });
        showToast('Video berhasil diupload ke Supabase Storage & siap diputar!');
      } else {
        showToast(`Gagal upload video: ${res.error || 'Pastikan bucket lesin-media sudah dibuat di Supabase'}`);
      }
    } catch (err: any) {
      showToast(`Terjadi kesalahan upload video: ${err?.message || err}`);
    } finally {
      setUploadingVideoModuleId(null);
    }
  };

  const handleAddModule = () => {
    const newMod: CourseModule = {
      id: `mod-${Date.now()}`,
      title: `${modules.length + 1}. Modul Pembelajaran Baru`,
      duration: '20:00',
      durationMinutes: 20,
      isPreview: false,
      videoUrl: 'https://www.youtube.com/watch?v=k5E2AVpwsko',
      videoType: 'youtube',
      description: 'Deskripsi singkat topik modul ini.',
      materi: '### 📖 Materi & Panduan Pembelajaran Modul\n\nTulis materi penjelasan lengkap, rangkuman konsep penting, atau instruksi langkah demi langkah di sini...',
      resources: []
    };
    setModules(prev => [...prev, newMod]);
  };

  const handleAddQuizModule = () => {
    const newQuizMod: CourseModule = {
      id: `mod-quiz-${Date.now()}`,
      title: `Ujian Evaluasi Akhir: ${title || 'Kursus'}`,
      duration: '20:00',
      durationMinutes: 20,
      videoUrl: '',
      videoType: 'youtube',
      description: 'Kuis evaluasi kelulusan untuk mengklaim e-sertifikat resmi.',
      materi: '### 📝 Petunjuk Pengerjaan Kuis:\n- Jawab seluruh pertanyaan dengan teliti.\n- Nilai minimal kelulusan adalah 80 poin.\n- Setelah lulus, sertifikat terverifikasi akan langsung diterbitkan untuk Anda.',
      resources: [],
      quiz: {
        id: `quiz-${Date.now()}`,
        title: `Ujian Kelulusan ${title || 'Kursus'}`,
        minScoreToPass: 80,
        timeLimitMinutes: 15,
        questions: [
          {
            id: 'q-1',
            question: 'Pertanyaan evaluasi pemahaman materi nomor 1...',
            options: ['Pilihan Jawaban A (Benar)', 'Pilihan Jawaban B', 'Pilihan Jawaban C', 'Pilihan Jawaban D'],
            correctIndex: 0,
            explanation: 'Penjelasan mengapa jawaban A adalah opsi yang tepat.'
          }
        ]
      }
    };
    setModules(prev => [...prev, newQuizMod]);
  };

  const handleRemoveModule = (modId: string) => {
    setModules(prev => prev.filter(m => m.id !== modId));
  };

  const handleUpdateModule = (modId: string, updated: Partial<CourseModule>) => {
    setModules(prev => prev.map(m => (m.id === modId ? { ...m, ...updated } : m)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedToEdit) {
      showToast('⛔ Akses Ditolak: Instruktur tidak dapat mengedit kursus milik instruktur lain.');
      return;
    }
    if (!title.trim()) {
      showToast('Judul kursus wajib diisi.');
      return;
    }

    setIsSaving(true);

    try {
      const parsedSuggestedPrices = suggestedCustomPricesStr
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => !isNaN(n) && n > 0);

      const courseData = {
        title: title.trim(),
        slug: title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `course-${Date.now()}`,
        description,
        category,
        level,
        price: Number(price),
        originalPrice: Number(originalPrice),
        allowCustomPrice: Boolean(allowCustomPrice),
        minCustomPrice: Number(minCustomPrice || 0),
        suggestedCustomPrices: parsedSuggestedPrices.length > 0 ? parsedSuggestedPrices : undefined,
        attachedBundleCourses: attachedBundleCourses.length > 0 ? attachedBundleCourses : undefined,
        thumbnail,
        instructorId: currentUser?.role === 'instructor' ? currentUser.id : (instructorId || 'inst-1'),
        instructor: {
          id: currentUser?.role === 'instructor' ? currentUser.id : (instructorId || 'inst-1'),
          name: currentUser?.role === 'instructor' ? currentUser.name : instructorName,
          title: currentUser?.role === 'instructor' ? (currentUser.title || instructorTitle) : instructorTitle,
          avatar: currentUser?.role === 'instructor' ? (currentUser.avatar || instructorAvatar) : instructorAvatar,
          signatureUrl: currentUser?.role === 'instructor' ? (currentUser.signatureUrl || instructorSignatureUrl) : instructorSignatureUrl
        },
        certificateAvailable,
        studentsCount: Number(studentsCount),
        rating: Number(rating),
        isPopular,
        isFeatured,
        tags: [category, level],
        modules,
        // Status verifikasi: Jika dibuat/diedit oleh instruktur, set status ke 'pending' untuk diverifikasi admin
        verificationStatus: currentUser?.role === 'instructor' ? 'pending' : (course?.verificationStatus || 'approved'),
        rejectionReason: currentUser?.role === 'instructor' ? undefined : course?.rejectionReason
      };

      if (course) {
        await updateCourse(course.id, courseData);
        if (currentUser?.role === 'instructor') {
          showToast('Kursus berhasil diperbarui dan diajukan ke Admin untuk verifikasi!');
        }
      } else {
        await addCourse(courseData);
        if (currentUser?.role === 'instructor') {
          showToast('Kursus baru berhasil dibuat dan diajukan ke Admin untuk ditinjau!');
        }
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving course:', err);
      showToast(`Terjadi kesalahan: ${err?.message || 'Gagal menyimpan'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthorizedToEdit) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 text-center space-y-4 animate-in fade-in zoom-in duration-150">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
              Akses Ditolak: Hak Akses Instruktur
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Anda tidak memiliki izin untuk mengedit kursus ini. Kursus <strong>"{course?.title}"</strong> terdaftar atas nama instruktur <strong>{course?.instructor?.name || 'Instruktur Lain'}</strong>.
            </p>
            <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-left">
              <p className="font-bold mb-0.5">🔒 Kebijakan Keamanan Akun &amp; Hak Cipta:</p>
              <p>Setiap instruktur hanya dapat mengedit dan mengelola materi kursus milik akun mereka sendiri.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs transition shadow-md"
          >
            Kembali ke Dashboard Kursus Saya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-150 my-auto">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                {course ? 'Edit Data & Materi Kursus' : 'Buat Kursus Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi kurikulum, modul video, materi bacaan, dan konfigurasi kursus.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-6 flex-1">
          {currentUser?.role === 'instructor' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white">
                  Verifikasi Kursus Instruktur:
                </p>
                <p className="mt-0.5">
                  Kursus yang Anda simpan akan masuk ke antrean verifikasi Admin. Admin akan meninjau materi dan modul kursus berdasarkan sertifikat/ijazah kompetensi Anda sebelum dipublikasikan di katalog publik.
                </p>
              </div>
            </div>
          )}

          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul Kursus *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Master Full-Stack Web Development Modern"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deskripsi Singkat Kursus
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Jelaskan apa yang akan dipelajari siswa dalam kursus ini..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Kursus
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tingkat Kesulitan (Level)
              </label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="Semua Level">Semua Level</option>
                <option value="Pemula">Pemula (Beginner)</option>
                <option value="Menengah">Menengah (Intermediate)</option>
                <option value="Lanjutan">Lanjutan (Advanced)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Harga Promo Kursus (Rp)
              </label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Harga Normal / Coret (Rp)
              </label>
              <input
                type="number"
                value={originalPrice}
                onChange={e => setOriginalPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Skema Pembayaran Seikhlasnya (Pay What You Want) */}
            <div className="sm:col-span-2 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-500/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Heart className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Fitur Bayar Seikhlasnya (Pay What You Want)</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        Donasi / Fleksibel
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Siswa bebas menentukan atau mengetik sendiri nominal pembayaran saat checkout.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={allowCustomPrice}
                    onChange={e => setAllowCustomPrice(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {allowCustomPrice && (
                <div className="pt-3 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nominal Minimal Pembayaran (Rp) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={minCustomPrice}
                        onChange={e => setMinCustomPrice(Math.max(0, Number(e.target.value)))}
                        placeholder="Contoh: 10000"
                        className="w-full pl-9 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-500/40 text-xs sm:text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Buyer tidak bisa membayar di bawah nominal ini (misal Rp 10.000 atau Rp 0 untuk bebas tanpa batas).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rekomendasi Nominal Cepat (Opsi Chip)
                    </label>
                    <input
                      type="text"
                      value={suggestedCustomPricesStr}
                      onChange={e => setSuggestedCustomPricesStr(e.target.value)}
                      placeholder="Contoh: 20000, 50000, 100000, 200000"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-500/40 text-xs sm:text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Pisahkan dengan koma. Akan muncul sebagai tombol pilihan cepat di checkout.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Gambar Banner / Thumbnail Kursus *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={thumbnailInputRef}
                    onChange={handleThumbnailFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={isUploadingThumbnail}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold text-xs border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isUploadingThumbnail ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingThumbnail ? 'Mengunggah...' : 'Upload Gambar Banner'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="w-full sm:w-44 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 relative group">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt="Preview Banner"
                      className="w-full h-full object-cover"
                      onError={() => setThumbnail('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80')}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                      <span className="text-[10px]">Belum Ada Gambar</span>
                    </div>
                  )}
                  {thumbnail && thumbnail.includes('supabase.co/storage') && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[9px] font-bold flex items-center gap-0.5">
                      <Database className="w-2.5 h-2.5" /> Supabase
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full space-y-1.5">
                  <input
                    type="url"
                    value={thumbnail}
                    onChange={e => setThumbnail(e.target.value)}
                    placeholder="https://... atau klik tombol Upload Gambar Banner di atas"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    💡 Gambar akan diunggah ke Supabase Storage (CDN) atau dapat menggunakan URL gambar publik.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructor & Certificate Settings */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Instruktur Resmi & E-Sertifikat</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Wajib memilih instruktur terdaftar di platform
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Instruktur Terdaftar *
                </label>
                <select
                  value={instructorId}
                  onChange={e => handleSelectInstructor(e.target.value)}
                  disabled={currentUser?.role === 'instructor'}
                  className={`w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:border-blue-500 focus:outline-none ${
                    currentUser?.role === 'instructor' ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 cursor-not-allowed' : ''
                  }`}
                >
                  {registeredInstructors.length > 0 ? (
                    registeredInstructors.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.email}) {inst.title ? `— ${inst.title}` : ''}
                      </option>
                    ))
                  ) : (
                    users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) [Role: {u.role}]
                      </option>
                    ))
                  )}
                </select>
                {currentUser?.role === 'instructor' ? (
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Kursus otomatis terhubung dengan akun instruktur Anda ({currentUser.name}).</span>
                  </p>
                ) : registeredInstructors.length === 0 ? (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    ⚠️ Belum ada pengguna dengan role Instruktur khusus. Anda dapat mengubah role pengguna di menu Manajemen Pengguna.
                  </p>
                ) : null}
              </div>

              {/* Selected Instructor Profile & Signature Preview */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                    {instructorAvatar ? (
                      <img
                        src={instructorAvatar}
                        alt={instructorName}
                        className="w-full h-full object-cover"
                        onError={() => setInstructorAvatar('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {instructorName}
                      <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {instructorTitle || 'Instruktur Resmi LESIN AJA'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-medium">Tanda Tangan E-Sertifikat:</div>
                    {instructorSignatureUrl ? (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1">
                        <PenTool className="w-3 h-3" /> Tersedia
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Belum Diunggah Instruktur
                      </span>
                    )}
                  </div>
                  {instructorSignatureUrl && (
                    <div className="h-9 px-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <img src={instructorSignatureUrl} alt="TTD" className="h-6 max-w-[80px] object-contain dark:invert" />
                    </div>
                  )}
                </div>
              </div>

              {/* Editable Name & Title Overrides if necessary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Label Nama Tampilan
                  </label>
                  <input
                    type="text"
                    value={instructorName}
                    onChange={e => setInstructorName(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Gelar / Posisi Instruktur
                  </label>
                  <input
                    type="text"
                    value={instructorTitle}
                    onChange={e => setInstructorTitle(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="certCheck"
                checked={certificateAvailable}
                onChange={e => setCertificateAvailable(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="certCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Sediakan E-Sertifikat Kelulusan Resmi Terverifikasi dengan Tanda Tangan Instruktur Ini
              </label>
            </div>
          </div>

          {/* Fitur Manual Bundling dengan Harga Khusus (Hanya untuk Admin) */}
          {currentUser?.role !== 'instructor' && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Fitur Bundling Manual (Harga Khusus Add-on)</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  Tawarkan kursus lain dengan harga spesial saat checkout
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Pilih kursus lain dari katalog Lesin Aja dan tetapkan <strong>Harga Spesial Promo</strong> (di bawah harga normal) untuk dibundling bersama kursus ini.
                </p>

                {/* Add Bundle Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pilih Kursus Katalog Lain
                    </label>
                    <select
                      value={selectedBundleCourseIdToAdd}
                      onChange={e => {
                        setSelectedBundleCourseIdToAdd(e.target.value);
                        const target = courses.find(c => c.id === e.target.value);
                        if (target) {
                          setSpecialBundlePriceToAdd(Math.round(target.price * 0.4) || 49000);
                        }
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Kursus untuk Di-bundle --</option>
                      {courses
                        .filter(c => c.id !== course?.id && !attachedBundleCourses.some(b => b.courseId === c.id))
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.title} (Harga Asli: Rp {c.price.toLocaleString('id-ID')})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Harga Khusus Bundling (Rp) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={specialBundlePriceToAdd}
                        onChange={e => setSpecialBundlePriceToAdd(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-9 pr-3 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:border-indigo-500 focus:outline-none"
                        placeholder="49000"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddBundleCourse}
                      className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>

                {/* List of currently attached bundles */}
                {attachedBundleCourses.length > 0 ? (
                  <div className="space-y-2.5 pt-2">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Daftar Kursus Bundling Spesial ({attachedBundleCourses.length}):
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {attachedBundleCourses.map(item => {
                        const discountPct = item.originalPrice && item.originalPrice > item.specialPrice
                          ? Math.round(((item.originalPrice - item.specialPrice) / item.originalPrice) * 100)
                          : 0;

                        return (
                          <div
                            key={item.courseId}
                            className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {item.thumbnail ? (
                                <img
                                  src={item.thumbnail}
                                  alt={item.courseTitle}
                                  className="w-12 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center shrink-0">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {item.courseTitle}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-slate-400 line-through">
                                    Rp {(item.originalPrice || 0).toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                    Rp {item.specialPrice.toLocaleString('id-ID')}
                                  </span>
                                  {discountPct > 0 && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                      Hemat {discountPct}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveBundleCourse(item.courseId)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition shrink-0"
                              title="Hapus dari bundling"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-lg bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                    Belum ada kursus bundling manual yang ditambahkan untuk kursus ini.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Proof & Rating Management (Hanya untuk Admin) */}
          {currentUser?.role !== 'instructor' && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pengaturan Statistik, Rating & Social Proof</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Students Count Input */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jumlah Siswa Terdaftar (Display Count)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={studentsCount}
                      onChange={e => setStudentsCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-xs font-semibold text-slate-500 shrink-0">Siswa</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setStudentsCount(prev => prev + 50)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-200"
                    >
                      +50
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentsCount(prev => prev + 250)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-200"
                    >
                      +250
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentsCount(prev => prev + 1000)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-200"
                    >
                      +1.000
                    </button>
                  </div>
                </div>

                {/* Rating Input */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Rating Bintang (1.0 - 5.0)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={rating}
                      onChange={e => setRating(Math.min(5, Math.max(1, parseFloat(e.target.value) || 5.0)))}
                      className="w-24 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-amber-500 focus:border-amber-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= Math.round(rating) ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setRating(4.8)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200"
                    >
                      4.8 ⭐
                    </button>
                    <button
                      type="button"
                      onClick={() => setRating(4.9)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200"
                    >
                      4.9 ⭐
                    </button>
                    <button
                      type="button"
                      onClick={() => setRating(5.0)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200"
                    >
                      5.0 ⭐
                    </button>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={e => setIsPopular(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tandai sebagai Kursus Populer</span>
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>Tandai sebagai Kursus Unggulan</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Curriculum & Modules Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Kurikulum, Modul & Materi Pembelajaran</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
                    {modules.length} Modul
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Setiap modul dapat berisi Video Pelajaran, Materi Teks/Artikel Lengkap, Catatan, dan Kuis Evaluasi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddModule}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Modul & Materi Baru</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddQuizModule}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>+ Ujian Kuis</span>
                </button>
              </div>
            </div>

            {/* Modules List */}
            <div className="space-y-4">
              {modules.map((mod, idx) => (
                <div
                  key={mod.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 space-y-3.5 shadow-sm"
                >
                  {/* Module Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {mod.quiz ? 'Modul Ujian & Evaluasi Kuis' : 'Modul Pembelajaran & Materi'}
                      </span>
                      {mod.isPreview && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          Pratinjau Gratis
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(mod.isPreview)}
                          onChange={e => handleUpdateModule(mod.id, { isPreview: e.target.checked })}
                          className="w-3.5 h-3.5 text-emerald-600 rounded"
                        />
                        <span className="text-[11px] font-medium">Bisa Dipratinjau Gratis</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveModule(mod.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                        title="Hapus Modul"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Core Module Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Modul Pembelajaran *
                      </label>
                      <input
                        type="text"
                        value={mod.title}
                        onChange={e => handleUpdateModule(mod.id, { title: e.target.value })}
                        placeholder="Contoh: 1. Konsep Dasar & Arsitektur Sistem"
                        className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-medium focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Durasi Belajar (e.g. 15:00)
                      </label>
                      <input
                        type="text"
                        value={mod.duration}
                        onChange={e => {
                          const val = e.target.value;
                          const minutes = parseInt(val, 10) || 15;
                          handleUpdateModule(mod.id, { duration: val, durationMinutes: minutes });
                        }}
                        className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-medium focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    {!mod.quiz && (
                      <div className="sm:col-span-3 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-blue-500" />
                            <span>Video Pembelajaran (YouTube / Supabase Storage / File Video):</span>
                          </label>

                          <div className="flex items-center gap-2">
                            {/* Supabase Storage or Direct Video badge */}
                            {mod.videoUrl && (
                              mod.videoUrl.includes('supabase.co/storage') ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <Database className="w-3 h-3" /> Supabase Video (CDN)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Tautan Video
                                </span>
                              )
                            )}

                            {/* Test Video Preview Button */}
                            {mod.videoUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewVideoUrl(mod.videoUrl)}
                                className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-semibold flex items-center gap-1 transition"
                                title="Uji Coba Putar Video"
                              >
                                <Play className="w-2.5 h-2.5" />
                                <span>Tes Putar</span>
                              </button>
                            )}

                            {/* Upload Video Button */}
                            <label className={`px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold text-[11px] border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 cursor-pointer transition ${uploadingVideoModuleId === mod.id ? 'opacity-50 pointer-events-none' : ''}`}>
                              {uploadingVideoModuleId === mod.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Mengunggah Video...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload Video Supabase</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/mkv"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handleVideoUpload(mod.id, file);
                                  e.target.value = '';
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        <input
                          type="url"
                          value={mod.videoUrl}
                          onChange={e => handleUpdateModule(mod.id, { videoUrl: e.target.value })}
                          placeholder="https://... (URL YouTube, embed, atau hasil upload video Supabase Storage)"
                          className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Deskripsi Singkat Modul
                      </label>
                      <input
                        type="text"
                        value={mod.description}
                        onChange={e => handleUpdateModule(mod.id, { description: e.target.value })}
                        placeholder="Ringkasan 1-2 kalimat tentang apa yang dipelajari di modul ini..."
                        className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* MATERI PEMBELAJARAN LENGKAP */}
                    <div className="sm:col-span-3 pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Materi Pembelajaran Modul (Teks Lengkap, Artikel, Kode, Rangkuman):</span>
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Mendukung teks terstruktur / Markdown
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={mod.materi || ''}
                        onChange={e => handleUpdateModule(mod.id, { materi: e.target.value })}
                        placeholder={`Tulis materi teks lengkap modul di sini...\nContoh:\n### 🎯 Tujuan Pembelajaran\n1. Menguasai alur kerja sistem...\n\n### 📝 Penjelasan Konsep\nDetail penjelasan konsep beserta contoh penerapannya...`}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-sans focus:border-blue-500 focus:outline-none leading-relaxed"
                      />
                    </div>

                    {/* UPLOAD FILE MATERI (PDF, EXCEL, WORD, PNG, JPG, DLL) */}
                    {!mod.quiz && (
                      <div className="sm:col-span-3 border-t border-slate-200 dark:border-slate-700/60 pt-3">
                        <ModuleResourceManager
                          resources={mod.resources || []}
                          onChange={newResources => handleUpdateModule(mod.id, { resources: newResources })}
                          moduleId={mod.id}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Kursus akan otomatis disinkronkan ke Supabase Cloud dan browser lokal.
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                disabled={isSaving}
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan & Sinkronkan Kursus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL TES PUTAR VIDEO */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-400" />
                <span className="font-heading font-bold text-sm text-white">Uji Coba Pemutar Video</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideoUrl(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              {previewVideoUrl.includes('youtube.com') || previewVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={
                    previewVideoUrl.includes('watch?v=')
                      ? `https://www.youtube-nocookie.com/embed/${previewVideoUrl.split('v=')[1]?.split('&')[0]}?autoplay=1`
                      : previewVideoUrl.includes('youtu.be/')
                      ? `https://www.youtube-nocookie.com/embed/${previewVideoUrl.split('youtu.be/')[1]?.split('?')[0]}?autoplay=1`
                      : previewVideoUrl
                  }
                  title="Test Video Preview"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={previewVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Browser Anda tidak mendukung pemutar video HTML5.
                </video>
              )}
            </div>
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate max-w-md font-mono text-[11px]">{previewVideoUrl}</span>
              <button
                type="button"
                onClick={() => setPreviewVideoUrl(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
