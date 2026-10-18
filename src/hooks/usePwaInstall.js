import { useState, useEffect } from 'react';

// React 마운트 전에 발생하는 beforeinstallprompt 이벤트도 놓치지 않도록 모듈 로드 시점에 캡처
let deferredPromptGlobal = null;
const listeners = new Set();

const notify = () => {
  listeners.forEach((fn) => fn());
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPromptGlobal = e;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPromptGlobal = null;
    notify();
  });
}

const checkStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true
  );
};

export default function usePwaInstall() {
  const [canPrompt, setCanPrompt] = useState(() => Boolean(deferredPromptGlobal));
  const [isInstalled, setIsInstalled] = useState(() => checkStandalone());

  useEffect(() => {
    const update = () => {
      setCanPrompt(Boolean(deferredPromptGlobal));
      setIsInstalled(checkStandalone());
    };
    listeners.add(update);

    const mql = window.matchMedia && window.matchMedia('(display-mode: standalone)');
    if (mql && mql.addEventListener) {
      mql.addEventListener('change', update);
    }
    return () => {
      listeners.delete(update);
      if (mql && mql.removeEventListener) {
        mql.removeEventListener('change', update);
      }
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPromptGlobal) return 'unavailable';
    try {
      deferredPromptGlobal.prompt();
      const choice = await deferredPromptGlobal.userChoice;
      if (choice && choice.outcome === 'accepted') {
        deferredPromptGlobal = null;
        notify();
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
