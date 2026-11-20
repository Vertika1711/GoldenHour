# Golden Hour — team contract

Read this before writing any code. The sections "Fixed tech decisions", "Shared contract", "How the parts connect" and "Team rules" are the agreed text, word for word. "Implementation notes" at the end explains details of how `shared/` behaves.

The shared/ folder, README.md and CONTRACT.md are frozen after setup; only Member A changes them.

---

## Fixed tech decisions (do not change)

- Plain HTML, CSS and JavaScript. No frameworks, no npm, no build step. A multi-page site.
- Every page loads, in this order: shared/style.css, pages/\<page>.css, then the scripts shared/data.js, shared/store.js, shared/layout.js, and last pages/\<page>.js.
- All data is mock data plus localStorage, used only through the Store API below. No real backend, no real payments.
- Look: beet #6B1F45 (primary), turmeric #F4B400 (highlight), mint #12946A (fresh / success), tomato #D6452B (urgent / error), white background, ink #22141B, and a dark mode via prefers-color-scheme. Fonts from Google Fonts: Fraunces for headings, Manrope for body text. Use the CSS variables and component classes in shared/style.css (.btn, .btn-primary, .btn-ghost, .chip, .input, .card, .badge, .veg-dot, .drawer, .modal, .toast, .freshbar). Don't invent new colours or fonts.
- UI/UX rules: works from 360px phone width to desktop with nothing wider than the screen; tap targets at least 44px; visible keyboard focus; a label on every input; clear empty, error and loading states; sentence-case text; prices in rupees in Indian format (UI.rupee); respects prefers-reduced-motion; no alert(), confirm() or prompt() popups, use in-page messages and dialogs instead.
- Out of scope: real payments, real passwords, delivery, admin panel, map API keys.

## Shared contract (exact names; do not change them)

Data shapes:
- store: {id, name, type, lat, lng, address, rating}
- listing: {id, storeId, name, category ('bakery' | 'meals' | 'grocery' | 'sweets' | 'cafe'), veg (true / false), mrp, price, qty, qtyLeft, kgPerUnit, allergens[], desc, cookedAt, pickupFrom, pickupTo, goodTill (timestamps in ms), status ('live' | 'soldout' | 'closed')}
- cart: {items: [{listing, qty}], holdUntil (ms or null), removed: [names of items removed automatically]}
- order: {id, code (4 characters), storeId, items: [{id, name, qty, price, mrp, kgPerUnit}], total, saved, kg, placedAt, pickupFrom, pickupTo, status ('reserved' | 'picked' | 'cancelled' | 'missed'), customer: {name, phone}, payment}
- user: {name, phone, email} or null

window.Store (shared/store.js):
- getListings({includeClosed}) / getListing(id) / getStore(id) / distanceKm(store)
- getArea() -> {id, name, lat, lng} / setArea(id) / setCustomLocation(lat, lng). Areas are in window.AREAS, categories in window.CATEGORIES.
- getCart() / addToCart(id, qty) -> {ok, msg} / setQty(id, qty) / removeFromCart(id) / clearCart(). The bag is held for 10 minutes from the first item added, then cleared automatically.
- placeOrder({name, phone, payment}) -> array of orders, one per store
- getOrders() / cancelOrder(id) / markPickedUp(id) (adds the order to the impact history)
- getImpact() -> {kg, co2 (kg x 2.5, an estimate), saved, rescues, history[], weeks (last 12: [{weekStart, count}]), streak: {current, best}} / resetDemo()
- addListing(obj) -> {ok, errors} / getMyListings() / endListing(id)
- getUser() / signIn({name, phone, email}) / signOut()
- Every change fires the window event 'store:change'.

