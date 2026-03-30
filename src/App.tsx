import React, { useEffect, useState } from 'react';
import { fetchWeatherApi } from 'openmeteo';
import { 
  Cloud, 
  CloudLightning, 
  CloudRain, 
  Droplets, 
  Eye, 
  Info,
  MapPin, 
  Moon,
  Sun, 
  SunDim,
  Sunrise,
  Sunset,
  Thermometer, 
  Wind,
  X
} from 'lucide-react';

// Define types for our parsed weather data
interface CurrentWeather {
  time: Date;
  temperature_2m: number;
  rain: number;
  cloud_cover: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  relative_humidity_2m: number;
  is_day: number;
}

interface Minutely15Weather {
  time: Date[];
  temperature_2m: Float32Array;
  relative_humidity_2m: Float32Array;
  visibility: Float32Array;
  lightning_potential: Float32Array;
  is_day: Float32Array;
  rain: Float32Array;
  sunshine_duration: Float32Array;
  wind_speed_10m: Float32Array;
  wind_speed_80m: Float32Array;
  wind_direction_10m: Float32Array;
  wind_direction_80m: Float32Array;
}

interface HourlyWeather {
  time: Date[];
  temperature_2m: Float32Array;
  rain: Float32Array;
  precipitation_probability: Float32Array;
  visibility: Float32Array;
  cloud_cover: Float32Array;
  cloud_cover_low: Float32Array;
  cloud_cover_mid: Float32Array;
  cloud_cover_high: Float32Array;
  wind_gusts_10m: Float32Array;
  wind_direction_10m: Float32Array;
  wind_speed_10m: Float32Array;
  wind_speed_80m: Float32Array;
  wind_speed_120m: Float32Array;
  wind_speed_180m: Float32Array;
  wind_direction_80m: Float32Array;
  wind_direction_120m: Float32Array;
  wind_direction_180m: Float32Array;
  temperature_80m: Float32Array;
  temperature_120m: Float32Array;
  temperature_180m: Float32Array;
  uv_index: Float32Array;
  uv_index_clear_sky: Float32Array;
  is_day: Float32Array;
  sunshine_duration: Float32Array;
}

interface DailyWeather {
  time: Date[];
  precipitation_hours: Float32Array;
  temperature_2m_max: Float32Array;
  temperature_2m_min: Float32Array;
  wind_gusts_10m_max: Float32Array;
  wind_direction_10m_dominant: Float32Array;
  wind_speed_10m_max: Float32Array;
  sunrise: Date[];
  sunset: Date[];
  daylight_duration: Float32Array;
  sunshine_duration: Float32Array;
  precipitation_probability_max: Float32Array;
}

interface WeatherData {
  current: CurrentWeather;
  minutely15: Minutely15Weather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

export default function App() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<{title: string, description: string} | null>(null);

