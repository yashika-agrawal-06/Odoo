import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  drivers,
  expenses,
  fuelLogs,
  maintenanceLogs,
  trips,
  vehicles,
} from "../../db/schema/index.js";

export async function getDashboardKPIs(filters = {}) {
  // Build vehicle where clause based on filters
  const vehicleConditions = [];
  if (filters.type && filters.type !== "all") {
    vehicleConditions.push(eq(vehicles.type, filters.type));
  }
  if (filters.regionId && filters.regionId !== "all") {
    vehicleConditions.push(eq(vehicles.regionId, filters.regionId));
  }

  // Note: if user filters by status, we can filter the counts. But usually dashboard KPIs
  // show all statuses separately, so we only apply type and region filters here.
  const vehicleWhere =
    vehicleConditions.length > 0 ? and(...vehicleConditions) : undefined;

  // Query vehicles matching type/region
  const allVehicles = await db.select().from(vehicles).where(vehicleWhere);

  const totalCount = allVehicles.length;
  const activeVehicles = allVehicles.filter(
    (v) => v.status === "on_trip"
  ).length;
  const availableVehicles = allVehicles.filter(
    (v) => v.status === "available"
  ).length;
  const inMaintenanceVehicles = allVehicles.filter(
    (v) => v.status === "in_shop"
  ).length;
  const retiredVehicles = allVehicles.filter(
    (v) => v.status === "retired"
  ).length;

  const fleetActiveDenominator =
    activeVehicles + availableVehicles + inMaintenanceVehicles;
  const fleetUtilization =
    fleetActiveDenominator > 0
      ? Math.round((activeVehicles / fleetActiveDenominator) * 100)
      : 0;

  // Build driver where clause (filter by region if specified)
  const driverConditions = [];
  if (filters.regionId && filters.regionId !== "all") {
    driverConditions.push(eq(drivers.regionId, filters.regionId));
  }
  const driverWhere =
    driverConditions.length > 0 ? and(...driverConditions) : undefined;

  const allDrivers = await db.select().from(drivers).where(driverWhere);
  const driversOnDuty = allDrivers.filter((d) => d.status === "on_trip").length;

  // Query trips (filtered by matching vehicle IDs)
  const vehicleIds = allVehicles.map((v) => v.id);

  let tripList = [];
  if (vehicleIds.length > 0) {
    tripList = await db.query.trips.findMany({
      orderBy: [desc(trips.createdAt)],
      where: sql`${trips.vehicleId} IN ${vehicleIds}`,
      with: {
        driver: true,
        vehicle: true,
      },
    });
  }

  const activeTripsCount = tripList.filter(
    (t) => t.status === "dispatched"
  ).length;
  const pendingTripsCount = tripList.filter((t) => t.status === "draft").length;

  // Return recent trips (first 10)
  const recentTrips = tripList.slice(0, 10);

  return {
    kpis: {
      activeTrips: activeTripsCount,
      activeVehicles,
      availableVehicles,
      driversOnDuty,
      fleetUtilization,
      pendingTrips: pendingTripsCount,
      vehiclesInMaintenance: inMaintenanceVehicles,
    },
    recentTrips,
    vehicleStatusBreakdown: {
      available: availableVehicles,
      inShop: inMaintenanceVehicles,
      onTrip: activeVehicles,
      retired: retiredVehicles,
    },
  };
}