window.UI (shared/layout.js):
- rupee(n), time(ts), ago(ts), countdown(ms), esc(str), param(name)
- freshness(listing) -> {pct, label ('Very fresh' | 'Fresh' | 'Eat soon'), tone}
- freshBar(listing) -> HTML freshness bar (made -> good till, pickup window highlighted, moving 'now' marker)
- itemCard(listing) -> HTML listing card (links to item.html?id=..., has an Add button)
- toast(msg)
- Automatic on every page: header (logo, nav: Browse, Orders, Impact, Sell, a sign-in link, bag with live count), footer, a bottom tab bar on phones, and once-per-second updates of any element with data-countdown="\<timestamp>" and of every freshness bar. Any button with data-add="\<listing id>" adds 1 to the bag and shows a toast.

## How the parts connect

- Browse card or item page -> Add to bag -> Store.addToCart -> bag count in the header updates.
- Header bag -> cart.html -> Store.placeOrder -> the orders appear on orders.html.
- orders.html "Mark as picked up" -> Store.markPickedUp -> the numbers on impact.html go up.
- sell.html -> Store.addListing -> the new listing appears on index.html.
- login.html -> Store.signIn -> name and phone are pre-filled at checkout on cart.html.
- Links: a card opens item.html?id=\<listing id>; any page can send people to login.html?next=\<page>, and after signing in they go back to that page.

## Team rules

- Only create or edit MY files (listed in my role). The shared/ folder, README.md and CONTRACT.md are frozen after setup; only Member A changes them.
- If I need a helper that isn't in Store or UI, write it inside my own pages/\<page>.js.
- Read and change data only through Store functions. Never read or write localStorage directly, except to remember my own page's choices (like filters) under a key starting with my page name.
- Put my page's CSS in pages/\<page>.css, scoped under the class on my page's \<main> (for example main.page-browse), so it can never change another member's page.

---

## Implementation notes

Details of how `shared/` actually behaves. Where these add to the contract above, they do not change any name in it.

### Page skeleton

- Each page's `<main>` is `<main id="main" class="page-<name> container">`. The class names are:
  - index.html: `page-browse`
  - item.html: `page-item`
  - cart.html: `page-cart`
  - orders.html: `page-orders`
  - impact.html: `page-impact`
  - sell.html: `page-sell`
  - login.html: `page-login`
- `container` gives the shared max width (1200px) and side padding. `id="main"` is the target of the "Skip to content" link.
- Fill your `<main>` from `pages/<page>.js`, or write HTML inside it. Don't touch `#app-header` or `#app-footer`.
- Your page script runs before `layout.js` finishes its setup, so cards you render straight away are already in place when the header, footer and ticker start.

### Data (shared/data.js)

- `window.AREAS`: list of Delhi neighbourhoods as `{id, name, lat, lng}`. The ids are:
  - `connaught-place` (the default area)
  - `hauz-khas`
  - `lajpat-nagar`
  - `karol-bagh`
  - `rajouri-garden`
- `window.STORES`: list of store objects (shape above). `type` is a category id.
- `window.CATEGORIES` is a **list in display order** (bakery, meals, grocery, sweets, cafe). Each item has these fields:
  - `id`: `'bakery' | 'meals' | 'grocery' | 'sweets' | 'cafe'` (matches `listing.category`)
  - `label`: display text (`'Bakery'`, `'Meals'`, `'Grocery'`, `'Sweets'`, `'Café'`)
  - `tint`: soft background colour (hex)
  - `svg`: decorative inline SVG string (`aria-hidden="true"`)

  Look one up with `CATEGORIES.find(function (c) { return c.id === listing.category; })`.
- `window.SEED_LISTINGS`: raw seed data. Don't read it; use `Store.getListings()`.

### Store behaviour

- **Listings and status**
  - Status is worked out every time you read a listing:
    - `closed` if it was ended by the seller or `pickupTo` has passed
    - `soldout` if `qtyLeft` is 0
    - otherwise `live`
  - A listing whose pickup hasn't opened yet is still `live`, so people can reserve ahead.
  - `getListings()` returns `live` and `soldout` listings, soonest-closing first. `getListings({includeClosed: true})` also returns `closed` ones.
