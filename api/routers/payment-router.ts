import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { TRPCError } from "@trpc/server";
import { getDb } from "../queries/connection";
import { cobros, faenas, clients } from "@db/schema";

export const paymentRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        clientId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.from) conditions.push(gte(cobros.date, input.from));
      if (input?.to) conditions.push(lte(cobros.date, input.to));
      if (input?.clientId) conditions.push(eq(cobros.clientId, input.clientId));

      const query = conditions.length > 0
        ? db.select().from(cobros).where(and(...conditions)).orderBy(cobros.date)
        : db.select().from(cobros).orderBy(cobros.date);

      const results = await query;

      const allClients = await db.select().from(clients);
      const clientMap = new Map(allClients.map(c => [c.id, c.name]));

      return results.map(r => ({
        ...r,
        clientName: clientMap.get(r.clientId) || "Unknown",
      }));
    }),

  create: authedQuery
    .input(
      z.object({
        clientId: z.number(),
        date: z.string(),
        amount: z.number().min(0.01),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const allFaenas = await db
        .select()
        .from(faenas)
        .where(eq(faenas.clientId, input.clientId));

      const totalVentas = allFaenas.reduce((sum, f) => sum + f.quantity * f.unitPrice, 0);

      const allCobros = await db
        .select()
        .from(cobros)
        .where(eq(cobros.clientId, input.clientId));

      const totalCobros = allCobros.reduce((sum, c) => sum + c.amount, 0);
      const pending = totalVentas - totalCobros;

      if (input.amount > pending + 0.001) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `El monto excede el saldo pendiente (Bs ${pending.toFixed(2)}). No se puede pagar de mas.`,
        });
      }

      const result = await db.insert(cobros).values({
        clientId: input.clientId,
        date: input.date,
        amount: Math.round(input.amount * 100) / 100,
        description: input.description || "",
      });
      return { id: Number(result[0].insertId) };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(cobros).where(eq(cobros.id, input.id));
      return { success: true };
    }),
});
