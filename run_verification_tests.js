// Sutriva Automated Verification Test Suite (Phase 14)
const http = require('http');

async function testSuite() {
  console.log('====================================================');
  console.log('   SUTRIVA COMPLETE VERIFICATION TEST SUITE (PHASE 14)  ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // 1. Backend Health & Server
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/geocode?address=Tiruchengode');
    const data = await res.json();
    assert(data.success && data.data && data.data.lat === 11.3787, 'Case 1: Geocode Tiruchengode returns exact real coordinates (11.3787, 77.8967)');
  } catch (e) {
    assert(false, `Case 1 Geocode failed: ${e.message}`);
  }

  // 2. Geocode Yercaud & Salem
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/geocode?address=Yercaud');
    const data = await res.json();
    assert(data.success && data.data && data.data.lat === 11.7753, 'Case 2: Geocode Yercaud returns coordinates (11.7753, 78.2093)');
  } catch (e) {
    assert(false, `Case 2 Geocode failed: ${e.message}`);
  }

  // 3. Reverse Geocode
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/reverse-geocode?lat=11.3787&lng=77.8967');
    const data = await res.json();
    assert(data.success && data.data && data.data.name.includes('Tiruchengode'), 'Case 3: Reverse Geocode resolves 11.3787, 77.8967 to Tiruchengode');
  } catch (e) {
    assert(false, `Case 3 Reverse Geocode failed: ${e.message}`);
  }

  // 4. Autocomplete
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/autocomplete?input=Yerc');
    const data = await res.json();
    assert(data.success && Array.isArray(data.data) && data.data.length > 0 && data.data[0].text.includes('Yercaud'), 'Case 4: Autocomplete "Yerc" returns Yercaud prediction');
  } catch (e) {
    assert(false, `Case 4 Autocomplete failed: ${e.message}`);
  }

  // 5. Route calculation (Tiruchengode to Yercaud)
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromLat: 11.3787,
        fromLng: 77.8967,
        toLat: 11.7753,
        toLng: 78.2093,
        mode: 'driving'
      })
    });
    const data = await res.json();
    assert(data.success && data.data && data.data.distanceKm > 50 && data.data.durationMinutes > 0, `Case 5: Route calculation Tiruchengode -> Yercaud (${data.data.distanceKm} km, ${data.data.durationMinutes} mins)`);
  } catch (e) {
    assert(false, `Case 5 Route calculation failed: ${e.message}`);
  }

  // 6. Route calculation (Salem to Yercaud)
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromLat: 11.6643,
        fromLng: 78.1460,
        toLat: 11.7753,
        toLng: 78.2093,
        mode: 'driving'
      })
    });
    const data = await res.json();
    assert(data.success && data.data && data.data.distanceKm < 45, `Case 6: Route calculation Salem -> Yercaud (${data.data.distanceKm} km)`);
  } catch (e) {
    assert(false, `Case 6 Route calculation failed: ${e.message}`);
  }

  // 7. Nearby Temples search
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/search?lat=11.7753&lng=78.2093&category=Temples&radius=50');
    const data = await res.json();
    assert(data.success && data.data && data.data.length > 0 && data.data.every(p => p.category === 'Temples'), `Case 7: Temples search returns ${data.data.length} real temples`);
  } catch (e) {
    assert(false, `Case 7 Temples search failed: ${e.message}`);
  }

  // 8. Nearby Cafes search
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/search?lat=11.7753&lng=78.2093&category=Cafes&radius=50');
    const data = await res.json();
    assert(data.success && data.data && data.data.length > 0 && data.data.every(p => p.category === 'Cafes'), `Case 8: Cafes search returns ${data.data.length} real cafes`);
  } catch (e) {
    assert(false, `Case 8 Cafes search failed: ${e.message}`);
  }

  // 9. Nearby Waterfalls search
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/search?lat=11.7753&lng=78.2093&category=Falls&radius=50');
    const data = await res.json();
    assert(data.success && data.data && data.data.length > 0 && data.data.every(p => p.category === 'Falls'), `Case 9: Falls search returns ${data.data.length} real waterfalls`);
  } catch (e) {
    assert(false, `Case 9 Falls search failed: ${e.message}`);
  }

  // 10. Distance Filter (e.g. radius 10 km)
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/search?lat=11.7753&lng=78.2093&radius=10');
    const data = await res.json();
    assert(data.success && data.data && data.data.every(p => p.distanceKm <= 10.5), `Case 10: Radius 10 km filter strictly enforced (${data.data.length} places)`);
  } catch (e) {
    assert(false, `Case 10 Distance filter failed: ${e.message}`);
  }

  // 11. Budget Filter (Free places)
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/search?lat=11.7753&lng=78.2093&maxBudget=free&radius=50');
    const data = await res.json();
    assert(data.success && data.data && data.data.every(p => p.entryFeeVal === 0 || (p.entryFee && p.entryFee.toLowerCase().includes('free'))), `Case 11: Free budget filter strictly returns free admission places`);
  } catch (e) {
    assert(false, `Case 11 Budget filter failed: ${e.message}`);
  }

  // 12. Verified Only Filter
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/search?lat=11.7753&lng=78.2093&verified=true&radius=50');
    const data = await res.json();
    assert(data.success && data.data && data.data.every(p => p.verificationStatus === 'verified'), `Case 12: Verified only filter returns authenticated places`);
  } catch (e) {
    assert(false, `Case 12 Verified filter failed: ${e.message}`);
  }

  // 13. Sorting by Distance
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/search?lat=11.7753&lng=78.2093&radius=50&sort=distance');
    const data = await res.json();
    let isSorted = true;
    for (let i = 1; i < data.data.length; i++) {
      if (data.data[i].distanceKm < data.data[i-1].distanceKm) { isSorted = false; break; }
    }
    assert(data.success && isSorted, 'Case 13: Sort by distance returns ascending distance order');
  } catch (e) {
    assert(false, `Case 13 Sort by distance failed: ${e.message}`);
  }

  // 14. Sorting by Rating
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/search?lat=11.7753&lng=78.2093&radius=50&sort=rating');
    const data = await res.json();
    let isSorted = true;
    for (let i = 1; i < data.data.length; i++) {
      if ((data.data[i].rating || 0) > (data.data[i-1].rating || 0)) { isSorted = false; break; }
    }
    assert(data.success && isSorted, 'Case 14: Sort by rating returns descending rating order');
  } catch (e) {
    assert(false, `Case 14 Sort by rating failed: ${e.message}`);
  }

  // 15. Place Details by ID
  try {
    const res = await fetch('http://localhost:5000/api/v1/places/details/yercaud-ladys-seat');
    const data = await res.json();
    assert(data.success && data.data && data.data.name === "Lady's Seat" && data.data.photos.length > 0, "Case 15: Details endpoint returns authentic Lady's Seat metadata");
  } catch (e) {
    assert(false, `Case 15 Details endpoint failed: ${e.message}`);
  }

  // 16. Frontend Port 8080 Serving check
  try {
    const res = await fetch('http://localhost:8080');
    const text = await res.text();
    assert(res.ok && text.includes('Sutriva'), 'Case 16: Frontend is accessible on Port 8080 (not 3000)');
  } catch (e) {
    assert(false, `Case 16 Frontend check failed: ${e.message}`);
  }

  // 17. MongoDB Connection & Food Collection
  try {
    const res = await fetch('http://localhost:5000/api/v1/food?city=Tiruchengode&limit=5');
    const data = await res.json();
    assert(data.success && Array.isArray(data.data), 'Case 17: MongoDB "Food Collection" queries succeed');
  } catch (e) {
    assert(false, `Case 17 MongoDB food check failed: ${e.message}`);
  }

  // 18. MongoDB Government Bus collection
  try {
    const res = await fetch('http://localhost:5000/api/v1/buses?limit=5');
    const data = await res.json();
    assert(data.success && data.total > 40000, `Case 18: MongoDB "Governmet Bus" collection active (${data.total} records)`);
  } catch (e) {
    assert(false, `Case 18 MongoDB bus check failed: ${e.message}`);
  }

  console.log(`\n====================================================`);
  console.log(`   TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round(passed/total*100)}%)`);
  console.log(`====================================================\n`);
}

testSuite();
