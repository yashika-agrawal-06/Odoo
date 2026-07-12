import express from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as settingsService from "./settings.service.js";

const router = express.Router();

// Get list of roles (public, for signup dropdown)
router.get("/roles", async (req, res) => {
  try {
    const data = await settingsService.getAllRoles();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protect rbac endpoints
router.get("/rbac", requireAuth, async (req, res) => {
  if (!req.currentUser?.canManageSettings) {
    return res.status(403).json({
      error: "Forbidden: You do not have settings management permission",
    });
  }

  try {
    const data = await settingsService.getRBACMatrix();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/rbac", requireAuth, async (req, res) => {
  if (!req.currentUser?.canManageSettings) {
    return res.status(403).json({
      error: "Forbidden: You do not have settings management permission",
    });
  }

  try {
    await settingsService.updateRBACMatrix(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
