# XCROW.COM

Account-based escrow deal rooms for Render.

## Payment workflow

1. The buyer and seller sign up or log in.
2. The creator makes an escrow and receives a unique five-letter code.
3. The other main participant uses **Join existing escrow** and the code. A third party can join from their private link.
4. Once buyer and seller are present, the selected depositor starts a secure HashPay checkout.
5. HashPay confirms payment by signed webhook. XCROW then automatically changes the deal to **Funded** and enables its confirmed-payment receipt.

Set the HashPay webhook endpoint to:

`https://YOUR-RENDER-SERVICE.onrender.com/webhooks/hashpay`

## Required Render variables

- `MONGO_URI`
- `JWT_SECRET`
- `HASHPAY_API_KEY`
- `HASHPAY_ACCOUNT_ID` or `HASHPAY_ORGANIZATION_ID`
- `HASHPAY_WEBHOOK_SECRET`
- `USD_KES_RATE` (used to convert KES fee tiers to USDT)

## Kenyan-shilling payments

HashPay's documented checkout integration creates crypto invoices using a token and blockchain network. This project therefore creates automatic HashPay checkout for USDT/TRC20. To automate KES payments, a Kenyan payment provider with a server-to-server webhook must be connected; payment instructions or credentials for that provider are not part of the current HashPay credentials.

## Safety

Before operating a real escrow service, obtain relevant legal, custody, KYC/AML, sanctions, and payment-provider approvals. Never mark a payment funded from a browser action; XCROW marks it funded only from the signed HashPay webhook.
