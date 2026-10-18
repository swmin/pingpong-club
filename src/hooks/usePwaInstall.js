import { useState, useEffect } from 'react';

const getPrompt = () => (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null);

const checkStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true
  );
};

export default function usePwaInstall() {
  const [canPrompt, setCanPrompt] = useState(() => Boolean(getPrompt()));
  const [isInstalled, setIsInstalled] = useState(() => checkStandalone());

  useEffect(() => {
    const update = () => {
      setCanPrompt(Boolean(getPrompt()));
      setIsInstalled(checkStandalone());
    };
    update();

    const onBeforeInstall = (e) => {
      e.preventDefault();
      window.__deferredPwaPrompt = e;
      update();
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', update);
    window.addEventListener('pwa-prompt-ready', update);

    const mql = window.matchMedia && window.matchMedia('(display-mode: standalone)');
    if (mql && mql.addEventListener) {
      mql.addEventListener('change', update);
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', update);
      window.removeEventListener('pwa-prompt-ready', update);
      if (mql && mql.removeEventListener) {
        mql.removeEventListener('change', update);
      }
    };
  }, []);

  const triggerInstall = async () => {
    const promptEvent = getPrompt();
    if (!promptEvent) return 'unavailable';
    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        window.__deferredPwaPrompt = null;
        window.dispatchEvent(new Event('pwa-prompt-ready'));
        return 'accepted';
      }
      return 'dismissed';
    } catch (e) {
      console.warn('PWA install prompt error:', e);
      return 'error';
    }
  };

  return {
    canPrompt,
    isInstalled,
    triggerInstall,
  };
}
