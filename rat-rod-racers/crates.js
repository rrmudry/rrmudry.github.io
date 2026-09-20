/**
 * Rat Rod Racers - Mystery Part Crates & Unboxing Engine
 * Junkyard Scraps, Tuner Speed Crates, and Legendary Relic Crates.
 */

const CRATE_TIERS = {
  barn_find: {
    id: 'barn_find',
    name: "Junkyard Barn Find",
    cost: 150,
    partCount: 3,
    description: "Scoured from old tractor sheds and salvage yards. Solid starter parts with a chance of rare gems!",
    icon: "📦",
    rarityWeights: { common: 0.72, rare: 0.24, epic: 0.04, legendary: 0.0 }
  },
  tuner_shop: {
    id: 'tuner_shop',
    name: "Tuner's Speed Crate",
    cost: 400,
    partCount: 3,
    description: "Packed with hot rod carburetors, drag wings, and competition rubber. Guaranteed Rare or better!",
    icon: "🧰",
    rarityWeights: { common: 0.35, rare: 0.48, epic: 0.14, legendary: 0.03 },
    guaranteedMinRarity: 'rare'
  },
  legendary_relic: {
    id: 'legendary_relic',
    name: "Legendary Relic Crate",
    cost: 900,
    partCount: 4,
    description: "The holy grail of speed! Towering blowers, nitrous systems, and forged drag hardware. High Epic/Legendary rates!",
    icon: "🏆",
    rarityWeights: { common: 0.0, rare: 0.45, epic: 0.40, legendary: 0.15 },
    guaranteedMinRarity: 'epic'
  }
};

class CrateShopEngine {
  constructor(inventoryManager) {
    this.inventory = inventoryManager;
  }

  // Roll a random part from all categories matching the target rarity
  rollPart(targetRarity = null, allowedRarities = null) {
    const categories = ['chassis', 'engines', 'wheels', 'aero', 'exhaust', 'charms'];
    const chosenCat = categories[Math.floor(Math.random() * categories.length)];
    const pool = Object.values(RAT_ROD_ASSETS[chosenCat]);

    let filtered = pool;
    if (targetRarity) {
      filtered = pool.filter(p => p.rarity === targetRarity);
    } else if (allowedRarities) {
      filtered = pool.filter(p => allowedRarities.includes(p.rarity));
    }

    if (filtered.length === 0) filtered = pool;
    const part = filtered[Math.floor(Math.random() * filtered.length)];
    return { ...part };
  }

  // Open a crate tier and return array of awarded parts
  openCrate(tierId) {
    const crate = CRATE_TIERS[tierId];
    if (!crate) return null;

    const results = [];
    const weights = crate.rarityWeights;

    for (let i = 0; i < crate.partCount; i++) {
      let roll = Math.random();
      let chosenRarity = 'common';

      if (i === 0 && crate.guaranteedMinRarity) {
        // Guaranteed minimum rarity for first card
        if (crate.guaranteedMinRarity === 'epic') {
          chosenRarity = Math.random() < 0.28 ? 'legendary' : 'epic';
        } else {
          const r = Math.random();
          if (r < 0.06) chosenRarity = 'legendary';
          else if (r < 0.25) chosenRarity = 'epic';
          else chosenRarity = 'rare';
        }
      } else {
        if (roll < weights.common) {
          chosenRarity = 'common';
        } else if (roll < weights.common + weights.rare) {
          chosenRarity = 'rare';
        } else if (roll < weights.common + weights.rare + weights.epic) {
          chosenRarity = 'epic';
        } else {
          chosenRarity = 'legendary';
        }
      }

      const part = this.rollPart(chosenRarity);
      const isNew = this.inventory ? !this.inventory.hasPart(part.category, part.id) : true;

      // Add to inventory
      if (this.inventory) {
        this.inventory.addPart(part.category, part.id);
      }

      results.push({
        part: part,
        isNew: isNew
      });
    }

    return results;
  }
}

window.CRATE_TIERS = CRATE_TIERS;
window.CrateShopEngine = CrateShopEngine;
