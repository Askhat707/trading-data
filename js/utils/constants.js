// ============================================
// 📊 КОНСТАНТЫ ПРИЛОЖЕНИЯ
// ============================================

const Constants = {
    // Версия кэша
    CACHE_VERSION: 'v4_firebase.pro_secure',
    
    // Конфигурация AuthSystem
    AUTH_CONFIG: {
        adminEmail: "omaralinovaskar95@gmail.com",
        adminTelegram: "@ASKHAT_1985",
        trialDays: 3,
        localStorageKey: "gold_options_auth_v6",
        userCheckInterval: 5 * 60 * 1000, // 5 минут
        activityCheckInterval: 30 * 1000, // 30 секунд
        maxInactiveDays: 365,
        realtimeSync: true
    },
    
    // Цвета
    COLORS: {
        gold: '#FFD700',
        goldDark: '#D4AF37',
        goldLight: '#FFF8DC',
        call: '#00E676',
        put: '#FF1744',
        bgMain: '#050505',
        bgPanel: '#111111',
        textMain: '#ffffff',
        textMuted: '#888888'
    },
    
    // Настройки приложения
    APP_SETTINGS: {
        priceUpdateInterval: 3000, // 3 секунды
        dataUpdateInterval: 3 * 60 * 1000, // 3 минуты
        analyticsUpdateInterval: 3 * 60 * 1000, // 3 минуты
        defaultStrikeCount: 15,
        maxStrikeCount: 175
    },
    
    // MT5 конфигурация
    MT5_CONFIG: {
        endpoint: 'http://localhost:8080/api/mt5',
        defaultRisk: 2, // %
        defaultSize: 0.1, // lots
        defaultTP: 20, // pips
        defaultSL: 10 // pips
    },
    
    // Firebase пути
    FIREBASE_PATHS: {
        price: ['current_price', 'gc/current_price', 'gc/live_data/current'],
        analytics: (dte) => [`gc/analytics/dte_${dte}`, `analytics/dte_${dte}`, `dte_${dte}/analytics`],
        breakevens: (dte) => [`gc/breakevens/dte_${dte}`, `gc/mt5/breakevens/dte_${dte}`, `mt5/breakevens/dte_${dte}`, `breakevens/dte_${dte}`]
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Constants;
} else {
    window.Constants = Constants;
}
