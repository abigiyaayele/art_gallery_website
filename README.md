<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Seifu Arts

Online gallery for the painter Seifu: exhibitions, an archive, promotions with discounted and sold pieces,
custom painting requests, an About page for the painter, a contact page and online payment through
[Chapa](https://chapa.co). Works on phone, tablet and desktop.

## Pages

| URL | What it is |
|-----|-----------|
| `/` | Current exhibition carousel |
| `/archive` | All past work |
| `/offers` | Paintings on promotion and recently sold work |
| `/art/:id` | A painting's story, price and Buy button |
| `/checkout/:id` | Buyer details, then payment on Chapa |
| `/commission` | Request a painting made to order |
| `/commission/deposit` | Pay a commission deposit after receiving a quote |
| `/about` | About the painter and his work |
| `/contact` | Contact form and studio details |

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in what you need:
   - `CHAPA_SECRET_KEY` to turn on payments (use a `CHASECK_TEST-...` key while testing)
   - `VITE_STRAPI_URL` (and optionally `VITE_STRAPI_TOKEN`) to save commission and contact requests in Strapi.
     Without it, those forms open the visitor's email app instead.
3. Start the site: `npm run dev` (http://localhost:3000)
4. In a second terminal, start the payment server: `npm run dev:server`

## Editing content

- Paintings, prices, sale prices and sold status: `src/data/artworks.ts`
  (`salePrice` puts a piece on promotion, `sold: true` shows the SOLD tag and disables Buy).
- The current promotion text: `promotion` in `src/data/artworks.ts`
- Painter name, email, phone, address and hours: `src/data/site.ts`

Paintings bought online are marked sold automatically once Chapa confirms the payment.

## Deploy

`npm run build && npm start` serves the site and the payment API from one Node server (port `PORT`, default 3001).
Set `APP_URL` to the public address of the site so Chapa can return buyers to it, and add
`<APP_URL>/api/payments/webhook` as the webhook URL in the Chapa dashboard. Paid orders are stored in
`server/data/orders.json`, so keep that folder on persistent storage.

See [STRAPI_SETUP.md](STRAPI_SETUP.md) for setting up the Strapi collections.
