import { z } from "zod";
import { eq, like } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { clients } from "@db/schema";

export const clientRouter = createRouter({
  list: authedQuery
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const search = input?.search;
      if (search) {
        return db
          .select()
          .from(clients)
          .where(like(clients.name, `%${search}%`));
      }
      return db.select().from(clients);
    }),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(clients)
        .where(eq(clients.id, input.id));
      return result[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
        frequency: z.enum(["Diario", "Semanal", "Quincenal", "Mensual"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(clients).values({
        name: input.name,
        price: input.price,
        frequency: input.frequency,
      });
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        price: z.number().min(0).optional(),
        frequency: z.enum(["Diario", "Semanal", "Quincenal", "Mensual"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(clients).set(data).where(eq(clients.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(clients).where(eq(clients.id, input.id));
      return { success: true };
    }),
});
