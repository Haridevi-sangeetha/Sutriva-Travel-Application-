import React from 'react';
import { validateFlightSector } from './validateFlightSector';
import NoDirectFlightsCard from './NoDirectFlightsCard';

/**
 * FlightSearchResults Component
 * Handles the display of dynamic flight search results with strict UI state validation,
 * automatic filtering of mismatched routes, and graceful fallback to multi-modal alternatives.
 */
export default function FlightSearchResults({
  origin,
  destination,
  searchSession,
  onSelectOffer,
  onSwitchMode
}) {
  if (!searchSession) {
    return null;
  }

  const { hasDirectFlights, offers = [], alternatives, connectingFlights } = searchSession;

  // 1. Check if route has no direct flights reported by backend
  if (hasDirectFlights === false || offers.length === 0) {
    return (
      <NoDirectFlightsCard
        origin={origin}
        destination={destination}
        alternatives={alternatives}
        connectingFlights={connectingFlights}
        onSelectMode={onSwitchMode}
      />
    );
  }

  // 2. Strict UI State Validation: Filter out any flight whose origin/destination doesn't match selector state
  const validatedOffers = offers.filter((offer) => {
    const check = validateFlightSector(offer, origin, destination);
    if (!check.isValid) {
      console.warn(`[Sector Guard] Discarded misaligned flight: ${offer.title} (${check.reason})`);
      return false;
    }
    return true;
  });

  // 3. If all offers failed sector validation, show NoDirectFlightsCard rather than mismatched data
  if (validatedOffers.length === 0) {
    return (
      <NoDirectFlightsCard
        origin={origin}
        destination={destination}
        alternatives={alternatives}
        connectingFlights={connectingFlights}
        onSelectMode={onSwitchMode}
      />
    );
  }

  // 4. Render validated flight cards
  return (
    <div className="t-results-grid" id="tResultsGrid">
      {validatedOffers.map((offer) => (
        <div key={offer.offerId} className="t-card" data-offer-id={offer.offerId}>
          <div>
            <div className="t-card-top">
              <div className="t-card-operator">
                {offer.operator?.logoUrl ? (
                  <img
                    src={offer.operator.logoUrl}
                    alt={offer.operator.name}
                    className="t-operator-logo-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/6E.svg';
                    }}
                  />
                ) : (
                  <div className="t-operator-logo">
                    <i className="fa-solid fa-plane"></i>
                  </div>
                )}
                <div>
                  <div className="t-operator-name">{offer.operator?.name}</div>
                  <div className="t-operator-sub">
                    {offer.flightNumber} {offer.aircraft ? `· ${offer.aircraft}` : ''}
                  </div>
                </div>
              </div>
              <span className={`t-card-badge ${offer.isDirect ? 't-badge-direct' : 't-badge-stops'}`}>
                {offer.stopsSummary || (offer.isDirect ? 'Direct' : `${offer.stopsCount || 1} Stop`)}
              </span>
            </div>

            <div className="t-card-route-row">
              <div className="t-time-point">
                <div className="t-time-val">{offer.departure.time}</div>
                <div className="t-time-city">
                  {offer.departure.location}
                  <span className="t-code-badge">{offer.departure.code}</span>
                </div>
                {offer.departure.terminal && <div className="t-terminal-sub">{offer.departure.terminal}</div>}
              </div>

              <div className="t-route-mid">
                <span className="t-duration-pill">
                  <i className="fa-regular fa-clock"></i> {offer.duration}
                </span>
                <div className={`t-route-line ${offer.isDirect ? '' : 'connecting'}`}></div>
                <span className="t-stops-text">
                  {offer.stopsSummary || (offer.isDirect ? 'Direct' : `${offer.stopsCount || 1} Stop`)}
                </span>
              </div>

              <div className="t-time-point t-time-right">
                <div className="t-time-val">{offer.arrival.time}</div>
                <div className="t-time-city">
                  {offer.arrival.location}
                  <span className="t-code-badge">{offer.arrival.code}</span>
                </div>
                {offer.arrival.terminal && <div className="t-terminal-sub">{offer.arrival.terminal}</div>}
              </div>
            </div>

            <div className="t-card-features">
              {offer.amenities?.cabinBaggage && (
                <span className="t-feat-tag t-feat-baggage">
                  <i className="fa-solid fa-suitcase-rolling"></i> Cabin: {offer.amenities.cabinBaggage}
                </span>
              )}
              {offer.amenities?.checkInBaggage && (
                <span className="t-feat-tag t-feat-baggage">
                  <i className="fa-solid fa-cart-flatbed-suitcase"></i> Check-in: {offer.amenities.checkInBaggage}
                </span>
              )}
              {offer.amenities?.mealIncluded && (
                <span className="t-feat-tag t-feat-meal">
                  <i className="fa-solid fa-utensils"></i>{' '}
                  {offer.amenities.mealIncluded === true ? 'Meals Included' : offer.amenities.mealIncluded}
                </span>
              )}
              {offer.amenities?.wifiAvailable && (
                <span className="t-feat-tag t-feat-wifi">
                  <i className="fa-solid fa-wifi"></i>{' '}
                  {offer.amenities.wifiAvailable === true ? 'Wi-Fi Available' : offer.amenities.wifiAvailable}
                </span>
              )}
            </div>
          </div>

          <div className="t-card-bottom">
            <div className="t-card-price-col">
              <span className="t-price-from">STARTING FROM</span>
              <div>
                <strong className="t-price-amount">{offer.pricing.formattedPerTraveler}</strong>
                <span className="t-price-pax">/ person</span>
              </div>
              <span className="t-price-total">
                Total: {offer.pricing.formattedTotal} ({offer.pricing.travelerCount} Pax)
              </span>
              <span className="t-provider-badge">
                <i className="fa-solid fa-circle-check"></i> {offer.booking?.providerName || 'Official Partner'}
              </span>
            </div>

            <div className="t-card-actions">
              <button
                type="button"
                className="t-book-btn"
                onClick={() => onSelectOffer?.(offer)}
              >
                <span>Select & Book</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

