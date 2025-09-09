// Weather Actions - Pure Business Logic
import { WeatherData, WeatherQuery, WeatherLocation } from './types';

// Mock weather data for demonstration
const mockWeatherData: { [key: string]: WeatherData } = {
  'new york': {
    location: 'New York, NY',
    temperature: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 15,
    forecast: [
      { day: 'Today', high: 25, low: 18, condition: 'Partly Cloudy' },
      { day: 'Tomorrow', high: 28, low: 20, condition: 'Sunny' },
      { day: 'Day 3', high: 23, low: 16, condition: 'Rainy' },
      { day: 'Day 4', high: 26, low: 19, condition: 'Clear' },
      { day: 'Day 5', high: 24, low: 17, condition: 'Cloudy' }
    ]
  },
  'london': {
    location: 'London, UK',
    temperature: 15,
    condition: 'Overcast',
    humidity: 78,
    windSpeed: 12,
    forecast: [
      { day: 'Today', high: 18, low: 12, condition: 'Overcast' },
      { day: 'Tomorrow', high: 16, low: 10, condition: 'Rainy' },
      { day: 'Day 3', high: 19, low: 13, condition: 'Partly Cloudy' },
      { day: 'Day 4', high: 17, low: 11, condition: 'Foggy' },
      { day: 'Day 5', high: 20, low: 14, condition: 'Sunny' }
    ]
  },
  'tokyo': {
    location: 'Tokyo, Japan',
    temperature: 28,
    condition: 'Clear',
    humidity: 60,
    windSpeed: 8,
    forecast: [
      { day: 'Today', high: 30, low: 24, condition: 'Clear' },
      { day: 'Tomorrow', high: 32, low: 26, condition: 'Sunny' },
      { day: 'Day 3', high: 29, low: 23, condition: 'Partly Cloudy' },
      { day: 'Day 4', high: 27, low: 21, condition: 'Rainy' },
      { day: 'Day 5', high: 31, low: 25, condition: 'Hot' }
    ]
  },
  'san francisco': {
    location: 'San Francisco, CA',
    temperature: 19,
    condition: 'Foggy',
    humidity: 85,
    windSpeed: 20,
    forecast: [
      { day: 'Today', high: 21, low: 16, condition: 'Foggy' },
      { day: 'Tomorrow', high: 23, low: 17, condition: 'Partly Cloudy' },
      { day: 'Day 3', high: 20, low: 15, condition: 'Overcast' },
      { day: 'Day 4', high: 22, low: 16, condition: 'Clear' },
      { day: 'Day 5', high: 24, low: 18, condition: 'Sunny' }
    ]
  }
};

export async function getWeather(
  query: WeatherQuery, 
  database: any
): Promise<WeatherData | null> {
  const key = query.location.toLowerCase().trim();
  const data = mockWeatherData[key];
  
  if (!data) {
    return null;
  }

  // Convert temperature if needed
  if (query.units === 'fahrenheit') {
    return {
      ...data,
      temperature: celsiusToFahrenheit(data.temperature),
      forecast: data.forecast.map(day => ({
        ...day,
        high: celsiusToFahrenheit(day.high),
        low: celsiusToFahrenheit(day.low)
      }))
    };
  }

  return { ...data };
}

export async function getAvailableLocations(database: any): Promise<WeatherLocation[]> {
  return Object.values(mockWeatherData).map(data => ({
    name: data.location,
    key: data.location.toLowerCase().replace(/[^a-z0-9]/g, ''),
    region: data.location.split(',')[1]?.trim() || '',
    country: data.location.includes('UK') ? 'United Kingdom' : 
             data.location.includes('Japan') ? 'Japan' : 'United States'
  }));
}

export async function searchLocations(
  query: string, 
  database: any
): Promise<WeatherLocation[]> {
  const allLocations = await getAvailableLocations(database);
  return allLocations.filter(location => 
    location.name.toLowerCase().includes(query.toLowerCase()) ||
    location.region.toLowerCase().includes(query.toLowerCase()) ||
    location.country.toLowerCase().includes(query.toLowerCase())
  );
}

function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9/5) + 32);
}

function fahrenheitToCelsius(fahrenheit: number): number {
  return Math.round((fahrenheit - 32) * 5/9);
} 