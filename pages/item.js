/* Golden Hour: Item detail page. Owner: Member C.
   Uses only window.Store and window.UI. */
'use strict';

(function () {
  var root = document.querySelector('main.page-item');
  if (!root) return;

  var id = UI.param('id');
  var quantity = 1;

  function categoryFor(listing) {
    var categories = window.CATEGORIES || [];
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === listing.category) return categories[i];
    }
    return { label: 'Food', tint: 'var(--surface-2)', svg: '' };
  }

  function missingState() {
    root.innerHTML = '' +
      '<section class="item-missing empty-state" role="status">' +
        '<div class="item-missing-mark" aria-hidden="true">!</div>' +
        '<h1>This listing isn\'t available</h1>' +
        '<p>It may have sold out or the store may have ended it.</p>' +
        '<a class="btn btn-primary" href="index.html">Browse food</a>' +
      '</section>';
  }

  function discount(listing) {
    if (!listing.mrp) return 0;
    return Math.max(0, Math.round((1 - listing.price / listing.mrp) * 100));
  }

  function timeline(listing) {
    var now = Date.now();
    var stops = [
      { key: 'Made', time: listing.cookedAt, detail: UI.ago(listing.cookedAt) },
      { key: 'Pickup opens', time: listing.pickupFrom, detail: listing.pickupFrom > now ? 'Opens in ' + UI.countdown(listing.pickupFrom - now) : 'Now open' },
      { key: 'Pickup closes', time: listing.pickupTo, detail: '<span data-countdown="' + listing.pickupTo + '">' + UI.countdown(listing.pickupTo - now) + '</span>' },
      { key: 'Good till', time: listing.goodTill, detail: UI.time(listing.goodTill) }
    ];

    var earliest = listing.cookedAt;
    var latest = listing.goodTill;
    var nowPosition = (now - earliest) / Math.max(1, latest - earliest) * 100;
    nowPosition = Math.max(0, Math.min(100, nowPosition));

    var html = '';
    for (var i = 0; i < stops.length; i++) {
      var stop = stops[i];
      var position = (stop.time - earliest) / Math.max(1, latest - earliest) * 100;
      var state = stop.time <= now ? ' is-past' : '';
      if (i === stops.length - 1 && now > listing.goodTill) state = ' is-past';
      html += '<li class="timeline-stop' + state + '" style="--stop-position:' + position.toFixed(2) + '%">' +
        '<span class="timeline-dot" aria-hidden="true"></span>' +
        '<div><strong>' + UI.esc(stop.key) + '</strong>' +
        '<span class="timeline-time">' + UI.esc(UI.time(stop.time)) + '</span>' +
        '<span class="timeline-detail">' + stop.detail + '</span></div>' +
      '</li>';
    }

    var freshness = UI.freshness(listing);
    return '' +
      '<section class="item-freshness card" aria-labelledby="freshness-title">' +
        '<div class="freshness-heading">' +
          '<div><p class="eyebrow">Freshness timeline</p><h2 id="freshness-title">Know what stays fresh</h2></div>' +
          '<span class="badge badge-' + freshness.tone + '" data-freshness-label>' + UI.esc(freshness.label) + '</span>' +
        '</div>' +
        '<div class="timeline-wrap">' +
          '<span class="timeline-now" style="top:' + nowPosition.toFixed(2) + '%" aria-label="Now"><span>Now</span></span>' +
          '<ol class="freshness-timeline">' + html + '</ol>' +
        '</div>' +
        '<div class="item-freshbar">' + UI.freshBar(listing) + '</div>' +
        '<p class="freshness-note">Times are set by the store and checked at pickup.</p>' +
      '</section>';
  }

  function allergenHtml(listing) {
    if (!listing.allergens || !listing.allergens.length) {
      return '<span class="chip item-no-allergens">No allergens listed</span>';
    }
    return listing.allergens.map(function (allergen) {
      return '<span class="chip">' + UI.esc(allergen) + '</span>';
    }).join('');
  }

  function render() {
    var listing = Store.getListing(id);
    if (!listing) { missingState(); return; }

    var store = Store.getStore(listing.storeId);
    var category = categoryFor(listing);
    var distance = store ? Store.distanceKm(store) : null;
    var off = discount(listing);
    var unavailable = listing.status !== 'live';
    var atMax = quantity >= listing.qtyLeft;

    var bagLine = Store.getCart().items.filter(function (line) { return line.listing.id === listing.id; })[0];
    var bagQty = bagLine ? bagLine.qty : 0;
    var remaining = Math.max(0, listing.qtyLeft - bagQty);
    if (quantity > remaining && remaining > 0) quantity = remaining;

    var statusBadge = listing.status === 'live'
      ? '<span class="badge badge-fresh">Available</span>'
      : listing.status === 'soldout'
        ? '<span class="badge badge-urgent">Sold out</span>'
        : '<span class="badge badge-urgent">Pickup ended</span>';

    var reason = listing.status === 'soldout' ? 'Sold out' : listing.status === 'closed' ? 'Pickup ended' : '';

    root.innerHTML = '' +
      '<nav class="item-breadcrumb" aria-label="Breadcrumb"><a href="index.html">Browse</a><span aria-hidden="true">/</span><span>' + UI.esc(listing.name) + '</span></nav>' +
      '<article class="item-detail">' +
        '<section class="item-hero card">' +
          '<div class="item-illustration" style="--tint:' + UI.esc(category.tint) + '">' +
            category.svg +
            '<div class="item-illustration-badges"><span class="badge badge-highlight">' + off + '% off</span>' + statusBadge + '</div>' +
          '</div>' +
          '<div class="item-summary">' +
            '<p class="item-category">' + UI.esc(category.label) + '</p>' +
            '<h1><span class="veg-dot' + (listing.veg ? '' : ' nonveg') + '" role="img" aria-label="' + (listing.veg ? 'Vegetarian' : 'Non-vegetarian') + '"></span>' + UI.esc(listing.name) + '</h1>' +
            '<p class="item-store"><strong>' + UI.esc(store ? store.name : 'Local shop') + '</strong><span>' + UI.esc(store ? store.address : '') + '</span></p>' +
            '<p class="item-store-meta">' + (distance != null ? distance + ' km away' : 'Nearby') + ' · ★ ' + (store ? store.rating : 'New') + '</p>' +
            '<div class="item-price"><strong>' + UI.rupee(listing.price) + '</strong><s>' + UI.rupee(listing.mrp) + '</s><span>you save ' + UI.rupee(listing.mrp - listing.price) + '</span></div>' +
            '<p class="item-stock">' + (listing.status === 'live' ? '<strong>' + remaining + ' left</strong> for pickup' : reason) + '</p>' +
            '<div class="item-buy">' +
              '<div class="quantity-field"><span class="label">Quantity</span>' +
                '<div class="quantity-stepper" role="group" aria-label="Quantity of ' + UI.esc(listing.name) + '">' +
                  '<button type="button" class="stepper-btn" data-quantity="-1" aria-label="Decrease quantity"' + (quantity <= 1 ? ' disabled' : '') + '>−</button>' +
                  '<output id="item-quantity" aria-live="polite">' + quantity + '</output>' +
                  '<button type="button" class="stepper-btn" data-quantity="1" aria-label="Increase quantity"' + (unavailable || atMax || quantity >= remaining ? ' disabled' : '') + '>+</button>' +
                '</div>' +
              '</div>' +
              '<button type="button" id="item-add" class="btn btn-primary item-add"' + (unavailable || remaining <= 0 ? ' disabled' : '') + '>' + (unavailable ? reason : 'Add to bag') + '</button>' +
            '</div>' +
          '</div>' +
        '</section>' +
        timeline(listing) +
        '<section class="item-details card">' +
          '<div><p class="eyebrow">Allergens</p><div class="allergen-list">' + allergenHtml(listing) + '</div></div>' +
          '<div><p class="eyebrow">About this item</p><p class="item-description">' + UI.esc(listing.desc || 'Fresh surplus food from this local shop.') + '</p></div>' +
        '</section>' +
      '</article>' +
      '<section class="more-store" aria-labelledby="more-store-title">' +
        '<div class="section-heading"><p class="eyebrow">More nearby</p><h2 id="more-store-title">More from this store</h2></div>' +
        '<div id="more-store-grid" class="card-grid"></div>' +
      '</section>';

    var more = Store.getListings({ includeClosed: false }).filter(function (other) {
      return other.storeId === listing.storeId && other.id !== listing.id && other.status === 'live';
    }).slice(0, 4);

    var grid = root.querySelector('#more-store-grid');
    grid.innerHTML = more.length ? more.map(UI.itemCard).join('') : '<div class="empty-state item-no-more"><p>No other live listings from this store right now.</p><a class="btn btn-ghost" href="index.html">Browse nearby</a></div>';

    bindEvents(listing);
  }

  function bindEvents(listing) {
    var add = root.querySelector('#item-add');
    if (add) {
      add.addEventListener('click', function () {
        if (!Store.getUser()) {
          UI.toast('Sign in before reserving this item');
          window.location.href = 'login.html?next=' + encodeURIComponent('item.html?id=' + listing.id);
          return;
        }
        var result = Store.addToCart(listing.id, quantity);
        UI.toast(result.msg);
        render();
      });
    }

    var quantityButtons = root.querySelectorAll('[data-quantity]');
    for (var i = 0; i < quantityButtons.length; i++) {
      quantityButtons[i].addEventListener('click', function () {
        var bagLine = Store.getCart().items.filter(function (line) { return line.listing.id === listing.id; })[0];
        var remaining = Math.max(0, listing.qtyLeft - (bagLine ? bagLine.qty : 0));
        var change = Number(this.getAttribute('data-quantity'));
        quantity = Math.max(1, Math.min(remaining, quantity + change));
        render();
      });
    }
  }

  window.addEventListener('store:change', function () {
    render();
  });

  render();
})();
