// ============================================
// 📈 МОДУЛЬ ГРАФИКОВ - ПОЛНЫЙ КОД
// ============================================

console.log('📈 [CHARTS] Загрузка ChartsModule...');

const ChartsModule = {
    charts: {},
    
    chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                display: true,
                labels: { 
                    color: '#ccc', 
                    font: { size: 12 },
                    padding: 20
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(10, 10, 10, 0.95)',
                titleColor: '#FFD700',
                bodyColor: '#fff',
                borderColor: '#333',
                borderWidth: 1,
                titleFont: { size: 13, weight: '700' },
                bodyFont: { size: 12, weight: '500' },
                padding: 12
            }
        },
        scales: {
            x: { 
                ticks: { 
                    color: '#888', 
                    font: { size: 11, weight: '600' },
                    maxTicksLimit: 15
                }, 
                grid: { 
                    color: 'rgba(51, 51, 51, 0.5)',
                    drawBorder: false
                },
                title: {
                    display: true,
                    text: 'Strike Price',
                    color: '#888',
                    font: { size: 12, weight: '600' }
                }
            },
            y: { 
                ticks: { 
                    color: '#888', 
                    font: { size: 11, weight: '600' }
                }, 
                grid: { 
                    color: 'rgba(51, 51, 51, 0.5)',
                    drawBorder: false
                },
                beginAtZero: true
            }
        },
        animation: {
            duration: 750,
            easing: 'easeOutQuart'
        }
    },
    
    /**
     * Инициализация модуля
     */
    init() {
        console.log('✅ [CHARTS] ChartsModule инициализирован');
    },
    
    /**
     * Создание одного графика
     * @param {string} id - ID canvas элемента
     * @param {Object} config - Конфигурация Chart.js
     */
    createChart(id, config) {
        console.log(`🎨 [CHART] Создаем график: ${id}`);
        
        const ctx = document.getElementById(id);
        if (!ctx) {
            console.error(`❌ [CHART] Canvas #${id} не найден в DOM!`);
            return false;
        }
        
        // Удаляем старый график если существует
        if (this.charts[id]) {
            console.log(`🔄 [CHART] Удаляем старый график ${id}`);
            this.charts[id].destroy();
            delete this.charts[id];
        }
        
        try {
            // Объединяем с базовыми настройками
            const mergedConfig = {
                type: config.type || 'line',
                data: config.data || {},
                options: {
                    ...this.chartOptions,
                    ...(config.options || {})
                }
            };
            
            // Создаем новый график
            this.charts[id] = new Chart(ctx, mergedConfig);
            console.log(`✅ [CHART] График ${id} успешно создан`);
            return true;
            
        } catch (error) {
            console.error(`❌ [CHART] Ошибка создания графика ${id}:`, error);
            return false;
        }
    },
    
    /**
     * Создание всех 8 графиков
     * @param {Array} records - Массив данных опционной цепи
     */
    createAllCharts(records) {
        console.log('📊 [CHARTS] Начало создания всех графиков...');
        
        // ✅ ПРОВЕРКА ДАННЫХ
        if (!records || !Array.isArray(records)) {
            console.error('❌ [CHARTS] records не является массивом или null');
            this.showNoDataOnCharts();
            return;
        }
        
        if (records.length === 0) {
            console.warn('⚠️ [CHARTS] records пуст');
            this.showNoDataOnCharts();
            return;
        }
        
        if (records.length < 5) {
            console.warn('⚠️ [CHARTS] Недостаточно данных (< 5 записей)');
            this.showNoDataOnCharts();
            return;
        }
        
        try {
            // ✅ СОРТИРУЕМ ДАННЫЕ
            const sorted = [...records].sort((a, b) => {
                const strikeA = parseFloat(a.s) || 0;
                const strikeB = parseFloat(b.s) || 0;
                return strikeA - strikeB;
            });
            
            console.log(`✅ [CHARTS] Отсортировано записей: ${sorted.length}`);
            
            // ✅ СОЗДАЕМ LABELS И STRIKES
            const labels = sorted.map(r => {
                const strike = parseFloat(r.s) || 0;
                return strike.toFixed(0);
            });
            
            const strikes = sorted.map(r => parseFloat(r.s) || 0);
            
            console.log(`✅ [CHARTS] Labels: ${labels.slice(0, 3).join(', ')}... (всего ${labels.length})`);
            console.log(`✅ [CHARTS] Strikes: ${strikes.slice(0, 3).join(', ')}... (всего ${strikes.length})`);
            
            // ✅ РАССЧИТЫВАЕМ ДАТАСЕТЫ
            const datasets = this.calculateDatasets(sorted, strikes);
            console.log('✅ [CHARTS] Датасеты рассчитаны');
            
            // ✅ РАССЧИТЫВАЕМ MAX PAIN
            const losses = this.calculateMaxPainLosses(sorted, strikes);
            console.log(`✅ [CHARTS] Max Pain losses: ${losses.slice(0, 3).join(', ')}...`);
            
            // ✅ СОЗДАЕМ ВСЕ ГРАФИКИ
            this.createChartOI(labels, datasets);
            this.createChartVolume(labels, datasets);
            this.createChartIV(labels, datasets);
            this.createChartMaxPain(labels, losses);
            this.createChartGamma(labels, datasets);
            this.createChartDelta(labels, datasets);
            this.createChartGEX(labels, datasets);
            this.createChartTheta(labels, datasets);
            
            console.log('✅ [CHARTS] ВСЕ 8 ГРАФИКОВ УСПЕШНО СОЗДАНЫ!');
            
        } catch (error) {
            console.error('❌ [CHARTS] КРИТИЧЕСКАЯ ОШИБКА при создании графиков:', error);
            console.error('Stack:', error.stack);
            this.showNoDataOnCharts();
        }
    },
    
    /**
     * 1️⃣ График Open Interest Distribution
     */
    createChartOI(labels, datasets) {
        this.createChart('chart-oi', {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Call OI',
                        data: datasets.callOI,
                        backgroundColor: 'rgba(0, 230, 118, 0.7)',
                        borderColor: '#00E676',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Put OI',
                        data: datasets.putOI.map(v => -v),
                        backgroundColor: 'rgba(255, 23, 68, 0.7)',
                        borderColor: '#FF1744',
                        borderWidth: 1,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Open Interest Distribution',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Open Interest',
                            color: '#888'
                        }
                    }
                }
            }
        });
    },
    
    /**
     * 2️⃣ График Volume Heatmap
     */
    createChartVolume(labels, datasets) {
        this.createChart('chart-vol', {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Call Volume',
                        data: datasets.callVol,
                        backgroundColor: 'rgba(0, 230, 118, 0.6)',
                        borderColor: '#00E676',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Put Volume',
                        data: datasets.putVol.map(v => -v),
                        backgroundColor: 'rgba(255, 23, 68, 0.6)',
                        borderColor: '#FF1744',
                        borderWidth: 1,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Volume Heatmap',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
    },
    
    /**
     * 3️⃣ График IV Smile Curve
     */
    createChartIV(labels, datasets) {
        this.createChart('chart-iv', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Call IV',
                        data: datasets.callIV,
                        borderColor: '#00E676',
                        backgroundColor: 'rgba(0, 230, 118, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#00E676',
                        pointBorderColor: '#00E676',
                        pointBorderWidth: 1
                    },
                    {
                        label: 'Put IV',
                        data: datasets.putIV,
                        borderColor: '#FF1744',
                        backgroundColor: 'rgba(255, 23, 68, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#FF1744',
                        pointBorderColor: '#FF1744',
                        pointBorderWidth: 1
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'IV Smile Curve',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
    },
    
    /**
     * 4️⃣ График Max Pain Curve
     */
    createChartMaxPain(labels, losses) {
        this.createChart('chart-mp', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Max Pain',
                        data: losses,
                        borderColor: '#FFD700',
                        backgroundColor: 'rgba(255, 215, 0, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#FFD700',
                        pointBorderColor: '#FFD700',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Max Pain Curve',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
    },
    
    /**
     * 5️⃣ График Gamma Exposure
     */
    createChartGamma(labels, datasets) {
        this.createChart('chart-gamma', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Net Gamma',
                        data: datasets.netGamma,
                        borderColor: '#9C27B0',
                        backgroundColor: 'rgba(156, 39, 176, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#9C27B0',
                        pointBorderColor: '#9C27B0',
                        pointBorderWidth: 1
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Gamma Exposure',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
    },
    
    /**
     * 6️⃣ График Delta Profile
     */
    createChartDelta(labels, datasets) {
        this.createChart('chart-delta', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Call Delta',
                        data: datasets.callDelta,
                        borderColor: '#00E676',
                        backgroundColor: 'rgba(0, 230, 118, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        pointBackgroundColor: '#00E676'
                    },
                    {
                        label: 'Put Delta',
                        data: datasets.putDelta,
                        borderColor: '#FF1744',
                        backgroundColor: 'rgba(255, 23, 68, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        pointBackgroundColor: '#FF1744'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Delta Profile',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
    },
    
    /**
     * 7️⃣ График GEX Profile
     */
    createChartGEX(labels, datasets) {
        this.createChart('chart-gex', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Net GEX',
                        data: datasets.netGEX,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#2196F3',
                        pointBorderColor: '#2196F3',
                        pointBorderWidth: 1
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'GEX Profile',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                },
                scales: {
                    y: {
                        ticks: { 
                            callback: function(value) { 
                                return value.toFixed(1) + 'M'; 
                            } 
                        }
                    }
                }
            }
        });
    },
    
    /**
     * 8️⃣ График Theta Decay
     */
    createChartTheta(labels, datasets) {
        this.createChart('chart-theta', {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Call Theta',
                        data: datasets.callTheta,
                        borderColor: '#00E676',
                        backgroundColor: 'rgba(0, 230, 118, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        pointBackgroundColor: '#00E676'
                    },
                    {
                        label: 'Put Theta',
                        data: datasets.putTheta,
                        borderColor: '#FF1744',
                        backgroundColor: 'rgba(255, 23, 68, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        pointBackgroundColor: '#FF1744'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Theta Decay',
                        color: '#fff',
                        font: { size: 16, weight: '700' }
                    }
                }
            }
        });
    },
    
    /**
     * ГЛАВНАЯ ФУНКЦИЯ: Расчет датасетов
     * @param {Array} records - Отсортированные записи
     * @param {Array} strikes - Массив страйков
     * @returns {Object} Объект с расчитанными данными
     */
    calculateDatasets(records, strikes) {
        console.log('📊 [DATASETS] Начало расчета датасетов...');
        
        const result = {
            callOI: [],
            putOI: [],
            callVol: [],
            putVol: [],
            callIV: [],
            putIV: [],
            callDelta: [],
            putDelta: [],
            callTheta: [],
            putTheta: [],
            netGamma: [],
            netGEX: []
        };
        
        try {
            records.forEach((record, idx) => {
                // ✅ CALL DATA
                const callData = (record.c && typeof record.c === 'object') ? record.c : {};
                const callOI = parseInt(callData.oi) || 0;
                const callVol = parseInt(callData.v) || 0;
                const callIV = parseFloat(callData.iv) || 0;
                const callDelta = parseFloat(callData.d) || 0;
                const callGamma = parseFloat(callData.g) || 0;
                const callTheta = parseFloat(callData.t) || 0;
                
                // ✅ PUT DATA
                const putData = (record.p && typeof record.p === 'object') ? record.p : {};
                const putOI = parseInt(putData.oi) || 0;
                const putVol = parseInt(putData.v) || 0;
                const putIV = parseFloat(putData.iv) || 0;
                const putDelta = parseFloat(putData.d) || 0;
                const putGamma = parseFloat(putData.g) || 0;
                const putTheta = parseFloat(putData.t) || 0;
                
                // ✅ ДОБАВЛЯЕМ В РЕЗУЛЬТАТЫ
                result.callOI.push(callOI);
                result.putOI.push(putOI);
                result.callVol.push(callVol);
                result.putVol.push(putVol);
                result.callIV.push(callIV);
                result.putIV.push(putIV);
                
                // ✅ DELTA (с учетом OI)
                result.callDelta.push((callDelta * callOI) / 100);
                result.putDelta.push((putDelta * putOI) / 100);
                
                // ✅ THETA
                result.callTheta.push(callTheta);
                result.putTheta.push(putTheta);
                
                // ✅ GAMMA (NET)
                result.netGamma.push((callGamma * callOI) - (putGamma * putOI));
                
                // ✅ GEX (Gamma Exposure)
                const strike = parseFloat(record.s) || 0;
                const callGEX = callOI * callGamma * strike * 100;
                const putGEX = putOI * putGamma * strike * 100;
                result.netGEX.push((callGEX - putGEX) / 1000000);
            });
            
            console.log('✅ [DATASETS] Датасеты успешно рассчитаны');
            console.log(`   - callOI: ${result.callOI.slice(0, 3).join(', ')}...`);
            console.log(`   - callVol: ${result.callVol.slice(0, 3).join(', ')}...`);
            console.log(`   - netGamma: ${result.netGamma.slice(0, 3).join(', ')}...`);
            
            return result;
            
        } catch (error) {
            console.error('❌ [DATASETS] Ошибка при расчете датасетов:', error);
            return result;
        }
    },
    
    /**
     * Расчет Max Pain Losses
     * @param {Array} records - Отсортированные записи
     * @param {Array} strikes - Массив страйков
     * @returns {Array} Массив потерь для каждого страйка
     */
    calculateMaxPainLosses(records, strikes) {
        console.log('💰 [MAXPAIN] Расчет Max Pain Losses...');
        
        const losses = strikes.map(k => {
            let loss = 0;
            
            records.forEach(rec => {
                const s = parseFloat(rec.s) || 0;
                const callOI = (rec.c && rec.c.oi) ? parseInt(rec.c.oi) : 0;
                const putOI = (rec.p && rec.p.oi) ? parseInt(rec.p.oi) : 0;
                
                if (k < s) {
                    loss += (s - k) * callOI;
                }
                if (k > s) {
                    loss += (k - s) * putOI;
                }
            });
            
            return loss;
        });
        
        console.log(`✅ [MAXPAIN] Max Pain losses рассчитаны: ${losses.slice(0, 3).join(', ')}...`);
        return losses;
    },
    
    /**
     * Показ сообщения об отсутствии данных
     */
    showNoDataOnCharts() {
        console.log('⚠️ [CHARTS] Показываем "нет данных" на графиках...');
        
        const chartIds = ['chart-oi', 'chart-vol', 'chart-iv', 'chart-mp', 'chart-gamma', 'chart-delta', 'chart-gex', 'chart-theta'];
        
        chartIds.forEach(chartId => {
            const canvas = document.getElementById(chartId);
            if (canvas && canvas.parentElement) {
                const container = canvas.parentElement;
                
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.justifyContent = 'center';
                container.style.alignItems = 'center';
                
                container.innerHTML = `
                    <div style="text-align: center; color: #888; padding: 40px;">
                        <div style="font-size: 3rem; margin-bottom: 20px;">📊</div>
                        <div style="font-weight: 600; margin-bottom: 5px;">Insufficient Data</div>
                        <div style="font-size: 0.9rem;">Not enough strike prices available for chart rendering</div>
                    </div>
                `;
            }
        });
    },
    
    /**
     * Очистка всех графиков
     */
    destroyAllCharts() {
        console.log('🧹 [CHARTS] Очистка всех графиков...');
        
        try {
            Object.keys(this.charts).forEach(chartId => {
                if (this.charts[chartId]) {
                    this.charts[chartId].destroy();
                    delete this.charts[chartId];
                }
            });
            
            this.charts = {};
            console.log('✅ [CHARTS] Все графики успешно удалены');
        } catch (error) {
            console.error('❌ [CHARTS] Ошибка при удалении графиков:', error);
        }
    }
};

// ✅ ЭКСПОРТ
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartsModule;
} else {
    window.ChartsModule = ChartsModule;
}

console.log('✅ [CHARTS] ChartsModule полностью загружен и готов к использованию');
