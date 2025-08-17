import {
  ApiSuccess,
  BadRequestError,
  completeRitualSchema,
  CompleteRitualSchemaType,
  createIdMap,
  createRitualSchema,
  CreateRitualSchemaType,
  Database,
  Exercise,
  ExerciseMeasurementType,
  ForbiddenError,
  FullRitual,
  FullRitualCompletion,
  FullStepDefinition,
  FullStepResponse,
  getDailyScheduleSchema,
  InternalError,
  NewWorkoutSetResponse,
  PhysicalQuantity,
  RitualCategory,
  RitualCompletion,
  RitualFrequency,
  StepDefinition,
  UnauthorizedError,
  UserDailySchedule,
  UUID,
  WorkoutExerciseWithExercise,
  WorkoutSet,
  WorkoutSetResponse,
} from "@rituals/shared";
import { Request } from "express";
import { Transaction } from "kysely";
import { db } from "../database/connection";
import { asyncHandler } from "../middleware/error-handler";

// ===========================================
// BASIC RITUAL CRUD
// ===========================================

/**
 * POST /rituals
 * Create a new ritual
 */
export const createRitual = asyncHandler(async function createRitualHandler(
  req: Request
): Promise<ApiSuccess<FullRitual>> {
  const data = createRitualSchema.parse(req.body);

  const ritual = await db.transaction().execute(async (trx) => {
    // 1. Create ritual
    const ritual = await trx
      .insertInto("rituals")
      .values({
        ...data.ritual,
        user_id: req.userId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // 2. Create frequency
    const frequency = await trx
      .insertInto("ritual_frequencies")
      .values({
        ...data.frequency,
        ritual_id: ritual.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const exerciseMeasurmentMap = extractExerciseMeasurmentMap(
      data.step_definitions
    );
    const physicalQuantityUnits = extractPhysicalQuantityUnits(
      data.step_definitions
    );

    // 3. Validate exercise measurement types
    const exerciseMap = await validateExerciseMeasurementTypes(
      trx,
      exerciseMeasurmentMap
    );
    // 4. Validate physical quantity units
    const physicalQuantitiesUnitsMap = await validatePhysicalQuantityUnits(
      trx,
      physicalQuantityUnits
    );

    // 5. Create step definitions
    const stepDefinitionsFromDb = await createStepDefinitions(
      trx,
      ritual.id,
      data.step_definitions
    );

    // 6. Create workout exercises and sets
    const stepDefinitionMap: Record<
      UUID,
      CreateRitualSchemaType["step_definitions"][number]
    > = {};
    for (const [index, step] of stepDefinitionsFromDb.entries()) {
      stepDefinitionMap[step.id] =
        data.step_definitions[index] ??
        (() => {
          throw new InternalError(
            "Mismatch between step definitions length from request and step definitions from db"
          );
        })();
    }
    const { workoutExercisesWithExercise, workoutSets } =
      await createWorkoutExercisesAndSets(trx, exerciseMap, stepDefinitionMap);

    // 7. Build full step definitions
    const fullStepDefinitions = buildFullStepDefinitions(
      stepDefinitionsFromDb,
      physicalQuantitiesUnitsMap,
      workoutExercisesWithExercise,
      workoutSets
    );

    // 8. Return full ritual
    const fullRitual: FullRitual = {
      ...ritual,
      frequency,
      step_definitions: fullStepDefinitions,
    };

    return fullRitual;
  });

  return {
    data: ritual,
    message: "Ritual created successfully",
    status: "success",
  };
});

/**
 * GET /rituals/:id
 * Get ritual by ID
 */
export const getRitualById = asyncHandler(async function getRitualByIdHandler(
  req: Request
) {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Ritual ID is required");
  }

  const ritual = await getFullRitual(id);

  return {
    data: ritual,
    message: "Ritual fetched successfully",
    status: "success",
  };
});

/**
 * GET /rituals/public
 * Get all public rituals
 */
export const getPublicRituals = asyncHandler(
  async function getPublicRitualsHandler(
    req: Request
  ): Promise<ApiSuccess<{ rituals: FullRitual[]; total: number }>> {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const category = req.query.category as RitualCategory | undefined;
    const search = req.query.search as string | undefined;
    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      throw new BadRequestError("Limit must be between 1 and 100");
    }

    if (offset < 0) {
      throw new BadRequestError("Offset must be non-negative");
    }
    let query = db
      .selectFrom("rituals")
      .innerJoin(
        "ritual_frequencies",
        "rituals.id",
        "ritual_frequencies.ritual_id"
      )
      .selectAll("rituals")
      .select((eb) => [
        eb.ref("ritual_frequencies.created_at").as("frequency_created_at"),
        eb.ref("ritual_frequencies.days_of_week").as("frequency_days_of_week"),
        eb
          .ref("ritual_frequencies.exclude_dates")
          .as("frequency_exclude_dates"),
        eb
          .ref("ritual_frequencies.frequency_interval")
          .as("frequency_interval"),
        eb.ref("ritual_frequencies.frequency_type").as("frequency_type"),
        eb.ref("ritual_frequencies.id").as("frequency_id"),
        eb.ref("ritual_frequencies.ritual_id").as("frequency_ritual_id"),
        eb
          .ref("ritual_frequencies.specific_dates")
          .as("frequency_specific_dates"),
      ])
      .where("rituals.is_public", "=", true);

    // Apply filters
    if (category) {
      query = query.where("rituals.category", "=", category);
    }

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb("rituals.name", "ilike", `%${search}%`),
          eb("rituals.description", "ilike", `%${search}%`),
        ])
      );
    }

    // Get paginated data
    const rituals_with_frequency = await query
      .limit(limit)
      .offset(offset)
      .orderBy("rituals.created_at", "desc")
      .execute();

    const rituals: FullRitual[] = rituals_with_frequency.map((ritual) => ({
      ...ritual,
      frequency: {
        created_at: ritual.frequency_created_at,
        days_of_week: ritual.frequency_days_of_week,
        exclude_dates: ritual.frequency_exclude_dates,
        frequency_interval: ritual.frequency_interval,
        frequency_type: ritual.frequency_type,
        id: ritual.frequency_id,
        ritual_id: ritual.frequency_ritual_id,
        specific_dates: ritual.frequency_specific_dates,
      } as RitualFrequency,
      step_definitions: [],
    }));

    if (rituals.length > 0) {
      const stepDefinitions: StepDefinition[] = await db
        .selectFrom("step_definitions")
        .selectAll()
        .where(
          "ritual_id",
          "in",
          rituals.map((ritual) => ritual.id)
        )
        .execute();

      const physicalQuantitiesUnitsMap: Record<UUID, PhysicalQuantity> = {};
      const physicalQuantityIds = stepDefinitions
        .filter((step) => step.target_unit_reference_id !== undefined)
        .map((step) => step.target_unit_reference_id as UUID);
      if (physicalQuantityIds.length > 0) {
        const physicalQuantities = await db
          .selectFrom("physical_quantities")
          .selectAll()
          .where("id", "in", physicalQuantityIds)
          .execute();
        Object.assign(
          physicalQuantitiesUnitsMap,
          createIdMap(physicalQuantities)
        );
      }

      const workoutExercisesQ = await db
        .selectFrom("workout_exercises")
        .innerJoin("exercises", "workout_exercises.exercise_id", "exercises.id")
        .selectAll("workout_exercises")
        .select((eb) => [
          eb.ref("exercises.id").as("exercise_id"),
          eb.ref("exercises.name").as("exercise_name"),
          eb.ref("exercises.body_part").as("exercise_body_part"),
          eb.ref("exercises.measurement_type").as("exercise_measurement_type"),
          eb.ref("exercises.equipment").as("exercise_equipment"),
          eb.ref("exercises.created_at").as("exercise_created_at"),
        ])
        .where(
          "step_definition_id",
          "in",
          stepDefinitions.map((step) => step.id)
        )
        .execute();

      const workoutExercises: WorkoutExerciseWithExercise[] =
        workoutExercisesQ.map((we) => ({
          ...we,
          exercise: {
            id: we.exercise_id,
            name: we.exercise_name,
            body_part: we.exercise_body_part,
            measurement_type: we.exercise_measurement_type,
            equipment: we.exercise_equipment,
            created_at: we.exercise_created_at,
          },
        }));

      const workoutSets: WorkoutSet[] = await db
        .selectFrom("workout_sets")
        .selectAll()
        .where(
          "workout_exercise_id",
          "in",
          workoutExercises.map((we) => we.id)
        )
        .execute();

      const fullStepDefinitions = buildFullStepDefinitions(
        stepDefinitions,
        physicalQuantitiesUnitsMap,
        workoutExercises,
        workoutSets
      );

      rituals.forEach((ritual) => {
        ritual.step_definitions = fullStepDefinitions.filter(
          (step) => step.ritual_id === ritual.id
        );
      });
    }

    return {
      data: {
        rituals,
        total: rituals.length,
      },
      message: "Public rituals fetched successfully",
      status: "success",
    };
  }
);

