import { Request, Response } from 'express';
import { z } from 'zod';
import { placesService, VERIFIED_REGIONAL_PLACES } from '../services/places.service';
import { logger } from '../utils/logger';

const GeocodeQuerySchema = z.object({
  address: z.string().min(1, 'Address is required')
});

const ReverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number()
});

const AutocompleteQuerySchema = z.object({
  input: z.string().min(1, 'Input query is required')
});

const SearchPlacesQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  category: z.string().optional(),
  radius: z.coerce.number().optional(),
  maxBudget: z.string().optional(),
  verified: z.string().optional(),
  sort: z.enum(['rating', 'distance', 'price']).optional()
});

const RouteBodySchema = z.object({
  fromLat: z.number(),
  fromLng: z.number(),
  toLat: z.number(),
  toLng: z.number(),
  mode: z.enum(['driving', 'walking', 'cycling']).optional()
});

export const geocodeController = async (req: Request, res: Response) => {
  try {
    const { address } = GeocodeQuerySchema.parse(req.query);
    const result = await placesService.geocode(address);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'LOCATION_NOT_FOUND',
        message: `Could not resolve geographical coordinates for "${address}".`
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err: any) {
    logger.error('Error in geocodeController:', err);
    res.status(400).json({
      success: false,
      error: 'GEOCODE_ERROR',
      message: err.message
    });
  }
};

export const reverseGeocodeController = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = ReverseGeocodeQuerySchema.parse(req.query);
    const address = await placesService.reverseGeocode(lat, lng);

    res.status(200).json({
      success: true,
      data: {
        address,
        name: address,
        lat,
        lng
      }
    });
  } catch (err: any) {
    logger.error('Error in reverseGeocodeController:', err);
    res.status(400).json({
      success: false,
      error: 'REVERSE_GEOCODE_ERROR',
      message: err.message
    });
  }
};

export const autocompleteController = async (req: Request, res: Response) => {
  try {
    const { input } = AutocompleteQuerySchema.parse(req.query);
    const suggestions = await placesService.autocomplete(input);

    res.status(200).json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });
  } catch (err: any) {
    logger.error('Error in autocompleteController:', err);
    res.status(400).json({
      success: false,
      error: 'AUTOCOMPLETE_ERROR',
      message: err.message
    });
  }
};

export const searchPlacesController = async (req: Request, res: Response) => {
  try {
    const validated = SearchPlacesQuerySchema.parse(req.query);
    const places = await placesService.searchNearbyPlaces({
      lat: validated.lat,
      lng: validated.lng,
      category: validated.category || 'all',
      radiusKm: validated.radius || 50,
      maxBudget: validated.maxBudget || 'any',
      verifiedOnly: validated.verified === 'true' || validated.verified === '1',
      sortBy: validated.sort || 'rating'
    });

    res.status(200).json({
      success: true,
      count: places.length,
      referenceCoord: { lat: validated.lat, lng: validated.lng },
      data: places
    });
  } catch (err: any) {
    logger.error('Error in searchPlacesController:', err);
    res.status(400).json({
      success: false,
      error: 'SEARCH_PLACES_ERROR',
      message: err.message
    });
  }
};

export const routeController = async (req: Request, res: Response) => {
  try {
    const validated = RouteBodySchema.parse(req.body);
    const route = await placesService.calculateRoute(
      validated.fromLat,
      validated.fromLng,
      validated.toLat,
      validated.toLng,
      validated.mode || 'driving'
    );

    res.status(200).json({
      success: true,
      data: route
    });
  } catch (err: any) {
    logger.error('Error in routeController:', err);
    res.status(400).json({
      success: false,
      error: 'ROUTE_CALCULATION_ERROR',
      message: err.message
    });
  }
};

export const placeDetailsController = async (req: Request, res: Response) => {
  try {
    const placeId = req.params.placeId;
    const found = VERIFIED_REGIONAL_PLACES.find(p => p.id === placeId);

    if (found) {
      return res.status(200).json({
        success: true,
        data: found
      });
    }

    res.status(404).json({
      success: false,
      error: 'PLACE_NOT_FOUND',
      message: 'Place details not found'
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'PLACE_DETAILS_ERROR',
      message: err.message
    });
  }
};
