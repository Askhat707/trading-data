// ============================================
// 🔐 МОДУЛЬ АУТЕНТИФИКАЦИИ v10 - ПОЛНЫЙ ИСПРАВЛЕННЫЙ КОД
// СТРУКТУРИРОВАННЫЙ, БЕЗ ОШИБОК, С АВТО-ПРОВЕРКАМИ
// ============================================

console.log('🔐 Загрузка AuthModule v10...');

const AuthModule = {
    // ============ СОСТОЯНИЕ МОДУЛЯ ============
    currentUser: null,
    currentSession: null,
    isInitialized: false,
    subscriptionCheckInterval: null,
    authCheckInterval: null,
    
    // ============ КОНФИГУРАЦИЯ ============
    config: {
        localStorageKey: "gold_options_auth_v10",
        sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 дней
        adminEmail: "omaralinovaskar95@gmail.com",
        adminTelegram: "@ASKHAT_1985",
        trialDays: 3,
        subscriptionCheckInterval: 15 * 60 * 1000, // 15 минут
        authCheckInterval: 60 * 1000 // 1 минута
    },
    
    // ============ ОСНОВНЫЕ МЕТОДЫ ============
    
    /**
     * АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
     */
    async autoInit() {
        try {
            console.group('🚀 AuthModule.autoInit()');
            
            if (this.isInitialized) {
                console.warn('⚠️ AuthModule уже инициализирован');
                return;
            }
            
            // 1. ПРОВЕРКА ВСЕХ ЗАВИСИМОСТЕЙ
            console.log('🔍 Шаг 1: Проверка зависимостей...');
            
            if (!this.checkFirebaseSDK()) {
                this.showFirebaseSDKError();
                return;
            }
            
            if (!this.checkFirebaseConfig()) {
                this.showFirebaseConfigError();
                return;
            }
            
            // 2. ИНИЦИАЛИЗАЦИЯ FIREBASE
            console.log('🔥 Шаг 2: Инициализация Firebase...');
            
            if (!this.initializeFirebase()) {
                this.showFirebaseInitError();
                return;
            }
            
            // 3. НАСТРОЙКА СЛУШАТЕЛЕЙ
            console.log('👂 Шаг 3: Настройка слушателей...');
            this.setupAuthListeners();
            
            // 4. ПРОВЕРКА СУЩЕСТВУЮЩЕЙ СЕССИИ
            console.log('📦 Шаг 4: Проверка существующей сессии...');
            await this.checkExistingSession();
            
            // 5. ЗАПУСК ПЕРИОДИЧЕСКИХ ПРОВЕРОК
            console.log('⏰ Шаг 5: Запуск периодических проверок...');
            this.startPeriodicChecks();
            
            this.isInitialized = true;
            console.log('✅ AuthModule успешно инициализирован!');
            
        } catch (error) {
            console.error('❌ КРИТИЧЕСКАЯ ОШИБКА в autoInit:', error);
            this.showCriticalError(error);
        } finally {
            console.groupEnd();
        }
    },
    
    /**
     * ПРОВЕРКА FIREBASE SDK
     */
    checkFirebaseSDK() {
        console.log('📦 Проверка Firebase SDK...');
        
        // Проверяем наличие глобального объекта firebase
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK не загружен');
            console.error('   Проверь подключение CDN скриптов в index.html:');
            console.error('   - firebase-app-compat.js');
            console.error('   - firebase-auth-compat.js');
            console.error('   - firebase-database-compat.js');
            return false;
        }
        
        // Проверяем необходимые методы
        const requiredMethods = [
            'initializeApp',
            'auth',
            'database'
        ];
        
        for (const method of requiredMethods) {
            if (typeof firebase[method] !== 'function') {
                console.error(`❌ firebase.${method} не доступен`);
                return false;
            }
        }
        
        console.log('✅ Firebase SDK загружен правильно');
        return true;
    },
    
    /**
     * ПРОВЕРКА КОНФИГУРАЦИИ FIREBASE
     */
    /**
 * ПРОВЕРКА КОНФИГУРАЦИИ FIREBASE
 */
