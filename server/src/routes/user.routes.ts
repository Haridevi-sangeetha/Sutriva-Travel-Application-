import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRoles, enforceOwnerOrAdmin } from '../middleware/rbac';

const router = Router();

/**
 * GET /api/v1/users/me (Get current authenticated user profile)
 */
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
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
