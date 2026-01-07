// ============================================
// 🔥 МОДУЛЬ ДЛЯ РАБОТЫ С FIREBASE
// ============================================

const FirebaseModule = {
    // Инициализация Firebase
    db: null,
    auth: null,
    
    /**
     * Инициализация Firebase
     */
    init() {
        try {
            // Проверяем, инициализирован ли Firebase
            if (!firebase.apps.length) {
                console.error('❌ Firebase не инициализирован');
                return false;
            }
            
            this.db = firebase.database();
            this.auth = firebase.auth();
            
            console.log('✅ Firebase модуль инициализирован');
            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase модуля:', error);
            return false;
        }
    },
    
    /**
     * Получение текущей цены из Firebase
     * @returns {Promise<number|null>} - Цена или null
     */
    async getCurrentPrice() {
        const paths = AppConstants.FIREBASE_PATHS.PRICE;
        
        for (const path of paths) {
            try {
                const data = await ApiService.getFirebaseData(path);
                
                if (data) {
                    let price = null;
                    
                    if (data.price !== undefined) price = parseFloat(data.price);
                    else if (data.underlying_price !== undefined) price = parseFloat(data.underlying_price);
                    else if (data.current_price !== undefined) price = parseFloat(data.current_price);
                    
                    if (price && !isNaN(price)) {
                        console.log(`✅ Цена загружена из ${path}: $${price}`);
                        return price;
                    }
                }
            } catch (e) {
                continue;
            }
        }
        
        return null;
    },
    
    /**
     * Получение данных DTE из Firebase
     * @param {number} dte - DTE (дней до экспирации)
     * @returns {Promise<object|null>} - Данные DTE или null
     */
    async getDTEData(dte) {
        try {
            const path = `dte_${dte}`;
            const data = await ApiService.getFirebaseData(path);
            
            if (data) {
                console.log(`✅ Данные DTE ${dte} загружены`);
                return data;
            }
            
            return null;
        } catch (error) {
            console.error(`❌ Ошибка загрузки данных DTE ${dte}:`, error);
            return null;
        }
    },
    
    /**
     * Получение аналитики для DTE
     * @param {number} dte - DTE (дней до экспирации)
     * @returns {Promise<object|null>} - Аналитика или null
     */
    async getAnalyticsForDTE(dte) {
        const paths = [
            `gc/analytics/dte_${dte}`,
            `analytics/dte_${dte}`,
            `dte_${dte}/analytics`
        ];
        
        for (const path of paths) {
            try {
                const data = await ApiService.getFirebaseData(path);
                
                if (data) {
                    console.log(`✅ Аналитика для DTE ${dte} загружена из ${path}`);
                    return data;
                }
            } catch (e) {
                continue;
            }
        }
        
        return null;
    },
    
    /**
     * Получение безубытков для DTE
     * @param {number} dte - DTE (дней до экспирации)
     * @returns {Promise<object|null>} - Безубытки или null
     */
    async getBreakevensForDTE(dte) {
        const paths = [
            `gc/breakevens/dte_${dte}`,
            `gc/mt5/breakevens/dte_${dte}`,
            `mt5/breakevens/dte_${dte}`,
            `breakevens/dte_${dte}`
        ];
        
        for (const path of paths) {
            try {
                const data = await ApiService.getFirebaseData(path);
                
                if (data) {
                    console.log(`✅ Безубытки для DTE ${dte} загружены из ${path}`);
                    return data;
                }
            } catch (e) {
                continue;
            }
        }
        
        return null;
    },
    
    /**
     * Получение списка доступных DTE
     * @returns {Promise<Array>} - Массив объектов DTE
     */
    async getDTEList() {
        console.log('📅 Загрузка списка DTE из Firebase...');
        const dteList = [];
        const maxDTE = 9;
        
        const promises = [];
        for (let dte = 0; dte <= maxDTE; dte++) {
            promises.push(this.checkDTEExists(dte));
        }
        
        const results = await Promise.all(promises);
        const filteredList = results.filter(item => item !== null);
        
        // Сортировка по DTE
        filteredList.sort((a, b) => a.idx - b.idx);
        
        console.log(`✅ Найдено DTE: ${filteredList.length}`);
        return filteredList;
    },
    
    /**
     * Проверка существования DTE
     * @param {number} dte - DTE для проверки
     * @returns {Promise<object|null>} - Информация о DTE или null
     */
    async checkDTEExists(dte) {
        try {
            const data = await this.getDTEData(dte);
            
            if (!data) {
                return null;
            }
            
            // Определяем дату экспирации
            let expirationDate = null;
            if (data.metadata && data.metadata.expiration_date) {
                expirationDate = new Date(data.metadata.expiration_date);
            } else {
                const today = new Date();
                expirationDate = new Date(today);
                expirationDate.setDate(today.getDate() + dte);
            }
            
            // Проверяем, не истекла ли экспирация
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (expirationDate < today) {
                console.log(`DTE ${dte} expired: ${expirationDate.toISOString()}`);
                return null;
            }
            
            // Форматируем отображаемое имя
            const expDateStr = expirationDate.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            });
            
            let displayName = '';
            if (dte === 0) {
                displayName = `0DTE (Today - ${expDateStr})`;
            } else if (dte === 1) {
                displayName = `1DTE (Tomorrow - ${expDateStr})`;
            } else {
                displayName = `${dte}DTE (${expDateStr})`;
            }
            
            return { 
                key: `dte_${dte}`, 
                idx: dte, 
                display: displayName, 
                expirationDate: expirationDate 
            };
        } catch (error) {
            console.error(`Ошибка проверки DTE ${dte}:`, error);
            return null;
        }
    },
    
    /**
     * Получение данных пользователя из Firebase
     * @param {string} userId - ID пользователя
     * @returns {Promise<object|null>} - Данные пользователя или null
     */
    async getUserData(userId) {
        try {
            const data = await ApiService.getFirebaseData(`users/${userId}`);
            
            if (data) {
                return {
                    id: userId,
                    ...data
                };
            }
            
            return null;
        } catch (error) {
            console.error('❌ Ошибка получения данных пользователя:', error);
            return null;
        }
    },
    
    /**
     * Обновление данных пользователя в Firebase
     * @param {string} userId - ID пользователя
     * @param {object} userData - Данные пользователя
     */
    async updateUserData(userId, userData) {
        try {
            await ApiService.updateFirebaseData(`users/${userId}`, userData);
            console.log(`✅ Данные пользователя ${userId} обновлены`);
        } catch (error) {
            console.error('❌ Ошибка обновления данных пользователя:', error);
            throw error;
        }
    },
    
    /**
     * Создание сессии пользователя
     * @param {string} sessionId - ID сессии
     * @param {object} sessionData - Данные сессии
     */
    async createUserSession(sessionId, sessionData) {
        try {
            await ApiService.setFirebaseData(`sessions/${sessionId}`, sessionData);
            console.log(`✅ Сессия ${sessionId} создана`);
        } catch (error) {
            console.error('❌ Ошибка создания сессии:', error);
            throw error;
        }
    },
    
    /**
     * Обновление активности сессии
     * @param {string} sessionId - ID сессии
     */
    async updateSessionActivity(sessionId) {
        try {
            await ApiService.updateFirebaseData(`sessions/${sessionId}`, {
                lastActivity: Date.now()
            });
        } catch (error) {
            console.error('❌ Ошибка обновления активности сессии:', error);
        }
    }
};

// Экспорт в глобальную область видимости
window.FirebaseModule = FirebaseModule;
