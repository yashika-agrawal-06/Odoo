import { eq } from "drizzle-orm";
import { db } from "./index.js";
import {
  drivers,
  regions,
  rolePermissions,
  roles,
  vehicles,
} from "./schema/index.js";

const ROLES_DATA = [
  {
    canManageSettings: true,
    name: "Fleet Manager",
    perms: {
      analytics: "full",
      drivers: "full",
      fleet: "full",
      fuel_expenses: "none",
      trips: "none",
    },
    slug: "fleet_manager",
  },
  {
    canManageSettings: false,
    name: "Dispatcher",
    perms: {
      analytics: "none",
      drivers: "none",
      fleet: "view",
      fuel_expenses: "none",
      trips: "full",
    },
    slug: "dispatcher",
  },
  {
    canManageSettings: false,
    name: "Safety Officer",
    perms: {
      analytics: "none",
      drivers: "full",
      fleet: "none",
      fuel_expenses: "none",
      trips: "view",
    },
    slug: "safety_officer",
  },
  {
    canManageSettings: false,
    name: "Financial Analyst",
    perms: {
      analytics: "full",
      drivers: "none",
      fleet: "view",
      fuel_expenses: "full",
      trips: "none",
    },
    slug: "financial_analyst",
  },
];

async function seed() {
  console.log("Starting database seeding...");

  try {
    // 1. Seed Roles and Permissions
    for (const roleData of ROLES_DATA) {
      // Check if role exists
      let [existingRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.slug, roleData.slug));

      if (!existingRole) {
        console.log(`Creating role: ${roleData.name}`);
        [existingRole] = await db
          .insert(roles)
          .values({
            canManageSettings: roleData.canManageSettings,
            name: roleData.name,
            slug: roleData.slug,
          })
          .returning();
      }

      // Seed permissions for this role
      for (const [resource, accessLevel] of Object.entries(roleData.perms)) {
        // Check if permission already exists
        const [existingPerm] = await db
          .select()
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, existingRole.id))
          .where(eq(rolePermissions.resource, resource));

        if (existingPerm) {
          // Sync access level if it differs
          if (existingPerm.accessLevel !== accessLevel) {
            await db
              .update(rolePermissions)
              .set({ accessLevel })
              .where(eq(rolePermissions.id, existingPerm.id));
          }
        } else {
          await db.insert(rolePermissions).values({
            accessLevel,
            resource,
            roleId: existingRole.id,
          });
        }
      }
    }
    console.log("Roles and permissions seeded successfully.");

    // 2. Seed Default Regions
    const regionNames = [
      "Gandhinagar Depot",
      "Ahmedabad Hub",
      "Vatva Industrial Area",
    ];
    const regionIds = {};

    for (const name of regionNames) {
      let [existingRegion] = await db
        .select()
        .from(regions)
        .where(eq(regions.name, name));
      if (!existingRegion) {
        console.log(`Creating region: ${name}`);
        [existingRegion] = await db
          .insert(regions)
          .values({ name })
          .returning();
      }
      regionIds[name] = existingRegion.id;
    }
    console.log("Regions seeded successfully.");

    // 3. Seed Sample Vehicles
    const vehiclesData = [
      {
        acquisitionCost: "620000.00",
        capacityKg: "500.00",
        name: "VAN-05",
        odometerKm: 74_000,
        regionName: "Gandhinagar Depot",
        regNo: "GJ01AB452",
        status: "available",
        type: "van",
      },
      {
        acquisitionCost: "2450000.00",
        capacityKg: "5000.00",
        name: "TRK-12",
        odometerKm: 182_000,
        regionName: "Ahmedabad Hub",
        regNo: "GJ01AB998",
        status: "available",
        type: "truck",
      },
      {
        acquisitionCost: "410000.00",
        capacityKg: "1000.00",
        name: "MINI-03",
        odometerKm: 66_000,
        regionName: "Vatva Industrial Area",
        regNo: "GJ01AB1120",
        status: "available",
        type: "mini",
      },
      {
        acquisitionCost: "590000.00",
        capacityKg: "750.00",
        name: "VAN-09",
        odometerKm: 241_900,
        regionName: "Gandhinagar Depot",
        regNo: "GJ01AB008",
        status: "retired",
        type: "van",
      },
    ];

    for (const v of vehiclesData) {
      const [existingVehicle] = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.regNo, v.regNo));
      if (!existingVehicle) {
        console.log(`Creating vehicle: ${v.name}`);
        await db.insert(vehicles).values({
          acquisitionCost: v.acquisitionCost,
          capacityKg: v.capacityKg,
          name: v.name,
          odometerKm: v.odometerKm,
          regionId: regionIds[v.regionName],
          regNo: v.regNo,
          status: v.status,
          type: v.type,
        });
      }
    }
    console.log("Vehicles seeded successfully.");

    // 4. Seed Sample Drivers
    const driversData = [
      {
        contactNumber: "98765xxxxx",
        licenseCategory: "lmv",
        licenseExpiry: new Date("2028-12-31"),
        licenseNumber: "DL-88213",
        name: "Alex",
        regionName: "Gandhinagar Depot",
        safetyScore: 96,
        status: "available",
      },
      {
        contactNumber: "98220xxxxx",
        licenseCategory: "hmv",
        licenseExpiry: new Date("2025-03-15"),
        licenseNumber: "DL-44120",
        name: "John",
        regionName: "Ahmedabad Hub",
        safetyScore: 81,
        status: "suspended",
      },
      {
        contactNumber: "99110xxxxx",
        licenseCategory: "lmv",
        licenseExpiry: new Date("2029-08-15"),
        licenseNumber: "DL-77031",
        name: "Priya",
        regionName: "Vatva Industrial Area",
        safetyScore: 99,
        status: "available",
      },
      {
        contactNumber: "97440xxxxx",
        licenseCategory: "hmv",
        licenseExpiry: new Date("2027-01-20"),
        licenseNumber: "DL-90045",
        name: "Suresh",
        regionName: "Gandhinagar Depot",
        safetyScore: 88,
        status: "available",
      },
    ];

    for (const d of driversData) {
      const [existingDriver] = await db
        .select()
        .from(drivers)
        .where(eq(drivers.licenseNumber, d.licenseNumber));
      if (!existingDriver) {
        console.log(`Creating driver: ${d.name}`);
        await db.insert(drivers).values({
          contactNumber: d.contactNumber,
          licenseCategory: d.licenseCategory,
          licenseExpiry: d.licenseExpiry,
          licenseNumber: d.licenseNumber,
          name: d.name,
          regionId: regionIds[d.regionName],
          safetyScore: d.safetyScore,
          status: d.status,
        });
      }
    }
    console.log("Drivers seeded successfully.");
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}

// Check if run directly from node
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seed };
