// --- Global Utility & Page Navigation Functions ---
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (toast && toastMsg) {
    toastMsg.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

function switchPage(pageId) {
  if (!pageId) return;

  if (pageId === 'live-tracker') pageId = 'tracker';
  if (pageId === 'ai-planner') pageId = 'ai';

  if (typeof window.closeHomeInlineTool === 'function') {
    window.closeHomeInlineTool();
  }

  // 1. Hide all page views
  const allViews = document.querySelectorAll('.page-view');
  allViews.forEach(view => {
    view.classList.remove('active');
    view.style.display = 'none';
  });

  // 2. Show target page view or fallback to home
  const targetPage = document.getElementById(pageId + 'Page');
  if (targetPage) {
    targetPage.classList.add('active');
    targetPage.style.display = 'block';
    if (pageId === 'map' && typeof window.initExploreMapPage === 'function') {
      setTimeout(() => window.initExploreMapPage(), 50);
    } else if (pageId === 'food' && typeof window.loadFoodPlacesFromDB === 'function') {
      setTimeout(() => window.loadFoodPlacesFromDB(), 30);
    } else if (pageId === 'transport') {
      if (typeof window.renderTransportResults === 'function') {
        const activePill = document.querySelector('.t-mode-pill.active');
        const m = activePill ? (activePill.dataset.tmode || 'Flights') : 'Flights';
        window.renderTransportResults(m);
      }
      if (typeof window.fetchGovernmentBuses === 'function') {
        setTimeout(() => window.fetchGovernmentBuses(false), 30);
      }
    } else if (typeof window.renderToolPage === 'function') {
      window.renderToolPage(pageId);
    }
  } else {
    const homePage = document.getElementById('homePage');
    if (homePage) {
      homePage.classList.add('active');
      homePage.style.display = 'block';
    }
  }

  // 3. Update nav link active state
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.nav === pageId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 4. Update drawer link active state
  document.querySelectorAll('.drawer-link').forEach(link => {
    const target = link.dataset.nav || link.innerText.toLowerCase();
    if (target.includes(pageId)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 5. Scroll smoothly to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pageId === 'transport') {
    showToast('Welcome to Sutriva Transport! Explore flights, trains, buses & cabs.');
  } else if (pageId === 'food') {
    showToast('Welcome to Sutriva Explore Food! Find top restaurants & dining.');
  } else if (pageId === 'map') {
    showToast('Loaded Sutriva Map Explorer! 🗺️');
  } else if (pageId === 'home') {
    showToast('Welcome back to Home');
  } else {
    showToast(`Showing ${pageId.toUpperCase()} deals & booking options`);
  }
}
window.switchPage = switchPage;

function openAboutUs() {
  if (typeof window.switchPage === 'function') {
    window.switchPage('home');
  }
  setTimeout(() => {
    const aboutSec = document.getElementById('aboutUsSection');
    if (aboutSec) {
      aboutSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 120);
}
window.openAboutUs = openAboutUs;

function openAboutUsModal() {
  const modal = document.getElementById('aboutUsModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}
window.openAboutUsModal = openAboutUsModal;

function closeAboutUsModal() {
  const modal = document.getElementById('aboutUsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}
window.closeAboutUsModal = closeAboutUsModal;

// =====================================================================
// --- Sutriva Live MongoDB Food Engine (localhost:27017 / Sutriva) ---
// =====================================================================
let currentFoodFilterType = 'all';
let currentFoodSearchQuery = '';
let currentFoodLocation = 'Tiruchengode';
let foodSearchDebounceTimer = null;
let cachedMongoFoodList = [];

async function loadFoodPlacesFromDB(type = currentFoodFilterType, search = currentFoodSearchQuery) {
  currentFoodFilterType = type || 'all';
  currentFoodSearchQuery = search || '';
  
  const container = document.getElementById('foodRestaurantCardsGrid');
  const countBadge = document.getElementById('foodDbCountBadge');
  const heading = document.getElementById('foodSectionHeading');
  const subheading = document.getElementById('foodSectionSubheading');
  const locDisplay = document.getElementById('currentFoodLocDisplay');
  
  if (locDisplay) locDisplay.textContent = currentFoodLocation === 'all' ? 'All Regions' : currentFoodLocation;

  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: #64748b;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 26px; color: #10b981; margin-bottom: 12px;"></i>
        <div style="font-size: 15px; font-weight: 600; color: #0f172a;">Connecting to MongoDB (localhost:27017)...</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Loading food collection: ${currentFoodFilterType.toUpperCase()} in ${currentFoodLocation}</div>
      </div>
    `;
  }

  try {
    const params = new URLSearchParams();
    if (currentFoodFilterType && currentFoodFilterType !== 'all') {
      params.append('category', currentFoodFilterType);
    }
    if (currentFoodSearchQuery) {
      params.append('search', currentFoodSearchQuery);
    }
    if (currentFoodLocation && currentFoodLocation !== 'all') {
      params.append('city', currentFoodLocation);
    }
    params.append('limit', '80');

    const res = await fetch(`http://localhost:5000/api/v1/food?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    if (data && data.success && Array.isArray(data.data)) {
      cachedMongoFoodList = data.data;
      if (countBadge) countBadge.textContent = data.total || data.count;
      
      if (heading) {
        if (currentFoodSearchQuery) {
          heading.textContent = `Search results for "${currentFoodSearchQuery}" (${data.count} found)`;
        } else if (currentFoodFilterType !== 'all') {
          heading.textContent = `${currentFoodFilterType.charAt(0).toUpperCase() + currentFoodFilterType.slice(1)} in ${currentFoodLocation} (${data.count} Places)`;
        } else {
          heading.textContent = `Recommended Near ${currentFoodLocation}`;
        }
      }
      
      if (subheading) {
        subheading.textContent = `Live MongoDB Connection (localhost:27017) • ${data.total} total food places in DB`;
      }

      renderFoodCards(cachedMongoFoodList);
      return;
    }
  } catch (err) {
    console.warn('MongoDB API fetch failed or server offline, using fallback:', err);
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 30px 20px; text-align: center; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; color: #991b1b;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 24px; margin-bottom: 8px;"></i>
          <div style="font-weight: 600;">Could not reach MongoDB Food API at http://localhost:5000/api/v1/food</div>
          <div style="font-size: 12px; margin-top: 4px; color: #b91c1c;">Make sure MongoDB is running on port 27017 and backend server is started on port 5000.</div>
        </div>
      `;
    }
  }
}

function renderFoodCards(items) {
  const container = document.getElementById('foodRestaurantCardsGrid');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: #94a3b8;">
        <i class="fa-solid fa-utensils" style="font-size: 28px; margin-bottom: 10px; color: #cbd5e1;"></i>
        <div style="font-size: 15px; font-weight: 600; color: #475569;">No food places matched your filters</div>
        <div style="font-size: 12px; margin-top: 4px;">Try searching for another dish, category, or clearing your search term.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((place, idx) => {
    const isVeg = place.isVeg;
    const badgeText = isVeg ? 'Pure Veg' : (place.rating >= 4.6 ? '★ Popular' : '★ Verified');
    const badgeClass = isVeg ? 'badge-green' : (place.rating >= 4.6 ? 'badge-purple' : 'badge-orange');
    const distanceText = place.distance ? `${place.distance} km` : `${(0.4 + (idx % 7) * 0.3).toFixed(1)} km`;

    return `
      <div class="restaurant-card" data-category="${(place.subcategory || '').toLowerCase()} ${isVeg ? 'veg' : 'nonveg'}">
        <div class="rest-thumb">
          <span class="rest-badge ${badgeClass}">${badgeText}</span>
          <button class="heart-btn" onclick="window.toggleFoodFav(this, event);"><i class="fa-regular fa-heart"></i></button>
          <img src="${place.image}" alt="${place.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80';" />
        </div>
        <div class="rest-body">
          <h4 class="rest-name" title="${place.name}">${place.name} <span class="rest-type">(${place.displayCategory || place.subcategory})</span></h4>
          <div class="rest-meta">
            <span class="rating-badge">★ ${place.rating} <span>(${place.reviews})</span></span>
            <span class="dist-badge"><i class="fa-solid fa-location-dot"></i> ${distanceText}</span>
          </div>
          <div class="rest-tags">
            ${(place.tags || [place.displayCategory]).slice(0, 3).map(tag => `
              <span class="tag-chip ${tag.toLowerCase().includes('veg') ? 'tag-veg' : 'tag-south'}">${tag}</span>
            `).join('')}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${place.address || place.city}">
            <i class="fa-solid fa-map-pin" style="color: #94a3b8; font-size: 10px;"></i> ${place.address || `${place.city}, ${place.district}`}
          </div>
          <div class="rest-price-footer" style="margin-top: 8px;">
            <div class="price-val"><strong>${place.priceText}</strong> <span>per person</span></div>
            <button class="view-det-btn" onclick="window.viewFoodPlaceDetails('${place._id}', event);">View Details ➔</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterFoodCategory(type, el) {
  const links = document.querySelectorAll('.food-side-link');
  if (links.length) {
    links.forEach(l => l.classList.remove('active'));
  }
  if (el) {
    if (el.classList.contains('food-side-link')) {
      el.classList.add('active');
    } else {
      const match = document.querySelector(`.food-side-link[data-foodtype="${type}"]`);
      if (match) match.classList.add('active');
    }
  }

  loadFoodPlacesFromDB(type, currentFoodSearchQuery);

  if (typeof showToast === 'function') {
    showToast(`Loading ${type.toUpperCase()} from MongoDB... 🍽️`);
  }
}

function handleFoodSearchInput(query) {
  clearTimeout(foodSearchDebounceTimer);
  foodSearchDebounceTimer = setTimeout(() => {
    loadFoodPlacesFromDB(currentFoodFilterType, query);
  }, 300);
}

function handleFoodLocationChange(loc) {
  currentFoodLocation = loc;
  loadFoodPlacesFromDB(currentFoodFilterType, currentFoodSearchQuery);
  if (typeof showToast === 'function') {
    showToast(`Location set to ${loc}! Loaded MongoDB places.`);
  }
}

function handleFoodSortChange(criteria) {
  if (!cachedMongoFoodList || cachedMongoFoodList.length === 0) return;
  if (criteria === 'rating') {
    cachedMongoFoodList.sort((a, b) => b.rating - a.rating);
  } else if (criteria === 'price_asc') {
    cachedMongoFoodList.sort((a, b) => (a.priceVal || 0) - (b.priceVal || 0));
  } else {
    cachedMongoFoodList.sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews));
  }
  renderFoodCards(cachedMongoFoodList);
}

function viewFoodPlaceDetails(placeId, event) {
  if (event) event.stopPropagation();
  const place = cachedMongoFoodList.find(p => p._id === placeId);
  if (!place) return;
  
  if (typeof showToast === 'function') {
    showToast(`📍 ${place.name}: ${place.address || place.city}`);
  }

  const query = encodeURIComponent(`${place.name}, ${place.address || place.city}`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
}

function toggleFoodFav(btn, event) {
  if (event) event.stopPropagation();
  const icon = btn.querySelector('i');
  if (icon) {
    if (icon.classList.contains('fa-regular')) {
      icon.classList.remove('fa-regular');
      icon.classList.add('fa-solid');
      btn.style.color = '#ef4444';
      if (typeof showToast === 'function') showToast('Added to your Saved Food Places! ❤️');
    } else {
      icon.classList.remove('fa-solid');
      icon.classList.add('fa-regular');
      btn.style.color = '#94a3b8';
      if (typeof showToast === 'function') showToast('Removed from favorites');
    }
  }
}

function useCurrentGpsFoodLocation() {
  if (navigator.geolocation) {
    if (typeof showToast === 'function') showToast('Locating your position... 📍');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (typeof showToast === 'function') showToast('GPS detected: Showing nearby MongoDB food places!');
        loadFoodPlacesFromDB('all', '');
      },
      () => {
        if (typeof showToast === 'function') showToast('Showing Tiruchengode food places from MongoDB');
        loadFoodPlacesFromDB('all', '');
      }
    );
  } else {
    loadFoodPlacesFromDB('all', '');
  }
}

// Expose Food DB Engine to window
window.showToast = showToast;
window.switchPage = switchPage;
window.filterFoodCategory = filterFoodCategory;
window.loadFoodPlacesFromDB = loadFoodPlacesFromDB;
window.handleFoodSearchInput = handleFoodSearchInput;
window.handleFoodLocationChange = handleFoodLocationChange;
window.handleFoodSortChange = handleFoodSortChange;
window.viewFoodPlaceDetails = viewFoodPlaceDetails;
window.toggleFoodFav = toggleFoodFav;
window.useCurrentGpsFoodLocation = useCurrentGpsFoodLocation;

// --- Sutriva Interactive Tools State & Persistence Engine ---
const DEFAULT_TOOL_STATE = {
  budget: {
    total: 10000,
    items: [
      { id: 1, title: 'Bus / Taxi to Hotel', cat: 'Flight', amount: 1200, date: 'Today' },
      { id: 2, title: 'Beach Resort (2 Nights)', cat: 'Hotel', amount: 4500, date: 'Today' }
    ]
  },
  split: {
    friends: ['You', 'Rahul', 'Priya'],
    expenses: [
      { id: 1, title: 'Beach Villa Stay', paidBy: 'You', amount: 3000 },
      { id: 2, title: 'Scuba Diving Tour', paidBy: 'Rahul', amount: 1500 }
    ]
  },
  checklist: [
    { id: 1, text: 'Passport & Original ID Cards', cat: 'Essentials', done: true },
    { id: 2, text: 'Flight / Bus Booking PDF', cat: 'Essentials', done: true },
    { id: 3, text: 'Smartphone & Fast Charger', cat: 'Tech', done: true },
    { id: 4, text: 'Power Bank 20,000mAh', cat: 'Tech', done: false },
    { id: 5, text: 'Sunscreen & Sunglasses', cat: 'Toiletries', done: false },
    { id: 6, text: 'Beach Wear & Extra Towel', cat: 'Clothes', done: false }
  ],
  alerts: [
    { id: 1, route: 'Chennai (MAA) ➔ Goa (GOI)', target: 3500, current: 4200, active: true },
    { id: 2, route: 'Bangalore (BLR) ➔ Delhi (DEL)', target: 4000, current: 3950, active: true }
  ],
  docs: [
    { id: 1, name: 'Passport (Self)', type: 'ID Card / PDF', status: 'Verified', date: 'Exp: 2031' },
    { id: 2, name: 'Goa E-Ticket', type: 'PDF', status: 'Confirmed', date: 'Valid' }
  ],
  customItinerary: []
};

function loadSutrivaToolState() {
  try {
    const saved = localStorage.getItem('sutriva_tool_state_v5');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        budget: { total: 10000, items: [], filterCat: 'All', ...(parsed.budget || {}) },
        split: { friends: ['You', 'Rahul', 'Priya'], expenses: [], ...(parsed.split || {}) },
        checklist: parsed.checklist || DEFAULT_TOOL_STATE.checklist,
        alerts: parsed.alerts || DEFAULT_TOOL_STATE.alerts,
        docs: parsed.docs || DEFAULT_TOOL_STATE.docs,
        customItinerary: parsed.customItinerary || []
      };
    }
  } catch (e) {
    console.warn('Failed to load sutriva tool state', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_TOOL_STATE));
}

function saveSutrivaToolState() {
  try {
    localStorage.setItem('sutriva_tool_state_v5', JSON.stringify(window.sutrivaToolState));
  } catch (e) {
    console.warn('Failed to save sutriva tool state', e);
  }
}

window.sutrivaToolState = loadSutrivaToolState();

window.renderToolPage = function(toolKey) {
  let key = toolKey;
  if (key === 'live-tracker') key = 'tracker';
  if (key === 'ai-planner') key = 'ai';

  const container = document.getElementById(key + 'PageContainer');
  if (!container) return;

  const dummyIcon = { className: '', innerHTML: '' };
  const dummyTitle = { textContent: '' };
  const dummySubtitle = { textContent: '' };

  try {
    switch (key) {
      case 'budget':
        renderBudgetTracker(dummyIcon, dummyTitle, dummySubtitle, container);
        break;
      case 'itinerary':
        renderSmartItinerary(dummyIcon, dummyTitle, dummySubtitle, container);
        break;
      case 'calculator':
        renderTripCostCalculator(dummyIcon, dummyTitle, dummySubtitle, container);
        break;
      case 'emi':
        renderEMIPlanner(dummyIcon, dummyTitle, dummySubtitle, container);
        break;
      case 'alert':
        renderPriceAlert(dummyIcon, dummyTitle, dummySubtitle, container);
        break;
      case 'split':
        renderSplitExpenses(dummyIcon, dummyTitle, dummySubtitle, container);
        break;
      case 'checklist':
        renderPackingChecklist(dummyIcon, dummyTitle, dummySubtitle, container);
        break;
      case 'documents':
        renderTravelDocuments(dummyIcon, dummyTitle, dummySubtitle, container);
        break;
      case 'tracker':
        renderLiveTripTracker(dummyIcon, dummyTitle, dummySubtitle, container);
        break;
      case 'ai':
        renderAITripPlanner(dummyIcon, dummyTitle, dummySubtitle, container);
        break;
      case 'map':
        switchPage('map');
        break;
    }
  } catch (err) {
    console.error('Error rendering tool page:', err);
  }
};

window.closeHomeInlineTool = function() {
  const drawer = document.getElementById('homeInlineToolDrawer');
  if (drawer) {
    drawer.style.display = 'none';
  }
  document.querySelectorAll('.tool-card').forEach(card => card.classList.remove('active-tool-card'));
};

window.openSutrivaToolModal = function(toolKey) {
  let key = toolKey;
  if (key === 'live-tracker') key = 'tracker';
  if (key === 'ai-planner') key = 'ai';

  if (key === 'map') {
    if (typeof window.closeHomeInlineTool === 'function') {
      window.closeHomeInlineTool();
    }
    switchPage('map');
    return;
  }

  // Highlight selected tool card
  document.querySelectorAll('.tool-card').forEach(card => {
    if (card.dataset && (card.dataset.tool === toolKey || card.dataset.tool === key)) {
      card.classList.add('active-tool-card');
    } else {
      card.classList.remove('active-tool-card');
    }
  });

  const drawer = document.getElementById('homeInlineToolDrawer');
  const content = document.getElementById('homeInlineToolContent');
  const icon = document.getElementById('homeToolIcon');
  const title = document.getElementById('homeToolTitle');
  const subtitle = document.getElementById('homeToolSubtitle');

  if (drawer && content && icon && title && subtitle) {
    drawer.style.display = 'block';

    switch (key) {
      case 'budget':
        renderBudgetTracker(icon, title, subtitle, content);
        break;
      case 'itinerary':
        renderSmartItinerary(icon, title, subtitle, content);
        break;
      case 'tracker':
        renderLiveTripTracker(icon, title, subtitle, content);
        break;
      case 'split':
        renderSplitExpenses(icon, title, subtitle, content);
        break;
      default:
        renderBudgetTracker(icon, title, subtitle, content);
        break;
    }

    drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    switchPage(key);
  }
};

window.closeSutrivaToolModal = function() {
  closeHomeInlineTool();
};

// 1. Budget Tracker Engine
function renderBudgetTracker(icon, title, subtitle, container) {
  icon.className = 'tool-modal-icon icon-green';
  icon.innerHTML = '<i class="fa-solid fa-wallet"></i>';
  title.textContent = 'Trip Budget Tracker';
  subtitle.textContent = 'Set your initial trip budget & track remaining balance live';

  if (!window.sutrivaToolState.budget.filterCat) {
    window.sutrivaToolState.budget.filterCat = 'All';
  }

  const items = window.sutrivaToolState.budget.items || [];
  const totalSpent = items.reduce((sum, item) => sum + item.amount, 0);
  const totalBudget = window.sutrivaToolState.budget.total || 10000;
  const remaining = totalBudget - totalSpent;
  const pct = Math.min(100, Math.round((totalSpent / totalBudget) * 100));

  let progressColor = '#10b981';
  if (pct > 70) progressColor = '#f59e0b';
  if (pct > 90) progressColor = '#ef4444';

  const filterCat = window.sutrivaToolState.budget.filterCat;
  const filteredItems = filterCat === 'All' ? items : items.filter(i => i.cat === filterCat);

  container.innerHTML = `
    <div class="tool-widget-box">
      <!-- Set Initial Budget Form -->
      <div style="background:#f1f5f9; border:1px solid #cbd5e1; padding:12px 16px; border-radius:14px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <div>
          <span style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Trip Initial Budget Target</span>
          <div style="font-size:22px; font-weight:800; color:#0f172a;">₹${totalBudget.toLocaleString()}</div>
        </div>
        <form id="setBudgetForm" style="display:flex; gap:8px; align-items:center;">
          <input type="number" id="newTripBudget" class="tool-input" placeholder="e.g. 10000" style="width:130px;" value="${totalBudget}" required />
          <button type="submit" class="tool-btn-primary" style="padding:10px 14px; font-size:13px;"><i class="fa-solid fa-floppy-disk"></i> Update Budget</button>
        </form>
      </div>

      <!-- Real-Time Stat Cards -->
      <div class="tool-summary-cards">
        <div class="tool-stat-card accent-blue">
          <div class="label">Initial Budget</div>
          <div class="value">₹${totalBudget.toLocaleString()}</div>
        </div>
        <div class="tool-stat-card accent-red">
          <div class="label">Total Spent</div>
          <div class="value">₹${totalSpent.toLocaleString()}</div>
        </div>
        <div class="tool-stat-card ${remaining < 0 ? 'accent-red' : 'accent-green'}">
          <div class="label">Remaining Balance</div>
          <div class="value">₹${remaining.toLocaleString()}</div>
        </div>
      </div>

      <!-- Live Progress Bar -->
      <div>
        <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; margin-bottom:6px; color:#334155;">
          <span>Budget Used (${pct}%)</span>
          <span style="color:${remaining < 0 ? '#ef4444' : '#10b981'};">${remaining < 0 ? '⚠️ Budget Overrun!' : `₹${remaining.toLocaleString()} available`}</span>
        </div>
        <div class="tool-progress-bg">
          <div class="tool-progress-fill" style="width: ${pct}%; background-color: ${progressColor};"></div>
        </div>
      </div>

      <!-- Add Expense Entry Form -->
      <form id="addExpenseForm" style="background:#f8fafc; padding:16px; border-radius:14px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:12px;">
        <div style="font-weight:700; font-size:14px; color:#0f172a; display:flex; align-items:center; justify-content:space-between;">
          <span style="display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-receipt" style="color:#1877f2;"></i> Log New Expense Entry</span>
          <button type="button" id="exportBudgetReportBtn" style="background:none; border:none; color:#1877f2; font-size:12px; font-weight:700; cursor:pointer;"><i class="fa-solid fa-download"></i> Export Report</button>
        </div>
        <div class="tool-input-row">
          <div class="tool-input-group">
            <label>Expense Title</label>
            <input type="text" id="expenseTitle" class="tool-input" placeholder="e.g. Dinner, Taxi fare, Water sports" required />
          </div>
          <div class="tool-input-group" style="max-width:140px;">
            <label>Amount (₹)</label>
            <input type="number" id="expenseAmount" class="tool-input" placeholder="e.g. 2000" required />
          </div>
        </div>
        <div class="tool-input-row">
          <div class="tool-input-group">
            <label>Category</label>
            <select id="expenseCat" class="tool-select">
              <option value="Food">🍲 Food & Dining</option>
              <option value="Flight">✈️ Flight / Transport</option>
              <option value="Hotel">🏨 Hotel / Stay</option>
              <option value="Activity">🎟️ Sightseeing & Activities</option>
              <option value="Shopping">🛍️ Shopping & Gifts</option>
              <option value="Misc">📦 Miscellaneous</option>
              <option value="Other">✨ Other</option>
            </select>
          </div>
          <button type="submit" class="tool-btn-primary" style="align-self:flex-end;"><i class="fa-solid fa-plus"></i> Deduct & Record</button>
        </div>
      </form>

      <!-- Category Filter Tabs -->
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        ${['All', 'Food', 'Flight', 'Hotel', 'Activity', 'Shopping', 'Misc', 'Other'].map(c => `
          <button type="button" class="budget-cat-tab ${filterCat === c ? 'active' : ''}" data-cat="${c}" style="padding:4px 10px; border-radius:20px; font-size:12px; border:1px solid #cbd5e1; background:${filterCat === c ? '#1877f2' : '#ffffff'}; color:${filterCat === c ? '#ffffff' : '#334155'}; font-weight:600; cursor:pointer;">
            ${c}
          </button>
        `).join('')}
      </div>

      <!-- Expense History -->
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-weight:700; font-size:14px; color:#0f172a;">Trip Expense History (${filteredItems.length})</div>
          ${items.length > 0 ? `<button type="button" id="clearAllExpensesBtn" style="background:none; border:none; color:#ef4444; font-size:12px; font-weight:700; cursor:pointer;"><i class="fa-solid fa-rotate-left"></i> Reset Expenses</button>` : ''}
        </div>
        <div class="tool-item-list">
          ${filteredItems.length === 0 ? `
            <div style="text-align:center; padding:20px; color:#94a3b8; font-size:13px;">No expense items found for category: <strong>${filterCat}</strong>.</div>
          ` : filteredItems.map((item) => {
            const actualIdx = items.indexOf(item);
            return `
            <div class="tool-list-row">
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="tool-badge tool-badge-blue">${item.cat}</span>
                <div>
                  <strong style="color:#0f172a; display:block;">${item.title}</strong>
                  <span style="font-size:11px; color:#94a3b8;">${item.date || 'Recorded'}</span>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:12px;">
                <strong style="color:#ef4444;">- ₹${item.amount.toLocaleString()}</strong>
                <button type="button" class="del-exp-btn" data-idx="${actualIdx}" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Delete entry"><i class="fa-solid fa-trash-can"></i></button>
              </div>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  const setBudgetForm = container.querySelector('#setBudgetForm');
  if (setBudgetForm) {
    setBudgetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = parseFloat(container.querySelector('#newTripBudget').value);
      if (!isNaN(val) && val > 0) {
        window.sutrivaToolState.budget.total = val;
        saveSutrivaToolState();
        showToast(`Initial trip budget updated to ₹${val.toLocaleString()}! 💰`);
        renderBudgetTracker(icon, title, subtitle, container);
      }
    });
  }

  const addExpenseForm = container.querySelector('#addExpenseForm');
  if (addExpenseForm) {
    addExpenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = container.querySelector('#expenseTitle').value.trim();
      const a = parseFloat(container.querySelector('#expenseAmount').value);
      const c = container.querySelector('#expenseCat').value;
      if (t && !isNaN(a) && a > 0) {
        window.sutrivaToolState.budget.items.unshift({
          id: Date.now(),
          title: t,
          cat: c,
          amount: a,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        saveSutrivaToolState();
        const rem = window.sutrivaToolState.budget.total - window.sutrivaToolState.budget.items.reduce((s, i) => s + i.amount, 0);
        showToast(`Logged ₹${a} for ${t}. Remaining: ₹${rem.toLocaleString()}`);
        renderBudgetTracker(icon, title, subtitle, container);
      }
    });
  }

  container.querySelectorAll('.budget-cat-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      window.sutrivaToolState.budget.filterCat = btn.getAttribute('data-cat');
      renderBudgetTracker(icon, title, subtitle, container);
    });
  });

  container.querySelectorAll('.del-exp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      const removed = window.sutrivaToolState.budget.items.splice(idx, 1);
      saveSutrivaToolState();
      showToast(`Removed entry: ${removed[0]?.title}`);
      renderBudgetTracker(icon, title, subtitle, container);
    });
  });

  const clearBtn = container.querySelector('#clearAllExpensesBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Reset all logged expenses for this trip?')) {
        window.sutrivaToolState.budget.items = [];
        saveSutrivaToolState();
        showToast('All trip expenses reset!');
        renderBudgetTracker(icon, title, subtitle, container);
      }
    });
  }

  const exportBtn = container.querySelector('#exportBudgetReportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const summaryText = `Sutriva Budget Report:\nTarget: ₹${totalBudget}\nSpent: ₹${totalSpent}\nRemaining: ₹${remaining}\nTotal Expenses logged: ${items.length}`;
      navigator.clipboard?.writeText(summaryText);
      showToast('Budget summary copied to clipboard! 📋');
    });
  }
}

