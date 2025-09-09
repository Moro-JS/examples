// Weather Routes - HTTP API for debugging
// import { RouteConfig } from '@morojs/moro';
import * as actions from './actions';
import { WeatherQuerySchema, LocationSearchSchema } from './schemas';

export const routes: any[] = [
  {
    method: 'GET',
    path: '/locations',
    handler: async (req, res) => {
      const database = req.database || {};
      const locations = await actions.getAvailableLocations(database);
      return { locations };
    },
    description: 'Get all available weather locations',
  },

  {
    method: 'GET',
    path: '/search',
    handler: async (req, res) => {
      const database = req.database || {};
      const { query } = LocationSearchSchema.parse(req.query);
      const locations = await actions.searchLocations(query, database);
      return { locations, query };
    },
    description: 'Search for weather locations',
  },

  {
    method: 'GET',
    path: '/:location',
    handler: async (req, res) => {
      const database = req.database || {};
      const query = WeatherQuerySchema.parse({
        location: req.params.location,
        ...req.query,
      });

      const weather = await actions.getWeather(
        {
          location: req.params.location,
          units: (req.query.units as 'celsius' | 'fahrenheit') || 'celsius',
          includeForecast: (req.query.includeForecast as string) !== 'false',
        },
        database
      );

      if (!weather) {
        res.statusCode = 404;
        return { error: 'Weather data not available for this location' };
      }

      return { weather };
    },
    description: 'Get weather data for a specific location',
  },
];