  const weatherInfo = {
    wind: { title: "Kecepatan Angin", description: "Kecepatan rata-rata pergerakan udara. Angin kencang dapat membuat suhu terasa lebih dingin dari aslinya." },
    humidity: { title: "Kelembapan", description: "Persentase uap air di udara. Kelembapan yang tinggi (di atas 70%) dapat membuat udara terasa lebih panas dan lengket." },
    clouds: { title: "Tutupan Awan", description: "Persentase langit yang tertutup awan. 100% berarti langit sepenuhnya mendung, 0% berarti langit sangat cerah." },
    gusts: { title: "Hembusan Angin", description: "Peningkatan kecepatan angin secara tiba-tiba dan singkat. Biasanya lebih kuat dari kecepatan angin rata-rata." },
    uv: { title: "Indeks UV", description: "Ukuran kekuatan radiasi ultraviolet matahari. Indeks 3-5 (Sedang), 6-7 (Tinggi), 8-10 (Sangat Tinggi). Disarankan memakai tabir surya jika indeks di atas 3." },
    visibility: { title: "Jarak Pandang", description: "Jarak maksimal di mana objek masih dapat terlihat jelas. Jarak pandang rendah (< 2 km) biasanya disebabkan oleh kabut tebal atau hujan lebat." },
    sunrise: { title: "Matahari Terbit", description: "Waktu ketika bagian atas matahari pertama kali muncul di atas cakrawala di pagi hari." },
    sunset: { title: "Matahari Terbenam", description: "Waktu ketika matahari menghilang di bawah cakrawala di sore/malam hari." },
    rain: { title: "Curah Hujan", description: "Perkiraan volume air hujan yang turun, diukur dalam milimeter (mm)." },
    temp: { title: "Suhu Udara", description: "Ukuran panas atau dinginnya udara saat ini." }
  };

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setLoading(true);
        const params = {
          latitude: -8.4964,
          longitude: 119.8877,
          daily: ["precipitation_hours", "temperature_2m_max", "temperature_2m_min", "wind_gusts_10m_max", "wind_direction_10m_dominant", "wind_speed_10m_max", "sunrise", "sunset", "daylight_duration", "sunshine_duration", "precipitation_probability_max"],
          hourly: ["temperature_2m", "rain", "precipitation_probability", "visibility", "cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high", "wind_gusts_10m", "wind_direction_10m", "wind_speed_10m", "wind_speed_80m", "wind_speed_120m", "wind_speed_180m", "wind_direction_80m", "wind_direction_120m", "wind_direction_180m", "temperature_80m", "temperature_120m", "temperature_180m", "uv_index", "uv_index_clear_sky", "is_day", "sunshine_duration"],
          current: ["temperature_2m", "rain", "cloud_cover", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "relative_humidity_2m", "is_day"],
          minutely_15: ["temperature_2m", "relative_humidity_2m", "visibility", "lightning_potential", "is_day", "rain", "sunshine_duration", "wind_speed_10m", "wind_speed_80m", "wind_direction_10m", "wind_direction_80m"],
          timezone: "Asia/Singapore",
        };
        const url = "https://api.open-meteo.com/v1/forecast";
        const responses = await fetchWeatherApi(url, params);

        const response = responses[0];
        const utcOffsetSeconds = response.utcOffsetSeconds();

        const current = response.current()!;
        const minutely15 = response.minutely15()!;
        const hourly = response.hourly()!;
        const daily = response.daily()!;

        const sunrise = daily.variables(6)!;
        const sunset = daily.variables(7)!;

