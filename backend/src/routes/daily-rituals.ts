import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createDailyRitual,
  getDailyRitualsByDate,
  updateDailyRitual,
  deleteDailyRitual,
} from "../controllers/daily-rituals";

const router = Router();

// All daily ritual routes require authentication
router.post("/", requireAuth, createDailyRitual);
router.get("/:date", requireAuth, getDailyRitualsByDate);
router.put("/:id", requireAuth, updateDailyRitual);
router.delete("/:id", requireAuth, deleteDailyRitual);

export default router;
