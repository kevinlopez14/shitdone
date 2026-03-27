let clipboardTimer: ReturnType<typeof setTimeout> | null = null;

export function copyToClipboard(
  text: string,
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void,
): void {
  navigator.clipboard.writeText(text).catch(() => {
    addToast('Error al copiar al portapapeles', 'error');
    return;
  });
  addToast('Copiado al portapapeles', 'success');

  if (clipboardTimer) clearTimeout(clipboardTimer);
  clipboardTimer = setTimeout(() => {
    navigator.clipboard.writeText('').catch(() => {/* ignore */});
    addToast('Portapapeles limpiado', 'info');
    clipboardTimer = null;
  }, 30_000);
}
