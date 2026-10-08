'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'install-dismissed';

// Shows an "Install app" card on phones. Android/Chrome: one-tap install.
// iPhone/iPad: Safari has no install button, so we show the Add to Home Screen steps.
export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(true); // true until we know otherwise (avoids a flash)
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setInstalled(standalone);
    const ua = navigator.userAgent;
    setIsIos(/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || dismissed || (!installEvent && !isIos)) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
  };

  const install = async () => {
    installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    setInstallEvent(null);
  };

  return (
    <div className="install-card" role="region" aria-label="Install app">
      <img src="/icons/icon-192.png" alt="" width="44" height="44" className="install-icon" />
      <div className="install-text">
        <strong>Install on your phone</strong>
        {installEvent ? (
          <span>Open it like an app from your home screen, even without internet.</span>
        ) : (
          <span>
            In Safari tap <b>Share</b> (square with arrow), then <b>Add to Home Screen</b>.
          </span>
        )}
      </div>
      <div className="install-actions">
        {installEvent && (
          <button className="btn btn-primary" onClick={install}>
            Install
          </button>
        )}
        <button className="btn btn-ghost" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
