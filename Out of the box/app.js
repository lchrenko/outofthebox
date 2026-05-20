// app.js - Main Application Controller and Router for Lots2Homes Inc.
// db is already declared globally by db.js

// Initialize Database
try {
  db.init();
} catch (e) {
  console.error("Database initialization failed:", e);
}

// Safe Lucide Icon Compiler wrapper
function safeCreateIcons() {
  if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
    try {
      lucide.createIcons();
    } catch (e) {
      console.warn("Lucide icon generation encountered a minor issue:", e);
    }
  }
}

// App State Cache
const state = {
  activeRoute: 'home',
  currentLotGalleryIndex: 0,
  selectedDesignFinishPackage: 'fp_natural',
  selectedDesignUpgrades: new Set(),
  activeAdminTab: 'overview',
  activeContentSubTab: 'footer'
};

// Select DOM Viewport
const viewport = document.getElementById('app-viewport');
const mobileNavMenu = document.getElementById('mobile-nav-menu');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');

/* ==========================================================================
   1. ROUTER & CONTROLLER
   ========================================================================== */
const routes = {
  'home': () => renderHome(),
  'lots': () => renderLots(),
  'lots/:id': (id) => renderLotDetail(id),
  'designs': () => renderDesigns(),
  'designs/:id': (id) => renderDesignDetail(id),
  'process': () => renderProcess(),
  'submit-lot': () => renderSubmitLot(),
  'contractors': () => renderContractors(),
  'partners': () => renderPartners(),
  'faq': () => renderFAQ(),
  'contact': () => renderContact(),
  'start-your-build': () => renderStartYourBuild(),
  'admin': () => renderAdmin(),
  'admin/login': () => renderAdminLogin()
};

