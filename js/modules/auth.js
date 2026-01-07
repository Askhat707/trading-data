// ============================================
// 🔐 МОДУЛЬ АУТЕНТИФИКАЦИИ
// ============================================

const AuthModule = {
    currentUser: null,
    currentSession: null,
    initialized: false,
    
    /**
     * Инициализация модуля аутентификации
     */
    async init() {
        if (this.initialized) {
            return;
        }
        
        console.log('🔐 Инициализация модуля аутентификации...');
        
        try {
            // Проверяем сохранённую сессию
            const savedAuth = this.loadFromLocalStorage();
            
            if (savedAuth && savedAuth.user && savedAuth.session) {
                console.log('📦 Восстановление сессии из localStorage');
                await this.restoreSession(savedAuth);
            } else {
                console.log('📋 Нет сохранённой сессии');
                this.showAuthModal();
            }
            
            this.initialized = true;
            console.log('✅ Модуль аутентификации инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации модуля аутентификации:', error);
            this.showAuthModal();
        }
    },
    
    /**
     * Восстановление сессии
     * @param {Object} savedAuth - Сохранённые данные аутентификации
     */
    async restoreSession(savedAuth) {
        const user = savedAuth.user;
        const session = savedAuth.session;
        
        try {
            // Проверяем подлинность сессии
            if (!this.validateSessionSignature(session)) {
                console.log('❌ Недействительная сессия');
                this.clearLocalData();
                this.showAuthModal();
                return;
            }
            
            // Проверяем, не истекла ли сессия
            const sessionAge = Date.now() - session.started;
            const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 дней
            
            if (sessionAge > maxSessionAge) {
                console.log('⏰ Сессия истекла');
                this.clearLocalData();
                this.showAuthModal();
                return;
            }
            
            // Проверяем подписку
            if (this.isSubscriptionExpired(user)) {
                console.log('⏰ Подписка истекла');
                this.clearLocalData();
                this.showSubscriptionExpiredModal(user);
                return;
            }
            
            // Восстанавливаем сессию
            this.currentUser = user;
            this.currentSession = session;
            this.currentSession.lastActivity = Date.now();
            
            // Обновляем UI
            this.hideAuthModal();
            this.updateUserUI();
            
            console.log('✅ Сессия восстановлена');
        } catch (error) {
            console.error('❌ Ошибка восстановления сессии:', error);
            this.clearLocalData();
            this.showAuthModal();
        }
    },
    
    /**
     * Вход в систему
     * @param {string} email - Email пользователя
     * @param {string} password - Пароль пользователя
     */
    async login(email, password) {
        try {
            console.log('🔐 Попытка входа для:', email);
            
            // Вход в Firebase
            const result = await FirebaseModule.signInWithEmailAndPassword(email, password);
            
            if (!result.success) {
                throw new Error(result.error || 'Ошибка входа');
            }
            
            // Получаем данные пользователя из базы данных
            const dbUser = await FirebaseModule.getUserData(result.user.uid);
            
            if (!dbUser) {
                throw new Error('Пользователь не найден в базе данных');
            }
            
            // Объединяем данные
            this.currentUser = this.mergeUserData(
                { id: result.user.uid, email: result.user.email },
                dbUser
            );
            
            // Проверяем подписку
            if (this.isSubscriptionExpired(this.currentUser)) {
                await FirebaseModule.signOut();
                this.clearLocalData();
                this.showSubscriptionExpiredModal(this.currentUser);
                return;
            }
            
            // Создаём сессию
            await this.createSession();
            
            // Сохраняем локально
            this.saveToLocalStorage();
            
            // Обновляем UI
            this.hideAuthModal();
            this.updateUserUI();
            
            console.log('✅ Вход выполнен успешно');
            
            // Инициализируем приложение
            if (window.app && typeof app.init === 'function') {
                setTimeout(() => app.init(), 500);
            }
            
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            this.showError(this.getErrorMessage(error));
        }
    },
    
    /**
     * Создание сессии
     */
    async createSession() {
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
            signature: this.generateSessionSignature(this.currentUser.id, now)
        };
    },
    
    /**
     * Генерация подписи сессии
     */
    generateSessionSignature(userId, timestamp) {
        const data = `${userId}_${timestamp}_gold_options_pro_v2`;
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
        if (!session || !session.signature) {
            console.log('⚠️ Сессия без подписи');
            return true; // Принимаем старые сессии
        }
        
        const expected = this.generateSessionSignature(session.userId, session.started);
        return session.signature === expected;
    },
    
    /**
     * Проверка истечения подписки
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
     * Обновление UI пользователя
     */
    updateUserUI() {
        if (!this.currentUser) return;
        
        try {
            // Обновляем email в хедере
            const emailEl = document.getElementById('header-user-email');
            if (emailEl) {
                emailEl.textContent = this.currentUser.email;
            }
            
            // Обновляем план в хедере
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
            
            // Обновляем бейдж
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
     * Показ модального окна аутентификации
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
     * Скрытие модального окна аутентификации
     */
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.add('visible');
        }
    },
    
    /**
     * Показ ошибки
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
     * Получение понятного сообщения об ошибке
     */
    getErrorMessage(error) {
        if (error.code) {
            switch (error.code) {
                case 'auth/wrong-password': return '❌ Неверный пароль';
                case 'auth/user-not-found': return '❌ Пользователь не найден';
                case 'auth/invalid-email': return '❌ Некорректный email';
                case 'auth/user-disabled': return '❌ Аккаунт заблокирован';
                case 'auth/too-many-requests': return '⏳ Слишком много попыток. Попробуйте позже';
                default: return `Ошибка: ${error.message}`;
            }
        }
        return error.message || 'Неизвестная ошибка';
    },
    
    /**
     * Выход из системы
     */
    async logout() {
        console.log('👋 Выход из системы...');
        
        // Выход из Firebase
        await FirebaseModule.signOut();
        
        // Очистка локальных данных
        this.clearLocalData();
        
        // Показ формы входа
        setTimeout(() => {
            this.showAuthModal();
        }, 500);
        
        console.log('✅ Выход выполнен');
    },
    
    /**
     * Сохранение в localStorage
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
            localStorage.setItem(Constants.AUTH_CONFIG.localStorageKey, JSON.stringify(data));
            console.log('💾 Данные сохранены в localStorage');
        } catch (error) {
            console.error('❌ Ошибка сохранения в localStorage:', error);
        }
    },
    
    /**
     * Загрузка из localStorage
     */
    loadFromLocalStorage() {
        try {
            const dataStr = localStorage.getItem(Constants.AUTH_CONFIG.localStorageKey);
            if (!dataStr) return null;
            
            const data = JSON.parse(dataStr);
            
            // Проверяем версию
            if (!data.version || !data.version.startsWith("v6")) {
                console.log('⚠️ Устаревшая версия данных');
                this.clearLocalData();
                return null;
            }
            
            // Проверяем наличие всех данных
            if (!data.user || !data.session) {
                console.log('⚠️ Неполные данные');
                this.clearLocalData();
                return null;
            }
            
            return data;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки из localStorage:', error);
            return null;
        }
    },
    
    /**
     * Очистка локальных данных
     */
    clearLocalData() {
        localStorage.removeItem(Constants.AUTH_CONFIG.localStorageKey);
        this.currentUser = null;
        this.currentSession = null;
        console.log('🧹 Локальные данные очищены');
    },
    
    /**
     * Объединение данных пользователя
     */
    mergeUserData(localUser, firebaseUser) {
        return {
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
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthModule;
} else {
    window.AuthModule = AuthModule;
}
