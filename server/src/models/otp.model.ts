export interface OtpRecord {
  id: string;
  identifier: string; // Email or Mobile Number
  otpHash: string;
  verifyAttempts: number;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

class OtpRepository {
  private otps: Map<string, OtpRecord> = new Map();

  async save(record: OtpRecord): Promise<void> {
    this.otps.set(record.identifier.toLowerCase(), record);
  }

  async findByIdentifier(identifier: string): Promise<OtpRecord | null> {
    const record = this.otps.get(identifier.toLowerCase());
    return record ? { ...record } : null;
  }

  async incrementAttempts(identifier: string): Promise<number> {
    const record = this.otps.get(identifier.toLowerCase());
    if (record) {
      record.verifyAttempts += 1;
      this.otps.set(identifier.toLowerCase(), record);
      return record.verifyAttempts;
    }
    return 0;
  }

  async markUsed(identifier: string): Promise<void> {
    const record = this.otps.get(identifier.toLowerCase());
    if (record) {
      record.isUsed = true;
      this.otps.set(identifier.toLowerCase(), record);
    }
  }

  async delete(identifier: string): Promise<void> {
    this.otps.delete(identifier.toLowerCase());
  }

  async clearAll(): Promise<void> {
    this.otps.clear();
  }
}

export const otpRepository = new OtpRepository();