        const parsedData: WeatherData = {
          current: {
            time: new Date(Number(current.time()) * 1000),
            temperature_2m: current.variables(0)!.value(),
            rain: current.variables(1)!.value(),
            cloud_cover: current.variables(2)!.value(),
            wind_speed_10m: current.variables(3)!.value(),
            wind_direction_10m: current.variables(4)!.value(),
            wind_gusts_10m: current.variables(5)!.value(),
            relative_humidity_2m: current.variables(6)!.value(),
            is_day: current.variables(7)!.value(),
          },
          minutely15: {
            time: Array.from(
              { length: (Number(minutely15.timeEnd()) - Number(minutely15.time())) / minutely15.interval() }, 
              (_ , i) => new Date((Number(minutely15.time()) + i * minutely15.interval()) * 1000)
            ),
            temperature_2m: minutely15.variables(0)!.valuesArray()!,
            relative_humidity_2m: minutely15.variables(1)!.valuesArray()!,
            visibility: minutely15.variables(2)!.valuesArray()!,
            lightning_potential: minutely15.variables(3)!.valuesArray()!,
            is_day: minutely15.variables(4)!.valuesArray()!,
            rain: minutely15.variables(5)!.valuesArray()!,
            sunshine_duration: minutely15.variables(6)!.valuesArray()!,
            wind_speed_10m: minutely15.variables(7)!.valuesArray()!,
            wind_speed_80m: minutely15.variables(8)!.valuesArray()!,
            wind_direction_10m: minutely15.variables(9)!.valuesArray()!,
            wind_direction_80m: minutely15.variables(10)!.valuesArray()!,
          },
          hourly: {
            time: Array.from(
              { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() }, 
              (_ , i) => new Date((Number(hourly.time()) + i * hourly.interval()) * 1000)
            ),
            temperature_2m: hourly.variables(0)!.valuesArray()!,
            rain: hourly.variables(1)!.valuesArray()!,
            precipitation_probability: hourly.variables(2)!.valuesArray()!,
            visibility: hourly.variables(3)!.valuesArray()!,
            cloud_cover: hourly.variables(4)!.valuesArray()!,
            cloud_cover_low: hourly.variables(5)!.valuesArray()!,
            cloud_cover_mid: hourly.variables(6)!.valuesArray()!,
            cloud_cover_high: hourly.variables(7)!.valuesArray()!,
            wind_gusts_10m: hourly.variables(8)!.valuesArray()!,
            wind_direction_10m: hourly.variables(9)!.valuesArray()!,
            wind_speed_10m: hourly.variables(10)!.valuesArray()!,
            wind_speed_80m: hourly.variables(11)!.valuesArray()!,
            wind_speed_120m: hourly.variables(12)!.valuesArray()!,
            wind_speed_180m: hourly.variables(13)!.valuesArray()!,
            wind_direction_80m: hourly.variables(14)!.valuesArray()!,
            wind_direction_120m: hourly.variables(15)!.valuesArray()!,
            wind_direction_180m: hourly.variables(16)!.valuesArray()!,
            temperature_80m: hourly.variables(17)!.valuesArray()!,
            temperature_120m: hourly.variables(18)!.valuesArray()!,
            temperature_180m: hourly.variables(19)!.valuesArray()!,
            uv_index: hourly.variables(20)!.valuesArray()!,
            uv_index_clear_sky: hourly.variables(21)!.valuesArray()!,
            is_day: hourly.variables(22)!.valuesArray()!,
            sunshine_duration: hourly.variables(23)!.valuesArray()!,
          },
          daily: {
            time: Array.from(
              { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() }, 
              (_ , i) => new Date((Number(daily.time()) + i * daily.interval()) * 1000)
            ),
            precipitation_hours: daily.variables(0)!.valuesArray()!,
            temperature_2m_max: daily.variables(1)!.valuesArray()!,
            temperature_2m_min: daily.variables(2)!.valuesArray()!,
            wind_gusts_10m_max: daily.variables(3)!.valuesArray()!,
            wind_direction_10m_dominant: daily.variables(4)!.valuesArray()!,
            wind_speed_10m_max: daily.variables(5)!.valuesArray()!,
            sunrise: [...Array(sunrise.valuesInt64Length())].map(
              (_ , i) => new Date(Number(sunrise.valuesInt64(i)) * 1000)
            ),
            sunset: [...Array(sunset.valuesInt64Length())].map(
              (_ , i) => new Date(Number(sunset.valuesInt64(i)) * 1000)
            ),
            daylight_duration: daily.variables(8)!.valuesArray()!,
            sunshine_duration: daily.variables(9)!.valuesArray()!,
            precipitation_probability_max: daily.variables(10)!.valuesArray()!,
          },
        };

