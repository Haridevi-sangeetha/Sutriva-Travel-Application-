export interface PlacePhoto {
  url: string;
  attribution?: string;
  width?: number;
  height?: number;
}

export interface PlaceEntity {
  id: string;
  provider: 'google' | 'osm' | 'curated';
  providerPlaceId?: string;
  name: string;
  category: string;
  subcategory?: string;
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  rating?: number | null;
  reviewCount?: number | null;
  photos: PlacePhoto[];
  entryFee?: string | null;
  entryFeeVal?: number | null;
  openingHours?: string | null;
  verificationStatus: 'verified' | 'unverified';
  description?: string;
  distanceKm?: number;
  phone?: string | null;
  website?: string | null;
  tags?: string[];
}

export interface GeoCoordinate {
  name: string;
  formattedAddress?: string;
  lat: number;
  lng: number;
}

export interface RouteGeometry {
  distanceKm: number;
  durationMinutes: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat]
  };
  summary: string;
  steps?: {
    instruction: string;
    distance: number;
    duration: number;
  }[];
}
