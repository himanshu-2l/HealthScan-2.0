import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  ShieldCheck, 
  Sparkles,
  Camera,
  Wifi,
  Globe
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
  // Modes: 'live' (Production Vercel URL) or 'wifi' (Local LAN IP)
  const [mode, setMode] = useState<'live' | 'wifi'>('live');
  const [url, setUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Defaults
  const PRODUCTION_URL = 'https://health-scan-2-0-azure.vercel.app';
  const LOCAL_WIFI_IP = '192.168.29.148';
  const DEFAULT_PORT = '5174';

  // Compute active URL based on mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (customUrl) {
      setUrl(customUrl);
      return;
    }

    if (mode === 'wifi') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const wifiHost = isLocalhost ? LOCAL_WIFI_IP : window.location.hostname;
      const port = window.location.port || DEFAULT_PORT;
      setUrl(`http://${wifiHost}:${port}`);
    } else {
      // Live production mode
      const liveOrigin = window.location.origin.includes('vercel.app') 
        ? window.location.origin 
        : PRODUCTION_URL;
      setUrl(liveOrigin);
    }
  }, [mode, customUrl, isOpen]);

  // Generate QR Code whenever URL changes
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
  if (typeof document === 'undefined') return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0F1523] rounded-3xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xl p-5 sm:p-7 space-y-4 sm:space-y-5 z-10 my-auto transition-all transform animate-scale-up max-h-[92vh] overflow-y-auto">
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
            <span>Mobile Live Testing</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Test on Your Phone
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
            Scan the QR code with your iPhone or Android camera to run HealthScan live on your device.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-xs font-semibold">
          <button
            onClick={() => setMode('live')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              mode === 'live'
                ? 'bg-white dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200/80 dark:border-teal-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Live Vercel (HTTPS)</span>
          </button>
          <button
            onClick={() => setMode('wifi')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              mode === 'wifi'
                ? 'bg-white dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200/80 dark:border-teal-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Local Network</span>
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative p-3.5 bg-white rounded-2xl border-2 border-slate-200/80 shadow-md">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="HealthScan Live Mobile QR Code"
                className="w-52 h-52 sm:w-56 sm:h-56 rounded-xl object-contain"
              />
            ) : (
              <div className="w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center bg-slate-50 rounded-xl text-xs text-slate-400 font-mono">
                Generating QR Code...
              </div>
            )}
            
            {/* Center Logo Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-xl bg-teal-600 border-2 border-white shadow-md flex items-center justify-center text-white font-black text-xs">
                HS
              </div>
            </div>
          </div>
        </div>

        {/* URL Box & One-Click Copy */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.06] text-xs">
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={mode === 'live' ? PRODUCTION_URL : 'http://192.168.x.x:5174'}
              className="flex-1 bg-transparent text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-none truncate px-1"
              title="Target test URL"
            />
            <button
              onClick={handleCopyUrl}
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

          {/* Mode-specific guidance */}
          {mode === 'live' ? (
            <div className="p-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/30 text-[11px] text-teal-800 dark:text-teal-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-teal-900 dark:text-teal-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Production Vercel Deployment</span>
              </div>
              <p className="leading-relaxed text-teal-700/90 dark:text-teal-400/90">
                Permanent HTTPS enabled. Perfect for mobile camera PPG, mic permissions, and installable PWA testing.
              </p>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Local Wi-Fi Note:
              </span>
              <p className="leading-relaxed">
                Ensure phone and PC are connected to the same Wi-Fi. For mobile camera sensors, HTTPS (Live Vercel) is recommended.
              </p>
            </div>
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
    </div>,
    document.body
  );
};
