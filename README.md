This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cafe orders and Razorpay test payments

Set `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `RAZORPAY_TEST_API_KEY`, and `RAZORPAY_TEST_API_SECRET` in the deployment environment. Apply the Drizzle migrations before starting the app. Existing cafe products have no prices; add a price of at least ₹1 to each variant in `/admin/cafe` before it can be purchased.

The customer pays through Razorpay Standard Checkout. The server prices the cart, reserves a unique checkout attempt, creates the Razorpay order, verifies the checkout signature, checks and captures the payment, then releases the food order to `/admin/orders`. Unpaid orders are hidden from staff. Repeated requests with the same checkout key reuse one order. The customer can recover a checkout or check payment status after closing the browser. Staff see paginated status queues, with oldest pending orders first.

For recovery when a customer closes the browser before confirmation, set a separate `RAZORPAY_WEBHOOK_SECRET` and create a **test mode** Razorpay webhook for `payment.authorized` and `payment.captured` at `https://YOUR_DOMAIN/api/razorpay/webhook`. The webhook secret must match the value in the deployment environment. Razorpay requires a public HTTPS URL. These credentials are test mode only; live payments require live API keys and a separately configured live webhook.

Run `npm test` for the order, signature, session, and request-size checks. With the app running locally and test keys configured, `node --env-file=.env --env-file=.env.local scripts/order-integration.mjs` creates a temporary ₹1 product, tests concurrent idempotent checkout requests, and removes its test records. A 1,000-request validation load passed locally, but this is not a benchmark of 1,000 completed payments. Verify actual payment capacity on the deployed infrastructure with Razorpay's test environment and its applicable API limits before promising that throughput to customers.
