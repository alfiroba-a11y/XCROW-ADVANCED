import crypto from 'node:crypto';
import express from 'express';
import { HashPayClient, constructWebhookEvent } from '@hashpay.me/sdk';

const app = express();
const port = process.env.PORT || 3000;

// HashPay credentials never reach the browser. Configure these in Render.
const hashpay = process.env.HASHPAY_API_KEY && process.env.HASHPAY_ORGANIZATION_ID
  ? new HashPayClient({
      apiKey: process.env.HASHPAY_API_KEY,
      organizationId: process.env.HASHPAY_ORGANIZATION_ID,
    })
  : null;

app.post('/webhooks/hashpay', express.raw({ type: '*/*' }), (req, res) => {
  if (!process.env.HASHPAY_WEBHOOK_SECRET) return res.status(503).send('Webhook is not configured');
  try {
    const signature = req.get('X-HashPay-Signature') || '';
    const event = constructWebhookEvent(req.body.toString('utf8'), signature, process.env.HASHPAY_WEBHOOK_SECRET);
    // TODO: Persist the event id and update only the matching deal after idempotency checks.
    console.info('Verified HashPay event', event.type, event.id);
    return res.sendStatus(204);
  } catch (error) {
    console.error('Invalid HashPay webhook', error.message);
    return res.status(400).send('Invalid signature');
  }
});

app.use(express.json());
app.use(express.static('public'));

app.post('/api/checkout', async (req, res) => {
  const { amount, settlementCurrency = 'USD', tokenSymbol = 'USDT', network = 'tron' } = req.body || {};
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(String(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Enter a valid amount.' });
  }
  if (!hashpay) {
    return res.status(503).json({
      error: 'HashPay is not configured yet.',
      setup: 'Set HASHPAY_API_KEY and HASHPAY_ORGANIZATION_ID in Render, then retry.'
    });
  }
  try {
    const invoice = await hashpay.createInvoice({
      amount: String(amount), settlementCurrency, tokenSymbol, network,
    });
    return res.json({ checkoutUrl: invoice.checkoutUrl, invoiceId: invoice.id });
  } catch (error) {
    console.error('HashPay invoice error', error.message);
    return res.status(502).json({ error: 'Could not create a HashPay invoice. Please try again.' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', hashpayConfigured: Boolean(hashpay), requestId: crypto.randomUUID() }));
app.listen(port, () => console.log(`XCROW running on :${port}`));
