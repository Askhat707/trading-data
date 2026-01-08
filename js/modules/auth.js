// ============================================
// 🔐 МОДУЛЬ АУТЕНТИФИКАЦИИ
// ============================================

const AuthModule = {
    // Конфигурация
    config: {
        trialDays: 3,
        localStorageKey: 'gold_options_auth_v7',
        adminEmail: 'omaralinovaskar95@gmail.com',
        adminTelegram: '@ASKHAT_1985'
    },
    
    // Текущий пользователь
    currentUser: null,
    
    // Статусы
    status: {
        initialized: false,
        authChecked: false
    },
    
    /**
     * ПРОВЕРКА КОНФИГУРАЦИИ FIREBASE
     */
    checkFirebaseConfig() {
        console.group('🔥 Проверка Firebase конфигурации');
        
        if (!window.firebaseConfig) {
            console.error('❌ window.firebaseConfig не определен');
            console.error('   Файл firebase-config.js не загружен или не создан GitHub Actions');
            console.groupEnd();
            return false;
        }
        
        const requiredFields = [
            'apiKey', 'authDomain', 'databaseURL', 
            'projectId', 'storageBucket', 'messagingSenderId', 
            'appId', 'measurementId'
        ];
        
        let valid = true;
        requiredFields.forEach(field => {
            if (!window.firebaseConfig[field] || window.firebaseConfig[field].includes('{{')) {
                console.error(`❌ Поле ${field} пусто или содержит плейсхолдер!`);
                valid = false;
            }
        });
        
        if (!valid) {
            console.error('❌ Конфигурация Firebase неполная!');
            console.groupEnd();
            return false;
        }
        
        console.log('✅ Конфигурация Firebase загружена');
        console.groupEnd();
        return true;
    },
    
    /**
     * АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ
     */
    /**
 * АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ
 */
async autoInit() {
    console.log('🚀 AuthModule.autoInit() запущен');
    
    try {
        // Сначала скрываем loading
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        
        // Ждем 2 секунды чтобы дать время загрузиться firebase-config.js
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔍 Проверяем загрузку конфига...');
        
        // Проверяем загрузился ли конфиг
        if (!window.firebaseConfig || typeof window.firebaseConfig !== 'object') {
            console.warn('⚠️ window.firebaseConfig не загружен или пуст');
            console.log('ℹ️ Попробуем загрузить конфиг вручную...');
            
            // Пытаемся загрузить конфиг
            await this.loadFirebaseConfig();
            
            if (!window.firebaseConfig) {
                console.error('❌ Не удалось загрузить конфиг');
                this.showAuthModal(); // Все равно показываем форму входа
                return;
            }
        }
        
        console.log('✅ Конфиг загружен:', window.firebaseConfig.projectId);
        
        // Проверяем Firebase SDK
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK не загружен');
            this.showError('Firebase SDK не загружен. Проверьте интернет соединение.');
            this.showAuthModal();
            return;
        }
        
        // Инициализируем Firebase
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(window.firebaseConfig);
                console.log('✅ Firebase инициализирован');
            }
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
            this.showError(`Ошибка Firebase: ${error.message}`);
            this.showAuthModal();
            return;
        }
        
        // Пытаемся восстановить сессию
        const savedUser = localStorage.getItem(this.config.localStorageKey);
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                console.log('📱 Восстановление сессии из localStorage:', userData.email);
                await this.login(userData.email, userData.password, true);
                return;
            } catch (e) {
                console.warn('⚠️ Не удалось восстановить сессию:', e);
                localStorage.removeItem(this.config.localStorageKey);
            }
        }
        
        // Если нет сохраненной сессии, показываем форму входа
        this.showAuthModal();
        
    } catch (error) {
        console.error('❌ Критическая ошибка в autoInit:', error);
        this.showAuthModal(); // Все равно показываем форму входа
    }
},

/**
 * ЗАГРУЗКА КОНФИГА FIREBASE
 */
