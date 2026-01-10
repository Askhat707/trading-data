// ============================================
// 🔐 МОДУЛЬ АУТЕНТИФИКАЦИИ V7 - ИСПРАВЛЕННЫЙ
// ============================================

const AuthModule = {
    config: {
        trialDays: 3,
        localStorageKey: 'gold_options_pro_auth_v7',
        sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 дней
        adminEmail: 'omaralinovaskar95@gmail.com',
        adminTelegram: '@ASKHAT_1985',
        version: 'v7'
    },
    
    currentUser: null,
    isInitializing: false,
    
    status: {
        initialized: false,
        authChecked: false,
        sessionRestored: false
    },
    
    /**
     * АВТОИНИЦИАЛИЗАЦИЯ - ИСПРАВЛЕНО
     */
    async autoInit() {
        if (this.isInitializing) {
            console.log('⏳ [AUTH] Уже инициализируется...');
            return false;
        }
        
        this.isInitializing = true;
        
        try {
            console.log('🔐 [AUTH] Начало автоинициализации v7...');
            
            // Шаг 1: Ждем Firebase
            await this.waitForFirebase();
            
            // Шаг 2: Настраиваем persistence
            await this.setupPersistence();
            
            // Шаг 3: Инициализируем обработчики
            this.initAuthHandlers();
            
            // Шаг 4: Восстанавливаем сессию
            const restored = await this.checkSavedSession(); // ← ИСПРАВЛЕНО: правильное имя метода
            
            this.status.initialized = true;
            console.log('✅ [AUTH] Автоинициализация завершена');
            
            return true;
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка автоинициализации:', error);
            this.status.initialized = false;
            return false;
        } finally {
            this.isInitializing = false;
        }
    },
    
    /**
     * ОЖИДАНИЕ FIREBASE
     */
    async waitForFirebase() {
        console.log('⏳ [AUTH] Ожидание Firebase...');
        
        let attempts = 0;
        const maxAttempts = 50; // 5 секунд
        
        while (!window.firebaseConfig || !window.firebaseConfig.apiKey) {
            attempts++;
            if (attempts > maxAttempts) {
                throw new Error('Таймаут загрузки Firebase конфига');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('✅ [AUTH] Firebase конфиг найден');
        return true;
    },
    
    /**
     * НАСТРОЙКА PERSISTENCE
     */
    async setupPersistence() {
        console.log('🔧 [AUTH] Настройка persistence...');
        
        try {
            const auth = firebase.auth();
            
            if (!auth.setPersistence) {
                console.warn('⚠️ [AUTH] setPersistence недоступен');
                return false;
            }
            
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            console.log('✅ [AUTH] Persistence установлен в LOCAL');
            return true;
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка настройки persistence:', error);
            return false;
        }
    },
    
    /**
     * ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ
     */
    initAuthHandlers() {
        console.log('🔄 [AUTH] Инициализация обработчиков...');
        
        try {
            const auth = firebase.auth();
            
            // Обработчик изменения состояния аутентификации
            auth.onAuthStateChanged((firebaseUser) => {
                console.log('👤 [AUTH] Auth State Changed:', firebaseUser ? firebaseUser.email : 'null');
                
                if (firebaseUser) {
                    this.handleUserLogin(firebaseUser);
                } else {
                    this.handleUserLogout();
                }
            });
            
            console.log('✅ [AUTH] Обработчики инициализированы');
        } catch (error) {
            console.error('❌ [AUTH] Ошибка инициализации обработчиков:', error);
        }
    },
    
    /**
     * ПРОВЕРКА СОХРАНЕННОЙ СЕССИИ - ИСПРАВЛЕНО (было checkSavedAuth)
     */
    async checkSavedSession() {
        console.log('🔄 [AUTH] Проверка сохраненной сессии...');
        
        try {
            // Получаем текущего пользователя Firebase
            const firebaseUser = firebase.auth().currentUser;
            
            if (firebaseUser) {
                console.log('✅ [AUTH] Найден активный пользователь Firebase:', firebaseUser.email);
                await this.handleUserLogin(firebaseUser);
                this.status.sessionRestored = true;
                return true;
            }
            
            console.log('⚠️ [AUTH] Активная сессия не найдена');
            return false;
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка проверки сессии:', error);
            return false;
        }
    },
    
    /**
     * ВХОД ПОЛЬЗОВАТЕЛЯ
     */
    async login(email, password, silent = false) {
        console.log(`🔐 [AUTH] Вход: ${email}`);
        
        if (!silent) {
            this.showAuthLoading('Вход в систему...');
        }
        
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            
            console.log('✅ [AUTH] Вход успешен:', userCredential.user.email);
            
            if (!silent) {
                this.hideAuthLoading();
                this.showNotification('Вход выполнен успешно!', 'success');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка входа:', error);
            
            if (!silent) {
                this.hideAuthLoading();
                this.showAuthError(this.getAuthErrorMessage(error));
            }
            
            return false;
        }
    },
    
    /**
     * ОБРАБОТКА УСПЕШНОГО ВХОДА
     */
    async handleUserLogin(firebaseUser) {
        console.log('👤 [AUTH] Обработка входа:', firebaseUser.email);
        
        try {
            // Получаем данные пользователя из базы
            const userRef = firebase.database().ref(`users/${firebaseUser.uid}`);
            const snapshot = await userRef.once('value');
            
            let userData = null;
            
            if (snapshot.exists()) {
                userData = {
                    ...snapshot.val(),
                    id: firebaseUser.uid,
                    email: firebaseUser.email
                };
                
                console.log('📊 [AUTH] План:', userData.plan);
                
                // Проверяем подписку
                if (this.isSubscriptionExpired(userData)) {
                    console.warn('⚠️ [AUTH] Подписка истекла');
                    userData.plan = 'TRIAL';
                    userData.trialEnd = Date.now() + (this.config.trialDays * 24 * 60 * 60 * 1000);
                    await userRef.update(userData);
                }
                
            } else {
                // Новый пользователь
                userData = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    plan: 'TRIAL',
                    registered: Date.now(),
                    trialEnd: Date.now() + (this.config.trialDays * 24 * 60 * 60 * 1000),
                    premiumEnd: 0,
                    lastLogin: Date.now(),
                    version: this.config.version
                };
                
                await userRef.set(userData);
                console.log('🎉 [AUTH] Новый пользователь создан с TRIAL доступом');
            }
            
            // Обновляем lastLogin
            await userRef.update({ lastLogin: Date.now() });
            
            // Сохраняем в модуле
            this.currentUser = userData;
            this.status.authChecked = true;
            
            // Показываем интерфейс
            this.showMainInterface();
            this.updateUserUI();
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка обработки входа:', error);
            this.showAuthError('Ошибка загрузки данных');
        }
    },
    
    /**
     * ВЫХОД ПОЛЬЗОВАТЕЛЯ
     */
    async logout() {
        console.log('🚪 [AUTH] Выход...');
        
        try {
            await firebase.auth().signOut();
            
            this.currentUser = null;
            this.status.authChecked = false;
            
            if (window.app && window.app.cleanup) {
                window.app.cleanup();
            }
            
            this.showAuthModal();
            this.showNotification('Вы вышли из системы', 'success');
            
            console.log('✅ [AUTH] Выход выполнен');
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка выхода:', error);
            this.showNotification('Ошибка при выходе', 'error');
        }
    },
    
    /**
     * ОБРАБОТКА ВЫХОДА
     */
    handleUserLogout() {
        console.log('👋 [AUTH] Пользователь вышел');
        this.currentUser = null;
        this.showAuthModal();
    },
    
    /**
     * ПОКАЗ ГЛАВНОГО ИНТЕРФЕЙСА
     */
    showMainInterface() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.add('hidden');
        }
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
        }
    },
    
    /**
     * ПОКАЗ ОКНА ВХОДА
     */
    showAuthModal() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.remove('hidden');
        }
    },
    
    /**
     * ОБНОВЛЕНИЕ UI
     */
    updateUserUI() {
        if (!this.currentUser) return;
        
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            const displayName = this.currentUser.email.split('@')[0];
            userDisplay.textContent = displayName;
        }
        
        const logoutBtn = document.getElementById('header-logout');
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }
    },
    
    /**
     * ПРОВЕРКА ИСТЕКЛА ЛИ ПОДПИСКА
     */
    isSubscriptionExpired(user) {
        if (!user) return true;
        
        if (user.plan === 'PREMIUM') {
            return !user.premiumEnd || user.premiumEnd < Date.now();
        } else {
            return !user.trialEnd || user.trialEnd < Date.now();
        }
    },
    
    /**
     * ОСТАВШИЕСЯ ДНИ
     */
    getDaysLeft(user = this.currentUser) {
        if (!user) return 0;
        
        const endDate = user.plan === 'PREMIUM' ? user.premiumEnd : user.trialEnd;
        if (!endDate) return 0;
        
        const daysLeft = Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysLeft);
    },
    
    /**
     * ПОКАЗ ОШИБКИ
     */
    showAuthError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            setTimeout(() => errorEl.classList.remove('show'), 5000);
        }
    },
    
    /**
     * ЗАГРУЗКА КНОПКИ ВХОДА
     */
    showAuthLoading(message) {
        const btn = document.getElementById('login-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `⏳ ${message}`;
        }
    },
    
    /**
     * СКРЫТИЕ ЗАГРУЗКИ
     */
    hideAuthLoading() {
        const btn = document.getElementById('login-btn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'ВОЙТИ В СИСТЕМУ';
        }
    },
    
    /**
     * СООБЩЕНИЕ ОБ ОШИБКЕ
     */
    getAuthErrorMessage(error) {
        const messages = {
            'auth/user-not-found': 'Пользователь не найден',
            'auth/wrong-password': 'Неверный пароль',
            'auth/invalid-email': 'Неверный email',
            'auth/user-disabled': 'Аккаунт отключен',
            'auth/too-many-requests': 'Слишком много попыток'
        };
        return messages[error.code] || 'Ошибка входа';
    },
    
    /**
     * УВЕДОМЛЕНИЕ
     */
    showNotification(message, type = 'info') {
        const colors = {
            success: '#00E676',
            error: '#FF1744',
            warning: '#FFD700'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: rgba(20,20,20,0.95); color: white;
            padding: 15px 25px; border-radius: 10px;
            border-left: 4px solid ${colors[type]};
            z-index: 10000; max-width: 400px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentElement) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
};

// Глобальные функции
window.handleLogin = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    
    if (!email || !password) {
        AuthModule.showAuthError('Заполните все поля');
        return false;
    }
    
    await AuthModule.login(email, password);
    return false;
};

window.handleLogout = function() {
    AuthModule.logout();
};

window.AuthModule = AuthModule;
console.log('✅ [AUTH] Модуль аутентификации загружен (v7)');
