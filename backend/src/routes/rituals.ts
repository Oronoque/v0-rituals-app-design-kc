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

export default router;