// 2. Smart Itinerary Engine
function renderSmartItinerary(icon, title, subtitle, container) {
  icon.className = 'tool-modal-icon icon-pink';
  icon.innerHTML = '<i class="fa-solid fa-calendar-days"></i>';
  title.textContent = 'Smart Itinerary Generator';
  subtitle.textContent = 'AI-assisted day-by-day interactive travel itinerary';

  const defaultItins = {
    Goa: [
      { day: 1, time: 'Morning', title: 'Arrival & Beachfront Check-in', desc: 'Check in at Calangute Resort, relax by the shore with fresh coconut water.' },
      { day: 1, time: 'Afternoon', title: '17th-Century Fort Aguada', desc: 'Explore the Portuguese lighthouse & take ocean photos.' },
      { day: 1, time: 'Evening', title: 'Anjuna Beach Sunset & Dinner', desc: 'Live music, candlelight dining & fresh seafood at beach shacks.' },
      { day: 2, time: 'Full Day', title: 'Dudhsagar Waterfall & Spice Plantation', desc: 'Jeep safari through Mollem National Park followed by authentic Goan lunch.' },
      { day: 3, time: 'Morning', title: 'Water Sports at Baga', desc: 'Parasailing, jet skiing & banana boat rides.' },
      { day: 3, time: 'Evening', title: 'Mandovi River Sunset Cruise', desc: 'Traditional Goan folk dance & live DJ onboard.' }
    ],
    Kerala: [
      { day: 1, time: 'Morning', title: 'Kochi Heritage Walk & Chinese Nets', desc: 'Explore Fort Kochi, Jewish Synagogue & spice markets.' },
      { day: 1, time: 'Evening', title: 'Munnar Tea Gardens Sunset', desc: 'Drive through misty rolling tea hills and visit tea museum.' },
      { day: 2, time: 'Full Day', title: 'Alleppey Houseboat Backwater Cruise', desc: 'Private luxury houseboat with traditional Keralite meals.' },
      { day: 3, time: 'Morning', title: 'Periyar Wildlife Sanctuary Jeep Safari', desc: 'Spot wild elephants, tigers & rare birds around Periyar lake.' }
    ],
    Manali: [
      { day: 1, time: 'Morning', title: 'Mall Road & Hadimba Temple', desc: 'Visit ancient wooden temple surrounded by cedar forest.' },
      { day: 2, time: 'Full Day', title: 'Solang Valley Snow Adventure', desc: 'Paragliding, skiing, ropeway rides & snow scooter safaris.' },
      { day: 3, time: 'Morning', title: 'Atal Tunnel & Sissu Waterfalls', desc: 'Drive through high-altitude tunnel into Lahaul valley.' }
    ],
    Dubai: [
      { day: 1, time: 'Evening', title: 'Burj Khalifa 124th Floor & Fountain Show', desc: 'Panoramic city views followed by Dubai Mall fountain display.' },
      { day: 2, time: 'Afternoon', title: 'Desert Safari & BBQ Camp', desc: 'Dune bashing, camel riding, belly dancing & Arabian buffet.' },
      { day: 3, time: 'Morning', title: 'Museum of the Future & Marina Yacht', desc: 'Futuristic architecture tour and luxury yacht cruise.' }
    ],
    Singapore: [
      { day: 1, time: 'Evening', title: 'Gardens by the Bay & Supertree Light Show', desc: 'Flower Dome, Cloud Forest & Rhapsody light spectacle.' },
      { day: 2, time: 'Full Day', title: 'Universal Studios Sentosa Island', desc: 'Transformers 3D ride, Battlestar Galactica roller coaster.' },
      { day: 3, time: 'Morning', title: 'Marina Bay Sands Skypark & Merlion', desc: 'Iconic skyline photos and Orchard Road shopping.' }
    ]
  };

  const selectedDest = window.sutrivaToolState.itinDest || 'Goa';
  const selectedDays = window.sutrivaToolState.itinDays || '3';
  const selectedStyle = window.sutrivaToolState.itinStyle || 'Beach & Adventure';

  container.innerHTML = `
    <div class="tool-widget-box">
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <div class="tool-input-group" style="flex:2; min-width:140px;">
          <label>Destination</label>
          <select id="itinDest" class="tool-select">
            <option value="Goa" ${selectedDest==='Goa'?'selected':''}>Goa (Beaches & Nightlife)</option>
            <option value="Kerala" ${selectedDest==='Kerala'?'selected':''}>Kerala (Backwaters & Tea Hills)</option>
            <option value="Manali" ${selectedDest==='Manali'?'selected':''}>Manali (Snow & Mountains)</option>
            <option value="Dubai" ${selectedDest==='Dubai'?'selected':''}>Dubai (Luxury & Desert Safari)</option>
            <option value="Singapore" ${selectedDest==='Singapore'?'selected':''}>Singapore (Theme Parks & Skyline)</option>
          </select>
        </div>
        <div class="tool-input-group" style="flex:1; min-width:90px;">
          <label>Days</label>
          <select id="itinDays" class="tool-select">
            <option value="2" ${selectedDays==='2'?'selected':''}>2 Days</option>
            <option value="3" ${selectedDays==='3'?'selected':''}>3 Days</option>
            <option value="4" ${selectedDays==='4'?'selected':''}>4 Days</option>
            <option value="5" ${selectedDays==='5'?'selected':''}>5 Days</option>
          </select>
        </div>
        <div class="tool-input-group" style="flex:1.5; min-width:130px;">
          <label>Travel Vibe</label>
          <select id="itinStyle" class="tool-select">
            <option value="Beach & Adventure">🏖️ Adventure & Sightseeing</option>
            <option value="Romantic & Couple">💑 Romantic & Relaxation</option>
            <option value="Family Fun">👨‍👩‍👧‍👦 Family & Kids</option>
            <option value="Budget Backpacker">🎒 Budget Backpacker</option>
          </select>
        </div>
      </div>

      <button id="genItinBtn" class="tool-btn-primary" style="width:100%;">
        <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Smart Day-Wise Plan
      </button>

      <!-- Add Custom Activity Row -->
      <form id="addCustomActivityForm" style="background:#f1f5f9; padding:12px; border-radius:12px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <input type="text" id="customActTitle" class="tool-input" placeholder="+ Add custom spot (e.g. Scuba diving, Sunset Point)" style="flex:2; min-width:180px;" required />
        <select id="customActDay" class="tool-select" style="width:100px;">
          <option value="Day 1">Day 1</option>
          <option value="Day 2">Day 2</option>
          <option value="Day 3">Day 3</option>
        </select>
        <button type="submit" class="tool-btn-primary" style="padding:10px 14px; font-size:12px;"><i class="fa-solid fa-plus"></i> Add Spot</button>
      </form>

      <div id="itinOutputArea" class="tool-item-list" style="max-height:280px; display:flex; flex-direction:column; gap:10px;">
        ${(defaultItins[selectedDest] || defaultItins['Goa']).map((item, idx) => `
          <div class="tool-list-row" style="flex-direction:column; align-items:flex-start; gap:6px;">
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
              <strong style="color:#1877f2; font-size:13.5px;"><i class="fa-solid fa-location-dot"></i> Day ${item.day}: ${item.title}</strong>
              <span class="tool-badge tool-badge-green">${item.time}</span>
            </div>
            <p style="margin:0; font-size:12.5px; color:#475569;">${item.desc}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const genBtn = container.querySelector('#genItinBtn');
  if (genBtn) {
    genBtn.addEventListener('click', () => {
      const dest = container.querySelector('#itinDest').value;
      const days = container.querySelector('#itinDays').value;
      const style = container.querySelector('#itinStyle').value;
      window.sutrivaToolState.itinDest = dest;
      window.sutrivaToolState.itinDays = days;
      window.sutrivaToolState.itinStyle = style;
      saveSutrivaToolState();

      showToast(`Generating ${days}-day ${style} plan for ${dest}... ✨`);
      const area = container.querySelector('#itinOutputArea');
      if (area) {
        area.innerHTML = `
          <div style="text-align:center; padding:30px; color:#1877f2;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:28px;"></i>
            <p style="margin-top:10px; font-weight:700;">Curating day-by-day plan for ${dest} (${style})...</p>
          </div>
        `;
      }

      setTimeout(() => {
        renderSmartItinerary(icon, title, subtitle, container);
        showToast(`Smart Itinerary ready for ${dest}! 🎉`);
      }, 600);
    });
  }

  const customForm = container.querySelector('#addCustomActivityForm');
  if (customForm) {
    customForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = container.querySelector('#customActTitle').value.trim();
      const d = container.querySelector('#customActDay').value;
      if (t) {
        const area = container.querySelector('#itinOutputArea');
        if (area) {
          const newRow = document.createElement('div');
          newRow.className = 'tool-list-row';
          newRow.style.cssText = 'flex-direction:column; align-items:flex-start; gap:6px; background:#eff6ff; border-color:#93c5fd;';
          newRow.innerHTML = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
              <strong style="color:#1d4ed8; font-size:13.5px;"><i class="fa-solid fa-star"></i> ${d}: ${t}</strong>
              <span class="tool-badge tool-badge-blue">Custom Item</span>
            </div>
            <p style="margin:0; font-size:12.5px; color:#3b82f6;">Added to your personal itinerary timeline.</p>
          `;
          area.prepend(newRow);
          container.querySelector('#customActTitle').value = '';
          showToast(`Added '${t}' to ${d}! 📍`);
        }
      }
    });
  }
}

// 3. Trip Cost Calculator Engine
function renderTripCostCalculator(icon, title, subtitle, container) {
  icon.className = 'tool-modal-icon icon-blue';
  icon.innerHTML = '<i class="fa-solid fa-calculator"></i>';
  title.textContent = 'Trip Cost Calculator';
  subtitle.textContent = 'Calculate exact cost breakdown & transfer directly to Budget Tracker';

  container.innerHTML = `
    <div class="tool-widget-box">
      <div class="tool-input-row">
        <div class="tool-input-group">
          <label>Travelers Count</label>
          <input type="number" id="calcTravelers" class="tool-input" value="2" min="1" max="20" />
        </div>
        <div class="tool-input-group">
          <label>Duration (Nights)</label>
          <input type="number" id="calcNights" class="tool-input" value="3" min="1" max="30" />
        </div>
      </div>

      <div class="tool-input-row">
        <div class="tool-input-group">
          <label>Flight / Train per Person (₹)</label>
          <input type="number" id="calcFlight" class="tool-input" value="4500" />
        </div>
        <div class="tool-input-group">
          <label>Hotel Cost / Night (₹)</label>
          <input type="number" id="calcHotel" class="tool-input" value="3500" />
        </div>
      </div>

      <div class="tool-input-row">
        <div class="tool-input-group">
          <label>Daily Food / Person (₹)</label>
          <input type="number" id="calcFood" class="tool-input" value="1200" />
        </div>
        <div class="tool-input-group">
          <label>Activities & Buffer / Person (₹)</label>
          <input type="number" id="calcMisc" class="tool-input" value="2000" />
        </div>
      </div>

      <div class="tool-summary-cards">
        <div class="tool-stat-card accent-blue">
          <div class="label">Total Trip Estimate</div>
          <div class="value" id="resTotal">₹0</div>
        </div>
        <div class="tool-stat-card accent-green">
          <div class="label">Per Person Cost</div>
          <div class="value" id="resPerPerson">₹0</div>
        </div>
      </div>

      <!-- Cost Proportion Breakdown Bar -->
      <div>
        <div style="font-size:12px; font-weight:700; color:#475569; margin-bottom:6px;">Cost Breakdown Ratio</div>
        <div style="height:12px; border-radius:8px; overflow:hidden; display:flex; background:#e2e8f0;">
          <div id="barFlight" style="background:#1877f2; width:30%;" title="Flight"></div>
          <div id="barHotel" style="background:#8b5cf6; width:40%;" title="Hotel"></div>
          <div id="barFood" style="background:#f59e0b; width:15%;" title="Food"></div>
          <div id="barMisc" style="background:#10b981; width:15%;" title="Misc"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:#64748b; margin-top:4px;">
          <span>✈️ Transport</span>
          <span>🏨 Stays</span>
          <span>🍲 Dining</span>
          <span>🎟️ Activities</span>
        </div>
      </div>

      <button id="syncToBudgetBtn" class="tool-btn-primary" style="width:100%;">
        <i class="fa-solid fa-wallet"></i> Set as Initial Trip Budget & Open Tracker
      </button>
    </div>
  `;

  let currentGrandTotal = 0;

  function updateCalc() {
    const people = parseInt(container.querySelector('#calcTravelers')?.value) || 1;
    const nights = parseInt(container.querySelector('#calcNights')?.value) || 1;
    const flight = parseFloat(container.querySelector('#calcFlight')?.value) || 0;
    const hotel = parseFloat(container.querySelector('#calcHotel')?.value) || 0;
    const food = parseFloat(container.querySelector('#calcFood')?.value) || 0;
    const misc = parseFloat(container.querySelector('#calcMisc')?.value) || 0;

    const totalFlight = flight * people;
    const totalHotel = hotel * nights;
    const totalFood = food * (nights + 1) * people;
    const totalMisc = misc * people;

    currentGrandTotal = totalFlight + totalHotel + totalFood + totalMisc;
    const perPerson = Math.round(currentGrandTotal / people);

    const resTotal = container.querySelector('#resTotal');
    const resPerPerson = container.querySelector('#resPerPerson');
    if (resTotal) resTotal.textContent = `₹${currentGrandTotal.toLocaleString()}`;
    if (resPerPerson) resPerPerson.textContent = `₹${perPerson.toLocaleString()}`;

    if (currentGrandTotal > 0) {
      const bFlight = container.querySelector('#barFlight');
      const bHotel = container.querySelector('#barHotel');
      const bFood = container.querySelector('#barFood');
      const bMisc = container.querySelector('#barMisc');
      if (bFlight) bFlight.style.width = `${Math.round((totalFlight / currentGrandTotal) * 100)}%`;
      if (bHotel) bHotel.style.width = `${Math.round((totalHotel / currentGrandTotal) * 100)}%`;
      if (bFood) bFood.style.width = `${Math.round((totalFood / currentGrandTotal) * 100)}%`;
      if (bMisc) bMisc.style.width = `${Math.round((totalMisc / currentGrandTotal) * 100)}%`;
    }
  }

  ['calcTravelers', 'calcNights', 'calcFlight', 'calcHotel', 'calcFood', 'calcMisc'].forEach(id => {
    container.querySelector('#' + id)?.addEventListener('input', updateCalc);
  });

  container.querySelector('#syncToBudgetBtn')?.addEventListener('click', () => {
    if (currentGrandTotal > 0) {
      window.sutrivaToolState.budget.total = currentGrandTotal;
      saveSutrivaToolState();
      showToast(`Initial Budget set to ₹${currentGrandTotal.toLocaleString()}! Opening Budget Tracker... 💰`);
      openSutrivaToolModal('budget');
    }
  });

  updateCalc();
}

// 4. EMI Planner Engine
function renderEMIPlanner(icon, title, subtitle, container) {
  icon.className = 'tool-modal-icon icon-orange';
  icon.innerHTML = '<i class="fa-solid fa-credit-card"></i>';
  title.textContent = 'EMI & Travel Loan Planner';
  subtitle.textContent = 'Finance your dream vacation with easy low-cost EMIs';

  container.innerHTML = `
    <div class="tool-widget-box">
      <div class="tool-input-group">
        <label style="display:flex; justify-content:space-between;">
          <span>Trip Amount:</span>
          <strong id="emiAmountVal" style="color:#1877f2; font-size:16px;">₹50,000</strong>
        </label>
        <input type="range" id="emiAmountSlider" min="10000" max="300000" step="5000" value="50000" class="tool-input" style="padding:0; accent-color:#1877f2;" />
      </div>

      <div class="tool-input-row">
        <div class="tool-input-group">
          <label>Tenure (Months)</label>
          <select id="emiMonths" class="tool-select">
            <option value="3">3 Months (No Cost EMI 🎉)</option>
            <option value="6" selected>6 Months (No Cost EMI 🎉)</option>
            <option value="9">9 Months (12% p.a.)</option>
            <option value="12">12 Months (14% p.a.)</option>
            <option value="18">18 Months (15% p.a.)</option>
          </select>
        </div>
        <div class="tool-input-group">
          <label>Down Payment (₹)</label>
          <input type="number" id="emiDown" class="tool-input" value="5000" />
        </div>
      </div>

      <div class="tool-summary-cards">
        <div class="tool-stat-card accent-green">
          <div class="label">Monthly EMI</div>
          <div class="value" id="emiMonthlyVal">₹0 / mo</div>
        </div>
        <div class="tool-stat-card accent-blue">
          <div class="label">Total Payable</div>
          <div class="value" id="emiTotalVal">₹0</div>
        </div>
      </div>

      <!-- Approved Credit Badge -->
      <div id="virtualCardBox" style="background:linear-gradient(135deg, #0f172a, #1e293b); color:#ffffff; padding:16px; border-radius:16px; box-shadow:0 8px 20px rgba(0,0,0,0.15);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-size:11px; font-weight:700; letter-spacing:1px; color:#94a3b8;">SUTRIVA TRAVEL CREDIT</span>
          <i class="fa-brands fa-cc-visa" style="font-size:24px; color:#f59e0b;"></i>
        </div>
        <div style="font-family:monospace; font-size:15px; letter-spacing:2px; margin-bottom:10px;">4532 •••• •••• 9901</div>
        <div style="display:flex; justify-content:space-between; font-size:12px;">
          <span>Pre-Approved Limit: <strong style="color:#10b981;">₹1,50,000</strong></span>
          <span>Zero Processing Fee</span>
        </div>
      </div>

      <button id="applyEmiBtn" class="tool-btn-primary" style="width:100%;">
        <i class="fa-solid fa-bolt"></i> Get Instant 0-Fee Approval & Book
      </button>
    </div>
  `;

  function updateEMI() {
    const principal = parseFloat(document.getElementById('emiAmountSlider').value) || 50000;
    const down = parseFloat(document.getElementById('emiDown').value) || 0;
    const months = parseInt(document.getElementById('emiMonths').value) || 6;

    document.getElementById('emiAmountVal').textContent = `₹${principal.toLocaleString()}`;

    const loanAmount = Math.max(0, principal - down);
    let annualRate = 0;
    if (months === 9) annualRate = 0.12;
    if (months === 12) annualRate = 0.14;
    if (months === 18) annualRate = 0.15;

    let emi = 0;
    if (annualRate === 0) {
      emi = Math.round(loanAmount / months);
    } else {
      const r = annualRate / 12;
      emi = Math.round((loanAmount * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
    }

    const totalPayable = down + (emi * months);

    document.getElementById('emiMonthlyVal').textContent = `₹${emi.toLocaleString()} / mo`;
    document.getElementById('emiTotalVal').textContent = `₹${totalPayable.toLocaleString()}`;
  }

  document.getElementById('emiAmountSlider').addEventListener('input', updateEMI);
  document.getElementById('emiMonths').addEventListener('change', updateEMI);
  document.getElementById('emiDown').addEventListener('input', updateEMI);
  document.getElementById('applyEmiBtn').addEventListener('click', () => {
    showToast('Travel Loan Approved! Virtual Card Limit: ₹1,50,000 🎉');
    closeSutrivaToolModal();
  });

  updateEMI();
}

// 5. Price Alert Engine
function renderPriceAlert(icon, title, subtitle, container) {
  icon.className = 'tool-modal-icon icon-red';
  icon.innerHTML = '<i class="fa-solid fa-bell"></i>';
  title.textContent = 'Price Drop Alerts';
  subtitle.textContent = 'Get notified instantly when flight or hotel prices drop';

  container.innerHTML = `
    <div class="tool-widget-box">
      <form id="newAlertForm" style="background:#f8fafc; padding:14px; border-radius:12px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:10px;">
        <div style="font-weight:700; font-size:13px; color:#1e293b;">+ Create New Route Alert</div>
        <div class="tool-input-row">
          <div class="tool-input-group">
            <input type="text" id="alertRoute" class="tool-input" placeholder="Route (e.g. MAA ➔ GOI)" required />
          </div>
          <div class="tool-input-group" style="max-width:140px;">
            <input type="number" id="alertPrice" class="tool-input" placeholder="Max Price (₹)" required />
          </div>
        </div>
        <button type="submit" class="tool-btn-primary"><i class="fa-solid fa-bell-plus"></i> Set Price Alert</button>
      </form>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="font-weight:700; font-size:14px; color:#1e293b;">Active Alerts (${window.sutrivaToolState.alerts.length})</div>
        <button type="button" id="simCheckPriceBtn" style="background:none; border:none; color:#1877f2; font-size:12px; font-weight:700; cursor:pointer;"><i class="fa-solid fa-arrows-rotate"></i> Check Live Fares</button>
      </div>

      <div class="tool-item-list">
        ${window.sutrivaToolState.alerts.length === 0 ? `
          <div style="text-align:center; padding:20px; color:#94a3b8; font-size:13px;">No active price drop alerts. Create your first route alert above!</div>
        ` : window.sutrivaToolState.alerts.map((al, idx) => `
          <div class="tool-list-row">
            <div>
              <strong style="color:#0f172a; display:block;">${al.route}</strong>
              <span style="font-size:12px; color:#64748b;">Target: <strong style="color:#10b981;">₹${al.target.toLocaleString()}</strong> • Current: ₹${al.current.toLocaleString()}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="tool-badge ${al.active ? 'tool-badge-green' : 'tool-badge-orange'}">${al.active ? 'Active' : 'Paused'}</span>
              <button type="button" class="del-alert-btn" data-idx="${idx}" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('newAlertForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const r = document.getElementById('alertRoute').value.trim();
    const p = parseFloat(document.getElementById('alertPrice').value);
    if (r && p) {
      window.sutrivaToolState.alerts.unshift({ id: Date.now(), route: r, target: p, current: Math.round(p * 1.12), active: true });
      saveSutrivaToolState();
      showToast(`Price Alert set for ${r} at ₹${p.toLocaleString()}! 🔔`);
      renderPriceAlert(icon, title, subtitle, container);
    }
  });

  container.querySelectorAll('.del-alert-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      window.sutrivaToolState.alerts.splice(idx, 1);
      saveSutrivaToolState();
      showToast('Price alert removed.');
      renderPriceAlert(icon, title, subtitle, container);
    });
  });

  document.getElementById('simCheckPriceBtn').addEventListener('click', () => {
    if (window.sutrivaToolState.alerts.length > 0) {
      const randomAlert = window.sutrivaToolState.alerts[0];
      randomAlert.current = Math.max(1000, randomAlert.target - 250);
      saveSutrivaToolState();
      showToast(`🎉 PRICE DROP ALERT! ${randomAlert.route} dropped to ₹${randomAlert.current.toLocaleString()}!`);
      renderPriceAlert(icon, title, subtitle, container);
    } else {
      showToast('Fetching latest live flight prices... All tariffs stable!');
    }
  });
}

// 6. Split Expenses Engine
function renderSplitExpenses(icon, title, subtitle, container) {
  icon.className = 'tool-modal-icon icon-teal';
  icon.innerHTML = '<i class="fa-solid fa-users"></i>';
  title.textContent = 'Group Split Expenses';
  subtitle.textContent = 'Split group costs seamlessly & calculate who owes whom';

  const friends = window.sutrivaToolState.split.friends || ['You', 'Rahul', 'Priya'];
  const expenses = window.sutrivaToolState.split.expenses || [];
  const totalGroupCost = expenses.reduce((sum, item) => sum + item.amount, 0);
  const perFriendShare = Math.round(totalGroupCost / (friends.length || 1));

  // Compute who paid what
  const paidMap = {};
  friends.forEach(f => paidMap[f] = 0);
  expenses.forEach(e => {
    if (!paidMap[e.paidBy]) paidMap[e.paidBy] = 0;
    paidMap[e.paidBy] += e.amount;
  });

  // Calculate settlement balances (Paid - Fair Share)
  const balanceMap = {};
  friends.forEach(f => {
    balanceMap[f] = Math.round((paidMap[f] || 0) - perFriendShare);
  });

  container.innerHTML = `
    <div class="tool-widget-box">
      <div class="tool-summary-cards">
        <div class="tool-stat-card accent-blue">
          <div class="label">Group Total</div>
          <div class="value">₹${totalGroupCost.toLocaleString()}</div>
        </div>
        <div class="tool-stat-card accent-purple">
          <div class="label">Share / Person</div>
          <div class="value">₹${perFriendShare.toLocaleString()}</div>
        </div>
      </div>

      <!-- Add Friend Manager Row -->
      <div style="display:flex; justify-content:space-between; align-items:center; background:#f1f5f9; padding:10px 14px; border-radius:12px;">
        <span style="font-size:12px; font-weight:700; color:#475569;">Group Buddies (${friends.length}):</span>
        <form id="addFriendForm" style="display:flex; gap:6px;">
          <input type="text" id="newFriendName" class="tool-input" placeholder="+ Name" style="width:110px; padding:6px 10px; font-size:12px;" required />
          <button type="submit" class="tool-btn-primary" style="padding:6px 10px; font-size:11px;">Add</button>
        </form>
      </div>

      <!-- Who Owes Whom Summary Card -->
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:12px; padding:14px;">
        <div style="font-weight:700; font-size:13px; color:#0f172a; margin-bottom:8px;"><i class="fa-solid fa-scale-balanced" style="color:#1877f2;"></i> Settlement Balances</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${friends.map(f => {
            const bal = balanceMap[f];
            let text = `${f} is all settled up 👍`;
            let color = '#64748b';
            if (bal > 0) { text = `${f} gets back ₹${bal.toLocaleString()}`; color = '#10b981'; }
            if (bal < 0) { text = `${f} owes ₹${Math.abs(bal).toLocaleString()}`; color = '#ef4444'; }
            return `
              <div style="display:flex; justify-content:space-between; font-size:12.5px;">
                <strong style="color:#334155;">${f}</strong>
                <span style="font-weight:700; color:${color};">${text}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <form id="addSplitForm" style="background:#f8fafc; padding:14px; border-radius:12px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:10px;">
        <div style="font-weight:700; font-size:13px; color:#1e293b;">+ Log Group Bill</div>
        <div class="tool-input-row">
          <div class="tool-input-group">
            <input type="text" id="splitTitle" class="tool-input" placeholder="Title (e.g. Dinner at Shack)" required />
          </div>
          <div class="tool-input-group" style="max-width:130px;">
            <input type="number" id="splitAmount" class="tool-input" placeholder="Amount (₹)" required />
          </div>
        </div>
        <div class="tool-input-row">
          <div class="tool-input-group">
            <select id="splitPaidBy" class="tool-select">
              ${friends.map(f => `<option value="${f}">Paid by ${f}</option>`).join('')}
            </select>
          </div>
          <button type="submit" class="tool-btn-primary"><i class="fa-solid fa-hand-holding-dollar"></i> Add Bill</button>
        </div>
      </form>

      <div>
        <div style="font-weight:700; font-size:14px; margin-bottom:10px; color:#1e293b;">Shared Bills History</div>
        <div class="tool-item-list">
          ${expenses.map((exp) => `
            <div class="tool-list-row">
              <div>
                <strong style="color:#0f172a;">${exp.title}</strong>
                <span style="display:block; font-size:12px; color:#64748b;">Paid by <strong>${exp.paidBy}</strong></span>
              </div>
              <strong style="color:#10b981;">₹${exp.amount.toLocaleString()}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.getElementById('addFriendForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newFriendName').value.trim();
    if (name && !friends.includes(name)) {
      friends.push(name);
      saveSutrivaToolState();
      showToast(`Added ${name} to group! 👥`);
      renderSplitExpenses(icon, title, subtitle, container);
    }
  });

  document.getElementById('addSplitForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = document.getElementById('splitTitle').value.trim();
    const a = parseFloat(document.getElementById('splitAmount').value);
    const p = document.getElementById('splitPaidBy').value;
    if (t && a) {
      window.sutrivaToolState.split.expenses.unshift({ id: Date.now(), title: t, paidBy: p, amount: a });
      saveSutrivaToolState();
      showToast(`Logged ₹${a.toLocaleString()} bill paid by ${p}`);
      renderSplitExpenses(icon, title, subtitle, container);
    }
  });
}

// 7. Packing Checklist Engine
function renderPackingChecklist(icon, title, subtitle, container) {
  icon.className = 'tool-modal-icon icon-amber';
  icon.innerHTML = '<i class="fa-solid fa-clipboard-check"></i>';
  title.textContent = 'Smart Packing Checklist';
  subtitle.textContent = 'Never forget your essential travel items again';

  const list = window.sutrivaToolState.checklist || [];
  const total = list.length;
  const done = list.filter(i => i.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  container.innerHTML = `
    <div class="tool-widget-box">
      <div>
        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">
          <span>Packing Progress</span>
          <span style="color:#10b981;">${done} / ${total} Packed (${pct}%)</span>
        </div>
        <div class="tool-progress-bg">
          <div class="tool-progress-fill" style="width: ${pct}%; background-color: #10b981;"></div>
        </div>
      </div>

      <!-- Quick Preset Buttons -->
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button type="button" class="preset-pack-btn" data-preset="beach" style="padding:4px 10px; border-radius:15px; border:1px solid #cbd5e1; background:#fff; font-size:12px; cursor:pointer;">🏖️ Beach Pack</button>
        <button type="button" class="preset-pack-btn" data-preset="mountain" style="padding:4px 10px; border-radius:15px; border:1px solid #cbd5e1; background:#fff; font-size:12px; cursor:pointer;">🏔️ Mountain Pack</button>
        <button type="button" class="preset-pack-btn" data-preset="business" style="padding:4px 10px; border-radius:15px; border:1px solid #cbd5e1; background:#fff; font-size:12px; cursor:pointer;">💼 Business Pack</button>
      </div>

      <form id="addChecklistForm" style="display:flex; gap:10px;">
        <input type="text" id="checkItemText" class="tool-input" placeholder="+ Add item to pack..." required />
        <button type="submit" class="tool-btn-primary"><i class="fa-solid fa-plus"></i> Add Item</button>
      </form>

      <div class="tool-item-list">
        ${list.map((item, idx) => `
          <div class="tool-list-row ${item.done ? 'completed' : ''}" style="cursor:pointer;" data-idx="${idx}">
            <div style="display:flex; align-items:center; gap:12px;">
              <input type="checkbox" ${item.done ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;" />
              <span style="font-weight:600; color:#1e293b;">${item.text}</span>
            </div>
            <span class="tool-badge tool-badge-blue">${item.cat}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.tool-list-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const idx = parseInt(row.getAttribute('data-idx'));
      window.sutrivaToolState.checklist[idx].done = !window.sutrivaToolState.checklist[idx].done;
      saveSutrivaToolState();
      renderPackingChecklist(icon, title, subtitle, container);
    });
  });

  document.getElementById('addChecklistForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = document.getElementById('checkItemText').value.trim();
    if (txt) {
      window.sutrivaToolState.checklist.unshift({ id: Date.now(), text: txt, cat: 'Custom', done: false });
      saveSutrivaToolState();
      showToast(`Added '${txt}' to packing list! 🎒`);
      renderPackingChecklist(icon, title, subtitle, container);
    }
  });

  container.querySelectorAll('.preset-pack-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-preset');
      const presets = {
        beach: [{ text: 'Swimsuit & Trunks', cat: 'Clothes', done: false }, { text: 'Waterproof Phone Pouch', cat: 'Tech', done: false }, { text: 'Flip Flops & Sunscreen', cat: 'Toiletries', done: false }],
        mountain: [{ text: 'Heavy Thermal Jacket', cat: 'Clothes', done: false }, { text: 'Trekking Shoes', cat: 'Essentials', done: false }, { text: 'Lip Balm & Cold Cream', cat: 'Toiletries', done: false }],
        business: [{ text: 'Formal Blazer & Shirts', cat: 'Clothes', done: false }, { text: 'Laptop & HDMI Adapter', cat: 'Tech', done: false }, { text: 'Business Cards', cat: 'Essentials', done: false }]
      };
      if (presets[p]) {
        presets[p].forEach(item => window.sutrivaToolState.checklist.unshift({ id: Date.now() + Math.random(), ...item }));
        saveSutrivaToolState();
        showToast(`Loaded ${p.toUpperCase()} packing template! 🧳`);
        renderPackingChecklist(icon, title, subtitle, container);
      }
    });
  });
}

// 8. Travel Documents Engine
function renderTravelDocuments(icon, title, subtitle, container) {
  icon.className = 'tool-modal-icon icon-purple';
  icon.innerHTML = '<i class="fa-solid fa-folder-open"></i>';
  title.textContent = 'Travel Document Vault';
  subtitle.textContent = 'Keep your passports, tickets & vouchers safe & accessible';

  const docs = window.sutrivaToolState.docs || [];

  container.innerHTML = `
    <div class="tool-widget-box">
      <!-- Add Document Form -->
      <form id="addDocForm" style="background:#f8fafc; border:1px solid #e2e8f0; padding:14px; border-radius:14px; display:flex; flex-direction:column; gap:10px;">
        <div style="font-weight:700; font-size:13px; color:#0f172a;">+ Upload New Document Entry</div>
        <div class="tool-input-row">
          <input type="text" id="docName" class="tool-input" placeholder="Document Title (e.g. Driving License)" required />
          <select id="docType" class="tool-select" style="width:140px;">
            <option value="ID Card">🪪 ID Card</option>
            <option value="PDF Ticket">✈️ E-Ticket PDF</option>
            <option value="Hotel Voucher">🏨 Hotel Voucher</option>
            <option value="Passport">🛂 Passport</option>
          </select>
        </div>
        <button type="submit" class="tool-btn-primary"><i class="fa-solid fa-cloud-arrow-up"></i> Save to Vault</button>
      </form>

      <div class="tool-item-list">
        ${docs.map((doc, idx) => `
          <div class="tool-list-row">
            <div style="display:flex; align-items:center; gap:12px;">
              <i class="fa-solid fa-file-pdf" style="font-size:24px; color:#ef4444;"></i>
              <div>
                <strong style="color:#0f172a; display:block;">${doc.name}</strong>
                <span style="font-size:12px; color:#64748b;">${doc.type} • ${doc.date}</span>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="tool-badge tool-badge-green">${doc.status}</span>
              <button type="button" class="del-doc-btn" data-idx="${idx}" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Delete doc"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('addDocForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('docName').value.trim();
    const type = document.getElementById('docType').value;
    if (name) {
      window.sutrivaToolState.docs.unshift({
        id: Date.now(),
        name: name,
        type: type,
        status: 'Verified 🟢',
        date: new Date().toLocaleDateString()
      });
      saveSutrivaToolState();
      showToast(`Document '${name}' saved securely! 📄`);
      renderTravelDocuments(icon, title, subtitle, container);
    }
  });

  container.querySelectorAll('.del-doc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      window.sutrivaToolState.docs.splice(idx, 1);
      saveSutrivaToolState();
      showToast('Document removed.');
      renderTravelDocuments(icon, title, subtitle, container);
    });
  });
}

// 9. Live Trip Tracker Engine
function renderLiveTripTracker(icon, title, subtitle, container) {
  icon.className = 'tool-modal-icon icon-emerald';
  icon.innerHTML = '<i class="fa-solid fa-location-dot"></i>';
  title.textContent = 'Live Flight & Trip Status';
  subtitle.textContent = 'Track real-time flight position, gate & arrival details';

  const presetFlights = {
    '6E-204': { flight: 'IndiGo 6E-204', route: 'Chennai (MAA) ➔ Goa (GOI)', plane: 'Airbus A320neo', status: 'On Time 🟢', dep: '09:15 AM', arr: '10:45 AM', gate: 'T2 • Gate 14', belt: 'Belt 03', weather: '28°C Sunny ☀️', alt: '32,000 ft', pct: 68 },
    'AI-805': { flight: 'Air India AI-805', route: 'Delhi (DEL) ➔ Mumbai (BOM)', plane: 'Boeing 787 Dreamliner', status: 'In Air ✈️', dep: '11:00 AM', arr: '01:10 PM', gate: 'T3 • Gate 22', belt: 'Belt 06', weather: '31°C Humid 🌤️', alt: '38,000 ft', pct: 85 },
    'UK-812': { flight: 'Vistara UK-812', route: 'Bangalore (BLR) ➔ Delhi (DEL)', plane: 'Airbus A321neo', status: 'Boarding 🚶', dep: '02:30 PM', arr: '05:15 PM', gate: 'T1 • Gate 08', belt: 'Belt 01', weather: '25°C Pleasant ☁️', alt: '0 ft (Taxi)', pct: 15 }
  };

  let activeCode = window.activeFlightCode || '6E-204';
  let flightInfo = presetFlights[activeCode] || presetFlights['6E-204'];

  container.innerHTML = `
    <div class="tool-widget-box">
      <div class="tool-input-row">
        <input type="text" id="pnrQuery" class="tool-input" value="${flightInfo.flight}" placeholder="Enter PNR or Flight #" />
        <button id="trackPnrBtn" class="tool-btn-primary"><i class="fa-solid fa-magnifying-glass"></i> Track</button>
      </div>

      <!-- Quick Preset Flight Chips -->
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button type="button" class="flight-chip-btn" data-code="6E-204" style="padding:4px 10px; border-radius:15px; border:1px solid #cbd5e1; background:#fff; font-size:12px; cursor:pointer;">✈️ 6E-204 (Goa)</button>
        <button type="button" class="flight-chip-btn" data-code="AI-805" style="padding:4px 10px; border-radius:15px; border:1px solid #cbd5e1; background:#fff; font-size:12px; cursor:pointer;">✈️ AI-805 (Mumbai)</button>
        <button type="button" class="flight-chip-btn" data-code="UK-812" style="padding:4px 10px; border-radius:15px; border:1px solid #cbd5e1; background:#fff; font-size:12px; cursor:pointer;">✈️ UK-812 (Delhi)</button>
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <strong style="font-size:16px; color:#0f172a;">${flightInfo.flight}</strong>
            <span style="display:block; font-size:12px; color:#64748b;">${flightInfo.route} • ${flightInfo.plane}</span>
          </div>
          <span class="tool-badge tool-badge-green">${flightInfo.status}</span>
        </div>

        <div class="tool-progress-bg" style="margin-bottom:10px;">
          <div class="tool-progress-fill" style="width: ${flightInfo.pct}%; background: linear-gradient(90deg, #10b981, #1877f2);"></div>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; font-weight:600;">
          <span>Dep (${flightInfo.dep})</span>
          <span>Alt: ${flightInfo.alt}</span>
          <span>Arr (${flightInfo.arr})</span>
        </div>
      </div>

      <div class="tool-summary-cards">
        <div class="tool-stat-card accent-blue">
          <div class="label">Terminal & Gate</div>
          <div class="value">${flightInfo.gate}</div>
        </div>
        <div class="tool-stat-card accent-purple">
          <div class="label">Baggage Belt</div>
          <div class="value">${flightInfo.belt}</div>
        </div>
        <div class="tool-stat-card accent-green">
          <div class="label">Destination Weather</div>
          <div class="value">${flightInfo.weather}</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('trackPnrBtn').addEventListener('click', () => {
    const q = document.getElementById('pnrQuery').value.trim();
    showToast(`Fetching live telemetry for ${q}... Status: ${flightInfo.status} ✈️`);
  });

  container.querySelectorAll('.flight-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.activeFlightCode = btn.getAttribute('data-code');
      renderLiveTripTracker(icon, title, subtitle, container);
    });
  });
}

// 10. AI Trip Planner Engine
function renderAITripPlanner(icon, title, subtitle, container) {
  icon.className = 'tool-modal-icon icon-violet';
  icon.innerHTML = '<i class="fa-solid fa-microchip"></i>';
  title.textContent = 'AI Travel Assistant';
  subtitle.textContent = 'Ask Sutriva AI to curate custom itineraries & travel tips';

  container.innerHTML = `
    <div class="tool-widget-box">
      <div class="tool-input-group">
        <textarea id="aiPromptInput" class="tool-textarea" rows="3" placeholder="Ask AI: e.g. 'Plan a 3-day romantic trip to Kerala backwaters under ₹25,000 for 2 adults'"></textarea>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="ai-chip-btn" data-p="3-day Goa Beach Party trip under ₹15,000" style="padding:4px 10px; border-radius:15px; border:1px solid #cbd5e1; background:#fff; font-size:12px; cursor:pointer;">🏝️ Goa Party</button>
        <button class="ai-chip-btn" data-p="5-day Manali snow adventure trip" style="padding:4px 10px; border-radius:15px; border:1px solid #cbd5e1; background:#fff; font-size:12px; cursor:pointer;">🏔️ Manali Snow</button>
        <button class="ai-chip-btn" data-p="Budget Temple Tour in Tamil Nadu" style="padding:4px 10px; border-radius:15px; border:1px solid #cbd5e1; background:#fff; font-size:12px; cursor:pointer;">🛕 TN Temples</button>
      </div>

      <button id="runAiPromptBtn" class="tool-btn-primary" style="width:100%;">
        <i class="fa-solid fa-robot"></i> Generate AI Trip Plan
      </button>

      <div id="aiResponseCard" style="display:none; background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:16px;">
        <strong style="color:#8b5cf6; display:flex; align-items:center; gap:6px; margin-bottom:8px;">
          <i class="fa-solid fa-sparkles"></i> Sutriva AI Curated Plan:
        </strong>
        <div id="aiResponseText" style="font-size:13px; color:#334155; line-height:1.6;"></div>
      </div>
    </div>
  `;

  container.querySelectorAll('.ai-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('aiPromptInput').value = btn.getAttribute('data-p');
    });
  });

  document.getElementById('runAiPromptBtn').addEventListener('click', () => {
    const prompt = document.getElementById('aiPromptInput').value.trim() || 'Custom trip plan';
    const card = document.getElementById('aiResponseCard');
    const txt = document.getElementById('aiResponseText');

    card.style.display = 'block';
    txt.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sutriva AI is analyzing "${prompt}" & matching top deals...`;

    setTimeout(() => {
      txt.innerHTML = `
        <p style="margin:0 0 8px 0;"><strong>Destination Plan for "${prompt}":</strong> Custom AI Curated Itinerary with verified hotels & local secret spots.</p>
        <ul style="margin:0; padding-left:18px;">
          <li><strong>Day 1:</strong> Scenic Check-in ➔ Sunset Cafe Walk ➔ Local Culinary Specialities</li>
          <li><strong>Day 2:</strong> Guided Heritage Tour ➔ Photography Spots ➔ Evening Night Market</li>
          <li><strong>Day 3:</strong> Souvenir Shopping ➔ Relaxed Breakfast ➔ Airport / Station Transfer</li>
        </ul>
        <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <span style="font-weight:700; color:#10b981;">Est. Budget: ₹12,500 / person • Rating: 4.9 ★</span>
          <button type="button" id="aiToItinBtn" style="background:#8b5cf6; color:#fff; border:none; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12px; cursor:pointer;"><i class="fa-solid fa-calendar-plus"></i> Open Smart Itinerary</button>
        </div>
      `;
      showToast('AI Plan generated successfully! 🤖✨');
      const itinBtn = document.getElementById('aiToItinBtn');
      if (itinBtn) {
        itinBtn.addEventListener('click', () => {
          openSutrivaToolModal('itinerary');
        });
      }
    }, 650);
  });
}

