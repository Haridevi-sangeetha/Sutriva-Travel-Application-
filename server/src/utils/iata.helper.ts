export const IATA_MAP: Record<string, { code: string; city: string; country: string; name: string }> = {
  maa: { code: 'MAA', city: 'Chennai', country: 'India', name: 'Chennai International Airport' },
  chennai: { code: 'MAA', city: 'Chennai', country: 'India', name: 'Chennai International Airport' },
  blr: { code: 'BLR', city: 'Bengaluru', country: 'India', name: 'Kempegowda International Airport' },
  bangalore: { code: 'BLR', city: 'Bengaluru', country: 'India', name: 'Kempegowda International Airport' },
  bengaluru: { code: 'BLR', city: 'Bengaluru', country: 'India', name: 'Kempegowda International Airport' },
  del: { code: 'DEL', city: 'New Delhi', country: 'India', name: 'Indira Gandhi International Airport' },
  delhi: { code: 'DEL', city: 'New Delhi', country: 'India', name: 'Indira Gandhi International Airport' },
  'new delhi': { code: 'DEL', city: 'New Delhi', country: 'India', name: 'Indira Gandhi International Airport' },
  bom: { code: 'BOM', city: 'Mumbai', country: 'India', name: 'Chhatrapati Shivaji Maharaj Airport' },
  mumbai: { code: 'BOM', city: 'Mumbai', country: 'India', name: 'Chhatrapati Shivaji Maharaj Airport' },
  hyd: { code: 'HYD', city: 'Hyderabad', country: 'India', name: 'Rajiv Gandhi International Airport' },
  hyderabad: { code: 'HYD', city: 'Hyderabad', country: 'India', name: 'Rajiv Gandhi International Airport' },
  ccu: { code: 'CCU', city: 'Kolkata', country: 'India', name: 'Netaji Subhash Chandra Bose Airport' },
  kolkata: { code: 'CCU', city: 'Kolkata', country: 'India', name: 'Netaji Subhash Chandra Bose Airport' },
  cok: { code: 'COK', city: 'Kochi', country: 'India', name: 'Cochin International Airport' },
  kochi: { code: 'COK', city: 'Kochi', country: 'India', name: 'Cochin International Airport' },
  goi: { code: 'GOI', city: 'Goa', country: 'India', name: 'Dabolim Airport' },
  goa: { code: 'GOI', city: 'Goa', country: 'India', name: 'Dabolim Airport' },
  cjb: { code: 'CJB', city: 'Coimbatore', country: 'India', name: 'Coimbatore International Airport' },
  coimbatore: { code: 'CJB', city: 'Coimbatore', country: 'India', name: 'Coimbatore International Airport' },
  ixm: { code: 'IXM', city: 'Madurai', country: 'India', name: 'Madurai Airport' },
  madurai: { code: 'IXM', city: 'Madurai', country: 'India', name: 'Madurai Airport' },
  trz: { code: 'TRZ', city: 'Tiruchirappalli', country: 'India', name: 'Tiruchirappalli Airport' },
  trichy: { code: 'TRZ', city: 'Tiruchirappalli', country: 'India', name: 'Tiruchirappalli Airport' },
  tiruchirappalli: { code: 'TRZ', city: 'Tiruchirappalli', country: 'India', name: 'Tiruchirappalli Airport' },
  sin: { code: 'SIN', city: 'Singapore', country: 'Singapore', name: 'Singapore Changi Airport' },
  singapore: { code: 'SIN', city: 'Singapore', country: 'Singapore', name: 'Singapore Changi Airport' },
  dxb: { code: 'DXB', city: 'Dubai', country: 'UAE', name: 'Dubai International Airport' },
  dubai: { code: 'DXB', city: 'Dubai', country: 'UAE', name: 'Dubai International Airport' },
  bkk: { code: 'BKK', city: 'Bangkok', country: 'Thailand', name: 'Suvarnabhumi Airport' },
  bangkok: { code: 'BKK', city: 'Bangkok', country: 'Thailand', name: 'Suvarnabhumi Airport' },
  kul: { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', name: 'Kuala Lumpur International Airport' },
  'kuala lumpur': { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', name: 'Kuala Lumpur International Airport' },
  lhr: { code: 'LHR', city: 'London', country: 'United Kingdom', name: 'London Heathrow Airport' },
  london: { code: 'LHR', city: 'London', country: 'United Kingdom', name: 'London Heathrow Airport' }
};

export function resolveIataCode(input: string): { code: string; city: string; name: string } {
  if (!input) return { code: 'MAA', city: 'Chennai', name: 'Chennai International Airport' };

  // 1. Check if input contains 3-letter IATA code in parentheses e.g. "Chennai (MAA)"
  const match = input.match(/\(([A-Z]{3})\)/i);
  if (match) {
    const code = match[1].toUpperCase();
    const entry = IATA_MAP[code.toLowerCase()];
    if (entry) return entry;
    return { code, city: input.split('(')[0].trim(), name: `${code} Airport` };
  }

  // 2. Direct lookup in map
  const clean = input.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
  if (IATA_MAP[clean]) {
    return IATA_MAP[clean];
  }

  // 3. Partial substring match
  for (const [key, val] of Object.entries(IATA_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val;
    }
  }

  // 4. Default: Take first 3 letters uppercase
  const fallbackCode = clean.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase() || 'MAA';
  return { code: fallbackCode, city: input.trim(), name: `${input.trim()} Airport` };
}

export const AIRLINE_LOGOS: Record<string, { name: string; logoUrl: string }> = {
  '6E': { name: 'IndiGo', logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80' },
  AI: { name: 'Air India', logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80' },
  QP: { name: 'Akasa Air', logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80' },
  UK: { name: 'Vistara', logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80' },
  SG: { name: 'SpiceJet', logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80' },
  SQ: { name: 'Singapore Airlines', logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80' },
  EK: { name: 'Emirates', logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80' },
  TG: { name: 'Thai Airways', logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80' },
  MH: { name: 'Malaysia Airlines', logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80' },
  BA: { name: 'British Airways', logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&q=80' }
};

