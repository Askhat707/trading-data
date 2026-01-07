// ============================================
// 💾 СЕРВИС КЭШИРОВАНИЯ ДАННЫХ
// ============================================

const CacheService = {
    // Хранилище кэша
    storage: {},
    
    /**
     * Генерация ключа кэша
     * @param {string} prefix - Префикс ключа
     * @param {string} key - Ключ
     * @returns {string} - Сгенерированный ключ
     */
    generateKey(prefix, key) {
        return `${prefix}:${key}`;
    },
    
    /**
     * Сохранение данных в кэш
     * @param {string} key - Ключ
     * @param {any} data - Данные для кэширования
     * @param {number} ttl - Время жизни в миллисекундах
     */
    set(key, data, ttl = 5 * 60 * 1000) { // 5 минут по умолчанию
        const item = {
            data: data,
            expiry: Date.now() + ttl
        };
        
        this.storage[key] = item;
        console.log(`💾 Данные сохранены в кэш (${key})`);
    },
    
    /**
     * Получение данных из кэша
     * @param {string} key - Ключ
     * @returns {any|null} - Данные или null, если истекли
     */
    get(key) {
        const item = this.storage[key];
        
        if (!item) {
            return null;
        }
        
        // Проверяем, не истекло ли время
        if (Date.now() > item.expiry) {
            delete this.storage[key];
            console.log(`⏰ Кэш истек (${key})`);
            return null;
        }
        
        console.log(`💾 Данные загружены из кэша (${key})`);
        return item.data;
    },
    
    /**
     * Удаление данных из кэша
     * @param {string} key - Ключ
     */
    remove(key) {
        if (this.storage[key]) {
            delete this.storage[key];
            console.log(`🧹 Данные удалены из кэша (${key})`);
        }
    },
    
    /**
     * Очистка всего кэша
     */
    clear() {
        this.storage = {};
        console.log('🧹 Весь кэш очищен');
    },
    
    /**
     * Получение размера кэша
     * @returns {number} - Количество элементов в кэше
     */
    size() {
        return Object.keys(this.storage).length;
    },
    
    /**
     * Получение всех ключей кэша
     * @returns {string[]} - Массив ключей
     */
    keys() {
        return Object.keys(this.storage);
    },
    
    /**
     * Проверка существования ключа в кэше
     * @param {string} key - Ключ
     * @returns {boolean} - Существует ли ключ
     */
    has(key) {
        const item = this.storage[key];
        if (!item) return false;
        
        // Проверяем, не истекло ли время
        if (Date.now() > item.expiry) {
            delete this.storage[key];
            return false;
        }
        
        return true;
    },
    
    /**
     * Кэширование данных DTE
     * @param {string} dteKey - Ключ DTE
     * @param {any} data - Данные DTE
     */
    cacheDTEData(dteKey, data) {
        const cacheKey = this.generateKey(AppConstants.CACHE_VERSION, dteKey);
        this.set(cacheKey, data, 3 * 60 * 1000); // 3 минуты для DTE данных
    },
    
    /**
     * Получение кэшированных данных DTE
     * @param {string} dteKey - Ключ DTE
     * @returns {any|null} - Кэшированные данные или null
     */
    getCachedDTEData(dteKey) {
        const cacheKey = this.generateKey(AppConstants.CACHE_VERSION, dteKey);
        return this.get(cacheKey);
    },
    
    /**
     * Удаление кэшированных данных DTE
     * @param {string} dteKey - Ключ DTE
     */
    removeCachedDTEData(dteKey) {
        const cacheKey = this.generateKey(AppConstants.CACHE_VERSION, dteKey);
        this.remove(cacheKey);
    }
};

// Экспорт в глобальную область видимости
window.CacheService = CacheService;
