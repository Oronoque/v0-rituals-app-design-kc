import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createRitual,
  getUserRituals,
  getPublicRituals,
  getRitualById,
  updateRitual,
  deleteRitual,
  forkRitual,
  publishRitual,
  unpublishRitual,
  getRitualStats,
  completeRitual,
  updateRitualCompletion,
  createQuickStepResponse,
  updateQuickStepResponse,
  batchCompleteRituals,
  getDailySchedule,
} from "../controllers/rituals";

const router = Router();

// Public routes
router.get("/public", getPublicRituals);
router.get("/:id", getRitualById);

// Protected routes
router.post("/", requireAuth, createRitual);
router.get("/", requireAuth, getUserRituals);
router.put("/:id", requireAuth, updateRitual);
router.delete("/:id", requireAuth, deleteRitual);
router.post("/:id/fork", requireAuth, forkRitual);
router.post("/:id/publish", requireAuth, publishRitual);
router.post("/:id/unpublish", requireAuth, unpublishRitual);
router.get("/:id/stats", requireAuth, getRitualStats);
router.post("/:id/complete", requireAuth, completeRitual);
router.put("/:id/complete", requireAuth, updateRitualCompletion);

// Quick step operations
router.post("/:id/quick-step", requireAuth, createQuickStepResponse);
router.put("/:id/quick-update", requireAuth, updateQuickStepResponse);

// Batch operations
router.post("/batch-complete", requireAuth, batchCompleteRituals);

export default router;
