import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { faenas, clients } from "@db/schema";

export const faenaRouter = createRouter({
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

      if (input?.from) conditions.push(gte(faenas.date, input.from));
      if (input?.to) conditions.push(lte(faenas.date, input.to));
      if (input?.clientId) conditions.push(eq(faenas.clientId, input.clientId));

      const query = conditions.length > 0
        ? db.select().from(faenas).where(and(...conditions)).orderBy(faenas.date)
        : db.select().from(faenas).orderBy(faenas.date);

      const results = await query;
      
      const allClients = await db.select().from(clients);
      const clientMap = new Map(allClients.map(c => [c.id, c.name]));

      return results.map(r => ({
        ...r,
        clientName: clientMap.get(r.clientId) || "Unknown",
        total: r.quantity * r.unitPrice,
      }));
    }),

  create: authedQuery
    .input(
      z.object({
        clientId: z.number(),
        date: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(faenas).values(input);
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        clientId: z.number().optional(),
        date: z.string().optional(),
        quantity: z.number().min(1).optional(),
        unitPrice: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(faenas).set(data).where(eq(faenas.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(faenas).where(eq(faenas.id, input.id));
      return { success: true };
    }),
});
