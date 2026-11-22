/* cart.html page script. Owner: Member D.
   Use only window.Store and window.UI (see CONTRACT.md). */
'use strict';

(function () {
  var main = document.querySelector('main.page-cart');
  if (!main) return;

  var itemList = document.getElementById('cart-items');
  var cartLayout = document.getElementById('cart-layout');
  var emptyState = document.getElementById('cart-empty-state');
  var removedNotice = document.getElementById('cart-removed-notice');
  var removedItems = document.getElementById('cart-removed-items');
  var storeTemplate = document.getElementById('cart-store-template');
  var itemTemplate = document.getElementById('cart-item-template');
  var holdBanner = document.getElementById('cart-hold-banner');
  var holdTimerDisplay = document.getElementById('cart-hold-timer');
  var holdMessage = main.querySelector('.cart-hold-message');
  var holdWarning = document.getElementById('cart-hold-warning');
  var holdExpired = document.getElementById('cart-hold-expired');
  var checkoutSection = document.getElementById('cart-checkout');
  var checkoutForm = document.getElementById('checkout-form');
  var nameInput = document.getElementById('checkout-name');
  var phoneInput = document.getElementById('checkout-phone');
  var upiInput = document.getElementById('checkout-upi');
  var pickupAck = document.getElementById('checkout-pickup-ack');
  var submitButton = document.getElementById('checkout-submit');
  var checkoutError = document.getElementById('checkout-form-error');
  var checkoutResult = document.getElementById('checkout-result');
  var confirmationSection = document.getElementById('cart-confirmation');
  var confirmationOrders = document.getElementById('cart-confirmation-orders');
  var confirmationOrderTemplate = document.getElementById('cart-confirmation-order-template');
  var upiField = document.getElementById('cart-upi-field');
  var nameError = document.getElementById('checkout-name-error');
  var phoneError = document.getElementById('checkout-phone-error');
  var upiError = document.getElementById('checkout-upi-error');
  var pickupError = document.getElementById('checkout-pickup-error');
  var activeHoldUntil = null;
  var expiredHold = false;
  var holdInterval = null;
  var processingTimeout = null;
  var isSubmitting = false;
  var checkoutDone = false;
  var customerFieldsDirty = false;
  var isPlacingOrder = false;
  var placedOrders = null;

  function text(value, fallback) {
    return value == null || value === '' ? fallback : String(value);
  }

  function number(value) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  function quantity(value) {
    var parsed = parseInt(value, 10);
    return isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function weightText(value) {
    return number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  function isCheckoutAvailable(cart) {
    var items = cart && Array.isArray(cart.items) ? cart.items : [];
    var holdUntil = Number(cart && cart.holdUntil);
    return items.length > 0 && isFinite(holdUntil) && holdUntil > Date.now();
  }

  function selectedPayment() {
    var options = checkoutForm.querySelectorAll('input[name="payment"]');
    for (var i = 0; i < options.length; i++) {
      if (options[i].checked) return options[i].value;
    }
    return 'pay-at-pickup';
  }

  function updatePaymentUI() {
    var useUpi = selectedPayment() === 'upi-demo';
    upiField.hidden = !useUpi;
    upiInput.required = useUpi;
    if (!useUpi) setFieldError(upiInput, upiError, '');
  }

  function prefillCustomerDetails() {
    var user = Store.getUser();
    if (!user || customerFieldsDirty) return;
    if (!nameInput.value && user.name) nameInput.value = user.name;
    if (!phoneInput.value && user.phone) phoneInput.value = user.phone;
  }

  function setFieldError(input, errorElement, message) {
    errorElement.textContent = message;
    errorElement.hidden = !message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function validIndianPhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2);
    return /^[6-9]\d{9}$/.test(digits);
  }

  function validUpiId(value) {
    return /^[A-Za-z0-9][A-Za-z0-9._-]*@[A-Za-z0-9][A-Za-z0-9.-]*$/.test(String(value || '').trim());
  }

  function clearCheckoutMessage() {
    checkoutError.hidden = true;
    checkoutError.textContent = '';
    checkoutResult.hidden = true;
    checkoutResult.textContent = '';
  }

  function resetCheckoutCompletion() {
    if (!checkoutDone) return;
    checkoutDone = false;
    submitButton.disabled = false;
    submitButton.textContent = 'Continue to reservation';
    clearCheckoutMessage();
  }

  function setProcessing(isProcessing) {
    isSubmitting = isProcessing;
    checkoutForm.setAttribute('aria-busy', isProcessing ? 'true' : 'false');
    nameInput.disabled = isProcessing;
    phoneInput.disabled = isProcessing;
    upiInput.disabled = isProcessing;
    pickupAck.disabled = isProcessing;
    var options = checkoutForm.querySelectorAll('input[name="payment"]');
    for (var i = 0; i < options.length; i++) options[i].disabled = isProcessing;
    submitButton.disabled = isProcessing || checkoutDone;
    submitButton.classList.toggle('is-processing', isProcessing);
    submitButton.textContent = isProcessing ? 'Processing…' : (checkoutDone ? 'Details checked' : 'Continue to reservation');
  }

  function validateCheckout() {
    var valid = true;
    var firstInvalid = null;
    clearCheckoutMessage();
    setFieldError(nameInput, nameError, '');
    setFieldError(phoneInput, phoneError, '');
    setFieldError(upiInput, upiError, '');
    pickupError.textContent = '';
    pickupError.hidden = true;
    pickupAck.removeAttribute('aria-invalid');

    if (!String(nameInput.value || '').trim()) {
      setFieldError(nameInput, nameError, 'Enter your name.');
      valid = false;
      firstInvalid = firstInvalid || nameInput;
    }
    if (!validIndianPhone(phoneInput.value)) {
      setFieldError(phoneInput, phoneError, 'Enter a valid 10-digit Indian mobile number.');
      valid = false;
      firstInvalid = firstInvalid || phoneInput;
    }
    if (selectedPayment() === 'upi-demo' && !validUpiId(upiInput.value)) {
      setFieldError(upiInput, upiError, 'Enter a valid UPI ID, such as name@okbank.');
      valid = false;
      firstInvalid = firstInvalid || upiInput;
    }
    if (!pickupAck.checked) {
      pickupError.textContent = 'Please confirm that you can collect the order before pickup closes.';
      pickupError.hidden = false;
      pickupAck.setAttribute('aria-invalid', 'true');
      valid = false;
      firstInvalid = firstInvalid || pickupAck;
    }

    if (!valid && firstInvalid) firstInvalid.focus();
    return valid;
  }

  function renderConfirmation() {
    confirmationOrders.textContent = '';
    (placedOrders || []).forEach(function (order) {
      var store = Store.getStore(order.storeId);
      var card = confirmationOrderTemplate.content.firstElementChild.cloneNode(true);
      var items = Array.isArray(order.items) ? order.items : [];
      var pickupFrom = Number(order.pickupFrom);
      var pickupTo = Number(order.pickupTo);
      var countdown = card.querySelector('[data-confirm-countdown]');

      card.querySelector('[data-confirm-store-name]').textContent =
        store ? text(store.name, 'Local shop') : 'Local shop';
      card.querySelector('[data-confirm-store-address]').textContent =
        store ? text(store.address, 'Address unavailable') : 'Address unavailable';
      card.querySelector('[data-confirm-code]').textContent = text(order.code, '----');
      card.querySelector('[data-confirm-window]').textContent =
        isFinite(pickupFrom) && isFinite(pickupTo)
          ? (pickupFrom <= pickupTo
            ? UI.time(pickupFrom) + '–' + UI.time(pickupTo)
            : 'Pickup times do not overlap')
          : 'Pickup time unavailable';
      card.querySelector('[data-confirm-total]').textContent = UI.rupee(number(order.total));

      countdown.setAttribute('data-countdown', isFinite(pickupTo) ? String(pickupTo) : '0');
      countdown.textContent = UI.countdown(isFinite(pickupTo) ? pickupTo - Date.now() : 0);

      var itemListForOrder = card.querySelector('[data-confirm-items]');
      items.forEach(function (item) {
        var line = document.createElement('li');
        var description = document.createElement('span');
        var amount = document.createElement('span');
        var qty = quantity(item.qty);
        description.textContent = qty + ' × ' + text(item.name, 'Food item');
        amount.textContent = UI.rupee(number(item.price) * qty);
        line.appendChild(description);
        line.appendChild(amount);
        itemListForOrder.appendChild(line);
      });

      confirmationOrders.appendChild(card);
    });
  }

  function placeReservation(payment) {
    if (isPlacingOrder || placedOrders) return;

    var cart = Store.getCart();
    if (!isCheckoutAvailable(cart)) {
      setProcessing(false);
      render(cart);
      UI.toast('Your bag or reservation hold is no longer active.');
      return;
    }
    if (!validateCheckout()) {
      setProcessing(false);
      return;
    }

    isPlacingOrder = true;
    setProcessing(true);
    var orders;
    try {
      orders = Store.placeOrder({
        name: String(nameInput.value || '').trim(),
        phone: phoneInput.value,
        payment: payment
      });
    } catch (error) {
      isPlacingOrder = false;
      setProcessing(false);
      checkoutError.textContent = 'We could not complete your reservation. Please try again.';
      checkoutError.hidden = false;
      return;
    }

    isPlacingOrder = false;
    if (!Array.isArray(orders) || orders.length === 0) {
      setProcessing(false);
      checkoutError.textContent = 'Your reservation could not be completed. Check that your items and hold are still available, then try again.';
      checkoutError.hidden = false;
      return;
    }

    processingTimeout = null;
    placedOrders = orders.slice();
    setProcessing(false);
    render(Store.getCart());
  }

  function finishCheckoutDemo(payment) {
    processingTimeout = null;
    placeReservation(payment);
  }

  function handleCheckoutSubmit(event) {
    event.preventDefault();
    if (isSubmitting || checkoutDone) return;

    var cart = Store.getCart();
    if (!isCheckoutAvailable(cart)) {
      render(cart);
      UI.toast('Your bag or reservation hold is no longer active.');
      return;
    }
    if (!validateCheckout()) return;

    var payment = selectedPayment();
    if (payment === 'upi-demo') {
      setProcessing(true);
      processingTimeout = window.setTimeout(function () {
        finishCheckoutDemo(payment);
      }, 700);
      return;
    }
    placeReservation(payment);
  }

  function handleCheckoutInput(event) {
    var target = event.target;
    if (target === nameInput || target === phoneInput) customerFieldsDirty = true;
    resetCheckoutCompletion();
    clearCheckoutMessage();

    if (target === nameInput) setFieldError(nameInput, nameError, '');
    if (target === phoneInput) setFieldError(phoneInput, phoneError, '');
    if (target === upiInput) setFieldError(upiInput, upiError, '');
    if (target === pickupAck) {
      pickupError.hidden = true;
      pickupAck.removeAttribute('aria-invalid');
    }
    if (target.name === 'payment') updatePaymentUI();
  }

  function handleContinueToCheckout() {
    if (checkoutSection.hidden) return;
    checkoutSection.scrollIntoView({ block: 'start', behavior: 'auto' });
    nameInput.focus();
  }

  function categoryFor(id) {
    var categories = window.CATEGORIES || [];
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === id) return categories[i];
    }
    return null;
  }

  function pickupRange(items) {
    var starts = [];
    var ends = [];
    items.forEach(function (item) {
      var listing = item.listing || {};
      var from = Number(listing.pickupFrom);
      var to = Number(listing.pickupTo);
      if (isFinite(from)) starts.push(from);
      if (isFinite(to)) ends.push(to);
    });

    if (!starts.length || !ends.length) return 'Pickup time unavailable';
    var fromTime = Math.max.apply(null, starts);
    var toTime = Math.min.apply(null, ends);
    if (fromTime > toTime) return 'Pickup times vary by item';
    return UI.time(fromTime) + '–' + UI.time(toTime);
  }

  function updateHoldUI(cart) {
    var items = cart && Array.isArray(cart.items) ? cart.items : [];
    var holdUntil = Number(cart && cart.holdUntil);
    var hasHold = items.length > 0 && isFinite(holdUntil) && holdUntil > 0;

    if (hasHold) {
      activeHoldUntil = holdUntil;
      expiredHold = false;
      var remaining = Math.max(0, holdUntil - Date.now());
      var warning = remaining < 2 * 60 * 1000;
      holdTimerDisplay.textContent = UI.countdown(remaining);
      holdTimerDisplay.setAttribute('aria-label', UI.countdown(remaining) + ' remaining');
      holdMessage.textContent = 'Reserve before the timer runs out.';
      holdWarning.hidden = !warning;
      holdExpired.hidden = true;
      holdBanner.classList.toggle('is-warning', warning);
      holdBanner.classList.remove('is-expired');
      return;
    }

    if (activeHoldUntil && Date.now() > activeHoldUntil) expiredHold = true;
    activeHoldUntil = null;
    holdTimerDisplay.textContent = expiredHold ? '0:00' : '—';
    holdTimerDisplay.setAttribute('aria-label', expiredHold ? 'Reservation hold expired' : 'No active hold');
    holdMessage.textContent = expiredHold
      ? 'Your reservation hold expired and the bag was emptied.'
      : 'Add an item to start your 10-minute reservation hold.';
    holdWarning.hidden = true;
    holdExpired.hidden = !expiredHold;
    holdBanner.classList.remove('is-warning');
    holdBanner.classList.toggle('is-expired', expiredHold);
  }

  function makeItem(item, cartValid) {
    var listing = item.listing || {};
    var row = itemTemplate.content.firstElementChild.cloneNode(true);
    var id = text(listing.id, '');
    var name = text(listing.name, 'Food item');
    var qty = quantity(item.qty) || 1;
    var available = quantity(listing.qtyLeft);
    var price = number(listing.price);
    var mrp = number(listing.mrp);
    var kgPerUnit = number(listing.kgPerUnit);
    var category = categoryFor(listing.category);

    row.setAttribute('data-listing-id', id);
    row.setAttribute('data-qty', String(qty));
    row.setAttribute('data-available-qty', String(available));
    row.querySelector('[data-item-name]').textContent = name;
    row.querySelector('[data-item-price]').textContent =
      UI.rupee(price) + ' each · ' + UI.rupee(price * qty) + ' total';
    row.querySelector('[data-qty-value]').textContent = String(qty);
    row.querySelector('.cart-quantity').setAttribute('aria-label', 'Quantity for ' + name);
    row.querySelector('[data-qty-decrease]').setAttribute('aria-label', 'Decrease quantity of ' + name);
    row.querySelector('[data-qty-increase]').setAttribute('aria-label', 'Increase quantity of ' + name);
    row.querySelector('[data-remove-item]').setAttribute('aria-label', 'Remove ' + name + ' from bag');
    row.querySelector('[data-qty-increase]').disabled = !cartValid || qty >= available;
    row.querySelector('[data-qty-decrease]').disabled = !cartValid;
    row.querySelector('[data-remove-item]').disabled = !cartValid;

    var art = row.querySelector('.cart-item-art');
    if (category && category.svg) art.innerHTML = category.svg;

    var pickup = document.createElement('p');
    pickup.className = 'cart-item-pickup muted';
    pickup.textContent = 'Pickup ' + UI.time(number(listing.pickupFrom)) + '–' + UI.time(number(listing.pickupTo));
    row.querySelector('.cart-item-info').appendChild(pickup);

    return {
      element: row,
      price: price,
      mrp: mrp,
      kgPerUnit: kgPerUnit,
      qty: qty
    };
  }

  function render(cart) {
    cart = cart || Store.getCart();
    var items = cart && Array.isArray(cart.items) ? cart.items : [];
    var groups = {};
    var order = [];
    var subtotal = 0;
    var savings = 0;
    var rescuedKg = 0;
    var cartValid = isCheckoutAvailable(cart);
    var hasConfirmation = Array.isArray(placedOrders) && placedOrders.length > 0;

    updateHoldUI(cart);

    itemList.textContent = '';
    items.forEach(function (item) {
      var listing = item.listing || {};
      var storeId = text(listing.storeId, '');
      var key = '$' + storeId;
      if (!groups[key]) {
        groups[key] = { storeId: storeId, items: [] };
        order.push(key);
      }
      var line = makeItem(item, cartValid);
      var qty = line.qty;
      subtotal += line.price * qty;
      savings += (line.mrp - line.price) * qty;
      rescuedKg += line.kgPerUnit * qty;
      groups[key].items.push({ item: item, line: line });
    });

    order.forEach(function (key) {
      var group = groups[key];
      var store = Store.getStore(group.storeId);
      var card = storeTemplate.content.firstElementChild.cloneNode(true);
      var distance = store ? Store.distanceKm(store) : null;
      var name = store ? text(store.name, 'Local shop') : 'Local shop';

      card.querySelector('[data-store-name]').textContent = name;
      card.querySelector('[data-store-distance]').textContent =
        distance == null || !isFinite(Number(distance)) ? 'Distance unavailable' : Number(distance).toFixed(1) + ' km away';
      card.querySelector('[data-pickup-window]').textContent = pickupRange(group.items.map(function (entry) {
        return entry.item;
      }));

      var storeItems = card.querySelector('[data-store-items]');
      group.items.forEach(function (entry) {
        storeItems.appendChild(entry.line.element);
      });
      itemList.appendChild(card);
    });

    var isEmpty = items.length === 0;
    emptyState.hidden = !isEmpty;
    itemList.hidden = isEmpty;

    var removed = cart && Array.isArray(cart.removed) ? cart.removed : [];
    removedNotice.hidden = removed.length === 0;
    removedItems.textContent = removed.join(', ');

    document.getElementById('cart-subtotal').textContent = UI.rupee(subtotal);
    document.getElementById('cart-savings').textContent = UI.rupee(savings);
    document.getElementById('cart-food-weight').innerHTML =
      UI.esc(weightText(rescuedKg)) + ' <span>kg</span>';
    document.getElementById('cart-total').textContent = UI.rupee(subtotal);
    document.getElementById('cart-continue').disabled = !cartValid || hasConfirmation;
    checkoutSection.hidden = !cartValid || hasConfirmation;
    cartLayout.hidden = hasConfirmation;
    holdBanner.hidden = hasConfirmation;
    confirmationSection.hidden = !hasConfirmation;
    if (hasConfirmation) renderConfirmation();
  }

  function updateHoldTimer() {
    var previousHoldUntil = activeHoldUntil;
    var cart = Store.getCart();
    var now = Date.now();
    var stillHeld = cart && cart.items && cart.items.length > 0 && cart.holdUntil;

    if (previousHoldUntil && now > previousHoldUntil && !stillHeld) {
      render(cart);
      return;
    }
    updateHoldUI(cart);
  }

  function startHoldTimer() {
    if (holdInterval !== null) return;
    holdInterval = window.setInterval(updateHoldTimer, 1000);
  }

  function stopHoldTimer() {
    if (holdInterval !== null) {
      window.clearInterval(holdInterval);
      holdInterval = null;
    }
    if (processingTimeout !== null) {
      window.clearTimeout(processingTimeout);
      processingTimeout = null;
      setProcessing(false);
    }
  }

  function findLine(id) {
    var cart = Store.getCart();
    var items = cart && Array.isArray(cart.items) ? cart.items : [];
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].listing && items[i].listing.id) === id) return items[i];
    }
    return null;
  }

  function handleClick(event) {
    var target = event.target;
    if (!target.closest) return;

    var removeButton = target.closest('[data-remove-item]');
    var increaseButton = target.closest('[data-qty-increase]');
    var decreaseButton = target.closest('[data-qty-decrease]');
    var button = removeButton || increaseButton || decreaseButton;
    if (!button || button.disabled) return;

    var row = button.closest('[data-cart-item]');
    if (!row) return;
    var id = row.getAttribute('data-listing-id');
    var line = findLine(id);
    if (!line) {
      render();
      return;
    }

    var result;
    if (removeButton) {
      result = Store.removeFromCart(id);
      if (!result.ok) UI.toast(result.msg || 'This item could not be removed');
      return;
    }

    var listing = line.listing || {};
    var current = quantity(line.qty) || 1;
    if (increaseButton) {
      var available = quantity(listing.qtyLeft);
      if (current >= available) {
        UI.toast('Only ' + available + ' left of ' + text(listing.name, 'this item'));
        return;
      }
      result = Store.setQty(id, current + 1);
    } else {
      result = Store.setQty(id, current - 1);
    }

    if (!result || !result.ok) UI.toast((result && result.msg) || 'Quantity could not be updated');
    else if (result.msg && result.msg.indexOf('Only') === 0) UI.toast(result.msg);
  }

  main.addEventListener('click', handleClick);
  checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  checkoutForm.addEventListener('input', handleCheckoutInput);
  checkoutForm.addEventListener('change', handleCheckoutInput);
  document.getElementById('cart-continue').addEventListener('click', handleContinueToCheckout);
  window.addEventListener('store:change', function () {
    prefillCustomerDetails();
    render();
  });
  window.addEventListener('pagehide', stopHoldTimer);
  window.addEventListener('pageshow', startHoldTimer);
  prefillCustomerDetails();
  updatePaymentUI();
  render();
  startHoldTimer();
})();
