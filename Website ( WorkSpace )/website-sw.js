const isLocalDevHost = ['localhost', '127.0.0.1'].includes(globalThis.location.hostname);

if ('serviceWorker' in navigator && !isLocalDevHost) {
  globalThis.addEventListener('load', () => {
    let hasRefreshedForUpdate = false;

    navigator.serviceWorker
      .register('sw.js')
      .then((registration) => {
        registration.update().catch(() => {});

        if (registration.waiting) {
          registration.waiting.postMessage('skipWaiting');
        }

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage('skipWaiting');
            }
          });
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (hasRefreshedForUpdate) return;
          hasRefreshedForUpdate = true;
          globalThis.location.reload();
        });
      })
      .catch(() => {});
  });
} else if ('serviceWorker' in navigator && isLocalDevHost) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) =>
        registration.unregister().catch(() => {})
      );
    })
    .catch(() => {});
}