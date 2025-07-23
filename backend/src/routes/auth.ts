import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  register,
  login,
  verifyToken,
  getProfile,
  updateProfile,
  deleteAccount,
  getAllUsers,
} from "../controllers/auth";

const router = Router();

// ===========================================
// PUBLIC ROUTES
// ===========================================

// Authentication
router.post("/register", register);
router.post("/login", login);
router.post("/verify-token", verifyToken);

// ===========================================
// PROTECTED ROUTES (Authenticated Users)
// ===========================================

// User profile management
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.delete("/account", requireAuth, deleteAccount);

// ===========================================
// ADMIN ROUTES
// ===========================================

// User management (admin only)
router.get("/admin/users", requireAuth, requireAdmin, getAllUsers);

export default router;
