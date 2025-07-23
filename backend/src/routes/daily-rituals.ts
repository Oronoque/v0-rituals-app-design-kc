import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDailySchedule } from "../controllers/rituals";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Daily schedule routes
router.get("/schedule", getDailySchedule);

export default router;
