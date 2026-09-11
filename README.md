# XCROW.COM

High-trust escrow experience and HashPay invoice starter for Node 20+.

## Run locally

1. Copy `.env.example` to `.env` and set the HashPay values in your shell or host.
2. `npm install`
3. `npm start`

## Deploy to Render

Push this folder to a Git repository, create a Render Blueprint using `render.yaml`, then enter the three HashPay variables in Render's environment settings. Register `https://YOUR-DOMAIN/webhooks/hashpay` as a HashPay webhook. The raw-body handler verifies the signature before accepting events.

## Important production scope

This is a front-end product prototype plus an invoice/webhook integration starter. It does not itself establish regulated escrow, custody, KYC/AML, tax, sanctions screening, or chargeback protection. Before holding or releasing client funds, involve qualified legal/compliance counsel and a licensed escrow/custody provider in each operating jurisdiction; implement an authenticated database ledger, idempotent webhook storage, user identity verification, role permissions, and independent release authorization.
