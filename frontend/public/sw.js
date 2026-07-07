self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push event received:', data);
      
      const title = data.title || 'New Notification';
      const options = {
        body: data.body || '',
        icon: '/logo.png', // Fallback to an existing icon or you can customize this
        badge: '/logo.png',
        data: data.data || {}
      };
      
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error('Error parsing push data', e);
      // Fallback for simple text payloads
      event.waitUntil(
        self.registration.showNotification('New Notification', {
          body: event.data.text(),
          icon: '/logo.png'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.');
  event.notification.close();
  
  const urlToOpen = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/';
    
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
