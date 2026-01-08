// ============================================
// 🔐 МОДУЛЬ АУТЕНТИФИКАЦИИ
// ============================================

const AuthModule = {
    config: {
        trialDays: 3,
        localStorageKey: 'gold_options_auth_v7',
        adminEmail: 'omaralinovaskar95@gmail.com',
        adminTelegram: '@ASKHAT_1985'
    },
    
    currentUser: null,
    
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
            } else {
                console.log(`✅ ${field}: OK`);
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
    async autoInit() {
        console.log('🚀 AuthModule.autoInit() запущен');
        
        try {
            // Сначала скрываем loading
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
            
            console.log('🔍 Проверяем загрузку конфига...');
            
            // Проверяем загрузился ли конфиг
            if (!window.firebaseConfig || typeof window.firebaseConfig !== 'object') {
                console.warn('⚠️ window.firebaseConfig не загружен');
                this.showError('Firebase конфигурация не загружена. Проверьте консоль.');
                this.showAuthModal();
                return;
            }
            
            console.log('✅ Конфиг загружен:', window.firebaseConfig.projectId);
        // Проверяем Firebase SDK
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK не загружен');
            this.showError('Firebase SDK не загружен');
            this.showAuthModal();
            return;
        }
        
        // Инициализируем Firebase
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(window.firebaseConfig);
                console.log('✅ Firebase инициализирован');
            } else {
                console.log('✅ Firebase уже инициализирован');
            }
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
            this.showError(`Ошибка Firebase: ${error.message}`);
            this.showAuthModal();
            return;
        }
        
        // Показываем форму входа
        this.showAuthModal();
        
        // Пытаемся восстановить сессию
        const savedUser = localStorage.getItem(this.config.localStorageKey);
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                console.log('📱 Восстановление сессии:', userData.email);
                await this.login(userData.email, userData.password, true);
                return;
            } catch (e) {
                console.warn('⚠️ Не удалось восстановить сессию:', e);
                localStorage.removeItem(this.config.localStorageKey);
            }
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка в autoInit:', error);
        this.showAuthModal();
    }
},

/**
 * ПОКАЗ ФОРМЫ АУТЕНТИФИКАЦИИ
 */
showAuthModal() {
    console.log('🔓 Показываем модальное окно аутентификации');
    
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.classList.remove('hidden');
        authModal.style.display = 'flex';
        
        setTimeout(() => {
            authModal.style.opacity = '1';
        }, 10);
    }
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    console.log('✅ Модальное окно показано');
},

/**
 * ПОКАЗ ГЛАВНОГО ИНТЕРФЕЙСА
 */
showMainInterface() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.classList.add('hidden');
        setTimeout(() => {
            authModal.style.display = 'none';
        }, 500);
    }
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.classList.add('visible');
    }
    
    this.updateUserUI();
    
    if (window.app && window.app.init) {
        setTimeout(() => {
            app.init();
        }, 1000);
    }
},

/**
 * ВХОД ПОЛЬЗОВАТЕЛЯ
 */
async login(email, password, silent = false) {
    if (!silent) {
        this.showLoading('Вход в систему...');
    }
    
    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        
        if (!silent) {
            this.hideLoading();
            this.showSuccess('Вход выполнен успешно!');
        }
        
        // Сохраняем для автовхода
        if (!silent) {
            localStorage.setItem(this.config.localStorageKey, JSON.stringify({
                email: email,
                password: password,
                timestamp: Date.now()
            }));
        }
        
        // Получаем данные пользователя
        const userRef = firebase.database().ref(`users/${userCredential.user.uid}`);
        const snapshot = await userRef.once('value');
        
        if (snapshot.exists()) {
            this.currentUser = {
                ...snapshot.val(),
                id: userCredential.user.uid,
                email: userCredential.user.email
            };
        } else {
            // Новый пользователь
            this.currentUser = {
                id: userCredential.user.uid,
                email: userCredential.user.email,
                plan: 'TRIAL',
                registered: Date.now(),
                trialEnd: Date.now() + (this.config.trialDays * 24 * 60 * 60 * 1000),
                premiumEnd: 0
            };
            
            await userRef.set(this.currentUser);
        }
        
        this.showMainInterface();
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        
        if (!silent) {
            this.hideLoading();
            
            let errorMessage = 'Ошибка входа';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Пользователь не найден. Зарегистрируйтесь.';
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
                    errorMessage = 'Слишком много попыток';
                    break;
            }
            
            this.showError(errorMessage);
        }
        
        return false;
    }
},

/**
 * Проверка истекла ли подписка
 */
isSubscriptionExpired(user) {
    if (!user) return true;
    
    // Если пользователь PREMIUM
    if (user.plan === 'PREMIUM') {
        if (user.premiumEnd && user.premiumEnd > Date.now()) {
            return false; // Подписка активна
        }
        return true; // Подписка истекла
    }
    
    // Если пользователь TRIAL
    if (user.trialEnd && user.trialEnd > Date.now()) {
        return false; // Триал активен
    }
    
    return true; // Триал истек
},

/**
 * Получить количество оставшихся дней
 */
getDaysLeft(user = this.currentUser) {
    if (!user) return 0;
    
    if (user.plan === 'PREMIUM' && user.premiumEnd) {
        const days = Math.ceil((user.premiumEnd - Date.now()) / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    }
    
    if (user.trialEnd) {
        const days = Math.ceil((user.trialEnd - Date.now()) / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    }
    
    return 0;
},
    
/**
 * ВЫХОД ПОЛЬЗОВАТЕЛЯ
 */
async logout() {
    try {
        await firebase.auth().signOut();
        localStorage.removeItem(this.config.localStorageKey);
        this.currentUser = null;
        
        if (window.app && window.app.cleanup) {
            app.cleanup();
        }
        
        this.showAuthModal();
        this.showSuccess('Выход выполнен успешно');
        
    } catch (error) {
        console.error('❌ Ошибка выхода:', error);
        this.showError('Ошибка при выходе');
    }
},

/**
 * ОБНОВЛЕНИЕ UI ПОЛЬЗОВАТЕЛЯ
 */
updateUserUI() {
    if (!this.currentUser) return;
    
    const userEmail = document.getElementById('user-email');
    if (userEmail) {
        userEmail.textContent = this.currentUser.email;
    }
},

/**
 * ПОКАЗ ЗАГРУЗКИ
 */
showLoading(message = 'Загрузка...') {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
        loading.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 20px; color: #FFD700;">⏳</div>
                <div style="color: #FFD700; font-size: 1.5rem; font-weight: 800; margin-bottom: 20px;">
                    ${message}
                </div>
            </div>
        `;
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
    `;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
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
}
};
// Экспорт
window.AuthModule = AuthModule;
