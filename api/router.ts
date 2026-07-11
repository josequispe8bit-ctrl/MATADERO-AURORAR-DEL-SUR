import { authRouter } from "./auth-router";
import { clientRouter } from "./routers/client-router";
import { faenaRouter } from "./routers/faena-router";
import { paymentRouter } from "./routers/payment-router";
import { summaryRouter } from "./routers/summary-router";
import { inventoryRouter } from "./routers/inventory-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  clients: clientRouter,
  faena: faenaRouter,
  payment: paymentRouter,
  summary: summaryRouter,
  inventory: inventoryRouter,
});

export type AppRouter = typeof appRouter;
