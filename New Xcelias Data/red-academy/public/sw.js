// Network-only private workspace. Replace the old public shell cache on upgrade.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>key.startsWith('red-academy-')).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
// Deliberately no fetch interception: neither authenticated data nor old app pages are served offline.
