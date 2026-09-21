import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  Sparkles,
  Camera
} from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customUrl?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  customUrl
}) => {
  const [url, setUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(customUrl || window.location.origin);
    }
  }, [customUrl, isOpen]);

  useEffect(() => {
    if (!url) return;

    QRCode.toDataURL(url, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0F172A', // Slate 900
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
      .then((dataUri) => setQrDataUrl(dataUri))
      .catch((err) => console.error('Failed to render QR Code:', err));
  }, [url]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0F1523] rounded-3xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6 z-10 transition-all transform animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          aria-label="Close QR Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 text-center pr-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs font-semibold mb-1">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Judge & Mobile Live Testing</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Test on Your Smartphone
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
            Scan with your iPhone or Android camera to experience HealthScan's 60 FPS vitals engine live.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative p-3.5 bg-white rounded-2xl border-2 border-slate-200/80 shadow-md">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="HealthScan Live Mobile QR Code"
                className="w-56 h-56 sm:w-60 sm:h-60 rounded-xl object-contain"
              />
            ) : (
              <div className="w-56 h-56 sm:w-60 sm:h-60 flex items-center justify-center bg-slate-50 rounded-xl text-xs text-slate-400 font-mono">
                Generating QR Code...
              </div>
            )}
            
            {/* Center Logo Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-11 h-11 rounded-xl bg-teal-600 border-2 border-white shadow-md flex items-center justify-center text-white font-black text-xs">
                HS
              </div>
            </div>
          </div>
        </div>

        {/* URL Box & One-Click Copy */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.06] text-xs">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-transparent text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-none truncate"
              title="Target test URL"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 active:scale-95 shadow-sm"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <span>Scan via standard Camera app</span>
            <button 
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
            >
              {isCustomizing ? 'Hide URL edit' : 'Need LAN / Custom URL?'}
            </button>
          </div>

          {isCustomizing && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 p-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] leading-relaxed">
              <strong>Demo Tip:</strong> When testing on local Wi-Fi, change <code className="font-mono text-teal-600 dark:text-teal-300">localhost</code> to your machine's local IP (e.g. <code className="font-mono">http://192.168.1.15:5174</code>) so your phone can reach it.
            </p>
          )}
        </div>

        {/* Feature Badges for Judges */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/80 dark:border-white/[0.06]">
          <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
            <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">Optical PPG</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400">Rear Camera</span>
          </div>
          <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">60 FPS Edge</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400">Zero Cloud Lag</span>
          </div>
          <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">ABDM Ready</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400">FHIR R4 JSON</span>
          </div>
        </div>
      </div>
    </div>
  );
};
