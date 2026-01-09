// ============================================
// ⚡ SERVICE WORKER - ОПТИМИЗИРОВАННЫЙ
// ============================================

const CACHE_VERSION = 'gold-options-v10';
const STATIC_CACHE = 'gold-options-static-v10';

// Файлы для кэширования
const CACHE_FILES = [
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

// УСТАНОВКА
self.addEventListener('install', event => {
    console.log('✅ Service Worker установлен, версия:', CACHE_VERSION);
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 Кэширование файлов...');
                return cache.addAll(CACHE_FILES).catch(err => {
                    console.warn('⚠️ Не удалось кэшировать некоторые файлы:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// АКТИВАЦИЯ
self.addEventListener('activate', event => {
    console.log('✅ Service Worker активирован');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Удаляем старые кэши
                    if (cacheName !== CACHE_VERSION && cacheName !== STATIC_CACHE) {
                        console.log(`🗑️ Удаление старого кэша: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // 🔥 КРИТИЧЕСКИ ВАЖНО: Удаляем firebase-config.js из кэша!
            return caches.open(STATIC_CACHE).then(cache => {
                return cache.delete('./firebase-config.js');
            });
        }).then(() => self.clients.claim())
    );
});

// FETCH
self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    // 🔥 НИКОГДА НЕ КЭШИРУЕМ firebase-config.js!
    if (url.includes('firebase-config.js')) {
        console.log('🔥 firebase-config.js - ПРЯМАЯ ЗАГРУЗКА ИЗ СЕТИ');
        event.respondWith(
            fetch(event.request, { 
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            }).catch(error => {
                console.error('❌ Ошибка загрузки firebase-config.js:', error);
                return new Response(
                    'console.error("❌ Не удалось загрузить firebase-config.js");',
                    { headers: { 'Content-Type': 'application/javascript' } }
                );
            })
        );
        return;
    }
    
    // Только GET запросы
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Для HTML - сеть сначала
    if (url.includes('.html') || event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' })
                .then(response => {
                    const clone = response.clone();
                    caches.open(STATIC_CACHE).then(cache => {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    // Для остальных - кэш с фоновым обновлением
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request)
                .then(networkResponse => {
                    const clone = networkResponse.clone();
                    caches.open(STATIC_CACHE).then(cache => {
                        cache.put(event.request, clone);
                    });
                    return networkResponse;
                })
                .catch(() => cachedResponse);
            
            return cachedResponse || fetchPromise;
        })
    );
});

// СООБЩЕНИЯ ОТ КЛИЕНТА
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data === 'clearCache') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            })
        );
    }
});

console.log('✅ Service Worker загружен');
