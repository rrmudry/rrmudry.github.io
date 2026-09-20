/**
 * Rat Rod Racers - Modular Asset & Rendering Pipeline
 * "Cute Rat Rod Vibe" - Whimsical, rusty, charming, exposed blowers,
 * bouncing flapper caps, fat slicks, flaming zoomies, and modular SVG/Canvas graphics.
 */

const RAT_ROD_ASSETS = {
  // 1. CHASSIS / FRAMES
  chassis: {
    roadster_32: {
      id: 'roadster_32',
      name: "'32 Highboy Roadster",
      category: 'chassis',
      rarity: 'common',
      mass: 550,
      cdA: 0.38,
      lore: "A classic chopped open-cockpit roadster with exposed frame rails and rusty chrome cowl.",
      color: '#a04822',
      accent: '#d48834',
      renderType: 'roadster'
    },
    scrappy_pickup: {
      id: 'scrappy_pickup',
      name: "'48 Scrappy Step-Side",
      category: 'chassis',
      rarity: 'common',
      mass: 680,
      cdA: 0.44,
      lore: "Bolted together from old barn tin and weathered oak bed planks. High mass, solid bite.",
      color: '#3b5a45',
      accent: '#8b6f47',
      renderType: 'pickup'
    },
    bubbly_bug: {
      id: 'bubbly_bug',
      name: "'63 Bubbly Buggy",
      category: 'chassis',
      rarity: 'rare',
      mass: 420,
      cdA: 0.32,
      lore: "Curved beetle shell with chopped fenders and playful round lines. Ultra-lightweight flyer!",
      color: '#348aa7',
      accent: '#e0a96d',
      renderType: 'buggy'
    },
    iron_coffin: {
      id: 'iron_coffin',
      name: "The Iron Coffin Dragster",
      category: 'chassis',
      rarity: 'epic',
      mass: 380,
      cdA: 0.26,
      lore: "Long-wheelbase vintage rail tube chassis. Minimal frontal area slices through air like a knife.",
      color: '#2b2d42',
      accent: '#ef233c',
      renderType: 'dragster'
    },
    milk_truck: {
      id: 'milk_truck',
      name: "'51 Milk Truck Gasser",
      category: 'chassis',
      rarity: 'rare',
      mass: 720,
      cdA: 0.48,
      lore: "Nose-high vintage delivery van. Heavy iron body gives massive rear traction off the launch.",
      color: '#d6cfc7',
      accent: '#c94a29',
      renderType: 'milktruck'
    },
    bone_shaker: {
      id: 'bone_shaker',
      name: "The Bone-Shaker Coupe",
      category: 'chassis',
      rarity: 'legendary',
      mass: 480,
      cdA: 0.30,
      lore: "Forged from scrap iron with a grinning radiator face and brass-riveted roof. Pure rat rod royalty.",
      color: '#1a1a24',
      accent: '#fca311',
      renderType: 'boneshaker'
    }
  },

  // 2. ENGINES / POWERPLANTS
  engines: {
    lawnmower_twin: {
      id: 'lawnmower_twin',
      name: "Junkyard Twin Spitter",
      category: 'engines',
      rarity: 'common',
      mass: 65,
      peakForce: 1200,
      powerBand: 0.9,
      lore: "Pulled from an old ride-on mower. Sputters, pops, but surprisingly peppy for a shoestring budget.",
      type: 'twin'
    },
    flathead_v8: {
      id: 'flathead_v8',
      name: "Rusty Flathead V8",
      category: 'engines',
      rarity: 'common',
      mass: 190,
      peakForce: 2400,
      powerBand: 1.0,
      lore: "Cast iron Detroit heritage with twin Stromberg carbs and copper coolant tubes.",
      type: 'flathead'
    },
    junkyard_turbo: {
      id: 'junkyard_turbo',
      name: "Whistling Junkyard Turbo-6",
      category: 'engines',
      rarity: 'rare',
      mass: 140,
      peakForce: 3100,
      powerBand: 1.1,
      lore: "Spools up with a ferocious high-pitched whistle. Lightweight block with big boost.",
      type: 'turbo'
    },
    blown_blower: {
      id: 'blown_blower',
      name: "Blown Blower Monster 427",
      category: 'engines',
      rarity: 'epic',
      mass: 250,
      peakForce: 4200,
      powerBand: 1.25,
      lore: "Massive 6-71 Roots blower with animated red butterfly scoop flaps and a whining gilmer belt!",
      type: 'blower'
    },
    electric_arc: {
      id: 'electric_arc',
      name: "Tesla Arc Spark-Plant",
      category: 'engines',
      rarity: 'epic',
      mass: 170,
      peakForce: 3800,
      powerBand: 1.35,
      lore: "Coils hum with static electricity. Delivers instant full-torque thrust from zero RPM!",
      type: 'electric'
    },
    nitrous_beast: {
      id: 'nitrous_beast',
      name: "Fire-Breathing Nitrous Big-Block",
      category: 'engines',
      rarity: 'legendary',
      mass: 280,
      peakForce: 5400,
      powerBand: 1.4,
      nitroBoost: 1800,
      nitroDuration: 3.5,
      lore: "Braided stainless lines plumbed into an iron mountain. Press NITRO for explosive jet-thrust!",
      type: 'nitrous'
    }
  },

  // 3. WHEELS & TIRES
  wheels: {
    wire_spokes: {
      id: 'wire_spokes',
      name: "Vintage Wire Spokes",
      category: 'wheels',
      rarity: 'common',
      mass: 28,
      mu: 0.72,
      lore: "Delicate bicycle-style spoke wheels. Low mass, but will break traction under heavy throttle.",
      type: 'spokes'
    },
    rusty_steelies: {
      id: 'rusty_steelies',
      name: "Rusty Solid Steelies",
      category: 'wheels',
      rarity: 'common',
      mass: 42,
      mu: 0.84,
      lore: "Classic stamped iron wheels with surface rust patina. Dependable everyday grip.",
      type: 'steelies'
    },
    whitewall_cruisers: {
      id: 'whitewall_cruisers',
      name: "Retro Whitewall Cruisers",
      category: 'wheels',
      rarity: 'rare',
      mass: 38,
      mu: 0.90,
      lore: "Glossy painted red rims wrapped in pristine wide white-wall rubber. Stylish and balanced.",
      type: 'whitewalls'
    },
    mud_boggers: {
      id: 'mud_boggers',
      name: "Scrapyard Knobby Boggers",
      category: 'wheels',
      rarity: 'rare',
      mass: 64,
      mu: 0.98,
      lore: "Heavy deep-tread tractor rubber. Grips like glue on launch, though rolling mass is high.",
      type: 'knobby'
    },
    fat_drag_slicks: {
      id: 'fat_drag_slicks',
      name: "Fat Drag Slicks (Mickey Thoms)",
      category: 'wheels',
      rarity: 'epic',
      mass: 46,
      mu: 1.15,
      lore: "Massive wrinkle-wall racing slicks with bold white lettering. Huge static grip prevents burnout!",
      type: 'slicks'
    },
    gold_racing_mags: {
      id: 'gold_racing_mags',
      name: "Gold Star Forged Alloys",
      category: 'wheels',
      rarity: 'legendary',
      mass: 24,
      mu: 1.25,
      lore: "Ultra-lightweight forged magnesium wheels with sticky competition compound rubber.",
      type: 'goldmags'
    }
  },

  // 4. AERO & SPOILERS
  aero: {
    clean_bobtail: {
      id: 'clean_bobtail',
      name: "Clean Bobtail (No Wing)",
      category: 'aero',
      rarity: 'common',
      mass: 0,
      cdA: 0.0,
      lore: "Pure classic hot rod simplicity. Zero added weight, standard air resistance.",
      type: 'none'
    },
    iron_ducktail: {
      id: 'iron_ducktail',
      name: "Rusty Iron Ducktail",
      category: 'aero',
      rarity: 'common',
      mass: 8,
      cdA: -0.02,
      lore: "Curved sheet metal lip riveted to the deck. Smooths rear turbulence slightly.",
      type: 'ducktail'
    },
    highway_sign: {
      id: 'highway_sign',
      name: "Salvaged 'Speed Limit 25' Wing",
      category: 'aero',
      rarity: 'rare',
      mass: 12,
      cdA: -0.03,
      lore: "Bent yellow aluminum highway sign bolted to scrap struts. Adorable and functional downforce!",
      type: 'highwaysign'
    },
    plywood_airdam: {
      id: 'plywood_airdam',
      name: "Scrap Plywood Front Air Dam",
      category: 'aero',
      rarity: 'rare',
      mass: 14,
      cdA: -0.04,
      lore: "Low-slung front plywood blade keeps air from lifting the front wheels at high speeds.",
      type: 'airdam'
    },
    dual_blade_wing: {
      id: 'dual_blade_wing',
      name: "Dual-Blade Aluminum Drag Wing",
      category: 'aero',
      rarity: 'epic',
      mass: 16,
      cdA: -0.06,
      lore: "Wind-tunnel shaped aluminum wing with turnbuckle tensioners. Slices high-speed air drag.",
      type: 'dragwing'
    },
    roof_chopper_wing: {
      id: 'roof_chopper_wing',
      name: "Sprint-Car Roof Chopper",
      category: 'aero',
      rarity: 'legendary',
      mass: 20,
      cdA: -0.09,
      lore: "Giant towering top wing mounted over the cab. Maximum high-speed downforce and aerodynamic slicing.",
      type: 'roofwing'
    }
  },

  // 5. EXHAUST SYSTEMS
  exhaust: {
    rusty_pipe: {
      id: 'rusty_pipe',
      name: "Straight Rusty Tailpipe",
      category: 'exhaust',
      rarity: 'common',
      mass: 6,
      lore: "A simple rusty iron pipe extending out the back. Sputters with authentic rat rod attitude.",
      type: 'straight'
    },
    flapper_stacks: {
      id: 'flapper_stacks',
      name: "Twin Stacks with Bouncing Flappers",
      category: 'exhaust',
      rarity: 'rare',
      mass: 12,
      lore: "Tractor-style vertical stacks with hinged rain caps that bounce open rhythmically with exhaust pulses!",
      type: 'flappers'
    },
    chrome_lake_pipes: {
      id: 'chrome_lake_pipes',
      name: "Chrome Rocker Lake Pipes",
      category: 'exhaust',
      rarity: 'rare',
      mass: 14,
      lore: "Low chrome pipes running the full length of the frame. Produces a deep, throaty rumble.",
      type: 'lakepipes'
    },
    cherry_glasspacks: {
      id: 'cherry_glasspacks',
      name: "Dual Cherry Bomb Glasspacks",
      category: 'exhaust',
      rarity: 'rare',
      mass: 10,
      lore: "Cherry red resonator mufflers that crackle and pop on deceleration with visible sparks.",
      type: 'glasspacks'
    },
    flaming_zoomies: {
      id: 'flaming_zoomies',
      name: "Four-Into-One Flaming Zoomies",
      category: 'exhaust',
      rarity: 'epic',
      mass: 16,
      lore: "Swept-up dragster header pipes shooting bright orange flame jets and smoke rings on full throttle!",
      type: 'zoomies'
    },
    nitrous_purge_horns: {
      id: 'nitrous_purge_horns',
      name: "Twin Nitrous Purge Stacks",
      category: 'exhaust',
      rarity: 'legendary',
      mass: 18,
      lore: "Vents high-pressure frosty white nitrous plumes into the sky before shooting massive blue exhaust flames!",
      type: 'purgehorns'
    }
  },

  // 6. CHARMS & DECALS
  charms: {
    fuzzy_dice: {
      id: 'fuzzy_dice',
      name: "Bouncing Fuzzy Mirror Dice",
      category: 'charms',
      rarity: 'common',
      mass: 0.2,
      lore: "Plush polka-dot dice hanging from the rearview mirror that swing back dynamically with acceleration!",
      type: 'dice'
    },
    rust_rivets: {
      id: 'rust_rivets',
      name: "Patchwork Rust & Brass Rivets",
      category: 'charms',
      rarity: 'common',
      mass: 2,
      lore: "Industrial weathered plates and brass dome rivets for maximum authentic rat rod grit.",
      type: 'rivets'
    },
    hot_rod_flames: {
      id: 'hot_rod_flames',
      name: "Sunset Hot Rod Flames",
      category: 'charms',
      rarity: 'rare',
      mass: 0,
      lore: "Hand-painted classic yellow-to-red flame licks streaming across the hood and doors.",
      type: 'flames'
    },
    lucky_seven: {
      id: 'lucky_seven',
      name: "Lucky No. 7 Race Roundel",
      category: 'charms',
      rarity: 'rare',
      mass: 0,
      lore: "Vintage distressed circular racing number. Adds +100 to intimidation and style points.",
      type: 'seven'
    },
    skull_mascot: {
      id: 'skull_mascot',
      name: "Flaming Skull Hood Mascot",
      category: 'charms',
      rarity: 'epic',
      mass: 3,
      lore: "Cast iron winged skull mascot perched right atop the radiator shell with glowing red gem eyes.",
      type: 'skull'
    },
    shark_mouth: {
      id: 'shark_mouth',
      name: "Flying Tiger Shark-Teeth Grille",
      category: 'charms',
      rarity: 'legendary',
      mass: 0,
      lore: "WWII fighter nose art painted on the radiator shell. Grinning sharp teeth ready to eat the asphalt!",
      type: 'shark'
    }
  }
};

