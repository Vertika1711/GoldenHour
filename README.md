# Golden Hour

**Surplus food near you, before it's gone**

Golden Hour is a hyperlocal surplus-food marketplace. Restaurants, bakeries, grocery stores and sweet shops list unsold or near-expiry food at a discount, and nearby customers reserve it and pick it up within a few hours. Every item shows a freshness timeline (made, pickup window, good till), and an impact tracker counts the food you rescue.

This is a student team project: plain HTML, CSS and JavaScript, with mock data saved in the browser. There are no real payments and no real backend. The demo is set in Delhi, with shops near Connaught Place, Hauz Khas, Lajpat Nagar, Karol Bagh and Rajouri Garden.

**Read [CONTRACT.md](CONTRACT.md) before writing any code.**

## View the site locally

Either:

- **Double-click `index.html`** to open it in your browser, or
- **Run a simple local server** from the project folder (recommended):

  ```
  python -m http.server 8000
  ```

  Then open http://localhost:8000 in your browser. Stop the server with Ctrl + C.

Data is saved in your browser's localStorage, so each browser (and `file://` versus `localhost`) has its own demo data. To start fresh, use "Reset demo data" on the Impact page.

## Files

```
index.html  item.html  cart.html  orders.html  impact.html  sell.html  login.html
shared/   style.css, data.js, store.js, layout.js   (frozen, Member A only)
pages/    <page>.css and <page>.js, one pair per page
CONTRACT.md   shared contract, team rules and implementation notes
```

## Who owns what

| Member | Pages |
|---|---|
| A | impact.html |
| B | index.html |
| C | item.html, sell.html, login.html |
| D | cart.html, orders.html |

Each member edits only their own `*.html`, `pages/<page>.css` and `pages/<page>.js`. The `shared/` folder, README.md and CONTRACT.md are changed only by Member A.

## Branches

| Member | Branch |
|---|---|
| A | `feature/impact` |
| B | `feature/browse` |
| C | `feature/item-sell-login` |
| D | `feature/cart-orders` |

Workflow:

1. `git checkout main` and `git pull`
2. `git checkout -b <your branch>` (first time only; afterwards `git checkout <your branch>` and `git merge main`)
3. Commit your work, then `git push -u origin <your branch>`
4. Open a pull request into `main` on GitHub
