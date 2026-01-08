// ============================================
// ⚡ SERVICE WORKER - С АВТООБНОВЛЕНИЕМ КЭША
// ============================================

const CACHE_NAME = 'gold-options-pro-v8-' + Date.now(); // Уникальное имя кэша
const STATIC_CACHE_NAME = 'gold-options-static-v3';

const urlsToCache = [
    '/',
    '/index.html',
    '/css/base.css',
    '/css/components/modal.css',
    '/css/components/cards.css',
    '/css/components/table.css',
    '/css/pages/terminal.css',
    '/js/constants.js',
    '/js/services/cache.js',
    '/js/utils/helpers.js',
    '/js/modules/firebase.js',
    '/js/modules/auth.js',
    '/js/services/api.js',
    '/js/modules/charts.js',
    '/js/app.js'
];

self.addEventListener('install', event => {
    console.log('✅ Service Worker установлен, версия:', CACHE_NAME);
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then(cache => {
            console.log('📦 Кэширование статических файлов...');
            return Promise.allSettled(
                urlsToCache.map(url => {
                    // НЕ кэшируем firebase-config.js!
                    if (url.includes('firebase-config')) return Promise.resolve();
                    return cache.add(url).catch(err => {
                        console.warn(`⚠️ Не удалось кэшировать ${url}:`, err);
                    });
                })
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
                    // Удаляем ВСЕ старые кэши кроме текущего
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
                        console.log(`🗑️ Удаление старого кэша: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Очищаем старый кэш firebase-config.js
            return caches.open(CACHE_NAME).then(cache => {
                return cache.delete('/firebase-config.js');
            });
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
                    // Если не удалось загрузить, показываем ошибку
                    return new Response(
                        JSON.stringify({ 
                            error: 'Firebase config not loaded',
                            message: 'Проверьте GitHub Actions деплой' 
                        }),
                        { 
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
        return;
    }
    
    // Пропускаем внешние запросы
    if (url.includes('firebase') && !url.includes('firebase-config.js') ||
        url.includes('googleapis') ||
        url.includes('gstatic') ||
        url.includes('cdn.')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then(response => {
            // Для HTML всегда загружаем свежую версию
            if (event.request.url.includes('.html') || 
                event.request.destination === 'document') {
                return fetchAndUpdateCache(event.request);
            }
            
            if (response) {
                // Проверяем актуальность кэша
                return validateCache(event.request, response);
            }
            
            return fetchAndUpdateCache(event.request);
        })
    );
});

async function fetchAndUpdateCache(request) {
    try {
        const response = await fetch(request);
        
        if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
        }
        
        // Не кэшируем API запросы
        if (request.url.includes('/api/') || request.url.includes('/firebase/')) {
            return response;
        }
        
        // Кэшируем только статические ресурсы
        const responseToCache = response.clone();
        caches.open(STATIC_CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
        });
        
        return response;
    } catch (error) {
        // Если нет сети, пытаемся вернуть из кэша
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Если запрашивается HTML, показываем запасную страницу
        if (request.url.includes('.html')) {
            return caches.match('/index.html');
        }
        
        throw error;
    }
}

async function validateCache(request, cachedResponse) {
    try {
        const fetchResponse = await fetch(request);
        
        if (fetchResponse.status === 200) {
            // Обновляем кэш
            const responseToCache = fetchResponse.clone();
            caches.open(STATIC_CACHE_NAME).then(cache => {
                cache.put(request, responseToCache);
            });
            return fetchResponse;
        }
        
        return cachedResponse;
    } catch (error) {
        // Если сеть недоступна, используем кэш
        return cachedResponse;
    }
}

// Принудительное обновление кэша при сообщении
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
            });
        });
    }
});
