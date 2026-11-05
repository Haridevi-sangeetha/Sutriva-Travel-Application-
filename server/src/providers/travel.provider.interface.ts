import { TravelSearchRequest, TravelOffer, OfferVerificationResult } from '../types/travel.types';

export interface ITravelProvider {
  readonly name: string;
  readonly supportedModes: string[];
  
  isAvailable(): Promise<boolean>;
  
  search(req: TravelSearchRequest): Promise<TravelOffer[]>;
  
  verifyOffer(offerId: string): Promise<OfferVerificationResult>;
}