- **Distance:** `distanceKm(store)` accepts a store object or a store id and returns km with 1 decimal, from the current area. It returns `null` for an unknown store.
- **Seed refresh:** seed times are calculated from a saved `seedBase`. After 6 hours the seed listings are rebuilt from now and the bag is emptied. Orders, history, the user and your own listings are kept.
- **Return values** for functions the contract leaves open:

  | Function | Returns |
  |---|---|
  | `setQty`, `removeFromCart` | `{ok, msg}` |
  | `cancelOrder`, `markPickedUp` | `{ok, msg}` |
  | `setArea`, `setCustomLocation` | `{ok, msg}` |
  | `signIn` | `{ok, errors, user}` |
  | `addListing` | `{ok, errors, listing}` |
  | `clearCart`, `signOut`, `resetDemo` | nothing |

  `errors` is an object of `{fieldName: 'Message to show'}`. `signIn` uses the fields `name`, `phone` and `email`. `addListing` uses `name`, `category`, `mrp`, `price`, `qty`, `kgPerUnit`, `cookedAt`, `pickupFrom`, `pickupTo` and `goodTill`. Show each message next to its field.
- **Bag:**
  - `addToCart` checks stock against what is already in the bag. Stock (`qtyLeft`) is only reduced when an order is placed.
  - The 10-minute hold starts when the first item goes into an empty bag. When it runs out, the bag is emptied and the item names go into `cart.removed`. Items that sell out or close while in the bag are also removed and listed there.
  - `cart.removed` is reset by the next `addToCart` or by `clearCart()`.
  - `setQty(id, 0)` removes the item.
- **`placeOrder`**
  - It returns `[]` (an empty array) on failure:
    - the bag is empty
    - the hold has expired
    - the name is missing
    - the phone is not a valid 10-digit Indian mobile number (spaces and a `+91` prefix are allowed)
  - Validate your form first and show your own messages. On success it returns one order per store and empties the bag.
  - `payment` is stored as given. If it's missing, it defaults to `'pay-at-pickup'`.
- **Orders**
  - `getOrders()` is newest first. A `reserved` order whose `pickupTo` has passed becomes `missed`.
  - `cancelOrder` and `markPickedUp` work only on `reserved` orders. Cancelling puts the stock back.
- **Impact:** `getImpact().history` is newest first. Each entry is `{id, orderId, storeId, storeName, items: [{name, qty}], categories: [category ids], kg, saved, date}`. Weeks start on Monday. The current streak counts back from this week; an empty current week doesn't break it until the week is over. A fresh demo has 6 sample rescues.
- **`resetDemo()`:** clears orders, impact history, bag, user and your own listings, and creates fresh seed listings. Impact history then stays empty. The chosen area is kept.
- **Selling**
  - `addListing(obj)` takes `{name, category, veg, mrp, price, qty, kgPerUnit?, allergens?, desc?, cookedAt?, pickupFrom, pickupTo, goodTill?, storeName?}`. All times are timestamps in ms, and `allergens` can be an array or a comma-separated string. The defaults are:
    - `kgPerUnit` = 0.3
    - `cookedAt` = now
    - `goodTill` = `pickupTo` + 60 minutes
  - All your listings belong to one store with id `'my-shop'`. It is named from `storeName` (or "Your shop") and placed in the current area.
  - `getMyListings()` returns them newest first, including ended ones. `endListing(id)` closes one of them.
- **Users:** `signIn` checks the name (at least 2 characters), the phone (10-digit Indian mobile) and the email (optional, but valid if given). There are no passwords.
- **Events**
  - `'store:change'` fires after every change.
  - When `getCart()` or `getOrders()` clean something up (expired hold, missed orders), the event fires a moment later rather than immediately.
  - In a `'store:change'` handler, re-render from Store getters. Don't call functions that change data there.
- **Storage:** everything lives under the localStorage key `goldenhour`. Never touch it. When the seed data changes, Member A bumps `VERSION` in `store.js`, and everyone's old saved data is replaced automatically. Your own page preferences go under a key starting with your page name, for example `browse.filters`.

### UI helpers

