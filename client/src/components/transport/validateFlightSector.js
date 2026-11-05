/**
 * Flight Sector Validation Helper
 * Ensures that the flight offer's departure and arrival airport codes/cities
 * strictly match the search query selector state.
 */
export function validateFlightSector(offer, expectedOrigin, expectedDest) {
  if (!offer || !offer.departure || !offer.arrival) {
    return {
      isValid: false,
      reason: 'Offer missing departure or arrival waypoint data'
    };
  }

  const normalize = (val) => (val || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  const queryFrom = normalize(expectedOrigin);
  const queryTo = normalize(expectedDest);

  const offerDepCode = normalize(offer.departure.code);
  const offerArrCode = normalize(offer.arrival.code);
  const offerDepCity = normalize(offer.departure.location);
  const offerArrCity = normalize(offer.arrival.location);

  // Check Origin match (either IATA code matches or city name matches)
  const isOriginValid =
    offerDepCode === queryFrom ||
    offerDepCity.includes(queryFrom) ||
    queryFrom.includes(offerDepCode) ||
    queryFrom.includes(offerDepCity);

  // Check Destination match (either IATA code matches or city name matches)
  const isDestValid =
    offerArrCode === queryTo ||
    offerArrCity.includes(queryTo) ||
    queryTo.includes(offerArrCode) ||
    queryTo.includes(offerArrCity);

  if (!isOriginValid || !isDestValid) {
    return {
      isValid: false,
      reason: `Sector Mismatch: Flight offer route is ${offer.departure.code} (${offer.departure.location}) ➔ ${offer.arrival.code} (${offer.arrival.location}), but query selector state is ${expectedOrigin} ➔ ${expectedDest}`
    };
  }

  return { isValid: true };
}