function router() {
  const hash = window.location.hash || '#/';
  let routePath = hash.replace(/^#\//, '') || 'home';
  
  // Close mobile navigation overlay on route change
  mobileNavMenu.style.display = 'none';

  // Handle Dynamic Routes (e.g., lots/:id, designs/:id)
  let matchedRoute = null;
  let param = null;

  for (const pattern of Object.keys(routes)) {
    if (pattern.includes('/:id')) {
      const prefix = pattern.replace('/:id', '');
      const regex = new RegExp(`^${prefix}/([^/]+)$`);
      const match = routePath.match(regex);
      if (match) {
        matchedRoute = pattern;
        param = match[1];
        break;
      }
    } else if (pattern === routePath) {
      matchedRoute = pattern;
      break;
    }
  }

  // Fallback to home
  if (!matchedRoute) {
    matchedRoute = 'home';
  }

  // Update navbar active state
  updateActiveNavLinks(matchedRoute);

  // Scroll to top
  window.scrollTo(0, 0);

  // Compile view
  try {
    const renderFn = routes[matchedRoute];
    renderFn(param);
    safeCreateIcons();
    updateAdminFab(matchedRoute, param);
  } catch (error) {
    console.error('Routing Error:', error);
    viewport.innerHTML = `
      <div class="container section-padding text-center">
        <h2 class="mb-2">View Render Failure</h2>
        <p class="text-secondary mb-4">We encountered an issue assembling this page view.</p>
        <a href="#/" class="btn btn-primary">Return to Homepage</a>
      </div>
    `;
  }
}

// Admin Floating Action Button Manager
function updateAdminFab(route, param) {
  const fab = document.getElementById('admin-edit-page-fab');
  const btn = document.getElementById('admin-edit-page-btn');
  if (!fab || !btn) return;
  
  const isAdmin = !!sessionStorage.getItem('l2h_admin_session');
  if (!isAdmin || route.startsWith('admin') || route === 'admin/login') {
    fab.style.display = 'none';
    return;
  }
  
  fab.style.display = 'block';
  
  // Clone button to remove old listeners
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  
  newBtn.addEventListener('click', () => {
    if (route === 'home' || route === 'home/:id') {
      state.activeAdminTab = 'content-editor';
      state.activeContentSubTab = 'home';
    } else if (route === 'process' || route === 'faq' || route === 'contact' || route === 'start-your-build') {
      state.activeAdminTab = 'content-editor';
      state.activeContentSubTab = 'others';
    } else if (route === 'lots') {
      state.activeAdminTab = 'lots';
    } else if (route === 'lots/:id') {
      state.activeAdminTab = 'lots';
      sessionStorage.setItem('l2h_admin_edit_lot_id', param);
    } else if (route === 'designs') {
      state.activeAdminTab = 'designs';
    } else if (route === 'designs/:id') {
      state.activeAdminTab = 'designs';
      sessionStorage.setItem('l2h_admin_edit_design_id', param);
    } else {
      state.activeAdminTab = 'content-editor';
      state.activeContentSubTab = 'footer';
    }
    window.location.hash = '#/admin';
  });
}

// Nav Links Styling Coordinator
function updateActiveNavLinks(matchedRoute) {
  let navName = matchedRoute;
  if (matchedRoute.startsWith('lots')) navName = 'lots';
  if (matchedRoute.startsWith('designs')) navName = 'designs';
  if (matchedRoute.startsWith('admin')) navName = 'admin';

  document.querySelectorAll('.nav-links .nav-item').forEach(item => {
    if (item.getAttribute('data-route') === navName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Dynamic Footer Render Engine
function renderFooter() {
  const footerElement = document.getElementById('app-footer');
  if (!footerElement) return;
  
  const settings = db.getSiteSettings();
  
  footerElement.innerHTML = `
    <div class="container">
      <div style="display: grid; grid-template-columns: 1.2fr repeat(3, 0.6fr); gap: 3rem; margin-bottom: 3rem;" class="grid-3">
        <!-- Brand Intro -->
        <div>
          <div class="logo" style="color: #ffffff; margin-bottom: 1.2rem;">
            <div class="logo-icon" style="background: linear-gradient(135deg, #ffffff, var(--color-accent-gold)); color: var(--color-brand-primary);">L</div>
            <span>Lots2Homes</span>
          </div>
          <p style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem; color: #cbd5e1;">
            ${settings.footer_brand_desc}
          </p>
          <p style="font-size: 0.85rem; font-weight: 600; color: var(--color-accent-gold);">
            ${settings.footer_tagline}
          </p>
        </div>

        <!-- Directory Links -->
        <div>
          <h4 style="color: #ffffff; font-size: 0.95rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.2rem;">Marketplace</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem;">
            <li><a href="#/lots" style="hover:color: #ffffff;">Available Lots</a></li>
            <li><a href="#/designs" style="hover:color: #ffffff;">Signature Designs</a></li>
            <li><a href="#/process" style="hover:color: #ffffff;">Build / Purchase Process</a></li>
            <li><a href="#/start-your-build" style="hover:color: #ffffff;">Start Your Build</a></li>
          </ul>
        </div>

        <!-- Partnership Links -->
        <div>
          <h4 style="color: #ffffff; font-size: 0.95rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.2rem;">Partnerships</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem;">
            <li><a href="#/submit-lot" style="hover:color: #ffffff;">Landowner Submission</a></li>
            <li><a href="#/contractors" style="hover:color: #ffffff;">Approved Contractors</a></li>
            <li><a href="#/partners" style="hover:color: #ffffff;">Realtors & Investors</a></li>
            <li><a href="#/faq" style="hover:color: #ffffff;">Frequently Asked FAQs</a></li>
          </ul>
        </div>

        <!-- Company / Admin -->
        <div>
          <h4 style="color: #ffffff; font-size: 0.95rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.2rem;">Office</h4>
          <p style="font-size: 0.9rem; margin-bottom: 0.75rem; color: #cbd5e1;">${settings.footer_office}</p>
          <p style="font-size: 0.9rem; margin-bottom: 0.5rem; color: #cbd5e1;">Email: <a href="mailto:${settings.footer_email}" style="color: var(--color-accent-gold);">${settings.footer_email}</a></p>
          ${settings.footer_phone ? `<p style="font-size: 0.9rem; margin-bottom: 1.2rem; color: #cbd5e1;">Phone: <span style="color: var(--color-accent-gold);">${settings.footer_phone}</span></p>` : ''}
          <a href="#/admin" style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1; display: inline-flex; align-items: center; gap: 0.25rem;">
            <i data-lucide="shield" style="width: 14px; height: 14px;"></i> Secure Admin Dashboard
          </a>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div style="border-top: 1px solid #334155; padding-top: 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; font-size: 0.85rem;">
        <p>${settings.footer_copyright}</p>
        <div style="display: flex; gap: 1.5rem;">
          <a href="#/faq">Terms of Service</a>
          <a href="#/faq">Privacy Policy</a>
          <a href="#/admin">Staff Login</a>
        </div>
      </div>
    </div>
  `;
  safeCreateIcons();
}

// Mobile Menu Event Handler
mobileMenuBtn.addEventListener('click', () => {
  const isVisible = mobileNavMenu.style.display === 'flex';
  mobileNavMenu.style.display = isVisible ? 'none' : 'flex';
});

// Watch Route Changes
window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// Call router immediately to render the initial state
renderFooter();
router();

/* ==========================================================================
   2. TOAST NOTIFICATION ENGINE (Simulated Emails & Leads)
   ========================================================================== */
function showToast(title, message, type = 'default') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;
  
  const icon = type === 'success' ? 'check-circle' : 'mail';

  toast.innerHTML = `
    <i data-lucide="${icon}" class="toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);
  safeCreateIcons();

  // Slide-in auto trigger
  const dismissTimer = setTimeout(() => {
    removeToast(toast);
  }, 5000);

  // Manual close
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(dismissTimer);
    removeToast(toast);
  });
}

function removeToast(toast) {
  toast.style.animation = 'fadeIn 0.2s reverse forwards';
  setTimeout(() => {
    toast.remove();
  }, 200);
}

// Helper: Tally dynamic money string
function formatMoney(num) {
  return '$' + Number(num).toLocaleString('en-US');
}

/* ==========================================================================
   3. VIEW COMPILERS (PUBLIC PAGES)
   ========================================================================== */

// --- HOME PAGE VIEW ---
function renderHome() {
  const settings = db.getSiteSettings();
  const lots = db.getLots().slice(0, 3);
  const designs = db.getDesigns().slice(0, 3);

  // Render 3 Featured Lot + Home Packages
  let packagesHTML = '';
  lots.forEach(lot => {
    const compatibleDesigns = db.getDesigns().filter(d => lot.compatible_design_ids && Array.isArray(lot.compatible_design_ids) && lot.compatible_design_ids.includes(d.id));
    if (compatibleDesigns.length > 0) {
      const design = compatibleDesigns[0]; // first compatible
      const totalEstimated = lot.asking_price + design.starting_price;
      
      packagesHTML += `
        <div class="market-card">
          <div class="card-img-wrapper">
            <span class="badge badge-gold card-tag">Featured Package</span>
            <img src="${lot.image_urls && lot.image_urls[0] ? lot.image_urls[0] : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'}" class="card-img" alt="${lot.title}">
          </div>
          <div class="card-content">
            <div class="card-location"><i data-lucide="map-pin" style="width:14px;"></i>${lot.location}</div>
            <h3 class="card-title">${lot.title} + ${design.name}</h3>
            <div class="card-price">From ${formatMoney(totalEstimated)} <span>lot & build</span></div>
            <p class="text-secondary mb-2" style="font-size:0.9rem;">
              Build your modern signature ${design.bedrooms} bed, ${design.bathrooms} bath dream home on this gorgeous, approved lot.
            </p>
            <div class="card-specs">
              <span class="spec-item"><i data-lucide="maximize"></i> ${lot.lot_size} ${lot.lot_size_unit}</span>
              <span class="spec-item"><i data-lucide="home"></i> ${design.square_feet} sq ft</span>
              <span class="spec-item"><i data-lucide="check-circle"></i> Permitted</span>
            </div>
            <div class="card-cta">
              <a href="#/lots/${lot.id}" class="btn btn-primary btn-sm btn-full">View Full Package</a>
            </div>
          </div>
        </div>
      `;
    }
  });

  // Render 3 Home Designs
  let designsHTML = '';
  designs.forEach(ds => {
    designsHTML += `
      <div class="market-card">
        <div class="card-img-wrapper">
          <img src="${ds.image_urls[0]}" class="card-img" alt="${ds.name}">
        </div>
        <div class="card-content">
          <h3 class="card-title" style="margin-bottom:0.25rem;">${ds.name}</h3>
          <div class="card-price" style="font-size:1.25rem; margin-bottom:0.5rem;">From ${formatMoney(ds.starting_price)}<span> build starting</span></div>
          <p class="text-secondary mb-4" style="font-size:0.88rem; flex-grow:1;">${ds.description.substring(0, 110)}...</p>
          <div class="card-specs">
            <span class="spec-item"><i data-lucide="bed"></i> ${ds.bedrooms} Bed</span>
            <span class="spec-item"><i data-lucide="droplet"></i> ${ds.bathrooms} Bath</span>
            <span class="spec-item"><i data-lucide="maximize-2"></i> ${ds.square_feet} sq ft</span>
          </div>
          <div class="card-cta">
            <a href="#/designs/${ds.id}" class="btn btn-secondary btn-sm btn-full">View Design & Upgrades</a>
          </div>
        </div>
      </div>
    `;
  });

  viewport.innerHTML = `
    <!-- Hero Section -->
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <h1 class="hero-title">${settings.home_hero_title_line1} <br><span>${settings.home_hero_title_line2}</span></h1>
          <p class="hero-subtitle">
            ${settings.home_hero_subtitle}
          </p>
          <div class="hero-actions">
            <a href="#/lots" class="btn btn-primary">Explore Available Lots</a>
            <a href="#/submit-lot" class="btn btn-secondary">Submit Your Lot for Sale</a>
          </div>
        </div>
        <div class="hero-visual">
          <img src="${settings.home_hero_image}" class="hero-img" alt="Modern Architecture home">
          <div class="hero-overlay-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
              <span class="badge badge-gold">${settings.home_hero_badge}</span>
              <span style="font-weight:700; color:var(--color-accent-sage-dark);">${settings.home_hero_badge_status}</span>
            </div>
            <p style="font-size:0.95rem; font-weight:700; color:var(--color-brand-primary);">${settings.home_hero_card_title}</p>
            <p style="font-size:0.8rem; color:var(--color-text-secondary);">${settings.home_hero_card_desc}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="section-padding bg-light">
      <div class="container">
        <div class="text-center mb-6">
          <span class="badge badge-gold mb-1">Guided Experience</span>
          <h2 class="mb-2">${settings.home_steps_title}</h2>
          <p class="text-secondary" style="max-width: 600px; margin: 0 auto;">
            ${settings.home_steps_subtitle}
          </p>
        </div>

        <div class="steps-grid">
          <div class="step-card">
            <span class="step-num">01</span>
            <div class="step-icon"><i data-lucide="map"></i></div>
            <h3 class="step-title">Choose a Lot</h3>
            <p class="step-desc">Select from our pre-evaluated parcels. We perform the zoning, surveying, and site testing upfront.</p>
          </div>
          <div class="step-card">
            <span class="step-num">02</span>
            <div class="step-icon"><i data-lucide="home"></i></div>
            <h3 class="step-title">Select Design</h3>
            <p class="step-desc">Pick an optimized modern model that is guaranteed compatible with your lot footprint.</p>
          </div>
          <div class="step-card">
            <span class="step-num">03</span>
            <div class="step-icon"><i data-lucide="sliders"></i></div>
            <h3 class="step-title">Choose Upgrades</h3>
            <p class="step-desc">Add premium finishes, solar battery grids, redwood decks, or full staging with pricing verified in real-time.</p>
          </div>
          <div class="step-card">
            <span class="step-num">04</span>
            <div class="step-icon"><i data-lucide="shield-check"></i></div>
            <h3 class="step-title">Secure Financing</h3>
            <p class="step-desc">Gain access to custom bank construction draw packages and third-party verified inspector draws.</p>
          </div>
          <div class="step-card">
            <span class="step-num">05</span>
            <div class="step-icon"><i data-lucide="hammer"></i></div>
            <h3 class="step-title">Managed Build</h3>
            <p class="step-desc">We supervise our vetted local trade network, conducting stage audits and handling draw compliance.</p>
          </div>
          <div class="step-card">
            <span class="step-num">06</span>
            <div class="step-icon"><i data-lucide="key"></i></div>
            <h3 class="step-title">Turnkey Handoff</h3>
            <p class="step-desc">Collect your keys along with home warranties. Optional full property rental management active.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Packages -->
    <section class="section-padding">
      <div class="container">
        <div class="text-center mb-6">
          <span class="badge badge-sage mb-1">Active Packages</span>
          <h2 class="mb-2">Featured Lot + Home Packages</h2>
          <p class="text-secondary" style="max-width: 600px; margin: 0 auto;">
            Curated pairings of gorgeous land and compatible home models, priced as a complete build bundle.
          </p>
        </div>
        <div class="cards-grid">
          ${packagesHTML}
        </div>
      </div>
    </section>

    <!-- Signature Models -->
    <section class="section-padding bg-light">
      <div class="container">
        <div class="text-center mb-6">
          <span class="badge badge-gold mb-1">Standardized Floor Plans</span>
          <h2 class="mb-2">Signature Home Designs</h2>
          <p class="text-secondary" style="max-width: 600px; margin: 0 auto;">
            Architect-designed structures built with energy star details and organic local timbers.
          </p>
        </div>
        <div class="cards-grid">
          ${designsHTML}
        </div>
        <div class="text-center mt-6">
          <a href="#/designs" class="btn btn-secondary">Explore All Home Designs & Plans</a>
        </div>
      </div>
    </section>

    <!-- Why Lots2Homes -->
    <section class="section-padding">
      <div class="container">
        <div class="text-center mb-6">
          <span class="badge badge-sage mb-1">Built-in Trust</span>
          <h2 class="mb-2">Why Build with Lots2Homes?</h2>
          <p class="text-secondary" style="max-width:600px; margin:0 auto;">
            A unified building marketplace means you never run into custom design friction or unvetted contractors.
          </p>
        </div>

        <div class="grid-3">
          <div style="display:flex; gap:1rem;">
            <div class="step-icon" style="flex-shrink:0;"><i data-lucide="check"></i></div>
            <div>
              <h4 class="mb-1">100% Pre-Evaluated Lots</h4>
              <p class="text-secondary" style="font-size:0.9rem;">No utility delays or zoning shocks. We pre-screen road access, septic potential, well aquafers, and title clearings.</p>
            </div>
          </div>
          <div style="display:flex; gap:1rem;">
            <div class="step-icon" style="flex-shrink:0;"><i data-lucide="shield"></i></div>
            <div>
              <h4 class="mb-1">Transparent Bank Draws</h4>
              <p class="text-secondary" style="font-size:0.9rem;">Construction progress funds are paid in pre-agreed stages only after third-party bank appraisals and municipality approval checkmarks.</p>
            </div>
          </div>
          <div style="display:flex; gap:1rem;">
            <div class="step-icon" style="flex-shrink:0;"><i data-lucide="leaf"></i></div>
            <div>
              <h4 class="mb-1">Sustainable Options</h4>
              <p class="text-secondary" style="font-size:0.9rem;">Standard layouts optimized for passive heating, solar batteries, off-grid water catchments, and zero-VOC organic internal plastering.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Landowners Pitch -->
    <section class="section-padding" style="background-color:var(--color-bg-secondary); border-top: 1px solid var(--color-border-glass);">
      <div class="container">
        <div class="hero-grid" style="align-items: center;">
          <div class="hero-visual" style="aspect-ratio: 16/10;">
            <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80" class="hero-img" alt="Vacant Land field">
          </div>
          <div>
            <span class="badge badge-gold mb-1">Landowners</span>
            <h2 class="mb-2" style="font-size:2rem;">Have Land? Turn It Into a Home Opportunity.</h2>
            <p class="text-secondary mb-4" style="font-size:0.95rem;">
              Sell commission-free with our Option-to-Purchase program. We evaluate your lot, pair it with our signature designs, market it to qualified buyers, pay you an upfront option fee, and execute the purchase as soon as the project clears zoning.
            </p>
            <a href="#/submit-lot" class="btn btn-primary">Submit Your Lot for Evaluation</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Contractor Network -->
    <section class="section-padding bg-light" style="border-top:1px solid var(--color-border-glass);">
      <div class="container text-center" style="max-width: 720px;">
        <span class="badge badge-sage mb-1">Approved Trade Partners</span>
        <h2 class="mb-2">Become an Approved Build Partner</h2>
        <p class="text-secondary mb-4">
          Are you a licensed general contractor or specialty trade? Join our vetted construction network. We handle the client management, layout designs, and stage-draw logistics, keeping your pipeline filled.
        </p>
        <a href="#/contractors" class="btn btn-secondary">Submit Contractor Application</a>
      </div>
    </section>

    <!-- Unified Lead Capture Form -->
    <section class="section-padding bg-light" style="border-top: 1px solid var(--color-border-glass);">
      <div class="container" style="max-width: 800px;">
        <div class="form-card">
          <div class="text-center mb-4">
            <h2 class="form-title">Ready to Take the Next Step?</h2>
            <p class="form-subtitle">Submit your details, and a Lots2Homes guided consultant will contact you within 24 hours.</p>
          </div>
          <form id="general-lead-form">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">First Name <span>*</span></label>
                <input type="text" class="form-input" name="first_name" required>
              </div>
              <div class="form-group">
                <label class="form-label">Last Name <span>*</span></label>
                <input type="text" class="form-input" name="last_name" required>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address <span>*</span></label>
                <input type="email" class="form-input" name="email" required>
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number <span>*</span></label>
                <input type="tel" class="form-input" name="phone" required>
              </div>
              <div class="form-group">
                <label class="form-label">I am interested in: <span>*</span></label>
                <select class="form-select" name="interest_type" required>
                  <option value="">-- Select Option --</option>
                  <option value="Buying a home">Buying a Home (Lot + Build package)</option>
                  <option value="Submitting land">Submitting Land for Sale/Evaluation</option>
                  <option value="Contractor partnership">Becoming a Build Partner (Contractor)</option>
                  <option value="Realtor partnership">Realtor / Partnership opportunities</option>
                  <option value="Investor information">Investor / Finance inquiries</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Preferred Location / Region <span>*</span></label>
                <input type="text" class="form-input" name="location" placeholder="e.g. Sunshine Coast, Whistler" required>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Target Budget Range <span>*</span></label>
                <select class="form-select" name="budget_range" required>
                  <option value="">-- Select Budget --</option>
                  <option value="Under $250k">Under $250,000</option>
                  <option value="$250k–$350k">$250,000 – $350,000</option>
                  <option value="$350k–$450k">$350,000 – $450,000</option>
                  <option value="$450k–$600k">$450,000 – $600,000</option>
                  <option value="$600k+">$600,000 +</option>
                </select>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Your Message or Project Vision <span>*</span></label>
                <textarea class="form-textarea" name="message" placeholder="Tell us more about your ideal lot, size, timeline, or land parcel..." required></textarea>
              </div>
            </div>
            <div style="margin-top: 1rem;">
              <button type="submit" class="btn btn-primary btn-full">Submit Inquiry & Start Consultation</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;

  // Bind Form Submit
  document.getElementById('general-lead-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const lead = {
      lead_type: 'General Inquiry',
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      location: formData.get('location'),
      preferred_region: formData.get('location'),
      budget_range: formData.get('budget_range'),
      message: `${formData.get('interest_type')} | ${formData.get('message')}`,
      financing_status: 'Not Sure',
      timeline: 'Not Sure',
      intended_use: 'Not Sure'
    };

    db.saveLead(lead);

    // Dynamic notification and simulated email
    showToast(
      'Inquiry Submitted!', 
      'Your lead profile has been logged in the local DB. Simulated email notification dispatched to team@lots2homes.com.',
      'success'
    );
    e.target.reset();
  });
}

// --- CATALOG AVAILABLE LOTS VIEW ---
function renderLots() {
  const lots = db.getLots();
  const designs = db.getDesigns();

  // Active Filters state
  let filteredLots = [...lots];

  function compileLotsGrid() {
    let html = '';
    if (filteredLots.length === 0) {
      return `
        <div class="text-center section-padding col-span-2" style="grid-column: span 3; background:#ffffff; border:1px solid var(--color-border-glass); border-radius:12px;">
          <i data-lucide="alert-circle" style="width:48px; height:48px; margin: 0 auto 1rem; color:var(--color-text-muted);"></i>
          <h3>No matching lots found</h3>
          <p class="text-muted mt-1">Try relaxing your filter parameters to view other available parcels.</p>
        </div>
      `;
    }

    filteredLots.forEach(lot => {
      let statusBadge = '';
      if (lot.status === 'Available') statusBadge = '<span class="badge badge-sage card-tag">Available</span>';
      else if (lot.status === 'Reserved') statusBadge = '<span class="badge badge-gold card-tag">Reserved</span>';
      else if (lot.status === 'Coming Soon') statusBadge = '<span class="badge badge-blue card-tag">Coming Soon</span>';
      else statusBadge = '<span class="badge badge-muted card-tag">Sold</span>';

      html += `
        <div class="market-card">
          <div class="card-img-wrapper">
            ${statusBadge}
            <img src="${lot.image_urls && lot.image_urls[0] ? lot.image_urls[0] : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'}" class="card-img" alt="${lot.title}">
          </div>
          <div class="card-content">
            <div class="card-location"><i data-lucide="map-pin" style="width:14px; margin-right:2px;"></i>${lot.location}</div>
            <h3 class="card-title">${lot.title}</h3>
            <div class="card-price">${formatMoney(lot.asking_price)} <span>asking price</span></div>
            <p class="text-secondary mb-2" style="font-size:0.9rem; flex-grow:1;">
              ${lot.description.substring(0, 100)}...
            </p>
            <div class="card-specs">
              <span class="spec-item"><i data-lucide="maximize"></i> ${lot.lot_size} ${lot.lot_size_unit}</span>
              <span class="spec-item"><i data-lucide="activity"></i> ${lot.compatible_design_ids && Array.isArray(lot.compatible_design_ids) ? lot.compatible_design_ids.length : 0} compatible layouts</span>
            </div>
            <div class="card-cta">
              <a href="#/lots/${lot.id}" class="btn btn-primary btn-sm btn-full">Explore Packages</a>
            </div>
          </div>
        </div>
      `;
    });
    return html;
  }

  // Initial Assembly
  viewport.innerHTML = `
    <section class="section-padding">
      <div class="container">
        <!-- Title Header -->
        <div class="text-center mb-6">
          <span class="badge badge-gold mb-1">Marketplace</span>
          <h2 class="mb-2">Available Land & Lot Packages</h2>
          <p class="text-secondary" style="max-width: 600px; margin: 0 auto;">
            Explore premium building parcels. Fully serviced or off-grid qualified, pre-mapped with compatible home designs.
          </p>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="filter-grid">
            <div class="filter-group">
              <label class="filter-label">Region</label>
              <select class="filter-select" id="filter-region">
                <option value="">All Regions</option>
                <option value="Sunshine Coast">Sunshine Coast</option>
                <option value="Kelowna Rural">Okanagan Valley</option>
                <option value="Whistler Region">Whistler Region</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Max Price</label>
              <select class="filter-select" id="filter-price">
                <option value="">Any Price</option>
                <option value="200000">Under $200,000</option>
                <option value="250000">Under $250,000</option>
                <option value="300000">Under $300,000</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Lot Size</label>
              <select class="filter-select" id="filter-size">
                <option value="">Any Size</option>
                <option value="0.5">0.5+ Acres</option>
                <option value="1.0">1.0+ Acres</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Lot Status</label>
              <select class="filter-select" id="filter-status">
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Coming Soon">Coming Soon</option>
              </select>
            </div>
            <div>
              <button class="btn btn-secondary btn-sm" id="btn-reset-filters" style="height:44px;"><i data-lucide="rotate-ccw"></i> Reset</button>
            </div>
          </div>
        </div>

        <!-- Lots Grid -->
        <div class="cards-grid" id="lots-cards-container">
          ${compileLotsGrid()}
        </div>
      </div>
    </section>
  `;

  // Bind Dynamic Filters
  const container = document.getElementById('lots-cards-container');
  const regionSel = document.getElementById('filter-region');
  const priceSel = document.getElementById('filter-price');
  const sizeSel = document.getElementById('filter-size');
  const statusSel = document.getElementById('filter-status');

  function applyFilters() {
    const regVal = regionSel.value;
    const priceVal = priceSel.value ? Number(priceSel.value) : null;
    const sizeVal = sizeSel.value ? Number(sizeSel.value) : null;
    const statusVal = statusSel.value;

    filteredLots = lots.filter(lot => {
      if (regVal && !lot.location.includes(regVal)) return false;
      if (priceVal && lot.asking_price > priceVal) return false;
      if (sizeVal && lot.lot_size < sizeVal) return false;
      if (statusVal && lot.status !== statusVal) return false;
      return true;
    });

    container.innerHTML = compileLotsGrid();
    safeCreateIcons();
  }

  regionSel.addEventListener('change', applyFilters);
  priceSel.addEventListener('change', applyFilters);
  sizeSel.addEventListener('change', applyFilters);
  statusSel.addEventListener('change', applyFilters);

  document.getElementById('btn-reset-filters').addEventListener('click', () => {
    regionSel.value = '';
    priceSel.value = '';
    sizeSel.value = '';
    statusSel.value = '';
    filteredLots = [...lots];
    container.innerHTML = compileLotsGrid();
    safeCreateIcons();
  });
}

// --- LOT DETAILED VIEW ---
function renderLotDetail(lotId) {
  const lot = db.getLot(lotId);
  if (!lot) {
    viewport.innerHTML = `<div class="container section-padding text-center"><h2>Lot Not Found</h2><p class="text-secondary mt-1">We couldn't locate a parcel matching that ID.</p><a href="#/lots" class="btn btn-primary mt-2">Back to marketplace</a></div>`;
    return;
  }

  // Get Compatible Designs
  const compatibleDesigns = db.getDesigns().filter(d => lot.compatible_design_ids && Array.isArray(lot.compatible_design_ids) && lot.compatible_design_ids.includes(d.id));

  // Build Image Thumbnails HTML
  let thumbnailsHTML = '';
  const lotImages = lot.image_urls && Array.isArray(lot.image_urls) ? lot.image_urls : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'];
  lotImages.forEach((url, index) => {
    thumbnailsHTML += `
      <div class="gallery-thumb ${index === 0 ? 'active' : ''}" data-index="${index}">
        <img src="${url}" alt="${lot.title} thumbnail">
      </div>
    `;
  });

  // Build Compatible Designs Sidebar HTML
  let designsSidebarHTML = '';
  compatibleDesigns.forEach(ds => {
    const totalPkg = lot.asking_price + ds.starting_price;
    designsSidebarHTML += `
      <div class="compatibility-item">
        <div>
          <div class="compatibility-name">${ds.name}</div>
          <div style="font-size:0.75rem; color:var(--color-text-secondary);"><i data-lucide="maximize-2" style="width:10px; display:inline;"></i> ${ds.square_feet} sq ft | ${ds.bedrooms} bed</div>
        </div>
        <div class="text-center">
          <div class="compatibility-price">${formatMoney(totalPkg)}</div>
          <a href="#/designs/${ds.id}" style="font-size:0.75rem; color:var(--color-accent-gold); font-weight:700;">Design details &rarr;</a>
        </div>
      </div>
    `;
  });

  // Base Package Tally
  const primaryDesign = compatibleDesigns[0] || { name: 'N/A', starting_price: 0 };
  const primaryEstimatedPkg = lot.asking_price + primaryDesign.starting_price;

  viewport.innerHTML = `
    <section class="section-padding">
      <div class="container">
        <!-- Breadcrumb -->
        <div style="margin-bottom:1.5rem; font-size:0.9rem; font-weight:500; color:var(--color-text-muted);">
          <a href="#/lots">Available Lots</a> &nbsp;/&nbsp; <span style="color:var(--color-text-primary);">${lot.title}</span>
        </div>

        <div class="detail-grid">
          <!-- Main Content Left -->
          <div>
            <!-- Header title -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;" class="grid-2">
              <div>
                <h1 style="font-size:2.4rem; line-height:1.2; margin-bottom:0.25rem;">${lot.title}</h1>
                <div class="card-location"><i data-lucide="map-pin" style="width:16px;"></i>${lot.location}</div>
              </div>
              <div class="text-center" style="margin-left:auto;">
                <span class="badge badge-sage" style="padding:0.4rem 1rem; font-size:0.8rem;">${lot.status}</span>
                <div style="font-size:0.75rem; color:var(--color-text-muted); font-weight:600; margin-top:0.4rem;">PID: ${lot.pid}</div>
              </div>
            </div>

            <!-- Image Gallery -->
            <div class="gallery-main">
              <img src="${lot.image_urls && lot.image_urls[0] ? lot.image_urls[0] : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'}" id="main-detail-gallery" alt="${lot.title}">
            </div>
            <div class="gallery-thumbs">
              ${thumbnailsHTML}
            </div>

            <!-- Specs Grid -->
            <div class="detail-specs-grid mt-4">
              <div class="detail-spec-box" style="border-right:1px solid var(--color-border-glass);">
                <div class="detail-spec-val">${lot.lot_size}</div>
                <div class="detail-spec-lbl">${lot.lot_size_unit}</div>
              </div>
              <div class="detail-spec-box" style="border-right:1px solid var(--color-border-glass);">
                <div class="detail-spec-val">${lot.frontage} ft</div>
                <div class="detail-spec-lbl">Frontage</div>
              </div>
              <div class="detail-spec-box" style="border-right:1px solid var(--color-border-glass);">
                <div class="detail-spec-val">${lot.depth} ft</div>
                <div class="detail-spec-lbl">Depth</div>
              </div>
              <div class="detail-spec-box">
                <div class="detail-spec-val">${compatibleDesigns.length}</div>
                <div class="detail-spec-lbl">Fit Designs</div>
              </div>
            </div>

            <!-- Detailed Copy -->
            <div class="detail-content">
              <h3>Property Description</h3>
              <p class="text-secondary">${lot.description}</p>

              <h3>Zoning & Development Permit Notes</h3>
              <p class="text-secondary">${lot.zoning_notes}</p>

              <h3>Servicing & Utility Specifications</h3>
              <p class="text-secondary">${lot.servicing_notes}</p>

              <h3>Site Access Details</h3>
              <p class="text-secondary">${lot.access_notes}</p>

              <h3>Sustainable Building Advantage</h3>
              <p class="text-secondary">${lot.sustainability_notes}</p>

              <h3>Rental & Wealth Management Potential</h3>
              <p class="text-secondary">${lot.rental_notes}</p>
            </div>
          </div>

          <!-- Sidebar Sticky Right -->
          <div>
            <div class="detail-sidebar-card">
              <div class="sidebar-price-label">Land Price</div>
              <div class="sidebar-price-val">${formatMoney(lot.asking_price)}</div>
              
              <div class="sidebar-price-label" style="margin-top:1rem;">Lot + Build Starting Package</div>
              <div class="sidebar-price-val" style="font-size:1.8rem; color:var(--color-accent-sage-dark);">${formatMoney(primaryEstimatedPkg)}</div>
              <div class="sidebar-package-desc">Includes land purchase & basic ${primaryDesign.name} model setup</div>

              <h4 class="mb-2 mt-4" style="font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--color-text-muted);">Guaranteed Compatible Home Designs</h4>
              <div class="compatibility-list">
                ${designsSidebarHTML}
              </div>

              <!-- Sidebar CTAs -->
              <div style="display:flex; flex-direction:column; gap:0.75rem;">
                <a href="#/start-your-build?lot=${lot.id}" class="btn btn-primary btn-full">Start Build With This Lot</a>
                <button class="btn btn-secondary btn-full" id="btn-sidebar-inquiry">Request Property Information Packet</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Lot Inquiry Lead Form (Triggered or Anchored) -->
        <div class="mt-6" id="lot-inquiry-section" style="max-width: 800px; margin-left: auto; margin-right: auto; display:none;">
          <div class="form-card" id="lot-inquiry-form-card">
            <div class="text-center mb-4">
              <h2 class="form-title">Request Property Packet: ${lot.title}</h2>
              <p class="form-subtitle">Fill out your details to receive clear title reports, septic survey papers, and site mapping documents.</p>
            </div>
            <form id="lot-inquiry-form">
              <input type="hidden" name="lot_id" value="${lot.id}">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">First Name <span>*</span></label>
                  <input type="text" class="form-input" name="first_name" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name <span>*</span></label>
                  <input type="text" class="form-input" name="last_name" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address <span>*</span></label>
                  <input type="email" class="form-input" name="email" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number <span>*</span></label>
                  <input type="tel" class="form-input" name="phone" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Are you pre-approved for construction financing? <span>*</span></label>
                  <select class="form-select" name="pre_approved" required>
                    <option value="">-- Select Status --</option>
                    <option value="Yes">Yes, bank pre-approval active</option>
                    <option value="No">No, not pre-approved yet</option>
                    <option value="In process">In process/Speaking with lender</option>
                    <option value="Cash buyer">No, fully cash-ready buyer</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Intended Property Use <span>*</span></label>
                  <select class="form-select" name="intended_use" required>
                    <option value="">-- Select Use --</option>
                    <option value="Primary residence">Primary Residence</option>
                    <option value="Vacation home">Vacation Retreat</option>
                    <option value="Rental investment">High-yield Rental Investment</option>
                    <option value="Not sure">Not entirely sure yet</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Ideal Building Model Partner <span>*</span></label>
                  <select class="form-select" name="preferred_design" required>
                    <option value="">-- Select Design Model --</option>
                    ${compatibleDesigns.map(d => `<option value="${d.id}">${d.name} (${d.bedrooms} Bed starting ${formatMoney(d.starting_price)})</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Ideal Move-in Timeline <span>*</span></label>
                  <select class="form-select" name="timeline" required>
                    <option value="">-- Select Timeline --</option>
                    <option value="0-3 months">0 – 3 months (Immediate project)</option>
                    <option value="3-6 months">3 – 6 months</option>
                    <option value="6-12 months">6 – 12 months</option>
                    <option value="12+ months">12 + months</option>
                  </select>
                </div>
                <div class="form-group col-span-2">
                  <label class="checkbox-group">
                    <input type="checkbox" name="need_financing_help" value="Yes" checked>
                    Yes, I would like to receive free advice on construction draw financing options and local bank packages.
                  </label>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Specific Questions or Special Site Requests <span>*</span></label>
                  <textarea class="form-textarea" name="message" placeholder="Ask us about site easements, septic drainage details, tree clearing limits, etc..." required></textarea>
                </div>
              </div>
              <div style="margin-top:1.5rem; display:flex; gap:1rem;">
                <button type="submit" class="btn btn-primary btn-full">Submit Request Packet</button>
                <button type="button" class="btn btn-secondary" id="btn-close-inquiry-card">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  `;

  // Bind Gallery Clicks
  document.querySelectorAll('.gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      const target = e.currentTarget;
      const idx = target.getAttribute('data-index');
      document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      target.classList.add('active');
      document.getElementById('main-detail-gallery').src = lot.image_urls[idx];
    });
  });

  // Bind Inquiry Form Toggle
  const inquirySection = document.getElementById('lot-inquiry-section');
  document.getElementById('btn-sidebar-inquiry').addEventListener('click', () => {
    inquirySection.style.display = 'block';
    inquirySection.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-close-inquiry-card').addEventListener('click', () => {
    inquirySection.style.display = 'none';
  });

  // Bind Submit Inquiry Form
  document.getElementById('lot-inquiry-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const lead = {
      lead_type: 'Lot Inquiry',
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      selected_lot_id: formData.get('lot_id'),
      selected_design_id: formData.get('preferred_design'),
      financing_status: formData.get('pre_approved'),
      intended_use: formData.get('intended_use'),
      timeline: formData.get('timeline'),
      property_management_interest: 'Not Sure',
      budget_range: 'Not Sure',
      message: `Lot inquiry for: ${lot.title}. Financing assistance requested: ${formData.get('need_financing_help') === 'Yes' ? 'Yes' : 'No'}. | ${formData.get('message')}`
    };

    db.saveLead(lead);

    showToast(
      'Inquiry Submitted!', 
      'Your request for property packet has been saved. A simulated email notification was sent to land@lots2homes.com.',
      'success'
    );
    e.target.reset();
    inquirySection.style.display = 'none';
  });
}

// --- CATALOG HOME DESIGNS VIEW ---
function renderDesigns() {
  const designs = db.getDesigns();

  let html = '';
  designs.forEach(ds => {
    html += `
      <div class="market-card">
        <div class="card-img-wrapper">
          <img src="${ds.image_urls[0]}" class="card-img" alt="${ds.name}">
        </div>
        <div class="card-content">
          <h3 class="card-title">${ds.name}</h3>
          <div class="card-price">From ${formatMoney(ds.starting_price)} <span>starting build</span></div>
          <p class="text-secondary mb-4" style="font-size:0.9rem; flex-grow:1;">
            ${ds.description}
          </p>
          <div class="card-specs">
            <span class="spec-item"><i data-lucide="bed"></i> ${ds.bedrooms} Bed</span>
            <span class="spec-item"><i data-lucide="droplet"></i> ${ds.bathrooms} Bath</span>
            <span class="spec-item"><i data-lucide="maximize-2"></i> ${ds.square_feet} sq ft</span>
          </div>
          <div class="card-cta">
            <a href="#/designs/${ds.id}" class="btn btn-primary btn-sm btn-full">Customize & Calculate Cost</a>
          </div>
        </div>
      </div>
    `;
  });

  viewport.innerHTML = `
    <section class="section-padding">
      <div class="container">
        <div class="text-center mb-6">
          <span class="badge badge-sage mb-1">Floor Plans</span>
          <h2 class="mb-2">Signature Model Architecture</h2>
          <p class="text-secondary" style="max-width: 600px; margin: 0 auto;">
            Choose from three standardized structural layouts. Hand-crafted using organic building materials, engineered for modular efficiency.
          </p>
        </div>
        <div class="cards-grid">
          ${html}
        </div>
      </div>
    </section>
  `;
}

// --- DESIGN DETAILED VIEW WITH CUSTOM BUDGET CALCULATOR ---
function renderDesignDetail(designId) {
  const design = db.getDesign(designId);
  if (!design) {
    viewport.innerHTML = `<div class="container section-padding text-center"><h2>Design Not Found</h2><a href="#/designs" class="btn btn-primary mt-2">Back to Designs</a></div>`;
    return;
  }

  const upgrades = db.getDesignUpgrades(designId);
  const finishPackages = db.getFinishPackages();

  // Seed default selections
  state.selectedDesignUpgrades.clear();
  state.selectedDesignFinishPackage = finishPackages[0] ? finishPackages[0].id : '';

  // Setup Relational Compatible Lots
  const compatibleLots = db.getLots().filter(lot => lot.compatible_design_ids && Array.isArray(lot.compatible_design_ids) && lot.compatible_design_ids.includes(design.id));

  // Tally starting calculator total
  let calculatorTotal = design.starting_price;

  // Build Finish Packages Selector cards
  let finishesHTML = '';
  finishPackages.forEach((pkg, index) => {
    finishesHTML += `
      <div class="selection-card ${index === 0 ? 'active' : ''}" data-pkg-id="${pkg.id}">
        <span style="font-weight:700; font-size:1.05rem; color:var(--color-brand-primary); margin-bottom:0.25rem;">${pkg.name}</span>
        <p style="font-size:0.8rem; color:var(--color-text-secondary); margin-bottom:0.5rem; line-height:1.4;">${pkg.description}</p>
        <span style="font-size:0.75rem; font-weight:600; color:var(--color-accent-gold-dark); text-transform:uppercase;">Included in base</span>
      </div>
    `;
  });

  // Build Upgrades Checklist
  let upgradesHTML = '';
  if (upgrades.length === 0) {
    upgradesHTML = `<p class="text-secondary" style="font-size:0.88rem;">No specialized upgrades are currently active for this layout model.</p>`;
  } else {
    upgrades.forEach(up => {
      const upgradeImg = up.image_urls && up.image_urls.length > 0
        ? up.image_urls[0]
        : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=80&q=80';
      upgradesHTML += `
        <label class="selection-card" style="flex-direction:row; justify-content:space-between; align-items:center; gap:1rem; cursor:pointer;" data-upgrade-card-id="${up.id}">
          <div style="display:flex; gap:0.75rem; align-items:flex-start;">
            <input type="checkbox" class="upgrade-checkbox" data-up-id="${up.id}" data-price="${up.estimated_price}" style="width:18px; height:18px; margin-top:0.15rem; accent-color:var(--color-accent-gold);">
            <img src="${upgradeImg}" alt="${up.name}" style="width:50px; height:38px; object-fit:cover; border-radius:6px; border:1px solid var(--color-border-glass); flex-shrink:0; margin-top: 0.15rem;">
            <div>
              <span style="font-weight:700; font-size:0.95rem; color:var(--color-brand-primary);">${up.name}</span>
              <p style="font-size:0.8rem; color:var(--color-text-secondary); line-height:1.4; margin-top:0.1rem;">${up.description}</p>
            </div>
          </div>
          <div style="font-weight:800; font-size:1rem; color:var(--color-accent-sage-dark); flex-shrink:0;">
            + ${formatMoney(up.estimated_price)}
          </div>
        </label>
      `;
    });
  }

  // Build Compatible Lots Sidebar HTML
  let lotsSidebarHTML = '';
  compatibleLots.forEach(lot => {
    const totalPkg = lot.asking_price + design.starting_price;
    lotsSidebarHTML += `
      <div class="compatibility-item">
        <div>
          <div class="compatibility-name" style="font-size:0.85rem;">${lot.title}</div>
          <div style="font-size:0.75rem; color:var(--color-text-secondary);"><i data-lucide="map-pin" style="width:10px; display:inline;"></i> ${lot.location}</div>
        </div>
        <div class="text-center">
          <div class="compatibility-price" style="font-size:0.85rem;">${formatMoney(totalPkg)}</div>
          <a href="#/lots/${lot.id}" style="font-size:0.7rem; color:var(--color-accent-gold); font-weight:700;">Lot details &rarr;</a>
        </div>
      </div>
    `;
  });

  viewport.innerHTML = `
    <section class="section-padding">
      <div class="container">
        <!-- Breadcrumb -->
        <div style="margin-bottom:1.5rem; font-size:0.9rem; font-weight:500; color:var(--color-text-muted);">
          <a href="#/designs">Home Designs</a> &nbsp;/&nbsp; <span style="color:var(--color-text-primary);">${design.name}</span>
        </div>

        <div class="detail-grid">
          <!-- Main Content Left -->
          <div>
            <!-- Header title -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;" class="grid-2">
              <div>
                <h1 style="font-size:2.4rem; line-height:1.2; margin-bottom:0.25rem;">${design.name}</h1>
                <p class="text-secondary" style="font-weight:500; font-size:1.05rem;">Starting Build Cost: <span style="color:var(--color-accent-gold-dark); font-weight:700;">${formatMoney(design.starting_price)}</span></p>
              </div>
              <div class="text-center" style="margin-left:auto;">
                <span class="badge badge-gold" style="padding:0.4rem 1rem; font-size:0.8rem;">Signature Model</span>
              </div>
            </div>

            <!-- Cover Image -->
            <div class="gallery-main">
              <img src="${design.image_urls[0]}" id="main-design-gallery" alt="${design.name}">
            </div>

            <!-- Specs Bar -->
            <div class="detail-specs-grid mt-4">
              <div class="detail-spec-box" style="border-right:1px solid var(--color-border-glass);">
                <div class="detail-spec-val">${design.bedrooms}</div>
                <div class="detail-spec-lbl">Bedrooms</div>
              </div>
              <div class="detail-spec-box" style="border-right:1px solid var(--color-border-glass);">
                <div class="detail-spec-val">${design.bathrooms}</div>
                <div class="detail-spec-lbl">Bathrooms</div>
              </div>
              <div class="detail-spec-box" style="border-right:1px solid var(--color-border-glass);">
                <div class="detail-spec-val">${design.square_feet}</div>
                <div class="detail-spec-lbl">Sq. Footage</div>
              </div>
              <div class="detail-spec-box">
                <div class="detail-spec-val">${compatibleLots.length}</div>
                <div class="detail-spec-lbl">Available Lots</div>
              </div>
            </div>

            <!-- Detailed Copy -->
            <div class="detail-content">
              <h3>Structural Design Philosophy</h3>
              <p class="text-secondary">${design.description}</p>

              <h3>High-End Standard Inclusions</h3>
              <ul class="features-list mt-2">
                ${design.features.map(f => `<li><i data-lucide="check-circle"></i> ${f}</li>`).join('')}
              </ul>

              <!-- Floor Plan Render -->
              <h3>Architectural Elevation & Floor Plan</h3>
              <div style="background-color:var(--color-bg-secondary); border:1px solid var(--color-border-glass); border-radius:12px; padding:1rem; margin-top:1rem; box-shadow:var(--shadow-sm);">
                <img src="${design.floor_plan_url}" alt="${design.name} Floor Plan Sketch" style="width:100%; border-radius:6px; max-height:420px; object-fit:contain; background:#ffffff;">
              </div>

              <!-- Interactive Custom Builder Calculator Module -->
              <h3 style="margin-top:3rem;">1. Select Interior & Exterior Finish System</h3>
              <p class="text-secondary mb-2" style="font-size:0.9rem;">Choose a coordinated material palette. Each package has been curated by our interior architects to integrate seamlessly with the design architecture.</p>
              <div class="selection-cards">
                ${finishesHTML}
              </div>

              <!-- Finish Package Materials list -->
              <div id="finish-package-materials-card" style="background-color:var(--color-bg-secondary); border:1px solid var(--color-border-glass); border-radius:12px; padding:1.5rem; margin-top:1rem; display:block;">
                <div id="fp-image-container" style="width:100%; height:260px; border-radius:8px; overflow:hidden; border:1px solid var(--color-border-glass); margin-bottom:1rem; background:#f1f5f9; display:none; position:relative;">
                  <img id="fp-image-display" style="width:100%; height:100%; object-fit:cover; transition: opacity 0.25s ease;">
                </div>
                <h4 id="fp-title-display" style="font-size:1.05rem; margin-bottom:0.5rem; color:var(--color-brand-primary);">Natural Modern System</h4>
                <div style="margin-bottom:0.75rem;"><span style="font-size:0.78rem; font-weight:700; text-transform:uppercase; color:var(--color-text-muted);">Interior Look:</span> <p id="fp-interior-display" style="font-size:0.88rem; color:var(--color-text-secondary); line-height:1.4;"></p></div>
                <div style="margin-bottom:0.75rem;"><span style="font-size:0.78rem; font-weight:700; text-transform:uppercase; color:var(--color-text-muted);">Exterior Look:</span> <p id="fp-exterior-display" style="font-size:0.88rem; color:var(--color-text-secondary); line-height:1.4;"></p></div>
                <div>
                  <span style="font-size:0.78rem; font-weight:700; text-transform:uppercase; color:var(--color-text-muted);">Specifications:</span>
                  <ul id="fp-materials-list" style="margin-top:0.25rem; font-size:0.85rem; color:var(--color-text-secondary); list-style:circle; padding-left:1.2rem;"></ul>
                </div>
              </div>

              <h3 style="margin-top:3rem;">2. Upgrade Structural Systems & Additions</h3>
              <p class="text-secondary mb-2" style="font-size:0.9rem;">Select high-performance additions. Adding upgrades will dynamically calculate your construction budget below.</p>
              <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top:0.5rem;">
                ${upgradesHTML}
              </div>
            </div>
          </div>

          <!-- Sidebar Sticky Right Budget Tally -->
          <div>
            <div class="detail-sidebar-card">
              <div class="text-center" style="border-bottom:1px solid var(--color-bg-tertiary); padding-bottom:1.5rem; margin-bottom:1.5rem;">
                <span class="badge badge-sage mb-1">Personalized Estimate</span>
                <h3 style="font-size:1rem; text-transform:uppercase; color:var(--color-text-muted); font-weight:700; letter-spacing:0.05em;">Estimated Build Cost</h3>
                <div class="sidebar-price-val" id="calculator-total-display" style="font-size:2.4rem; color:var(--color-accent-gold-dark); margin:0.5rem 0 0;">${formatMoney(calculatorTotal)}</div>
                <p style="font-size:0.8rem; color:var(--color-text-muted); font-weight:500;">Based on standard structural drawings and local trade estimations</p>
              </div>

              <div id="calculator-selections-list" style="margin-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:600; color:var(--color-text-secondary); margin-bottom:0.4rem;">
                  <span>Base Model (${design.name}):</span>
                  <span>${formatMoney(design.starting_price)}</span>
                </div>
                <div id="calculator-upgrades-ledger" style="display:flex; flex-direction:column; gap:0.4rem; border-top:1px solid var(--color-bg-tertiary); padding-top:0.4rem;">
                  <span style="font-size:0.8rem; color:var(--color-text-muted); font-style:italic;">No upgrades selected yet</span>
                </div>
              </div>

              <h4 class="mb-2 mt-4" style="font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--color-text-muted);">Recommended Compatible Lots</h4>
              <div class="compatibility-list">
                ${lotsSidebarHTML.length > 0 ? lotsSidebarHTML : '<p class="text-secondary" style="font-size:0.8rem;">Searching compatible parcels...</p>'}
              </div>

              <!-- Sidebar CTAs -->
              <div style="display:flex; flex-direction:column; gap:0.75rem;">
                <a href="#/start-your-build?design=${design.id}" class="btn btn-primary btn-full" id="btn-sidebar-build">Build This Model</a>
                <button class="btn btn-secondary btn-full" id="btn-sidebar-design-inquiry">Inquire About This Plan</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Design Inquiry Lead Form -->
        <div class="mt-6" id="design-inquiry-section" style="max-width: 800px; margin-left: auto; margin-right: auto; display:none;">
          <div class="form-card">
            <div class="text-center mb-4">
              <h2 class="form-title">Consultation Request: ${design.name}</h2>
              <p class="form-subtitle">Register your interest to schedule a blueprint consultation, modify floorplans, or view exact site footprints.</p>
            </div>
            <form id="design-inquiry-form">
              <input type="hidden" name="design_id" value="${design.id}">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">First Name <span>*</span></label>
                  <input type="text" class="form-input" name="first_name" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name <span>*</span></label>
                  <input type="text" class="form-input" name="last_name" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address <span>*</span></label>
                  <input type="email" class="form-input" name="email" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number <span>*</span></label>
                  <input type="tel" class="form-input" name="phone" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Do you already own a building lot? <span>*</span></label>
                  <select class="form-select" name="own_land" required>
                    <option value="">-- Select Status --</option>
                    <option value="Yes">Yes, I already own a building lot</option>
                    <option value="No">No, looking for land to pair with this plan</option>
                    <option value="Looking for land">In negotiations for a land purchase</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Preferred Location / Province <span>*</span></label>
                  <input type="text" class="form-input" name="location" placeholder="e.g. Sunshine Coast, Squamish" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Total Projected Budget <span>*</span></label>
                  <select class="form-select" name="budget_range" required>
                    <option value="">-- Select Budget --</option>
                    <option value="Under $250k">Under $250,000</option>
                    <option value="$250k–$350k">$250,000 – $350,000</option>
                    <option value="$350k–$450k">$350,000 – $450,000</option>
                    <option value="$450k–$600k">$450,000 – $600,000</option>
                    <option value="$600k+">$600,000 +</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Ideal Building Start Timeline <span>*</span></label>
                  <select class="form-select" name="timeline" required>
                    <option value="">-- Select Timeline --</option>
                    <option value="0-3 months">0 – 3 months (Ready now)</option>
                    <option value="3-6 months">3 – 6 months</option>
                    <option value="6-12 months">6 – 12 months</option>
                    <option value="12+ months">12+ months</option>
                  </select>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Specify Your Required Customizations or Comments <span>*</span></label>
                  <textarea class="form-textarea" name="message" placeholder="e.g. I would like to extend the cedar deck by 200 sq ft or add solar capability to the Escape cabin..." required></textarea>
                </div>
              </div>
              <div style="margin-top:1.5rem; display:flex; gap:1rem;">
                <button type="submit" class="btn btn-primary btn-full">Submit Request Packet</button>
                <button type="button" class="btn btn-secondary" id="btn-close-design-inquiry-card">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  `;

  // Dynamic Finish Package Details compiler
  const fpTitle = document.getElementById('fp-title-display');
  const fpInterior = document.getElementById('fp-interior-display');
  const fpExterior = document.getElementById('fp-exterior-display');
  const fpMaterials = document.getElementById('fp-materials-list');

  function updateFinishPackageDetails(pkgId) {
    const pkg = finishPackages.find(p => p.id === pkgId);
    if (!pkg) return;

    fpTitle.textContent = `${pkg.name} Specification System`;
    fpInterior.textContent = pkg.interior_style;
    fpExterior.textContent = pkg.exterior_style;
    fpMaterials.innerHTML = (pkg.included_materials && Array.isArray(pkg.included_materials))
      ? pkg.included_materials.map(m => `<li>${m}</li>`).join('')
      : '';
  }

  // Initialize Default Finish Package details display
  updateFinishPackageDetails(state.selectedDesignFinishPackage);

  // Bind Finish Packages selections
  document.querySelectorAll('.selection-card[data-pkg-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      const target = e.currentTarget;
      const pkgId = target.getAttribute('data-pkg-id');
      
      document.querySelectorAll('.selection-card[data-pkg-id]').forEach(c => c.classList.remove('active'));
      target.classList.add('active');
      
      state.selectedDesignFinishPackage = pkgId;
      updateFinishPackageDetails(pkgId);

      // Play soft click animation effect
      showToast('Finish Package Selected', `Updated finishes system to: ${target.querySelector('span').textContent}.`, 'success');
    });
  });

  // Bind Upgrade Checks & Calculator Math
  const totalDisplay = document.getElementById('calculator-total-display');
  const upgradesLedger = document.getElementById('calculator-upgrades-ledger');

  function recalculateBudget() {
    let subtotal = design.starting_price;
    let ledgerHTML = '';

    if (state.selectedDesignUpgrades.size === 0) {
      ledgerHTML = `<span style="font-size:0.8rem; color:var(--color-text-muted); font-style:italic;">No upgrades selected yet</span>`;
    } else {
      state.selectedDesignUpgrades.forEach(upId => {
        const upObj = upgrades.find(u => u.id === upId);
        if (upObj) {
          subtotal += upObj.estimated_price;
          ledgerHTML += `
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--color-accent-sage-dark); font-weight:600;">
              <span>+ ${upObj.name}:</span>
              <span>${formatMoney(upObj.estimated_price)}</span>
            </div>
          `;
        }
      });
    }

    // Dynamic counters animation
    totalDisplay.textContent = formatMoney(subtotal);
    upgradesLedger.innerHTML = ledgerHTML;

    // Update CTA link parameters
    const encodedUpgrades = Array.from(state.selectedDesignUpgrades).join(',');
    document.getElementById('btn-sidebar-build').href = `#/start-your-build?design=${design.id}&upgrades=${encodedUpgrades}&finishes=${state.selectedDesignFinishPackage}`;
  }

  document.querySelectorAll('.upgrade-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const upId = e.target.getAttribute('data-up-id');
      const card = document.querySelector(`[data-upgrade-card-id="${upId}"]`);

      if (e.target.checked) {
        state.selectedDesignUpgrades.add(upId);
        if (card) card.classList.add('active');
      } else {
        state.selectedDesignUpgrades.delete(upId);
        if (card) card.classList.remove('active');
      }
      recalculateBudget();
    });
  });

  // Bind Inquiry Form Toggle
  const inquirySection = document.getElementById('design-inquiry-section');
  document.getElementById('btn-sidebar-design-inquiry').addEventListener('click', () => {
    inquirySection.style.display = 'block';
    inquirySection.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-close-design-inquiry-card').addEventListener('click', () => {
    inquirySection.style.display = 'none';
  });

  // Bind Submit Inquiry Form
  document.getElementById('design-inquiry-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const lead = {
      lead_type: 'Design Inquiry',
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      selected_design_id: formData.get('design_id'),
      financing_status: 'Speaking with lender',
      intended_use: 'Primary residence',
      timeline: formData.get('timeline'),
      location: formData.get('location'),
      preferred_region: formData.get('location'),
      budget_range: formData.get('budget_range'),
      message: `Design inquiry for: ${design.name}. Owns land: ${formData.get('own_land')}. Chosen Finishes: ${state.selectedDesignFinishPackage}. Selected Upgrades: ${Array.from(state.selectedDesignUpgrades).join(', ')}. | ${formData.get('message')}`
    };

    db.saveLead(lead);

    showToast(
      'Inquiry Submitted!', 
      'Your design request has been saved. A simulated email notification was sent to architecture@lots2homes.com.',
      'success'
    );
    e.target.reset();
    inquirySection.style.display = 'none';
  });
}

