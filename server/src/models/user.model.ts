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
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory Production-Grade Mock Repository (Interfaces seamlessly with PostgreSQL / MongoDB)
class UserRepository {
  private users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalizedEmail) {
        return { ...user };
      }
    }
    return null;
  }

  async findByMobile(mobile: string): Promise<User | null> {
    const cleanMobile = mobile.replace(/\D/g, '');
    for (const user of this.users.values()) {
      if (user.mobile && user.mobile.replace(/\D/g, '') === cleanMobile) {
        return { ...user };
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, { ...user, updatedAt: new Date() });
    return { ...user };
  }

  async updateLockoutStatus(userId: string, failedAttempts: number, lockoutUntil: Date | null): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.failedLoginAttempts = failedAttempts;
      user.lockoutUntil = lockoutUntil;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  async clearAll(): Promise<void> {
    this.users.clear();
  }
}

export const userRepository = new UserRepository();
