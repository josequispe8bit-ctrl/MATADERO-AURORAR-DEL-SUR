import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { inventory, inventoryLogs } from "@db/schema";

export const inventoryRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return db.select().from(inventory);
  }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1),
        category: z.enum(["ganado", "carne", "general"]).optional(),
        quantity: z.number().min(0).optional(),
        unit: z.enum(["unidad", "kg", "cabezas"]).optional(),
        minStock: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(inventory).values({
        name: input.name,
        category: input.category || "general",
        quantity: input.quantity || 0,
        unit: input.unit || "unidad",
        minStock: input.minStock || 0,
      });
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        category: z.enum(["ganado", "carne", "general"]).optional(),
        minStock: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(inventory).set(data).where(eq(inventory.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(inventoryLogs).where(eq(inventoryLogs.inventoryId, input.id));
      await db.delete(inventory).where(eq(inventory.id, input.id));
      return { success: true };
    }),

  movement: authedQuery
    .input(
      z.object({
        inventoryId: z.number(),
        type: z.enum(["entry", "exit"]),
        quantity: z.number().min(1),
        reason: z.string().optional(),
        date: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const today = new Date().toISOString().split("T")[0];

      const items = await db
        .select()
        .from(inventory)
        .where(eq(inventory.id, input.inventoryId));

      if (items.length === 0) {
        throw new Error("Item not found");
      }

      const item = items[0];
      const newQuantity = input.type === "entry"
        ? item.quantity + input.quantity
        : item.quantity - input.quantity;

      if (newQuantity < 0) {
        throw new Error("No hay suficiente stock para esta salida");
      }

      await db.update(inventory)
        .set({ quantity: newQuantity })
        .where(eq(inventory.id, input.inventoryId));

      await db.insert(inventoryLogs).values({
        inventoryId: input.inventoryId,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason || "",
        date: input.date || today,
      });

      return { success: true, newQuantity };
    }),

  logs: authedQuery
    .input(z.object({ inventoryId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(inventoryLogs)
        .where(eq(inventoryLogs.inventoryId, input.inventoryId))
        .orderBy(inventoryLogs.date);
    }),
});
