/* index.html (Browse) page script. Owner: Member B.
   Use only window.Store and window.UI (see CONTRACT.md). */
'use strict';

/* ---- SAMPLE by Member A: 6 cards to check the shared look.
        Member B: delete this block and build the Browse page. ---- */
(function () {
  var main = document.querySelector('main.page-browse');
  var area = Store.getArea();
  main.innerHTML =
    '<h1 style="margin-top:24px">Surplus food near ' + UI.esc(area.name) + '</h1>' +
    '<p class="lead">Sample cards from the shared foundation. Member B replaces this page.</p>' +
    '<div class="card-grid">' + Store.getListings().slice(0, 6).map(UI.itemCard).join('') + '</div>';
})();
