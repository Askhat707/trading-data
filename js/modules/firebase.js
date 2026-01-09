// ============================================
// 🔥 FIREBASE МОДУЛЬ
// ============================================

const FirebaseModule = {
    initialized: false,
    
    /**
     * БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ FIREBASE
     */
    init() {
        try {
            // Проверяем конфигурацию
            if (!window.firebaseConfig || !window.firebaseConfig.apiKey) {
                console.warn('⚠️ [FIREBASE] Конфигурация не загружена, ожидание...');
                return false;
            }
            
            // Проверяем Firebase SDK
            if (typeof firebase === 'undefined') {
                console.error('❌ [FIREBASE] Firebase SDK не загружен');
                return false;
            }
            
            // Если уже инициализирован
            if (this.initialized) {
                console.log('✅ [FIREBASE] Уже инициализирован');
                return true;
            }
            
            // Инициализируем приложение
            if (firebase.apps.length === 0) {
                firebase.initializeApp(window.firebaseConfig);
                console.log('✅ [FIREBASE] Приложение инициализировано впервые');
            } else {
                console.log('✅ [FIREBASE] Приложение уже было инициализировано');
            }
            
            this.initialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ [FIREBASE] Ошибка инициализации:', error);
            return false;
        }
    },
    
    /**
     * ПРОВЕРКА ИНИЦИАЛИЗАЦИИ
     */
    isInitialized() {
        return this.initialized && firebase && firebase.apps.length > 0;
    },
    
    /**
     * ПОЛУЧЕНИЕ DATABASE С ПРОВЕРКОЙ
     */
    getDatabase() {
        if (!this.isInitialized()) {
            console.warn('⚠️ [FIREBASE] Не инициализирован перед использованием getDatabase');
            return null;
        }
        
        try {
            return firebase.database();
        } catch (error) {
            console.error('❌ [FIREBASE] Ошибка получения database:', error);
            return null;
        }
    },
    
    /**
     * ПОЛУЧЕНИЕ AUTH С ПРОВЕРКОЙ
     */
    getAuth() {
        if (!this.isInitialized()) {
            console.warn('⚠️ [FIREBASE] Не инициализирован перед использованием getAuth');
            return null;
        }
        
        try {
            return firebase.auth();
        } catch (error) {
            console.error('❌ [FIREBASE] Ошибка получения auth:', error);
            return null;
        }
    },
    
    /**
     * ПЕРЕИНИЦИАЛИЗАЦИЯ
     */
    reinitialize() {
        this.initialized = false;
        return this.init();
    }
};

// Глобальный экспорт
window.FirebaseModule = FirebaseModule;
console.log('✅ [FIREBASE] Модуль загружен');
