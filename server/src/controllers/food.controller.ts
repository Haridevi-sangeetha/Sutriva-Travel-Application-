import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getFoodCollection } from '../config/db';
import { logger } from '../utils/logger';

// Curated high-resolution imagery for specific food subcategories
const CATEGORY_IMAGES: Record<string, string[]> = {
  biryani: [
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80'
  ],
  veg: [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80',
    'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&q=80'
  ],
  tiffin: [
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80',
    'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&q=80'
  ],
  cafe: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80'
  ],
  bakery: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80'
  ],
  dhaba: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80'
  ],
  fast_food: [
    'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&q=80',
    'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=600&q=80'
  ],
  default: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'
  ]
};

function enrichFoodItem(doc: any, index: number) {
  const nameLower = (doc.name || '').toLowerCase();
  const subcatLower = (doc.subcategory || '').toLowerCase();
  
  // 1. Image enrichment
  let imgPool = CATEGORY_IMAGES.default;
  if (nameLower.includes('biryani') || subcatLower.includes('biryani') || subcatLower.includes('biriyani')) {
    imgPool = CATEGORY_IMAGES.biryani;
  } else if (nameLower.includes('cafe') || subcatLower.includes('cafe') || nameLower.includes('coffee') || subcatLower.includes('tea')) {
    imgPool = CATEGORY_IMAGES.cafe;
  } else if (nameLower.includes('bakery') || subcatLower.includes('bakery') || nameLower.includes('sweet') || subcatLower.includes('sweets')) {
    imgPool = CATEGORY_IMAGES.bakery;
  } else if (nameLower.includes('mess') || subcatLower.includes('mess') || nameLower.includes('tiffin') || subcatLower.includes('idli')) {
    imgPool = CATEGORY_IMAGES.tiffin;
  } else if (nameLower.includes('veg') || subcatLower.includes('veg') || subcatLower.includes('vegetarian')) {
    imgPool = CATEGORY_IMAGES.veg;
  } else if (subcatLower.includes('dhaba') || nameLower.includes('dhaba')) {
    imgPool = CATEGORY_IMAGES.dhaba;
  } else if (subcatLower.includes('fast_food') || subcatLower.includes('snack') || subcatLower.includes('pizza')) {
    imgPool = CATEGORY_IMAGES.fast_food;
  }

  // Pick deterministic image using index or doc _id
  const imgIdx = (index + (doc.name ? doc.name.length : 0)) % imgPool.length;
  const image = doc.image || imgPool[imgIdx];

  // 2. Veg / Non-Veg detection
  const isPureVeg = (
    nameLower.includes('pure veg') || 
    subcatLower.includes('veg') || 
    subcatLower.includes('vegetarian') ||
    nameLower.includes('bhavan') ||
    nameLower.includes('idli')
  ) && !nameLower.includes('non veg') && !subcatLower.includes('non_veg');

  // 3. Price & Rating calculation (aesthetic presentation)
  const seed = (doc.name ? doc.name.charCodeAt(0) : 70) + (index % 10);
  const rating = doc.rating || Number((4.1 + (seed % 9) * 0.1).toFixed(1));
  const reviews = doc.reviews || (80 + (seed * 37) % 950);
  
  let priceText = '₹120 – ₹250';
  let priceVal = 180;
  if (subcatLower.includes('hotel') || subcatLower.includes('family') || nameLower.includes('biryani')) {
    priceText = '₹250 – ₹550';
    priceVal = 350;
  } else if (subcatLower.includes('cafe') || subcatLower.includes('pizza')) {
    priceText = '₹150 – ₹380';
    priceVal = 250;
  } else if (subcatLower.includes('tea') || subcatLower.includes('snack') || subcatLower.includes('tiffin')) {
    priceText = '₹50 – ₹150';
    priceVal = 100;
  }

  // 4. Tags
  const tags: string[] = [];
  if (isPureVeg) tags.push('Pure Veg');
  else tags.push('Non-Veg Available');

  const displayCategory = (doc.subcategory || 'Restaurant')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  tags.push(displayCategory);

  return {
    ...doc,
    _id: doc._id.toString(),
    image,
    rating,
    reviews,
    priceText,
    priceVal,
    isVeg: isPureVeg,
    displayCategory,
    tags
  };
}