        setWeatherData(parsedData);
      } catch (err) {
        console.error("Failed to fetch weather data:", err);
        setError("Gagal memuat data cuaca. Silakan coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    };

    loadWeather();
  }, []);

  const getWeatherIcon = (cloudCover: number, rain: number, isDay: number = 1, size = 24) => {
    if (rain > 5) return <CloudLightning size={size} className="text-yellow-400" />;
    if (rain > 0) return <CloudRain size={size} className="text-blue-400" />;
    if (cloudCover > 70) return <Cloud size={size} className="text-gray-400" />;
    if (cloudCover > 30) return <Cloud size={size} className="text-gray-300" />;
    return isDay ? <Sun size={size} className="text-yellow-400" /> : <Moon size={size} className="text-blue-200" />;
  };

  const getWeatherDescription = (cloudCover: number, rain: number, isDay: number = 1) => {
    if (rain > 5) return "Hujan Lebat";
    if (rain > 0) return "Hujan Ringan";
    if (cloudCover > 70) return "Mendung";
    if (cloudCover > 30) return "Berawan";
    return isDay ? "Cerah" : "Cerah (Malam)";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit' });
  };

  const formatDay = (date: Date) => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
    
    const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
    
    if (dateStr === todayStr) return "Hari Ini";
    if (dateStr === tomorrowStr) return "Besok";
    
    return date.toLocaleDateString('id-ID', { timeZone: 'Asia/Singapore', weekday: 'long' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white p-6 text-center">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl">
          <p className="text-xl">{error || "Terjadi kesalahan"}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const { current, hourly, daily } = weatherData;
  const currentDesc = getWeatherDescription(current.cloud_cover, current.rain, current.is_day);
  const isNight = current.is_day === 0;

  // Get next 24 hours for hourly forecast
  const now = new Date();
  let currentHourIndex = hourly.time.findIndex(t => t > now);
  if (currentHourIndex > 0) currentHourIndex -= 1;
  if (currentHourIndex === -1) currentHourIndex = 0;
  
  const next24Hours = Array.from({ length: 24 }).map((_, i) => {
    const idx = currentHourIndex + i;
    return {
      time: hourly.time[idx],
      temp: hourly.temperature_2m[idx],
      rain: hourly.rain[idx],
      cloudCover: hourly.cloud_cover[idx],
      precipProb: hourly.precipitation_probability[idx],
      isDay: hourly.is_day[idx]
    };
  }).filter(h => h.time); // Filter out undefined if we reach end of array

  return (
    <div className={`min-h-screen font-sans selection:bg-white/30 pb-10 transition-colors duration-1000 ${
      isNight 
        ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white' 
        : 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-900 text-white'
    }`}>
      <div className="max-w-md mx-auto px-4 pt-12 pb-6">
        
        {/* Header - Location */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <MapPin size={20} className="text-white/80" />
          <h1 className="text-2xl font-medium tracking-wide">Labuan Bajo</h1>
        </div>

        {/* Current Weather Hero */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div 
            className="mb-4 drop-shadow-lg cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setInfoModal(current.rain > 0 ? weatherInfo.rain : weatherInfo.clouds)}
          >
            {getWeatherIcon(current.cloud_cover, current.rain, current.is_day, 80)}
          </div>
          <div 
            className="text-7xl font-light tracking-tighter mb-2 ml-4 cursor-pointer hover:opacity-80 transition-opacity flex items-start"
            onClick={() => setInfoModal(weatherInfo.temp)}
          >
            {Math.round(current.temperature_2m)}°
            <Info size={16} className="opacity-40 mt-2 ml-1" />
          </div>
          <div className="text-xl font-medium text-white/90 mb-1">
            {currentDesc}
          </div>
          <div className="text-white/70 text-sm flex items-center space-x-3">
            <span>H: {Math.round(daily.temperature_2m_max[0])}°</span>
            <span>L: {Math.round(daily.temperature_2m_min[0])}°</span>
          </div>
        </div>

        {/* Current Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div 
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
            onClick={() => setInfoModal(weatherInfo.wind)}
          >
            <Wind className="text-white/70" size={24} />
            <div>
              <div className="text-xs text-white/60 mb-0.5 flex items-center gap-1">Angin <Info size={10} className="opacity-50" /></div>
              <div className="font-medium">{Math.round(current.wind_speed_10m)} km/h</div>
            </div>
          </div>
          <div 
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
            onClick={() => setInfoModal(weatherInfo.humidity)}
          >
            <Droplets className="text-white/70" size={24} />
            <div>
              <div className="text-xs text-white/60 mb-0.5 flex items-center gap-1">Kelembapan <Info size={10} className="opacity-50" /></div>
              <div className="font-medium">{Math.round(current.relative_humidity_2m)}%</div>
            </div>
          </div>
          <div 
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
            onClick={() => setInfoModal(weatherInfo.clouds)}
          >
            <Cloud className="text-white/70" size={24} />
            <div>
              <div className="text-xs text-white/60 mb-0.5 flex items-center gap-1">Awan <Info size={10} className="opacity-50" /></div>
              <div className="font-medium">{Math.round(current.cloud_cover)}%</div>
            </div>
          </div>
          <div 
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
            onClick={() => setInfoModal(weatherInfo.gusts)}
          >
            <Thermometer className="text-white/70" size={24} />
            <div>
              <div className="text-xs text-white/60 mb-0.5 flex items-center gap-1">Hembusan <Info size={10} className="opacity-50" /></div>
              <div className="font-medium">{Math.round(current.wind_gusts_10m)} km/h</div>
            </div>
          </div>
          <div 
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
            onClick={() => setInfoModal(weatherInfo.uv)}
          >
            <SunDim className="text-white/70" size={24} />
            <div>
              <div className="text-xs text-white/60 mb-0.5 flex items-center gap-1">UV Index <Info size={10} className="opacity-50" /></div>
              <div className="font-medium">{hourly.uv_index[currentHourIndex]?.toFixed(1) || 0}</div>
            </div>
          </div>
          <div 
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
            onClick={() => setInfoModal(weatherInfo.visibility)}
          >
            <Eye className="text-white/70" size={24} />
            <div>
              <div className="text-xs text-white/60 mb-0.5 flex items-center gap-1">Jarak Pandang <Info size={10} className="opacity-50" /></div>
              <div className="font-medium">{(hourly.visibility[currentHourIndex] / 1000).toFixed(1)} km</div>
            </div>
          </div>
        </div>

        {/* Sun & Moon */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 mb-8 border border-white/10 flex justify-around">
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity p-2 rounded-xl"
            onClick={() => setInfoModal(weatherInfo.sunrise)}
          >
            <Sunrise className="text-yellow-400 mb-2" size={28} />
            <span className="text-xs text-white/60 mb-1 flex items-center gap-1">Matahari Terbit <Info size={10} className="opacity-50" /></span>
            <span className="font-medium">{formatTime(daily.sunrise[0])}</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity p-2 rounded-xl"
            onClick={() => setInfoModal(weatherInfo.sunset)}
          >
            <Sunset className="text-orange-400 mb-2" size={28} />
            <span className="text-xs text-white/60 mb-1 flex items-center gap-1">Matahari Terbenam <Info size={10} className="opacity-50" /></span>
            <span className="font-medium">{formatTime(daily.sunset[0])}</span>
          </div>
        </div>

        {/* Hourly Forecast */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 mb-8 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white/80 uppercase tracking-wider">Perkiraan Per Jam</h2>
          </div>
          <div className="flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide space-x-6">
            {next24Hours.map((hour, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0">
                <span className="text-sm text-white/80 mb-3">
                  {i === 0 ? 'Sekarang' : formatTime(hour.time)}
                </span>
                <div className="mb-3">
                  {getWeatherIcon(hour.cloudCover, hour.rain, hour.isDay, 24)}
                </div>
                <span className="text-lg font-medium">
                  {Math.round(hour.temp)}°
                </span>
                {hour.precipProb > 0 && (
                  <span className="text-[10px] text-blue-300 mt-1 font-medium">
                    {Math.round(hour.precipProb)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Daily Forecast */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10">
          <div className="flex items-center mb-4">
            <h2 className="text-sm font-medium text-white/80 uppercase tracking-wider">7 Hari Kedepan</h2>
          </div>
          <div className="space-y-4">
            {daily.time.map((day, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="w-24 text-base font-medium text-white/90">
                  {formatDay(day)}
                </div>
                <div className="flex items-center justify-center w-12">
                  {getWeatherIcon(daily.precipitation_hours[i] > 2 ? 80 : 20, daily.precipitation_hours[i] > 0 ? 1 : 0, 1, 20)}
                </div>
                <div className="flex items-center justify-end w-32 space-x-3">
                  <span className="text-blue-300 text-xs w-8 text-right">
                    {daily.precipitation_probability_max[i] > 0 ? `${Math.round(daily.precipitation_probability_max[i])}%` : ''}
                  </span>
                  <span className="text-white/60 text-sm w-6 text-right">{Math.round(daily.temperature_2m_min[i])}°</span>
                  <span className="font-medium w-6 text-right">{Math.round(daily.temperature_2m_max[i])}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Info Modal Overlay */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setInfoModal(null)}>
          <div 
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl max-w-sm w-full shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-white">
                <Info size={20} className="text-blue-300" />
                <h3 className="text-lg font-semibold">{infoModal.title}</h3>
              </div>
              <button 
                onClick={() => setInfoModal(null)}
                className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              {infoModal.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
