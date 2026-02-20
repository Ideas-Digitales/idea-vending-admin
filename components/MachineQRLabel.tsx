'use client';

import { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer } from 'lucide-react';
import type { Machine } from '@/lib/interfaces/machine.interface';

interface MachineQRLabelProps {
  machine: Machine;
  onClose: () => void;
}

export default function MachineQRLabel({ machine, onClose }: MachineQRLabelProps) {
  // Encode machine ID — compatible with QRScannerModal parser
  const qrValue = String(machine.id);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handlePrint = () => {
    const printStyle = document.createElement('style');
    printStyle.id = 'machine-qr-print-style';
    printStyle.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #machine-qr-print-label,
        #machine-qr-print-label * { visibility: visible !important; }
        #machine-qr-print-label {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: none !important;
          border-radius: 0 !important;
          background: white !important;
        }
      }
    `;
    document.head.appendChild(printStyle);

    const cleanup = () => {
      const el = document.getElementById('machine-qr-print-style');
      if (el) document.head.removeChild(el);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    window.print();
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
                }}
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

                  {/* ID badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#eff2fb',
                      color: '#3157b2',
                      fontWeight: '600',
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      border: '1px solid #d4ddf5',
                    }}
                  >
                    ID #{machine.id}
                  </div>
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
          <button onClick={onClose} className="btn-secondary text-sm px-3 py-1.5">
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-1.5 text-sm px-3 py-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir etiqueta
          </button>
        </div>
      </div>
    </div>
  );
}
