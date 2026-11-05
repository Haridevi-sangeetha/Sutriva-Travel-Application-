export type TravelMode = 
  | 'Flights' 
  | 'Trains' 
  | 'Buses' 
  | 'Car Rentals' 
  | 'Cabs' 
  | 'Ferries' 
  | 'Bike/Scooter' 
  | 'More';

export interface TravelerCount {
  adults: number;
  children: number;
  infants?: number;
}

export interface TravelSearchFilters {
  minPrice?: number;
  maxPrice?: number;
  directOnly?: boolean;
  preferredAirline?: string;
  departureTimeSlot?: 'morning' | 'afternoon' | 'evening' | 'night' | 'all';
  maxDurationMinutes?: number;
}

export interface TravelSearchRequest {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  travelers: TravelerCount;
  travelMode: TravelMode;
  cabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  filters?: TravelSearchFilters;
  sortBy?: 'recommended' | 'cheapest' | 'fastest' | 'departure_early';
}

export interface TravelOperator {
  name: string;
  code?: string;
  logoUrl?: string;
  icon?: string;
}

export interface TravelWaypoint {
  location: string;
  code: string;
  terminal?: string;
  time: string;
  date: string;
}

export interface TravelPricing {
  currency: string;
  pricePerTraveler: number;
  totalPrice: number;
  travelerCount: number;
  formattedPerTraveler: string;
  formattedTotal: string;
  isEstimate?: boolean;
  fareType?: string;
}

export interface TravelAmenities {
  cabinBaggage?: string;
  checkInBaggage?: string;
  mealIncluded?: boolean | string;
  wifiAvailable?: boolean | string;
  cancellationPolicy?: string;
  seatSelection?: boolean;
  features: string[];
}

export interface CarRouteDetails {
  distanceKm: number;
  durationMinutes: number;
  fuelCostEstimate: number;
  tollEstimate: number;
  suggestedRoute: string;
  geometry?: any;
}

export interface TravelBookingInfo {
  providerName: string;
  bookingUrl?: string;
  canBookDirect: boolean;
  validUntil?: string;
}

export interface TravelOffer {
  offerId: string;
  searchId: string;
  travelMode: TravelMode;
  provider: 'duffel' | 'amadeus' | 'irctc_rail' | 'tn_govt_bus' | 'intercity_bus' | 'osrm_car' | 'sutriva_verified';
  isLiveApi: boolean;
  providerOfferId?: string;
  title: string;
  operator: TravelOperator;
  badge?: string;
  flightNumber?: string;
  trainNumber?: string;
  busRouteNumber?: string;
  aircraft?: string;
  departure: TravelWaypoint;
  arrival: TravelWaypoint;
  duration: string;
  durationMinutes: number;
  isDirect: boolean;
  stopsCount: number;
  stopsSummary: string;
  pricing: TravelPricing;
  amenities: TravelAmenities;
  carDetails?: CarRouteDetails;
  booking: TravelBookingInfo;
  lastUpdated: string;
}

export interface TravelSearchResponse {
  searchId: string;
  timestamp: string;
  query: TravelSearchRequest;
  providerStatus: Record<string, { available: boolean; source: string; message: string }>;
  totalCount: number;
  offers: TravelOffer[];
}

export interface OfferVerificationResult {
  valid: boolean;
  offerId: string;
  latestPrice?: TravelPricing;
  isPriceChanged?: boolean;
  availabilityStatus: 'AVAILABLE' | 'PRICE_CHANGED' | 'SOLD_OUT' | 'UNAVAILABLE';
  bookingUrl?: string;
  message: string;
}