// 11. Interactive Map & Route Explorer Engine
function renderInteractiveMap(icon, title, subtitle, container) {
  icon.className = 'tool-modal-icon icon-blue';
  icon.innerHTML = '<i class="fa-solid fa-map-location-dot"></i>';
  title.textContent = 'Interactive Destination & Route Map';
  subtitle.textContent = 'Explore tourist hotspots, calculate routes, distance & live GPS directions';

  const destinations = [
    {
      id: 'goa',
      name: 'Goa (Baga & Calangute)',
      category: 'beach',
      lat: 15.5439,
      lng: 73.7553,
      tag: 'Beaches & Nightlife',
      rating: 4.8,
      reviews: 1420,
      season: 'Nov - Feb (Peak)',
      temp: '29°C Sunny ☀️',
      avgCost: '₹12,500 / 3 days',
      spots: ['Baga Beach Water Sports', 'Aguada Fort Sunset', 'Tito\'s Lane & Nightclub', 'Anjuna Flea Market'],
      desc: 'Golden sun-kissed beaches, thrilling jet skiing, Portuguese heritage architecture, beach shacks and vibrant seaside cafes.',
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=73.70%2C15.48%2C73.80%2C15.58&layer=mapnik&marker=15.5439%2C73.7553'
    },
    {
      id: 'manali',
      name: 'Manali & Solang Valley',
      category: 'hills',
      lat: 32.2396,
      lng: 77.1887,
      tag: 'Snow & Adventure',
      rating: 4.9,
      reviews: 2180,
      season: 'Oct - Jun',
      temp: '12°C Chilly ❄️',
      avgCost: '₹16,000 / 4 days',
      spots: ['Solang Valley Paragliding', 'Atal Tunnel Drive', 'Old Manali Cafes', 'Jogini Waterfall Trek'],
      desc: 'Snow-capped Himalayan peaks, exhilarating river rafting, Atal Tunnel scenic drive, Rohtang Pass glaciers and cedar pine trails.',
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=77.13%2C32.20%2C77.23%2C32.28&layer=mapnik&marker=32.2396%2C77.1887'
    },
    {
      id: 'ooty',
      name: 'Ooty & Nilgiri Hills',
      category: 'hills',
      lat: 11.4102,
      lng: 76.6950,
      tag: 'Tea Gardens & Lakes',
      rating: 4.7,
      reviews: 1850,
      season: 'All Year',
      temp: '17°C Pleasant 🍃',
      avgCost: '₹9,800 / 3 days',
      spots: ['Nilgiri Toy Train (UNESCO)', 'Ooty Botanical Garden', 'Doddabetta Peak View', 'Pykara Lake Boating'],
      desc: 'Queen of Hill Stations featuring lush rolling tea gardens, eucalyptus mist, historic mountain railways and serene boat rides.',
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=76.65%2C11.37%2C76.75%2C11.45&layer=mapnik&marker=11.4102%2C76.6950'
    },
    {
      id: 'ladakh',
      name: 'Leh - Ladakh',
      category: 'adventure',
      lat: 34.1526,
      lng: 77.5771,
      tag: 'High Altitude Lakes',
      rating: 4.9,
      reviews: 980,
      season: 'May - Sep',
      temp: '9°C Crisp 🏔️',
      avgCost: '₹28,000 / 6 days',
      spots: ['Pangong Tso Blue Lake', 'Khardung La (17,982 ft)', 'Nubra Valley Sand Dunes', 'Magnetic Hill'],
      desc: 'Dramatic high altitude passes, crystal azure blue waters of Pangong Lake, double-humped camel safaris and ancient gompas.',
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=77.52%2C34.10%2C77.62%2C34.20&layer=mapnik&marker=34.1526%2C77.5771'
    },
    {
      id: 'kerala',
      name: 'Munnar & Alleppey Backwaters',
      category: 'nature',
      lat: 10.0889,
      lng: 77.0595,
      tag: 'Houseboats & Hills',
      rating: 4.8,
      reviews: 1650,
      season: 'Sep - Mar',
      temp: '22°C Misty 🌿',
      avgCost: '₹14,500 / 4 days',
      spots: ['Luxury Houseboat Cruise', 'Tea Museum Munnar', 'Eravikulam Tahr Sanctuary', 'Varkala Cliff Beach'],
      desc: 'God\'s Own Country offering traditional houseboat cruises along emerald canals, spice plantations and Ayurvedic wellness.',
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=76.98%2C10.02%2C77.12%2C10.15&layer=mapnik&marker=10.0889%2C77.0595'
    },
    {
      id: 'jaipur',
      name: 'Jaipur & Udaipur (Rajasthan)',
      category: 'heritage',
      lat: 26.9124,
      lng: 75.7873,
      tag: 'Royal Forts & Palaces',
      rating: 4.8,
      reviews: 2300,
      season: 'Oct - Mar',
      temp: '26°C Warm 🏰',
      avgCost: '₹15,000 / 4 days',
      spots: ['Hawa Mahal Palace of Winds', 'Amer Fort Elephant Ride', 'Lake Pichola Sunset Boat', 'City Palace & Museums'],
      desc: 'Majestic Rajput royal architecture, hilltop desert fortresses, colorful textile bazaars and exquisite lakeside palaces.',
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=75.74%2C26.86%2C75.86%2C26.96&layer=mapnik&marker=26.9124%2C75.7873'
    }
  ];

  const distances = {
    'Chennai': { 'goa': { km: 920, flight: '1h 45m', train: '18h', drive: '16h' }, 'manali': { km: 2600, flight: '4h 30m', train: '40h', drive: '42h' }, 'ooty': { km: 550, flight: '1h 10m to CJB', train: '9h', drive: '9h 30m' }, 'ladakh': { km: 3100, flight: '5h 15m', train: 'N/A', drive: '52h' }, 'kerala': { km: 580, flight: '1h 15m', train: '10h', drive: '10h' }, 'jaipur': { km: 2100, flight: '2h 45m', train: '34h', drive: '36h' } },
    'Bangalore': { 'goa': { km: 560, flight: '1h 15m', train: '14h', drive: '10h' }, 'manali': { km: 2500, flight: '4h 15m', train: '38h', drive: '40h' }, 'ooty': { km: 275, flight: 'N/A (Drive)', train: '6h', drive: '5h 30m' }, 'ladakh': { km: 3000, flight: '5h 00m', train: 'N/A', drive: '50h' }, 'kerala': { km: 460, flight: '1h 05m', train: '8h', drive: '8h' }, 'jaipur': { km: 1980, flight: '2h 30m', train: '32h', drive: '33h' } },
    'Mumbai': { 'goa': { km: 590, flight: '1h 10m', train: '8h', drive: '11h' }, 'manali': { km: 1920, flight: '3h 30m', train: '30h', drive: '32h' }, 'ooty': { km: 1200, flight: '2h 00m', train: '22h', drive: '20h' }, 'ladakh': { km: 2450, flight: '4h 15m', train: 'N/A', drive: '42h' }, 'kerala': { km: 1350, flight: '2h 00m', train: '24h', drive: '22h' }, 'jaipur': { km: 1150, flight: '1h 45m', train: '16h', drive: '18h' } },
    'Delhi': { 'goa': { km: 1850, flight: '2h 30m', train: '26h', drive: '28h' }, 'manali': { km: 530, flight: '1h 15m', train: 'Overnight Volvo', drive: '11h' }, 'ooty': { km: 2400, flight: '3h 15m', train: '36h', drive: '38h' }, 'ladakh': { km: 980, flight: '1h 25m', train: 'N/A', drive: '22h' }, 'kerala': { km: 2600, flight: '3h 20m', train: '40h', drive: '44h' }, 'jaipur': { km: 280, flight: '55m', train: '4h 30m', drive: '4h 45m' } }
  };

  let activeDestId = window.activeMapDestId || 'goa';
  let activeDest = destinations.find(d => d.id === activeDestId) || destinations[0];
  let originCity = window.activeMapOrigin || 'Chennai';
  let routeData = (distances[originCity] && distances[originCity][activeDest.id]) || { km: 850, flight: '2h', train: '16h', drive: '14h' };

  container.innerHTML = `
    <div class="tool-widget-box">
      
      <!-- Top Destination Preset Badges & Filter -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          ${destinations.map(d => `
            <button type="button" class="dest-chip-btn ${d.id === activeDest.id ? 'active' : ''}" data-id="${d.id}" style="padding:6px 12px; border-radius:20px; border:1px solid ${d.id === activeDest.id ? '#1877f2' : '#cbd5e1'}; background:${d.id === activeDest.id ? '#1877f2' : '#ffffff'}; color:${d.id === activeDest.id ? '#ffffff' : '#334155'}; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.2s;">
              ${d.name.split(' ')[0]} ${d.category === 'beach' ? '🏖️' : d.category === 'hills' ? '🏔️' : d.category === 'adventure' ? '🧗' : '🏰'}
            </button>
          `).join('')}
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeDest.name)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; background:#eff6ff; color:#1877f2; border:1px solid #bfdbfe; border-radius:10px; font-size:12px; font-weight:700; text-decoration:none;">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open in Google Maps
          </a>
        </div>
      </div>

      <!-- Main Interactive Map + Overview Container -->
      <div style="display:grid; grid-template-columns: 1.4fr 1fr; gap:16px;" class="map-view-grid">
        
        <!-- Left: Live Interactive Map Frame -->
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(15,23,42,0.06); position:relative;">
          <div style="padding:10px 14px; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:700; color:#334155;"><i class="fa-solid fa-crosshairs" style="color:#1877f2;"></i> Pinpoint: ${activeDest.name}</span>
            <span style="font-size:11px; color:#64748b; font-weight:600;">Lat: ${activeDest.lat.toFixed(2)}, Lng: ${activeDest.lng.toFixed(2)}</span>
          </div>
          <iframe 
            id="sutrivaMapFrame"
            width="100%" 
            height="340" 
            style="border:none; display:block;" 
            src="${activeDest.embedUrl}">
          </iframe>
          <div style="padding:10px 14px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; font-size:12px;">
            <span style="color:#64748b;"><i class="fa-solid fa-cloud-sun"></i> Live Weather: <strong style="color:#0f172a;">${activeDest.temp}</strong></span>
            <span style="color:#64748b;"><i class="fa-solid fa-calendar-check"></i> Best Time: <strong style="color:#10b981;">${activeDest.season}</strong></span>
          </div>
        </div>

        <!-- Right: Destination Details & Key Hotspots -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:16px; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
              <div>
                <span style="display:inline-block; padding:2px 8px; background:#e0f2fe; color:#0369a1; border-radius:6px; font-size:11px; font-weight:700; margin-bottom:4px;">${activeDest.tag}</span>
                <h4 style="font-size:17px; font-weight:800; color:#0f172a; margin:0;">${activeDest.name}</h4>
              </div>
              <div style="text-align:right;">
                <span style="color:#eab308; font-weight:800; font-size:14px;"><i class="fa-solid fa-star"></i> ${activeDest.rating}</span>
                <div style="font-size:11px; color:#64748b;">(${activeDest.reviews} reviews)</div>
              </div>
            </div>

            <p style="font-size:12px; color:#475569; line-height:1.5; margin:8px 0 12px 0;">${activeDest.desc}</p>

            <strong style="font-size:12px; color:#1e293b; display:block; margin-bottom:6px;"><i class="fa-solid fa-location-dot" style="color:#ef4444;"></i> Must-Visit Hotspots:</strong>
            <ul style="margin:0; padding-left:18px; font-size:12px; color:#334155; line-height:1.6;">
              ${activeDest.spots.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-top:14px; padding-top:12px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              <span style="font-size:11px; color:#64748b; display:block;">Est. Budget</span>
              <strong style="font-size:14px; color:#10b981;">${activeDest.avgCost}</strong>
            </div>
            <button type="button" id="addMapToItinBtn" style="background:#1877f2; color:#fff; border:none; padding:8px 14px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer;">
              <i class="fa-solid fa-calendar-plus"></i> Add to Itinerary
            </button>
          </div>
        </div>

      </div>

      <!-- Route & Distance Calculator -->
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:16px; box-shadow:0 2px 8px rgba(15,23,42,0.04);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
          <div>
            <strong style="font-size:14px; color:#0f172a;"><i class="fa-solid fa-route" style="color:#1877f2;"></i> Route & Travel Time Calculator</strong>
            <div style="font-size:12px; color:#64748b;">Compare flight, train and road travel duration from your city</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <label for="routeOriginSelect" style="font-size:12px; font-weight:700; color:#334155;">From:</label>
            <select id="routeOriginSelect" class="tool-select" style="padding:6px 10px; border-radius:8px; border:1px solid #cbd5e1; font-size:12px; font-weight:600;">
              ${Object.keys(distances).map(c => `<option value="${c}" ${c === originCity ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <span style="font-size:12px; color:#64748b; font-weight:700;">➔</span>
            <span style="padding:6px 12px; background:#f1f5f9; border-radius:8px; font-size:12px; font-weight:700; color:#0f172a;">${activeDest.name.split(' ')[0]}</span>
          </div>
        </div>

        <div class="tool-summary-cards">
          <div class="tool-stat-card accent-blue">
            <div class="label">Distance</div>
            <div class="value">~${routeData.km} km</div>
          </div>
          <div class="tool-stat-card accent-purple">
            <div class="label"><i class="fa-solid fa-plane"></i> Flight Time</div>
            <div class="value">${routeData.flight}</div>
          </div>
          <div class="tool-stat-card accent-green">
            <div class="label"><i class="fa-solid fa-train"></i> Train Time</div>
            <div class="value">${routeData.train}</div>
          </div>
          <div class="tool-stat-card accent-orange">
            <div class="label"><i class="fa-solid fa-car"></i> Road Drive</div>
            <div class="value">${routeData.drive}</div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Attach event listeners for chips
  container.querySelectorAll('.dest-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.activeMapDestId = btn.getAttribute('data-id');
      renderInteractiveMap(icon, title, subtitle, container);
    });
  });

  // Attach event listener for origin selector
  const originSelect = document.getElementById('routeOriginSelect');
  if (originSelect) {
    originSelect.addEventListener('change', (e) => {
      window.activeMapOrigin = e.target.value;
      renderInteractiveMap(icon, title, subtitle, container);
    });
  }

  // Add to Itinerary button
  const addBtn = document.getElementById('addMapToItinBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (typeof showToast === 'function') {
        showToast(`Added ${activeDest.name} to your travel itinerary! 📍🗺️`);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {

  // --- Device Switcher Logic ---

  const deviceButtons = document.querySelectorAll('.device-btn');
  const body = document.body;

  deviceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      deviceButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const device = btn.dataset.device;
      body.classList.remove('desktop-mode', 'tablet-mode', 'mobile-mode');
      body.classList.add(`${device}-mode`);

      showToast(`Switched view to ${device.toUpperCase()} mode`);
    });
  });

  // --- Theme Toggle Logic ---
  const themeToggle = document.getElementById('themeToggle');
  let isDark = false;

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      isDark = !isDark;
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        showToast('Dark mode enabled');
      } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        showToast('Light mode enabled');
      }
    });
  }

  // --- Mobile Drawer Navigation ---
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeDrawer = document.getElementById('closeDrawer');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');

  function openDrawerMenu() {
    mobileDrawer.classList.add('open');
    drawerOverlay.classList.add('open');
  }

  function closeDrawerMenu() {
    mobileDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openDrawerMenu);
  if (closeDrawer) closeDrawer.addEventListener('click', closeDrawerMenu);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawerMenu);

  // --- Dynamic Transport Mode UI Configuration ---
  const modeConfigMap = {
    'flight': {
      icon: 'fa-plane',
      departIcon: 'fa-plane-departure',
      departLabel: 'Flight Departure',
      returnIcon: 'fa-plane-arrival',
      returnLabel: 'Flight Return'
    },
    'train': {
      icon: 'fa-train',
      departIcon: 'fa-train',
      departLabel: 'Train Departure',
      returnIcon: 'fa-train-subway',
      returnLabel: 'Return Train'
    },
    'bus': {
      icon: 'fa-bus',
      departIcon: 'fa-bus-simple',
      departLabel: 'Bus Departure',
      returnIcon: 'fa-bus',
      returnLabel: 'Return Bus'
    },
    'car': {
      icon: 'fa-car',
      departIcon: 'fa-car-side',
      departLabel: 'Pickup Date',
      returnIcon: 'fa-car',
      returnLabel: 'Drop-off Date'
    },
    'cruise': {
      icon: 'fa-ship',
      departIcon: 'fa-ship',
      departLabel: 'Sailing Date',
      returnIcon: 'fa-anchor',
      returnLabel: 'Return Voyage'
    }
  };

  function updateTransportModeUI(modeName) {
    if (!modeName) return;
    const key = modeName.toLowerCase();
    
    let config = modeConfigMap['flight'];
    for (let k in modeConfigMap) {
      if (key.includes(k)) {
        config = modeConfigMap[k];
        break;
      }
    }

    // 1. Update Date Picker Icons & Text Labels
    const departDateIcon = document.getElementById('departDateIcon');
    const departDateText = document.getElementById('departDateText');
    const returnDateIcon = document.getElementById('returnDateIcon');
    const returnDateText = document.getElementById('returnDateText');

    if (departDateIcon) departDateIcon.className = `fa-solid ${config.departIcon}`;
    if (departDateText) departDateText.textContent = config.departLabel;
    if (returnDateIcon) returnDateIcon.className = `fa-solid ${config.returnIcon}`;
    if (returnDateText) returnDateText.textContent = config.returnLabel;

    // 2. Update Search Bar Mode Group Icon & Value
    const modeInputIcon = document.getElementById('modeInputIcon');
    const modeInput = document.getElementById('modeInput');
    if (modeInputIcon) modeInputIcon.className = `fa-solid ${config.icon} input-icon`;
    if (modeInput && modeInput.value !== modeName) {
      modeInput.value = modeName;
    }
  }

  // Window export so it can be called anywhere
  window.updateTransportModeUI = updateTransportModeUI;

  // --- Mode Pill Selection (Flight, Train, Bus, Car, Cruise) ---
  const modePills = document.querySelectorAll('.mode-pill');
  const transportInput = document.getElementById('transportMediumInput');
  const transportIcon = document.getElementById('transportIcon');

  const modeIcons = {
    'Flight': 'fa-plane',
    'Train': 'fa-train',
    'Bus': 'fa-bus',
    'Car': 'fa-car',
    'Cruise': 'fa-ship'
  };

  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      modePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const mode = pill.dataset.mode;
      if (transportInput) {
        transportInput.value = mode;
      }
      if (transportIcon && modeIcons[mode]) {
        transportIcon.className = `fa-solid ${modeIcons[mode]} input-icon`;
      }
      updateTransportModeUI(mode);
      showToast(`Selected mode: ${mode}`);
    });
  });

  // Close tool modal when clicking outside overlay
  const sutrivaToolModalEl = document.getElementById('sutrivaToolModal');
  if (sutrivaToolModalEl) {
    sutrivaToolModalEl.addEventListener('click', (e) => {
      if (e.target === sutrivaToolModalEl) {
        closeSutrivaToolModal();
      }
    });
  }

  // --- Tool Card Click Event Handler ---
  const toolCards = document.querySelectorAll('.tool-card');
  toolCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const toolKey = card.getAttribute('data-tool');
      if (toolKey === 'map') {
        e.preventDefault();
        e.stopPropagation();
        if (typeof closeHomeInlineTool === 'function') closeHomeInlineTool();
        switchPage('map');
        return;
      }
      if (toolKey) {
        openSutrivaToolModal(toolKey);
      } else {
        const toolHeader = card.querySelector('h4');
        const toolName = toolHeader ? toolHeader.innerText.trim() : '';
        if (toolName.includes('PG') || toolName.includes('Waiting') || toolName.includes('Stay') || toolName.includes('Hostel') || toolName.includes('Hotel')) {
          switchPage('accommodation');
          showToast(`Redirecting to Accommodation: ${toolName}`);
        } else {
          switchPage('transport');
          showToast(`Redirecting to Transport Tool: ${toolName}`);
        }
      }
    });
  });

  // --- Traveler Counter Custom Dropdown Logic ---
  let travelerCounts = {
    adults: 2,
    children: 0,
    infants: 0
  };

  const adultCountEl = document.getElementById('adultCount');
  const childCountEl = document.getElementById('childCount');
  const infantCountEl = document.getElementById('infantCount');

  const adultMinus = document.getElementById('adultMinus');
  const adultPlus = document.getElementById('adultPlus');
  const childMinus = document.getElementById('childMinus');
  const childPlus = document.getElementById('childPlus');
  const infantMinus = document.getElementById('infantMinus');
  const infantPlus = document.getElementById('infantPlus');

  const travelerInput = document.getElementById('travelerInput');
  const applyTravelersBtn = document.getElementById('applyTravelersBtn');
  const presetChips = document.querySelectorAll('.preset-chip');
  const travelerDropdown = document.getElementById('travelerDropdown');

  if (travelerDropdown) {
    travelerDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  function updateTravelerUI() {
    if (adultCountEl) adultCountEl.textContent = travelerCounts.adults;
    if (childCountEl) childCountEl.textContent = travelerCounts.children;
    if (infantCountEl) infantCountEl.textContent = travelerCounts.infants;

    if (adultMinus) adultMinus.disabled = travelerCounts.adults <= 1;
    if (childMinus) childMinus.disabled = travelerCounts.children <= 0;
    if (infantMinus) infantMinus.disabled = travelerCounts.infants <= 0;

    const total = travelerCounts.adults + travelerCounts.children + travelerCounts.infants;
    if (adultPlus) adultPlus.disabled = total >= 9;
    if (childPlus) childPlus.disabled = total >= 9;
    if (infantPlus) infantPlus.disabled = total >= 9;

    let parts = [];
    if (travelerCounts.adults === 1 && travelerCounts.children === 0 && travelerCounts.infants === 0) {
      parts.push('1 Adult');
    } else {
      parts.push(`${travelerCounts.adults} Adults`);
      if (travelerCounts.children > 0) {
        parts.push(`${travelerCounts.children} ${travelerCounts.children === 1 ? 'Child' : 'Children'}`);
      }
      if (travelerCounts.infants > 0) {
        parts.push(`${travelerCounts.infants} ${travelerCounts.infants === 1 ? 'Infant' : 'Infants'}`);
      }
    }
    if (travelerInput) {
      travelerInput.value = parts.join(', ');
    }
  }

  if (adultMinus) {
    adultMinus.addEventListener('click', (e) => {
      e.stopPropagation();
      if (travelerCounts.adults > 1) {
        travelerCounts.adults--;
        updateTravelerUI();
      }
    });
  }

  if (adultPlus) {
    adultPlus.addEventListener('click', (e) => {
      e.stopPropagation();
      if (travelerCounts.adults + travelerCounts.children + travelerCounts.infants < 9) {
        travelerCounts.adults++;
        updateTravelerUI();
      }
    });
  }

  if (childMinus) {
    childMinus.addEventListener('click', (e) => {
      e.stopPropagation();
      if (travelerCounts.children > 0) {
        travelerCounts.children--;
        updateTravelerUI();
      }
    });
  }

  if (childPlus) {
    childPlus.addEventListener('click', (e) => {
      e.stopPropagation();
      if (travelerCounts.adults + travelerCounts.children + travelerCounts.infants < 9) {
        travelerCounts.children++;
        updateTravelerUI();
      }
    });
  }

  if (infantMinus) {
    infantMinus.addEventListener('click', (e) => {
      e.stopPropagation();
      if (travelerCounts.infants > 0) {
        travelerCounts.infants--;
        updateTravelerUI();
      }
    });
  }

  if (infantPlus) {
    infantPlus.addEventListener('click', (e) => {
      e.stopPropagation();
      if (travelerCounts.adults + travelerCounts.children + travelerCounts.infants < 9) {
        travelerCounts.infants++;
        updateTravelerUI();
      }
    });
  }

  presetChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      travelerCounts.adults = parseInt(chip.dataset.adults) || 1;
      travelerCounts.children = parseInt(chip.dataset.children) || 0;
      travelerCounts.infants = parseInt(chip.dataset.infants) || 0;
      updateTravelerUI();
    });
  });

  if (applyTravelersBtn) {
    applyTravelersBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (travelerDropdown) travelerDropdown.classList.remove('show');
      const travelerGroup = document.getElementById('travelerGroup');
      if (travelerGroup) travelerGroup.classList.remove('active-dropdown');
      showToast(`Updated travelers: ${travelerInput.value}`);
    });
  }

  // --- Interactive Date Picker Custom Logic ---
  const datePickerDropdown = document.getElementById('datePickerDropdown');
  const departDateInput = document.getElementById('departDateInput');
  const returnDateInput = document.getElementById('returnDateInput');
  const returnFieldBox = document.getElementById('returnFieldBox');
  const tripRoundBtn = document.getElementById('tripRoundBtn');
  const tripOneWayBtn = document.getElementById('tripOneWayBtn');
  const applyDatesBtn = document.getElementById('applyDatesBtn');
  const dateInput = document.getElementById('dateInput');
  const dateChips = document.querySelectorAll('.date-chip');

  let isRoundTrip = true;

  if (datePickerDropdown) {
    datePickerDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  function formatDateString(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function updateDateUI() {
    if (!departDateInput || !returnDateInput) return;
    const depFormatted = formatDateString(departDateInput.value);
    const retFormatted = formatDateString(returnDateInput.value);

    if (isRoundTrip) {
      if (returnFieldBox) returnFieldBox.style.display = 'flex';
      if (dateInput) dateInput.value = `${depFormatted} - ${retFormatted}`;
    } else {
      if (returnFieldBox) returnFieldBox.style.display = 'none';
      if (dateInput) dateInput.value = `${depFormatted} (One Way)`;
    }
  }

  if (tripRoundBtn) {
    tripRoundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isRoundTrip = true;
      tripRoundBtn.classList.add('active');
      if (tripOneWayBtn) tripOneWayBtn.classList.remove('active');
      updateDateUI();
    });
  }

  if (tripOneWayBtn) {
    tripOneWayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isRoundTrip = false;
      tripOneWayBtn.classList.add('active');
      if (tripRoundBtn) tripRoundBtn.classList.remove('active');
      updateDateUI();
    });
  }

  if (departDateInput) {
    departDateInput.addEventListener('change', () => {
      updateDateUI();
    });
  }

  if (returnDateInput) {
    returnDateInput.addEventListener('change', () => {
      updateDateUI();
    });
  }

  dateChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      dateChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const range = chip.dataset.range;
      const today = new Date();
      let dep = new Date();
      let ret = new Date();

      if (range === 'this-weekend') {
        const dayOfWeek = today.getDay();
        const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
        dep.setDate(today.getDate() + daysUntilSat);
        ret.setDate(dep.getDate() + 2);
      } else if (range === 'next-week') {
        dep.setDate(today.getDate() + 7);
        ret.setDate(dep.getDate() + 7);
      } else if (range === 'next-month') {
        dep.setMonth(today.getMonth() + 1);
        ret.setMonth(dep.getMonth() + 1);
        ret.setDate(dep.getDate() + 7);
      }

      if (departDateInput) departDateInput.value = dep.toISOString().split('T')[0];
      if (returnDateInput) returnDateInput.value = ret.toISOString().split('T')[0];
      updateDateUI();
    });
  });

  if (applyDatesBtn) {
    applyDatesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateDateUI();
      if (datePickerDropdown) datePickerDropdown.classList.remove('show');
      const dateGroup = document.getElementById('dateGroup');
      if (dateGroup) dateGroup.classList.remove('active-dropdown');
      showToast(`Selected Dates: ${dateInput.value}`);
    });
  }

  // --- Comprehensive District & City Dataset for Auto-Suggestions ---
  const SUTRIVA_LOCATIONS = [
    // Tamil Nadu All 38 Districts & Popular Hubs
    { value: "Namakkal, Tamil Nadu", title: "Namakkal, Tamil Nadu", sub: "NMK · Namakkal District", tags: ["namakkal", "nmk", "tn"] },
    { value: "Chennai (MAA)", title: "Chennai, Tamil Nadu", sub: "MAA · Chennai Intl Airport", tags: ["chennai", "madras", "maa", "tn"] },
    { value: "Coimbatore (CJB)", title: "Coimbatore, Tamil Nadu", sub: "CJB · Coimbatore Intl Airport", tags: ["coimbatore", "kovai", "cjb", "tn"] },
    { value: "Madurai (IXM)", title: "Madurai, Tamil Nadu", sub: "IXM · Madurai Intl Airport", tags: ["madurai", "ixm", "tn"] },
    { value: "Tiruchirappalli (TRZ)", title: "Trichy (Tiruchirappalli), TN", sub: "TRZ · Trichy Intl Airport", tags: ["trichy", "tiruchirappalli", "trz", "tn"] },
    { value: "Salem (SXV)", title: "Salem, Tamil Nadu", sub: "SXV · Salem Airport", tags: ["salem", "sxv", "tn"] },
    { value: "Tirunelveli, Tamil Nadu", title: "Tirunelveli, Tamil Nadu", sub: "TEN · Nellai Hub", tags: ["tirunelveli", "nellai", "ten", "tn"] },
    { value: "Tiruppur, Tamil Nadu", title: "Tiruppur, Tamil Nadu", sub: "TPR · Textile Hub", tags: ["tiruppur", "tirupur", "tpr", "tn"] },
    { value: "Erode, Tamil Nadu", title: "Erode, Tamil Nadu", sub: "ED · Erode District", tags: ["erode", "ed", "tn"] },
    { value: "Vellore, Tamil Nadu", title: "Vellore, Tamil Nadu", sub: "VLR · Fort & Medical City", tags: ["vellore", "vlr", "tn"] },
    { value: "Thanjavur, Tamil Nadu", title: "Thanjavur, Tamil Nadu", sub: "TJV · Tanjore Heritage", tags: ["thanjavur", "tanjore", "tjv", "tn"] },
    { value: "Tuticorin (TCR)", title: "Tuticorin (Thoothukudi), TN", sub: "TCR · Tuticorin Airport", tags: ["tuticorin", "thoothukudi", "tcr", "tn"] },
    { value: "Kanyakumari, Tamil Nadu", title: "Kanyakumari, Tamil Nadu", sub: "CAPE · Southern Tip", tags: ["kanyakumari", "cape", "tn"] },
    { value: "Kanchipuram, Tamil Nadu", title: "Kanchipuram, Tamil Nadu", sub: "KCM · Silk City", tags: ["kanchipuram", "kanchi", "kcm", "tn"] },
    { value: "Dindigul, Tamil Nadu", title: "Dindigul, Tamil Nadu", sub: "DGL · Dindigul District", tags: ["dindigul", "dgl", "tn"] },
    { value: "Karur, Tamil Nadu", title: "Karur, Tamil Nadu", sub: "KRR · Textile Hub", tags: ["karur", "krr", "tn"] },
    { value: "Ooty (Udhagamandalam)", title: "Ooty, Tamil Nadu", sub: "NVY · Queen of Hill Stations", tags: ["ooty", "udhagamandalam", "nilgiris", "tn"] },
    { value: "Kodaikanal, Tamil Nadu", title: "Kodaikanal, Tamil Nadu", sub: "KOD · Princess of Hill Stations", tags: ["kodaikanal", "kodai", "tn"] },
    { value: "Rameswaram, Tamil Nadu", title: "Rameswaram, Tamil Nadu", sub: "RMM · Temple & Coastal Hub", tags: ["rameswaram", "rameshwaram", "rmm", "tn"] },
    { value: "Ramanathapuram, Tamil Nadu", title: "Ramanathapuram, Tamil Nadu", sub: "RMD · Ramnad District", tags: ["ramanathapuram", "ramnad", "tn"] },
    { value: "Cuddalore, Tamil Nadu", title: "Cuddalore, Tamil Nadu", sub: "CUD · Coastal District", tags: ["cuddalore", "cud", "tn"] },
    { value: "Villupuram, Tamil Nadu", title: "Villupuram, Tamil Nadu", sub: "VPM · Junction District", tags: ["villupuram", "vpm", "tn"] },
    { value: "Nagapattinam, Tamil Nadu", title: "Nagapattinam, Tamil Nadu", sub: "NGT · Coastal District", tags: ["nagapattinam", "ngt", "tn"] },
    { value: "Pudukkottai, Tamil Nadu", title: "Pudukkottai, Tamil Nadu", sub: "PDK · Pudukkottai District", tags: ["pudukkottai", "pdk", "tn"] },
    { value: "Sivagangai, Tamil Nadu", title: "Sivagangai, Tamil Nadu", sub: "SVG · Chettinad Region", tags: ["sivagangai", "sivaganga", "tn"] },
    { value: "Theni, Tamil Nadu", title: "Theni, Tamil Nadu", sub: "TNI · Western Ghats Region", tags: ["theni", "tni", "tn"] },
    { value: "Thiruvallur, Tamil Nadu", title: "Thiruvallur, Tamil Nadu", sub: "TLR · Thiruvallur District", tags: ["thiruvallur", "tiruvallur", "tn"] },
    { value: "Tiruvannamalai, Tamil Nadu", title: "Tiruvannamalai, Tamil Nadu", sub: "TNM · Annamalai Heritage", tags: ["tiruvannamalai", "tvmalai", "tnm", "tn"] },
    { value: "Tiruvarur, Tamil Nadu", title: "Tiruvarur, Tamil Nadu", sub: "TVR · Delta Region", tags: ["tiruvarur", "thiruvarur", "tvr", "tn"] },
    { value: "Krishnagiri, Tamil Nadu", title: "Krishnagiri, Tamil Nadu", sub: "KGI · Mango Capital", tags: ["krishnagiri", "kgi", "tn"] },
    { value: "Dharmapuri, Tamil Nadu", title: "Dharmapuri, Tamil Nadu", sub: "DPI · Hogenakkal Region", tags: ["dharmapuri", "dpi", "tn"] },
    { value: "Ariyalur, Tamil Nadu", title: "Ariyalur, Tamil Nadu", sub: "ALR · Cement Hub", tags: ["ariyalur", "alr", "tn"] },
    { value: "Perambalur, Tamil Nadu", title: "Perambalur, Tamil Nadu", sub: "PBL · Perambalur District", tags: ["perambalur", "pbl", "tn"] },
    { value: "Ranipet, Tamil Nadu", title: "Ranipet, Tamil Nadu", sub: "RPT · Leather & Industrial Hub", tags: ["ranipet", "rpt", "tn"] },
    { value: "Tenkasi, Tamil Nadu", title: "Tenkasi, Tamil Nadu", sub: "TKS · Courtallam Waterfalls", tags: ["tenkasi", "courtallam", "tks", "tn"] },
    { value: "Tirupathur, Tamil Nadu", title: "Tirupathur, Tamil Nadu", sub: "TPT · Yelagiri Region", tags: ["tirupathur", "yelagiri", "tpt", "tn"] },
    { value: "Chengalpattu, Tamil Nadu", title: "Chengalpattu, Tamil Nadu", sub: "CGL · Mahabalipuram Region", tags: ["chengalpattu", "cgl", "tn"] },
    { value: "Kallakurichi, Tamil Nadu", title: "Kallakurichi, Tamil Nadu", sub: "KLK · Kalrayan Hills Region", tags: ["kallakurichi", "klk", "tn"] },
    { value: "Mayiladuthurai, Tamil Nadu", title: "Mayiladuthurai, Tamil Nadu", sub: "MYD · Temple District", tags: ["mayiladuthurai", "mayavaram", "myd", "tn"] },
    { value: "Puducherry (PNY)", title: "Pondicherry (Puducherry)", sub: "PNY · French Quarter & Beaches", tags: ["pondicherry", "puducherry", "pny"] },

    // Major Indian Cities & Metro Hubs
    { value: "Mumbai (BOM)", title: "Mumbai, Maharashtra", sub: "BOM · Chhatrapati Shivaji Airport", tags: ["mumbai", "bombay", "bom"] },
    { value: "Delhi (DEL)", title: "New Delhi, Delhi", sub: "DEL · Indira Gandhi Intl Airport", tags: ["delhi", "new delhi", "del"] },
    { value: "Bengaluru (BLR)", title: "Bengaluru, Karnataka", sub: "BLR · Kempegowda Intl Airport", tags: ["bengaluru", "bangalore", "blr"] },
    { value: "Hyderabad (HYD)", title: "Hyderabad, Telangana", sub: "HYD · Rajiv Gandhi Intl Airport", tags: ["hyderabad", "hyd"] },
    { value: "Kolkata (CCU)", title: "Kolkata, West Bengal", sub: "CCU · Netaji Subhash Bose Airport", tags: ["kolkata", "calcutta", "ccu"] },
    { value: "Goa (GOI)", title: "Goa (Panaji)", sub: "GOI · Dabolim / Mopa Airport", tags: ["goa", "panaji", "goi", "gox"] },
    { value: "Kochi (COK)", title: "Kochi (Cochin), Kerala", sub: "COK · Cochin Intl Airport", tags: ["kochi", "cochin", "cok", "kerala"] },
    { value: "Thiruvananthapuram (TRV)", title: "Trivandrum, Kerala", sub: "TRV · Trivandrum Intl Airport", tags: ["trivandrum", "thiruvananthapuram", "trv"] },
    { value: "Kozhikode (CCJ)", title: "Calicut (Kozhikode), Kerala", sub: "CCJ · Calicut Intl Airport", tags: ["calicut", "kozhikode", "ccj"] },
    { value: "Mysuru (MYQ)", title: "Mysore (Mysuru), Karnataka", sub: "MYQ · Mysore Airport", tags: ["mysore", "mysuru", "myq"] },
    { value: "Mangaluru (IXE)", title: "Mangalore (Mangaluru), KA", sub: "IXE · Mangaluru Airport", tags: ["mangalore", "mangaluru", "ixe"] },
    { value: "Pune (PNQ)", title: "Pune, Maharashtra", sub: "PNQ · Pune Intl Airport", tags: ["pune", "pnq"] },
    { value: "Ahmedabad (AMD)", title: "Ahmedabad, Gujarat", sub: "AMD · Sardar Vallabhbhai Patel Airport", tags: ["ahmedabad", "amd"] },
    { value: "Jaipur (JAI)", title: "Jaipur, Rajasthan", sub: "JAI · Pink City Intl Airport", tags: ["jaipur", "jai"] },
    { value: "Udaipur (UDR)", title: "Udaipur, Rajasthan", sub: "UDR · Lake City Airport", tags: ["udaipur", "udr"] },
    { value: "Varanasi (VNS)", title: "Varanasi, Uttar Pradesh", sub: "VNS · Kashi Airport", tags: ["varanasi", "kashi", "vns"] },
    { value: "Amritsar (ATQ)", title: "Amritsar, Punjab", sub: "ATQ · Golden Temple Airport", tags: ["amritsar", "atq"] },
    { value: "Srinagar (SXR)", title: "Srinagar, Jammu & Kashmir", sub: "SXR · Srinagar Intl Airport", tags: ["srinagar", "sxr"] },
    { value: "Shimla (SLV)", title: "Shimla, Himachal Pradesh", sub: "SLV · Shimla Hill Station", tags: ["shimla", "slv"] },

    // Top International Destinations
    { value: "Singapore (SIN)", title: "Singapore", sub: "SIN · Changi Intl Airport", tags: ["singapore", "sin"] },
    { value: "Dubai (DXB)", title: "Dubai, UAE", sub: "DXB · Dubai Intl Airport", tags: ["dubai", "dxb", "uae"] },
    { value: "Bali (DPS)", title: "Bali, Indonesia", sub: "DPS · Ngurah Rai Airport", tags: ["bali", "dps", "indonesia"] },
    { value: "Bangkok (BKK)", title: "Bangkok, Thailand", sub: "BKK · Suvarnabhumi Airport", tags: ["bangkok", "bkk", "thailand"] },
    { value: "Phuket (HKT)", title: "Phuket, Thailand", sub: "HKT · Phuket Intl Airport", tags: ["phuket", "hkt"] },
    { value: "Kuala Lumpur (KUL)", title: "Kuala Lumpur, Malaysia", sub: "KUL · KLIA Airport", tags: ["kuala lumpur", "kul", "malaysia"] },
    { value: "Colombo (CMB)", title: "Colombo, Sri Lanka", sub: "CMB · Bandaranaike Intl Airport", tags: ["colombo", "cmb", "sri lanka"] },
    { value: "Malé (MLE)", title: "Malé, Maldives", sub: "MLE · Velana Intl Airport", tags: ["male", "maldives", "mle"] },
    { value: "London (LHR)", title: "London, UK", sub: "LHR · Heathrow Airport", tags: ["london", "lhr", "uk"] },
    { value: "Paris (CDG)", title: "Paris, France", sub: "CDG · Charles de Gaulle Airport", tags: ["paris", "cdg", "france"] },
    { value: "Tokyo (HND)", title: "Tokyo, Japan", sub: "HND · Haneda Airport", tags: ["tokyo", "hnd", "japan"] },
    { value: "New York (JFK)", title: "New York, USA", sub: "JFK · John F. Kennedy Airport", tags: ["new york", "nyc", "jfk"] }
  ];

  // --- Input Group Dropdown Menu Logic & Live Suggestions ---
  const inputGroups = document.querySelectorAll('.input-group');
  
  inputGroups.forEach(group => {
    const dropdownMenu = group.querySelector('.dropdown-menu');
    const inputField = group.querySelector('input');
    const inputIcon = group.querySelector('.input-icon');

    if (!dropdownMenu) return;

    // Check if this input group is specifically for location suggestions
    const isLocationGroup = group.id === 'fromGroup' || group.id === 'toGroup' ||
                            group.id === 'tFromGroup' || group.id === 'tToGroup' ||
                            group.id === 'accDestGroup' ||
                            (inputField && (inputField.id === 'fromInput' || inputField.id === 'toInput' || inputField.id === 'tFromInput' || inputField.id === 'tToInput' || inputField.id === 'accDestInput'));

    // Helper to render filtered location suggestions dynamically
    const filterLocationOptions = (queryVal) => {
      const query = (queryVal || '').trim().toLowerCase();
      
      dropdownMenu.innerHTML = '';

      let matches = [];
      if (!query) {
        matches = SUTRIVA_LOCATIONS.slice(0, 8);
      } else {
        const startsWith = [];
        const contains = [];

        SUTRIVA_LOCATIONS.forEach(loc => {
          const titleLower = loc.title.toLowerCase();
          const subLower = loc.sub.toLowerCase();
          const valLower = loc.value.toLowerCase();
          const matchesTag = loc.tags && loc.tags.some(t => t.startsWith(query));

          if (titleLower.startsWith(query) || valLower.startsWith(query) || matchesTag) {
            startsWith.push(loc);
          } else if (titleLower.includes(query) || subLower.includes(query) || valLower.includes(query)) {
            contains.push(loc);
          }
        });

        matches = [...startsWith, ...contains].slice(0, 10);
      }

      matches.forEach((loc, idx) => {
        const opt = document.createElement('div');
        opt.className = 'dropdown-option' + (idx === 0 ? ' active' : '');
        opt.dataset.value = loc.value;
        opt.style.display = 'flex';
        opt.innerHTML = `
          <i class="fa-solid fa-location-dot opt-location-icon"></i>
          <div class="opt-desc">
            <strong>${loc.title}</strong>
            <span>${loc.sub}</span>
          </div>
        `;
        opt.onclick = (e) => {
          e.stopPropagation();
          if (inputField) inputField.value = loc.value;
          dropdownMenu.classList.remove('show');
          group.classList.remove('active-dropdown');
          showToast(`Selected ${loc.value}`);
          if (group.id === 'toGroup' || (inputField && inputField.id === 'toInput')) {
            if (typeof window.onSearchDestinationChanged === 'function') {
              window.onSearchDestinationChanged(loc.value);
            }
          } else if (group.id === 'fromGroup' || (inputField && inputField.id === 'fromInput')) {
            if (typeof window.onSearchOriginChanged === 'function') {
              window.onSearchOriginChanged(loc.value);
            }
          }
        };
        dropdownMenu.appendChild(opt);
      });

      if (query.length > 0) {
        const customOpt = document.createElement('div');
        customOpt.className = 'dropdown-option custom-suggestion-option';
        customOpt.dataset.value = queryVal;
        customOpt.style.display = 'flex';
        customOpt.innerHTML = `
          <i class="fa-solid fa-location-dot opt-location-icon"></i>
          <div class="opt-desc">
            <strong>Use "${queryVal}"</strong>
            <span>Custom Location</span>
          </div>
        `;
        customOpt.onclick = (e) => {
          e.stopPropagation();
          if (inputField) inputField.value = queryVal;
          dropdownMenu.classList.remove('show');
          group.classList.remove('active-dropdown');
          showToast(`Selected location: ${queryVal}`);
          if (group.id === 'toGroup' || (inputField && inputField.id === 'toInput')) {
            if (typeof window.onSearchDestinationChanged === 'function') {
              window.onSearchDestinationChanged(queryVal);
            }
          } else if (group.id === 'fromGroup' || (inputField && inputField.id === 'fromInput')) {
            if (typeof window.onSearchOriginChanged === 'function') {
              window.onSearchOriginChanged(queryVal);
            }
          }
        };
        dropdownMenu.appendChild(customOpt);
      }
    };

    // For static dropdowns (like Transport Mode, Travelers) - attach click handlers to static options
    if (!isLocationGroup) {
      const options = dropdownMenu.querySelectorAll('.dropdown-option');
      options.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          options.forEach(o => o.classList.remove('active'));
          opt.classList.add('active');

          const val = opt.dataset.value;
          const iconClass = opt.dataset.icon;

          if (inputField && val) {
            inputField.value = val;
          }

          if (inputIcon && iconClass) {
            inputIcon.className = `fa-solid ${iconClass} input-icon`;
          }

          if (group.id === 'modeGroup' || (inputField && inputField.id === 'modeInput')) {
            updateTransportModeUI(val);
            if (typeof window.onSearchModeChanged === 'function') {
              window.onSearchModeChanged(val);
            }
          }

          dropdownMenu.classList.remove('show');
          group.classList.remove('active-dropdown');

          showToast(`Selected ${val}`);
        });
      });
    }

    // Toggle dropdown when clicking input-group
    group.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (e.target.closest('.dropdown-menu')) {
        return;
      }

      const isOpen = dropdownMenu.classList.contains('show');
      
      // Close all other open dropdowns
      document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
      document.querySelectorAll('.input-group').forEach(grp => grp.classList.remove('active-dropdown'));

      if (!isOpen) {
        dropdownMenu.classList.add('show');
        group.classList.add('active-dropdown');
        if (isLocationGroup && inputField && !inputField.readOnly) {
          inputField.focus();
          filterLocationOptions(inputField.value);
        }
      }
    });

    if (isLocationGroup && inputField && !inputField.readOnly) {
      inputField.addEventListener('input', (e) => {
        if (!dropdownMenu.classList.contains('show')) {
          dropdownMenu.classList.add('show');
          group.classList.add('active-dropdown');
        }
        filterLocationOptions(e.target.value);
        if (group.id === 'toGroup' || (inputField && inputField.id === 'toInput')) {
          if (typeof window.onSearchDestinationChanged === 'function') {
            window.onSearchDestinationChanged(e.target.value);
          }
        }
      });

      inputField.addEventListener('focus', (e) => {
        dropdownMenu.classList.add('show');
        group.classList.add('active-dropdown');
        filterLocationOptions(e.target.value);
      });

      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const firstOption = dropdownMenu.querySelector('.dropdown-option');
          if (firstOption) {
            firstOption.click();
          } else if (inputField.value) {
            dropdownMenu.classList.remove('show');
            group.classList.remove('active-dropdown');
            showToast(`Selected location: ${inputField.value}`);
          }
        } else if (e.key === 'Escape') {
          dropdownMenu.classList.remove('show');
          group.classList.remove('active-dropdown');
        }
      });
    }
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
    document.querySelectorAll('.input-group').forEach(grp => grp.classList.remove('active-dropdown'));
  });

  // =========================================================================
  // DYNAMIC POPULAR DESTINATIONS & TRANSPORT MEDIUM SUGGESTIONS SYSTEM
  // =========================================================================

  function extractCityName(val) {
    if (!val || typeof val !== 'string') return 'Singapore';
    let clean = val.split('(')[0].split(',')[0].trim();
    return clean || 'Singapore';
  }

  // Curated database of top travel destinations with HD Unsplash photography
  const DESTINATION_CATALOG = {
    'singapore': {
      name: 'Singapore',
      subtitle: 'Explore iconic attractions, futuristic gardens & vibrant island resorts across Singapore',
      hotelSub: 'Marina Bay & Orchard Road Luxury Hotels.',
      bannerImg: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
      spots: [
        { name: 'Marina Bay Sands', desc: 'SkyPark & Waterfront Promenade', img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80' },
        { name: 'Gardens by the Bay', desc: 'Supertree Grove & Cloud Forest', img: 'https://images.unsplash.com/photo-1506351421178-63788970ee5b?w=800&q=80' },
        { name: 'Sentosa Island', desc: 'Tropical Beaches & Cable Car', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80' },
        { name: 'Universal Studios', desc: 'World-Class Movie Theme Park', img: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80' },
        { name: 'Merlion Park', desc: 'Iconic Marina Bay Waterfront', img: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800&q=80' }
      ]
    },
    'dubai': {
      name: 'Dubai',
      subtitle: 'Explore soaring skyscrapers, luxury resorts & Arabian desert adventures across Dubai',
      hotelSub: 'Downtown Dubai & JBR Marina Luxury Suites.',
      bannerImg: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
      spots: [
        { name: 'Burj Khalifa', desc: "World's Tallest Tower & Sky Deck", img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80' },
        { name: 'Palm Jumeirah', desc: 'Iconic Archipelago & Atlantis Resort', img: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80' },
        { name: 'Desert Safari', desc: 'Dune Bashing & Arabian Bedouin Camp', img: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&q=80' },
        { name: 'Dubai Marina', desc: 'Luxury Yacht Marina & Promenade', img: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80' },
        { name: 'Museum of the Future', desc: 'Futuristic Architectural Marvel', img: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80' }
      ]
    },
    'bali': {
      name: 'Bali',
      subtitle: 'Explore tropical beaches, ancient water temples & lush volcanic highlands across Bali',
      hotelSub: 'Ubud Private Pool Villas & Beachfront Resorts.',
      bannerImg: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
      spots: [
        { name: 'Ubud Monkey Forest', desc: 'Sacred Sanctuary & Jungle River', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80' },
        { name: 'Tanah Lot Temple', desc: 'Sunset Sea Temple on Ocean Rock', img: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80' },
        { name: 'Uluwatu Cliff', desc: 'Dramatic Ocean Views & Kecak Dance', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80' },
        { name: 'Kuta & Seminyak', desc: 'Golden Beaches & Vibrant Beach Clubs', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
        { name: 'Mount Batur', desc: 'Sunrise Volcano Trekking & Crater', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' }
      ]
    },
    'bangkok': {
      name: 'Bangkok',
      subtitle: 'Explore ornate temples, bustling floating markets & street food paradises across Bangkok',
      hotelSub: 'Sukhumvit & Riverside 5-Star Stays.',
      bannerImg: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
      spots: [
        { name: 'Grand Palace', desc: 'Emerald Buddha & Royal Palace', img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80' },
        { name: 'Wat Arun', desc: 'Temple of Dawn on Chao Phraya', img: 'https://images.unsplash.com/photo-1563492065599-3580f779d721?w=800&q=80' },
        { name: 'Chatuchak Market', desc: '15,000+ Weekend Artisan Stalls', img: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80' },
        { name: 'ICONSIAM', desc: 'Luxury Waterfront Megamall', img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80' },
        { name: 'Chao Phraya Cruise', desc: 'Scenic Skyline Dinner Cruise', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' }
      ]
    },
    'paris': {
      name: 'Paris',
      subtitle: 'Explore romantic boulevards, world-class art & historic monuments across Paris',
      hotelSub: 'Champs-Élysées & Latin Quarter Boutique Hotels.',
      bannerImg: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
      spots: [
        { name: 'Eiffel Tower', desc: 'Iconic Iron Lady & Champ de Mars', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80' },
        { name: 'Louvre Museum', desc: 'Mona Lisa & Historic Glass Pyramid', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80' },
        { name: 'Arc de Triomphe', desc: 'Champs-Élysées Panoramic Rooftop', img: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800&q=80' },
        { name: 'Seine River Cruise', desc: 'Romantic Sunset Boat Voyage', img: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800&q=80' },
        { name: 'Montmartre', desc: 'Sacré-Cœur Basilica & Artists Square', img: 'https://images.unsplash.com/photo-1492138786289-d35ea832da43?w=800&q=80' }
      ]
    },
    'london': {
      name: 'London',
      subtitle: 'Explore royal palaces, historic riverwalks & iconic landmarks across London',
      hotelSub: 'Westminster & Covent Garden Classic Hotels.',
      bannerImg: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
      spots: [
        { name: 'Big Ben & Westminster', desc: 'Historic Clock Tower & Parliament', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80' },
        { name: 'London Eye', desc: 'Panoramic Thames Ferris Wheel', img: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800&q=80' },
        { name: 'Tower Bridge', desc: 'Iconic Victorian Twin-Tower Bridge', img: 'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800&q=80' },
        { name: 'British Museum', desc: 'World Antiquities & Great Court', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80' },
        { name: 'Hyde Park', desc: 'Royal Greenery & Serpentine Lake', img: 'https://images.unsplash.com/photo-1508672019048-805b876b67e2?w=800&q=80' }
      ]
    },
    'tokyo': {
      name: 'Tokyo',
      subtitle: 'Explore futuristic neon hubs, serene shrines & culinary masteries across Tokyo',
      hotelSub: 'Shinjuku & Ginza Modern Skyscraper Stays.',
      bannerImg: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80',
      spots: [
        { name: 'Shibuya Crossing', desc: "World's Busiest Scramble & Neon Lights", img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80' },
        { name: 'Mount Fuji View', desc: 'Iconic Snow-Capped Sacred Peak', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80' },
        { name: 'Senso-ji Temple', desc: 'Oldest Buddhist Temple in Asakusa', img: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80' },
        { name: 'Tokyo Skytree', desc: '634m Tower & Observation Deck', img: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80' },
        { name: 'Shinjuku Gyoen', desc: 'Lush Cherry Blossom Imperial Garden', img: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&q=80' }
      ]
    },
    'chennai': {
      name: 'Chennai',
      subtitle: 'Explore Dravidian heritage, coastal boulevards & colonial history across Chennai',
      hotelSub: 'ECR Beach Resorts & Central City Stays.',
      bannerImg: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80',
      spots: [
        { name: 'Marina Beach', desc: "World's 2nd Longest Urban Beach", img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80' },
        { name: 'Kapaleeshwarar Temple', desc: 'Mylapore 7th-Century Dravidian Gump', img: 'https://images.unsplash.com/photo-1609137144820-2180df691a78?w=800&q=80' },
        { name: 'San Thome Basilica', desc: 'Historic Apostle Shrine & Cathedral', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80' },
        { name: 'Mahabalipuram', desc: 'UNESCO Shore Temple & Monolithic Carvings', img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80' },
        { name: 'Guindy National Park', desc: 'Protected Urban Deer & Wildlife Sanctuary', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80' }
      ]
    },
    'goa': {
      name: 'Goa',
      subtitle: 'Explore sun-kissed beaches, Portuguese cathedrals & vibrant night shacks across Goa',
      hotelSub: 'North Goa Beachfront Villas & South Goa Serenity.',
      bannerImg: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80',
      spots: [
        { name: 'Baga & Calangute Beach', desc: 'Water Sports, Shacks & Sunset Parties', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80' },
        { name: 'Dudhsagar Falls', desc: 'Majestic 4-Tier Milky White Cascade', img: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80' },
        { name: 'Fort Aguada', desc: '17th-Century Portuguese Lighthouse Fort', img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80' },
        { name: 'Basilica of Bom Jesus', desc: 'UNESCO Baroque Architecture Heritage', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80' },
        { name: 'Anjuna Flea Market', desc: 'Bohemian Beachside Stalls & Music', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' }
      ]
    },
    'ooty': {
      name: 'Ooty',
      subtitle: 'Explore rolling tea estates, colonial gardens & misty mountain peaks across Ooty',
      hotelSub: 'Heritage Tea Estate Bungalows & Pine Valley Resorts.',
      bannerImg: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
      spots: [
        { name: 'Nilgiri Mountain Railway', desc: 'UNESCO Heritage Blue Mountain Toy Train', img: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80' },
        { name: 'Botanical Garden', desc: '55 Acres of Exotic Terraces & Fossil Trees', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80' },
        { name: 'Doddabetta Peak', desc: 'Highest Vantage Point in Nilgiris (2,637m)', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
        { name: 'Ooty Lake', desc: 'Rowing, Pedal Boating & Lakeside Bazaar', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
        { name: 'Pykara Waterfalls', desc: 'Pine Forest Walks & Speedboat Rides', img: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80' }
      ]
    },
    'namakkal': {
      name: 'Namakkal',
      subtitle: 'Explore famous temples, misty hills & iconic landmarks across Namakkal',
      hotelSub: 'Kolli Hills Resorts & City Hotels.',
      bannerImg: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      spots: [
        { name: 'Namakkal Fort', desc: 'Rock Fort & 18-ft Anjaneyar Temple', img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80' },
        { name: 'Kolli Hills', desc: '70 Hairpins & Misty Clouds', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80' },
        { name: 'Agaya Gangai', desc: '300-ft Valley Waterfall Trek', img: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80' },
        { name: 'Tiruchengode', desc: 'Arthanaareeswarar Hill Temple', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80' },
        { name: 'Jedarpalayam', desc: 'Kaveri Dam & Riverside Water Park', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' }
      ]
    },
    'coimbatore': {
      name: 'Coimbatore',
      subtitle: 'Explore Manchester of South India, spiritual monuments & Western Ghat waterfalls',
      hotelSub: 'Avinashi Road City Hotels & Foothill Retreats.',
      bannerImg: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80',
      spots: [
        { name: 'Adiyogi Shiva Statue', desc: '112-ft Guinness Record Steel Monument', img: 'https://images.unsplash.com/photo-1609137144820-2180df691a78?w=800&q=80' },
        { name: 'Marudhamalai Temple', desc: 'Hilltop Lord Murugan Sacred Abode', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80' },
        { name: 'Siruvani Waterfalls', desc: "World's Sweetest Natural Mineral Stream", img: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80' },
        { name: 'VOC Park & Zoo', desc: 'Botanical Gardens & Family Amusement', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80' },
        { name: 'Gedee Car Museum', desc: 'Classic Vintage Automobiles & Inventions', img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80' }
      ]
    },
    'madurai': {
      name: 'Madurai',
      subtitle: 'Explore the ancient temple city, grand Nayak architecture & historic heritage of Madurai',
      hotelSub: 'Temple View Heritage Hotels & City Stays.',
      bannerImg: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80',
      spots: [
        { name: 'Meenakshi Temple', desc: '14 Soaring Gopurams & Golden Lotus Tank', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80' },
        { name: 'Thirumalai Nayak Mahal', desc: 'Grand Indo-Saracenic Palace & Light Show', img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80' },
        { name: 'Gandhi Memorial Museum', desc: 'Historic Freedom Struggle Collection', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80' },
        { name: 'Alagar Kovil', desc: 'Alagar Hills Sacred Forest Temple', img: 'https://images.unsplash.com/photo-1609137144820-2180df691a78?w=800&q=80' },
        { name: 'Vandiyur Teppakulam', desc: 'Vandiyur Lake & Central Island Mandapam', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' }
      ]
    },
    'bengaluru': {
      name: 'Bengaluru',
      subtitle: 'Explore the Garden City, royal Tudor castles & tech innovation hubs across Bengaluru',
      hotelSub: 'Indiranagar & Whitefield Luxury Boutique Hotels.',
      bannerImg: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80',
      spots: [
        { name: 'Lalbagh Botanical Garden', desc: 'Historic Glass House & 240-Acre Greens', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80' },
        { name: 'Bangalore Palace', desc: 'Tudor-Style Royal Residence & Grounds', img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80' },
        { name: 'Cubbon Park', desc: '300-Acre Lush Canopy in the City Heart', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80' },
        { name: 'Bannerghatta Safari', desc: 'Wildlife Safari & Grand Butterfly Park', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80' },
        { name: 'Nandi Hills', desc: 'Misty Sunrise Hill Viewpoint & Fortress', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' }
      ]
    },
    'mumbai': {
      name: 'Mumbai',
      subtitle: 'Explore the City of Dreams, historic waterfronts & vibrant coastal life across Mumbai',
      hotelSub: 'Colaba & Juhu Beach Sea-Facing Luxury Stays.',
      bannerImg: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',
      spots: [
        { name: 'Gateway of India', desc: 'Colonial Colaba Waterfront Arch Monument', img: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80' },
        { name: 'Marine Drive', desc: "The Queen's Necklace Sunset Promenade", img: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&q=80' },
        { name: 'Bandra-Worli Sea Link', desc: '8-Lane Cable-Stayed Engineering Marvel', img: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80' },
        { name: 'Elephanta Caves', desc: 'UNESCO 5th-Century Rock Sculptures', img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80' },
        { name: 'Chhatrapati Shivaji Terminus', desc: 'Victorian Gothic UNESCO Railway Marvel', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80' }
      ]
    },
    'delhi': {
      name: 'Delhi',
      subtitle: 'Explore Mughal monuments, sprawling boulevards & rich history across New Delhi',
      hotelSub: 'Connaught Place & Aerocity 5-Star Suites.',
      bannerImg: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',
      spots: [
        { name: 'India Gate', desc: 'Kartavya Path Boulevard & Eternal Flame', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80' },
        { name: 'Qutub Minar', desc: '73m UNESCO Red Sandstone Tower', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80' },
        { name: 'Red Fort', desc: 'Mughal Citadel & Diwan-i-Aam Grandeur', img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80' },
        { name: "Humayun's Tomb", desc: 'Garden Tomb Precursor to the Taj Mahal', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80' },
        { name: 'Lotus Temple', desc: 'Baháʼí House of Worship & Serene Ponds', img: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800&q=80' }
      ]
    },
    'kochi': {
      name: 'Kochi',
      subtitle: 'Explore colonial spice routes, serene backwaters & coastal charm across Kochi',
      hotelSub: 'Fort Kochi Heritage Villas & Marine Drive Stays.',
      bannerImg: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
      spots: [
        { name: 'Chinese Fishing Nets', desc: 'Iconic Fixed Nets on Fort Kochi Coast', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80' },
        { name: 'Mattancherry Palace', desc: 'Dutch Colonial Murals & Royal Courtyard', img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80' },
        { name: 'Kerala Backwaters', desc: 'Houseboat Canal Cruises & Coconut Groves', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
        { name: 'Jew Town & Synagogue', desc: 'Historic 1568 Synagogue & Antique Bazaars', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80' },
        { name: 'Cherai Beach', desc: 'Pristine Golden Sand & Dolphin Sightings', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' }
      ]
    },
    'kodaikanal': {
      name: 'Kodaikanal',
      subtitle: 'Explore the Princess of Hill Stations, mist-covered cliffs & pine forests across Kodaikanal',
      hotelSub: 'Lakeview Cottages & Cliffside Mountain Resorts.',
      bannerImg: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
      spots: [
        { name: 'Kodai Lake Boating', desc: 'Star-Shaped Mountain Lake & Cycling', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
        { name: "Coaker's Walk", desc: 'Pedestrian Path with Cloud Valley Vistas', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80' },
        { name: 'Pillar Rocks', desc: 'Three 400-ft Vertical Granite Pillars', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
        { name: 'Silver Cascade Falls', desc: '180-ft Overflowing Waterfall Cascade', img: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80' },
        { name: 'Pine Forest', desc: 'Majestic Towering Timber Pine Woods', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80' }
      ]
    }
  };

  // Fallback generator for custom/any entered cities
  function generateFallbackDestination(cityName) {
    const clean = cityName.charAt(0).toUpperCase() + cityName.slice(1);
    return {
      name: clean,
      subtitle: `Explore top sights, historic monuments, viewpoint hills & local culture across ${clean}`,
      hotelSub: `${clean} Verified City Hotels, Resorts & Homestays.`,
      bannerImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      spots: [
        { name: `${clean} Fort & Heritage`, desc: 'Historic Architecture & Ramparts', img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80' },
        { name: `${clean} Nature Park`, desc: 'Botanical Sanctuary & Walking Trails', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80' },
        { name: `${clean} Viewpoint`, desc: 'Panoramic Hilltop Horizon & Sunset', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
        { name: `${clean} Waterfalls & Lake`, desc: 'Scenic Water Body & Boating Escapes', img: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80' },
        { name: `${clean} Old Town Bazaar`, desc: 'Handicrafts, Street Flavors & Culture', img: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80' }
      ]
    };
  }

  function getDestinationData(cityInput) {
    const city = extractCityName(cityInput).toLowerCase();
    for (const key in DESTINATION_CATALOG) {
      if (city.includes(key) || key.includes(city)) {
        return DESTINATION_CATALOG[key];
      }
    }
    return generateFallbackDestination(extractCityName(cityInput));
  }

  // --- Render Dynamic Popular Destinations ---
  function renderPopularDestinations(cityInput) {
    const dest = getDestinationData(cityInput);
    window.currentPopularCity = dest.name;

    const titleEl = document.getElementById('popularDestTitle');
    const subEl = document.getElementById('popularDestSubtitle');
    const gridEl = document.getElementById('popularDestGrid');
    const bannerEl = document.getElementById('popularOfferBanner');
    const mapLink = document.getElementById('popularDestMapLink');

    if (titleEl) titleEl.textContent = `Popular Destinations in ${dest.name}`;
    if (subEl) subEl.textContent = dest.subtitle;
    if (mapLink) {
      mapLink.onclick = () => {
        switchPage('map');
        if (typeof window.setStartCity === 'function') window.setStartCity(dest.name);
        return false;
      };
    }

    if (gridEl) {
      gridEl.innerHTML = '';
      dest.spots.forEach(spot => {
        const card = document.createElement('div');
        card.className = 'dest-card animated-refresh';
        card.dataset.dest = spot.name.toLowerCase().replace(/\s+/g, '-');
        card.title = `${spot.name} in ${dest.name}`;
        card.innerHTML = `
          <div class="card-thumb">
            <img src="${spot.img}" alt="${spot.name}" loading="lazy">
          </div>
          <div class="card-body">
            <h3><i class="fa-solid fa-location-dot"></i> ${spot.name}</h3>
            <p>${spot.desc}</p>
          </div>
        `;
        gridEl.appendChild(card);
      });
    }

    if (bannerEl) {
      bannerEl.className = 'offer-banner-card animated-refresh';
      bannerEl.style.backgroundImage = `linear-gradient(180deg, rgba(15, 35, 60, 0.25) 0%, rgba(15, 35, 60, 0.1) 40%, rgba(15, 35, 60, 0.85) 100%), url('${dest.bannerImg}')`;
      bannerEl.innerHTML = `
        <div class="offer-badge" id="popularOfferBadge">${dest.name} Special</div>
        <h3 class="offer-title" id="popularOfferTitle">Up to 50% Off<br>on ${dest.name} Stays</h3>
        <p class="offer-sub" id="popularOfferSub">${dest.hotelSub}</p>
        <button class="offer-btn" id="exploreHotelsBtn">
          Explore Stays <i class="fa-solid fa-arrow-right"></i>
        </button>
      `;
    }
  }
  window.renderPopularDestinations = renderPopularDestinations;

  // --- Transport Mode Data & Suggestion Generator ---
  function getTransportSuggestionsData(fromInput, toInput, modeInput) {
    const fromCity = extractCityName(fromInput);
    const toCity = extractCityName(toInput);
    const mode = (modeInput || 'Flight').toLowerCase();

    const isOverseas = ['singapore', 'dubai', 'bali', 'bangkok', 'paris', 'london', 'tokyo', 'maldives', 'kuala lumpur', 'colombo', 'new york'].some(k => toCity.toLowerCase().includes(k));

    if (mode.includes('flight')) {
      const dur = isOverseas ? (toCity.toLowerCase().includes('singapore') ? '4h 15m' : toCity.toLowerCase().includes('dubai') ? '4h 20m' : '7h 45m') : '1h 20m';
      return {
        modeName: 'Flight',
        icon: 'fa-plane',
        badge: 'Air Travel',
        heading: `Flight Recommendations: ${fromCity} ➔ ${toCity}`,
        sub: `Direct non-stop options (~${dur}), transparent baggage policies & certified on-time carriers`,
        tip: isOverseas ? `Mandatory E-Visa / SG Arrival Card required 3 days before travel. Web check-in opens 48 hrs before departure.` : `Web check-in opens 48 hrs prior. Arrive at ${fromCity} Airport 2 hrs before departure.`,
        options: [
          {
            badge: 'Best Overall · 4.9 ★',
            badgeClass: 'blue',
            name: isOverseas ? (toCity.toLowerCase().includes('singapore') ? 'Singapore Airlines' : 'Emirates') : 'IndiGo Airlines',
            meta: isOverseas ? 'SQ 529 · Non-stop Airbus A350' : '6E 2145 · Non-stop A321neo',
            depart: '08:15 AM',
            arrive: '01:30 PM',
            dur: `${dur} Direct`,
            chips: ['Free Hot Meals', '30kg Check-in Bag', 'WiFi & Power'],
            price: isOverseas ? '₹14,850' : '₹4,250'
          },
          {
            badge: 'Value Choice · 4.7 ★',
            badgeClass: 'amber',
            name: isOverseas ? 'IndiGo International' : 'Air India Express',
            meta: '6E 1005 · Direct Boeing 737',
            depart: '11:40 AM',
            arrive: '05:05 PM',
            dur: `${dur} Direct`,
            chips: ['On-time Guarantee', '15kg Luggage', 'USB Fast Charge'],
            price: isOverseas ? '₹11,400' : '₹3,450'
          },
          {
            badge: 'Evening Direct · 4.5 ★',
            badgeClass: '',
            name: isOverseas ? 'Air India' : 'Akasa Air',
            meta: 'AI 347 · Boeing Dreamliner',
            depart: '08:30 PM',
            arrive: '02:00 AM',
            dur: `${dur} Direct`,
            chips: ['Extra Legroom', 'Complimentary Snack', 'Flexible Rebook'],
            price: isOverseas ? '₹12,200' : '₹3,690'
          }
        ]
      };
    } else if (mode.includes('train')) {
      if (isOverseas) {
        return {
          modeName: 'Train',
          icon: 'fa-train',
          badge: 'Rail & Transit',
          heading: `Rail Transit & Train Guidance: ${fromCity} ➔ ${toCity}`,
          sub: `International travel: Take flight to ${toCity}, followed by seamless high-speed airport express rail & MRT networks`,
          tip: `Singapore MRT Changi Airport Line connects terminal directly to Downtown/Marina Bay in 28 mins without traffic.`,
          options: [
            {
              badge: 'Airport Express · 4.9 ★',
              badgeClass: 'blue',
              name: `${toCity} Airport MRT / Rail Express`,
              meta: 'High-speed Cross-Island Direct Transit',
              depart: 'Every 7 mins',
              arrive: 'Direct Terminal',
              dur: '28m to Marina Bay',
              chips: ['Contactless Tap-to-Pay', 'Luggage Racks', 'Air-Conditioned'],
              price: '₹145 / S$2.40'
            },
            {
              badge: 'Scenic Intercity · 4.7 ★',
              badgeClass: 'amber',
              name: 'KTM Shuttle / High-Speed Rail Pass',
              meta: 'Woodlands Cross-Border Shuttle Rail',
              depart: 'Hourly departures',
              arrive: 'Central Station',
              dur: '1h 15m Intercity',
              chips: ['Reserved AC Seating', 'Scenic Views', 'Duty Free Access'],
              price: '₹380'
            },
            {
              badge: 'Tourist Pass · 4.8 ★',
              badgeClass: '',
              name: `${toCity} Unlimited Rail & Metro Card`,
              meta: '3-Day All-Access Transit Pass',
              depart: 'Unlimited Rides',
              arrive: 'All Lines',
              dur: 'Full Day Pass',
              chips: ['Unlimited Metro', 'Free Public Buses', 'App Navigation'],
              price: '₹1,250'
            }
          ]
        };
      } else {
        return {
          modeName: 'Train',
          icon: 'fa-train',
          badge: 'Indian Railways',
          heading: `Train Recommendations: ${fromCity} ➔ ${toCity}`,
          sub: `Superfast Vande Bharat, Shatabdi & comfortable overnight express routes with verified pantry`,
          tip: `IRCTC Tatkal booking opens at 10:00 AM (AC classes) & 11:00 AM (Non-AC) 1 day before departure.`,
          options: [
            {
              badge: 'Fastest Route · 4.9 ★',
              badgeClass: 'blue',
              name: 'Vande Bharat Express (20607)',
              meta: 'Superfast Executive & Chair Car',
              depart: '05:50 AM',
              arrive: '10:10 AM',
              dur: '4h 20m Non-stop',
              chips: ['Revolving Ergonomic Seats', 'Complimentary Breakfast', 'Bio-Vacuum Toilets'],
              price: '₹1,290 / ₹2,350'
            },
            {
              badge: 'Premium Comfort · 4.7 ★',
              badgeClass: 'amber',
              name: 'Shatabdi / Superfast Express',
              meta: '1st AC & 2nd AC Air-Conditioned',
              depart: '02:15 PM',
              arrive: '07:25 PM',
              dur: '5h 10m Express',
              chips: ['Pantry Meals Included', 'Bedding & Pillows', 'Large Windows'],
              price: '₹1,120'
            },
            {
              badge: 'Overnight Budget · 4.5 ★',
              badgeClass: '',
              name: 'Mail & Superfast Express (12671)',
              meta: 'AC 3-Tier & Sleeper Coach',
              depart: '10:30 PM',
              arrive: '05:45 AM',
              dur: '7h 15m Overnight',
              chips: ['Comfort Sleeper Berth', 'Economical Choice', 'Luggage Under Berth'],
              price: '₹420 - ₹890'
            }
          ]
        };
      }
    } else if (mode.includes('bus')) {
      return {
        modeName: 'Bus',
        icon: 'fa-bus',
        badge: 'Intercity Bus',
        heading: `Bus & Coach Recommendations: ${fromCity} ➔ ${toCity}`,
        sub: `Multi-Axle AC Sleepers, live GPS route tracking & hygienically sanitized luxury coaches`,
        tip: `Upper berths give complete quiet privacy, while lower berths offer easy boarding. Verified highway meal stops around 11:30 PM.`,
        options: [
          {
            badge: 'Top Luxury · 4.8 ★',
            badgeClass: 'blue',
            name: 'KSRTC / SETC Multi-Axle Volvo 9600',
            meta: 'Airawat Club Class AC Sleeper (2+1)',
            depart: '10:00 PM',
            arrive: '05:30 AM',
            dur: '7h 30m Overnight',
            chips: ['Calf Rest Berth', 'Packaged Blanket & Water', 'Live GPS Link'],
            price: '₹950'
          },
          {
            badge: 'Smart Coach · 4.7 ★',
            badgeClass: 'amber',
            name: 'IntrCity SmartBus Premium',
            meta: 'Luxury AC Sleeper with Onboard Washroom',
            depart: '10:45 PM',
            arrive: '06:15 AM',
            dur: '7h 30m Direct',
            chips: ['In-bus Restroom', 'Wakeup Call Alarm', 'Lounge Boarding Access'],
            price: '₹1,150'
          },
          {
            badge: 'Value Sleeper · 4.5 ★',
            badgeClass: '',
            name: 'Zingbus Electric / Greenline',
            meta: 'Eco-Friendly AC Sleeper & Semi-Sleeper',
            depart: '11:15 PM',
            arrive: '06:45 AM',
            dur: '7h 30m Direct',
            chips: ['USB Fast Charge', 'Sanitized Linen', '20% On-time Refund'],
            price: '₹799'
          }
        ]
      };
    } else if (mode.includes('car') || mode.includes('cab')) {
      return {
        modeName: 'Car / Cab',
        icon: 'fa-car',
        badge: 'Road Trip & Cabs',
        heading: `Road Trip & Cab Suggestions: ${fromCity} ➔ ${toCity}`,
        sub: `National Expressway route navigation, FASTag automated toll guide & chauffeur/self-drive options`,
        tip: `Take National Expressway (NH44 / NH48). 100% FASTag automated toll plazas. High-standard 24/7 food court plazas every 45 km.`,
        options: [
          {
            badge: 'Couples & Small Families · 4.9 ★',
            badgeClass: 'blue',
            name: 'Prime Sedan (Dzire / Etios)',
            meta: 'Dedicated Highway Chauffeur · Up to 4 Pax',
            depart: 'Doorstep Pickup',
            arrive: 'Direct Drop',
            dur: 'Flexible Timings',
            chips: ['AC Sedan', 'Luggage Boot 2 Bags', 'Driver Allowance Included'],
            price: '₹13 / km (Est. ₹3,200)'
          },
          {
            badge: 'Family & Luxury · 4.8 ★',
            badgeClass: 'amber',
            name: 'Innova Crysta / Toyota Hycross',
            meta: 'Spacious 6-7 Seater Luxury MUV',
            depart: 'Doorstep Pickup',
            arrive: 'Direct Drop',
            dur: 'Mountain / Highway',
            chips: ['Captain Seats', 'Roof Carrier', 'Supreme Suspension Comfort'],
            price: '₹19 / km (Est. ₹4,900)'
          },
          {
            badge: 'Self-Drive Freedom · 4.6 ★',
            badgeClass: '',
            name: 'Self-Drive Rental (Zoomcar / Revv)',
            meta: 'Unlimited Kilometers · Zero Security Deposit',
            depart: 'Self Pick / Drop',
            arrive: 'Full Independence',
            dur: '24-Hour Rental',
            chips: ['Zero Deposit', 'Complete Privacy', 'Roadside Assistance 24/7'],
            price: '₹2,200 / day'
          }
        ]
      };
    } else {
      // Cruise / Ferry
      return {
        modeName: 'Cruise / Ferry',
        icon: 'fa-ship',
        badge: 'Ocean Voyages',
        heading: `Cruise & Ferry Recommendations: ${fromCity} ➔ ${toCity}`,
        sub: `Luxury multi-deck ocean liners, island catamaran ferries, staterooms & all-inclusive sunset dining`,
        tip: `Arrive at cruise / port terminal 2 hours before departure. Valid passport/photo ID required at security boarding.`,
        options: [
          {
            badge: 'Luxury Ocean Liner · 4.9 ★',
            badgeClass: 'blue',
            name: isOverseas ? 'Royal Caribbean / Spectrum of the Seas' : 'Cordelia Cruises (The Empress)',
            meta: 'Multi-Deck Luxury Stateroom Cruise',
            depart: '04:00 PM Sailing',
            arrive: '08:00 AM Docking',
            dur: '2 Nights / 3 Days',
            chips: ['All-Inclusive Buffet', 'Broadway Theatrical Shows', 'Sunset Pool Deck'],
            price: isOverseas ? '₹36,500' : '₹24,000'
          },
          {
            badge: 'Island High-Speed · 4.7 ★',
            badgeClass: 'amber',
            name: 'Catamaran High-Speed Island Ferry',
            meta: 'Air-Conditioned Premium Panoramic Lounge',
            depart: 'Morning & Sunset',
            arrive: 'Island Port',
            dur: '1h 45m Voyage',
            chips: ['Ocean View Glass Windows', 'Sun Deck Access', 'Snack Bar'],
            price: '₹2,800'
          },
          {
            badge: 'Sunset Voyage · 4.6 ★',
            badgeClass: '',
            name: 'Harbor Dinner & Skyline Cruise',
            meta: 'Evening 3-Course Dinner Sail',
            depart: '06:30 PM',
            arrive: '09:30 PM',
            dur: '3h Scenic Voyage',
            chips: ['Live Acoustic Music', '3-Course Gourmet Dinner', 'City Skyline Views'],
            price: '₹3,450'
          }
        ]
      };
    }
  }

  // --- Render Transport Suggestions UI ---
  function renderTransportSuggestions(fromInput, toInput, modeInput) {
    const data = getTransportSuggestionsData(fromInput, toInput, modeInput);

    const iconBox = document.getElementById('tSuggestIconBox');
    const headingText = document.getElementById('tSuggestHeadingText');
    const badgeEl = document.getElementById('tSuggestBadge');
    const subEl = document.getElementById('tSuggestSub');
    const tipText = document.getElementById('tSuggestTipText');
    const gridEl = document.getElementById('tSuggestGrid');
    const switcher = document.getElementById('tModeSwitcher');

    if (iconBox) iconBox.innerHTML = `<i class="fa-solid ${data.icon}"></i>`;
    if (headingText) headingText.textContent = data.heading;
    if (badgeEl) badgeEl.textContent = data.badge;
    if (subEl) subEl.textContent = data.sub;
    if (tipText) tipText.textContent = data.tip;

    // Update active state on switcher buttons
    if (switcher) {
      switcher.querySelectorAll('.t-switcher-btn').forEach(btn => {
        const btnMode = btn.dataset.mode.toLowerCase();
        const currentMode = data.modeName.toLowerCase();
        if (currentMode.includes(btnMode) || btnMode.includes(currentMode)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    if (gridEl) {
      gridEl.innerHTML = '';
      data.options.forEach(opt => {
        const card = document.createElement('div');
        card.className = 't-item-card animated-refresh';
        card.innerHTML = `
          <div class="t-item-badge ${opt.badgeClass || ''}">${opt.badge}</div>
          <div class="t-item-header">
            <div class="t-item-icon">
              <i class="fa-solid ${data.icon}"></i>
            </div>
            <div>
              <div class="t-item-name">${opt.name}</div>
              <div class="t-item-meta">${opt.meta}</div>
            </div>
          </div>
          <div class="t-item-timing">
            <div>
              <strong>${opt.depart}</strong>
              <span>Dep</span>
            </div>
            <div style="text-align: center; color: #1877f2; font-weight: 700;">
              <i class="fa-solid fa-arrow-right"></i><br>
              <span style="font-size: 10px; color: #64748b;">${opt.dur}</span>
            </div>
            <div style="text-align: right;">
              <strong>${opt.arrive}</strong>
              <span>Arr</span>
            </div>
          </div>
          <div class="t-item-chips">
            ${opt.chips.map(c => `<span class="t-item-chip"><i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 9px;"></i> ${c}</span>`).join('')}
          </div>
          <div class="t-item-footer">
            <div class="t-item-price-box">
              <span class="t-item-price-label">Starting From</span>
              <span class="t-item-price">${opt.price}</span>
            </div>
            <button type="button" class="t-item-book-btn" onclick="switchPage('transport'); showToast('Opening ticket bookings for ${opt.name}!');">
              Select & Book <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        `;
        gridEl.appendChild(card);
      });
    }
  }
  window.renderTransportSuggestions = renderTransportSuggestions;

  // --- Attach Mode Switcher Click Listeners ---
  const tModeSwitcher = document.getElementById('tModeSwitcher');
  if (tModeSwitcher) {
    tModeSwitcher.addEventListener('click', (e) => {
      const btn = e.target.closest('.t-switcher-btn');
      if (!btn) return;
      const targetMode = btn.dataset.mode;
      const fromVal = document.getElementById('fromInput') ? document.getElementById('fromInput').value : 'Chennai (MAA)';
      const toVal = document.getElementById('toInput') ? document.getElementById('toInput').value : 'Singapore (SIN)';
      
      const modeInput = document.getElementById('modeInput');
      if (modeInput) modeInput.value = targetMode;
      if (typeof window.updateTransportModeUI === 'function') {
        window.updateTransportModeUI(targetMode);
      }
      
      renderTransportSuggestions(fromVal, toVal, targetMode);
      showToast(`Showing ${targetMode} suggestions for ${extractCityName(toVal)}!`);
    });
  }

  // --- Search Button Click (Dynamic Suggestions Engine & Smooth Scroll) ---
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener('click', () => {
      const fromVal = document.getElementById('fromInput') ? document.getElementById('fromInput').value : 'Chennai (MAA)';
      const toVal = document.getElementById('toInput') ? document.getElementById('toInput').value : 'Singapore (SIN)';
      const modeVal = document.getElementById('modeInput') ? document.getElementById('modeInput').value : 'Flight';

      // Update both sections dynamically in real-time
      renderPopularDestinations(toVal);
      renderTransportSuggestions(fromVal, toVal, modeVal);

      // Smooth scroll to suggestions view
      const targetSec = document.getElementById('transportSuggestionsSection') || document.getElementById('popularDestinationsSection');
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      showToast(`✨ Generated popular spots & ${modeVal} suggestions for ${extractCityName(toVal)}!`);
    });
  }

  // Live callback when user selects or types a new destination
  window.onSearchDestinationChanged = (newDest) => {
    const fromVal = document.getElementById('fromInput') ? document.getElementById('fromInput').value : 'Chennai (MAA)';
    const modeVal = document.getElementById('modeInput') ? document.getElementById('modeInput').value : 'Flight';
    renderPopularDestinations(newDest);
    renderTransportSuggestions(fromVal, newDest, modeVal);
  };

  // Live callback when user selects a new origin
  window.onSearchOriginChanged = (newOrigin) => {
    const toVal = document.getElementById('toInput') ? document.getElementById('toInput').value : 'Singapore (SIN)';
    const modeVal = document.getElementById('modeInput') ? document.getElementById('modeInput').value : 'Flight';
    renderTransportSuggestions(newOrigin, toVal, modeVal);
  };

  // Live callback when transport mode is changed
  window.onSearchModeChanged = (newMode) => {
    const fromVal = document.getElementById('fromInput') ? document.getElementById('fromInput').value : 'Chennai (MAA)';
    const toVal = document.getElementById('toInput') ? document.getElementById('toInput').value : 'Singapore (SIN)';
    renderTransportSuggestions(fromVal, toVal, newMode);
  };

  // Event delegation on destinations layout for cards & stay discounts
  const popularDestLayout = document.getElementById('popularDestLayout');
  if (popularDestLayout) {
    popularDestLayout.addEventListener('click', (e) => {
      const card = e.target.closest('.dest-card');
      if (card) {
        const placeName = card.querySelector('h3') ? card.querySelector('h3').innerText.trim() : 'Destination';
        switchPage('accommodation');
        const accDestInput = document.getElementById('accDestInput');
        if (accDestInput) accDestInput.value = `${placeName}, ${window.currentPopularCity || 'Singapore'}`;
        showToast(`Showing verified hotels & stays near ${placeName}`);
        return;
      }

      const hotelBtn = e.target.closest('#exploreHotelsBtn');
      if (hotelBtn) {
        const destCity = window.currentPopularCity || 'Singapore';
        switchPage('accommodation');
        const accDestInput = document.getElementById('accDestInput');
        if (accDestInput) accDestInput.value = destCity;
        showToast(`Opening 50% Off Special Hotel Deals in ${destCity}! 🏨`);
        return;
      }
    });
  }

  // Initialize both sections immediately on page load
  setTimeout(() => {
    const initialFrom = document.getElementById('fromInput') ? document.getElementById('fromInput').value : 'Chennai (MAA)';
    const initialTo = document.getElementById('toInput') ? document.getElementById('toInput').value : 'Singapore (SIN)';
    const initialMode = document.getElementById('modeInput') ? document.getElementById('modeInput').value : 'Flight';
    renderPopularDestinations(initialTo);
    renderTransportSuggestions(initialFrom, initialTo, initialMode);
  }, 100);

  const exploreHotelsBtn = document.getElementById('exploreHotelsBtn');
  if (exploreHotelsBtn) {
    exploreHotelsBtn.addEventListener('click', () => {
      switchPage('accommodation');
      showToast('Opening 50% Off Special Hotel & Accommodation Deals! 🏨');
    });
  }


  // --- Travel Quiz Modal Logic ---
  const quizModal = document.getElementById('quizModal');
  const topQuizBtn = document.getElementById('topQuizBtn');
  const startQuizBtn = document.getElementById('startQuizBtn');
  const closeQuizModal = document.getElementById('closeQuizModal');
  const prevStepBtn = document.getElementById('prevStepBtn');
  const nextStepBtn = document.getElementById('nextStepBtn');
  const quizResult = document.getElementById('quizResult');
  const quizModalFooter = document.getElementById('quizModalFooter');

  let currentQuizStep = 1;

  function openQuiz() {
    currentQuizStep = 1;
    updateQuizStepView();
    if (quizModal) {
      quizModal.style.display = 'flex';
      quizModal.classList.add('open');
    }
  }

  function closeQuiz() {
    if (quizModal) {
      quizModal.style.display = 'none';
      quizModal.classList.remove('open');
    }
  }

  function updateQuizStepView() {
    const steps = document.querySelectorAll('.quiz-step');
    steps.forEach(step => {
      if (parseInt(step.dataset.step) === currentQuizStep) {
        step.classList.add('active');
        step.style.display = 'block';
      } else {
        step.classList.remove('active');
        step.style.display = 'none';
      }
    });

    if (currentQuizStep > 1 && currentQuizStep <= 3) {
      prevStepBtn.style.visibility = 'visible';
    } else {
      prevStepBtn.style.visibility = 'hidden';
    }

    if (currentQuizStep === 3) {
      nextStepBtn.innerText = 'See Recommendation';
    } else {
      nextStepBtn.innerText = 'Next Step';
    }

    if (currentQuizStep > 3) {
      steps.forEach(step => step.style.display = 'none');
      quizResult.style.display = 'block';
      quizModalFooter.style.display = 'none';
    } else {
      quizResult.style.display = 'none';
      quizModalFooter.style.display = 'flex';
    }
  }

  if (topQuizBtn) topQuizBtn.addEventListener('click', openQuiz);
  if (startQuizBtn) startQuizBtn.addEventListener('click', openQuiz);
  if (closeQuizModal) closeQuizModal.addEventListener('click', closeQuiz);
  if (quizModal) {
    quizModal.addEventListener('click', (e) => {
      if (e.target === quizModal) closeQuiz();
    });
  }

  if (prevStepBtn) {
    prevStepBtn.addEventListener('click', () => {
      if (currentQuizStep > 1) {
        currentQuizStep--;
        updateQuizStepView();
      }
    });
  }

  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', () => {
      if (currentQuizStep <= 3) {
        currentQuizStep++;
        updateQuizStepView();
      }
    });
  }

  const viewBaliBtn = document.getElementById('viewBaliBtn');
  if (viewBaliBtn) {
    viewBaliBtn.addEventListener('click', () => {
      closeQuiz();
      showToast('Redirecting to Bali travel packages!');
    });
  }

  // --- Page Switcher Logic (Navbar & Mobile Drawer Links) ---
  const navLinks = document.querySelectorAll('.nav-link');
  const drawerLinks = document.querySelectorAll('.drawer-link');
  const pageViews = document.querySelectorAll('.page-view');
  const brandLogo = document.querySelector('.nav-brand');

  // Delegate click for any element with data-nav attribute
  document.addEventListener('click', (e) => {
    const navElem = e.target.closest('[data-nav]');
    if (navElem) {
      e.preventDefault();
      const targetNav = navElem.dataset.nav;
      if (targetNav) {
        if (typeof closeDrawerMenu === 'function') closeDrawerMenu();
        switchPage(targetNav);
      }
    }
  });

  if (brandLogo) {
    brandLogo.addEventListener('click', () => {
      switchPage('home');
    });
  }


    // --- Transport Mode Pill Selection & Dynamic Results Engine ---
  const tModePills = document.querySelectorAll('.t-mode-pill');
  const tTimeGroup = document.getElementById('tTimeGroup');
  const tReturnGroup = document.getElementById('tReturnGroup');
  const tTravelerGroup = document.getElementById('tTravelerGroup');
  const tTravelerLabel = tTravelerGroup ? tTravelerGroup.querySelector('label') : null;

  // Traveler state for Transport page
  let tTravelerCounts = { adults: 2, children: 0 };

  function updateTTravelerUI() {
    const adultCountEl = document.getElementById('tAdultCount');
    const childCountEl = document.getElementById('tChildCount');
    const tTravelerInput = document.getElementById('tTravelerInput');
    const adultMinus = document.getElementById('tAdultMinus');
    const childMinus = document.getElementById('tChildMinus');

    if (adultCountEl) adultCountEl.textContent = tTravelerCounts.adults;
    if (childCountEl) childCountEl.textContent = tTravelerCounts.children;
    if (adultMinus) adultMinus.disabled = tTravelerCounts.adults <= 1;
    if (childMinus) childMinus.disabled = tTravelerCounts.children <= 0;

    const parts = [];
    parts.push(tTravelerCounts.adults === 1 ? '1 Adult' : `${tTravelerCounts.adults} Adults`);
    if (tTravelerCounts.children > 0) {
      parts.push(tTravelerCounts.children === 1 ? '1 Child' : `${tTravelerCounts.children} Children`);
    }
    const res = parts.join(', ');
    if (tTravelerInput) tTravelerInput.value = res;
    const badge = document.getElementById('tCurrentPaxBadge');
    if (badge) badge.innerHTML = `<i class="fa-solid fa-user"></i> ${res}`;
  }

  // Setup Date and Traveler Dropdown Controls for Transport Page
  function setupTransportInputControls() {
    // Departure date picker
    const tDepartNative = document.getElementById('tDepartDateNative');
    const tDepartInput = document.getElementById('tDepartInput');
    if (tDepartNative && tDepartInput) {
      tDepartNative.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          const d = new Date(val);
          const formatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          tDepartInput.value = formatted;
          const b = document.getElementById('tCurrentDateBadge');
          if (b) b.innerHTML = `<i class="fa-regular fa-calendar"></i> ${formatted}`;
          showToast(`Departure Date set to: ${formatted}`);
        }
      });
    }

    // Departure preset chips
    document.querySelectorAll('.date-chip[data-target="depart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const days = parseInt(btn.dataset.days || '0', 10);
        const d = new Date();
        d.setDate(d.getDate() + days);
        const formatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        if (tDepartInput) tDepartInput.value = formatted;
        const b = document.getElementById('tCurrentDateBadge');
        if (b) b.innerHTML = `<i class="fa-regular fa-calendar"></i> ${formatted}`;
        const menu = btn.closest('.dropdown-menu');
        if (menu) menu.classList.remove('show');
        showToast(`Departure set: ${formatted}`);
      });
    });

    // Return date picker
    const tReturnNative = document.getElementById('tReturnDateNative');
    const tReturnInput = document.getElementById('tReturnInput');
    if (tReturnNative && tReturnInput) {
      tReturnNative.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          const d = new Date(val);
          const formatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          tReturnInput.value = formatted;
          showToast(`Return Date set to: ${formatted}`);
        }
      });
    }

    // Return preset chips
    document.querySelectorAll('.date-chip[data-target="return"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const days = parseInt(btn.dataset.days || '7', 10);
        const d = new Date();
        d.setDate(d.getDate() + days);
        const formatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        if (tReturnInput) tReturnInput.value = formatted;
        const menu = btn.closest('.dropdown-menu');
        if (menu) menu.classList.remove('show');
        showToast(`Return set: ${formatted}`);
      });
    });

    // Traveler controls
    const adultMinus = document.getElementById('tAdultMinus');
    const adultPlus = document.getElementById('tAdultPlus');
    const childMinus = document.getElementById('tChildMinus');
    const childPlus = document.getElementById('tChildPlus');
    const applyBtn = document.getElementById('tApplyTravelersBtn');

    if (adultMinus) {
      adultMinus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tTravelerCounts.adults > 1) {
          tTravelerCounts.adults--;
          updateTTravelerUI();
        }
      });
    }
    if (adultPlus) {
      adultPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tTravelerCounts.adults < 9) {
          tTravelerCounts.adults++;
          updateTTravelerUI();
        }
      });
    }
    if (childMinus) {
      childMinus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tTravelerCounts.children > 0) {
          tTravelerCounts.children--;
          updateTTravelerUI();
        }
      });
    }
    if (childPlus) {
      childPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tTravelerCounts.children < 6) {
          tTravelerCounts.children++;
          updateTTravelerUI();
        }
      });
    }

    // Traveler preset chips
    document.querySelectorAll('.preset-chip[data-t-adults]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        tTravelerCounts.adults = parseInt(chip.dataset.tAdults || '1', 10);
        tTravelerCounts.children = parseInt(chip.dataset.tChild || '0', 10);
        document.querySelectorAll('.preset-chip[data-t-adults]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        updateTTravelerUI();
      });
    });

    if (applyBtn) {
      applyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('tTravelerDropdown');
        if (dropdown) dropdown.classList.remove('show');
        if (tTravelerGroup) tTravelerGroup.classList.remove('active-dropdown');
        showToast(`Updated to ${document.getElementById('tTravelerInput')?.value}`);
      });
    }
  }

  // --- Dynamic Transport Mode Card Render Engine ---
  const MOCK_TRANSPORT_DATA = {
    Flights: [
      {
        operator: 'IndiGo Airlines',
        code: '6E-204',
        icon: 'fa-plane',
        badge: 'Lowest Price',
        fromTime: '06:15',
        toTime: '07:20',
        duration: '1h 05m',
        type: 'Non-stop Flight',
        features: ['Cabin 7kg included', '98% On-time', 'Free Web Check-in', 'Snacks on Board'],
        price: '₹3,449'
      },
      {
        operator: 'Air India',
        code: 'AI-542',
        icon: 'fa-plane-departure',
        badge: 'Complimentary Meal',
        fromTime: '09:40',
        toTime: '10:55',
        duration: '1h 15m',
        type: 'Non-stop Flight',
        features: ['25kg Baggage', 'Hot Meals Included', 'Spacious Legroom'],
        price: '₹4,120'
      },
      {
        operator: 'Akasa Air',
        code: 'QP-1314',
        icon: 'fa-plane-up',
        badge: 'Top Rated',
        fromTime: '14:20',
        toTime: '15:25',
        duration: '1h 05m',
        type: 'Non-stop Flight',
        features: ['USB Fast Charging', 'Eco-friendly Fleet', 'Pet Friendly'],
        price: '₹3,680'
      },
      {
        operator: 'Vistara',
        code: 'UK-832',
        icon: 'fa-plane',
        badge: 'Premium Cabin',
        fromTime: '18:50',
        toTime: '20:05',
        duration: '1h 15m',
        type: 'Non-stop Flight',
        features: ['Premium Economy', 'Star Alliance Perks', 'Gourmet Dining'],
        price: '₹4,890'
      }
    ],
    Trains: [
      {
        operator: 'Vande Bharat Express',
        code: 'Train #20608',
        icon: 'fa-train-subway',
        badge: 'Fastest Train',
        fromTime: '05:50',
        toTime: '10:20',
        duration: '4h 30m',
        type: 'AC Chair Car & Executive',
        features: ['Bio Vacuum Toilets', 'Rotational Seats', 'Hot Meals Served', 'Free Wi-Fi'],
        price: '₹965'
      },
      {
        operator: 'Shatabdi Express',
        code: 'Train #12028',
        icon: 'fa-train',
        badge: 'Popular Express',
        fromTime: '06:00',
        toTime: '11:00',
        duration: '5h 00m',
        type: 'Chair Car (CC) / EC',
        features: ['Breakfast Included', 'Daily Service', 'Mobile Charging Ports'],
        price: '₹745'
      },
      {
        operator: 'Brindavan Superfast Express',
        code: 'Train #12639',
        icon: 'fa-train',
        badge: 'Budget Friendly',
        fromTime: '07:40',
        toTime: '13:40',
        duration: '6h 00m',
        type: 'Second Seating (2S) / CC',
        features: ['Scenic Journey', 'Pantry Car', 'Daily Service'],
        price: '₹195'
      },
      {
        operator: 'Chennai Mail Superfast',
        code: 'Train #12657',
        icon: 'fa-train-tram',
        badge: 'Overnight Sleeper',
        fromTime: '23:15',
        toTime: '04:30',
        duration: '5h 15m',
        type: '1A / 2A / 3A / SL',
        features: ['Clean Bedrolls', 'Quiet Hours', 'Early Morning Arrival'],
        price: '₹480'
      }
    ],
    Buses: [
      {
        operator: 'Tamil Nadu Government (MTC)',
        code: 'Route M70 / 500',
        icon: 'fa-bus-simple',
        badge: 'Govt Verified Route',
        fromTime: '05:30',
        toTime: '06:45',
        duration: '1h 15m',
        type: 'Deluxe Express',
        features: ['ChennaiGTFS Verified', 'Every 10 Mins', 'Cash & Chalo Card', 'Direct Route'],
        price: '₹22'
      },
      {
        operator: 'KPN Travels',
        code: 'Multi-Axle Volvo',
        icon: 'fa-bus',
        badge: 'Luxury Sleeper',
        fromTime: '22:00',
        toTime: '05:30',
        duration: '7h 30m',
        type: 'AC Sleeper 2+1',
        features: ['Blankets & Water', 'Charging Ports', 'Live GPS Tracking', 'Emergency SOS'],
        price: '₹750'
      },
      {
        operator: 'SRS Travels',
        code: 'Scania Metrolink',
        icon: 'fa-bus',
        badge: 'High Rating',
        fromTime: '23:15',
        toTime: '06:15',
        duration: '7h 00m',
        type: 'Multi-Axle Semi-Sleeper',
        features: ['Air Suspension', 'Reading Lamps', 'Spacious Legroom'],
        price: '₹680'
      },
      {
        operator: 'TNSTC Ultra Deluxe',
        code: 'SETC Govt Classic',
        icon: 'fa-bus-simple',
        badge: 'State Transport',
        fromTime: '21:30',
        toTime: '05:00',
        duration: '7h 30m',
        type: 'Pushback 2+2 Seat',
        features: ['Govt Fixed Fare', 'Punctual Departure', 'Safe Driving'],
        price: '₹420'
      }
    ],
    Cabs: [
      {
        operator: 'Sutriva Go (City Cab)',
        code: 'Instant Doorstep',
        icon: 'fa-taxi',
        badge: 'Fastest ETA: 3 min',
        fromTime: 'Now',
        toTime: 'Drop-off',
        duration: '25 - 35m',
        type: 'Compact AC Hatchback',
        features: ['Clean & Sanitized', 'Zero Cancellation Fee', 'No Surge Pricing', 'Verified Driver'],
        price: '₹280'
      },
      {
        operator: 'Sutriva Prime Sedan',
        code: 'Dzire / Etios',
        icon: 'fa-car-side',
        badge: 'Top Rated Drivers',
        fromTime: 'Now',
        toTime: 'Drop-off',
        duration: '25 - 35m',
        type: 'Premium Sedan',
        features: ['Extra Legroom', 'Free In-Cab Wi-Fi', 'Quiet Ride Option', 'Complimentary Water'],
        price: '₹390'
      },
      {
        operator: 'Sutriva Outstation XL',
        code: 'Innova Crysta',
        icon: 'fa-van-shuttle',
        badge: '6-Seater Family',
        fromTime: 'On-Demand',
        toTime: 'Flexible Drop',
        duration: 'Outstation Ready',
        type: '6+1 Luxury SUV',
        features: ['Huge Luggage Space', 'Roof Carrier', 'Highway Toll Assist', 'Dual AC'],
        price: '₹1,250'
      },
      {
        operator: 'Auto / E-Rickshaw Express',
        code: 'City Commute',
        icon: 'fa-motorcycle',
        badge: 'Budget Quick Trip',
        fromTime: 'Now',
        toTime: 'Drop-off',
        duration: '20 - 30m',
        type: '3-Wheeler Auto',
        features: ['Bypass Traffic', 'Meter Standard Fare', 'Digital UPI Payment'],
        price: '₹110'
      }
    ],
    'Car Rentals': [
      {
        operator: 'Mahindra Thar 4x4 (Self-Drive)',
        code: 'Sutriva Rentals',
        icon: 'fa-truck-monster',
        badge: 'Adventure Ready',
        fromTime: '09:00 AM',
        toTime: '24h Rental',
        duration: 'Full Day',
        type: 'Convertible Hardtop',
        features: ['Unlimited KMs', 'Zero Security Deposit', 'Comprehensive Insurance', 'GPS Navigation'],
        price: '₹2,899/day'
      },
      {
        operator: 'Hyundai Creta Automatic',
        code: 'Sutriva Fleet',
        icon: 'fa-car',
        badge: 'Comfort Cruise',
        fromTime: 'Flexible',
        toTime: '24h Rental',
        duration: 'Full Day',
        type: 'Automatic 5-Seater SUV',
        features: ['Sunroof', 'Touchscreen Infotainment', 'Free Doorstep Delivery', '24/7 Roadside Assist'],
        price: '₹2,499/day'
      },
      {
        operator: 'Maruti Suzuki Swift',
        code: 'Economy Drive',
        icon: 'fa-car-side',
        badge: 'Best Value',
        fromTime: 'Flexible',
        toTime: '24h Rental',
        duration: 'Full Day',
        type: 'Manual Hatchback',
        features: ['22 km/l Mileage', 'Easy City Parking', 'Free Sanitization'],
        price: '₹1,299/day'
      }
    ],
    Ferries: [
      {
        operator: 'Makruzz Gold Catamaran',
        code: 'High Speed Cruise',
        icon: 'fa-ship',
        badge: 'Fastest Sea Route',
        fromTime: '08:00',
        toTime: '09:30',
        duration: '1h 30m',
        type: 'Deluxe AC Passenger Boat',
        features: ['Panoramic Windows', 'Snack Bar Onboard', 'Life Jackets & Coast Guard Certified'],
        price: '₹1,250'
      },
      {
        operator: 'Green Ocean Ferry',
        code: 'Open Deck Cruiser',
        icon: 'fa-sailboat',
        badge: 'Scenic Open Deck',
        fromTime: '13:00',
        toTime: '15:15',
        duration: '2h 15m',
        type: 'Open View Ferry',
        features: ['Open Deck Access', 'Music & Refreshments', 'Ideal for Photography'],
        price: '₹950'
      }
    ],
    'Bike/Scooter': [
      {
        operator: 'Royal Enfield Hunter 350',
        code: 'Sutriva Moto',
        icon: 'fa-motorcycle',
        badge: 'Tourer Choice',
        fromTime: 'Instant',
        toTime: 'Daily / Weekly',
        duration: 'Per 24h',
        type: '350cc Cruiser',
        features: ['2 ISI Helmets Included', 'Phone Mount & Charger', 'Emergency Roadside Assist'],
        price: '₹850/day'
      },
      {
        operator: 'Honda Activa 6G',
        code: 'City Scooter',
        icon: 'fa-moped',
        badge: 'Easy Commute',
        fromTime: 'Instant',
        toTime: 'Daily / Weekly',
        duration: 'Per 24h',
        type: '110cc Automatic Scooter',
        features: ['55 km/l Economy', 'Keyless Ignition', 'Spacious Boot Space'],
        price: '₹399/day'
      },
      {
        operator: 'Ather 450X Gen 3 (EV)',
        code: 'Green Ride',
        icon: 'fa-bolt',
        badge: 'Zero Emission',
        fromTime: 'Instant',
        toTime: 'Daily / Weekly',
        duration: 'Per 24h',
        type: 'Electric Smart Scooter',
        features: ['Free Grid Charging', 'Touchscreen GPS Maps', 'Warp Mode 90 km/h'],
        price: '₹499/day'
      }
    ],
    More: [
      {
        operator: 'Chennai Metro Rail (CMRL)',
        code: 'Green / Blue Lines',
        icon: 'fa-train-subway',
        badge: 'Zero Traffic',
        fromTime: 'Every 5 min',
        toTime: 'All Day',
        duration: '15 - 20m',
        type: 'Rapid Metro Transit',
        features: ['Air Conditioned Coaches', 'Direct Koyambedu Station to Vadapalani Station', 'Token & Card Accepted'],
        price: '₹20 - ₹40'
      },
      {
        operator: 'Airport Electric Express Shuttle',
        code: 'MTC Route 18E',
        icon: 'fa-van-shuttle',
        badge: 'Direct Airport Link',
        fromTime: 'Every 20 min',
        toTime: 'Terminal Drop',
        duration: '35m',
        type: 'Low-Floor AC EV Bus',
        features: ['Luggage Racks', 'Direct Terminal 1 & 2', 'Priority Seating'],
        price: '₹120'
      }
    ]
  };

  function renderTransportResults(mode, queryFrom, queryTo) {
    const resultsSec = document.getElementById('transportResultsSection');
    const badge = document.getElementById('tResultsBadge');
    const title = document.getElementById('tResultsTitle');
    const subtitle = document.getElementById('tResultsSubtitle');
    const modeBadge = document.getElementById('tCurrentModeBadge');
    const routeBadge = document.getElementById('tCurrentRouteBadge');
    const countEl = document.getElementById('tResultsCount');
    const grid = document.getElementById('tResultsGrid');

    if (!grid) return;

    const fromVal = queryFrom || (document.getElementById('tFromInput') ? document.getElementById('tFromInput').value : 'Chennai');
    const toVal = queryTo || (document.getElementById('tToInput') ? document.getElementById('tToInput').value : 'Bangalore');
    const fromClean = fromVal.replace(/\s*\(.*?\)/, '').trim() || 'Origin';
    const toClean = toVal.replace(/\s*\(.*?\)/, '').trim() || 'Destination';

    const cleanMode = mode || 'Flights';
    const dataList = MOCK_TRANSPORT_DATA[cleanMode] || MOCK_TRANSPORT_DATA['Flights'];

    if (badge) badge.innerHTML = `<i class="fa-solid fa-${cleanMode === 'Trains' ? 'train' : cleanMode === 'Buses' ? 'bus' : cleanMode === 'Cabs' ? 'taxi' : cleanMode === 'Car Rentals' ? 'car' : cleanMode === 'Bike/Scooter' ? 'motorcycle' : cleanMode === 'Ferries' ? 'ship' : 'plane'}"></i> Verified Available Options`;
    if (title) title.textContent = `Available ${cleanMode}: ${fromClean} ➔ ${toClean}`;
    if (subtitle) subtitle.textContent = `Compare verified live schedules, operator ratings, and instant booking options`;
    if (modeBadge) modeBadge.innerHTML = `<i class="fa-solid fa-compass"></i> Mode: ${cleanMode}`;
    if (routeBadge) routeBadge.innerHTML = `<i class="fa-solid fa-route"></i> ${fromClean} ➔ ${toClean}`;
    if (countEl) countEl.textContent = `Showing ${dataList.length} verified options`;

    grid.innerHTML = dataList.map(item => `
      <div class="t-card">
        <div>
          <div class="t-card-top">
            <div class="t-card-operator">
              <div class="t-operator-logo">
                <i class="fa-solid ${item.icon}"></i>
              </div>
              <div>
                <div class="t-operator-name">${item.operator}</div>
                <div class="t-operator-sub">${item.code} • ${item.type}</div>
              </div>
            </div>
            <span class="t-card-badge">${item.badge}</span>
          </div>

          <div class="t-card-route-row">
            <div class="t-time-point">
              <div class="t-time-val">${item.fromTime}</div>
              <div class="t-time-city">${fromClean}</div>
            </div>
            <div class="t-route-mid">
              <span class="t-duration-pill">${item.duration}</span>
              <div class="t-route-line"></div>
              <span style="font-size:10px; color:#64748b; font-weight:600;">Direct Route</span>
            </div>
            <div class="t-time-point t-time-right">
              <div class="t-time-val">${item.toTime}</div>
              <div class="t-time-city">${toClean}</div>
            </div>
          </div>

          <div class="t-card-features">
            ${item.features.map(f => `<span class="t-feat-tag"><i class="fa-solid fa-circle-check text-green"></i> ${f}</span>`).join('')}
          </div>
        </div>

        <div class="t-card-bottom">
          <div class="t-card-price-col">
            <span class="t-price-from">Fare estimate</span>
            <strong class="t-price-amount">${item.price}</strong>
          </div>
          <button class="t-book-btn" onclick="bookTransportItem('${item.operator}', '${item.price}', '${cleanMode}')">
            <span>${cleanMode === 'Cabs' ? 'Book Cab' : cleanMode === 'Car Rentals' ? 'Reserve Car' : cleanMode === 'Bike/Scooter' ? 'Rent Bike' : cleanMode === 'Ferries' ? 'Book Ferry' : cleanMode === 'Trains' ? 'Book Train' : 'Book Now'}</span>
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Smooth scroll down to results section so user sees immediate feedback
    if (resultsSec) {
      resultsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  window.renderTransportResults = renderTransportResults;

  function bookTransportItem(title, price, mode) {
    showToast(`Proceeding to reserve ${title} (${price})! 🚀`);
    if (typeof window.openRazorpayModal === 'function') {
      window.openRazorpayModal(title, price);
    }
  }
  window.bookTransportItem = bookTransportItem;

  function setTransportMode(mode) {
    if (tModePills.length > 0) {
      tModePills.forEach(p => {
        if (p.dataset.tmode === mode) p.classList.add('active');
        else p.classList.remove('active');
      });
    }

    const fromVal = document.getElementById('tFromInput') ? document.getElementById('tFromInput').value : 'Chennai';
    const toVal = document.getElementById('tToInput') ? document.getElementById('tToInput').value : 'Bangalore';

    if (mode === 'Buses') {
      if (tTimeGroup) tTimeGroup.style.display = 'flex';
      if (tReturnGroup) tReturnGroup.style.display = 'none';
      if (tTravelerLabel) tTravelerLabel.textContent = 'Passengers / Seats';
      showToast('Bus Mode: Live MongoDB MTC & Intercity routes active! 🚌');

      // Populate government bus search fields
      const govtFrom = document.getElementById('govtBusFromInput');
      const govtTo = document.getElementById('govtBusToInput');
      if (govtFrom) govtFrom.value = fromVal.replace(/\s*\(.*?\)/, '').trim();
      if (govtTo) govtTo.value = toVal.replace(/\s*\(.*?\)/, '').trim();

      renderTransportResults('Buses', fromVal, toVal);
      if (typeof window.fetchGovernmentBuses === 'function') {
        window.fetchGovernmentBuses(true);
      }
    } else {
      if (tTimeGroup) tTimeGroup.style.display = 'none';
      if (tReturnGroup) tReturnGroup.style.display = 'flex';
      if (tTravelerLabel) tTravelerLabel.textContent = 'Travelers';
      showToast(`Showing verified ${mode} options`);
      renderTransportResults(mode, fromVal, toVal);
    }
  }
  window.setTransportMode = setTransportMode;

  tModePills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = pill.dataset.tmode || pill.innerText.trim();
      setTransportMode(mode);
    });
  });

  // Initialize input controls for transport
  setupTransportInputControls();

  // Time Dropdown and Custom Time Picker Interactions
  const tTimeInput = document.getElementById('tTimeInput');
  const tTimeDropdown = document.getElementById('tTimeDropdown');
  const tCustomTimePicker = document.getElementById('tCustomTimePicker');

  if (tTimeDropdown) {
    tTimeDropdown.querySelectorAll('.dropdown-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.dataset.value;
        const timeSlot = opt.dataset.time;
        if (tTimeInput) tTimeInput.value = val;
        tTimeDropdown.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        tTimeDropdown.classList.remove('show');
        if (tTimeGroup) tTimeGroup.classList.remove('active-dropdown');
        showToast(`Bus timing set to: ${val} ⏰`);

        // Sync with govt bus time pill if on page
        if (timeSlot) {
          const timePill = document.querySelector(`.govt-time-pill[data-time="${timeSlot}"]`);
          if (timePill) timePill.click();
        }
      });
    });
  }

  if (tCustomTimePicker && tTimeInput) {
    tCustomTimePicker.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        tTimeInput.value = `Exact Time: ${val}`;
        if (tTimeDropdown) tTimeDropdown.classList.remove('show');
        if (tTimeGroup) tTimeGroup.classList.remove('active-dropdown');
        showToast(`Bus timing set to ${val} ⏱️`);

        const hour = parseInt(val.split(':')[0], 10);
        let slot = 'morning';
        if (hour >= 12 && hour < 17) slot = 'afternoon';
        else if (hour >= 17 && hour < 21) slot = 'evening';
        else if (hour >= 21 || hour < 4) slot = 'night';

        const timePill = document.querySelector(`.govt-time-pill[data-time="${slot}"]`);
        if (timePill) timePill.click();
      }
    });
  }

  // Mode Card Click for Buses
  document.querySelectorAll('.mode-card[data-mode="buses"]').forEach(card => {
    card.addEventListener('click', () => {
      switchPage('transport');
      setTransportMode('Buses');
    });
  });

  // --- Transport Search Submit Button ---
  const tSearchSubmitBtn = document.getElementById('tSearchSubmitBtn');
  if (tSearchSubmitBtn) {
    tSearchSubmitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const fromVal = document.getElementById('tFromInput') ? document.getElementById('tFromInput').value : 'Chennai';
      const toVal = document.getElementById('tToInput') ? document.getElementById('tToInput').value : 'Bangalore';
      const activeModePill = document.querySelector('.t-mode-pill.active');
      const modeName = activeModePill ? (activeModePill.dataset.tmode || activeModePill.innerText.trim()) : 'Flights';

      showToast(`Searching ${modeName}: ${fromVal} ➔ ${toVal}...`);
      renderTransportResults(modeName, fromVal, toVal);

      if (modeName === 'Buses') {
        const govtFrom = document.getElementById('govtBusFromInput');
        const govtTo = document.getElementById('govtBusToInput');
        if (govtFrom) govtFrom.value = fromVal.replace(/\s*\(.*?\)/, '').trim();
        if (govtTo) govtTo.value = toVal.replace(/\s*\(.*?\)/, '').trim();
        if (typeof window.fetchGovernmentBuses === 'function') {
          window.fetchGovernmentBuses(true);
        }
      }
    });
  }

  // --- Transport Page Trio Buttons ---
  const planMultiCityBtn = document.getElementById('planMultiCityBtn');
  if (planMultiCityBtn) {
    planMultiCityBtn.addEventListener('click', () => {
      showToast('Opening Multi-City Route Builder...');
    });
  }

  const bookBestDealBtn = document.getElementById('bookBestDealBtn');
  if (bookBestDealBtn) {
    bookBestDealBtn.addEventListener('click', () => {
      showToast('Booking IndiGo — ₹4,250 Best Deal! ✈️');
    });
  }

  const setPriceAlertBtn = document.getElementById('setPriceAlertBtn');
  if (setPriceAlertBtn) {
    setPriceAlertBtn.addEventListener('click', () => {
      showToast('Live Price Alert set for Chennai ➔ Singapore! 🔔');
    });
  }

  const freedomStartBtn = document.getElementById('freedomStartBtn');
  if (freedomStartBtn) {
    freedomStartBtn.addEventListener('click', () => {
      showToast('Starting your journey with Sutriva!');
    });
  }

  // --- Accommodation Page Interactions ---
  const accPillBtns = document.querySelectorAll('.acc-pill-btn');
  accPillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      accPillBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const accType = btn.innerText.trim();
      showToast(`Filter Stays by: ${accType}`);
    });
  });

  const favoriteBtns = document.querySelectorAll('.favorite-btn');
  favoriteBtns.forEach(fBtn => {
    fBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const heartIcon = fBtn.querySelector('i');
      if (heartIcon.classList.contains('fa-regular')) {
        heartIcon.className = 'fa-solid fa-heart';
        heartIcon.style.color = '#ef4444';
        showToast('Saved to Saved Stays! ❤️');
      } else {
        heartIcon.className = 'fa-regular fa-heart';
        heartIcon.style.color = '#ffffff';
        showToast('Removed from Saved Stays');
      }
    });
  });

  const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
  viewDetailsBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const stayCard = btn.closest('.stay-card');
      const stayName = stayCard ? stayCard.querySelector('.stay-name').innerText : 'Stay';
      showToast(`Opening details & room selection for ${stayName}...`);
    });
  });

  const askSutrivaAiBtn = document.getElementById('askSutrivaAiBtn');
  if (askSutrivaAiBtn) {
    askSutrivaAiBtn.addEventListener('click', () => {
      showToast('🤖 Sutriva AI: "Looking for top-rated Bali beachfront resorts with private pool & free breakfast..."');
    });
  }

  const accSearchSubmitBtn = document.getElementById('accSearchSubmitBtn');
  if (accSearchSubmitBtn) {
    accSearchSubmitBtn.addEventListener('click', () => {
      const dest = document.getElementById('accDestInput') ? document.getElementById('accDestInput').value : 'Bali, Indonesia';
      showToast(`Searching perfect stays in ${dest}...`);
    });
  }

  const resetAccFiltersBtn = document.getElementById('resetAccFiltersBtn');
  if (resetAccFiltersBtn) {
    resetAccFiltersBtn.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('.acc-sidebar-card input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = false);
      const slider = document.getElementById('priceRangeSlider');
      if (slider) slider.value = 25000;
      showToast('Filters reset to default');
    });
  }

  // --- Authentication & User Header State Management ---

  const API_BASE_URL = 'http://localhost:5000/api/v1';

  const loginSignUpBtn = document.getElementById('loginSignUpBtn');
  const userPillContainer = document.getElementById('userPillContainer');
  const userPillBtn = document.getElementById('userPillBtn');
  const userProfileMenu = document.getElementById('userProfileMenu');
  const headerUserName = document.getElementById('headerUserName');
  const menuUserName = document.getElementById('menuUserName');
  const menuUserEmail = document.getElementById('menuUserEmail');
  const logoutBtn = document.getElementById('logoutBtn');

  const authModal = document.getElementById('authModal');
  const closeAuthModal = document.getElementById('closeAuthModal');
  const loginAuthView = document.getElementById('loginAuthView');
  const registerAuthView = document.getElementById('registerAuthView');
  const goToRegisterBtn = document.getElementById('goToRegisterBtn');
  const goToLoginBtn = document.getElementById('goToLoginBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const eyeToggleBtns = document.querySelectorAll('.eye-toggle-btn');

  // Track logged-in state in memory (Never store raw credentials or tokens in LocalStorage!)
  let currentUser = null;
  let currentAccessToken = null;

  /**
   * Secure API Fetch Wrapper with Automatic Refresh Interceptor
   */
  async function secureFetch(endpoint, options = {}) {
    options.headers = options.headers || {};
    options.credentials = 'include'; // Include HttpOnly cookies

    if (currentAccessToken) {
      options.headers['Authorization'] = `Bearer ${currentAccessToken}`;
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    // If Access Token is expired (401), attempt silent token refresh
    if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
      const refreshSuccess = await attemptSessionRefresh();
      if (refreshSuccess) {
        options.headers['Authorization'] = `Bearer ${currentAccessToken}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      } else {
        updateUserHeaderUI(null);
      }
    }

    return response;
  }

  /**
   * Automatic Session Restoration on App Launch
   */
  async function restoreUserSession() {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        currentAccessToken = data.data.accessToken;

        // Fetch User Profile
        const profileRes = await secureFetch('/users/me');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          currentUser = profileData.data.user;
          updateUserHeaderUI(currentUser);
          showToast(`Welcome back, ${currentUser.firstName || 'Traveler'}! Session restored.`);
        }
      }
    } catch (err) {
      // Session expired or client offline - keep guest state
    }
  }

  async function attemptSessionRefresh() {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        currentAccessToken = data.data.accessToken;
        return true;
      }
    } catch (err) {
      // Refresh failed
    }
    currentAccessToken = null;
    currentUser = null;
    return false;
  }

  // Restore session immediately on initialization
  restoreUserSession();

  // Open Auth Modal
  if (loginSignUpBtn) {
    loginSignUpBtn.addEventListener('click', () => {
      if (loginAuthView && registerAuthView) {
        loginAuthView.style.display = 'block';
        registerAuthView.style.display = 'none';
      }
      if (authModal) {
        authModal.classList.add('open');
        authModal.style.display = 'flex';
      }
    });
  }

  // Close Auth Modal
  if (closeAuthModal) {
    closeAuthModal.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.closeAuthModal === 'function') {
        window.closeAuthModal();
      } else if (authModal) {
        authModal.classList.remove('open');
        authModal.style.display = 'none';
      }
    });
  }

  // Close modal when clicking on overlay background
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) {
        if (typeof window.closeAuthModal === 'function') {
          window.closeAuthModal();
        } else {
          authModal.classList.remove('open');
          authModal.style.display = 'none';
        }
      }
    });
  }

  const userProfileModal = document.getElementById('userProfileModal');
  if (userProfileModal) {
    userProfileModal.addEventListener('click', (e) => {
      if (e.target === userProfileModal) {
        if (typeof window.closeUserProfileModal === 'function') {
          window.closeUserProfileModal();
        } else {
          userProfileModal.classList.remove('open');
          userProfileModal.style.display = 'none';
        }
      }
    });
  }

  // Switch to Register View
  if (goToRegisterBtn) {
    goToRegisterBtn.addEventListener('click', () => {
      loginAuthView.style.display = 'none';
      registerAuthView.style.display = 'block';
    });
  }

  // Switch to Login View
  if (goToLoginBtn) {
    goToLoginBtn.addEventListener('click', () => {
      registerAuthView.style.display = 'none';
      loginAuthView.style.display = 'block';
    });
  }

  // Eye Toggle Password Visibility
  eyeToggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = btn.previousElementSibling;
      const icon = btn.querySelector('i');
      if (input && input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-regular fa-eye-slash';
      } else if (input) {
        input.type = 'password';
        icon.className = 'fa-regular fa-eye';
      }
    });
  });

  // Handle Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('loginEmailInput');
      const email = emailInput ? emailInput.value.trim() : 'alex@sutriva.com';

      let name = 'Alex';
      if (email.includes('@')) {
        const prefix = email.split('@')[0];
        name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      } else if (email) {
        name = email;
      }

      if (typeof performUserLogin === 'function') {
        performUserLogin(name, email);
      }
    });
  }

  // Handle Register Form Submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fName = document.getElementById('regFirstName') ? document.getElementById('regFirstName').value.trim() : 'Alex';
      const lName = document.getElementById('regLastName') ? document.getElementById('regLastName').value.trim() : 'Morgan';
      const regEmail = document.getElementById('regEmail') ? document.getElementById('regEmail').value.trim() : 'alex.morgan@sutriva.com';

      const fullName = `${fName} ${lName}`;
      if (typeof performUserLogin === 'function') {
        performUserLogin(fullName, regEmail);
      }
    });
  }


  // Update Header UI based on Logged In User State
  function updateUserHeaderUI(user) {
    if (user) {
      if (loginSignUpBtn) loginSignUpBtn.style.display = 'none';
      if (userPillContainer) userPillContainer.style.display = 'block';
      const displayName = user.firstName || user.name || 'Traveler';
      if (headerUserName) headerUserName.innerText = `Hi, ${displayName}`;
      if (menuUserName) menuUserName.innerText = user.fullName || `${displayName} ${user.lastName || ''}`.trim();
      if (menuUserEmail) menuUserEmail.innerText = user.email || 'traveler@sutriva.com';
    } else {
      if (loginSignUpBtn) loginSignUpBtn.style.display = 'inline-flex';
      if (userPillContainer) userPillContainer.style.display = 'none';
      if (userProfileMenu) userProfileMenu.classList.remove('show');
      if (userPillBtn) userPillBtn.classList.remove('open');
    }
  }

  // User Profile Dropdown Toggle
  if (userPillBtn) {
    userPillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userProfileMenu.classList.toggle('show');
      userPillBtn.classList.toggle('open');
    });
  }

  // Close profile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (userPillContainer && !userPillContainer.contains(e.target)) {
      if (userProfileMenu) userProfileMenu.classList.remove('show');
      if (userPillBtn) userPillBtn.classList.remove('open');
    }
  });

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (err) {
        // Silent catch
      }

      currentAccessToken = null;
      currentUser = null;
      updateUserHeaderUI(null);
      showToast('Logged out successfully');
    });
  }

  // --- Location Privacy & Geolocation Consent Manager ---
  /**
   * OWASP Privacy: Requests location ONLY upon explicit user action with clear explanation.
   */
  window.requestUserLocationConsent = function (purposeMessage, onSuccessCallback) {
    const userConfirmed = confirm(`📍 Location Permission Request\n\nSutriva needs your location to ${purposeMessage}.\n\nDo you want to share your location?`);

    if (userConfirmed) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            showToast('Location accessed successfully');
            if (onSuccessCallback) onSuccessCallback(lat, lng);
          },
          (error) => {
            showToast('Unable to fetch location. Please enter city manually.');
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      } else {
        showToast('Geolocation is not supported by your browser.');
      }
    } else {
      showToast('Location request declined.');
    }
  };

  // --- Toast Function ---
  function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (toast && toastMsg) {
      toastMsg.innerText = message;
      toast.classList.add('show');

      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }

  // --- Activities Page Vibe Filtering ---
  window.filterActivityVibe = function(vibe, el) {
    document.querySelectorAll('#activitiesPage .vibe-card').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    
    const cards = document.querySelectorAll('#activitiesPage .act-item-card');
    let count = 0;
    cards.forEach(card => {
      const cardVibe = card.getAttribute('data-vibe') || '';
      if (vibe === 'all' || cardVibe.includes(vibe)) {
        card.style.display = 'flex';
        count++;
      } else {
        card.style.display = 'none';
      }
    });

    const vibeName = vibe.charAt(0).toUpperCase() + vibe.slice(1);
    showToast(`Filtered activities for vibe: ${vibeName} (${count} found)`);
  };

  // --- Packages Page Interactive Logic ---
  window.filterPackageTheme = function(theme, el) {
    document.querySelectorAll('.theme-pill').forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');

    const cards = document.querySelectorAll('#packagesPage .package-card');
    let matchCount = 0;
    cards.forEach(card => {
      const cardTheme = card.getAttribute('data-theme') || '';
      if (theme === 'all' || cardTheme.includes(theme)) {
        card.style.display = 'flex';
        matchCount++;
      } else {
        card.style.display = 'none';
      }
    });

    const themeLabel = theme === 'all' ? 'All Packages' : theme.toUpperCase();
    if (typeof showToast === 'function') {
      showToast(`Showing ${themeLabel} (${matchCount} package${matchCount === 1 ? '' : 's'})`);
    }
  };

  window.filterPackagesBySearch = function(query) {
    const q = (query || '').toLowerCase().trim();
    const cards = document.querySelectorAll('#packagesPage .package-card');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      if (!q || text.includes(q)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  };

  window.updatePkgPriceFilterLabel = function(val) {
    const lbl = document.getElementById('pkgPriceVal');
    if (lbl) {
      lbl.innerText = `₹10,000 - ₹${parseInt(val).toLocaleString('en-IN')}${val >= 150000 ? '+' : ''}`;
    }
    window.applyPkgFilters();
  };

  window.pkgCurrentFilters = {
    duration: 'any',
    destination: 'all',
    triptype: 'all'
  };

  window.filterPkgDuration = function(dur, el) {
    if (el) {
      el.parentNode.querySelectorAll('.qf-chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    }
    window.pkgCurrentFilters.duration = dur;
    window.applyPkgFilters();
  };

  window.filterPkgDestination = function(dest) {
    window.pkgCurrentFilters.destination = dest;
    window.applyPkgFilters();
  };

  window.filterPkgTripType = function(type, el) {
    if (el) {
      el.parentNode.querySelectorAll('.qf-chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    }
    window.pkgCurrentFilters.triptype = type;
    window.applyPkgFilters();
  };

  window.applyPkgFilters = function() {
    const priceSlider = document.getElementById('pkgPriceSlider');
    const maxPrice = priceSlider ? parseInt(priceSlider.value) : 150000;
    const cards = document.querySelectorAll('#packagesPage .package-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const cardPrice = parseInt(card.getAttribute('data-price') || '0');
      const cardDuration = parseInt(card.getAttribute('data-duration') || '0');
      const cardDest = card.getAttribute('data-destination') || '';
      const cardTripType = card.getAttribute('data-triptype') || '';

      let match = true;

      if (cardPrice > maxPrice) match = false;

      const dFilter = window.pkgCurrentFilters.duration;
      if (dFilter === '3-5' && (cardDuration < 3 || cardDuration > 5)) match = false;
      if (dFilter === '6-8' && (cardDuration < 6 || cardDuration > 8)) match = false;
      if (dFilter === '9+' && cardDuration < 9) match = false;

      const destFilter = window.pkgCurrentFilters.destination;
      if (destFilter !== 'all' && cardDest !== destFilter) match = false;

      const tripFilter = window.pkgCurrentFilters.triptype;
      if (tripFilter !== 'all' && !cardTripType.includes(tripFilter)) match = false;

      if (match) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (typeof showToast === 'function') {
      showToast(`Filters applied: ${visibleCount} packages available`);
    }
  };

  window.resetPackageFilters = function() {
    window.pkgCurrentFilters = { duration: 'any', destination: 'all', triptype: 'all' };
    const priceSlider = document.getElementById('pkgPriceSlider');
    if (priceSlider) priceSlider.value = 150000;
    const priceLbl = document.getElementById('pkgPriceVal');
    if (priceLbl) priceLbl.innerText = '₹10,000 - ₹1,50,000+';

    const destSelect = document.getElementById('qfDestinationSelect');
    if (destSelect) destSelect.value = 'all';

    document.querySelectorAll('#packagesPage .qf-chip').forEach(c => {
      if (c.innerText === 'Any' || c.innerText === 'All') c.classList.add('active');
      else c.classList.remove('active');
    });

    const cards = document.querySelectorAll('#packagesPage .package-card');
    cards.forEach(card => card.style.display = 'flex');

    if (typeof showToast === 'function') {
      showToast('Package filters reset to default');
    }
  };

  window.sortFeaturedPackages = function(criterion) {
    const container = document.getElementById('pkgCardsGridContainer');
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.package-card'));

    cards.sort((a, b) => {
      const priceA = parseInt(a.getAttribute('data-price') || '0');
      const priceB = parseInt(b.getAttribute('data-price') || '0');
      const durA = parseInt(a.getAttribute('data-duration') || '0');
      const durB = parseInt(b.getAttribute('data-duration') || '0');

      if (criterion === 'price-low') return priceA - priceB;
      if (criterion === 'price-high') return priceB - priceA;
      if (criterion === 'duration') return durA - durB;
      return 0;
    });

    cards.forEach(card => container.appendChild(card));
    if (typeof showToast === 'function') {
      showToast(`Sorted packages by ${criterion.replace('-', ' ')}`);
    }
  };

  window.toggleFavPackage = function(btn) {
    const icon = btn.querySelector('i');
    if (icon) {
      if (icon.classList.contains('fa-regular')) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        icon.style.color = '#ef4444';
        if (typeof showToast === 'function') showToast('Added package to Saved Favorites ❤️');
      } else {
        icon.classList.remove('fa-solid');
        icon.style.color = '';
        icon.classList.add('fa-regular');
        if (typeof showToast === 'function') showToast('Removed package from Favorites');
      }
    }
  };

  // --- Theme Changer Logic (Dark / Light Mode Toggle) ---
  function toggleDarkLightTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('themeToggleIcon');
    const text = document.getElementById('themeToggleText');

    if (isDark) {
      if (icon) icon.className = 'fa-solid fa-sun';
      if (text) text.textContent = 'Light';
      localStorage.setItem('sutriva_theme', 'dark');
      if (typeof showToast === 'function') showToast('Switched to Dark Mode 🌙');
    } else {
      if (icon) icon.className = 'fa-solid fa-moon';
      if (text) text.textContent = 'Dark';
      localStorage.setItem('sutriva_theme', 'light');
      if (typeof showToast === 'function') showToast('Switched to Light Mode ☀️');
    }
  }

  window.toggleDarkLightTheme = toggleDarkLightTheme;

  // Initialize theme from localStorage on page load
  const savedTheme = localStorage.getItem('sutriva_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    const icon = document.getElementById('themeToggleIcon');
    const text = document.getElementById('themeToggleText');
    if (icon) icon.className = 'fa-solid fa-sun';
    if (text) text.textContent = 'Light';
  }

});

// =========================================================================
// GOOGLE MAPS EXPLORER PAGE ENGINE (Exact Mockup Match)
// =========================================================================

(function() {
  const MAP_EXPLORER_DATA = {
    yercaud: {
      name: 'Yercaud, Tamil Nadu',
      center: [11.7820, 78.2120],
      zoom: 13,
      places: [
        {
          id: 'pagoda-point',
          name: 'Pagoda Point',
          category: 'Viewpoint',
          distance: 2.3,
          priceText: '₹50 - ₹100',
          priceVal: 75,
          verified: true,
          rating: 4.5,
          reviews: 120,
          lat: 11.7820,
          lng: 78.2230,
          thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80'
          ],
          description: 'A beautiful viewpoint offering panoramic views of Yercaud hills and the surrounding valleys. Best time to visit is during sunrise or sunset.'
        },
        {
          id: 'ladys-seat',
          name: "Lady's Seat",
          category: 'Viewpoint',
          distance: 2.1,
          priceText: '₹50 - ₹150',
          priceVal: 100,
          verified: true,
          rating: 4.3,
          reviews: 96,
          lat: 11.7710,
          lng: 78.1980,
          thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=80'
          ],
          description: 'A natural rock formation resembling a seat, overlooking the winding Ghat road, Salem city lights, and dramatic sunsets.'
        },
        {
          id: 'kiliyur-falls',
          name: 'Kiliyur Falls',
          category: 'Waterfall',
          distance: 4.3,
          priceText: '₹20 - ₹50',
          priceVal: 35,
          verified: true,
          rating: 4.6,
          reviews: 210,
          lat: 11.7950,
          lng: 78.2050,
          thumb: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=400&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'
          ],
          description: 'A breathtaking 300-foot waterfall cascading into lush greenery, ideal for nature lovers, gentle hiking and cool mist photography.'
        },
        {
          id: 'servarayan-temple',
          name: 'Servarayan Temple',
          category: 'Temples',
          distance: 5.1,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.7,
          reviews: 340,
          lat: 11.8320,
          lng: 78.2290,
          thumb: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80'
          ],
          description: 'The highest peak in Yercaud (5,326 ft) featuring an ancient narrow cave temple dedicated to God Shevaroyan with panoramic valley clouds.'
        },
        {
          id: 'botanical-garden',
          name: 'Botanical Meru Temple',
          category: 'Parks',
          distance: 3.0,
          priceText: '₹30 - ₹80',
          priceVal: 50,
          verified: true,
          rating: 4.4,
          reviews: 150,
          lat: 11.7760,
          lng: 78.2120,
          thumb: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
          ],
          description: 'Houses an exotic National Orchidarium with hundreds of rare orchid species, insect-eating pitcher plants and landscaped floral avenues.'
        },
        {
          id: 'yercaud-lake',
          name: 'Yercaud Emerald Lake',
          category: 'Lake',
          distance: 1.2,
          priceText: '₹100 - ₹320',
          priceVal: 150,
          verified: true,
          rating: 4.5,
          reviews: 480,
          lat: 11.7780,
          lng: 78.2080,
          thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=80'
          ],
          description: 'Serene mountain lake in the town centre flanked by tall pine trees and Deer Park, offering relaxing pedal and motor boat rides.'
        },
        {
          id: 'montfort-school',
          name: 'Montfort School View',
          category: 'Forts',
          distance: 2.8,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.4,
          reviews: 85,
          lat: 11.7745,
          lng: 78.2140,
          thumb: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'],
          description: 'Historic Anglo-Indian residential school founded in 1917 with magnificent stone architecture and heritage chapel.'
        },
        {
          id: 'tipperary-viewpoint',
          name: 'Tipperary Viewpoint',
          category: 'Viewpoint',
          distance: 2.7,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.2,
          reviews: 60,
          lat: 11.7680,
          lng: 78.2010,
          thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'],
          description: 'Southernmost viewpoint of Yercaud, offering clear sights of the Elephant Tooth rock and sunset ridge.'
        },
        {
          id: 'bears-cave',
          name: "Bear's Cave",
          category: 'Trekking',
          distance: 3.4,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: false,
          rating: 4.1,
          reviews: 75,
          lat: 11.7850,
          lng: 78.2160,
          thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'],
          description: 'A subterranean cave situated inside a private coffee estate, once a shelter for wild bears and King Tipu Sultan.'
        },
        {
          id: 'kottachedu-forest',
          name: 'Kottachedu Teak Forest',
          category: 'Hills & Nature',
          distance: 7.8,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.6,
          reviews: 110,
          lat: 11.8150,
          lng: 78.2100,
          thumb: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=80'],
          description: 'Dense deciduous teak and bamboo reserve forest, popular for quiet nature drives and wildlife birdwatching.'
        },
        {
          id: 'annamalaiyar-view',
          name: 'Annamalaiyar Temple View',
          category: 'Temples',
          distance: 6.2,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.5,
          reviews: 95,
          lat: 11.8200,
          lng: 78.2250,
          thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'],
          description: 'Quiet hill sanctuary offering 360-degree panoramic sightlines over coffee plantations and neighboring valleys.'
        },
        {
          id: 'silk-farm',
          name: 'Silk Farm & Rose Garden',
          category: 'Parks',
          distance: 2.5,
          priceText: '₹30 - ₹50',
          priceVal: 40,
          verified: true,
          rating: 4.3,
          reviews: 130,
          lat: 11.7720,
          lng: 78.2150,
          thumb: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80'],
          description: 'Demonstrates sericulture and traditional mulberry cultivation along with fragrant colorful rose nursery plots.'
        },
        {
          id: 'sweet-rascal-cafe',
          name: 'Sweet Rascal Cafe & Bistro',
          category: 'Cafes',
          distance: 1.6,
          priceText: '₹200 - ₹500',
          priceVal: 350,
          verified: true,
          rating: 4.8,
          reviews: 420,
          lat: 11.7750,
          lng: 78.2090,
          thumb: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80'],
          description: 'Quirky boutique garden cafe serving artisanal pour-over coffees, handcrafted pasta, cheesecakes and wood-fired pizzas.'
        },
        {
          id: 'silver-oak-restaurant',
          name: 'The Silver Oak Multi-Cuisine',
          category: 'Food',
          distance: 1.1,
          priceText: '₹250 - ₹600',
          priceVal: 400,
          verified: true,
          rating: 4.7,
          reviews: 580,
          lat: 11.7790,
          lng: 78.2130,
          thumb: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'],
          description: 'Famous hill dining spot renowned for authentic Kongu pepper chicken, sizzling paneer platters, and South Indian delicacies.'
        },
        {
          id: 'cloud-nine-cafe',
          name: 'Cloud 9 Viewpoint Cafe',
          category: 'Cafes',
          distance: 2.2,
          priceText: '₹150 - ₹350',
          priceVal: 250,
          verified: true,
          rating: 4.6,
          reviews: 310,
          lat: 11.7820,
          lng: 78.2030,
          thumb: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'],
          description: 'Glasshouse cliffside cafe offering freshly brewed Nilgiri mountain tea, espresso coffee, and steaming hot chocolate with misty valley views.'
        },
        {
          id: 'malar-traditional-mess',
          name: 'Malar Traditional Banana Leaf Mess',
          category: 'Food',
          distance: 0.9,
          priceText: '₹100 - ₹200',
          priceVal: 150,
          verified: true,
          rating: 4.6,
          reviews: 670,
          lat: 11.7770,
          lng: 78.2110,
          thumb: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=600&q=80'],
          description: 'Beloved local mess famous for authentic hot Chettinad meals on plantain leaves, crispy dosas, and spicy sambar.'
        }
      ]
    },
    tiruchengode: {
      name: 'Tiruchengode, Tamil Nadu',
      center: [11.3787, 77.8949],
      zoom: 14,
      places: [
        {
          id: 'arthanaareeswarar-temple',
          name: 'Arulmigu Arthanaareeswarar Temple (Hill Temple)',
          category: 'Temples',
          distance: 1.2,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.9,
          reviews: 2840,
          lat: 11.3785,
          lng: 77.8962,
          thumb: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=400&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'
          ],
          description: 'World-renowned 2,000-year-old hilltop shrine atop Nagagiri Hill dedicated to Lord Shiva as Ardhanareeswarar (half male Shiva, half female Parvati). Famous for 1206 stone steps, massive sacred serpent sculpture (Aadiseshan), and panoramic Kongu valley views.'
        },
        {
          id: 'kailasanathar-temple',
          name: 'Arulmigu Kailasanathar Temple, Tiruchengode',
          category: 'Temples',
          distance: 0.6,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.8,
          reviews: 1420,
          lat: 11.3768,
          lng: 77.8920,
          thumb: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=400&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80'
          ],
          description: 'Ancient Chola-era temple situated at the foot of the hill featuring intricate carved stone pillars, grand temple car (Ther), and sacred teertham.'
        },
        {
          id: 'chennakesava-perumal-temple',
          name: 'Arulmigu Chennakesava Perumal Kovil',
          category: 'Temples',
          distance: 1.5,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.7,
          reviews: 890,
          lat: 11.3792,
          lng: 77.8980,
          thumb: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'
          ],
          description: 'Historic Vaishnavite temple with stunning Dravidian gopuram sculptures and peaceful prayer halls.'
        },
        {
          id: 'badrakaliamman-temple',
          name: 'Badrakaliamman Kovil, Tiruchengode',
          category: 'Temples',
          distance: 0.9,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.7,
          reviews: 650,
          lat: 11.3745,
          lng: 77.8912,
          thumb: 'https://images.unsplash.com/photo-1621644825946-bd13d06371cb?auto=format&fit=crop&w=400&q=80',
          gallery: [
            'https://images.unsplash.com/photo-1621644825946-bd13d06371cb?auto=format&fit=crop&w=600&q=80'
          ],
          description: 'Revered Amman shrine famous for annual festivals and spiritual blessings in the heart of Tiruchengode.'
        },
        {
          id: 'tiruchengode-malai-viewpoint',
          name: 'Tiruchengode Malai Hilltop Viewpoint',
          category: 'Viewpoint',
          distance: 1.4,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.8,
          reviews: 940,
          lat: 11.3799,
          lng: 77.8970,
          thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'],
          description: 'Panoramic summit viewpoint offering 360-degree vistas across Namakkal hills, agricultural plains, and glowing town lights.'
        },
        {
          id: 'kongu-banana-leaf-mess',
          name: 'Kongu Traditional Banana Leaf Mess',
          category: 'Food',
          distance: 0.7,
          priceText: '₹120 - ₹280',
          priceVal: 180,
          verified: true,
          rating: 4.7,
          reviews: 720,
          lat: 11.3755,
          lng: 77.8935,
          thumb: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=600&q=80'],
          description: 'Authentic Kongu Nadu non-veg and veg meals served on fresh plantain leaves with aromatic chicken chukka and hot rasam.'
        },
        {
          id: 'krishna-bhavan-tiruchengode',
          name: 'Sri Krishna Bhavan & Cafe',
          category: 'Cafes',
          distance: 0.5,
          priceText: '₹50 - ₹150',
          priceVal: 80,
          verified: true,
          rating: 4.6,
          reviews: 510,
          lat: 11.3770,
          lng: 77.8940,
          thumb: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80'],
          description: 'Famous local eatery for piping hot ghee roast dosas, idlis, and authentic frothy South Indian filter coffee.'
        }
      ]
    },
    salem: {
      name: 'Salem, Tamil Nadu',
      center: [11.6643, 78.1460],
      zoom: 13,
      places: [
        {
          id: 'sugavaneswarar-temple',
          name: 'Arulmigu Sugavaneswarar Temple, Salem',
          category: 'Temples',
          distance: 1.0,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.8,
          reviews: 1820,
          lat: 11.6580,
          lng: 78.1590,
          thumb: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80'],
          description: 'Historical 13th-century Shiva temple associated with sage Suka and saint Avvaiyar, featuring stunning granite architecture.'
        },
        {
          id: 'kottai-mariamman-temple',
          name: 'Kottai Mariamman Kovil, Salem',
          category: 'Temples',
          distance: 1.3,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.9,
          reviews: 2450,
          lat: 11.6520,
          lng: 78.1630,
          thumb: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80'],
          description: 'Most celebrated and ancient Mariamman temple in Salem, famous for the grand Aadi festival attracting devotees across South India.'
        },
        {
          id: '1008-shiva-lingam-temple',
          name: '1008 Shiva Lingam Temple, Salem',
          category: 'Temples',
          distance: 5.5,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.8,
          reviews: 1320,
          lat: 11.6240,
          lng: 78.1180,
          thumb: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'],
          description: 'Magnificent spiritual complex situated against the foothills of Sankagiri with 1008 small Shiva lingams surrounding a massive central lingam.'
        }
      ]
    },
    chennai: {
      name: 'Chennai, Tamil Nadu',
      center: [13.0827, 80.2707],
      zoom: 13,
      places: [
        {
          id: 'kapaleeshwarar-temple',
          name: 'Arulmigu Kapaleeshwarar Temple, Mylapore',
          category: 'Temples',
          distance: 4.2,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.9,
          reviews: 4890,
          lat: 13.0334,
          lng: 80.2699,
          thumb: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80'],
          description: 'World-famous 7th-century Dravidian temple with soaring rainbow gopuram, sacred temple tank, and deep cultural heritage in Mylapore.'
        },
        {
          id: 'parthasarathy-temple',
          name: 'Arulmigu Parthasarathy Temple, Triplicane',
          category: 'Temples',
          distance: 3.5,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.8,
          reviews: 3410,
          lat: 13.0537,
          lng: 80.2777,
          thumb: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=600&q=80'],
          description: '8th-century Vaishnavite temple dedicated to Lord Krishna mentioned in the Divya Prabandham with rich Pallava stone inscriptions.'
        },
        {
          id: 'marundeeswarar-temple',
          name: 'Marundeeswarar Temple, Thiruvanmiyur',
          category: 'Temples',
          distance: 9.8,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.8,
          reviews: 2190,
          lat: 12.9840,
          lng: 80.2595,
          thumb: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'],
          description: 'Ancient Chola temple dedicated to Shiva as the healer of all diseases (Marundeeswarar), located close to the coast.'
        }
      ]
    },
    ooty: {
      name: 'Ooty, Nilgiris',
      center: [11.4102, 76.6950],
      zoom: 13,
      places: [
        {
          id: 'doddabetta-peak',
          name: 'Doddabetta Peak',
          category: 'Viewpoint',
          distance: 4.5,
          priceText: '₹20 - ₹50',
          priceVal: 30,
          verified: true,
          rating: 4.6,
          reviews: 840,
          lat: 11.4011,
          lng: 76.7360,
          thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'],
          description: 'Highest mountain in Nilgiri Hills (8,652 ft) equipped with telescope observatory to gaze across misty ridges.'
        },
        {
          id: 'pykara-lake',
          name: 'Pykara Lake & Waterfalls',
          category: 'Lake',
          distance: 18.0,
          priceText: '₹120 - ₹350',
          priceVal: 200,
          verified: true,
          rating: 4.7,
          reviews: 620,
          lat: 11.4550,
          lng: 76.5920,
          thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'],
          description: 'Pristine emerald lake nestled within shola pine woods, with thrilling speedboat rides and cascading waterfalls.'
        }
      ]
    },
    goa: {
      name: 'Goa Coast',
      center: [15.5439, 73.7553],
      zoom: 13,
      places: [
        {
          id: 'baga-beach',
          name: 'Baga Beach',
          category: 'Viewpoint',
          distance: 1.5,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.8,
          reviews: 1420,
          lat: 15.5553,
          lng: 73.7516,
          thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'],
          description: 'Iconic golden shoreline with water sports, beach shacks, seafood grills and lively seaside music.'
        },
        {
          id: 'aguada-fort',
          name: 'Aguada Fort',
          category: 'Other',
          distance: 5.2,
          priceText: '₹50 - ₹100',
          priceVal: 50,
          verified: true,
          rating: 4.7,
          reviews: 980,
          lat: 15.4924,
          lng: 73.7738,
          thumb: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'],
          description: '17th-century Portuguese coastal bastion with an iconic 4-storey lighthouse overlooking the Arabian Sea.'
        }
      ]
    },
    kodaikanal: {
      name: 'Kodaikanal, Tamil Nadu',
      center: [10.2381, 77.4892],
      zoom: 13,
      places: [
        {
          id: 'kodai-lake',
          name: 'Kodaikanal Lake',
          category: 'Lake',
          distance: 1.2,
          priceText: '₹50 - ₹150',
          priceVal: 100,
          verified: true,
          rating: 4.7,
          reviews: 1340,
          lat: 10.2350,
          lng: 77.4850,
          thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'],
          description: 'Star-shaped serene hill lake famous for pedal boating, misty lakeside cycling, and horse riding.'
        },
        {
          id: 'coakers-walk',
          name: "Coaker's Walk",
          category: 'Viewpoint',
          distance: 1.8,
          priceText: '₹30',
          priceVal: 30,
          verified: true,
          rating: 4.6,
          reviews: 920,
          lat: 10.2320,
          lng: 77.4950,
          thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'],
          description: 'A 1-kilometer pedestrian pathway along steep mountain cliffs offering stunning views of cloud valleys.'
        },
        {
          id: 'silver-cascade',
          name: 'Silver Cascade Falls',
          category: 'Waterfall',
          distance: 8.0,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.4,
          reviews: 750,
          lat: 10.2520,
          lng: 77.5250,
          thumb: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=80'],
          description: 'Majestic 180-ft natural waterfall formed by the overflow of Kodai Lake splashing on rocky cliffs.'
        }
      ]
    },
    munnar: {
      name: 'Munnar, Kerala',
      center: [10.0889, 77.0595],
      zoom: 13,
      places: [
        {
          id: 'tea-gardens',
          name: 'Tata Tea Gardens & Museum',
          category: 'Hills & Nature',
          distance: 2.0,
          priceText: '₹125',
          priceVal: 125,
          verified: true,
          rating: 4.8,
          reviews: 1640,
          lat: 10.0930,
          lng: 77.0600,
          thumb: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80'],
          description: 'Rolling velvet-green tea plantation terraces showcasing artisanal tea plucking and processing heritage.'
        },
        {
          id: 'mattupetty-dam',
          name: 'Mattupetty Dam & Lake',
          category: 'Lake',
          distance: 12.0,
          priceText: '₹50 - ₹200',
          priceVal: 100,
          verified: true,
          rating: 4.6,
          reviews: 1100,
          lat: 10.1060,
          lng: 77.1240,
          thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'],
          description: 'Storage concrete gravity dam with tranquil reservoir waters, speedboats, and wild elephant spotting.'
        }
      ]
    },
    manali: {
      name: 'Manali, Himachal Pradesh',
      center: [32.2396, 77.1887],
      zoom: 13,
      places: [
        {
          id: 'solang-valley',
          name: 'Solang Valley',
          category: 'Viewpoint',
          distance: 13.0,
          priceText: '₹500 - ₹1500',
          priceVal: 500,
          verified: true,
          rating: 4.9,
          reviews: 2180,
          lat: 32.3167,
          lng: 77.1575,
          thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'],
          description: 'Snow paradise offering thrilling paragliding, skiing, zorbing, and ropeway cable car rides.'
        },
        {
          id: 'jogini-falls',
          name: 'Jogini Waterfalls',
          category: 'Waterfall',
          distance: 4.5,
          priceText: 'Free Entry',
          priceVal: 0,
          verified: true,
          rating: 4.7,
          reviews: 940,
          lat: 32.2680,
          lng: 77.1950,
          thumb: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=400&q=80',
          gallery: ['https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=600&q=80'],
          description: 'Picturesque pine trail hike leading to a magnificent mountain cascade gushing over Himalayan boulders.'
        }
      ]
    }
  };

  let leafletMapInstance = null;
  let activeMarkersMap = {};
  let currentCityKey = 'yercaud';
  let activeSelectedPlaceId = 'pagoda-point';
  let isSatelliteTile = false;
  let streetTileLayer = null;
  let satelliteTileLayer = null;
  let hasSyncedMongoFoodToMap = false;

  async function syncMongoFoodToMapExplorer() {
    if (hasSyncedMongoFoodToMap) return;
    try {
      const res = await fetch('http://localhost:5000/api/v1/food?city=Tiruchengode&limit=30');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        hasSyncedMongoFoodToMap = true;
        if (MAP_EXPLORER_DATA.tiruchengode) {
          data.data.forEach((foodItem, i) => {
            const lat = 11.3800 + ((i % 8) - 4) * 0.0032;
            const lng = 77.8900 + (Math.floor(i / 8) - 2) * 0.0032;
            const isVeg = foodItem.isVeg;
            MAP_EXPLORER_DATA.tiruchengode.places.push({
              id: `mongo-food-${foodItem._id}`,
              name: foodItem.name,
              category: isVeg ? 'Food' : (foodItem.displayCategory.includes('Cafe') ? 'Cafes' : 'Food'),
              distance: Number((0.5 + (i % 6) * 0.4).toFixed(1)),
              priceText: foodItem.priceText,
              priceVal: foodItem.priceVal,
              verified: true,
              rating: foodItem.rating,
              reviews: foodItem.reviews,
              lat: lat,
              lng: lng,
              thumb: foodItem.image,
              gallery: [foodItem.image],
              description: `${foodItem.displayCategory || 'Restaurant'} located at ${foodItem.address || foodItem.city}. Live from MongoDB localhost:27017.`
            });
          });
          if (currentCityKey === 'tiruchengode') {
            renderMapPlacesListAndPins();
          }
        }
      }
    } catch (e) {
      console.warn('Map explorer food sync skipped:', e);
    }
  }

  function initExploreMapPage() {
    const mapElement = document.getElementById('sutrivaLeafletMap');
    if (!mapElement) return;

    if (!window.L) {
      setTimeout(initExploreMapPage, 120);
      return;
    }

    syncMongoFoodToMapExplorer();

    const cityData = MAP_EXPLORER_DATA[currentCityKey] || MAP_EXPLORER_DATA.yercaud;

    try {
      if (!leafletMapInstance) {
        if (mapElement._leaflet_id) {
          delete mapElement._leaflet_id;
        }
        leafletMapInstance = L.map('sutrivaLeafletMap', {
          zoomControl: false,
          attributionControl: false
        }).setView(cityData.center, cityData.zoom);

        window.leafletMapInstance = leafletMapInstance;

        // Google Maps Roadmap Tiles
        streetTileLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['0', '1', '2', '3']
        }).addTo(leafletMapInstance);

        // Google Maps Satellite / Hybrid Tiles
        satelliteTileLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['0', '1', '2', '3']
        });

        // Add Zoom Control at bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(leafletMapInstance);

        if (window.ResizeObserver) {
          const ro = new ResizeObserver(() => {
            if (leafletMapInstance) {
              leafletMapInstance.invalidateSize();
            }
          });
          ro.observe(mapElement);
        }

        leafletMapInstance.on('click', async function(e) {
          if (!isStartPinPickActive) return;
          isStartPinPickActive = false;
          leafletMapInstance.getContainer().style.cursor = '';
          const revName = await reverseGeocodeCoord(e.latlng.lat, e.latlng.lng) || 'Custom Start Point';
          const newFrom = {
            name: revName,
            lat: e.latlng.lat,
            lng: e.latlng.lng
          };
          const fromInput = document.getElementById('mapFromInput');
          if (fromInput) fromInput.value = revName.split(',')[0];
          
          const destVal = document.getElementById('mapDestInput')?.value?.trim() || 'Yercaud';
          const destCoord = await resolveLocationCoord(destVal);
          if (destCoord) {
            await calculateAndDrawLiveRoute(newFrom, destCoord);
          }
          if (typeof showToast === 'function') {
            showToast(`📍 Start pinned at ${revName.split(',')[0]}! Route plotted.`);
          }
        });
      } else {
        leafletMapInstance.setView(cityData.center, cityData.zoom);
      }
    } catch (mapErr) {
      console.warn('Map initialization check:', mapErr);
      if (leafletMapInstance) {
        leafletMapInstance.setView(cityData.center, cityData.zoom);
      }
    }

    // Repeated invalidateSize calls to ensure tiles load seamlessly across transitions
    [50, 150, 300, 600, 1000].forEach(delay => {
      setTimeout(() => {
        if (leafletMapInstance) {
          leafletMapInstance.invalidateSize(true);
        }
      }, delay);
    });

    renderMapPlacesListAndPins();
    selectMapPlace(activeSelectedPlaceId);

    // Auto-plot initial route if From and Destination are specified
    setTimeout(() => {
      const fromVal = document.getElementById('mapFromInput')?.value?.trim();
      const destVal = document.getElementById('mapDestInput')?.value?.trim();
      if (fromVal && destVal) {
        searchMapRoute();
      }
    }, 450);
  }

  const ALL_CATEGORY_SUGGESTIONS = [
    { name: 'Temples', icon: '🛕', keywords: ['temple', 'spiritual', 'shrine', 'meru', 'annamalaiyar', 'servarayan', 'kovil', 'god', 'mandir'] },
    { name: 'Cafes', icon: '☕', keywords: ['cafe', 'coffee', 'espresso', 'bakery', 'tea', 'latte', 'sweet rascal', 'cloud 9', 'bistro'] },
    { name: 'Food', icon: '🍛', keywords: ['food', 'restaurant', 'dining', 'mess', 'biryani', 'meals', 'lunch', 'dinner', 'dosa', 'cuisine'] },
    { name: 'Forts', icon: '🏰', keywords: ['fort', 'bastion', 'castle', 'heritage', 'monument', 'aguada', 'palace', 'school'] },
    { name: 'Parks', icon: '🌳', keywords: ['park', 'garden', 'botanical', 'orchidarium', 'rose', 'gardens', 'farm'] },
    { name: 'Trekking', icon: '🥾', keywords: ['trekking', 'trek', 'cave', 'trail', 'hike', 'climb', 'bear', 'walk'] },
    { name: 'Beaches', icon: '🏖️', keywords: ['beach', 'coast', 'sea', 'shore', 'baga', 'marina'] },
    { name: 'Boating', icon: '🛶', keywords: ['boating', 'boat', 'lake', 'dam', 'speed boat', 'reservoir', 'water'] },
    { name: 'Caves', icon: '🦇', keywords: ['cave', 'cavern', 'subterranean', 'bears cave', 'rock'] },
    { name: 'Wildlife', icon: '🦁', keywords: ['wildlife', 'zoo', 'forest', 'deer park', 'teak', 'reserve', 'safari'] },
    { name: 'Heritage', icon: '🏛️', keywords: ['heritage', 'historic', 'museum', 'monument', 'architecture'] }
  ];

  let dualLocDebounce = null;
  function handleDualLocationInput(val) {
    const clearBtn = document.getElementById('btnClearDualLoc');
    if (clearBtn) {
      clearBtn.style.display = val && val.trim().length > 0 ? 'flex' : 'none';
    }

    clearTimeout(dualLocDebounce);
    dualLocDebounce = setTimeout(() => {
      const trimmed = (val || '').trim();
      const clean = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (CITY_COORDINATES[clean]) {
        applyDualSearchRecommendation();
      }
    }, 700);
  }

  function clearDualLocation() {
    const locInput = document.getElementById('mapLocationSearchInput');
    const clearBtn = document.getElementById('btnClearDualLoc');
    if (locInput) locInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    renderMapPlacesListAndPins();
  }

  function handleCategorySearchInput(val) {
    const clearBtn = document.getElementById('btnClearCatSearch');
    if (clearBtn) {
      clearBtn.style.display = val && val.trim().length > 0 ? 'flex' : 'none';
    }

    const lowerVal = (val || '').trim().toLowerCase();
    document.querySelectorAll('.cat-chip-btn').forEach(btn => {
      const cat = (btn.getAttribute('data-cat') || '').toLowerCase();
      if (lowerVal && (cat.includes(lowerVal) || lowerVal.includes(cat))) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    renderCategorySuggestionsDropdown(val);
    renderMapPlacesListAndPins();
  }

  function renderCategorySuggestionsDropdown(filterVal = '') {
    const dropdown = document.getElementById('catSuggestionsDropdown');
    if (!dropdown) return;

    const query = (filterVal || '').trim().toLowerCase();
    const cityData = MAP_EXPLORER_DATA[currentCityKey] || MAP_EXPLORER_DATA.yercaud;
    const places = cityData.places || [];

    const matchedSuggestions = ALL_CATEGORY_SUGGESTIONS.filter(sugg => {
      if (!query) return true;
      if (sugg.name.toLowerCase().includes(query)) return true;
      return sugg.keywords.some(kw => kw.includes(query) || query.includes(kw));
    });

    if (matchedSuggestions.length === 0) {
      dropdown.innerHTML = `<div style="padding:8px 10px; font-size:11px; color:#94a3b8; text-align:center;">No matching category. Searching place names...</div>`;
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = matchedSuggestions.slice(0, 6).map(sugg => {
      const count = places.filter(p => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return sugg.keywords.some(kw => cat.includes(kw) || name.includes(kw) || desc.includes(kw));
      }).length;

      return `
        <div class="cat-sugg-item" onclick="window.selectCategorySuggestion('${sugg.name}')">
          <div class="cat-sugg-left">
            <span class="cat-sugg-icon">${sugg.icon}</span>
            <span>${sugg.name}</span>
          </div>
          <span class="cat-sugg-count">${count > 0 ? `${count} places` : 'Explore'}</span>
        </div>
      `;
    }).join('');

    dropdown.style.display = 'block';
  }

  function showCategorySuggestionsDropdown(show) {
    const dropdown = document.getElementById('catSuggestionsDropdown');
    if (!dropdown) return;
    if (show) {
      const inputVal = document.getElementById('mapCatSearchInput')?.value || '';
      renderCategorySuggestionsDropdown(inputVal);
    } else {
      setTimeout(() => {
        if (dropdown) dropdown.style.display = 'none';
      }, 250);
    }
  }

  async function applyDualSearchRecommendation() {
    const locInput = document.getElementById('mapLocationSearchInput');
    const expInput = document.getElementById('mapCatSearchInput');
    const locVal = locInput?.value?.trim() || 'Yercaud';
    const expVal = expInput?.value?.trim() || '';

    // 1. Resolve Location
    const coord = await resolveLocationCoord(locVal);
    const destClean = locVal.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (coord) {
      const topDestInput = document.getElementById('mapDestInput');
      if (topDestInput) topDestInput.value = coord.name.split(',')[0];

      if (!MAP_EXPLORER_DATA[destClean]) {
        const baseName = coord.name.split(',')[0].trim();
        MAP_EXPLORER_DATA[destClean] = {
          name: coord.name,
          center: [coord.lat, coord.lng],
          zoom: 13,
          places: [
            {
              id: `${destClean}-spot-1`,
              name: `${baseName} Main Center & View`,
              category: 'Viewpoint',
              distance: 0.8,
              priceText: 'Free Entry',
              priceVal: 0,
              verified: true,
              rating: 4.6,
              reviews: 320,
              lat: coord.lat + 0.005,
              lng: coord.lng + 0.005,
              thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
              gallery: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'],
              description: `Central scenic viewpoint and city landmarks around ${baseName}.`
            },
            {
              id: `${destClean}-spot-2`,
              name: `${baseName} Historic Temple`,
              category: 'Temples',
              distance: 1.5,
              priceText: 'Free Entry',
              priceVal: 0,
              verified: true,
              rating: 4.8,
              reviews: 540,
              lat: coord.lat + 0.003,
              lng: coord.lng - 0.004,
              thumb: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
              gallery: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'],
              description: `Renowned ancient spiritual heritage temple with majestic architecture and serene ambience.`
            },
            {
              id: `${destClean}-spot-3`,
              name: `${baseName} Artisan Cafe & Coffee Lounge`,
              category: 'Cafes',
              distance: 1.2,
              priceText: '₹150 - ₹400',
              priceVal: 280,
              verified: true,
              rating: 4.7,
              reviews: 380,
              lat: coord.lat - 0.003,
              lng: coord.lng + 0.006,
              thumb: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
              gallery: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80'],
              description: `Aesthetic boutique cafe serving freshly roasted artisanal coffees, waffles, and sandwiches.`
            },
            {
              id: `${destClean}-spot-4`,
              name: `${baseName} Traditional Mess & Restaurant`,
              category: 'Food',
              distance: 0.9,
              priceText: '₹120 - ₹250',
              priceVal: 180,
              verified: true,
              rating: 4.7,
              reviews: 620,
              lat: coord.lat + 0.002,
              lng: coord.lng + 0.004,
              thumb: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
              gallery: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'],
              description: `Authentic regional cuisine on plantain leaves with aromatic biryani, hot tiffin, and traditional meals.`
            },
            {
              id: `${destClean}-spot-5`,
              name: `${baseName} Heritage Fort & Bastion`,
              category: 'Forts',
              distance: 3.2,
              priceText: '₹25 - ₹50',
              priceVal: 35,
              verified: true,
              rating: 4.5,
              reviews: 240,
              lat: coord.lat - 0.007,
              lng: coord.lng - 0.006,
              thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
              gallery: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'],
              description: `Historic rampart complex with grand stone walls, bastions, and panoramic scenic viewpoints.`
            },
            {
              id: `${destClean}-spot-6`,
              name: `${baseName} Botanical Garden & Nature Park`,
              category: 'Parks',
              distance: 1.8,
              priceText: '₹20',
              priceVal: 20,
              verified: true,
              rating: 4.5,
              reviews: 310,
              lat: coord.lat + 0.006,
              lng: coord.lng - 0.003,
              thumb: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80',
              gallery: ['https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80'],
              description: `Lush landscaped public gardens with floral nursery walkways and quiet relaxing gazebos.`
            },
            {
              id: `${destClean}-spot-7`,
              name: `${baseName} Waterfront Lake & Boating`,
              category: 'Lake',
              distance: 2.2,
              priceText: '₹60 - ₹150',
              priceVal: 100,
              verified: true,
              rating: 4.6,
              reviews: 430,
              lat: coord.lat - 0.005,
              lng: coord.lng + 0.008,
              thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
              gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'],
              description: `Tranquil freshwater lake with pedal boat rentals, promenade strolls, and sunset photo points.`
            }
          ]
        };
      }

      currentCityKey = destClean;
      if (leafletMapInstance) {
        leafletMapInstance.flyTo([coord.lat, coord.lng], 13, { duration: 0.8 });
      }
    }

    // 2. Resolve Experience (Temple, Food, Cafe, etc.)
    const cityData = MAP_EXPLORER_DATA[currentCityKey] || MAP_EXPLORER_DATA.yercaud;
    const places = cityData.places || [];

    if (expVal) {
      const matchingCount = places.filter(p => matchesCategoryQuery(p, expVal)).length;
      if (matchingCount === 0 && coord) {
        const baseName = coord.name.split(',')[0].trim();
        const customCat = expVal.charAt(0).toUpperCase() + expVal.slice(1);
        const isTempleSearch = ['temple', 'temples', 'kovil', 'koil'].some(k => expVal.toLowerCase().includes(k));
        const newSpot1 = {
          id: `${destClean}-rec-${Date.now()}`,
          name: isTempleSearch ? `${baseName} Arulmigu Historic Temple` : `${baseName} Top ${customCat} Pick`,
          category: isTempleSearch ? 'Temples' : customCat,
          distance: 1.2,
          priceText: isTempleSearch ? 'Free Entry' : '₹100 - ₹300',
          priceVal: isTempleSearch ? 0 : 150,
          verified: true,
          rating: 4.9,
          reviews: 850,
          lat: coord.lat + 0.003,
          lng: coord.lng + 0.003,
          thumb: isTempleSearch ? 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=400&q=80' : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
          gallery: [isTempleSearch ? 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80' : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80'],
          description: isTempleSearch ? `Revered sacred temple in ${baseName} with historic Dravidian architecture and serene spiritual blessings.` : `Highly rated recommended spot for ${expVal} in ${baseName}. Celebrated by locals and travellers.`
        };
        places.unshift(newSpot1);
      }
    }

    renderMapPlacesListAndPins();

    const matchingPlaces = expVal ? places.filter(p => matchesCategoryQuery(p, expVal)) : places;
    if (matchingPlaces.length > 0) {
      matchingPlaces.sort((a, b) => b.rating - a.rating);
      selectMapPlace(matchingPlaces[0].id, true);
    }

    if (typeof showToast === 'function') {
      const cityName = coord ? coord.name.split(',')[0] : locVal;
      if (expVal) {
        showToast(`✨ Recommended top ${expVal} in ${cityName}!`);
      } else {
        showToast(`📍 Showing recommended places in ${cityName}!`);
      }
    }
  }

  function selectCategorySuggestion(catName) {
    const input = document.getElementById('mapCatSearchInput');
    const clearBtn = document.getElementById('btnClearCatSearch');
    const dropdown = document.getElementById('catSuggestionsDropdown');

    if (input && input.value.trim().toLowerCase() === catName.toLowerCase()) {
      clearCategorySearch();
      return;
    }

    if (input) input.value = catName;
    if (clearBtn) clearBtn.style.display = 'flex';
    if (dropdown) dropdown.style.display = 'none';

    document.querySelectorAll('.cat-chip-btn').forEach(btn => {
      if (btn.getAttribute('data-cat') === catName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    applyDualSearchRecommendation();
  }

  function clearCategorySearch() {
    const input = document.getElementById('mapCatSearchInput');
    const clearBtn = document.getElementById('btnClearCatSearch');
    const dropdown = document.getElementById('catSuggestionsDropdown');

    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (dropdown) dropdown.style.display = 'none';

    document.querySelectorAll('.cat-chip-btn').forEach(btn => btn.classList.remove('active'));

    renderMapPlacesListAndPins();
  }

  function matchesCategoryQuery(p, query) {
    if (!query) return false;
    const q = query.toLowerCase().trim();
    const cat = (p.category || '').toLowerCase().trim();
    const name = (p.name || '').toLowerCase().trim();
    const desc = (p.description || '').toLowerCase().trim();

    // STRICT TEMPLE FILTERING:
    // If searching for temples, NEVER match non-temple categories like Forts, Cafes, Lakes, Viewpoints
    const isTempleSearch = ['temple', 'temples', 'kovil', 'koil', 'shrine', 'mandir', 'spiritual'].some(k => q.includes(k) || k.includes(q));
    if (isTempleSearch) {
      return cat === 'temples' || cat.includes('temple') || name.includes('temple') || name.includes('kovil') || name.includes('koil') || name.includes('shrine') || name.includes('mandir');
    }

    // STRICT CAFE FILTERING:
    const isCafeSearch = ['cafe', 'cafes', 'coffee', 'tea', 'bakery', 'bistro'].some(k => q.includes(k) || k.includes(q));
    if (isCafeSearch) {
      return cat === 'cafes' || cat.includes('cafe') || name.includes('cafe') || name.includes('coffee') || desc.includes('cafe') || desc.includes('coffee');
    }

    // STRICT FOOD FILTERING:
    const isFoodSearch = ['food', 'restaurant', 'mess', 'dining', 'lunch', 'biryani'].some(k => q.includes(k) || k.includes(q));
    if (isFoodSearch) {
      return cat === 'food' || cat.includes('food') || cat.includes('restaurant') || name.includes('mess') || name.includes('restaurant') || desc.includes('mess') || desc.includes('meals');
    }

    // STRICT FORT FILTERING:
    const isFortSearch = ['fort', 'forts', 'bastion', 'castle'].some(k => q.includes(k) || k.includes(q));
    if (isFortSearch) {
      return cat === 'forts' || cat.includes('fort') || name.includes('fort') || name.includes('bastion');
    }

    if (cat === q || cat.includes(q) || name.includes(q)) return true;

    const foundSugg = ALL_CATEGORY_SUGGESTIONS.find(s => s.name.toLowerCase() === q);
    if (foundSugg) {
      return foundSugg.keywords.some(kw => cat === kw || cat.includes(kw) || name.includes(kw));
    }
    return false;
  }

  function renderMapPlacesListAndPins(searchOverride) {
    const cityData = MAP_EXPLORER_DATA[currentCityKey] || MAP_EXPLORER_DATA.yercaud;
    const places = cityData.places || [];

    // Filter according to current UI selections
    let searchVal = '';
    if (searchOverride !== undefined) {
      searchVal = searchOverride.toLowerCase().trim();
    }
    if (searchVal === currentCityKey || (cityData.name && cityData.name.toLowerCase().includes(searchVal))) {
      searchVal = '';
    }

    const checkedCats = Array.from(document.querySelectorAll('.cat-check-item input[type="checkbox"]:checked')).map(cb => cb.value);
    const maxDist = parseFloat(document.getElementById('mapDistanceFilter')?.value || '999');
    const budgetVal = document.getElementById('mapBudgetFilter')?.value || 'any';
    const verifiedOnly = document.getElementById('mapVerifiedToggle')?.checked || false;
    const catSearchVal = (document.getElementById('mapCatSearchInput')?.value || '').toLowerCase().trim();

    const filtered = places.filter(p => {
      if (searchVal && !p.name.toLowerCase().includes(searchVal) && !p.category.toLowerCase().includes(searchVal) && !p.description.toLowerCase().includes(searchVal)) return false;

      // Category matching:
      if (catSearchVal) {
        if (!matchesCategoryQuery(p, catSearchVal)) return false;
      } else if (checkedCats.length > 0) {
        if (!checkedCats.includes(p.category)) return false;
      }

      if (p.distance > maxDist) return false;
      if (verifiedOnly && !p.verified) return false;
      if (budgetVal === 'free' && p.priceVal > 0) return false;
      if (budgetVal === '100' && p.priceVal >= 100) return false;
      if (budgetVal === '300' && p.priceVal >= 300) return false;
      return true;
    });

    // Rank matching places to the top
    if (catSearchVal) {
      filtered.sort((a, b) => {
        const matchA = matchesCategoryQuery(a, catSearchVal);
        const matchB = matchesCategoryQuery(b, catSearchVal);
        if (matchA && !matchB) return -1;
        if (!matchA && matchB) return 1;
        return b.rating - a.rating;
      });
    }

    // Update count badge
    const badge = document.getElementById('mapPlacesCountBadge');
    if (badge) badge.textContent = `${filtered.length} places found`;

    // Render left list
    const listContainer = document.getElementById('mapPlacesCardList');
    if (listContainer) {
      if (filtered.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding:30px; color:#94a3b8; font-size:13px;">No places match your filters. Try clearing some filters!</div>';
      } else {
        listContainer.innerHTML = filtered.map(p => `
          <div class="map-place-item-card ${p.id === activeSelectedPlaceId ? 'active' : ''}" id="placeCard-${p.id}" onclick="window.selectMapPlace('${p.id}');">
            <img src="${p.thumb}" alt="${p.name}" class="place-card-thumb" loading="lazy" />
            <div class="place-card-info">
              <div class="place-card-title-row">
                <h4 class="place-card-name">${p.name}</h4>
                <button type="button" class="place-card-fav-btn" onclick="window.togglePlaceFav('${p.id}', event);">
                  <i class="fa-regular fa-heart"></i>
                </button>
              </div>
              <div class="place-card-meta">
                <span>📍 ${p.category} • ${p.distance} km</span>
              </div>
              <div class="place-card-badges-row">
                <span class="badge-cost">${p.priceText}</span>
                ${p.verified ? '<span class="badge-verified"><i class="fa-solid fa-circle-check"></i> Verified</span>' : ''}
                ${matchesCategoryQuery(p, catSearchVal) ? '<span class="badge-recommended"><i class="fa-solid fa-star"></i> Recommended</span>' : ''}
              </div>
              <div class="place-card-rating">
                ★ ${p.rating} <span style="color:#64748b; font-weight:400; font-size:10px;">(${p.reviews})</span>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Render Leaflet Pins
    if (leafletMapInstance && window.L) {
      // Clear existing markers
      Object.values(activeMarkersMap).forEach(m => leafletMapInstance.removeLayer(m));
      activeMarkersMap = {};

      filtered.forEach(p => {
        const pinIcon = L.divIcon({
          className: 'custom-pin-wrapper',
          html: `
            <div class="custom-sutriva-pin ${p.id === activeSelectedPlaceId ? 'active' : ''}" id="pin-${p.id}">
              <i class="fa-solid ${
                p.category === 'Waterfall' ? 'fa-water' : 
                p.category === 'Lake' ? 'fa-ship' : 
                p.category === 'Temples' ? 'fa-gopuram' : 
                p.category === 'Cafes' ? 'fa-mug-hot' : 
                p.category === 'Food' ? 'fa-utensils' : 
                p.category === 'Forts' ? 'fa-monument' : 
                p.category === 'Parks' ? 'fa-tree' : 
                'fa-mountain'
              }"></i>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        const marker = L.marker([p.lat, p.lng], { icon: pinIcon }).addTo(leafletMapInstance);

        // Custom InfoWindow Popup matching Mockup
        const popupContent = `
          <div class="map-infowindow-card">
            <img src="${p.thumb}" alt="${p.name}" class="map-infowindow-thumb" />
            <div class="map-infowindow-details">
              <h4 class="map-infowindow-title">${p.name}</h4>
              <div class="map-infowindow-meta">📍 ${p.category} • ${p.distance} km</div>
              <div style="display:flex; gap:4px; align-items:center; margin-top:4px;">
                <span class="badge-cost" style="font-size:9px;">${p.priceText}</span>
                ${p.verified ? '<span class="badge-verified" style="font-size:9px;">✓ Verified</span>' : ''}
              </div>
              <button type="button" onclick="window.getLiveRouteToPlace('${encodeURIComponent(p.name)}', ${p.lat}, ${p.lng}); event.stopPropagation();" style="margin-top:6px; background:#059669; color:#fff; border:none; border-radius:6px; font-size:10px; font-weight:700; padding:3px 8px; cursor:pointer; display:flex; align-items:center; gap:4px;">
                <i class="fa-solid fa-route"></i> Get Live Route
              </button>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, { closeButton: true, offset: [0, -20] });

        marker.on('click', () => {
          selectMapPlace(p.id, false);
        });

        activeMarkersMap[p.id] = marker;
      });
    }
  }

  function toggleDetailsPanel(show) {
    const detailsPanel = document.getElementById('mapPlaceDetailsPanel');
    const grid = document.getElementById('mapContentGrid');
    if (!detailsPanel || !grid) return;
    if (show) {
      detailsPanel.style.display = 'flex';
      grid.style.gridTemplateColumns = '330px 1fr 340px';
    } else {
      detailsPanel.style.display = 'none';
      grid.style.gridTemplateColumns = '330px 1fr';
    }
    setTimeout(() => {
      if (leafletMapInstance) leafletMapInstance.invalidateSize();
    }, 250);
  }

  function selectMapPlace(placeId, shouldPan = true) {
    activeSelectedPlaceId = placeId;
    const cityData = MAP_EXPLORER_DATA[currentCityKey] || MAP_EXPLORER_DATA.yercaud;
    const place = cityData.places.find(p => p.id === placeId) || cityData.places[0];
    if (!place) return;

    toggleDetailsPanel(true);

    // Highlight card in left list
    document.querySelectorAll('.map-place-item-card').forEach(c => c.classList.remove('active'));
    const targetCard = document.getElementById(`placeCard-${place.id}`);
    if (targetCard) {
      targetCard.classList.add('active');
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Update marker pins active state
    document.querySelectorAll('.custom-sutriva-pin').forEach(pin => pin.classList.remove('active'));
    const targetPin = document.getElementById(`pin-${place.id}`);
    if (targetPin) targetPin.classList.add('active');

    // Pan map & open popup
    if (leafletMapInstance && activeMarkersMap[place.id]) {
      const marker = activeMarkersMap[place.id];
      if (shouldPan) {
        leafletMapInstance.flyTo([place.lat, place.lng], 14, { duration: 0.8 });
      }
      setTimeout(() => {
        marker.openPopup();
      }, 300);
    }

    // Render Right Place Details Panel (Matching Mockup)
    const detailsContainer = document.getElementById('mapPlaceDetailsCard');
    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div class="details-hero-box">
          <img src="${place.gallery[0] || place.thumb}" alt="${place.name}" class="details-hero-img" />
          <div class="details-hero-actions">
            <button class="details-action-btn" onclick="window.toggleDetailsPanel(false);" title="Close Details (Full-Width Map)"><i class="fa-solid fa-xmark"></i></button>
            <button class="details-action-btn" onclick="window.togglePlaceFav('${place.id}', event);" title="Save Place"><i class="fa-regular fa-heart"></i></button>
          </div>
        </div>

        <div class="details-title-section">
          <h3>${place.name}</h3>
          <div class="details-location-text">
            <i class="fa-solid fa-location-dot" style="color:#059669;"></i> ${place.category} • ${place.distance} km from center
          </div>
        </div>

        <div class="details-badges-row">
          <span class="badge-cost" style="font-size:12px; padding:3px 8px;">${place.priceText}</span>
          ${place.verified ? '<span class="badge-verified" style="font-size:12px; padding:3px 8px;"><i class="fa-solid fa-circle-check"></i> Verified</span>' : ''}
        </div>

        <div class="details-rating-row">
          <span>★ ${place.rating}</span>
          <span style="color:#64748b; font-weight:500; font-size:12px;">(${place.reviews} verified reviews)</span>
        </div>

        <p class="details-desc-text">
          ${place.description}
        </p>

        <div class="details-gallery-title">Photos & Scenery</div>
        <div class="details-gallery-row">
          ${(place.gallery || [place.thumb]).map(img => `
            <img src="${img}" alt="${place.name}" class="details-gallery-thumb" loading="lazy" />
          `).join('')}
        </div>

        <button type="button" class="btn-get-directions" onclick="window.getLiveRouteToPlace('${encodeURIComponent(place.name)}', ${place.lat}, ${place.lng});">
          <i class="fa-solid fa-route"></i> Get Directions (Live Route on Map)
        </button>
        <button type="button" class="btn-open-google-ext" onclick="window.openExternalGoogleMapsNavigation('${encodeURIComponent(place.name)}', ${place.lat}, ${place.lng});" title="Open Turn-by-Turn GPS in Google Maps app">
          <i class="fa-solid fa-diamond-turn-right"></i> Open in Google Maps App
        </button>
      `;
    }
  }

  function changeMapCity(cityKey) {
    if (MAP_EXPLORER_DATA[cityKey]) {
      currentCityKey = cityKey;
      const firstPlace = MAP_EXPLORER_DATA[cityKey].places[0];
      activeSelectedPlaceId = firstPlace ? firstPlace.id : '';
      initExploreMapPage();
      if (typeof showToast === 'function') {
        showToast(`Loaded map and attractions for ${MAP_EXPLORER_DATA[cityKey].name}! 🗺️`);
      }
    }
  }

  function filterMapPlaces() {
    renderMapPlacesListAndPins();
  }

  function resetMapFilters() {
    document.querySelectorAll('.cat-check-item input[type="checkbox"]').forEach(cb => cb.checked = true);
    clearCategorySearch();
    const searchInput = document.getElementById('mapSearchInput');
    if (searchInput) searchInput.value = '';
    const distFilter = document.getElementById('mapDistanceFilter');
    if (distFilter) distFilter.value = '999';
    const budgetFilter = document.getElementById('mapBudgetFilter');
    if (budgetFilter) budgetFilter.value = 'any';
    const verifiedToggle = document.getElementById('mapVerifiedToggle');
    if (verifiedToggle) verifiedToggle.checked = true;

    renderMapPlacesListAndPins();
    if (typeof showToast === 'function') showToast('Filters cleared');
  }

  function sortMapPlaces(criteria) {
    const cityData = MAP_EXPLORER_DATA[currentCityKey];
    if (!cityData) return;

    if (criteria === 'distance') {
      cityData.places.sort((a, b) => a.distance - b.distance);
    } else if (criteria === 'rating') {
      cityData.places.sort((a, b) => b.rating - a.rating);
    } else if (criteria === 'price') {
      cityData.places.sort((a, b) => a.priceVal - b.priceVal);
    }
    renderMapPlacesListAndPins();
  }

  function findPlacesNearMe() {
    if (navigator.geolocation) {
      if (typeof showToast === 'function') showToast('Locating your position via GPS... 📍');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (leafletMapInstance) {
            leafletMapInstance.flyTo([pos.coords.latitude, pos.coords.longitude], 15);
            L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
              radius: 9,
              color: '#1877f2',
              fillColor: '#3b82f6',
              fillOpacity: 0.9
            }).addTo(leafletMapInstance).bindPopup('You are here! 📍').openPopup();
          }
          if (typeof showToast === 'function') showToast('Found your location! Pinpointed on map.');
        },
        () => {
          // Fallback to active place
          selectMapPlace(activeSelectedPlaceId);
          if (typeof showToast === 'function') showToast('Showing closest popular viewpoint in Yercaud!');
        }
      );
    } else {
      selectMapPlace(activeSelectedPlaceId);
    }
  }

  function toggleMapTileLayer() {
    if (!leafletMapInstance) return;
    if (isSatelliteTile) {
      leafletMapInstance.removeLayer(satelliteTileLayer);
      streetTileLayer.addTo(leafletMapInstance);
      isSatelliteTile = false;
      if (typeof showToast === 'function') showToast('Switched to Standard Street Map');
    } else {
      leafletMapInstance.removeLayer(streetTileLayer);
      satelliteTileLayer.addTo(leafletMapInstance);
      isSatelliteTile = true;
      if (typeof showToast === 'function') showToast('Switched to Satellite Aerial View');
    }
  }

  function toggleMapFullscreen() {
    const el = document.getElementById('mapCanvasWrapper');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function setMapLayoutMode(mode) {
    const container = document.getElementById('mapAppContainer');
    const btnDesktop = document.getElementById('btnDesktopView');
    const btnMobile = document.getElementById('btnMobileView');

    if (!container) return;

    if (mode === 'mobile') {
      container.classList.add('mobile-preview-mode');
      btnMobile?.classList.add('active');
      btnDesktop?.classList.remove('active');
      if (typeof showToast === 'function') showToast('Switched to Smartphone Preview Mode 📱');
    } else {
      container.classList.remove('mobile-preview-mode');
      btnDesktop?.classList.add('active');
      btnMobile?.classList.remove('active');
      if (typeof showToast === 'function') showToast('Switched to Full Desktop Workspace 🖥️');
    }

    if (leafletMapInstance) {
      setTimeout(() => leafletMapInstance.invalidateSize(), 300);
    }
  }

  function togglePlaceFav(placeId, event) {
    if (event) event.stopPropagation();
    const btn = event?.currentTarget;
    if (btn) {
      const icon = btn.querySelector('i');
      if (icon) {
        if (icon.classList.contains('fa-regular')) {
          icon.classList.remove('fa-regular');
          icon.classList.add('fa-solid');
          btn.style.color = '#ef4444';
          if (typeof showToast === 'function') showToast('Saved place to your Favorites! ❤️');
        } else {
          icon.classList.remove('fa-solid');
          icon.classList.add('fa-regular');
          btn.style.color = '#94a3b8';
          if (typeof showToast === 'function') showToast('Removed from Favorites');
        }
      }
    }
  }

  let cachedUserPosition = null;
  let isStartPinPickActive = false;

  async function reverseGeocodeCoord(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const place = addr.town || addr.village || addr.suburb || addr.city || addr.county || addr.state_district;
        if (place) return place;
      }
    } catch (e) {
      console.warn('Reverse geocode fetch error:', e);
    }
    return null;
  }

  async function setStartCity(cityName) {
    const fromInput = document.getElementById('mapFromInput');
    if (fromInput) fromInput.value = cityName;

    document.querySelectorAll('.origin-chip-btn').forEach(btn => {
      if (btn.innerText.includes(cityName)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    await searchMapRoute();
    if (typeof showToast === 'function') {
      showToast(`📍 Start point set to ${cityName}! Recalculating route... 🚗`);
    }
  }

  async function useCurrentGpsLocation() {
    if (typeof showToast === 'function') {
      showToast('📡 Accessing device GPS position...');
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const detected = await reverseGeocodeCoord(lat, lng) || 'GPS Location';
          const fromInput = document.getElementById('mapFromInput');
          if (fromInput) fromInput.value = detected.split(',')[0];

          document.querySelectorAll('.origin-chip-btn').forEach(btn => btn.classList.remove('active'));

          const destVal = document.getElementById('mapDestInput')?.value || 'Yercaud';
          const destCoord = await resolveLocationCoord(destVal);
          if (destCoord) {
            const fromCoord = { name: detected, lat, lng };
            await calculateAndDrawLiveRoute(fromCoord, destCoord);
            if (typeof showToast === 'function') {
              showToast(`📍 Detected position: ${detected.split(',')[0]}. Drag green pin to adjust anytime!`);
            }
          }
        },
        (err) => {
          if (typeof showToast === 'function') {
            showToast('Unable to fetch GPS. Pick your city from chips (Tiruchengode, Salem, etc.) 📍');
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }

  function enableStartPinClickMode() {
    if (!leafletMapInstance) return;
    isStartPinPickActive = true;
    leafletMapInstance.getContainer().style.cursor = 'crosshair';
    if (typeof showToast === 'function') {
      showToast('📍 Click anywhere on the map to place your Start location pin!');
    }
  }

  async function getLiveRouteToPlace(placeNameRaw, destLat, destLng) {
    const placeName = decodeURIComponent(placeNameRaw);
    const destCoord = {
      name: placeName,
      lat: parseFloat(destLat),
      lng: parseFloat(destLng)
    };

    // 1. Check if user typed an explicit origin in mapFromInput
    const fromVal = document.getElementById('mapFromInput')?.value?.trim();
    if (fromVal && fromVal.toLowerCase() !== 'my current location' && fromVal.toLowerCase() !== destCoord.name.toLowerCase()) {
      const fromCoord = await resolveLocationCoord(fromVal);
      if (fromCoord) {
        if (typeof showToast === 'function') {
          showToast(`🚗 Plotting route from ${fromCoord.name.split(',')[0]} ➔ ${destCoord.name}...`);
        }
        await calculateAndDrawLiveRoute(fromCoord, destCoord);
        return;
      }
    }

    if (typeof showToast === 'function') {
      showToast(`Locating your current GPS position... 📍`);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          cachedUserPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          const detectedTown = await reverseGeocodeCoord(pos.coords.latitude, pos.coords.longitude);
          const startLabel = detectedTown ? `${detectedTown}` : 'My Current Location';
          const fromCoord = {
            name: startLabel,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          await calculateAndDrawLiveRoute(fromCoord, destCoord);
        },
        async (err) => {
          console.warn('Geolocation unavailable/denied:', err);
          await fallbackRouteToPlace(destCoord);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      await fallbackRouteToPlace(destCoord);
    }
  }

  async function fallbackRouteToPlace(destCoord) {
    // 1. Try from input if specified
    const fromVal = document.getElementById('mapFromInput')?.value?.trim();
    let fromCoord = null;
    if (fromVal && fromVal.toLowerCase() !== destCoord.name.toLowerCase() && fromVal.toLowerCase() !== 'my current location') {
      fromCoord = await resolveLocationCoord(fromVal);
    }

    // 2. Fallback to location search input
    if (!fromCoord) {
      const locVal = document.getElementById('mapLocationSearchInput')?.value?.trim();
      if (locVal && locVal.toLowerCase() !== destCoord.name.toLowerCase()) {
        fromCoord = await resolveLocationCoord(locVal);
      }
    }

    // 3. Fallback to currentCityKey center
    if (!fromCoord) {
      const cityData = MAP_EXPLORER_DATA[currentCityKey] || MAP_EXPLORER_DATA.tiruchengode || MAP_EXPLORER_DATA.yercaud;
      fromCoord = {
        name: cityData.name ? cityData.name.split(',')[0] : 'Current City Center',
        lat: cityData.center[0],
        lng: cityData.center[1]
      };
    }

    if (typeof showToast === 'function') {
      showToast(`Plotting route from ${fromCoord.name.split(',')[0]} ➔ ${destCoord.name}... 🚗💨`);
    }

    await calculateAndDrawLiveRoute(fromCoord, destCoord);
  }

  async function calculateAndDrawLiveRoute(fromCoord, destCoord) {
    const fromInput = document.getElementById('mapFromInput');
    const toInput = document.getElementById('mapDestInput');
    if (fromInput) fromInput.value = fromCoord.name.split(',')[0];
    if (toInput) toInput.value = destCoord.name.split(',')[0];

    clearActiveRoute(false);

    // Call real free OSRM Driving Router for highway road geometry
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromCoord.lng},${fromCoord.lat};${destCoord.lng},${destCoord.lat}?overview=full&geometries=geojson`;

    try {
      const resp = await fetch(osrmUrl);
      const data = await resp.json();

      if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distKm = Math.round(route.distance / 1000);
        const hours = Math.floor(route.duration / 3600);
        const mins = Math.round((route.duration % 3600) / 60);
        const timeStr = hours > 0 ? `${hours} hrs ${mins} mins` : `${mins} mins`;

        drawRouteOnMap(route.geometry, fromCoord, destCoord, distKm, timeStr);

        if (typeof showToast === 'function') {
          showToast(`🚗 Route: ${fromCoord.name.split(',')[0]} ➔ ${destCoord.name} (${distKm} km • ${timeStr})`);
        }
      } else {
        drawFallbackRoute(fromCoord, destCoord);
      }
    } catch (err) {
      console.warn('OSRM routing fetch issue, using smooth route fallback:', err);
      drawFallbackRoute(fromCoord, destCoord);
    }
  }

  function openPlaceGoogleDirections(placeName, lat, lng) {
    getLiveRouteToPlace(placeName, lat, lng);
  }

  function openExternalGoogleMapsNavigation(placeName, lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${placeName}`;
    window.open(url, '_blank');
  }

  const CITY_COORDINATES = {
    // Tamil Nadu Major Cities & Towns
    chennai: { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
    tiruchengode: { name: 'Tiruchengode, Tamil Nadu', lat: 11.3787, lng: 77.8949 },
    tiruchengodu: { name: 'Tiruchengode, Tamil Nadu', lat: 11.3787, lng: 77.8949 },
    namakkal: { name: 'Namakkal, Tamil Nadu', lat: 11.2189, lng: 78.1674 },
    salem: { name: 'Salem, Tamil Nadu', lat: 11.6643, lng: 78.1460 },
    erode: { name: 'Erode, Tamil Nadu', lat: 11.3410, lng: 77.7172 },
    coimbatore: { name: 'Coimbatore, Tamil Nadu', lat: 11.0168, lng: 76.9558 },
    tiruppur: { name: 'Tiruppur, Tamil Nadu', lat: 11.1085, lng: 77.3411 },
    karur: { name: 'Karur, Tamil Nadu', lat: 10.9601, lng: 78.0766 },
    dindigul: { name: 'Dindigul, Tamil Nadu', lat: 10.3673, lng: 77.9803 },
    madurai: { name: 'Madurai, Tamil Nadu', lat: 9.9252, lng: 78.1198 },
    trichy: { name: 'Tiruchirappalli, Tamil Nadu', lat: 10.7905, lng: 78.7047 },
    tiruchirappalli: { name: 'Tiruchirappalli, Tamil Nadu', lat: 10.7905, lng: 78.7047 },
    thanjavur: { name: 'Thanjavur, Tamil Nadu', lat: 10.7870, lng: 79.1378 },
    kumbakonam: { name: 'Kumbakonam, Tamil Nadu', lat: 10.9602, lng: 79.3845 },
    vellore: { name: 'Vellore, Tamil Nadu', lat: 12.9165, lng: 79.1325 },
    hosur: { name: 'Hosur, Tamil Nadu', lat: 12.7409, lng: 77.8253 },
    dharmapuri: { name: 'Dharmapuri, Tamil Nadu', lat: 12.1211, lng: 78.1582 },
    krishnagiri: { name: 'Krishnagiri, Tamil Nadu', lat: 12.5186, lng: 78.2137 },
    tiruvannamalai: { name: 'Tiruvannamalai, Tamil Nadu', lat: 12.2253, lng: 79.0747 },
    kanchipuram: { name: 'Kanchipuram, Tamil Nadu', lat: 12.8342, lng: 79.7036 },
    chengalpattu: { name: 'Chengalpattu, Tamil Nadu', lat: 12.6841, lng: 79.9836 },
    villupuram: { name: 'Villupuram, Tamil Nadu', lat: 11.9401, lng: 79.4861 },
    cuddalore: { name: 'Cuddalore, Tamil Nadu', lat: 11.7480, lng: 79.7714 },
    tirunelveli: { name: 'Tirunelveli, Tamil Nadu', lat: 8.7139, lng: 77.7567 },
    thoothukudi: { name: 'Thoothukudi, Tamil Nadu', lat: 8.7642, lng: 78.1348 },
    kanyakumari: { name: 'Kanyakumari, Tamil Nadu', lat: 8.0883, lng: 77.5385 },
    nagercoil: { name: 'Nagercoil, Tamil Nadu', lat: 8.1833, lng: 77.4119 },
    rameswaram: { name: 'Rameswaram, Tamil Nadu', lat: 9.2876, lng: 79.3129 },
    pollachi: { name: 'Pollachi, Tamil Nadu', lat: 10.6609, lng: 77.0048 },
    valparai: { name: 'Valparai, Tamil Nadu', lat: 10.3262, lng: 76.9554 },
    kollihills: { name: 'Kolli Hills, Tamil Nadu', lat: 11.2485, lng: 78.3389 },
    rasipuram: { name: 'Rasipuram, Tamil Nadu', lat: 11.4633, lng: 78.1793 },
    sankari: { name: 'Sankari, Tamil Nadu', lat: 11.4889, lng: 77.8687 },
    bhavani: { name: 'Bhavani, Tamil Nadu', lat: 11.4500, lng: 77.6833 },
    komarapalayam: { name: 'Komarapalayam, Tamil Nadu', lat: 11.4428, lng: 77.7078 },
    perundurai: { name: 'Perundurai, Tamil Nadu', lat: 11.2778, lng: 77.5833 },
    puducherry: { name: 'Puducherry', lat: 11.9416, lng: 79.8083 },
    pondicherry: { name: 'Puducherry', lat: 11.9416, lng: 79.8083 },

    // Hill Stations & Vacation Hotspots
    yercaud: { name: 'Yercaud, Tamil Nadu', lat: 11.7820, lng: 78.2120 },
    ooty: { name: 'Ooty, Nilgiris', lat: 11.4102, lng: 76.6950 },
    coonoor: { name: 'Coonoor, Nilgiris', lat: 11.3530, lng: 76.7959 },
    kodaikanal: { name: 'Kodaikanal, Tamil Nadu', lat: 10.2381, lng: 77.4892 },
    munnar: { name: 'Munnar, Kerala', lat: 10.0889, lng: 77.0595 },
    goa: { name: 'Goa (Panaji)', lat: 15.4924, lng: 73.8180 },
    manali: { name: 'Manali, Himachal Pradesh', lat: 32.2396, lng: 77.1887 },
    wayanad: { name: 'Wayanad, Kerala', lat: 11.6854, lng: 76.1320 },
    coorg: { name: 'Coorg, Karnataka', lat: 12.4244, lng: 75.7382 },
    chikmagalur: { name: 'Chikmagalur, Karnataka', lat: 13.3161, lng: 75.7720 },

    // Other Major Metros
    bangalore: { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
    bengaluru: { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
    mysore: { name: 'Mysuru, Karnataka', lat: 12.2958, lng: 76.6394 },
    hyderabad: { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
    kochi: { name: 'Kochi, Kerala', lat: 9.9312, lng: 76.2673 },
    trivandrum: { name: 'Thiruvananthapuram, Kerala', lat: 8.5241, lng: 76.9366 },
    mumbai: { name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 },
    pune: { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
    delhi: { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
    jaipur: { name: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873 }
  };

  let activeRouteLayerGroup = null;

  async function resolveLocationCoord(inputStr) {
    if (!inputStr) return null;
    const clean = inputStr.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    // 1. Direct dictionary key match
    if (CITY_COORDINATES[clean]) {
      return CITY_COORDINATES[clean];
    }

    // 2. Substring match in dictionary
    for (const [key, item] of Object.entries(CITY_COORDINATES)) {
      if (clean.includes(key) || key.includes(clean)) {
        return item;
      }
    }

    // 3. Substring match in MAP_EXPLORER_DATA
    for (const [key, data] of Object.entries(MAP_EXPLORER_DATA)) {
      if (clean.includes(key) || (data.name && data.name.toLowerCase().includes(clean))) {
        return { name: data.name, lat: data.center[0], lng: data.center[1] };
      }
    }

    // 4. Live Nominatim Geocoding API for ANY town/city/place
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(inputStr + ', Tamil Nadu, India')}`;
      const res = await fetch(geoUrl, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (data && data.length > 0) {
        const top = data[0];
        const formattedName = inputStr.trim().charAt(0).toUpperCase() + inputStr.trim().slice(1);
        const resolved = {
          name: formattedName,
          lat: parseFloat(top.lat),
          lng: parseFloat(top.lon)
        };
        CITY_COORDINATES[clean] = resolved;
        return resolved;
      }

      // Retry without Tamil Nadu restriction (global search)
      const globalUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(inputStr)}`;
      const resG = await fetch(globalUrl, { headers: { 'Accept': 'application/json' } });
      const dataG = await resG.json();
      if (dataG && dataG.length > 0) {
        const topG = dataG[0];
        const formattedName = inputStr.trim().charAt(0).toUpperCase() + inputStr.trim().slice(1);
        const resolved = {
          name: formattedName,
          lat: parseFloat(topG.lat),
          lng: parseFloat(topG.lon)
        };
        CITY_COORDINATES[clean] = resolved;
        return resolved;
      }
    } catch (e) {
      console.warn('Geocoding fetch error for:', inputStr, e);
    }

    return null;
  }

  function swapMapFromTo() {
    const fromEl = document.getElementById('mapFromInput');
    const destEl = document.getElementById('mapDestInput');
    if (fromEl && destEl) {
      const temp = fromEl.value;
      fromEl.value = destEl.value;
      destEl.value = temp;
      if (typeof showToast === 'function') {
        showToast('Swapped From and Destination! 🔄');
      }
      searchMapRoute();
    }
  }

  function handleMapDestSearch(val) {
    const query = (val || '').trim().toLowerCase();
    if (!query) {
      renderMapPlacesListAndPins();
      return;
    }

    // Check if query directly matches a pre-loaded city key
    for (const cityKey of Object.keys(MAP_EXPLORER_DATA)) {
      const cityData = MAP_EXPLORER_DATA[cityKey];
      if (cityKey === query || cityData.name.toLowerCase() === query) {
        if (currentCityKey !== cityKey) {
          changeMapCity(cityKey);
        }
        return;
      }
    }
  }

  async function searchMapRoute() {
    const fromVal = (document.getElementById('mapFromInput')?.value || '').trim();
    const destVal = (document.getElementById('mapDestInput')?.value || '').trim();

    if (!fromVal || !destVal) {
      if (typeof showToast === 'function') showToast('Please enter both From and Destination!');
      return;
    }

    if (typeof showToast === 'function') {
      showToast(`Locating ${fromVal} and ${destVal}... 🔍`);
    }

    const fromCoord = await resolveLocationCoord(fromVal);
    const destCoord = await resolveLocationCoord(destVal);

    if (!fromCoord) {
      if (typeof showToast === 'function') showToast(`Location "${fromVal}" not found. Check spelling! ⚠️`);
      return;
    }
    if (!destCoord) {
      if (typeof showToast === 'function') showToast(`Destination "${destVal}" not found. Check spelling! ⚠️`);
      return;
    }

    // Check if destination matches or is added to MAP_EXPLORER_DATA
    const destClean = destVal.toLowerCase().replace(/[^a-z0-9]/g, '');
    let matchedCityKey = null;
    for (const cityKey of Object.keys(MAP_EXPLORER_DATA)) {
      if (destClean.includes(cityKey) || cityKey.includes(destClean)) {
        matchedCityKey = cityKey;
        break;
      }
    }

    if (matchedCityKey) {
      currentCityKey = matchedCityKey;
      const firstPlace = MAP_EXPLORER_DATA[matchedCityKey].places[0];
      activeSelectedPlaceId = firstPlace ? firstPlace.id : '';
    } else {
      // Dynamically add destination to MAP_EXPLORER_DATA with real center coordinates
      const baseName = destCoord.name.split(',')[0].trim();
      MAP_EXPLORER_DATA[destClean] = {
        name: destCoord.name,
        center: [destCoord.lat, destCoord.lng],
        zoom: 13,
        places: [
          {
            id: `${destClean}-spot-1`,
            name: `${baseName} Main Center`,
            category: 'Viewpoint',
            distance: 0.8,
            priceText: 'Free Entry',
            priceVal: 0,
            verified: true,
            rating: 4.6,
            reviews: 320,
            lat: destCoord.lat + 0.005,
            lng: destCoord.lng + 0.005,
            thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
            gallery: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'],
            description: `Central tourist attraction and landmarks around ${baseName}.`
          },
          {
            id: `${destClean}-spot-2`,
            name: `${baseName} Scenic Hills & Nature`,
            category: 'Hills & Nature',
            distance: 2.4,
            priceText: 'Free Entry',
            priceVal: 0,
            verified: true,
            rating: 4.5,
            reviews: 180,
            lat: destCoord.lat - 0.006,
            lng: destCoord.lng + 0.004,
            thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
            gallery: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'],
            description: `Scenic viewpoints and beautiful countryside landscapes around ${baseName}.`
          },
          {
            id: `${destClean}-spot-3`,
            name: `${baseName} Historic Temple`,
            category: 'Temples',
            distance: 1.8,
            priceText: 'Free Entry',
            priceVal: 0,
            verified: true,
            rating: 4.8,
            reviews: 540,
            lat: destCoord.lat + 0.003,
            lng: destCoord.lng - 0.005,
            thumb: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
            gallery: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'],
            description: `Renowned ancient spiritual heritage temple with magnificent Dravidian gopuram sculptures and serene atmosphere.`
          },
          {
            id: `${destClean}-spot-4`,
            name: `${baseName} Heritage Fort & Bastion`,
            category: 'Forts',
            distance: 3.6,
            priceText: '₹25 - ₹50',
            priceVal: 35,
            verified: true,
            rating: 4.4,
            reviews: 210,
            lat: destCoord.lat - 0.008,
            lng: destCoord.lng - 0.007,
            thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
            gallery: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'],
            description: `Historic stone rampart fort complex offering sweeping panoramic vistas and rich regional history.`
          },
          {
            id: `${destClean}-spot-5`,
            name: `${baseName} Botanical Garden & Park`,
            category: 'Parks',
            distance: 1.5,
            priceText: '₹20',
            priceVal: 20,
            verified: true,
            rating: 4.5,
            reviews: 320,
            lat: destCoord.lat + 0.007,
            lng: destCoord.lng - 0.002,
            thumb: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80',
            gallery: ['https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80'],
            description: `Lush green public botanical park with flowering pathways, children play area, and relaxing fountains.`
          },
          {
            id: `${destClean}-spot-6`,
            name: `${baseName} Lake & Boating`,
            category: 'Lake',
            distance: 2.1,
            priceText: '₹50 - ₹120',
            priceVal: 80,
            verified: true,
            rating: 4.6,
            reviews: 410,
            lat: destCoord.lat - 0.004,
            lng: destCoord.lng + 0.009,
            thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
            gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'],
            description: `Tranquil freshwater lake offering leisurely paddle boat rides and scenic lakeside sunset promenade.`
          }
        ]
      };
      currentCityKey = destClean;
      activeSelectedPlaceId = `${destClean}-spot-1`;
    }

    renderMapPlacesListAndPins();
    selectMapPlace(activeSelectedPlaceId, false);

    if (typeof showToast === 'function') {
      showToast(`Plotting route: ${fromCoord.name.split(',')[0]} ➔ ${destCoord.name.split(',')[0]}... 🚗💨`);
    }

    clearActiveRoute(false);

    // Call real free OSRM Driving Router for highway road geometry
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromCoord.lng},${fromCoord.lat};${destCoord.lng},${destCoord.lat}?overview=full&geometries=geojson`;

    try {
      const resp = await fetch(osrmUrl);
      const data = await resp.json();

      if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distKm = Math.round(route.distance / 1000);
        const hours = Math.floor(route.duration / 3600);
        const mins = Math.round((route.duration % 3600) / 60);
        const timeStr = hours > 0 ? `${hours} hrs ${mins} mins` : `${mins} mins`;

        drawRouteOnMap(route.geometry, fromCoord, destCoord, distKm, timeStr);
      } else {
        drawFallbackRoute(fromCoord, destCoord);
      }
    } catch (err) {
      console.warn('OSRM routing fetch issue, using smooth route fallback:', err);
      drawFallbackRoute(fromCoord, destCoord);
    }
  }

  function drawRouteOnMap(geojsonGeometry, fromCoord, destCoord, distKm, timeStr) {
    if (!leafletMapInstance || !window.L) return;

    clearActiveRoute(false);

    // Darker outline for highway track
    const glowLayer = L.geoJSON(geojsonGeometry, {
      style: {
        color: '#1d4ed8',
        weight: 9,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round'
      }
    });

    // Vibrant Blue main driving route
    const roadLayer = L.geoJSON(geojsonGeometry, {
      style: {
        color: '#2563eb',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }
    });

    // Start Marker (DRAGGABLE for pinpoint accuracy)
    const startName = fromCoord.name.split(',')[0];
    const startIcon = L.divIcon({
      className: 'route-marker-wrapper',
      html: `<div class="route-pin-badge start" title="Drag to adjust your exact start point"><i class="fa-solid fa-circle-dot"></i> Start: ${startName}</div>`,
      iconSize: [140, 30],
      iconAnchor: [70, 15]
    });
    const startMarker = L.marker([fromCoord.lat, fromCoord.lng], { icon: startIcon, draggable: true });
    startMarker.bindTooltip('📍 Drag me to set your exact starting point!', { direction: 'top', offset: [0, -18] });
    startMarker.on('dragend', async function(e) {
      const newPos = e.target.getLatLng();
      const revName = await reverseGeocodeCoord(newPos.lat, newPos.lng) || 'Custom Start';
      const newFrom = {
        name: revName,
        lat: newPos.lat,
        lng: newPos.lng
      };
      const fromInput = document.getElementById('mapFromInput');
      if (fromInput) fromInput.value = revName.split(',')[0];
      await calculateAndDrawLiveRoute(newFrom, destCoord);
      if (typeof showToast === 'function') {
        showToast(`📍 Start updated to ${revName.split(',')[0]}! Recalculating route... 🚗`);
      }
    });

    // Destination Marker
    const destName = destCoord.name.split(',')[0];
    const endIcon = L.divIcon({
      className: 'route-marker-wrapper',
      html: `<div class="route-pin-badge end"><i class="fa-solid fa-flag-checkered"></i> Destination: ${destName}</div>`,
      iconSize: [140, 30],
      iconAnchor: [70, 15]
    });
    const endMarker = L.marker([destCoord.lat, destCoord.lng], { icon: endIcon });

    activeRouteLayerGroup = L.layerGroup([glowLayer, roadLayer, startMarker, endMarker]).addTo(leafletMapInstance);

    // Zoom and frame complete road route on the screen
    const bounds = roadLayer.getBounds();
    leafletMapInstance.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 13
    });

    // Show floating route details card on the map
    const routeBox = document.getElementById('mapRouteSummaryFloating');
    const distText = document.getElementById('routeDistanceText');
    const hwayText = document.getElementById('routeHighwayText');
    if (routeBox && distText) {
      distText.innerHTML = `<strong>${distKm} km</strong> (${timeStr})`;
      if (hwayText) hwayText.textContent = `Fastest road route: ${startName} ➔ ${destName}`;
      routeBox.style.display = 'flex';
    }

    // Also prepend Route Overview to left places list
    prependRouteSummaryToPlacesList(startName, destName, distKm, timeStr);
  }

  function prependRouteSummaryToPlacesList(startName, destName, distKm, timeStr) {
    const listContainer = document.getElementById('mapPlacesCardList');
    if (!listContainer) return;

    const existingCard = document.getElementById('routeTripOverviewCard');
    if (existingCard) existingCard.remove();

    const overviewHtml = `
      <div class="route-trip-overview-card" id="routeTripOverviewCard">
        <div class="route-trip-title"><i class="fa-solid fa-route"></i> ${startName} ➔ ${destName}</div>
        <div class="route-trip-stat-grid">
          <div class="trip-stat-item"><span class="val">${distKm} km</span><span class="lbl">Distance</span></div>
          <div class="trip-stat-item"><span class="val">${timeStr}</span><span class="lbl">Drive Time</span></div>
          <div class="trip-stat-item"><span class="val">Live GPS</span><span class="lbl">Optimal</span></div>
        </div>
      </div>
    `;
    listContainer.insertAdjacentHTML('afterbegin', overviewHtml);
  }

  function drawFallbackRoute(fromCoord, destCoord) {
    if (!leafletMapInstance || !window.L) return;
    const latlngs = [
      [fromCoord.lat, fromCoord.lng],
      [(fromCoord.lat + destCoord.lat) / 2 + 0.05, (fromCoord.lng + destCoord.lng) / 2 - 0.05],
      [destCoord.lat, destCoord.lng]
    ];
    const polyline = L.polyline(latlngs, { color: '#2563eb', weight: 6, opacity: 0.9, dashArray: '8, 8' });
    activeRouteLayerGroup = L.layerGroup([polyline]).addTo(leafletMapInstance);
    leafletMapInstance.fitBounds(polyline.getBounds(), { padding: [60, 60] });

    const startName = fromCoord.name.split(',')[0];
    const destName = destCoord.name.split(',')[0];
    const routeBox = document.getElementById('mapRouteSummaryFloating');
    const distText = document.getElementById('routeDistanceText');
    if (routeBox && distText) {
      distText.innerHTML = `<strong>Route active</strong>`;
      routeBox.style.display = 'flex';
    }
    prependRouteSummaryToPlacesList(startName, destName, 'Direct', 'Driving');
  }

  function clearActiveRoute(resetZoom = true) {
    if (activeRouteLayerGroup && leafletMapInstance) {
      leafletMapInstance.removeLayer(activeRouteLayerGroup);
      activeRouteLayerGroup = null;
    }
    const routeBox = document.getElementById('mapRouteSummaryFloating');
    if (routeBox) routeBox.style.display = 'none';

    if (resetZoom && leafletMapInstance) {
      const cityData = MAP_EXPLORER_DATA[currentCityKey] || MAP_EXPLORER_DATA.yercaud;
      leafletMapInstance.flyTo(cityData.center, cityData.zoom, { duration: 0.8 });
    }
  }

  function openGoogleMapsExternalRoute() {
    const fromVal = document.getElementById('mapFromInput')?.value.trim() || 'Chennai';
    const destVal = document.getElementById('mapDestInput')?.value.trim() || 'Yercaud';
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fromVal)}&destination=${encodeURIComponent(destVal)}`;
    window.open(url, '_blank');
  }

  // Expose to window
  window.initExploreMapPage = initExploreMapPage;
  window.renderMapPlacesListAndPins = renderMapPlacesListAndPins;
  window.selectMapPlace = selectMapPlace;
  window.changeMapCity = changeMapCity;
  window.filterMapPlaces = filterMapPlaces;
  window.resetMapFilters = resetMapFilters;
  window.sortMapPlaces = sortMapPlaces;
  window.findPlacesNearMe = findPlacesNearMe;
  window.toggleMapTileLayer = toggleMapTileLayer;
  window.toggleMapFullscreen = toggleMapFullscreen;
  window.setMapLayoutMode = setMapLayoutMode;
  window.togglePlaceFav = togglePlaceFav;
  window.openPlaceGoogleDirections = openPlaceGoogleDirections;
  window.swapMapFromTo = swapMapFromTo;
  window.handleMapDestSearch = handleMapDestSearch;
  window.searchMapRoute = searchMapRoute;
  window.clearActiveRoute = clearActiveRoute;
  window.openGoogleMapsExternalRoute = openGoogleMapsExternalRoute;
  window.handleCategorySearchInput = handleCategorySearchInput;
  window.showCategorySuggestionsDropdown = showCategorySuggestionsDropdown;
  window.selectCategorySuggestion = selectCategorySuggestion;
  window.clearCategorySearch = clearCategorySearch;
  window.handleDualLocationInput = handleDualLocationInput;
  window.clearDualLocation = clearDualLocation;
  window.applyDualSearchRecommendation = applyDualSearchRecommendation;
  window.getLiveRouteToPlace = getLiveRouteToPlace;
  window.openExternalGoogleMapsNavigation = openExternalGoogleMapsNavigation;
  window.setStartCity = setStartCity;
  window.useCurrentGpsLocation = useCurrentGpsLocation;
  window.enableStartPinClickMode = enableStartPinClickMode;
  window.reverseGeocodeCoord = reverseGeocodeCoord;
  window.toggleDetailsPanel = toggleDetailsPanel;

  // =========================================================================
  // GOVERNMENT PUBLIC TRANSPORT BUS PORTAL (MONGODB localhost:27017)
  // =========================================================================
  let govtBusCurrentPage = 1;
  let govtBusTotalPages = 1;
  let govtBusCurrentRoute = 'all';
  let govtBusCurrentTime = 'all';
  let cachedGovtBusesList = [];

  async function fetchGovernmentBuses(reset = true) {
    const container = document.getElementById('govtBusCardsGrid');
    const countBadge = document.getElementById('govtBusCountHeader');
    const statusText = document.getElementById('govtBusResultsStatusText');
    const paginationRow = document.getElementById('govtBusPaginationRow');

    if (reset) {
      govtBusCurrentPage = 1;
      if (container) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 28px; color: #10b981; margin-bottom: 12px;"></i>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">Querying Government Bus DB (localhost:27017)...</div>
            <div style="font-size: 12.5px; color: #64748b; margin-top: 4px;">Loading MTC routes from MongoDB "Governmet Bus" collection</div>
          </div>
        `;
      }
    }

    const routeInput = document.getElementById('govtBusRouteInput');
    const fromInput = document.getElementById('govtBusFromInput');
    const toInput = document.getElementById('govtBusToInput');

    const queryRoute = routeInput ? routeInput.value.trim() : '';
    const queryFrom = fromInput ? fromInput.value.trim() : '';
    const queryTo = toInput ? toInput.value.trim() : '';

    const params = new URLSearchParams();
    if (govtBusCurrentRoute && govtBusCurrentRoute !== 'all') {
      params.append('route', govtBusCurrentRoute);
    } else if (queryRoute) {
      params.append('search', queryRoute);
    }

    if (queryFrom) params.append('from', queryFrom);
    if (queryTo) params.append('to', queryTo);
    params.append('page', String(govtBusCurrentPage));
    params.append('limit', '30');

    try {
      const res = await fetch(`http://localhost:5000/api/v1/buses?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data && data.success && Array.isArray(data.data)) {
        govtBusTotalPages = data.totalPages || 1;
        if (countBadge && data.total) {
          countBadge.textContent = Number(data.total).toLocaleString();
        }

        let buses = data.data;

        // Filter by time of day if selected
        if (govtBusCurrentTime !== 'all') {
          buses = filterBusesByTime(buses, govtBusCurrentTime);
        }

        if (reset) {
          cachedGovtBusesList = buses;
        } else {
          cachedGovtBusesList = [...cachedGovtBusesList, ...buses];
        }

        if (statusText) {
          statusText.innerHTML = `<i class="fa-solid fa-circle-check text-green"></i> Found ${data.total} routes • Showing ${cachedGovtBusesList.length} trips from MongoDB localhost:27017`;
        }

        renderGovtBusCards(cachedGovtBusesList);

        if (paginationRow) {
          paginationRow.style.display = govtBusCurrentPage < govtBusTotalPages ? 'block' : 'none';
        }
      }
    } catch (err) {
      console.error('Failed to load Government buses from MongoDB:', err);
      if (container) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 30px; text-align: center; background: #fef2f2; border: 1.5px solid #fee2e2; border-radius: 14px; color: #991b1b;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 26px; margin-bottom: 8px;"></i>
            <div style="font-weight: 700; font-size: 15px;">Could not connect to Government Bus API (http://localhost:5000/api/v1/buses)</div>
            <div style="font-size: 12.5px; color: #b91c1c; margin-top: 6px;">Ensure MongoDB is running on port 27017 and backend server is started on port 5000.</div>
            <button onclick="fetchGovernmentBuses(true)" style="margin-top: 14px; padding: 8px 18px; border-radius: 8px; background: #dc2626; color: #fff; border: none; font-weight: 700; cursor: pointer;">
              <i class="fa-solid fa-rotate-right"></i> Try Again
            </button>
          </div>
        `;
      }
    }
  }

  function filterBusesByTime(buses, timeSlot) {
    return buses.filter(bus => {
      const time = bus.startTime || '00:00';
      const hour = parseInt(time.split(':')[0], 10);
      if (timeSlot === 'morning') return hour >= 4 && hour < 12;
      if (timeSlot === 'afternoon') return hour >= 12 && hour < 17;
      if (timeSlot === 'evening') return hour >= 17 && hour < 21;
      if (timeSlot === 'night') return hour >= 21 || hour < 4;
      return true;
    });
  }

  function renderGovtBusCards(buses) {
    const container = document.getElementById('govtBusCardsGrid');
    if (!container) return;

    if (!buses || buses.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: #64748b;">
          <i class="fa-solid fa-bus" style="font-size: 32px; color: #cbd5e1; margin-bottom: 12px;"></i>
          <div style="font-size: 16px; font-weight: 700; color: #1e293b;">No Government Buses Matched Your Filter</div>
          <div style="font-size: 13px; margin-top: 4px;">Try searching for a different route number, boarding stop, or click "All Routes".</div>
        </div>
      `;
      return;
    }

    container.innerHTML = buses.map(bus => {
      let serviceBadgeClass = '';
      const st = (bus.serviceType || '').toLowerCase();
      if (st.includes('express')) serviceBadgeClass = 'express';
      else if (st.includes('deluxe')) serviceBadgeClass = 'deluxe';
      else if (st.includes('air') || st.includes('volvo')) serviceBadgeClass = 'ac';

      return `
        <div class="govt-bus-card">
          <div>
            <div class="govt-bus-card-top">
              <div class="govt-card-route-badge">
                <i class="fa-solid fa-bus"></i> ${bus.routeNumber}
              </div>
              <span class="govt-card-service-type ${serviceBadgeClass}">
                ${bus.serviceType}
              </span>
            </div>

            <div class="govt-card-route-title" title="${bus.routeName}">
              ${bus.routeName}
            </div>

            <div class="govt-card-timeline-box">
              <div class="timeline-station">
                <strong>${bus.startTime}</strong>
                <span title="${bus.originStop}">${bus.originStop}</span>
              </div>
              <div class="timeline-divider">
                <i class="fa-solid fa-arrow-right-long"></i>
                <span>${bus.estimatedDuration}</span>
              </div>
              <div class="timeline-station right">
                <strong>${bus.endTime}</strong>
                <span title="${bus.destinationStop}">${bus.destinationStop}</span>
              </div>
            </div>

            <div class="govt-card-chips-row">
              <span class="govt-card-chip"><i class="fa-solid fa-map-pin" style="color: #10b981;"></i> ${bus.totalStops} Stops</span>
              <span class="govt-card-chip"><i class="fa-solid fa-building-columns" style="color: #0284c7;"></i> Operator: ${bus.operator}</span>
              <span class="govt-card-chip"><i class="fa-solid fa-circle-check" style="color: #10b981;"></i> Govt Scheduled</span>
            </div>
          </div>

          <div class="govt-card-footer">
            <div class="govt-card-fare-box">
              <span class="govt-fare-lbl">Govt Fare</span>
              <span class="govt-fare-val">${bus.estimatedFare}</span>
            </div>
            <button class="govt-card-view-btn" onclick="openGovtBusModal('${bus._id}')">
              View Stops <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  async function openGovtBusModal(busId) {
    const modal = document.getElementById('govtBusModal');
    if (!modal) return;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const badgeEl = document.getElementById('modalRouteBadge');
    const titleEl = document.getElementById('modalRouteTitle');
    const metaEl = document.getElementById('modalRouteMeta');
    const startEl = document.getElementById('modalStartTime');
    const endEl = document.getElementById('modalEndTime');
    const fareEl = document.getElementById('modalFare');
    const serviceEl = document.getElementById('modalServiceType');
    const timelineList = document.getElementById('modalTimelineList');

    if (timelineList) {
      timelineList.innerHTML = `
        <div style="padding: 30px; text-align: center; color: #64748b;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: #10b981; margin-bottom: 10px;"></i>
          <div>Fetching full stop timetable from MongoDB...</div>
        </div>
      `;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/v1/buses/${busId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const bus = json.data;

      if (badgeEl) badgeEl.textContent = bus.routeNumber;
      if (titleEl) titleEl.textContent = bus.routeName;
      if (metaEl) {
        metaEl.innerHTML = `<span><i class="fa-solid fa-building-columns"></i> ${bus.operator} Public Transport</span> • <span>${bus.totalStops} Stops</span> • <span>${bus.estimatedDuration}</span>`;
      }
      if (startEl) startEl.textContent = bus.startTime;
      if (endEl) endEl.textContent = bus.endTime;
      if (fareEl) fareEl.textContent = bus.estimatedFare;
      if (serviceEl) serviceEl.textContent = bus.serviceType;

      if (timelineList && Array.isArray(bus.stops)) {
        timelineList.innerHTML = bus.stops.map((stop, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === bus.stops.length - 1;
          const cls = isFirst ? 'timeline-stop-item first-stop' : (isLast ? 'timeline-stop-item last-stop' : 'timeline-stop-item');
          const timeVal = (stop.departureTime || stop.arrivalTime || '--:--').slice(0, 5);

          return `
            <div class="${cls}">
              <div class="stop-name-wrap">
                <span class="stop-order-num">${idx + 1}</span>
                <span class="stop-name-text">${stop.stopName}</span>
              </div>
              <span class="stop-time-tag">${timeVal}</span>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Failed to load bus details:', err);
      if (timelineList) {
        timelineList.innerHTML = `<div style="padding: 20px; color: #ef4444; text-align: center;">Failed to load stop timetable.</div>`;
      }
    }
  }

  function closeGovtBusModal() {
    const modal = document.getElementById('govtBusModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function initGovtBusListeners() {
    // Search Button
    const searchBtn = document.getElementById('govtBusSearchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        govtBusCurrentRoute = 'all';
        document.querySelectorAll('.govt-route-pill').forEach(p => p.classList.remove('active'));
        const allPill = document.querySelector('.govt-route-pill[data-route="all"]');
        if (allPill) allPill.classList.add('active');
        fetchGovernmentBuses(true);
      });
    }

    // Input Enter Key triggers search
    ['govtBusRouteInput', 'govtBusFromInput', 'govtBusToInput'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            govtBusCurrentRoute = 'all';
            document.querySelectorAll('.govt-route-pill').forEach(p => p.classList.remove('active'));
            fetchGovernmentBuses(true);
          }
        });
      }
    });

    // Clear Button
    const clearBtn = document.getElementById('govtBusClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const rInp = document.getElementById('govtBusRouteInput');
        const fInp = document.getElementById('govtBusFromInput');
        const tInp = document.getElementById('govtBusToInput');
        if (rInp) rInp.value = '';
        if (fInp) fInp.value = '';
        if (tInp) tInp.value = '';
        govtBusCurrentRoute = 'all';
        govtBusCurrentTime = 'all';
        document.querySelectorAll('.govt-route-pill').forEach(p => p.classList.remove('active'));
        const allPill = document.querySelector('.govt-route-pill[data-route="all"]');
        if (allPill) allPill.classList.add('active');
        document.querySelectorAll('.govt-time-pill').forEach(p => p.classList.remove('active'));
        const allTimePill = document.querySelector('.govt-time-pill[data-time="all"]');
        if (allTimePill) allTimePill.classList.add('active');
        fetchGovernmentBuses(true);
        showToast('Cleared Government Bus filters');
      });
    }

    // Sync MongoDB Button
    const refreshBtn = document.getElementById('govtBusRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        fetchGovernmentBuses(true);
        showToast('Syncing with MongoDB localhost:27017...');
      });
    }

    // Route Pills Click
    const quickRoutesWrap = document.getElementById('govtBusQuickRoutesList');
    if (quickRoutesWrap) {
      quickRoutesWrap.addEventListener('click', (e) => {
        const pill = e.target.closest('.govt-route-pill');
        if (!pill) return;
        quickRoutesWrap.querySelectorAll('.govt-route-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        govtBusCurrentRoute = pill.dataset.route || 'all';

        const routeInp = document.getElementById('govtBusRouteInput');
        if (routeInp) {
          routeInp.value = (govtBusCurrentRoute === 'all') ? '' : govtBusCurrentRoute;
        }
        fetchGovernmentBuses(true);
        showToast(govtBusCurrentRoute === 'all' ? 'Showing all Government bus routes' : `Filtering by Route ${govtBusCurrentRoute}`);
      });
    }

    // Timing Pills Click
    const timeFiltersWrap = document.getElementById('govtTimeFiltersList');
    if (timeFiltersWrap) {
      timeFiltersWrap.addEventListener('click', (e) => {
        const pill = e.target.closest('.govt-time-pill');
        if (!pill) return;
        timeFiltersWrap.querySelectorAll('.govt-time-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        govtBusCurrentTime = pill.dataset.time || 'all';
        fetchGovernmentBuses(true);
      });
    }

    // Load More Button
    const loadMoreBtn = document.getElementById('govtBusLoadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        if (govtBusCurrentPage < govtBusTotalPages) {
          govtBusCurrentPage++;
          fetchGovernmentBuses(false);
        }
      });
    }

    // Modal Close when clicking outside overlay
    const modal = document.getElementById('govtBusModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeGovtBusModal();
      });
    }
  }

  // Export functions to window
  window.fetchGovernmentBuses = fetchGovernmentBuses;
  window.openGovtBusModal = openGovtBusModal;
  window.closeGovtBusModal = closeGovtBusModal;

  // Initialize Government Bus event handlers
  initGovtBusListeners();

  // Check if Buses mode is active on load
  const currentActivePill = document.querySelector('.t-mode-pill.active');
  if (currentActivePill && currentActivePill.dataset.tmode === 'Buses') {
    setTransportMode('Buses');
  }

  // Auto-fetch if transport page is active or load on startup
  if (document.getElementById('transportPage')) {
    setTimeout(() => {
      fetchGovernmentBuses(false);
    }, 400);
  }
})();




