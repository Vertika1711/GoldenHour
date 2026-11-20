/* =========================================================================
   Golden Hour — shared layout and UI helpers (owner: Member A)
   FROZEN after setup: only Member A edits this file.
   Fills #app-header and #app-footer, adds the phone tab bar, runs one
   1-second ticker for [data-countdown] and freshness bars, and handles
   every [data-add] button. See CONTRACT.md for window.UI.
   ========================================================================= */
(function () {
  'use strict';

  var MIN = 60 * 1000;
  var TAGLINE = "Surplus food near you, before it's gone";

  /* ---------- icons (decorative, 24x24 stroke) ---------- */
  function icon(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths + '</svg>';
  }
  var ICONS = {
    browse: icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    orders: icon('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
    impact: icon('<path d="M5 20c0-9 6-15 15-15 0 9-6 15-15 15z"/><path d="M5 20l8-8"/>'),
    sell:   icon('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>'),
    bag:    icon('<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    user:   icon('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>')
  };

  // Sun setting behind a plate.
  var LOGO =
    '<svg class="logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<g class="logo-rays"><path d="M24 11V6"/><path d="M12.7 16.7 9.5 13.5"/><path d="M35.3 16.7l3.2-3.2"/>' +
      '<path d="M8.9 23.5 4.5 22"/><path d="M39.1 23.5l4.4-1.5"/></g>' +
      '<path class="logo-sun" d="M11 30a13 13 0 0 1 26 0z"/>' +
      '<ellipse class="logo-plate" cx="24" cy="32" rx="21" ry="6.5"/>' +
      '<ellipse class="logo-plate-inner" cx="24" cy="31" rx="12" ry="3"/>' +
    '</svg>';

  // Pages in the main navigation. "match" lists the files that highlight the link.
  var NAV = [
    { key: 'browse', label: 'Browse', href: 'index.html',  match: ['index.html', 'item.html'] },
    { key: 'orders', label: 'Orders', href: 'orders.html', match: ['orders.html'] },
    { key: 'impact', label: 'Impact', href: 'impact.html', match: ['impact.html'] },
    { key: 'sell',   label: 'Sell',   href: 'sell.html',   match: ['sell.html'] }
  ];

  function currentFile() {
    var f = location.pathname.split('/').pop();
    return f || 'index.html';
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* =====================================================================
     window.UI
     ===================================================================== */
  var UI = {};

  // 123456 -> "₹1,23,456"
  UI.rupee = function (n) {
    n = Number(n) || 0;
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  // Clock time, e.g. "4:30 pm". Adds "tomorrow", "yesterday" or a date when not today.
  UI.time = function (ts) {
    var d = new Date(ts);
    var h = d.getHours();
    var clock = ((h % 12) || 12) + ':' + pad(d.getMinutes()) + ' ' + (h < 12 ? 'am' : 'pm');
    var today = new Date();
    if (sameDay(d, today)) return clock;
    var tmr = new Date(today); tmr.setDate(today.getDate() + 1);
    if (sameDay(d, tmr)) return 'tomorrow ' + clock;
    var yst = new Date(today); yst.setDate(today.getDate() - 1);
    if (sameDay(d, yst)) return 'yesterday ' + clock;
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + clock;
  };

  // Relative time, e.g. "just now", "5 min ago", "2 h ago", "in 20 min".
  UI.ago = function (ts) {
    var diff = Date.now() - ts;
    var future = diff < 0;
    var m = Math.round(Math.abs(diff) / MIN);
    var text;
    if (m < 1) return 'just now';
    if (m < 60) text = m + ' min';
    else if (m < 24 * 60) text = Math.round(m / 60) + ' h';
    else {
      var days = Math.round(m / (24 * 60));
      if (days === 1) return future ? 'tomorrow' : 'yesterday';
      if (days < 7) text = days + ' days';
      else { var d = new Date(ts); return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
    }
    return future ? 'in ' + text : text + ' ago';
  };

  // Milliseconds left -> "12:39" under 1 hour, "1h 05m" from 1 hour. 0 or less -> "0:00".
  UI.countdown = function (ms) {
    if (!(ms > 0)) return '0:00';
    var s = Math.floor(ms / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    return h > 0 ? h + 'h ' + pad(m) + 'm' : m + ':' + pad(sec);
  };

  // Escape text before putting it into HTML.
  UI.esc = function (str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  // Read a value from the URL query string.
  UI.param = function (name) {
    return new URLSearchParams(location.search).get(name);
  };

  // How much of the made -> good till time is left.
  // tone: 'fresh' | 'ok' | 'urgent' (matches .badge-fresh / .badge-ok / .badge-urgent)
  UI.freshness = function (listing) {
    var total = Math.max(1, listing.goodTill - listing.cookedAt);
    var pct = Math.round(((listing.goodTill - Date.now()) / total) * 100);
    pct = Math.max(0, Math.min(100, pct));
    if (pct >= 60) return { pct: pct, label: 'Very fresh', tone: 'fresh' };
    if (pct >= 25) return { pct: pct, label: 'Fresh', tone: 'ok' };
    return { pct: pct, label: 'Eat soon', tone: 'urgent' };
  };

  function barPos(start, end, ts) {
    var p = ((ts - start) / Math.max(1, end - start)) * 100;
    return Math.max(0, Math.min(100, p));
  }

  // Freshness timeline: made -> good till, pickup window outlined, moving "now" marker.
  UI.freshBar = function (l) {
    var from = barPos(l.cookedAt, l.goodTill, l.pickupFrom);
    var to = barPos(l.cookedAt, l.goodTill, l.pickupTo);
    var nowP = barPos(l.cookedAt, l.goodTill, Date.now());
    var label = 'Freshness: made ' + UI.time(l.cookedAt) + ', pickup ' + UI.time(l.pickupFrom) +
      ' to ' + UI.time(l.pickupTo) + ', good till ' + UI.time(l.goodTill);
    return '' +
      '<div class="freshbar" data-start="' + l.cookedAt + '" data-end="' + l.goodTill + '" role="img" aria-label="' + UI.esc(label) + '">' +
        '<div class="freshbar-key" aria-hidden="true">Pickup ' + UI.esc(UI.time(l.pickupFrom)) + '–' + UI.esc(UI.time(l.pickupTo)) + '</div>' +
        '<div class="freshbar-track">' +
          '<span class="freshbar-window" style="left:' + from.toFixed(1) + '%;width:' + (to - from).toFixed(1) + '%" title="Pickup window"></span>' +
          '<span class="freshbar-now" style="left:' + nowP.toFixed(1) + '%" title="Now"></span>' +
        '</div>' +
        '<div class="freshbar-labels" aria-hidden="true">' +
          '<span>Made <span class="nowrap">' + UI.esc(UI.ago(l.cookedAt)) + '</span></span>' +
          '<span>Good till <span class="nowrap">' + UI.esc(UI.time(l.goodTill)) + '</span></span>' +
        '</div>' +
      '</div>';
  };

  function categoryOf(id) {
    var list = window.CATEGORIES || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0] || { tint: '', svg: '', label: '' };
  }

  /* ---------- Add button / in-bag stepper ----------
     Any button with data-add="<id>" is managed here. layout.js wraps it in
     <span class="add-control" data-add-control="<id>"> and, whenever the bag
     or the listing changes, shows one of:
       - the Add button (item not in bag),
       - a disabled button with the reason (sold out / pickup ended),
       - a stepper "− 2 +" (item in bag), with + disabled at "Max in bag". */
  var MAX_NOTE = 'Max in bag';

  function bagQty(id) {
    var items = window.Store.getCart().items;
    for (var i = 0; i < items.length; i++) if (items[i].listing.id === id) return items[i].qty;
    return 0;
  }

  function controlSig(l, inBag) {
    return l ? l.status + '|' + l.qtyLeft + '|' + inBag : 'missing';
  }

  // Inner HTML of an .add-control. label/cls come from the original button.
  function controlInner(id, l, inBag, label, cls) {
    var esc = UI.esc;
    var name = l ? esc(l.name) : 'this item';
    if (l && inBag > 0) {
      var atMax = inBag >= l.qtyLeft;
      return '' +
        '<span class="stepper" role="group" aria-label="' + name + ' in your bag">' +
          '<button class="stepper-btn" type="button" data-step="-1" data-role="minus" ' +
            'aria-label="Remove one ' + name + ' (' + inBag + ' in bag)">−</button>' +
          '<span class="stepper-qty" aria-hidden="true">' + inBag + '</span>' +
          '<button class="stepper-btn" type="button" data-step="1" data-role="plus" ' +
            (atMax ? 'aria-disabled="true" aria-label="' + MAX_NOTE + ' (' + inBag + ')"'
                   : 'aria-label="Add one more ' + name + ' (' + inBag + ' in bag)"') + '>+</button>' +
        '</span>' +
        (atMax ? '<span class="add-control-note">' + MAX_NOTE + '</span>' : '');
    }
    var reason = !l ? 'Unavailable' : l.status === 'soldout' ? 'Sold out' : l.status === 'closed' ? 'Pickup ended' : '';
    if (reason) {
      return '<button class="' + esc(cls.replace('btn-primary', '').trim() || 'btn') + '" type="button" data-add="' + esc(id) +
        '" data-role="add" disabled>' + reason + '</button>';
    }
    return '<button class="' + esc(cls) + '" type="button" data-add="' + esc(id) + '" data-role="add" ' +
      'aria-label="Add ' + name + ' to bag">' + label + '</button>';
  }

  // Full .add-control HTML, used by itemCard so the first paint is already right.
  function controlHtml(l, label, cls) {
    var inBag = bagQty(l.id);
    return '<span class="add-control" data-add-control="' + UI.esc(l.id) + '" data-label="' + UI.esc(label) +
      '" data-cls="' + UI.esc(cls) + '" data-sig="' + controlSig(l, inBag) + '">' +
      controlInner(l.id, l, inBag, UI.esc(label), cls) + '</span>';
  }

  // Wrap any bare [data-add] button (e.g. on the item page) so it is managed too.
  function wrapBareButtons() {
    var btns = document.querySelectorAll('[data-add]');
    for (var i = 0; i < btns.length; i++) {
      var btn = btns[i];
      if (btn.closest('[data-add-control]')) continue;
      var wrap = document.createElement('span');
      wrap.className = 'add-control';
      wrap.setAttribute('data-add-control', btn.getAttribute('data-add'));
      wrap.setAttribute('data-label', btn.textContent.trim() || 'Add');
      wrap.setAttribute('data-cls', btn.className || 'btn btn-primary');
      btn.parentNode.insertBefore(wrap, btn);
      wrap.appendChild(btn);
    }
  }

  // Bring every add control, "N left" label and card on the page up to date.
  function syncControls() {
    wrapBareButtons();
    var cartQty = {};
    window.Store.getCart().items.forEach(function (it) { cartQty[it.listing.id] = it.qty; });
    var cache = {};
    function listing(id) {
      if (!(id in cache)) cache[id] = window.Store.getListing(id);
      return cache[id];
    }

    var wraps = document.querySelectorAll('[data-add-control]');
    for (var i = 0; i < wraps.length; i++) {
      var wrap = wraps[i];
      var id = wrap.getAttribute('data-add-control');
      var l = listing(id);
      var inBag = cartQty[id] || 0;
      var sig = controlSig(l, inBag);
      if (wrap.getAttribute('data-sig') === sig) continue;
      wrap.setAttribute('data-sig', sig);

      // Keep keyboard focus on the equivalent control after re-rendering.
      var focused = wrap.contains(document.activeElement) ? document.activeElement.getAttribute('data-role') : null;
      wrap.innerHTML = controlInner(id, l, inBag, UI.esc(wrap.getAttribute('data-label') || 'Add'),
        wrap.getAttribute('data-cls') || 'btn btn-primary');
      if (focused) {
        var target = wrap.querySelector('[data-role="' + focused + '"]') ||
                     wrap.querySelector('[data-role="plus"]') ||
                     wrap.querySelector('[data-role="add"]');
        if (target) target.focus();
      }
    }

    var lefts = document.querySelectorAll('[data-left]');
    for (var j = 0; j < lefts.length; j++) {
      var lid = lefts[j].getAttribute('data-left');
      var ll = listing(lid);
      var canAdd = ll && ll.status === 'live' ? ll.qtyLeft - (cartQty[lid] || 0) : 0;
      var text = canAdd > 0 ? ' · ' + canAdd + ' left' : '';
      if (lefts[j].textContent !== text) lefts[j].textContent = text;
    }

    var cards = document.querySelectorAll('[data-listing]');
    for (var k = 0; k < cards.length; k++) {
      var cl = listing(cards[k].getAttribute('data-listing'));
      cards[k].classList.toggle('is-unavailable', !cl || cl.status !== 'live');
    }
  }

  // Listing card. Links to item.html?id=..., has an Add button / stepper.
  UI.itemCard = function (l) {
    var esc = UI.esc;
    var t = Date.now();
    var store = window.Store.getStore(l.storeId) || { name: 'Local shop', rating: null };
    var dist = window.Store.distanceKm(store);
    var cat = categoryOf(l.category);
    var off = l.mrp > 0 ? Math.round((1 - l.price / l.mrp) * 100) : 0;
    var fr = UI.freshness(l);
    var live = l.status === 'live';
    var endsSoon = live && l.pickupTo - t > 0 && l.pickupTo - t <= 30 * MIN;
    var canAdd = live ? l.qtyLeft - bagQty(l.id) : 0;

    var meta;
    if (l.status === 'closed') meta = 'Pickup has ended';
    else if (t < l.pickupFrom) meta = '<span class="item-card-when">Pickup opens at ' + esc(UI.time(l.pickupFrom)) + '</span>';
    else meta = '<span class="item-card-when">Pickup ends in <span data-countdown="' + l.pickupTo + '">' + UI.countdown(l.pickupTo - t) + '</span></span>';
    meta += '<span data-left="' + esc(l.id) + '">' + (canAdd > 0 ? ' · ' + canAdd + ' left' : '') + '</span>';

    var rating = store.rating
      ? '<span><span aria-hidden="true">· ★ ' + store.rating + '</span><span class="sr-only">, rated ' + store.rating + ' out of 5</span></span>'
      : '<span>· New</span>';

    return '' +
      '<article class="card item-card' + (live ? '' : ' is-unavailable') + '" data-listing="' + esc(l.id) + '">' +
        '<a class="item-card-link" href="item.html?id=' + encodeURIComponent(l.id) + '">' +
          '<div class="item-card-media" style="--tint:' + esc(cat.tint) + '">' +
            cat.svg +
            '<div class="item-card-badges">' +
              (off > 0 ? '<span class="badge badge-highlight">' + off + '% off</span>' : '') +
              '<span class="badge badge-urgent" data-ends-soon="' + l.pickupTo + '"' + (endsSoon ? '' : ' hidden') + '>Ends soon</span>' +
            '</div>' +
          '</div>' +
          '<div class="item-card-body">' +
            '<p class="item-card-store"><span class="item-card-storename">' + esc(store.name) + '</span>' +
              (dist != null ? '<span>· ' + dist + ' km</span>' : '') + rating + '</p>' +
            '<h3 class="item-card-title">' +
              '<span class="veg-dot' + (l.veg ? '' : ' nonveg') + '" role="img" aria-label="' + (l.veg ? 'Vegetarian' : 'Non-vegetarian') + '"></span>' +
              '<span>' + esc(l.name) + '</span>' +
            '</h3>' +
            '<p class="item-card-price"><strong>' + UI.rupee(l.price) + '</strong> ' +
              '<s><span class="sr-only">was </span>' + UI.rupee(l.mrp) + '</s></p>' +
          '</div>' +
        '</a>' +
        '<div class="item-card-foot">' +
          '<p class="item-card-meta">' + meta + '</p>' +
          UI.freshBar(l) +
          '<div class="item-card-actions">' +
            '<span class="badge badge-' + fr.tone + ' item-card-fresh">' + fr.label + '</span>' +
            controlHtml(l, 'Add', 'btn btn-primary') +
          '</div>' +
        '</div>' +
      '</article>';
  };

  // Short message at the bottom of the screen, read out by screen readers.
  UI.toast = function (msg) {
    var region = document.getElementById('toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toast-region';
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    region.appendChild(el);
    setTimeout(function () { el.classList.add('is-leaving'); }, 2700);
    setTimeout(function () { el.remove(); }, 3000);
  };

  /* =====================================================================
     Header, footer, tab bar
     ===================================================================== */
  function navLinks(cls, withIcons) {
    var file = currentFile();
    return NAV.map(function (n) {
      var current = n.match.indexOf(file) !== -1 ? ' aria-current="page"' : '';
      return '<a class="' + cls + '" href="' + n.href + '"' + current + '>' +
        (withIcons ? ICONS[n.key] : '') + '<span>' + n.label + '</span></a>';
    }).join('');
  }

  function actionsHtml() {
    var file = currentFile();
    var user = window.Store.getUser();
    var cart = window.Store.getCart();
    var count = cart.items.reduce(function (sum, it) { return sum + it.qty; }, 0);

    var account = user
      ? '<a class="btn btn-ghost" href="login.html"' + (file === 'login.html' ? ' aria-current="page"' : '') + '>' +
          '<span class="sr-only">Account: </span>' + UI.esc(user.name.split(' ')[0]) + '</a>'
      : '<a class="btn btn-ghost" href="login.html?next=' + encodeURIComponent(file) + '"' +
          (file === 'login.html' ? ' aria-current="page"' : '') + '>Sign in</a>';

    var bagLabel = 'Bag, ' + count + (count === 1 ? ' item' : ' items');
    var bag = '<a class="btn btn-primary" href="cart.html" aria-label="' + bagLabel + '"' +
      (file === 'cart.html' ? ' aria-current="page"' : '') + '>' +
      ICONS.bag + '<span class="bag-label">Bag</span>' +
      (count > 0 ? '<span class="bag-count">' + count + '</span>' : '') + '</a>';

    return account + bag;
  }

  function renderHeader() {
    var el = document.getElementById('app-header');
    if (!el) return;
    el.innerHTML = '' +
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<header class="site-header">' +
        '<div class="container header-inner">' +
          '<a class="brand" href="index.html">' + LOGO +
            '<span class="brand-text"><span class="brand-name">Golden Hour</span>' +
            '<span class="brand-tagline">' + UI.esc(TAGLINE) + '</span></span>' +
          '</a>' +
          '<nav class="main-nav" aria-label="Main">' + navLinks('nav-link', false) + '</nav>' +
          '<div class="header-actions" id="header-actions">' + actionsHtml() + '</div>' +
        '</div>' +
      '</header>';
  }

  function renderActions() {
    var el = document.getElementById('header-actions');
    if (el) el.innerHTML = actionsHtml();
  }

  function renderFooter() {
    var el = document.getElementById('app-footer');
    if (!el) return;
    el.innerHTML = '' +
      '<footer class="site-footer">' +
        '<div class="container footer-inner">' +
          '<div>' +
            '<a class="brand" href="index.html">' + LOGO + '<span class="brand-name">Golden Hour</span></a>' +
            '<p class="footer-tagline">' + UI.esc(TAGLINE) + '</p>' +
          '</div>' +
          '<nav aria-label="Footer"><ul class="footer-links">' +
            NAV.map(function (n) { return '<li><a href="' + n.href + '">' + n.label + '</a></li>'; }).join('') +
            '<li><a href="cart.html">Bag</a></li>' +
          '</ul></nav>' +
          '<p class="footer-note">A student project. Listings, orders and payments are simulated. © ' +
            new Date().getFullYear() + ' Golden Hour</p>' +
        '</div>' +
      '</footer>' +
      '<nav class="tab-bar" aria-label="Main">' + navLinks('tab-link', true) + '</nav>';
  }

  /* =====================================================================
     One ticker for every countdown and freshness bar
     ===================================================================== */
  function tick() {
    var t = Date.now();
    var timers = document.querySelectorAll('[data-countdown]');
    for (var i = 0; i < timers.length; i++) {
      var el = timers[i];
      var left = Number(el.getAttribute('data-countdown')) - t;
      var text = UI.countdown(left);
      if (el.textContent !== text) el.textContent = text;
      el.classList.toggle('is-urgent', left > 0 && left <= 30 * MIN);
      el.classList.toggle('is-over', left <= 0);
    }
    var bars = document.querySelectorAll('.freshbar');
    for (var j = 0; j < bars.length; j++) {
      var bar = bars[j];
      var marker = bar.querySelector('.freshbar-now');
      if (!marker) continue;
      var p = barPos(Number(bar.getAttribute('data-start')), Number(bar.getAttribute('data-end')), t);
      marker.style.left = p.toFixed(2) + '%';
    }
    // "Ends soon" only while pickup closes within 30 minutes and the item is still available.
    var soon = document.querySelectorAll('[data-ends-soon]');
    for (var k = 0; k < soon.length; k++) {
      var leftMs = Number(soon[k].getAttribute('data-ends-soon')) - t;
      var show = leftMs > 0 && leftMs <= 30 * MIN && !soon[k].closest('.is-unavailable');
      if (soon[k].hidden === show) soon[k].hidden = !show;
    }
    // Catches items closing over time and controls added after the last change.
    syncControls();
  }

  /* =====================================================================
     One click handler for every [data-add] button and stepper
     ===================================================================== */
  function onClick(e) {
    if (!e.target.closest) return;
    var step = e.target.closest('[data-step]');
    if (step) {
      e.preventDefault();
      if (step.getAttribute('aria-disabled') === 'true') { UI.toast(MAX_NOTE); return; }
      var wrap = step.closest('[data-add-control]');
      if (!wrap) return;
      var id = wrap.getAttribute('data-add-control');
      var next = bagQty(id) + Number(step.getAttribute('data-step'));
      var l = window.Store.getListing(id);
      var res = window.Store.setQty(id, next);
      if (next <= 0) UI.toast('Removed ' + (l ? l.name : 'item') + ' from your bag');
      else if (res && res.msg && res.msg.indexOf('Only') === 0) UI.toast(res.msg);
      return;
    }
    var btn = e.target.closest('[data-add]');
    if (!btn || btn.disabled) return;
    e.preventDefault();
    var r = window.Store.addToCart(btn.getAttribute('data-add'), 1);
    UI.toast(r.msg);
  }

  /* ---------- start up ---------- */
  window.UI = UI;

  function init() {
    renderHeader();
    renderFooter();
    tick();
    setInterval(tick, 1000);
    document.addEventListener('click', onClick);
    window.addEventListener('store:change', function () {
      renderActions();
      syncControls();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
