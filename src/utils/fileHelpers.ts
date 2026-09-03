import { ResourceType, ResourceItem } from '../types';

export function getResourceTypeFromFileName(fileName: string, mimeType?: string): ResourceType {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (mimeType?.includes('pdf') || ext === 'pdf') {
    return 'pdf';
  }
  if (
    mimeType?.includes('spreadsheet') ||
    mimeType?.includes('excel') ||
    ['xlsx', 'xls', 'csv', 'ods'].includes(ext)
  ) {
    return 'excel';
  }
  if (
    mimeType?.includes('word') ||
    mimeType?.includes('document') ||
    ['docx', 'doc', 'odt', 'rtf'].includes(ext)
  ) {
    return 'word';
  }
  if (
    mimeType?.includes('presentation') ||
    mimeType?.includes('powerpoint') ||
    ['pptx', 'ppt', 'odp'].includes(ext)
  ) {
    return 'powerpoint';
  }
  if (
    mimeType?.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'ico'].includes(ext)
  ) {
    return 'image';
  }
  if (
    mimeType?.includes('zip') ||
    mimeType?.includes('compressed') ||
    mimeType?.includes('tar') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
  ) {
    return 'zip';
  }
  if (
    mimeType?.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)
  ) {
    return 'audio';
  }
  if (
    mimeType?.startsWith('video/') ||
    ['mp4', 'webm', 'mkv', 'mov', 'avi'].includes(ext)
  ) {
    return 'video';
  }
  if (
    ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'html', 'css', 'json', 'sql', 'php', 'cpp', 'c', 'sh'].includes(ext)
  ) {
    return 'code';
  }
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

export function getFileBadgeInfo(type: ResourceType) {
  switch (type) {
    case 'pdf':
      return {
        label: 'PDF Dokumen',
        badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        iconName: 'FileText'
      };
    case 'excel':
      return {
        label: 'Excel / Spreadsheet',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        iconName: 'FileSpreadsheet'
      };
    case 'word':
      return {
        label: 'Word Dokumen',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        iconName: 'FileText'
      };
    case 'powerpoint':
      return {
        label: 'PowerPoint Slide',
        badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        iconName: 'Presentation'
      };
    case 'image':
      return {
        label: 'Gambar / Visual',
        badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        iconName: 'Image'
      };
    case 'zip':
      return {
        label: 'ZIP / Arsip',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        iconName: 'FolderArchive'
      };
    case 'drive':
      return {
        label: 'Google Drive',
        badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        iconName: 'ExternalLink'
      };
    case 'link':
      return {
        label: 'Tautan Web',
        badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        iconName: 'ExternalLink'
      };
    case 'code':
      return {
        label: 'Source Code / Script',
        badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
        iconName: 'Code'
      };
    default:
      return {
        label: 'File Materi',
        badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        iconName: 'File'
      };
  }
}