- `UI.rupee(123456)` gives `"₹1,23,456"` (Indian grouping, up to 2 decimals).
- `UI.time(ts)` gives a clock time like `"4:30 pm"`. If the time isn't today it adds a word or date: `"tomorrow 9:00 am"`, `"yesterday 6:15 pm"`, or `"22 Nov, 6:25 pm"`.
- `UI.ago(ts)` gives `"just now"`, `"5 min ago"`, `"2 h ago"`, `"yesterday"`, `"3 days ago"` or `"3 Nov"`. Future times read as `"in 20 min"`.
- `UI.countdown(ms)` gives `"12:39"` (minutes:seconds) under 1 hour and `"1h 05m"` from 1 hour. 0 or less gives `"0:00"`.
- `UI.freshness(listing).tone` is `'fresh' | 'ok' | 'urgent'`. Use it as a badge class: `badge-fresh`, `badge-ok` or `badge-urgent`.
- `UI.freshBar(listing)` shows:
  - a key above the bar ("Pickup 5:55 pm–6:40 pm")
  - a soft freshness gradient from made to good till
  - the pickup window as a solid highlighted segment
  - a moving "now" needle
  - "Made…" and "Good till…" below the bar

  The ticker moves the needle every second.
- `data-countdown="<timestamp>"`: the ticker replaces the element's text every second. It adds the class `is-urgent` when 30 minutes or less are left and `is-over` at 0.
- `UI.toast(msg)`: short message, announced to screen readers. Use it for confirmations, and in-page messages (`.notice`) for errors that need reading.
- `UI.esc(str)`: always escape user-entered or data text before putting it into HTML.

### Cards and the Add button

- `UI.itemCard(listing)` returns an `<article class="card item-card" data-listing="<id>">`. Put cards in a `<div class="card-grid">`.
  - **"Ends soon"** shows only while pickup closes within 30 minutes and the item is still available.
  - **"N left"** shows how many more can still be added (stock minus what is already in the bag).
  - **Long store names** are cut off with "…".
  - **Sold-out and closed cards** are greyed. The pickup countdown and freshness label are hidden, and a disabled button gives the reason ("Sold out" or "Pickup ended").
- **`data-add` is only for one-tap add buttons**, like the card's Add button. `layout.js` manages every `data-add` button on the page:
  - It wraps the button in `<span class="add-control">`.
  - Once the item is in the bag, it swaps the button for a stepper ("− 2 +") that uses `Store.setQty`.
  - When the bag holds every available unit, it disables + and shows "Max in bag".
  - When the item is sold out or closed, it disables the button and shows the reason.
  - It updates all of these automatically on `'store:change'`, so you don't need to re-render for them.
- **A page with its own quantity selector plus an "Add to bag" button (like item.html) should NOT put `data-add` on that button.** Call `Store.addToCart(id, qty)` directly and show `UI.toast(result.msg)`.

### Extra CSS classes in shared/style.css

| Class | Use |
|---|---|
| `.btn-danger` | Red button for destructive actions (for example Reset demo data) |
| `.btn-block` | Full-width button |
| `.chip` | Filter or toggle chip. Selected with `aria-pressed="true"` on a button, the class `.is-selected`, or a checked `<input>` inside a `<label class="chip">` |
| `.field`, `.label`, `.input`, `.field-hint`, `.field-error` | Form fields. Set `aria-invalid="true"` on an `.input` that has an error |
| `.notice`, `.notice-success`, `.notice-error`, `.notice-info` | In-page messages (instead of `alert()`) |
| `.empty-state` | Centred block with an illustration, a short message and an action |
| `.skeleton` | Shimmer block for loading states |
| `.card-grid` | Responsive grid of cards |
| `.badge-primary`, `.badge-fresh`, `.badge-ok`, `.badge-urgent`, `.badge-highlight` | Badge colours |
| `.lead`, `.muted`, `.nowrap`, `.sr-only` | Text helpers |
| `.modal`, `.drawer` | Put on a `<dialog>` and open it with `dialog.showModal()`. Use `.modal-actions` / `.drawer-actions` for the button row |
| `[hidden]` | Always hides an element, even one with a component class |
