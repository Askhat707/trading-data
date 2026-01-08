// ============================================
// 🔥 FIREBASE МОДУЛЬ - ПРОСТАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================

const FirebaseModule = {
    /**
     * ИНИЦИАЛИЗАЦИЯ FIREBASE
     */
    init() {
        try {
            // Проверяем конфигурацию
            if (!window.firebaseConfig || !window.firebaseConfig.apiKey) {
                console.error('❌ Firebase конфигурация не найдена');
                return false;
            }
            
            // Проверяем, не инициализирован ли уже Firebase
            if (firebase.apps.length === 0) {
                firebase.initializeApp(window.firebaseConfig);
                console.log('✅ Firebase инициализирован');
            } else {
                console.log('✅ Firebase уже инициализирован');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
            return false;
        }
    },
    
    /**
     * ПОЛУЧЕНИЕ ССЫЛКИ НА DATABASE
     */
    getDatabase() {
        return firebase.database();
    },
    
    /**
     * ПОЛУЧЕНИЕ ССЫЛКИ НА AUTH
     */
    getAuth() {
        return firebase.auth();
    }
};

// ГЛОБАЛЬНЫЙ ЭКСПОРТ
window.FirebaseModule = FirebaseModule;
