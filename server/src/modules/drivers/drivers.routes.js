import express from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import * as driversService from "./drivers.service.js";

const router = express.Router();

router.use(requireAuth);

// List drivers
router.get("/", requirePermission("drivers", "view"), async (req, res) => {
  try {
    const { status, licenseCategory, regionId } = req.query;
    const data = await driversService.getAllDrivers({
      licenseCategory,
      regionId,
      status,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create driver
router.post("/", requirePermission("drivers", "full"), async (req, res) => {
  try {
    const data = await driversService.createDriver(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update driver
router.put("/:id", requirePermission("drivers", "full"), async (req, res) => {
  try {
    const data = await driversService.updateDriver(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete driver
router.delete(
  "/:id",
  requirePermission("drivers", "full"),
  async (req, res) => {
    try {
      await driversService.deleteDriver(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({
        error:
          "Cannot delete driver: It has active trips or history registered.",
      });
    }
  }
);

export default router;
