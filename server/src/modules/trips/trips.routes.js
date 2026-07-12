import express from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import * as tripsService from "./trips.service.js";

const router = express.Router();

router.use(requireAuth);

// List all trips
router.get("/", requirePermission("trips", "view"), async (req, res) => {
  try {
    const data = await tripsService.getAllTrips();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create trip
router.post("/", requirePermission("trips", "full"), async (req, res) => {
  try {
    const data = await tripsService.createTrip(req.body, req.currentUser.id);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Dispatch trip
router.post(
  "/:id/dispatch",
  requirePermission("trips", "full"),
  async (req, res) => {
    try {
      const data = await tripsService.dispatchTrip(req.params.id);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Complete trip
router.post(
  "/:id/complete",
  requirePermission("trips", "full"),
  async (req, res) => {
    try {
      const data = await tripsService.completeTrip(
        req.params.id,
        req.body,
        req.currentUser.id
      );
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Cancel trip
router.post(
  "/:id/cancel",
  requirePermission("trips", "full"),
  async (req, res) => {
    try {
      const data = await tripsService.cancelTrip(req.params.id, req.body);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
