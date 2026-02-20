'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, QrCode, AlertCircle, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCANNER_ELEMENT_ID = 'qr-scanner-reader';

function parseMachineId(text: string): string | null {
  const urlMatch = text.match(/\/maquinas\/(\d+)/);
  if (urlMatch) return urlMatch[1];
  if (/^\d+$/.test(text.trim())) return text.trim();
  return null;
}

export default function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const router = useRouter();
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanAttemptKey, setScanAttemptKey] = useState(0);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
  }, []);

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      await stopScanner();
      const machineId = parseMachineId(decodedText);
      if (machineId) {
        onClose();
        router.push(`/maquinas/${machineId}`);
      } else {
        setStatus('error');
        setErrorMsg(`QR no reconocido: "${decodedText}". Asegúrate de escanear el QR de una máquina.`);
      }
    },
    [router, onClose, stopScanner]
  );

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setStatus('starting');
      setErrorMsg(null);
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      setStatus('starting');
      setErrorMsg(null);

      // Wait for Dialog to render the DOM element
      await new Promise((r) => setTimeout(r, 350));
      if (cancelled) return;

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          handleScanSuccess,
          () => {} // per-frame error: ignore
        );

        if (!cancelled) setStatus('scanning');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
          setErrorMsg('Permiso de cámara denegado. Habilítalo en la configuración del navegador.');
        } else {
          setErrorMsg('No se pudo acceder a la cámara. Verifica que no esté en uso por otra aplicación.');
        }
        setStatus('error');
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [isOpen, scanAttemptKey, handleScanSuccess, stopScanner]);

  const handleRetry = () => {
    setStatus('starting');
    setErrorMsg(null);
    setScanAttemptKey((k) => k + 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-dark">
            <QrCode className="h-5 w-5 text-primary" />
            Escanear QR de Máquina
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner container */}
          <div className="relative rounded-xl overflow-hidden bg-gray-900 min-h-[280px] flex items-center justify-center">
            <div id={SCANNER_ELEMENT_ID} className="w-full" />

            {status === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-xl">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <Camera className="h-7 w-7 text-white animate-pulse" />
                </div>
                <p className="text-sm text-white/70">Iniciando cámara...</p>
              </div>
            )}

            {status === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner markers */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px]">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-md" />
                  {/* Scan line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/80 animate-[scan-line_2s_ease-in-out_infinite]" />
                </div>
              </div>
            )}
          </div>

          {/* Error state */}
          {status === 'error' && errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-700">{errorMsg}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}

          {status === 'scanning' && (
            <p className="text-xs text-center text-muted">
              Apunta la cámara al código QR de la máquina
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
