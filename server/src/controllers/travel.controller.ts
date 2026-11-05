import { Request, Response } from 'express';
import { z } from 'zod';
import { travelService } from '../services/travel.service';
import { logger } from '../utils/logger';

const TravelSearchSchema = z.object({
  from: z.string().min(1, 'Origin location is required'),
  to: z.string().min(1, 'Destination is required'),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid departure date (YYYY-MM-DD) is required'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  travelers: z.object({
    adults: z.coerce.number().min(1).default(1),
    children: z.coerce.number().min(0).default(0),
    infants: z.coerce.number().min(0).optional().default(0)
  }),
  travelMode: z.enum([
    'Flights', 
    'Trains', 
    'Buses', 
    'Car Rentals', 
    'Cabs', 
    'Ferries', 
    'Bike/Scooter', 
    'More'
  ]).default('Flights'),
  cabinClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).optional(),
  filters: z.object({
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    directOnly: z.boolean().optional(),
    preferredAirline: z.string().optional(),
    departureTimeSlot: z.enum(['morning', 'afternoon', 'evening', 'night', 'all']).optional(),
    maxDurationMinutes: z.number().optional()
  }).optional(),
  sortBy: z.enum(['recommended', 'cheapest', 'fastest', 'departure_early']).optional()
});

export const searchTravelController = async (req: Request, res: Response) => {
  try {
    const validated = TravelSearchSchema.parse(req.body);
    
    // Normalize returnDate null -> undefined
    const cleanReq = {
      ...validated,
      returnDate: validated.returnDate || undefined
    };

    const response = await travelService.searchTravel(cleanReq);

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid travel search parameters',
        details: err.errors
      });
    }

    logger.error('Error in searchTravelController:', err);
    res.status(500).json({
      success: false,
      error: 'TRAVEL_SEARCH_ERROR',
      message: err.message || 'Failed to search travel options'
    });
  }
};

export const getSearchByIdController = async (req: Request, res: Response) => {
  try {
    const { searchId } = req.params;
    const response = travelService.getSearchById(searchId);

    if (!response) {
      return res.status(404).json({
        success: false,
        error: 'SEARCH_NOT_FOUND',
        message: `Search session "${searchId}" has expired or does not exist.`
      });
    }

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (err: any) {
    logger.error('Error in getSearchByIdController:', err);
    res.status(500).json({
      success: false,
      error: 'SEARCH_FETCH_ERROR',
      message: err.message
    });
  }
};

export const getOfferDetailsController = async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const offer = travelService.getOfferById(offerId);

    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'OFFER_NOT_FOUND',
        message: `Offer "${offerId}" not found or expired.`
      });
    }

    res.status(200).json({
      success: true,
      data: offer
    });
  } catch (err: any) {
    logger.error('Error in getOfferDetailsController:', err);
    res.status(500).json({
      success: false,
      error: 'OFFER_DETAILS_ERROR',
      message: err.message
    });
  }
};

export const verifyOfferController = async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const verification = await travelService.verifyOffer(offerId);

    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (err: any) {
    logger.error('Error in verifyOfferController:', err);
    res.status(500).json({
      success: false,
      error: 'VERIFICATION_ERROR',
      message: err.message
    });
  }
};

export const getProvidersStatusController = async (_req: Request, res: Response) => {
  try {
    const status = await travelService.getProvidersStatus();
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'STATUS_ERROR',
      message: err.message
    });
  }
};
