/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { fetchWeatherApi } from 'openmeteo';
import { format, isToday, isTomorrow } from 'date-fns';
import { 
  Cloud, 
  CloudDrizzle, 
  CloudLightning, 
  CloudRain, 
  CloudSnow, 
  Droplets, 
  Eye, 
  MapPin, 
  Sun, 
  Thermometer, 
  Wind 
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
}

interface DailyWeather {
  time: Date[];
  precipitation_hours: Float32Array;
  temperature_2m_max: Float32Array;
  temperature_2m_min: Float32Array;
  wind_gusts_10m_max: Float32Array;
  wind_direction_10m_dominant: Float32Array;
}

interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

export default function App() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setLoading(true);
        const params = {
          latitude: -8.4964,
          longitude: 119.8877,
          daily: ["precipitation_hours", "temperature_2m_max", "temperature_2m_min", "wind_gusts_10m_max", "wind_direction_10m_dominant"],
          hourly: ["temperature_2m", "rain", "precipitation_probability", "visibility", "cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high"],
          current: ["temperature_2m", "rain", "cloud_cover", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"],
          timezone: "auto",
        };
        const url = "https://api.open-meteo.com/v1/forecast";
        const responses = await fetchWeatherApi(url, params);

        const response = responses[0];
        const utcOffsetSeconds = response.utcOffsetSeconds();

        const current = response.current()!;
        const hourly = response.hourly()!;
        const daily = response.daily()!;

        const parsedData: WeatherData = {
          current: {
            time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
            temperature_2m: current.variables(0)!.value(),
            rain: current.variables(1)!.value(),
            cloud_cover: current.variables(2)!.value(),
            wind_speed_10m: current.variables(3)!.value(),
            wind_direction_10m: current.variables(4)!.value(),
            wind_gusts_10m: current.variables(5)!.value(),
          },
          hourly: {
            time: Array.from(
              { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() }, 
              (_ , i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
            ),
            temperature_2m: hourly.variables(0)!.valuesArray()!,
            rain: hourly.variables(1)!.valuesArray()!,
            precipitation_probability: hourly.variables(2)!.valuesArray()!,
            visibility: hourly.variables(3)!.valuesArray()!,
            cloud_cover: hourly.variables(4)!.valuesArray()!,
            cloud_cover_low: hourly.variables(5)!.valuesArray()!,
            cloud_cover_mid: hourly.variables(6)!.valuesArray()!,
            cloud_cover_high: hourly.variables(7)!.valuesArray()!,
          },
          daily: {
            time: Array.from(
              { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() }, 
              (_ , i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
            ),
            precipitation_hours: daily.variables(0)!.valuesArray()!,
            temperature_2m_max: daily.variables(1)!.valuesArray()!,
            temperature_2m_min: daily.variables(2)!.valuesArray()!,
            wind_gusts_10m_max: daily.variables(3)!.valuesArray()!,
            wind_direction_10m_dominant: daily.variables(4)!.valuesArray()!,
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

  const getWeatherIcon = (cloudCover: number, rain: number, size = 24) => {
    if (rain > 5) return <CloudLightning size={size} className="text-yellow-400" />;
    if (rain > 0) return <CloudRain size={size} className="text-blue-400" />;
    if (cloudCover > 70) return <Cloud size={size} className="text-gray-400" />;
    if (cloudCover > 30) return <Cloud size={size} className="text-gray-300" />;
    return <Sun size={size} className="text-yellow-400" />;
  };

  const getWeatherDescription = (cloudCover: number, rain: number) => {
    if (rain > 5) return "Hujan Lebat";
    if (rain > 0) return "Hujan Ringan";
    if (cloudCover > 70) return "Mendung";
    if (cloudCover > 30) return "Berawan";
    return "Cerah";
  };

  const formatDay = (date: Date) => {
    if (isToday(date)) return "Hari Ini";
    if (isTomorrow(date)) return "Besok";
    return format(date, 'EEEE');
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
  const currentDesc = getWeatherDescription(current.cloud_cover, current.rain);

  // Get next 24 hours for hourly forecast
  const now = new Date();
  const currentHourIndex = hourly.time.findIndex(t => t > now) || 0;
  const next24Hours = Array.from({ length: 24 }).map((_, i) => {
    const idx = currentHourIndex + i;
    return {
      time: hourly.time[idx],
      temp: hourly.temperature_2m[idx],
      rain: hourly.rain[idx],
      cloudCover: hourly.cloud_cover[idx],
      precipProb: hourly.precipitation_probability[idx]
    };
  }).filter(h => h.time); // Filter out undefined if we reach end of array

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-900 text-white font-sans selection:bg-white/30 pb-10">
      <div className="max-w-md mx-auto px-4 pt-12 pb-6">
        
        {/* Header - Location */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <MapPin size={20} className="text-white/80" />
          <h1 className="text-2xl font-medium tracking-wide">Labuan Bajo</h1>
        </div>

        {/* Current Weather Hero */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="mb-4 drop-shadow-lg">
            {getWeatherIcon(current.cloud_cover, current.rain, 80)}
          </div>
          <div className="text-7xl font-light tracking-tighter mb-2 ml-4">
            {Math.round(current.temperature_2m)}°
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
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 border border-white/10">
            <Wind className="text-white/70" size={24} />
            <div>
              <div className="text-xs text-white/60 mb-0.5">Angin</div>
              <div className="font-medium">{Math.round(current.wind_speed_10m)} km/h</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 border border-white/10">
            <Droplets className="text-white/70" size={24} />
            <div>
              <div className="text-xs text-white/60 mb-0.5">Hujan</div>
              <div className="font-medium">{current.rain.toFixed(1)} mm</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 border border-white/10">
            <Cloud className="text-white/70" size={24} />
            <div>
              <div className="text-xs text-white/60 mb-0.5">Awan</div>
              <div className="font-medium">{Math.round(current.cloud_cover)}%</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 border border-white/10">
            <Thermometer className="text-white/70" size={24} />
            <div>
              <div className="text-xs text-white/60 mb-0.5">Hembusan</div>
              <div className="font-medium">{Math.round(current.wind_gusts_10m)} km/h</div>
            </div>
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
                  {i === 0 ? 'Sekarang' : format(hour.time, 'HH:mm')}
                </span>
                <div className="mb-3">
                  {getWeatherIcon(hour.cloudCover, hour.rain, 24)}
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
                  {/* We don't have daily cloud/rain averages directly in the provided query, 
                      so we'll use precipitation hours to guess the icon */}
                  {getWeatherIcon(daily.precipitation_hours[i] > 2 ? 80 : 20, daily.precipitation_hours[i] > 0 ? 1 : 0, 20)}
                </div>
                <div className="flex items-center justify-end w-24 space-x-3">
                  <span className="text-white/60 text-sm">{Math.round(daily.temperature_2m_min[i])}°</span>
                  <span className="font-medium w-6 text-right">{Math.round(daily.temperature_2m_max[i])}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