// --- HOW IT WORKS / BUY/PURCHASE PROCESS VIEW ---
function renderProcess() {
  const settings = db.getSiteSettings();
  viewport.innerHTML = `
    <!-- Header Title -->
    <section class="section-padding" style="padding-bottom:2rem;">
      <div class="container text-center">
        <span class="badge badge-gold mb-1">${settings.process_badge}</span>
        <h1 style="font-size:2.8rem; margin-bottom:0.5rem;">${settings.process_title}</h1>
        <p class="text-secondary" style="max-width: 650px; margin:0 auto; font-size:1.1rem;">
          ${settings.process_subtitle}
        </p>
      </div>
    </section>

    <!-- Workflows Tabs -->
    <section class="container" style="margin-bottom: 5rem;">
      <div class="filter-bar" style="background:#ffffff; border-radius:12px; box-shadow:var(--shadow-sm); padding:1rem; max-width:800px; margin:0 auto 3rem;">
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.5rem; text-align:center;">
          <button class="btn btn-primary" id="btn-wf-buyer" style="padding:0.75rem;">Buyer / Builder Track</button>
          <button class="btn btn-secondary" id="btn-wf-owner" style="padding:0.75rem;">Landowner Track</button>
          <button class="btn btn-secondary" id="btn-wf-contractor" style="padding:0.75rem;">Contractor Track</button>
        </div>
      </div>

      <!-- WORKFLOW VIEWS GRID -->
      <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:3rem; align-items:start;" id="workflow-details-grid">
        <!-- Track Content (Filled by JS) -->
      </div>
    </section>
  `;

  const wfGrid = document.getElementById('workflow-details-grid');
  const btnBuyer = document.getElementById('btn-wf-buyer');
  const btnOwner = document.getElementById('btn-wf-owner');
  const btnCon = document.getElementById('btn-wf-contractor');

  // Buyer Workflow Content
  function showBuyerWorkflow() {
    btnBuyer.className = 'btn btn-primary';
    btnOwner.className = 'btn btn-secondary';
    btnCon.className = 'btn btn-secondary';

    wfGrid.innerHTML = `
      <div>
        <h2 class="mb-2">The Buyer Build Journey</h2>
        <p class="text-secondary mb-4" style="font-size:1.05rem;">From initial land discovery to active construction management, we guide you through every regulatory and financial gate.</p>
        
        <div class="workflow-track">
          <div class="workflow-step active">
            <div class="workflow-indicator">1</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Explore Lots & Designs</h3>
              <p class="workflow-step-desc">Select a pre-vetted building parcel and match it with a guaranteed structural home design model.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">2</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Submit Inquiry & Consultation</h3>
              <p class="workflow-step-desc">Speak with a dedicated build consultant to review site surveys, zoning regulations, and total budget estimates.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">3</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Review Finishes & Carport Upgrades</h3>
              <p class="workflow-step-desc">Choose between Natural Modern, Warm Minimal, or Coastal systems, and configure solar or deck upgrades.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">4</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Execute Builder Agreement & Deposit</h3>
              <p class="workflow-step-desc">Sign a fully locked fixed-price construction agreement. Place your structural engineering deposit.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">5</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Construction Draw Financing</h3>
              <p class="workflow-step-desc">Obtain construction loan approvals. Lender will release staged funds (draws) as key build milestones are met.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">6</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Excavation & Foundations</h3>
              <p class="workflow-step-desc">Vetted local general contractors break ground. Subgrade piping, insulation, and concrete slab pouring begins.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">7</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Inspections & Handoff</h3>
              <p class="workflow-step-desc">Receive structural, occupancy, and third-party bank draw approvals. Collect keys with complete warranty packets.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Financing Trust side block -->
      <div class="detail-sidebar-card" style="background:#ffffff; border-radius:16px;">
        <span class="badge badge-sage mb-1"><i data-lucide="shield-check" style="width:14px; display:inline;"></i> Secured Building</span>
        <h3 class="mb-2" style="font-size:1.4rem;">Understanding Bank Progress Draws</h3>
        <p class="text-secondary mb-4" style="font-size:0.92rem; line-height:1.6;">
          Lots2Homes structures your building contract using a transparent **Bank Draw system**. Your construction lender does not hand all funding to the builder upfront. Instead, funds are released in 5 strict stages based on physical site completion:
        </p>
        <ul style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.85rem; color:var(--color-text-secondary); list-style:none; padding:0; margin-bottom:1.5rem;">
          <li style="display:flex; gap:0.5rem; align-items:flex-start;"><i data-lucide="arrow-right-circle" style="color:var(--color-accent-gold); flex-shrink:0; margin-top:0.15rem; width:16px;"></i> <div><strong>Stage 1: Foundation (15%):</strong> Excavation complete, concrete poured, plumbing stub-ins certified.</div></li>
          <li style="display:flex; gap:0.5rem; align-items:flex-start;"><i data-lucide="arrow-right-circle" style="color:var(--color-accent-gold); flex-shrink:0; margin-top:0.15rem; width:16px;"></i> <div><strong>Stage 2: Framing (20%):</strong> Wood walls sheeted, roof trusses braced, weather-proofing wrap complete.</div></li>
          <li style="display:flex; gap:0.5rem; align-items:flex-start;"><i data-lucide="arrow-right-circle" style="color:var(--color-accent-gold); flex-shrink:0; margin-top:0.15rem; width:16px;"></i> <div><strong>Stage 3: Lock-up (25%):</strong> Windows, external cladding, and roof shinglings locked. Drywall prepped.</div></li>
          <li style="display:flex; gap:0.5rem; align-items:flex-start;"><i data-lucide="arrow-right-circle" style="color:var(--color-accent-gold); flex-shrink:0; margin-top:0.15rem; width:16px;"></i> <div><strong>Stage 4: Finishes (20%):</strong> Millwork, cabinetry, tiling, heating/cooling ERVs active.</div></li>
          <li style="display:flex; gap:0.5rem; align-items:flex-start;"><i data-lucide="arrow-right-circle" style="color:var(--color-accent-gold); flex-shrink:0; margin-top:0.15rem; width:16px;"></i> <div><strong>Stage 5: Occupancy (20%):</strong> Final walkthrough checkmark, clear inspection certifications, full warranty activated.</div></li>
        </ul>
        <div style="background-color:var(--color-bg-secondary); padding:0.75rem; border-radius:8px; border:1px solid var(--color-border-glass); font-size:0.8rem; color:var(--color-text-muted);">
          * Each stage draw requires physical audit by a certified third-party appraisal agent before banks release capital.
        </div>
      </div>
    `;
    safeCreateIcons();
  }

  // Landowner Workflow Content
  function showOwnerWorkflow() {
    btnBuyer.className = 'btn btn-secondary';
    btnOwner.className = 'btn btn-primary';
    btnCon.className = 'btn btn-secondary';

    wfGrid.innerHTML = `
      <div>
        <h2 class="mb-2">The Landowner Option-to-Purchase Path</h2>
        <p class="text-secondary mb-4" style="font-size:1.05rem;">Sell your vacant land commission-free by pairing it with custom building projects marketed to ready buyers.</p>
        
        <div class="workflow-track">
          <div class="workflow-step active">
            <div class="workflow-indicator">1</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Submit Property Details</h3>
              <p class="workflow-step-desc">Enter your land address, PID, zoning, and asking price in our landowner portal.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">2</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Zoning & Site Evaluation</h3>
              <p class="workflow-step-desc">Our land coordinators audit soil reports, access limits, septic drainage, and municipal zoning potentials.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">3</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Option-to-Purchase Proposal</h3>
              <p class="workflow-step-desc">We structure an exclusive option agreement and present a guaranteed land payment value.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">4</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Marketing & Packaging</h3>
              <p class="workflow-step-desc">We pair your lot with compatible signature home designs and market the package to vetted buyers.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">5</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Close Option & Paid in Full</h3>
              <p class="workflow-step-desc">Once a buyer executes their building contract, our option is triggered, purchasing your land at 100% of the agreed valuation.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Trust side card -->
      <div class="detail-sidebar-card" style="background:#ffffff; border-radius:16px;">
        <span class="badge badge-gold mb-1"><i data-lucide="info" style="width:14px; display:inline;"></i> Option Agreements</span>
        <h3 class="mb-2" style="font-size:1.4rem;">What is an Option Agreement?</h3>
        <p class="text-secondary mb-4" style="font-size:0.92rem; line-height:1.6;">
          An **Option-to-Purchase agreement** gives Lots2Homes the exclusive right to market and purchase your land at a pre-agreed fixed price during a set window (e.g. 180 days). This yields massive advantages for landowners:
        </p>
        <ul style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.85rem; color:var(--color-text-secondary); list-style:none; padding:0; margin-bottom:1.5rem;">
          <li style="display:flex; gap:0.5rem; align-items:flex-start;"><i data-lucide="check" style="color:var(--color-accent-sage); flex-shrink:0; margin-top:0.15rem; width:16px;"></i> <div><strong>Commission Free:</strong> No standard 5-6% real estate realtor commissions. You keep 100% of your agreed price.</div></li>
          <li style="display:flex; gap:0.5rem; align-items:flex-start;"><i data-lucide="check" style="color:var(--color-accent-sage); flex-shrink:0; margin-top:0.15rem; width:16px;"></i> <div><strong>Option Fee Paid:</strong> Receive a non-refundable upfront cash option fee as soon as agreement is signed.</div></li>
          <li style="display:flex; gap:0.5rem; align-items:flex-start;"><i data-lucide="check" style="color:var(--color-accent-sage); flex-shrink:0; margin-top:0.15rem; width:16px;"></i> <div><strong>We Pay Marketing:</strong> We invest in site renders, physical floorplan pairings, septic surveys, and localized marketing.</div></li>
        </ul>
      </div>
    `;
    safeCreateIcons();
  }

  // Contractor Workflow Content
  function showContractorWorkflow() {
    btnBuyer.className = 'btn btn-secondary';
    btnOwner.className = 'btn btn-secondary';
    btnCon.className = 'btn btn-primary';

    wfGrid.innerHTML = `
      <div>
        <h2 class="mb-2">Vetted Contractor Partnership Track</h2>
        <p class="text-secondary mb-4" style="font-size:1.05rem;">Become an approved general contractor or trade partner and gain access to fully pre-funded local projects.</p>
        
        <div class="workflow-track">
          <div class="workflow-step active">
            <div class="workflow-indicator">1</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Online Application</h3>
              <p class="workflow-step-desc">Register your company, select trade categories, years in business, and upload references.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">2</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Compliance Audit</h3>
              <p class="workflow-step-desc">Our project management team audits licensing, general liability insurance sheets, and workers comp filings.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">3</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Partner Interview & Pricing Alignment</h3>
              <p class="workflow-step-desc">We review our modular signature floorplan drawings, structural details, and align on standard regional build costs.</p>
            </div>
          </div>
          <div class="workflow-step">
            <div class="workflow-indicator">4</div>
            <div class="workflow-info">
              <h3 class="workflow-step-title">Assigned Projects Pipeline</h3>
              <p class="workflow-step-desc">Once active, you are assigned regional build packages. Projects are fully pre-evaluated and bank pre-funded.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Trust side card -->
      <div class="detail-sidebar-card" style="background:#ffffff; border-radius:16px;">
        <span class="badge badge-blue mb-1"><i data-lucide="check" style="width:14px; display:inline;"></i> For Builders</span>
        <h3 class="mb-2" style="font-size:1.4rem;">Why Contractors Partner With Us</h3>
        <p class="text-secondary mb-4" style="font-size:0.92rem; line-height:1.6;">
          Builders love working with Lots2Homes. We take care of the heavy administrative friction so you can focus on building outstanding spaces:
        </p>
        <ul style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.85rem; color:var(--color-text-secondary); list-style:none; padding:0; margin-bottom:1.5rem;">
          <li style="display:flex; gap:0.5rem; align-items:flex-start;"><i data-lucide="check" style="color:var(--color-accent-blue); flex-shrink:0; margin-top:0.15rem; width:16px;"></i> <div><strong>Pre-evaluated Sites:</strong> We handle environmental audits, soil drills, and zoning. No surprise site holdups.</div></li>
          <li style="display:flex; gap:0.5rem; align-items:flex-start;"><i data-lucide="check" style="color:var(--color-accent-blue); flex-shrink:0; margin-top:0.15rem; width:16px;"></i> <div><strong>Guaranteed Capital:</strong> Build funds are locked in escrow construction draw accounts. You get paid swiftly on stage signoffs.</div></li>
          <li style="display:flex; gap:0.5rem; align-items:flex-start;"><i data-lucide="check" style="color:var(--color-accent-blue); flex-shrink:0; margin-top:0.15rem; width:16px;"></i> <div><strong>Standardized Drawings:</strong> Built-in structural engineering plans make estimating materials and framing rapid.</div></li>
        </ul>
      </div>
    `;
    safeCreateIcons();
  }

  // Bind Clicks
  btnBuyer.addEventListener('click', showBuyerWorkflow);
  btnOwner.addEventListener('click', showOwnerWorkflow);
  btnCon.addEventListener('click', showContractorWorkflow);

  // Initialize
  showBuyerWorkflow();
}

