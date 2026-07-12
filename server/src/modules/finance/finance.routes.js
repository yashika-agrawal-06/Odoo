import express from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import * as financeService from "./finance.service.js";

const router = express.Router();

router.use(requireAuth);

// Fuel routes
router.get(
  "/fuel",
  requirePermission("fuel_expenses", "view"),
  async (req, res) => {
    try {
      const data = await financeService.getFuelLogs();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  "/fuel",
  requirePermission("fuel_expenses", "full"),
  async (req, res) => {
    try {
      const data = await financeService.createFuelLog(
        req.body,
        req.currentUser.id
      );
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete(
  "/fuel/:id",
  requirePermission("fuel_expenses", "full"),
  async (req, res) => {
    try {
      await financeService.deleteFuelLog(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Expense routes
router.get(
  "/expenses",
  requirePermission("fuel_expenses", "view"),
  async (req, res) => {
    try {
      const data = await financeService.getExpenses();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  "/expenses",
  requirePermission("fuel_expenses", "full"),
  async (req, res) => {
    try {
      const data = await financeService.createExpense(
        req.body,
        req.currentUser.id
      );
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete(
  "/expenses/:id",
  requirePermission("fuel_expenses", "full"),
  async (req, res) => {
    try {
      await financeService.deleteExpense(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
