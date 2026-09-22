/**
 * Rat Rod Racers - Inventory, Upgrade Fusion & Scrap Recycling Manager
 * 5 Canonical Slots: Powertrain, Chassis, Suspension, Wheels, Ancillary
 * Handles player bank cash, owned parts catalog, leveling, and localStorage persistence.
 */

const STORAGE_SAVE_KEY = 'rat_rod_racers_v1';

class InventoryManager {
  constructor() {
    this.bankCash = 250; // Starting garage bank balance
    this.driverScore = 1000; // Base Driver Championship Rating
    this.winStreak = 0;
    this.racesWon = 0;
    this.racesTotal = 0;
    this.bestEt = null;
    this.bestTrapSpeed = null;

    // 5 Canonical Slots: owned[category][partId] = { count: 1, level: 1 }
    this.owned = {
      powertrain: {},
      chassis: {},
      suspension: {},
      wheels: {},
      ancillary: {}
    };

    this.load();
    this._ensureStarterKit();
  }

  // Ensure starter parts are available
  _ensureStarterKit() {
    const starters = [
      { cat: 'powertrain', id: 'ENG-06' }, // Stock Farm Truck Flathead
      { cat: 'powertrain', id: 'ENG-03' }, // Screaming Slant-6
      { cat: 'chassis', id: 'BOD-02' },    // Highboy '29 Roadster
      { cat: 'chassis', id: 'BOD-05' },    // Gutted Touring Tub
      { cat: 'suspension', id: 'SUS-02' }, // Split-Wishbone Dropped I-Beam
      { cat: 'suspension', id: 'SUS-05' }, // Truck Leaves
      { cat: 'wheels', id: 'TIR-02' },     // Skinny Vintage Firestones
      { cat: 'wheels', id: 'TIR-03' },     // Hand-Grooved Ag Mud Tires
      { cat: 'ancillary', id: 'ANC-03' }   // Straight Lakester Pipes
    ];

    starters.forEach(s => {
      if (!this.owned[s.cat]) this.owned[s.cat] = {};
      if (!this.owned[s.cat][s.id]) {
        this.owned[s.cat][s.id] = { count: 1, level: 1 };
      }
    });
    this.save();
  }

  hasPart(cat, id) {
    if (cat === 'engines') cat = 'powertrain';
    if (cat === 'charms' || cat === 'exhaust' || cat === 'aero') cat = 'ancillary';
    return !!(this.owned[cat] && this.owned[cat][id] && this.owned[cat][id].count > 0);
  }

  getPartLevel(cat, id) {
    if (cat === 'engines') cat = 'powertrain';
    if (cat === 'charms' || cat === 'exhaust' || cat === 'aero') cat = 'ancillary';
    if (this.owned[cat] && this.owned[cat][id]) {
      return this.owned[cat][id].level || 1;
    }
    return 1;
  }

  getPartCount(cat, id) {
    if (cat === 'engines') cat = 'powertrain';
    if (cat === 'charms' || cat === 'exhaust' || cat === 'aero') cat = 'ancillary';
    if (this.owned[cat] && this.owned[cat][id]) {
      return this.owned[cat][id].count || 0;
    }
    return 0;
  }

  addPart(cat, id) {
    if (cat === 'engines') cat = 'powertrain';
    if (cat === 'charms' || cat === 'exhaust' || cat === 'aero') cat = 'ancillary';

    if (!this.owned[cat]) this.owned[cat] = {};
    if (!this.owned[cat][id]) {
      this.owned[cat][id] = { count: 1, level: 1 };
    } else {
      this.owned[cat][id].count += 1;
    }
    this.save();
  }

  // Upgrade / Fuse duplicate parts to level up
  upgradePart(cat, id) {
    if (cat === 'engines') cat = 'powertrain';
    if (cat === 'charms' || cat === 'exhaust' || cat === 'aero') cat = 'ancillary';

    const entry = this.owned[cat] && this.owned[cat][id];
    if (!entry) return { success: false, msg: "Part not found in inventory." };
    if (entry.level >= 3) return { success: false, msg: "Part is already at Master Level 3!" };
    if (entry.count < 2) return { success: false, msg: "Need at least 1 duplicate spare part to fuse." };

    const fee = entry.level === 1 ? 75 : 175;
    if (this.bankCash < fee) {
      return { success: false, msg: `Insufficient bank funds. Need $${fee} workshop fee.` };
    }

    this.bankCash -= fee;
    entry.count -= 1; // consume duplicate
    entry.level += 1; // increase level
    this.save();

    return {
      success: true,
      newLevel: entry.level,
      msg: `Upgraded to Level ${entry.level}! Performance boosted.`
    };
  }

