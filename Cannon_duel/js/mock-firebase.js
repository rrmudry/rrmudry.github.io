// Test-only stand-in for the Firebase compat API: just the calls Cannon Duel makes.
// Loaded only with ?mock=1. Data lives in localStorage, so tabs on the same origin share one
// "database" and storage events push changes between them. ?user=<name> picks the fake account
// (use ?user=rmudry for the teacher). Not secure, not atomic across tabs: testing only.
(function () {
  'use strict';
  const KEY = 'cdmock:';
  const params = new URLSearchParams(location.search);
  const who = (params.get('user') || 'student1').toLowerCase();
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const listeners = new Set();

  const read = (path) => { const v = localStorage.getItem(KEY + path); return v ? JSON.parse(v) : undefined; };
  const write = (path, data) => {
    if (data === undefined) localStorage.removeItem(KEY + path);
    else localStorage.setItem(KEY + path, JSON.stringify(data));
    notify();
  };
  const notify = () => setTimeout(() => listeners.forEach((l) => l.fire()), 0);
  window.addEventListener('storage', (e) => { if (e.key && e.key.startsWith(KEY)) notify(); });

  class DocSnap {
    constructor(id, ref, d) { this.id = id; this.ref = ref; this._d = d; this.exists = d !== undefined; }
    data() { return this._d === undefined ? undefined : clone(this._d); }
  }
  const watch = (snapshot, cb) => {
    let last;
    const l = { fire: () => { const s = snapshot(); const k = JSON.stringify(s.key); if (k !== last) { last = k; cb(s.value); } } };
    listeners.add(l); l.fire();
    return () => listeners.delete(l);
  };

  class DocRef {
    constructor(path) { this.path = path; this.id = path.split('/').pop(); }
    collection(n) { return new ColRef(this.path + '/' + n); }
    snap() { return new DocSnap(this.id, this, read(this.path)); }
    async get() { return this.snap(); }
    async set(d, opt) { write(this.path, { ...(opt && opt.merge ? read(this.path) || {} : {}), ...clone(d) }); }
    async update(d) {
      const cur = read(this.path);
      if (!cur) throw new Error('not-found');
      write(this.path, { ...cur, ...clone(d) });
    }
    async delete() { write(this.path, undefined); }
    onSnapshot(cb) { return watch(() => ({ key: read(this.path) || null, value: this.snap() }), cb); }
  }

  class Query {
    constructor(path, filters = []) { this.path = path; this.filters = filters; }
    where(f, op, v) { return new Query(this.path, [...this.filters, [f, op, v]]); }
    docs() {
      const pre = KEY + this.path + '/', out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k.startsWith(pre) || k.slice(pre.length).includes('/')) continue;
        const ref = new DocRef(k.slice(KEY.length)), d = read(ref.path);
        const ok = this.filters.every(([f, op, v]) => op === '==' ? d[f] === v : op === 'array-contains' ? (d[f] || []).includes(v) : true);
        if (ok) out.push(new DocSnap(ref.id, ref, d));
      }
      return out.sort((a, b) => (a.id < b.id ? -1 : 1));
    }
    async get() { const docs = this.docs(); return { docs, empty: !docs.length, size: docs.length }; }
    onSnapshot(cb) {
      return watch(() => { const docs = this.docs(); return { key: docs.map((d) => [d.id, d._d]), value: { docs, empty: !docs.length, size: docs.length } }; }, cb);
    }
  }
  class ColRef extends Query {
    doc(id) { return new DocRef(this.path + '/' + (id || Math.random().toString(36).slice(2, 12))); }
  }

  const db = {
    collection: (p) => new ColRef(p),
    async runTransaction(fn) {
      const ops = [];
      const tx = {
        get: (r) => r.get(),
        update: (r, d) => { ops.push(() => r.update(d)); return tx; },
        set: (r, d, o) => { ops.push(() => r.set(d, o)); return tx; },
      };
      const res = await fn(tx);
      for (const op of ops) await op();
      return res;
    },
    batch() {
      const ops = [];
      const b = {
        set: (r, d, o) => { ops.push(() => r.set(d, o)); return b; },
        update: (r, d) => { ops.push(() => r.update(d)); return b; },
        delete: (r) => { ops.push(() => r.delete()); return b; },
        commit: async () => { for (const op of ops) await op(); },
      };
      return b;
    },
  };

  const fakeUser = { uid: 'mock-' + who, email: who + '@orangeusd.org', displayName: who.charAt(0).toUpperCase() + who.slice(1), emailVerified: true };
  const authCbs = [];
  const auth = {
    currentUser: params.get('signedout') ? null : fakeUser,
    onAuthStateChanged(cb) { authCbs.push(cb); setTimeout(() => cb(auth.currentUser), 0); return () => {}; },
    async signInWithPopup() { auth.currentUser = fakeUser; authCbs.forEach((cb) => cb(fakeUser)); return { user: fakeUser }; },
    async signOut() { auth.currentUser = null; authCbs.forEach((cb) => cb(null)); },
  };
  function GoogleAuthProvider() {}
  GoogleAuthProvider.prototype.setCustomParameters = function () {};

  window.firebase = {
    apps: [{}],
    initializeApp() {},
    firestore: () => db,
    auth: Object.assign(() => auth, { GoogleAuthProvider }),
  };
  console.info('[Cannon Duel] Using the mock Firebase as', fakeUser.email);
})();
