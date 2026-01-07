// ============================================
// 🔥 FIREBASE МОДУЛЬ
// ============================================

const FirebaseModule = {
    db: null,
    auth: null,
    
    /**
     * Инициализация Firebase
     */
    init() {
        try {
            // Проверяем, есть ли конфиг Firebase
            if (!firebaseConfig || !firebaseConfig.apiKey) {
                throw new Error('Firebase конфигурация не загружена');
            }
            
            // Инициализируем Firebase
            firebase.initializeApp(firebaseConfig);
            
            // Получаем ссылки на сервисы
            this.db = firebase.database();
            this.auth = firebase.auth();
            
            console.log('✅ Firebase инициализирован');
            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
            return false;
        }
    },
    
    /**
     * Проверка статуса аутентификации
     * @returns {Promise<Object|null>} Пользователь или null
     */
    async getAuthState() {
        return new Promise((resolve) => {
            if (!this.auth) {
                resolve(null);
                return;
            }
            
            this.auth.onAuthStateChanged((user) => {
                resolve(user);
            });
        });
    },
    
    /**
     * Вход по email и паролю
     * @param {string} email - Email пользователя
     * @param {string} password - Пароль пользователя
     * @returns {Promise<Object>} Результат входа
     */
    async signInWithEmailAndPassword(email, password) {
        try {
            if (!this.auth) {
                throw new Error('Firebase Auth не инициализирован');
            }
            
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return {
                success: true,
                user: userCredential.user
            };
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    },
    
    /**
     * Выход из системы
     * @returns {Promise<Object>} Результат выхода
     */
    async signOut() {
        try {
            if (!this.auth) {
                throw new Error('Firebase Auth не инициализирован');
            }
            
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('❌ Ошибка выхода:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    /**
     * Получение данных пользователя из базы данных
     * @param {string} userId - ID пользователя
     * @returns {Promise<Object|null>} Данные пользователя
     */
    async getUserData(userId) {
        try {
            if (!this.db) {
                throw new Error('Firebase Database не инициализирован');
            }
            
            const snapshot = await this.db.ref(`users/${userId}`).once('value');
            if (!snapshot.exists()) {
                return null;
            }
            
            return {
                id: userId,
                ...snapshot.val()
            };
        } catch (error) {
            console.error('❌ Ошибка получения данных пользователя:', error);
            return null;
        }
    },
    
    /**
     * Поиск пользователя по email
     * @param {string} email - Email для поиска
     * @returns {Promise<Object|null>} Найденный пользователь
     */
    async findUserByEmail(email) {
        try {
            if (!this.db) {
                throw new Error('Firebase Database не инициализирован');
            }
            
            const snapshot = await this.db.ref('users')
                .orderByChild('email')
                .equalTo(email.toLowerCase())
                .once('value');
            
            if (!snapshot.exists()) {
                return null;
            }
            
            const users = snapshot.val();
            const userId = Object.keys(users)[0];
            
            return {
                id: userId,
                ...users[userId]
            };
        } catch (error) {
            console.error('❌ Ошибка поиска пользователя:', error);
            return null;
        }
    },
    
    /**
     * Обновление данных пользователя
     * @param {string} userId - ID пользователя
     * @param {Object} updates - Обновляемые поля
     * @returns {Promise<Object>} Результат обновления
     */
    async updateUserData(userId, updates) {
        try {
            if (!this.db) {
                throw new Error('Firebase Database не инициализирован');
            }
            
            await this.db.ref(`users/${userId}`).update(updates);
            return { success: true };
        } catch (error) {
            console.error('❌ Ошибка обновления данных пользователя:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseModule;
} else {
    window.FirebaseModule = FirebaseModule;
}
