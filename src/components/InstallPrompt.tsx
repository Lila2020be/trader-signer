import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Share, ExternalLink, Info, Monitor, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export const InstallPrompt = () => {
  const [isReadyForInstall, setIsReadyForInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [inAppAppName, setInAppAppName] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already installed / standalone
    const isStandAloneMatch = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    setIsStandalone(isStandAloneMatch);

    if (isStandAloneMatch) return;

    // Detect In-App Browsers (Instagram, FB, WhatsApp, etc.)
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isInstagram = /Instagram/i.test(ua);
    const isFacebook = /FBAN|FBAV/i.test(ua);
    const isWhatsApp = /WhatsApp/i.test(ua);
    const isTikTok = /TikTok/i.test(ua);
    const isMessenger = /Messenger/i.test(ua);
    const isGenericInApp = /WebView|wv|iPh.*AppleWebKit(?!.*Safari)/i.test(ua);

    const isInApp = isInstagram || isFacebook || isWhatsApp || isTikTok || isMessenger || isGenericInApp;
    setIsInAppBrowser(isInApp);

    if (isInstagram) setInAppAppName('Instagram');
    else if (isFacebook) setInAppAppName('Facebook');
    else if (isWhatsApp) setInAppAppName('WhatsApp');
    else if (isTikTok) setInAppAppName('TikTok');
    else if (isMessenger) setInAppAppName('Messenger');
    else if (isInApp) setInAppAppName('Navegador Interno');

    // Check if iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check localStorage dismissal
    const dismissedUntil = localStorage.getItem('pwa-prompt-dismissed-until');
    const isDismissed = dismissedUntil && new Date().getTime() < parseInt(dismissedUntil, 10);

    if (isDismissed) {
      return;
    }

    // Handle BeforeInstallPrompt event for Android/PC
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReadyForInstall(true);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS or In-App Browser, show prompt since they don't fire beforeinstallprompt
    if ((isIosDevice || isInApp) && !isStandAloneMatch) {
      // Small timeout to allow page layout to settle
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Dismiss prompt for 3 days to avoid annoying the user
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const expiryTime = new Date().getTime() + threeDays;
    localStorage.setItem('pwa-prompt-dismissed-until', expiryTime.toString());
  };

  const downloadApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('Obrigado por instalar nosso aplicativo!');
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !isVisible) return null;

  // 1. Prompt UI for In-App Browser (WhatsApp, Instagram, etc.)
  if (isInAppBrowser) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[420px] bg-slate-950/90 backdrop-blur-xl border border-yellow-500/30 p-5 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-8 duration-300">
        <div className="relative">
          <button 
            onClick={handleDismiss} 
            className="absolute -top-1 -right-1 p-1 text-slate-400 hover:text-white rounded-full bg-slate-900/80 border border-slate-800 transition-colors"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20 text-yellow-500">
              <Info className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-white text-sm">Detectamos que você está no {inAppAppName}</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Navegadores internos de redes sociais não permitem instalar aplicativos. Para usar todas as funções e poder instalar na tela inicial:
              </p>
              
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/50 mt-1">
                <ol className="text-xs text-slate-400 space-y-1.5 list-decimal pl-4">
                  <li>
                    Toque nos <span className="text-white font-medium">três pontinhos (⋮ ou •••)</span> no canto superior ou no ícone de <span className="text-white font-medium">Compartilhar</span> no rodapé.
                  </li>
                  <li>
                    Selecione <span className="text-blue-400 font-medium">"Abrir no Chrome"</span> ou <span className="text-blue-400 font-medium">"Abrir no Safari"</span>.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Prompt UI for iOS (Safari)
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] bg-slate-950/90 backdrop-blur-xl border border-indigo-500/20 p-5 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-8 duration-300">
        <div className="relative">
          <button 
            onClick={handleDismiss} 
            className="absolute -top-1 -right-1 p-1 text-slate-400 hover:text-white rounded-full bg-slate-900/80 border border-slate-800 transition-colors"
            aria-label="Fechar instrução"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex gap-4">
            <img src="/pwa-192x192.png" alt="App Logo" className="w-12 h-12 rounded-xl shadow-lg border border-indigo-500/20 shrink-0" />
            <div className="flex flex-col gap-2">
              <div>
                <span className="font-semibold text-white text-sm block">Instalar TradingSignals no iOS</span>
                <span className="text-[10px] text-indigo-400 font-mono tracking-wider">PROGRESSIVE WEB APP</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Adicione o aplicativo à sua tela inicial para obter acesso rápido, tela cheia e melhor desempenho:
              </p>
              
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/50 mt-1">
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Share className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span>Toque no botão <span className="text-white font-medium">Compartilhar</span> (ícone no rodapé ou topo do Safari).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-white font-bold text-[10px]">
                      +
                    </div>
                    <span>Role para baixo e toque em <span className="text-white font-medium">"Adicionar à Tela de Início"</span>.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Prompt UI for Android / Chrome / Edge / PC (beforeinstallprompt is available)
  if (isReadyForInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[420px] bg-slate-950/90 backdrop-blur-xl border border-indigo-500/30 p-5 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-8 duration-300">
        <div className="relative">
          <button 
            onClick={handleDismiss} 
            className="absolute -top-1 -right-1 p-1 text-slate-400 hover:text-white rounded-full bg-slate-900/80 border border-slate-800 transition-colors"
            aria-label="Ignorar instalação"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex gap-4 items-start">
            <img src="/pwa-192x192.png" alt="App Logo" className="w-12 h-12 rounded-xl shadow-lg border border-indigo-500/20 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div>
                <span className="font-semibold text-white text-sm block">Instalar TradingSignals</span>
                <span className="text-[10px] text-indigo-400 font-mono tracking-wider">APLICATIVO OFICIAL</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Instale em seu dispositivo para receber sinais em tempo real com menor latência, modo tela cheia e suporte offline.
              </p>
              
              <div className="flex gap-2 mt-2">
                <Button 
                  onClick={downloadApp} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl px-4 py-2 h-9 flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all flex-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Instalar Agora
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDismiss}
                  className="border-slate-800 hover:bg-slate-900 text-slate-300 text-xs rounded-xl h-9"
                >
                  Mais Tarde
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
