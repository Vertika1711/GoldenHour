# Golden Hour

**Surplus food near you, before it's gone**

Golden Hour is a hyperlocal surplus-food marketplace in Delhi. Restaurants, bakeries, grocery stores and sweet shops list their unsold food at a discount, and nearby customers reserve it and pick it up within a few hours.

**Live site:** https://vertika1711.github.io/GoldenHour/

## Key features

- **Live pickup countdowns** on every listing
- **Area and location-based browsing**, with filters and search
- **10-minute bag hold** while you check out
- **Checkout with pickup codes**
- **Order tracking**
- **Freshness timeline** for each item: made, pickup window, good till
- **Impact tracker**: kg of food rescued, estimated CO₂ saved, money saved, weekly streaks and badges
- **Seller listing form** with a live preview
- **Dark mode** and a mobile-first, responsive design

## Pages

| Page | What it does |
|---|---|
| Browse (`index.html`) | Find food near you, with filters, search and listings closing soon |
| Item (`item.html`) | Item details, freshness timeline and add to bag |
| Bag & checkout (`cart.html`) | Review the held bag and place the order |
| Orders (`orders.html`) | Track orders and see pickup codes |
| Impact (`impact.html`) | Food rescued, CO₂ estimate, money saved, streaks and badges |
| Sell (`sell.html`) | List surplus food, with a live preview |
| Sign in (`login.html`) | Sign in or create an account |

## Tech

- Plain HTML, CSS and JavaScript: no frameworks and no build step
- Mock data and the browser's localStorage simulate the backend
- Hosted on GitHub Pages

## Run locally

```
git clone https://github.com/Vertika1711/GoldenHour.git
cd GoldenHour
```

Then either open `index.html` in your browser, or run a simple local server and open http://localhost:8000:

```
python -m http.server 8000
```

## Note

This is a student project. Listings, orders, payments and sign-in are all simulated, and no real money or food changes hands.

Demo data is saved in your browser; use 'Reset demo data' on the Impact page to start fresh.

## Team

- Vertika
- Suhani Gupta
- Vidushi Awasthi
- Shreya Pande
