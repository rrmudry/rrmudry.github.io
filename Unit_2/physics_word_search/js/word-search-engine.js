/**
 * Physics Word Search Engine
 * Procedural generation, 8-directional word placement, path calculation & verification
 */

class WordSearchEngine {
  constructor(size = 14) {
    this.size = size;
    this.grid = [];
    this.placedWords = new Map(); // word -> { word, coords: [{r, c}], start: {r, c}, end: {r, c}, dir: {dr, dc} }
    this.directions = [
      { dr: 0, dc: 1, name: 'E' },    // Left to Right
      { dr: 0, dc: -1, name: 'W' },   // Right to Left
      { dr: 1, dc: 0, name: 'S' },    // Top to Bottom
      { dr: -1, dc: 0, name: 'N' },   // Bottom to Top
      { dr: 1, dc: 1, name: 'SE' },   // Diagonal Down-Right
      { dr: -1, dc: -1, name: 'NW' }, // Diagonal Up-Left
      { dr: -1, dc: 1, name: 'NE' },  // Diagonal Up-Right
      { dr: 1, dc: -1, name: 'SW' }   // Diagonal Down-Left
    ];
    // English letter distribution frequencies for realistic filler
    this.letterPool = 'AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ';
  }

  generate(wordObjects) {
    const words = wordObjects.map(item => item.word.toUpperCase().replace(/[^A-Z]/g, ''));
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      attempts++;
      if (this._tryBuildGrid(words)) {
        this._fillEmptyCells();
        return {
          success: true,
          grid: this.grid,
          placedWords: this.placedWords,
          size: this.size
        };
      }
    }

