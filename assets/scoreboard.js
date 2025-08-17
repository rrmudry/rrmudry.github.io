(function(){
  const STORAGE_KEY = 'scores';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  window.Scoreboard = {
    addWin(game, name) {
      if (!name) return;
      const data = load();
      if (!data[game]) data[game] = {};
      data[game][name] = (data[game][name] || 0) + 1;
      save(data);
    },
    getTop(game) {
      const data = load();
      const scores = data[game] || {};
      return Object.entries(scores).sort((a, b) => b[1] - a[1]);
    },
    clear() {
      localStorage.removeItem(STORAGE_KEY);
    }
  };
})();