  // Recycle / Scrap duplicate part for immediate cash recovery
  scrapPart(cat, id) {
    if (cat === 'engines') cat = 'powertrain';
    if (cat === 'charms' || cat === 'exhaust' || cat === 'aero') cat = 'ancillary';

    const entry = this.owned[cat] && this.owned[cat][id];
    if (!entry || entry.count <= 0) {
      return { success: false, msg: "No copies available to scrap." };
    }

    const partObj = RAT_ROD_ASSETS[cat] && RAT_ROD_ASSETS[cat][id];
    const rarity = partObj ? partObj.rarity : 'common';

    let scrapValue = 50;
    if (rarity === 'rare') scrapValue = 120;
    else if (rarity === 'epic') scrapValue = 280;
    else if (rarity === 'legendary') scrapValue = 600;

    entry.count -= 1;
    if (entry.count <= 0) {
      delete this.owned[cat][id];
    }

    this.bankCash += scrapValue;
    this.save();

    return {
      success: true,
      cashAdded: scrapValue,
      msg: `Scrapped for +$${scrapValue} Cash!`
    };
  }

  addCash(amount) {
    this.bankCash += Math.max(0, Math.round(amount));
    this.save();
  }

  spendCash(amount) {
    if (this.bankCash >= amount) {
      this.bankCash -= Math.round(amount);
      this.save();
      return true;
    }
    return false;
  }

  addScore(points) {
    this.driverScore = Math.max(0, Math.round((this.driverScore || 1000) + points));
    this.save();
    return this.driverScore;
  }

  recordRaceResult(won, et, trapSpeed, details = {}) {
    this.racesTotal++;
    let earnedPoints = 0;

    if (won) {
      this.racesWon++;
      this.winStreak = (this.winStreak || 0) + 1;

      // Base victory points
      earnedPoints += 30;

      // Underdog bonus if opponent PI was higher
      const oppPI = details.oppPI || 0;
      const playerPI = details.playerPI || 0;
      if (oppPI > playerPI) {
        const diff = Math.min(200, oppPI - playerPI);
        earnedPoints += Math.round(diff * 0.15); // up to +30 pts underdog bonus
      }

      // Reaction time bonus
      const rt = details.reactionTime;
      if (typeof rt === 'number' && rt > 0) {
        if (rt < 0.20) earnedPoints += 25; // Perfect tree!
        else if (rt < 0.35) earnedPoints += 15; // Quick holeshot!
        else if (rt < 0.50) earnedPoints += 5;
      }

      // Win streak bonus
      if (this.winStreak >= 5) earnedPoints += 20;
      else if (this.winStreak >= 3) earnedPoints += 10;
      else if (this.winStreak >= 2) earnedPoints += 5;

    } else {
      this.winStreak = 0;
      // Encouraging participation points (no punitive deductions for students)
      earnedPoints += 5;
    }

    this.driverScore = Math.max(0, (this.driverScore || 1000) + earnedPoints);

    if (et && (!this.bestEt || et < this.bestEt)) {
      this.bestEt = et;
    }
    if (trapSpeed && (!this.bestTrapSpeed || trapSpeed > this.bestTrapSpeed)) {
      this.bestTrapSpeed = trapSpeed;
    }
    this.save();
    return earnedPoints;
  }

  save() {
    try {
      const data = {
        bankCash: this.bankCash,
        driverScore: this.driverScore,
        winStreak: this.winStreak,
        owned: this.owned,
        racesWon: this.racesWon,
        racesTotal: this.racesTotal,
        bestEt: this.bestEt,
        bestTrapSpeed: this.bestTrapSpeed
      };
      const studentId = (window.game && window.game.authManager && window.game.authManager.studentId)
        ? window.game.authManager.studentId
        : null;
      const key = studentId ? `rat_rod_save_${studentId}` : STORAGE_SAVE_KEY;
      localStorage.setItem(key, JSON.stringify(data));

      if (window.game && window.game.authManager) {
        window.game.authManager.autoSave();
      }
    } catch (e) {
      console.warn("Unable to save inventory to localStorage:", e);
    }
  }

