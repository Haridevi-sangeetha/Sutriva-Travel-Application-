import { Router } from 'express';
import { foodController } from '../controllers/food.controller';

const router = Router();

// Food API Routes connected to MongoDB
router.get('/', foodController.getFoodPlaces);
router.get('/categories', foodController.getFoodCategories);
router.get('/stats', foodController.getFoodStats);
router.get('/:id', foodController.getFoodById);

export default router;
