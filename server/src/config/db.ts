import { MongoClient, Db, Collection } from 'mongodb';
import { CONFIG } from './config';
import { logger } from '../utils/logger';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let cachedFoodCollectionName: string = 'Food Collection';
let cachedBusCollectionName: string = 'Governmet Bus';

export async function connectDB(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    logger.info(`Connecting to MongoDB at ${CONFIG.MONGODB_URI}...`);
    client = new MongoClient(CONFIG.MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    dbInstance = client.db(CONFIG.MONGODB_DB_NAME);
    logger.info(`Successfully connected to MongoDB Database: "${CONFIG.MONGODB_DB_NAME}"`);

    // Detect exact food collection name in DB (supports "Food Collection", "food", "foods")
    const collections = await dbInstance.listCollections().toArray();
    const colNames = collections.map(c => c.name);
    
    if (colNames.includes('Food Collection')) {
      cachedFoodCollectionName = 'Food Collection';
    } else if (colNames.includes('food')) {
      cachedFoodCollectionName = 'food';
    } else if (colNames.includes('foods')) {
      cachedFoodCollectionName = 'foods';
    } else {
      const matched = colNames.find(n => n.toLowerCase().includes('food'));
      if (matched) cachedFoodCollectionName = matched;
    }

    const foodDocCount = await dbInstance.collection(cachedFoodCollectionName).countDocuments();
    logger.info(`Detected Food collection: "${cachedFoodCollectionName}" with ${foodDocCount} documents.`);

    // Detect exact Government Bus collection name in DB (supports "Governmet Bus", "Government Bus", "buses")
    if (colNames.includes('Governmet Bus')) {
      cachedBusCollectionName = 'Governmet Bus';
    } else if (colNames.includes('Government Bus')) {
      cachedBusCollectionName = 'Government Bus';
    } else {
      const busMatched = colNames.find(n => n.toLowerCase().includes('bus'));
      if (busMatched) cachedBusCollectionName = busMatched;
    }

    const busDocCount = await dbInstance.collection(cachedBusCollectionName).countDocuments();
    logger.info(`Detected Government Bus collection: "${cachedBusCollectionName}" with ${busDocCount} documents.`);

    return dbInstance;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export function getDB(): Db {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return dbInstance;
}

export function getFoodCollection(): Collection {
  const db = getDB();
  return db.collection(cachedFoodCollectionName);
}

export function getBusCollection(): Collection {
  const db = getDB();
  return db.collection(cachedBusCollectionName);
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
    logger.info('MongoDB connection closed.');
  }
}
