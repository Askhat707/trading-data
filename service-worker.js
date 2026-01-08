// ============================================
// ⚡ SERVICE WORKER - С АВТООБНОВЛЕНИЕМ КЭША
// ============================================

const CACHE_NAME = 'gold-options-pro-v9-' + Date.now();
const STATIC_CACHE_NAME = 'gold-options-static-v3';

const urlsToCache = [
    './',
    './index.html',
    './css/base.css',
    './css/components/modal.css',
    './css/components/cards.css',
    './css/components/table.css',
    './css/pages/terminal.css',
    './js/constants.js',
    './js/services/cache.js',
    './js/utils/helpers.js',
    './js/modules/firebase.js',
    './js/modules/auth.js',
    './js/services/api.js',
    './js/modules/charts.js',
    './js/app.js'
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
    
    // 🔥 НИКОГДА не кэшируем firebase-config.js - ВСЕГДА из сети!
    if (url.includes('firebase-config.js')) {
        console.log('🔥 firebase-config.js - ПРЯМАЯ ЗАГРУЗКА ИЗ СЕТИ');
        event.respondWith(
            fetch(event.request, { cache: 'no-store' })
                .then(response => {
                    if (response.ok) {
                        return response;
                    }
                    // Если сеть недоступна - возвращаем ошибку
                    return new Response(
                        `console.error('❌ Ошибка загрузки firebase-config.js: ' + ${response.status});`,
                        { 
                            headers: { 'Content-Type': 'application/javascript' }
                        }
                    );
                })
                .catch(err => {
                    console.error('❌ Ошибка загрузки firebase-config.js:', err);
                    return new Response(
                        `console.error('❌ Ошибка сети при загрузке firebase-config.js');`,
                        { 
                            headers: { 'Content-Type': 'application/javascript' }
                        }
                    );
                })
        );
        return;
    }
    
    // Пропускаем не GET запросы
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Для HTML - сеть сначала
    if (url.includes('.html') || event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' })
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
    
    // Для остальных - кэш с обновлением из сети
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                const fetchPromise = fetch(event.request)
                    .then(networkResponse => {
                        const responseClone = networkResponse.clone();
                        caches.open(STATIC_CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                        return networkResponse;
                    });
                
                return response || fetchPromise;
            })
    );
});
