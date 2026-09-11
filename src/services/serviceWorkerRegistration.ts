// Service Worker Registration and Background Sync Manager

export function registerServiceWorker(onSyncTriggered?: () => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[ServiceWorker] Service Workers not supported in this browser.');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[ServiceWorker] Registered successfully with scope:', registration.scope);

        // Check for updates periodically
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[ServiceWorker] New content available; please refresh.');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[ServiceWorker] Registration failed:', error);
      });

    // Listen for messages from the service worker (e.g. background sync triggers)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CAFEOS_TRIGGER_BACKGROUND_SYNC') {
        console.log('[ServiceWorker] Received background sync trigger from SW:', event.data);
        if (onSyncTriggered) {
          onSyncTriggered();
        }
      }
    });
  });
}

/**
 * Requests the browser to register a Background Sync event (W3C Background Sync API)
 */
export async function requestBackgroundSync(tag = 'cafeos-sync-queue'): Promise<boolean> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-expect-error - Background Sync API
      if (registration.sync) {
        // @ts-expect-error - Background Sync API
        await registration.sync.register(tag);
        console.log(`[ServiceWorker] Registered background sync tag: "${tag}"`);
        return true;
      }
    } catch (err) {
      console.warn('[ServiceWorker] Background Sync registration failed:', err);
    }
  }
  return false;
}
