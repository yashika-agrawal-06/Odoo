import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  drivers,
  expenses,
  fuelLogs,
  trips,
  vehicles,
} from "../../db/schema/index.js";
import { getNextTripCode } from "../../lib/tripCode.js";

export async function getAllTrips() {
  return await db.query.trips.findMany({
    orderBy: [desc(trips.createdAt)],
    with: {
      createdByUser: true,
      driver: true,
      vehicle: true,
    },
  });
}

export async function getTripById(id) {
  return await db.query.trips.findFirst({
    where: eq(trips.id, id),
    with: {
      driver: true,
      vehicle: true,
    },
  });
}

export async function createTrip(data, userId) {
  // Validate vehicle and driver
  const vehicle = await db.query.vehicles.findFirst({
    where: eq(vehicles.id, data.vehicleId),
  });
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  const driver = await db.query.drivers.findFirst({
    where: eq(drivers.id, data.driverId),
  });
  if (!driver) {
    throw new Error("Driver not found");
  }

  // Validate Cargo Weight against capacity
  const cargoWeight = Number.parseFloat(data.cargoWeightKg);
  const capacity = Number.parseFloat(vehicle.capacityKg);
  if (cargoWeight > capacity) {
    const diff = (cargoWeight - capacity).toFixed(2);
    throw new Error(
      `Vehicle Capacity: ${capacity} kg. Cargo Weight: ${cargoWeight} kg. Capacity exceeded by ${diff} kg — dispatch blocked.`
    );
  }

  // Validate Driver License Expiry & Status
  const today = new Date();
  if (new Date(driver.licenseExpiry) < today) {
    throw new Error(
      `Driver license has expired (Expiry: ${new Date(driver.licenseExpiry).toLocaleDateString()}) — dispatch blocked.`
    );
  }
  if (driver.status === "suspended") {
    throw new Error("Driver status is Suspended — dispatch blocked.");
  }

  // Validate driver and vehicle availability
  if (vehicle.status === "retired" || vehicle.status === "in_shop") {
    throw new Error(
      `Vehicle is in status "${vehicle.status}" — dispatch blocked.`
    );
  }

  // Generate sequential code
  const code = await getNextTripCode();

  const [newTrip] = await db
    .insert(trips)
    .values({
      cargoWeightKg: data.cargoWeightKg,
      code,
      createdBy: userId,
      destination: data.destination,
      driverId: data.driverId,
      plannedDistanceKm: data.plannedDistanceKm,
      source: data.source,
      status: "draft",
      vehicleId: data.vehicleId,
    })
    .returning();

  return newTrip;
}

export async function dispatchTrip(id) {
  return await db.transaction(async (tx) => {
    const trip = await tx.query.trips.findFirst({
      where: eq(trips.id, id),
    });
    if (!trip) {
      throw new Error("Trip not found");
    }
    if (trip.status !== "draft") {
      throw new Error("Only draft trips can be dispatched");
    }

    // Fetch vehicle & driver to verify status
    const vehicle = await tx.query.vehicles.findFirst({
      where: eq(vehicles.id, trip.vehicleId),
    });
    const driver = await tx.query.drivers.findFirst({
      where: eq(drivers.id, trip.driverId),
    });

    if (vehicle.status === "on_trip") {
      throw new Error("Vehicle is already on a trip");
    }
    if (driver.status === "on_trip") {
      throw new Error("Driver is already on a trip");
    }
    if (driver.status === "suspended") {
      throw new Error("Driver is suspended");
    }
    if (new Date(driver.licenseExpiry) < new Date()) {
      throw new Error("Driver's license is expired");
    }

    // Update statuses
    await tx
      .update(vehicles)
      .set({ status: "on_trip" })
      .where(eq(vehicles.id, trip.vehicleId));
    await tx
      .update(drivers)
      .set({ status: "on_trip" })
      .where(eq(drivers.id, trip.driverId));

    const [updatedTrip] = await tx
      .update(trips)
      .set({
        dispatchedAt: new Date(),
        status: "dispatched",
        updatedAt: new Date(),
      })
      .where(eq(trips.id, id))
      .returning();

    return updatedTrip;
  });
}

export async function completeTrip(id, completionData, userId) {
  const {
    finalOdometerKm,
    revenueAmount,
    liters,
    fuelCost,
    fuelDate,
    tollAmount,
    otherAmount,
  } = completionData;

  return await db.transaction(async (tx) => {
    const trip = await tx.query.trips.findFirst({
      where: eq(trips.id, id),
    });
    if (!trip) {
      throw new Error("Trip not found");
    }
    if (trip.status !== "dispatched") {
      throw new Error("Only dispatched trips can be completed");
    }

    const vehicle = await tx.query.vehicles.findFirst({
      where: eq(vehicles.id, trip.vehicleId),
    });
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    const finalOdometer = Number.parseInt(finalOdometerKm, 10);
    if (finalOdometer < vehicle.odometerKm) {
      throw new Error(
        `Final odometer (${finalOdometer} km) cannot be less than the starting odometer (${vehicle.odometerKm} km)`
      );
    }

    // Restore vehicle & driver availability
    await tx
      .update(vehicles)
      .set({
        odometerKm: finalOdometer,
        status: "available",
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, trip.vehicleId));

    await tx
      .update(drivers)
      .set({
        status: "available",
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, trip.driverId));

    // Update trip details
    const [updatedTrip] = await tx
      .update(trips)
      .set({
        completedAt: new Date(),
        finalOdometerKm: finalOdometer,
        revenueAmount,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(trips.id, id))
      .returning();

    // Log fuel if provided
    if (liters && fuelCost) {
      await tx.insert(fuelLogs).values({
        cost: fuelCost,
        date: fuelDate ? new Date(fuelDate) : new Date(),
        liters,
        loggedBy: userId,
        tripId: trip.id,
        vehicleId: trip.vehicleId,
      });
    }

    // Log expenses if provided
    if (tollAmount || otherAmount) {
      await tx.insert(expenses).values({
        loggedBy: userId,
        otherAmount: otherAmount || "0.00",
        tollAmount: tollAmount || "0.00",
        tripId: trip.id,
        vehicleId: trip.vehicleId,
      });
    }

    return updatedTrip;
  });
}

export async function cancelTrip(id, { cancelReason }) {
  return await db.transaction(async (tx) => {
    const trip = await tx.query.trips.findFirst({
      where: eq(trips.id, id),
    });
    if (!trip) {
      throw new Error("Trip not found");
    }
    if (trip.status === "completed" || trip.status === "cancelled") {
      throw new Error(`Cannot cancel a trip that is already ${trip.status}`);
    }

    // If it was already dispatched, we release the vehicle and driver
    if (trip.status === "dispatched") {
      await tx
        .update(vehicles)
        .set({ status: "available" })
        .where(eq(vehicles.id, trip.vehicleId));
      await tx
        .update(drivers)
        .set({ status: "available" })
        .where(eq(drivers.id, trip.driverId));
    }

    const [updatedTrip] = await tx
      .update(trips)
      .set({
        cancelledAt: new Date(),
        cancelReason: cancelReason || "No reason specified",
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(trips.id, id))
      .returning();

    return updatedTrip;
  });
}