checkFirebaseConfig() {
    console.group('⚙️ Проверка конфигурации Firebase');
    
    if (typeof window.firebaseConfig === 'undefined') {
        console.error('❌ window.firebaseConfig не определен');
        console.error('   Файл firebase-config.js не загружен или не создан GitHub Actions');
        console.error('   Проверьте:');
        console.error('   1. Файл firebase-config.js существует в корне проекта');
        console.error('   2. Он подключен в index.html до других скриптов');
        console.error('   3. GitHub Actions создал файл с реальными ключами');
        console.groupEnd();
        return false;
    }
    
    const config = window.firebaseConfig;
    console.log('📄 Конфигурация Firebase:', config);
    
    // Проверяем обязательные поля
    const requiredFields = [
        'apiKey',
        'authDomain',
        'databaseURL',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId'
    ];
    
    let allFieldsValid = true;
    
    for (const field of requiredFields) {
        if (!config[field]) {
            console.error(`❌ Отсутствует поле конфигурации: ${field}`);
            allFieldsValid = false;
            continue;
        }
        
        // Проверяем что это реальные значения, а не заглушки
        if (typeof config[field] === 'string') {
            if (config[field].includes('{{') || 
                config[field].includes('FIREBASE_') || 
                config[field].includes('secrets.')) {
                console.error(`❌ Поле ${field} содержит переменную: ${config[field]}`);
                console.error('   GitHub Secrets не подставлены! Проверьте:');
                console.error('   - Secrets в настройках репозитория');
                console.error('   - Workflow файл deploy.yml');
                console.error('   - Переменные окружения');
                allFieldsValid = false;
            }
        }
    }
    
    if (!allFieldsValid) {
        console.error('❌ Конфигурация Firebase содержит ошибки');
        console.groupEnd();
        return false;
    }
    
    // Дополнительные проверки
    console.log('✅ Конфигурация Firebase корректна');
    console.log(`   Проект: ${config.projectId}`);
    console.log(`   Database: ${config.databaseURL}`);
    console.log(`   Auth Domain: ${config.authDomain}`);
    console.log(`   API Key присутствует: ${config.apiKey ? 'Да' : 'Нет'}`);
    
    // Проверяем формат projectId
    if (config.projectId) {
        console.log(`   Project ID валидный: ${config.projectId.length > 0 ? 'Да' : 'Нет'}`);
    }
    
    console.groupEnd();
    return true;
},
    
    /**
     * ИНИЦИАЛИЗАЦИЯ FIREBASE
     */
    initializeFirebase() {
        try {
            console.log('🔥 Инициализация Firebase App...');
            
            // Проверяем, не инициализирован ли уже Firebase
            if (firebase.apps.length > 0) {
                console.log('✅ Firebase уже инициализирован');
                return true;
            }
            
            // Инициализируем Firebase
            firebase.initializeApp(window.firebaseConfig);
            
            console.log('✅ Firebase успешно инициализирован');
            console.log(`   Apps: ${firebase.apps.length}`);
            console.log(`   Name: ${firebase.apps[0].name}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
            return false;
        }
    },
    
    /**
     * НАСТРОЙКА СЛУШАТЕЛЕЙ АУТЕНТИФИКАЦИИ
     */
    setupAuthListeners() {
        console.log('👂 Настройка слушателей состояния аутентификации...');
        
        firebase.auth().onAuthStateChanged(async (firebaseUser) => {
            console.log('🔄 Изменение состояния аутентификации:',
                       firebaseUser ? `Пользователь: ${firebaseUser.uid}` : 'Нет пользователя');
            
            if (firebaseUser) {
                // Пользователь вошел
                await this.handleUserAuthenticated(firebaseUser);
            } else {
                // Пользователь вышел
                this.handleUserSignedOut();
            }
        });
        
        console.log('✅ Слушатели настроены');
    },
    
    /**
     * ПРОВЕРКА СУЩЕСТВУЮЩЕЙ СЕССИИ
     */
    async checkExistingSession() {
        try {
            console.log('📊 Проверка существующей сессии...');
            
            // 1. Проверяем текущего пользователя Firebase
            const firebaseUser = firebase.auth().currentUser;
            
            if (firebaseUser) {
                console.log(`🔥 Найден активный пользователь Firebase: ${firebaseUser.uid}`);
                await this.handleUserAuthenticated(firebaseUser);
                return;
            }
            
            // 2. Проверяем localStorage
            const savedAuth = this.loadFromLocalStorage();
            
            if (savedAuth && this.validateSavedAuth(savedAuth)) {
                console.log('💾 Восстановление сессии из localStorage...');
                await this.restoreSession(savedAuth);
                return;
            }
            
            // 3. Если ничего нет - показываем форму входа
            console.log('👤 Нет активной сессии, показываем форму входа');
            this.showAuthModal();
            
        } catch (error) {
            console.error('❌ Ошибка проверки сессии:', error);
            this.showAuthModal();
        }
    },
    
    /**
     * ОБРАБОТКА АУТЕНТИФИЦИРОВАННОГО ПОЛЬЗОВАТЕЛЯ
     */
    async handleUserAuthenticated(firebaseUser) {
        try {
            console.group('👤 Обработка аутентифицированного пользователя');
            
            // 1. Получаем данные пользователя из базы
            const userData = await this.getUserDataFromDB(firebaseUser.uid);
            
            if (!userData) {
                console.error('❌ Пользователь не найден в базе данных');
                await this.logout();
                return;
            }
            
            console.log('📊 Данные пользователя из базы:', userData);
            
            // 2. Объединяем данные Firebase Auth и Database
            this.currentUser = this.mergeUserData(firebaseUser, userData);
            
            console.log('👤 Объединенные данные пользователя:', {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                plan: this.currentUser.plan
            });
            
            // 3. Проверяем подписку
            if (this.isSubscriptionExpired(this.currentUser)) {
                console.warn('⏰ Подписка истекла!');
                await this.handleSubscriptionExpired();
                return;
            }
            
            // 4. Создаем сессию
            await this.createSession();
            
            // 5. Сохраняем в localStorage
            this.saveToLocalStorage();
            
            // 6. Обновляем UI
            this.updateUI();
            
            // 7. Запускаем основное приложение
            this.startMainApp();
            
            console.log('✅ Пользователь успешно обработан');
            
        } catch (error) {
            console.error('❌ Ошибка обработки пользователя:', error);
            this.showAuthModal();
        } finally {
            console.groupEnd();
        }
    },
    
    /**
     * ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ИЗ БАЗЫ
     */
    async getUserDataFromDB(userId) {
        try {
            console.log(`📡 Получение данных пользователя ${userId} из Firebase...`);
            
            const snapshot = await firebase.database()
                .ref(`users/${userId}`)
                .once('value');
            
            if (!snapshot.exists()) {
                console.error('❌ Пользователь не найден в базе данных');
                return null;
            }
            
            const userData = snapshot.val();
            console.log('✅ Данные получены:', userData);
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
            
            // Из базы данных
            id: dbData.id || firebaseUser.uid,
            plan: dbData.plan || 'TRIAL',
            premiumEnd: dbData.premiumEnd || 0,
            trialEnd: dbData.trialEnd || (now + (this.config.trialDays * 24 * 60 * 60 * 1000)),
            registered: dbData.registered || now,
            lastLogin: dbData.lastLogin || now,
            
            // Дополнительные поля
            version: dbData.version || 'v6',
            createdBy: dbData.createdBy || 'SYSTEM',
            createdAt: dbData.createdAt || new Date().toISOString(),
            
            // Информация о сессии
            lastCheck: now,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`
        };
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
            ip: 'unknown', // Можно добавить получение IP через внешний сервис
            userAgent: navigator.userAgent
        };
        
        console.log('📝 Создана новая сессия:', sessionId);
        
        // Сохраняем сессию в Firebase (опционально)
        try {
            await firebase.database()
                .ref(`sessions/${sessionId}`)
                .set({
                    userId: this.currentUser.uid,
                    started: now,
                    userPlan: this.currentUser.plan,
                    userAgent: navigator.userAgent
                });
        } catch (error) {
            console.warn('⚠️ Не удалось сохранить сессию в Firebase:', error);
        }
    },
    
    /**
     * ВОССТАНОВЛЕНИЕ СЕССИИ
     */
    async restoreSession(savedAuth) {
        try {
            console.log('🔄 Восстановление сессии из localStorage...');
            
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
            
            // Обновляем данные сессии
            session.lastActivity = Date.now();
            this.currentSession = session;
            this.currentUser = user;
            
            // Обновляем UI
            this.updateUI();
            
            // Запускаем основное приложение
            this.startMainApp();
            
            console.log('✅ Сессия восстановлена');
            
        } catch (error) {
            console.error('❌ Ошибка восстановления сессии:', error);
            this.clearLocalData();
            this.showAuthModal();
        }
    },
    
    /**
     * ВХОД В СИСТЕМУ
     */
    async login(email, password) {
        try {
            console.log(`🔐 Попытка входа: ${email}`);
            
            // Показываем загрузку
            this.showLoading(true);
            
            // Вход через Firebase Auth
            const userCredential = await firebase.auth()
                .signInWithEmailAndPassword(email, password);
            
            console.log('✅ Вход выполнен, UID:', userCredential.user.uid);
            
            // Дальнейшая обработка в handleUserAuthenticated
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
     * ВЫХОД ИЗ СИСТЕМЫ
     */
    async logout() {
        try {
            console.log('👋 Выход из системы...');
            
            // Останавливаем все проверки
            this.stopPeriodicChecks();
            
            // Выход из Firebase
            if (firebase.auth().currentUser) {
                await firebase.auth().signOut();
            }
            
            // Очищаем локальные данные
            this.clearLocalData();
            
            // Показываем форму входа
            this.showAuthModal();
            
            console.log('✅ Выход выполнен');
            
        } catch (error) {
            console.error('❌ Ошибка выхода:', error);
        }
    },
    
    /**
     * ОБРАБОТКА ИСТЕЧЕНИЯ ПОДПИСКИ
     */
    async handleSubscriptionExpired() {
        console.log('⏰ Обработка истечения подписки...');
        
        // Выходим из Firebase
        await firebase.auth().signOut();
        
        // Очищаем локальные данные
        this.clearLocalData();
        
        // Показываем сообщение об истечении подписки
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.98); backdrop-filter: blur(20px);
            display: flex; justify-content: center; align-items: center;
            z-index: 10001;
        `;
        
        modal.innerHTML = `
            <div class="auth-container" style="text-align: center; max-width: 500px;">
                <div style="font-size: 3rem; color: #FFD700; margin-bottom: 20px;">⏰</div>
                <h1 style="color: #FFD700; margin-bottom: 15px; font-size: 2rem;">
                    ПОДПИСКА ИСТЕКЛА
                </h1>
                <p style="color: #ccc; font-size: 1.1rem; margin-bottom: 30px; line-height: 1.6;">
                    Ваша подписка на Gold Options Pro завершена.<br>
                    Для продолжения работы требуется активировать PREMIUM.
                </p>
                
                <div style="background: rgba(255,215,0,0.1); border: 2px solid var(--gold); 
                    border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <div style="color: var(--gold); font-weight: 700; margin-bottom: 10px;">
                        📞 КОНТАКТ АДМИНИСТРАТОРА:
                    </div>
                    <div style="font-size: 1.5rem; color: #fff; font-weight: 800;">
                        @ASKHAT_1985
                    </div>
                    <button onclick="copyToClipboard('@ASKHAT_1985')" 
                        style="margin-top: 15px; padding: 8px 20px; background: rgba(255,215,0,0.2);
                        border: 1px solid var(--gold); color: var(--gold); border-radius: 6px;
                        cursor: pointer; font-weight: 600;">
                        📋 Скопировать Telegram
                    </button>
                </div>
                
                <button onclick="window.open('https://t.me/ASKHAT_1985', '_blank')" 
                    class="auth-button" style="background: var(--gradient-gold); color: #000; 
                    font-weight: 800; margin-top: 30px; width: 100%; font-size: 1.1rem;">
                    📲 Написать в Telegram
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Через 5 секунд показываем форму входа
        setTimeout(() => {
            if (modal.parentElement) {
                document.body.removeChild(modal);
            }
            this.showAuthModal();
        }, 5000);
    },
    
    /**
     * ЗАПУСК ОСНОВНОГО ПРИЛОЖЕНИЯ
     */
    startMainApp() {
        console.log('🚀 Запуск основного приложения...');
        
        if (window.app && typeof window.app.init === 'function') {
            setTimeout(() => {
                window.app.init();
            }, 1000);
        } else {
            console.error('❌ Основное приложение не найдено!');
            console.error('   Проверьте подключение js/app.js');
        }
    },
    
    // ============ ПЕРИОДИЧЕСКИЕ ПРОВЕРКИ ============
    
    /**
     * ЗАПУСК ПЕРИОДИЧЕСКИХ ПРОВЕРОК
     */
    startPeriodicChecks() {
        console.log('⏱️ Запуск периодических проверок...');
        
        // Проверка подписки каждые 15 минут
        this.subscriptionCheckInterval = setInterval(() => {
            this.checkSubscriptionStatus();
        }, this.config.subscriptionCheckInterval);
        
        // Проверка аутентификации каждую минуту
        this.authCheckInterval = setInterval(() => {
            this.checkAuthStatus();
        }, this.config.authCheckInterval);
        
        console.log('✅ Периодические проверки запущены');
    },
    
    /**
     * ПРОВЕРКА СТАТУСА ПОДПИСКИ
     */
    async checkSubscriptionStatus() {
        if (!this.currentUser) return;
        
        try {
            console.log('🔍 Проверка статуса подписки...');
            
            // Получаем свежие данные пользователя
            const freshUserData = await this.getUserDataFromDB(this.currentUser.uid);
            
            if (!freshUserData) {
                console.error('❌ Пользователь удален из базы');
                await this.logout();
                return;
            }
            
            // Обновляем данные пользователя
            const firebaseUser = firebase.auth().currentUser;
            this.currentUser = this.mergeUserData(firebaseUser, freshUserData);
            
            // Проверяем подписку
            if (this.isSubscriptionExpired(this.currentUser)) {
                console.warn('⏰ Подписка истекла во время сессии!');
                await this.handleSubscriptionExpired();
                return;
            }
            
            // Обновляем UI
            this.updateHeaderUI();
            
            // Обновляем ограничения в приложении
            if (window.app) {
                window.app.isTrial = this.currentUser.plan !== "PREMIUM" || 
                                    this.isSubscriptionExpired(this.currentUser);
                if (window.app.updateUIForUserType) {
                    window.app.updateUIForUserType();
                }
            }
            
            console.log('✅ Подписка активна, осталось дней:', this.getDaysLeft());
            
        } catch (error) {
            console.error('❌ Ошибка проверки подписки:', error);
        }
    },
    
    /**
     * ПРОВЕРКА СТАТУСА АУТЕНТИФИКАЦИИ
     */
    async checkAuthStatus() {
        try {
            const firebaseUser = firebase.auth().currentUser;
            
            if (!firebaseUser) {
                console.warn('⚠️ Пользователь Firebase не найден, перезапуск...');
                this.showAuthModal();
                return;
            }
            
            // Проверяем токен
            await firebaseUser.getIdToken(true);
            
        } catch (error) {
            console.error('❌ Ошибка проверки аутентификации:', error);
            this.showAuthModal();
        }
    },
    
    /**
     * ОСТАНОВКА ПЕРИОДИЧЕСКИХ ПРОВЕРОК
     */
    stopPeriodicChecks() {
        console.log('🛑 Остановка периодических проверок...');
        
        if (this.subscriptionCheckInterval) {
            clearInterval(this.subscriptionCheckInterval);
            this.subscriptionCheckInterval = null;
        }
        
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
        }
        
        console.log('✅ Периодические проверки остановлены');
    },
    
    // ============ УТИЛИТЫ ============
    
    /**
     * ГЕНЕРАЦИЯ ПОДПИСИ СЕССИИ
     */
    generateSessionSignature(userId, timestamp) {
        const data = `${userId}_${timestamp}_gold_options_pro_v10_secure`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    },
    
    /**
     * ПОЛУЧЕНИЕ ОСТАВШИХСЯ ДНЕЙ ПОДПИСКИ
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
     * ПОЛУЧЕНИЕ ТЕКСТА ОШИБКИ
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
    
    // ============ LOCALSTORAGE МЕТОДЫ ============
    
    /**
     * СОХРАНЕНИЕ В LOCALSTORAGE
     */
    saveToLocalStorage() {
        if (!this.currentUser) return;
        
        const data = {
            user: this.currentUser,
            session: this.currentSession,
            savedAt: Date.now(),
            version: "v10.0"
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
    
    // ============ UI МЕТОДЫ ============
    
    /**
     * ПОКАЗ ФОРМЫ АУТЕНТИФИКАЦИИ
     */
    showAuthModal() {
        console.log('👁️ Показ формы аутентификации...');
        
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    },
    
    /**
     * СКРЫТИЕ ФОРМЫ АУТЕНТИФИКАЦИИ
     */
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },
    
    /**
     * ОБНОВЛЕНИЕ UI
     */
    updateUI() {
        console.log('🎨 Обновление UI...');
        
        // Скрываем модальное окно аутентификации
        this.hideAuthModal();
        
        // Показываем основной контент
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
            mainContent.classList.add('visible');
        }
        
        // Скрываем лоадер
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        
        // Обновляем информацию в хедере
        this.updateHeaderUI();
        
        console.log('✅ UI обновлен');
    },
    
    /**
     * ОБНОВЛЕНИЕ ХЕДЕРА
     */
    updateHeaderUI() {
        if (!this.currentUser) return;
        
        try {
            // Email в хедере
            const emailEl = document.getElementById('header-user-email');
            if (emailEl) {
                emailEl.textContent = this.currentUser.email;
            }
            
            // План в хедере
            const planEl = document.getElementById('header-user-plan');
            if (planEl) {
                const daysLeft = this.getDaysLeft();
                const isPremium = this.currentUser.plan === "PREMIUM" && 
                                !this.isSubscriptionExpired(this.currentUser);
                
                if (isPremium) {
                    planEl.textContent = `⭐ PREMIUM (${daysLeft}д)`;
                    planEl.className = 'user-plan plan-premium';
                } else {
                    planEl.textContent = `🔒 TRIAL (${daysLeft}д)`;
                    planEl.className = 'user-plan plan-trial';
                }
            }
            
            // Бейдж пользователя
            const badge = document.getElementById('header-user-badge');
            if (badge) {
                badge.classList.remove('premium');
                if (this.currentUser.plan === "PREMIUM" && 
                    !this.isSubscriptionExpired(this.currentUser)) {
                    badge.classList.add('premium');
                }
            }
            
            // Email в модальном окне
            const userEmailDisplay = document.getElementById('user-email-display');
            if (userEmailDisplay) {
                userEmailDisplay.textContent = this.currentUser.email;
            }
            
            // План в модальном окне
            const userPlanDisplay = document.getElementById('user-plan-display');
            if (userPlanDisplay) {
                const daysLeft = this.getDaysLeft();
                const isPremium = this.currentUser.plan === "PREMIUM" && 
                                !this.isSubscriptionExpired(this.currentUser);
                
                if (isPremium) {
                    userPlanDisplay.textContent = `PREMIUM (${daysLeft} дней)`;
                    userPlanDisplay.className = 'user-plan plan-premium';
                } else {
                    userPlanDisplay.textContent = `TRIAL (${daysLeft} дней)`;
                    userPlanDisplay.className = 'user-plan plan-trial';
                }
            }
            
        } catch (error) {
            console.error('❌ Ошибка обновления UI:', error);
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
                authButton.innerHTML = '<span>🔓 ВОЙТИ</span>';
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
            
            setTimeout(() => {
                errorEl.classList.remove('show');
            }, 5000);
        }
    },
    
    // ============ ОБРАБОТКА ВЫХОДА ============
    
    /**
     * ОБРАБОТКА ВЫХОДА ПОЛЬЗОВАТЕЛЯ
     */
    handleUserSignedOut() {
        console.log('👋 Пользователь вышел из системы');
        
        this.stopPeriodicChecks();
        this.currentUser = null;
        this.currentSession = null;
        this.clearLocalData();
        
        this.showAuthModal();
    },
    
    // ============ ОБРАБОТКА ОШИБОК ============
    
    /**
     * ПОКАЗ ОШИБКИ FIREBASE SDK
     */
    showFirebaseSDKError() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; color: #ff4444;">❌</div>
                    <h2 style="color: #ff4444; margin: 20px 0;">Firebase SDK Error</h2>
                    <p style="color: #ccc;">Не удалось загрузить Firebase SDK</p>
                    <div style="background: rgba(255,68,68,0.1); padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 500px; text-align: left; color: #888;">
                        <p><strong>Возможные причины:</strong></p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Проблемы с интернет соединением</li>
                            <li>Блокировка CDN скриптов</li>
                            <li>Ошибка в подключении скриптов в index.html</li>
                        </ul>
                    </div>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; 
                        background: #FFD700; color: #000; border: none; border-radius: 5px; 
                        cursor: pointer; font-weight: bold;">
                        🔄 Перезагрузить
                    </button>
                </div>
            `;
        }
    },
    
    /**
     * ПОКАЗ ОШИБКИ КОНФИГУРАЦИИ FIREBASE
     */
    showFirebaseConfigError() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; color: #ff4444;">❌</div>
                    <h2 style="color: #ff4444; margin: 20px 0;">Configuration Error</h2>
                    <p style="color: #ccc;">Не удалось загрузить конфигурацию Firebase</p>
                    <div style="background: rgba(255,68,68,0.1); padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 500px; text-align: left; color: #888;">
                        <p><strong>Проверьте:</strong></p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>GitHub Secrets настроены правильно</li>
                            <li>Файл firebase-config.js создается при деплое</li>
                            <li>Все FIREBASE_* ключи добавлены в Secrets</li>
                            <li>Workflow файл .github/workflows/deploy.yml</li>
                        </ul>
                        <p style="margin-top: 10px;">
                            <strong>Текущий статус:</strong><br>
                            <span id="config-status">Проверка...</span>
                        </p>
                    </div>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; 
                        background: #FFD700; color: #000; border: none; border-radius: 5px; 
                        cursor: pointer; font-weight: bold;">
                        🔄 Перезагрузить
                    </button>
                    <button onclick="window.open('https://github.com/askhat707/trading-data/settings/secrets/actions', '_blank')" 
                        style="margin-top: 10px; padding: 10px 20px; background: #333; color: #fff; 
                        border: 1px solid #555; border-radius: 5px; cursor: pointer; display: block; margin-left: auto; margin-right: auto;">
                        ⚙️ Проверить GitHub Secrets
                    </button>
                </div>
            `;
            
            // Динамическая проверка конфигурации
            setTimeout(() => {
                const statusEl = document.getElementById('config-status');
                if (statusEl) {
                    if (typeof window.firebaseConfig === 'undefined') {
                        statusEl.innerHTML = '<span style="color:#ff4444">❌ window.firebaseConfig не определен</span>';
                    } else if (window.firebaseConfig.apiKey.includes('FIREBASE_')) {
                        statusEl.innerHTML = '<span style="color:#ff9900">⚠️  Секреты не подставлены (значения FIREBASE_*)</span>';
                    } else {
                        statusEl.innerHTML = '<span style="color:#00cc00">✅ Конфигурация найдена</span>';
                    }
                }
            }, 1000);
        }
    },
    
    /**
     * ПОКАЗ ОШИБКИ ИНИЦИАЛИЗАЦИИ FIREBASE
     */
    showFirebaseInitError() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; color: #ff4444;">❌</div>
                    <h2 style="color: #ff4444; margin: 20px 0;">Firebase Init Error</h2>
                    <p style="color: #ccc;">Не удалось инициализировать Firebase</p>
                    <div style="background: rgba(255,68,68,0.1); padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 500px; text-align: left; color: #888;">
                        <p><strong>Возможные причины:</strong></p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Неверные ключи Firebase</li>
                            <li>Проект Firebase не существует</li>
                            <li>Ограничения безопасности (CORS)</li>
                            <li>Проблемы с интернет соединением</li>
                        </ul>
                    </div>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; 
                        background: #FFD700; color: #000; border: none; border-radius: 5px; 
                        cursor: pointer; font-weight: bold;">
                        🔄 Перезагрузить
                    </button>
                </div>
            `;
        }
    },
    
    /**
     * ПОКАЗ КРИТИЧЕСКОЙ ОШИБКИ
     */
    showCriticalError(error) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; color: #ff4444;">💥</div>
                    <h2 style="color: #ff4444; margin: 20px 0;">Critical Error</h2>
                    <p style="color: #ccc;">Произошла критическая ошибка при инициализации</p>
                    <div style="background: rgba(255,68,68,0.1); padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 500px; text-align: left; color: #888; font-family: monospace; font-size: 0.9rem;">
                        ${error.toString()}
                    </div>
                    <div style="margin-top: 20px;">
                        <button onclick="location.reload()" style="padding: 10px 20px; 
                            background: #FFD700; color: #000; border: none; border-radius: 5px; 
                            cursor: pointer; font-weight: bold; margin: 5px;">
                            🔄 Перезагрузить
                        </button>
                        <button onclick="window.open('https://t.me/ASKHAT_1985', '_blank')" 
                            style="padding: 10px 20px; background: #333; color: #fff; 
                            border: 1px solid #555; border-radius: 5px; cursor: pointer; margin: 5px;">
                            📞 Техподдержка
                        </button>
                    </div>
                </div>
            `;
        }
    },
    
    /**
     * ДЕБАГ-ИНФОРМАЦИЯ
     */
    debugInfo() {
        console.group('🔍 AuthModule Debug Info');
        console.log('isInitialized:', this.isInitialized);
        console.log('currentUser:', this.currentUser);
        console.log('currentSession:', this.currentSession);
        console.log('firebaseConfig:', window.firebaseConfig);
        console.log('firebase.apps:', firebase?.apps?.length);
        console.log('localStorage:', this.loadFromLocalStorage());
        console.groupEnd();
    }
};