// --- LANDOWNER SUBMISSION / SUBMIT YOUR LOT VIEW ---
function renderSubmitLot() {
  viewport.innerHTML = `
    <section class="section-padding">
      <div class="container" style="max-width: 900px;">
        <div class="text-center mb-6">
          <span class="badge badge-gold mb-1">Landowners</span>
          <h1 style="font-size:2.8rem; margin-bottom:0.5rem;">Submit Your Land for Evaluation</h1>
          <p class="text-secondary" style="max-width: 600px; margin: 0 auto; font-size:1.05rem;">
            Have a building lot you would like to sell? Lots2Homes converts vacant acreage into market-ready residential packages. Fill out your details below.
          </p>
        </div>

        <div class="form-card">
          <form id="land-submission-form">
            <h3 class="mb-4" style="border-bottom:1px solid var(--color-bg-tertiary); padding-bottom:0.5rem;"><i data-lucide="user" style="display:inline-block; vertical-align:middle; margin-right:6px; width:20px;"></i> Owner Information</h3>
            
            <div class="form-grid mb-4">
              <div class="form-group">
                <label class="form-label">First Name <span>*</span></label>
                <input type="text" class="form-input" name="owner_first_name" required>
              </div>
              <div class="form-group">
                <label class="form-label">Last Name <span>*</span></label>
                <input type="text" class="form-input" name="owner_last_name" required>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address <span>*</span></label>
                <input type="email" class="form-input" name="email" required>
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number <span>*</span></label>
                <input type="tel" class="form-input" name="phone" required>
              </div>
            </div>

            <h3 class="mb-4 mt-6" style="border-bottom:1px solid var(--color-bg-tertiary); padding-bottom:0.5rem;"><i data-lucide="map" style="display:inline-block; vertical-align:middle; margin-right:6px; width:20px;"></i> Property Specifications</h3>
            
            <div class="form-grid mb-4">
              <div class="form-group col-span-2">
                <label class="form-label">Lot Address or General Coordinates <span>*</span></label>
                <input type="text" class="form-input" name="location" placeholder="e.g. 1420 Sea View Rd, Gibsons" required>
              </div>
              <div class="form-group">
                <label class="form-label">PID Number (Property ID if known)</label>
                <input type="text" class="form-input" name="pid" placeholder="e.g. 018-294-811">
              </div>
              <div class="form-group">
                <label class="form-label">Municipality / County <span>*</span></label>
                <input type="text" class="form-input" name="municipality" placeholder="e.g. Town of Gibsons" required>
              </div>
              <div class="form-group">
                <label class="form-label">Province <span>*</span></label>
                <input type="text" class="form-input" name="province" value="BC" required>
              </div>
              <div class="form-group">
                <label class="form-label">Lot Size Value <span>*</span></label>
                <div style="display:flex; gap:0.5rem;">
                  <input type="number" step="0.01" class="form-input" name="lot_size" placeholder="e.g. 0.85" required style="width:70%;">
                  <select class="form-select" name="lot_size_unit" required style="width:30%;">
                    <option value="Acres">Acres</option>
                    <option value="Sq Ft">Sq Ft</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Lot Frontage (Width in feet)</label>
                <input type="number" class="form-input" name="frontage" placeholder="e.g. 120">
              </div>
              <div class="form-group">
                <label class="form-label">Lot Depth (Length in feet)</label>
                <input type="number" class="form-input" name="depth" placeholder="e.g. 250">
              </div>
              <div class="form-group">
                <label class="form-label">Asking Price / Valuation ($) <span>*</span></label>
                <input type="number" class="form-input" name="asking_price" placeholder="e.g. 195000" required>
              </div>
              <div class="form-group">
                <label class="form-label">Desired Sell Price if different ($)</label>
                <input type="number" class="form-input" name="desired_price" placeholder="e.g. 200000">
              </div>
            </div>

            <h3 class="mb-4 mt-6" style="border-bottom:1px solid var(--color-bg-tertiary); padding-bottom:0.5rem;"><i data-lucide="info" style="display:inline-block; vertical-align:middle; margin-right:6px; width:20px;"></i> Property Condition & Utilities</h3>
            
            <div class="form-grid mb-4">
              <div class="form-group">
                <label class="form-label">Is the lot currently listed with a realtor? <span>*</span></label>
                <select class="form-select" name="currently_listed" required>
                  <option value="No">No, commission-free potential</option>
                  <option value="Yes">Yes, currently active on MLS</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Do you possess clear, unencumbered Title? <span>*</span></label>
                <select class="form-select" name="clear_title" required>
                  <option value="Yes">Yes, clear single title ownership</option>
                  <option value="No">No, has liens/mortgages</option>
                  <option value="Not sure">Not entirely sure</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Property Access Type <span>*</span></label>
                <select class="form-select" name="access_type" required>
                  <option value="Public road">Public paved road frontage</option>
                  <option value="Private road">Private gravel strata road</option>
                  <option value="Easement">Right-of-way Easement only</option>
                  <option value="Not sure">Access needs evaluation</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Zoning Classification (if known)</label>
                <input type="text" class="form-input" name="zoning" placeholder="e.g. RR-1 Residential">
              </div>

              <div class="form-group col-span-2">
                <label class="form-label">Services / Utilities Available (Select all that apply)</label>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.5rem; margin-top:0.25rem;">
                  <label class="checkbox-group"><input type="checkbox" name="services" value="Power nearby"> Power nearby</label>
                  <label class="checkbox-group"><input type="checkbox" name="services" value="Well"> Well active</label>
                  <label class="checkbox-group"><input type="checkbox" name="services" value="Municipal water"> Municipal Water</label>
                  <label class="checkbox-group"><input type="checkbox" name="services" value="Septic"> Septic field</label>
                  <label class="checkbox-group"><input type="checkbox" name="services" value="Municipal sewer"> Municipal Sewer</label>
                  <label class="checkbox-group"><input type="checkbox" name="services" value="None"> Fully Unserviced</label>
                </div>
              </div>

              <div class="form-group col-span-2">
                <label class="form-label">Physical Lot Conditions (Select all that apply)</label>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.5rem; margin-top:0.25rem;">
                  <label class="checkbox-group"><input type="checkbox" name="condition" value="Cleared"> Cleared build site</label>
                  <label class="checkbox-group"><input type="checkbox" name="condition" value="Treed"> Heavily Treed</label>
                  <label class="checkbox-group"><input type="checkbox" name="condition" value="Partially cleared"> Partially Cleared</label>
                  <label class="checkbox-group"><input type="checkbox" name="condition" value="Sloped"> Moderate/High Slope</label>
                  <label class="checkbox-group"><input type="checkbox" name="condition" value="Wet areas"> Wet areas/Creek offsets</label>
                  <label class="checkbox-group"><input type="checkbox" name="condition" value="Flat"> Fully Flat</label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Professional Survey Available? <span>*</span></label>
                <select class="form-select" name="survey_available" required>
                  <option value="No">No survey on file</option>
                  <option value="Yes">Yes, recent survey available</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Septic Engineering Approval? <span>*</span></label>
                <select class="form-select" name="septic_approval" required>
                  <option value="No">No perk testing done</option>
                  <option value="Yes">Yes, septic field design approved</option>
                </select>
              </div>
            </div>

            <h3 class="mb-4 mt-6" style="border-bottom:1px solid var(--color-bg-tertiary); padding-bottom:0.5rem;"><i data-lucide="image" style="display:inline-block; vertical-align:middle; margin-right:6px; width:20px;"></i> Property Photos & Files</h3>
            <div class="form-group col-span-2">
              <label class="form-label">Upload Lot Photos (Drag & Drop or click below)</label>
              <div class="file-dropzone" id="photo-dropzone">
                <i data-lucide="upload-cloud"></i>
                <span>Drag & Drop photos here, or click to browse files</span>
                <p style="font-size:0.75rem; color:var(--color-text-muted);">Supports PNG, JPG (Max 5MB per file). Files are parsed instantly as local database links.</p>
              </div>
              <input type="file" id="photo-file-input" multiple accept="image/*" style="display: none;">
              <div class="file-preview-grid" id="photo-preview-grid"></div>
            </div>

            <div class="form-group col-span-2 mt-4">
              <label class="form-label">Landowner Seller Comments or History</label>
              <textarea class="form-textarea" name="comments" placeholder="Describe the sun exposure, views, local amenities, school access, or historical site tests..."></textarea>
            </div>

            <div class="form-grid mb-4">
              <div class="form-group">
                <label class="form-label">Preferred Sales Closing Timeline <span>*</span></label>
                <select class="form-select" name="preferred_timeline" required>
                  <option value="Immediate">Immediate (Within 30 days)</option>
                  <option value="1-3 months">1 – 3 months</option>
                  <option value="3-6 months">3 – 6 months</option>
                  <option value="Flexible">Fully Flexible</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Are you open to an Option-to-Purchase agreement? <span>*</span></label>
                <select class="form-select" name="open_to_option" required>
                  <option value="Yes">Yes, highly interested in option structure</option>
                  <option value="Maybe">Maybe, requires consult and fee details</option>
                  <option value="No">No, straight standard land sale only</option>
                </select>
              </div>
            </div>

            <div class="form-group col-span-2 mt-4" style="border-top: 1px solid var(--color-bg-tertiary); padding-top: 1.5rem;">
              <label class="checkbox-group">
                <input type="checkbox" name="consent" value="Yes" required>
                <span>I agree that Lots2Homes coordinators may access public property databases, view tax filings, and contact me to evaluate this lot opportunity. <span>*</span></span>
              </label>
            </div>

            <div style="margin-top: 2rem;">
              <button type="submit" class="btn btn-primary btn-full">Submit Lot for Evaluation</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;

  // Photo Upload Handler (Converts files into local Base64 URLs)
  const dropzone = document.getElementById('photo-dropzone');
  const fileInput = document.getElementById('photo-file-input');
  const previewGrid = document.getElementById('photo-preview-grid');
  
  const uploadedFiles = [];

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('click', (e) => e.stopPropagation());

  // drag hover styles
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        showToast('Invalid File', 'Only image files are permitted.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        uploadedFiles.push(base64Data);

        // Append preview item
        const item = document.createElement('div');
        item.className = 'file-preview-item';
        item.innerHTML = `
          <img src="${base64Data}">
          <span class="file-preview-remove">&times;</span>
        `;

        item.querySelector('.file-preview-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = uploadedFiles.indexOf(base64Data);
          if (idx !== -1) uploadedFiles.splice(idx, 1);
          item.remove();
        });

        previewGrid.appendChild(item);
      };
      reader.readAsDataURL(file);
    });
  }

  // Form Submit Action
  document.getElementById('land-submission-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Gather checkboxes
    const services = [];
    e.target.querySelectorAll('input[name="services"]:checked').forEach(c => services.push(c.value));
    
    const condition = [];
    e.target.querySelectorAll('input[name="condition"]:checked').forEach(c => condition.push(c.value));

    const submission = {
      owner_first_name: formData.get('owner_first_name'),
      owner_last_name: formData.get('owner_last_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      location: formData.get('location'),
      pid: formData.get('pid'),
      municipality: formData.get('municipality'),
      province: formData.get('province'),
      lot_size: Number(formData.get('lot_size')),
      lot_size_unit: formData.get('lot_size_unit'),
      frontage: Number(formData.get('frontage')),
      depth: Number(formData.get('depth')),
      asking_price: Number(formData.get('asking_price')),
      desired_price: Number(formData.get('desired_price') || formData.get('asking_price')),
      currently_listed: formData.get('currently_listed'),
      clear_title: formData.get('clear_title'),
      access_type: formData.get('access_type'),
      services_available: services,
      zoning: formData.get('zoning'),
      survey_available: formData.get('survey_available'),
      septic_approval: formData.get('septic_approval'),
      building_permits: 'No',
      lot_condition: condition,
      photo_urls: uploadedFiles.length > 0 ? uploadedFiles : ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"],
      comments: formData.get('comments'),
      preferred_timeline: formData.get('preferred_timeline'),
      open_to_option_agreement: formData.get('open_to_option'),
      status: 'New'
    };

    db.saveLotSubmission(submission);

    showToast(
      'Lot Details Logged!', 
      'Your property proposal has been saved. A simulated email notification has been dispatched to land@lots2homes.com.',
      'success'
    );
    e.target.reset();
    previewGrid.innerHTML = '';
    uploadedFiles.length = 0;
  });
}

// --- CONTRACTOR REGISTRATION VIEW ---
function renderContractors() {
  viewport.innerHTML = `
    <section class="section-padding">
      <div class="container" style="max-width: 800px;">
        <div class="text-center mb-6">
          <span class="badge badge-blue mb-1">Approved Builders</span>
          <h1 style="font-size:2.8rem; margin-bottom:0.5rem;">Contractor Onboarding</h1>
          <p class="text-secondary" style="max-width: 600px; margin: 0 auto; font-size:1.05rem;">
            Join our certified builder and supplier network. Lots2Homes unifies architectural blueprints, client draws, and regional project flow.
          </p>
        </div>

        <div class="form-card">
          <form id="contractor-application-form">
            <h3 class="mb-4" style="border-bottom:1px solid var(--color-bg-tertiary); padding-bottom:0.5rem;"><i data-lucide="briefcase" style="display:inline-block; vertical-align:middle; margin-right:6px; width:20px;"></i> Business Information</h3>
            
            <div class="form-grid mb-4">
              <div class="form-group">
                <label class="form-label">Company Legal Name <span>*</span></label>
                <input type="text" class="form-input" name="company_name" required>
              </div>
              <div class="form-group">
                <label class="form-label">Primary Contact Person <span>*</span></label>
                <input type="text" class="form-input" name="contact_name" required>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address <span>*</span></label>
                <input type="email" class="form-input" name="email" required>
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number <span>*</span></label>
                <input type="tel" class="form-input" name="phone" required>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Business Address <span>*</span></label>
                <input type="text" class="form-input" name="business_address" placeholder="e.g. Suite 202 - 1450 Marine Dr, Squamish" required>
              </div>
              <div class="form-group">
                <label class="form-label">Website URL</label>
                <input type="url" class="form-input" name="website" placeholder="e.g. apexridge.com">
              </div>
              <div class="form-group">
                <label class="form-label">Primary Active Service Area <span>*</span></label>
                <input type="text" class="form-input" name="service_area" placeholder="e.g. Sea-to-Sky, Okanagan Valley" required>
              </div>
              <div class="form-group">
                <label class="form-label">Province <span>*</span></label>
                <input type="text" class="form-input" name="province" value="BC" required>
              </div>
              <div class="form-group">
                <label class="form-label">Years in Business <span>*</span></label>
                <input type="number" class="form-input" name="years_in_business" min="0" required>
              </div>
              <div class="form-group">
                <label class="form-label">Primary Trade Specialty <span>*</span></label>
                <select class="form-select" name="trade_type" required>
                  <option value="">-- Select Trade --</option>
                  <option value="General contractor">General Contractor</option>
                  <option value="Foundation">Concrete / Foundation specialist</option>
                  <option value="Framing">Framing / Carpentry Crew</option>
                  <option value="Electrical">Licensed Electrical Contractor</option>
                  <option value="Plumbing">Red Seal Plumbing Contractor</option>
                  <option value="HVAC">HVAC / ERV Specialist</option>
                  <option value="Excavation">Excavation & Septic Digger</option>
                  <option value="Other">Other Specialty trade</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Business License Number</label>
                <input type="text" class="form-input" name="license_number" placeholder="e.g. BC-GC-92841-A">
              </div>
            </div>

            <h3 class="mb-4 mt-6" style="border-bottom:1px solid var(--color-bg-tertiary); padding-bottom:0.5rem;"><i data-lucide="file-text" style="display:inline-block; vertical-align:middle; margin-right:6px; width:20px;"></i> Compliance & Crew Details</h3>
            
            <div class="form-grid mb-4">
              <div class="form-group">
                <label class="form-label">Active General Liability Insurance? <span>*</span></label>
                <select class="form-select" name="insurance_coverage" required>
                  <option value="Yes">Yes, $2M+ active coverage</option>
                  <option value="No">No coverage active</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Workers Compensation Coverage (WCB)? <span>*</span></label>
                <select class="form-select" name="workers_comp" required>
                  <option value="Yes">Yes, active good standing</option>
                  <option value="No">No, exempt / not registered</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Can provide 3 client references? <span>*</span></label>
                <select class="form-select" name="references_available" required>
                  <option value="Yes">Yes, references sheet prepped</option>
                  <option value="No">No references</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Experience with Residential New Builds? <span>*</span></label>
                <select class="form-select" name="new_build_experience" required>
                  <option value="Yes">Yes, extensive new-build portfolio</option>
                  <option value="No">No, renovations / commercial only</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Experience with Concrete Slab-on-Grade? <span>*</span></label>
                <select class="form-select" name="slab_experience" required>
                  <option value="Yes">Yes, highly experienced</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Active Field Crew Size</label>
                <input type="number" class="form-input" name="crew_size" placeholder="e.g. 5" min="1">
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Typical Project Commencement Availability <span>*</span></label>
                <input type="text" class="form-input" name="availability" placeholder="e.g. Ready in 30 days, currently booked until Autumn..." required>
              </div>
            </div>

            <div class="form-group col-span-2 mt-4">
              <label class="form-label">Trade Qualifications / Comments</label>
              <textarea class="form-textarea" name="comments" placeholder="Highlight your crew strengths, specialty tool assets, structural insulated panel experience..."></textarea>
            </div>

            <div class="form-group col-span-2 mt-4" style="border-top: 1px solid var(--color-bg-tertiary); padding-top: 1.5rem;">
              <label class="checkbox-group">
                <input type="checkbox" name="consent" value="Yes" required>
                <span>I verify that all licensing, insurance coverage, and business records are active, and consent to reference checks. <span>*</span></span>
              </label>
            </div>

            <div style="margin-top: 2rem;">
              <button type="submit" class="btn btn-primary btn-full">Submit Contractor Application</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;

  // Submit Application
  document.getElementById('contractor-application-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const app = {
      company_name: formData.get('company_name'),
      contact_name: formData.get('contact_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      website: formData.get('website'),
      business_address: formData.get('business_address'),
      service_area: formData.get('service_area'),
      province: formData.get('province'),
      trade_type: formData.get('trade_type'),
      years_in_business: Number(formData.get('years_in_business')),
      license_number: formData.get('license_number'),
      insurance_coverage: formData.get('insurance_coverage'),
      workers_comp: formData.get('workers_comp'),
      references_available: formData.get('references_available'),
      new_build_experience: formData.get('new_build_experience'),
      slab_experience: formData.get('slab_experience'),
      crew_size: Number(formData.get('crew_size') || 1),
      availability: formData.get('availability'),
      interested_regions: formData.get('service_area'),
      portfolio_urls: ["https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80"],
      comments: formData.get('comments'),
      status: 'New'
    };

    db.saveContractorApplication(app);

    showToast(
      'Application Logged!', 
      'Contractor profile saved. Simulated onboarding notice sent to trade@lots2homes.com.',
      'success'
    );
    e.target.reset();
  });
}

// --- REALTOR & GENERAL PARTNERS VIEW ---
function renderPartners() {
  viewport.innerHTML = `
    <section class="section-padding">
      <div class="container" style="max-width: 720px;">
        <div class="text-center mb-6">
          <span class="badge badge-gold mb-1">Partner Network</span>
          <h1 style="font-size:2.8rem; margin-bottom:0.5rem;">Join the Partnership Program</h1>
          <p class="text-secondary" style="max-width: 600px; margin: 0 auto; font-size:1.05rem;">
            Whether you represent landowner inventories, mortgage financing pipelines, or property management sectors, we welcome collaboration.
          </p>
        </div>

        <div class="form-card">
          <form id="partner-registration-form">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Full Name <span>*</span></label>
                <input type="text" class="form-input" name="name" required>
              </div>
              <div class="form-group">
                <label class="form-label">Company Name <span>*</span></label>
                <input type="text" class="form-input" name="company" required>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address <span>*</span></label>
                <input type="email" class="form-input" name="email" required>
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number <span>*</span></label>
                <input type="tel" class="form-input" name="phone" required>
              </div>
              <div class="form-group">
                <label class="form-label">Partner Profile Category <span>*</span></label>
                <select class="form-select" name="partner_type" required>
                  <option value="">-- Select Type --</option>
                  <option value="Realtor">Licensed Realtor / Real Estate Broker</option>
                  <option value="Mortgage broker">Mortgage Broker / Construction Lender</option>
                  <option value="Landowner representative">Landowner Representative / Trust Agent</option>
                  <option value="Investor">Real Estate Investor / JV Capital</option>
                  <option value="Property manager">Property Manager / STR operator</option>
                  <option value="Other">Other Partnership</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Target Service Region <span>*</span></label>
                <input type="text" class="form-input" name="region" placeholder="e.g. Sunshine Coast, Okanagan" required>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">How would you like to partner with Lots2Homes? <span>*</span></label>
                <textarea class="form-textarea" name="message" placeholder="Describe your referral pipeline, strata land opportunities, joint venture proposals, etc..." required></textarea>
              </div>
            </div>
            <div style="margin-top: 1.5rem;">
              <button type="submit" class="btn btn-primary btn-full">Submit Partner Profile</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;

  // Submit Partner application
  document.getElementById('partner-registration-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const partner = {
      name: formData.get('name'),
      company: formData.get('company'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      partner_type: formData.get('partner_type'),
      region: formData.get('region'),
      message: formData.get('message'),
      status: 'New'
    };

    db.savePartnerApplication(partner);

    showToast(
      'Partner Request Logged!', 
      'Proposal saved. A simulated email notification was sent to partnerships@lots2homes.com.',
      'success'
    );
    e.target.reset();
  });
}

// --- GENERAL FAQ ACCORDION VIEW ---
function renderFAQ() {
  const settings = db.getSiteSettings();
  viewport.innerHTML = `
    <section class="section-padding bg-light">
      <div class="container">
        <div class="text-center mb-6">
          <span class="badge badge-gold mb-1">${settings.faq_badge}</span>
          <h1 style="font-size:2.8rem; margin-bottom:0.5rem;">${settings.faq_title}</h1>
          <p class="text-secondary" style="max-width: 600px; margin: 0 auto; font-size:1.05rem;">
            ${settings.faq_subtitle}
          </p>
        </div>

        <div class="faq-list">
          <details class="faq-item">
            <summary class="faq-summary">What exactly is Lots2Homes Inc.?</summary>
            <div class="faq-answer">
              Lots2Homes is a unified land-to-home marketplace and guided building system. We connect land buyers, landowners, and approved local construction trades on a single dashboard, managing site testing, architectural selections, and payment draw logs seamlessly.
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-summary">Do I need to own land prior to building?</summary>
            <div class="faq-answer">
              No! You can browse our marketplace of pre-evaluated "Available Lots" which are fully cleared, septic-tested, and mapped to matching modern cabin/home designs. If you already own land, you can consult with our team to match our plans to your coordinates.
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-summary">Can I modify your signature home designs?</summary>
            <div class="faq-answer">
              Yes, our standard designs (The Escape, The Essential, The Family) are modular and highly optimized, but you can request modifications to decks, carport additions, structural layouts, and solar battery storage during the consultation phase.
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-summary">How does the construction bank draw financing work?</summary>
            <div class="faq-answer">
              We coordinate with leading construction lenders. Rather than paying the builder upfront, the bank holds your home construction funds in escrow. Funds are released in 5 strict phases (Foundations, Framing, Lock-up, Finishes, Occupancy) only after an independent structural appraiser audits the physical job site.
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-summary">How long does active home construction typically take?</summary>
            <div class="faq-answer">
              Because our signature designs utilize standardized engineering details and local prefabrication lines, active ground builds are completed within 5 to 7 months from foundation pouring, significantly faster than standard custom designs.
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-summary">Are these homes covered by local home warranties?</summary>
            <div class="faq-answer">
              Absolutely. Every build package is constructed by vetted, fully insured local general contractors and is backed by standard 2-5-10 year home warranty programs (2 years on mechanical/delivery systems, 5 years on water cladding seals, and 10 years on concrete structural load pillars).
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-summary">How does the Landowner Option-to-Purchase agreement work?</summary>
            <div class="faq-answer">
              If your vacant land meets our suitability checks, we sign an exclusive Option Agreement. We pay you an upfront cash Option Fee and invest in physical surveys and lot marketing. We list your land paired with a beautiful home design. Once a buyer commits, the option closes, and you are paid the full agreed land valuation commission-free.
            </div>
          </details>

          <details class="faq-item">
            <summary class="faq-summary">Do you offer ongoing property rental management?</summary>
            <div class="faq-answer">
              Yes, we partner with premier regional Short-Term and Long-Term property management networks. We can completely furnish, stage, advertise, clean, and manage your new build, providing a truly passive vacation or rental investment loop.
            </div>
          </details>
        </div>
      </div>
    </section>
  `;
}

// --- GENERAL CONTACT VIEW ---
function renderContact() {
  const settings = db.getSiteSettings();
  viewport.innerHTML = `
    <section class="section-padding">
      <div class="container" style="max-width: 600px;">
        <div class="text-center mb-6">
          <span class="badge badge-gold mb-1">Get In Touch</span>
          <h1 style="font-size:2.8rem; margin-bottom:0.5rem;">${settings.contact_title}</h1>
          <p class="text-secondary">${settings.contact_subtitle}</p>
        </div>

        <div class="form-card">
          <form id="general-contact-form">
            <div class="form-group">
              <label class="form-label">Full Name <span>*</span></label>
              <input type="text" class="form-input" name="name" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email Address <span>*</span></label>
              <input type="email" class="form-input" name="email" required>
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number <span>*</span></label>
              <input type="tel" class="form-input" name="phone" required>
            </div>
            <div class="form-group">
              <label class="form-label">Message <span>*</span></label>
              <textarea class="form-textarea" name="message" placeholder="How can our building consultants assist you?" required></textarea>
            </div>
            <div style="margin-top:1.5rem;">
              <button type="submit" class="btn btn-primary btn-full">Send Message</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;

  document.getElementById('general-contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const lead = {
      lead_type: 'General Inquiry',
      first_name: formData.get('name').split(' ')[0] || 'Contact',
      last_name: formData.get('name').split(' ').slice(1).join(' ') || 'User',
      email: formData.get('email'),
      phone: formData.get('phone'),
      location: 'Unspecified',
      preferred_region: 'Unspecified',
      budget_range: 'Not Sure',
      message: `Contact Form | ${formData.get('message')}`,
      financing_status: 'Not Sure',
      timeline: 'Not Sure',
      intended_use: 'Not Sure'
    };

    db.saveLead(lead);

    showToast(
      'Message Received!', 
      'Your general message has been saved in the DB. Simulated email notice dispatched to info@lots2homes.com.',
      'success'
    );
    e.target.reset();
  });
}

