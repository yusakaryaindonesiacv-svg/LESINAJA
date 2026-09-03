import React, { useState, useRef } from 'react';
import { ResourceItem, ResourceType } from '../../types';
import {
  formatFileSize,
  getResourceTypeFromFileName,
  readFileAsDataUrl,
  getFileBadgeInfo
} from '../../utils/fileHelpers';
import { uploadFileToSupabaseStorage } from '../../utils/supabaseClient';
import {
  Upload,
  Link as LinkIcon,
  Trash2,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  FolderArchive,
  ExternalLink,
  Code,
  File,
  Eye,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database
} from 'lucide-react';

interface ModuleResourceManagerProps {
  resources: ResourceItem[];
  onChange: (resources: ResourceItem[]) => void;
  moduleId: string;
}

export const ModuleResourceManager: React.FC<ModuleResourceManagerProps> = ({
  resources = [],
  onChange,
  moduleId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);

  // External URL input state
  const [urlTitle, setUrlTitle] = useState('');
  const [urlAddress, setUrlAddress] = useState('');
  const [urlType, setUrlType] = useState<ResourceType>('link');

  const getFileIcon = (type: ResourceType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case 'word':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'powerpoint':
        return <Presentation className="w-4 h-4 text-orange-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-purple-500" />;
      case 'zip':
        return <FolderArchive className="w-4 h-4 text-amber-500" />;
      case 'code':
        return <Code className="w-4 h-4 text-teal-500" />;
      case 'drive':
      case 'link':
        return <ExternalLink className="w-4 h-4 text-sky-500" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadStatusMsg('Sedang mengunggah berkas...');

    const newItems: ResourceItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const resourceType = getResourceTypeFromFileName(file.name, file.type);
      setUploadStatusMsg(`Mengunggah "${file.name}" (${formatFileSize(file.size)})...`);

      // Attempt 1: Upload to Supabase Storage CDN (Bucket: 'lesin-media')
      let uploadedToSupabase = false;
      try {
        const res = await uploadFileToSupabaseStorage(file, 'resources');
        if (res.success && res.publicUrl) {
          newItems.push({
            id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            url: res.publicUrl,
            type: resourceType,
            size: formatFileSize(file.size),
            fileType: file.type || undefined,
            uploadedAt: new Date().toISOString()
          });
          uploadedToSupabase = true;
        }
      } catch (uploadErr) {
        console.warn('Supabase storage upload error, checking fallback:', uploadErr);
      }

      if (uploadedToSupabase) continue;

      // Fallback: Local Base64 storage
      // To protect localStorage quota and prevent white screen blanking, limit local fallback to 2 MB
      if (file.size > 2 * 1024 * 1024) {
        setUploadError(
          `File "${file.name}" berukuran ${formatFileSize(file.size)}. Supabase Storage belum terhubung atau bucket belum dibuat. Untuk file besar, hubungkan Supabase di Pengaturan Admin atau gunakan opsi "+ Link / Drive" agar browser tidak kehabisan kuota memori.`
        );
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        newItems.push({
          id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          url: dataUrl,
          type: resourceType,
          size: formatFileSize(file.size),
          fileType: file.type || undefined,
          uploadedAt: new Date().toISOString()
        });
      } catch (err: any) {
        console.error('Error reading file as local Data URL:', err);
        setUploadError(`Gagal memproses file: ${file.name}`);
      }
    }

    if (newItems.length > 0) {
      onChange([...resources, ...newItems]);
    }
    setIsUploading(false);
    setUploadStatusMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveResource = (id: string) => {
    onChange(resources.filter(r => r.id !== id));
  };

  const handleAddExternalUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlTitle.trim() || !urlAddress.trim()) return;

    const newRes: ResourceItem = {
      id: `res-link-${Date.now()}`,
      name: urlTitle.trim(),
      url: urlAddress.trim(),
      type: urlType,
      size: urlType === 'drive' ? 'Google Drive' : 'Link Web',
      uploadedAt: new Date().toISOString()
    };

    onChange([...resources, newRes]);
    setUrlTitle('');
    setUrlAddress('');
    setShowAddUrlModal(false);
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <FolderArchive className="w-3.5 h-3.5 text-blue-500" />
          <span>File & Lampiran Materi Pembelajaran:</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-normal">
            {resources.length} File
          </span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>Upload File (PDF, Excel, Word, Image)</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddUrlModal(!showAddUrlModal)}
            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>+ Link / Drive</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.svg,.gif,.zip,.rar,.7z,.txt,.json,.js,.py,.mp3,.mp4"
        className="hidden"
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40'
            : 'border-slate-300 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tarik & Jatuhkan file ke sini, atau klik untuk memilih file
          </span>
        </div>
        <p className="text-[10px] text-slate-400">
          Mendukung PDF, Excel (.xlsx, .csv), Word (.docx), PPT (.pptx), Gambar (.png, .jpg, .svg), ZIP, dan lainnya (Maks 15 MB/file)
        </p>
      </div>

      {uploadStatusMsg && (
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs flex items-center gap-2">
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
          <span>{uploadStatusMsg}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Add External Link Form */}
      {showAddUrlModal && (
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-500/40 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Tambah Tautan Materi (Google Drive / URL Web)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddUrlModal(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <input
                type="text"
                placeholder="Judul File / Link (e.g. Slide Presentasi)"
                value={urlTitle}
                onChange={e => setUrlTitle(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="url"
                placeholder="https://drive.google.com/... atau https://..."
                value={urlAddress}
                onChange={e => setUrlAddress(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={urlType}
                onChange={e => setUrlType(e.target.value as ResourceType)}
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="drive">Google Drive</option>
                <option value="link">Tautan Web</option>
                <option value="pdf">PDF Link</option>
                <option value="excel">Excel Link</option>
                <option value="word">Word Link</option>
              </select>
              <button
                type="button"
                onClick={handleAddExternalUrl}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shrink-0 transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded File List */}
      {resources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {resources.map(res => {
            const badge = getFileBadgeInfo(res.type);
            const isImage = res.type === 'image';

            return (
              <div
                key={res.id}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 shadow-xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {isImage && res.url.startsWith('data:image') ? (
                    <img
                      src={res.url}
                      alt={res.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                      {getFileIcon(res.type)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={res.name}>
                      {res.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}>
                        {badge.label}
                      </span>
                      {res.url && res.url.includes('supabase.co') && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Cloud CDN
                        </span>
                      )}
                      {res.size && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {res.size}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={res.name}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Pratinjau / Unduh File"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveResource(res.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    title="Hapus File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
