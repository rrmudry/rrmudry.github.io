(function () {
  const STORAGE_KEY = 'mr-mudry-scoreboard';

  function getStorage() {
    try {
      const testKey = '__scoreboard_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch (error) {
      console.warn('Scoreboard: localStorage unavailable, using memory store.', error);
      return null;
    }
  }

  const storage = getStorage();
  let memoryStore = {};

  function readStore() {
    if (!storage) {
      return { ...memoryStore };
    }
    try {
      const raw = storage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error('Scoreboard: failed to read store.', error);
      return {};
    }
  }

  function writeStore(data) {
    if (!storage) {
      memoryStore = { ...data };
      return;
    }
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Scoreboard: failed to save store.', error);
    }
  }

  function normaliseName(name) {
    const value = (name || 'Player').toString().trim();
    return value.length > 48 ? value.slice(0, 48) : value;
  }

  function ensureGame(data, game) {
    if (!data[game]) {
      data[game] = {};
    }
    return data[game];
  }

  const api = {
    addWin(game, playerName) {
      if (!game) return;
      const data = readStore();
      const gameStore = ensureGame(data, game);
      const name = normaliseName(playerName);
      gameStore[name] = (gameStore[name] || 0) + 1;
      writeStore(data);
    },

    getTop(game, limit = 5) {
      if (!game) return [];
      const data = readStore();
      const gameStore = data[game] || {};
      return Object.entries(gameStore)
        .sort(([, aWins], [, bWins]) => bWins - aWins || 0)
        .slice(0, Math.max(0, limit));
    },

    clear(game) {
      if (!game) {
        writeStore({});
        return;
      }
      const data = readStore();
      if (data[game]) {
        delete data[game];
        writeStore(data);
      }
    },

    _dump() {
      return readStore();
    },
  };

  window.Scoreboard = api;
})();
