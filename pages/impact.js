/* impact.html page script. Owner: Member A.
   Use only window.Store and window.UI (see CONTRACT.md). */
'use strict';

(function () {
  var root = document.getElementById('impact-content');
  var RECENT_LIMIT = 5;
  var showAll = false; // "Show all rescues" toggle, kept across re-renders

  /* ---------- small helpers (page-only) ---------- */
  var esc = UI.esc;

  function num(n, dp) {
    return Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: dp == null ? 1 : dp });
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function shortDate(ts) {
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  // "Today", "Yesterday" or "Mon, 3 Nov"
  function dayLabel(ts) {
    var d = new Date(ts);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var day = new Date(d); day.setHours(0, 0, 0, 0);
    var diff = Math.round((today - day) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  /* ---------- badge icons (decorative) ---------- */
  function svg(body) {
    return '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">' + body + '</svg>';
  }
  var ICONS = {
    first: svg('<path d="M24 5l5.6 11.9 13 1.5-9.7 8.9 2.6 12.8L24 33.6l-11.5 6.5 2.6-12.8-9.7-8.9 13-1.5z" fill="#F4B400"/>'),
    kg: svg('<rect x="16" y="7" width="16" height="13" rx="6.5" fill="none" stroke="#6B1F45" stroke-width="4"/>' +
            '<path d="M11 41l4-22h18l4 22z" fill="#6B1F45"/><path d="M20 30h8" stroke="#F4B400" stroke-width="3" stroke-linecap="round"/>'),
    streak: svg('<path d="M24 4c2 8 13 12 13 25a13 13 0 0 1-26 0c0-6 3-10 6-13 0 5 2 8 4 9-1-8 1-15 3-21z" fill="#D6452B"/>' +
                '<path d="M24 26c3 3 6 5 6 9a6 6 0 0 1-12 0c0-3 2-5 4-6 0 2 1 3 2 3z" fill="#F4B400"/>'),
    bakery: svg('<path d="M6 34c0-12 8-20 18-20s18 8 18 20z" fill="#F4B400"/><rect x="4" y="34" width="40" height="5" rx="2.5" fill="#6B1F45"/>' +
                '<path d="M17 21l3 9M24 19v11M31 21l-3 9" stroke="#6B1F45" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>')
  };
  var LOCK = '<svg class="impact-lock" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/>' +
    '<path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>';

  var EMPTY_ART =
    '<svg viewBox="0 0 120 80" aria-hidden="true" focusable="false">' +
      '<path d="M34 52a26 26 0 0 1 52 0z" fill="#F4B400" opacity=".9"/>' +
      '<ellipse cx="60" cy="56" rx="50" ry="13" fill="#6B1F45"/>' +
      '<ellipse cx="60" cy="54" rx="30" ry="6" fill="#F2E0E9"/>' +
    '</svg>';

  /* ---------- badges ---------- */
  function bakeryCount(history) {
    return history.filter(function (h) { return (h.categories || []).indexOf('bakery') !== -1; }).length;
  }

  function badgeList(imp) {
    var bakery = bakeryCount(imp.history);
    return [
      { id: 'first', name: 'First rescue', need: 'Pick up your first reservation.',
        value: imp.rescues, target: 1, progress: plural(Math.min(imp.rescues, 1), 'rescue', 'rescues') + ' of 1' },
      { id: 'kg', name: '5 kg club', need: 'Rescue 5 kg of food in total.',
        value: imp.kg, target: 5, progress: num(Math.min(imp.kg, 5)) + ' of 5 kg' },
      { id: 'streak', name: '4-week streak', need: 'Rescue food 4 weeks in a row.',
        value: imp.streak.best, target: 4, progress: 'Best streak: ' + Math.min(imp.streak.best, 4) + ' of 4 weeks' },
      { id: 'bakery', name: 'Bakery regular', need: 'Rescue from a bakery 3 times.',
        value: bakery, target: 3, progress: Math.min(bakery, 3) + ' of 3 bakery rescues' }
    ];
  }

  function badgeHtml(b) {
    var unlocked = b.value >= b.target;
    var pct = Math.max(0, Math.min(100, Math.round((b.value / b.target) * 100)));
    return '' +
      '<li class="card impact-badge ' + (unlocked ? 'is-unlocked' : 'is-locked') + '">' +
        '<div class="impact-badge-icon">' + ICONS[b.id] + (unlocked ? '' : LOCK) + '</div>' +
        '<div class="impact-badge-body">' +
          '<div class="impact-badge-top">' +
            '<h3>' + esc(b.name) + '</h3>' +
            (unlocked ? '<span class="badge badge-fresh">Unlocked</span>' : '<span class="badge">Locked</span>') +
          '</div>' +
          '<p class="impact-badge-need">' + esc(b.need) + '</p>' +
          (unlocked ? '' :
            '<div class="impact-progress" aria-hidden="true"><span style="width:' + pct + '%"></span></div>' +
            '<p class="impact-badge-progress">' + esc(b.progress) + '</p>') +
        '</div>' +
      '</li>';
  }

  /* ---------- sections ---------- */
  function statsHtml(imp) {
    function stat(cls, label, value, note) {
      return '<div class="card impact-stat ' + cls + '"><dt>' + label + '</dt><dd>' + value + '</dd>' +
        (note ? '<p class="impact-stat-note">' + note + '</p>' : '') + '</div>';
    }
    return '' +
      '<section aria-labelledby="totals-title">' +
        '<h2 id="totals-title" class="sr-only">Your totals</h2>' +
        '<dl class="impact-stats">' +
          stat('is-food', 'Food rescued', num(imp.kg) + ' <span class="impact-unit">kg</span>',
               'Good food that would have gone to waste.') +
          stat('is-co2', 'CO₂ avoided <span class="badge">Estimate</span>', num(imp.co2) + ' <span class="impact-unit">kg</span>',
               'About 2.5 kg of CO₂ for every kg of food.') +
          stat('is-money', 'Money saved', esc(UI.rupee(imp.saved)), 'Compared with the original prices.') +
          stat('is-rescues', 'Rescues', num(imp.rescues, 0), 'Reservations picked up on time.') +
        '</dl>' +
      '</section>';
  }

  function streakHtml(imp) {
    var weeks = imp.weeks;
    var thisWeek = weeks[weeks.length - 1];
    var squares = weeks.map(function (w, i) {
      var isNow = i === weeks.length - 1;
      var label = (isNow ? 'This week' : 'Week of ' + shortDate(w.weekStart)) + ': ' +
        (w.count ? plural(w.count, 'rescue', 'rescues') : 'no rescues');
      return '<li class="streak-week' + (w.count ? ' is-filled' : '') + (isNow ? ' is-now' : '') + '">' +
        '<span class="sr-only">' + esc(label) + '</span></li>';
    }).join('');

    var hint;
    if (imp.streak.current > 0 && !thisWeek.count) hint = 'Rescue something this week to keep your streak going.';
    else if (imp.streak.current > 0) hint = 'You have rescued food this week. Nice work.';
    else hint = 'Rescue food this week to start a new streak.';

    return '' +
      '<section class="card impact-streak" aria-labelledby="streak-title">' +
        '<div class="impact-section-head">' +
          '<h2 id="streak-title">Weekly streak</h2>' +
          '<dl class="streak-numbers">' +
            '<div><dt>Current</dt><dd>' + plural(imp.streak.current, 'week', 'weeks') + '</dd></div>' +
            '<div><dt>Best</dt><dd>' + plural(imp.streak.best, 'week', 'weeks') + '</dd></div>' +
          '</dl>' +
        '</div>' +
        '<p class="muted impact-streak-hint">' + hint + '</p>' +
        '<ol class="streak-strip" aria-label="Last 12 weeks, oldest first">' + squares + '</ol>' +
        '<div class="streak-axis" aria-hidden="true"><span>' + esc(shortDate(weeks[0].weekStart)) + '</span><span>This week</span></div>' +
        '<p class="streak-legend" aria-hidden="true"><span class="streak-key is-filled"></span>At least one rescue' +
          '<span class="streak-key"></span>No rescues</p>' +
      '</section>';
  }

  function badgesHtml(imp) {
    var list = badgeList(imp);
    var count = list.filter(function (b) { return b.value >= b.target; }).length;
    return '' +
      '<section aria-labelledby="badges-title">' +
        '<div class="impact-section-head">' +
          '<h2 id="badges-title">Badges</h2>' +
          '<p class="muted">' + count + ' of ' + list.length + ' unlocked</p>' +
        '</div>' +
        '<ul class="impact-badges">' + list.map(badgeHtml).join('') + '</ul>' +
      '</section>';
  }

  function rescuesHtml(imp) {
    var list = showAll ? imp.history : imp.history.slice(0, RECENT_LIMIT);
    var rows = list.map(function (h) {
      var items = (h.items || []).map(function (it) {
        return esc(it.name) + (it.qty > 1 ? ' × ' + it.qty : '');
      }).join(', ');
      return '' +
        '<li class="rescue-row">' +
          '<div class="rescue-main">' +
            '<p class="rescue-store">' + esc(h.storeName) + '</p>' +
            '<p class="rescue-items">' + items + '</p>' +
          '</div>' +
          '<div class="rescue-meta">' +
            '<span class="rescue-kg">' + num(h.kg, 2) + ' kg</span>' +
            '<time datetime="' + new Date(h.date).toISOString() + '">' + esc(dayLabel(h.date)) + '</time>' +
          '</div>' +
        '</li>';
    }).join('');

    var more = imp.history.length > RECENT_LIMIT
      ? '<button class="btn btn-ghost" type="button" id="rescues-toggle" aria-expanded="' + showAll + '" aria-controls="rescue-list">' +
          (showAll ? 'Show fewer' : 'Show all ' + imp.history.length + ' rescues') + '</button>'
      : '';

    return '' +
      '<section class="card impact-rescues" aria-labelledby="rescues-title">' +
        '<div class="impact-section-head">' +
          '<h2 id="rescues-title">Recent rescues</h2>' +
          '<p class="muted">' + plural(imp.history.length, 'rescue', 'rescues') + ' in total</p>' +
        '</div>' +
        '<ol class="rescue-list" id="rescue-list">' + rows + '</ol>' +
        more +
      '</section>';
  }

  function emptyHtml() {
    return '' +
      '<section class="card empty-state impact-empty" aria-labelledby="empty-title">' +
        EMPTY_ART +
        '<h2 id="empty-title">No rescues yet</h2>' +
        '<p>Reserve surplus food nearby and pick it up. Your food rescued, CO₂ avoided, money saved and badges will show up here.</p>' +
        '<a class="btn btn-primary" href="index.html">Browse food near you</a>' +
      '</section>';
  }

  /* ---------- render ---------- */
  function render() {
    // Keep keyboard focus on the same control after re-rendering.
    var active = document.activeElement;
    var focusId = active && root.contains(active) ? active.id : null;

    try {
      var imp = Store.getImpact();
      root.innerHTML = imp.rescues === 0
        ? emptyHtml()
        : statsHtml(imp) + streakHtml(imp) + badgesHtml(imp) + rescuesHtml(imp);
    } catch (err) {
      root.innerHTML = '<p class="notice notice-error" role="alert">We couldn\'t load your impact. Refresh the page to try again.</p>';
      if (window.console) console.error(err);
    }

    if (focusId) {
      var el = document.getElementById(focusId);
      if (el) el.focus();
    }
  }

  root.addEventListener('click', function (e) {
    if (e.target.closest('#rescues-toggle')) {
      showAll = !showAll;
      render();
    }
  });

  /* ---------- reset with in-page confirmation ---------- */
  var resetBtn = document.getElementById('reset-btn');
  var confirmBox = document.getElementById('reset-confirm');
  var yesBtn = document.getElementById('reset-yes');
  var cancelBtn = document.getElementById('reset-cancel');
  var doneMsg = document.getElementById('reset-done');

  function openConfirm() {
    doneMsg.hidden = true;
    confirmBox.hidden = false;
    resetBtn.setAttribute('aria-expanded', 'true');
    cancelBtn.focus(); // safest choice gets focus first
  }

  function closeConfirm() {
    confirmBox.hidden = true;
    resetBtn.setAttribute('aria-expanded', 'false');
    resetBtn.focus();
  }

  resetBtn.addEventListener('click', function () {
    if (confirmBox.hidden) openConfirm(); else closeConfirm();
  });
  cancelBtn.addEventListener('click', closeConfirm);
  confirmBox.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeConfirm();
  });
  yesBtn.addEventListener('click', function () {
    showAll = false;
    Store.resetDemo(); // fires 'store:change', which re-renders the page
    closeConfirm();
    doneMsg.hidden = false;
  });

  window.addEventListener('store:change', render);
  render();
})();
