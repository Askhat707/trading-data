// ============================================
// 🔐 МОДУЛЬ АУТЕНТИФИКАЦИИ V8 - ИСПРАВЛЕННЫЙ
// ============================================

const AuthModule = {
    config: {
        trialDays: 3,
        localStorageKey: 'gold_options_pro_auth_v8',
        sessionTimeout: 30 * 24 * 60 * 60 * 1000,
        adminEmail: 'omaralinovaskar95@gmail.com',
        adminTelegram: '@ASKHAT_1985',
        version: 'v8'
    },
    
    currentUser: null,
    isInitializing: false,
    
    status: {
        initialized: false,
        authChecked: false,
        sessionRestored: false
    },
    
    /**
     * АВТОИНИЦИАЛИЗАЦИЯ
     */
    async autoInit() {
        if (this.isInitializing) {
            console.log('⏳ [AUTH] Уже инициализируется...');
            return false;
        }
        
        this.isInitializing = true;
        
        try {
            console.log('🔐 [AUTH] Начало автоинициализации v8...');
            
            // Шаг 1: Ждем Firebase
            await this.waitForFirebase();
            console.log('✅ [AUTH] Firebase готов');
            
            // Шаг 2: Настраиваем persistence
            await this.setupPersistence();
            console.log('✅ [AUTH] Persistence настроен');
            
            // Шаг 3: Инициализируем обработчики
            this.initAuthHandlers();
            console.log('✅ [AUTH] Обработчики инициализированы');
            
            // Шаг 4: Проверяем сохраненную сессию
            await this.checkSavedSession();
            console.log('✅ [AUTH] Сессия проверена');
            
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
        const maxAttempts = 50;
        
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
            
            // Основной обработчик изменения состояния
            auth.onAuthStateChanged(async (firebaseUser) => {
                console.log('👤 [AUTH] onAuthStateChanged:', firebaseUser ? firebaseUser.email : 'null');
                
                if (firebaseUser) {
                    // Пользователь авторизован - загружаем его данные
                    await this.handleUserLogin(firebaseUser);
                } else {
                    // Пользователь НЕ авторизован
                    this.handleUserLogout();
                }
            });
            
            console.log('✅ [AUTH] Обработчики инициализированы');
        } catch (error) {
            console.error('❌ [AUTH] Ошибка инициализации обработчиков:', error);
        }
    },
    
    /**
     * ПРОВЕРКА СОХРАНЕННОЙ СЕССИИ
     */
    async checkSavedSession() {
        console.log('🔄 [AUTH] Проверка сохраненной сессии...');
        
        try {
            const firebaseUser = firebase.auth().currentUser;
            
            if (firebaseUser) {
                console.log('✅ [AUTH] Найден активный пользователь:', firebaseUser.email);
                await this.handleUserLogin(firebaseUser);
                this.status.sessionRestored = true;
                return true;
            }
            
            console.log('⚠️ [AUTH] Активная сессия не найдена, показываем форму входа');
            this.handleUserLogout();
            return false;
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка проверки сессии:', error);
            this.handleUserLogout();
            return false;
        }
    },
    
    /**
     * ВХОД ПОЛЬЗОВАТЕЛЯ - ИСПРАВЛЕНО
     */
    async login(email, password, silent = false) {
        console.log(`🔐 [AUTH] Попытка входа: ${email}`);
        
        if (!silent) {
            this.showAuthLoading('Вход в систему...');
        }
        
        try {
            // Авторизуемся в Firebase Authentication
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const firebaseUser = userCredential.user;
            
            console.log('✅ [AUTH] Авторизация успешна:', firebaseUser.email);
            
            // Обработка входа (загрузка данных пользователя)
            await this.handleUserLogin(firebaseUser);
            
            if (!silent) {
                this.hideAuthLoading();
                this.showNotification('✅ Вход выполнен успешно!', 'success');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка входа:', error.code, error.message);
            
            if (!silent) {
                this.hideAuthLoading();
                this.showAuthError(this.getAuthErrorMessage(error));
            }
            
            return false;
        }
    },
    
    /**
     * ОБРАБОТКА УСПЕШНОГО ВХОДА - ИСПРАВЛЕНО
     * ТОЛЬКО ЧИТАЕМ ДАННЫЕ, НЕ СОЗДАЕМ!
     */
    async handleUserLogin(firebaseUser) {
        console.log('👤 [AUTH] Обработка входа:', firebaseUser.email);
        
        try {
            // ВАЖНО: Только ЧИТАЕМ данные пользователя
            // Не пытаемся создавать новую запись!
            
            const userRef = firebase.database().ref(`users/${firebaseUser.uid}`);
            const snapshot = await userRef.once('value');
            
            if (!snapshot.exists()) {
                // ❌ Пользователь не найден в базе
                console.error('❌ [AUTH] Пользователь не найден в базе данных');
                console.log('⚠️ [AUTH] Обратитесь к администратору:', this.config.adminTelegram);
                
                // Выходим из Firebase
                await firebase.auth().signOut();
                
                // Показываем ошибку
                this.showAuthError(
                    `Ваш аккаунт не активирован.\n\n` +
                    `Обратитесь к администратору:\n` +
                    `📧 ${this.config.adminEmail}\n` +
                    `💬 ${this.config.adminTelegram}`
                );
                
                this.handleUserLogout();
                return false;
            }
            
            // ✅ Пользователь найден в базе
            const userData = snapshot.val();
            
            console.log('📊 [AUTH] Данные пользователя загружены');
            console.log('   План:', userData.plan);
            console.log('   Email:', userData.email);
            console.log('   Версия:', userData.version);
            
            // Проверяем подписку
            if (this.isSubscriptionExpired(userData)) {
                console.warn('⚠️ [AUTH] Подписка истекла');
                
                const daysLeft = this.getDaysLeft(userData);
                console.log(`   Дней осталось: ${daysLeft}`);
                
                // Обновляем статус
                userData.plan = 'TRIAL';
                if (!userData.trialEnd || userData.trialEnd < Date.now()) {
                    userData.trialEnd = Date.now() + (this.config.trialDays * 24 * 60 * 60 * 1000);
                }
            }
            
            // Добавляем ID и email если их нет
            userData.id = firebaseUser.uid;
            userData.email = firebaseUser.email;
            
            // Обновляем lastLogin (если есть права)
            try {
                await userRef.update({ lastLogin: Date.now() });
                console.log('✅ [AUTH] LastLogin обновлен');
            } catch (e) {
                console.warn('⚠️ [AUTH] Не удалось обновить lastLogin:', e.message);
                // Продолжаем работу даже если не получилось обновить
            }
            
            // Сохраняем в модуле
            this.currentUser = userData;
            this.status.authChecked = true;
            
            console.log('✅ [AUTH] Пользователь успешно загружен');
            
            // Показываем основной интерфейс
            this.showMainInterface();
            this.updateUserUI();
            
            return true;
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка обработки входа:', error.message);
            
            // Если ошибка в доступе к БД - выходим
            if (error.code === 'PERMISSION_DENIED') {
                console.error('❌ [AUTH] Ошибка доступа к БД - проверьте правила Firebase');
                this.showAuthError('Ошибка доступа к базе данных. Обратитесь к администратору.');
            } else {
                this.showAuthError('Ошибка загрузки данных пользователя: ' + error.message);
            }
            
            // Выходим из Firebase
            try {
                await firebase.auth().signOut();
            } catch (e) {
                console.warn('⚠️ [AUTH] Ошибка при выходе:', e);
            }
            
            this.handleUserLogout();
            return false;
        }
    },
    
    /**
     * ВЫХОД ПОЛЬЗОВАТЕЛЯ
     */
    async logout() {
        console.log('🚪 [AUTH] Выход пользователя...');
        
        try {
            await firebase.auth().signOut();
            console.log('✅ [AUTH] Выход из Firebase выполнен');
            
            this.currentUser = null;
            this.status.authChecked = false;
            
            // Очищаем приложение
            if (window.app && window.app.cleanup) {
                window.app.cleanup();
            }
            
            // Показываем окно входа
            this.showAuthModal();
            this.showNotification('Вы вышли из системы', 'success');
            
            console.log('✅ [AUTH] Выход завершен');
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка выхода:', error);
            this.showNotification('Ошибка при выходе', 'error');
        }
    },
    
    /**
     * ОБРАБОТКА ВЫХОДА
     */
    handleUserLogout() {
        console.log('👋 [AUTH] Пользователь вышел или неавторизован');
        this.currentUser = null;
        this.status.authChecked = true;
        this.showAuthModal();
    },
    
    /**
     * ПОКАЗ ГЛАВНОГО ИНТЕРФЕЙСА
     */
    showMainInterface() {
        try {
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.add('hidden');
            }
            
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
                setTimeout(() => {
                    mainContent.style.opacity = '1';
                }, 50);
            }
            
            console.log('✅ [UI] Основной интерфейс показан');
        } catch (error) {
            console.error('❌ [UI] Ошибка показа интерфейса:', error);
        }
    },
    
    /**
     * ПОКАЗ ОКНА ВХОДА
     */
    showAuthModal() {
        try {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'none';
                mainContent.style.opacity = '0';
            }
            
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                console.log('✅ [UI] Показываем окно аутентификации');
                authModal.classList.remove('hidden');
                authModal.style.display = 'flex';
                authModal.style.opacity = '1';
                authModal.style.visibility = 'visible';
                
                // Очищаем поля формы
                const emailInput = document.getElementById('user-email');
                const passwordInput = document.getElementById('user-password');
                if (emailInput) emailInput.value = '';
                if (passwordInput) passwordInput.value = '';
            } else {
                console.error('❌ [UI] Элемент auth-modal не найден!');
            }
        } catch (error) {
            console.error('❌ [UI] Ошибка при показе модального окна:', error);
        }
    },
    
    /**
     * ОБНОВЛЕНИЕ UI ПОЛЬЗОВАТЕЛЯ
     */
    updateUserUI() {
        if (!this.currentUser) return;
        
        try {
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) {
                const displayName = this.currentUser.email.split('@')[0];
                userDisplay.textContent = displayName;
            }
            
            const userBadge = document.querySelector('.user-badge');
            if (userBadge) {
                if (this.currentUser.plan === 'PREMIUM') {
                    userBadge.classList.add('premium');
                } else {
                    userBadge.classList.remove('premium');
                }
            }
            
            const logoutBtn = document.getElementById('header-logout');
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
            }
            
            console.log('✅ [UI] UI пользователя обновлен');
        } catch (error) {
            console.error('❌ [UI] Ошибка обновления UI:', error);
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
     * ПОКАЗ ОШИБКИ АВТОРИЗАЦИИ
     */
    showAuthError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.innerHTML = message.replace(/\n/g, '<br>');
            errorEl.classList.add('show');
            setTimeout(() => errorEl.classList.remove('show'), 8000);
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
            'auth/user-not-found': '❌ Пользователь не найден. Проверьте email.',
            'auth/wrong-password': '❌ Неверный пароль.',
            'auth/invalid-email': '❌ Неверный формат email.',
            'auth/user-disabled': '❌ Аккаунт отключен администратором.',
            'auth/too-many-requests': '⏳ Слишком много попыток. Попробуйте позже.',
            'auth/invalid-credential': '❌ Email или пароль неверны.',
            'auth/network-request-failed': '⚠️ Ошибка сети. Проверьте подключение.',
        };
        return messages[error.code] || `❌ Ошибка входа: ${error.message}`;
    },
    
    /**
     * ПОКАЗ УВЕДОМЛЕНИЯ
     */
    showNotification(message, type = 'info') {
        console.log(`📢 [NOTIFY] ${type}: ${message}`);
        
        const colors = {
            success: '#00E676',
            error: '#FF1744',
            warning: '#FFD700',
            info: '#2196F3'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: rgba(20, 20, 20, 0.95); color: white;
            padding: 15px 25px; border-radius: 10px;
            border-left: 4px solid ${colors[type]};
            box-shadow: 0 5px 20px rgba(0,0,0,0.5); 
            z-index: 10000; max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `<div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-weight: 700;">${message}</div>
        </div>`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
};

// Глобальные функции
window.handleLogin = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('user-email').value.trim();
    const password = document.getElementById('user-password').value;
    
    if (!email || !password) {
        AuthModule.showAuthError('⚠️ Заполните все поля');
        return false;
    }
    
    if (!email.includes('@')) {
        AuthModule.showAuthError('⚠️ Введите корректный email');
        return false;
    }
    
    await AuthModule.login(email, password);
    return false;
};

window.handleLogout = function() {
    if (confirm('Вы уверены что хотите выйти?')) {
        AuthModule.logout();
    }
};

window.AuthModule = AuthModule;
console.log('✅ [AUTH] Модуль аутентификации загружен (v8)');
