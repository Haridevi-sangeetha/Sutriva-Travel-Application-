import { Router } from 'express';
import {
  searchTravelController,
  getSearchByIdController,
  getOfferDetailsController,
  verifyOfferController,
  getProvidersStatusController
} from '../controllers/travel.controller';

const router = Router();

// 1. Search Travel Options (POST /api/v1/travel/search)
router.post('/search', searchTravelController);

// 2. Retrieve Cached Search by ID (GET /api/v1/travel/search/:searchId)
router.get('/search/:searchId', getSearchByIdController);

// 3. Get Offer Details (GET /api/v1/travel/offers/:offerId)
router.get('/offers/:offerId', getOfferDetailsController);

// 4. Verify Offer Availability & Pricing before Booking (POST /api/v1/travel/offers/:offerId/verify)
router.post('/offers/:offerId/verify', verifyOfferController);

// 5. Providers & External API Health Status (GET /api/v1/travel/providers/status)
router.get('/providers/status', getProvidersStatusController);

export default router;

