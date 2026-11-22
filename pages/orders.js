/* orders.html page script. Owner: Member D.
   Use only window.Store and window.UI (see CONTRACT.md). */
'use strict';

(function () {
  var main = document.querySelector('main.page-orders');
  if (!main) return;

  var activeList = document.getElementById('orders-active-list');
  var pastList = document.getElementById('orders-past-list');
  var activeEmpty = document.getElementById('orders-active-empty');
  var pastEmpty = document.getElementById('orders-past-empty');
  var activeCount = document.getElementById('orders-active-count');
  var pastCount = document.getElementById('orders-past-count');
  var cardTemplate = document.getElementById('order-card-template');
  var activeTab = 'active';
  var confirmations = Object.create(null);
  var processing = Object.create(null);

  function text(value, fallback) {
    return value == null || value === '' ? fallback : String(value);
  }

  function number(value) {
    var result = Number(value);
    return isFinite(result) ? result : 0;
  }

  function quantity(value) {
    var result = parseInt(value, 10);
    return isFinite(result) && result > 0 ? result : 0;
  }

  function weight(value) {
    return number(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  function pickupWindow(order) {
    var from = Number(order.pickupFrom);
    var to = Number(order.pickupTo);
    if (!isFinite(from) || !isFinite(to)) return 'Pickup time unavailable';
    if (from > to) return 'Pickup times do not overlap';
    return UI.time(from) + '–' + UI.time(to);
  }

  function orderCard(order, isActive) {
    var card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.setAttribute('data-order-id', String(order.id));
    var store = Store.getStore(order.storeId);
    var statusBadge = card.querySelector('[data-order-status]');
    var code = text(order.code, '');
    var items = Array.isArray(order.items) ? order.items : [];
    var countdownRow = card.querySelector('.order-countdown-row');
    var placedRow = card.querySelector('.order-placed-row');
    var countdown = card.querySelector('[data-order-countdown]');
    var actions = card.querySelector('[data-order-actions]');
    var confirmPanel = card.querySelector('[data-order-confirm]');
    var impact = card.querySelector('[data-order-impact]');

    card.querySelector('[data-store-name]').textContent = store
      ? text(store.name, 'Local shop')
      : 'Local shop';
    card.querySelector('[data-store-address]').textContent = store
      ? text(store.address, 'Address unavailable')
      : 'Address unavailable';

    if (code) {
      card.querySelector('[data-order-code]').textContent = code;
    } else {
      card.querySelector('[data-order-code-wrap]').hidden = true;
    }

    if (isActive) {
      statusBadge.textContent = 'Reserved';
      statusBadge.classList.add('badge-primary');
      countdownRow.hidden = false;
      placedRow.hidden = true;
      var closesAt = Number(order.pickupTo);
      countdown.setAttribute('data-countdown', isFinite(closesAt) ? String(closesAt) : '0');
      countdown.textContent = UI.countdown(isFinite(closesAt) ? closesAt - Date.now() : 0);
    } else {
      var badge = {
        picked: { label: 'Picked up', tone: 'badge-fresh' },
        cancelled: { label: 'Cancelled', tone: 'badge-ok' },
        missed: { label: 'Missed', tone: 'badge-urgent' }
      }[order.status] || { label: 'Past order', tone: 'badge-ok' };
      statusBadge.textContent = badge.label;
      statusBadge.classList.add(badge.tone);
      countdownRow.hidden = true;
      placedRow.hidden = false;
      card.querySelector('[data-order-placed]').textContent =
        isFinite(Number(order.placedAt)) ? UI.time(Number(order.placedAt)) : 'Time unavailable';
      if (order.status === 'picked') {
        impact.hidden = false;
        card.querySelector('[data-order-impact-message]').textContent =
          'You rescued ' + weight(order.kg) + ' kg of food';
      }
    }

    card.querySelector('[data-order-window]').textContent = pickupWindow(order);
    card.querySelector('[data-order-total]').textContent = UI.rupee(number(order.total));

    var itemList = card.querySelector('[data-order-items]');
    items.forEach(function (item) {
      var qty = quantity(item.qty);
      var name = text(item.name, 'Food item');
      var lineTotal = UI.rupee(number(item.price) * qty);
      var li = document.createElement('li');
      li.innerHTML = '<span>' + UI.esc(qty + ' × ' + name) + '</span><span>' + UI.esc(lineTotal) + '</span>';
      itemList.appendChild(li);
    });

    if (isActive) {
      var orderId = String(order.id);
      var confirmation = confirmations[orderId];
      var isProcessing = !!processing[orderId];
      actions.hidden = !!confirmation || isProcessing;
      confirmPanel.hidden = !confirmation;
      if (confirmation) {
        card.querySelector('[data-order-confirm-copy]').textContent = confirmation === 'pickup'
          ? 'Mark this order as picked up?'
          : 'Cancel this reservation? This action cannot be undone.';
        var confirmButton = card.querySelector('[data-order-action="confirm"]');
        confirmButton.disabled = isProcessing;
        confirmButton.textContent = isProcessing ? 'Processing…' : 'Confirm';
      }
      var orderActionButtons = card.querySelectorAll('[data-order-action]');
      for (var i = 0; i < orderActionButtons.length; i++) orderActionButtons[i].disabled = isProcessing;
    }

    return card;
  }

  function setActiveTab(tab, moveFocus) {
    activeTab = tab === 'past' ? 'past' : 'active';
    var isActive = activeTab === 'active';
    var activeButton = document.getElementById('orders-tab-active');
    var pastButton = document.getElementById('orders-tab-past');
    var activePanel = document.getElementById('orders-panel-active');
    var pastPanel = document.getElementById('orders-panel-past');

    activeButton.setAttribute('aria-selected', isActive ? 'true' : 'false');
    activeButton.setAttribute('tabindex', isActive ? '0' : '-1');
    activeButton.classList.toggle('is-selected', isActive);
    pastButton.setAttribute('aria-selected', isActive ? 'false' : 'true');
    pastButton.setAttribute('tabindex', isActive ? '-1' : '0');
    pastButton.classList.toggle('is-selected', !isActive);
    activePanel.hidden = !isActive;
    pastPanel.hidden = isActive;

    if (moveFocus) (isActive ? activeButton : pastButton).focus();
  }

  function render() {
    var orders = Store.getOrders();
    orders = Array.isArray(orders) ? orders : [];
    var active = orders.filter(function (order) { return order.status === 'reserved'; });
    var past = orders.filter(function (order) {
      return order.status === 'picked' || order.status === 'cancelled' || order.status === 'missed';
    });

    activeList.textContent = '';
    pastList.textContent = '';
    active.forEach(function (order) { activeList.appendChild(orderCard(order, true)); });
    past.forEach(function (order) { pastList.appendChild(orderCard(order, false)); });

    activeCount.textContent = String(active.length);
    pastCount.textContent = String(past.length);
    activeEmpty.hidden = active.length > 0;
    pastEmpty.hidden = past.length > 0;
    activeList.hidden = active.length === 0;
    pastList.hidden = past.length === 0;
    setActiveTab(activeTab, false);
  }

  function handleClick(event) {
    if (!event.target.closest) return;
    var tab = event.target.closest('[data-orders-tab]');
    if (tab) {
      setActiveTab(tab.getAttribute('data-orders-tab'), false);
      return;
    }

    var actionButton = event.target.closest('[data-order-action]');
    if (!actionButton) return;
    var actionCard = actionButton.closest('[data-order-id]');
    if (!actionCard) return;
    var orderId = actionCard.getAttribute('data-order-id');
    if (processing[orderId]) return;

    var action = actionButton.getAttribute('data-order-action');
    if (action === 'request-pickup' || action === 'request-cancel') {
      confirmations[orderId] = action === 'request-pickup' ? 'pickup' : 'cancel';
      render();
      var confirmButton = main.querySelector('[data-order-id="' + orderId + '"] [data-order-action="confirm"]');
      if (confirmButton) confirmButton.focus();
    } else if (action === 'dismiss') {
      var priorKind = confirmations[orderId];
      delete confirmations[orderId];
      render();
      var previousButton = main.querySelector('[data-order-id="' + orderId + '"] [data-order-action="request-' + (priorKind || 'cancel') + '"]');
      if (previousButton) previousButton.focus();
    } else if (action === 'confirm') {
      performOrderAction(orderId);
    }
  }

  function performOrderAction(orderId) {
    var kind = confirmations[orderId];
    if (!kind || processing[orderId]) return;
    processing[orderId] = true;
    render();

    var result;
    try {
      result = kind === 'pickup' ? Store.markPickedUp(orderId) : Store.cancelOrder(orderId);
    } catch (error) {
      result = { ok: false, msg: 'The order could not be updated. Please try again.' };
    }

    delete processing[orderId];
    delete confirmations[orderId];
    if (result && result.ok) {
      UI.toast(result.msg || (kind === 'pickup' ? 'Order marked as picked up' : 'Reservation cancelled'));
      activeTab = 'past';
    } else {
      UI.toast((result && result.msg) || 'This order could not be updated');
    }
    render();
  }

  function handleKeydown(event) {
    if (!event.target.closest) return;
    var tab = event.target.closest('[data-orders-tab]');
    if (!tab) return;

    var key = event.key;
    var next = null;
    if (key === 'ArrowRight' || key === 'ArrowDown' || key === 'End') next = 'past';
    else if (key === 'ArrowLeft' || key === 'ArrowUp' || key === 'Home') next = 'active';
    if (!next) return;
    event.preventDefault();
    setActiveTab(next, true);
  }

  main.addEventListener('click', handleClick);
  main.addEventListener('keydown', handleKeydown);
  window.addEventListener('store:change', function () { render(); });
  render();
})();
