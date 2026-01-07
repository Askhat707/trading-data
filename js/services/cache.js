// ============================================
// 💾 КЭШИРОВАНИЕ ДАННЫХ
// ============================================

const CacheService = {
    cache: new Map(),
    
    /**
     * Сохранение данных в кэш
     * @param {string} key - Ключ кэша
     * @param {any} data - Данные для кэширования
     * @param {number} ttl - Время жизни в миллисекундах
     */
    set(key, data, ttl = 5 * 60 * 1000) { // 5 минут по умолчанию
        const item = {
            data: data,
            expires: Date.now() + ttl
        };
        this.cache.set(key, item);
        
        // Автоматическое удаление после истечения времени
        setTimeout(() => {
            if (this.cache.has(key)) {
                const cached = this.cache.get(key);
                if (cached.expires <= Date.now()) {
                    this.cache.delete(key);
                }
            }
        }, ttl);
    },
    
    /**
     * Получение данных из кэша
     * @param {string} key - Ключ кэша
     * @returns {any|null} Данные или null
     */
    get(key) {
        if (!this.cache.has(key)) return null;
        
        const item = this.cache.get(key);
        if (item.expires <= Date.now()) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    },
    
    /**
     * Удаление данных из кэша
     * @param {string} key - Ключ кэша
     */
    delete(key) {
        this.cache.delete(key);
    },
    
    /**
     * Очистка всего кэша
     */
    clear() {
        this.cache.clear();
    },
    
    /**
     * Получение размера кэша
     * @returns {number} Количество элементов
     */
    size() {
        return this.cache.size;
    },
    
    /**
     * Проверка наличия ключа в кэше
     * @param {string} key - Ключ кэша
     * @returns {boolean} true если существует и не истек
     */
    has(key) {
        if (!this.cache.has(key)) return false;
        
        const item = this.cache.get(key);
        if (item.expires <= Date.now()) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    },
    
    /**
     * Получение всех ключей кэша
     * @returns {Array<string>} Массив ключей
     */
    keys() {
        return Array.from(this.cache.keys());
    },
    
    /**
     * Очистка устаревших записей
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (item.expires <= now) {
                this.cache.delete(key);
            }
        }
    }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheService;
} else {
    window.CacheService = CacheService;
}
