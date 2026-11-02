import { Router } from 'express';
import {
  geocodeController,
  reverseGeocodeController,
  autocompleteController,
  searchPlacesController,
  routeController,
  placeDetailsController
} from '../controllers/places.controller';

const router = Router();

// 1. Geocode Location (GET /api/v1/places/geocode?address=Yercaud)
router.get('/geocode', geocodeController);

// 2. Reverse Geocode Coordinates (GET /api/v1/places/reverse-geocode?lat=11.78&lng=78.21)
router.get('/reverse-geocode', reverseGeocodeController);

// 3. Location Autocomplete (GET /api/v1/places/autocomplete?input=Yerc)
router.get('/autocomplete', autocompleteController);

// 4. Discover Real Recommended Places (GET /api/v1/places/search?lat=11.78&lng=78.21&category=Temples&radius=50)
router.get('/search', searchPlacesController);

// 5. Calculate Real Road Route (POST /api/v1/places/route)
router.post('/route', routeController);

// 6. Get Place Details by ID (GET /api/v1/places/details/:placeId)
router.get('/details/:placeId', placeDetailsController);

export default router;
