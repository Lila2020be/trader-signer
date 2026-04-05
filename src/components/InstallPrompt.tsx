import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

export const InstallPrompt = () => {
  const [isReadyForInstall, setIsReadyForInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check if already installed
    const isStandAloneMatch = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandAloneMatch);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReadyForInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const downloadApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        setIsReadyForInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone) return null;

  if (isReadyForInstall) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-700 p-4 shadow-lg z-50 flex items-center justify-between text-white animate-in slide-in-from-bottom-8">
        <div className="flex items-center gap-4">
          <img src="/pwa-192x192.png" alt="Logo" className="w-12 h-12 rounded-xl shadow-md" />
          <div className="flex flex-col">
            <span className="font-semibold text-base">Instalar o App</span>
            <span className="text-xs text-slate-300">Adicione à tela inicial para acesso rápido e offline</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={downloadApp} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-9">
            <Download className="w-4 h-4 mr-2" />
            Obter
          </Button>
          <button onClick={() => setIsReadyForInstall(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-700 p-4 shadow-lg z-50 animate-in slide-in-from-bottom-8">
        <div className="relative">
          <button onClick={() => setIsIOS(false)} className="absolute -top-1 -right-1 p-1 text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
          </button>
          <div className="flex flex-col items-center text-center gap-2 mt-2">
             <span className="text-sm text-slate-300">Instale este app no seu iOS:</span>
             <span className="text-sm font-medium text-white flex items-center justify-center flex-wrap gap-1 leading-snug">
               Aperte em Compartilhar e depois "Adicionar à Tela de Início".
             </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
