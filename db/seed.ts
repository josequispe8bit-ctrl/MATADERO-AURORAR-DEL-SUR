import { getDb } from "../api/queries/connection";
import { clients, faenas, cobros, inventory } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed clients
  const clientData = [
    { name: "Asencio", price: 120, frequency: "Semanal" as const },
    { name: "Carniceria La Popular", price: 130, frequency: "Diario" as const },
    { name: "Frigorifico El Toro", price: 140, frequency: "Mensual" as const },
    { name: "Supermercado La Esperanza", price: 125, frequency: "Quincenal" as const },
    { name: "Restaurant El Gaucho", price: 135, frequency: "Semanal" as const },
  ];

  for (const c of clientData) {
    await db.insert(clients).values(c);
  }
  console.log("  + 5 clients seeded");

  // Get inserted clients
  const insertedClients = await db.select().from(clients);

  // Seed faenas
  const today = new Date();
  const faenaData = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const client = insertedClients[i % insertedClients.length];
    faenaData.push({
      clientId: client.id,
      date: dateStr,
      quantity: Math.floor(Math.random() * 8) + 1,
      unitPrice: client.price,
    });
  }

  for (const f of faenaData) {
    await db.insert(faenas).values(f);
  }
  console.log("  + 30 faena records seeded");

  // Seed cobros
  const cobroData = [];
  for (let i = 0; i < 15; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i * 2);
    const dateStr = date.toISOString().split("T")[0];
    const client = insertedClients[i % insertedClients.length];
    cobroData.push({
      clientId: client.id,
      date: dateStr,
      amount: Math.round((Math.random() * 800 + 200) * 100) / 100,
      description: i % 3 === 0 ? "Pago semanal" : i % 3 === 1 ? "Pago parcial" : "Adelanto",
    });
  }

  for (const c of cobroData) {
    await db.insert(cobros).values(c);
  }
  console.log("  + 15 cobro records seeded");

  // Seed inventory
  const inventoryData = [
    { name: "Ganado Novillo", category: "ganado" as const, quantity: 45, unit: "cabezas" as const, minStock: 10 },
    { name: "Ganado Vaca", category: "ganado" as const, quantity: 22, unit: "cabezas" as const, minStock: 5 },
    { name: "Carne de Res", category: "carne" as const, quantity: 180, unit: "kg" as const, minStock: 50 },
    { name: "Carne de Cerdo", category: "carne" as const, quantity: 85, unit: "kg" as const, minStock: 30 },
    { name: "Chorizo Artesanal", category: "carne" as const, quantity: 120, unit: "kg" as const, minStock: 40 },
    { name: "Cajas de Empaque", category: "general" as const, quantity: 200, unit: "unidad" as const, minStock: 50 },
    { name: "Bolsas Plasticas", category: "general" as const, quantity: 8, unit: "unidad" as const, minStock: 20 },
  ];

  for (const inv of inventoryData) {
    await db.insert(inventory).values(inv);
  }
  console.log("  + 7 inventory items seeded");

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