export const foodController = {
  // GET /api/v1/food
  async getFoodPlaces(req: Request, res: Response): Promise<void> {
    try {
      const collection = getFoodCollection();
      
      const search = (req.query.search as string || '').trim();
      const category = (req.query.category as string || '').trim().toLowerCase();
      const subcategory = (req.query.subcategory as string || '').trim().toLowerCase();
      const city = (req.query.city as string || '').trim();
      const isVegOnly = req.query.veg === 'true';
      const limit = Math.min(parseInt(req.query.limit as string) || 60, 200);
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const skip = (page - 1) * limit;

      const filter: any = {};

      // Filter by city
      if (city && city.toLowerCase() !== 'all') {
        filter.city = { $regex: new RegExp(city, 'i') };
      }

      // Keyword Search (Name, Subcategory, Address)
      if (search) {
        filter.$or = [
          { name: { $regex: new RegExp(search, 'i') } },
          { subcategory: { $regex: new RegExp(search, 'i') } },
          { address: { $regex: new RegExp(search, 'i') } }
        ];
      }

      // Category / Tab filtering
      if (category && category !== 'all') {
        if (category === 'restaurants') {
          filter.subcategory = { 
            $regex: /restaurant|hotel|family|dhaba/i 
          };
        } else if (category === 'cafes') {
          filter.subcategory = { 
            $regex: /cafe|coffee|tea/i 
          };
        } else if (category === 'street') {
          filter.subcategory = { 
            $regex: /fast_food|snack|parotta|stall|street/i 
          };
        } else if (category === 'tiffin') {
          filter.subcategory = { 
            $regex: /tiffin|mess|idli/i 
          };
        } else if (category === 'bakeries') {
          filter.subcategory = { 
            $regex: /bakery|sweet|dessert|cake|ice_cream/i 
          };
        } else if (category === 'veg') {
          filter.$and = filter.$and || [];
          filter.$and.push({
            $or: [
              { subcategory: { $regex: /veg|vegetarian/i } },
              { name: { $regex: /veg|bhavan|idli/i } }
            ]
          });
          filter.$and.push({
            name: { $not: /non[ -]?veg/i }
          });
        } else if (category === 'nonveg') {
          filter.$or = [
            { subcategory: { $regex: /non_veg|biryani|biriyani|seafood|chicken|barbeque/i } },
            { name: { $regex: /non[ -]?veg|biryani|chicken|mutton/i } }
          ];
        } else if (subcategory) {
          filter.subcategory = { $regex: new RegExp(subcategory, 'i') };
        }
      } else if (subcategory) {
        filter.subcategory = { $regex: new RegExp(subcategory, 'i') };
      }

      if (isVegOnly) {
        filter.subcategory = { $regex: /veg|vegetarian/i };
      }

      const total = await collection.countDocuments(filter);
      const rawDocs = await collection.find(filter).skip(skip).limit(limit).toArray();

      const enriched = rawDocs.map((doc, idx) => enrichFoodItem(doc, skip + idx));

      res.status(200).json({
        success: true,
        source: 'MongoDB localhost:27017 / Sutriva',
        count: enriched.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        data: enriched
      });
    } catch (error: any) {
      logger.error('Error fetching food places from MongoDB:', error);
      res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch food items from MongoDB.',
        details: error.message
      });
    }
  },

  // GET /api/v1/food/categories
  async getFoodCategories(_req: Request, res: Response): Promise<void> {
    try {
      const collection = getFoodCollection();
      const subcategories = await collection.distinct('subcategory');
      const cities = await collection.distinct('city');

      // Aggregate counts per subcategory
      const counts = await collection.aggregate([
        { $group: { _id: '$subcategory', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();

      res.status(200).json({
        success: true,
        source: 'MongoDB',
        subcategories,
        cities,
        breakdown: counts
      });
    } catch (error: any) {
      logger.error('Error fetching categories from MongoDB:', error);
      res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: error.message });
    }
  },

  // GET /api/v1/food/stats
  async getFoodStats(_req: Request, res: Response): Promise<void> {
    try {
      const collection = getFoodCollection();
      const totalCount = await collection.countDocuments();
      const vegCount = await collection.countDocuments({ subcategory: { $regex: /veg/i } });
      const nonVegCount = await collection.countDocuments({ subcategory: { $regex: /non_veg|biryani/i } });
      const cafeCount = await collection.countDocuments({ subcategory: { $regex: /cafe|coffee|tea/i } });

      res.status(200).json({
        success: true,
        totalFoodPlaces: totalCount,
        vegPlaces: vegCount,
        nonVegPlaces: nonVegCount,
        cafes: cafeCount
      });
    } catch (error: any) {
      logger.error('Error fetching food stats:', error);
      res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: error.message });
    }
  },

  // GET /api/v1/food/:id
  async getFoodById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const collection = getFoodCollection();
      
      let query: any = { _id: id };
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      }

      const doc = await collection.findOne(query);
      if (!doc) {
        res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Food place not found' });
        return;
      }

      const enriched = enrichFoodItem(doc, 0);
      res.status(200).json({ success: true, data: enriched });
    } catch (error: any) {
      logger.error('Error fetching food item by ID:', error);
      res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: error.message });
    }
  }
};