export async function getReportsAnalytics() {
  const allVehicles = await db.select().from(vehicles);

  const vehicleMetrics = [];
  let fleetTotalRevenue = 0;
  let fleetTotalFuelCost = 0;
  let fleetTotalFuelLiters = 0;
  let fleetTotalMaintCost = 0;
  let fleetTotalDistance = 0;
  let fleetTotalTolls = 0;
  let fleetTotalOtherExpenses = 0;

  for (const v of allVehicles) {
    // Completed Trips
    const completedTrips = await db
      .select({
        distance: trips.plannedDistanceKm,
        revenue: trips.revenueAmount,
      })
      .from(trips)
      .where(and(eq(trips.vehicleId, v.id), eq(trips.status, "completed")));

    const totalRevenue = completedTrips.reduce(
      (sum, t) => sum + Number.parseFloat(t.revenue || 0),
      0
    );
    const totalDistance = completedTrips.reduce(
      (sum, t) => sum + Number.parseFloat(t.distance || 0),
      0
    );

    // Fuel Logs
    const vFuelLogs = await db
      .select({
        cost: fuelLogs.cost,
        liters: fuelLogs.liters,
      })
      .from(fuelLogs)
      .where(eq(fuelLogs.vehicleId, v.id));

    const totalFuelCost = vFuelLogs.reduce(
      (sum, f) => sum + Number.parseFloat(f.cost || 0),
      0
    );
    const totalFuelLiters = vFuelLogs.reduce(
      (sum, f) => sum + Number.parseFloat(f.liters || 0),
      0
    );

    // Maintenance Logs
    const vMaintLogs = await db
      .select({
        cost: maintenanceLogs.cost,
      })
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.vehicleId, v.id));

    const totalMaintCost = vMaintLogs.reduce(
      (sum, m) => sum + Number.parseFloat(m.cost || 0),
      0
    );

    // Expenses
    const vExpenses = await db
      .select({
        other: expenses.otherAmount,
        toll: expenses.tollAmount,
      })
      .from(expenses)
      .where(eq(expenses.vehicleId, v.id));

    const totalTolls = vExpenses.reduce(
      (sum, e) => sum + Number.parseFloat(e.toll || 0),
      0
    );
    const totalOther = vExpenses.reduce(
      (sum, e) => sum + Number.parseFloat(e.other || 0),
      0
    );

    const operationalCost =
      totalFuelCost + totalMaintCost + totalTolls + totalOther;

    // ROI = (Revenue - OperationalCost) / AcquisitionCost
    const acqCost = Number.parseFloat(v.acquisitionCost || 1);
    const roi = acqCost > 0 ? (totalRevenue - operationalCost) / acqCost : 0;

    // Fuel efficiency = distance / liters
    const fuelEfficiency =
      totalFuelLiters > 0 ? totalDistance / totalFuelLiters : 0;

    vehicleMetrics.push({
      acquisitionCost: acqCost,
      fuelEfficiency,
      id: v.id,
      name: v.name,
      operationalCost,
      regNo: v.regNo,
      roi,
      status: v.status,
      totalDistance,
      totalFuelCost,
      totalFuelLiters,
      totalMaintCost,
      totalOther,
      totalRevenue,
      totalTolls,
      type: v.type,
    });

    // Fleet sums
    fleetTotalRevenue += totalRevenue;
    fleetTotalFuelCost += totalFuelCost;
    fleetTotalFuelLiters += totalFuelLiters;
    fleetTotalMaintCost += totalMaintCost;
    fleetTotalDistance += totalDistance;
    fleetTotalTolls += totalTolls;
    fleetTotalOtherExpenses += totalOther;
  }

  // Aggregate monthly stats for the last 6 months to feed charts
  const monthlyData = await getMonthlyChartData();

  return {
    fleetOverview: {
      fuelEfficiency:
        fleetTotalFuelLiters > 0
          ? fleetTotalDistance / fleetTotalFuelLiters
          : 0,
      operationalCost:
        fleetTotalFuelCost +
        fleetTotalMaintCost +
        fleetTotalTolls +
        fleetTotalOtherExpenses,
      totalDistance: fleetTotalDistance,
      totalFuelCost: fleetTotalFuelCost,
      totalFuelLiters: fleetTotalFuelLiters,
      totalMaintenanceCost: fleetTotalMaintCost,
      totalOtherExpenses: fleetTotalOtherExpenses,
      totalRevenue: fleetTotalRevenue,
      totalTolls: fleetTotalTolls,
    },
    monthlyData,
    vehicleMetrics,
  };
}

async function getMonthlyChartData() {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const chartMap = {};

  // Setup last 6 months
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
    chartMap[key] = {
      fuelCost: 0,
      maintenanceCost: 0,
      name: key,
      operationalCost: 0,
      revenue: 0,
    };
  }

  // Fetch all completed trips, fuel, maintenance
  const completedTrips = await db
    .select({
      date: trips.completedAt,
      revenue: trips.revenueAmount,
    })
    .from(trips)
    .where(eq(trips.status, "completed"));

  const fLogs = await db
    .select({
      cost: fuelLogs.cost,
      date: fuelLogs.date,
    })
    .from(fuelLogs);

  const mLogs = await db
    .select({
      cost: maintenanceLogs.cost,
      date: maintenanceLogs.serviceDate,
    })
    .from(maintenanceLogs);

  const exps = await db
    .select({
      date: expenses.createdAt,
      other: expenses.otherAmount,
      toll: expenses.tollAmount,
    })
    .from(expenses);

  // Group Trips Revenue
  for (const t of completedTrips) {
    if (!t.date) {
      continue;
    }
    const date = new Date(t.date);
    const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
    if (chartMap[key]) {
      chartMap[key].revenue += Number.parseFloat(t.revenue || 0);
    }
  }

  // Group Fuel Costs
  for (const f of fLogs) {
    if (!f.date) {
      continue;
    }
    const date = new Date(f.date);
    const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
    if (chartMap[key]) {
      chartMap[key].fuelCost += Number.parseFloat(f.cost || 0);
      chartMap[key].operationalCost += Number.parseFloat(f.cost || 0);
    }
  }

  // Group Maintenance Costs
  for (const m of mLogs) {
    if (!m.date) {
      continue;
    }
    const date = new Date(m.date);
    const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
    if (chartMap[key]) {
      chartMap[key].maintenanceCost += Number.parseFloat(m.cost || 0);
      chartMap[key].operationalCost += Number.parseFloat(m.cost || 0);
    }
  }

  // Group Tolls / Misc Expenses
  for (const e of exps) {
    if (!e.date) {
      continue;
    }
    const date = new Date(e.date);
    const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
    if (chartMap[key]) {
      const toll = Number.parseFloat(e.toll || 0);
      const other = Number.parseFloat(e.other || 0);
      chartMap[key].operationalCost += toll + other;
    }
  }

  // Round values
  return Object.values(chartMap).map((item) => ({
    ...item,
    fuelCost: Math.round(item.fuelCost),
    maintenanceCost: Math.round(item.maintenanceCost),
    operationalCost: Math.round(item.operationalCost),
    revenue: Math.round(item.revenue),
  }));
}
