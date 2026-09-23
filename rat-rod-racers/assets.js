/**
 * Rat Rod Racers - Modular Asset & Rendering Pipeline
 * Based on rat_rod_part_balance_synergy_design_document.md
 * 5 Canonical Slots: Powertrain, Chassis & Body, Suspension & Axles, Tires & Wheels, and Ancillary & Quirks.
 * Bold Ink Outlines, Two-Tone Cel Shading, and authentic Rat Rod quirks.
 */

const RAT_ROD_ASSETS = {
  // 1. POWERTRAIN SLOT
  powertrain: {
    'ENG-01': {
      id: 'ENG-01',
      name: "Stroker 383 V8 (Dual Quads)",
      category: 'powertrain',
      archetype: 'Balanced',
      rarity: 'rare',
      cost: 4, // Jalopy Points
      mass: 260,
      peakForce: 3000,
      powerBand: 1.05,
      frontBiasShift: 0.05,
      heatRate: 13.0,
      durability: 75,
      trait: "Reliable Workhorse",
      traitDesc: "+10% cooling efficiency at mid RPM.",
      type: 'stroker',
      lore: "Small-block chevy bored and stroked with twin Edelbrock carburetors on a high-rise manifold."
    },
    'ENG-02': {
      id: 'ENG-02',
      name: "6-71 Blown 454 Big Block",
      category: 'powertrain',
      archetype: 'Blown Gasser',
      rarity: 'epic',
      cost: 7, // High Point Cost
      mass: 340,
      peakForce: 4400,
      powerBand: 1.30,
      frontBiasShift: 0.12,
      heatRate: 23.0,
      durability: 60,
      blowerSurge: true,
      trait: "Blower Surge",
      traitDesc: "Explosive throttle response; violent wheelspin below 35 mph.",
      type: 'blower',
      lore: "Polished Roots blower sitting atop an iron 454. Whines ferociously with twin three-hole butterflies!"
    },
    'ENG-03': {
      id: 'ENG-03',
      name: "Screaming Slant-6 (Triple Webers)",
      category: 'powertrain',
      archetype: 'Chop Rattler',
      rarity: 'common',
      cost: 3,
      mass: 190,
      peakForce: 2300,
      powerBand: 0.95,
      frontBiasShift: -0.03,
      heatRate: 9.0,
      durability: 85,
      trait: "Free Rev",
      traitDesc: "Instant throttle blip; high-RPM agility with low heat buildup.",
      type: 'slant6',
      lore: "Leaning tower of power with three side-draft Italian carburetors. Light, nimble, revs to 7,000 RPM."
    },
    'ENG-04': {
      id: 'ENG-04',
      name: "12-Valve 5.9L Turbo Diesel",
      category: 'powertrain',
      archetype: 'Diesel Bruiser',
      rarity: 'epic',
      cost: 6,
      mass: 480,
      peakForce: 3800,
      powerBand: 1.45,
      frontBiasShift: 0.22,
      heatRate: 8.0,
      durability: 98,
      turboLag: 1.5,
      immuneToHeat: true,
      trait: "Rolling Coal",
      traitDesc: "1.5s turbo spool lag off green light; immune to engine overheating degradation.",
      type: 'diesel',
      lore: "Cast iron industrial tractor engine. Pours dense black smoke while delivering mountain-moving low-end torque."
    },
    'ENG-05': {
      id: 'ENG-05',
      name: "Twin-Turbo Flathead V8",
      category: 'powertrain',
      archetype: 'Salt Speedster',
      rarity: 'legendary',
      cost: 5,
      mass: 230,
      peakForce: 4000,
      powerBand: 1.18,
      frontBiasShift: 0.02,
      heatRate: 21.0,
      durability: 50,
      boostCreep: true,
      trait: "Boost Creep",
      traitDesc: "Exponential top-end boost past 80 mph; runs hot without high-speed airflow.",
      type: 'twinturbo',
      lore: "Vintage Ford flathead block modernized with twin Garrett turbos plumbed with polished stainless steel."
    },
    'ENG-06': {
      id: 'ENG-06',
      name: "Stock Farm Truck Flathead",
      category: 'powertrain',
      archetype: 'Mud-Runner',
      rarity: 'common',
      cost: 2,
      mass: 240,
      peakForce: 1950,
      powerBand: 0.90,
      frontBiasShift: 0.04,
      heatRate: 10.0,
      durability: 90,
      tractorChug: true,
      trait: "Tractor Chug",
      traitDesc: "Generates maximum torque at low launch RPM without breaking traction.",
      type: 'farmtruck',
      lore: "Yanked out of a 1946 hay baler truck. Starts on the first crank, purrs like an iron tractor."
    }
  },

  // 2. CHASSIS & BODY SLOT
  chassis: {
    'BOD-01': {
      id: 'BOD-01',
      name: "Chopped '32 5-Window Coupe",
      category: 'chassis',
      archetype: 'Salt Speedster',
      rarity: 'rare',
      cost: 5,
      aeroScore: 88,
      cdA: 0.25,
      hCG: 0.35,
      mass: 180,
      durability: 60,
      flex: 'Med',
      trait: "Wind Slicer",
      traitDesc: "-25% aerodynamic drag; chopped roof channels air cleanly.",
      color: '#1a1d2e',
      accent: '#00f0ff',
      renderType: 'coupe32',
      lore: "Heavily channeled steel coupe with a 4-inch roof slice and recessed belly pan."
    },
    'BOD-02': {
      id: 'BOD-02',
      name: "Highboy '29 Model A Roadster",
      category: 'chassis',
      archetype: 'Blown Gasser',
      rarity: 'common',
      cost: 3,
      aeroScore: 45,
      cdA: 0.42,
      hCG: 0.65,
      mass: 130,
      durability: 50,
      flex: 'High',
      trait: "Skeleton Frame",
      traitDesc: "Ultra lightweight; high center of gravity transfers massive launch weight to rear tires.",
      color: '#a04822',
      accent: '#ffbe0b',
      renderType: 'roadster29',
      lore: "Minimalist open cockpit roadster perched atop bare highboy frame rails."
    },
    'BOD-03': {
      id: 'BOD-03',
      name: "Z'd & Channeled Rusty Sedan",
      category: 'chassis',
      archetype: 'Chop Rattler',
      rarity: 'rare',
      cost: 4,
      aeroScore: 70,
      cdA: 0.33,
      hCG: 0.30,
      mass: 210,
      durability: 70,
      flex: 'Low',
      trait: "Belly Drag",
      traitDesc: "Ultra-low center of gravity eliminates roll; vulnerable to rough ground.",
      color: '#6b3a2a',
      accent: '#e63946',
      renderType: 'sedan',
      lore: "Severe 8-inch kick-up frame lets this rusty 2-door sedan scrape the pavement."
    },
    'BOD-04': {
      id: 'BOD-04',
      name: "Reinforced C-Channel Delivery Van",
      category: 'chassis',
      archetype: 'Diesel Bruiser',
      rarity: 'rare',
      cost: 4,
      aeroScore: 30,
      cdA: 0.52,
      hCG: 0.58,
      mass: 420,
      durability: 100,
      flex: 'None',
      trait: "Battering Ram",
      traitDesc: "Cast steel I-beam frame completely immune to frame flex; heavy drag.",
      color: '#343a40',
      accent: '#ff6b1a',
      renderType: 'deliveryvan',
      lore: "Industrial delivery truck cab reinforced with structural steel gussets."
    },
    'BOD-05': {
      id: 'BOD-05',
      name: "Gutted Touring Tub with Skid Plate",
      category: 'chassis',
      archetype: 'Mud-Runner',
      rarity: 'common',
      cost: 3,
      aeroScore: 50,
      cdA: 0.40,
      hCG: 0.46,
      mass: 170,
      durability: 85,
      flex: 'Med',
      ignoreDebris: true,
      trait: "Scraping Shield",
      traitDesc: "Full-length 1/4-inch aluminum belly skid plate completely ignores rough terrain drag.",
      color: '#3b5a45',
      accent: '#8b6f47',
      renderType: 'touringtub',
      lore: "Open touring tub salvaged from an orchard with a hardened diamond-plate skid pan."
    },
    'BOD-06': {
      id: 'BOD-06',
      name: "Jalopy Special #2",
      category: 'chassis',
      archetype: 'Diesel Bruiser',
      rarity: 'epic',
      cost: 4,
      aeroScore: 56,
      cdA: 0.32,
      hCG: 0.40,
      mass: 250,
      durability: 80,
      flex: 'Med',
      trait: "Handmade Steel",
      traitDesc: "Crafted in the custom chassis lab with tailored aerodynamic proportions.",
      color: '#e38963',
      accent: '#ffbe0b',
      renderType: 'custom_image',
      imageSrc: 'assets/jalopy_special_2.png',
      dataUrl: 'assets/jalopy_special_2.png',
      lore: "Custom hand-hammered steel body tailored in the chassis studio for heavy diesel torque."
    }
  },

  // 3. SUSPENSION & AXLES SLOT
  suspension: {
    'SUS-01': {
      id: 'SUS-01',
      name: "Suicide Front Leaf + Welded Spool",
      category: 'suspension',
      archetype: 'Blown Gasser',
      rarity: 'rare',
      cost: 4,
      tractionBias: '100% Straight',
      rollStiffness: 0.85,
      suspTravel: 0.22,
      roughnessTol: 0.25,
      suspKappa: 0.55,
      trait: "Crude Lock",
      traitDesc: "Maximum straight-line launch traction; zero axle slip.",
      type: 'suicide_leaf',
      lore: "Spring mounted ahead of the crossmember with a fully welded rear spool for drag strip hookup."
    },
    'SUS-02': {
      id: 'SUS-02',
      name: "Split-Wishbone Dropped I-Beam",
      category: 'suspension',
      archetype: 'Chop Rattler',
      rarity: 'common',
      cost: 3,
      tractionBias: 'Asphalt Biased',
      rollStiffness: 0.55,
      suspTravel: 0.45,
      roughnessTol: 0.50,
      suspKappa: 0.38,
      trait: "Vintage Track",
      traitDesc: "Predictable lateral roll and smooth road damping.",
      type: 'dropped_ibeam',
      lore: "Drilled 4-inch dropped front axle with split wishbones welded to the chassis rails."
    },
    'SUS-03': {
      id: 'SUS-03',
      name: "Long-Travel Heavy Buggy Springs",
      category: 'suspension',
      archetype: 'Mud-Runner',
      rarity: 'rare',
      cost: 3,
      tractionBias: 'Dirt / Mud Biased',
      rollStiffness: 0.30,
      suspTravel: 0.85,
      roughnessTol: 0.92,
      suspKappa: 0.28,
      trait: "Mud Articulation",
      traitDesc: "Absorbs violent dirt ruts and mud bumps without bottoming out.",
      type: 'buggy_springs',
      lore: "High-arch transverse buggy leaves designed to flex over deep mud furrows and rocks."
    },
    'SUS-04': {
      id: 'SUS-04',
      name: "Double-Z Solid Rig (Zero Springs)",
      category: 'suspension',
      archetype: 'Salt Speedster',
      rarity: 'epic',
      cost: 4,
      tractionBias: 'Mirror-Flat Smooth',
      rollStiffness: 1.00,
      suspTravel: 0.02,
      roughnessTol: 0.05,
      suspKappa: 0.15,
      trait: "Skate Board",
      traitDesc: "Zero suspension travel; loses traction instantly if track has any bumps.",
      type: 'solid_rig',
      lore: "Axles welded directly to the frame rails. Pure rigid dry-lake racing geometry."
    },
    'SUS-05': {
      id: 'SUS-05',
      name: "Re-arched Truck Leaves & Open Diff",
      category: 'suspension',
      archetype: 'Diesel Bruiser',
      rarity: 'common',
      cost: 2,
      tractionBias: 'Heavy Tow Versatile',
      rollStiffness: 0.60,
      suspTravel: 0.65,
      roughnessTol: 0.80,
      suspKappa: 0.32,
      trait: "Workhorse Axle",
      traitDesc: "Heavy load carrying durability over broken incline roads.",
      type: 'truck_leaves',
      lore: "Multi-leaf steel spring packs from an old flatbed with a massive cast Dana 60 rear end."
    }
  },

  // 4. TIRES & WHEELS SLOT
  wheels: {
    'TIR-01': {
      id: 'TIR-01',
      name: "Pie-Crust Cheater Slicks",
      category: 'wheels',
      archetype: 'Blown Gasser',
      rarity: 'rare',
      cost: 4,
      mu: 1.25,
      tireType: 'slicks',
      width: 'Extra Wide',
      sidewall: 'High Wrinkle',
      mass: 48,
      trait: "Asphalt Hookup",
      traitDesc: "Immense grip on dry rubbered asphalt; spins helplessly in wet clay.",
      type: 'slicks',
      lore: "Cheater slicks with vintage pie-crust shoulder ribs that wrinkle up on hard launches."
    },
    'TIR-02': {
      id: 'TIR-02',
      name: "Skinny Vintage Firestones",
      category: 'wheels',
      archetype: 'Chop Rattler',
      rarity: 'common',
      cost: 1,
      mu: 0.82,
      tireType: 'firestones',
      width: 'Narrow',
      sidewall: 'High Bias',
      mass: 28,
      trait: "Low Rolling Resistance",
      traitDesc: "Featherweight rotational mass; limited peak launch friction.",
      type: 'firestones',
      lore: "Classic 4-ply skinny bias-ply tires mounted on weathered black steel rims."
    },
    'TIR-03': {
      id: 'TIR-03',
      name: "Hand-Grooved Ag Mud Tires",
      category: 'wheels',
      archetype: 'Mud-Runner',
      rarity: 'rare',
      cost: 3,
      mu: 1.05,
      tireType: 'knobby',
      width: 'Wide Lug',
      sidewall: 'Massive',
      mass: 62,
      trait: "Tractor Claw",
      traitDesc: "Maximum clawing traction in dirt and mud; creates heavy vibration above 50 mph.",
      type: 'knobby',
      lore: "Deep chevron tractor treads hand-siped with a hot iron blade for deep earth digging."
    },
    'TIR-04': {
      id: 'TIR-04',
      name: "Salt Disk Shod Racing Dunlops",
      category: 'wheels',
      archetype: 'Salt Speedster',
      rarity: 'epic',
      cost: 4,
      mu: 0.88,
      tireType: 'salt',
      width: 'Medium Low-Profile',
      sidewall: 'Stiff',
      mass: 32,
      cdAMod: -0.03,
      trait: "Salt Slicer",
      traitDesc: "Polished aluminum spun moon wheel covers slice aerodynamic drag on salt flats.",
      type: 'salt',
      lore: "Hard compound dry lake tires fitted with mirror-finish aluminum wheel disks."
    },
    'TIR-05': {
      id: 'TIR-05',
      name: "Dual Rear Commercial Duallys",
      category: 'wheels',
      archetype: 'Diesel Bruiser',
      rarity: 'rare',
      cost: 3,
      mu: 1.10,
      tireType: 'duallys',
      width: 'Double Wide',
      sidewall: 'Heavy Commercial',
      mass: 88,
      trait: "Unbreakable Bite",
      traitDesc: "Four massive rear contact patches conquer steep gravel grades under heavy weight.",
      type: 'duallys',
      lore: "Twin steel dual wheels bolted to each side of a 1-ton axle hub with heavy lug nuts."
    }
  },

  // 5. ANCILLARY, COOLING, & QUIRK SLOT
  ancillary: {
    'ANC-01': {
      id: 'ANC-01',
      name: "Beer-Keg Fuel Tank on Grille",
      category: 'ancillary',
      archetype: 'Blown Gasser',
      rarity: 'common',
      cost: 2,
      mass: 25,
      frontBiasShift: 0.08,
      radAreaMult: 0.85,
      forceMult: 1.0,
      trait: "Wheelie Counter",
      traitDesc: "Shifts +8% weight over front axle to prevent wheelies; blocks 15% radiator airflow.",
      type: 'beerkeg',
      lore: "Stainless aluminum beer keg strapped ahead of the radiator with leather belts."
    },
    'ANC-02': {
      id: 'ANC-02',
      name: "Chopped Farm Tractor Radiator",
      category: 'ancillary',
      archetype: 'Mud-Runner',
      rarity: 'rare',
      cost: 3,
      mass: 65,
      radAreaMult: 2.20,
      grilleAirflowMult: 1.35,
      cdAMod: 0.04,
      forceMult: 1.0,
      trait: "Cooling Colossus",
      traitDesc: "Massive 2.2x cooling surface area eliminates overheating; adds 65 kg of front weight.",
      type: 'tractor_rad',
      lore: "Huge copper core radiator salvaged from a combine harvester with a brass overflow tube."
    },
    'ANC-03': {
      id: 'ANC-03',
      name: "Straight Lakester Pipes with Cutouts",
      category: 'ancillary',
      archetype: 'Salt Speedster',
      rarity: 'common',
      cost: 2,
      mass: 8,
      radAreaMult: 1.0,
      forceMult: 1.08,
      trait: "Lakester Bark",
      traitDesc: "Zero exhaust backpressure provides +8% engine power output.",
      type: 'lakester_pipes',
      lore: "Conical megaphone header pipes jutting straight out past the frame rails with quick-release caps."
    },
    'ANC-04': {
      id: 'ANC-04',
      name: "Lead Ballast in Rear Trunk",
      category: 'ancillary',
      archetype: 'Chop Rattler',
      rarity: 'rare',
      cost: 3,
      mass: 90,
      frontBiasShift: -0.14,
      radAreaMult: 1.0,
      forceMult: 1.0,
      trait: "Lead Sinker",
      traitDesc: "Adds 90 kg directly over rear axle; increases launch traction compliance.",
      type: 'lead_ballast',
      lore: "Heavy scrap lead sash weights melted and poured into the trunk floor pan for traction."
    },
    'ANC-05': {
      id: 'ANC-05',
      name: "Exposed Belt Drive Siren",
      category: 'ancillary',
      archetype: 'Diesel Bruiser',
      rarity: 'rare',
      cost: 1,
      mass: 12,
      radAreaMult: 1.0,
      forceMult: 0.98,
      trait: "Air Raid Screamer",
      traitDesc: "High-pitched mechanical siren sounds off on throttle; 2% drag on crankshaft.",
      type: 'belt_siren',
      lore: "Vintage fire truck friction siren driven directly off the water pump belt pulley."
    }
  }
};

