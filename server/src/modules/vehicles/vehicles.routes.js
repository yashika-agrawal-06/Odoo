import express from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import * as vehiclesService from "./vehicles.service.js";

const router = express.Router();

router.use(requireAuth);

// Get regions list (for dialog selects)
router.get("/regions", requirePermission("fleet", "view"), async (req, res) => {
  try {
    const data = await vehiclesService.getRegions();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List vehicles
router.get("/", requirePermission("fleet", "view"), async (req, res) => {
  try {
    const { type, status, regionId } = req.query;
    const data = await vehiclesService.getAllVehicles({
      regionId,
      status,
      type,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create vehicle
router.post("/", requirePermission("fleet", "full"), async (req, res) => {
  try {
    const data = await vehiclesService.createVehicle(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update vehicle
router.put("/:id", requirePermission("fleet", "full"), async (req, res) => {
  try {
    const data = await vehiclesService.updateVehicle(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete vehicle
router.delete("/:id", requirePermission("fleet", "full"), async (req, res) => {
  try {
    await vehiclesService.deleteVehicle(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({
      error:
        "Cannot delete vehicle: It has active trips or history registered.",
    });
  }
});

export default router;