    // Fallback: build with a slightly expanded grid if dense
    this.size = Math.max(this.size, 15);
    this._tryBuildGrid(words);
    this._fillEmptyCells();
    return {
      success: true,
      grid: this.grid,
      placedWords: this.placedWords,
      size: this.size
    };
  }

  _tryBuildGrid(words) {
    // Initialize blank grid
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(''));
    this.placedWords.clear();

    // Sort words longest first to optimize fit
    const sortedWords = [...words].sort((a, b) => b.length - a.length);

    for (const word of sortedWords) {
      const placed = this._placeWordRandomly(word);
      if (!placed) {
        return false; // Retry whole grid
      }
    }
    return true;
  }

  _placeWordRandomly(word) {
    const positions = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        positions.push({ r, c });
      }
    }
    this._shuffle(positions);

    const dirs = [...this.directions];
    this._shuffle(dirs);

    for (const pos of positions) {
      for (const dir of dirs) {
        if (this._canPlaceWord(word, pos.r, pos.c, dir.dr, dir.dc)) {
          this._applyWord(word, pos.r, pos.c, dir.dr, dir.dc);
          return true;
        }
      }
    }
    return false;
  }

  _canPlaceWord(word, startR, startC, dr, dc) {
    const endR = startR + dr * (word.length - 1);
    const endC = startC + dc * (word.length - 1);

    if (endR < 0 || endR >= this.size || endC < 0 || endC >= this.size) {
      return false;
    }

    for (let i = 0; i < word.length; i++) {
      const currR = startR + dr * i;
      const currC = startC + dc * i;
      const existing = this.grid[currR][currC];
      if (existing !== '' && existing !== word[i]) {
        return false;
      }
    }
    return true;
  }

  _applyWord(word, startR, startC, dr, dc) {
    const coords = [];
    for (let i = 0; i < word.length; i++) {
      const r = startR + dr * i;
      const c = startC + dc * i;
      this.grid[r][c] = word[i];
      coords.push({ r, c });
    }
    this.placedWords.set(word, {
      word,
      coords,
      start: { r: startR, c: startC },
      end: { r: startR + dr * (word.length - 1), c: startC + dc * (word.length - 1) },
      dir: { dr, dc }
    });
  }

  _fillEmptyCells() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === '') {
          const randIdx = Math.floor(Math.random() * this.letterPool.length);
          this.grid[r][c] = this.letterPool[randIdx];
        }
      }
    }
  }

  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Calculates straight line path between (r1, c1) and (r2, c2) snapped to 8 directions
   */
  calculateVectorPath(r1, c1, r2, c2) {
    if (r1 < 0 || r1 >= this.size || c1 < 0 || c1 >= this.size ||
        r2 < 0 || r2 >= this.size || c2 < 0 || c2 >= this.size) {
      return [];
    }

    const dr = r2 - r1;
    const dc = c2 - c1;

    if (dr === 0 && dc === 0) {
      return [{ r: r1, c: c1 }];
    }

    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    let stepR = 0;
    let stepC = 0;
    let steps = 0;

    if (absDr === 0) {
      // Pure Horizontal
      stepR = 0;
      stepC = dc > 0 ? 1 : -1;
      steps = absDc;
    } else if (absDc === 0) {
      // Pure Vertical
      stepR = dr > 0 ? 1 : -1;
      stepC = 0;
      steps = absDr;
    } else if (absDr === absDc) {
      // Pure Diagonal
      stepR = dr > 0 ? 1 : -1;
      stepC = dc > 0 ? 1 : -1;
      steps = absDr;
    } else {
      // Snap to closest of the 8 directions
      const angle = Math.atan2(dr, dc) * (180 / Math.PI); // -180 to 180
      // 8 sectors of 45 degrees
      const octant = Math.round(angle / 45);
      const snappedAngle = octant * 45;
      const rad = (snappedAngle * Math.PI) / 180;
      stepR = Math.round(Math.sin(rad));
      stepC = Math.round(Math.cos(rad));
      steps = Math.max(absDr, absDc);
    }

    const path = [];
    for (let i = 0; i <= steps; i++) {
      const r = r1 + stepR * i;
      const c = c1 + stepC * i;
      if (r >= 0 && r < this.size && c >= 0 && c < this.size) {
        path.push({ r, c });
      }
    }
    return path;
  }

  /**
   * Check if a set of coordinates forms a valid placed word
   */
  checkSelection(coords, activeUnfoundWords) {
    if (!coords || coords.length < 2) return null;

    let forwardWord = '';
    for (const pt of coords) {
      forwardWord += this.grid[pt.r][pt.c];
    }
    const reverseWord = forwardWord.split('').reverse().join('');

    const targetWords = activeUnfoundWords.map(w => w.toUpperCase().replace(/[^A-Z]/g, ''));

    let matchedWord = null;
    let matchedCoords = coords;

    if (targetWords.includes(forwardWord)) {
      matchedWord = forwardWord;
      matchedCoords = coords;
    } else if (targetWords.includes(reverseWord)) {
      matchedWord = reverseWord;
      matchedCoords = [...coords].reverse();
    }

    if (matchedWord) {
      return {
        success: true,
        word: matchedWord,
        coords: matchedCoords
      };
    }
    return null;
  }

  /**
   * Provide a hint for a word that hasn't been found yet
   */
  getWordHint(word) {
    const clean = word.toUpperCase().replace(/[^A-Z]/g, '');
    const data = this.placedWords.get(clean);
    if (!data) return null;
    return {
      word: clean,
      start: data.start,
      end: data.end,
      firstLetter: this.grid[data.start.r][data.start.c],
      dirName: this._getDirName(data.dir.dr, data.dir.dc)
    };
  }

  _getDirName(dr, dc) {
    if (dr === 0 && dc > 0) return 'Horizontal (→)';
    if (dr === 0 && dc < 0) return 'Horizontal (←)';
    if (dr > 0 && dc === 0) return 'Vertical (↓)';
    if (dr < 0 && dc === 0) return 'Vertical (↑)';
    if (dr > 0 && dc > 0) return 'Diagonal (↘)';
    if (dr < 0 && dc < 0) return 'Diagonal (↖)';
    if (dr < 0 && dc > 0) return 'Diagonal (↗)';
    if (dr > 0 && dc < 0) return 'Diagonal (↙)';
    return 'Straight Line';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WordSearchEngine };
}
