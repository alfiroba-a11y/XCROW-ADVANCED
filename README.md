# XCROW.COM

Account-first, shared-escrow web service for Render.

## What is included

- Sign-up and login backed by MongoDB.
- Persistent escrow history per account.
- One escrow code and unique copyable buyer, seller, and third-party invite links.
- Payment choice: **USDT on TRC20** or **Kenyan shilling (KES)**.
- Supplied USDT TRC20 QR code, visible address, and copy button.
- Payment-submission history and downloadable PDF receipts containing the deal, amount, buyer, seller, payer, and payment date/time.
- HashPay SDK/webhook starter remains server-side for a future approved HashPay use case. It is not presented as an additional payment option.

## Deploy to Render

1. Upload these files to a GitHub repository and create a new Render Blueprint from `render.yaml`.
2. In Render, set `MONGO_URI` and a long random `JWT_SECRET`; copy the formats from `.env.example`.
3. Optionally configure `KES_PAYMENT_INSTRUCTIONS` only after your Kenyan payment provider is approved and operational.
4. Add a HashPay API key, organization ID, and webhook secret only if you intend to use the retained HashPay server integration.

## Important before accepting real money

The interface records payment submissions; it does not verify an on-chain USDT transfer or connect to a Kenyan payment gateway yet. Implement server-side transaction verification, idempotent webhook storage, release rules, KYC/AML, sanctions screening, secure custody, and appropriate licensing/legal review before operating a real escrow service.
