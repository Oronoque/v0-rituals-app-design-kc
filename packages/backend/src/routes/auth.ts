import { Router } from "express";
import {
  getProfile,
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/auth";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ===========================================
// PUBLIC ROUTES
// ===========================================

// Authentication
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// ===========================================
// PROTECTED ROUTES (Authenticated Users)
// ===========================================

// User profile management
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);

// ===========================================
// ADMIN ROUTES
// ===========================================

export default router;
