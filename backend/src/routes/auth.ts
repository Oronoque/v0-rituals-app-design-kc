import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  register,
  login,
  getCurrentUser,
  getUserStats,
} from "../controllers/auth";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", requireAuth, getCurrentUser);
router.get("/stats", requireAuth, getUserStats);

export default router;
