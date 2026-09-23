import React from 'react';
import { createPortal } from 'react-dom';
import { 
  Download, 
  X, 
  Smartphone, 
  CheckCircle2, 
  Share, 
  PlusSquare, 
  ShieldCheck, 
  Zap, 
  WifiOff, 
  ArrowRight,
  Laptop
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
  isIOS: boolean;
  isInstalled: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isIOS,
  isInstalled,
}) => {
  const [manualGuideVisible, setManualGuideVisible] = React.useState(false);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0F1523] border border-slate-200/90 dark:border-white/[0.08] shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-white overflow-hidden my-auto max-h-[92vh] overflow-y-auto transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/[0.08] p-1 bg-slate-100 dark:bg-[#070A11] flex items-center justify-center">
            <img src="/pwa-icon.svg" alt="HealthScan Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">HealthScan</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Clinical AI Screening & Digital Health Passport</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ABDM Compliant • 100% Privacy</span>
            </div>
          </div>
        </div>

        {/* PWA Phone Mockup Hero Visual */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-white/[0.08] mb-5 shadow-sm group">
          <img 
            src="/images/pwa-mockup.jpg" 
            alt="HealthScan PWA Mobile Experience" 
            className="w-full h-44 sm:h-48 object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none flex items-end p-3.5">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-white/90">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-semibold tracking-wide">Standalone 60 FPS Engine</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-white border border-white/20 font-semibold">
                iOS & Android
              </span>
            </div>
          </div>
        </div>

        {/* Status: Already installed */}
        {isInstalled ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center space-y-2 mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <div className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Application Already Installed</div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              HealthScan is installed as a native web app on this device. You can open it directly from your home screen, dock, or app drawer.
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Safari Specific Step-by-Step Guide */
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08]">
              <div className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider mb-2">
                How to install on iPhone & iPad
              </div>
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div className="flex-1 pt-0.5">
                    Tap the <span className="font-semibold text-slate-900 dark:text-white">Share</span> button in Safari's bottom toolbar:
                    <div className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-medium">
                      <Share className="w-3 h-3 text-teal-600 dark:text-teal-300" /> Share
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div className="flex-1 pt-0.5">
                    Scroll down and tap <span className="font-semibold text-slate-900 dark:text-white">"Add to Home Screen"</span>:
                    <div className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-medium">
                      <PlusSquare className="w-3 h-3 text-teal-600 dark:text-teal-300" /> Add to Home Screen
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <div className="flex-1 pt-0.5">
                    Tap <span className="font-semibold text-slate-900 dark:text-white">"Add"</span> in the top-right corner to finish!
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Chrome / Edge Instructions & Trigger */
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] text-center shadow-sm">
                  <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-slate-900 dark:text-white">Zero Download</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">Installs in &lt;1s</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] text-center shadow-sm">
                  <WifiOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-slate-900 dark:text-white">Offline Ready</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">ABDM Passport</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] text-center shadow-sm">
                  <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                  <div className="text-[10px] font-bold text-slate-900 dark:text-white">Full Screen</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">Camera Vitals</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed">
                Click below to install directly to your device without downloading from Google Play or App Store.
              </p>
            </div>

            {manualGuideVisible && (
              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/25 space-y-3">
                <div className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  How to install in Chrome / Android / Edge:
                </div>
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </div>
                    <div className="flex-1 pt-0.5">
                      Tap the <span className="font-semibold text-slate-900 dark:text-white">three dots menu (⋮)</span> in the top-right corner of your browser.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </div>
                    <div className="flex-1 pt-0.5">
                      Select <span className="font-semibold text-slate-900 dark:text-white">"Install app"</span> or <span className="font-semibold text-slate-900 dark:text-white">"Add to Home screen"</span>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </div>
                    <div className="flex-1 pt-0.5">
                      Tap <span className="font-semibold text-slate-900 dark:text-white">"Install"</span> to confirm!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-2">
          {!isInstalled && !isIOS && (
            <button
              onClick={async () => {
                const res = await onInstall();
                if (res) {
                  onClose();
                } else {
                  setManualGuideVisible(true);
                }
              }}
              className="w-full py-3.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm tracking-wide shadow-sm hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{manualGuideVisible ? "Try Instant Install Again" : "Download & Install App"}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-white/[0.06] transition-colors"
          >
            {isInstalled || isIOS ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
