// ============================================
// 🧹 УПРАВЛЕНИЕ КЭШЕМ И АВТООБНОВЛЕНИЕМ
// ============================================

const CacheControl = {
    // Очистка всех кэшей
    clearAllCaches: function() {
        console.log('🧹 Очистка кэшей...');
        
        // Очищаем кэш приложения
        if (window.CacheService) {
            CacheService.clear();
        }
        
        // Очищаем localStorage (кроме данных авторизации)
        const keepKeys = ['gold_options_auth_v7', 'firebaseConfigLoaded'];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!keepKeys.includes(key)) {
                localStorage.removeItem(key);
            }
        }
        
        // Очищаем sessionStorage
        sessionStorage.clear();
        
        // Удаляем service worker и кэши
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    caches.delete(cacheName);
                });
            });
        }
        
        // Обновляем service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.update();
                });
            });
        }
        
        console.log('✅ Кэши очищены');
    },
    
    // Принудительное обновление страницы
    forceReload: function() {
        console.log('🔄 Принудительная перезагрузка...');
        
        // Очищаем кэши
        this.clearAllCaches();
        
        // Перезагружаем страницу с уникальным параметром
        const timestamp = Date.now();
        window.location.href = window.location.pathname + '?force=' + timestamp;
    },
    
    // Автоматическая очистка при старте
    autoCleanOnStart: function() {
        // Очищаем только если это новая сессия
        if (!sessionStorage.getItem('cacheCleaned')) {
            console.log('🚀 Автоматическая очистка кэша при старте...');
            
            // Очищаем старый кэш firebase-config.js
            if ('caches' in window) {
                caches.open('gold-options-pro-v8').then(cache => {
                    cache.delete('/firebase-config.js').then(() => {
                        console.log('✅ Старый кэш firebase-config.js удален');
                    });
                });
            }
            
            sessionStorage.setItem('cacheCleaned', 'true');
        }
    },
    
    // Проверка и обновление конфига
    checkAndUpdateConfig: function() {
        return new Promise((resolve) => {
            if (window.firebaseConfig) {
                console.log('✅ Конфиг уже загружен');
                resolve(true);
                return;
            }
            
            console.log('🔄 Проверка конфигурации Firebase...');
            
            // Загружаем конфиг с уникальным параметром
            const timestamp = Date.now();
            const script = document.createElement('script');
            script.src = `/trading-data/firebase-config.js?nocache=${timestamp}`;
            script.async = false;
            
            script.onload = function() {
                if (window.firebaseConfig) {
                    console.log('✅ Конфиг загружен успешно');
                    resolve(true);
                } else {
                    console.error('❌ Конфиг не определен после загрузки');
                    resolve(false);
                }
            };
            
            script.onerror = function() {
                console.error('❌ Ошибка загрузки конфига');
                resolve(false);
            };
            
            document.head.appendChild(script);
        });
    }
};

// Автоматическая очистка при загрузке
window.addEventListener('load', function() {
    setTimeout(() => {
        CacheControl.autoCleanOnStart();
    }, 1000);
});

// Экспорт
window.CacheControl = CacheControl;
