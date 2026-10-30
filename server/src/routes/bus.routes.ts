import { Router } from 'express';
import { busController } from '../controllers/bus.controller';

const router = Router();

// Government Bus Routes (Connected to MongoDB localhost:27017 "Governmet Bus" collection)
router.get('/', busController.getBuses);
router.get('/popular-routes', busController.getPopularRoutes);
router.get('/stops', busController.getBusStops);
router.get('/stats', busController.getBusStats);
router.get('/:id', busController.getBusById);

export default router;
