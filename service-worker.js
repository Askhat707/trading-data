// ============================================
// ⚡ SERVICE WORKER - С АВТООБНОВЛЕНИЕМ КЭША
// ============================================

const CACHE_NAME = 'gold-options-pro-v8-' + Date.now();
const STATIC_CACHE_NAME = 'gold-options-static-v3';

const urlsToCache = [
    '/trading-data/',
    '/trading-data/index.html',
    '/trading-data/css/base.css',
    '/trading-data/css/components/modal.css',
    '/trading-data/css/components/cards.css',
    '/trading-data/css/components/table.css',
    '/trading-data/css/pages/terminal.css',
    '/trading-data/js/constants.js',
    '/trading-data/js/services/cache.js',
    '/trading-data/js/utils/helpers.js',
    '/trading-data/js/modules/firebase.js',
    '/trading-data/js/modules/auth.js',
    '/trading-data/js/services/api.js',
    '/trading-data/js/modules/charts.js',
    '/trading-data/js/app.js'
];

self.addEventListener('install', event => {
    console.log('✅ Service Worker установлен, версия:', CACHE_NAME);
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then(cache => {
            console.log('📦 Кэширование статических файлов...');
            return cache.addAll(urlsToCache).catch(err => {
                console.warn('⚠️ Не удалось кэшировать некоторые файлы:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    console.log('✅ Service Worker активирован');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
                        console.log(`🗑️ Удаление старого кэша: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    // 🔥 ВАЖНО: НИКОГДА не кэшируем firebase-config.js
    if (url.includes('firebase-config.js')) {
        console.log('🔥 Загружаем firebase-config.js напрямую из сети');
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Не сохраняем в кэш
                    return response;
                })
                .catch(() => {
                    return new Response(
                        `console.error('❌ Ошибка загрузки firebase-config.js');`,
                        { 
                            headers: { 'Content-Type': 'application/javascript' }
                        }
                    );
                })
        );
        return;
    }
    
    // Для HTML всегда загружаем свежую версию
    if (url.includes('.html') || event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    // Для остальных - стратегия "сеть сначала"
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