async loadFirebaseConfig() {
    return new Promise((resolve) => {
        console.log('🔄 Загрузка firebase-config.js...');
        
        const timestamp = Date.now();
        const script = document.createElement('script');
        script.src = `/trading-data/firebase-config.js?nocache=${timestamp}`;
        script.async = false;
        
        script.onload = function() {
            console.log('✅ firebase-config.js загружен');
            resolve(true);
        };
        
        script.onerror = function() {
            console.error('❌ Ошибка загрузки firebase-config.js');
            resolve(false);
        };
        
        document.head.appendChild(script);
        
        // Таймаут
        setTimeout(() => {
            if (script.parentNode) {
                script.remove();
                console.warn('⚠️ Таймаут загрузки конфига');
                resolve(false);
            }
        }, 5000);
    });
},
    
    /**
     * ИНИЦИАЛИЗАЦИЯ АУТЕНТИФИКАЦИИ
     */
    async initAuth() {
        console.log('🔐 Инициализация модуля аутенфикации...');
        
        // Проверяем конфигурацию Firebase
        if (!this.checkFirebaseConfig()) {
            this.showError('Ошибка конфигурации Firebase. Проверьте консоль.');
            return;
        }
        
        // Инициализируем Firebase
        if (!firebase.apps.length) {
            try {
                firebase.initializeApp(window.firebaseConfig);
                console.log('✅ Firebase инициализирован');
            } catch (error) {
                console.error('❌ Ошибка инициализации Firebase:', error);
                this.showError(`Ошибка Firebase: ${error.message}`);
                return;
            }
        }
        
        // Настройка слушателей аутентификации
        firebase.auth().onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });
        
        this.status.initialized = true;
        console.log('✅ Модуль аутентификации инициализирован');
    },
    
    /**
     * ОБРАБОТЧИК ИЗМЕНЕНИЯ СОСТОЯНИЯ АУТЕНТИФИКАЦИИ
     */
    async handleAuthStateChange(user) {
        console.log('🔄 Изменение состояния аутенфикации:', user ? user.email : 'Нет пользователя');
        
        if (user) {
            // Пользователь вошел
            await this.handleUserLogin(user);
        } else {
            // Пользователь вышел
            this.handleUserLogout();
        }
        
        this.status.authChecked = true;
    },
    
    /**
     * ОБРАБОТКА ВХОДА ПОЛЬЗОВАТЕЛЯ
     */
    async handleUserLogin(firebaseUser) {
        try {
            console.log('👤 Firebase пользователь:', firebaseUser.email);
            
            // Получаем данные пользователя из базы
            const userRef = firebase.database().ref(`users/${firebaseUser.uid}`);
            const snapshot = await userRef.once('value');
            
            if (snapshot.exists()) {
                // Пользователь существует
                const userData = snapshot.val();
                this.currentUser = {
                    ...userData,
                    id: firebaseUser.uid,
                    email: firebaseUser.email
                };
                
                console.log('✅ Пользователь найден в базе:', this.currentUser);
                
                // Проверяем подписку
                this.checkSubscriptionStatus();
                
                // Сохраняем в localStorage
                this.saveUserSession();
                
                // Показываем основной интерфейс
                this.showMainInterface();
                
            } else {
                // Новый пользователь - регистрируем
                console.log('🆕 Новый пользователь, регистрация...');
                await this.registerNewUser(firebaseUser);
            }
            
        } catch (error) {
            console.error('❌ Ошибка получения данных пользователя:', error);
            this.showError('Ошибка загрузки данных пользователя');
            this.showAuthModal(); // Если ошибка, показываем форму входа
        }
    },
    
    /**
     * РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ
     */
    async registerNewUser(firebaseUser) {
        try {
            const userData = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                plan: 'TRIAL',
                registered: Date.now(),
                trialEnd: Date.now() + (this.config.trialDays * 24 * 60 * 60 * 1000),
                premiumEnd: 0,
                version: 'v6'
            };
            
            // Сохраняем в базу
            await firebase.database().ref(`users/${firebaseUser.uid}`).set(userData);
            
            this.currentUser = userData;
            console.log('✅ Новый пользователь зарегистрирован:', this.currentUser);
            
            // Создаем сессию
            await firebase.database().ref(`sessions/${Date.now()}`).set({
                userId: firebaseUser.uid,
                email: firebaseUser.email,
                timestamp: Date.now(),
                type: 'registration'
            });
            
            // Сохраняем в localStorage
            this.saveUserSession();
            
            // Показываем уведомление о триале
            this.showTrialWelcome();
            
            // Показываем основной интерфейс
            this.showMainInterface();
            
        } catch (error) {
            console.error('❌ Ошибка регистрации пользователя:', error);
            this.showError('Ошибка регистрации');
            this.showAuthModal();
        }
    },
    
    /**
     * ПРОВЕРКА СТАТУСА ПОДПИСКИ
     */
    checkSubscriptionStatus() {
        if (!this.currentUser) return;
        
        const now = Date.now();
        
        if (this.currentUser.plan === 'PREMIUM') {
            if (this.currentUser.premiumEnd && this.currentUser.premiumEnd > now) {
                console.log('✅ PREMIUM подписка активна');
                return 'PREMIUM_ACTIVE';
            } else {
                console.log('⚠️ PREMIUM подписка истекла');
                this.currentUser.plan = 'TRIAL';
                this.currentUser.trialEnd = now + (this.config.trialDays * 24 * 60 * 60 * 1000);
                return 'PREMIUM_EXPIRED';
            }
        } else if (this.currentUser.plan === 'TRIAL') {
            if (this.currentUser.trialEnd && this.currentUser.trialEnd > now) {
                const daysLeft = Math.ceil((this.currentUser.trialEnd - now) / (24 * 60 * 60 * 1000));
                console.log(`🔄 TRIAL активен, осталось дней: ${daysLeft}`);
                return 'TRIAL_ACTIVE';
            } else {
                console.log('⛔ TRIAL период истек');
                this.currentUser.plan = 'EXPIRED';
                return 'TRIAL_EXPIRED';
            }
        }
        
        return 'UNKNOWN';
    },
    
    /**
     * ВХОД ПОЛЬЗОВАТЕЛЯ
     */
    async login(email, password, silent = false) {
        if (!silent) {
            this.showLoading('Вход в систему...');
        }
        
        try {
            // Аутентификация в Firebase
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            
            if (!silent) {
                this.hideLoading();
                this.showSuccess('Вход выполнен успешно!');
            }
            
            // Сохраняем данные для автоматического входа
            if (!silent) {
                localStorage.setItem(this.config.localStorageKey, JSON.stringify({
                    email: email,
                    password: password,
                    timestamp: Date.now()
                }));
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            
            if (!silent) {
                this.hideLoading();
                
                let errorMessage = 'Ошибка входа';
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Пользователь не найден';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Неверный пароль';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Неверный формат email';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'Аккаунт отключен';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Слишком много попыток. Попробуйте позже';
                        break;
                }
                
                this.showError(errorMessage);
            }
            
            return false;
        }
    },
    
    /**
     * ВЫХОД ПОЛЬЗОВАТЕЛЯ
     */
    async logout() {
        try {
            await firebase.auth().signOut();
            
            // Очищаем localStorage
            localStorage.removeItem(this.config.localStorageKey);
            
            this.currentUser = null;
            this.status.authChecked = false;
            
            // Очищаем приложение
            if (window.app && window.app.cleanup) {
                app.cleanup();
            }
            
            // Показываем форму входа
            this.showAuthModal();
            
            this.showSuccess('Выход выполнен успешно');
            
        } catch (error) {
            console.error('❌ Ошибка выхода:', error);
            this.showError('Ошибка при выходе');
        }
    },
    
    /**
     * СОХРАНЕНИЕ СЕССИИ
     */
    saveUserSession() {
        if (!this.currentUser) return;
        
        const sessionData = {
            userId: this.currentUser.id,
            email: this.currentUser.email,
            plan: this.currentUser.plan,
            timestamp: Date.now()
        };
        
        // Сохраняем в базу
        firebase.database().ref(`sessions/${Date.now()}`).set(sessionData)
            .catch(err => console.warn('⚠️ Не удалось сохранить сессию:', err));
    },
    
    /**
     * ПОКАЗ ГЛАВНОГО ИНТЕРФЕЙСА
     */
    showMainInterface() {
        // Скрываем модальное окно аутентификации
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.add('hidden');
            setTimeout(() => {
                authModal.style.display = 'none';
            }, 500);
        }
        
        // Показываем основной контент
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.add('visible');
        }
        
        // Обновляем UI пользователя
        this.updateUserUI();
        
        // Запускаем приложение
        if (window.app && window.app.init) {
            setTimeout(() => {
                app.init();
            }, 1000);
        }
    },
    
    /**
 * ПОКАЗ ФОРМЫ АУТЕНТИФИКАЦИИ
 */