// Aliases for backward compatibility with older slot names
RAT_ROD_ASSETS.engines = RAT_ROD_ASSETS.powertrain;
RAT_ROD_ASSETS.chassis['BOD-CUSTOM'] = RAT_ROD_ASSETS.chassis['BOD-06'];

/**
 * Track Environmental Characteristics & Matchup Matrix (Section 5)
 */
const TRACK_ENVIRONMENTS = {
  airfield: {
    id: 'airfield',
    name: "Abandoned Airfield Drag",
    badge: "Wide Rubbered Asphalt",
    surfaceGrip: 1.10,
    roughness: 0.05,
    gradeAngle: 0.0,
    airDensity: 1.225,
    trackLength: 402.336,
    optimalArchetype: "Blown Gasser",
    worstArchetype: "Mud-Runner",
    decidingFactor: "Peak launch traction makes raw power king; mud lugs scrub high speed.",
    lore: "Wide decommissioned military runway coated in sticky VHT traction resin. Built for flat-out acceleration.",
    skyColors: ['#1a1423', '#3d1a24', '#9b4b2a'],
    groundColor: '#1a1c23',
    stripeColor: '#ffbe0b'
  },
  bonneville: {
    id: 'bonneville',
    name: "Bonneville Salt Flats",
    badge: "Hard Packed White Salt",
    surfaceGrip: 0.82,
    roughness: 0.02,
    gradeAngle: 0.0,
    airDensity: 1.160, // slightly thinner desert salt air
    trackLength: 402.336,
    optimalArchetype: "Salt Speedster",
    worstArchetype: "Blown Gasser",
    decidingFactor: "High-speed aerodynamic resistance and engine thermal runaway; chopped roofs rule.",
    lore: "Mirror-flat crystalline salt extending to the horizon under a blazing sun. High speeds demand sleek aerodynamics.",
    skyColors: ['#0d2b45', '#203c56', '#544e68'],
    groundColor: '#eae7dc',
    stripeColor: '#8d99ae'
  },
  dirt_oval: {
    id: 'dirt_oval',
    name: "Dead Man's Dirt Strip",
    badge: "Rutted Clay & Mud Furrows",
    surfaceGrip: 0.55,
    roughness: 0.85,
    gradeAngle: 0.0,
    airDensity: 1.225,
    trackLength: 402.336,
    optimalArchetype: "Mud-Runner",
    worstArchetype: "Salt Speedster",
    decidingFactor: "Violent ruts break rigid axles; high-travel buggy springs articulate smoothly.",
    lore: "Deep rutted clay track carved through farm country. Low-slung cars bottom out and scrape violently.",
    skyColors: ['#281912', '#4a2818', '#8a4b2a'],
    groundColor: '#4a3325',
    stripeColor: '#d4a373'
  },
  quarry: {
    id: 'quarry',
    name: "Quarry Incline Drag",
    badge: "+7.5° Uphill Loose Gravel",
    surfaceGrip: 0.75,
    roughness: 0.50,
    gradeAngle: 0.131, // approx 7.5 degrees uphill
    airDensity: 1.225,
    trackLength: 402.336,
    optimalArchetype: "Diesel Bruiser",
    worstArchetype: "Chop Rattler",
    decidingFactor: "Relentless low-RPM torque and massive weight keep tires digging uphill where light cars bog.",
    lore: "Steep gravel service road inside an open-pit limestone quarry. Heavy gravity pulls against cars off the line.",
    skyColors: ['#1f2421', '#2f3e46', '#52796f'],
    groundColor: '#5c574f',
    stripeColor: '#ffbe0b'
  },
  mountain: {
    id: 'mountain',
    name: "Smokey Mountain Pass",
    badge: "Narrow Undulating Tarmac",
    surfaceGrip: 0.95,
    roughness: 0.30,
    gradeAngle: 0.035, // slight uphill roll
    airDensity: 1.200,
    trackLength: 402.336,
    optimalArchetype: "Chop Rattler",
    worstArchetype: "Diesel Bruiser",
    decidingFactor: "Technical undulating transitions reward low roll inertia; heavy diesels understeer.",
    lore: "Old mountain highway with quick elevation dips and switchback curves framed by towering pine trees.",
    skyColors: ['#132a13', '#31572c', '#4f772d'],
    groundColor: '#2b2d35',
    stripeColor: '#ffd166'
  }
};

