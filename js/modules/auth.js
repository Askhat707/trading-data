// ============================================
// 🔐 МОДУЛЬ АУТЕНТИФИКАЦИИ - ПОЛНЫЙ АВТОЗАПУСК
// ============================================

const AuthModule = {
    // Состояние
    currentUser: null,
    currentSession: null,
    isInitialized: false,
    
    // Конфигурация
    config: {
        localStorageKey: "gold_options_auth_v9",
        sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 дней
        adminEmail: "omaralinovaskar95@gmail.com",
        adminTelegram: "@ASKHAT_1985",
        trialDays: 3
    },
    
    /**
     * АВТО-ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
     */
    async autoInit() {
        if (this.isInitialized) return;
        
        console.log('🚀 Авто-инициализация AuthModule...');
        
        // 1. Проверяем Firebase SDK
        if (!this.isFirebaseSDKLoaded()) {
            console.error('❌ Firebase SDK не загружен');
            this.showFirebaseError();
            return;
        }
        
        // 2. Проверяем конфигурацию Firebase
        if (!window.firebaseConfig || !window.firebaseConfig.apiKey) {
            console.error('❌ Firebase конфигурация не найдена');
            this.showConfigError();
            return;
        }
        
        // 3. Инициализируем Firebase
        if (!this.isFirebaseInitialized()) {
            try {
                firebase.initializeApp(window.firebaseConfig);
                console.log('✅ Firebase инициализирован');
            } catch (error) {
                console.error('❌ Ошибка инициализации Firebase:', error);
                this.showFirebaseError();
                return;
            }
        }
        
        // 4. Запускаем основной процесс аутентификации
        await this.startAuthProcess();
        
        this.isInitialized = true;
        console.log('✅ AuthModule полностью инициализирован');
    },
    
    /**
     * ПРОВЕРКА: ЗАГРУЖЕН ЛИ FIREBASE SDK
     */
    isFirebaseSDKLoaded() {
        return typeof firebase !== 'undefined' && 
               typeof firebase.initializeApp === 'function' &&
               typeof firebase.auth === 'function' &&
               typeof firebase.database === 'function';
    },
    
    /**
     * ПРОВЕРКА: ИНИЦИАЛИЗИРОВАН ЛИ FIREBASE
     */
    isFirebaseInitialized() {
        return firebase.apps && firebase.apps.length > 0;
    },
    
    /**
     * ОСНОВНОЙ ПРОЦЕСС АУТЕНТИФИКАЦИИ
     */
    async startAuthProcess() {
        try {
            console.log('🔄 Запуск процесса аутентификации...');
            
            // Настраиваем слушатель изменений аутентификации
            this.setupAuthListener();
            
            // Проверяем существующую сессию
            await this.checkExistingSession();
            
        } catch (error) {
            console.error('❌ Ошибка старта процесса аутентификации:', error);
            this.showAuthModal();
        }
    },
    
    /**
     * НАСТРОЙКА СЛУШАТЕЛЯ ИЗМЕНЕНИЙ АУТЕНТИФИКАЦИИ
     */
    setupAuthListener() {
        firebase.auth().onAuthStateChanged(async (firebaseUser) => {
            console.log('🔄 Изменение состояния аутентификации:', 
                       firebaseUser ? `USER: ${firebaseUser.uid}` : 'NO USER');
            
            if (firebaseUser) {
                await this.handleUserAuthenticated(firebaseUser);
            } else {
                this.handleUserSignedOut();
            }
        });
    },
    
    /**
     * ПРОВЕРКА СУЩЕСТВУЮЩЕЙ СЕССИИ
     */
    async checkExistingSession() {
        // 1. Проверяем localStorage
        const savedAuth = this.loadFromLocalStorage();
        
        if (savedAuth && this.validateSavedAuth(savedAuth)) {
            console.log('📦 Восстановление сессии из localStorage');
            await this.restoreSession(savedAuth);
            return;
        }
        
        // 2. Проверяем текущую сессию Firebase
        const firebaseUser = firebase.auth().currentUser;
        
        if (firebaseUser) {
            console.log('🔥 Обнаружен активный пользователь Firebase');
            await this.handleUserAuthenticated(firebaseUser);
            return;
        }
        
        // 3. Показываем форму входа
        console.log('📋 Показываем форму входа');
        this.showAuthModal();
    },
    
    /**
     * ОБРАБОТКА УСПЕШНОЙ АУТЕНТИФИКАЦИИ
     */
    async handleUserAuthenticated(firebaseUser) {
        try {
            console.log('👤 Обработка аутентифицированного пользователя:', firebaseUser.uid);
            
            // 1. Получаем данные из базы
            const userData = await this.getUserDataFromDB(firebaseUser.uid);
            
            if (!userData) {
                console.error('❌ Пользователь не найден в базе данных');
                await this.logout();
                return;
            }
            
            // 2. Объединяем данные
            this.currentUser = this.mergeUserData(firebaseUser, userData);
            
            // 3. Проверяем подписку
            if (this.isSubscriptionExpired(this.currentUser)) {
                console.warn('⏰ Подписка истекла');
                await this.handleSubscriptionExpired();
                return;
            }
            
            // 4. Создаем/обновляем сессию
            await this.createSession();
            
            // 5. Сохраняем в localStorage
            this.saveToLocalStorage();
            
            // 6. Обновляем UI
            this.updateUI();
            
            console.log('✅ Пользователь успешно аутентифицирован и проверен');
            
            // 7. Запускаем основное приложение
            this.startMainApp();
            
        } catch (error) {
            console.error('❌ Ошибка обработки пользователя:', error);
            this.showAuthModal();
        }
    },
    
    /**
     * ОБРАБОТКА ИСТЕЧЕНИЯ ПОДПИСКИ
     */
    async handleSubscriptionExpired() {
        // Выходим из Firebase
        await firebase.auth().signOut();
        
        // Очищаем локальные данные
        this.clearLocalData();
        
        // Показываем сообщение
        alert('⏰ Ваша подписка истекла!\n\nДля продолжения использования обновите подписку до PREMIUM.\n\nСвяжитесь с администратором: @ASKHAT_1985');
        
        // Показываем форму входа
        this.showAuthModal();
    },
    
    /**
     * ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ИЗ БАЗЫ
     */
    async getUserDataFromDB(userId) {
        try {
            const snapshot = await firebase.database().ref(`users/${userId}`).once('value');
            
            if (!snapshot.exists()) {
                console.error('❌ Запись пользователя не найдена в Firebase Database');
                return null;
            }
            
            const userData = snapshot.val();
            console.log('📊 Данные пользователя из базы:', userData);
            return userData;
            
        } catch (error) {
            console.error('❌ Ошибка получения данных пользователя:', error);
            return null;
        }
    },
    
    /**
     * ОБЪЕДИНЕНИЕ ДАННЫХ FIREBASE AUTH И DATABASE
     */
    mergeUserData(firebaseUser, dbData) {
        const now = Date.now();
        
        return {
            // Из Firebase Auth
            uid: firebaseUser.uid,
            email: firebaseUser.email || dbData.email,
            emailVerified: firebaseUser.emailVerified || false,
            
            // Из базы данных (ваши поля)
            id: dbData.id || firebaseUser.uid,
            email: dbData.email || firebaseUser.email,
            plan: dbData.plan || 'TRIAL',
            premiumEnd: dbData.premiumEnd || 0,
            trialEnd: dbData.trialEnd || (now + (this.config.trialDays * 24 * 60 * 60 * 1000)),
            registered: dbData.registered || now,
            lastLogin: dbData.lastLogin || now,
            lastCheck: now,
            ip: dbData.ip || 'unknown',
            country: dbData.country || 'unknown',
            timezone: dbData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            createdBy: dbData.createdBy || 'SYSTEM',
            createdAt: dbData.createdAt || new Date().toISOString(),
            
            // Дополнительные поля
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`
        };
    },
    
    /**
     * ВХОД ПО EMAIL И ПАРОЛЮ
     */
    async login(email, password) {
        try {
            console.log('🔐 Попытка входа:', email);
            
            // Показываем загрузку
            this.showLoading(true);
            
            // Вход в Firebase Auth
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            
            console.log('✅ Вход выполнен успешно, UID:', userCredential.user.uid);
            
            // Дальнейшая обработка будет в handleUserAuthenticated
            return { success: true };
            
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            
            let errorMessage = this.getErrorMessage(error);
            this.showError(errorMessage);
            
            return { 
                success: false, 
                error: errorMessage 
            };
        } finally {
            this.showLoading(false);
        }
    },
    
    /**
     * СОЗДАНИЕ СЕССИИ
     */
    async createSession() {
        if (!this.currentUser) return;
        
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const now = Date.now();
        
        this.currentSession = {
            id: sessionId,
            userId: this.currentUser.uid,
            started: now,
            lastActivity: now,
            userPlan: this.currentUser.plan,
            userEmail: this.currentUser.email,
            signature: this.generateSessionSignature(this.currentUser.uid, now),
            ip: this.currentUser.ip || 'unknown',
            userAgent: navigator.userAgent
        };
        
        console.log('📝 Создана новая сессия:', sessionId);
    },
    
    /**
     * ВОССТАНОВЛЕНИЕ СЕССИИ ИЗ LOCALSTORAGE
     */
    async restoreSession(savedAuth) {
        try {
            const user = savedAuth.user;
            const session = savedAuth.session;
            
            // Проверяем подпись сессии
            const expectedSignature = this.generateSessionSignature(session.userId, session.started);
            if (session.signature !== expectedSignature) {
                console.warn('⚠️ Недействительная подпись сессии');
                this.clearLocalData();
                this.showAuthModal();
                return;
            }
            
            // Проверяем время жизни сессии
            const sessionAge = Date.now() - session.started;
            if (sessionAge > this.config.sessionDuration) {
                console.warn('⏰ Сессия истекла');
                this.clearLocalData();
                this.showAuthModal();
                return;
            }
            
            // Проверяем, совпадает ли пользователь с Firebase Auth
            const firebaseUser = firebase.auth().currentUser;
            if (firebaseUser && firebaseUser.uid !== session.userId) {
                console.warn('⚠️ Несоответствие UID сессии и Firebase');
                this.clearLocalData();
                this.showAuthModal();
                return;
            }
            
            // Обновляем сессию
            session.lastActivity = Date.now();
            this.currentSession = session;
            this.currentUser = user;
            
            // Обновляем UI
            this.updateUI();
            
            console.log('✅ Сессия восстановлена из localStorage');
            
            // Запускаем приложение
            this.startMainApp();
            
        } catch (error) {
            console.error('❌ Ошибка восстановления сессии:', error);
            this.clearLocalData();
            this.showAuthModal();
        }
    },
    
    /**
     * ПРОВЕРКА СОХРАНЕННЫХ ДАННЫХ
     */
    validateSavedAuth(savedAuth) {
        if (!savedAuth || !savedAuth.user || !savedAuth.session) {
            return false;
        }
        
        // Проверяем необходимые поля пользователя
        const requiredUserFields = ['uid', 'email', 'plan'];
        for (const field of requiredUserFields) {
            if (!savedAuth.user[field]) {
                console.warn(`⚠️ Отсутствует поле пользователя: ${field}`);
                return false;
            }
        }
        
        // Проверяем необходимые поля сессии
        const requiredSessionFields = ['userId', 'started', 'signature'];
        for (const field of requiredSessionFields) {
            if (!savedAuth.session[field]) {
                console.warn(`⚠️ Отсутствует поле сессии: ${field}`);
                return false;
            }
        }
        
        return true;
    },
    
    /**
     * ВЫХОД ИЗ СИСТЕМЫ
     */
    async logout() {
        try {
            console.log('👋 Выход из системы...');
            
            // Выход из Firebase
            if (firebase.auth().currentUser) {
                await firebase.auth().signOut();
            }
            
            // Очистка локальных данных
            this.clearLocalData();
            
            // Показываем форму входа
            setTimeout(() => {
                this.showAuthModal();
            }, 300);
            
            console.log('✅ Выход выполнен');
            
        } catch (error) {
            console.error('❌ Ошибка выхода:', error);
        }
    },
    
    /**
     * ОБРАБОТКА ВЫХОДА ПОЛЬЗОВАТЕЛЯ
     */
    handleUserSignedOut() {
        console.log('👋 Пользователь вышел из системы');
        
        this.currentUser = null;
        this.currentSession = null;
        
        // Очищаем localStorage
        this.clearLocalData();
        
        // Показываем форму входа
        this.showAuthModal();
    },
    
    /**
     * ГЕНЕРАЦИЯ ПОДПИСИ СЕССИИ
     */
    generateSessionSignature(userId, timestamp) {
        const data = `${userId}_${timestamp}_gold_options_pro_v2_secure`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    },
    
    /**
     * ПРОВЕРКА ПОДПИСКИ
     */
    isSubscriptionExpired(user) {
        if (!user) return true;
        
        const now = Date.now();
        const plan = user.plan;
        
        if (plan === "PREMIUM" && user.premiumEnd) {
            return now > user.premiumEnd;
        } else if (plan === "TRIAL" && user.trialEnd) {
            return now > user.trialEnd;
        }
        
        return true;
    },
    
    /**
     * ПОЛУЧЕНИЕ КОЛИЧЕСТВА ОСТАВШИХСЯ ДНЕЙ
     */
    getDaysLeft(user = this.currentUser) {
        if (!user) return 0;
        
        const now = Date.now();
        let endDate = 0;
        
        if (user.plan === "PREMIUM" && user.premiumEnd) {
            endDate = user.premiumEnd;
        } else if (user.plan === "TRIAL" && user.trialEnd) {
            endDate = user.trialEnd;
        }
        
        if (!endDate) return 0;
        
        const diff = endDate - now;
        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        return Math.max(0, daysLeft);
    },
    
    /**
     * ПОЛУЧЕНИЕ ПОНЯТНОГО СООБЩЕНИЯ ОБ ОШИБКЕ
     */
    getErrorMessage(error) {
        if (!error || !error.code) return 'Неизвестная ошибка';
        
        const messages = {
            'auth/invalid-email': '❌ Неверный формат email',
            'auth/user-disabled': '❌ Аккаунт заблокирован',
            'auth/user-not-found': '❌ Пользователь не найден',
            'auth/wrong-password': '❌ Неверный пароль',
            'auth/too-many-requests': '⏳ Слишком много попыток. Попробуйте позже',
            'auth/network-request-failed': '🌐 Ошибка сети. Проверьте интернет',
            'auth/operation-not-allowed': '🚫 Этот метод входа отключен',
            'auth/internal-error': '🔥 Внутренняя ошибка Firebase'
        };
        
        return messages[error.code] || error.message || 'Неизвестная ошибка';
    },
    
    /**
     * СОХРАНЕНИЕ В LOCALSTORAGE
     */
    saveToLocalStorage() {
        if (!this.currentUser) return;
        
        const data = {
            user: this.currentUser,
            session: this.currentSession,
            savedAt: Date.now(),
            version: "v9.0"
        };
        
        try {
            localStorage.setItem(this.config.localStorageKey, JSON.stringify(data));
            console.log('💾 Данные сохранены в localStorage');
        } catch (error) {
            console.error('❌ Ошибка сохранения в localStorage:', error);
        }
    },
    
    /**
     * ЗАГРУЗКА ИЗ LOCALSTORAGE
     */
    loadFromLocalStorage() {
        try {
            const dataStr = localStorage.getItem(this.config.localStorageKey);
            if (!dataStr) return null;
            
            return JSON.parse(dataStr);
        } catch (error) {
            console.error('❌ Ошибка загрузки из localStorage:', error);
            return null;
        }
    },
    
    /**
     * ОЧИСТКА ЛОКАЛЬНЫХ ДАННЫХ
     */
    clearLocalData() {
        localStorage.removeItem(this.config.localStorageKey);
        this.currentUser = null;
        this.currentSession = null;
        console.log('🧹 Локальные данные очищены');
    },
    
    /**
     * ЗАПУСК ОСНОВНОГО ПРИЛОЖЕНИЯ
     */
    startMainApp() {
        if (window.app && typeof app.init === 'function') {
            console.log('🚀 Запуск основного приложения...');
            setTimeout(() => {
                app.init();
            }, 500);
        } else {
            console.error('❌ Основное приложение не найдено');
        }
    },
    
    /**
     * ОБНОВЛЕНИЕ UI
     */
    updateUI() {
        // Скрываем модальное окно аутентификации
        this.hideAuthModal();
        
        // Показываем основной контент
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.add('visible');
        }
        
        // Обновляем информацию в хедере
        this.updateHeaderUI();
    },
    
    /**
     * ОБНОВЛЕНИЕ ХЕДЕРА
     */
    updateHeaderUI() {
        if (!this.currentUser) return;
        
        try {
            // Email
            const emailEl = document.getElementById('header-user-email');
            if (emailEl) {
                emailEl.textContent = this.currentUser.email;
            }
            
            // План
            const planEl = document.getElementById('header-user-plan');
            if (planEl) {
                const daysLeft = this.getDaysLeft();
                const isPremium = this.currentUser.plan === "PREMIUM" && 
                                !this.isSubscriptionExpired(this.currentUser);
                
                if (isPremium) {
                    planEl.textContent = `PREMIUM (${daysLeft}д)`;
                    planEl.className = 'user-plan plan-premium';
                } else {
                    planEl.textContent = `TRIAL (${daysLeft}д осталось)`;
                    planEl.className = 'user-plan plan-trial';
                }
            }
            
            // Бейдж
            const badge = document.getElementById('header-user-badge');
            if (badge) {
                badge.classList.remove('premium');
                if (this.currentUser.plan === "PREMIUM" && 
                    !this.isSubscriptionExpired(this.currentUser)) {
                    badge.classList.add('premium');
                }
            }
            
        } catch (error) {
            console.error('❌ Ошибка обновления UI:', error);
        }
    },
    
    /**
     * ПОКАЗ ФОРМЫ ВХОДА
     */
    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.remove('visible');
        }
    },
    
    /**
     * СКРЫТИЕ ФОРМЫ ВХОДА
     */
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },
    
    /**
     * ПОКАЗ ЗАГРУЗКИ
     */
    showLoading(show) {
        const authButton = document.getElementById('auth-button');
        if (authButton) {
            if (show) {
                authButton.disabled = true;
                authButton.innerHTML = '<span>⏳ Загрузка...</span>';
            } else {
                authButton.disabled = false;
                authButton.innerHTML = '<span>ВОЙТИ</span>';
            }
        }
    },
    
    /**
     * ПОКАЗ ОШИБКИ
     */
    showError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            
            // Автоматическое скрытие через 5 секунд
            setTimeout(() => {
                errorEl.classList.remove('show');
            }, 5000);
        }
    },
    
    /**
     * ПОКАЗ ОШИБКИ FIREBASE
     */
    showFirebaseError() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; color: #ff4444;">❌</div>
                    <h2 style="color: #ff4444; margin: 20px 0;">Firebase Error</h2>
                    <p>Не удалось загрузить Firebase SDK</p>
                    <p style="color: #888;">Проверьте интернет соединение</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #FFD700; color: #000; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        🔄 Перезагрузить
                    </button>
                </div>
            `;
        }
    },
    
    /**
     * ПОКАЗ ОШИБКИ КОНФИГУРАЦИИ
     */
    showConfigError() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; color: #ff4444;">❌</div>
                    <h2 style="color: #ff4444; margin: 20px 0;">Configuration Error</h2>
                    <p>Не удалось загрузить конфигурацию Firebase</p>
                    <div style="background: rgba(255,68,68,0.1); padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 500px; text-align: left;">
                        <p><strong>Проверьте:</strong></p>
                        <ul>
                            <li>GitHub Secrets настроены правильно</li>
                            <li>Скрипт generate-config.js работает</li>
                            <li>Файл firebase-config.js создается</li>
                        </ul>
                    </div>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #FFD700; color: #000; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        🔄 Перезагрузить
                    </button>
                </div>
            `;
        }
    }
};

// ГЛОБАЛЬНЫЙ ЭКСПОРТ
window.AuthModule = AuthModule;

// АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Страница загружена, запуск AuthModule...');
    
    // Ждем немного чтобы все скрипты загрузились
    setTimeout(() => {
        if (window.AuthModule && typeof AuthModule.autoInit === 'function') {
            AuthModule.autoInit();
        } else {
            console.error('❌ AuthModule не найден!');
        }
    }, 500);
});

// ОБРАБОТЧИКИ СОБЫТИЙ ДЛЯ HTML ФОРМЫ
window.handleLogin = function(event) {
    event.preventDefault();
    
    const email = document.getElementById('user-email')?.value?.trim();
    const password = document.getElementById('user-password')?.value?.trim();
    
    if (!email || !password) {
        AuthModule.showError('❌ Заполните все поля');
        return;
    }
    
    if (!email.includes('@')) {
        AuthModule.showError('❌ Введите правильный email');
        return;
    }
    
    AuthModule.login(email, password);
};

window.handleLogout = function() {
    AuthModule.logout();
};

window.showTermsModal = function() {
    alert('📄 Условия использования\n\n1. Использование только для личного трейдинга\n2. Запрещено копирование данных\n3. Ответственность за решения лежит на пользователе');
};

window.showPrivacyModal = function() {
    alert('🔒 Политика конфиденциальности\n\n1. Мы не передаем ваши данные третьим лицам\n2. Данные хранятся в зашифрованном виде\n3. Вы можете запросить удаление данных');
};

window.showAboutModal = function() {
    alert('💰 Gold Options Pro v2\n\nПрофессиональный терминал для анализа опционов\nВерсия: 2.0\nРазработчик: ASKHAT_1985\nTelegram: @ASKHAT_1985');
};

window.openTelegram = function() {
    window.open('https://t.me/ASKHAT_1985', '_blank');
};
