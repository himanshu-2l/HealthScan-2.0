import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface UsePWAInstallReturn {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  promptInstall: () => Promise<boolean>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Detect iOS
  const isIOS = typeof window !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent) && 
    !(window as any).MSStream;

  // Detect Standalone (already running as installed PWA)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(isStandalone);
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Check Chrome / Edge getInstalledRelatedApps API if available
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((relatedApps: any[]) => {
        if (relatedApps && relatedApps.length > 0) {
          setIsInstalled(true);
          try {
            localStorage.setItem('healthscan_pwa_installed', 'true');
          } catch {}
        }
      }).catch(() => {});
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isStandalone) {
        setIsInstalled(false);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          setIsModalOpen(false);
          return true;
        }
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    }
    // If no native prompt (iOS or already prompted/denied), open instructions modal
    setIsModalOpen(true);
    return false;
  }, [deferredPrompt]);

  return {
    canInstall: !isInstalled && !isStandalone,
    isInstalled: isInstalled || isStandalone,
    isIOS,
    isStandalone,
    promptInstall,
    isModalOpen,
    setIsModalOpen,
  };
}
