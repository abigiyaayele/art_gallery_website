import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import path from 'path';
import { currentPrice, getArtwork } from '../src/data/artworks';
import { initializePayment, isChapaConfigured, isValidWebhook, verifyPayment } from './chapa';
import { orders, Order } from './orders';

const app = express();
const port = Number(process.env.PORT || 3001);
const appUrl = (process.env.APP_URL || `http://localhost:3000`).replace(/\/$/, '');

// Keep the raw body so webhook signatures can be checked.
app.use(express.json({ verify: (req, _res, buf) => { (req as any).rawBody = buf; } }));

const text = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function isArtworkSold(id: number) {
  return Boolean(getArtwork(id)?.sold) || orders.soldArtworkIds().includes(id);
}

/** Marks an order paid once Chapa confirms the full amount. Safe to call more than once. */
async function confirmOrder(txRef: string): Promise<Order | undefined> {
  const order = orders.get(txRef);
  if (!order || order.status === 'paid') return order;
  const payment = await verifyPayment(txRef);
  if (payment.paid && payment.currency === order.currency && payment.amount >= order.amount) {
    return orders.update(txRef, { status: 'paid', paidAt: new Date().toISOString() });
  }
  return order;
}

app.get('/api/sold', (_req, res) => {
  res.json({ ids: orders.soldArtworkIds() });
});

app.post('/api/checkout/artwork', async (req, res) => {
  if (!isChapaConfigured()) return res.status(503).json({ error: 'Online payment is not set up yet.' });

  const artwork = getArtwork(Number(req.body.artworkId));
  if (!artwork) return res.status(404).json({ error: 'Artwork not found.' });
  if (isArtworkSold(artwork.id)) return res.status(409).json({ error: 'This painting has already been sold.' });

  const email = text(req.body.email);
  const firstName = text(req.body.firstName, 50);
  const lastName = text(req.body.lastName, 50);
  if (!isEmail(email) || !firstName || !lastName) return res.status(400).json({ error: 'Please fill in your name and a valid email.' });

  const shipping = Object.fromEntries(
    ['address', 'city', 'postalCode', 'country'].map(k => [k, text(req.body[k])]),
  );
  const order: Order = {
    txRef: `art-${artwork.id}-${crypto.randomUUID()}`,
    kind: 'artwork',
    artworkId: artwork.id,
    // Price always comes from the catalog, never from the browser.
    amount: currentPrice(artwork),
    currency: 'USD',
    email,
    name: `${firstName} ${lastName}`,
    phone: text(req.body.phone, 30),
    shipping,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    const checkoutUrl = await initializePayment({
      txRef: order.txRef,
      amount: order.amount,
      email,
      firstName,
      lastName,
      phone: order.phone,
      description: `Painting ${artwork.title}`,
      returnUrl: `${appUrl}/payment/complete?tx_ref=${order.txRef}`,
      callbackUrl: `${appUrl}/api/payments/webhook`,
    });
    orders.add(order);
    res.json({ checkoutUrl });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Could not start the payment. Please try again.' });
  }
});

app.post('/api/checkout/deposit', async (req, res) => {
  if (!isChapaConfigured()) return res.status(503).json({ error: 'Online payment is not set up yet.' });

  const email = text(req.body.email);
  const firstName = text(req.body.firstName, 50);
  const lastName = text(req.body.lastName, 50);
  const amount = Math.round(Number(req.body.amount) * 100) / 100;
  if (!isEmail(email) || !firstName || !lastName) return res.status(400).json({ error: 'Please fill in your name and a valid email.' });
  if (!(amount >= 10 && amount <= 100000)) return res.status(400).json({ error: 'Enter the deposit amount from your quote.' });

  const order: Order = {
    txRef: `dep-${crypto.randomUUID()}`,
    kind: 'deposit',
    amount,
    currency: 'USD',
    email,
    name: `${firstName} ${lastName}`,
    note: text(req.body.note, 500),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    const checkoutUrl = await initializePayment({
      txRef: order.txRef,
      amount,
      email,
      firstName,
      lastName,
      description: 'Commission deposit',
      returnUrl: `${appUrl}/payment/complete?tx_ref=${order.txRef}`,
      callbackUrl: `${appUrl}/api/payments/webhook`,
    });
    orders.add(order);
    res.json({ checkoutUrl });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Could not start the payment. Please try again.' });
  }
});

app.get('/api/payments/verify/:txRef', async (req, res) => {
  const order = await confirmOrder(req.params.txRef).catch(() => orders.get(req.params.txRef));
  if (!order) return res.status(404).json({ error: 'Payment not found.' });
  const artwork = order.artworkId !== undefined ? getArtwork(order.artworkId) : undefined;
  res.json({ status: order.status, kind: order.kind, amount: order.amount, artworkTitle: artwork?.title });
});

app.post('/api/payments/webhook', async (req, res) => {
  const signature = (req.headers['x-chapa-signature'] || req.headers['chapa-signature']) as string | undefined;
  if (process.env.CHAPA_WEBHOOK_SECRET && !isValidWebhook((req as any).rawBody, signature)) {
    return res.sendStatus(401);
  }
  const txRef = text(req.body.tx_ref || req.body.trx_ref);
  // Never trust the webhook body for the result: ask Chapa directly.
  if (txRef) await confirmOrder(txRef).catch(err => console.error(err));
  res.sendStatus(200);
});

// In production, serve the built site and let the client router handle page URLs.
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve('dist');
  app.use(express.static(dist));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(port, () => {
  console.log(`Seifu Arts server on http://localhost:${port}${isChapaConfigured() ? '' : ' (payments disabled: set CHAPA_SECRET_KEY)'}`);
});
