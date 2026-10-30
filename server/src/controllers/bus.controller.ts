import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getBusCollection } from '../config/db';
import { logger } from '../utils/logger';
import { IEnrichedBusRoute } from '../models/bus.model';

function calculateDuration(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return '45 mins';
  try {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Crosses midnight
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  } catch {
    return '50 mins';
  }
}

function calculateEstimatedFare(stopsCount: number, routeNum: string): string {
  const isExpress = routeNum.includes('X') || routeNum.includes('AC');
  const isDeluxe = routeNum.includes('D');
  if (isExpress) return '₹25 – ₹45';
  if (isDeluxe) return '₹18 – ₹35';
  if (stopsCount <= 10) return '₹6 – ₹11';
  if (stopsCount <= 25) return '₹11 – ₹18';
  return '₹15 – ₹25';
}

function determineServiceType(routeNum: string): string {
  const r = (routeNum || '').toUpperCase();
  if (r.includes('AC') || r.startsWith('V')) return 'Air Conditioned Volvo';
  if (r.includes('X')) return 'Express Service';
  if (r.includes('D')) return 'Deluxe Service';
  if (r.includes('CT')) return 'Cut Service';
  if (r.includes('N') || r.includes('NIGHT')) return 'Night Service';
  return 'Regular Ordinary Service';
}

function enrichBus(doc: any, includeAllStops = false): IEnrichedBusRoute {
  const stops = Array.isArray(doc.stops) ? doc.stops : [];
  const firstStop = stops[0] || {};
  const lastStop = stops[stops.length - 1] || {};

  const startTime = firstStop.departureTime || firstStop.arrivalTime || '06:00:00';
  const endTime = lastStop.arrivalTime || lastStop.departureTime || '07:00:00';
  const originStop = firstStop.stopName || 'Terminus';
  const destinationStop = lastStop.stopName || 'Terminus';
  const totalStops = stops.length;
  const estimatedDuration = calculateDuration(startTime, endTime);
  const estimatedFare = calculateEstimatedFare(totalStops, doc.routeNumber || '');
  const serviceType = determineServiceType(doc.routeNumber || '');

  return {
    _id: doc._id.toString(),
    operator: doc.operator || 'MTC',
    routeId: doc.routeId || '',
    routeNumber: doc.routeNumber || 'MTC',
    routeName: (doc.routeName || `${originStop} TO ${destinationStop}`).replace(/ TO /gi, ' ➔ '),
    stops: includeAllStops ? stops : [firstStop, lastStop],
    totalStops,
    originStop,
    destinationStop,
    startTime: startTime.slice(0, 5),
    endTime: endTime.slice(0, 5),
    estimatedDuration,
    estimatedFare,
    serviceType,
    source: doc.source || 'ChennaiGTFS',
    verified: true
  };
}

