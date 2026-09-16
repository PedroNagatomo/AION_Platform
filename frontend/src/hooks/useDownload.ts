import { useCallback } from 'react';

export function useDownload() {
  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const downloadText = useCallback((text: string, filename: string, contentType: string = 'text/plain') => {
    const blob = new Blob([text], { type: contentType });
    downloadBlob(blob, filename);
  }, [downloadBlob]);

  return { downloadBlob, downloadText };
}