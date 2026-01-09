// ============================================
// 🧹 УПРАВЛЕНИЕ КЭШЕМ И АВТООБНОВЛЕНИЕМ
// ============================================

const CacheControl = {
    // Очистка всех кэшей
    clearAllCaches: function() {
        console.log('🧹 Очистка кэшей...');
        
        // 1. Очистка кэша сервиса данных
        if (window.CacheService) {
            CacheService.clear();
        }
        
        // 2. Очистка localStorage с сохранением авторизации
        // ВАЖНО: 'gold_options_auth_v7' - ключ с данными входа
        const keepKeys = [
            'gold_options_auth_v7', 
            'firebaseConfigLoaded',
            'loglevel'
        ];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!keepKeys.includes(key)) {
                localStorage.removeItem(key);
            }
        }
        
        // 3. Очистка sessionStorage
        sessionStorage.clear();
        
        // 4. Очистка Service Worker и Cache Storage
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => registration.unregister());
            });
        }
        
        console.log('✅ Кэши очищены (авторизация сохранена)');
    },
    
    // Принудительная перезагрузка
    forceReload: function() {
        console.log('🔄 Принудительная перезагрузка...');
        this.clearAllCaches();
        const timestamp = Date.now();
        window.location.href = window.location.pathname + '?force=' + timestamp;
    },
    
    // Автоматическая очистка при старте
    autoCleanOnStart: function() {
        // Выполняем только один раз за сессию
        if (!sessionStorage.getItem('cacheCleaned')) {
            console.log('🚀 Авто-очистка кэша при старте...');
            
            // Удаляем старый кэшированный конфиг, если есть
            if ('caches' in window) {
                caches.open('gold-options-pro-v8').then(cache => {
                    cache.match('/firebase-config.js').then(response => {
                        if (response) cache.delete('/firebase-config.js');
                    });
                });
            }
            
            sessionStorage.setItem('cacheCleaned', 'true');
        }
    }
};

// Запуск при загрузке
window.addEventListener('load', function() {
    setTimeout(() => {
        CacheControl.autoCleanOnStart();
    }, 1000);
});

window.CacheControl = CacheControl;
