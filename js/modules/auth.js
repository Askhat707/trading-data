// ============================================
// 🔐 СИСТЕМА АУТЕНТИФИКАЦИИ V6.1
// ============================================

const AuthSystem = {
    // Конфигурация
    config: {
        adminEmail: "omaralinovaskar95@gmail.com",
        adminTelegram: "@ASKHAT_1985",
        trialDays: 3,
        localStorageKey: "gold_options_auth_v6",
        userCheckInterval: 5 * 60 * 1000, // 5 минут
        activityCheckInterval: 30 * 1000, // 30 секунд
        maxInactiveDays: 365,
        realtimeSync: true
    },

    // Текущее состояние
    currentUser: null,
    currentSession: null,
    initialized: false,
    checkTimer: null,
    activityTimer: null,
    logoutInProgress: false,
    
    /**
     * Инициализация системы аутентификации
     */
    async init() {
        if (this.initialized) {
            console.log("⚠️ AuthSystem уже инициализирован");
            return;
        }
        
        this.initialized = true;
        console.log("🔐 Запуск системы аутентификации v6.1...");
        
        try {
            // Инициализируем Firebase модуль
            if (!FirebaseModule.init()) {
                throw new Error('Не удалось инициализировать Firebase');
            }
            
            // Проверяем сохраненную сессию
            const savedAuth = this.loadFromLocalStorage();
            
            if (savedAuth && savedAuth.user && savedAuth.session) {
                console.log("📦 Восстановление из localStorage:", savedAuth.user.email);
                await this.restoreSession(savedAuth);
            } else {
                console.log("📋 Новый пользователь или сессия истекла");
                this.showAuthModal();
            }
            
            // Настраиваем обработчики событий Firebase
            this.setupFirebaseListeners();
            
            // Привязываем обработчики событий
            this.attachEventHandlers();
            
            console.log("✅ Система аутентификации инициализирована");
            
        } catch (error) {
            console.error("❌ Критическая ошибка инициализации:", error);
            this.showAuthModal();
        }
    },
    
    /**
     * Настройка слушателей Firebase
     */
    setupFirebaseListeners() {
        // Слушатель изменения состояния аутентификации
        FirebaseModule.auth.onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
                console.log("🟢 Firebase сессия активна для:", firebaseUser.email);
                // Автоматически восстанавливаем только если нет текущего пользователя
                if (!this.currentUser) {
                    this.restoreSessionFromFirebase(firebaseUser);
                }
            } else {
                console.log("🔴 Firebase сессия неактивна");
            }
        });
    },
    
    /**
     * Восстановление сессии из сохраненных данных
     */
    async restoreSession(savedAuth) {
        const user = savedAuth.user;
        const session = savedAuth.session;
        
        try {
            console.log("🔄 Начинаем восстановление сессии для:", user.email);
            
            // 1. Проверяем подлинность сессии
            if (!this.validateSessionSignature(session)) {
                console.log("❌ Недействительная сессия");
                this.clearLocalData();
                this.showAuthModal();
                return;
            }
            
            // 2. Проверяем, не истекла ли сессия (максимум 7 дней)
            const sessionAge = Date.now() - session.started;
            const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 дней
            
            if (sessionAge > maxSessionAge) {
                console.log("⏰ Сессия истекла");
                this.clearLocalData();
                this.showAuthModal();
                return;
            }
            
            // 3. Проверяем подписку ПО ЛОКАЛЬНЫМ ДАННЫМ
            if (this.isSubscriptionExpired(user)) {
                console.log("⏰ Подписка истекла в localStorage");
                this.clearLocalData();
                this.showSubscriptionExpiredModal(user);
                return;
            }
            
            // 4. Обновляем данные сессии (ЛОКАЛЬНО, без Firebase)
            this.currentUser = user;
            this.currentSession = session;
            this.currentSession.lastActivity = Date.now();
            
            // 5. Обновляем UI (СНАЧАЛА это, чтобы пользователь не видел модальное окно)
            this.hideAuthModal();
            this.updateUserUI();
            
            // 6. Запускаем проверки
            this.startPeriodicChecks();
            
            // 7. Инициализируем приложение
            setTimeout(() => {
                if (typeof app !== 'undefined' && !app.initialized) {
                    app.init();
                }
            }, 500);
            
            console.log("✅ Сессия восстановлена из localStorage");
            
        } catch (error) {
            console.error("❌ ОШИБКА восстановления сессии:", error);
            this.clearLocalData();
            this.showAuthModal();
        }
    },
    
    /**
     * Восстановление сессии из Firebase
     */
    async restoreSessionFromFirebase(firebaseUser) {
        try {
            console.log("🔄 Восстановление сессии из Firebase для:", firebaseUser.email);
            
            // 1️⃣ Получаем пользователя из базы данных
            const dbUser = await FirebaseModule.getUserData(firebaseUser.uid);
            
            if (!dbUser) {
                console.error("❌ Пользователь не найден в базе данных");
                await FirebaseModule.auth.signOut();
                this.clearLocalData();
                this.showAuthModal();
                return;
            }
            
            // 2️⃣ Объединяем данные
            this.currentUser = this.mergeUserData(
                { id: firebaseUser.uid, email: firebaseUser.email },
                dbUser
            );
            
            // 3️⃣ Проверяем подписку
            if (this.isSubscriptionExpired(this.currentUser)) {
                console.log("⏰ Подписка истекла");
                await FirebaseModule.auth.signOut();
                this.clearLocalData();
                this.showSubscriptionExpiredModal(this.currentUser);
                return;
            }
            
            // 4️⃣ Создаем сессию (ЛОКАЛЬНО, без Firebase)
            await this.createLocalSession();
            
            // 5️⃣ Сохраняем локально
            this.saveToLocalStorage();
            
            // 6️⃣ Запускаем проверки
            this.startPeriodicChecks();
            
            // 7️⃣ Обновляем UI (СНАЧАЛА это!)
            this.hideAuthModal();
            setTimeout(() => this.updateUserUI(), 500);
            
            // 8️⃣ Инициализируем приложение
            setTimeout(() => {
                if (typeof app !== 'undefined' && !app.initialized) {
                    app.init();
                }
            }, 1000);
            
            console.log("✅ Сессия восстановлена из Firebase!");
            
        } catch (error) {
            console.error("❌ Ошибка восстановления из Firebase:", error);
            this.clearLocalData();
            this.showAuthModal();
        }
    },
    
    /**
     * Создание локальной сессии
     */
    async createLocalSession() {
        if (!this.currentUser) return;
        
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const now = Date.now();
        
        this.currentSession = {
            id: sessionId,
            userId: this.currentUser.id,
            started: now,
            lastActivity: now,
            userPlan: this.currentUser.plan,
            userEmail: this.currentUser.email,
            // Добавляем подпись для проверки подлинности
            signature: this.generateSessionSignature(this.currentUser.id, now)
        };
        
        console.log("✅ Локальная сессия создана:", sessionId);
    },
    
    /**
     * Генерация подписи сессии
     */
    generateSessionSignature(userId, timestamp) {
        // Простая подпись для проверки подлинности сессии
        const data = `${userId}_${timestamp}_${this.config.sessionSecret || 'gold_options_pro_v2'}`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    },
    
    /**
     * Проверка подписи сессии
     */
    validateSessionSignature(session) {
        // Если нет подписи - значит старая сессия (до добавления подписи)
        // Принимаем её как валидную для совместимости
        if (!session || !session.signature) {
            console.log("⚠️ Сессия без подписи (старая версия)");
            return true; // Принимаем старые сессии
        }
        
        const expected = this.generateSessionSignature(session.userId, session.started);
        const isValid = session.signature === expected;
        
        if (!isValid) {
            console.log("❌ Недействительная подпись сессии");
        }
        
        return isValid;
    },
    
    /**
     * Регистрация пользователя
     */
    async register() {
        const emailInput = document.getElementById('user-email');
        const passInput = document.getElementById('user-password');
        const button = document.getElementById('register-btn');
        const termsCheckbox = document.getElementById('terms-checkbox');
        
        if (!emailInput || !button || !passInput) {
            console.error("❌ Элементы формы не найдены");
            return;
        }
        
        const email = emailInput.value.trim().toLowerCase();
        const password = passInput.value.trim();
        
        // ✅ Валидация EMAIL
        if (!this.validateEmail(email)) {
            this.showError("Введите корректный email адрес");
            return;
        }
        
        // ✅ Валидация ПАРОЛЯ
        if (password.length < 6) {
            this.showError("Пароль должен быть минимум 6 символов");
            return;
        }
        
        // ✅ Проверка согласия с условиями
        if (!termsCheckbox || !termsCheckbox.checked) {
            this.showError("Необходимо согласиться с условиями использования");
            return;
        }
        
        button.disabled = true;
        button.innerHTML = '⏳ Проверка...';
        
        try {
            console.log("🔍 Попытка регистрации для:", email);
            
            // Показываем модальное окно для триала
            showTrialModal();
            button.disabled = false;
            button.innerHTML = 'Начать 3-дневный триал';
            
        } catch (error) {
            console.error("❌ Ошибка регистрации:", error);
            this.showError("Ошибка: " + error.message);
            button.disabled = false;
            button.innerHTML = 'Начать 3-дневный триал';
        }
    },
    
    /**
     * Вход пользователя
     */
    async login() {
        const emailInput = document.getElementById('user-email');
        const passInput = document.getElementById('user-password');
        const button = document.getElementById('login-btn');
        
        if (!emailInput || !button || !passInput) {
            console.error("❌ Элементы формы не найдены");
            return;
        }
        
        const email = emailInput.value.trim().toLowerCase();
        const password = passInput.value.trim();
        
        // ✅ Валидация EMAIL
        if (!this.validateEmail(email)) {
            this.showError("Введите корректный email адрес");
            return;
        }
        
        // ✅ Валидация ПАРОЛЯ
        if (!password) {
            this.showError("Введите пароль");
            return;
        }
        
        button.disabled = true;
        button.innerHTML = '⏳ Проверка доступа...';
        
        try {
            console.log("🔐 Попытка входа для:", email);
            
            // 1️⃣ Пытаемся войти в Firebase Authentication
            const userCredential = await FirebaseModule.auth.signInWithEmailAndPassword(email, password);
            const firebaseUser = userCredential.user;
            
            console.log("✅ Firebase Authentication успешно!");
            
            // 2️⃣ ПРОВЕРЯЕМ ПОЛЬЗОВАТЕЛЯ В БАЗЕ ДАННЫХ
            const dbUser = await FirebaseModule.getUserData(firebaseUser.uid);
            
            if (!dbUser) {
                throw new Error("Ваша подписка не найдена в базе. Напишите админу.");
            }
            
            console.log("✅ Пользователь найден в Database!");
            
            // 3️⃣ ОБЪЕДИНЯЕМ ДАННЫЕ
            this.currentUser = this.mergeUserData(
                { id: firebaseUser.uid, email: firebaseUser.email },
                dbUser
            );
            
            // 4️⃣ ПРОВЕРЯЕМ СТАТУС ПОДПИСКИ
            const status = this.getSubscriptionStatus(this.currentUser);
            console.log("📊 Статус подписки:", status);
            
            if (status === "EXPIRED") {
                await FirebaseModule.auth.signOut();
                this.showError("Подписка истекла. Пожалуйста, оплатите подписку.");
                button.disabled = false;
                button.innerHTML = 'Войти';
                
                setTimeout(() => {
                    this.showSubscriptionExpiredModal(this.currentUser);
                }, 1500);
                return;
            }
            
            // 5️⃣ ВСЕ ОК - ЗАВЕРШАЕМ ВХОД
            await this.completeLogin(this.currentUser);
            
            if (status === "PREMIUM_ACTIVE") {
                this.showSuccessMessage("👑 PREMIUM вход выполнен!");
            } else {
                this.showSuccessMessage("📝 TRIAL вход выполнен!");
            }
            
            console.log("✅ ВХОД УСПЕШНО!");
            
        } catch (error) {
            console.error("❌ Ошибка входа:", error);
            
            let msg = "Ошибка входа.";
            if (error.code === 'auth/wrong-password') msg = "❌ Неверный пароль.";
            if (error.code === 'auth/user-not-found') msg = "❌ Пользователь не найден.";
            if (error.code === 'auth/invalid-email') msg = "❌ Некорректный email.";
            if (error.code === 'auth/user-disabled') msg = "❌ Аккаунт заблокирован.";
            if (error.code === 'auth/too-many-requests') msg = "⏳ Слишком много попыток. Попробуйте позже.";
            
            this.showError(msg);
            button.disabled = false;
            button.innerHTML = 'Войти';
        }
    },
    
    /**
     * Завершение процесса входа
     */
    async completeLogin(user) {
        try {
            console.log("🔑 Завершаем процесс входа для:", user.email);
            
            this.currentUser = user;
            
            // 1. Обновляем lastLogin локально
            this.currentUser.lastLogin = Date.now();
            this.currentUser.lastCheck = Date.now();
            console.log("✅ LastLogin обновлен локально");
            
            // 2. Создаем локальную сессию (БЕЗ Firebase!)
            await this.createLocalSession();
            console.log("✅ Локальная сессия создана");
            
            // 3. Сохраняем пользователя локально
            this.saveToLocalStorage();
            console.log("✅ Данные сохранены локально");
            
            // 4. Запускаем периодические проверки (БЕЗ обновления активности в Firebase)
            this.startPeriodicChecks();
            console.log("✅ Периодические проверки запущены");
            
            // 5. Скрываем модальное окно
            setTimeout(() => {
                this.hideAuthModal();
                console.log("✅ Auth модальное окно скрыто");
            }, 300);
            
            // 6. Обновляем UI
            setTimeout(() => {
                this.updateUserUI();
                console.log("✅ UI пользователя обновлен");
            }, 500);
            
            // 7. Инициализируем приложение
            setTimeout(() => {
                if (typeof app !== 'undefined' && !app.initialized) {
                    console.log("🚀 Инициализируем приложение...");
                    app.init();
                }
                
                console.log("✅ ВХОД УСПЕШНО для:", this.currentUser.email);
            }, 800);
            
        } catch (error) {
            console.error("❌ Ошибка в completeLogin:", error);
            this.showError("Ошибка входа: " + error.message);
        }
    },
    
    /**
     * Обновление UI пользователя
     */
    updateUserUI() {
        console.log("🎨 Обновляем UI пользователя...");
        
        if (!this.currentUser) {
            console.warn("⚠️ currentUser не определен, пропускаем обновление UI");
            return;
        }
        
        try {
            // 1️⃣ Обновляем EMAIL в хедере
            const emailEl = document.getElementById('header-user-email');
            if (emailEl) {
                emailEl.textContent = this.currentUser.email;
                console.log("✅ Email обновлен:", this.currentUser.email);
            }
            
            // 2️⃣ Обновляем ПЛАН И ДНИ в хедере
            const planEl = document.getElementById('header-user-plan');
            if (planEl) {
                const daysLeft = this.getDaysLeft();
                const isPremium = this.currentUser.plan === "PREMIUM" && 
                                !this.isSubscriptionExpired(this.currentUser);
                
                if (isPremium) {
                    planEl.textContent = `PREMIUM (${daysLeft}д)`;
                    planEl.className = 'user-plan plan-premium';
                    console.log("✅ PREMIUM статус установлен, дней:", daysLeft);
                } else {
                    planEl.textContent = `TRIAL (${daysLeft}д осталось)`;
                    planEl.className = 'user-plan plan-trial';
                    console.log("✅ TRIAL статус установлен, дней:", daysLeft);
                }
            }
            
            // 3️⃣ Обновляем БЕЙДЖ в хедере
            const badge = document.getElementById('header-user-badge');
            if (badge) {
                badge.classList.remove('premium');
                
                if (this.currentUser.plan === "PREMIUM" && 
                    !this.isSubscriptionExpired(this.currentUser)) {
                    badge.classList.add('premium');
                    console.log("✅ PREMIUM бейдж активирован");
                } else {
                    console.log("✅ TRIAL бейдж установлен");
                }
            }
            
            // 4️⃣ Обновляем блокировки контента (PREMIUM функции)
            if (window.app && window.app.updateUIForUserType) {
                app.updateUIForUserType();
            }
            
            // 5️⃣ Показываем TRIAL уведомление если нужно
            const daysLeft = this.getDaysLeft();
            if (this.currentUser.plan === "TRIAL" && daysLeft > 0) {
                this.showTrialNotification(daysLeft);
                console.log("ℹ️ TRIAL уведомление показано");
            } else if (this.currentUser.plan === "PREMIUM") {
                this.removeTrialNotification();
                console.log("✅ PREMIUM уведомление скрыто");
            }
            
            console.log("✅ UI полностью обновлен!");
            
        } catch (error) {
            console.error("❌ Ошибка при обновлении UI:", error);
        }
    },
    
    /**
     * Проверка истекла ли подписка
     */
    isSubscriptionExpired(user) {
        if (!user) return true;
        
        const now = Date.now();
        const plan = user.plan;
        
        if (plan === "PREMIUM" && user.premiumEnd) {
            return now >= user.premiumEnd;
        } else if (plan === "TRIAL" && user.trialEnd) {
            return now >= user.trialEnd;
        }
        
        return true;
    },
    
    /**
     * Получение статуса подписки
     */
    getSubscriptionStatus(user = this.currentUser) {
        if (!user) return "NO_USER";
        
        if (this.isSubscriptionExpired(user)) {
            return "EXPIRED";
        }
        
        return user.plan === "PREMIUM" ? "PREMIUM_ACTIVE" : "TRIAL_ACTIVE";
    },
    
    /**
     * Получение количества оставшихся дней
     */
    getDaysLeft(user = this.currentUser) {
        if (!user) return 0;
        
        const now = Date.now();
        let endDate = null;
        
        if (user.plan === "PREMIUM" && user.premiumEnd) {
            endDate = user.premiumEnd;
        } else if (user.plan === "TRIAL" && user.trialEnd) {
            endDate = user.trialEnd;
        }
        
        if (!endDate) return 0;
        
        const diff = endDate - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    },
    
    /**
     * Показать модальное окно аутентификации
     */
    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('auth-step-1').style.display = 'block';
            document.getElementById('auth-step-2').style.display = 'none';
            
            const emailInput = document.getElementById('user-email');
            const passInput = document.getElementById('user-password');
            if (emailInput) emailInput.value = '';
            if (passInput) passInput.value = '';
        }
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.classList.remove('visible');
    },
    
    /**
     * Скрыть модальное окно аутентификации
     */
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('hidden');
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.classList.add('visible');
    },
    
    /**
     * Показать уведомление об ошибке
     */
    showError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
            setTimeout(() => errorEl.classList.remove('show'), 5000);
        }
    },
    
    /**
     * Показать сообщение об успехе
     */
    showSuccessMessage(message) {
        const step1 = document.getElementById('auth-step-1');
        const step2 = document.getElementById('auth-step-2');
        
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';
        
        if (this.currentUser) {
            const displayEmail = document.getElementById('display-email');
            const userPlanDisplay = document.getElementById('user-plan-display');
            
            if (displayEmail) displayEmail.textContent = this.currentUser.email;
            if (userPlanDisplay) userPlanDisplay.textContent = this.getSubscriptionInfo();
        }
    },
    
    /**
     * Получение информации о подписке
     */
    getSubscriptionInfo() {
        if (!this.currentUser) return "Нет пользователя";
        
        const daysLeft = this.getDaysLeft();
        
        if (this.currentUser.plan === "PREMIUM") {
            return `PREMIUM (${daysLeft} ${this.getDayWord(daysLeft)})`;
        } else if (this.currentUser.plan === "TRIAL") {
            return `TRIAL (${daysLeft} ${this.getDayWord(daysLeft)} осталось)`;
        }
        
        return this.currentUser.plan || "UNKNOWN";
    },
    
    /**
     * Получение правильного склонения слова "день"
     */
    getDayWord(days) {
        if (days % 10 === 1 && days % 100 !== 11) return 'день';
        if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return 'дня';
        return 'дней';
    },
    
    /**
     * Показать уведомление о триале
     */
    showTrialNotification(daysLeft = null) {
        if (!daysLeft) daysLeft = this.getDaysLeft();
        if (daysLeft <= 0) return;
        
        const existing = document.querySelector('.trial-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'trial-notification';
        notification.innerHTML = `
            <button class="trial-notification-close" onclick="this.parentElement.remove()">×</button>
            <div class="trial-notification-title">⚡ TRIAL РЕЖИМ</div>
            <div class="trial-notification-text">
                Доступны только базовые функции. ${daysLeft} ${this.getDayWord(daysLeft)} осталось до окончания триала.
                Для полного доступа обновитесь до PREMIUM
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) notification.remove();
        }, 10000);
    },
    
    /**
     * Удалить уведомление о триале
     */
    removeTrialNotification() {
        const notification = document.querySelector('.trial-notification');
        if (notification) notification.remove();
    },
    
    /**
     * Валидация email
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Объединение данных пользователя
     */
    mergeUserData(localUser, firebaseUser) {
        // Приоритет: Firebase > LocalStorage
        const merged = {
            id: firebaseUser.id || localUser.id,
            email: firebaseUser.email || localUser.email,
            plan: firebaseUser.plan || localUser.plan,
            premiumEnd: firebaseUser.premiumEnd || localUser.premiumEnd,
            trialEnd: firebaseUser.trialEnd || localUser.trialEnd,
            registered: firebaseUser.registered || localUser.registered,
            lastLogin: Date.now(),
            lastCheck: Date.now(),
            ip: firebaseUser.ip || localUser.ip,
            country: firebaseUser.country || localUser.country,
            timezone: firebaseUser.timezone || localUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        return merged;
    },
    
    /**
     * Запуск периодических проверок
     */
    startPeriodicChecks() {
        if (this.checkTimer) clearInterval(this.checkTimer);
        
        this.checkTimer = setInterval(async () => {
            if (!this.currentUser) {
                clearInterval(this.checkTimer);
                return;
            }
            
            console.log("🔍 Периодическая проверка...");
            
            // Обновляем активность сессии только локально
            if (this.currentSession) {
                this.currentSession.lastActivity = Date.now();
            }
            
            // Проверяем пользователя в базе данных
            try {
                const dbUser = await FirebaseModule.getUserData(this.currentUser.id);
                if (!dbUser) {
                    console.log("❌ Пользователь удален из базы");
                    this.logout();
                    this.showError("Ваш аккаунт был удален. Пожалуйста, зарегистрируйтесь снова.");
                    return;
                }
                
                // Обновляем данные пользователя из Firebase
                this.currentUser = this.mergeUserData(this.currentUser, dbUser);
                
                // Проверяем подписку
                if (this.isSubscriptionExpired(this.currentUser)) {
                    console.log("⏰ Подписка истекла");
                    this.logout();
                    this.showSubscriptionExpiredModal(this.currentUser);
                    return;
                }
                
                this.saveToLocalStorage();
                this.updateUserUI();
                
                console.log("✅ Проверка завершена. Статус:", this.getSubscriptionStatus());
                
            } catch (error) {
                console.error("❌ Ошибка проверки пользователя:", error);
                // Не выходим при ошибке сети, продолжаем с локальными данными
            }
            
        }, this.config.userCheckInterval);
        
        console.log("⏰ Периодические проверки запущены");
    },
    
    /**
     * Остановка периодических проверок
     */
    stopPeriodicChecks() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
            this.activityTimer = null;
        }
    },
    
    /**
     * Сохранение данных в локальное хранилище
     */
    saveToLocalStorage() {
        if (!this.currentUser) return;
        
        const data = {
            user: this.currentUser,
            session: this.currentSession,
            savedAt: Date.now(),
            version: "v6.1"
        };
        
        try {
            localStorage.setItem(this.config.localStorageKey, JSON.stringify(data));
            console.log("💾 Данные сохранены в localStorage");
        } catch (error) {
            console.error("❌ Ошибка сохранения в localStorage:", error);
        }
    },
    
    /**
     * Загрузка данных из локального хранилища
     */
    loadFromLocalStorage() {
        try {
            const dataStr = localStorage.getItem(this.config.localStorageKey);
            if (!dataStr) return null;
            
            const data = JSON.parse(dataStr);
            
            // Проверяем версию
            if (!data.version || !data.version.startsWith("v6")) {
                console.log("⚠️ Устаревшая версия данных, очищаем");
                this.clearLocalData();
                return null;
            }
            
            // Проверяем наличие всех необходимых данных
            if (!data.user || !data.session) {
                console.log("⚠️ Неполные данные, очищаем");
                this.clearLocalData();
                return null;
            }
            
            // Проверяем, что сессия не слишком старая (макс 7 дней)
            const age = Date.now() - (data.savedAt || 0);
            const maxAge = 7 * 24 * 60 * 60 * 1000;
            
            if (age > maxAge) {
                console.log("⚠️ Данные устарели (более 7 дней), очищаем");
                this.clearLocalData();
                return null;
            }
            
            return data;
            
        } catch (error) {
            console.error("❌ Ошибка загрузки из localStorage:", error);
            return null;
        }
    },
    
    /**
     * Очистка локальных данных
     */
    clearLocalData() {
        localStorage.removeItem(this.config.localStorageKey);
        this.currentUser = null;
        this.currentSession = null;
        console.log("🧹 Локальные данные очищены");
    },
    
    /**
     * Выход из системы
     */
    logout() {
        if (this.logoutInProgress) return;
        this.logoutInProgress = true;
        
        console.log("👋 Выход из системы...");
        
        // 1. Останавливаем проверки
        this.stopPeriodicChecks();
        
        // 2. Очищаем локальные данные
        this.clearLocalData();
        
        // 3. Выход из Firebase
        FirebaseModule.auth.signOut().catch(() => {
            // Игнорируем ошибки
        });
        
        // 4. Показываем форму входа
        setTimeout(() => {
            this.showAuthModal();
            this.logoutInProgress = false;
            
            // Останавливаем приложение
            if (typeof app !== 'undefined') {
                app.cleanup();
            }
        }, 500);
        
        console.log("✅ Выход выполнен");
    },
    
    /**
     * Привязка обработчиков событий
     */
    attachEventHandlers() {
        const registerBtn = document.getElementById('register-btn');
        const loginBtn = document.getElementById('login-btn');
        
        if (registerBtn && !registerBtn.hasAttribute('data-handler')) {
            registerBtn.setAttribute('data-handler', 'true');
            registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // ПОКАЗЫВАЕМ МОДАЛЬНОЕ ОКНО ДЛЯ ТРИАЛА
                showTrialModal();
            });
        }
            
        if (loginBtn && !loginBtn.hasAttribute('data-handler')) {
            loginBtn.setAttribute('data-handler', 'true');
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        
        // Получаем элементы полей ввода
        const emailInput = document.getElementById('user-email');
        const passInput = document.getElementById('user-password');
        
        // Обработчик для email поля (нажатие Enter)
        if (emailInput) {
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const activeButton = document.querySelector('#auth-step-1:not([style*="display: none"]) #login-btn') || 
                                       document.querySelector('#auth-step-1:not([style*="display: none"]) #register-btn');
                    if (activeButton) {
                        activeButton.click();
                    }
                }
            });
        }
        
        // Обработчик для password поля (нажатие Enter)
        if (passInput) {
            passInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const activeButton = document.querySelector('#auth-step-1:not([style*="display: none"]) #login-btn') || 
                                       document.querySelector('#auth-step-1:not([style*="display: none"]) #register-btn');
                    if (activeButton) {
                        activeButton.click();
                    }
                }
            });
        }
    },
    
    /**
     * Показать модальное окно об истекшей подписке
     */
    showSubscriptionExpiredModal(user) {
        const modal = document.createElement('div');
        modal.id = 'subscription-expired-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95); backdrop-filter: blur(20px);
            display: flex; justify-content: center; align-items: center; z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="auth-container" style="max-width: 500px;">
                <div class="auth-header">
                    <div class="auth-logo">${user.plan === 'PREMIUM' ? '👑 ПРЕМИУМ ИСТЕК' : '⏰ ТРИАЛ ЗАКОНЧИЛСЯ'}</div>
                    <div class="auth-subtitle">${user.plan === 'PREMIUM' ? 'Ваш PREMIUM доступ закончился' : 'Ваш 3-дневный триал подошел к концу'}</div>
                </div>
                
                <div style="background: rgba(255,215,0,0.1); border: 1px solid var(--gold); border-radius: 10px; padding: 15px; margin: 20px 0;">
                    <div style="color: var(--gold); font-weight: 700; margin-bottom: 5px;">👤 Ваш аккаунт:</div>
                    <div style="color: #fff;">${user.email}</div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 5rem; color: var(--gold);">${user.plan === 'PREMIUM' ? '👑' : '⏰'}</div>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="AuthSystem.logout(); document.body.removeChild(document.getElementById('subscription-expired-modal'))" 
                            class="auth-button" style="background: rgba(255,23,68,0.2); color: var(--put);">
                        Выйти
                    </button>
                    <button onclick="showPaymentModal(); document.body.removeChild(document.getElementById('subscription-expired-modal'))" 
                            class="auth-button">
                        Оплатить
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
};

// Экспорт в глобальную область видимости
window.AuthSystem = AuthSystem;
