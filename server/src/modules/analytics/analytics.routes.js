import express from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import * as analyticsService from "./analytics.service.js";

const router = express.Router();

router.use(requireAuth);

// Get dashboard summary KPIs
router.get(
  "/dashboard",
  requirePermission("analytics", "view"),
  async (req, res) => {
    try {
      const { type, regionId } = req.query;
      const data = await analyticsService.getDashboardKPIs({ regionId, type });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get reports metrics (ROI, monthly charts, etc.)
router.get(
  "/reports",
  requirePermission("analytics", "view"),
  async (req, res) => {
    try {
      const data = await analyticsService.getReportsAnalytics();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
