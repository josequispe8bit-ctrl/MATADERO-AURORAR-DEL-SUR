import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  real,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const clients = mysqlTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  price: real("price").notNull().default(0),
  frequency: mysqlEnum("frequency", ["Diario", "Semanal", "Quincenal", "Mensual"]).default("Semanal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

export const faenas = mysqlTable("faenas", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  unitPrice: real("unitPrice").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Faena = typeof faenas.$inferSelect;
export type InsertFaena = typeof faenas.$inferInsert;

export const cobros = mysqlTable("cobros", {
  id: serial("id").primaryKey(),
  clientId: bigint("clientId", { mode: "number", unsigned: true }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  amount: real("amount").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Cobro = typeof cobros.$inferSelect;
export type InsertCobro = typeof cobros.$inferInsert;

export const inventory = mysqlTable("inventory", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["ganado", "carne", "general"]).default("general").notNull(),
  quantity: int("quantity").notNull().default(0),
  unit: mysqlEnum("unit", ["unidad", "kg", "cabezas"]).default("unidad").notNull(),
  minStock: int("minStock").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventoryItem = typeof inventory.$inferInsert;

export const inventoryLogs = mysqlTable("inventory_logs", {
  id: serial("id").primaryKey(),
  inventoryId: bigint("inventoryId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["entry", "exit"]).notNull(),
  quantity: int("quantity").notNull(),
  reason: text("reason"),
  date: varchar("date", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type InsertInventoryLog = typeof inventoryLogs.$inferInsert;
