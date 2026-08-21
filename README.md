# QuickCart

A small local-first shopping app built with React and Vite. Products, cart contents, and orders are stored in the browser with `localStorage`.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Features to test

- Browse the 8 sample products, filter by category, or search by name.
- Add products with the `+` button and change quantities in the cart.
- Use **Continue to checkout**. Submit an empty form to see validation, then enter a name, valid email, and delivery address to place an order.
- Open **Your orders** to view seeded and newly placed orders.
- Select **Export CSV** to download `quickcart-orders.csv`.

## Production check

```bash
npm run build
npm run preview
```

## Git setup

```bash
git init
git add .
git commit -m "Build QuickCart shopping app"
```
