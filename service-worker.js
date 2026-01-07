// ============================================
// ⚙️ SERVICE WORKER
// ============================================

const CACHE_NAME = 'gold-options-pro-v4';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/base.css',
    '/css/components/modal.css',
    '/css/components/cards.css',
    '/css/components/table.css',
    '/css/pages/terminal.css',
    '/js/utils/helpers.js',
    '/js/utils/constants.js',
    '/js/services/api.js',
    '/js/services/cache.js',
    '/js/modules/firebase.js',
    '/js/modules/auth.js',
    '/js/modules/charts.js',
    '/js/modules/mt5.js',
    '/js/app.js'
];

self.addEventListener('install', event => {
    console.log('✅ Service Worker установлен');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Кэширование файлов...');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
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
    // Пропускаем запросы к Firebase и другим внешним ресурсам
    if (event.request.url.includes('firebase') ||
        event.request.url.includes('googleapis') ||
        event.request.url.includes('gstatic') ||
        event.request.url.includes('cdn.jsdelivr.net')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем из кэша, если есть
                if (response) {
                    return response;
                }
                
                // Иначе загружаем из сети
                return fetch(event.request)
                    .then(response => {
                        // Проверяем, валидный ли ответ
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Клонируем ответ
                        const responseToCache = response.clone();
                        
                        // Добавляем в кэш
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // В случае ошибки сети, можно показать fallback
                        if (event.request.url.includes('.html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
