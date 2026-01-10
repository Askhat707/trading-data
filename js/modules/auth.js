// ============================================
// 🔐 МОДУЛЬ АУТЕНТИФИКАЦИИ V11 - ФИНАЛЬНЫЙ
// ============================================

const AuthModule = {
    config: {
        trialDays: 3,
        localStorageKey: 'gold_options_pro_auth_v11',
        sessionTimeout: 30 * 24 * 60 * 60 * 1000,
        adminEmail: 'omaralinovaskar95@gmail.com',
        adminTelegram: '@ASKHAT_1985',
        version: 'v11'
    },
    
    currentUser: null,
    isInitializing: false,
    isLoggingOut: false,
    isManualLogin: false,
    authListenerActive: false,
    
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
            console.log('🔐 [AUTH] Начало автоинициализации v11...');
            
            // Шаг 1: Ждем Firebase
            await this.waitForFirebase();
            
            // Шаг 2: Настраиваем persistence
            await this.setupPersistence();
            
            // Шаг 3: ВСЕГДА показываем форму входа при загрузке
            console.log('🔓 [AUTH] Показываем форму входа при загрузке');
            this.showAuthModal();
            
            // Шаг 4: Инициализируем обработчики (после показа формы!)
            this.initAuthHandlers();
            
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
     * ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ - ИСПРАВЛЕНО
     * СЛУШАЕМ изменения состояния ПОСЛЕ инициализации
     */
    initAuthHandlers() {
        if (this.authListenerActive) {
            console.log('⚠️ [AUTH] Слушатель уже активен');
            return;
        }
        
        console.log('🔄 [AUTH] Инициализация обработчиков...');
        
        try {
            const auth = firebase.auth();
            
            // Добавляем обработчик изменения состояния
            auth.onAuthStateChanged(async (firebaseUser) => {
                console.log('👤 [AUTH] onAuthStateChanged:', firebaseUser ? firebaseUser.email : 'null');
                
                // ИСПРАВЛЕНИЕ: Не обрабатываем если идет логаут или ручной вход
                if (this.isLoggingOut) {
                    console.log('⏸️ [AUTH] Игнорируем - идет логаут');
                    return;
                }
                
                if (this.isManualLogin) {
                    console.log('⏸️ [AUTH] Игнорируем - идет ручной вход');
                    return;
                }
                
                // Если пользователь авторизован
                if (firebaseUser && this.currentUser && this.currentUser.id === firebaseUser.uid) {
                    console.log('✅ [AUTH] Пользователь уже загружен, пропускаем');
                    return;
                }
                
                if (firebaseUser && !this.currentUser) {
                    console.log('✅ [AUTH] Обнаружена активная сессия, загружаем данные...');
                    await this.handleUserLogin(firebaseUser);
                } else if (!firebaseUser && !this.isLoggingOut) {
                    console.log('⚠️ [AUTH] Сессия потеряна, показываем форму входа');
                    this.handleUserLogout();
                }
            });
            
            this.authListenerActive = true;
            console.log('✅ [AUTH] Обработчики инициализированы');
        } catch (error) {
            console.error('❌ [AUTH] Ошибка инициализации обработчиков:', error);
        }
    },
    
    /**
     * ВХОД ПОЛЬЗОВАТЕЛЯ - ИСПРАВЛЕНО
     */
    async login(email, password, silent = false) {
        console.log(`🔐 [AUTH] Попытка входа: ${email}`);
        
        // Устанавливаем флаг ручного входа
        this.isManualLogin = true;
        
        if (!silent) {
            this.showAuthLoading('Вход в систему...');
        }
        
        try {
            // Авторизуемся
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const firebaseUser = userCredential.user;
            
            console.log('✅ [AUTH] Авторизация успешна:', firebaseUser.email);
            
            // Загружаем данные
            await this.handleUserLogin(firebaseUser);
            
            if (!silent) {
                this.hideAuthLoading();
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка входа:', error.code, error.message);
            
            if (!silent) {
                this.hideAuthLoading();
                this.showAuthError(this.getAuthErrorMessage(error));
            }
            
            return false;
        } finally {
            // ВАЖНО: Отключаем флаг после входа
            this.isManualLogin = false;
        }
    },
    
    /**
 * ОБРАБОТКА УСПЕШНОГО ВХОДА - ИСПРАВЛЕННАЯ
 */
async handleUserLogin(firebaseUser) {
    console.log('👤 [AUTH] Загрузка данных пользователя:', firebaseUser.email);
    
    try {
        // ТОЛЬКО ЧИТАЕМ из БД
        const userRef = firebase.database().ref(`users/${firebaseUser.uid}`);
        const snapshot = await userRef.once('value');
        
        if (!snapshot.exists()) {
            console.error('❌ [AUTH] Пользователь не найден в базе данных');
            
            // Выходим
            await firebase.auth().signOut();
            
            this.showAuthError(
                `❌ Ваш аккаунт не активирован.\n\n` +
                `Обратитесь к администратору:\n` +
                `📧 ${this.config.adminEmail}\n` +
                `💬 ${this.config.adminTelegram}`
            );
            
            this.handleUserLogout();
            return false;
        }
        
        // ✅ Пользователь найден
        const userData = snapshot.val();
        
        console.log('📊 [AUTH] Данные загружены:');
        console.log('   План:', userData.plan);
        console.log('   Email:', userData.email);
        
        // Проверяем подписку
        if (this.isSubscriptionExpired(userData)) {
            console.warn('⚠️ [AUTH] Подписка истекла');
            userData.plan = 'TRIAL';
            if (!userData.trialEnd || userData.trialEnd < Date.now()) {
                userData.trialEnd = Date.now() + (this.config.trialDays * 24 * 60 * 60 * 1000);
            }
        }
        
        // Добавляем ID и email
        userData.id = firebaseUser.uid;
        userData.email = firebaseUser.email;
        
        // Сохраняем в модуле
        this.currentUser = userData;
        this.status.authChecked = true;
        
        console.log('✅ [AUTH] Пользователь успешно загружен, показываем интерфейс');
        
        // Показываем интерфейс
        this.showMainInterface();
        this.updateUserUI();
        
        // 🔥 ГЛАВНОЕ: Запускаем приложение после авторизации!
        console.log('🚀 [AUTH] Запуск основного приложения...');
        if (window.app && typeof window.app.init === 'function') {
            console.log('   ✅ app.init() найден, запускаем...');
            await window.app.init();
            console.log('   ✅ app.init() завершен');
        } else {
            console.error('   ❌ app.init() не найден!');
            console.error('   Доступные методы:', Object.keys(window.app || {}));
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [AUTH] Ошибка обработки входа:', error.message);
        
        this.showAuthError('Ошибка загрузки данных: ' + error.message);
        
        // Выходим
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
     * ВЫХОД ПОЛЬЗОВАТЕЛЯ - ИСПРАВЛЕНО
     */
    async logout() {
        console.log('🚪 [AUTH] Процесс выхода...');
        
        this.isLoggingOut = true;
        
        try {
            // Выходим из Firebase
            await firebase.auth().signOut();
            console.log('✅ [AUTH] Выход из Firebase выполнен');
            
            // Очищаем данные
            this.currentUser = null;
            this.status.authChecked = false;
            
            // Очищаем приложение
            if (window.app && window.app.cleanup) {
                window.app.cleanup();
            }
            
            // Показываем форму входа
            console.log('🔓 [AUTH] Показываем форму входа');
            this.showAuthModal();
            
            console.log('✅ [AUTH] Выход завершен');
            
        } catch (error) {
            console.error('❌ [AUTH] Ошибка выхода:', error);
        } finally {
            // ВАЖНО: Отключаем флаг после выхода
            this.isLoggingOut = false;
        }
    },
    
    /**
     * ОБРАБОТКА ВЫХОДА
     */
    handleUserLogout() {
        console.log('👋 [AUTH] Пользователь разлогирован');
        this.currentUser = null;
        this.status.authChecked = true;
        this.showAuthModal();
    },
    
    /**
     * ПОКАЗ ОСНОВНОГО ИНТЕРФЕЙСА
     */
    showMainInterface() {
        try {
            console.log('🖥️ [UI] Показ основного интерфейса');
            
            // Скрываем форму входа
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.add('hidden');
                authModal.style.display = 'none';
                authModal.style.opacity = '0';
                authModal.style.visibility = 'hidden';
                authModal.style.pointerEvents = 'none';
            }
            
            // Показываем основной контент
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
                mainContent.style.opacity = '1';
                mainContent.style.visibility = 'visible';
                mainContent.style.pointerEvents = 'auto';
            }
            
            console.log('✅ [UI] Интерфейс показан');
        } catch (error) {
            console.error('❌ [UI] Ошибка показа интерфейса:', error);
        }
    },
    
    /**
     * ПОКАЗ ОКНА ВХОДА
     */
    showAuthModal() {
        try {
            console.log('🔓 [UI] Показываем форму входа');
            
            // Скрываем основной контент
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'none';
                mainContent.style.opacity = '0';
                mainContent.style.visibility = 'hidden';
                mainContent.style.pointerEvents = 'none';
            }
            
            // Показываем окно входа
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.remove('hidden');
                authModal.style.display = 'flex';
                authModal.style.opacity = '1';
                authModal.style.visibility = 'visible';
                authModal.style.pointerEvents = 'auto';
                
                // Очищаем поля
                const emailInput = document.getElementById('user-email');
                const passwordInput = document.getElementById('user-password');
                const errorEl = document.getElementById('auth-error');
                
                if (emailInput) emailInput.value = '';
                if (passwordInput) passwordInput.value = '';
                if (errorEl) {
                    errorEl.classList.remove('show');
                    errorEl.innerHTML = '';
                }
                
                console.log('✅ [UI] Форма входа готова');
            } else {
                console.error('❌ [UI] Элемент auth-modal не найден!');
            }
        } catch (error) {
            console.error('❌ [UI] Ошибка при показе формы:', error);
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
            
            const logoutBtn = document.getElementById('header-logout');
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
            }
            
            console.log('✅ [UI] UI обновлен');
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
     * ПОКАЗ ОШИБКИ
     */
    showAuthError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.innerHTML = message.replace(/\n/g, '<br>');
            errorEl.classList.add('show');
        }
    },
    
    /**
     * ЗАГРУЗКА КНОПКИ
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
            'auth/user-not-found': '❌ Пользователь не найден',
            'auth/wrong-password': '❌ Неверный пароль',
            'auth/invalid-email': '❌ Неверный email',
            'auth/user-disabled': '❌ Аккаунт отключен',
            'auth/too-many-requests': '⏳ Слишком много попыток',
            'auth/invalid-credential': '❌ Email или пароль неверны',
            'auth/network-request-failed': '⚠️ Ошибка сети',
        };
        return messages[error.code] || `❌ Ошибка: ${error.message}`;
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
    
    await AuthModule.login(email, password);
    return false;
};

window.handleLogout = function() {
    AuthModule.logout();
};

window.AuthModule = AuthModule;
console.log('✅ [AUTH] Модуль аутентификации загружен (v11)');