/**
 * Procedural Cartoon SVG Generator for Parts & Icons
 */
const RatRodSVG = {
  getPartSVG(part, size = 120) {
    if (!part) return '';
    const cat = part.category;
    let content = '';

    switch (cat) {
      case 'powertrain':
      case 'engines':
        content = this._powertrainSVG(part);
        break;
      case 'chassis':
        content = this._chassisSVG(part);
        break;
      case 'suspension':
        content = this._suspensionSVG(part);
        break;
      case 'wheels':
        content = this._wheelsSVG(part);
        break;
      case 'ancillary':
      case 'charms':
      case 'exhaust':
      case 'aero':
        content = this._ancillarySVG(part);
        break;
      default:
        content = `<rect x="10" y="10" width="80" height="80" rx="8" fill="#444"/>`;
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" class="part-svg-preview">
        <defs>
          <radialGradient id="cardGlow_${part.id || 'p'}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.12)" />
            <stop offset="100%" stop-color="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#cardGlow_${part.id || 'p'})" />
        ${content}
      </svg>
    `;
  },

  _powertrainSVG(part) {
    const type = part.type || 'stroker';
    if (type === 'blower') {
      // Massive 6-71 Roots blower with animated red butterfly flaps
      return `
        <rect x="25" y="44" width="50" height="34" rx="4" fill="#a82828" stroke="#12121c" stroke-width="2.5" />
        <rect x="20" y="32" width="60" height="15" rx="3" fill="#ced4da" stroke="#12121c" stroke-width="2.5" />
        <path d="M 28 32 L 35 15 L 65 15 L 72 32 Z" fill="#e63946" stroke="#12121c" stroke-width="2.5" />
        <ellipse cx="40" cy="22" rx="4" ry="2.5" fill="#12121c" />
        <ellipse cx="50" cy="22" rx="4" ry="2.5" fill="#12121c" />
        <ellipse cx="60" cy="22" rx="4" ry="2.5" fill="#12121c" />
        <circle cx="16" cy="40" r="7" fill="#495057" stroke="#12121c" stroke-width="2" />
        <circle cx="16" cy="62" r="7" fill="#495057" stroke="#12121c" stroke-width="2" />
        <rect x="13" y="40" width="6" height="22" fill="#111" />
      `;
    } else if (type === 'diesel') {
      // 12-Valve Cummins Turbo Diesel with dual exhaust stacks
      return `
        <rect x="22" y="38" width="56" height="42" rx="4" fill="#2b2d42" stroke="#12121c" stroke-width="2.6" />
        <rect x="28" y="28" width="44" height="12" rx="2" fill="#8d99ae" stroke="#12121c" stroke-width="2" />
        <circle cx="76" cy="45" r="10" fill="#ced4da" stroke="#12121c" stroke-width="2.5" />
        <path d="M 76 35 A 10 10 0 0 1 86 45 L 86 52 L 76 52 Z" fill="#ffbe0b" />
        <rect x="28" y="12" width="7" height="18" fill="#111" stroke="#12121c" stroke-width="2" />
        <rect x="40" y="12" width="7" height="18" fill="#111" stroke="#12121c" stroke-width="2" />
        <path d="M 32 10 Q 30 4 34 2" stroke="#666" stroke-width="3" stroke-linecap="round" fill="none" />
      `;
    } else if (type === 'twinturbo') {
      // Twin-Turbo Flathead with twin snail housings
      return `
        <rect x="26" y="45" width="48" height="34" rx="4" fill="#c94a29" stroke="#12121c" stroke-width="2.5" />
        <path d="M 22 52 A 9 9 0 1 1 31 61 L 22 61 Z" fill="#ced4da" stroke="#12121c" stroke-width="2" />
        <path d="M 78 52 A 9 9 0 1 0 69 61 L 78 61 Z" fill="#ced4da" stroke="#12121c" stroke-width="2" />
        <path d="M 32 46 Q 50 30 68 46" stroke="#48cae4" stroke-width="5" stroke-linecap="round" fill="none" />
        <rect x="42" y="32" width="16" height="14" rx="2" fill="#ffbe0b" stroke="#12121c" stroke-width="2" />
      `;
    } else if (type === 'slant6') {
      // Leaning tower of power with three Weber carbs
      return `
        <path d="M 30 76 L 46 36 L 74 36 L 58 76 Z" fill="#4a5568" stroke="#12121c" stroke-width="2.5" />
        <circle cx="48" cy="28" r="5" fill="#ffbe0b" stroke="#12121c" stroke-width="2" />
        <circle cx="60" cy="28" r="5" fill="#ffbe0b" stroke="#12121c" stroke-width="2" />
        <circle cx="72" cy="28" r="5" fill="#ffbe0b" stroke="#12121c" stroke-width="2" />
        <rect x="22" y="68" width="14" height="6" fill="#e2e8f0" stroke="#12121c" stroke-width="1.8" />
      `;
    } else if (type === 'farmtruck') {
      // Honest green flathead with oil bath air cleaner
      return `
        <rect x="26" y="44" width="48" height="36" rx="4" fill="#3b5a45" stroke="#12121c" stroke-width="2.5" />
        <circle cx="50" cy="30" r="14" fill="#2b2d42" stroke="#12121c" stroke-width="2.5" />
        <circle cx="50" cy="30" r="5" fill="#ffbe0b" />
        <path d="M 28 50 L 16 50 L 16 68 L 26 68" stroke="#12121c" stroke-width="3" fill="none" />
      `;
    } else {
      // Stroker 383 V8 with dual carbs and chrome finned valve covers
      return `
        <rect x="25" y="45" width="50" height="35" rx="4" fill="#e76f51" stroke="#12121c" stroke-width="2.5" />
        <rect x="35" y="32" width="12" height="14" rx="2" fill="#f4a261" stroke="#12121c" stroke-width="2" />
        <rect x="53" y="32" width="12" height="14" rx="2" fill="#f4a261" stroke="#12121c" stroke-width="2" />
        <ellipse cx="41" cy="28" rx="8" ry="4" fill="#ced4da" stroke="#12121c" stroke-width="2" />
        <ellipse cx="59" cy="28" rx="8" ry="4" fill="#ced4da" stroke="#12121c" stroke-width="2" />
      `;
    }
  },

  _chassisSVG(part) {
    const col = part.color || '#a04822';
    const acc = part.accent || '#ffbe0b';
    const type = part.renderType || 'roadster29';
    const src = part.imageSrc || part.dataUrl;
    if (type === 'custom_image' && src) {
      return `
        <image href="${src}" x="5" y="25" width="90" height="45" preserveAspectRatio="xMidYMid meet" />
      `;
    } else if (type === 'coupe32') {
      return `
        <path d="M 12 62 L 28 62 L 35 48 L 62 48 L 74 62 L 88 62 L 88 72 L 12 72 Z" fill="${col}" stroke="#12121c" stroke-width="2.5" />
        <path d="M 38 49 L 45 36 L 68 36 L 70 49 Z" fill="#121420" stroke="#12121c" stroke-width="2.5" />
        <line x1="56" y1="36" x2="56" y2="49" stroke="#12121c" stroke-width="2" />
        <rect x="18" y="70" width="64" height="5" fill="#222" />
        <circle cx="82" cy="54" r="3.5" fill="${acc}" />
      `;
    } else if (type === 'sedan') {
      return `
        <path d="M 10 65 L 26 65 L 30 42 L 72 42 L 78 65 L 90 65 L 90 74 L 10 74 Z" fill="${col}" stroke="#12121c" stroke-width="2.5" />
        <rect x="34" y="46" width="16" height="14" fill="#1a1c23" stroke="#12121c" stroke-width="2" />
        <rect x="54" y="46" width="16" height="14" fill="#1a1c23" stroke="#12121c" stroke-width="2" />
        <rect x="14" y="72" width="72" height="5" fill="#2b2d42" />
      `;
    } else if (type === 'deliveryvan') {
      return `
        <path d="M 12 72 L 12 36 L 60 36 L 75 52 L 88 52 L 88 72 Z" fill="${col}" stroke="#12121c" stroke-width="2.5" />
        <path d="M 61 40 L 71 52 L 61 52 Z" fill="#00f0ff" stroke="#12121c" stroke-width="2" />
        <line x1="42" y1="38" x2="42" y2="70" stroke="#12121c" stroke-width="2.5" />
        <circle cx="82" cy="60" r="3.5" fill="${acc}" />
      `;
    } else if (type === 'touringtub') {
      return `
        <path d="M 14 62 L 32 62 L 36 50 L 64 50 L 70 62 L 86 62 L 84 72 L 16 72 Z" fill="${col}" stroke="#12121c" stroke-width="2.5" />
        <rect x="12" y="72" width="76" height="5" rx="2" fill="#adb5bd" stroke="#12121c" stroke-width="2" />
        <circle cx="48" cy="46" r="3" fill="#ffbe0b" />
      `;
    } else {
      // Roadster 29 Highboy
      return `
        <path d="M 14 64 L 32 64 L 40 48 L 62 48 L 72 64 L 88 64 L 88 72 L 14 72 Z" fill="${col}" stroke="#12121c" stroke-width="2.5" />
        <path d="M 44 48 L 48 38 L 56 38 L 58 48 Z" fill="#121420" stroke="#12121c" stroke-width="2" />
        <circle cx="50" cy="44" r="3" fill="${acc}" />
        <rect x="18" y="70" width="64" height="6" fill="#12121c" />
      `;
    }
  },

  _suspensionSVG(part) {
    const type = part.type || 'dropped_ibeam';
    if (type === 'suicide_leaf') {
      return `
        <line x1="15" y1="52" x2="85" y2="52" stroke="#12121c" stroke-width="4" stroke-linecap="round" />
        <path d="M 22 52 Q 50 36 78 52" stroke="#adb5bd" stroke-width="3" fill="none" />
        <circle cx="20" cy="52" r="5" fill="#ffbe0b" stroke="#12121c" stroke-width="2" />
        <circle cx="80" cy="52" r="5" fill="#ffbe0b" stroke="#12121c" stroke-width="2" />
        <rect x="44" y="32" width="12" height="24" fill="#343a40" stroke="#12121c" stroke-width="2" />
      `;
    } else if (type === 'buggy_springs') {
      return `
        <path d="M 18 64 Q 50 20 82 64" stroke="#495057" stroke-width="5" fill="none" stroke-linecap="round" />
        <path d="M 24 64 Q 50 28 76 64" stroke="#6c757d" stroke-width="3" fill="none" stroke-linecap="round" />
        <rect x="42" y="36" width="16" height="16" fill="#ffbe0b" stroke="#12121c" stroke-width="2" />
      `;
    } else if (type === 'solid_rig') {
      return `
        <rect x="22" y="44" width="56" height="12" fill="#12121c" stroke="#ced4da" stroke-width="2" />
        <line x1="28" y1="44" x2="40" y2="28" stroke="#12121c" stroke-width="5" />
        <line x1="72" y1="44" x2="60" y2="28" stroke="#12121c" stroke-width="5" />
        <circle cx="26" cy="50" r="4" fill="#e63946" />
        <circle cx="74" cy="50" r="4" fill="#e63946" />
      `;
    } else {
      // Dropped I-beam
      return `
        <path d="M 16 46 L 28 46 L 36 62 L 64 62 L 72 46 L 84 46" stroke="#12121c" stroke-width="5" fill="none" stroke-linejoin="round" />
        <circle cx="42" cy="62" r="3" fill="#ffbe0b" />
        <circle cx="50" cy="62" r="3" fill="#ffbe0b" />
        <circle cx="58" cy="62" r="3" fill="#ffbe0b" />
      `;
    }
  },

  _wheelsSVG(part) {
    const type = part.type || 'slicks';
    if (type === 'slicks') {
      // Extra wide wrinkle drag slick with white lettering
      return `
        <circle cx="50" cy="50" r="38" fill="#1c1f26" stroke="#12121c" stroke-width="3" />
        <circle cx="50" cy="50" r="22" fill="#ffbe0b" stroke="#12121c" stroke-width="2.5" />
        <circle cx="50" cy="50" r="9" fill="#12121c" />
        <text x="50" y="22" font-size="6" font-family="sans-serif" font-weight="900" fill="#fff" text-anchor="middle">MICKEY</text>
        <text x="50" y="82" font-size="6" font-family="sans-serif" font-weight="900" fill="#fff" text-anchor="middle">THOMS</text>
      `;
    } else if (type === 'knobby') {
      // Deep-lug tractor mud tire
      return `
        <circle cx="50" cy="50" r="38" fill="#2b2d42" stroke="#12121c" stroke-width="3" />
        <circle cx="50" cy="50" r="22" fill="#8d99ae" stroke="#12121c" stroke-width="2.5" />
        <circle cx="50" cy="50" r="8" fill="#12121c" />
        <!-- Tractor lugs -->
        <path d="M 46 12 L 54 12 L 52 18 L 48 18 Z" fill="#ffbe0b" />
        <path d="M 80 46 L 80 54 L 74 52 L 74 48 Z" fill="#ffbe0b" />
        <path d="M 46 82 L 54 82 L 52 76 L 48 76 Z" fill="#ffbe0b" />
        <path d="M 12 46 L 12 54 L 18 52 L 18 48 Z" fill="#ffbe0b" />
      `;
    } else if (type === 'salt') {
      // Spun aluminum racing moon disk
      return `
        <circle cx="50" cy="50" r="36" fill="#1c1f26" stroke="#12121c" stroke-width="3" />
        <circle cx="50" cy="50" r="26" fill="#e9ecef" stroke="#12121c" stroke-width="2.5" />
        <path d="M 32 32 Q 50 24 68 32 Q 50 68 32 32" fill="rgba(255,255,255,0.4)" />
        <circle cx="50" cy="50" r="4" fill="#343a40" />
      `;
    } else if (type === 'duallys') {
      // Double wide commercial dual wheels
      return `
        <rect x="22" y="24" width="22" height="52" rx="6" fill="#1c1f26" stroke="#12121c" stroke-width="2.5" />
        <rect x="52" y="24" width="22" height="52" rx="6" fill="#1c1f26" stroke="#12121c" stroke-width="2.5" />
        <rect x="36" y="44" width="26" height="12" fill="#495057" stroke="#12121c" stroke-width="2" />
        <circle cx="63" cy="50" r="6" fill="#ffbe0b" stroke="#12121c" stroke-width="1.8" />
      `;
    } else {
      // Skinny Vintage Firestones with red steelies
      return `
        <circle cx="50" cy="50" r="34" fill="#212529" stroke="#12121c" stroke-width="3" />
        <circle cx="50" cy="50" r="20" fill="#dc3545" stroke="#12121c" stroke-width="2" />
        <circle cx="50" cy="50" r="8" fill="#ced4da" stroke="#12121c" stroke-width="1.8" />
      `;
    }
  },

  _ancillarySVG(part) {
    const type = part.type || 'lakester_pipes';
    if (type === 'beerkeg') {
      // Beer keg fuel tank with brass bung
      return `
        <rect x="25" y="32" width="50" height="36" rx="10" fill="#ced4da" stroke="#12121c" stroke-width="2.8" />
        <line x1="36" y1="32" x2="36" y2="68" stroke="#6c757d" stroke-width="2" />
        <line x1="64" y1="32" x2="64" y2="68" stroke="#6c757d" stroke-width="2" />
        <circle cx="50" cy="50" r="6" fill="#ffbe0b" stroke="#12121c" stroke-width="2" />
      `;
    } else if (type === 'tractor_rad') {
      // Massive farm tractor radiator
      return `
        <rect x="24" y="20" width="52" height="60" rx="4" fill="#3b5a45" stroke="#12121c" stroke-width="2.8" />
        <rect x="30" y="30" width="40" height="42" fill="#d4a373" stroke="#12121c" stroke-width="2" />
        <!-- Mesh lines -->
        <line x1="30" y1="38" x2="70" y2="38" stroke="#12121c" stroke-width="1" />
        <line x1="30" y1="46" x2="70" y2="46" stroke="#12121c" stroke-width="1" />
        <line x1="30" y1="54" x2="70" y2="54" stroke="#12121c" stroke-width="1" />
        <line x1="30" y1="62" x2="70" y2="62" stroke="#12121c" stroke-width="1" />
        <rect x="45" y="14" width="10" height="7" rx="2" fill="#ffd166" stroke="#12121c" stroke-width="2" />
      `;
    } else if (type === 'lead_ballast') {
      // Lead ballast weight block with stamped weight
      return `
        <rect x="22" y="36" width="56" height="32" rx="3" fill="#6c757d" stroke="#12121c" stroke-width="2.8" />
        <text x="50" y="58" font-size="14" font-family="monospace" font-weight="900" fill="#ffd166" text-anchor="middle">90 KG</text>
        <circle cx="28" cy="42" r="3" fill="#222" />
        <circle cx="72" cy="42" r="3" fill="#222" />
      `;
    } else if (type === 'belt_siren') {
      // Exposed siren horn with belt pulley
      return `
        <path d="M 35 40 L 72 26 L 72 74 L 35 60 Z" fill="#dc3545" stroke="#12121c" stroke-width="2.8" />
        <ellipse cx="72" cy="50" rx="6" ry="24" fill="#ffbe0b" stroke="#12121c" stroke-width="2" />
        <circle cx="28" cy="50" r="10" fill="#2b2d42" stroke="#12121c" stroke-width="2.5" />
      `;
    } else {
      // Lakester pipes with open dumps
      return `
        <path d="M 20 62 L 50 62 L 78 40" stroke="#ced4da" stroke-width="9" stroke-linecap="round" fill="none" />
        <path d="M 20 62 L 50 62 L 78 40" stroke="#12121c" stroke-width="2" stroke-linecap="round" fill="none" />
        <ellipse cx="78" cy="40" rx="5" ry="7" fill="#ffbe0b" stroke="#12121c" stroke-width="2" />
        <path d="M 78 35 Q 86 25 80 18" stroke="#ff5500" stroke-width="3" stroke-linecap="round" fill="none" />
      `;
    }
  }
};

window.RAT_ROD_ASSETS = RAT_ROD_ASSETS;
window.TRACK_ENVIRONMENTS = TRACK_ENVIRONMENTS;
window.RatRodSVG = RatRodSVG;
