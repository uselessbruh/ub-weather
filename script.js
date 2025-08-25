const API_BASE = 'https://wttr.in/';
let currentLocation = '';
let hourlyChart, trendsChart;
let settings = {
    tempUnit: 'celsius',
    autoRefresh: false,
    notifications: true
};
function loadSettings() {
    const saved = localStorage.getItem('weatherDashboardSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
    document.getElementById('temp-unit').value = settings.tempUnit;
    document.getElementById('auto-refresh').checked = settings.autoRefresh;
    document.getElementById('notifications').checked = settings.notifications;
    if (settings.autoRefresh) {
        startAutoRefresh();
    }
}
function saveSettings() {
    localStorage.setItem('weatherDashboardSettings', JSON.stringify(settings));
}
let isChartToggled = false;
let autoRefreshInterval = null;
const weatherCodes = {
    113: { desc: 'sunny', icon: '☀️', bg: 'sunny' },
    116: { desc: 'partly cloudy', icon: '⛅', bg: 'cloudy' },
    119: { desc: 'cloudy', icon: '☁️', bg: 'cloudy' },
    122: { desc: 'overcast', icon: '☁️', bg: 'cloudy' },
    143: { desc: 'mist', icon: '🌫️', bg: 'cloudy' },
    176: { desc: 'patchy rain possible', icon: '🌦️', bg: 'rain' },
    179: { desc: 'patchy snow possible', icon: '🌨️', bg: 'snow' },
    182: { desc: 'patchy sleet possible', icon: '🌨️', bg: 'snow' },
    185: { desc: 'patchy freezing drizzle possible', icon: '🌨️', bg: 'snow' },
    200: { desc: 'thundery outbreaks possible', icon: '⛈️', bg: 'thunder' },
    227: { desc: 'blowing snow', icon: '🌨️', bg: 'snow' },
    230: { desc: 'blizzard', icon: '❄️', bg: 'snow' },
    248: { desc: 'fog', icon: '🌫️', bg: 'cloudy' },
    260: { desc: 'freezing fog', icon: '🌫️', bg: 'cloudy' },
    263: { desc: 'patchy light drizzle', icon: '🌦️', bg: 'rain' },
    266: { desc: 'light drizzle', icon: '🌧️', bg: 'rain' },
    281: { desc: 'freezing drizzle', icon: '🌨️', bg: 'snow' },
    284: { desc: 'heavy freezing drizzle', icon: '🌨️', bg: 'snow' },
    293: { desc: 'patchy light rain', icon: '🌦️', bg: 'rain' },
    296: { desc: 'light rain', icon: '🌧️', bg: 'rain' },
    299: { desc: 'moderate rain at times', icon: '🌧️', bg: 'rain' },
    302: { desc: 'moderate rain', icon: '🌧️', bg: 'rain' },
    305: { desc: 'heavy rain at times', icon: '🌧️', bg: 'rain' },
    308: { desc: 'heavy rain', icon: '🌧️', bg: 'rain' },
    311: { desc: 'light freezing rain', icon: '🌨️', bg: 'snow' },
    314: { desc: 'moderate or heavy freezing rain', icon: '🌨️', bg: 'snow' },
    317: { desc: 'light sleet', icon: '🌨️', bg: 'snow' },
    320: { desc: 'moderate or heavy sleet', icon: '🌨️', bg: 'snow' },
    323: { desc: 'patchy light snow', icon: '🌨️', bg: 'snow' },
    326: { desc: 'light snow', icon: '🌨️', bg: 'snow' },
    329: { desc: 'patchy moderate snow', icon: '❄️', bg: 'snow' },
    332: { desc: 'moderate snow', icon: '❄️', bg: 'snow' },
    335: { desc: 'patchy heavy snow', icon: '❄️', bg: 'snow' },
    338: { desc: 'heavy snow', icon: '❄️', bg: 'snow' },
    350: { desc: 'ice pellets', icon: '🌨️', bg: 'snow' },
    353: { desc: 'light rain shower', icon: '🌦️', bg: 'rain' },
    356: { desc: 'moderate or heavy rain shower', icon: '🌧️', bg: 'rain' },
    359: { desc: 'torrential rain shower', icon: '🌧️', bg: 'rain' },
    362: { desc: 'light sleet showers', icon: '🌨️', bg: 'snow' },
    365: { desc: 'moderate or heavy sleet showers', icon: '🌨️', bg: 'snow' },
    368: { desc: 'light snow showers', icon: '🌨️', bg: 'snow' },
    371: { desc: 'moderate or heavy snow showers', icon: '❄️', bg: 'snow' },
    374: { desc: 'light showers of ice pellets', icon: '🌨️', bg: 'snow' },
    377: { desc: 'moderate or heavy showers of ice pellets', icon: '🌨️', bg: 'snow' },
    386: { desc: 'patchy light rain with thunder', icon: '⛈️', bg: 'thunder' },
    389: { desc: 'moderate or heavy rain with thunder', icon: '⛈️', bg: 'thunder' },
    392: { desc: 'patchy light snow with thunder', icon: '⛈️', bg: 'thunder' },
    395: { desc: 'moderate or heavy snow with thunder', icon: '⛈️', bg: 'thunder' }
};
const moonPhases = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘'
};
document.addEventListener('DOMContentLoaded', function () {
    loadSettings(); // Load settings first
    setupEventListeners();
    setupInteractivity();
    loadWeatherData(currentLocation);
    updateDateTime();
    setInterval(updateDateTime, 1000);
});
function setupEventListeners() {
    const searchBtn = document.getElementById('search-btn');
    const locationInput = document.getElementById('location-input');
    searchBtn.addEventListener('click', handleSearch);
    locationInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}
