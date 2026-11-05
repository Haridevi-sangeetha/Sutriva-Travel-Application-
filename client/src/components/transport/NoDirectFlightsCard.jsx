import React from 'react';

/**
 * NoDirectFlightsCard
 * Displays a clean, elegant notification when no direct flights operate for a given sector,
 * offering rich multi-modal alternatives (Trains, Buses, Highway Cabs) and connecting flight options.
 */
export default function NoDirectFlightsCard({
  origin,
  destination,
  alternatives,
  connectingFlights,
  onSelectMode
}) {
  const alt = alternatives || {
    suggestedMode: 'Trains',
    reason: `No direct commercial flights operate between ${origin} and ${destination}. High-speed trains and luxury sleeper buses provide fast, direct daily connections.`,
    trains: {
      available: true,
      count: 14,
      fastest: '4h 15m (Vande Bharat / Kovai Exp)',
      startingPrice: 165,
      popularOption: '20644 Vande Bharat Express'
    },
    buses: {
      available: true,
      count: 48,
      fastest: '5h 30m (SETC / AC Sleeper)',
      startingPrice: 380,
      popularOption: 'TNSTC / SETC Non-Stop Sleeper'
    },
    cabs: {
      distanceKm: 346,
      duration: '5h 45m',
      estimatedCost: 4850
    }
  };

  return (
    <div className="t-empty-state-card no-direct-flights-card" style={{
      gridColumn: '1 / -1',
      width: '100%',
      maxWidth: '960px',
      margin: '0 auto',
      padding: '32px 24px',
      textAlign: 'left',
      background: '#ffffff',
      border: '1.5px solid #e2e8f0',
      borderRadius: '20px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
    }}>
      {/* Top Status Alert */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: '#fff1f2',
          color: '#e11d48',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          flexShrink: 0
        }}>
          <i className="fa-solid fa-plane-slash"></i>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#fee2e2',
              color: '#b91c1c',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              No Direct Flights
            </span>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              {origin} ➔ {destination} Sector
            </span>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '6px 0 4px 0' }}>
            No Direct Flights Available for this Route
          </h3>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
            {alt.reason}
          </p>
        </div>
      </div>

      {/* Multi-Modal Alternatives Recommendation Grid */}
      <div style={{ marginTop: '24px' }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#64748b',
          marginBottom: '14px'
        }}>
          <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#f59e0b', marginRight: '6px' }}></i>
          Recommended Fast & Affordable Travel Options
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          
          {/* Train Card */}
          <div style={{
            background: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: '#dcfce7',
              color: '#15803d',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              Top Recommended
            </div>
            <div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#22c55e',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                marginBottom: '12px'
              }}>
                <i className="fa-solid fa-train"></i>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#14532d' }}>Express & Superfast Trains</div>
              <div style={{ fontSize: '13px', color: '#166534', marginTop: '4px', fontWeight: 600 }}>
                <i className="fa-regular fa-clock"></i> Fastest: {alt.trains?.fastest || '4h 15m'}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                ⭐ {alt.trains?.popularOption || '14 Daily Direct Trains'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803d', marginTop: '10px' }}>
                From ₹{alt.trains?.startingPrice || 165} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>/ seat</span>
              </div>
            </div>
            <button
              type="button"
              className="tool-btn-primary"
              onClick={() => onSelectMode ? onSelectMode('Trains') : window.switchTransportModeAndSearch?.('Trains')}
              style={{
                marginTop: '14px',
                width: '100%',
                background: '#16a34a',
                borderColor: '#16a34a',
                padding: '10px 14px',
                fontWeight: 700,
                fontSize: '13px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-train"></i> Switch to Trains ({alt.trains?.count || 14} Available)
            </button>
          </div>

          {/* Bus Card */}
          <div style={{
            background: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: '#dbeafe',
              color: '#1d4ed8',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              Frequent Service
            </div>
            <div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#3b82f6',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                marginBottom: '12px'
              }}>
                <i className="fa-solid fa-bus"></i>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a8a' }}>Intercity AC Sleepers & SETC</div>
              <div style={{ fontSize: '13px', color: '#1e40af', marginTop: '4px', fontWeight: 600 }}>
                <i className="fa-regular fa-clock"></i> Duration: {alt.buses?.fastest || '5h 30m'}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                🚌 {alt.buses?.popularOption || 'Day & Overnight Sleepers'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#1d4ed8', marginTop: '10px' }}>
                From ₹{alt.buses?.startingPrice || 380} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>/ seat</span>
              </div>
            </div>
            <button
              type="button"
              className="tool-btn-primary"
              onClick={() => onSelectMode ? onSelectMode('Buses') : window.switchTransportModeAndSearch?.('Buses')}
              style={{
                marginTop: '14px',
                width: '100%',
                background: '#2563eb',
                borderColor: '#2563eb',
                padding: '10px 14px',
                fontWeight: 700,
                fontSize: '13px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-bus"></i> Switch to Buses ({alt.buses?.count || 48} Available)
            </button>
          </div>

          {/* Cab Card */}
          <div style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: '#fef3c7',
              color: '#b45309',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              Door-to-Door
            </div>
            <div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                marginBottom: '12px'
              }}>
                <i className="fa-solid fa-car"></i>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#78350f' }}>Highway Cab / Self Drive</div>
              <div style={{ fontSize: '13px', color: '#92400e', marginTop: '4px', fontWeight: 600 }}>
                <i className="fa-solid fa-road"></i> {alt.cabs?.distanceKm || 346} km · {alt.cabs?.duration || '5h 45m'}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                🛣️ Via NH 48 Highway Route
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#b45309', marginTop: '10px' }}>
                Est. ₹{(alt.cabs?.estimatedCost || 4850).toLocaleString('en-IN')}{' '}
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>/ car</span>
              </div>
            </div>
            <button
              type="button"
              className="tool-btn-primary"
              onClick={() => onSelectMode ? onSelectMode('Cabs') : window.switchTransportModeAndSearch?.('Cabs')}
              style={{
                marginTop: '14px',
                width: '100%',
                background: '#d97706',
                borderColor: '#d97706',
                padding: '10px 14px',
                fontWeight: 700,
                fontSize: '13px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-car"></i> View Highway Cabs
            </button>
          </div>

        </div>
      </div>

      {/* Connecting Flights Option (if present) */}
      {connectingFlights && connectingFlights.length > 0 && (
        <div style={{
          marginTop: '24px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-plane-arrival" style={{ color: '#0284c7' }}></i> Available 1-Stop Connecting Flights
            </div>
            <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '12px' }}>
              Via Kempegowda Int'l (BLR)
            </span>
          </div>

          {connectingFlights.map((cf, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                  {cf.carrier} ({(cf.flightNumbers || []).join(' + ')})
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>{cf.route}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  <i className="fa-regular fa-clock"></i> {cf.totalDuration} · <i className="fa-solid fa-hourglass-half"></i> {cf.layoverDuration}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Starting From</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>
                  ₹{(cf.startingPrice || 6850).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

