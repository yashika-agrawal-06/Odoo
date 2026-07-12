import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { auth } from "./auth.js";
import { getPermissionMatrix } from "./lib/permissionCache.js";
import { requireAuth } from "./middleware/requireAuth.js";
import analyticsRouter from "./modules/analytics/analytics.routes.js";
import driversRouter from "./modules/drivers/drivers.routes.js";
import financeRouter from "./modules/finance/finance.routes.js";
import maintenanceRouter from "./modules/maintenance/maintenance.routes.js";
import settingsRouter from "./modules/settings/settings.routes.js";
import tripsRouter from "./modules/trips/trips.routes.js";
// Import module routes
import vehiclesRouter from "./modules/vehicles/vehicles.routes.js";

const app = express();
const port = 8000;

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

// Mount Better Auth BEFORE express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// Main session profile info with roles and permissions matrix
app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const matrix = await getPermissionMatrix();
    const permissions = req.currentUser.roleId
      ? matrix[req.currentUser.roleId] || {}
      : {};

    res.json({
      canManageSettings: req.currentUser.canManageSettings,
      permissions,
      roleSlug: req.currentUser.roleSlug,
      user: req.session.user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register module endpoints
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/drivers", driversRouter);
app.use("/api/trips", tripsRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/finance", financeRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/settings", settingsRouter);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