/**
 * GET /rituals/user
 * Get all user rituals
 */
export const getUserRituals = asyncHandler(async function getUserRitualsHandler(
  req: Request
): Promise<ApiSuccess<{ rituals: FullRitual[]; total: number }>> {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const category = req.query.category as RitualCategory | undefined;
  const search = req.query.search as string | undefined;
  // Validate limit and offset
  if (limit < 1 || limit > 100) {
    throw new BadRequestError("Limit must be between 1 and 100");
  }

  if (offset < 0) {
    throw new BadRequestError("Offset must be non-negative");
  }
  let query = db
    .selectFrom("rituals")
    .innerJoin(
      "ritual_frequencies",
      "rituals.id",
      "ritual_frequencies.ritual_id"
    )
    .selectAll("rituals")
    .select((eb) => [
      eb.ref("ritual_frequencies.created_at").as("frequency_created_at"),
      eb.ref("ritual_frequencies.days_of_week").as("frequency_days_of_week"),
      eb.ref("ritual_frequencies.exclude_dates").as("frequency_exclude_dates"),
      eb.ref("ritual_frequencies.frequency_interval").as("frequency_interval"),
      eb.ref("ritual_frequencies.frequency_type").as("frequency_type"),
      eb.ref("ritual_frequencies.id").as("frequency_id"),
      eb.ref("ritual_frequencies.ritual_id").as("frequency_ritual_id"),
      eb
        .ref("ritual_frequencies.specific_dates")
        .as("frequency_specific_dates"),
    ])
    .where("rituals.user_id", "=", req.userId);

  // Apply filters
  if (category) {
    query = query.where("rituals.category", "=", category);
  }

  if (search) {
    query = query.where((eb) =>
      eb.or([
        eb("rituals.name", "ilike", `%${search}%`),
        eb("rituals.description", "ilike", `%${search}%`),
      ])
    );
  }

  // Get paginated data
  const rituals_with_frequency = await query
    .limit(limit)
    .offset(offset)
    .orderBy("rituals.created_at", "desc")
    .execute();

  const rituals: FullRitual[] = rituals_with_frequency.map((ritual) => ({
    ...ritual,
    frequency: {
      created_at: ritual.frequency_created_at,
      days_of_week: ritual.frequency_days_of_week,
      exclude_dates: ritual.frequency_exclude_dates,
      frequency_interval: ritual.frequency_interval,
      frequency_type: ritual.frequency_type,
      id: ritual.frequency_id,
      ritual_id: ritual.frequency_ritual_id,
      specific_dates: ritual.frequency_specific_dates,
    } as RitualFrequency,
    step_definitions: [],
  }));

  if (rituals.length > 0) {
    const stepDefinitions: StepDefinition[] = await db
      .selectFrom("step_definitions")
      .selectAll()
      .where(
        "ritual_id",
        "in",
        rituals.map((ritual) => ritual.id)
      )
      .execute();

    const physicalQuantitiesUnitsMap: Record<UUID, PhysicalQuantity> = {};
    const physicalQuantityIds = stepDefinitions
      .filter((step) => step.target_unit_reference_id !== undefined)
      .map((step) => step.target_unit_reference_id as UUID);
    if (physicalQuantityIds.length > 0) {
      const physicalQuantities = await db
        .selectFrom("physical_quantities")
        .selectAll()
        .where("id", "in", physicalQuantityIds)
        .execute();
      Object.assign(
        physicalQuantitiesUnitsMap,
        createIdMap(physicalQuantities)
      );
    }

    const workoutExercisesQ = await db
      .selectFrom("workout_exercises")
      .innerJoin("exercises", "workout_exercises.exercise_id", "exercises.id")
      .selectAll("workout_exercises")
      .select((eb) => [
        eb.ref("exercises.id").as("exercise_id"),
        eb.ref("exercises.name").as("exercise_name"),
        eb.ref("exercises.body_part").as("exercise_body_part"),
        eb.ref("exercises.measurement_type").as("exercise_measurement_type"),
        eb.ref("exercises.equipment").as("exercise_equipment"),
        eb.ref("exercises.created_at").as("exercise_created_at"),
      ])
      .where(
        "step_definition_id",
        "in",
        stepDefinitions.map((step) => step.id)
      )
      .execute();

    const workoutExercises: WorkoutExerciseWithExercise[] =
      workoutExercisesQ.map((we) => ({
        ...we,
        exercise: {
          id: we.exercise_id,
          name: we.exercise_name,
          body_part: we.exercise_body_part,
          measurement_type: we.exercise_measurement_type,
          equipment: we.exercise_equipment,
          created_at: we.exercise_created_at,
        },
      }));

    const workoutSets: WorkoutSet[] = await db
      .selectFrom("workout_sets")
      .selectAll()
      .where(
        "workout_exercise_id",
        "in",
        workoutExercises.map((we) => we.id)
      )
      .execute();

    const fullStepDefinitions = buildFullStepDefinitions(
      stepDefinitions,
      physicalQuantitiesUnitsMap,
      workoutExercises,
      workoutSets
    );

    rituals.forEach((ritual) => {
      ritual.step_definitions = fullStepDefinitions.filter(
        (step) => step.ritual_id === ritual.id
      );
    });
  }

  return {
    data: {
      rituals,
      total: rituals.length,
    },
    message: "Public rituals fetched successfully",
    status: "success",
  };
});

