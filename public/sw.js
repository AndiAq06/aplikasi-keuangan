const CACHE_NAME = "fasihfinance-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/dashboard",
  "/transactions",
  "/categories",
  "/reports",
  "/settings",
  "/login",
  "/register",
  "/manifest.json",
  "/icons/icon.svg",
];

// Service worker install event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Service worker activation event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch interception event
self.addEventListener("fetch", (e) => {
  // Only handle GET requests and skip server API endpoints or developer assets
  if (
    e.request.method !== "GET" || 
    e.request.url.includes("/api/") || 
    e.request.url.includes("/_next/") ||
    e.request.url.includes("chrome-extension")
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch from network in the background to refresh local cache (stale-while-revalidate)
        fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(e.request, networkResponse);
              });
            }
          })
          .catch(() => {}); // Ignore network errors during silent background updates
        
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
