// ============================================
// 📊 КОНСТАНТЫ ПРИЛОЖЕНИЯ
// ============================================

console.log('📋 Загрузка констант...');

const Constants = {
    CACHE_VERSION: 'v5_gold_options_pro',
    
    AUTH_CONFIG: {
        adminEmail: "omaralinovaskar95@gmail.com",
        adminTelegram: "@ASKHAT_1985",
        trialDays: 3,
        localStorageKey: "gold_options_auth_v7"
    },
    
    COLORS: {
        gold: '#FFD700',
        call: '#00E676',
        put: '#FF1744',
        bgMain: '#050505'
    },
    
    APP_SETTINGS: {
        priceUpdateInterval: 3000,
        dataUpdateInterval: 3 * 60 * 1000,
        analyticsUpdateInterval: 3 * 60 * 1000,
        defaultStrikeCount: 15
    },
    
    MT5_CONFIG: {
        endpoint: 'http://localhost:8080/api/mt5',
        defaultRisk: 2,
        defaultSize: 0.1,
        defaultTP: 20,
        defaultSL: 10
    },
    
    FIREBASE_PATHS: {
        price: ['current_price', 'gc/current_price', 'gc/live_data/current'],
        analytics: (dte) => [`gc/analytics/dte_${dte}`, `analytics/dte_${dte}`, `dte_${dte}/analytics`],
        breakevens: (dte) => [`gc/breakevens/dte_${dte}`, `breakevens/dte_${dte}`]
    }
};

console.log('✅ Константы загружены');
window.Constants = Constants;