/**
 * DELETE /rituals/:id
 * Delete ritual
 */
export const deleteRitual = asyncHandler(async function deleteRitualHandler(
  req: Request
): Promise<ApiSuccess<void>> {
  if (!req.userId) {
    throw new UnauthorizedError("Authentication required");
  }

  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Ritual ID is required");
  }

  const result = await db
    .deleteFrom("rituals")
    .where("id", "=", id)
    .where("user_id", "=", req.userId)
    .execute();

  if (result.length === 0) {
    throw new Error("Ritual not found or access denied");
  }

  return {
    data: undefined,
    message: "Ritual deleted successfully",
    status: "success",
  };
});

// ===========================================
// RITUAL COMPLETION
// ===========================================

/**
 * POST /rituals/:id/complete
 * Complete a ritual
 */
export const completeRitual = asyncHandler(async function completeRitualHandler(
  req: Request
): Promise<ApiSuccess<FullRitualCompletion>> {
  if (!req.userId) {
    throw new UnauthorizedError("Authentication required");
  }

  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Ritual ID is required");
  }

  const completionData = { ...req.body, ritual_id: id };
  const validatedData = completeRitualSchema.parse(completionData);

  const completion = await db.transaction().execute(async (trx) => {
    // 1. Validate ritual belongs to user
    const ritual = await trx
      .selectFrom("rituals")
      .selectAll()
      .where("id", "=", id)
      .where("user_id", "=", req.userId)
      .executeTakeFirst();

    if (!ritual) {
      throw new BadRequestError("Ritual not found or access denied");
    }

    // 2. Validate step responses against ritual step definitions
    const { stepDefinitions, workoutExercisesMap, workoutSetsMap } =
      await validateStepResponses(trx, id, validatedData.step_responses);

    // 3. Create ritual completion
    const createdCompletion = await trx
      .insertInto("ritual_completions")
      .values({
        user_id: req.userId,
        ritual_id: id,
        notes: validatedData.notes,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // 4. Create step responses
    const stepResponses = await trx
      .insertInto("step_responses")
      .values(
        validatedData.step_responses.map((res) => ({
          ritual_completion_id: createdCompletion.id,
          step_definition_id: res.step_definition_id,
          actual_count: res.actual_count,
          actual_seconds: res.actual_seconds,
          answer: res.answer,
          scale_response: res.scale_response,
          value_boolean: res.value_boolean,
        }))
      )
      .returningAll()
      .execute();

    // 5. Create workout set responses for workout steps
    const workoutSetResponses: NewWorkoutSetResponse[] = [];

    for (let i = 0; i < validatedData.step_responses.length; i++) {
      const response = validatedData.step_responses[i];
      const stepResponse = stepResponses[i];

      if (
        response &&
        stepResponse &&
        response.type === "workout" &&
        response.workout_set_responses
      ) {
        for (const setResponse of response.workout_set_responses) {
          workoutSetResponses.push({
            step_response_id: stepResponse.id,
            workout_set_id: setResponse.workout_set_id,
            actual_weight_kg: setResponse.actual_weight_kg,
            actual_reps: setResponse.actual_reps,
            actual_seconds: setResponse.actual_seconds,
            actual_distance_m: setResponse.actual_distance_m,
          });
        }
      }
    }
    let workoutSetResponsesMap: WorkoutSetResponse[] = []; // key is step_response_id
    // Batch insert all workout set responses
    if (workoutSetResponses.length > 0) {
      const createdWorkoutSetResponses = await trx
        .insertInto("workout_set_responses")
        .values(workoutSetResponses)
        .returningAll()
        .execute();
      workoutSetResponsesMap = createdWorkoutSetResponses;
    }

    // 6. Build full response efficiently using existing data
    // Get ritual and frequency (already validated above)
    const frequency = await trx
      .selectFrom("ritual_frequencies")
      .selectAll()
      .where("ritual_id", "=", id)
      .executeTakeFirstOrThrow();

    // Get physical quantities for step definitions that have target_unit_reference_id
    const physicalQuantityIds = stepDefinitions
      .filter((step) => step.target_unit_reference_id !== undefined)
      .map((step) => step.target_unit_reference_id as UUID);

    const physicalQuantitiesUnitsMap: Record<UUID, PhysicalQuantity> = {};
    if (physicalQuantityIds.length > 0) {
      const physicalQuantities = await trx
        .selectFrom("physical_quantities")
        .selectAll()
        .where("id", "in", physicalQuantityIds)
        .execute();
      Object.assign(
        physicalQuantitiesUnitsMap,
        createIdMap(physicalQuantities)
      );
    }

    // Flatten workout exercises with exercise data (reuse validation data)
    const allWorkoutExercises = Object.values(workoutExercisesMap).flat();
    const allWorkoutSets = Object.values(workoutSetsMap).flat();

    // Build full step definitions using existing buildFullStepDefinitions function
    const fullStepDefinitions = buildFullStepDefinitions(
      stepDefinitions,
      physicalQuantitiesUnitsMap,
      allWorkoutExercises,
      allWorkoutSets
    );

    // Build full step responses
    const fullStepResponses: FullStepResponse[] = stepResponses.map(
      (stepResponse) => ({
        ...stepResponse,
        ritual_completion_id: createdCompletion.id,
        workout_set_responses: workoutSetResponsesMap.filter(
          (item) => item.step_response_id === stepResponse.id
        ),
      })
    );

    // Build the full ritual completion response
    const fullRitualCompletion: FullRitualCompletion = {
      ...ritual,
      frequency,
      step_definitions: fullStepDefinitions,
      completion_data: createdCompletion,
      step_responses: fullStepResponses,
    };

    return fullRitualCompletion;
  });

  return {
    data: completion,
    message: "Ritual completed successfully",
    status: "success",
  };
});

/**
 * POST /rituals/:id/fork
 * Fork a public ritual to user's library
 */
export const forkRitual = asyncHandler(async function forkRitualHandler(
  req: Request
): Promise<ApiSuccess<FullRitual>> {
  if (!req.userId) {
    throw new UnauthorizedError("Authentication required");
  }

  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Ritual ID is required");
  }

  const originalRitual = await getFullRitual(id);

  // Check if ritual is public or user owns it
  if (!originalRitual.is_public && originalRitual.user_id !== req.userId) {
    throw new ForbiddenError("Cannot fork private ritual");
  }

  const forkedRitual = await db.transaction().execute(async (trx) => {
    // Create new ritual
    const ritual = await trx
      .insertInto("rituals")
      .values({
        user_id: req.userId,
        name: originalRitual.name,
        description: originalRitual.description,
        category: originalRitual.category,
        location: originalRitual.location,
        gear: originalRitual.gear,
        is_public: false,
        is_active: false,
        forked_from_id: originalRitual.id,
        fork_count: 0,
        completion_count: 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Update original ritual fork count
    await trx
      .updateTable("rituals")
      .set({ fork_count: originalRitual.fork_count + 1 })
      .where("id", "=", originalRitual.id)
      .execute();

    // Create frequency
    const frequency = await trx
      .insertInto("ritual_frequencies")
      .values({
        ritual_id: ritual.id,
        frequency_type: originalRitual.frequency.frequency_type,
        frequency_interval: originalRitual.frequency.frequency_interval,
        days_of_week: originalRitual.frequency.days_of_week,
        specific_dates: originalRitual.frequency.specific_dates,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Create step definitions
    const stepDefinitions: StepDefinition[] = [];
    for (const step of originalRitual.step_definitions) {
      const stepDef = await trx
        .insertInto("step_definitions")
        .values({
          ritual_id: ritual.id,
          order_index: step.order_index,
          type: step.type,
          name: step.name,
          is_required: step.is_required,
          target_count: step.target_count,
          target_unit_reference_id: step.target_unit_reference_id,
          target_seconds: step.target_seconds,
          min_value: step.min_value,
          max_value: step.max_value,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      stepDefinitions.push(stepDef);
    }

    const physicalQuantitiesUnitsMap: Record<UUID, PhysicalQuantity> =
      createIdMap(
        originalRitual.step_definitions
          .filter((step) => step.target_unit_with_data !== undefined)
          .map((step) => step.target_unit_with_data as PhysicalQuantity)
      );

    const exerciseMap = createIdMap(
      originalRitual.step_definitions
        .flatMap((step) =>
          step.full_workout_exercises?.map((exercise) => exercise.exercise)
        )
        .filter((exercise): exercise is Exercise => exercise !== undefined)
    );

    const stepDefinitionMap: Record<
      UUID,
      CreateRitualSchemaType["step_definitions"][number]
    > = {};
    for (const [index, step] of stepDefinitions.entries()) {
      stepDefinitionMap[step.id] =
        originalRitual.step_definitions[index] ??
        (() => {
          throw new InternalError(
            "Mismatch between step definitions length from request and step definitions from db"
          );
        })();
    }

    const { workoutExercisesWithExercise, workoutSets } =
      await createWorkoutExercisesAndSets(trx, exerciseMap, stepDefinitionMap);

    const fullStepDefinitions = buildFullStepDefinitions(
      stepDefinitions,
      physicalQuantitiesUnitsMap,
      workoutExercisesWithExercise,
      workoutSets
    );
    return {
      ...ritual,
      frequency,
      step_definitions: fullStepDefinitions,
    };
  });

  return {
    data: forkedRitual,
    message: "Ritual forked successfully",
    status: "success",
  };
});

/**
 * POST /rituals/:id/publish
 * Publish a ritual to make it public
 */
export const publishRitual = asyncHandler(async function publishRitualHandler(
  req: Request
): Promise<ApiSuccess<void>> {
  if (!req.userId) {
    throw new UnauthorizedError("Authentication required");
  }

  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Ritual ID is required");
  }

  await db
    .updateTable("rituals")
    .set({ is_public: true })
    .where("id", "=", id)
    .where("user_id", "=", req.userId)
    .execute();

  return {
    message: "Ritual published successfully",
    status: "success",
    data: undefined,
  };
});

/**
 * POST /rituals/:id/unpublish
 * Unpublish a ritual to make it private
 */
export const unpublishRitual = asyncHandler(
  async function unpublishRitualHandler(
    req: Request
  ): Promise<ApiSuccess<void>> {
    if (!req.userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Ritual ID is required");
    }

    await db
      .updateTable("rituals")
      .set({ is_public: false })
      .where("id", "=", id)
      .where("user_id", "=", req.userId)
      .execute();

    return {
      data: undefined,
      message: "Ritual unpublished successfully",
      status: "success",
    };
  }
);

// ===========================================
// DAILY SCHEDULE
// ===========================================

/**
 * GET /daily-schedule?date=YYYY-MM-DD&include_completed=true&timezone=UTC
 * Get user's daily schedule for a specific date
 */
export const getDailySchedule = asyncHandler(
  async function getDailyScheduleHandler(
    req: Request
  ): Promise<ApiSuccess<UserDailySchedule>> {
    if (!req.userId) {
      throw new UnauthorizedError("Authentication required");
    }
    const validatedQuery = getDailyScheduleSchema.parse(req.query);
    const { date, include_completed = true } = validatedQuery;

    const targetDate = new Date(date + "T00:00:00Z");
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday

    // 1. Get completed rituals for the date using bulk fetching
    let completedRituals: FullRitualCompletion[] = [];

    if (include_completed) {
      const completions = await db
        .selectFrom("ritual_completions")
        .selectAll()
        .where("user_id", "=", req.userId)
        .where((eb) => eb.fn("DATE", ["completed_at"]), "=", date)
        .execute();

      completedRituals = await getFullRitualWithCompletions(completions);
    }

    // 2. Get scheduled rituals for the date (active rituals that aren't completed)
    const completedRitualIds = completedRituals.map((cr) => cr.id);

    // Get all active rituals with their frequencies
    let ritualsQuery = db
      .selectFrom("rituals")
      .innerJoin(
        "ritual_frequencies",
        "rituals.id",
        "ritual_frequencies.ritual_id"
      )
      .selectAll("rituals")
      .select((eb) => [
        eb.ref("ritual_frequencies.created_at").as("frequency_created_at"),
        eb.ref("ritual_frequencies.days_of_week").as("frequency_days_of_week"),
        eb
          .ref("ritual_frequencies.exclude_dates")
          .as("frequency_exclude_dates"),
        eb
          .ref("ritual_frequencies.frequency_interval")
          .as("frequency_interval"),
        eb.ref("ritual_frequencies.frequency_type").as("frequency_type"),
        eb.ref("ritual_frequencies.id").as("frequency_id"),
        eb.ref("ritual_frequencies.ritual_id").as("frequency_ritual_id"),
        eb
          .ref("ritual_frequencies.specific_dates")
          .as("frequency_specific_dates"),
      ])
      .where("rituals.user_id", "=", req.userId)
      .where("rituals.is_active", "=", true);

    // Exclude already completed rituals
    if (completedRitualIds.length > 0) {
      ritualsQuery = ritualsQuery.where(
        "rituals.id",
        "not in",
        completedRitualIds
      );
    }

    const ritualsWithFrequencies = await ritualsQuery.execute();

    // Filter rituals that should be scheduled for the target date
    const scheduledRitualRows = ritualsWithFrequencies.filter((row) => {
      const frequency: RitualFrequency = {
        created_at: row.frequency_created_at,
        days_of_week: row.frequency_days_of_week,
        exclude_dates: row.frequency_exclude_dates,
        frequency_interval: row.frequency_interval,
        frequency_type: row.frequency_type,
        id: row.frequency_id,
        ritual_id: row.frequency_ritual_id,
        specific_dates: row.frequency_specific_dates,
      };

      return shouldRitualBeScheduledForDate(frequency, date, dayOfWeek);
    });

    // Build scheduled rituals using bulk fetching pattern like getUserRituals
    const scheduledRituals: FullRitual[] = scheduledRitualRows.map(
      (ritual) => ({
        ...ritual,
        frequency: {
          created_at: ritual.frequency_created_at,
          days_of_week: ritual.frequency_days_of_week,
          exclude_dates: ritual.frequency_exclude_dates,
          frequency_interval: ritual.frequency_interval,
          frequency_type: ritual.frequency_type,
          id: ritual.frequency_id,
          ritual_id: ritual.frequency_ritual_id,
          specific_dates: ritual.frequency_specific_dates,
        } as RitualFrequency,
        step_definitions: [],
      })
    );

    // Bulk fetch step definitions and related data if we have scheduled rituals
    if (scheduledRituals.length > 0) {
      const ritualIds = scheduledRituals.map((ritual) => ritual.id);

      const stepDefinitions: StepDefinition[] = await db
        .selectFrom("step_definitions")
        .selectAll()
        .where("ritual_id", "in", ritualIds)
        .execute();

      const physicalQuantitiesUnitsMap: Record<UUID, PhysicalQuantity> = {};
      const physicalQuantityIds = stepDefinitions
        .filter((step) => step.target_unit_reference_id !== undefined)
        .map((step) => step.target_unit_reference_id as UUID);
      if (physicalQuantityIds.length > 0) {
        const physicalQuantities = await db
          .selectFrom("physical_quantities")
          .selectAll()
          .where("id", "in", physicalQuantityIds)
          .execute();
        Object.assign(
          physicalQuantitiesUnitsMap,
          createIdMap(physicalQuantities)
        );
      }

      const workoutExercisesQ = await db
        .selectFrom("workout_exercises")
        .innerJoin("exercises", "workout_exercises.exercise_id", "exercises.id")
        .selectAll("workout_exercises")
        .select((eb) => [
          eb.ref("exercises.id").as("exercise_id"),
          eb.ref("exercises.name").as("exercise_name"),
          eb.ref("exercises.body_part").as("exercise_body_part"),
          eb.ref("exercises.measurement_type").as("exercise_measurement_type"),
          eb.ref("exercises.equipment").as("exercise_equipment"),
          eb.ref("exercises.created_at").as("exercise_created_at"),
        ])
        .where(
          "step_definition_id",
          "in",
          stepDefinitions.map((step) => step.id)
        )
        .execute();

      const workoutExercises: WorkoutExerciseWithExercise[] =
        workoutExercisesQ.map((we) => ({
          ...we,
          exercise: {
            id: we.exercise_id,
            name: we.exercise_name,
            body_part: we.exercise_body_part,
            measurement_type: we.exercise_measurement_type,
            equipment: we.exercise_equipment,
            created_at: we.exercise_created_at,
          },
        }));

      const workoutSets: WorkoutSet[] = await db
        .selectFrom("workout_sets")
        .selectAll()
        .where(
          "workout_exercise_id",
          "in",
          workoutExercises.map((we) => we.id)
        )
        .execute();

      const fullStepDefinitions = buildFullStepDefinitions(
        stepDefinitions,
        physicalQuantitiesUnitsMap,
        workoutExercises,
        workoutSets
      );

      scheduledRituals.forEach((ritual) => {
        ritual.step_definitions = fullStepDefinitions.filter(
          (step) => step.ritual_id === ritual.id
        );
      });
    }

    const schedule: UserDailySchedule = {
      user_id: req.userId,
      date,
      scheduled_rituals: scheduledRituals,
      completed_rituals: completedRituals,
    };

    return {
      data: schedule,
      message: "Daily schedule fetched successfully",
      status: "success",
    };
  }
);

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Helper function to build FullRitualCompletion objects efficiently with bulk fetching
 */
const getFullRitualWithCompletions = async (
  completions: RitualCompletion[]
): Promise<FullRitualCompletion[]> => {
  if (completions.length === 0) return [];

  // 1. Get all unique ritual IDs
  const ritualIds = [...new Set(completions.map((c) => c.ritual_id))];

  // 2. Get all rituals with frequencies in bulk
  const ritualsWithFrequencies = await db
    .selectFrom("rituals")
    .innerJoin(
      "ritual_frequencies",
      "rituals.id",
      "ritual_frequencies.ritual_id"
    )
    .selectAll("rituals")
    .select((eb) => [
      eb.ref("ritual_frequencies.created_at").as("frequency_created_at"),
      eb.ref("ritual_frequencies.days_of_week").as("frequency_days_of_week"),
      eb.ref("ritual_frequencies.exclude_dates").as("frequency_exclude_dates"),
      eb.ref("ritual_frequencies.frequency_interval").as("frequency_interval"),
      eb.ref("ritual_frequencies.frequency_type").as("frequency_type"),
      eb.ref("ritual_frequencies.id").as("frequency_id"),
      eb.ref("ritual_frequencies.ritual_id").as("frequency_ritual_id"),
      eb
        .ref("ritual_frequencies.specific_dates")
        .as("frequency_specific_dates"),
    ])
    .where("rituals.id", "in", ritualIds)
    .execute();

  // 3. Get all step definitions for these rituals
  const stepDefinitions = await db
    .selectFrom("step_definitions")
    .selectAll()
    .where("ritual_id", "in", ritualIds)
    .orderBy("order_index")
    .execute();

  // 4. Get physical quantities for step definitions that need them
  const physicalQuantityIds = stepDefinitions
    .filter((step) => step.target_unit_reference_id !== undefined)
    .map((step) => step.target_unit_reference_id as UUID);

  const physicalQuantitiesUnitsMap: Record<UUID, PhysicalQuantity> = {};
  if (physicalQuantityIds.length > 0) {
    const physicalQuantities = await db
      .selectFrom("physical_quantities")
      .selectAll()
      .where("id", "in", physicalQuantityIds)
      .execute();
    Object.assign(physicalQuantitiesUnitsMap, createIdMap(physicalQuantities));
  }

  // 5. Get workout exercises with exercise data
  const workoutExercisesQ = await db
    .selectFrom("workout_exercises")
    .innerJoin("exercises", "workout_exercises.exercise_id", "exercises.id")
    .selectAll("workout_exercises")
    .select((eb) => [
      eb.ref("exercises.id").as("exercise_id"),
      eb.ref("exercises.name").as("exercise_name"),
      eb.ref("exercises.body_part").as("exercise_body_part"),
      eb.ref("exercises.measurement_type").as("exercise_measurement_type"),
      eb.ref("exercises.equipment").as("exercise_equipment"),
      eb.ref("exercises.created_at").as("exercise_created_at"),
    ])
    .where(
      "step_definition_id",
      "in",
      stepDefinitions.map((step) => step.id)
    )
    .execute();

  const workoutExercises: WorkoutExerciseWithExercise[] = workoutExercisesQ.map(
    (we) => ({
      ...we,
      exercise: {
        id: we.exercise_id,
        name: we.exercise_name,
        body_part: we.exercise_body_part,
        measurement_type: we.exercise_measurement_type,
        equipment: we.exercise_equipment,
        created_at: we.exercise_created_at,
      },
    })
  );

  // 6. Get workout sets
  const workoutSets: WorkoutSet[] =
    workoutExercises.length > 0
      ? await db
          .selectFrom("workout_sets")
          .selectAll()
          .where(
            "workout_exercise_id",
            "in",
            workoutExercises.map((we) => we.id)
          )
          .execute()
      : [];

  // 7. Get step responses for all completions
  const stepResponses = await db
    .selectFrom("step_responses")
    .selectAll()
    .where(
      "ritual_completion_id",
      "in",
      completions.map((c) => c.id)
    )
    .execute();

  // 8. Get workout set responses
  const stepResponseIds = stepResponses.map((r) => r.id);
  const workoutSetResponses =
    stepResponseIds.length > 0
      ? await db
          .selectFrom("workout_set_responses")
          .selectAll()
          .where("step_response_id", "in", stepResponseIds)
          .execute()
      : [];

  // 9. Build full step definitions using existing function
  const fullStepDefinitions = buildFullStepDefinitions(
    stepDefinitions,
    physicalQuantitiesUnitsMap,
    workoutExercises,
    workoutSets
  );

  // 10. Build the result
  const result: FullRitualCompletion[] = [];

  for (const completion of completions) {
    const ritualRow = ritualsWithFrequencies.find(
      (r) => r.id === completion.ritual_id
    );
    if (!ritualRow) continue;

    const frequency: RitualFrequency = {
      created_at: ritualRow.frequency_created_at,
      days_of_week: ritualRow.frequency_days_of_week,
      exclude_dates: ritualRow.frequency_exclude_dates,
      frequency_interval: ritualRow.frequency_interval,
      frequency_type: ritualRow.frequency_type,
      id: ritualRow.frequency_id,
      ritual_id: ritualRow.frequency_ritual_id,
      specific_dates: ritualRow.frequency_specific_dates,
    };

    const ritualStepDefinitions = fullStepDefinitions.filter(
      (step) => step.ritual_id === completion.ritual_id
    );

    const completionStepResponses = stepResponses.filter(
      (sr) => sr.ritual_completion_id === completion.id
    );

    // Build full step responses
    const fullStepResponses: FullStepResponse[] = completionStepResponses.map(
      (stepResponse) => ({
        ...stepResponse,
        workout_set_responses: workoutSetResponses.filter(
          (wsr) => wsr.step_response_id === stepResponse.id
        ),
      })
    );

    result.push({
      ...ritualRow,
      frequency,
      step_definitions: ritualStepDefinitions,
      completion_data: completion,
      step_responses: fullStepResponses,
    });
  }

  return result;
};

const getFullRitual = async (ritualId: string): Promise<FullRitual> => {
  const ritual = await db
    .selectFrom("rituals")
    .selectAll()
    .where("id", "=", ritualId)
    .executeTakeFirstOrThrow();

  const frequency = await db
    .selectFrom("ritual_frequencies")
    .selectAll()
    .where("ritual_id", "=", ritualId)
    .executeTakeFirstOrThrow();

  const stepDefinitions = await db
    .selectFrom("step_definitions")
    .selectAll()
    .where("ritual_id", "=", ritualId)
    .orderBy("order_index")
    .execute();

  // Get physical quantities for each step
  const physicalQuantityIds = stepDefinitions
    .filter((step) => step.target_unit_reference_id !== undefined)
    .map((step) => step.target_unit_reference_id)
    .filter((id): id is string => Boolean(id));

  const physicalQuantitiesUnitsMap: Record<UUID, PhysicalQuantity> = {};
  if (physicalQuantityIds.length > 0) {
    const physicalQuantities = await db
      .selectFrom("physical_quantities")
      .selectAll()
      .where("id", "in", physicalQuantityIds)
      .execute();
    Object.assign(physicalQuantitiesUnitsMap, createIdMap(physicalQuantities));
  }

  // Get workout exercises for each step
  const workoutExercises = await db
    .selectFrom("workout_exercises")
    .innerJoin("exercises", "workout_exercises.exercise_id", "exercises.id")
    .selectAll("workout_exercises")
    .select((eb) => [
      eb.ref("exercises.id").as("exercise_id"),
      eb.ref("exercises.name").as("exercise_name"),
      eb.ref("exercises.body_part").as("exercise_body_part"),
      eb.ref("exercises.measurement_type").as("exercise_measurement_type"),
      eb.ref("exercises.equipment").as("exercise_equipment"),
      eb.ref("exercises.created_at").as("exercise_created_at"),
    ])
    .where(
      "step_definition_id",
      "in",
      stepDefinitions.map((step) => step.id)
    )
    .orderBy("workout_exercises.order_index")
    .execute();

  const workoutExerciseIds = workoutExercises.map((we) => we.id);
  const workoutSets =
    workoutExerciseIds.length > 0
      ? await db
          .selectFrom("workout_sets")
          .selectAll()
          .where("workout_exercise_id", "in", workoutExerciseIds)
          .orderBy("set_number")
          .execute()
      : [];

  // Build full step definitions
  const fullStepDefinitions: FullStepDefinition[] = stepDefinitions.map(
    (step) => {
      const stepWorkoutExercises = workoutExercises
        .filter((we) => we.step_definition_id === step.id)
        .map((we) => ({
          id: we.id,
          step_definition_id: we.step_definition_id,
          exercise_id: we.exercise_id,
          order_index: we.order_index,
          exercise: {
            id: we.exercise_id,
            name: we.exercise_name,
            body_part: we.exercise_body_part,
            measurement_type: we.exercise_measurement_type,
            equipment: we.exercise_equipment,
            created_at: we.exercise_created_at,
          },
          workout_sets: workoutSets.filter(
            (ws) => ws.workout_exercise_id === we.id
          ),
        }));

      return {
        ...step,
        target_unit_with_data: step.target_unit_reference_id
          ? physicalQuantitiesUnitsMap[step.target_unit_reference_id]
          : undefined,
        full_workout_exercises: stepWorkoutExercises,
      };
    }
  );

  return {
    ...ritual,
    frequency,
    step_definitions: fullStepDefinitions,
  };
};

function extractPhysicalQuantityUnits(
  stepDefinitions: CreateRitualSchemaType["step_definitions"]
): string[] {
  return stepDefinitions
    .filter((step) => step.target_count_unit !== undefined)
    .map((step) => step.target_count_unit as UUID);
}

// Note: Zod already verifies that same exercise_id don't have conflicting measurement types
function extractExerciseMeasurmentMap(
  stepDefinitions: CreateRitualSchemaType["step_definitions"]
): Record<UUID, ExerciseMeasurementType> {
  return stepDefinitions
    .flatMap((step) => step.workout_exercises ?? [])
    .reduce<Record<UUID, ExerciseMeasurementType>>((acc, exercise) => {
      acc[exercise.exercise_id] = exercise.exercise_measurement_type;
      return acc;
    }, {});
}

// Validation functions
async function validateExerciseMeasurementTypes(
  trx: Transaction<Database>,
  exerciseMeasurmentMap: Record<UUID, ExerciseMeasurementType>
): Promise<Record<UUID, Exercise>> {
  const exerciseIds = Object.keys(exerciseMeasurmentMap);
  if (exerciseIds.length === 0) return {};

  const exercises = await trx
    .selectFrom("exercises")
    .selectAll()
    .where("id", "in", exerciseIds)
    .execute();

  const dbMap = createIdMap(exercises);

  for (const [exerciseId, expectedType] of Object.entries(
    exerciseMeasurmentMap
  )) {
    const actualType = dbMap[exerciseId]?.measurement_type;
    if (actualType !== expectedType) {
      throw new BadRequestError(
        `Exercise ID ${exerciseId} measurement type mismatch. Expected: ${expectedType}, Actual: ${actualType}`
      );
    }
  }
  return createIdMap(exercises);
}

async function validatePhysicalQuantityUnits(
  trx: Transaction<Database>,
  physicalQuantityUnitIds: string[]
): Promise<Record<UUID, PhysicalQuantity>> {
  if (physicalQuantityUnitIds.length === 0) {
    return {};
  }

  // Validate physical quantities exist
  const physicalQuantitiesFromDb = await trx
    .selectFrom("physical_quantities")
    .selectAll()
    .where("id", "in", physicalQuantityUnitIds)
    .execute();

  const physicalQuantitiesUnitsMap = createIdMap(physicalQuantitiesFromDb);

  for (const id of physicalQuantityUnitIds) {
    if (!physicalQuantitiesUnitsMap[id]) {
      throw new BadRequestError(`Physical quantity ID ${id} not found`);
    }
  }

  return physicalQuantitiesUnitsMap;
}

async function createStepDefinitions(
  trx: Transaction<Database>,
  ritualId: string,
  stepDefinitions: CreateRitualSchemaType["step_definitions"]
): Promise<StepDefinition[]> {
  return await trx
    .insertInto("step_definitions")
    .values(
      stepDefinitions.map((step) => ({
        is_required: step.is_required,
        name: step.name,
        order_index: step.order_index,
        ritual_id: ritualId,
        type: step.type,
        max_value: step.max_value,
        min_value: step.min_value,
        target_count: step.target_count_value,
        target_unit_reference_id: step.target_count_unit,
        target_seconds: step.target_seconds,
      }))
    )
    .returningAll()
    .execute();
}

async function createWorkoutExercisesAndSets(
  trx: Transaction<Database>,
  exerciseMap: Record<UUID, Exercise>,
  stepDefinitionFromQuery: Record<
    UUID,
    CreateRitualSchemaType["step_definitions"][number]
  >
): Promise<{
  workoutExercisesWithExercise: WorkoutExerciseWithExercise[];
  workoutSets: WorkoutSet[];
}> {
  const hasWorkoutExercises = Object.values(stepDefinitionFromQuery).some(
    (step) => (step.workout_exercises?.length ?? 0) > 0
  );

  if (!hasWorkoutExercises) {
    return {
      workoutExercisesWithExercise: [],
      workoutSets: [],
    };
  }

  // Create workout exercises
  const workoutExercises = await trx
    .insertInto("workout_exercises")
    .values(
      Object.entries(stepDefinitionFromQuery).flatMap(
        ([step_definition_id, step]) =>
          (step.workout_exercises ?? []).map((exercise) => ({
            exercise_id: exercise.exercise_id,
            order_index: exercise.order_index,
            step_definition_id,
          }))
      )
    )
    .returningAll()
    .execute();

  const workoutExercisesWithExercise = workoutExercises.map((we) => ({
    ...we,
    exercise:
      exerciseMap[we.exercise_id] ??
      (() => {
        throw new InternalError(
          `Mismatch between workout exercises length from request and workout exercises from db. Exercise ID ${we.exercise_id} not found`
        );
      })(),
  }));

  // Create workout sets
  const workoutSets = await trx
    .insertInto("workout_sets")
    .values(
      Object.values(stepDefinitionFromQuery)
        .flatMap((step, stepIndex) =>
          (step.workout_exercises ?? []).flatMap((exercise, exerciseIndex) =>
            (exercise.workout_sets ?? []).map((set) => ({
              ...set,
              workoutExerciseIndex:
                stepIndex * (step.workout_exercises?.length || 0) +
                exerciseIndex,
            }))
          )
        )
        .map((set) => ({
          set_number: set.set_number,
          workout_exercise_id:
            workoutExercises[set.workoutExerciseIndex]?.id ??
            (() => {
              throw new InternalError(
                `Mismatch between workout exercises length from request and workout exercises from db. Workout exercise ID ${set.workoutExerciseIndex} not found`
              );
            })(),
          target_distance_m: set.target_distance_m,
          target_reps: set.target_reps,
          target_seconds: set.target_seconds,
          target_weight_kg: set.target_weight_kg,
        }))
    )
    .returningAll()
    .execute();

  return {
    workoutExercisesWithExercise,
    workoutSets,
  };
}

function buildFullStepDefinitions(
  stepDefinitionsFromDb: StepDefinition[],
  physicalQuantitiesUnitsMap: Record<UUID, PhysicalQuantity>,
  workoutExercisesWithExercise: WorkoutExerciseWithExercise[],
  workoutSets: WorkoutSet[]
): FullStepDefinition[] {
  return stepDefinitionsFromDb.map((step) => ({
    created_at: step.created_at,
    id: step.id,
    is_required: step.is_required,
    max_value: step.max_value,
    min_value: step.min_value,
    name: step.name,
    order_index: step.order_index,
    ritual_id: step.ritual_id,
    target_seconds: step.target_seconds,
    type: step.type,
    target_unit_reference_id: step.target_unit_reference_id,
    target_count: step.target_count,
    target_unit_with_data: step.target_unit_reference_id
      ? physicalQuantitiesUnitsMap[step.target_unit_reference_id]
      : undefined,
    full_workout_exercises: workoutExercisesWithExercise.map(
      (workoutExercise) => ({
        ...workoutExercise,
        workout_sets: workoutSets.filter(
          (set) => set.workout_exercise_id === workoutExercise.id
        ),
      })
    ),
  }));
}

// Validation functions for complete ritual
async function validateStepResponses(
  trx: Transaction<Database>,
  ritualId: string,
  stepResponses: CompleteRitualSchemaType["step_responses"]
): Promise<{
  stepDefinitions: StepDefinition[];
  workoutExercisesMap: Record<UUID, WorkoutExerciseWithExercise[]>;
  workoutSetsMap: Record<UUID, WorkoutSet[]>;
  exerciseMap: Record<UUID, Exercise>;
}> {
  // 1. Get step definitions for the ritual
  const stepDefinitions = await trx
    .selectFrom("step_definitions")
    .selectAll()
    .where("ritual_id", "=", ritualId)
    .orderBy("order_index")
    .execute();

  if (stepDefinitions.length === 0) {
    throw new BadRequestError("No step definitions found for ritual");
  }

  // 2. Validate that we have responses for all step definitions
  const stepDefinitionIds = stepDefinitions.map((step) => step.id);
  const responseStepIds = stepResponses.map(
    (response) => response.step_definition_id
  );

  if (stepDefinitions.length !== stepResponses.length) {
    throw new BadRequestError(
      `Step response count mismatch. Expected: ${stepDefinitions.length}, Received: ${stepResponses.length}`
    );
  }

  for (const stepId of stepDefinitionIds) {
    if (!responseStepIds.includes(stepId)) {
      throw new BadRequestError(
        `Missing response for step definition: ${stepId}`
      );
    }
  }

  // 3. Validate step types match
  const stepDefMap = createIdMap(stepDefinitions);
  for (const response of stepResponses) {
    const stepDef = stepDefMap[response.step_definition_id];
    if (!stepDef) {
      throw new BadRequestError(
        `Invalid step definition ID: ${response.step_definition_id}`
      );
    }
    if (stepDef.type !== response.type) {
      throw new BadRequestError(
        `Step type mismatch for ${response.step_definition_id}. Expected: ${stepDef.type}, Received: ${response.type}`
      );
    }
  }

  // 4. Get workout exercises and sets for workout steps
  const workoutStepIds = stepDefinitions
    .filter((step) => step.type === "workout")
    .map((step) => step.id);

  let workoutExercisesMap: Record<UUID, WorkoutExerciseWithExercise[]> = {};
  let workoutSetsMap: Record<UUID, WorkoutSet[]> = {};
  let exerciseMap: Record<UUID, Exercise> = {};

  if (workoutStepIds.length > 0) {
    const workoutExercises = await trx
      .selectFrom("workout_exercises")
      .innerJoin("exercises", "workout_exercises.exercise_id", "exercises.id")
      .selectAll("workout_exercises")
      .select((eb) => [
        eb.ref("exercises.id").as("exercise_id"),
        eb.ref("exercises.name").as("exercise_name"),
        eb.ref("exercises.body_part").as("exercise_body_part"),
        eb.ref("exercises.measurement_type").as("exercise_measurement_type"),
        eb.ref("exercises.equipment").as("exercise_equipment"),
        eb.ref("exercises.created_at").as("exercise_created_at"),
      ])
      .where("step_definition_id", "in", workoutStepIds)
      .orderBy("workout_exercises.order_index")
      .execute();

    const workoutExerciseIds = workoutExercises.map((we) => we.id);
    const workoutSets =
      workoutExerciseIds.length > 0
        ? await trx
            .selectFrom("workout_sets")
            .selectAll()
            .where("workout_exercise_id", "in", workoutExerciseIds)
            .orderBy("set_number")
            .execute()
        : [];

    // Build maps
    workoutExercisesMap = workoutExercises.reduce(
      (acc, we) => {
        const stepId = we.step_definition_id;
        if (!acc[stepId]) acc[stepId] = [];
        acc[stepId].push({
          id: we.id,
          step_definition_id: we.step_definition_id,
          exercise_id: we.exercise_id,
          order_index: we.order_index,
          exercise: {
            id: we.exercise_id,
            name: we.exercise_name,
            body_part: we.exercise_body_part,
            measurement_type: we.exercise_measurement_type,
            equipment: we.exercise_equipment,
            created_at: we.exercise_created_at,
          },
        });
        return acc;
      },
      {} as Record<UUID, WorkoutExerciseWithExercise[]>
    );

    workoutSetsMap = workoutSets.reduce(
      (acc, set) => {
        const workoutExerciseId = set.workout_exercise_id;
        if (!acc[workoutExerciseId]) acc[workoutExerciseId] = [];
        acc[workoutExerciseId].push(set);
        return acc;
      },
      {} as Record<UUID, WorkoutSet[]>
    );

    exerciseMap = workoutExercises.reduce(
      (acc, we) => {
        acc[we.exercise_id] = {
          id: we.exercise_id,
          name: we.exercise_name,
          body_part: we.exercise_body_part,
          measurement_type: we.exercise_measurement_type,
          equipment: we.exercise_equipment,
          created_at: we.exercise_created_at,
        };
        return acc;
      },
      {} as Record<UUID, Exercise>
    );
  }

  // 5. Validate workout set responses for workout steps
  for (const response of stepResponses.filter((r) => r.type === "workout")) {
    const stepId = response.step_definition_id;
    const workoutExercises = workoutExercisesMap[stepId] || [];
    const workoutSetResponses = response.workout_set_responses || [];

    for (const workoutExercise of workoutExercises) {
      const exerciseSets = workoutSetsMap[workoutExercise.id] || [];
      const exerciseSetResponses = workoutSetResponses.filter((wr) =>
        exerciseSets.some((set) => set.id === wr.workout_set_id)
      );

      if (exerciseSets.length !== exerciseSetResponses.length) {
        throw new BadRequestError(
          `Workout set response count mismatch for exercise ${workoutExercise.exercise_id} in step ${stepId}. Expected: ${exerciseSets.length}, Received: ${exerciseSetResponses.length}`
        );
      }

      // Validate all workout set IDs exist
      for (const setResponse of exerciseSetResponses) {
        const workoutSetExists = exerciseSets.some(
          (set) => set.id === setResponse.workout_set_id
        );
        if (!workoutSetExists) {
          throw new BadRequestError(
            `Invalid workout set ID: ${setResponse.workout_set_id}`
          );
        }
      }

      // Validate measurement types
      const exercise = exerciseMap[workoutExercise.exercise_id];
      if (!exercise) {
        throw new BadRequestError(
          `Exercise not found: ${workoutExercise.exercise_id}`
        );
      }
      for (const setResponse of exerciseSetResponses) {
        if (
          setResponse.exercise_measurement_type !== exercise.measurement_type
        ) {
          throw new BadRequestError(
            `Exercise measurement type mismatch for ${workoutExercise.exercise_id}. Expected: ${exercise.measurement_type}, Received: ${setResponse.exercise_measurement_type}`
          );
        }
      }
    }
  }

  return {
    stepDefinitions,
    workoutExercisesMap,
    workoutSetsMap,
    exerciseMap,
  };
}

// ===========================================
// FREQUENCY SCHEDULING HELPERS
// ===========================================

/**
 * Determines if a ritual should be scheduled for a given date based on its frequency configuration
 */
function shouldRitualBeScheduledForDate(
  frequency: RitualFrequency,
  targetDate: string, // YYYY-MM-DD format
  dayOfWeek: number // 0 = Sunday, 6 = Saturday
): boolean {
  const {
    frequency_type,
    frequency_interval,
    days_of_week,
    specific_dates,
    exclude_dates,
  } = frequency;

  // Check if the date is excluded
  if (exclude_dates && exclude_dates.includes(targetDate)) {
    return false;
  }

  switch (frequency_type) {
    case "once":
      // Once rituals are not recurring, should only appear on specific completion
      return false;

    case "daily":
      // Daily rituals appear every day (frequency_interval should be 1)
      return frequency_interval === 1;

    case "weekly":
      // Weekly rituals appear on specific days of the week
      if (!days_of_week || days_of_week.length === 0) {
        return false;
      }
      return days_of_week.includes(dayOfWeek);

    case "custom":
      // Custom rituals appear on specific dates only
      if (!specific_dates || specific_dates.length === 0) {
        return false;
      }
      return specific_dates.includes(targetDate);

    default:
      return false;
  }
}
