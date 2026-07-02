import React, { useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeSettingsProps {
  isActive: boolean;
  showToast: (message: string, type: 'success' | 'error') => void;
}

import { BUILDINGS, getBuildingLabel } from '@/lib/constants/buildings';

export default function QRCodeSettings({ isActive, showToast }: QRCodeSettingsProps) {
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  const generateQR = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const params = new URLSearchParams();
    if (selectedBuilding) params.set('building', selectedBuilding);
    if (roomInput.trim()) params.set('room', roomInput.trim());
    const query = params.toString();
    const url = `${baseUrl}/scan${query ? '?' + query : ''}`;
    
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: '#1E3A8A', light: '#FFFFFF' }
      });
      setQrDataUrl(dataUrl);
      setQrUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    
    // Draw rounded rectangle
    const x = 20, y = 20, w = 560, h = 760, r = 24;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.stroke();

    // Draw Title
    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 48px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FixTrack', canvas.width / 2, 100);

    // Draw Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    
    // Draw subtitle with letter-spacing manually
    const subtitle = 'MAINTENANCE REQUEST SYSTEM';
    const letterSpacing = 3;
    ctx.textAlign = 'left';
    const textWidth = ctx.measureText(subtitle).width + (subtitle.length * letterSpacing);
    let currentX = (canvas.width / 2) - (textWidth / 2);
    
    for (let i = 0; i < subtitle.length; i++) {
      ctx.fillText(subtitle[i], currentX, 134);
      currentX += ctx.measureText(subtitle[i]).width + letterSpacing;
    }

    // Load QR Code and Draw
    const img = new Image();
    img.src = qrDataUrl;
    img.onload = () => {
      const qrSize = 440;
      ctx.drawImage(img, (canvas.width - qrSize) / 2, 160, qrSize, qrSize);

      // Draw Instruction
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Scan to Report a Maintenance Issue', canvas.width / 2, 660);

      // Draw Location
      const buildingText = [getBuildingLabel(selectedBuilding), roomInput].filter(Boolean).join(' - ');
      if (buildingText) {
        ctx.fillStyle = '#64748b';
        ctx.font = '20px Inter, system-ui, sans-serif';
        ctx.fillText(buildingText, canvas.width / 2, 700);
      }

      // Trigger download
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      const label = [getBuildingLabel(selectedBuilding), roomInput].filter(Boolean).join('-') || 'General';
      a.download = `FixTrack-QR-Card-${label}-${Date.now()}.png`;
      a.click();
    };
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (!printWindow) return;
    
    const buildingText = [getBuildingLabel(selectedBuilding), roomInput].filter(Boolean).join(' - ');
    const qrImg = `<img src="${qrDataUrl}" style="width: 100%; max-width: 400px; object-fit: contain;" />`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background-color: white;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              border: 2px solid #cbd5e1;
              border-radius: 16px;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              width: 100%;
              max-width: 500px;
            }
            .title {
              color: #1E3A8A;
              font-size: 32px;
              font-weight: 800;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .subtitle {
              color: #64748b;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-top: 4px;
              margin-bottom: 30px;
            }
            .qr-container {
              width: 100%;
              display: flex;
              justify-content: center;
              margin-bottom: 30px;
            }
            .instruction {
              font-size: 20px;
              font-weight: 700;
              color: #0f172a;
              margin: 0;
            }
            .location {
              font-size: 16px;
              color: #64748b;
              margin-top: 8px;
              margin-bottom: 0;
            }
            @page {
              size: portrait;
              margin: 20mm;
            }
            @media print {
              body {
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                margin: 0;
              }
              .card {
                border: 2px solid #cbd5e1 !important;
                margin: 0 auto;
                max-width: 450px;
                width: 100%;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div>
              <h3 class="title">FixTrack</h3>
              <p class="subtitle">Maintenance Request System</p>
            </div>
            <div class="qr-container">
              ${qrImg}
            </div>
            <div>
              <p class="instruction">Scan to Report a Maintenance Issue</p>
              ${buildingText ? `<p class="location">${buildingText}</p>` : ''}
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyToClipboard = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    showToast('QR Code URL copied to clipboard!', 'success');
  };

  return (
    <div
      id="qr_code"
      className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 overflow-hidden print-only print:border-0"
    >
      <div className={`h-[3px] w-full ${isActive ? 'bg-secondary opacity-80' : 'bg-transparent'} no-print`} />
      <div className="p-8">
        <div className="mb-6 no-print">
          <h2 className="font-h2 text-h2 text-on-surface">QR Code Generator</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Generate QR codes to post in facility areas. Students scan to report issues instantly.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* LEFT SIDE — Configuration */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6 no-print">
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface block">Building (optional)</label>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 focus:outline-none focus:border-primary text-on-surface"
              >
                <option value="">All Buildings (default)</option>
                {BUILDINGS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface block">Room / Area (optional)</label>
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="e.g. Room 304, Lab 2, Hallway"
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface block">QR Code URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={qrUrl || (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') + '/scan'}
                  className="flex-1 bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface-variant font-body-sm"
                />
                <button
                  onClick={copyToClipboard}
                  disabled={!qrUrl}
                  className="bg-surface border border-outline-variant rounded-lg px-4 flex items-center justify-center hover:bg-surface-container-low disabled:opacity-50"
                  title="Copy URL"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">content_copy</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-2">
              <button
                onClick={generateQR}
                className="bg-secondary text-on-secondary px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-secondary/90 transition-colors"
              >
                <span className="material-symbols-outlined">qr_code</span>
                Generate QR Code
              </button>
              
              {qrDataUrl && (
                <>
                  <button
                    onClick={handleDownload}
                    className="bg-surface border border-outline-variant text-on-surface px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined">download</span>
                    Download PNG
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-surface border border-outline-variant text-on-surface px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined">print</span>
                    Print QR
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RIGHT SIDE — QR Preview Card */}
          <div className="col-span-12 lg:col-span-5 flex items-center justify-center print:col-span-12 print:w-full">
            <div className="bg-white rounded-xl border-2 border-outline-variant p-6 flex flex-col items-center gap-4 shadow-sm w-full max-w-sm print:max-w-md print:border-4 print:shadow-none">
              <div className="text-center">
                <h3 className="font-h1 text-h1 text-[#1E3A8A] tracking-tighter" style={{ fontSize: '1.5rem' }}>FixTrack</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-widest text-[10px]">
                  Maintenance Request System
                </p>
              </div>
              
              <div className="my-2 flex justify-center items-center h-[256px] w-[256px]">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Generated QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-[256px] h-[256px] border-4 border-dashed border-outline-variant flex items-center justify-center rounded-lg">
                    <span className="material-symbols-outlined text-outline text-[64px]" style={{ fontVariationSettings: "'FILL' 0" }}>qr_code</span>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="font-h2 text-[16px] text-on-surface font-bold">Scan to Report a Maintenance Issue</p>
                {(selectedBuilding || roomInput) && (
                  <p className="font-body-sm text-on-surface-variant mt-1">
                    {[getBuildingLabel(selectedBuilding), roomInput].filter(Boolean).join(' - ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
