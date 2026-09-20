/**
 * Rat Rod Racers - Inventory, Upgrade Fusion & Scrap Recycling Manager
 * Handles player bank cash, owned parts catalog, part leveling, and localStorage persistence.
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

    // Owned parts: owned[category][partId] = { count: 1, level: 1 }
    this.owned = {
      chassis: {},
      engines: {},
      wheels: {},
      aero: {},
      exhaust: {},
      charms: {}
    };

    this.load();
    this._ensureStarterKit();
  }

  // Ensure beginner parts are owned
  _ensureStarterKit() {
    const starters = [
      { cat: 'chassis', id: 'roadster_32' },
      { cat: 'engines', id: 'lawnmower_twin' },
      { cat: 'engines', id: 'flathead_v8' },
      { cat: 'wheels', id: 'rusty_steelies' },
      { cat: 'aero', id: 'clean_bobtail' },
      { cat: 'exhaust', id: 'rusty_pipe' },
      { cat: 'charms', id: 'fuzzy_dice' }
    ];

    starters.forEach(s => {
      if (!this.owned[s.cat][s.id]) {
        this.owned[s.cat][s.id] = { count: 1, level: 1 };
      }
    });
    this.save();
  }

  hasPart(cat, id) {
    return !!(this.owned[cat] && this.owned[cat][id] && this.owned[cat][id].count > 0);
  }

  getPartLevel(cat, id) {
    if (this.owned[cat] && this.owned[cat][id]) {
      return this.owned[cat][id].level || 1;
    }
    return 1;
  }

  getPartCount(cat, id) {
    if (this.owned[cat] && this.owned[cat][id]) {
      return this.owned[cat][id].count || 0;
    }
    return 0;
  }

  addPart(cat, id) {
    if (!this.owned[cat]) this.owned[cat] = {};
    if (!this.owned[cat][id]) {
      this.owned[cat][id] = { count: 1, level: 1 };
    } else {
      this.owned[cat][id].count += 1;
    }
    this.save();
  }

  // Upgrade / Fuse duplicate parts to level up
  // Requires: at least 2 copies of part (count >= 2), current level < 3, and bank cash for fee
  upgradePart(cat, id) {
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

  load() {
    try {
      const studentId = (window.game && window.game.authManager && window.game.authManager.studentId)
        ? window.game.authManager.studentId
        : null;
      const key = studentId ? `rat_rod_save_${studentId}` : STORAGE_SAVE_KEY;
      const raw = localStorage.getItem(key) || localStorage.getItem(STORAGE_SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.bankCash === 'number') this.bankCash = data.bankCash;
      if (typeof data.driverScore === 'number') this.driverScore = data.driverScore;
      if (typeof data.winStreak === 'number') this.winStreak = data.winStreak;
      if (data.owned) this.owned = data.owned;
      if (typeof data.racesWon === 'number') this.racesWon = data.racesWon;
      if (typeof data.racesTotal === 'number') this.racesTotal = data.racesTotal;
      if (data.bestEt) this.bestEt = data.bestEt;
      if (data.bestTrapSpeed) this.bestTrapSpeed = data.bestTrapSpeed;
    } catch (e) {
      console.warn("Unable to load inventory from localStorage:", e);
    }
  }

  loadFromCloud(cloudData) {
    if (!cloudData) return;
    if (typeof cloudData.bankCash === 'number') this.bankCash = cloudData.bankCash;
    if (typeof cloudData.driverScore === 'number') this.driverScore = cloudData.driverScore;
    else if (typeof cloudData.score === 'number') this.driverScore = cloudData.score;
    if (typeof cloudData.winStreak === 'number') this.winStreak = cloudData.winStreak;
    if (cloudData.owned && typeof cloudData.owned === 'object') {
      this.owned = cloudData.owned;
    }
    if (typeof cloudData.racesWon === 'number') this.racesWon = cloudData.racesWon;
    if (typeof cloudData.racesTotal === 'number') this.racesTotal = cloudData.racesTotal;
    if (cloudData.bestEt) this.bestEt = cloudData.bestEt;
    if (cloudData.bestTrapSpeed) this.bestTrapSpeed = cloudData.bestTrapSpeed;
    this._ensureStarterKit();
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
    } catch (e) {
      console.warn("Unable to cache cloud inventory to localStorage:", e);
    }
  }
}

window.InventoryManager = InventoryManager;
