import {
  ApiSuccess,
  BadRequestError,
  Exercise,
  ExerciseBodyPart,
  ExerciseEquipment,
  ExerciseMeasurementType,
  PhysicalQuantity,
} from "@rituals/shared";
import { Request } from "express";
import { db } from "../database/connection";
import { asyncHandler } from "../middleware/error-handler";

/**
 * GET /exercises
 * Get all exercises with optional filtering
 */
export const getExercises = asyncHandler(async function getExercisesHandler(
  req: Request
): Promise<ApiSuccess<{ exercises: Exercise[]; total: number }>> {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const body_part = req.query.body_part as ExerciseBodyPart | undefined;
  const equipment = req.query.equipment as ExerciseEquipment | undefined;
  const measurement_type = req.query.measurement_type as
    | ExerciseMeasurementType
    | undefined;
  const search = req.query.search as string | undefined;

  // Validate limit and offset
  if (limit < 1 || limit > 100) {
    throw new BadRequestError("Limit must be between 1 and 100");
  }

  if (offset < 0) {
    throw new BadRequestError("Offset must be non-negative");
  }

  let query = db.selectFrom("exercises").selectAll();

  // Apply filters
  if (body_part) {
    query = query.where("body_part", "=", body_part);
  }

  if (equipment) {
    // Using SQL to check if equipment array contains the specified equipment
    query = query.where((eb) => eb("equipment", "@>", [equipment]));
  }

  if (measurement_type) {
    query = query.where("measurement_type", "=", measurement_type);
  }

  if (search) {
    query = query.where("name", "ilike", `%${search}%`);
  }

  // Get total count for pagination
  const totalQuery = query
    .clearSelect()
    .select((eb) => eb.fn.countAll().as("count"));
  const totalResult = await totalQuery.executeTakeFirstOrThrow();
  const total = Number(totalResult.count);

  // Get paginated data
  const exercises = await query
    .limit(limit)
    .offset(offset)
    .orderBy("name", "asc")
    .execute();

  return {
    data: {
      exercises,
      total,
    },
    message: "Exercises fetched successfully",
    status: "success",
  };
});

/**
 * GET /exercises/:id
 * Get exercise by ID
 */
export const getExerciseById = asyncHandler(
  async function getExerciseByIdHandler(
    req: Request
  ): Promise<ApiSuccess<Exercise>> {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Exercise ID is required");
    }

    const exercise = await db
      .selectFrom("exercises")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!exercise) {
      throw new BadRequestError("Exercise not found");
    }

    return {
      data: exercise,
      message: "Exercise fetched successfully",
      status: "success",
    };
  }
);

/**
 * GET /physical-quantities
 * Get all physical quantities
 */
export const getPhysicalQuantities = asyncHandler(
  async function getPhysicalQuantitiesHandler(
    req: Request
  ): Promise<
    ApiSuccess<{ physical_quantities: PhysicalQuantity[]; total: number }>
  > {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const search = req.query.search as string | undefined;

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      throw new BadRequestError("Limit must be between 1 and 100");
    }

    if (offset < 0) {
      throw new BadRequestError("Offset must be non-negative");
    }

    let query = db.selectFrom("physical_quantities").selectAll();

    // Apply search filter
    if (search) {
      query = query.where("name", "ilike", `%${search}%`);
    }

    // Get total count for pagination
    const totalQuery = query
      .clearSelect()
      .select((eb) => eb.fn.countAll().as("count"));
    const totalResult = await totalQuery.executeTakeFirstOrThrow();
    const total = Number(totalResult.count);

    // Get paginated data
    const physical_quantities = await query
      .limit(limit)
      .offset(offset)
      .orderBy("name", "asc")
      .execute();

    return {
      data: {
        physical_quantities,
        total,
      },
      message: "Physical quantities fetched successfully",
      status: "success",
    };
  }
);

/**
 * GET /physical-quantities/:id
 * Get physical quantity by ID
 */
export const getPhysicalQuantityById = asyncHandler(
  async function getPhysicalQuantityByIdHandler(
    req: Request
  ): Promise<ApiSuccess<PhysicalQuantity>> {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Physical quantity ID is required");
    }

    const physicalQuantity = await db
      .selectFrom("physical_quantities")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!physicalQuantity) {
      throw new BadRequestError("Physical quantity not found");
    }

    return {
      data: physicalQuantity,
      message: "Physical quantity fetched successfully",
      status: "success",
    };
  }
);
