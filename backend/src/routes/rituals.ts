import { Router } from "express";
import {
  completeRitual,
  createRitual,
  deleteRitual,
  forkRitual,
  getDailySchedule,
  getPublicRituals,
  getRitualById,
  getUserRituals,
  publishRitual,
  unpublishRitual,
} from "../controllers/rituals";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Protected routes
router.post("/", requireAuth, createRitual);
router.delete("/:id", requireAuth, deleteRitual);
router.post("/:id/fork", requireAuth, forkRitual);
router.post("/:id/publish", requireAuth, publishRitual);
router.post("/:id/unpublish", requireAuth, unpublishRitual);
router.post("/:id/complete", requireAuth, completeRitual);
router.get("/user", requireAuth, getUserRituals);
router.get("/daily-schedule", requireAuth, getDailySchedule);

// Public routes
router.get("/public", getPublicRituals);
router.get("/:id", getRitualById);

export default router;