showAuthModal() {
    console.log('🔓 Показываем модальное окно аутентификации');
    
    // Скрываем экран загрузки если еще виден
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    // Показываем модальное окно
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.classList.remove('hidden');
        authModal.style.display = 'flex';
        
        // Анимация появления
        setTimeout(() => {
            authModal.style.opacity = '1';
        }, 10);
    }
    
    // Скрываем основной контент если он виден
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    console.log('✅ Модальное окно показано');
},
    
    /**
     * ОБНОВЛЕНИЕ UI ПОЛЬЗОВАТЕЛЯ
     */
    updateUserUI() {
        if (!this.currentUser) return;
        
        // Обновляем шапку
        const userBadge = document.querySelector('.user-badge');
        if (userBadge) {
            userBadge.innerHTML = `
                <span style="color: ${this.currentUser.plan === 'PREMIUM' ? '#00E676' : '#FFD700'}">👤</span>
                <span>${this.currentUser.email}</span>
                <span style="background: ${this.currentUser.plan === 'PREMIUM' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 215, 0, 0.2)'}; 
                      color: ${this.currentUser.plan === 'PREMIUM' ? '#00E676' : '#FFD700'}; 
                      padding: 2px 8px; border-radius: 10px; font-size: 0.7em; margin-left: 8px;">
                    ${this.currentUser.plan === 'PREMIUM' ? 'PREMIUM' : 'TRIAL'}
                </span>
            `;
        }
        
        // Обновляем форму в модальном окне
        const userInfo = document.getElementById('user-info');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="user-email">${this.currentUser.email}</div>
                <div class="user-plan ${this.currentUser.plan === 'PREMIUM' ? 'plan-premium' : 'plan-trial'}">
                    ${this.currentUser.plan === 'PREMIUM' ? 'PREMIUM' : 'TRIAL'}
                </div>
            `;
        }
        
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
        }
    },
    
    /**
     * ПОКАЗ ПРИВЕТСТВИЯ ДЛЯ TRIAL
     */
    showTrialWelcome() {
        const daysLeft = this.getDaysLeft();
        
        if (daysLeft > 0) {
            setTimeout(() => {
                const modal = document.createElement('div');
                modal.className = 'trial-modal-overlay show';
                modal.innerHTML = `
                    <div class="trial-modal">
                        <button class="close-trial-modal" onclick="this.parentElement.parentElement.remove()">×</button>
                        <div class="trial-modal-header">
                            <div class="trial-modal-title">🎉 ДОБРО ПОЖАЛОВАТЬ В TRIAL</div>
                            <div class="trial-modal-subtitle">Получите полный доступ ко всем функциям</div>
                        </div>
                        
                        <div class="trial-info-box">
                            <div class="info-row">
                                <span class="info-label">Ваш email:</span>
                                <span class="info-value">${this.currentUser.email}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">План:</span>
                                <span class="info-value" style="color: #FFD700;">TRIAL</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Дней осталось:</span>
                                <span class="info-value">${daysLeft}</span>
                            </div>
                        </div>
                        
                        <div class="trial-template">
                            <span class="template-label">📱 Шаблон для связи с администратором:</span>
                            <div class="template-text" id="trial-message-template">
Здравствуйте! Хочу активировать PREMIUM доступ к Gold Options Pro v2.

Мой email: ${this.currentUser.email}
Текущий план: TRIAL (осталось ${daysLeft} дней)
Прошу предоставить реквизиты для оплаты.
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin: 20px 0;">
                            <button class="copy-btn" onclick="copyTemplate()">📋 Копировать шаблон</button>
                            <button class="copy-btn" onclick="openTelegramForTrial()">📲 Открыть Telegram</button>
                        </div>
                        
                        <div class="trial-modal-footer">
                            <button class="auth-button" onclick="showPaymentModal()" style="width: 100%;">
                                💎 АКТИВИРОВАТЬ PREMIUM
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }, 1500);
        }
    },
    
    /**
     * ПОЛУЧЕНИЕ ОСТАВШИХСЯ ДНЕЙ TRIAL
     */
    getDaysLeft() {
        if (!this.currentUser || this.currentUser.plan !== 'TRIAL') return 0;
        
        const now = Date.now();
        const trialEnd = this.currentUser.trialEnd || 0;
        
        if (trialEnd <= now) return 0;
        
        return Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000));
    },
    
    /**
     * ПРОВЕРКА ИСТЕЧЕНИЯ ПОДПИСКИ
     */
    isSubscriptionExpired(user) {
        if (!user) return true;
        
        const now = Date.now();
        
        if (user.plan === 'PREMIUM') {
            return !user.premiumEnd || user.premiumEnd <= now;
        } else if (user.plan === 'TRIAL') {
            return !user.trialEnd || user.trialEnd <= now;
        }
        
        return true;
    },
    
    /**
     * ОБРАБОТКА ВЫХОДА ПОЛЬЗОВАТЕЛЯ
     */
    handleUserLogout() {
        console.log('👋 Пользователь вышел');
        
        this.currentUser = null;
        
        // Очищаем интерфейс
        const userBadge = document.querySelector('.user-badge');
        if (userBadge) {
            userBadge.innerHTML = '<span>Гость</span>';
        }
        
        // Показываем форму входа
        this.showAuthModal();
    },
    
    /**
     * ПОКАЗ ЗАГРУЗКИ
     */
    showLoading(message = 'Загрузка...') {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div style="text-align: center; max-width: 400px; padding: 30px;">
                    <div style="font-size: 3rem; margin-bottom: 20px; color: #FFD700;">⏳</div>
                    <div style="color: #FFD700; font-size: 1.5rem; font-weight: 800; margin-bottom: 20px;">
                        ${message}
                    </div>
                    <div style="width: 300px; height: 4px; background: rgba(255,215,0,0.2); border-radius: 2px; overflow: hidden; margin: 0 auto;">
                        <div style="height: 100%; background: linear-gradient(90deg, #FFD700, #FFD700); width: 30%; animation: loading 1.5s infinite;"></div>
                    </div>
                    <style>
                        @keyframes loading {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(300%); }
                        }
                    </style>
                </div>
            `;
            loading.style.display = 'flex';
        }
    },
    
    /**
     * СКРЫТИЕ ЗАГРУЗКИ
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    },
    
    /**
     * ПОКАЗ УСПЕХА
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    },
    
    /**
     * ПОКАЗ ОШИБКИ
     */
    showError(message) {
        this.showNotification(message, 'error');
        
        const authError = document.getElementById('auth-error');
        if (authError) {
            authError.textContent = message;
            authError.classList.add('show');
            setTimeout(() => {
                authError.classList.remove('show');
            }, 5000);
        }
    },
    
    /**
     * ПОКАЗ УВЕДОМЛЕНИЯ
     */
    showNotification(message, type = 'info') {
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
            box-shadow: 0 5px 20px rgba(0,0,0,0.5); z-index: 10000;
            max-width: 400px; font-weight: 600;
            animation: slideIn 0.3s ease;
            display: flex; align-items: center; gap: 12px;
        `;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <div style="font-size: 1.2rem;">${icons[type]}</div>
            <div>${message}</div>
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

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthModule;
} else {
    window.AuthModule = AuthModule;
}
