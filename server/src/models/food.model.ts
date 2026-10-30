export interface GeoPoint {
  type: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface FoodItem {
  _id: string;
  name: string;
  category: string;
  subcategory: string;
  city: string;
  district: string;
  state: string;
  address: string;
  location?: GeoPoint | null;
  source?: string;
  verified?: boolean;
  
  // Enriched presentation fields
  image?: string;
  rating?: number;
  reviews?: number;
  priceText?: string;
  priceVal?: number;
  isVeg?: boolean;
  tags?: string[];
}
