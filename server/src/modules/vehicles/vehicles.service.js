import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { regions, vehicles } from "../../db/schema/index.js";

export async function getAllVehicles(filters = {}) {
  const whereClauses = [];

  if (filters.type && filters.type !== "all") {
    whereClauses.push(eq(vehicles.type, filters.type));
  }
  if (filters.status && filters.status !== "all") {
    whereClauses.push(eq(vehicles.status, filters.status));
  }
  if (filters.regionId && filters.regionId !== "all") {
    whereClauses.push(eq(vehicles.regionId, filters.regionId));
  }

  return await db.query.vehicles.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    where: whereClauses.length > 0 ? and(...whereClauses) : undefined,
    with: {
      region: true,
    },
  });
}

export async function getVehicleById(id) {
  return await db.query.vehicles.findFirst({
    where: eq(vehicles.id, id),
    with: {
      region: true,
    },
  });
}

export async function createVehicle(data) {
  // Check unique regNo
  const [existing] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.regNo, data.regNo));

  if (existing) {
    throw new Error("Vehicle registration number must be unique");
  }

  const [newVehicle] = await db
    .insert(vehicles)
    .values({
      acquisitionCost: data.acquisitionCost,
      capacityKg: data.capacityKg,
      name: data.name,
      odometerKm: data.odometerKm || 0,
      regionId: data.regionId || null,
      regNo: data.regNo,
      status: data.status || "available",
      type: data.type,
    })
    .returning();

  return newVehicle;
}

export async function updateVehicle(id, data) {
  // Check unique regNo if it's changing
  if (data.regNo) {
    const [existing] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.regNo, data.regNo), eq(vehicles.id, id)));

    if (!existing) {
      const [another] = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.regNo, data.regNo));
      if (another) {
        throw new Error("Vehicle registration number must be unique");
      }
    }
  }

  const [updatedVehicle] = await db
    .update(vehicles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, id))
    .returning();

  return updatedVehicle;
}

export async function deleteVehicle(id) {
  // Check if vehicle has any trips or maintenance logs that shouldn't be cascade deleted
  // In our schema: onDelete: 'restrict' for trips, 'cascade' for maintenance logs.
  // Drizzle/postgres will throw error if a trip references this vehicle.
  const [deletedVehicle] = await db
    .delete(vehicles)
    .where(eq(vehicles.id, id))
    .returning();

  return deletedVehicle;
}

export async function getRegions() {
  return await db.select().from(regions);
}
