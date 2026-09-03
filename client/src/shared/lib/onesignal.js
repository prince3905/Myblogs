/**
 * OneSignal Web Push Notification Service for Digital Home Blog
 * 100% Non-Blocking, Deferred Human-Triggered Loader
 */

let isInitialized = false;

export function initOneSignal() {
  if (typeof window === 'undefined' || isInitialized) return;
  
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID || window.ONESIGNAL_APP_ID;
  if (!appId || appId.startsWith('11111111')) {
    return;
  }

  isInitialized = true;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: appId,
      safari_web_id: window.ONESIGNAL_SAFARI_WEB_ID,
      notifyButton: {
        enable: false,
      },
      allowLocalhostAsSecureOrigin: true,
    });
  });

  const script = document.createElement('script');
  script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
  script.defer = true;
  script.async = true;
  document.head.appendChild(script);
}

export function promptPushNotification() {
  if (typeof window !== 'undefined' && window.OneSignalDeferred) {
    window.OneSignalDeferred.push(async function(OneSignal) {
      if (OneSignal.Slidedown) {
        OneSignal.Slidedown.promptPush();
      }
    });
  }
}
