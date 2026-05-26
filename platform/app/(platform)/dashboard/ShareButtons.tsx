'use client';

import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Check, QrCode, X, Download } from 'lucide-react';

type Props = { url: string; slug: string };

export function ShareButtons({ url, slug }: Props) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const canvas = canvasRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${slug}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <>
      <button onClick={handleCopy} className="button" style={{ fontSize: 14, minHeight: 38, padding: '0 14px' }}>
        {copied ? <Check size={15} color="var(--green)" /> : <Copy size={15} />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <button onClick={() => setShowQR(true)} className="button" style={{ fontSize: 14, minHeight: 38, padding: '0 14px' }}>
        <QrCode size={15} /> QR code
      </button>

      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Your booking QR code</h3>
              <button className="modal-close" onClick={() => setShowQR(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="modal-body-text">
              Share this with clients — they&apos;ll land straight on your booking page.
            </p>
            <div className="qr-canvas-wrap" ref={canvasRef}>
              <QRCodeCanvas value={url} size={200} marginSize={2} />
            </div>
            <p className="modal-url-label">{url}</p>
            <button onClick={handleDownload} className="button button-primary modal-download-btn">
              <Download size={15} /> Download PNG
            </button>
          </div>
        </div>
      )}
    </>
  );
}
