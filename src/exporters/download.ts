export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function safeFilename(text: string) {
  const normalized = text
    .trim()
    .replace(/[\\/:*?"<>|]/gu, '')
    .replace(/\s+/gu, '-')
    .slice(0, 24);
  return normalized || 'flash-words';
}
