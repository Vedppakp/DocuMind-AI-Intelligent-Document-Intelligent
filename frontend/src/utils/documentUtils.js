/**
 * Utilities for clean document formatting, name normalization, and file-type detection.
 * Solves user feedback regarding confusing "docx(finale) (1).pdf" names.
 */

export function cleanDocumentTitle(fileName = '') {
  if (!fileName) return 'Document';

  let clean = fileName;

  // 1. Remove duplicate file extensions like .docx.pdf or .pdf.pdf
  clean = clean.replace(/\.docx\.pdf$/i, '.pdf');
  clean = clean.replace(/\.pptx\.pdf$/i, '.pdf');
  clean = clean.replace(/\.xlsx\.pdf$/i, '.pdf');

  // 2. Remove trailing extension for display title
  clean = clean.replace(/\.(pdf|docx|doc|txt|epub)$/i, '');

  // 3. Clean up export artifacts like "(finale)", "(1)", "(copy)", "v1", etc.
  clean = clean.replace(/\(finale\)/gi, ' (Final)');
  clean = clean.replace(/\.docx/gi, '');
  clean = clean.replace(/_\(\d+\)/g, '');
  clean = clean.replace(/\(\d+\)/g, '');

  // 4. Replace underscores and hyphens with spaces
  clean = clean.replace(/[_-]+/g, ' ');

  // 5. Clean up multiple spaces
  clean = clean.replace(/\s{2,}/g, ' ').trim();

  // 6. Capitalize nicely if all lowercase
  if (clean === clean.toLowerCase()) {
    clean = clean
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return clean || fileName;
}

export function getDocumentFileType(fileName = '') {
  if (!fileName) return 'PDF';
  const lower = fileName.toLowerCase();

  if (lower.includes('.docx') || lower.endsWith('.doc')) {
    return 'DOCX';
  }
  if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) {
    return 'PPTX';
  }
  if (lower.endsWith('.txt')) {
    return 'TXT';
  }
  return 'PDF';
}

export function formatFileSize(bytes = 0) {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  if (bytes < k) return bytes + ' B';
  if (bytes < k * k) return (bytes / k).toFixed(1) + ' KB';
  return (bytes / (k * k)).toFixed(2) + ' MB';
}