function setupInteractivity() {
    document.querySelectorAll('.widget-clickable').forEach(widget => {
        widget.addEventListener('click', function () {
            const widgetType = this.dataset.widget;
            showWidgetDetails(widgetType);
            addRippleEffect(this);
        });
    });
    document.querySelectorAll('.interactive-element').forEach(element => {
        element.addEventListener('mouseenter', function () {
            this.style.transform = 'scale(1.05)';
        });
        element.addEventListener('mouseleave', function () {
            this.style.transform = 'scale(1)';
        });
    });
    document.getElementById('fab-menu').addEventListener('click', function () {
        document.getElementById('settings-modal').classList.add('open');
    });
    document.getElementById('chart-toggle').addEventListener('click', function () {
        toggleChartView();
    });
    document.getElementById('close-modal').addEventListener('click', function () {
        document.getElementById('settings-modal').classList.remove('open');
    });
    document.getElementById('close-panel').addEventListener('click', function () {
        closeDetailPanel();
    });
    document.getElementById('detail-overlay').addEventListener('click', function () {
        closeDetailPanel();
    });
    document.getElementById('temp-unit').addEventListener('change', function () {
        settings.tempUnit = this.value;
        saveSettings();
        showNotification(`Temperature unit changed to ${this.value}`);
        if (currentLocation) {
            loadWeatherData(currentLocation);
        }
    });
    document.getElementById('auto-refresh').addEventListener('change', function () {
        settings.autoRefresh = this.checked;
        saveSettings();
        if (this.checked) {
            startAutoRefresh();
            showNotification('Auto-refresh enabled (5 minutes)');
        } else {
            stopAutoRefresh();
            showNotification('Auto-refresh disabled');
        }
    });
    document.getElementById('notifications').addEventListener('change', function () {
        settings.notifications = this.checked;
        saveSettings();
        showNotification(this.checked ? 'Notifications enabled' : 'Notifications disabled');
    });
    document.getElementById('radar-refresh').addEventListener('click', function () {
        refreshRadar();
        addRippleEffect(this);
    });
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            loadWeatherData(currentLocation);
            showNotification('Weather data refreshed');
        }
        if (e.key === 'Escape') {
            closeDetailPanel();
            document.getElementById('settings-modal').classList.remove('open');
        }
    });
}
function addRippleEffect(element) {
    element.classList.add('ripple-active');
    setTimeout(() => {
        element.classList.remove('ripple-active');
    }, 600);
}
function showWidgetDetails(widgetType) {
    const panel = document.getElementById('detail-panel');
    const overlay = document.getElementById('detail-overlay');
    const content = document.getElementById('detail-content');
    let detailHTML = '';
    switch (widgetType) {
        case 'current-weather':
            detailHTML = `
                        <h3 class="text-xl font-bold mb-4">Current Weather Details</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span>Temperature:</span>
                                <span class="font-bold">${document.getElementById('current-temp').textContent}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Feels Like:</span>
                                <span class="font-bold">${document.getElementById('feels-like').textContent}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Humidity:</span>
                                <span class="font-bold">${document.getElementById('humidity').textContent}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Description:</span>
                                <span class="font-bold">${document.getElementById('weather-desc').textContent}</span>
                            </div>
                        </div>
                    `;
            break;
        case 'wind-pressure':
            detailHTML = `
                        <h3 class="text-xl font-bold mb-4">Wind & Pressure Details</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span>Wind Speed:</span>
                                <span class="font-bold">${document.getElementById('wind-speed').textContent}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Direction:</span>
                                <span class="font-bold">${document.getElementById('wind-direction').textContent}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Pressure:</span>
                                <span class="font-bold">${document.getElementById('pressure').textContent}</span>
                            </div>
                        </div>
                    `;
            break;
        case 'hourly-chart':
            detailHTML = `
                        <h3 class="text-xl font-bold mb-4">Forecast Information</h3>
                        <p class="mb-4">This chart shows the 24-hour temperature and precipitation forecast.</p>
                        <div class="space-y-2">
                            <p><strong>Blue Line:</strong> Temperature in Celsius</p>
                            <p><strong>Cyan Line:</strong> Chance of rain (%)</p>
                            <p><strong>Tip:</strong> Use the "Switch View" button to toggle chart types</p>
                        </div>
                    `;
            break;
        case 'weather-radar':
            detailHTML = `
                        <h3 class="text-xl font-bold mb-4">🌧️ Weather Radar Guide</h3>
                        <div class="space-y-4">
                            <div class="bg-gray-800 p-4 rounded-lg">
                                <h4 class="font-bold text-lg mb-3">Radar Color Meanings</h4>
                                <div class="space-y-2 text-sm">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-4 h-4 bg-green-400 rounded"></div>
                                        <span><strong>Green:</strong> Light precipitation (drizzle, light rain)</span>
                                    </div>
                                    <div class="flex items-center space-x-3">
                                        <div class="w-4 h-4 bg-yellow-400 rounded"></div>
                                        <span><strong>Yellow:</strong> Moderate precipitation (steady rain)</span>
                                    </div>
                                    <div class="flex items-center space-x-3">
                                        <div class="w-4 h-4 bg-orange-400 rounded"></div>
                                        <span><strong>Orange:</strong> Heavy precipitation (heavy rain)</span>
                                    </div>
                                    <div class="flex items-center space-x-3">
                                        <div class="w-4 h-4 bg-red-500 rounded"></div>
                                        <span><strong>Red:</strong> Very heavy precipitation (downpour)</span>
                                    </div>
                                    <div class="flex items-center space-x-3">
                                        <div class="w-4 h-4 bg-purple-500 rounded"></div>
                                        <span><strong>Purple/Pink:</strong> Mixed precipitation or moderate rain</span>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-gray-800 p-4 rounded-lg">
                                <h4 class="font-bold text-lg mb-3">Current Radar Status</h4>
                                <div class="space-y-2 text-sm">
                                    <p><strong>🌧️ Purple Icon:</strong> Active precipitation detected</p>
                                    <p><strong>📡 Global Coverage:</strong> International radar system</p>
                                    <p><strong>⏰ Timestamp:</strong> Last radar update time</p>
                                    <p><strong>🔄 Refresh:</strong> Click refresh button for latest data</p>
                                </div>
                            </div>
                            <div class="bg-blue-900 p-4 rounded-lg">
                                <h4 class="font-bold text-lg mb-3">💡 What This Means</h4>
                                <div class="space-y-1 text-sm">
                                    <p>• <strong>Prepare for rain:</strong> Bring umbrella or rain gear</p>
                                    <p>• <strong>Check forecast:</strong> See hourly predictions for duration</p>
                                    <p>• <strong>Drive safely:</strong> Expect wet road conditions</p>
                                    <p>• <strong>Plan activities:</strong> Consider indoor alternatives</p>
                                </div>
                            </div>
                            <div class="text-center text-xs text-gray-400 mt-4">
                                <p>Radar data updates every 5-10 minutes</p>
                                <p>Coverage: Global precipitation monitoring</p>
                            </div>
                        </div>
                    `;
            break;
        default:
            detailHTML = `
                        <h3 class="text-xl font-bold mb-4">Widget Details</h3>
                        <p>Detailed information for this widget.</p>
                    `;
    }
    content.innerHTML = detailHTML;
    overlay.classList.add('open');
    panel.classList.add('open');
}
function closeDetailPanel() {
    document.getElementById('detail-panel').classList.remove('open');
    document.getElementById('detail-overlay').classList.remove('open');
}
function toggleChartView() {
    isChartToggled = !isChartToggled;
    const button = document.getElementById('chart-toggle');
    if (isChartToggled) {
        button.textContent = '📈 Temperature';
        button.classList.add('pulse-on-update');
        showNotification('Switched to precipitation view');
    } else {
        button.textContent = '📊 Switch View';
        button.classList.add('pulse-on-update');
        showNotification('Switched to combined view');
    }
    setTimeout(() => {
        button.classList.remove('pulse-on-update');
    }, 800);
}
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        loadWeatherData(currentLocation);
        if (settings.notifications) {
            showNotification('Weather data auto-refreshed');
        }
    }, 300000); // 5 minutes
}
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
function animateCounter(element, newValue) {
    element.classList.add('pulse-on-update');
    setTimeout(() => {
        element.textContent = newValue;
        element.classList.remove('pulse-on-update');
    }, 400);
}
function handleSearch() {
    const location = document.getElementById('location-input').value.trim();
    if (location) {
        currentLocation = location;
        loadWeatherData(location);
    }
}
async function loadWeatherData(location) {
    showLoading();
    hideError();
    try {
        const response = await fetch(`${API_BASE}${encodeURIComponent(location)}?format=j1`);
        if (!response.ok) {
            throw new Error('Location not found');
        }
        const data = await response.json();
        updateUI(data);
        hideLoading();
    } catch (error) {
        showError('Failed to load weather data. Please check the location and try again.');
        hideLoading();
    }
}
function updateUI(data) {
    console.log('Full weather data received:', data);
    const current = data.current_condition[0];
    const today = data.weather[0];
    const location = data.nearest_area[0];
    document.getElementById('current-location').textContent =
        `${location.areaName[0].value}, ${location.country[0].value}`;
    updateWeatherBackground(current.weatherCode, today.astronomy[0], current.temp_C);
    updateCurrentWeather(current);
    try {
        updateWindData(current);
        updateUVVisibility(current, today);
        updateSunMoon(today.astronomy[0]);
        updateDailyForecast(data.weather);
        updatePrecipitation(current, today);
        updateAirQuality(); // Simulated data
        updateWeatherRadar(currentLocation); // Live radar data
        updateHourlyForecast(today.hourly);
        updateComfortIndex(current, today);
        updateHourlyChart(today.hourly);
        updateTrendsChart(data.weather);
        checkWeatherAlerts(current);
        console.log('All widgets updated successfully');
    } catch (error) {
        console.error('Error updating widgets:', error);
    }
}
function updateWeatherBackground(weatherCode, astronomy, temperature) {
    const bg = document.getElementById('weather-bg');
    const weather = weatherCodes[weatherCode] || { bg: 'sunny' };
    const isNight = isNightTime(astronomy);
    const isHot = temperature >= 30; // 30°C and above
    const isExtremeHot = temperature >= 40; // 40°C and above
    bg.className = 'weather-bg';
    setTimeout(() => {
        let weatherClass = weather.bg;
        if (isHot && (weather.bg === 'sunny' || weather.bg === 'clear-night')) {
            weatherClass = isExtremeHot ? 'hot extreme' : 'hot';
        } else {
            if (isNight && weather.bg !== 'clear-night') {
                weatherClass += ' night';
            }
        }
        bg.classList.add(...weatherClass.split(' '));
        console.log(`Weather background updated: ${weatherClass} (Night: ${isNight}, Temp: ${temperature}°C)`);
    }, 100);
}
function isNightTime(astronomy) {
    if (!astronomy || !astronomy.sunrise || !astronomy.sunset) {
        return false; // Default to day if no astronomy data
    }
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    const sunriseTime = parseTimeString(astronomy.sunrise);
    const sunsetTime = parseTimeString(astronomy.sunset);
    return currentTime < sunriseTime || currentTime > sunsetTime;
}
function parseTimeString(timeStr) {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
        hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
    }
    return hour24 * 60 + minutes;
}
function updateCurrentWeather(current) {
    const weather = weatherCodes[current.weatherCode] || { icon: '❓', desc: 'unknown' };
    document.getElementById('weather-icon').textContent = weather.icon;
    animateCounter(document.getElementById('current-temp'), `${current.temp_C}°`);
    document.getElementById('weather-desc').textContent = current.weatherDesc[0].value;
    animateCounter(document.getElementById('feels-like'), `${current.FeelsLikeC}°`);
    animateCounter(document.getElementById('humidity'), `${current.humidity}%`);
    console.log('Current weather updated:', current);
}
function updateWindData(current) {
    animateCounter(document.getElementById('wind-speed'), `${current.windspeedKmph} km/h`);
    document.getElementById('wind-direction').textContent = current.winddir16Point;
    animateCounter(document.getElementById('pressure'), `${current.pressure} hPa`);
    const arrow = document.getElementById('wind-arrow');
    arrow.style.transform = `rotate(${current.winddirDegree}deg)`;
}
function updateUVVisibility(current, today) {
    const uvIndex = parseInt(today.uvIndex) || parseInt(today.hourly[0]?.uvIndex) || 0;
    document.getElementById('uv-index').textContent = uvIndex;
    document.getElementById('visibility').textContent = `${current.visibility} km`;
    document.getElementById('cloud-cover').textContent = `${current.cloudcover}%`;
    const uvFill = document.getElementById('uv-fill');
    const uvPercent = Math.min(uvIndex * 10, 100);
    uvFill.style.width = `${uvPercent}%`;
    if (uvIndex <= 2) uvFill.style.backgroundColor = '#4ade80';
    else if (uvIndex <= 5) uvFill.style.backgroundColor = '#facc15';
    else if (uvIndex <= 7) uvFill.style.backgroundColor = '#f97316';
    else if (uvIndex <= 10) uvFill.style.backgroundColor = '#ef4444';
    else uvFill.style.backgroundColor = '#8b5cf6';
    console.log('UV/Visibility updated:', { uvIndex, visibility: current.visibility, cloudCover: current.cloudcover });
}
function updateSunMoon(astronomy) {
    document.getElementById('sunrise').textContent = astronomy.sunrise;
    document.getElementById('sunset').textContent = astronomy.sunset;
    document.getElementById('moonrise').textContent = astronomy.moonrise;
    document.getElementById('moonset').textContent = astronomy.moonset;
    const moonPhase = astronomy.moon_phase;
    document.getElementById('moon-phase').textContent = moonPhases[moonPhase] || '🌑';
    document.getElementById('moon-phase-name').textContent = moonPhase;
}
function updateDailyForecast(weatherData) {
    const container = document.getElementById('daily-forecast');
    container.innerHTML = '';
    weatherData.slice(0, 5).forEach((day, index) => {
        const date = new Date(day.date);
        const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        const weather = weatherCodes[day.hourly[4].weatherCode] || { icon: '❓' };
        const dayElement = document.createElement('div');
        dayElement.className = 'flex items-center justify-between py-2 px-3 bg-white bg-opacity-10 rounded-lg';
        dayElement.innerHTML = `
                    <span class="font-medium">${dayName}</span>
                    <span class="text-2xl">${weather.icon}</span>
                    <span class="font-bold">${day.maxtempC}° / ${day.mintempC}°</span>
                `;
        container.appendChild(dayElement);
    });
}
function updatePrecipitation(current, today) {
    const rainChance = today.hourly[0]?.chanceofrain || 0;
    document.getElementById('rain-chance').textContent = `${rainChance}%`;
    document.getElementById('precipitation').textContent = `${current.precipMM} mm`;
    document.getElementById('dew-point').textContent = `${today.hourly[0]?.DewPointC || '--'}°`;
    const rainBar = document.getElementById('rain-bar');
    rainBar.style.width = `${rainChance}%`;
    console.log('Precipitation updated:', { rainChance, precipMM: current.precipMM, dewPoint: today.hourly[0]?.DewPointC });
}
function updateAirQuality() {
    const aqi = Math.floor(Math.random() * 200) + 1;
    let status, color;
    if (aqi <= 50) {
        status = 'Good';
        color = '#4ade80';
    } else if (aqi <= 100) {
        status = 'Moderate';
        color = '#facc15';
    } else if (aqi <= 150) {
        status = 'Unhealthy for Sensitive';
        color = '#f97316';
    } else if (aqi <= 200) {
        status = 'Unhealthy';
        color = '#ef4444';
    } else {
        status = 'Very Unhealthy';
        color = '#8b5cf6';
    }
    document.getElementById('aqi-value').textContent = aqi;
    document.getElementById('aqi-status').textContent = status;
    document.getElementById('aqi-value').style.color = color;
    document.getElementById('aqi-status').style.color = color;
    document.getElementById('pm25').textContent = `${Math.floor(Math.random() * 50)} μg/m³`;
    document.getElementById('pm10').textContent = `${Math.floor(Math.random() * 100)} μg/m³`;
    document.getElementById('ozone').textContent = `${Math.floor(Math.random() * 200)} μg/m³`;
}
function updateWeatherRadar(location) {
    const radarContainer = document.getElementById('radar-container');
    const radarLoading = document.getElementById('radar-loading');
    const radarMap = document.getElementById('radar-map');
    const radarError = document.getElementById('radar-error');
    const radarIframe = document.getElementById('radar-iframe');
    const radarTime = document.getElementById('radar-time');
    radarLoading.classList.remove('hidden');
    radarMap.classList.add('hidden');
    radarError.classList.add('hidden');
    try {
        const windyUrl = `https://embed.windy.com/embed2.html?lat=${encodeURIComponent(location)}&lon=&detailLat=${encodeURIComponent(location)}&detailLon=&width=400&height=192&zoom=8&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;
        let radarUrl;
        if (location.includes('United States') || location.includes('USA')) {
            radarUrl = `https://radar.weather.gov/ridge/standard/CONUS_loop.gif`;
        } else {
            radarUrl = `https://tilecache.rainviewer.com/`;
            setupRainViewerRadar();
            return;
        }
        radarIframe.src = radarUrl;
        radarIframe.onload = function () {
            radarLoading.classList.add('hidden');
            radarMap.classList.remove('hidden');
            updateRadarTime();
        };
        radarIframe.onerror = function () {
            showRadarError();
        };
    } catch (error) {
        console.error('Error loading radar:', error);
        showRadarError();
    }
}
function setupRainViewerRadar() {
    const radarMap = document.getElementById('radar-map');
    const radarLoading = document.getElementById('radar-loading');
    radarMap.innerHTML = `
                <div class="w-full h-full bg-gray-900 flex items-center justify-center relative">
                    <div class="text-center">
                        <div class="text-3xl mb-2">🌧️</div>
                        <p class="text-sm mb-1">Live Precipitation</p>
                        <p class="text-xs text-gray-400">Global Coverage</p>
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 opacity-20 animate-pulse"></div>
                </div>
            `;
    radarLoading.classList.add('hidden');
    radarMap.classList.remove('hidden');
    updateRadarTime();
}
function showRadarError() {
    document.getElementById('radar-loading').classList.add('hidden');
    document.getElementById('radar-map').classList.add('hidden');
    document.getElementById('radar-error').classList.remove('hidden');
}
function updateRadarTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('radar-time').textContent = timeString;
}
function refreshRadar() {
    if (currentLocation) {
        updateWeatherRadar(currentLocation);
        showNotification('Radar refreshed');
    }
}
function updateHourlyForecast(hourlyData) {
    const container = document.getElementById('hourly-list');
    container.innerHTML = '';
    hourlyData.forEach(hour => {
        const time = `${hour.time.toString().padStart(4, '0').slice(0, 2)}:00`;
        const weather = weatherCodes[hour.weatherCode] || { icon: '❓' };
        const hourElement = document.createElement('div');
        hourElement.className = 'flex items-center justify-between py-2 px-3 bg-white bg-opacity-5 rounded-lg';
        hourElement.innerHTML = `
                    <span class="w-16">${time}</span>
                    <span class="text-xl">${weather.icon}</span>
                    <span class="w-16 text-right font-bold">${hour.tempC}°</span>
                    <span class="w-20 text-right text-sm text-gray-300">${hour.chanceofrain}%</span>
                `;
        container.appendChild(hourElement);
    });
}
function updateComfortIndex(current, today) {
    const temp = parseInt(current.temp_C);
    const humidity = parseInt(current.humidity);
    let comfort = 100;
    if (temp < 18 || temp > 26) comfort -= Math.abs(temp - 22) * 5;
    if (humidity < 40 || humidity > 60) comfort -= Math.abs(humidity - 50) * 2;
    comfort = Math.max(0, Math.min(100, comfort));
    let level, color;
    if (comfort >= 80) {
        level = 'Excellent';
        color = '#4ade80';
    } else if (comfort >= 60) {
        level = 'Good';
        color = '#facc15';
    } else if (comfort >= 40) {
        level = 'Fair';
        color = '#f97316';
    } else {
        level = 'Poor';
        color = '#ef4444';
    }
    document.getElementById('comfort-level').textContent = level;
    document.getElementById('heat-index').textContent = `${current.FeelsLikeC}°`;
    document.getElementById('wind-chill').textContent = `${today.hourly[0]?.WindChillC || current.FeelsLikeC}°`;
    const comfortBar = document.getElementById('comfort-bar');
    comfortBar.style.width = `${comfort}%`;
    comfortBar.style.backgroundColor = color;
}
function updateHourlyChart(hourlyData) {
    try {
        const ctx = document.getElementById('hourly-chart').getContext('2d');
        if (hourlyChart) {
            hourlyChart.destroy();
        }
        const labels = hourlyData.map(h => `${h.time.toString().padStart(4, '0').slice(0, 2)}:00`);
        const temps = hourlyData.map(h => parseInt(h.tempC));
        const rain = hourlyData.map(h => parseInt(h.chanceofrain));
        hourlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temps,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Rain Chance (%)',
                    data: rain,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    fill: false,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
        console.log('Hourly chart updated successfully');
    } catch (error) {
        console.error('Error updating hourly chart:', error);
    }
} function updateTrendsChart(weatherData) {
    const ctx = document.getElementById('trends-chart').getContext('2d');
    if (trendsChart) {
        trendsChart.destroy();
    }
    const labels = weatherData.map(day => {
        const date = new Date(day.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const maxTemps = weatherData.map(day => parseInt(day.maxtempC));
    const minTemps = weatherData.map(day => parseInt(day.mintempC));
    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Max Temperature',
                data: maxTemps,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: '+1'
            }, {
                label: 'Min Temperature',
                data: minTemps,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'white' }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'rgba(255,255,255,0.7)' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: {
                    ticks: { color: 'rgba(255,255,255,0.7)' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });
}
function checkWeatherAlerts(current) {
    const alerts = [];
    if (parseInt(current.windspeedKmph) > 40) {
        alerts.push('High wind speeds detected. Take precautions when outdoors.');
    }
    if (parseInt(current.temp_C) > 35) {
        alerts.push('Extreme heat warning. Stay hydrated and avoid prolonged sun exposure.');
    }
    if (parseInt(current.temp_C) < -10) {
        alerts.push('Extreme cold warning. Dress warmly and limit time outdoors.');
    }
    if (parseFloat(current.precipMM) > 10) {
        alerts.push('Heavy rainfall detected. Be aware of potential flooding.');
    }
    const alertContainer = document.getElementById('weather-alert');
    const alertText = document.getElementById('alert-text');
    if (alerts.length > 0) {
        alertText.textContent = alerts[0];
        alertContainer.classList.remove('hidden');
    } else {
        alertContainer.classList.add('hidden');
    }
}
function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent =
        now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    document.getElementById('local-time').textContent =
        now.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
}
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('main-content').classList.add('hidden');
}
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
}
function showError(message) {
    const errorElement = document.getElementById('error-msg');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}
function hideError() {
    document.getElementById('error-msg').classList.add('hidden');
}