  applyData(data) {
    if (!data) return;
    if (typeof data.bankCash === 'number') this.bankCash = data.bankCash;
    if (typeof data.driverScore === 'number') this.driverScore = data.driverScore;
    if (typeof data.winStreak === 'number') this.winStreak = data.winStreak;

    if (data.owned && typeof data.owned === 'object') {
      // Migrate legacy 6-slot data into 5-slot structure
      this.owned.powertrain = Object.assign({}, this.owned.powertrain, data.owned.powertrain || data.owned.engines || {});
      this.owned.chassis = Object.assign({}, this.owned.chassis, data.owned.chassis || {});
      this.owned.suspension = Object.assign({}, this.owned.suspension, data.owned.suspension || {});
      this.owned.wheels = Object.assign({}, this.owned.wheels, data.owned.wheels || {});
      this.owned.ancillary = Object.assign({}, this.owned.ancillary, data.owned.ancillary || data.owned.exhaust || data.owned.charms || {});

      // Migrate legacy item IDs if present
      const idMap = {
        'lawnmower_twin': { cat: 'powertrain', id: 'ENG-06' },
        'flathead_v8': { cat: 'powertrain', id: 'ENG-01' },
        'junkyard_turbo': { cat: 'powertrain', id: 'ENG-03' },
        'blown_blower': { cat: 'powertrain', id: 'ENG-02' },
        'electric_arc': { cat: 'powertrain', id: 'ENG-05' },
        'nitrous_beast': { cat: 'powertrain', id: 'ENG-04' },
        'roadster_32': { cat: 'chassis', id: 'BOD-02' },
        'scrappy_pickup': { cat: 'chassis', id: 'BOD-04' },
        'bubbly_bug': { cat: 'chassis', id: 'BOD-03' },
        'iron_coffin': { cat: 'chassis', id: 'BOD-01' },
        'milk_truck': { cat: 'chassis', id: 'BOD-04' },
        'bone_shaker': { cat: 'chassis', id: 'BOD-01' },
        'wire_spokes': { cat: 'wheels', id: 'TIR-02' },
        'rusty_steelies': { cat: 'wheels', id: 'TIR-02' },
        'whitewall_cruisers': { cat: 'wheels', id: 'TIR-04' },
        'mud_boggers': { cat: 'wheels', id: 'TIR-03' },
        'fat_drag_slicks': { cat: 'wheels', id: 'TIR-01' },
        'gold_racing_mags': { cat: 'wheels', id: 'TIR-04' },
        'rusty_pipe': { cat: 'ancillary', id: 'ANC-03' },
        'flaming_zoomies': { cat: 'ancillary', id: 'ANC-03' },
        'fuzzy_dice': { cat: 'ancillary', id: 'ANC-04' }
      };

      // Scan and map
      for (const [legacyId, mapping] of Object.entries(idMap)) {
        for (const c of ['powertrain', 'chassis', 'suspension', 'wheels', 'ancillary']) {
          if (this.owned[c] && this.owned[c][legacyId]) {
            const oldEntry = this.owned[c][legacyId];
            delete this.owned[c][legacyId];
            if (!this.owned[mapping.cat]) this.owned[mapping.cat] = {};
            this.owned[mapping.cat][mapping.id] = oldEntry;
          }
        }
      }
    }

    if (typeof data.racesWon === 'number') this.racesWon = data.racesWon;
    if (typeof data.racesTotal === 'number') this.racesTotal = data.racesTotal;
    if (data.bestEt) this.bestEt = data.bestEt;
    if (data.bestTrapSpeed) this.bestTrapSpeed = data.bestTrapSpeed;

    this._ensureStarterKit();
  }

  load() {
    try {
      const studentId = (window.game && window.game.authManager && window.game.authManager.studentId)
        ? window.game.authManager.studentId
        : null;
      const key = studentId ? `rat_rod_save_${studentId}` : STORAGE_SAVE_KEY;
      const raw = localStorage.getItem(key) || localStorage.getItem(STORAGE_SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.applyData(data);
    } catch (e) {
      console.warn("Unable to load inventory from localStorage:", e);
    }
  }

  loadFromCloud(cloudData) {
    if (!cloudData) return;
    try {
      this.applyData(cloudData);

      // Cache cloud data to localStorage
      const studentId = (window.game && window.game.authManager && window.game.authManager.studentId)
        ? window.game.authManager.studentId
        : null;
      const key = studentId ? `rat_rod_save_${studentId}` : STORAGE_SAVE_KEY;
      const data = {
        bankCash: this.bankCash,
        driverScore: this.driverScore,
        winStreak: this.winStreak,
        owned: this.owned,
        racesWon: this.racesWon,
        racesTotal: this.racesTotal,
        bestEt: this.bestEt,
        bestTrapSpeed: this.bestTrapSpeed
      };
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Inventory successfully synced from cloud for student: ${studentId || 'guest'}, Bank: $${this.bankCash}`);
    } catch (e) {
      console.warn("Unable to process cloud data in InventoryManager:", e);
    }
  }
}

window.InventoryManager = InventoryManager;
