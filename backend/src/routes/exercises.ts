import { Router } from "express";
import {
  getExerciseById,
  getExercises,
  getPhysicalQuantities,
  getPhysicalQuantityById,
} from "../controllers/exercises";

const router = Router();

// ===========================================
// PUBLIC ROUTES
// ===========================================

// Physical quantities routes
router.get("/physical-quantities", getPhysicalQuantities);
router.get("/physical-quantities/:id", getPhysicalQuantityById);

// Exercise routes
router.get("/", getExercises);
router.get("/:id", getExerciseById);

export default router;
