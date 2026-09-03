import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InstructorApplication, Course } from '../../types';
import { formatRupiah } from '../../utils/exportUtils';
import {
  Award,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  FileText,
  Trash2,
  Save,
  Check,
  X,
  AlertTriangle,
  BookOpen,
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Eye,
  Info,
  PenTool,
  Edit3
} from 'lucide-react';

export const InstructorVerificationView: React.FC = () => {
  const {
    instructorApplications,
    approveInstructorApplication,
    rejectInstructorApplication,
    deleteInstructorApplication,
    saveInstructorApplicationsToSupabase,
    courses,
    approveCourse,
    rejectCourse,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'applications' | 'courses_verification'>('applications');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Document preview modal
  const [previewDocument, setPreviewDocument] = useState<{ title: string; url: string; isSignature?: boolean } | null>(null);
  const [signatureBgMode, setSignatureBgMode] = useState<'dark' | 'checker' | 'light'>('dark');

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState<{
    type: 'application' | 'course';
    id: string;
    name: string;
    isEditingExistingReason?: boolean;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Course rejection reason helper
  const handleConfirmRejection = async () => {
    if (!rejectingItem) return;

    if (rejectingItem.type === 'application') {
      await rejectInstructorApplication(rejectingItem.id, rejectionReason.trim() || 'Kualifikasi atau sertifikat belum memenuhi standar pengajar.');
    } else {
      await rejectCourse(rejectingItem.id, rejectionReason.trim() || 'Materi kursus tidak sesuai dengan sertifikat/ijazah kompetensi instruktur.');
    }

    setRejectingItem(null);
    setRejectionReason('');
  };

  // Filtered applications
  const filteredApplications = instructorApplications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch =
      (app.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (app.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (app.specialization?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pending courses from instructors
  const instructorCourses = courses.filter(c => c.instructorId || c.verificationStatus);
  const pendingCourses = courses.filter(c => c.verificationStatus === 'pending');
  const approvedCourses = courses.filter(c => c.verificationStatus === 'approved' || (!c.verificationStatus && c.instructorId));
  const rejectedCourses = courses.filter(c => c.verificationStatus === 'rejected');

  const pendingAppsCount = instructorApplications.filter(a => a.status === 'pending').length;
  const approvedAppsCount = instructorApplications.filter(a => a.status === 'approved').length;
  const rejectedAppsCount = instructorApplications.filter(a => a.status === 'rejected').length;
  const pendingCoursesCount = pendingCourses.length;

  const quickRejectionReasons = [
    'Tanda Tangan Digital buram atau tidak terbaca dengan jelas.',
    'Dokumen Sertifikat/Ijazah Keahlian tidak sesuai atau tidak valid.',
    'Foto/Dokumen KTP tidak jelas atau tidak sesuai identitas pendaftar.',
    'Bidang keahlian belum memenuhi standar kualifikasi instruktur platform.',
    'Pengalaman atau biografi belum mencukupi standar materi kursus.'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-500" />
            <span>Verifikasi Pengajar &amp; Kurasi Kursus</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Validasi berkas ijazah/sertifikat calon instruktur dan kurasi kesesuaian materi kursus sebelum dipublikasikan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={async () => {
              setIsSaving(true);
              await saveInstructorApplicationsToSupabase();
              setIsSaving(false);
            }}
            disabled={isSaving}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
            title="Simpan seluruh status pendaftaran instruktur ke database Supabase"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Status ke Supabase'}</span>
          </button>
        </div>
      </div>

      {/* Main Tabs: Pendaftaran Calon Instruktur vs Kurasi Kursus Instruktur */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
            activeTab === 'applications'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Pendaftaran Instruktur ({instructorApplications.length})</span>
          {pendingAppsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
              {pendingAppsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('courses_verification')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
            activeTab === 'courses_verification'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Verifikasi Kursus Instruktur ({pendingCoursesCount} Perlu Ditinjau)</span>
          {pendingCoursesCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {pendingCoursesCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PENDAFTARAN INSTRUKTUR */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-500">Total Pendaftar</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {instructorApplications.length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Menunggu Verifikasi</span>
              </p>
              <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
                {pendingAppsCount}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Disetujui</span>
              </p>
              <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                {instructorApplications.filter(a => a.status === 'approved').length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20">
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>Ditolak</span>
              </p>
              <p className="text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">
                {instructorApplications.filter(a => a.status === 'rejected').length}
              </p>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    filterStatus === st
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' && `Semua (${instructorApplications.length})`}
                  {st === 'pending' && `Menunggu (${pendingAppsCount})`}
                  {st === 'approved' && `Disetujui (${approvedAppsCount})`}
                  {st === 'rejected' && `Ditolak (${rejectedAppsCount})`}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, keahlian..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Application List */}
          {filteredApplications.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Tidak ada pendaftaran instruktur yang cocok dengan filter
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Calon pengajar dapat mendaftar melalui form 'Gabung Jadi Instruktur' di halaman website.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map(app => {
                const isPending = app.status === 'pending';
                const isApproved = app.status === 'approved';
                const isRejected = app.status === 'rejected';

                return (
                  <div
                    key={app.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition shadow-sm space-y-4 ${
                      isPending
                        ? 'border-amber-400/80 dark:border-amber-600/80 bg-amber-50/10'
                        : isApproved
                        ? 'border-emerald-300 dark:border-emerald-800/60'
                        : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/5'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-base shrink-0 shadow-md">
                          {app.name?.charAt(0).toUpperCase() || 'I'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                              {app.name}
                            </h3>
                            {app.title && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {app.title}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : isApproved
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {isPending && <Clock className="w-3 h-3" />}
                              {isApproved && <CheckCircle className="w-3 h-3" />}
                              {isRejected && <XCircle className="w-3 h-3" />}
                              <span>
                                {isPending ? 'Menunggu Verifikasi' : isApproved ? 'Terverifikasi' : 'Ditolak'}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {app.email}
                            </span>
                            {app.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {app.phone}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              Daftar: {new Date(app.appliedAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => approveInstructorApplication(app.id)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
                            >
                              <Check className="w-4 h-4" />
                              <span>Setujui Jadi Instruktur</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingItem({
                                  type: 'application',
                                  id: app.id,
                                  name: app.name
                                });
                                setRejectionReason('');
                              }}
                              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition"
                            >
                              <X className="w-4 h-4" />
                              <span>Tolak</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Role Instruktur Aktif</span>
                          </span>
                        )}

                        {isRejected && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingItem({
                                  type: 'application',
                                  id: app.id,
                                  name: app.name,
                                  isEditingExistingReason: true
                                });
                                setRejectionReason(app.rejectionReason || '');
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                              title="Ubah Catatan / Alasan Penolakan"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Ubah Alasan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => approveInstructorApplication(app.id)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Tinjau Ulang &amp; Setujui</span>
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus data pendaftaran "${app.name}"?`)) {
                              deleteInstructorApplication(app.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Hapus Rekaman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Details Box: Keahlian, Bio, Dokumen (Ijazah, KTP, Tanda Tangan), Rekening */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {/* Column 1: Bidang & Bio */}
                      <div className="space-y-2">
                        <div>
                          {(() => {
                            const appSpecs = app.specializations && app.specializations.length > 0
                              ? app.specializations
                              : (app.specialization || 'Umum').split(',').map(s => s.trim()).filter(Boolean);
                            return (
                              <>
                                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                  <span>Bidang Keahlian:</span>
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    {appSpecs.length}/5 Bidang
                                  </span>
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {appSpecs.map((spec, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80"
                                    >
                                      {spec}
                                    </span>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        {app.bio && (
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-300">Biografi / Pengalaman:</p>
                            <p className="text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-3">
                              {app.bio}
                            </p>
                          </div>
                        )}
                        {app.rejectionReason && (
                          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold flex items-center gap-1 text-rose-800 dark:text-rose-200">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Alasan Penolakan:</span>
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingItem({
                                    type: 'application',
                                    id: app.id,
                                    name: app.name,
                                    isEditingExistingReason: true
                                  });
                                  setRejectionReason(app.rejectionReason || '');
                                }}
                                className="text-[10px] text-rose-600 dark:text-rose-400 underline hover:text-rose-800 font-semibold"
                              >
                                Edit Alasan
                              </button>
                            </div>
                            <p className="text-xs leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-rose-200/60 dark:border-rose-900/60">
                              {app.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Column 2: Uploaded Documents (Ijazah / Sertifikat, KTP, Tanda Tangan) */}
                      <div className="space-y-2">
                        <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>Berkas &amp; Identitas Pengajar:</span>
                        </p>

                        {/* Certificate / Ijazah */}
                        {app.certificates && app.certificates.length > 0 ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                Sertifikat per Bidang ({app.certificates.length}):
                              </span>
                            </div>
                            {app.certificates.map((cert, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                                    {cert.specialization}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {cert.certificateName || 'Sertifikat Keahlian'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDocument({
                                      title: `Sertifikat ${cert.specialization} - ${app.name}`,
                                      url: cert.certificateUrl
                                    })
                                  }
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Lihat</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : app.certificateUrl ? (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                {app.certificateName || 'Sertifikat_Keahlian.pdf'}
                              </p>
                              <p className="text-[10px] text-slate-400">Bukti keahlian/ijazah</p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDocument({
                                  title: `Sertifikat / Ijazah - ${app.name}`,
                                  url: app.certificateUrl!
                                })
                              }
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat</span>
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic text-xs">Tidak ada berkas sertifikat yang diunggah.</p>
                        )}

                        {/* ID Card (KTP) */}
                        {app.idCardUrl ? (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <User className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate block">
                                Kartu Identitas (KTP)
                              </span>
                              <span className="text-[10px] text-slate-400">Verifikasi identitas resmi</span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDocument({
                                  title: `KTP / Identitas Resmi - ${app.name}`,
                                  url: app.idCardUrl!
                                })
                              }
                              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-[11px]">
                            ⚠️ KTP belum diunggah
                          </div>
                        )}

                        {/* Digital Signature */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                              <PenTool className="w-3.5 h-3.5 text-amber-400" />
                              <span>Tanda Tangan Digital</span>
                            </span>
                            {app.signatureUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSignatureBgMode('dark');
                                  setPreviewDocument({
                                    title: `Tanda Tangan Digital - ${app.name}`,
                                    url: app.signatureUrl!,
                                    isSignature: true
                                  });
                                }}
                                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-extrabold flex items-center gap-1 shadow"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Perbesar (Uji Transparan)</span>
                              </button>
                            )}
                          </div>

                          {app.signatureUrl ? (
                            <div className="h-16 w-full bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center p-1.5 overflow-hidden shadow-inner relative group">
                              <img
                                src={app.signatureUrl}
                                alt={`Tanda Tangan ${app.name}`}
                                className="max-h-full max-w-full object-contain filter contrast-125 brightness-110"
                              />
                              <span className="absolute bottom-1 right-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700">
                                Background Gelap
                              </span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">Belum mengunggah tanda tangan.</p>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Rekening Pencairan Hasil Kursus */}
                      <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span>Rekening Payout Instruktur:</span>
                        </p>
                        <p className="text-slate-800 dark:text-slate-200 font-bold">
                          {app.bankAccount?.bankName || 'BCA'} - {app.bankAccount?.accountNumber || '-'}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          a.n. {app.bankAccount?.accountHolder || app.name}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VERIFIKASI & KURASI KURSUS INSTRUKTUR */}
      {activeTab === 'courses_verification' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <p className="font-bold">Pedoman Verifikasi Kursus Instruktur:</p>
              <p>
                Sesuai kebijakan platform, setiap kursus yang diajukan oleh pengajar harus ditinjau kesesuaiannya dengan sertifikat/ijazah kompetensi instruktur. Admin berhak menolak kursus apabila materi tidak relevan dengan keahlian instruktur yang terverifikasi.
              </p>
            </div>
          </div>

          {/* List of Courses for Verification */}
          {courses.length === 0 ? (
            <p className="text-xs text-slate-500 p-8 text-center">Belum ada kursus yang terdaftar.</p>
          ) : (
            <div className="space-y-4">
              {courses.map(c => {
                const instApp = instructorApplications.find(
                  a => a.userId === c.instructorId || a.name?.toLowerCase() === c.instructor?.name?.toLowerCase()
                );
                const isCoursePending = c.verificationStatus === 'pending';
                const isCourseApproved = c.verificationStatus === 'approved' || (!c.verificationStatus && !c.instructorId);
                const isCourseRejected = c.verificationStatus === 'rejected';

                return (
                  <div
                    key={c.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition shadow-sm space-y-4 ${
                      isCoursePending
                        ? 'border-amber-400 dark:border-amber-600 bg-amber-50/15'
                        : isCourseApproved
                        ? 'border-slate-200 dark:border-slate-800'
                        : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Left: Course info */}
                      <div className="flex items-start gap-3.5">
                        <img
                          src={c.thumbnail}
                          alt={c.title}
                          className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {c.category}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {c.level}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                isCoursePending
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : isCourseApproved
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {isCoursePending
                                ? '⏳ Menunggu Verifikasi Admin'
                                : isCourseApproved
                                ? '✓ Disetujui (Tayang di Katalog)'
                                : '✕ Ditolak'}
                            </span>
                          </div>

                          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                            {c.title}
                          </h3>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                            {formatRupiah(c.price)} • {c.modules.length} Modul Materi
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {c.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                        {isCoursePending && (
                          <>
                            <button
                              type="button"
                              onClick={() => approveCourse(c.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
                            >
                              <Check className="w-4 h-4" />
                              <span>Setujui Kursus</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingItem({
                                  type: 'course',
                                  id: c.id,
                                  name: c.title
                                });
                              }}
                              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition"
                            >
                              <X className="w-4 h-4" />
                              <span>Tolak Kursus</span>
                            </button>
                          </>
                        )}

                        {isCourseApproved && (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-4 h-4" />
                            <span>Publik</span>
                          </span>
                        )}

                        {isCourseRejected && (
                          <button
                            type="button"
                            onClick={() => approveCourse(c.id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Tinjau Ulang &amp; Setujui</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Comparison Box: Instructor Credentials vs Course Topic */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Instruktur Pengampu: {c.instructor?.name || instApp?.name || 'Super Admin'}
                          </span>
                          {instApp?.specialization && (
                            <span className="text-[11px] text-slate-500">
                              (Spesialisasi: <strong>{instApp.specialization}</strong>)
                            </span>
                          )}
                        </div>

                        {instApp?.certificateUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDocument({
                                title: `Sertifikat Instruktur - ${instApp.name}`,
                                url: instApp.certificateUrl!
                              })
                            }
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Cek Bukti Sertifikat / Ijazah</span>
                          </button>
                        )}
                      </div>

                      {c.rejectionReason && (
                        <div className="p-2 rounded-lg bg-rose-100/70 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                          <strong>Catatan Penolakan Admin:</strong> {c.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 truncate">
                  {previewDocument.isSignature || previewDocument.title.toLowerCase().includes('tanda tangan') ? (
                    <PenTool className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <span className="truncate">{previewDocument.title}</span>
                </h3>
                {(previewDocument.isSignature || previewDocument.title.toLowerCase().includes('tanda tangan')) && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    🔍 Uji Transparansi: Pastikan gambar tanda tangan tidak memiliki latar putih/buram
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {(previewDocument.isSignature || previewDocument.title.toLowerCase().includes('tanda tangan')) && (
                  <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-xl gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSignatureBgMode('dark')}
                      className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                        signatureBgMode === 'dark'
                          ? 'bg-slate-950 text-amber-400 shadow'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>🌙 Gelap</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureBgMode('checker')}
                      className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                        signatureBgMode === 'checker'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>🏁 Papan Catur</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureBgMode('light')}
                      className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                        signatureBgMode === 'light'
                          ? 'bg-white text-slate-900 shadow'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>☀️ Terang</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div
              className={`p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[360px] transition-colors relative ${
                previewDocument.isSignature || previewDocument.title.toLowerCase().includes('tanda tangan')
                  ? signatureBgMode === 'dark'
                    ? 'bg-slate-950 border-y border-slate-800'
                    : signatureBgMode === 'checker'
                    ? 'bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] bg-slate-800 border-y border-slate-700'
                    : 'bg-white border-y border-slate-200'
                  : 'bg-slate-100 dark:bg-slate-950'
              }`}
            >
              {previewDocument.url.startsWith('data:image') ||
              previewDocument.url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ||
              !previewDocument.url.endsWith('.pdf') ? (
                <div className="relative max-h-[65vh] max-w-full flex flex-col items-center justify-center p-2">
                  <img
                    src={previewDocument.url}
                    alt={previewDocument.title}
                    className="max-h-[55vh] max-w-full object-contain rounded-lg drop-shadow-md"
                  />
                  {(previewDocument.isSignature || previewDocument.title.toLowerCase().includes('tanda tangan')) && (
                    <div className="mt-3 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>
                        {signatureBgMode === 'dark'
                          ? 'Background Gelap Aktif: Jika transparan, gambar akan membaur mulus tanpa kotak putih di sekelilingnya.'
                          : signatureBgMode === 'checker'
                          ? 'Background Papan Catur: Memudahkan melihat piksel transparan.'
                          : 'Background Terang'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <iframe
                  src={previewDocument.url}
                  title={previewDocument.title}
                  className="w-full h-[60vh] rounded-xl border border-slate-200 dark:border-slate-800"
                />
              )}
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {(previewDocument.isSignature || previewDocument.title.toLowerCase().includes('tanda tangan'))
                  ? 'Format rekomendasi tanda tangan: PNG Transparan'
                  : 'Berkas verifikasi terenkripsi aman'}
              </span>
              <a
                href={previewDocument.url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Tab Baru</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  {rejectingItem.isEditingExistingReason
                    ? 'Ubah Catatan Alasan Penolakan'
                    : `Tolak ${rejectingItem.type === 'application' ? 'Pendaftaran Instruktur' : 'Pengajuan Kursus'}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(null);
                  setRejectionReason('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {rejectingItem.isEditingExistingReason
                ? `Perbarui catatan penolakan untuk `
                : `Tentukan alasan penolakan untuk `}
              <strong className="text-slate-900 dark:text-white">{rejectingItem.name}</strong>. Alasan ini akan tercatat di sistem dan dapat dibaca oleh pengajar untuk perbaikan:
            </p>

            {/* Quick Pick Preset Reasons */}
            {rejectingItem.type === 'application' && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pilih Alasan Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickRejectionReasons.map((reason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReason(reason)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 border border-slate-200 dark:border-slate-700 text-left transition font-medium"
                    >
                      + {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300">
                Kolom Alasan Penolakan:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder={
                  rejectingItem.type === 'application'
                    ? 'Contoh: Tanda tangan tidak jelas, atau dokumen ijazah/sertifikat tidak sesuai bidang keahlian...'
                    : 'Contoh: Materi kursus tidak sesuai dengan sertifikat/ijazah kompetensi instruktur...'
                }
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{rejectingItem.isEditingExistingReason ? 'Simpan Perubahan Alasan' : 'Konfirmasi Tolak'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
