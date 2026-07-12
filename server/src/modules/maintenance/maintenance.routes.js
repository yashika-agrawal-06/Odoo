import express from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import * as maintenanceService from "./maintenance.service.js";

const router = express.Router();

router.use(requireAuth);

// Get all logs
router.get("/", requirePermission("fleet", "view"), async (req, res) => {
  try {
    const data = await maintenanceService.getAllLogs();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create log
router.post("/", requirePermission("fleet", "full"), async (req, res) => {
  try {
    const data = await maintenanceService.createLog(
      req.body,
      req.currentUser.id
    );
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Close/complete maintenance
router.post(
  "/:id/close",
  requirePermission("fleet", "full"),
  async (req, res) => {
    try {
      const data = await maintenanceService.closeLog(req.params.id);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Delete log
router.delete("/:id", requirePermission("fleet", "full"), async (req, res) => {
  try {
    await maintenanceService.deleteLog(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
