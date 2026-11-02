import { getDB } from '../config/db';
import { logger } from '../utils/logger';

export type UserRole = 'USER' | 'ADMIN' | 'SUPPORT';

export interface User {
  id: string;
  email: string;
  mobile?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  failedLoginAttempts: number;
  lockoutUntil: Date | null;
  favorites?: any[];
  trips?: any[];
  createdAt: Date;
  updatedAt: Date;
}

class UserRepository {
  private inMemoryUsers: Map<string, User> = new Map();

  private getCollection() {
    try {
      const db = getDB();
      return db.collection<User>('Users');
    } catch {
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const col = this.getCollection();
    if (col) {
      try {
        const found = await col.findOne({ email: normalizedEmail });
        if (found) return found;
      } catch (err) {
        logger.warn('MongoDB findByEmail error, checking in-memory:', err);
      }
    }

    for (const user of this.inMemoryUsers.values()) {
      if (user.email.toLowerCase() === normalizedEmail) {
        return { ...user };
      }
    }
    return null;
  }

  async findByMobile(mobile: string): Promise<User | null> {
    const cleanMobile = mobile.replace(/\D/g, '');
    const col = this.getCollection();
    if (col) {
      try {
        const found = await col.findOne({ mobile: cleanMobile });
        if (found) return found;
      } catch (err) {
        logger.warn('MongoDB findByMobile error, checking in-memory:', err);
      }
    }

    for (const user of this.inMemoryUsers.values()) {
      if (user.mobile && user.mobile.replace(/\D/g, '') === cleanMobile) {
        return { ...user };
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    const col = this.getCollection();
    if (col) {
      try {
        const found = await col.findOne({ id });
        if (found) return found;
      } catch (err) {
        logger.warn('MongoDB findById error, checking in-memory:', err);
      }
    }

    const user = this.inMemoryUsers.get(id);
    return user ? { ...user } : null;
  }

  async save(user: User): Promise<User> {
    user.updatedAt = new Date();
    user.favorites = user.favorites || [];
    user.trips = user.trips || [];

    const col = this.getCollection();
    if (col) {
      try {
        await col.updateOne(
          { id: user.id },
          { $set: user },
          { upsert: true }
        );
      } catch (err) {
        logger.warn('MongoDB user save error:', err);
      }
    }

    this.inMemoryUsers.set(user.id, { ...user });
    return { ...user };
  }

  async updateLockoutStatus(userId: string, failedAttempts: number, lockoutUntil: Date | null): Promise<void> {
    const col = this.getCollection();
    if (col) {
      try {
        await col.updateOne(
          { id: userId },
          { $set: { failedLoginAttempts: failedAttempts, lockoutUntil, updatedAt: new Date() } }
        );
      } catch (err) {
        logger.warn('MongoDB lockout update error:', err);
      }
    }

    const user = this.inMemoryUsers.get(userId);
    if (user) {
      user.failedLoginAttempts = failedAttempts;
      user.lockoutUntil = lockoutUntil;
      user.updatedAt = new Date();
    }
  }

  async addFavorite(userId: string, place: any): Promise<any[]> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    const favorites = user.favorites || [];
    const exists = favorites.some((f: any) => f.id === place.id || f.name === place.name);
    if (!exists) {
      favorites.push({
        id: place.id,
        name: place.name,
        category: place.category,
        address: place.address,
        rating: place.rating,
        thumb: place.thumb || (place.photos && place.photos[0]?.url) || '',
        priceText: place.priceText || place.entryFee || 'Free',
        addedAt: new Date().toISOString()
      });
      user.favorites = favorites;
      await this.save(user);
    }
    return favorites;
  }

  async removeFavorite(userId: string, placeId: string): Promise<any[]> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    user.favorites = (user.favorites || []).filter((f: any) => f.id !== placeId);
    await this.save(user);
    return user.favorites;
  }

  async getFavorites(userId: string): Promise<any[]> {
    const user = await this.findById(userId);
    return user ? (user.favorites || []) : [];
  }

  async saveTrip(userId: string, trip: any): Promise<any[]> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    const trips = user.trips || [];
    const tripEntry = {
      id: trip.id || `trip_${Date.now()}`,
      title: trip.title || `${trip.from} to ${trip.to}`,
      from: trip.from,
      to: trip.to,
      distanceKm: trip.distanceKm,
      durationMinutes: trip.durationMinutes,
      mode: trip.mode || 'driving',
      places: trip.places || [],
      savedAt: new Date().toISOString()
    };
    trips.unshift(tripEntry);
    user.trips = trips;
    await this.save(user);
    return trips;
  }

  async getTrips(userId: string): Promise<any[]> {
    const user = await this.findById(userId);
    return user ? (user.trips || []) : [];
  }

  async clearAll(): Promise<void> {
    this.inMemoryUsers.clear();
    const col = this.getCollection();
    if (col) {
      await col.deleteMany({});
    }
  }
}

export const userRepository = new UserRepository();
