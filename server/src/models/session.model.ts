export interface RefreshSession {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string; // Used for Refresh Token Reuse Detection
  isRevoked: boolean;
  userAgent: string;
  ipAddress: string;
  expiresAt: Date;
  createdAt: Date;
}

class SessionRepository {
  private sessions: Map<string, RefreshSession> = new Map();

  async create(session: RefreshSession): Promise<RefreshSession> {
    this.sessions.set(session.id, { ...session });
    return { ...session };
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    for (const session of this.sessions.values()) {
      if (session.tokenHash === tokenHash) {
        return { ...session };
      }
    }
    return null;
  }

  async revokeSession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      session.isRevoked = true;
      this.sessions.set(id, session);
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        session.isRevoked = true;
        this.sessions.set(id, session);
      }
    }
  }

  async revokeFamily(familyId: string): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.familyId === familyId) {
        session.isRevoked = true;
        this.sessions.set(id, session);
      }
    }
  }

  async getUserActiveSessions(userId: string): Promise<RefreshSession[]> {
    const active: RefreshSession[] = [];
    const now = new Date();
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.isRevoked && session.expiresAt > now) {
        active.push({ ...session });
      }
    }
    return active;
  }

  async clearAll(): Promise<void> {
    this.sessions.clear();
  }
}

export const sessionRepository = new SessionRepository();