export const busController = {
  // GET /api/v1/buses
  async getBuses(req: Request, res: Response): Promise<void> {
    try {
      const collection = getBusCollection();

      const search = (req.query.search as string || '').trim();
      const from = (req.query.from as string || '').trim();
      const to = (req.query.to as string || '').trim();
      const routeNum = (req.query.route as string || '').trim();
      const operator = (req.query.operator as string || '').trim();
      const includeStops = req.query.includeStops === 'true';

      const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const skip = (page - 1) * limit;

      const filter: any = {};

      if (operator && operator.toLowerCase() !== 'all') {
        filter.operator = { $regex: new RegExp(operator, 'i') };
      }

      if (routeNum) {
        filter.routeNumber = { $regex: new RegExp(`^${routeNum}`, 'i') };
      }

      // Filter by From & To stops
      if (from && to) {
        filter.$and = [
          { 'stops.stopName': { $regex: new RegExp(from, 'i') } },
          { 'stops.stopName': { $regex: new RegExp(to, 'i') } }
        ];
      } else if (from) {
        filter['stops.stopName'] = { $regex: new RegExp(from, 'i') };
      } else if (to) {
        filter['stops.stopName'] = { $regex: new RegExp(to, 'i') };
      }

      // General search query
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const orClauses: any[] = [
          { routeNumber: searchRegex },
          { routeName: searchRegex },
          { 'stops.stopName': searchRegex }
        ];
        if (filter.$and) {
          filter.$and.push({ $or: orClauses });
        } else if (filter['stops.stopName']) {
          const existingStopFilter = filter['stops.stopName'];
          delete filter['stops.stopName'];
          filter.$and = [{ 'stops.stopName': existingStopFilter }, { $or: orClauses }];
        } else {
          filter.$or = orClauses;
        }
      }

      const total = await collection.countDocuments(filter);
      const docs = await collection.find(filter)
        .sort({ routeNumber: 1, 'stops.0.departureTime': 1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const enriched = docs.map(d => enrichBus(d, includeStops));

      res.status(200).json({
        success: true,
        source: 'MongoDB localhost:27017 / Sutriva ("Governmet Bus")',
        count: enriched.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        data: enriched
      });
    } catch (error: any) {
      logger.error('Error fetching government buses from MongoDB:', error);
      res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch government bus records from MongoDB.',
        details: error.message
      });
    }
  },

  // GET /api/v1/buses/popular-routes
  async getPopularRoutes(_req: Request, res: Response): Promise<void> {
    try {
      const collection = getBusCollection();

      // Aggregate top unique route numbers with sample route name and count of daily scheduled trips
      const topRoutes = await collection.aggregate([
        {
          $group: {
            _id: '$routeNumber',
            routeName: { $first: '$routeName' },
            operator: { $first: '$operator' },
            sampleStops: { $first: { $size: '$stops' } },
            dailyTrips: { $sum: 1 }
          }
        },
        { $sort: { dailyTrips: -1 } },
        { $limit: 25 }
      ]).toArray();

      res.status(200).json({
        success: true,
        count: topRoutes.length,
        data: topRoutes.map(r => ({
          routeNumber: r._id,
          routeName: (r.routeName || '').replace(/ TO /gi, ' ➔ '),
          operator: r.operator || 'MTC',
          stopsCount: r.sampleStops || 0,
          dailyTrips: r.dailyTrips
        }))
      });
    } catch (error: any) {
      logger.error('Error fetching popular bus routes:', error);
      res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: error.message });
    }
  },

  // GET /api/v1/buses/stops?query=xxx
  async getBusStops(req: Request, res: Response): Promise<void> {
    try {
      const collection = getBusCollection();
      const query = (req.query.query as string || '').trim();

      if (!query || query.length < 2) {
        res.status(200).json({ success: true, count: 0, data: [] });
        return;
      }

      // Use aggregation with $unwind to search distinct stop names matching query
      const stops = await collection.aggregate([
        { $match: { 'stops.stopName': { $regex: new RegExp(query, 'i') } } },
        { $unwind: '$stops' },
        { $match: { 'stops.stopName': { $regex: new RegExp(query, 'i') } } },
        {
          $group: {
            _id: '$stops.stopName',
            latitude: { $first: '$stops.latitude' },
            longitude: { $first: '$stops.longitude' }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 20 }
      ]).toArray();

      res.status(200).json({
        success: true,
        count: stops.length,
        data: stops.map(s => ({
          stopName: s._id,
          latitude: s.latitude,
          longitude: s.longitude
        }))
      });
    } catch (error: any) {
      logger.error('Error searching bus stops:', error);
      res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: error.message });
    }
  },

  // GET /api/v1/buses/stats
  async getBusStats(_req: Request, res: Response): Promise<void> {
    try {
      const collection = getBusCollection();
      const totalTrips = await collection.countDocuments();
      const distinctRoutes = await collection.distinct('routeNumber');
      const distinctOperators = await collection.distinct('operator');

      res.status(200).json({
        success: true,
        totalTrips,
        totalDistinctRoutes: distinctRoutes.length,
        operators: distinctOperators,
        serviceArea: 'Chennai Metropolitan & Suburbs (Tamil Nadu Govt Public Transport / MTC)',
        source: 'ChennaiGTFS MongoDB Collection'
      });
    } catch (error: any) {
      logger.error('Error fetching bus stats:', error);
      res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: error.message });
    }
  },

  // GET /api/v1/buses/:id
  async getBusById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const collection = getBusCollection();

      let query: any = { _id: id };
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      }

      const doc = await collection.findOne(query);
      if (!doc) {
        res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Bus trip not found' });
        return;
      }

      const enriched = enrichBus(doc, true);
      res.status(200).json({ success: true, data: enriched });
    } catch (error: any) {
      logger.error('Error fetching bus trip by ID:', error);
      res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: error.message });
    }
  }
};
