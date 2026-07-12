import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { maintenanceLogs, vehicles } from "../../db/schema/index.js";

export async function getAllLogs() {
  return await db.query.maintenanceLogs.findMany({
    orderBy: [desc(maintenanceLogs.serviceDate)],
    with: {
      vehicle: true,
    },
  });
}

export async function createLog(data, userId) {
  return await db.transaction(async (tx) => {
    const vehicle = await tx.query.vehicles.findFirst({
      where: eq(vehicles.id, data.vehicleId),
    });
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    if (vehicle.status === "on_trip") {
      throw new Error(
        "Vehicle is currently on a trip and cannot be put in maintenance"
      );
    }

    // Insert maintenance log
    const [newLog] = await tx
      .insert(maintenanceLogs)
      .values({
        cost: data.cost,
        loggedBy: userId,
        notes: data.notes || null,
        serviceDate: new Date(data.serviceDate),
        serviceType: data.serviceType,
        status: "in_shop",
        vehicleId: data.vehicleId,
      })
      .returning();

    // Cascade vehicle status to "in_shop"
    await tx
      .update(vehicles)
      .set({
        status: "in_shop",
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, data.vehicleId));

    return newLog;
  });
}

export async function closeLog(id) {
  return await db.transaction(async (tx) => {
    const log = await tx.query.maintenanceLogs.findFirst({
      where: eq(maintenanceLogs.id, id),
    });
    if (!log) {
      throw new Error("Maintenance record not found");
    }
    if (log.status === "completed") {
      throw new Error("Maintenance is already completed");
    }

    // Close the log
    const [updatedLog] = await tx
      .update(maintenanceLogs)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(maintenanceLogs.id, id))
      .returning();

    // Check if vehicle is retired or not
    const vehicle = await tx.query.vehicles.findFirst({
      where: eq(vehicles.id, log.vehicleId),
    });

    if (vehicle && vehicle.status !== "retired") {
      // Restore vehicle status to available
      await tx
        .update(vehicles)
        .set({
          status: "available",
          updatedAt: new Date(),
        })
        .where(eq(vehicles.id, log.vehicleId));
    }

    return updatedLog;
  });
}

export async function deleteLog(id) {
  return await db.transaction(async (tx) => {
    const log = await tx.query.maintenanceLogs.findFirst({
      where: eq(maintenanceLogs.id, id),
    });
    if (!log) {
      throw new Error("Log not found");
    }

    // If it was in shop, restore vehicle to available
    if (log.status === "in_shop") {
      const vehicle = await tx.query.vehicles.findFirst({
        where: eq(vehicles.id, log.vehicleId),
      });
      if (vehicle && vehicle.status === "in_shop") {
        await tx
          .update(vehicles)
          .set({ status: "available" })
          .where(eq(vehicles.id, log.vehicleId));
      }
    }

    const [deleted] = await tx
      .delete(maintenanceLogs)
      .where(eq(maintenanceLogs.id, id))
      .returning();
    return deleted;
  });
}
