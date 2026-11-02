import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRoles, enforceOwnerOrAdmin } from '../middleware/rbac';
import { userRepository } from '../models/user.model';

const router = Router();

/**
 * GET /api/v1/users/me (Get current authenticated user profile)
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  const user = await userRepository.findById((req.user as any).id);
  res.status(200).json({
    success: true,
    data: {
      user: user || req.user
    }
  });
});

/**
 * GET /api/v1/users/me/favorites (Get saved favorite places)
 */
router.get('/me/favorites', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const favorites = await userRepository.getFavorites(userId);
    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'FAVORITES_FETCH_ERROR', message: err.message });
  }
});

/**
 * POST /api/v1/users/me/favorites (Save a place to favorites)
 */
router.post('/me/favorites', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const place = req.body;
    if (!place || !place.id || !place.name) {
      return res.status(400).json({ success: false, error: 'INVALID_PLACE', message: 'Valid place object required' });
    }
    const updated = await userRepository.addFavorite(userId, place);
    res.status(201).json({
      success: true,
      message: 'Place saved to favorites',
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'FAVORITE_SAVE_ERROR', message: err.message });
  }
});

/**
 * DELETE /api/v1/users/me/favorites/:placeId (Remove a place from favorites)
 */
router.delete('/me/favorites/:placeId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const placeId = req.params.placeId;
    const updated = await userRepository.removeFavorite(userId, placeId);
    res.status(200).json({
      success: true,
      message: 'Place removed from favorites',
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'FAVORITE_REMOVE_ERROR', message: err.message });
  }
});

/**
 * GET /api/v1/users/me/trips (Get saved trips)
 */
router.get('/me/trips', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const trips = await userRepository.getTrips(userId);
    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'TRIPS_FETCH_ERROR', message: err.message });
  }
});

/**
 * POST /api/v1/users/me/trips (Save planned trip route)
 */
router.post('/me/trips', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const trip = req.body;
    if (!trip || !trip.from || !trip.to) {
      return res.status(400).json({ success: false, error: 'INVALID_TRIP', message: 'From and To locations required' });
    }
    const updated = await userRepository.saveTrip(userId, trip);
    res.status(201).json({
      success: true,
      message: 'Trip route saved successfully',
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'TRIP_SAVE_ERROR', message: err.message });
  }
});

/**
 * GET /api/v1/users/:userId/bookings (Protected IDOR check - User can only view own bookings)
 */
router.get('/:userId/bookings', authenticateToken, enforceOwnerOrAdmin('userId'), (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      userId: req.params.userId,
      bookings: [
        {
          id: 'bkg_99201',
          type: 'FLIGHT',
          route: 'Chennai (MAA) ➔ Bali (DPS)',
          date: '2026-10-15',
          status: 'CONFIRMED',
          pnr: 'STV-9821'
        }
      ]
    }
  });
});

/**
 * GET /api/v1/admin/dashboard (Restricted to ADMIN role only)
 */
router.get('/admin/dashboard', authenticateToken, requireRoles('ADMIN'), (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      totalUsers: 1420,
      activeBookingsToday: 89,
      systemHealth: 'OPERATIONAL'
    }
  });
});

export default router;
