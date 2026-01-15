// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  const options = event.data ? event.data.json() : {};
  
  const title = options.title || 'Elite Finances';
  const notificationOptions = {
    body: options.body || 'Você tem uma nova notificação',
    icon: options.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: options.tag || 'default',
    data: options.data || {},
    requireInteraction: options.requireInteraction || false,
    actions: options.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data;
  let url = '/';

  if (data.type === 'overdue') {
    url = '/cobranca';
  } else if (data.type === 'payment') {
    url = '/tesouraria';
  } else if (data.type === 'due_today') {
    url = '/cobranca';
  } else if (data.clientId) {
    url = `/cliente/${data.clientId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});
