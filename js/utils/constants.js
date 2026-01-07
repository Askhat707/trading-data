// ============================================
// 🎯 КОНСТАНТЫ ПРИЛОЖЕНИЯ
// ============================================

const AppConstants = {
    // Версия кэша
    CACHE_VERSION: 'v4_firebase.pro_secure',
    
    // Интервалы обновления (в миллисекундах)
    UPDATE_INTERVALS: {
        PRICE: 3000,           // 3 секунды
        ANALYTICS: 180000,     // 3 минуты
        DATA: 180000,          // 3 минуты
        MT5: 60000             // 1 минута
    },
    
    // Цвета для типов уведомлений
    NOTIFICATION_COLORS: {
        SUCCESS: '#00E676',
        ERROR: '#FF1744',
        WARNING: '#FFD700',
        INFO: '#2196F3'
    },
    
    // Максимальное количество элементов
    MAX_ITEMS: {
        STRIKES_TRIAL: 15,
        STRIKES_PREMIUM: 175,
        TOP_STATS: 5,
        TOP_BREAKEVENS: 10,
        SIGNALS_HISTORY: 20
    },
    
    // Настройки Firebase
    FIREBASE_PATHS: {
        PRICE: ['current_price', 'gc/current_price', 'gc/live_data/current'],
        ANALYTICS: 'gc/analytics',
        BREAKEVENS: 'gc/breakevens',
        USER_DATA: 'users'
    },
    
    // Настройки MT5
    MT5_DEFAULTS: {
        ENDPOINT: 'http://localhost:8080/api/mt5',
        MODE: 'manual',
        RISK: 2,
        SIZE: 0.1,
        TAKE_PROFIT: 20,
        STOP_LOSS: 10
    },
    
    // Текст по умолчанию
    DEFAULT_TEXTS: {
        LOADING: 'Загрузка...',
        NO_DATA: 'Нет данных',
        CONNECTING: 'Подключение...',
        DISCONNECTED: 'Отключено'
    }
};

// Экспорт в глобальную область видимости
window.AppConstants = AppConstants;
