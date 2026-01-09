// ============================================
// 🔐 МОДУЛЬ АУТЕНТИФИКАЦИИ V2 - ИСПРАВЛЕННЫЙ
// ============================================

const AuthModule = {
    config: {
        trialDays: 3,
        localStorageKey: 'gold_options_pro_session_v2',
        sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 дней
        adminEmail: 'omaralinovaskar95@gmail.com',
        adminTelegram: '@ASKHAT_1985',
        version: 'v6'  // Добавлено для соответствия правилам
    },
    
    currentUser: null,
    
    status: {
        initialized: false,
        authChecked: false,
        sessionRestored: false
    },
    
    /**
     * АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ - ИСПРАВЛЕНО
     */
    async autoInit() {
        try {
            console.log('🔐 [AUTH] Автоинициализация...');
            
            // Ждем инициализации Firebase
            let attempts = 0;
            while (!window.FirebaseModule || !window.FirebaseModule.isInitialized()) {
                attempts++;
                if (attempts > 30) { // 30 * 100ms = 3 секунды
                    throw new Error('Таймаут ожидания Firebase');
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Настраиваем persistence ДО получения auth
            const auth = firebase.auth();
            if (auth && auth.setPersistence) {
                await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                console.log('✅ [AUTH] Persistence установлен в LOCAL');
            }
            
            // Проверяем сохраненную сессию
            await this.restoreSession();  // ← ИСПРАВЛЕНО: был checkSavedAuth
            
            // Инициализируем обработчики
            this.initAuthHandlers();
            
            console.log('✅ [AUTH] Автоинициализация завершена');
            return true;
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка автоинициализации:', error);
            return false;
        }
    },
    
    /**
     * ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ AUTH - ДОБАВЛЕНО
     */
    initAuthHandlers() {
        console.log('🔄 [AUTH] Инициализация обработчиков...');
        
        try {
            const auth = firebase.auth();
            
            // Обработчик изменения состояния аутентификации
            auth.onAuthStateChanged((user) => {
                console.log('👤 [AUTH] Состояние изменилось:', user ? user.email : 'null');
                
                if (user) {
                    this.handleUserLogin(user);
                } else {
                    this.handleUserLogout();
                }
            });
            
            // Обработчик ошибок аутентификации
            auth.onIdTokenChanged((user) => {
                if (user) {
                    console.log('🔄 [AUTH] Токен обновлен:', user.email);
                }
            });
            
            console.log('✅ [AUTH] Обработчики инициализированы');
        } catch (error) {
            console.error('❌ [AUTH] Ошибка инициализации обработчиков:', error);
        }
    },
    
    /**
     * ВОССТАНОВЛЕНИЕ СЕССИИ
     */
    async restoreSession() {
        console.log('🔄 [AUTH] Восстановление сессии...');
        
        try {
            // Проверяем сохраненную сессию в localStorage
            const savedSession = localStorage.getItem(this.config.localStorageKey);
            
            if (savedSession) {
                const sessionData = JSON.parse(savedSession);
                const now = Date.now();
                
                // Проверяем не истекла ли сессия
                if (sessionData.expires && sessionData.expires > now) {
                    console.log('📱 [AUTH] Найдена сохраненная сессия для:', sessionData.email);
                    
                    // Пытаемся войти с сохраненными данными
                    await this.login(sessionData.email, sessionData.password, true);
                    this.status.sessionRestored = true;
                    return true;
                } else {
                    console.log('⏰ [AUTH] Сессия истекла, очищаем...');
                    localStorage.removeItem(this.config.localStorageKey);
                }
            }
            
            // Проверяем активную сессию Firebase
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                console.log('🔥 [AUTH] Активная сессия Firebase найдена:', currentUser.email);
                await this.handleUserLogin(currentUser);
                return true;
            }
            
            console.log('⚠️ [AUTH] Активная сессия не найдена');
            return false;
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка восстановления сессии:', error);
            return false;
        }
    },
    
    /**
     * ВХОД ПОЛЬЗОВАТЕЛЯ
     */
    async login(email, password, silent = false) {
        console.log(`🔐 [AUTH] Попытка входа: ${email}`);
        
        if (!silent) {
            this.showAuthLoading('Вход в систему...');
        }
        
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            
            console.log('✅ [AUTH] Вход успешен:', userCredential.user.email);
            
            // Сохраняем сессию
            this.saveSession(email, password);
            
            // Получаем/создаем данные пользователя
            await this.handleUserLogin(userCredential.user);
            
            if (!silent) {
                this.showAuthSuccess('Вход выполнен успешно!');
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
     * ОБРАБОТКА УСПЕШНОГО ВХОДА - ОБНОВЛЕНО ДЛЯ V6
     */
    async handleUserLogin(firebaseUser) {
        console.log('👤 [AUTH] Обработка входа пользователя:', firebaseUser.email);
        
        try {
            // Получаем данные пользователя из базы
            const userRef = firebase.database().ref(`users/${firebaseUser.uid}`);
            const snapshot = await userRef.once('value');
            
            let userData = null;
            
            if (snapshot.exists()) {
                // Существующий пользователь
                userData = {
                    ...snapshot.val(),
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    version: this.config.version  // Добавляем version
                };
                
                console.log('📊 [AUTH] Данные пользователя загружены:', userData.plan);
                
                // Проверяем не истекла ли подписка
                if (this.isSubscriptionExpired(userData)) {
                    console.warn('⚠️ [AUTH] Подписка пользователя истекла');
                    userData.plan = 'TRIAL';
                    userData.trialEnd = Date.now() + (this.config.trialDays * 24 * 60 * 60 * 1000);
                    await userRef.update(userData);
                }
                
            } else {
                // Новый пользователь - создаем запись СООТВЕТСТВУЮЩУЮ ПРАВИЛАМ V6
                userData = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    plan: 'TRIAL',
                    registered: Date.now(),
                    trialEnd: Date.now() + (this.config.trialDays * 24 * 60 * 60 * 1000),
                    premiumEnd: 0,
                    lastLogin: Date.now(),
                    version: this.config.version  // ВАЖНО: добавляем version
                };
                
                await userRef.set(userData);
                console.log('🎉 [AUTH] Создан новый пользователь с TRIAL доступом (v6)');
                
                // Показываем окно с приветствием для нового пользователя
                setTimeout(() => {
                    this.showTrialWelcome(userData);
                }, 1000);
            }
            
            // Обновляем время последнего входа
            await userRef.update({ 
                lastLogin: Date.now(),
                version: this.config.version  // Убедимся что version актуальна
            });
            
            // Сохраняем в модуле
            this.currentUser = userData;
            this.status.authChecked = true;
            
            // Показываем основной интерфейс
            this.showMainInterface();
            
            // Обновляем UI
            this.updateUserUI();
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка обработки входа:', error);
            this.showAuthError('Ошибка загрузки данных пользователя');
        }
    },
    
    /**
     * ВЫХОД ПОЛЬЗОВАТЕЛЯ
     */
    async logout() {
        console.log('🚪 [AUTH] Выход пользователя...');
        
        try {
            await firebase.auth().signOut();
            
            // Очищаем сессию
            localStorage.removeItem(this.config.localStorageKey);
            
            // Сбрасываем состояние
            this.currentUser = null;
            this.status.authChecked = false;
            
            // Очищаем приложение
            if (window.app && window.app.cleanup) {
                window.app.cleanup();
            }
            
            // Показываем окно входа
            this.showAuthModal();
            
            this.showNotification('Вы успешно вышли из системы', 'success');
            
            console.log('✅ [AUTH] Выход выполнен успешно');
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка выхода:', error);
            this.showNotification('Ошибка при выходе', 'error');
        }
    },
    
    /**
     * ОБРАБОТКА ВЫХОДА ПОЛЬЗОВАТЕЛЯ
     */
    handleUserLogout() {
        console.log('👋 [AUTH] Пользователь вышел');
        
        this.currentUser = null;
        this.status.authChecked = false;
        
        // Показываем окно входа
        this.showAuthModal();
    },
    
    /**
     * СОХРАНЕНИЕ СЕССИИ
     */
    saveSession(email, password) {
        try {
            const sessionData = {
                email: email,
                password: password,
                timestamp: Date.now(),
                expires: Date.now() + this.config.sessionTimeout,
                version: this.config.version  // Добавляем version
            };
            
            localStorage.setItem(this.config.localStorageKey, JSON.stringify(sessionData));
            console.log('💾 [AUTH] Сессия сохранена в localStorage (v6)');
            
        } catch (error) {
            console.warn('⚠️ [AUTH] Не удалось сохранить сессию:', error);
        }
    },
    
    /**
     * ПОКАЗ ГЛАВНОГО ИНТЕРФЕЙСА
     */
    showMainInterface() {
        console.log('🖥️ [AUTH] Показ главного интерфейса');
        
        // Скрываем окно аутентификации
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.add('hidden');
        }
        
        // Показываем основной контент
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
            setTimeout(() => {
                mainContent.classList.add('visible');
            }, 50);
        }
        
        // Запускаем приложение
        setTimeout(() => {
            if (window.app && window.app.init) {
                window.app.init();
            }
        }, 500);
    },
    
    /**
     * ПОКАЗ ОКНА АУТЕНТИФИКАЦИИ
     */
    showAuthModal() {
        console.log('🔓 [AUTH] Показ окна аутентификации');
        
        // Скрываем основной контент
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'none';
            mainContent.classList.remove('visible');
        }
        
        // Показываем окно аутентификации
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.remove('hidden');
            authModal.style.display = 'flex';
        }
        
        // Заполняем email если есть сохраненный
        const savedSession = localStorage.getItem(this.config.localStorageKey);
        if (savedSession) {
            try {
                const sessionData = JSON.parse(savedSession);
                const emailInput = document.getElementById('user-email');
                if (emailInput) {
                    emailInput.value = sessionData.email;
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        }
    },
    
    /**
     * ОБНОВЛЕНИЕ UI ПОЛЬЗОВАТЕЛЯ
     */
    updateUserUI() {
        if (!this.currentUser) return;
        
        console.log('🎨 [AUTH] Обновление UI пользователя');
        
        // Обновляем шапку
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            const email = this.currentUser.email;
            const displayName = email.split('@')[0];
            userDisplay.textContent = displayName;
            
            const userBadge = userDisplay.closest('.user-badge');
            if (userBadge) {
                if (this.currentUser.plan === 'PREMIUM') {
                    userBadge.classList.add('premium');
                    userBadge.style.background = 'rgba(0, 230, 118, 0.1)';
                    userBadge.innerHTML = `<span>👑</span> <span id="user-display">${displayName}</span>`;
                } else {
                    userBadge.classList.remove('premium');
                    userBadge.style.background = '';
                    userBadge.innerHTML = `<span>👤</span> <span id="user-display">${displayName}</span>`;
                }
            }
        }
        
        // Показываем кнопку выхода
        const logoutBtn = document.getElementById('header-logout');
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }
        
        // Обновляем информацию в модальном окне аутентификации
        const userInfo = document.getElementById('user-info');
        const userEmail = document.querySelector('.user-email');
        const userPlan = document.querySelector('.user-plan');
        
        if (userInfo && userEmail && userPlan) {
            userInfo.style.display = 'block';
            userEmail.textContent = this.currentUser.email;
            userPlan.textContent = this.currentUser.plan;
            userPlan.className = this.currentUser.plan === 'PREMIUM' ? 'user-plan plan-premium' : 'user-plan plan-trial';
        }
        
        // Обновляем форму входа
        const authForm = document.getElementById('auth-form');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtnModal = document.getElementById('logout-btn');
        
        if (authForm && loginBtn && logoutBtnModal) {
            authForm.style.display = 'none';
            loginBtn.style.display = 'none';
            logoutBtnModal.style.display = 'block';
        }
    },
    
    /**
     * ПОКАЗ ПРИВЕТСТВЕННОГО ОКНА ДЛЯ TRIAL
     */
    showTrialWelcome(userData) {
        console.log('🎉 [AUTH] Показ приветствия для нового пользователя');
        
        const daysLeft = this.getDaysLeft(userData);
        
        // Обновляем данные в модальном окне
        const adminEmail = document.getElementById('admin-email');
        const trialDaysLeft = document.getElementById('trial-days-left');
        const template = document.getElementById('trial-message-template');
        
        if (adminEmail) adminEmail.textContent = userData.email;
        if (trialDaysLeft) trialDaysLeft.textContent = daysLeft;
        
        if (template) {
            template.textContent = `
Здравствуйте! Хочу активировать PREMIUM доступ к Gold Options Pro v2.

Мой email: ${userData.email}
Текущий план: TRIAL (осталось ${daysLeft} дней)
Прошу предоставить реквизиты для оплаты.
            `;
        }
        
        // Показываем модальное окно
        const trialModal = document.getElementById('trial-modal');
        if (trialModal) {
            trialModal.classList.add('show');
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
     * ПОЛУЧЕНИЕ ОСТАВШИХСЯ ДНЕЙ
     */
    getDaysLeft(user = this.currentUser) {
        if (!user) return 0;
        
        let endDate = 0;
        
        if (user.plan === 'PREMIUM') {
            endDate = user.premiumEnd;
        } else {
            endDate = user.trialEnd;
        }
        
        if (!endDate) return 0;
        
        const now = Date.now();
        if (endDate <= now) return 0;
        
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysLeft);
    },
    
    /**
     * ПОКАЗ ЗАГРУЗКИ АУТЕНТИФИКАЦИИ
     */
    showAuthLoading(message) {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = `<span>⏳</span> ${message}`;
        }
    },
    
    /**
     * СКРЫТИЕ ЗАГРУЗКИ АУТЕНТИФИКАЦИИ
     */
    hideAuthLoading() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = `ВОЙТИ В СИСТЕМУ`;
        }
    },
    
    /**
     * ПОКАЗ ОШИБКИ АУТЕНТИФИКАЦИИ
     */
    showAuthError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            
            setTimeout(() => {
                errorEl.classList.remove('show');
            }, 5000);
        }
    },
    
    /**
     * ПОКАЗ УСПЕХА АУТЕНТИФИКАЦИИ
     */
    showAuthSuccess(message) {
        this.showNotification(message, 'success');
    },
    
    /**
     * ПОЛУЧЕНИЕ СООБЩЕНИЯ ОБ ОШИБКЕ
     */
    getAuthErrorMessage(error) {
        switch (error.code) {
            case 'auth/user-not-found':
                return 'Пользователь не найден';
            case 'auth/wrong-password':
                return 'Неверный пароль';
            case 'auth/invalid-email':
                return 'Неверный формат email';
            case 'auth/user-disabled':
                return 'Аккаунт отключен';
            case 'auth/too-many-requests':
                return 'Слишком много попыток. Попробуйте позже';
            case 'auth/network-request-failed':
                return 'Ошибка сети. Проверьте подключение';
            default:
                return 'Ошибка входа. Проверьте данные';
        }
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
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: rgba(20, 20, 20, 0.95); color: white;
            padding: 15px 25px; border-radius: 10px;
            border-left: 4px solid ${colors[type]};
            box-shadow: 0 5px 20px rgba(0,0,0,0.5); z-index: 10000;
            max-width: 400px; font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div>${icons[type]}</div>
                <div>${message}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        // Добавляем стили анимации
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn { 
                    from { transform: translateX(100%); opacity: 0; } 
                    to { transform: translateX(0); opacity: 1; } 
                }
                @keyframes slideOut { 
                    from { transform: translateX(0); opacity: 1; } 
                    to { transform: translateX(100%); opacity: 0; } 
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// Глобальные функции для вызова из HTML
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

// Экспорт
window.AuthModule = AuthModule;

console.log('✅ [AUTH] Модуль аутентификации загружен (исправленная версия v6)');
