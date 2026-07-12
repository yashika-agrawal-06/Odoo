import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { drivers } from "../../db/schema/index.js";

export async function getAllDrivers(filters = {}) {
  const whereClauses = [];

  if (filters.status && filters.status !== "all") {
    whereClauses.push(eq(drivers.status, filters.status));
  }
  if (filters.licenseCategory && filters.licenseCategory !== "all") {
    whereClauses.push(eq(drivers.licenseCategory, filters.licenseCategory));
  }
  if (filters.regionId && filters.regionId !== "all") {
    whereClauses.push(eq(drivers.regionId, filters.regionId));
  }

  return await db.query.drivers.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    where: whereClauses.length > 0 ? and(...whereClauses) : undefined,
    with: {
      region: true,
    },
  });
}

export async function getDriverById(id) {
  return await db.query.drivers.findFirst({
    where: eq(drivers.id, id),
    with: {
      region: true,
    },
  });
}

export async function createDriver(data) {
  // Check unique licenseNumber
  const [existing] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.licenseNumber, data.licenseNumber));

  if (existing) {
    throw new Error("Driver license number must be unique");
  }

  const [newDriver] = await db
    .insert(drivers)
    .values({
      contactNumber: data.contactNumber,
      licenseCategory: data.licenseCategory,
      licenseExpiry: new Date(data.licenseExpiry),
      licenseNumber: data.licenseNumber,
      name: data.name,
      regionId: data.regionId || null,
      safetyScore:
        data.safetyScore === undefined
          ? 100
          : Number.parseInt(data.safetyScore, 10),
      status: data.status || "available",
    })
    .returning();

  return newDriver;
}

export async function updateDriver(id, data) {
  // Check unique licenseNumber if changing
  if (data.licenseNumber) {
    const [existing] = await db
      .select()
      .from(drivers)
      .where(
        and(eq(drivers.licenseNumber, data.licenseNumber), eq(drivers.id, id))
      );

    if (!existing) {
      const [another] = await db
        .select()
        .from(drivers)
        .where(eq(drivers.licenseNumber, data.licenseNumber));
      if (another) {
        throw new Error("Driver license number must be unique");
      }
    }
  }

  const updateFields = { ...data };
  if (data.licenseExpiry) {
    updateFields.licenseExpiry = new Date(data.licenseExpiry);
  }
  if (data.safetyScore !== undefined) {
    updateFields.safetyScore = Number.parseInt(data.safetyScore, 10);
  }

  const [updatedDriver] = await db
    .update(drivers)
    .set({
      ...updateFields,
      updatedAt: new Date(),
    })
    .where(eq(drivers.id, id))
    .returning();

  return updatedDriver;
}

export async function deleteDriver(id) {
  const [deletedDriver] = await db
    .delete(drivers)
    .where(eq(drivers.id, id))
    .returning();

  return deletedDriver;
}
