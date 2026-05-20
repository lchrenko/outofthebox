// db.js - Client-side LocalStorage Database Driver for Lots2Homes Inc.

const DB_KEY = 'lots2homes_db';

// Safe storage wrapper to handle browser restrictions on local file:// links
const safeStorage = {
  memoryStore: null,
  
  _isRestricted() {
    if (this.memoryStore !== null) return true;
    try {
      localStorage.setItem('__l2h_test', '1');
      localStorage.removeItem('__l2h_test');
      return false;
    } catch (e) {
      console.warn("Storage restricted. Initializing in-memory fallback store.");
      this.memoryStore = {};
      return true;
    }
  },

  getItem(key) {
    if (this._isRestricted()) {
      return this.memoryStore[key] || null;
    }
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },

  setItem(key, value) {
    if (this._isRestricted()) {
      this.memoryStore[key] = value;
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }
};

// Helper: Generate UUID
function generateUUID() {
  return 'l2h_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// Initial High-Fidelity Seed Data
const initialSeedData = {
  designs: [
    {
      id: "ds_escape",
      name: "The Escape",
      bedrooms: 1,
      bathrooms: 1,
      square_feet: 720,
      starting_price: 165000,
      description: "A gorgeous, compact modern cabin featuring high vaulted ceilings, expansive double-height windows, and an intelligent flex room that serves as a home office, yoga studio, or guest quarters. Highly optimized for slab-on-grade construction and high thermal efficiency.",
      features: [
        "Vaulted Ceilings & Loft Flex Space",
        "Passive Solar Orientation Design",
        "Premium Triple-Pane Glazing",
        "Compact footprint, ideal for steep or alpine sites",
        "Solar-ready electrical grid pre-wiring"
      ],
      image_urls: [
        "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=1200&q=80"
      ],
      floor_plan_url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80", // architectural sketch feeling
      active: true,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "ds_essential",
      name: "The Essential",
      bedrooms: 2,
      bathrooms: 1,
      square_feet: 880,
      starting_price: 215000,
      description: "The perfect balance of modern minimalism and day-to-day functionality. Designed for young families, downsizers, or premium rental investments, it boasts an open-plan kitchen and dining area, custom integrated storage dividers, dual vanity spa bathroom, and an seamless transition to outdoor living.",
      features: [
        "Seamless Indoor-Outdoor Flow",
        "Built-in Acoustic Storage Wall Dividers",
        "Dual Vanity Spa Bath & Large Walk-in Shower",
        "Highly efficient mechanical ventilation (HRV/ERV)",
        "Premium quartz countertops and customized millwork"
      ],
      image_urls: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
      ],
      floor_plan_url: "https://images.unsplash.com/photo-1545464693-f1798a373343?auto=format&fit=crop&w=800&q=80",
      active: true,
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "ds_family",
      name: "The Family",
      bedrooms: 3,
      bathrooms: 2,
      square_feet: 1188,
      starting_price: 285000,
      description: "A signature, spacious modern home tailored for vibrant families. Built with clean lines and premium local timber, this model features a generous master retreat with private en-suite, an integrated entry mudroom for gear storage, dedicated laundry, and a beautiful open kitchen with island bar overlooking the expansive living room.",
      features: [
        "Master Retreat with En-Suite & Walk-in Closet",
        "Integrated Entryway Mudroom with Bench & cubbies",
        "Expansive Kitchen Island & walk-in pantry potential",
        "Energy Star certified construction details",
        "Optional wrap-around deck or matching double carport"
      ],
      image_urls: [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80"
      ],
      floor_plan_url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
      active: true,
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  lots: [
    {
      id: "lt_pacific",
      title: "Pacific Horizon Ridge",
      location: "1420 Sea View Rd, Sunshine Coast",
      province: "BC",
      municipality: "Sunshine Coast Regional District",
      pid: "014-293-841",
      lot_size: 0.85,
      lot_size_unit: "Acres",
      frontage: 145,
      depth: 250,
      asking_price: 185000,
      estimated_package_price: 350000, // lot + base escape
      status: "Available",
      description: "An extraordinary elevated parcel commanding unobstructed, panoramic views of the ocean waters and outer islands. Adorned with mature Douglas Firs and Arbutus trees, the build site has been carefully pre-cleared to accommodate a slab-on-grade modern home. Offers complete visual privacy from neighboring properties, premium sun exposure, and access to nearby beach trails.",
      servicing_notes: "Electricity at property line. Septic system design approved by local health authority. Well drilling site identified with strong aquifer reports.",
      zoning_notes: "RR-1 Residential. Permits single-family dwelling, accessory dwelling units, and auxiliary home business. Short-term rentals fully permitted.",
      access_notes: "Paved, year-round municipal road access with a cleared driveway base already installed.",
      sustainability_notes: "Optimal southern exposure is perfectly suited for a full solar panel grid and passive home heating design.",
      rental_notes: "Extremely high vacation rental potential due to close beach access, panoramic ocean views, and close proximity to ferry terminal.",
      image_urls: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
      ],
      compatible_design_ids: ["ds_escape", "ds_essential"],
      created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "lt_meadowview",
      title: "Meadowview Oak Sanctuary",
      location: "845 Old Orchard Lane, Kelowna Rural",
      province: "BC",
      municipality: "Central Okanagan District",
      pid: "028-394-118",
      lot_size: 1.25,
      lot_size_unit: "Acres",
      frontage: 180,
      depth: 300,
      asking_price: 220000,
      estimated_package_price: 505000, // lot + base family
      status: "Reserved",
      description: "A breathtaking, gently sloped meadow parcel surrounded by majestic, heritage oak trees and backing onto a seasonal creek. Ideal for active families or hobbyists looking for ample green space, privacy, and fertile soil. The lot is fully cleared in the center and prepped for quick foundation excavation. Includes beautiful vistas of the nearby mountains and vineyard slopes.",
      servicing_notes: "Municipal drinking water connection fully complete at the curb. 200A electrical service post installed. Septic tank tank already buried and verified; drainage field needs hookup.",
      zoning_notes: "A-2 Rural Residential. Supports single-family home plus a detached secondary carriage suite up to 900 sq ft.",
      access_notes: "Shared private gravel road easement, professionally maintained with annual strata fee of $250.",
      sustainability_notes: "Open, wind-sheltered meadow perfect for custom greenhouses, gardens, rainwater collection, and ground-source geothermal heating loops.",
      rental_notes: "Strong potential as a long-term executive home rental, or a primary residence with carriage suite income.",
      image_urls: [
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80"
      ],
      compatible_design_ids: ["ds_essential", "ds_family"],
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "lt_pinecrest",
      title: "Pine Crest Alpine Serenity",
      location: "Lot 7 Bluebird Trail, Whistler Region",
      province: "BC",
      municipality: "Squamish-Lillooet District",
      pid: "009-482-371",
      lot_size: 0.45,
      lot_size_unit: "Acres",
      frontage: 95,
      depth: 210,
      asking_price: 295000,
      estimated_package_price: 460000, // lot + base escape
      status: "Available",
      description: "A premium alpine wooded lot positioned high in the mountain ridge, offering striking views of ski slopes and rugged peaks. Dotted with mature cedar, spruce, and hemlock trees, this property is perfect for outdoor enthusiasts looking to build an architectural ski chalet, active mountain retreat, or a peaceful off-grid cabin. Minutes from trailheads and world-class ski lifts.",
      servicing_notes: "Off-grid potential highly encouraged. Septic perk test completed with favorable shallow-bed results. Grid power available 300m away at the main trailhead road.",
      zoning_notes: "RT-2 Alpine Chalet Zoning. Permits tourist accommodation, short-term occupancy, and single detached residential cabin.",
      access_notes: "Gravel public road access, seasonally plowed by municipality. High-clearance vehicle recommended during deep winter months.",
      sustainability_notes: "High potential for passive solar capture, advanced graywater filtration, wood stove auxiliary heating, and solar/generator hybrid setups.",
      rental_notes: "Exemplary high-yield short-term winter rental potential due to Whistler region location.",
      image_urls: [
        "https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?auto=format&fit=crop&w=1200&q=80"
      ],
      compatible_design_ids: ["ds_escape"],
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  upgrades: [
    { id: "up_solar", name: "Premium Solar & Battery Package", category: "Sustainability", description: "10kW Tier-1 monocrystalline roof panels coupled with a 15kWh local battery storage bank. Provides complete grid independence, emergency backup power, and advanced energy monitoring app.", estimated_price: 1850000, active: true },
    { id: "up_kitchen", name: "Chef's Kitchen Artisan Upgrade", category: "Kitchen", description: "Solid quartz countertops, solid wood custom shaker cabinets with soft-close hinges, integrated cabinet-face refrigerator, high-end commercial induction range, and smart convection oven.", estimated_price: 1250000, active: true },
    { id: "up_deck", name: "Wrapped Redwood Cedar Deck", category: "Outdoor Living", description: "450 sq ft of custom-crafted local red cedar decking wrapping around two sides of the home. Includes black aluminum railings, built-in LED steps lighting, and structural prep for a hot tub.", estimated_price: 1400000, active: true },
    { id: "up_smarthome", name: "Smart Home Automation Hub", category: "Interior", description: "Full mesh smart home package: Nest learning thermostats, Ring video doorbell, smart locks, built-in Sonos ceiling speakers in main room, automated roller shades, and a central iPad control mount.", estimated_price: 480000, active: true },
    { id: "up_windows", name: "Triple-Pane Passive Window Upgrade", category: "Energy Efficiency", description: "High-performance German-engineered triple-glazed, argon-filled wood-clad vinyl windows. Drastically reduces acoustic transmission, eliminates drafts, and lowers heating/cooling bills by up to 35%.", estimated_price: 920000, active: true },
    { id: "up_rainwater", name: "Rainwater Harvest & Clean Water Loop", category: "Sustainability", description: "10,000L heavy-duty underground storage tank with dual-stage commercial sediment filtration, UV sterilizer, and booster pump. Feeds all toilets, outdoor spigots, and laundry units with clean rainwater.", estimated_price: 750000, active: true },
    { id: "up_bathroom", name: "Luxury Walk-in Spa Wetroom", category: "Bathroom", description: "Curbless walk-in shower with floor-to-ceiling porcelain tiles, rain-shower head, high-efficiency custom linear floor drains, heated bathroom floor tiles, and a floating organic oak vanity.", estimated_price: 620000, active: true },
    { id: "up_furniture", name: "Turnkey Scandinavian Furniture Package", category: "Rental/Furnishing Package", description: "Curated modern furniture selection matching the home model: oak dining table and chairs, comfortable linen sofa, master queen bed frame, high-density mattresses, custom window drapery, and art accents.", estimated_price: 1600000, active: true }
  ],
  design_upgrades: [
    { id: "du_1", design_id: "ds_escape", upgrade_id: "up_solar" },
    { id: "du_2", design_id: "ds_escape", upgrade_id: "up_windows" },
    { id: "du_3", design_id: "ds_escape", upgrade_id: "up_rainwater" },
    { id: "du_4", design_id: "ds_escape", upgrade_id: "up_deck" },
    { id: "du_5", design_id: "ds_essential", upgrade_id: "up_solar" },
    { id: "du_6", design_id: "ds_essential", upgrade_id: "up_kitchen" },
    { id: "du_7", design_id: "ds_essential", upgrade_id: "up_smarthome" },
    { id: "du_8", design_id: "ds_essential", upgrade_id: "up_deck" },
    { id: "du_9", design_id: "ds_essential", upgrade_id: "up_bathroom" },
    { id: "du_10", design_id: "ds_family", upgrade_id: "up_kitchen" },
    { id: "du_11", design_id: "ds_family", upgrade_id: "up_smarthome" },
    { id: "du_12", design_id: "ds_family", upgrade_id: "up_windows" },
    { id: "du_13", design_id: "ds_family", upgrade_id: "up_bathroom" },
    { id: "du_14", design_id: "ds_family", upgrade_id: "up_deck" },
    { id: "du_15", design_id: "ds_family", upgrade_id: "up_furniture" }
  ],
  finish_packages: [
    {
      id: "fp_natural",
      name: "Natural Modern",
      description: "An organic design system focused on bringing the forest indoors. Perfect for woodsy, ocean-view, or mountainous settings.",
      interior_style: "Matte-finished wide-plank white oak flooring, exposed cedar structural beams, clay plaster feature walls, and soft sage green kitchen accents.",
      exterior_style: "Vertical dark cedar siding paired with architectural charcoal steel accents and dark wood entry door trim.",
      included_materials: [
        "FSC-certified Canadian White Oak",
        "Local Western Red Cedar cladding",
        "Matte black low-flow plumbing fixtures",
        "Zero-VOC natural plaster finishes"
      ],
      image_urls: ["https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80"],
      active: true
    },
    {
      id: "fp_minimal",
      name: "Warm Minimal",
      description: "A serene, clean-lined environment prioritizing light, spaciousness, and textured natural materials.",
      interior_style: "Light micro-cement floors, sand-textured walls, concealed hinges, integrated handleless kitchen panels in warm cream, and hidden LED strip lighting.",
      exterior_style: "Off-white stucco walls combined with warm horizontal larch wood slats and anodized champagne window frames.",
      included_materials: [
        "Seamless micro-cement floor compound",
        "Textured sandstone wall plaster",
        "Brushed brass low-flow hardware",
        "Integrated warm LED channels"
      ],
      image_urls: ["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80"],
      active: true
    },
    {
      id: "fp_coastal",
      name: "Coastal Contemporary",
      description: "Bright, airy, and textured finishes that capture ocean breezes and reflective shoreline light.",
      interior_style: "Bleached pine flooring, crisp linen textures, soft seafoam-grey slate tiles, shiplap ceiling accents, and floating vanity fixtures.",
      exterior_style: "Pre-weathered silver-grey cedar shingles, clean white board-and-batten siding, and clear marine-grade aluminum handrails.",
      included_materials: [
        "Engineered bleached sea-pine planks",
        "Soft-grey split-face slate tile",
        "Brushed nickel marine-grade hardware",
        "Linen drapery and coastal cladding"
      ],
      image_urls: ["https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=800&q=80"],
      active: true
    }
  ],
  leads: [
    {
      id: "ld_sample1",
      lead_type: "Start Your Build",
      first_name: "Sarah",
      last_name: "Jenkins",
      email: "sarah.j@example.com",
      phone: "604-555-0192",
      location: "Vancouver, BC",
      preferred_region: "Sunshine Coast",
      selected_lot_id: "lt_pacific",
      selected_design_id: "ds_escape",
      budget_range: "$350k–$450k",
      financing_status: "Pre-approved",
      timeline: "3–6 months",
      intended_use: "Primary Residence",
      property_management_interest: "Maybe",
      sustainability_interest: ["Solar-ready", "Energy-efficient upgrades"],
      message: "Absolutely in love with the Pacific Horizon Ridge lot. We want to build the Escape cabin there with a solar upgrade. We have our bank pre-approval ready and would love to review the contract.",
      status: "New",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "ld_sample2",
      lead_type: "Design Inquiry",
      first_name: "Marcus",
      last_name: "Wong",
      email: "mwong.design@example.com",
      phone: "250-555-8831",
      location: "Kelowna, BC",
      preferred_region: "Okanagan Valley",
      selected_lot_id: "",
      selected_design_id: "ds_essential",
      budget_range: "$250k–$350k",
      financing_status: "Speaking with lender",
      timeline: "6–12 months",
      intended_use: "Rental Investment",
      property_management_interest: "Yes",
      sustainability_interest: ["Energy-efficient upgrades", "Natural materials"],
      message: "I am interested in building the Essential 2-bed model as a vacation rental property. I already own a lot in the Kelowna region and need information on construction timelines and building permit approvals.",
      status: "Contacted",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  lot_submissions: [
    {
      id: "sub_sample1",
      owner_first_name: "Robert",
      owner_last_name: "Miller",
      email: "bob.miller@example.com",
      phone: "778-555-4921",
      location: "Gibsons, Sunshine Coast, BC",
      pid: "018-492-384",
      municipality: "Town of Gibsons",
      province: "BC",
      lot_size: 0.95,
      lot_size_unit: "Acres",
      frontage: 120,
      depth: 340,
      asking_price: 195000,
      desired_price: 195000,
      currently_listed: "No",
      clear_title: "Yes",
      access_type: "Public road",
      services_available: ["Power nearby", "Municipal water"],
      zoning: "R-1 Low Density",
      survey_available: "Yes",
      septic_approval: "Yes",
      building_permits: "No",
      lot_condition: ["Treed", "Partially cleared", "Sloped"],
      photo_urls: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80"],
      comments: "This lot is in a prime location just 5 minutes from the Gibsons marina. It has a beautiful sloped profile with potential water peeks if built with a two-story home or high-foundation slab. Open to option agreements.",
      preferred_timeline: "1–3 months",
      open_to_option_agreement: "Yes",
      status: "New",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  contractor_applications: [
    {
      id: "con_sample1",
      company_name: "Apex Ridge Construction Ltd.",
      contact_name: "Derek Vance",
      email: "derek@apexridge.com",
      phone: "604-555-9088",
      website: "apexridge.com",
      business_address: "102 - 4750 Ridgeview Ave, Squamish BC",
      service_area: "Sea-to-Sky Corridor, Squamish, Whistler",
      province: "BC",
      trade_type: "General contractor",
      years_in_business: 12,
      license_number: "BC-GC-92841-A",
      insurance_coverage: "Yes",
      workers_comp: "Yes",
      references_available: "Yes",
      new_build_experience: "Yes",
      slab_experience: "Yes",
      crew_size: 8,
      availability: "Can start new projects within 60 days",
      interested_regions: "Whistler, Squamish, Pemberton",
      portfolio_urls: ["https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80"],
      comments: "Apex Ridge specializes in high-performance modern residential builds and slab-on-grade framing. We have extensive experience with winter-condition alpine building and have worked with structural panels and local timber prefabricators.",
      status: "New",
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  partner_applications: [
    {
      id: "part_sample1",
      name: "Evelyn Carter",
      company: "West Coast Realty Partners",
      email: "evelyn@westcoastrealty.com",
      phone: "604-555-7766",
      partner_type: "Realtor",
      region: "Sunshine Coast & Vancouver Island",
      message: "I am a local realtor representing high-net-worth land buyers and landowners. I see a massive opportunity for option-to-purchase packages in Gibsons and Sechelt. I would love to explore a marketing partnership where I list your compatible packages to my client roster.",
      status: "New",
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

// RELATIONAL DATABASE HELPER OBJECT
const db = {
  // Initialize Database
  init() {
    if (!safeStorage.getItem(DB_KEY)) {
      safeStorage.setItem(DB_KEY, JSON.stringify(initialSeedData));
      console.log('Lots2Homes Database initialized with high-fidelity seed data.');
    }
  },

  // Generic read state helper
  _read() {
    this.init();
    return JSON.parse(safeStorage.getItem(DB_KEY));
  },

  // Generic write state helper
  _write(data) {
    safeStorage.setItem(DB_KEY, JSON.stringify(data));
  },

  // ================= LOTS CRUD =================
  getLots() {
    const data = this._read();
    return data.lots || [];
  },

  getLot(id) {
    return this.getLots().find(l => l.id === id);
  },

  saveLot(lot) {
    const data = this._read();
    if (!lot.id) {
      lot.id = generateUUID();
      lot.created_at = new Date().toISOString();
      if (!lot.image_urls || lot.image_urls.length === 0) {
        lot.image_urls = ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"];
      }
      data.lots.push(lot);
    } else {
      const idx = data.lots.findIndex(l => l.id === lot.id);
      if (idx !== -1) {
        data.lots[idx] = { ...data.lots[idx], ...lot };
      }
    }
    this._write(data);
    return lot;
  },

  deleteLot(id) {
    const data = this._read();
    data.lots = data.lots.filter(l => l.id !== id);
    this._write(data);
    return true;
  },

  // ================= DESIGNS CRUD =================
  getDesigns() {
    const data = this._read();
    return data.designs || [];
  },

  getDesign(id) {
    return this.getDesigns().find(d => d.id === id);
  },

  saveDesign(design) {
    const data = this._read();
    if (!design.id) {
      design.id = generateUUID();
      design.created_at = new Date().toISOString();
      if (!design.image_urls || design.image_urls.length === 0) {
        design.image_urls = ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"];
      }
      data.designs.push(design);
    } else {
      const idx = data.designs.findIndex(d => d.id === design.id);
      if (idx !== -1) {
        data.designs[idx] = { ...data.designs[idx], ...design };
      }
    }
    this._write(data);
    return design;
  },

  deleteDesign(id) {
    const data = this._read();
    data.designs = data.designs.filter(d => d.id !== id);
    this._write(data);
    return true;
  },

  // ================= UPGRADES CRUD =================
  getUpgrades() {
    const data = this._read();
    return data.upgrades || [];
  },

  getDesignUpgrades(designId) {
    const data = this._read();
    const mappings = data.design_upgrades.filter(du => du.design_id === designId);
    const upgradeIds = mappings.map(m => m.upgrade_id);
    return this.getUpgrades().filter(up => upgradeIds.includes(up.id));
  },

  saveUpgrade(upgrade) {
    const data = this._read();
    if (!upgrade.id) {
      upgrade.id = generateUUID();
      data.upgrades.push(upgrade);
    } else {
      const idx = data.upgrades.findIndex(u => u.id === upgrade.id);
      if (idx !== -1) {
        data.upgrades[idx] = { ...data.upgrades[idx], ...upgrade };
      }
    }
    this._write(data);
    return upgrade;
  },

  deleteUpgrade(id) {
    const data = this._read();
    data.upgrades = data.upgrades.filter(u => u.id !== id);
    data.design_upgrades = data.design_upgrades.filter(du => du.upgrade_id !== id);
    this._write(data);
    return true;
  },

  // Upgrade Mapping Controls
  assignUpgradesToDesign(designId, upgradeIds) {
    const data = this._read();
    // remove existing maps for this design
    data.design_upgrades = data.design_upgrades.filter(du => du.design_id !== designId);
    // add new mappings
    upgradeIds.forEach(upId => {
      data.design_upgrades.push({
        id: generateUUID(),
        design_id: designId,
        upgrade_id: upId
      });
    });
    this._write(data);
    return true;
  },

  // ================= FINISH PACKAGES CRUD =================
  getFinishPackages() {
    const data = this._read();
    return data.finish_packages || [];
  },

  saveFinishPackage(pkg) {
    const data = this._read();
    if (!pkg.id) {
      pkg.id = generateUUID();
      data.finish_packages.push(pkg);
    } else {
      const idx = data.finish_packages.findIndex(p => p.id === pkg.id);
      if (idx !== -1) {
        data.finish_packages[idx] = { ...data.finish_packages[idx], ...pkg };
      }
    }
    this._write(data);
    return pkg;
  },

  deleteFinishPackage(id) {
    const data = this._read();
    data.finish_packages = data.finish_packages.filter(p => p.id !== id);
    this._write(data);
    return true;
  },

  // ================= BUYER LEADS CRUD =================
  getLeads() {
    const data = this._read();
    return data.leads || [];
  },

  saveLead(lead) {
    const data = this._read();
    if (!lead.id) {
      lead.id = generateUUID();
      lead.created_at = new Date().toISOString();
      lead.status = "New";
      data.leads.unshift(lead); // newest first
    } else {
      const idx = data.leads.findIndex(l => l.id === lead.id);
      if (idx !== -1) {
        data.leads[idx] = { ...data.leads[idx], ...lead };
      }
    }
    this._write(data);
    return lead;
  },

  updateLeadStatus(leadId, status) {
    const data = this._read();
    const idx = data.leads.findIndex(l => l.id === leadId);
    if (idx !== -1) {
      data.leads[idx].status = status;
      this._write(data);
      return true;
    }
    return false;
  },

  deleteLead(id) {
    const data = this._read();
    data.leads = data.leads.filter(l => l.id !== id);
    this._write(data);
    return true;
  },

  // ================= LANDOWNER SUBMISSIONS CRUD =================
  getLotSubmissions() {
    const data = this._read();
    return data.lot_submissions || [];
  },

  saveLotSubmission(submission) {
    const data = this._read();
    if (!submission.id) {
      submission.id = generateUUID();
      submission.created_at = new Date().toISOString();
      submission.status = "New";
      data.lot_submissions.unshift(submission);
    } else {
      const idx = data.lot_submissions.findIndex(s => s.id === submission.id);
      if (idx !== -1) {
        data.lot_submissions[idx] = { ...data.lot_submissions[idx], ...submission };
      }
    }
    this._write(data);
    return submission;
  },

  updateSubmissionStatus(subId, status) {
    const data = this._read();
    const idx = data.lot_submissions.findIndex(s => s.id === subId);
    if (idx !== -1) {
      data.lot_submissions[idx].status = status;
      this._write(data);
      return true;
    }
    return false;
  },

  deleteLotSubmission(id) {
    const data = this._read();
    data.lot_submissions = data.lot_submissions.filter(s => s.id !== id);
    this._write(data);
    return true;
  },

  // ================= CONTRACTOR APPLICATIONS CRUD =================
  getContractorApplications() {
    const data = this._read();
    return data.contractor_applications || [];
  },

  saveContractorApplication(app) {
    const data = this._read();
    if (!app.id) {
      app.id = generateUUID();
      app.created_at = new Date().toISOString();
      app.status = "New";
      data.contractor_applications.unshift(app);
    } else {
      const idx = data.contractor_applications.findIndex(a => a.id === app.id);
      if (idx !== -1) {
        data.contractor_applications[idx] = { ...data.contractor_applications[idx], ...app };
      }
    }
    this._write(data);
    return app;
  },

  updateContractorStatus(appId, status) {
    const data = this._read();
    const idx = data.contractor_applications.findIndex(a => a.id === appId);
    if (idx !== -1) {
      data.contractor_applications[idx].status = status;
      this._write(data);
      return true;
    }
    return false;
  },

  deleteContractorApplication(id) {
    const data = this._read();
    data.contractor_applications = data.contractor_applications.filter(a => a.id !== id);
    this._write(data);
    return true;
  },

  // ================= PARTNER APPLICATIONS CRUD =================
  getPartnerApplications() {
    const data = this._read();
    return data.partner_applications || [];
  },

  savePartnerApplication(app) {
    const data = this._read();
    if (!app.id) {
      app.id = generateUUID();
      app.created_at = new Date().toISOString();
      app.status = "New";
      data.partner_applications.unshift(app);
    } else {
      const idx = data.partner_applications.findIndex(p => p.id === app.id);
      if (idx !== -1) {
        data.partner_applications[idx] = { ...data.partner_applications[idx], ...app };
      }
    }
    this._write(data);
    return app;
  },

  updatePartnerStatus(appId, status) {
    const data = this._read();
    const idx = data.partner_applications.findIndex(p => p.id === appId);
    if (idx !== -1) {
      data.partner_applications[idx].status = status;
      this._write(data);
      return true;
    }
    return false;
  },

  deletePartnerApplication(id) {
    const data = this._read();
    data.partner_applications = data.partner_applications.filter(p => p.id !== id);
    this._write(data);
    return true;
  },

  // ================= DB UTILITIES =================
  getDashboardStats() {
    const leads = this.getLeads();
    const lotSubs = this.getLotSubmissions();
    const contractors = this.getContractorApplications();
    const partners = this.getPartnerApplications();
    const lots = this.getLots();
    const designs = this.getDesigns();

    return {
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === "New").length,
      totalLotSubs: lotSubs.length,
      newLotSubs: lotSubs.filter(s => s.status === "New").length,
      totalContractors: contractors.length,
      newContractors: contractors.filter(a => a.status === "New").length,
      totalPartners: partners.length,
      newPartners: partners.filter(p => p.status === "New").length,
      totalLots: lots.length,
      availableLots: lots.filter(l => l.status === "Available").length,
      totalDesigns: designs.length
    };
  }
};

window.db = db;
