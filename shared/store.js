/* =========================================================================
   Golden Hour — simulated backend (owner: Member A)
   FROZEN after setup: only Member A edits this file.
   Everything is saved in localStorage under one key. Every change fires
   the window event 'store:change'. See CONTRACT.md for the full API.
   ========================================================================= */
(function () {
  'use strict';

  var KEY = 'goldenhour';
  var VERSION = 2; // bump when the seed data changes: old saved data is replaced
  var MIN = 60 * 1000;
  var DAY = 24 * 60 * MIN;
  var WEEK = 7 * DAY;
  var SEED_MAX_AGE = 6 * 60 * MIN;   // regenerate seed listings after 6 hours
  var HOLD_MS = 10 * MIN;            // the bag is held for 10 minutes
  var CO2_PER_KG = 2.5;              // estimate
  var CODE_ALPHABET = 'ACDEFHJKMNPRTUVWXY34679'; // no 0/O, 1/I/L, 2/Z, 5/S, 8/B
  var MY_SHOP_ID = 'my-shop';

  var memoryCopy = null; // used only if localStorage is blocked
  var state;

  /* ---------- small helpers ---------- */
  function now() { return Date.now(); }
  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function round(n, dp) { var f = Math.pow(10, dp || 0); return Math.round(n * f) / f; }
  function emit() { window.dispatchEvent(new CustomEvent('store:change')); }
  function newId(prefix) { return prefix + now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function makeCode() {
    var code = '';
    for (var i = 0; i < 4; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    return code;
  }

  function weekStart(ts) {
    var d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
    return d.getTime();
  }
  function weekIndex(ts) { return Math.round(weekStart(ts) / WEEK); }

  /* ---------- persistence ---------- */
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return clone(memoryCopy);
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      memoryCopy = clone(state);
    }
  }

  /* ---------- seeding ---------- */
  function buildListings(base) {
    return (window.SEED_LISTINGS || []).map(function (s) {
      return {
        id: s.id, storeId: s.storeId, name: s.name, category: s.category, veg: s.veg,
        mrp: s.mrp, price: s.price, qty: s.qty, qtyLeft: s.qtyLeft, kgPerUnit: s.kgPerUnit,
        allergens: s.allergens.slice(), desc: s.desc,
        cookedAt: base - s.cookedAgoMin * MIN,
        pickupFrom: base + s.pickupFromMin * MIN,
        pickupTo: base + s.pickupToMin * MIN,
        goodTill: base + s.goodTillAfterMin * MIN,
        status: 'live'
      };
    });
  }

  // A few weeks of past rescues so the Impact page has something to show.
  function sampleHistory(base) {
    var rows = [
      { daysAgo: 2,  storeId: 's2', items: [['Rajma chawal', 2]],                cats: ['meals'],   kg: 0.9, saved: 160 },
      { daysAgo: 9,  storeId: 's1', items: [['Chicken patties (pack of 4)', 2]], cats: ['bakery'],  kg: 0.6, saved: 150 },
      { daysAgo: 11, storeId: 's3', items: [['Ripe bananas (1 dozen)', 1]],      cats: ['grocery'], kg: 1.2, saved: 35 },
      { daysAgo: 16, storeId: 's5', items: [['Masala dosa', 2]],                 cats: ['cafe'],    kg: 0.6, saved: 140 },
      { daysAgo: 31, storeId: 's6', items: [['Sourdough boule', 1]],             cats: ['bakery'],  kg: 0.6, saved: 140 },
      { daysAgo: 33, storeId: 's9', items: [['Gulab jamun (6 pieces)', 1]],      cats: ['sweets'],  kg: 0.3, saved: 75 }
    ];
    return rows.map(function (r, i) {
      var store = findStore(r.storeId) || { name: 'Local shop' };
      return {
        id: 'h-seed-' + i,
        orderId: null,
        storeId: r.storeId,
        storeName: store.name,
        items: r.items.map(function (it) { return { name: it[0], qty: it[1] }; }),
        categories: r.cats,
        kg: r.kg,
        saved: r.saved,
        date: base - r.daysAgo * DAY - 3 * 60 * MIN
      };
    });
  }

  function freshState(withHistory) {
    var base = now();
    var area = window.AREAS[0];
    return {
      version: VERSION,
      seedBase: base,
      area: { id: area.id, name: area.name, lat: area.lat, lng: area.lng },
      listings: buildListings(base),
      myShop: null,
      cart: { items: [], holdUntil: null, removed: [] },
      orders: [],
      history: withHistory ? sampleHistory(base) : [],
      user: null
    };
  }

  function load() {
    var s = read();
    if (!s || s.version !== VERSION) {
      state = freshState(true);
      save();
      return;
    }
    state = s;
    // Seed listings are too old: rebuild them so countdowns make sense again.
    if (now() - state.seedBase > SEED_MAX_AGE) {
      var mine = state.listings.filter(function (l) { return l.storeId === MY_SHOP_ID; });
      state.seedBase = now();
      state.listings = buildListings(state.seedBase).concat(mine);
      state.cart = { items: [], holdUntil: null, removed: [] };
      save();
    }
  }

  /* ---------- lookups ---------- */
  function findStore(id) {
    if (state && state.myShop && state.myShop.id === id) return state.myShop;
    var list = window.STORES || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function findListing(id) {
    for (var i = 0; i < state.listings.length; i++) if (state.listings[i].id === id) return state.listings[i];
    return null;
  }

  function statusOf(l) {
    if (l.ended || now() > l.pickupTo) return 'closed';
    if (l.qtyLeft <= 0) return 'soldout';
    return 'live';
  }

  function withStatus(l) {
    var copy = clone(l);
    copy.status = statusOf(l);
    delete copy.ended;
    return copy;
  }

  /* ---------- cart upkeep: expired hold and unavailable items ---------- */
  function sweep() {
    var cart = state.cart;
    if (!cart.items.length) return false;
    var changed = false;

    if (cart.holdUntil && now() > cart.holdUntil) {
      cart.removed = cart.items.map(function (it) {
        var l = findListing(it.id);
        return l ? l.name : 'An item';
      });
      cart.items = [];
      changed = true;
    } else {
      cart.items = cart.items.filter(function (it) {
        var l = findListing(it.id);
        if (l && statusOf(l) === 'live') {
          if (it.qty > l.qtyLeft) { it.qty = l.qtyLeft; changed = true; }
          return true;
        }
        cart.removed.push(l ? l.name : 'An item');
        changed = true;
        return false;
      });
    }
    if (!cart.items.length) cart.holdUntil = null;
    if (changed) {
      save();
      setTimeout(emit, 0); // async so a getter never fires events mid-render
    }
    return changed;
  }

  /* ---------- validation helpers ---------- */
  function cleanPhone(p) {
    var digits = String(p || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2);
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
  }
  function isNum(n) { return typeof n === 'number' && isFinite(n); }

  /* =====================================================================
     Public API
     ===================================================================== */
  var Store = {};

  /* ----- listings ----- */
  // Returns live and sold-out listings, soonest-closing first.
  // { includeClosed: true } also returns closed ones.
  Store.getListings = function (opts) {
    opts = opts || {};
    return state.listings
      .map(withStatus)
      .filter(function (l) { return opts.includeClosed || l.status !== 'closed'; })
      .sort(function (a, b) { return a.pickupTo - b.pickupTo; });
  };

  Store.getListing = function (id) {
    var l = findListing(id);
    return l ? withStatus(l) : null;
  };

  Store.getStore = function (id) { return clone(findStore(id)); };

  // Accepts a store object or a store id. Distance in km, 1 decimal.
  Store.distanceKm = function (store) {
    if (typeof store === 'string') store = findStore(store);
    if (!store) return null;
    var a = state.area;
    var R = 6371;
    var toRad = Math.PI / 180;
    var dLat = (store.lat - a.lat) * toRad;
    var dLng = (store.lng - a.lng) * toRad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(a.lat * toRad) * Math.cos(store.lat * toRad) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return round(2 * R * Math.asin(Math.sqrt(h)), 1);
  };

  /* ----- location ----- */
  Store.getArea = function () { return clone(state.area); };

  Store.setArea = function (id) {
    var found = (window.AREAS || []).filter(function (a) { return a.id === id; })[0];
    if (!found) return { ok: false, msg: 'Unknown area' };
    state.area = { id: found.id, name: found.name, lat: found.lat, lng: found.lng };
    save(); emit();
    return { ok: true, msg: 'Showing food near ' + found.name };
  };

  Store.setCustomLocation = function (lat, lng) {
    lat = Number(lat); lng = Number(lng);
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return { ok: false, msg: 'That location could not be used' };
    }
    state.area = { id: 'custom', name: 'Your location', lat: lat, lng: lng };
    save(); emit();
    return { ok: true, msg: 'Showing food near your location' };
  };

  /* ----- cart ----- */
  Store.getCart = function () {
    sweep();
    var items = state.cart.items
      .map(function (it) {
        var l = findListing(it.id);
        return l ? { listing: withStatus(l), qty: it.qty } : null;
      })
      .filter(Boolean);
    return { items: items, holdUntil: state.cart.holdUntil, removed: state.cart.removed.slice() };
  };

  Store.addToCart = function (id, qty) {
    sweep();
    qty = Math.max(1, parseInt(qty, 10) || 1);
    var l = findListing(id);
    if (!l) return { ok: false, msg: "This item isn't available any more" };
    var st = statusOf(l);
    if (st === 'soldout') return { ok: false, msg: l.name + ' is sold out' };
    if (st === 'closed') return { ok: false, msg: 'Pickup for ' + l.name + ' has ended' };

    var cart = state.cart;
    var line = cart.items.filter(function (it) { return it.id === id; })[0];
    var wanted = (line ? line.qty : 0) + qty;
    if (wanted > l.qtyLeft) {
      return { ok: false, msg: 'Only ' + l.qtyLeft + ' left of ' + l.name };
    }
    if (!cart.items.length) cart.holdUntil = now() + HOLD_MS;
    if (line) line.qty = wanted; else cart.items.push({ id: id, qty: qty });
    cart.removed = [];
    save(); emit();
    return { ok: true, msg: 'Added ' + l.name + ' to your bag' };
  };

  Store.setQty = function (id, qty) {
    qty = parseInt(qty, 10) || 0;
    if (qty <= 0) return Store.removeFromCart(id);
    var line = state.cart.items.filter(function (it) { return it.id === id; })[0];
    var l = findListing(id);
    if (!line || !l) return { ok: false, msg: 'This item is not in your bag' };
    var msg = 'Quantity updated';
    if (qty > l.qtyLeft) { qty = l.qtyLeft; msg = 'Only ' + l.qtyLeft + ' left'; }
    line.qty = qty;
    save(); emit();
    return { ok: true, msg: msg };
  };

  Store.removeFromCart = function (id) {
    var before = state.cart.items.length;
    state.cart.items = state.cart.items.filter(function (it) { return it.id !== id; });
    if (!state.cart.items.length) state.cart.holdUntil = null;
    save(); emit();
    return { ok: state.cart.items.length < before, msg: 'Removed from your bag' };
  };

  Store.clearCart = function () {
    state.cart = { items: [], holdUntil: null, removed: [] };
    save(); emit();
  };

  /* ----- orders ----- */
  // Returns an array with one order per store, or [] if the bag is empty,
  // the hold has expired, or name/phone are missing.
  Store.placeOrder = function (details) {
    details = details || {};
    sweep();
    var name = String(details.name || '').trim();
    var phone = cleanPhone(details.phone);
    if (!state.cart.items.length || !name || !phone) return [];

    var byStore = {};
    state.cart.items.forEach(function (it) {
      var l = findListing(it.id);
      if (!l || statusOf(l) !== 'live') return;
      var qty = Math.min(it.qty, l.qtyLeft);
      if (qty <= 0) return;
      (byStore[l.storeId] = byStore[l.storeId] || []).push({ l: l, qty: qty });
    });

    var placedAt = now();
    var orders = Object.keys(byStore).map(function (storeId) {
      var lines = byStore[storeId];
      var order = {
        id: newId('o'),
        code: makeCode(),
        storeId: storeId,
        items: lines.map(function (x) {
          return { id: x.l.id, name: x.l.name, qty: x.qty, price: x.l.price, mrp: x.l.mrp, kgPerUnit: x.l.kgPerUnit };
        }),
        total: 0, saved: 0, kg: 0,
        placedAt: placedAt,
        pickupFrom: Math.max.apply(null, lines.map(function (x) { return x.l.pickupFrom; })),
        pickupTo: Math.min.apply(null, lines.map(function (x) { return x.l.pickupTo; })),
        status: 'reserved',
        customer: { name: name, phone: phone },
        payment: details.payment || 'pay-at-pickup'
      };
      order.items.forEach(function (it) {
        order.total += it.price * it.qty;
        order.saved += (it.mrp - it.price) * it.qty;
        order.kg += it.kgPerUnit * it.qty;
      });
      order.kg = round(order.kg, 2);
      lines.forEach(function (x) { x.l.qtyLeft -= x.qty; });
      return order;
    });

    if (!orders.length) return [];
    state.orders = orders.concat(state.orders);
    state.cart = { items: [], holdUntil: null, removed: [] };
    save(); emit();
    return clone(orders);
  };

  // Newest first. Reserved orders past their pickup time become 'missed'.
  Store.getOrders = function () {
    var changed = false;
    state.orders.forEach(function (o) {
      if (o.status === 'reserved' && now() > o.pickupTo) { o.status = 'missed'; changed = true; }
    });
    if (changed) { save(); setTimeout(emit, 0); }
    return clone(state.orders).sort(function (a, b) { return b.placedAt - a.placedAt; });
  };

  Store.cancelOrder = function (id) {
    var o = state.orders.filter(function (x) { return x.id === id; })[0];
    if (!o) return { ok: false, msg: 'Order not found' };
    if (o.status !== 'reserved') return { ok: false, msg: 'Only reserved orders can be cancelled' };
    o.status = 'cancelled';
    o.items.forEach(function (it) {
      var l = findListing(it.id);
      if (l) l.qtyLeft = Math.min(l.qty, l.qtyLeft + it.qty);
    });
    save(); emit();
    return { ok: true, msg: 'Order cancelled' };
  };

  Store.markPickedUp = function (id) {
    var o = state.orders.filter(function (x) { return x.id === id; })[0];
    if (!o) return { ok: false, msg: 'Order not found' };
    if (o.status !== 'reserved') return { ok: false, msg: 'Only reserved orders can be picked up' };
    o.status = 'picked';
    o.pickedAt = now();
    var store = findStore(o.storeId) || { name: 'Local shop' };
    var cats = [];
    o.items.forEach(function (it) {
      var l = findListing(it.id);
      if (l && cats.indexOf(l.category) === -1) cats.push(l.category);
    });
    state.history.push({
      id: newId('h'),
      orderId: o.id,
      storeId: o.storeId,
      storeName: store.name,
      items: o.items.map(function (it) { return { name: it.name, qty: it.qty }; }),
      categories: cats,
      kg: o.kg,
      saved: o.saved,
      date: o.pickedAt
    });
    save(); emit();
    return { ok: true, msg: 'Picked up. Thanks for rescuing ' + o.kg + ' kg of food' };
  };

  /* ----- impact ----- */
  // history entries: {id, orderId, storeId, storeName, items:[{name, qty}],
  //                   categories:[], kg, saved, date}
  Store.getImpact = function () {
    var history = clone(state.history).sort(function (a, b) { return b.date - a.date; });
    var kg = 0, saved = 0;
    var weeksWithRescue = {};
    history.forEach(function (h) {
      kg += h.kg;
      saved += h.saved;
      weeksWithRescue[weekIndex(h.date)] = (weeksWithRescue[weekIndex(h.date)] || 0) + 1;
    });

    // Last 12 weeks, oldest first, weeks start on Monday.
    var thisWeek = weekStart(now());
    var weeks = [];
    for (var i = 11; i >= 0; i--) {
      var d = new Date(thisWeek);
      d.setDate(d.getDate() - i * 7);
      var ws = d.getTime();
      weeks.push({ weekStart: ws, count: weeksWithRescue[weekIndex(ws)] || 0 });
    }

    // Current streak: consecutive weeks ending this week. This week does not
    // break the streak until it is over.
    var idx = weekIndex(now());
    if (!weeksWithRescue[idx]) idx -= 1;
    var current = 0;
    while (weeksWithRescue[idx]) { current++; idx--; }

    // Best streak over all history.
    var keys = Object.keys(weeksWithRescue).map(Number).sort(function (a, b) { return a - b; });
    var best = 0, run = 0;
    keys.forEach(function (k, j) {
      run = (j > 0 && k === keys[j - 1] + 1) ? run + 1 : 1;
      if (run > best) best = run;
    });

    return {
      kg: round(kg, 2),
      co2: round(kg * CO2_PER_KG, 2),
      saved: round(saved, 2),
      rescues: history.length,
      history: history,
      weeks: weeks,
      streak: { current: current, best: Math.max(best, current) }
    };
  };

  // Clears everything: orders, impact history, bag, user and your listings.
  // Fresh seed listings are created; impact history starts empty.
  Store.resetDemo = function () {
    var area = state ? state.area : null;
    state = freshState(false);
    if (area) state.area = area;
    save(); emit();
  };

  /* ----- selling ----- */
  // obj: {name, category, veg, mrp, price, qty, kgPerUnit?, allergens?, desc?,
  //       cookedAt?, pickupFrom, pickupTo, goodTill?, storeName?}
  // Returns {ok, errors: {field: message}, listing?}
  Store.addListing = function (obj) {
    obj = obj || {};
    var errors = {};
    var t = now();
    var name = String(obj.name || '').trim();
    var catIds = (window.CATEGORIES || []).map(function (c) { return c.id; });
    var price = Number(obj.price);
    var mrp = Number(obj.mrp);
    var qty = Number(obj.qty);
    var kg = obj.kgPerUnit == null || obj.kgPerUnit === '' ? 0.3 : Number(obj.kgPerUnit);
    var cookedAt = obj.cookedAt == null || obj.cookedAt === '' ? t : Number(obj.cookedAt);
    var pickupFrom = Number(obj.pickupFrom);
    var pickupTo = Number(obj.pickupTo);
    var goodTill = obj.goodTill == null || obj.goodTill === '' ? pickupTo + 60 * MIN : Number(obj.goodTill);

    if (name.length < 3) errors.name = 'Enter a name of at least 3 characters';
    else if (name.length > 60) errors.name = 'Keep the name under 60 characters';
    if (catIds.indexOf(obj.category) === -1) errors.category = 'Choose a category';
    if (!isNum(mrp) || mrp <= 0) errors.mrp = 'Enter the original price';
    if (!isNum(price) || price <= 0) errors.price = 'Enter the discounted price';
    else if (isNum(mrp) && price >= mrp) errors.price = 'The discounted price must be lower than the original price';
    if (!isNum(qty) || qty < 1 || qty > 99 || Math.floor(qty) !== qty) errors.qty = 'Enter a quantity from 1 to 99';
    if (!isNum(kg) || kg <= 0 || kg > 20) errors.kgPerUnit = 'Enter a weight between 0.01 and 20 kg';
    if (!isNum(cookedAt) || cookedAt > t + 5 * MIN) errors.cookedAt = 'The made time cannot be in the future';
    if (!isNum(pickupFrom)) errors.pickupFrom = 'Choose when pickup starts';
    if (!isNum(pickupTo)) errors.pickupTo = 'Choose when pickup ends';
    else if (pickupTo <= t) errors.pickupTo = 'Pickup must end later than now';
    else if (isNum(pickupFrom) && pickupTo <= pickupFrom) errors.pickupTo = 'Pickup must end after it starts';
    if (!isNum(goodTill) || (isNum(pickupTo) && goodTill < pickupTo)) errors.goodTill = 'Good till must be at or after the end of pickup';

    if (Object.keys(errors).length) return { ok: false, errors: errors };

    var area = state.area;
    if (!state.myShop) {
      state.myShop = {
        id: MY_SHOP_ID, name: 'Your shop', type: obj.category,
        lat: area.lat, lng: area.lng, address: area.name + ', Delhi', rating: null
      };
    }
    if (obj.storeName && String(obj.storeName).trim()) state.myShop.name = String(obj.storeName).trim().slice(0, 60);

    var allergens = Array.isArray(obj.allergens)
      ? obj.allergens
      : String(obj.allergens || '').split(',');
    var listing = {
      id: newId('m'),
      storeId: MY_SHOP_ID,
      name: name,
      category: obj.category,
      veg: !!obj.veg,
      mrp: mrp, price: price, qty: qty, qtyLeft: qty, kgPerUnit: kg,
      allergens: allergens.map(function (a) { return String(a).trim().toLowerCase(); }).filter(Boolean),
      desc: String(obj.desc || '').trim().slice(0, 280),
      cookedAt: cookedAt, pickupFrom: pickupFrom, pickupTo: pickupTo, goodTill: goodTill,
      status: 'live',
      createdAt: t
    };
    state.listings.push(listing);
    save(); emit();
    return { ok: true, errors: {}, listing: withStatus(listing) };
  };

  // Listings from "Your shop", newest first, including ended ones.
  Store.getMyListings = function () {
    return state.listings
      .filter(function (l) { return l.storeId === MY_SHOP_ID; })
      .map(withStatus)
      .sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
  };

  Store.endListing = function (id) {
    var l = findListing(id);
    if (!l || l.storeId !== MY_SHOP_ID) return { ok: false, msg: 'Listing not found' };
    l.ended = true;
    save(); emit();
    return { ok: true, msg: 'Listing ended' };
  };

  /* ----- user (no real passwords) ----- */
  Store.getUser = function () { return clone(state.user); };

  // Returns {ok, errors: {field: message}, user?}
  Store.signIn = function (details) {
    details = details || {};
    var errors = {};
    var name = String(details.name || '').trim();
    var phone = cleanPhone(details.phone);
    var email = String(details.email || '').trim();
    if (name.length < 2) errors.name = 'Enter your name';
    if (!phone) errors.phone = 'Enter a 10-digit Indian mobile number';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address, or leave it empty';
    if (Object.keys(errors).length) return { ok: false, errors: errors };
    state.user = { name: name, phone: phone, email: email };
    save(); emit();
    return { ok: true, errors: {}, user: clone(state.user) };
  };

  Store.signOut = function () {
    state.user = null;
    save(); emit();
  };

  /* ---------- start up ---------- */
  load();
  window.Store = Store;

  // Clear the bag when its 10-minute hold runs out, even if nobody is looking.
  setInterval(sweep, 1000);

  // Keep several open tabs in sync.
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { load(); emit(); }
  });
})();
