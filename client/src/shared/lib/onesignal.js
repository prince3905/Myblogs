/**
 * OneSignal Web Push Notification Service for Digital Home Blog
 * 100% Non-Blocking, Deferred Human-Triggered Loader
 */

let isInitialized = false;

export function initOneSignal() {
  if (typeof window === 'undefined' || isInitialized) return;
  
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID || window.ONESIGNAL_APP_ID || '1be67f5d-ed1b-4f97-acf8-2f711447cc10';
  if (!appId) return;

  isInitialized = true;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: appId,
      safari_web_id: window.ONESIGNAL_SAFARI_WEB_ID,
      notifyButton: {
        enable: true,
        size: 'medium',
        position: 'bottom-left',
        showCredit: false,
        theme: 'inverse',
        text: {
          'tip.state.unsubscribed': 'Get Free Sarkari Job Alerts on Mobile 🔔',
          'tip.state.subscribed': 'You are receiving Sarkari Alerts 🚀',
          'tip.state.blocked': 'You have blocked notifications',
          'message.action.subscribed': 'Thanks for subscribing! 🎉',
          'message.action.resubscribed': 'You are subscribed to alerts',
          'message.action.unsubscribed': 'You will not receive alerts',
          'dialog.main.title': 'Digital Home - Sarkari Job Alerts',
          'dialog.main.button.subscribe': 'SUBSCRIBE NOW 🔔',
          'dialog.main.button.unsubscribe': 'UNSUBSCRIBE'
        }
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
