# M&Shopping

E-commerce store for Lebanon. Customers order here, every order is validated by hand in the dashboard, then bought from the supplier (AliExpress) and delivered. Cash on delivery or Whish.

## Run

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD and SESSION_SECRET
npm run dev                  # http://localhost:3000
```

- Store: `/`, `/shop`, `/product/[id]`, `/bag`, `/checkout`, `/order/[id]`
- Dashboard: `/admin` (password = `ADMIN_PASSWORD`)

## Catalog

- `npm run seed:demo`: demo products (for design/testing only, not orderable).
- `npm run import:aliexpress`: real products through the official AliExpress Affiliate API, shipped to Lebanon, filtered for quality (≥92% positive, ≥100 sold, $1.5–150). Needs the keys in `.env.local`.
  - One department / keyword: `npm run import:aliexpress -- tech "gaming mouse" 3`

Pricing rule: `scripts/pricing.mjs` (supplier cost × 1.45 + $2).
Brand name, delivery fee and departments: `lib/config.ts`.

## Order flow

`To validate` → `Confirmed` (customer called) → `Bought from supplier` → `Shipped` → `Delivered` (or `Cancelled`).

Orders are stored in `data/orders.json` for now; move to a database before deploying to a host with an ephemeral disk.
