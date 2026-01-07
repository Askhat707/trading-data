// ============================================
// 🔥 FIREBASE МОДУЛЬ - ДЛЯ ВАШЕЙ СИСТЕМЫ
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
                console.error('❌ Firebase конфигурация не загружена');
                this.showConfigError();
                return false;
            }
            
            // Инициализируем Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            // Получаем ссылки на сервисы
            this.db = firebase.database();
            this.auth = firebase.auth();
            
            console.log('✅ Firebase инициализирован');
            
            // Настраиваем слушатель состояния аутентификации
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('👤 Пользователь аутентифицирован:', user.uid);
                    // Триггер для AuthModule
                    if (window.AuthModule && typeof AuthModule.onAuthStateChange === 'function') {
                        AuthModule.onAuthStateChange(user);
                    }
                } else {
                    console.log('👤 Пользователь не аутентифицирован');
                    // Показываем модальное окно входа
                    if (window.AuthModule && typeof AuthModule.showAuthModal === 'function') {
                        AuthModule.showAuthModal();
                    }
                }
            });
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
            this.showConfigError();
            return false;
        }
    },
    
    /**
     * Вход по email и паролю
     */
    async signInWithEmailAndPassword(email, password) {
        try {
            console.log('🔐 Попытка входа для:', email);
            
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            
            console.log('✅ Вход успешен:', userCredential.user.uid);
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
     * Получение данных пользователя из базы данных
     */
    async getUserData(userId) {
        try {
            const snapshot = await this.db.ref(`users/${userId}`).once('value');
            if (!snapshot.exists()) {
                console.warn('⚠️  Пользователь не найден в базе данных:', userId);
                return null;
            }
            
            return snapshot.val();
        } catch (error) {
            console.error('❌ Ошибка получения данных пользователя:', error);
            return null;
        }
    },
    
    /**
     * Поиск пользователя по email в базе данных
     */
    async findUserByEmail(email) {
        try {
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
     * Выход из системы
     */
    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('❌ Ошибка выхода:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Проверка, загружен ли Firebase
     */
    isReady() {
        return this.db !== null && this.auth !== null;
    },
    
    /**
     * Показать ошибку конфигурации
     */
    showConfigError() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; color: #ff4444;">❌</div>
                    <h2 style="color: #ff4444; margin: 20px 0;">Firebase Configuration Error</h2>
                    <p>Failed to load Firebase configuration</p>
                    <div style="margin: 20px 0; padding: 15px; background: rgba(255,68,68,0.1); border-radius: 8px; text-align: left; max-width: 500px; margin: 20px auto;">
                        <p><strong>Check:</strong></p>
                        <ul>
                            <li>firebase-config.js exists and has correct keys</li>
                            <li>GitHub Secrets are configured properly</li>
                            <li>Firebase project exists and has Anonymous auth enabled</li>
                        </ul>
                    </div>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #FFD700; color: #000; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        🔄 Reload Page
                    </button>
                </div>
            `;
        }
    }
};
