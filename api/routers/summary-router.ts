import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { clients, faenas, cobros, inventory } from "@db/schema";

export const summaryRouter = createRouter({
  monthly: authedQuery
    .input(z.object({ month: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const allClients = await db.select().from(clients);
      const allFaenas = await db.select().from(faenas);
      const allCobros = await db.select().from(cobros);

      const monthPrefix = input.month;

      return allClients.map((client) => {
        const clientFaenas = allFaenas.filter(f => f.clientId === client.id);
        const clientCobros = allCobros.filter(c => c.clientId === client.id);

        const monthlyFaenas = clientFaenas.filter(f => f.date.startsWith(monthPrefix));
        const monthlyCobros = clientCobros.filter(c => c.date.startsWith(monthPrefix));

        const cantidadFaenada = monthlyFaenas.reduce((s, f) => s + f.quantity, 0);
        const ventasMes = monthlyFaenas.reduce((s, f) => s + f.quantity * f.unitPrice, 0);
        const cobrosMes = monthlyCobros.reduce((s, c) => s + c.amount, 0);
        const saldoMes = ventasMes - cobrosMes;

        const totalCantidad = clientFaenas.reduce((s, f) => s + f.quantity, 0);
        const totalVentas = clientFaenas.reduce((s, f) => s + f.quantity * f.unitPrice, 0);
        const totalCobros = clientCobros.reduce((s, c) => s + c.amount, 0);
        const deudaPendiente = totalVentas - totalCobros;

        return {
          clientId: client.id,
          clientName: client.name,
          cantidadFaenada,
          ventasMes,
          cobrosMes,
          saldoMes,
          totalCantidad,
          totalVentas,
          totalCobrosAll: totalCobros,
          deudaPendiente,
        };
      });
    }),

  historical: authedQuery.query(async () => {
    const db = getDb();
    const allClients = await db.select().from(clients);
    const allFaenas = await db.select().from(faenas);
    const allCobros = await db.select().from(cobros);

    return allClients.map((client) => {
      const clientFaenas = allFaenas.filter(f => f.clientId === client.id);
      const clientCobros = allCobros.filter(c => c.clientId === client.id);

      const totalCantidad = clientFaenas.reduce((s, f) => s + f.quantity, 0);
      const totalVentas = clientFaenas.reduce((s, f) => s + f.quantity * f.unitPrice, 0);
      const totalCobros = clientCobros.reduce((s, c) => s + c.amount, 0);
      const deudaPendiente = totalVentas - totalCobros;

      return {
        clientId: client.id,
        clientName: client.name,
        totalCantidad,
        totalVentas,
        totalCobros,
        deudaPendiente,
      };
    });
  }),

  dashboard: authedQuery.query(async () => {
    const db = getDb();
    const allClients = await db.select().from(clients);
    const allFaenas = await db.select().from(faenas);
    const allCobros = await db.select().from(cobros);
    const allInventory = await db.select().from(inventory);

    const totalClients = allClients.length;
    const totalVentas = allFaenas.reduce((s, f) => s + f.quantity * f.unitPrice, 0);
    const totalCobrosSum = allCobros.reduce((s, c) => s + c.amount, 0);
    const totalDeuda = totalVentas - totalCobrosSum;
    const totalAnimales = allFaenas.reduce((s, f) => s + f.quantity, 0);
    const lowStockItems = allInventory.filter(i => i.minStock > 0 && i.quantity <= i.minStock);

    return {
      totalClients,
      totalVentas,
      totalCobros: totalCobrosSum,
      totalDeuda,
      totalAnimales,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, minStock: i.minStock })),
    };
  }),
});
