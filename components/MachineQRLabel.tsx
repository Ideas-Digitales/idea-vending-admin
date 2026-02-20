'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download } from 'lucide-react';
import type { Machine } from '@/lib/interfaces/machine.interface';

interface MachineQRLabelProps {
  machine: Machine;
  onClose: () => void;
}

export default function MachineQRLabel({ machine, onClose }: MachineQRLabelProps) {
  const [downloading, setDownloading] = useState(false);

  // Full URL so any QR reader (app o cámara) puede navegar directamente a la máquina
  const qrValue = typeof window !== 'undefined'
    ? `${window.location.origin}/maquinas/${machine.id}`
    : `/maquinas/${machine.id}`;

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleDownload = async () => {
    const el = document.getElementById('machine-qr-print-label');
    if (!el) return;
    setDownloading(true);
    try {
      // html-to-image usa foreignObject SVG — el browser renderiza el CSS
      // (incluido oklch) sin necesidad de parsearlo en JS
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(el, { pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `etiqueta-maquina-${machine.id}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs">
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-dark">Etiqueta QR · Máquina #{machine.id}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Label preview */}
        <div className="p-5">
          {/* This div is the actual printable label */}
          <div id="machine-qr-print-label">
            <div
              style={{
                width: '260px',
                margin: '0 auto',
                border: '1.5px solid #e5e7eb',
                borderRadius: '14px',
                overflow: 'hidden',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}
            >
              {/* Brand header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #3157b2 0%, #2347a0 100%)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                } as React.CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icon_ideavending.png"
                  alt="Ideas Digitales"
                  style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                />
                <div>
                  <div style={{ color: 'white', fontWeight: '700', fontSize: '13px', lineHeight: 1.2 }}>
                    Ideas Digitales
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', lineHeight: 1.4 }}>
                    Plataforma Vending
                  </div>
                </div>
              </div>

              {/* QR + info body */}
              <div
                style={{
                  background: 'white',
                  padding: '18px 16px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                {/* QR code */}
                <div
                  style={{
                    padding: '10px',
                    background: 'white',
                    borderRadius: '10px',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <QRCodeSVG
                    value={qrValue}
                    size={156}
                    bgColor="#ffffff"
                    fgColor="#1a1a2e"
                    level="M"
                  />
                </div>

                {/* Machine info */}
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '14px',
                      color: '#1a1a2e',
                      marginBottom: '3px',
                      lineHeight: 1.3,
                    }}
                  >
                    {machine.name}
                  </div>

                  {machine.location && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        marginBottom: '8px',
                        lineHeight: 1.4,
                      }}
                    >
                      {machine.location}
                    </div>
                  )}

                </div>

                {/* Scan hint */}
                <div
                  style={{
                    fontSize: '10px',
                    color: '#9ca3af',
                    textAlign: 'center',
                    lineHeight: 1.4,
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: '10px',
                    width: '100%',
                  }}
                >
                  Escanea con la app para ver el detalle
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary !py-2 !px-4">
            Cerrar
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary flex items-center gap-1.5 !py-2 !px-4 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Descargando…' : 'Descargar etiqueta'}
          </button>
        </div>
      </div>
    </div>
  );
}