// ============ ГЛОБАЛЬНЫЙ ЭКСПОРТ ============
window.AuthModule = AuthModule;

// ============ АВТОМАТИЧЕСКИЙ ЗАПУСК ============
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM полностью загружен, запуск AuthModule...');
    
    // Даем время на загрузку всех скриптов
    setTimeout(() => {
        if (window.AuthModule && typeof AuthModule.autoInit === 'function') {
            console.log('🚀 Вызов AuthModule.autoInit()...');
            AuthModule.autoInit();
        } else {
            console.error('❌ AuthModule не найден или autoInit недоступен');
            
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                loadingEl.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 3rem; color: #ff4444;">❌</div>
                        <h2 style="color: #ff4444; margin: 20px 0;">Module Error</h2>
                        <p style="color: #ccc;">Модуль аутентификации не загружен</p>
                        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; 
                            background: #FFD700; color: #000; border: none; border-radius: 5px; 
                            cursor: pointer; font-weight: bold;">
                            🔄 Перезагрузить
                        </button>
                    </div>
                `;
            }
        }
    }, 1000);
});

// ============ ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ ============

/**
 * ОБРАБОТЧИК ВХОДА (вызывается из HTML формы)
 */
window.handleLogin = function(event) {
    event.preventDefault();
    
    const email = document.getElementById('user-email')?.value?.trim();
    const password = document.getElementById('user-password')?.value?.trim();
    
    if (!email || !password) {
        AuthModule.showError('❌ Заполните все поля');
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        AuthModule.showError('❌ Введите правильный email');
        return;
    }
    
    AuthModule.login(email, password);
};

/**
 * ОБРАБОТЧИК ВЫХОДА (вызывается из HTML кнопки)
 */
window.handleLogout = function() {
    if (window.AuthModule && typeof AuthModule.logout === 'function') {
        AuthModule.logout();
    } else {
        console.error('AuthModule.logout не доступен');
        location.reload();
    }
};

/**
 * ДЕБАГ ФУНКЦИЯ ДЛЯ РАЗРАБОТЧИКА
 */
window.debugAuth = function() {
    if (window.AuthModule && typeof AuthModule.debugInfo === 'function') {
        AuthModule.debugInfo();
    } else {
        console.log('AuthModule не загружен');
    }
};

console.log('✅ AuthModule v10 загружен и готов к работе');
