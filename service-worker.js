// ============================================
// ⚡ SERVICE WORKER
// ============================================

const CACHE_NAME = 'gold-options-pro-v5';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/base.css',
    '/css/components/modal.css',
    '/css/components/cards.css',
    '/css/components/table.css',
    '/css/pages/terminal.css',
    '/js/constants.js',
    '/js/cache.js',
    '/js/helpers.js',
    '/js/firebase.js',
    '/js/auth.js',
    '/js/api.js',
    '/js/charts.js',
    '/js/mt5.js',
    '/js/app.js'
];

self.addEventListener('install', event => {
    console.log('✅ Service Worker установлен');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('📦 Кэширование файлов...');
            // Кэшируем файлы, игнорируя ошибки
            return Promise.allSettled(
                urlsToCache.map(url => cache.add(url))
            );
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    console.log('✅ Service Worker активирован');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log(`🗑️ Удаление старого кэша: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Пропускаем запросы к Firebase и CDN
    if (event.request.url.includes('firebase') ||
        event.request.url.includes('googleapis') ||
        event.request.url.includes('gstatic') ||
        event.request.url.includes('cdn.')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }
            
            return fetch(event.request).then(response => {
                if (!response || response.status !== 200) {
                    return response;
                }
                
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                
                return response;
            }).catch(() => {
                if (event.request.url.includes('.html')) {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
