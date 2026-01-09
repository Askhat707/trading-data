// ============================================
// 🔥 FIREBASE МОДУЛЬ
// ============================================

const FirebaseModule = {
    /**
     * ИНИЦИАЛИЗАЦИЯ FIREBASE
     */
    init() {
        try {
            // Проверяем конфигурацию
            if (!window.firebaseConfig || !window.firebaseConfig.apiKey) {
                console.error('❌ Firebase конфигурация не найдена!');
                console.error('window.firebaseConfig:', window.firebaseConfig);
                return false;
            }
            
            // Проверяем Firebase SDK
            if (typeof firebase === 'undefined') {
                console.error('❌ Firebase SDK не загружен');
                return false;
            }
            
            // Проверяем, не инициализирован ли уже Firebase
            if (firebase.apps.length === 0) {
                firebase.initializeApp(window.firebaseConfig);
                console.log('✅ Firebase инициализирован впервые');
                console.log('📊 Проект:', window.firebaseConfig.projectId);
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
        try {
            return firebase.database();
        } catch (error) {
            console.error('❌ Ошибка получения database:', error);
            return null;
        }
    },
    
    /**
     * ПОЛУЧЕНИЕ ССЫЛКИ НА AUTH
     */
    getAuth() {
        try {
            return firebase.auth();
        } catch (error) {
            console.error('❌ Ошибка получения auth:', error);
            return null;
        }
    },
    
    /**
     * ПРОВЕРКА ИНИЦИАЛИЗАЦИИ
     */
    isInitialized() {
        return firebase && firebase.apps.length > 0;
    }
};

// ГЛОБАЛЬНЫЙ ЭКСПОРТ
window.Firebase
Module = FirebaseModule;
console.log('✅ FirebaseModule загружен');
