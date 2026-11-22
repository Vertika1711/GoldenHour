/* Golden Hour: Sign-in page. Owner: Member C.
   Uses only window.Store and window.UI. */
'use strict';

(function () {
  var root = document.querySelector('main.page-login');
  if (!root) return;

  function render() {
    var user = Store.getUser();

    if (user) {
      root.innerHTML = '' +
        '<section class="login-card card login-signed-in" aria-labelledby="signed-in-title">' +
          '<div class="login-mark" aria-hidden="true">✓</div>' +
          '<p class="eyebrow">Demo account</p>' +
          '<h1 id="signed-in-title">You’re signed in</h1>' +
          '<dl class="login-details">' +
            '<div><dt>Name</dt><dd>' + UI.esc(user.name) + '</dd></div>' +
            '<div><dt>Phone</dt><dd>' + UI.esc(user.phone) + '</dd></div>' +
            '<div><dt>Email</dt><dd>' + UI.esc(user.email || 'Not provided') + '</dd></div>' +
          '</dl>' +
          '<button type="button" id="sign-out" class="btn btn-ghost btn-block">Sign out</button>' +
        '</section>';

      root.querySelector('#sign-out').addEventListener('click', function () {
        Store.signOut();
        UI.toast('Signed out');
        render();
      });
      return;
    }

    root.innerHTML = '' +
      '<section class="login-card card" aria-labelledby="login-title">' +
        '<div class="login-heading">' +
          '<p class="eyebrow">Golden Hour</p>' +
          '<h1 id="login-title">Welcome back</h1>' +
          '<p class="muted">Reserve food faster and keep checkout simple.</p>' +
        '</div>' +
        '<div class="login-tabs" role="tablist" aria-label="Account type">' +
          '<button type="button" role="tab" id="tab-signin" aria-selected="true" aria-controls="login-form-panel" data-mode="signin">Sign in</button>' +
          '<button type="button" role="tab" id="tab-create" aria-selected="false" aria-controls="login-form-panel" data-mode="create">Create account</button>' +
        '</div>' +
        '<div id="login-form-panel" role="tabpanel" aria-labelledby="tab-signin">' +
          '<form id="login-form" novalidate>' +
            '<div class="field" data-field="name">' +
              '<label for="login-name">Name</label>' +
              '<input class="input" id="login-name" name="name" type="text" autocomplete="name" required aria-describedby="login-name-error">' +
              '<span class="field-error" id="login-name-error" aria-live="polite"></span>' +
            '</div>' +
            '<div class="field" data-field="phone">' +
              '<label for="login-phone">Mobile number</label>' +
              '<div class="phone-input-group">' +
                '<label class="country-code-label" for="login-country-code"><span class="sr-only">Country code</span>' +
                  '<select class="input country-code" id="login-country-code" name="countryCode" aria-label="Country code"><option value="+91">+91</option></select>' +
                '</label>' +
                '<input class="input phone-number" id="login-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" pattern="[0-9]{10}" placeholder="9876543210" required aria-describedby="login-phone-hint login-phone-error">' +
              '</div>' +
              '<span class="field-hint" id="login-phone-hint">Enter 10 digits without the country code</span>' +
              '<span class="field-error" id="login-phone-error" aria-live="polite"></span>' +
            '</div>' +
            '<div class="field" data-field="email">' +
              '<label for="login-email">Email <span class="muted">(optional)</span></label>' +
              '<input class="input" id="login-email" name="email" type="email" autocomplete="email" aria-describedby="login-email-error">' +
              '<span class="field-error" id="login-email-error" aria-live="polite"></span>' +
            '</div>' +
            '<div id="login-message" class="notice" hidden role="status"></div>' +
            '<button type="submit" id="login-submit" class="btn btn-primary btn-block">Sign in</button>' +
          '</form>' +
        '</div>' +
        '<p class="demo-note"><strong>Demo sign-in.</strong> No password is stored.</p>' +
      '</section>';

    bindForm();
  }

  function setError(name, message) {
    var field = root.querySelector('[data-field="' + name + '"]');
    var input = root.querySelector('[name="' + name + '"]');
    var error = root.querySelector('#login-' + name + '-error');
    if (field) field.classList.toggle('has-error', !!message);
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) error.textContent = message || '';
  }

  function clearErrors() {
    setError('name', '');
    setError('phone', '');
    setError('email', '');
  }

  function bindForm() {
    var form = root.querySelector('#login-form');
    var tabs = root.querySelectorAll('[data-mode]');

    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        var mode = this.getAttribute('data-mode');
        for (var j = 0; j < tabs.length; j++) tabs[j].setAttribute('aria-selected', tabs[j] === this ? 'true' : 'false');
        root.querySelector('#login-title').textContent = mode === 'create' ? 'Create account' : 'Welcome back';
        root.querySelector('#login-submit').textContent = mode === 'create' ? 'Create account' : 'Sign in';
        root.querySelector('#login-form-panel').setAttribute('aria-labelledby', this.id);
        clearErrors();
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearErrors();

      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.replace(/\D/g, '').trim();
      var email = form.elements.email.value.trim();
      var localErrors = {};

      if (name.length < 2) localErrors.name = 'Enter your name';
      var digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
      if (!/^[6-9]\d{9}$/.test(digits)) localErrors.phone = 'Enter a 10-digit Indian mobile number';
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) localErrors.email = 'Enter a valid email address, or leave it empty';

      if (Object.keys(localErrors).length) {
        Object.keys(localErrors).forEach(function (name) { setError(name, localErrors[name]); });
        var message = root.querySelector('#login-message');
        message.className = 'notice notice-error';
        message.textContent = 'Please check the highlighted fields.';
        message.hidden = false;
        var firstName = Object.keys(localErrors)[0];
        form.elements[firstName].focus();
        return;
      }

      var result = Store.signIn({ name: name, phone: phone, email: email });
      if (!result.ok) {
        Object.keys(result.errors).forEach(function (fieldName) { setError(fieldName, result.errors[fieldName]); });
        var errorMessage = root.querySelector('#login-message');
        errorMessage.className = 'notice notice-error';
        errorMessage.textContent = 'Please check the highlighted fields.';
        errorMessage.hidden = false;
        return;
      }

      UI.toast(result.user.name + ' signed in');

      var next = UI.param('next');
      var safeNext = 'index.html';
      if (next) {
        var cleanNext = String(next).replace(/^[\/]+/, '');
        var filename = cleanNext.split('?')[0].split('/').pop();
        var allowed = ['index.html','item.html','sell.html','cart.html','orders.html','impact.html','login.html'];
        if (allowed.indexOf(filename) !== -1) safeNext = cleanNext;
      }
      window.location.replace(safeNext);
    });
  }

  window.addEventListener('store:change', function () {
    if (Store.getUser()) render();
  });

  render();
})();
