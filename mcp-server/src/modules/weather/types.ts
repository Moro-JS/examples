// Weather Types - Clean Type Definitions
export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  day: string;
  high: number;
  low: number;
  condition: string;
}

export interface WeatherQuery {
  location: string;
  units?: 'celsius' | 'fahrenheit';
  includeForecast?: boolean;
}

export interface WeatherLocation {
  name: string;
  key: string;
  region: string;
  country: string;
}