/**
 * Procedural SVG Generator for Parts and Assembled Cars
 */
const RatRodSVG = {
  // Get SVG markup for a single part card / icon
  getPartSVG(part, size = 120) {
    if (!part) return '';
    const cat = part.category;
    let content = '';

    switch (cat) {
      case 'chassis':
        content = this._chassisSVG(part);
        break;
      case 'engines':
        content = this._engineSVG(part);
        break;
      case 'wheels':
        content = this._wheelSVG(part);
        break;
      case 'aero':
        content = this._aeroSVG(part);
        break;
      case 'exhaust':
        content = this._exhaustSVG(part);
        break;
      case 'charms':
        content = this._charmSVG(part);
        break;
      default:
        content = `<rect width="100" height="100" fill="#333" rx="8"/>`;
    }

    return `
      <svg viewBox="0 0 160 110" width="${size}" height="${Math.round(size * 0.6875)}" xmlns="http://www.w3.org/2000/svg" class="part-svg part-${part.rarity}">
        <defs>
          <filter id="glow-${part.id}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
          </filter>
        </defs>
        ${content}
      </svg>
    `;
  },

  _chassisSVG(part) {
    const col = part.color || '#a04822';
    const acc = part.accent || '#d48834';
    const darkCol = '#1a1a24';

    switch (part.renderType) {
      case 'pickup':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Boxed Frame Rail with Lightening Holes -->
            <rect x="12" y="70" width="136" height="10" rx="2" fill="#22232e" stroke="#12121c" stroke-width="2.4"/>
            <circle cx="40" cy="75" r="2.8" fill="#0d0e14" stroke="#495057" stroke-width="0.8"/>
            <circle cx="75" cy="75" r="2.8" fill="#0d0e14" stroke="#495057" stroke-width="0.8"/>
            <circle cx="110" cy="75" r="2.8" fill="#0d0e14" stroke="#495057" stroke-width="0.8"/>

            <!-- Wooden Slat Stake Bed -->
            <rect x="16" y="48" width="28" height="22" fill="#8a5a36" stroke="#12121c" stroke-width="2.4"/>
            <line x1="16" y1="55" x2="44" y2="55" stroke="#3e2411" stroke-width="1.6"/>
            <line x1="16" y1="62" x2="44" y2="62" stroke="#3e2411" stroke-width="1.6"/>
            <rect x="14" y="42" width="32" height="6" rx="1" fill="${acc}" stroke="#12121c" stroke-width="2.0"/>

            <!-- Cab Body with Cel Shading -->
            <path d="M 44 70 L 44 38 Q 54 22 84 22 L 92 22 Q 98 22 102 38 L 106 70 Z" fill="${col}" stroke="#12121c" stroke-width="2.8" stroke-linejoin="round"/>
            <!-- Lower Cab Shadow -->
            <path d="M 44 70 L 44 56 Q 75 60 106 58 L 106 70 Z" fill="rgba(0,0,0,0.3)"/>
            <!-- Gloss highlight -->
            <path d="M 56 25 L 82 25" stroke="rgba(255,255,255,0.75)" stroke-width="2.2" stroke-linecap="round"/>
            <!-- Visor -->
            <rect x="74" y="24" width="24" height="4" rx="1" fill="${acc}" stroke="#12121c" stroke-width="1.6"/>

            <!-- Chopped Windshield with Comic Glare -->
            <rect x="52" y="32" width="34" height="14" fill="#12121c"/>
            <rect x="54" y="33" width="30" height="12" fill="#a2d2ff"/>
            <line x1="58" y1="43" x2="66" y2="34" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
            <line x1="68" y1="43" x2="76" y2="34" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>

            <!-- Hood & Radiator -->
            <rect x="104" y="46" width="30" height="24" fill="${col}" stroke="#12121c" stroke-width="2.6"/>
            <rect x="132" y="42" width="8" height="28" rx="2" fill="#ced4da" stroke="#12121c" stroke-width="2.2"/>
            <!-- Bullet Headlamp with Yellow Glow -->
            <circle cx="136" cy="40" r="5.5" fill="#ced4da" stroke="#12121c" stroke-width="2"/>
            <circle cx="136" cy="40" r="3.5" fill="#ffea79"/>
            <circle cx="134" cy="38" r="1.2" fill="#fff"/>
          </g>
        `;
      case 'buggy':
        return `
          <g filter="url(#glow-${part.id})">
            <rect x="15" y="70" width="130" height="10" rx="2" fill="#22232e" stroke="#12121c" stroke-width="2.4"/>
            <!-- Curved Beetle Dome -->
            <path d="M 28 70 Q 38 20 80 20 Q 122 20 134 70 Z" fill="${col}" stroke="#12121c" stroke-width="2.8" stroke-linejoin="round"/>
            <path d="M 28 70 Q 55 52 134 70 Z" fill="rgba(0,0,0,0.3)"/>
            <path d="M 52 23 Q 80 22 105 23" stroke="rgba(255,255,255,0.75)" stroke-width="2.4" stroke-linecap="round" fill="none"/>
            <!-- Split Bubble Windows -->
            <path d="M 44 48 A 13 13 0 0 1 70 48 Z" fill="#a2d2ff" stroke="#12121c" stroke-width="2"/>
            <path d="M 74 48 A 13 13 0 0 1 100 48 Z" fill="#a2d2ff" stroke="#12121c" stroke-width="2"/>
            <line x1="48" y1="46" x2="56" y2="38" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"/>
            <line x1="78" y1="46" x2="86" y2="38" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"/>
            <!-- Bug Eyes -->
            <circle cx="132" cy="54" r="6.5" fill="#ced4da" stroke="#12121c" stroke-width="2.2"/>
            <circle cx="132" cy="54" r="4.2" fill="#ffea79"/>
            <circle cx="130" cy="52" r="1.5" fill="#fff"/>
          </g>
        `;
      case 'dragster':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Orange Tubular Rail Frame -->
            <line x1="12" y1="72" x2="148" y2="72" stroke="#fca311" stroke-width="5" stroke-linecap="round"/>
            <line x1="12" y1="72" x2="148" y2="72" stroke="#12121c" stroke-width="2" stroke-linecap="round"/>
            <!-- Roll cage -->
            <path d="M 24 70 L 34 32 L 52 32 L 60 70" stroke="#e0e1dd" stroke-width="4" stroke-linejoin="round" fill="none"/>
            <path d="M 24 70 L 34 32 L 52 32 L 60 70" stroke="#12121c" stroke-width="2" stroke-linejoin="round" fill="none"/>
            <!-- Driver Helmet -->
            <circle cx="44" cy="45" r="7" fill="#dc3545" stroke="#12121c" stroke-width="2"/>
            <line x1="44" y1="45" x2="50" y2="45" stroke="#111" stroke-width="2"/>
            <!-- Pointed Alloy Nose with Heat Bluing -->
            <polygon points="112,62 148,72 112,76" fill="${col}" stroke="#12121c" stroke-width="2.4"/>
            <polygon points="132,68 148,72 132,74" fill="#00b4d8" opacity="0.6"/>
          </g>
        `;
      case 'milktruck':
        return `
          <g filter="url(#glow-${part.id})">
            <rect x="15" y="70" width="130" height="10" rx="2" fill="#22232e" stroke="#12121c" stroke-width="2.4"/>
            <!-- Gasser Delivery Body -->
            <path d="M 20 70 L 20 25 Q 20 18 30 18 L 96 18 L 104 46 L 134 50 L 136 70 Z" fill="${col}" stroke="#12121c" stroke-width="2.8" stroke-linejoin="round"/>
            <rect x="20" y="52" width="116" height="18" fill="rgba(0,0,0,0.3)"/>
            <line x1="32" y1="21" x2="90" y2="21" stroke="rgba(255,255,255,0.75)" stroke-width="2.2" stroke-linecap="round"/>
            <!-- Visor -->
            <rect x="85" y="22" width="22" height="4" rx="1" fill="${acc}" stroke="#12121c" stroke-width="1.6"/>
            <!-- Windshield -->
            <rect x="92" y="26" width="14" height="18" fill="#a2d2ff" stroke="#12121c" stroke-width="1.8"/>
            <line x1="94" y1="40" x2="102" y2="28" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"/>
            <!-- Milk Emblem -->
            <circle cx="55" cy="38" r="9" fill="#fff" stroke="#12121c" stroke-width="1.6"/>
            <text x="55" y="41" font-size="7" font-weight="900" text-anchor="middle" fill="#0d6efd">MILK</text>
            <!-- Gasser Nose -->
            <rect x="132" y="48" width="8" height="22" rx="2" fill="#ced4da" stroke="#12121c" stroke-width="2"/>
          </g>
        `;
      case 'boneshaker':
        return `
          <g filter="url(#glow-${part.id})">
            <rect x="15" y="70" width="130" height="10" rx="2" fill="#181822" stroke="#12121c" stroke-width="2.4"/>
            <!-- Bone Shaker Coupe Body -->
            <path d="M 32 70 L 32 44 L 60 25 L 94 25 L 102 48 L 130 52 L 132 70 Z" fill="${col}" stroke="#12121c" stroke-width="2.8" stroke-linejoin="round"/>
            <rect x="32" y="54" width="100" height="16" fill="rgba(0,0,0,0.35)"/>
            <line x1="62" y1="27" x2="92" y2="27" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round"/>
            <!-- Amber Slit Windshield -->
            <polygon points="64,30 92,30 96,44 64,44" fill="#ffbe0b" stroke="#12121c" stroke-width="1.8"/>
            <line x1="68" y1="40" x2="76" y2="33" stroke="rgba(255,255,255,0.9)" stroke-width="1.6"/>
            <!-- Brass Rivets -->
            <circle cx="42" cy="44" r="1.5" fill="#fca311"/>
            <circle cx="52" cy="35" r="1.5" fill="#fca311"/>
            <circle cx="78" cy="27" r="1.5" fill="#fca311"/>
            <!-- 3D Cartoon Skull Radiator Grille -->
            <circle cx="132" cy="56" r="8" fill="#f8f9fa" stroke="#12121c" stroke-width="2.2"/>
            <rect x="128" y="60" width="8" height="6" fill="#f8f9fa" stroke="#12121c" stroke-width="2"/>
            <circle cx="130" cy="55" r="2" fill="#12121c"/>
            <circle cx="134" cy="55" r="2" fill="#12121c"/>
            <rect x="129" y="62" width="1.5" height="3" fill="#12121c"/>
            <rect x="132" y="62" width="1.5" height="3" fill="#12121c"/>
            <rect x="135" y="62" width="1.5" height="3" fill="#12121c"/>
          </g>
        `;
      default: // roadster_32
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Boxed Frame Rail with Lightening Holes -->
            <rect x="12" y="70" width="136" height="10" rx="2" fill="#22232e" stroke="#12121c" stroke-width="2.4"/>
            <circle cx="40" cy="75" r="2.8" fill="#0d0e14" stroke="#495057" stroke-width="0.8"/>
            <circle cx="75" cy="75" r="2.8" fill="#0d0e14" stroke="#495057" stroke-width="0.8"/>
            <circle cx="110" cy="75" r="2.8" fill="#0d0e14" stroke="#495057" stroke-width="0.8"/>
            <!-- Roadster Cab -->
            <path d="M 36 70 L 36 42 Q 48 30 78 30 L 88 30 Q 96 30 102 46 L 130 50 L 132 70 Z" fill="${col}" stroke="#12121c" stroke-width="2.8" stroke-linejoin="round"/>
            <path d="M 36 70 L 36 54 Q 75 58 132 58 L 132 70 Z" fill="rgba(0,0,0,0.3)"/>
            <line x1="48" y1="32" x2="84" y2="32" stroke="rgba(255,255,255,0.75)" stroke-width="2.2" stroke-linecap="round"/>
            <!-- Framed Windshield with Glare -->
            <polygon points="84,30 96,14 100,14 98,30" fill="#a2d2ff" stroke="#12121c" stroke-width="2.2"/>
            <line x1="88" y1="26" x2="96" y2="16" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"/>
            <!-- Chrome Radiator Grille -->
            <rect x="130" y="44" width="8" height="26" rx="2" fill="#ced4da" stroke="#12121c" stroke-width="2.2"/>
            <line x1="132" y1="48" x2="136" y2="48" stroke="#12121c" stroke-width="1.5"/>
            <line x1="132" y1="54" x2="136" y2="54" stroke="#12121c" stroke-width="1.5"/>
            <line x1="132" y1="60" x2="136" y2="60" stroke="#12121c" stroke-width="1.5"/>
            <!-- Radiator Cap Glint -->
            <circle cx="134" cy="42" r="2.5" fill="#f8f9fa"/>
          </g>
        `;
    }
  },

  _engineSVG(part) {
    switch (part.type) {
      case 'twin':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Lawnmower Twin: Cooling fins, pull start & round air cleaner -->
            <rect x="42" y="45" width="48" height="40" rx="4" fill="#495057" stroke="#12121c" stroke-width="2.4"/>
            <!-- Cooling fins -->
            <line x1="46" y1="52" x2="86" y2="52" stroke="#ced4da" stroke-width="2"/>
            <line x1="46" y1="58" x2="86" y2="58" stroke="#ced4da" stroke-width="2"/>
            <line x1="46" y1="64" x2="86" y2="64" stroke="#ced4da" stroke-width="2"/>
            <!-- Pull start shroud -->
            <circle cx="66" cy="72" r="11" fill="#dc3545" stroke="#12121c" stroke-width="2"/>
            <circle cx="66" cy="72" r="4.5" fill="#12121c"/>
            <!-- Round teardrop air cleaner -->
            <circle cx="98" cy="48" r="10" fill="#ced4da" stroke="#12121c" stroke-width="2.2"/>
            <!-- Spark Plug with wire -->
            <rect x="76" y="32" width="6" height="13" fill="#f8f9fa" stroke="#12121c" stroke-width="1.5"/>
            <circle cx="79" cy="30" r="3" fill="#ffd166"/>
          </g>
        `;
      case 'blower':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- 6-71 Supercharger: Ribbed aluminum casing, toothed belt & red scoop -->
            <polygon points="35,85 120,85 114,56 42,56" fill="#343a40" stroke="#12121c" stroke-width="2.6"/>
            <!-- Supercharger Casing with Ribs -->
            <rect x="48" y="36" width="64" height="24" rx="3" fill="#d0d5dd" stroke="#12121c" stroke-width="2.4"/>
            <line x1="48" y1="42" x2="112" y2="42" stroke="#98a2b3" stroke-width="2"/>
            <line x1="48" y1="48" x2="112" y2="48" stroke="#98a2b3" stroke-width="2"/>
            <line x1="48" y1="54" x2="112" y2="54" stroke="#98a2b3" stroke-width="2"/>

            <!-- Toothed Gilmer Belt & Pulleys -->
            <rect x="110" y="40" width="10" height="38" rx="2" fill="#14141d" stroke="#12121c" stroke-width="2"/>
            <circle cx="115" cy="46" r="8" fill="#ced4da" stroke="#12121c" stroke-width="2"/>
            <circle cx="115" cy="72" r="10" fill="#ced4da" stroke="#12121c" stroke-width="2"/>

            <!-- Aggressive Red Scoop -->
            <path d="M 44 36 L 36 12 L 102 12 L 94 36 Z" fill="#e63946" stroke="#12121c" stroke-width="2.6" stroke-linejoin="round"/>
            <rect x="40" y="14" width="58" height="6" fill="#12121c"/>
            <!-- Dual Gold Butterfly Valves -->
            <ellipse cx="54" cy="22" rx="5" ry="7" fill="#ffbe0b" stroke="#d48834" stroke-width="1.8"/>
            <ellipse cx="72" cy="22" rx="5" ry="7" fill="#ffbe0b" stroke="#d48834" stroke-width="1.8"/>
            <ellipse cx="90" cy="22" rx="5" ry="7" fill="#ffbe0b" stroke="#d48834" stroke-width="1.8"/>
          </g>
        `;
      case 'turbo':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- V6 Block -->
            <rect x="42" y="55" width="70" height="30" rx="4" fill="#343a40" stroke="#12121c" stroke-width="2.4"/>
            <!-- Snail Compressor Housing -->
            <circle cx="95" cy="46" r="16" fill="#ced4da" stroke="#12121c" stroke-width="2.6"/>
            <!-- Spiral inking -->
            <path d="M 95 38 A 8 8 0 1 1 88 50" stroke="#495057" stroke-width="2.5" fill="none"/>
            <circle cx="95" cy="46" r="6" fill="#12121c"/>

            <!-- High-Flow Blue Cone Filter -->
            <polygon points="112,42 142,30 142,62" fill="#0d6efd" stroke="#12121c" stroke-width="2.4"/>
            <line x1="116" y1="41" x2="138" y2="34" stroke="#0a58ca" stroke-width="1.8"/>
            <line x1="116" y1="46" x2="138" y2="46" stroke="#0a58ca" stroke-width="1.8"/>
            <line x1="116" y1="51" x2="138" y2="58" stroke="#0a58ca" stroke-width="1.8"/>
            <!-- Chrome Clamp -->
            <rect x="108" y="38" width="5" height="16" rx="1" fill="#ced4da" stroke="#12121c" stroke-width="1.5"/>
          </g>
        `;
      case 'electric':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Battery Cell Block with Hazard Stripes -->
            <rect x="38" y="50" width="80" height="36" rx="5" fill="#1b263b" stroke="#12121c" stroke-width="2.4"/>
            <rect x="42" y="74" width="72" height="6" fill="#ffbe0b"/>
            <!-- Copper Bus Bars with Bolts -->
            <rect x="52" y="32" width="14" height="22" rx="2" fill="#b87333" stroke="#12121c" stroke-width="2"/>
            <rect x="76" y="32" width="14" height="22" rx="2" fill="#b87333" stroke="#12121c" stroke-width="2"/>
            <circle cx="59" cy="38" r="2" fill="#ffd166"/>
            <circle cx="83" cy="38" r="2" fill="#ffd166"/>
            <!-- Crackling Cyan Comic Lightning Bolt -->
            <path d="M 58 24 L 66 36 L 72 20 L 80 34 L 92 18" stroke="#00f0ff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M 58 24 L 66 36 L 72 20 L 80 34 L 92 18" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </g>
        `;
      case 'nitrous':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Big Block -->
            <polygon points="38,85 120,85 114,48 44,48" fill="#212529" stroke="#12121c" stroke-width="2.6"/>
            <!-- Triple Gold Velocity Stacks -->
            <path d="M 56 48 L 52 20 L 66 20 L 62 48 Z" fill="#ffbe0b" stroke="#12121c" stroke-width="2.2"/>
            <ellipse cx="59" cy="20" rx="6" ry="2" fill="#dc3545"/>
            <path d="M 74 48 L 70 20 L 84 20 L 80 48 Z" fill="#ffbe0b" stroke="#12121c" stroke-width="2.2"/>
            <ellipse cx="77" cy="20" rx="6" ry="2" fill="#dc3545"/>
            <path d="M 92 48 L 88 20 L 102 20 L 98 48 Z" fill="#ffbe0b" stroke="#12121c" stroke-width="2.2"/>
            <ellipse cx="95" cy="20" rx="6" ry="2" fill="#dc3545"/>

            <!-- Glossy Blue Nitrous Bottle with Gauge -->
            <rect x="16" y="38" width="18" height="44" rx="6" fill="#0077b6" stroke="#12121c" stroke-width="2.4"/>
            <rect x="21" y="32" width="8" height="7" rx="2" fill="#ced4da" stroke="#12121c" stroke-width="1.8"/>
            <circle cx="25" cy="46" r="4.5" fill="#f8f9fa" stroke="#12121c" stroke-width="1.5"/>
            <line x1="25" y1="46" x2="27" y2="44" stroke="#dc3545" stroke-width="1.5"/>
          </g>
        `;
      default: // flathead_v8
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Cast Iron V8 Block -->
            <polygon points="40,85 115,85 110,50 45,50" fill="#6c584c" stroke="#12121c" stroke-width="2.6"/>
            <!-- Finned Edelbrock Heads -->
            <rect x="46" y="42" width="60" height="10" rx="2" fill="#ced4da" stroke="#12121c" stroke-width="2"/>
            <!-- Twin Stromberg 97 Carbs with Velocity Horns -->
            <rect x="58" y="28" width="12" height="14" fill="#adc178" stroke="#12121c" stroke-width="2"/>
            <circle cx="64" cy="24" r="5" fill="#ffd166" stroke="#12121c" stroke-width="1.8"/>
            <rect x="80" y="28" width="12" height="14" fill="#adc178" stroke="#12121c" stroke-width="2"/>
            <circle cx="86" cy="24" r="5" fill="#ffd166" stroke="#12121c" stroke-width="1.8"/>
            <!-- Coolant Tube -->
            <path d="M 52 48 Q 74 38 98 48" stroke="#b87333" stroke-width="4" stroke-linecap="round" fill="none"/>
          </g>
        `;
    }
  },

  _wheelSVG(part) {
    const isSlick = part.type === 'slicks';
    const isMags = part.type === 'goldmags';
    const isWhite = part.type === 'whitewalls';
    const isKnobby = part.type === 'knobby';
    const isSpoke = part.type === 'spokes';

    return `
      <g filter="url(#glow-${part.id})">
        <!-- Chunky Comic Black Rubber Tire -->
        <circle cx="55" cy="55" r="42" fill="#161722" stroke="#12121c" stroke-width="3"/>
        
        <!-- Comic Outer Tread Notches -->
        <circle cx="55" cy="55" r="41" stroke="#0d0e14" stroke-width="3.5" stroke-dasharray="8,6" fill="none"/>

        <!-- Whitewall Ring or Slicks Sidewall -->
        ${isWhite ? `
          <circle cx="55" cy="55" r="33" fill="#f8f9fa" stroke="#12121c" stroke-width="2"/>
        ` : ''}

        ${isSlick ? `
          <path d="M 30 36 Q 55 22 80 36" stroke="rgba(255,255,255,0.9)" stroke-width="2.5" fill="none"/>
          <text x="55" y="32" font-size="6" font-weight="900" text-anchor="middle" fill="#ffd166">RAT ROD</text>
        ` : ''}

        <!-- Deep-Dish Rim with Inner Drop Shadow -->
        <circle cx="55" cy="55" r="25" fill="#101118"/>
        <circle cx="55" cy="55" r="23" fill="${isMags ? '#d4a373' : isWhite ? '#dc3545' : isSpoke ? '#ced4da' : '#495057'}" stroke="#12121c" stroke-width="2.2"/>

        ${isMags ? `
          <!-- 5-Spoke Gold Racing Mag -->
          <circle cx="55" cy="55" r="16" fill="#e9c46a"/>
          <circle cx="55" cy="55" r="7" fill="#101118"/>
        ` : ''}

        ${isSpoke ? `
          <!-- Wire Spokes -->
          <line x1="55" y1="34" x2="55" y2="76" stroke="#fff" stroke-width="1.8"/>
          <line x1="34" y1="55" x2="76" y2="55" stroke="#fff" stroke-width="1.8"/>
          <line x1="40" y1="40" x2="70" y2="70" stroke="#fff" stroke-width="1.8"/>
          <line x1="70" y1="40" x2="40" y2="70" stroke="#fff" stroke-width="1.8"/>
        ` : ''}

        <!-- Bullet Knock-Off Center Cap with Star Glint -->
        <circle cx="55" cy="55" r="8" fill="#f8f9fa" stroke="#12121c" stroke-width="1.8"/>
        <circle cx="53" cy="53" r="1.5" fill="#fff"/>

        <!-- Front Skinny Runner Wheel Preview -->
        <circle cx="125" cy="62" r="27" fill="#161722" stroke="#12121c" stroke-width="2.4"/>
        <circle cx="125" cy="62" r="26" stroke="#0d0e14" stroke-width="2.5" stroke-dasharray="6,4" fill="none"/>
        <circle cx="125" cy="62" r="15" fill="${isMags ? '#d4a373' : isWhite ? '#dc3545' : '#495057'}" stroke="#12121c" stroke-width="1.8"/>
        <circle cx="125" cy="62" r="5" fill="#f8f9fa" stroke="#12121c" stroke-width="1.4"/>
      </g>
    `;
  },

  _aeroSVG(part) {
    switch (part.type) {
      case 'highwaysign':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Steel Struts with Bolts -->
            <line x1="45" y1="85" x2="65" y2="30" stroke="#ced4da" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="45" y1="85" x2="65" y2="30" stroke="#12121c" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="95" y1="85" x2="85" y2="30" stroke="#ced4da" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="95" y1="85" x2="85" y2="30" stroke="#12121c" stroke-width="1.8" stroke-linecap="round"/>
            <!-- Bent Yellow Highway "25 MPH" Sign -->
            <polygon points="32,28 118,18 122,54 36,64" fill="#ffd166" stroke="#12121c" stroke-width="2.6" stroke-linejoin="round"/>
            <text x="44" y="44" font-size="9" font-weight="bold" fill="#12121c">SPEED</text>
            <text x="48" y="56" font-size="13" font-weight="900" fill="#12121c">25</text>
            <!-- Rust Streaks & Bolt Heads -->
            <circle cx="38" cy="34" r="2" fill="#ced4da" stroke="#12121c" stroke-width="1"/>
            <circle cx="114" cy="24" r="2" fill="#ced4da" stroke="#12121c" stroke-width="1"/>
          </g>
        `;
      case 'dragwing':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Sprint-Car Aluminum Dual Blade Drag Wing -->
            <line x1="35" y1="85" x2="65" y2="28" stroke="#6c757d" stroke-width="4"/>
            <line x1="35" y1="85" x2="65" y2="28" stroke="#12121c" stroke-width="1.8"/>
            <line x1="85" y1="85" x2="95" y2="28" stroke="#6c757d" stroke-width="4"/>
            <line x1="85" y1="85" x2="95" y2="28" stroke="#12121c" stroke-width="1.8"/>
            <!-- Spill Endplates -->
            <polygon points="50,18 124,14 128,52 54,56" fill="#ced4da" stroke="#12121c" stroke-width="2.6"/>
            <polygon points="40,24 114,20 118,58 44,62" fill="#495057" stroke="#12121c" stroke-width="2.6"/>
            <line x1="42" y1="36" x2="114" y2="32" stroke="#ffbe0b" stroke-width="3"/>
          </g>
        `;
      case 'roofwing':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Sprint-Car Top Roof Wing -->
            <polygon points="22,18 138,8 132,56 16,64" fill="#0077b6" stroke="#12121c" stroke-width="2.8" stroke-linejoin="round"/>
            <polygon points="32,16 128,10 124,50 24,56" fill="#0096c7"/>
            <text x="40" y="38" font-size="14" font-weight="900" fill="#ffffff">HOT ROD</text>
            <!-- Heavy Mounting Struts -->
            <line x1="48" y1="64" x2="48" y2="90" stroke="#ced4da" stroke-width="3.5"/>
            <line x1="48" y1="64" x2="48" y2="90" stroke="#12121c" stroke-width="1.8"/>
            <line x1="102" y1="60" x2="102" y2="90" stroke="#ced4da" stroke-width="3.5"/>
            <line x1="102" y1="60" x2="102" y2="90" stroke="#12121c" stroke-width="1.8"/>
          </g>
        `;
      case 'airdam':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Scrap Plywood Air Dam with Brackets -->
            <polygon points="20,62 140,62 130,86 30,86" fill="#8d6e63" stroke="#12121c" stroke-width="2.6"/>
            <!-- Stitched Pop Rivets -->
            <circle cx="45" cy="74" r="2.5" fill="#fca311" stroke="#12121c" stroke-width="1"/>
            <circle cx="80" cy="74" r="2.5" fill="#fca311" stroke="#12121c" stroke-width="1"/>
            <circle cx="115" cy="74" r="2.5" fill="#fca311" stroke="#12121c" stroke-width="1"/>
            <!-- Strut Rods -->
            <line x1="45" y1="36" x2="45" y2="62" stroke="#fca311" stroke-width="2.5"/>
            <line x1="115" y1="36" x2="115" y2="62" stroke="#fca311" stroke-width="2.5"/>
          </g>
        `;
      case 'ducktail':
        return `
          <g filter="url(#glow-${part.id})">
            <path d="M 28 75 Q 80 64 128 38 L 136 48 Q 85 75 35 86 Z" fill="#6c584c" stroke="#12121c" stroke-width="2.6"/>
            <circle cx="50" cy="72" r="2" fill="#fca311"/>
            <circle cx="80" cy="62" r="2" fill="#fca311"/>
            <circle cx="110" cy="50" r="2" fill="#fca311"/>
          </g>
        `;
      default:
        return `
          <g filter="url(#glow-${part.id})">
            <rect x="28" y="44" width="104" height="22" rx="4" fill="#343a40" stroke="#6c757d" stroke-dasharray="4,4" stroke-width="2"/>
            <text x="45" y="58" font-size="10" font-weight="bold" fill="#adb5bd">Clean Bobtail (No Wing)</text>
          </g>
        `;
    }
  },

  _exhaustSVG(part) {
    switch (part.type) {
      case 'zoomies':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- 4 Swept Zoomies with Heat Wrap -->
            <path d="M 32 82 Q 52 82 68 28" stroke="#ced4da" stroke-width="7" stroke-linecap="round" fill="none"/>
            <path d="M 32 82 Q 52 82 68 28" stroke="#12121c" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <path d="M 48 82 Q 68 82 84 28" stroke="#ced4da" stroke-width="7" stroke-linecap="round" fill="none"/>
            <path d="M 48 82 Q 68 82 84 28" stroke="#12121c" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <path d="M 64 82 Q 84 82 100 28" stroke="#ced4da" stroke-width="7" stroke-linecap="round" fill="none"/>
            <path d="M 64 82 Q 84 82 100 28" stroke="#12121c" stroke-width="2.2" stroke-linecap="round" fill="none"/>

            <!-- Multi-Layer Cartoon Flames -->
            <!-- Outer Crimson Flame -->
            <polygon points="68,26 62,8 74,16 80,4 86,20 76,26" fill="#d90429" stroke="#12121c" stroke-width="2"/>
            <!-- Mid Neon Yellow Flame -->
            <polygon points="69,24 65,12 73,16 77,9 81,19 75,24" fill="#ffb703"/>
            <!-- Inner White Hot Spike -->
            <polygon points="70,22 68,15 72,17 75,13 77,18 73,22" fill="#ffffff"/>

            <polygon points="100,26 94,8 106,16 112,4 118,20 108,26" fill="#d90429" stroke="#12121c" stroke-width="2"/>
            <polygon points="101,24 97,12 105,16 109,9 113,19 107,24" fill="#ffb703"/>
          </g>
        `;
      case 'flappers':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Vertical Tractor Stacks with Bouncing Rain Caps -->
            <rect x="52" y="28" width="9" height="56" fill="#343a40" stroke="#12121c" stroke-width="2.4"/>
            <rect x="84" y="28" width="9" height="56" fill="#343a40" stroke="#12121c" stroke-width="2.4"/>
            <!-- Bouncing Red Flapper Caps -->
            <line x1="50" y1="26" x2="66" y2="18" stroke="#e63946" stroke-width="4" stroke-linecap="round"/>
            <line x1="50" y1="26" x2="66" y2="18" stroke="#12121c" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="82" y1="26" x2="98" y2="18" stroke="#e63946" stroke-width="4" stroke-linecap="round"/>
            <line x1="82" y1="26" x2="98" y2="18" stroke="#12121c" stroke-width="1.8" stroke-linecap="round"/>
            <!-- Cartoon Smoke Rings -->
            <circle cx="62" cy="12" r="5" stroke="rgba(220,225,230,0.8)" stroke-width="2.2" fill="none"/>
            <circle cx="94" cy="10" r="6" stroke="rgba(220,225,230,0.8)" stroke-width="2.2" fill="none"/>
          </g>
        `;
      case 'lakepipes':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Rocker Chrome Lake Pipes with Turnouts -->
            <path d="M 18 64 L 126 64 Q 138 64 142 52" stroke="#ced4da" stroke-width="9" stroke-linecap="round" fill="none"/>
            <path d="M 18 64 L 126 64 Q 138 64 142 52" stroke="#12121c" stroke-width="2.4" stroke-linecap="round" fill="none"/>
            <rect x="38" y="58" width="12" height="12" rx="2" fill="#e63946" stroke="#12121c" stroke-width="1.8"/>
            <rect x="70" y="58" width="12" height="12" rx="2" fill="#e63946" stroke="#12121c" stroke-width="1.8"/>
            <rect x="102" y="58" width="12" height="12" rx="2" fill="#e63946" stroke="#12121c" stroke-width="1.8"/>
          </g>
        `;
      case 'purgehorns':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Nitrous Purge Nozzles with Frosty Plumes -->
            <path d="M 58 75 L 74 34" stroke="#00f0ff" stroke-width="6" stroke-linecap="round"/>
            <path d="M 58 75 L 74 34" stroke="#12121c" stroke-width="2" stroke-linecap="round"/>
            <path d="M 86 75 L 96 34" stroke="#00f0ff" stroke-width="6" stroke-linecap="round"/>
            <path d="M 86 75 L 96 34" stroke="#12121c" stroke-width="2" stroke-linecap="round"/>
            <!-- Frosty Vapor Plumes -->
            <ellipse cx="76" cy="18" rx="8" ry="15" fill="#00f0ff" opacity="0.7"/>
            <ellipse cx="76" cy="18" rx="5" ry="10" fill="#ffffff" opacity="0.9"/>
            <ellipse cx="98" cy="16" rx="8" ry="15" fill="#00f0ff" opacity="0.7"/>
            <ellipse cx="98" cy="16" rx="5" ry="10" fill="#ffffff" opacity="0.9"/>
          </g>
        `;
      default:
        return `
          <g filter="url(#glow-${part.id})">
            <path d="M 28 75 Q 80 75 132 64" stroke="#6c584c" stroke-width="7" stroke-linecap="round" fill="none"/>
            <path d="M 28 75 Q 80 75 132 64" stroke="#12121c" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <circle cx="134" cy="64" r="5" fill="#ff7b00"/>
            <circle cx="134" cy="64" r="2.5" fill="#ffd166"/>
          </g>
        `;
    }
  },

  _charmSVG(part) {
    switch (part.type) {
      case 'dice':
        return `
          <g filter="url(#glow-${part.id})">
            <line x1="75" y1="12" x2="62" y2="44" stroke="#ffffff" stroke-width="2"/>
            <line x1="75" y1="12" x2="88" y2="54" stroke="#ffffff" stroke-width="2"/>
            <!-- White Plush Fuzzy Dice with Comic Pips -->
            <rect x="48" y="44" width="24" height="24" rx="4" fill="#f8f9fa" stroke="#12121c" stroke-width="2.4"/>
            <circle cx="60" cy="56" r="3" fill="#dc3545"/>
            <rect x="74" y="54" width="24" height="24" rx="4" fill="#f8f9fa" stroke="#12121c" stroke-width="2.4"/>
            <circle cx="81" cy="61" r="2.5" fill="#12121c"/>
            <circle cx="91" cy="71" r="2.5" fill="#12121c"/>
          </g>
        `;
      case 'flames':
        return `
          <g filter="url(#glow-${part.id})">
            <path d="M 18 60 Q 60 38 86 62 Q 106 32 142 58 Q 112 76 80 68 Q 48 82 18 60 Z" fill="#ff7b00" stroke="#12121c" stroke-width="2.6" stroke-linejoin="round"/>
            <path d="M 28 60 Q 64 45 86 63 Q 102 40 132 59 Q 106 70 80 66 Q 54 75 28 60 Z" fill="#ffd000"/>
          </g>
        `;
      case 'shark':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Grinning Shark Teeth with Red Gums -->
            <ellipse cx="80" cy="55" rx="52" ry="26" fill="#dc3545" stroke="#12121c" stroke-width="2.8"/>
            <path d="M 38 55 L 46 44 L 54 55 L 62 44 L 70 55 L 78 44 L 86 55 L 94 44 L 102 55 L 110 44 L 118 55" stroke="#12121c" stroke-width="3" fill="#ffffff"/>
            <path d="M 38 55 L 46 66 L 54 55 L 62 66 L 70 55 L 78 66 L 86 55 L 94 66 L 102 55 L 110 66 L 118 55" stroke="#12121c" stroke-width="3" fill="#ffffff"/>
            <!-- Fierce Eye -->
            <circle cx="106" cy="34" r="7.5" fill="#ffffff" stroke="#12121c" stroke-width="2"/>
            <circle cx="106" cy="34" r="3.8" fill="#12121c"/>
          </g>
        `;
      case 'skull':
        return `
          <g filter="url(#glow-${part.id})">
            <!-- Winged Skull Mascot with Glowing Eyes -->
            <path d="M 32 45 Q 60 28 75 52 Q 90 28 118 45 Q 90 62 75 56 Q 60 62 32 45 Z" fill="#adb5bd" stroke="#12121c" stroke-width="2.4"/>
            <circle cx="75" cy="48" r="15" fill="#f8f9fa" stroke="#12121c" stroke-width="2.4"/>
            <circle cx="70" cy="46" r="3.8" fill="#ffbe0b" stroke="#12121c" stroke-width="1.5"/>
            <circle cx="80" cy="46" r="3.8" fill="#ffbe0b" stroke="#12121c" stroke-width="1.5"/>
            <rect x="70" y="55" width="10" height="7" rx="1" fill="#ced4da" stroke="#12121c" stroke-width="1.8"/>
            <line x1="73" y1="55" x2="73" y2="62" stroke="#12121c" stroke-width="1.5"/>
            <line x1="77" y1="55" x2="77" y2="62" stroke="#12121c" stroke-width="1.5"/>
          </g>
        `;
      default:
        return `
          <g filter="url(#glow-${part.id})">
            <circle cx="75" cy="55" r="28" fill="#f8f9fa" stroke="#12121c" stroke-width="3"/>
            <text x="75" y="66" font-size="28" font-weight="900" text-anchor="middle" fill="#dc3545">7</text>
          </g>
        `;
    }
  }
};

window.RAT_ROD_ASSETS = RAT_ROD_ASSETS;
window.RatRodSVG = RatRodSVG;