// --- DYNAMIC START YOUR BUILD QUALIFICATION VIEW ---
function renderStartYourBuild() {
  // Capture URL parameters
  const urlParams = new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf('?')));
  const selectedLotId = urlParams.get('lot') || '';
  const selectedDesignId = urlParams.get('design') || '';
  const initialFinishes = urlParams.get('finishes') || 'fp_natural';
  const initialUpgradesStr = urlParams.get('upgrades') || '';

  const lots = db.getLots();
  const designs = db.getDesigns();
  const upgrades = db.getUpgrades();
  const finishPackages = db.getFinishPackages();

  // Create Step-by-Step lead captures
  viewport.innerHTML = `
    <section class="section-padding">
      <div class="container" style="max-width:800px;">
        <div class="text-center mb-6">
          <span class="badge badge-sage mb-1">Guided Builder Wizard</span>
          <h1 style="font-size:2.8rem; margin-bottom:0.5rem;">Start Your Custom Build</h1>
          <p class="text-secondary" style="font-size:1.05rem;">
            Provide your building preferences, financing status, and structural additions to initiate an official project scoping blueprint.
          </p>
        </div>

        <div class="form-card">
          <form id="start-build-wizard-form">
            <h3 class="mb-4" style="border-bottom:1px solid var(--color-bg-tertiary); padding-bottom:0.5rem;"><i data-lucide="package" style="display:inline-block; vertical-align:middle; margin-right:6px; width:20px;"></i> 1. Package Configuration</h3>
            
            <div class="form-grid mb-4">
              <div class="form-group">
                <label class="form-label">Selected Building Lot</label>
                <select class="form-select" name="lot_id" id="wizard-lot-select">
                  <option value="">-- No Lot Selected (Looking for Land) --</option>
                  ${lots.map(l => `<option value="${l.id}" ${l.id === selectedLotId ? 'selected' : ''}>${l.title} (${l.location} - ${formatMoney(l.asking_price)})</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Selected Home Design Model</label>
                <select class="form-select" name="design_id" id="wizard-design-select">
                  <option value="">-- No Design Selected --</option>
                  ${designs.map(d => `<option value="${d.id}" ${d.id === selectedDesignId ? 'selected' : ''}>${d.name} (${d.bedrooms} Bed - starting ${formatMoney(d.starting_price)})</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Material Finish Package System</label>
                <select class="form-select" name="finishes_id">
                  ${finishPackages.map(fp => `<option value="${fp.id}" ${fp.id === initialFinishes ? 'selected' : ''}>${fp.name} Architectural System</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Ideal Building Commencement Timeline <span>*</span></label>
                <select class="form-select" name="timeline" required>
                  <option value="Immediate">Immediate (Within 60 days)</option>
                  <option value="3-6 months">3 – 6 months</option>
                  <option value="6-12 months">6 – 12 months</option>
                  <option value="Flexible">Looking/Flexible</option>
                </select>
              </div>
            </div>

            <!-- Upgrades section -->
            <div class="form-group col-span-2 mb-4">
              <label class="form-label">Select Sustainable & Interior Upgrades of Interest</label>
              <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:0.5rem; margin-top:0.25rem;" id="wizard-upgrades-checklist">
                ${upgrades.map(up => {
                  const isChecked = initialUpgradesStr.split(',').includes(up.id);
                  const img = up.image_urls && up.image_urls.length > 0
                    ? up.image_urls[0]
                    : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=80&q=80';
                  return `
                    <label class="checkbox-group" style="padding:0.5rem; border:1px solid var(--color-border-glass); border-radius:6px; background:#ffffff; display:flex; align-items:center; gap:0.5rem;">
                      <input type="checkbox" name="upgrades" value="${up.id}" ${isChecked ? 'checked' : ''}>
                      <img src="${img}" alt="${up.name}" style="width:36px; height:27px; object-fit:cover; border-radius:4px; border:1px solid var(--color-border-glass); flex-shrink:0;">
                      <div>
                        <div style="font-weight:700; font-size:0.85rem; line-height:1.2;">${up.name}</div>
                        <div style="font-size:0.75rem; color:var(--color-accent-sage-dark); font-weight:600;">+ ${formatMoney(up.estimated_price)}</div>
                      </div>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <h3 class="mb-4 mt-6" style="border-bottom:1px solid var(--color-bg-tertiary); padding-bottom:0.5rem;"><i data-lucide="user" style="display:inline-block; vertical-align:middle; margin-right:6px; width:20px;"></i> 2. Buyer Profile & Contact</h3>
            
            <div class="form-grid mb-4">
              <div class="form-group">
                <label class="form-label">First Name <span>*</span></label>
                <input type="text" class="form-input" name="first_name" required>
              </div>
              <div class="form-group">
                <label class="form-label">Last Name <span>*</span></label>
                <input type="text" class="form-input" name="last_name" required>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address <span>*</span></label>
                <input type="email" class="form-input" name="email" required>
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number <span>*</span></label>
                <input type="tel" class="form-input" name="phone" required>
              </div>
              <div class="form-group">
                <label class="form-label">Current City & Province <span>*</span></label>
                <input type="text" class="form-input" name="location" placeholder="e.g. Vancouver, BC" required>
              </div>
              <div class="form-group">
                <label class="form-label">Target Build Location <span>*</span></label>
                <input type="text" class="form-input" name="preferred_region" placeholder="e.g. Sunshine Coast, Squamish" required>
              </div>
              <div class="form-group">
                <label class="form-label">Financing Qualification Status <span>*</span></label>
                <select class="form-select" name="financing_status" required>
                  <option value="Pre-approved">Pre-approved by Bank</option>
                  <option value="Speaking with lender">Currently speaking with construction lender</option>
                  <option value="Need help">Need help structuring construction draws</option>
                  <option value="Cash buyer">All-cash ready buyer</option>
                  <option value="Not sure">Not sure / initial exploratory consult</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Total Projected Budget Range <span>*</span></label>
                <select class="form-select" name="budget_range" required>
                  <option value="Under $250k">Under $250,000</option>
                  <option value="$250k–$350k">$250,000 – $350,000</option>
                  <option value="$350k–$450k" selected>$350,000 – $450,000</option>
                  <option value="$450k–$600k">$450,000 – $600,000</option>
                  <option value="$600k+">$600,000 +</option>
                </select>
              </div>
            </div>

            <div class="form-grid mb-4">
              <div class="form-group">
                <label class="form-label">Intended Occupancy Type <span>*</span></label>
                <select class="form-select" name="intended_use" required>
                  <option value="Primary residence">Primary Residence (Moving in)</option>
                  <option value="Vacation home">Vacation / Cabin use</option>
                  <option value="Rental investment">High-yield Rental Investment</option>
                  <option value="Not sure">Not entirely sure</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Ongoing Rental Property Management Interest?</label>
                <select class="form-select" name="property_management">
                  <option value="No">No, I will self-manage or occupy</option>
                  <option value="Yes">Yes, full STR rental management needed</option>
                  <option value="Maybe">Maybe, send revenue projections</option>
                </select>
              </div>
            </div>

            <div class="form-group col-span-2">
              <label class="form-label">Write in your specific Project Notes or Questions</label>
              <textarea class="form-textarea" name="message" placeholder="Provide details on custom foundation slab needs, carport requests, local well drill requirements, etc..."></textarea>
            </div>

            <div class="form-group col-span-2 mt-4" style="border-top:1px solid var(--color-bg-tertiary); padding-top:1.5rem;">
              <label class="checkbox-group">
                <input type="checkbox" name="consent" value="Yes" required>
                <span>I verify that all preferences entered are accurate, and request a personalized Lots2Homes consultation blueprint. <span>*</span></span>
              </label>
            </div>

            <div style="margin-top:2rem;">
              <button type="submit" class="btn btn-primary btn-full">Initiate Construction Build Request</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;

  // Submit build request
  document.getElementById('start-build-wizard-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const activeUpgrades = [];
    e.target.querySelectorAll('input[name="upgrades"]:checked').forEach(c => activeUpgrades.push(c.value));

    const lead = {
      lead_type: 'Start Your Build',
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      location: formData.get('location'),
      preferred_region: formData.get('preferred_region'),
      selected_lot_id: formData.get('lot_id'),
      selected_design_id: formData.get('design_id'),
      budget_range: formData.get('budget_range'),
      financing_status: formData.get('financing_status'),
      timeline: formData.get('timeline'),
      intended_use: formData.get('intended_use'),
      property_management_interest: formData.get('property_management'),
      sustainability_interest: activeUpgrades,
      message: `Wizard build initiated. Finishes Package: ${formData.get('finishes_id')}. Chosen Upgrades: ${activeUpgrades.join(', ')}. | Notes: ${formData.get('message')}`
    };

    db.saveLead(lead);

    showToast(
      'Build Request Logged!', 
      'Your guided build profile has been saved. A simulated email notification has been dispatched to builds@lots2homes.com.',
      'success'
    );
    e.target.reset();
    window.location.hash = '#/'; // redirect home
  });
}

/* ==========================================================================
   4. VIEW COMPILERS (SECURE STAFF ADMIN CONSOLE)
   ========================================================================== */

// --- ADMIN LOGIN VIEW ---
function renderAdminLogin() {
  // Clear any existing active sessions
  sessionStorage.removeItem('l2h_admin_session');

  viewport.innerHTML = `
    <div class="admin-login-wrapper">
      <div class="login-card">
        <div class="text-center mb-4">
          <div class="logo-icon" style="margin: 0 auto 1rem; width:48px; height:48px; font-size:1.5rem;">L</div>
          <h2 style="font-size:1.5rem; color:var(--color-brand-primary);">Staff Control Console</h2>
          <p class="text-secondary" style="font-size:0.85rem; margin-top:0.25rem;">Enter credential details to access inquiries & databases.</p>
        </div>

        <form id="admin-login-form">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" class="form-input" name="username" value="admin" required autocomplete="username">
          </div>
          <div class="form-group" style="margin-bottom:1.5rem;">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" value="password123" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-primary btn-full">Authenticate Staff Session</button>
        </form>

        <div style="background:var(--color-bg-secondary); border:1px solid var(--color-border-glass); border-radius:8px; padding:0.75rem; font-size:0.78rem; color:var(--color-text-muted); text-align:center; margin-top:1.5rem;">
          <strong>Demo credentials preloaded:</strong><br>
          Username: <code style="font-family:monospace; font-weight:700;">admin</code> &nbsp;|&nbsp; Password: <code style="font-family:monospace; font-weight:700;">password123</code>
        </div>
      </div>
    </div>
  `;

  document.getElementById('admin-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const user = formData.get('username');
    const pass = formData.get('password');

    if (user === 'admin' && pass === 'password123') {
      sessionStorage.setItem('l2h_admin_session', 'authenticated_token_' + Date.now());
      showToast('Authenticated', 'Welcome back, Staff Officer.', 'success');
      window.location.hash = '#/admin';
    } else {
      showToast('Authentication Failed', 'Invalid staff username or password credentials.', 'error');
    }
  });
}

// --- MAIN STAFF ADMIN CONSOLE PANEL ---
function renderAdmin() {
  // Authentication Guard
  if (!sessionStorage.getItem('l2h_admin_session')) {
    window.location.hash = '#/admin/login';
    return;
  }

  // Initial dashboard view assembly with glassmorphic shell
  const activeTab = state.activeAdminTab || 'overview';
  viewport.innerHTML = `
    <div class="admin-shell">
      <!-- Admin Sidebar Navigation -->
      <aside class="admin-sidebar">
        <div style="font-size:0.8rem; font-weight:700; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.05em; padding-left:1rem;">Staff Panel</div>
        <ul class="admin-menu">
          <li class="admin-menu-item ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview"><button><i data-lucide="layout-dashboard"></i> <span>Overview</span></button></li>
          <li class="admin-menu-item ${activeTab === 'lots' ? 'active' : ''}" data-tab="lots"><button><i data-lucide="map"></i> <span>Lots Registry</span></button></li>
          <li class="admin-menu-item ${activeTab === 'designs' ? 'active' : ''}" data-tab="designs"><button><i data-lucide="home"></i> <span>Designs Catalog</span></button></li>
          <li class="admin-menu-item ${activeTab === 'upgrades' ? 'active' : ''}" data-tab="upgrades"><button><i data-lucide="sliders"></i> <span>Upgrades Matrix</span></button></li>
          <li class="admin-menu-item ${activeTab === 'finishes' ? 'active' : ''}" data-tab="finishes"><button><i data-lucide="palette"></i> <span>Finish Packages</span></button></li>
          <li class="admin-menu-item ${activeTab === 'leads' ? 'active' : ''}" data-tab="leads"><button><i data-lucide="users"></i> <span>Buyer Leads</span></button></li>
          <li class="admin-menu-item ${activeTab === 'landowners' ? 'active' : ''}" data-tab="landowners"><button><i data-lucide="landplot"></i> <span>Lot Submissions</span></button></li>
          <li class="admin-menu-item ${activeTab === 'contractors' ? 'active' : ''}" data-tab="contractors"><button><i data-lucide="hammer"></i> <span>Contractors</span></button></li>
          <li class="admin-menu-item ${activeTab === 'partners' ? 'active' : ''}" data-tab="partners"><button><i data-lucide="handshake"></i> <span>Partner Apps</span></button></li>
          <li class="admin-menu-item ${activeTab === 'content-editor' ? 'active' : ''}" data-tab="content-editor"><button><i data-lucide="file-edit"></i> <span>Page Editor</span></button></li>
        </ul>
        <div style="margin-top:auto; padding-top:1.5rem; border-top:1px solid var(--color-bg-tertiary);">
          <button class="btn btn-secondary btn-sm btn-full" id="btn-admin-logout" style="border-color:var(--color-danger-light); color:var(--color-danger-dark);"><i data-lucide="log-out" style="width:14px;"></i> Log Out</button>
        </div>
      </aside>

      <!-- Admin Wide Main Body -->
      <section class="admin-body" id="admin-tab-viewport">
        <!-- Render Active Tab Content -->
      </section>
    </div>

    <!-- Universal Modal Container backing CRUD operations -->
    <div id="admin-modal-container" style="display:none;"></div>
  `;

  // Bind Logout
  document.getElementById('btn-admin-logout').addEventListener('click', () => {
    sessionStorage.removeItem('l2h_admin_session');
    showToast('Logged Out', 'Staff session closed successfully.');
    window.location.hash = '#/';
  });

  // Bind Sidebar Tab Clicks
  const tabViewport = document.getElementById('admin-tab-viewport');

  document.querySelectorAll('.admin-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const target = e.currentTarget;
      const tabName = target.getAttribute('data-tab');
      
      document.querySelectorAll('.admin-menu-item').forEach(c => c.classList.remove('active'));
      target.classList.add('active');
      
      state.activeAdminTab = tabName;
      compileActiveTab(tabName);
    });
  });

  // Compiler orchestrator
  function compileActiveTab(tabName) {
    tabViewport.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; min-height:40vh;"><div style="border:3px solid var(--color-bg-tertiary); border-top-color:var(--color-accent-gold); border-radius:50%; width:30px; height:30px; animation:spin 1s linear infinite;"></div></div>`;
    
    setTimeout(() => {
      if (tabName === 'overview') compileAdminOverview();
      else if (tabName === 'lots') compileAdminLots();
      else if (tabName === 'designs') compileAdminDesigns();
      else if (tabName === 'upgrades') compileAdminUpgrades();
      else if (tabName === 'finishes') compileAdminFinishes();
      else if (tabName === 'leads') compileAdminLeads();
      else if (tabName === 'landowners') compileAdminLandowners();
      else if (tabName === 'contractors') compileAdminContractors();
      else if (tabName === 'partners') compileAdminPartners();
      else if (tabName === 'content-editor') compileAdminContentEditor();

      safeCreateIcons();
    }, 150);
  }

  // Initialize Default Tab view
  compileActiveTab(state.activeAdminTab);

  /* ==========================================
     SUB-TAB 1: OVERVIEW METRICS
     ========================================== */
  function compileAdminOverview() {
    const stats = db.getDashboardStats();
    const leads = db.getLeads().slice(0, 5);

    tabViewport.innerHTML = `
      <div class="admin-header-actions">
        <div>
          <h2 style="font-size:1.75rem;">Dashboard Overview</h2>
          <p class="text-secondary" style="font-size:0.88rem; margin-top:0.2rem;">Real-time stats tally and qualified leads tracking.</p>
        </div>
        <span class="badge badge-gold" style="padding:0.4rem 1rem;">System Active</span>
      </div>

      <!-- Stats counter tiles bar -->
      <div class="admin-stats-bar">
        <div class="stat-tile">
          <div class="stat-icon gold"><i data-lucide="users"></i></div>
          <div class="stat-info">
            <span class="stat-val">${stats.totalLeads}</span>
            <span class="stat-lbl">Buyer Inquiries</span>
          </div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon sage"><i data-lucide="landplot"></i></div>
          <div class="stat-info">
            <span class="stat-val">${stats.totalLotSubs}</span>
            <span class="stat-lbl">Land Submissions</span>
          </div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon blue"><i data-lucide="hammer"></i></div>
          <div class="stat-info">
            <span class="stat-val">${stats.totalContractors}</span>
            <span class="stat-lbl">Contractor Registrations</span>
          </div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon slate"><i data-lucide="map"></i></div>
          <div class="stat-info">
            <span class="stat-val">${stats.totalLots}</span>
            <span class="stat-lbl">Active Lots</span>
          </div>
        </div>
      </div>

      <!-- Recent Leads Table -->
      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size:1.15rem; font-weight:700;">Latest Incoming Lead Actions</h3>
          <button class="btn btn-secondary btn-sm" id="btn-quick-leads-tab"><i data-lucide="arrow-right" style="width:14px;"></i> Manage Leads</button>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Lead Type</th>
                <th>Sender Name</th>
                <th>Email</th>
                <th>Preferred Region</th>
                <th>Status</th>
                <th>Submitted Date</th>
              </tr>
            </thead>
            <tbody>
              ${leads.map(ld => `
                <tr>
                  <td><span class="badge ${ld.lead_type === 'Start Your Build' ? 'badge-gold' : 'badge-blue'}">${ld.lead_type}</span></td>
                  <td style="font-weight:700; color:var(--color-brand-primary);">${ld.first_name} ${ld.last_name}</td>
                  <td>${ld.email}</td>
                  <td>${ld.preferred_region}</td>
                  <td><span class="badge badge-muted">${ld.status}</span></td>
                  <td style="font-size:0.8rem; color:var(--color-text-muted);">${new Date(ld.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-quick-leads-tab').addEventListener('click', () => {
      document.querySelector('[data-tab="leads"]').click();
    });
  }

  /* ==========================================
     SUB-TAB 2: LOTS REGISTRY (CRUD)
     ========================================== */
  function compileAdminLots() {
    const editId = sessionStorage.getItem('l2h_admin_edit_lot_id');
    if (editId) {
      sessionStorage.removeItem('l2h_admin_edit_lot_id');
      const lotToEdit = db.getLot(editId);
      if (lotToEdit) {
        setTimeout(() => openLotFormModal(lotToEdit), 50);
      }
    }
    
    const lots = db.getLots();

    tabViewport.innerHTML = `
      <div class="admin-header-actions">
        <div>
          <h2 style="font-size:1.75rem;">Lots Registry Manager</h2>
          <p class="text-secondary" style="font-size:0.88rem; margin-top:0.2rem;">Add new parcels, pair compatible home models, and adjust statuses.</p>
        </div>
        <button class="btn btn-accent btn-sm" id="btn-admin-add-lot"><i data-lucide="plus" style="width:14px;"></i> Publish New Lot</button>
      </div>

      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size:1.1rem; font-weight:700;">Active Market Listings</h3>
          <input type="text" class="table-search-input" placeholder="Search lots..." id="search-admin-lots">
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:70px; text-align:center;">Photo</th>
                <th>Lot Title</th>
                <th>Location</th>
                <th>Dimensions</th>
                <th>Price</th>
                <th>Est. Package</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-lots-table-body">
              ${compileLotsRows(lots)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    function compileLotsRows(list) {
      if (list.length === 0) return `<tr><td colspan="8" class="text-center text-muted">No lots registered in database.</td></tr>`;
      return list.map(lot => `
        <tr>
          <td style="text-align:center; vertical-align:middle; padding:0.5rem;">
            <div style="width:48px; height:36px; border-radius:4px; overflow:hidden; border:1px solid var(--color-border-glass); background:#f1f5f9; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <img src="${lot.image_urls && lot.image_urls[0] ? lot.image_urls[0] : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=80&q=80'}" style="width:100%; height:100%; object-fit:cover;">
            </div>
          </td>
          <td style="font-weight:700; color:var(--color-brand-primary);">${lot.title}</td>
          <td>${lot.location}</td>
          <td>${lot.lot_size} ${lot.lot_size_unit}</td>
          <td style="font-weight:700; color:var(--color-accent-gold-dark);">${formatMoney(lot.asking_price)}</td>
          <td style="font-weight:700; color:var(--color-accent-sage-dark);">${formatMoney(lot.estimated_package_price)}</td>
          <td>
            <select class="form-select lot-status-dropdown" data-lot-id="${lot.id}" style="padding:0.35rem 0.5rem; font-size:0.8rem; font-weight:700; width:130px; background-color:var(--color-bg-secondary); border-radius:6px; cursor:pointer;">
              <option value="Available" ${lot.status === 'Available' ? 'selected' : ''}>Available</option>
              <option value="Reserved" ${lot.status === 'Reserved' ? 'selected' : ''}>Reserved</option>
              <option value="Coming Soon" ${lot.status === 'Coming Soon' ? 'selected' : ''}>Coming Soon</option>
              <option value="Sold" ${lot.status === 'Sold' ? 'selected' : ''}>Sold</option>
            </select>
          </td>
          <td>
            <div class="table-actions">
              <a href="#/lots/${lot.id}" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="eye" style="width:12px;"></i> View</a>
              <button class="btn btn-secondary btn-sm btn-edit-lot" data-lot-id="${lot.id}"><i data-lucide="edit-3" style="width:12px;"></i> Edit</button>
              <button class="btn btn-secondary btn-sm btn-delete-lot" data-lot-id="${lot.id}" style="color:var(--color-danger-dark); border-color:var(--color-danger-light);"><i data-lucide="trash-2" style="width:12px;"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    // Bind Search
    document.getElementById('search-admin-lots').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const matched = lots.filter(l => l.title.toLowerCase().includes(q) || l.location.toLowerCase().includes(q));
      document.getElementById('admin-lots-table-body').innerHTML = compileLotsRows(matched);
      safeCreateIcons();
      bindTableActions();
    });

    function bindTableActions() {
      // Edit Lot Trigger
      document.querySelectorAll('.btn-edit-lot').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const lotId = e.currentTarget.getAttribute('data-lot-id');
          openLotFormModal(db.getLot(lotId));
        });
      });

      // Delete Lot Trigger
      document.querySelectorAll('.btn-delete-lot').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (confirm('Are you absolutely sure you want to delete this listing parcel from database?')) {
            const lotId = e.currentTarget.getAttribute('data-lot-id');
            db.deleteLot(lotId);
            showToast('Lot Deleted', 'Listing successfully removed from active DB.');
            compileAdminLots(); // re-compile view
          }
        });
      });

      // Lot Status Change dropdown listener
      document.querySelectorAll('.lot-status-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', (e) => {
          const lotId = e.target.getAttribute('data-lot-id');
          const newStatus = e.target.value;
          const lotObj = db.getLot(lotId);
          if (lotObj) {
            lotObj.status = newStatus;
            db.saveLot(lotObj);
            showToast('Status Updated', `Listing status updated to ${newStatus}.`, 'success');
            compileAdminLots(); // re-compile view to keep styling up to date
          }
        });
      });
    }

    // Bind Add Lot
    document.getElementById('btn-admin-add-lot').addEventListener('click', () => {
      openLotFormModal();
    });

    bindTableActions();
  }

  // --- Dynamic Lot Form Modal (Create & Update) ---
  function openLotFormModal(lot = null) {
    const modalContainer = document.getElementById('admin-modal-container');
    const designs = db.getDesigns();

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-size:1.25rem;">${lot ? 'Modify Lot Listing: ' + lot.title : 'Publish New Available Lot'}</h3>
            <span class="modal-close" id="btn-close-modal">&times;</span>
          </div>
          <form id="modal-lot-form">
            <div class="modal-body">
              <input type="hidden" name="id" value="${lot ? lot.id : ''}">
              <div class="form-grid">
                <div class="form-group col-span-2">
                  <label class="form-label">Lot Title <span>*</span></label>
                  <input type="text" class="form-input" name="title" value="${lot ? lot.title : ''}" required>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Location Address <span>*</span></label>
                  <input type="text" class="form-input" name="location" value="${lot ? lot.location : ''}" placeholder="e.g. 1420 Sea View Rd, Sunshine Coast" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Province <span>*</span></label>
                  <input type="text" class="form-input" name="province" value="${lot ? lot.province : 'BC'}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Municipality / County <span>*</span></label>
                  <input type="text" class="form-input" name="municipality" value="${lot ? lot.municipality : 'Sunshine Coast RD'}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">PID Number (Tax ID) <span>*</span></label>
                  <input type="text" class="form-input" name="pid" value="${lot ? lot.pid : ''}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Lot Size / Dimension <span>*</span></label>
                  <div style="display:flex; gap:0.5rem;">
                    <input type="number" step="0.01" class="form-input" name="lot_size" value="${lot ? lot.lot_size : ''}" required style="width:70%;">
                    <select class="form-select" name="lot_size_unit" style="width:30%;">
                      <option value="Acres" ${lot && lot.lot_size_unit === 'Acres' ? 'selected' : ''}>Acres</option>
                      <option value="Sq Ft" ${lot && lot.lot_size_unit === 'Sq Ft' ? 'selected' : ''}>Sq Ft</option>
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Frontage (feet)</label>
                  <input type="number" class="form-input" name="frontage" value="${lot ? lot.frontage : ''}">
                </div>
                <div class="form-group">
                  <label class="form-label">Depth (feet)</label>
                  <input type="number" class="form-input" name="depth" value="${lot ? lot.depth : ''}">
                </div>
                <div class="form-group">
                  <label class="form-label">Asking Land Price ($) <span>*</span></label>
                  <input type="number" class="form-input" name="asking_price" value="${lot ? lot.asking_price : ''}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Projected Base Package Price ($) <span>*</span></label>
                  <input type="number" class="form-input" name="estimated_package_price" value="${lot ? lot.estimated_package_price : ''}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Listing Market Status <span>*</span></label>
                  <select class="form-select" name="status" required>
                    <option value="Available" ${lot && lot.status === 'Available' ? 'selected' : ''}>Available</option>
                    <option value="Reserved" ${lot && lot.status === 'Reserved' ? 'selected' : ''}>Reserved</option>
                    <option value="Coming Soon" ${lot && lot.status === 'Coming Soon' ? 'selected' : ''}>Coming Soon</option>
                    <option value="Sold" ${lot && lot.status === 'Sold' ? 'selected' : ''}>Sold</option>
                  </select>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Manage Listing Photos (Upload Multiple or Paste URLs)</label>
                  <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.25rem;">
                    
                    <!-- Thumbnail Preview Grid -->
                    <div id="lot-photo-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem; border: 1px solid var(--color-border-glass); padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.02); min-height: 80px; align-items: center;">
                      <!-- Populated dynamically via JS -->
                      <p id="lot-photo-grid-placeholder" class="text-center text-muted" style="grid-column: 1 / -1; font-size: 0.8rem; margin: 0; padding: 1rem 0;">No pictures uploaded yet.</p>
                    </div>

                    <!-- Input Grid (Dropzone & Text Input side-by-side) -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: stretch;">
                      <!-- Dropzone -->
                      <div class="file-dropzone" id="lot-photo-dropzone" style="padding: 1rem; border: 2px dashed var(--color-border-glass); border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <i data-lucide="image" style="width: 20px; height: 20px; margin-bottom: 0.25rem; color: var(--color-accent-gold);"></i>
                        <span style="font-size: 0.78rem; font-weight: 600; color: var(--color-brand-primary);">Drag & Drop new picture</span>
                        <span style="font-size: 0.65rem; color: var(--color-text-secondary); margin-top: 0.1rem;">or click to browse local files</span>
                      </div>
                      <input type="file" id="lot-photo-input" accept="image/*" style="display: none;" multiple>

                      <!-- Manual URL addition -->
                      <div style="display: flex; flex-direction: column; gap: 0.4rem; justify-content: center;">
                        <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 0;">Add custom picture by direct URL:</label>
                        <div style="display: flex; gap: 0.4rem;">
                          <input type="text" class="form-input" id="lot-image-url-input" placeholder="https://images.unsplash.com/..." style="font-size: 0.85rem; flex-grow: 1; margin-bottom: 0;">
                          <button type="button" class="btn btn-secondary btn-sm" id="btn-add-lot-photo-url" style="padding: 0.5rem 0.8rem; font-size: 0.8rem; font-weight: 700; white-space: nowrap;"><i data-lucide="plus" style="width: 12px; height: 12px; display: inline;"></i> Add</button>
                        </div>
                        <p style="font-size: 0.65rem; color: var(--color-text-secondary); line-height: 1.3; margin: 0;">You can upload standard JPG/PNG files directly or paste direct external URLs. All added images will appear in the grid above.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Compatible home model footprints (Check all compatible)</label>
                  <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.5rem; margin-top:0.25rem;">
                    ${designs.map(d => {
                      const isChecked = (lot && lot.compatible_design_ids && Array.isArray(lot.compatible_design_ids)) ? lot.compatible_design_ids.includes(d.id) : false;
                      return `<label class="checkbox-group"><input type="checkbox" name="compatible_designs" value="${d.id}" ${isChecked ? 'checked' : ''}> ${d.name}</label>`;
                    }).join('')}
                  </div>
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Property Description <span>*</span></label>
                  <textarea class="form-textarea" name="description" required>${lot ? lot.description : ''}</textarea>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Servicing Details <span>*</span></label>
                  <textarea class="form-textarea" name="servicing_notes" required>${lot ? lot.servicing_notes : ''}</textarea>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Zoning Specifications</label>
                  <textarea class="form-textarea" name="zoning_notes">${lot ? lot.zoning_notes : ''}</textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary btn-sm">Save Registry Details</button>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.style.display = 'block';

    const closeModal = () => { modalContainer.style.display = 'none'; };
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

    // Image Upload Event Handlers & State
    let uploadedImages = lot && Array.isArray(lot.image_urls) ? [...lot.image_urls] : [];

    const lotDropzone = document.getElementById('lot-photo-dropzone');
    const lotFileInput = document.getElementById('lot-photo-input');
    const lotUrlInput = document.getElementById('lot-image-url-input');
    const lotAddUrlBtn = document.getElementById('btn-add-lot-photo-url');
    const photoGrid = document.getElementById('lot-photo-grid');

    const renderLotsImageGrid = () => {
      if (uploadedImages.length === 0) {
        photoGrid.innerHTML = `<p id="lot-photo-grid-placeholder" class="text-center text-muted" style="grid-column: 1 / -1; font-size: 0.8rem; margin: 0; padding: 1rem 0;">No pictures uploaded yet.</p>`;
        return;
      }
      photoGrid.innerHTML = uploadedImages.map((url, idx) => `
        <div class="file-preview-item" style="width: 100px; height: 75px; position: relative; border-radius: 6px; overflow: hidden; border: 1px solid var(--color-border-glass); box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; margin-right: 0.5rem; margin-bottom: 0.5rem;">
          <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
          <span class="file-preview-remove btn-delete-uploaded-photo" data-idx="${idx}" style="position: absolute; top: 4px; right: 4px; background: rgba(220, 38, 38, 0.85); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s ease;">&times;</span>
        </div>
      `).join('');

      // Add delete click handlers
      photoGrid.querySelectorAll('.btn-delete-uploaded-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
          uploadedImages.splice(idx, 1);
          renderLotsImageGrid();
          showToast('Image Removed', 'Picture successfully removed from listing drafts.');
        });
      });
    };

    // Initial render
    renderLotsImageGrid();

    const handleLotFile = (file) => {
      if (!file.type.startsWith('image/')) {
        showToast('Invalid File', 'Only image files are permitted.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        uploadedImages.push(base64Data);
        renderLotsImageGrid();
        showToast('Image Loaded', 'Custom lot picture added to registry collection.', 'success');
      };
      reader.readAsDataURL(file);
    };

    // Click to select
    lotDropzone.addEventListener('click', () => {
      lotFileInput.click();
    });
    lotFileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Drag-and-drop Events
    lotDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      lotDropzone.style.borderColor = 'var(--color-accent-gold)';
      lotDropzone.style.backgroundColor = 'var(--color-bg-tertiary)';
    });

    lotDropzone.addEventListener('dragleave', () => {
      lotDropzone.style.borderColor = 'var(--color-border-glass)';
      lotDropzone.style.backgroundColor = 'transparent';
    });

    lotDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      lotDropzone.style.borderColor = 'var(--color-border-glass)';
      lotDropzone.style.backgroundColor = 'transparent';
      if (e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach(file => {
          handleLotFile(file);
        });
      }
    });

    // File input change Event
    lotFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        Array.from(e.target.files).forEach(file => {
          handleLotFile(file);
        });
      }
    });

    // Add image via URL button
    lotAddUrlBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = lotUrlInput.value.trim();
      if (val) {
        uploadedImages.push(val);
        lotUrlInput.value = '';
        renderLotsImageGrid();
        showToast('Image Added', 'URL added to the lot photo gallery.', 'success');
      } else {
        showToast('Input Empty', 'Please enter a valid image URL first.', 'error');
      }
    });

    // Form Submit inside Modal
    document.getElementById('modal-lot-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const compatIds = [];
      e.target.querySelectorAll('input[name="compatible_designs"]:checked').forEach(c => compatIds.push(c.value));

      const updatedLot = {
        id: formData.get('id') || undefined,
        title: formData.get('title'),
        location: formData.get('location'),
        province: formData.get('province'),
        municipality: formData.get('municipality'),
        pid: formData.get('pid'),
        lot_size: Number(formData.get('lot_size')),
        lot_size_unit: formData.get('lot_size_unit'),
        frontage: Number(formData.get('frontage')),
        depth: Number(formData.get('depth')),
        asking_price: Number(formData.get('asking_price')),
        estimated_package_price: Number(formData.get('estimated_package_price')),
        status: formData.get('status'),
        image_urls: uploadedImages.length > 0 ? uploadedImages : (lot && lot.image_urls ? lot.image_urls : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80']),
        compatible_design_ids: compatIds,
        description: formData.get('description'),
        servicing_notes: formData.get('servicing_notes'),
        zoning_notes: formData.get('zoning_notes'),
        access_notes: lot ? lot.access_notes : 'Clear direct public access.',
        sustainability_notes: lot ? lot.sustainability_notes : 'High solar energy absorption.',
        rental_notes: lot ? lot.rental_notes : 'Strong short term rental demand.'
      };

      db.saveLot(updatedLot);
      showToast('Registry Synced', 'Available lot listing successfully updated in the DB.', 'success');
      closeModal();
      compileAdminLots(); // refresh registry view
    });

    safeCreateIcons();
  }

  /* ==========================================
     SUB-TAB 3: DESIGNS CATALOG (CRUD)
     ========================================== */
  function compileAdminDesigns() {
    const editId = sessionStorage.getItem('l2h_admin_edit_design_id');
    if (editId) {
      sessionStorage.removeItem('l2h_admin_edit_design_id');
      const designToEdit = db.getDesign(editId);
      if (designToEdit) {
        setTimeout(() => openDesignFormModal(designToEdit), 50);
      }
    }

    const designs = db.getDesigns();

    tabViewport.innerHTML = `
      <div class="admin-header-actions">
        <div>
          <h2 style="font-size:1.75rem;">Designs Catalog Manager</h2>
          <p class="text-secondary" style="font-size:0.88rem; margin-top:0.2rem;">Adjust architecture specifications and structural build prices.</p>
        </div>
        <button class="btn btn-accent btn-sm" id="btn-admin-add-design"><i data-lucide="plus" style="width:14px;"></i> Publish New Design</button>
      </div>

      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size:1.1rem; font-weight:700;">Standardized Floor Plans</h3>
          <input type="text" class="table-search-input" placeholder="Search designs..." id="search-admin-designs">
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:70px; text-align:center;">Photo</th>
                <th>Design Name</th>
                <th>Layout Plan</th>
                <th>Floor Area</th>
                <th>Starting Build Price</th>
                <th>Active status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-designs-table-body">
              ${compileDesignsRows(designs)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    function compileDesignsRows(list) {
      if (list.length === 0) return `<tr><td colspan="8" class="text-center text-muted">No design models preloaded.</td></tr>`;
      return list.map(ds => `
        <tr>
          <td style="text-align:center; vertical-align:middle; padding:0.5rem;">
            <div style="width:48px; height:36px; border-radius:4px; overflow:hidden; border:1px solid var(--color-border-glass); background:#f1f5f9; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <img src="${ds.image_urls && ds.image_urls[0] ? ds.image_urls[0] : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=80&q=80'}" style="width:100%; height:100%; object-fit:cover;">
            </div>
          </td>
          <td style="font-weight:700; color:var(--color-brand-primary);">${ds.name}</td>
          <td>${ds.bedrooms} Bed / ${ds.bathrooms} Bath</td>
          <td>${ds.square_feet} Sq Ft</td>
          <td style="font-weight:700; color:var(--color-accent-gold-dark);">${formatMoney(ds.starting_price)}</td>
          <td><span class="badge ${ds.active ? 'badge-sage' : 'badge-muted'}">${ds.active ? 'Active' : 'Inactive'}</span></td>
          <td>
            <div class="table-actions">
              <a href="#/designs/${ds.id}" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="eye" style="width:12px;"></i> View</a>
              <button class="btn btn-secondary btn-sm btn-edit-design" data-design-id="${ds.id}"><i data-lucide="edit-3" style="width:12px;"></i> Edit</button>
              <button class="btn btn-secondary btn-sm btn-delete-design" data-design-id="${ds.id}" style="color:var(--color-danger-dark); border-color:var(--color-danger-light);"><i data-lucide="trash-2" style="width:12px;"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    // Bind Search
    document.getElementById('search-admin-designs').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const matched = designs.filter(ds => ds.name.toLowerCase().includes(q));
      document.getElementById('admin-designs-table-body').innerHTML = compileDesignsRows(matched);
      safeCreateIcons();
      bindTableActions();
    });

    function bindTableActions() {
      // Edit plan
      document.querySelectorAll('.btn-edit-design').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const dsId = e.currentTarget.getAttribute('data-design-id');
          openDesignFormModal(db.getDesign(dsId));
        });
      });

      // Delete plan
      document.querySelectorAll('.btn-delete-design').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (confirm('Delete this building plan from database? Compatibility configurations will be unlinked.')) {
            const dsId = e.currentTarget.getAttribute('data-design-id');
            db.deleteDesign(dsId);
            showToast('Design Removed', 'Plan successfully unlinked.');
            compileAdminDesigns();
          }
        });
      });
    }

    // Bind Add Design
    document.getElementById('btn-admin-add-design').addEventListener('click', () => {
      openDesignFormModal();
    });

    bindTableActions();
  }

  // --- Design Form Modal ---
  function openDesignFormModal(design = null) {
    const modalContainer = document.getElementById('admin-modal-container');
    const upgrades = db.getUpgrades();

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-size:1.25rem;">${design ? 'Modify Design: ' + design.name : 'Publish New Home Plan'}</h3>
            <span class="modal-close" id="btn-close-modal">&times;</span>
          </div>
          <form id="modal-design-form">
            <div class="modal-body">
              <input type="hidden" name="id" value="${design ? design.id : ''}">
              <div class="form-grid">
                <div class="form-group col-span-2">
                  <label class="form-label">Design Name <span>*</span></label>
                  <input type="text" class="form-input" name="name" value="${design ? design.name : ''}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Bedrooms Count <span>*</span></label>
                  <input type="number" class="form-input" name="bedrooms" value="${design ? design.bedrooms : ''}" required min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">Bathrooms Count <span>*</span></label>
                  <input type="number" class="form-input" name="bathrooms" value="${design ? design.bathrooms : ''}" required min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">Square Footage Area <span>*</span></label>
                  <input type="number" class="form-input" name="square_feet" value="${design ? design.square_feet : ''}" required min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">Starting Build Price ($) <span>*</span></label>
                  <input type="number" class="form-input" name="starting_price" value="${design ? design.starting_price : ''}" required min="0">
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Model Picture (Upload or Paste URL)</label>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; margin-top: 0.25rem;">
                    <!-- Dropzone -->
                    <div>
                      <div class="file-dropzone" id="design-photo-dropzone" style="padding: 1.25rem 1rem; border: 2px dashed var(--color-border-glass); border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s ease;">
                        <i data-lucide="image" style="width: 24px; height: 24px; margin: 0 auto 0.5rem; color: var(--color-accent-gold); display: block;"></i>
                        <span style="font-size: 0.8rem; font-weight: 600; display: block; color: var(--color-brand-primary);">Drag & Drop image here</span>
                        <span style="font-size: 0.7rem; color: var(--color-text-secondary); display: block; margin-top: 0.15rem;">or click to browse local files</span>
                      </div>
                      <input type="file" id="design-photo-input" accept="image/*" style="display: none;">
                      <!-- File Preview Thumbnail -->
                      <div id="design-photo-preview-container" style="display: ${design && design.image_urls && design.image_urls[0] ? 'block' : 'none'}; margin-top: 0.5rem;">
                        <div class="file-preview-item" style="width: 100px; height: 75px; margin: 0 auto; position: relative; border-radius: 6px; overflow: hidden; border: 1px solid var(--color-border-glass);">
                          <img id="design-photo-preview-img" src="${design && design.image_urls && design.image_urls[0] ? design.image_urls[0] : ''}" style="width: 100%; height: 100%; object-fit: cover;">
                          <span class="file-preview-remove" id="btn-remove-design-photo" style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s ease;">&times;</span>
                        </div>
                      </div>
                    </div>
                    <!-- Direct URL Box -->
                    <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                      <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 0;">Or paste direct Image URL:</label>
                      <input type="text" class="form-input" id="design-image-url-input" name="image_url" value="${design ? design.image_urls[0] : ''}" placeholder="https://images.unsplash.com/..." style="font-size: 0.85rem;">
                      <p style="font-size: 0.68rem; color: var(--color-text-secondary); line-height: 1.3;">Uploading an image will automatically populate this field with the Base64 encoding for self-contained local storage.</p>
                    </div>
                  </div>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Catalog Status <span>*</span></label>
                  <select class="form-select" name="active" required>
                    <option value="true" ${design && design.active ? 'selected' : ''}>Active / Listed</option>
                    <option value="false" ${design && !design.active ? 'selected' : ''}>Inactive / Archive</option>
                  </select>
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Assign upgrades to this design</label>
                  <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:0.5rem; margin-top:0.25rem;">
                    ${upgrades.map(u => {
                      const isChecked = design ? db.getDesignUpgrades(design.id).some(du => du.id === u.id) : false;
                      return `<label class="checkbox-group"><input type="checkbox" name="assigned_upgrades" value="${u.id}" ${isChecked ? 'checked' : ''}> ${u.name}</label>`;
                    }).join('')}
                  </div>
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Architecture Philosophy <span>*</span></label>
                  <textarea class="form-textarea" name="description" required>${design ? design.description : ''}</textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary btn-sm">Save Plan Specs</button>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.style.display = 'block';

    const closeModal = () => { modalContainer.style.display = 'none'; };
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

    // Image Upload Event Handlers
    const designDropzone = document.getElementById('design-photo-dropzone');
    const designFileInput = document.getElementById('design-photo-input');
    const designPreviewContainer = document.getElementById('design-photo-preview-container');
    const designPreviewImg = document.getElementById('design-photo-preview-img');
    const designRemoveBtn = document.getElementById('btn-remove-design-photo');
    const designUrlInput = document.getElementById('design-image-url-input');

    const handleDesignFile = (file) => {
      if (!file.type.startsWith('image/')) {
        showToast('Invalid File', 'Only image files are permitted.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        designUrlInput.value = base64Data;
        designPreviewImg.src = base64Data;
        designPreviewContainer.style.display = 'block';
        showToast('Image Loaded', 'Custom design picture compiled successfully.', 'success');
      };
      reader.readAsDataURL(file);
    };

    // Click to select
    designDropzone.addEventListener('click', () => {
      designFileInput.click();
    });
    designFileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Drag-and-drop Events
    designDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      designDropzone.style.borderColor = 'var(--color-accent-gold)';
      designDropzone.style.backgroundColor = 'var(--color-bg-tertiary)';
    });

    designDropzone.addEventListener('dragleave', () => {
      designDropzone.style.borderColor = 'var(--color-border-glass)';
      designDropzone.style.backgroundColor = 'transparent';
    });

    designDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      designDropzone.style.borderColor = 'var(--color-border-glass)';
      designDropzone.style.backgroundColor = 'transparent';
      if (e.dataTransfer.files.length > 0) {
        handleDesignFile(e.dataTransfer.files[0]);
      }
    });

    // File input change Event
    designFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleDesignFile(e.target.files[0]);
      }
    });

    // Remove photo Event
    designRemoveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      designUrlInput.value = '';
      designPreviewImg.src = '';
      designPreviewContainer.style.display = 'none';
      designFileInput.value = '';
    });

    // Manual URL change Event to update preview thumbnail
    designUrlInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        designPreviewImg.src = val;
        designPreviewContainer.style.display = 'block';
      } else {
        designPreviewImg.src = '';
        designPreviewContainer.style.display = 'none';
      }
    });


    document.getElementById('modal-design-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const upgradeIds = [];
      e.target.querySelectorAll('input[name="assigned_upgrades"]:checked').forEach(c => upgradeIds.push(c.value));

      const updatedDesign = {
        id: formData.get('id') || undefined,
        name: formData.get('name'),
        bedrooms: Number(formData.get('bedrooms')),
        bathrooms: Number(formData.get('bathrooms')),
        square_feet: Number(formData.get('square_feet')),
        starting_price: Number(formData.get('starting_price')),
        active: formData.get('active') === 'true',
        image_urls: formData.get('image_url') ? [formData.get('image_url')] : (design && design.image_urls ? design.image_urls : undefined),
        description: formData.get('description'),
        features: design ? design.features : [
          "Standard Passive solar preps",
          "Canadian Cedar wrap-around decks prep",
          "Advanced HVAC mechanical pre-wirings"
        ],
        floor_plan_url: design ? design.floor_plan_url : "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
      };

      const savedDs = db.saveDesign(updatedDesign);
      
      // Update upgrade mappings
      db.assignUpgradesToDesign(savedDs.id, upgradeIds);

      showToast('Catalog Synced', 'Design plan details successfully updated in the DB.', 'success');
      closeModal();
      compileAdminDesigns();
    });

    safeCreateIcons();
  }

  /* ==========================================
     SUB-TAB 4: UPGRADES MATRIX (CRUD)
     ========================================== */
  function compileAdminUpgrades() {
    const upgrades = db.getUpgrades();

    tabViewport.innerHTML = `
      <div class="admin-header-actions">
        <div>
          <h2 style="font-size:1.75rem;">Upgrades Matrix</h2>
          <p class="text-secondary" style="font-size:0.88rem; margin-top:0.2rem;">Configure specialty systems and structural additions pricing.</p>
        </div>
        <button class="btn btn-accent btn-sm" id="btn-admin-add-upgrade"><i data-lucide="plus" style="width:14px;"></i> Create Upgrade</button>
      </div>

      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size:1.1rem; font-weight:700;">Upgrades Ledger</h3>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:80px;">Photo</th>
                <th>Upgrade Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Estimated Cost</th>
                <th>Active status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-upgrades-table-body">
              ${upgrades.map(up => {
                const thumbnail = up.image_urls && up.image_urls.length > 0 
                  ? up.image_urls[0] 
                  : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80';
                return `
                  <tr>
                    <td>
                      <img src="${thumbnail}" alt="${up.name}" style="width: 48px; height: 36px; object-fit: cover; border-radius: 4px; border: 1px solid var(--color-border-glass); background: #eee;">
                    </td>
                    <td style="font-weight:700; color:var(--color-brand-primary);">${up.name}</td>
                    <td><span class="badge badge-muted">${up.category}</span></td>
                    <td style="font-size:0.85rem; max-width:280px; color:var(--color-text-secondary);">${up.description}</td>
                    <td style="font-weight:700; color:var(--color-accent-sage-dark);">${formatMoney(up.estimated_price)}</td>
                    <td><span class="badge ${up.active ? 'badge-sage' : 'badge-muted'}">${up.active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn-secondary btn-sm btn-view-upgrade" data-up-id="${up.id}"><i data-lucide="eye" style="width:12px;"></i> View</button>
                        <button class="btn btn-secondary btn-sm btn-edit-upgrade" data-up-id="${up.id}"><i data-lucide="edit-3" style="width:12px;"></i> Edit</button>
                        <button class="btn btn-secondary btn-sm btn-delete-upgrade" data-up-id="${up.id}" style="color:var(--color-danger-dark); border-color:var(--color-danger-light);"><i data-lucide="trash-2" style="width:12px;"></i></button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    function bindUpgradeActions() {
      // View
      document.querySelectorAll('.btn-view-upgrade').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const upId = e.currentTarget.getAttribute('data-up-id');
          openUpgradeViewModal(upgrades.find(u => u.id === upId));
        });
      });

      // Edit
      document.querySelectorAll('.btn-edit-upgrade').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const upId = e.currentTarget.getAttribute('data-up-id');
          openUpgradeFormModal(upgrades.find(u => u.id === upId));
        });
      });

      // Delete
      document.querySelectorAll('.btn-delete-upgrade').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (confirm('Delete this upgrade entirely from database? This unlinks the upgrade from all compatible home plans.')) {
            const upId = e.currentTarget.getAttribute('data-up-id');
            db.deleteUpgrade(upId);
            showToast('Upgrade Deleted', 'Successfully removed.');
            compileAdminUpgrades();
          }
        });
      });
    }

    // Add Upgrade
    document.getElementById('btn-admin-add-upgrade').addEventListener('click', () => {
      openUpgradeFormModal();
    });

    bindUpgradeActions();
  }

  // Upgrade Form modal
  function openUpgradeFormModal(upgrade = null) {
    const modalContainer = document.getElementById('admin-modal-container');

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:600px;">
          <div class="modal-header">
            <h3 style="font-size:1.25rem;">${upgrade ? 'Modify Upgrade: ' + upgrade.name : 'Create New System Upgrade'}</h3>
            <span class="modal-close" id="btn-close-modal">&times;</span>
          </div>
          <form id="modal-upgrade-form">
            <div class="modal-body">
              <input type="hidden" name="id" value="${upgrade ? upgrade.id : ''}">
              <div class="form-grid">
                <div class="form-group col-span-2">
                  <label class="form-label">Upgrade Title <span>*</span></label>
                  <input type="text" class="form-input" name="name" value="${upgrade ? upgrade.name : ''}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Category <span>*</span></label>
                  <select class="form-select" name="category" required>
                    <option value="Exterior" ${upgrade && upgrade.category === 'Exterior' ? 'selected' : ''}>Exterior</option>
                    <option value="Interior" ${upgrade && upgrade.category === 'Interior' ? 'selected' : ''}>Interior</option>
                    <option value="Kitchen" ${upgrade && upgrade.category === 'Kitchen' ? 'selected' : ''}>Kitchen</option>
                    <option value="Bathroom" ${upgrade && upgrade.category === 'Bathroom' ? 'selected' : ''}>Bathroom</option>
                    <option value="Energy Efficiency" ${upgrade && upgrade.category === 'Energy Efficiency' ? 'selected' : ''}>Energy Efficiency</option>
                    <option value="Sustainability" ${upgrade && upgrade.category === 'Sustainability' ? 'selected' : ''}>Sustainability</option>
                    <option value="Outdoor Living" ${upgrade && upgrade.category === 'Outdoor Living' ? 'selected' : ''}>Outdoor Living</option>
                    <option value="Rental/Furnishing Package" ${upgrade && upgrade.category === 'Rental/Furnishing Package' ? 'selected' : ''}>Rental/Furnishing Package</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Estimated Price ($) <span>*</span></label>
                  <input type="number" class="form-input" name="estimated_price" value="${upgrade ? upgrade.estimated_price : ''}" required>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">System Active Status <span>*</span></label>
                  <select class="form-select" name="active" required>
                    <option value="true" ${upgrade && upgrade.active ? 'selected' : ''}>Active / Visible</option>
                    <option value="false" ${upgrade && !upgrade.active ? 'selected' : ''}>Inactive</option>
                  </select>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Description <span>*</span></label>
                  <textarea class="form-textarea" name="description" required style="min-height:70px;">${upgrade ? upgrade.description : ''}</textarea>
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Manage Upgrade Photos (Upload Multiple or Paste URLs)</label>
                  <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.25rem;">
                    
                    <!-- Thumbnail Preview Grid -->
                    <div id="upgrade-photo-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem; border: 1px solid var(--color-border-glass); padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.02); min-height: 80px; align-items: center;">
                      <!-- Populated dynamically via JS -->
                      <p id="upgrade-photo-grid-placeholder" class="text-center text-muted" style="grid-column: 1 / -1; font-size: 0.8rem; margin: 0; padding: 1rem 0;">No pictures uploaded yet.</p>
                    </div>

                    <!-- Input Grid (Dropzone & Text Input side-by-side) -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: stretch;">
                      <!-- Dropzone -->
                      <div class="file-dropzone" id="upgrade-photo-dropzone" style="padding: 1rem; border: 2px dashed var(--color-border-glass); border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <i data-lucide="image" style="width: 20px; height: 20px; margin-bottom: 0.25rem; color: var(--color-accent-gold);"></i>
                        <span style="font-size: 0.78rem; font-weight: 600; color: var(--color-brand-primary);">Drag & Drop picture</span>
                        <span style="font-size: 0.65rem; color: var(--color-text-secondary); margin-top: 0.1rem;">or click to browse files</span>
                      </div>
                      <input type="file" id="upgrade-photo-input" accept="image/*" style="display: none;" multiple>

                      <!-- Manual URL addition -->
                      <div style="display: flex; flex-direction: column; gap: 0.4rem; justify-content: center;">
                        <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 0;">Add custom picture by direct URL:</label>
                        <div style="display: flex; gap: 0.4rem;">
                          <input type="text" class="form-input" id="upgrade-image-url-input" placeholder="https://images.unsplash.com/..." style="font-size: 0.85rem; flex-grow: 1; margin-bottom: 0;">
                          <button type="button" class="btn btn-secondary btn-sm" id="btn-add-upgrade-photo-url" style="padding: 0.5rem 0.8rem; font-size: 0.8rem; font-weight: 700; white-space: nowrap;"><i data-lucide="plus" style="width: 12px; height: 12px; display: inline;"></i> Add</button>
                        </div>
                        <p style="font-size: 0.65rem; color: var(--color-text-secondary); line-height: 1.3; margin: 0;">You can upload standard JPG/PNG files directly or paste direct external URLs.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary btn-sm">Save Upgrade</button>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.style.display = 'block';

    const closeModal = () => { modalContainer.style.display = 'none'; };
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

    // Image Upload Handlers & State
    let uploadedImages = upgrade && Array.isArray(upgrade.image_urls) ? [...upgrade.image_urls] : [];

    const upgradeDropzone = document.getElementById('upgrade-photo-dropzone');
    const upgradeFileInput = document.getElementById('upgrade-photo-input');
    const upgradeUrlInput = document.getElementById('upgrade-image-url-input');
    const upgradeAddUrlBtn = document.getElementById('btn-add-upgrade-photo-url');
    const photoGrid = document.getElementById('upgrade-photo-grid');

    const renderUpgradeImageGrid = () => {
      if (uploadedImages.length === 0) {
        photoGrid.innerHTML = `<p id="upgrade-photo-grid-placeholder" class="text-center text-muted" style="grid-column: 1 / -1; font-size: 0.8rem; margin: 0; padding: 1rem 0;">No pictures uploaded yet.</p>`;
        return;
      }
      photoGrid.innerHTML = uploadedImages.map((url, idx) => `
        <div class="file-preview-item" style="width: 100px; height: 75px; position: relative; border-radius: 6px; overflow: hidden; border: 1px solid var(--color-border-glass); box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; margin-right: 0.5rem; margin-bottom: 0.5rem;">
          <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
          <span class="file-preview-remove btn-delete-uploaded-photo" data-idx="${idx}" style="position: absolute; top: 4px; right: 4px; background: rgba(220, 38, 38, 0.85); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s ease;">&times;</span>
        </div>
      `).join('');

      photoGrid.querySelectorAll('.btn-delete-uploaded-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
          uploadedImages.splice(idx, 1);
          renderUpgradeImageGrid();
          showToast('Image Removed', 'Picture removed from upgrade drafts.');
        });
      });
    };

    // Initial render
    renderUpgradeImageGrid();

    const handleUpgradeFile = (file) => {
      if (!file.type.startsWith('image/')) {
        showToast('Invalid File', 'Only image files are permitted.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        uploadedImages.push(base64Data);
        renderUpgradeImageGrid();
        showToast('Image Loaded', 'Upgrade picture added.', 'success');
      };
      reader.readAsDataURL(file);
    };

    // Click to select
    upgradeDropzone.addEventListener('click', () => {
      upgradeFileInput.click();
    });
    upgradeFileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Drag over
    upgradeDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      upgradeDropzone.style.borderColor = 'var(--color-accent-gold)';
      upgradeDropzone.style.backgroundColor = 'var(--color-bg-tertiary)';
    });
    upgradeDropzone.addEventListener('dragleave', () => {
      upgradeDropzone.style.borderColor = 'var(--color-border-glass)';
      upgradeDropzone.style.backgroundColor = 'transparent';
    });
    upgradeDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      upgradeDropzone.style.borderColor = 'var(--color-border-glass)';
      upgradeDropzone.style.backgroundColor = 'transparent';
      if (e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach(handleUpgradeFile);
      }
    });

    upgradeFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        Array.from(e.target.files).forEach(handleUpgradeFile);
      }
    });

    // URL Add
    upgradeAddUrlBtn.addEventListener('click', () => {
      const url = upgradeUrlInput.value.trim();
      if (!url) return;
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
        showToast('Invalid Link', 'Please enter a valid HTTP/HTTPS direct image URL.', 'error');
        return;
      }
      uploadedImages.push(url);
      renderUpgradeImageGrid();
      upgradeUrlInput.value = '';
      showToast('URL Added', 'External upgrade picture linked successfully.', 'success');
    });

    // Form Submit
    document.getElementById('modal-upgrade-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const updatedUpgrade = {
        id: formData.get('id') || undefined,
        name: formData.get('name'),
        category: formData.get('category'),
        estimated_price: Number(formData.get('estimated_price')),
        active: formData.get('active') === 'true',
        description: formData.get('description'),
        image_urls: uploadedImages
      };

      db.saveUpgrade(updatedUpgrade);
      showToast('Upgrade Matrix Synced', 'Database records updated.', 'success');
      closeModal();
      compileAdminUpgrades();
    });

    safeCreateIcons();
  }

  // Read-only Upgrade View Modal
  function openUpgradeViewModal(upgrade) {
    const modalContainer = document.getElementById('admin-modal-container');
    const images = upgrade.image_urls && Array.isArray(upgrade.image_urls) && upgrade.image_urls.length > 0
      ? upgrade.image_urls
      : ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'];

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:600px;">
          <div class="modal-header">
            <h3 style="font-size:1.25rem;">Upgrade Profile: ${upgrade.name}</h3>
            <span class="modal-close" id="btn-close-modal">&times;</span>
          </div>
          <div class="modal-body">
            <!-- Image Carousel display -->
            <div style="position:relative; width:100%; height:260px; border-radius:12px; overflow:hidden; border:1px solid var(--color-border-glass); margin-bottom:1.5rem; background:#f1f5f9; box-shadow:var(--shadow-sm);">
              <img id="view-upgrade-image" src="${images[0]}" style="width:100%; height:100%; object-fit:cover; transition: opacity 0.25s ease;">
              
              ${images.length > 1 ? `
                <div style="position:absolute; bottom:12px; left:50%; transform:translateX(-50%); display:flex; gap:0.5rem; background:rgba(15,23,42,0.45); padding:0.4rem 0.8rem; border-radius:30px; backdrop-filter:blur(4px);">
                  ${images.map((img, idx) => `
                    <span class="carousel-dot-upgrade" data-idx="${idx}" style="width:7px; height:7px; border-radius:50%; background:${idx === 0 ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.6)'}; cursor:pointer; display:block; transition:all 0.15s ease;"></span>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <!-- Profile Info Grid -->
            <div class="lead-detail-grid" style="grid-template-columns: 1fr; gap: 1rem;">
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Upgrade Name & Status</span>
                <span class="lead-detail-val" style="display:flex; justify-content:space-between; align-items:center;">
                  <strong>${upgrade.name}</strong>
                  <span class="badge ${upgrade.active ? 'badge-sage' : 'badge-muted'}">${upgrade.active ? 'Active' : 'Inactive'}</span>
                </span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Category</span>
                <span class="lead-detail-val"><span class="badge badge-muted">${upgrade.category}</span></span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Estimated Price</span>
                <span class="lead-detail-val" style="font-weight:700; color:var(--color-accent-sage-dark); font-size:1.1rem;">${formatMoney(upgrade.estimated_price)}</span>
              </div>
              <div class="lead-detail-item" style="border-bottom:none;">
                <span class="lead-detail-lbl">Description</span>
                <span class="lead-detail-val" style="font-size:0.9rem; line-height:1.4; color:var(--color-text-secondary);">${upgrade.description}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" id="btn-close-view-modal">Close Profile</button>
          </div>
        </div>
      </div>
    `;

    modalContainer.style.display = 'block';

    const closeModal = () => { modalContainer.style.display = 'none'; };
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-close-view-modal').addEventListener('click', closeModal);

    // Carousel Dot Handlers
    document.querySelectorAll('.carousel-dot-upgrade').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        document.getElementById('view-upgrade-image').src = images[idx];
        document.querySelectorAll('.carousel-dot-upgrade').forEach((d, i) => {
          d.style.background = i === idx ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.6)';
        });
      });
    });
  }

  /* ==========================================
     SUB-TAB 5: FINISH PACKAGES
     ========================================== */
  function compileAdminFinishes() {
    const packages = db.getFinishPackages();

    tabViewport.innerHTML = `
      <div class="admin-header-actions">
        <div>
          <h2 style="font-size:1.75rem;">Finish Packages Registry</h2>
          <p class="text-secondary" style="font-size:0.88rem; margin-top:0.2rem;">Coordinate structural finish systems (larch cladding, micro-cement flooring, brass taps).</p>
        </div>
        <button class="btn btn-accent btn-sm" id="btn-admin-add-finish"><i data-lucide="plus" style="width:14px;"></i> Create Package</button>
      </div>

      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size:1.1rem; font-weight:700;">Material Palettes Ledger</h3>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:70px; text-align:center;">Photo</th>
                <th>Package Name</th>
                <th>Description</th>
                <th>Interior System Look</th>
                <th>Exterior Cladding Look</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${packages.map(p => `
                <tr>
                  <td style="text-align:center; vertical-align:middle; padding:0.5rem;">
                    <div style="width:48px; height:36px; border-radius:4px; overflow:hidden; border:1px solid var(--color-border-glass); background:#f1f5f9; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                      <img src="${p.image_urls && p.image_urls[0] ? p.image_urls[0] : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=80&q=80'}" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                  </td>
                  <td style="font-weight:700; color:var(--color-brand-primary);">${p.name}</td>
                  <td style="font-size:0.85rem; max-width:180px; color:var(--color-text-secondary);">${p.description}</td>
                  <td style="font-size:0.85rem; max-width:200px; color:var(--color-text-secondary);">${p.interior_style}</td>
                  <td style="font-size:0.85rem; max-width:200px; color:var(--color-text-secondary);">${p.exterior_style}</td>
                  <td><span class="badge ${p.active ? 'badge-sage' : 'badge-muted'}">${p.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-secondary btn-sm btn-view-finish" data-fp-id="${p.id}"><i data-lucide="eye" style="width:12px;"></i> View</button>
                      <button class="btn btn-secondary btn-sm btn-edit-finish" data-fp-id="${p.id}"><i data-lucide="edit-3" style="width:12px;"></i> Edit</button>
                      <button class="btn btn-secondary btn-sm btn-delete-finish" data-fp-id="${p.id}" style="color:var(--color-danger-dark); border-color:var(--color-danger-light);"><i data-lucide="trash-2" style="width:12px;"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // View package trigger
    document.querySelectorAll('.btn-view-finish').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fpId = e.currentTarget.getAttribute('data-fp-id');
        const pkg = db.getFinishPackages().find(p => p.id === fpId);
        if (pkg) openFinishViewModal(pkg);
      });
    });

    // Edit package trigger
    document.querySelectorAll('.btn-edit-finish').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fpId = e.currentTarget.getAttribute('data-fp-id');
        const pkg = db.getFinishPackages().find(p => p.id === fpId);
        if (pkg) openFinishFormModal(pkg);
      });
    });

    // Delete package trigger
    document.querySelectorAll('.btn-delete-finish').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (confirm('Delete this finish system?')) {
          const fpId = e.currentTarget.getAttribute('data-fp-id');
          db.deleteFinishPackage(fpId);
          showToast('Package Deleted', 'Removed successfully.');
          compileAdminFinishes();
        }
      });
    });

    // Add package trigger
    document.getElementById('btn-admin-add-finish').addEventListener('click', () => {
      openFinishFormModal();
    });

    safeCreateIcons();
  }

  // --- Finish Package Form Modal (Create & Update) ---
  function openFinishFormModal(pkg = null) {
    const modalContainer = document.getElementById('admin-modal-container');

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-size:1.25rem;">${pkg ? 'Modify Finish Package: ' + pkg.name : 'Create New Finish Package'}</h3>
            <span class="modal-close" id="btn-close-modal">&times;</span>
          </div>
          <form id="modal-finish-form">
            <div class="modal-body">
              <input type="hidden" name="id" value="${pkg ? pkg.id : ''}">
              <div class="form-grid">
                <div class="form-group col-span-2">
                  <label class="form-label">Package Name <span>*</span></label>
                  <input type="text" class="form-input" name="name" value="${pkg ? pkg.name : ''}" required>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Brief Description <span>*</span></label>
                  <textarea class="form-textarea" name="description" required style="height: 70px;">${pkg ? pkg.description : ''}</textarea>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Interior Specification Look <span>*</span></label>
                  <textarea class="form-textarea" name="interior_style" required style="height: 70px;">${pkg ? pkg.interior_style : ''}</textarea>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Exterior Cladding & Trim Look <span>*</span></label>
                  <textarea class="form-textarea" name="exterior_style" required style="height: 70px;">${pkg ? pkg.exterior_style : ''}</textarea>
                </div>
                <div class="form-group col-span-2">
                  <label class="form-label">Included Materials List (One per line) <span>*</span></label>
                  <textarea class="form-textarea" name="materials_text" required placeholder="e.g. FSC-certified White Oak Plank&#10;Brushed brass faucets&#10;..." style="height: 90px;">${pkg && Array.isArray(pkg.included_materials) ? pkg.included_materials.join('\n') : ''}</textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Active status <span>*</span></label>
                  <select class="form-select" name="active" required>
                    <option value="true" ${pkg && pkg.active ? 'selected' : ''}>Active</option>
                    <option value="false" ${pkg && !pkg.active ? 'selected' : ''}>Inactive</option>
                  </select>
                </div>

                <div class="form-group col-span-2">
                  <label class="form-label">Manage Package Photos (Upload Multiple or Paste URLs)</label>
                  <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.25rem;">
                    
                    <!-- Thumbnail Preview Grid -->
                    <div id="finish-photo-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem; border: 1px solid var(--color-border-glass); padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.02); min-height: 80px; align-items: center;">
                      <!-- Populated dynamically via JS -->
                      <p id="finish-photo-grid-placeholder" class="text-center text-muted" style="grid-column: 1 / -1; font-size: 0.8rem; margin: 0; padding: 1rem 0;">No pictures uploaded yet.</p>
                    </div>

                    <!-- Input Grid (Dropzone & Text Input side-by-side) -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: stretch;">
                      <!-- Dropzone -->
                      <div class="file-dropzone" id="finish-photo-dropzone" style="padding: 1rem; border: 2px dashed var(--color-border-glass); border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <i data-lucide="image" style="width: 20px; height: 20px; margin-bottom: 0.25rem; color: var(--color-accent-gold);"></i>
                        <span style="font-size: 0.78rem; font-weight: 600; color: var(--color-brand-primary);">Drag & Drop picture</span>
                        <span style="font-size: 0.65rem; color: var(--color-text-secondary); margin-top: 0.1rem;">or click to browse files</span>
                      </div>
                      <input type="file" id="finish-photo-input" accept="image/*" style="display: none;" multiple>

                      <!-- Manual URL addition -->
                      <div style="display: flex; flex-direction: column; gap: 0.4rem; justify-content: center;">
                        <label class="form-label" style="font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 0;">Add custom picture by direct URL:</label>
                        <div style="display: flex; gap: 0.4rem;">
                          <input type="text" class="form-input" id="finish-image-url-input" placeholder="https://images.unsplash.com/..." style="font-size: 0.85rem; flex-grow: 1; margin-bottom: 0;">
                          <button type="button" class="btn btn-secondary btn-sm" id="btn-add-finish-photo-url" style="padding: 0.5rem 0.8rem; font-size: 0.8rem; font-weight: 700; white-space: nowrap;"><i data-lucide="plus" style="width: 12px; height: 12px; display: inline;"></i> Add</button>
                        </div>
                        <p style="font-size: 0.65rem; color: var(--color-text-secondary); line-height: 1.3; margin: 0;">You can upload standard JPG/PNG files directly or paste direct external URLs.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary btn-sm">Save Package Details</button>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.style.display = 'block';

    const closeModal = () => { modalContainer.style.display = 'none'; };
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

    // Image Upload Event Handlers & State
    let uploadedImages = pkg && Array.isArray(pkg.image_urls) ? [...pkg.image_urls] : [];

    const finishDropzone = document.getElementById('finish-photo-dropzone');
    const finishFileInput = document.getElementById('finish-photo-input');
    const finishUrlInput = document.getElementById('finish-image-url-input');
    const finishAddUrlBtn = document.getElementById('btn-add-finish-photo-url');
    const photoGrid = document.getElementById('finish-photo-grid');

    const renderFinishImageGrid = () => {
      if (uploadedImages.length === 0) {
        photoGrid.innerHTML = `<p id="finish-photo-grid-placeholder" class="text-center text-muted" style="grid-column: 1 / -1; font-size: 0.8rem; margin: 0; padding: 1rem 0;">No pictures uploaded yet.</p>`;
        return;
      }
      photoGrid.innerHTML = uploadedImages.map((url, idx) => `
        <div class="file-preview-item" style="width: 100px; height: 75px; position: relative; border-radius: 6px; overflow: hidden; border: 1px solid var(--color-border-glass); box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: inline-block; margin-right: 0.5rem; margin-bottom: 0.5rem;">
          <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
          <span class="file-preview-remove btn-delete-uploaded-photo" data-idx="${idx}" style="position: absolute; top: 4px; right: 4px; background: rgba(220, 38, 38, 0.85); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s ease;">&times;</span>
        </div>
      `).join('');

      // Add delete click handlers
      photoGrid.querySelectorAll('.btn-delete-uploaded-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
          uploadedImages.splice(idx, 1);
          renderFinishImageGrid();
          showToast('Image Removed', 'Picture removed from package drafts.');
        });
      });
    };

    // Initial render
    renderFinishImageGrid();

    const handleFinishFile = (file) => {
      if (!file.type.startsWith('image/')) {
        showToast('Invalid File', 'Only image files are permitted.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        uploadedImages.push(base64Data);
        renderFinishImageGrid();
        showToast('Image Loaded', 'Package picture added.', 'success');
      };
      reader.readAsDataURL(file);
    };

    // Click to select
    finishDropzone.addEventListener('click', () => {
      finishFileInput.click();
    });
    finishFileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Drag-and-drop Events
    finishDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      finishDropzone.style.borderColor = 'var(--color-accent-gold)';
      finishDropzone.style.backgroundColor = 'var(--color-bg-tertiary)';
    });
    finishDropzone.addEventListener('dragleave', () => {
      finishDropzone.style.borderColor = 'var(--color-border-glass)';
      finishDropzone.style.backgroundColor = 'transparent';
    });
    finishDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      finishDropzone.style.borderColor = 'var(--color-border-glass)';
      finishDropzone.style.backgroundColor = 'transparent';
      if (e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach(handleFinishFile);
      }
    });

    finishFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        Array.from(e.target.files).forEach(handleFinishFile);
      }
    });

    // URL add
    finishAddUrlBtn.addEventListener('click', () => {
      const url = finishUrlInput.value.trim();
      if (!url) return;
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
        showToast('Invalid Link', 'Please enter a valid HTTP/HTTPS direct image URL.', 'error');
        return;
      }
      uploadedImages.push(url);
      renderFinishImageGrid();
      finishUrlInput.value = '';
      showToast('URL Added', 'External package picture linked successfully.', 'success');
    });

    safeCreateIcons();

    // Form Submit
    document.getElementById('modal-finish-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const name = formData.get('name').trim();
      const description = formData.get('description').trim();
      const interior_style = formData.get('interior_style').trim();
      const exterior_style = formData.get('exterior_style').trim();
      const materials_text = formData.get('materials_text').trim();
      const active = formData.get('active') === 'true';

      const included_materials = materials_text.split('\n').map(m => m.trim()).filter(m => m.length > 0);

      const fpData = {
        id: pkg ? pkg.id : null,
        name,
        description,
        interior_style,
        exterior_style,
        included_materials,
        image_urls: uploadedImages,
        active
      };

      db.saveFinishPackage(fpData);
      showToast(pkg ? 'Package Updated' : 'Package Created', 'The material finish package details were saved successfully.', 'success');
      closeModal();
      compileAdminFinishes();
    });
  }

  // --- Finish Package Read-Only View Modal ---
  function openFinishViewModal(pkg) {
    const modalContainer = document.getElementById('admin-modal-container');
    const images = pkg.image_urls && Array.isArray(pkg.image_urls) && pkg.image_urls.length > 0
      ? pkg.image_urls
      : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'];

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:600px;">
          <div class="modal-header">
            <h3 style="font-size:1.25rem;">Finish Package Profile: ${pkg.name}</h3>
            <span class="modal-close" id="btn-close-modal">&times;</span>
          </div>
          <div class="modal-body">
            <!-- Image Carousel display -->
            <div style="position:relative; width:100%; height:260px; border-radius:12px; overflow:hidden; border:1px solid var(--color-border-glass); margin-bottom:1.5rem; background:#f1f5f9; box-shadow:var(--shadow-sm);">
              <img id="view-finish-image" src="${images[0]}" style="width:100%; height:100%; object-fit:cover; transition: opacity 0.25s ease;">
              
              ${images.length > 1 ? `
                <div style="position:absolute; bottom:12px; left:50%; transform:translateX(-50%); display:flex; gap:0.5rem; background:rgba(15,23,42,0.45); padding:0.4rem 0.8rem; border-radius:30px; backdrop-filter:blur(4px);">
                  ${images.map((img, idx) => `
                    <span class="carousel-dot-finish" data-idx="${idx}" style="width:7px; height:7px; border-radius:50%; background:${idx === 0 ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.6)'}; cursor:pointer; display:block; transition:all 0.15s ease;"></span>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <!-- Profile Info Grid -->
            <div class="lead-detail-grid" style="grid-template-columns: 1fr; gap: 1rem;">
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Package Name & Status</span>
                <span class="lead-detail-val" style="display:flex; justify-content:space-between; align-items:center;">
                  <strong>${pkg.name} Architectural System</strong>
                  <span class="badge ${pkg.active ? 'badge-sage' : 'badge-muted'}">${pkg.active ? 'Active' : 'Inactive'}</span>
                </span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Brief Narrative</span>
                <span class="lead-detail-val" style="font-size:0.9rem; line-height:1.4; color:var(--color-text-secondary);">${pkg.description}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Interior Specification Design Look</span>
                <span class="lead-detail-val" style="font-size:0.9rem; line-height:1.4; color:var(--color-text-secondary);">${pkg.interior_style}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Exterior Cladding & Trim Specification Look</span>
                <span class="lead-detail-val" style="font-size:0.9rem; line-height:1.4; color:var(--color-text-secondary);">${pkg.exterior_style}</span>
              </div>
              <div class="lead-detail-item" style="border-bottom:none;">
                <span class="lead-detail-lbl">High-End Inclusions & Materials</span>
                <span class="lead-detail-val">
                  <ul style="list-style:circle; padding-left:1.2rem; font-size:0.88rem; color:var(--color-text-secondary); margin-top:0.25rem;">
                    ${pkg.included_materials && Array.isArray(pkg.included_materials) ? pkg.included_materials.map(m => `<li>${m}</li>`).join('') : ''}
                  </ul>
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" id="btn-close-view-modal">Close Profile</button>
          </div>
        </div>
      </div>
    `;

    modalContainer.style.display = 'block';

    const closeModal = () => { modalContainer.style.display = 'none'; };
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-close-view-modal').addEventListener('click', closeModal);

    // Carousel Dot Handlers
    document.querySelectorAll('.carousel-dot-finish').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        document.getElementById('view-finish-image').src = images[idx];
        document.querySelectorAll('.carousel-dot-finish').forEach((d, i) => {
          d.style.background = i === idx ? 'var(--color-accent-gold)' : 'rgba(255,255,255,0.6)';
        });
      });
    });
  }

  /* ==========================================
     SUB-TAB 6: BUYER LEADS (With Real-Time Status Dropdowns)
     ========================================== */
  function compileAdminLeads() {
    const leads = db.getLeads();

    tabViewport.innerHTML = `
      <div class="admin-header-actions">
        <div>
          <h2 style="font-size:1.75rem;">Buyer Leads Registry</h2>
          <p class="text-secondary" style="font-size:0.88rem; margin-top:0.2rem;">Track incoming general contact messages and detailed custom build requests.</p>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size:1.1rem; font-weight:700;">Incoming Leads Table</h3>
          <input type="text" class="table-search-input" placeholder="Search leads by name..." id="search-admin-leads">
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Lead Type</th>
                <th>Sender Name</th>
                <th>Phone</th>
                <th>Target Budget</th>
                <th>Region</th>
                <th>Timeline</th>
                <th>Milestone Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-leads-table-body">
              ${compileLeadsRows(leads)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    function compileLeadsRows(list) {
      if (list.length === 0) return `<tr><td colspan="8" class="text-center text-muted">No buyer leads registered.</td></tr>`;
      
      const statuses = ["New", "Contacted", "Consultation Booked", "Financing Review", "Proposal Sent", "Closed", "Lost"];

      return list.map(ld => {
        // Compile status select dynamic box
        const selectHTML = `
          <select class="form-select lead-status-dropdown" data-lead-id="${ld.id}" style="padding:0.35rem 0.75rem; font-size:0.8rem; font-weight:700; width:150px; background-color:var(--color-bg-secondary);">
            ${statuses.map(st => `<option value="${st}" ${ld.status === st ? 'selected' : ''}>${st}</option>`).join('')}
          </select>
        `;

        return `
          <tr>
            <td><span class="badge ${ld.lead_type === 'Start Your Build' ? 'badge-gold' : 'badge-blue'}">${ld.lead_type}</span></td>
            <td style="font-weight:700; color:var(--color-brand-primary);">${ld.first_name} ${ld.last_name}</td>
            <td>${ld.phone}</td>
            <td style="font-weight:700; color:var(--color-accent-gold-dark);">${ld.budget_range}</td>
            <td>${ld.preferred_region}</td>
            <td>${ld.timeline}</td>
            <td>${selectHTML}</td>
            <td>
              <div class="table-actions">
                <button class="btn btn-secondary btn-sm btn-view-lead" data-lead-id="${ld.id}"><i data-lucide="eye" style="width:12px;"></i> View Details</button>
                <button class="btn btn-secondary btn-sm btn-delete-lead" data-lead-id="${ld.id}" style="color:var(--color-danger-dark); border-color:var(--color-danger-light);"><i data-lucide="trash-2" style="width:12px;"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Bind Search Input
    document.getElementById('search-admin-leads').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const matched = leads.filter(ld => `${ld.first_name} ${ld.last_name}`.toLowerCase().includes(q));
      document.getElementById('admin-leads-table-body').innerHTML = compileLeadsRows(matched);
      safeCreateIcons();
      bindLeadsEvents();
    });

    function bindLeadsEvents() {
      // Dynamic Status Dropdown Change Handler!
      document.querySelectorAll('.lead-status-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', (e) => {
          const leadId = e.target.getAttribute('data-lead-id');
          const newStatus = e.target.value;

          db.updateLeadStatus(leadId, newStatus);
          
          showToast(
            'Lead Updated!', 
            `Lead status changed to: "${newStatus}" for sender ID: ${leadId}. Data synced instantly to LocalDB.`, 
            'success'
          );
        });
      });

      // View Details Modal
      document.querySelectorAll('.btn-view-lead').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const leadId = e.currentTarget.getAttribute('data-lead-id');
          openLeadViewModal(db.getLeads().find(l => l.id === leadId));
        });
      });

      // Delete Lead
      document.querySelectorAll('.btn-delete-lead').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (confirm('Delete this buyer lead entry permanently from the database?')) {
            const leadId = e.currentTarget.getAttribute('data-lead-id');
            db.deleteLead(leadId);
            showToast('Lead Deleted', 'Removed lead from records.');
            compileAdminLeads();
          }
        });
      });
    }

    bindLeadsEvents();
  }

  // --- Dynamic Lead View Modal ---
  function openLeadViewModal(lead) {
    const modalContainer = document.getElementById('admin-modal-container');
    const lot = lead.selected_lot_id ? db.getLot(lead.selected_lot_id) : null;
    const design = lead.selected_design_id ? db.getDesign(lead.selected_design_id) : null;

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-size:1.25rem;">Buyer Lead Profile: ${lead.first_name} ${lead.last_name}</h3>
            <span class="modal-close" id="btn-close-modal">&times;</span>
          </div>
          <div class="modal-body">
            <div class="lead-detail-grid">
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Lead Category</span>
                <span class="lead-detail-val"><span class="badge ${lead.lead_type === 'Start Your Build' ? 'badge-gold' : 'badge-blue'}">${lead.lead_type}</span></span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Current Milestones Status</span>
                <span class="lead-detail-val" style="color:var(--color-accent-gold-dark);">${lead.status}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Email Address</span>
                <span class="lead-detail-val">${lead.email}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Phone Number</span>
                <span class="lead-detail-val">${lead.phone}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Current Location</span>
                <span class="lead-detail-val">${lead.location}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Preferred Building Region</span>
                <span class="lead-detail-val">${lead.preferred_region}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Financing Status</span>
                <span class="lead-detail-val">${lead.financing_status}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Project Budget Target</span>
                <span class="lead-detail-val" style="color:var(--color-accent-sage-dark);">${lead.budget_range}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Selected Market Lot</span>
                <span class="lead-detail-val">${lot ? lot.title : 'None Selected / Looking for Land'}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Selected Home Plan Model</span>
                <span class="lead-detail-val">${design ? design.name : 'None Selected'}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Ideal Commencement Timeline</span>
                <span class="lead-detail-val">${lead.timeline}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Property Management Interest</span>
                <span class="lead-detail-val">${lead.property_management_interest || 'N/A'}</span>
              </div>
              
              <div class="lead-detail-item span-2" style="background:var(--color-bg-secondary); border-radius:8px; padding:1rem; margin-top:0.5rem; border:1px solid var(--color-border-glass);">
                <span class="lead-detail-lbl" style="margin-bottom:0.25rem;">Inquiry Messages & Project Metadata</span>
                <p style="font-size:0.9rem; line-height:1.5; color:var(--color-text-secondary); white-space:pre-line;">${lead.message}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-modal">Close Profile</button>
          </div>
        </div>
      </div>
    `;

    modalContainer.style.display = 'block';

    const closeModal = () => { modalContainer.style.display = 'none'; };
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  }

  /* ==========================================
     SUB-TAB 7: LANDOWNER SUBMISSIONS
     ========================================== */
  function compileAdminLandowners() {
    const submissions = db.getLotSubmissions();

    tabViewport.innerHTML = `
      <div class="admin-header-actions">
        <div>
          <h2 style="font-size:1.75rem;">Landowner Submissions</h2>
          <p class="text-secondary" style="font-size:0.88rem; margin-top:0.2rem;">Evaluate vacant land submissions for potential Option-to-Purchase agreements.</p>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size:1.1rem; font-weight:700;">Landowner Submissions</h3>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:70px; text-align:center;">Photo</th>
                <th>Property Owner</th>
                <th>Lot Location</th>
                <th>Lot Size</th>
                <th>Asking Price</th>
                <th>Option Agreement?</th>
                <th>Evaluation Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-land-table-body">
              ${compileLandownerRows(submissions)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    function compileLandownerRows(list) {
      if (list.length === 0) return `<tr><td colspan="8" class="text-center text-muted">No landowner proposals logged.</td></tr>`;
      
      const statuses = ["New", "Under Review", "Needs More Info", "Approved for Option", "Not Suitable", "Option Signed", "Listed", "Sold"];

      return list.map(sub => {
        const selectHTML = `
          <select class="form-select landowner-status-dropdown" data-sub-id="${sub.id}" style="padding:0.35rem 0.75rem; font-size:0.8rem; font-weight:700; width:160px; background-color:var(--color-bg-secondary);">
            ${statuses.map(st => `<option value="${st}" ${sub.status === st ? 'selected' : ''}>${st}</option>`).join('')}
          </select>
        `;

        return `
          <tr>
            <td style="text-align:center; vertical-align:middle; padding:0.5rem;">
              <div style="width:48px; height:36px; border-radius:4px; overflow:hidden; border:1px solid var(--color-border-glass); background:#f1f5f9; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <img src="${sub.photo_urls && sub.photo_urls[0] ? sub.photo_urls[0] : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=80&q=80'}" style="width:100%; height:100%; object-fit:cover;">
              </div>
            </td>
            <td style="font-weight:700; color:var(--color-brand-primary);">${sub.owner_first_name} ${sub.owner_last_name}</td>
            <td>${sub.location}</td>
            <td>${sub.lot_size} ${sub.lot_size_unit}</td>
            <td style="font-weight:700; color:var(--color-accent-gold-dark);">${formatMoney(sub.asking_price)}</td>
            <td><span class="badge badge-gold">${sub.open_to_option_agreement}</span></td>
            <td>${selectHTML}</td>
            <td>
              <div class="table-actions">
                <button class="btn btn-secondary btn-sm btn-view-submission" data-sub-id="${sub.id}"><i data-lucide="eye" style="width:12px;"></i> View Details</button>
                <button class="btn btn-secondary btn-sm btn-delete-submission" data-sub-id="${sub.id}" style="color:var(--color-danger-dark); border-color:var(--color-danger-light);"><i data-lucide="trash-2" style="width:12px;"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    function bindLandownerEvents() {
      // Dropdown Status synced to DB!
      document.querySelectorAll('.landowner-status-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', (e) => {
          const subId = e.target.getAttribute('data-sub-id');
          const newStatus = e.target.value;

          db.updateSubmissionStatus(subId, newStatus);
          
          showToast(
            'Land Submission Updated!', 
            `Status updated to: "${newStatus}" for parcel ID: ${subId}.`, 
            'success'
          );
        });
      });

      // View Proposal Detail Modal
      document.querySelectorAll('.btn-view-submission').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const subId = e.currentTarget.getAttribute('data-sub-id');
          openLandownerViewModal(db.getLotSubmissions().find(s => s.id === subId));
        });
      });

      // Delete Submission
      document.querySelectorAll('.btn-delete-submission').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (confirm('Delete this landowner proposal?')) {
            const subId = e.currentTarget.getAttribute('data-sub-id');
            db.deleteLotSubmission(subId);
            showToast('Proposal Removed', 'Submission removed.');
            compileAdminLandowners();
          }
        });
      });
    }

    bindLandownerEvents();
  }

  // --- Landowner View Details Modal ---
  function openLandownerViewModal(sub) {
    const modalContainer = document.getElementById('admin-modal-container');

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-size:1.25rem;">Land Submission Profile: Lot in ${sub.municipality}</h3>
            <span class="modal-close" id="btn-close-modal">&times;</span>
          </div>
          <div class="modal-body">
            <div class="lead-detail-grid">
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Landowner Name</span>
                <span class="lead-detail-val">${sub.owner_first_name} ${sub.owner_last_name}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Current Evaluation Status</span>
                <span class="lead-detail-val" style="color:var(--color-accent-gold-dark);">${sub.status}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Email / Contact</span>
                <span class="lead-detail-val">${sub.email} | ${sub.phone}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Property Address</span>
                <span class="lead-detail-val">${sub.location}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">PID Tax ID / Province</span>
                <span class="lead-detail-val">${sub.pid || 'N/A'} | ${sub.province}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Lot Dimension Size</span>
                <span class="lead-detail-val">${sub.lot_size} ${sub.lot_size_unit} (${sub.frontage || 'N/A'}ft frontage x ${sub.depth || 'N/A'}ft depth)</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Asking Land Valuation</span>
                <span class="lead-detail-val" style="color:var(--color-accent-gold-dark); font-weight:800;">${formatMoney(sub.asking_price)}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Open to Option Agreement?</span>
                <span class="lead-detail-val">${sub.open_to_option_agreement}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Zoning / Access Type</span>
                <span class="lead-detail-val">${sub.zoning || 'RR-1 (assumed)'} | ${sub.access_type}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Pre-Evaluations prepped?</span>
                <span class="lead-detail-val">Survey: ${sub.survey_available} | Septic Approval: ${sub.septic_approval}</span>
              </div>
              
              <div class="lead-detail-item span-2">
                <span class="lead-detail-lbl">Available Services</span>
                <span class="lead-detail-val" style="font-size:0.85rem; font-weight:500;">${sub.services_available.join(', ') || 'None declared'}</span>
              </div>
              <div class="lead-detail-item span-2">
                <span class="lead-detail-lbl">Lot Physical Condition</span>
                <span class="lead-detail-val" style="font-size:0.85rem; font-weight:500;">${sub.lot_condition.join(', ') || 'None declared'}</span>
              </div>

              <!-- Drag Uploaded base64 image display! -->
              <div class="lead-detail-item span-2" style="margin-top:0.5rem;">
                <span class="lead-detail-lbl" style="margin-bottom:0.25rem;">Lot Imagery Attached</span>
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:0.5rem;">
                  ${sub.photo_urls.map(url => `
                    <div style="aspect-ratio:4/3; border-radius:6px; border:1px solid var(--color-border-glass); overflow:hidden;">
                      <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="lead-detail-item span-2" style="background:var(--color-bg-secondary); border-radius:8px; padding:1rem; margin-top:0.5rem;">
                <span class="lead-detail-lbl" style="margin-bottom:0.25rem;">Landowner Seller Comments</span>
                <p style="font-size:0.9rem; color:var(--color-text-secondary);">${sub.comments || 'No comments left.'}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="display:flex; justify-content:space-between; gap:1rem; align-items:center;">
            <button type="button" class="btn btn-accent btn-sm" id="btn-promote-to-lot" style="background-color:var(--color-accent-gold); color:#fff; font-weight:700;"><i data-lucide="arrow-right-left" style="width:14px; margin-right:4px;"></i> Promote to Lot Registry</button>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-modal">Close Profile</button>
          </div>
        </div>
      </div>
    `;

    modalContainer.style.display = 'block';

    const closeModal = () => { modalContainer.style.display = 'none'; };
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

    const promoteBtn = document.getElementById('btn-promote-to-lot');
    if (promoteBtn) {
      promoteBtn.addEventListener('click', () => {
        closeModal();
        
        // Convert landowner proposal structure into Lot registry structure
        const preloadedLot = {
          title: `Land Parcel - ${sub.location}`,
          location: sub.location,
          province: sub.province,
          municipality: sub.municipality,
          pid: sub.pid || '',
          lot_size: sub.lot_size,
          lot_size_unit: sub.lot_size_unit,
          frontage: sub.frontage || '',
          depth: sub.depth || '',
          asking_price: sub.asking_price,
          estimated_package_price: sub.asking_price + 350000, // estimated starting package build cost
          status: 'Available',
          image_urls: sub.photo_urls || [],
          compatible_design_ids: [],
          description: sub.comments || `Excellent vacant land opportunity situated in ${sub.municipality}.`,
          servicing_notes: `Services available: ${sub.services_available ? sub.services_available.join(', ') : 'None declared'}.`,
          zoning_notes: `Zoning: ${sub.zoning || 'Residential'}.`,
          access_notes: `Access: ${sub.access_type || 'Public road'}.`
        };

        // Open Lot Creation Modal with the preloaded data!
        openLotFormModal(preloadedLot);
      });
    }

    safeCreateIcons();
  }

  /* ==========================================
     SUB-TAB 8: CONTRACTOR APPLICATIONS
     ========================================== */
  function compileAdminContractors() {
    const apps = db.getContractorApplications();

    tabViewport.innerHTML = `
      <div class="admin-header-actions">
        <div>
          <h2 style="font-size:1.75rem;">Contractor Applications</h2>
          <p class="text-secondary" style="font-size:0.88rem; margin-top:0.2rem;">Verify licensing, WCB/insurance certifications, and approve trade partners.</p>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size:1.1rem; font-weight:700;">Trade Applications</h3>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Primary Contact</th>
                <th>Trade Category</th>
                <th>Years Active</th>
                <th>Service Area</th>
                <th>App Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-contractor-table-body">
              ${compileContractorRows(apps)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    function compileContractorRows(list) {
      if (list.length === 0) return `<tr><td colspan="7" class="text-center text-muted">No trade applications registered.</td></tr>`;
      
      const statuses = ["New", "Reviewing", "Interview", "Approved", "Rejected", "On Hold"];

      return list.map(app => {
        const selectHTML = `
          <select class="form-select contractor-status-dropdown" data-app-id="${app.id}" style="padding:0.35rem 0.75rem; font-size:0.8rem; font-weight:700; width:150px; background-color:var(--color-bg-secondary);">
            ${statuses.map(st => `<option value="${st}" ${app.status === st ? 'selected' : ''}>${st}</option>`).join('')}
          </select>
        `;

        return `
          <tr>
            <td style="font-weight:700; color:var(--color-brand-primary);">${app.company_name}</td>
            <td>${app.contact_name}</td>
            <td><span class="badge badge-blue">${app.trade_type}</span></td>
            <td>${app.years_in_business} years</td>
            <td>${app.service_area}</td>
            <td>${selectHTML}</td>
            <td>
              <div class="table-actions">
                <button class="btn btn-secondary btn-sm btn-view-contractor" data-app-id="${app.id}"><i data-lucide="eye" style="width:12px;"></i> View Specs</button>
                <button class="btn btn-secondary btn-sm btn-delete-contractor" data-app-id="${app.id}" style="color:var(--color-danger-dark); border-color:var(--color-danger-light);"><i data-lucide="trash-2" style="width:12px;"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    function bindContractorEvents() {
      // Sync Status Dropdown
      document.querySelectorAll('.contractor-status-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', (e) => {
          const appId = e.target.getAttribute('data-app-id');
          const newStatus = e.target.value;

          db.updateContractorStatus(appId, newStatus);
          
          showToast(
            'Builder Status Updated!', 
            `Contractor status set to: "${newStatus}".`, 
            'success'
          );
        });
      });

      // View details modal
      document.querySelectorAll('.btn-view-contractor').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const appId = e.currentTarget.getAttribute('data-app-id');
          openContractorViewModal(db.getContractorApplications().find(a => a.id === appId));
        });
      });

      // Delete Contractor
      document.querySelectorAll('.btn-delete-contractor').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (confirm('Delete this contractor application record?')) {
            const appId = e.currentTarget.getAttribute('data-app-id');
            db.deleteContractorApplication(appId);
            showToast('Record Deleted', 'Application removed.');
            compileAdminContractors();
          }
        });
      });
    }

    bindContractorEvents();
  }

  // --- Contractor detail modal ---
  function openContractorViewModal(app) {
    const modalContainer = document.getElementById('admin-modal-container');

    modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3 style="font-size:1.25rem;">Trade Partner Profile: ${app.company_name}</h3>
            <span class="modal-close" id="btn-close-modal">&times;</span>
          </div>
          <div class="modal-body">
            <div class="lead-detail-grid">
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Company Name</span>
                <span class="lead-detail-val">${app.company_name}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Onboarding Status</span>
                <span class="lead-detail-val" style="color:var(--color-accent-blue-dark);">${app.status}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Primary Contact</span>
                <span class="lead-detail-val">${app.contact_name}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Email / Website</span>
                <span class="lead-detail-val">${app.email} | ${app.website || 'No website'}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Business Address</span>
                <span class="lead-detail-val">${app.business_address}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Trade Classification</span>
                <span class="lead-detail-val"><span class="badge badge-blue">${app.trade_type}</span></span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Insurance / Workers Comp</span>
                <span class="lead-detail-val">Liability: ${app.insurance_coverage} | WCB: ${app.workers_comp}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Years Active / License</span>
                <span class="lead-detail-val">${app.years_in_business} years | License: ${app.license_number || 'N/A'}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Crew Size / Availability</span>
                <span class="lead-detail-val">${app.crew_size} builders | ${app.availability}</span>
              </div>
              <div class="lead-detail-item">
                <span class="lead-detail-lbl">Experience Details</span>
                <span class="lead-detail-val">New Home Builds: ${app.new_build_experience} | Concrete slab: ${app.slab_experience}</span>
              </div>
              
              <div class="lead-detail-item span-2" style="background:var(--color-bg-secondary); border-radius:8px; padding:1rem; margin-top:0.5rem;">
                <span class="lead-detail-lbl" style="margin-bottom:0.25rem;">Qualifications & Comments</span>
                <p style="font-size:0.9rem; color:var(--color-text-secondary); line-height:1.5;">${app.comments || 'No comments left.'}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-modal">Close Profile</button>
          </div>
        </div>
      </div>
    `;

    modalContainer.style.display = 'block';

    const closeModal = () => { modalContainer.style.display = 'none'; };
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  }

  /* ==========================================
     SUB-TAB 9: PARTNER APPLICATIONS
     ========================================== */
  function compileAdminPartners() {
    const apps = db.getPartnerApplications();

    tabViewport.innerHTML = `
      <div class="admin-header-actions">
        <div>
          <h2 style="font-size:1.75rem;">Partner Applications</h2>
          <p class="text-secondary" style="font-size:0.88rem; margin-top:0.2rem;">Coordinate realtor listings, investor joint ventures, and mortgage brokers.</p>
        </div>
      </div>

      <div class="table-card">
        <div class="table-header">
          <h3 style="font-size:1.1rem; font-weight:700;">Partner Proposals</h3>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Partner Name</th>
                <th>Company Name</th>
                <th>Partner Category</th>
                <th>Target Region</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${apps.map(app => `
                <tr>
                  <td style="font-weight:700; color:var(--color-brand-primary);">${app.name}</td>
                  <td>${app.company}</td>
                  <td><span class="badge badge-gold">${app.partner_type}</span></td>
                  <td>${app.region}</td>
                  <td style="font-size:0.8rem; color:var(--color-text-muted);">${new Date(app.created_at).toLocaleDateString()}</td>
                  <td>
                    <select class="form-select partner-status-dropdown" data-app-id="${app.id}" style="padding:0.35rem 0.75rem; font-size:0.8rem; font-weight:700; width:130px; background-color:var(--color-bg-secondary);">
                      <option value="New" ${app.status === 'New' ? 'selected' : ''}>New</option>
                      <option value="Contacted" ${app.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                      <option value="Approved" ${app.status === 'Approved' ? 'selected' : ''}>Approved</option>
                      <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-secondary btn-sm btn-view-partner" data-app-id="${app.id}"><i data-lucide="eye" style="width:12px;"></i> View</button>
                      <button class="btn btn-secondary btn-sm btn-delete-partner" data-app-id="${app.id}" style="color:var(--color-danger-dark); border-color:var(--color-danger-light);"><i data-lucide="trash-2" style="width:12px;"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Dropdown sync
    document.querySelectorAll('.partner-status-dropdown').forEach(dropdown => {
      dropdown.addEventListener('change', (e) => {
        const appId = e.target.getAttribute('data-app-id');
        const newStatus = e.target.value;
        db.updatePartnerStatus(appId, newStatus);
        showToast('Partner Updated', `Status updated to: "${newStatus}".`, 'success');
      });
    });

    // View Modal
    document.querySelectorAll('.btn-view-partner').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const appId = e.currentTarget.getAttribute('data-app-id');
        const partnerObj = db.getPartnerApplications().find(p => p.id === appId);
        
        const modalContainer = document.getElementById('admin-modal-container');
        modalContainer.innerHTML = `
          <div class="modal-backdrop">
            <div class="modal-card" style="max-width:500px;">
              <div class="modal-header">
                <h3 style="font-size:1.25rem;">Partner Request: ${partnerObj.name}</h3>
                <span class="modal-close" id="btn-close-modal">&times;</span>
              </div>
              <div class="modal-body">
                <div class="lead-detail-grid" style="grid-template-columns: 1fr;">
                  <div class="lead-detail-item">
                    <span class="lead-detail-lbl">Contact Name</span>
                    <span class="lead-detail-val">${partnerObj.name} (${partnerObj.company})</span>
                  </div>
                  <div class="lead-detail-item">
                    <span class="lead-detail-lbl">Contact Details</span>
                    <span class="lead-detail-val">Email: ${partnerObj.email} | Phone: ${partnerObj.phone}</span>
                  </div>
                  <div class="lead-detail-item">
                    <span class="lead-detail-lbl">Partnership Type / Region</span>
                    <span class="lead-detail-val">${partnerObj.partner_type} in ${partnerObj.region}</span>
                  </div>
                  <div class="lead-detail-item" style="background:var(--color-bg-secondary); border-radius:8px; padding:1rem; border:none;">
                    <span class="lead-detail-lbl" style="margin-bottom:0.25rem;">Partnership Vision Proposal</span>
                    <p style="font-size:0.9rem; color:var(--color-text-secondary); line-height:1.5;">${partnerObj.message}</p>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-modal">Close Proposal</button>
              </div>
            </div>
          </div>
        `;
        modalContainer.style.display = 'block';
        const closeModal = () => { modalContainer.style.display = 'none'; };
        document.getElementById('btn-close-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
        safeCreateIcons();
      });
    });

    // Delete
    document.querySelectorAll('.btn-delete-partner').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (confirm('Delete partner application record?')) {
          const appId = e.currentTarget.getAttribute('data-app-id');
          db.deletePartnerApplication(appId);
          showToast('Record Removed', 'Application deleted.');
          compileAdminPartners();
        }
      });
    });
  }

  // HTML escape helper
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ==========================================
     SUB-TAB 10: SITE PAGE CONTENT EDITOR
     ========================================== */
  function compileAdminContentEditor() {
    const defaultSubtab = state.activeContentSubTab || 'footer';
    const settings = db.getSiteSettings();
    
    tabViewport.innerHTML = `
      <div class="admin-header-actions">
        <div>
          <h2 style="font-size:1.75rem;">Page Content & Settings Editor</h2>
          <p class="text-secondary" style="font-size:0.88rem; margin-top:0.2rem;">Modify the text, headers, images, and contact information across the platform dynamically.</p>
        </div>
      </div>

      <!-- Content Editor Sub-Tabs -->
      <div style="display: flex; gap: 0.5rem; border-bottom: 2px solid var(--color-bg-tertiary); margin-bottom: 1.5rem; padding-bottom: 0.25rem;">
        <button class="btn btn-secondary sub-tab-btn ${defaultSubtab === 'footer' ? 'active' : ''}" data-subtab="footer" style="padding: 0.5rem 1rem; border-radius: 6px 6px 0 0; font-size: 0.85rem; border-bottom: none;"><i data-lucide="layout" style="width:14px; height:14px; margin-right:4px;"></i> Footer & Info</button>
        <button class="btn btn-secondary sub-tab-btn ${defaultSubtab === 'home' ? 'active' : ''}" data-subtab="home" style="padding: 0.5rem 1rem; border-radius: 6px 6px 0 0; font-size: 0.85rem; border-bottom: none;"><i data-lucide="home" style="width:14px; height:14px; margin-right:4px;"></i> Home Page</button>
        <button class="btn btn-secondary sub-tab-btn ${defaultSubtab === 'others' ? 'active' : ''}" data-subtab="others" style="padding: 0.5rem 1rem; border-radius: 6px 6px 0 0; font-size: 0.85rem; border-bottom: none;"><i data-lucide="files" style="width:14px; height:14px; margin-right:4px;"></i> Other Pages</button>
      </div>

      <form id="site-settings-form" class="form-card" style="padding: 2rem;">
        <!-- TAB 1: FOOTER & CONTACT INFO -->
        <div id="subtab-content-footer" class="subtab-content" style="display: ${defaultSubtab === 'footer' ? 'block' : 'none'};">
          <h3 style="font-size: 1.1rem; margin-bottom: 1.25rem; font-weight: 700; color: var(--color-brand-primary); display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="layout" style="color:var(--color-accent-gold);"></i> Footer & Contact Coordinates</h3>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
            <div class="form-group">
              <label class="form-label">Office Address/Regions <span>*</span></label>
              <input type="text" class="form-input" name="footer_office" value="${escapeHtml(settings.footer_office)}" required>
              <p class="text-secondary" style="font-size:0.75rem; margin-top:0.25rem;">The physical address or regions of operation displayed in the footer.</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">Contact Email <span>*</span></label>
              <input type="email" class="form-input" name="footer_email" value="${escapeHtml(settings.footer_email)}" required>
              <p class="text-secondary" style="font-size:0.75rem; margin-top:0.25rem;">The public business email address.</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-top: 1rem;">
            <div class="form-group">
              <label class="form-label">Contact Phone</label>
              <input type="text" class="form-input" name="footer_phone" value="${escapeHtml(settings.footer_phone || '')}">
              <p class="text-secondary" style="font-size:0.75rem; margin-top:0.25rem;">The business contact phone number (optional).</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">Copyright Text <span>*</span></label>
              <input type="text" class="form-input" name="footer_copyright" value="${escapeHtml(settings.footer_copyright)}" required>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-top: 1rem;">
            <div class="form-group">
              <label class="form-label">Brand Description <span>*</span></label>
              <textarea class="form-textarea" name="footer_brand_desc" style="height: 80px;" required>${escapeHtml(settings.footer_brand_desc)}</textarea>
              <p class="text-secondary" style="font-size:0.75rem; margin-top:0.25rem;">Brief brand pitch shown in the left column of the footer.</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">Brand Tagline <span>*</span></label>
              <input type="text" class="form-input" name="footer_tagline" value="${escapeHtml(settings.footer_tagline)}" required>
            </div>
          </div>
        </div>

        <!-- TAB 2: HOME PAGE -->
        <div id="subtab-content-home" class="subtab-content" style="display: ${defaultSubtab === 'home' ? 'block' : 'none'};">
          <h3 style="font-size: 1.1rem; margin-bottom: 1.25rem; font-weight: 700; color: var(--color-brand-primary); display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="home" style="color:var(--color-accent-gold);"></i> Home Page Hero & Steps</h3>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
            <div class="form-group">
              <label class="form-label">Hero Title (Line 1) <span>*</span></label>
              <input type="text" class="form-input" name="home_hero_title_line1" value="${escapeHtml(settings.home_hero_title_line1)}" required>
              <p class="text-secondary" style="font-size:0.75rem; margin-top:0.25rem;">Standard style title e.g. "From Lot to Home,"</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">Hero Title Highlight (Line 2) <span>*</span></label>
              <input type="text" class="form-input" name="home_hero_title_line2" value="${escapeHtml(settings.home_hero_title_line2)}" required>
              <p class="text-secondary" style="font-size:0.75rem; margin-top:0.25rem;">Gold accented highlight e.g. "Made Simple."</p>
            </div>
          </div>

          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">Hero Subtitle <span>*</span></label>
            <textarea class="form-textarea" name="home_hero_subtitle" style="height: 70px;" required>${escapeHtml(settings.home_hero_subtitle)}</textarea>
          </div>

          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">Hero Banner Image URL <span>*</span></label>
            <div style="display: flex; gap: 1rem; align-items: center;">
              <input type="url" class="form-input" id="inp-hero-image-url" name="home_hero_image" value="${escapeHtml(settings.home_hero_image)}" style="flex-grow:1;" required>
              <button type="button" class="btn btn-secondary" id="btn-hero-image-preview" style="white-space:nowrap; padding:0.5rem 1rem;">Preview Image</button>
            </div>
            <div style="margin-top: 1rem; border-radius: 8px; overflow: hidden; max-height: 200px; border: 1px solid var(--color-border-glass); background: #f8fafc; display: flex; align-items: center; justify-content: center;">
              <img id="img-hero-preview" src="${settings.home_hero_image}" style="max-width: 100%; height: auto; max-height: 200px; object-fit: cover;" alt="Hero Preview">
            </div>
            <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
              <button type="button" class="btn btn-sm btn-secondary preset-img-btn" data-url="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80">Preset 1 (Warm Modern)</button>
              <button type="button" class="btn btn-sm btn-secondary preset-img-btn" data-url="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80">Preset 2 (Coastal Estate)</button>
              <button type="button" class="btn btn-sm btn-secondary preset-img-btn" data-url="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80">Preset 3 (Forest Retreat)</button>
            </div>
          </div>

          <div style="border-top: 1px solid var(--color-bg-tertiary); margin-top: 1.5rem; padding-top: 1.5rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
            <div class="form-group">
              <label class="form-label">Hero Badge Text <span>*</span></label>
              <input type="text" class="form-input" name="home_hero_badge" value="${escapeHtml(settings.home_hero_badge)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Hero Badge Status <span>*</span></label>
              <input type="text" class="form-input" name="home_hero_badge_status" value="${escapeHtml(settings.home_hero_badge_status)}" required>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-top: 1rem;">
            <div class="form-group">
              <label class="form-label">Hero Overlay Card Title <span>*</span></label>
              <input type="text" class="form-input" name="home_hero_card_title" value="${escapeHtml(settings.home_hero_card_title)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Hero Overlay Card Description <span>*</span></label>
              <input type="text" class="form-input" name="home_hero_card_desc" value="${escapeHtml(settings.home_hero_card_desc)}" required>
            </div>
          </div>

          <div style="border-top: 1px solid var(--color-bg-tertiary); margin-top: 1.5rem; padding-top: 1.5rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
            <div class="form-group">
              <label class="form-label">How it Works - Section Title <span>*</span></label>
              <input type="text" class="form-input" name="home_steps_title" value="${escapeHtml(settings.home_steps_title)}" required>
            </div>
            <div class="form-group">
              <label class="form-label">How it Works - Section Subtitle <span>*</span></label>
              <input type="text" class="form-input" name="home_steps_subtitle" value="${escapeHtml(settings.home_steps_subtitle)}" required>
            </div>
          </div>
        </div>

        <!-- TAB 3: OTHER PAGES -->
        <div id="subtab-content-others" class="subtab-content" style="display: ${defaultSubtab === 'others' ? 'block' : 'none'};">
          <h3 style="font-size: 1.1rem; margin-bottom: 1.25rem; font-weight: 700; color: var(--color-brand-primary); display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="files" style="color:var(--color-accent-gold);"></i> Sub-pages Headers & Guidance Content</h3>
          
          <div style="background:var(--color-bg-secondary); padding: 1.25rem; border-radius:8px; margin-bottom:1.5rem;">
            <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--color-brand-primary);">1. How It Works (Guided Process) Page</h4>
            <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
              <div class="form-group">
                <label class="form-label">Top Badge Label <span>*</span></label>
                <input type="text" class="form-input" name="process_badge" value="${escapeHtml(settings.process_badge)}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Main Heading Title <span>*</span></label>
                <input type="text" class="form-input" name="process_title" value="${escapeHtml(settings.process_title)}" required>
              </div>
            </div>
            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">Main Description Subtitle <span>*</span></label>
              <textarea class="form-textarea" name="process_subtitle" style="height: 60px;" required>${escapeHtml(settings.process_subtitle)}</textarea>
            </div>
          </div>

          <div style="background:var(--color-bg-secondary); padding: 1.25rem; border-radius:8px; margin-bottom:1.5rem;">
            <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--color-brand-primary);">2. Frequently Asked Questions (FAQ) Page</h4>
            <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
              <div class="form-group">
                <label class="form-label">Top Badge Label <span>*</span></label>
                <input type="text" class="form-input" name="faq_badge" value="${escapeHtml(settings.faq_badge)}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Main Heading Title <span>*</span></label>
                <input type="text" class="form-input" name="faq_title" value="${escapeHtml(settings.faq_title)}" required>
              </div>
            </div>
            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">Main Description Subtitle <span>*</span></label>
              <textarea class="form-textarea" name="faq_subtitle" style="height: 60px;" required>${escapeHtml(settings.faq_subtitle)}</textarea>
            </div>
          </div>

          <div style="background:var(--color-bg-secondary); padding: 1.25rem; border-radius:8px;">
            <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.75rem; color:var(--color-brand-primary);">3. Contact Our Build Team Page</h4>
            <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
              <div class="form-group">
                <label class="form-label">Main Heading Title <span>*</span></label>
                <input type="text" class="form-input" name="contact_title" value="${escapeHtml(settings.contact_title)}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Main Description Subtitle <span>*</span></label>
                <input type="text" class="form-input" name="contact_subtitle" value="${escapeHtml(settings.contact_subtitle)}" required>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid var(--color-bg-tertiary); padding-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" id="btn-reset-settings"><i data-lucide="rotate-ccw" style="width:14px; height:14px; margin-right:4px;"></i> Reset to Defaults</button>
          <button type="submit" class="btn btn-primary" id="btn-save-settings"><i data-lucide="check" style="width:14px; height:14px; margin-right:4px;"></i> Save Page Settings</button>
        </div>
      </form>
    `;

    // Bind Sub-Tabs Switching
    const subTabBtns = tabViewport.querySelectorAll('.sub-tab-btn');
    const subTabContents = tabViewport.querySelectorAll('.subtab-content');
    
    subTabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const activeSubtab = btn.getAttribute('data-subtab');
        
        subTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        subTabContents.forEach(c => {
          if (c.id === `subtab-content-${activeSubtab}`) {
            c.style.display = 'block';
          } else {
            c.style.display = 'none';
          }
        });
      });
    });

    // Image URL Live Preview Trigger
    const imgUrlInp = tabViewport.querySelector('#inp-hero-image-url');
    const imgPreview = tabViewport.querySelector('#img-hero-preview');
    const previewBtn = tabViewport.querySelector('#btn-hero-image-preview');
    
    const updatePreview = () => {
      if (imgUrlInp.value) {
        imgPreview.src = imgUrlInp.value;
      }
    };
    
    previewBtn.addEventListener('click', updatePreview);
    imgUrlInp.addEventListener('change', updatePreview);
    
    // Preset image selectors
    tabViewport.querySelectorAll('.preset-img-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        imgUrlInp.value = url;
        updatePreview();
      });
    });

    // Reset button
    tabViewport.querySelector('#btn-reset-settings').addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to revert all text changes back to the default system values?')) {
        db.saveSiteSettings({
          footer_office: "Sunshine Coast / Okanagan Valley / Squamish-Whistler Corridor, British Columbia",
          footer_email: "info@lots2homes.com",
          footer_phone: "1-800-555-LOTS (5687)",
          footer_copyright: "© 2026 Lots2Homes Inc. All rights reserved. Built with modern, sustainable standards.",
          footer_brand_desc: "A premier land-to-home marketplace and guided homebuilding platform connecting land buyers, owners, contractors, and builders. From vacant lot to completed modern home, made completely transparent.",
          footer_tagline: "Choose your lot. Choose your home. Build with confidence.",
          home_hero_title_line1: "From Lot to Home,",
          home_hero_title_line2: "Made Simple.",
          home_hero_subtitle: "Browse compatible lots, choose an award-winning modern design, select your finish packages, and start your build with transparent guided milestones.",
          home_hero_image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
          home_hero_badge: "Featured Model",
          home_hero_badge_status: "Active Build",
          home_hero_card_title: "The Essential + Ocean View Lot",
          home_hero_card_desc: "Currently building stage: Bank Draw Stage 3 (Framing completion)",
          home_steps_title: "How Lots2Homes Works",
          home_steps_subtitle: "We eliminate the standard uncertainty, delays, and surprise invoices associated with building custom homes.",
          process_badge: "Workflow Guide",
          process_title: "The Guided Building Process",
          process_subtitle: "Lots2Homes unifies property purchase, architecture plans, interior selections, and local builders under a single, fully-managed milestone track.",
          faq_badge: "Knowledge Hub",
          faq_title: "Frequently Asked Questions",
          faq_subtitle: "Find quick, transparent answers to zoning questions, option fee details, and structural progress draw mechanics.",
          contact_title: "Connect With Our Build Team",
          contact_subtitle: "Whether you want to sell a lot, build a signature home, or join our contractor network, we're here to help."
        });
        showToast('Settings Reset', 'Site settings restored to default values successfully.', 'success');
        compileAdminContentEditor();
        renderFooter();
      }
    });

    // Form submission
    const settingsForm = tabViewport.querySelector('#site-settings-form');
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(settingsForm);
      const updated = {
        footer_office: formData.get('footer_office'),
        footer_email: formData.get('footer_email'),
        footer_phone: formData.get('footer_phone'),
        footer_copyright: formData.get('footer_copyright'),
        footer_brand_desc: formData.get('footer_brand_desc'),
        footer_tagline: formData.get('footer_tagline'),
        home_hero_title_line1: formData.get('home_hero_title_line1'),
        home_hero_title_line2: formData.get('home_hero_title_line2'),
        home_hero_subtitle: formData.get('home_hero_subtitle'),
        home_hero_image: formData.get('home_hero_image'),
        home_hero_badge: formData.get('home_hero_badge'),
        home_hero_badge_status: formData.get('home_hero_badge_status'),
        home_hero_card_title: formData.get('home_hero_card_title'),
        home_hero_card_desc: formData.get('home_hero_card_desc'),
        home_steps_title: formData.get('home_steps_title'),
        home_steps_subtitle: formData.get('home_steps_subtitle'),
        process_badge: formData.get('process_badge'),
        process_title: formData.get('process_title'),
        process_subtitle: formData.get('process_subtitle'),
        faq_badge: formData.get('faq_badge'),
        faq_title: formData.get('faq_title'),
        faq_subtitle: formData.get('faq_subtitle'),
        contact_title: formData.get('contact_title'),
        contact_subtitle: formData.get('contact_subtitle')
      };
      
      db.saveSiteSettings(updated);
      showToast('Settings Saved', 'Site content updated and applied globally.', 'success');
      renderFooter();
      compileAdminContentEditor();
    });

    safeCreateIcons();
  }
}
