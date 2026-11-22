/* Golden Hour: Home and Browse page. Owner: Member B.
   Uses only Store and UI from the shared contract. */
(function () {
  'use strict';

  var root = document.querySelector('main.page-browse');
  if (!root) return;

  function $(sel) { return root.querySelector(sel); }

  var areaSelect = $('#area-select');
  var locBtn = $('#use-location');
  var locMsg = $('#loc-msg');
  var summary = $('#live-summary');
  var grid = $('#listing-grid');
  var closingSection = $('#closing-soon');
  var closingRow = $('#closing-row');
  var chipRow = $('#chip-row');
  var vegBox = $('#veg-only');
  var distInput = $('#dist');
  var distOut = $('#dist-out');
  var sortSel = $('#sort');
  var searchInput = $('#search');
  var countEl = $('#result-count');
  var form = $('#filters');
  var openBtn = $('#open-filters');
  var closeBtn = $('#close-filters');
  var applyBtn = $('#apply-filters');
  var drawerCount = $('#drawer-count');
  var backdrop = $('#filter-backdrop');
  var filterBadge = $('#filter-badge');

  var STORAGE_KEY = 'index-filters';
  var SUMMARY_RADIUS_KM = 5;
  var CLOSING_SOON_MIN = 60;

  /* ---------- helpers ---------- */

  function isOpen(l) {
    return l.status === 'live' && l.qtyLeft > 0 && l.pickupTo > Date.now();
  }

  function distanceOf(l) {
    var s = Store.getStore(l.storeId);
    return s ? Store.distanceKm(s) : Infinity;
  }

  function openListings() {
    return Store.getListings({ includeClosed: false }).filter(isOpen);
  }

  function discountOf(l) {
    return l.mrp > 0 ? (l.mrp - l.price) / l.mrp : 0;
  }

  function showLocMsg(text, isError) {
    if (!text) { locMsg.hidden = true; locMsg.textContent = ''; return; }
    locMsg.textContent = text;
    locMsg.classList.toggle('is-error', !!isError);
    locMsg.hidden = false;
  }

  // window.CATEGORIES may be an array or an object keyed by id; handle both.
  function categoryList() {
    var c = window.CATEGORIES || [];
    if (Array.isArray(c)) {
      return c.map(function (x) {
        var id = x.id || x.key || x.value;
        return { id: id, label: x.label || x.name || id };
      });
    }
    return Object.keys(c).map(function (k) {
      return { id: k, label: (c[k] && c[k].label) || k };
    });
  }

  function categoryLabel(id) {
    var found = categoryList().filter(function (c) { return c.id === id; })[0];
    return found ? found.label : id;
  }

  /* ---------- filter state (remembered in localStorage) ---------- */

  var DEFAULTS = { cat: 'all', veg: false, dist: 10, sort: 'ending', q: '' };

  var SORTS = {
    ending: function (a, b) { return a.pickupTo - b.pickupTo; },
    nearest: function (a, b) { return distanceOf(a) - distanceOf(b); },
    freshest: function (a, b) { return b.cookedAt - a.cookedAt; },
    discount: function (a, b) { return discountOf(b) - discountOf(a); },
    price: function (a, b) { return a.price - b.price; }
  };

  function loadFilters() {
    var f = {};
    for (var k in DEFAULTS) f[k] = DEFAULTS[k];
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        if (typeof saved.cat === 'string') f.cat = saved.cat;
        if (typeof saved.veg === 'boolean') f.veg = saved.veg;
        if (typeof saved.dist === 'number' && saved.dist >= 1 && saved.dist <= 10) f.dist = saved.dist;
        if (typeof saved.sort === 'string' && SORTS[saved.sort]) f.sort = saved.sort;
        if (typeof saved.q === 'string') f.q = saved.q;
      }
    } catch (e) { /* ignore broken saved data */ }
    return f;
  }

  function saveFilters() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(filters)); } catch (e) { /* storage may be blocked */ }
  }

  var filters = loadFilters();

  // If a saved category no longer exists, fall back to All.
  if (filters.cat !== 'all' && !categoryList().some(function (c) { return c.id === filters.cat; })) {
    filters.cat = 'all';
  }

  function activeFilterNames() {
    var names = [];
    if (filters.cat !== 'all') names.push('the category (' + categoryLabel(filters.cat) + ')');
    if (filters.veg) names.push('“Veg only”');
    if (filters.dist < 10) names.push('the distance (' + filters.dist + ' km)');
    if (filters.q.trim()) names.push('your search (“' + filters.q.trim() + '”)');
    return names;
  }

  function joinOr(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' or ' + items[items.length - 1];
  }

  function applyFilters(list) {
    var q = filters.q.trim().toLowerCase();
    return list.filter(function (l) {
      if (filters.cat !== 'all' && l.category !== filters.cat) return false;
      if (filters.veg && !l.veg) return false;
      if (distanceOf(l) > filters.dist) return false;
      if (q) {
        var s = Store.getStore(l.storeId);
        var hay = (l.name + ' ' + (s ? s.name : '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(SORTS[filters.sort]);
  }

  /* ---------- hero: area selector ---------- */

  function renderAreaSelect() {
    var current = Store.getArea();
    var ids = window.AREAS.map(function (a) { return a.id; });
    var listed = ids.indexOf(current.id) !== -1;
    var key = (listed ? '' : current.id + '|') + ids.join(',');

    // Only rebuild the options when they change, so keyboard focus isn't lost.
    if (areaSelect.getAttribute('data-key') !== key) {
      var html = window.AREAS.map(function (a) {
        return '<option value="' + UI.esc(a.id) + '">' + UI.esc(a.name) + '</option>';
      }).join('');
      if (!listed) {
        html = '<option value="' + UI.esc(current.id) + '">' + UI.esc(current.name || 'Your location') + '</option>' + html;
      }
      areaSelect.innerHTML = html;
      areaSelect.setAttribute('data-key', key);
    }
    areaSelect.value = current.id;
  }

  areaSelect.addEventListener('change', function () {
    showLocMsg('');
    Store.setArea(areaSelect.value);
  });

  /* ---------- hero: use my location ---------- */

  locBtn.addEventListener('click', function () {
    if (!('geolocation' in navigator)) {
      showLocMsg('Location isn’t available in this browser. Pick an area instead.', true);
      return;
    }
    locBtn.disabled = true;
    locBtn.textContent = 'Finding you…';
    showLocMsg('');
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        locBtn.disabled = false;
        locBtn.textContent = 'Use my location';
        Store.setCustomLocation(pos.coords.latitude, pos.coords.longitude);
        showLocMsg('Showing food near your location.', false);
      },
      function (err) {
        locBtn.disabled = false;
        locBtn.textContent = 'Use my location';
        var denied = err && err.code === 1;
        showLocMsg(
          (denied
            ? 'Location access was blocked, so we kept '
            : 'We couldn’t find your location, so we kept ') +
            Store.getArea().name + '. You can pick another area above.',
          true
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });

  /* ---------- hero: live summary ---------- */

  function renderSummary(list) {
    var near = list.filter(function (l) { return distanceOf(l) <= SUMMARY_RADIUS_KM; });
    if (!near.length) {
      summary.innerHTML = 'No listings within ' + SUMMARY_RADIUS_KM + ' km of ' +
        UI.esc(Store.getArea().name) + ' right now.';
      return;
    }
    var next = near.reduce(function (m, l) { return l.pickupTo < m ? l.pickupTo : m; }, Infinity);
    summary.innerHTML =
      '<strong>' + near.length + ' ' + (near.length === 1 ? 'listing' : 'listings') + '</strong>' +
      ' within ' + SUMMARY_RADIUS_KM + ' km, next pickup closes in ' +
      '<span data-countdown="' + next + '">' + UI.countdown(next - Date.now()) + '</span>';
  }

  /* ---------- closing soon row (ignores filters on purpose) ---------- */

  function renderClosingSoon(list) {
    var limit = Date.now() + CLOSING_SOON_MIN * 60000;
    var soon = list
      .filter(function (l) { return l.pickupTo <= limit; })
      .sort(SORTS.ending);
    if (!soon.length) {
      closingSection.hidden = true;
      closingRow.innerHTML = '';
      closingRow.__sig = '';
      return;
    }
    closingSection.hidden = false;
    var sig = signature(soon);
    if (closingRow.__sig === sig) return; // nothing changed, keep scroll position
    var scroll = closingRow.scrollLeft;
    closingRow.innerHTML = soon.map(function (l) {
      return '<div class="closing-item">' + UI.itemCard(l) + '</div>';
    }).join('');
    closingRow.scrollLeft = scroll;
    closingRow.__sig = sig;
  }

  /* ---------- filters: controls ---------- */

  function renderChips() {
    var cats = [{ id: 'all', label: 'All' }].concat(categoryList());
    chipRow.innerHTML = cats.map(function (c) {
      var on = filters.cat === c.id;
      return '<button type="button" class="chip' + (on ? ' selected is-selected' : '') + '"' +
        ' data-cat="' + UI.esc(c.id) + '" aria-pressed="' + on + '">' + UI.esc(c.label) + '</button>';
    }).join('');
  }

  function syncControls() {
    renderChips();
    vegBox.checked = filters.veg;
    distInput.value = filters.dist;
    distOut.textContent = filters.dist + ' km';
    sortSel.value = filters.sort;
    searchInput.value = filters.q;
  }

  function onFiltersChanged() {
    saveFilters();
    render();
  }

  chipRow.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cat]');
    if (!btn) return;
    filters.cat = btn.getAttribute('data-cat');
    renderChips();
    onFiltersChanged();
  });

  vegBox.addEventListener('change', function () {
    filters.veg = vegBox.checked;
    onFiltersChanged();
  });

  distInput.addEventListener('input', function () {
    filters.dist = Number(distInput.value);
    distOut.textContent = filters.dist + ' km';
    onFiltersChanged();
  });

  sortSel.addEventListener('change', function () {
    filters.sort = sortSel.value;
    onFiltersChanged();
  });

  searchInput.addEventListener('input', function () {
    filters.q = searchInput.value;
    onFiltersChanged();
  });

  function clearFilters() {
    for (var k in DEFAULTS) filters[k] = DEFAULTS[k];
    syncControls();
    onFiltersChanged();
  }

  // Every "Clear filters" button (bar, drawer, empty state) uses data-action.
  root.addEventListener('click', function (e) {
    if (e.target.closest('[data-action="clear-filters"]')) clearFilters();
  });

  /* ---------- listing grid + empty state ---------- */

  // A short fingerprint of what a list shows. The grid is only rewritten when it
  // changes, so the 30-second refresh doesn't reset scroll or keyboard focus.
  function signature(list) {
    return list.map(function (l) {
      return [l.id, l.qtyLeft, l.price, l.status, Math.round(distanceOf(l) * 10)].join(':');
    }).join('|');
  }

  function renderCount(n) {
    var active = activeFilterNames().length;
    var word = n === 1 ? 'listing' : 'listings';
    countEl.textContent = n + ' ' + word + (active ? ' match your filters' : ' available');
    drawerCount.textContent = '· ' + n + ' ' + word;
    filterBadge.textContent = active;
    filterBadge.hidden = !active;
  }

  function setGrid(sig, html) {
    if (grid.__sig === sig) return;
    grid.innerHTML = html;
    grid.__sig = sig;
  }

  function renderGrid(all, shown) {
    if (shown.length) {
      setGrid(signature(shown), shown.map(function (l) { return UI.itemCard(l); }).join(''));
      return;
    }
    var active = activeFilterNames();
    if (!all.length) {
      setGrid('empty-all',
        '<div class="empty-state" role="status">' +
        '<h3>Nothing to rescue right now</h3>' +
        '<p>New surplus food is listed through the day. Check back soon or try another area.</p>' +
        '</div>');
      return;
    }
    setGrid('empty-filters:' + active.join('|'),
      '<div class="empty-state" role="status">' +
      '<h3>No listings match</h3>' +
      '<p>Try changing ' + UI.esc(joinOr(active)) + ', or clear the filters to see everything nearby.</p>' +
      '<button type="button" class="btn btn-primary" data-action="clear-filters">Clear filters</button>' +
      '</div>');
  }

  /* ---------- filters drawer (phones only) ---------- */

  var phoneQuery = window.matchMedia('(max-width: 699px)');
  var lastFocus = null;

  function openDrawer() {
    if (!phoneQuery.matches) return;
    lastFocus = document.activeElement;
    form.classList.add('is-open');
    form.setAttribute('role', 'dialog');
    form.setAttribute('aria-modal', 'true');
    form.setAttribute('aria-labelledby', 'filters-title');
    backdrop.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeDrawer(returnFocus) {
    form.classList.remove('is-open');
    form.removeAttribute('role');
    form.removeAttribute('aria-modal');
    form.removeAttribute('aria-labelledby');
    backdrop.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (returnFocus && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Below 700px the filter form becomes a .drawer; above it, it sits inline.
  function applyMode() {
    if (phoneQuery.matches) {
      form.classList.add('drawer', 'is-sheet');
    } else {
      closeDrawer(false);
      form.classList.remove('drawer', 'is-sheet');
    }
  }

  openBtn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', function () { closeDrawer(true); });
  applyBtn.addEventListener('click', function () { closeDrawer(true); });
  backdrop.addEventListener('click', function () { closeDrawer(true); });

  document.addEventListener('keydown', function (e) {
    if (!form.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeDrawer(true); return; }
    if (e.key !== 'Tab') return;
    // Keep Tab inside the open drawer.
    var items = Array.prototype.filter.call(
      form.querySelectorAll('button, input, select'),
      function (el) { return !el.disabled && el.getClientRects().length > 0; }
    );
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  if (phoneQuery.addEventListener) phoneQuery.addEventListener('change', applyMode);
  else if (phoneQuery.addListener) phoneQuery.addListener(applyMode);

  /* ---------- render ---------- */

  function render() {
    renderAreaSelect();
    var all = openListings();
    var shown = applyFilters(all);
    renderSummary(all);
    renderClosingSoon(all);
    renderCount(shown.length);
    renderGrid(all, shown);
  }

  window.addEventListener('store:change', render);
  // Re-check every 30 seconds so closed and sold-out items disappear by themselves.
  setInterval(render, 30000);
  syncControls();
  applyMode();
  render();
})();