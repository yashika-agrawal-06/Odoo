import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { expenses, fuelLogs } from "../../db/schema/index.js";

export async function getFuelLogs() {
  return await db.query.fuelLogs.findMany({
    orderBy: [desc(fuelLogs.date)],
    with: {
      trip: true,
      vehicle: true,
    },
  });
}

export async function getExpenses() {
  return await db.query.expenses.findMany({
    orderBy: [desc(expenses.createdAt)],
    with: {
      trip: true,
      vehicle: true,
    },
  });
}

export async function createFuelLog(data, userId) {
  const [newLog] = await db
    .insert(fuelLogs)
    .values({
      cost: data.cost,
      date: new Date(data.date),
      liters: data.liters,
      loggedBy: userId,
      tripId: data.tripId || null,
      vehicleId: data.vehicleId,
    })
    .returning();

  return newLog;
}

export async function createExpense(data, userId) {
  const [newExpense] = await db
    .insert(expenses)
    .values({
      loggedBy: userId,
      otherAmount: data.otherAmount || "0.00",
      tollAmount: data.tollAmount || "0.00",
      tripId: data.tripId || null,
      vehicleId: data.vehicleId,
    })
    .returning();

  return newExpense;
}

export async function deleteFuelLog(id) {
  const [deleted] = await db
    .delete(fuelLogs)
    .where(eq(fuelLogs.id, id))
    .returning();
  return deleted;
}

export async function deleteExpense(id) {
  const [deleted] = await db
    .delete(expenses)
    .where(eq(expenses.id, id))
    .returning();
  return deleted;
}
