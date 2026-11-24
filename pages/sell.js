/* Golden Hour: Sell page. Owner: Member C.
   Uses only window.Store and window.UI. */
'use strict';

(function () {
  var root = document.querySelector('main.page-sell');
  if (!root) return;

  var categories = window.CATEGORIES || [];
  var endingId = null;

  function todayValue(minutesAhead) {
    var d = new Date(Date.now() + (minutesAhead || 0) * 60000);
    d.setSeconds(0, 0);
    var off = d.getTimezoneOffset();
    d = new Date(d.getTime() - off * 60000);
    return d.toISOString().slice(0, 16);
  }

  function field(name, label, control, hint) {
    return '<div class="field" data-field="' + name + '">' +
      '<label for="sell-' + name + '">' + label + '</label>' + control +
      (hint ? '<span class="field-hint" id="sell-' + name + '-hint">' + hint + '</span>' : '') +
      '<span class="field-error" id="sell-' + name + '-error" aria-live="polite"></span>' +
    '</div>';
  }

  function input(name, type, value, extra) {
    return '<input class="input" id="sell-' + name + '" name="' + name + '" type="' + type + '" value="' + UI.esc(value || '') + '" ' + (extra || '') + ' aria-describedby="sell-' + name + '-error">';
  }

  root.innerHTML = '' +
    '<header class="sell-header"><p class="eyebrow">Sell surplus</p><h1>List food shoppers can rescue</h1><p class="lead">Set a fair discount and a clear pickup window.</p></header>' +
    '<div class="sell-layout">' +
      '<form id="sell-form" novalidate>' +
        '<section class="sell-section card"><h2>Shop and item</h2>' +
          '<div class="sell-grid">' +
            field('storeName', 'Shop name', input('storeName', 'text', '', 'required maxlength="60" autocomplete="organization"')) +
            field('name', 'Item name', input('name', 'text', '', 'required maxlength="60"')) +
          '</div>' +
          '<div class="sell-grid">' +
            '<div class="field" data-field="category"><label for="sell-category">Category</label><select class="input" id="sell-category" name="category" required aria-describedby="sell-category-error"><option value="">Choose a category</option>' + categories.map(function (c) { return '<option value="' + UI.esc(c.id) + '">' + UI.esc(c.label) + '</option>'; }).join('') + '</select><span class="field-error" id="sell-category-error" aria-live="polite"></span></div>' +
            '<fieldset class="veg-choice"><legend>Food type</legend><label><input type="radio" name="veg" value="true" checked> Vegetarian</label><label><input type="radio" name="veg" value="false"> Non-vegetarian</label></fieldset>' +
          '</div>' +
        '</section>' +
        '<section class="sell-section card"><h2>Price and quantity</h2>' +
          '<div class="sell-grid sell-grid-four">' +
            field('mrp', 'Original price (₹)', input('mrp', 'number', '', 'required min="1" step="1"')) +
            field('price', 'Surplus price (₹)', input('price', 'number', '', 'required min="1" step="1"')) +
            field('qty', 'Quantity', input('qty', 'number', '', 'required min="1" max="99" step="1"')) +
            field('kgPerUnit', 'Weight per unit (kg)', input('kgPerUnit', 'number', '0.3', 'required min="0.01" max="20" step="0.01"')) +
          '</div>' +
        '</section>' +
        '<section class="sell-section card"><h2>Freshness and pickup</h2>' +
          '<div class="sell-time-grid">' +
            '<div class="sell-time-row">' +
              field('cookedAt', 'Made at', input('cookedAt', 'datetime-local', todayValue(-120), 'required')) +
              field('pickupFrom', 'Pickup from', input('pickupFrom', 'datetime-local', todayValue(0), 'required')) +
            '</div>' +
            '<div class="sell-time-row">' +
              field('pickupTo', 'Pickup until', input('pickupTo', 'datetime-local', todayValue(180), 'required')) +
              field('goodTill', 'Good till', input('goodTill', 'datetime-local', todayValue(240), 'required')) +
            '</div>' +
          '</div>' +
        '</section>' +
        '<section class="sell-section card"><h2>Extra details</h2>' +
          field('allergens', 'Allergens', input('allergens', 'text', '', 'placeholder="e.g. gluten, dairy"')) +
          '<div class="field" data-field="desc"><label for="sell-desc">Short description</label><textarea class="input" id="sell-desc" name="desc" maxlength="280" rows="4" placeholder="What should shoppers know?"></textarea><span class="field-error" id="sell-desc-error" aria-live="polite"></span></div>' +
        '</section>' +
        '<div id="sell-form-message" class="notice" hidden role="status"></div>' +
        '<button class="btn btn-primary sell-submit" type="submit">List this food</button>' +
      '</form>' +
      '<aside class="sell-preview" aria-labelledby="preview-title"><p class="eyebrow">Live preview</p><h2 id="preview-title">How it looks</h2><div id="sell-preview-card"></div></aside>' +
    '</div>' +
    '<section class="your-listings" aria-labelledby="your-listings-title"><div class="section-heading"><p class="eyebrow">Selling now</p><h2 id="your-listings-title">Your listings</h2></div><div id="your-listings-list" class="your-listings-list"></div></section>' +
    '<dialog id="end-listing-dialog" class="modal"><form method="dialog"><h2>End this listing?</h2><p id="end-listing-copy">Shoppers will no longer be able to reserve it.</p><div class="modal-actions"><button class="btn btn-ghost" value="cancel">Keep listing</button><button class="btn btn-danger" id="confirm-end-listing" value="confirm">End listing</button></div></form></dialog>';

  var form = root.querySelector('#sell-form');

  function numeric(name) { return Number(root.querySelector('[name="' + name + '"]').value); }
  function string(name) { var el = root.querySelector('[name="' + name + '"]'); return el ? el.value.trim() : ''; }
  function timestamps() {
    function ms(name) { var v = string(name); return v ? new Date(v).getTime() : NaN; }
    return { cookedAt: ms('cookedAt'), pickupFrom: ms('pickupFrom'), pickupTo: ms('pickupTo'), goodTill: ms('goodTill') };
  }

  function setError(name, message) {
    var wrap = root.querySelector('[data-field="' + name + '"]');
    var inputEl = root.querySelector('[name="' + name + '"]');
    var error = root.querySelector('#sell-' + name + '-error');
    if (inputEl) inputEl.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (wrap) wrap.classList.toggle('has-error', !!message);
    if (error) error.textContent = message || '';
  }

  function clearErrors() {
    var names = ['storeName','name','category','mrp','price','qty','kgPerUnit','cookedAt','pickupFrom','pickupTo','goodTill','allergens','desc'];
    names.forEach(function (name) { setError(name, ''); });
  }

  function validate() {
    clearErrors();
    var errors = {};
    var t = timestamps();
    var mrp = numeric('mrp');
    var price = numeric('price');
    var qty = numeric('qty');

    if (string('storeName').length < 2) errors.storeName = 'Enter your shop name';
    if (string('name').length < 3) errors.name = 'Enter an item name of at least 3 characters';
    if (!string('category')) errors.category = 'Choose a category';
    if (!(mrp > 0)) errors.mrp = 'Enter the original price';
    if (!(price > 0)) errors.price = 'Enter the discounted price';
    else if (mrp > 0 && price >= mrp) errors.price = 'The surplus price must be lower than the original price';
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) errors.qty = 'Enter a quantity from 1 to 99';
    var kg = numeric('kgPerUnit');
    if (!(kg > 0 && kg <= 20)) errors.kgPerUnit = 'Enter a weight between 0.01 and 20 kg';
    if (!(t.cookedAt > 0)) errors.cookedAt = 'Choose when the item was made';
    else if (t.cookedAt > Date.now() + 300000) errors.cookedAt = 'The made time cannot be in the future';
    if (!(t.pickupFrom > 0)) errors.pickupFrom = 'Choose when pickup starts';
    if (!(t.pickupTo > 0)) errors.pickupTo = 'Choose when pickup ends';
    else if (t.pickupTo <= Date.now()) errors.pickupTo = 'Pickup until must be later than now';
    else if (t.pickupFrom > 0 && t.pickupTo <= t.pickupFrom) errors.pickupTo = 'Pickup must end after it starts';
    if (!(t.goodTill > 0)) errors.goodTill = 'Choose a good-till time';
    else if (t.pickupTo > 0 && t.goodTill < t.pickupTo) errors.goodTill = 'Good till must be at or after pickup ends';

    Object.keys(errors).forEach(function (name) { setError(name, errors[name]); });
    return errors;
  }

  function preview() {
    var mrp = Number(string('mrp')) || 0;
    var price = Number(string('price')) || 0;
    var qty = Number(string('qty')) || 1;
    var t = timestamps();
    var listing = {
      id: 'preview', storeId: 's1', name: string('name') || 'Your item name',
      category: string('category') || (categories[0] && categories[0].id) || 'meals',
      veg: root.querySelector('[name="veg"]:checked').value === 'true',
      mrp: mrp, price: price, qty: qty, qtyLeft: qty,
      kgPerUnit: Number(string('kgPerUnit')) || 0.3,
      allergens: string('allergens').split(',').map(function (x) { return x.trim(); }).filter(Boolean),
      desc: string('desc'), cookedAt: t.cookedAt || Date.now(),
      pickupFrom: t.pickupFrom || Date.now(), pickupTo: t.pickupTo || Date.now() + 3600000,
      goodTill: t.goodTill || Date.now() + 7200000, status: 'live'
    };

    var previewStore = { id: 'my-shop', name: string('storeName') || 'Your shop', lat: 28.6315, lng: 77.2167, address: 'Your location', rating: null };
    var card = UI.itemCard(listing);
    card = card.replace('Khameer Bakehouse', UI.esc(previewStore.name));
    card = card.replace('Local shop', UI.esc(previewStore.name));
    root.querySelector('#sell-preview-card').innerHTML = card;
  }

  form.addEventListener('input', preview);
  form.addEventListener('change', preview);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var errors = validate();
    var message = root.querySelector('#sell-form-message');
    if (Object.keys(errors).length) {
      message.className = 'notice notice-error';
      message.textContent = 'Please fix the highlighted fields.';
      message.hidden = false;
      var first = Object.keys(errors)[0];
      var firstEl = root.querySelector('[name="' + first + '"]');
      if (firstEl) firstEl.focus();
      return;
    }

    var t = timestamps();
    var result = Store.addListing({
      storeName: string('storeName'), name: string('name'), category: string('category'),
      veg: root.querySelector('[name="veg"]:checked').value === 'true',
      mrp: numeric('mrp'), price: numeric('price'), qty: numeric('qty'), kgPerUnit: numeric('kgPerUnit'),
      cookedAt: t.cookedAt, pickupFrom: t.pickupFrom, pickupTo: t.pickupTo, goodTill: t.goodTill,
      allergens: string('allergens'), desc: string('desc')
    });

    if (!result.ok) {
      Object.keys(result.errors).forEach(function (name) { setError(name, result.errors[name]); });
      message.className = 'notice notice-error';
      message.textContent = 'Please check the listing details.';
      message.hidden = false;
      return;
    }

    form.reset();
    root.querySelector('[name="kgPerUnit"]').value = '0.3';
    root.querySelector('[name="cookedAt"]').value = todayValue(-120);
    root.querySelector('[name="pickupFrom"]').value = todayValue(0);
    root.querySelector('[name="pickupTo"]').value = todayValue(180);
    root.querySelector('[name="goodTill"]').value = todayValue(240);
    root.querySelector('[name="veg"]').checked = true;
    clearErrors();
    message.className = 'notice notice-success';
    message.textContent = 'Listing added. It is now visible on Browse.';
    message.hidden = false;
    UI.toast('Your listing is live');
    preview();
    renderListings();
  });

  function renderListings() {
    var list = Store.getMyListings();
    var target = root.querySelector('#your-listings-list');
    if (!list.length) {
      target.innerHTML = '<div class="empty-state sell-empty"><h3>No listings yet</h3><p>Add a surplus item above to make it available nearby.</p></div>';
      return;
    }

    target.innerHTML = list.map(function (listing) {
      var status = listing.status === 'live' ? '<span class="badge badge-fresh">Live</span>' : listing.status === 'soldout' ? '<span class="badge badge-urgent">Sold out</span>' : '<span class="badge badge-urgent">Ended</span>';
      var countdown = listing.status === 'live'
        ? '<span>Pickup closes in <span data-countdown="' + listing.pickupTo + '">' + UI.countdown(listing.pickupTo - Date.now()) + '</span></span>'
        : '<span>' + (listing.status === 'closed' ? 'Pickup ended' : 'No units left') + '</span>';
      return '<article class="listing-row card"><div class="listing-row-main"><div><h3>' + UI.esc(listing.name) + '</h3><p class="muted">' + UI.esc(listing.qtyLeft) + ' unit' + (listing.qtyLeft === 1 ? '' : 's') + ' left · ' + UI.rupee(listing.price) + '</p></div>' + status + '</div><div class="listing-row-foot"><p>' + countdown + '</p><button type="button" class="btn btn-ghost" data-end-listing="' + UI.esc(listing.id) + '"' + (listing.status === 'closed' ? ' disabled' : '') + '>End listing</button></div></article>';
    }).join('');

    var endButtons = target.querySelectorAll('[data-end-listing]');
    for (var i = 0; i < endButtons.length; i++) {
      endButtons[i].addEventListener('click', function () {
        endingId = this.getAttribute('data-end-listing');
        var listing = Store.getMyListings().filter(function (item) { return item.id === endingId; })[0];
        root.querySelector('#end-listing-copy').textContent = listing ? 'End “' + listing.name + '”? Shoppers will no longer be able to reserve it.' : 'Shoppers will no longer be able to reserve it.';
        var dialog = root.querySelector('#end-listing-dialog');
        if (typeof dialog.showModal === 'function') dialog.showModal();
      });
    }
  }

  root.querySelector('#confirm-end-listing').addEventListener('click', function (event) {
    event.preventDefault();
    if (!endingId) return;
    var result = Store.endListing(endingId);
    UI.toast(result.msg);
    endingId = null;
    root.querySelector('#end-listing-dialog').close();
    renderListings();
  });

  window.addEventListener('store:change', renderListings);
  preview();
  renderListings();
})();
