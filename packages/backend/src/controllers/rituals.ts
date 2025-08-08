import {
  AnyStepDefinition,
  BadRequestError,
  batchCompleteRitualsSchema,
  completeRitualSchema,
  createRitualSchema,
  ForbiddenError,
  getUserScheduleSchema,
  quickStepResponseSchema,
  quickUpdateResponseSchema,
  Ritual,
  RitualCategory,
  RitualCompletionWithSteps,
  RitualFrequency,
  RitualFrequencyType,
  RitualWithConfig,
  transformBatchCompleteRituals,
  transformCompleteRitual,
  transformCreateRitual,
  transformQuickStepResponse,
  transformQuickUpdateResponse,
  transformUpdateRitual,
  transformUpdateRitualCompletion,
  UnauthorizedError,
  updateRitualCompletionSchema,
  updateRitualSchema,
  UserDailySchedule,
} from "@rituals/shared";
import { Request } from "express";
import { ok } from "neverthrow";
import { db } from "../database/connection";
import { asyncHandler } from "../middleware/error-handler";

// ===========================================
// HELPER FUNCTIONS
// ===========================================

const getRitualWithConfig = async (
  ritualId: string
): Promise<RitualWithConfig> => {
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

  return {
    ...ritual,
    frequency,
    step_definitions: stepDefinitions as AnyStepDefinition[],
  };
};

const buildRitualsWithConfig = async (
  rituals: (Ritual & RitualFrequency)[]
): Promise<RitualWithConfig[]> => {
  const result: RitualWithConfig[] = [];

  for (const row of rituals) {
    const stepDefinitions = await db
      .selectFrom("step_definitions")
      .selectAll()
      .where("ritual_id", "=", row.id)
      .orderBy("order_index")
      .execute();

    const ritual: Ritual = {
      id: row.ritual_id!,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      category: row.category,
      location: row.location,
      gear: row.gear,
      is_public: row.is_public,
      is_active: row.is_active,
      forked_from_id: row.forked_from_id,
      fork_count: row.fork_count,
      completion_count: row.completion_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    const frequency: RitualFrequency = {
      id: row.id,
      ritual_id: row.ritual_id!,
      frequency_type: row.frequency_type,
      frequency_interval: row.frequency_interval || 1,
      days_of_week: row.days_of_week,
      specific_dates: row.specific_dates,
      created_at: row.created_at,
    };

    result.push({
      ...ritual,
      frequency,
      step_definitions: stepDefinitions as AnyStepDefinition[],
    });
  }

  return result;
};

const shouldRitualBeScheduledForDate = (
  frequencyType: RitualFrequencyType,
  frequencyInterval: number,
  daysOfWeek: number[] | undefined,
  specificDates: string[] | undefined,
  targetDate: string,
  dayOfWeek: number
): boolean => {
  switch (frequencyType) {
    case "daily":
      return true;
    case "weekly":
      return daysOfWeek ? daysOfWeek.includes(dayOfWeek) : false;
    case "custom":
      return specificDates ? specificDates.includes(targetDate) : false;
    case "once":
      return true;
    default:
      return false;
  }
};

// ===========================================
// DAILY SCHEDULE API
// ===========================================

/**
 * GET /daily-schedule?date=YYYY-MM-DD&include_completed=true&timezone=UTC
 * Get user's daily schedule for a specific date
 */
export const getDailySchedule = asyncHandler(
  async function getDailyScheduleHandler(req: Request) {
    if (!req.userId) {
      return new UnauthorizedError("Authentication required").neverThrow();
    }

    const validatedQuery = getUserScheduleSchema.parse(req.query);
    const date = validatedQuery.date;
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Get completed rituals for the date
    const completions = await db
      .selectFrom("ritual_completions")
      .selectAll()
      .where("user_id", "=", req.userId)
      .where("completed_date", "=", date)
      .execute();

    const completedRituals: RitualCompletionWithSteps[] = [];

    for (const completion of completions) {
      const ritualWithConfig = await getRitualWithConfig(completion.ritual_id);

      const stepResponses = await db
        .selectFrom("step_responses")
        .leftJoin(
          "step_definitions",
          "step_responses.step_definition_id",
          "step_definitions.id"
        )
        .selectAll("step_responses")
        .selectAll("step_definitions")
        .where("ritual_completion_id", "=", completion.id)
        .execute();

      const stepResponsesWithDefinition = stepResponses.map((row) => ({
        id: row.id,
        ritual_completion_id: row.ritual_completion_id,
        step_definition_id: row.step_definition_id,
        value: row.value,
        response_time_ms: row.response_time_ms,
        created_at: row.created_at,
        step_definition: {
          id: row.step_definition_id,
          ritual_id: row.ritual_id!,
          order_index: row.order_index!,
          type: row.type!,
          name: row.name!,
          config: row.config!,
          is_required: row.is_required!,
          created_at: row.created_at,
        } as AnyStepDefinition,
      }));

      completedRituals.push({
        ...completion,
        ritual_with_config: ritualWithConfig,
        step_responses: stepResponsesWithDefinition,
      });
    }

    // Get scheduled rituals for the date
    const ritualsWithFrequencies = await db
      .selectFrom("rituals")
      .leftJoin(
        "ritual_frequencies",
        "rituals.id",
        "ritual_frequencies.ritual_id"
      )
      .selectAll("rituals")
      .selectAll("ritual_frequencies")
      .where("rituals.user_id", "=", req.userId)
      .where("rituals.is_active", "=", true)
      .execute();

    const scheduledRituals: RitualWithConfig[] = [];

    for (const row of ritualsWithFrequencies) {
      if (!row.frequency_type) continue;
      if (completedRituals.some((c) => c.ritual_id === row.ritual_id)) continue;

      const shouldSchedule = shouldRitualBeScheduledForDate(
        row.frequency_type as RitualFrequencyType,
        row.frequency_interval || 1,
        row.days_of_week || undefined,
        row.specific_dates || undefined,
        date,
        dayOfWeek
      );

      if (shouldSchedule) {
        const stepDefinitions = await db
          .selectFrom("step_definitions")
          .selectAll()
          .where("ritual_id", "=", row.ritual_id!)
          .orderBy("order_index")
          .execute();

        const ritual: Ritual = {
          id: row.ritual_id!,
          user_id: row.user_id,
          name: row.name,
          description: row.description,
          category: row.category,
          location: row.location,
          gear: row.gear,
          is_public: row.is_public,
          is_active: row.is_active,
          forked_from_id: row.forked_from_id,
          fork_count: row.fork_count,
          completion_count: row.completion_count,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };

        const frequency: RitualFrequency = {
          id: row.id,
          ritual_id: row.id,
          frequency_type: row.frequency_type as RitualFrequencyType,
          frequency_interval: row.frequency_interval || 1,
          days_of_week: row.days_of_week,
          specific_dates: row.specific_dates,
          created_at: row.created_at,
        };

        scheduledRituals.push({
          ...ritual,
          frequency,
          step_definitions: stepDefinitions as AnyStepDefinition[],
        });
      }
    }
    const schedule: UserDailySchedule = {
      user_id: req.userId,
      date,
      scheduled_rituals: scheduledRituals,
      completed_rituals: completedRituals,
    };

    return ok({
      data: schedule,
      message: "Daily schedule fetched successfully",
      status_code: 200,
      success: true,
    });
  }
);

// ===========================================
// PUBLIC RITUALS API
// ===========================================

/**
 * GET /rituals/public?category=&limit=&offset=&search=
 * Get public rituals library (paginated)
 */
export const getPublicRituals = asyncHandler(
  async function getPublicRitualsHandler(req: Request) {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const category = req.query.category as RitualCategory | undefined;
    const search = req.query.search as string | undefined;

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      return new BadRequestError(
        "Limit must be between 1 and 100"
      ).neverThrow();
    }

    if (offset < 0) {
      return new BadRequestError("Offset must be non-negative").neverThrow();
    }

    let query = db
      .selectFrom("rituals")
      .leftJoin(
        "ritual_frequencies",
        "rituals.id",
        "ritual_frequencies.ritual_id"
      )
      .selectAll("rituals")
      .selectAll("ritual_frequencies")
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

    // Get total count
    // Separate query for count only
    let countQuery = db
      .selectFrom("rituals")
      .leftJoin(
        "ritual_frequencies",
        "rituals.id",
        "ritual_frequencies.ritual_id"
      )
      .select((eb) => eb.fn.count("rituals.id").distinct().as("total"))
      .where("rituals.is_public", "=", true);

    // Apply same filters to count query
    if (category) {
      countQuery = countQuery.where("rituals.category", "=", category);
    }
    if (search) {
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("rituals.name", "ilike", `%${search}%`),
          eb("rituals.description", "ilike", `%${search}%`),
        ])
      );
    }

    const countResult = await countQuery.executeTakeFirst();
    const total = Number(countResult?.total || 0);

    // Get paginated data
    const rituals = await query
      .limit(limit)
      .offset(offset)
      .orderBy("rituals.created_at", "desc")
      .execute();

    const ritualsWithConfig = await buildRitualsWithConfig(
      rituals as (Ritual & RitualFrequency)[]
    );

    return ok({
      data: { rituals: ritualsWithConfig, total },
      message: "Public rituals fetched successfully",
      status_code: 200,
      success: true,
    });
  }
);

// ===========================================
// USER RITUALS API
// ===========================================

/**
 * GET /rituals?filter=all|public|private&category=&limit=&offset=&search=
 * Get user's rituals (private and public, filterable)
 */
export const getUserRituals = asyncHandler(async function getUserRitualsHandler(
  req: Request
) {
  if (!req.userId) {
    return new UnauthorizedError("Authentication required").neverThrow();
  }

  const filter = req.query.filter as "all" | "public" | "private" | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const category = req.query.category as RitualCategory | undefined;
  const search = req.query.search as string | undefined;

  // Validate filter
  if (filter && !["all", "public", "private"].includes(filter)) {
    return new BadRequestError(
      "Filter must be one of: all, public, private"
    ).neverThrow();
  }

  // Validate limit and offset
  if (limit < 1 || limit > 100) {
    return new BadRequestError("Limit must be between 1 and 100").neverThrow();
  }

  if (offset < 0) {
    return new BadRequestError("Offset must be non-negative").neverThrow();
  }

  let query = db
    .selectFrom("rituals")
    .leftJoin(
      "ritual_frequencies",
      "rituals.id",
      "ritual_frequencies.ritual_id"
    )
    .selectAll("rituals")
    .selectAll("ritual_frequencies")
    .where("rituals.user_id", "=", req.userId);

  // Apply visibility filter
  if (filter === "public") {
    query = query.where("rituals.is_public", "=", true);
  } else if (filter === "private") {
    query = query.where("rituals.is_public", "=", false);
  }

  // Apply other filters
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

  // Separate query for count only
  let countQuery = db
    .selectFrom("rituals")
    .leftJoin(
      "ritual_frequencies",
      "rituals.id",
      "ritual_frequencies.ritual_id"
    )
    .select((eb) => eb.fn.count("rituals.id").distinct().as("total"))
    .where("rituals.is_public", "=", true);

  // Apply same filters to count query
  if (category) {
    countQuery = countQuery.where("rituals.category", "=", category);
  }
  if (search) {
    countQuery = countQuery.where((eb) =>
      eb.or([
        eb("rituals.name", "ilike", `%${search}%`),
        eb("rituals.description", "ilike", `%${search}%`),
      ])
    );
  }

  const countResult = await countQuery.executeTakeFirst();
  const total = Number(countResult?.total || 0);

  // Get paginated data
  const rituals = await query
    .limit(limit)
    .offset(offset)
    .orderBy("rituals.created_at", "desc")
    .execute();

  const ritualsWithConfig = await buildRitualsWithConfig(
    rituals as (Ritual & RitualFrequency)[]
  );

  return ok({
    data: { rituals: ritualsWithConfig, total },
    message: "User rituals fetched successfully",
    status_code: 200,
    success: true,
  });
});

// ===========================================
// BASIC RITUAL CRUD
// ===========================================

/**
 * POST /rituals
 * Create a new ritual
 */
export const createRitual = asyncHandler(async function createRitualHandler(
  req: Request
) {
  if (!req.userId) {
    return new UnauthorizedError("Authentication required").neverThrow();
  }

  const validatedData = createRitualSchema.parse(req.body);
  const transformedData = transformCreateRitual(validatedData, req.userId);

  const ritual = await db.transaction().execute(async (trx) => {
    // Create ritual
    const createdRitual = await trx
      .insertInto("rituals")
      .values(transformedData.ritual)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Create frequency
    const frequency = await trx
      .insertInto("ritual_frequencies")
      .values(transformedData.frequency)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Create step definitions
    const stepDefinitions: AnyStepDefinition[] = [];
    for (const step of transformedData.step_definitions) {
      const stepDef = await trx
        .insertInto("step_definitions")
        .values(step)
        .returningAll()
        .executeTakeFirstOrThrow();

      stepDefinitions.push(stepDef as AnyStepDefinition);
    }

    return {
      ...createdRitual,
      frequency,
      step_definitions: stepDefinitions,
    };
  });

  return ok({
    data: ritual,
    message: "Ritual created successfully",
    status_code: 201,
    success: true,
  });
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
    return new BadRequestError("Ritual ID is required").neverThrow();
  }

  const ritual = await getRitualWithConfig(id);

  return ok({
    data: ritual,
    message: "Ritual fetched successfully",
    status_code: 200,
    success: true,
  });
});

/**
 * PUT /rituals/:id
 * Update ritual
 */
export const updateRitual = asyncHandler(async function updateRitualHandler(
  req: Request
) {
  if (!req.userId) {
    return new UnauthorizedError("Authentication required").neverThrow();
  }

  const { id } = req.params;
  if (!id) {
    return new BadRequestError("Ritual ID is required").neverThrow();
  }

  const validatedData = updateRitualSchema.parse(req.body);
  const transformedData = transformUpdateRitual(validatedData);

  const ritual = await db.transaction().execute(async (trx) => {
    // Update ritual if changes provided
    if (Object.keys(transformedData.ritual_updates).length > 0) {
      await trx
        .updateTable("rituals")
        .set(transformedData.ritual_updates)
        .where("id", "=", id)
        .where("user_id", "=", req.userId!)
        .execute();
    }

    // Update frequency if changes provided
    if (Object.keys(transformedData.frequency_updates).length > 0) {
      await trx
        .updateTable("ritual_frequencies")
        .set(transformedData.frequency_updates)
        .where("ritual_id", "=", id)
        .execute();
    }

    return await getRitualWithConfig(id);
  });

  return ok({
    data: ritual,
    message: "Ritual updated successfully",
    status_code: 200,
    success: true,
  });
});

/**
 * DELETE /rituals/:id
 * Delete ritual
 */
export const deleteRitual = asyncHandler(async function deleteRitualHandler(
  req: Request
) {
  if (!req.userId) {
    return new UnauthorizedError("Authentication required").neverThrow();
  }

  const { id } = req.params;
  if (!id) {
    return new BadRequestError("Ritual ID is required").neverThrow();
  }

  const result = await db
    .deleteFrom("rituals")
    .where("id", "=", id)
    .where("user_id", "=", req.userId)
    .execute();

  if (result.length === 0) {
    throw new Error("Ritual not found or access denied");
  }

  return ok({
    data: { message: "Ritual deleted successfully" },
    message: "Ritual deleted successfully",
    status_code: 204,
    success: true,
  });
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
) {
  if (!req.userId) {
    return new UnauthorizedError("Authentication required").neverThrow();
  }

  const { id } = req.params;
  if (!id) {
    return new BadRequestError("Ritual ID is required").neverThrow();
  }

  const completionData = { ...req.body, ritual_id: id };
  const validatedData = completeRitualSchema.parse(completionData);
  const transformedData = transformCompleteRitual(validatedData, req.userId);

  const completion = await db.transaction().execute(async (trx) => {
    // Create ritual completion
    const createdCompletion = await trx
      .insertInto("ritual_completions")
      .values(transformedData.ritual_completion)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Create step responses
    for (const stepResponse of transformedData.step_responses) {
      await trx
        .insertInto("step_responses")
        .values(stepResponse)
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    // Get ritual with config
    const ritualWithConfig = await getRitualWithConfig(id);

    // Get step responses with definitions
    const stepResponsesWithDef = await trx
      .selectFrom("step_responses")
      .leftJoin(
        "step_definitions",
        "step_responses.step_definition_id",
        "step_definitions.id"
      )
      .selectAll("step_responses")
      .selectAll("step_definitions")
      .where("ritual_completion_id", "=", createdCompletion.id)
      .execute();

    const stepResponsesWithDefinition = stepResponsesWithDef.map((row) => ({
      id: row.id,
      ritual_completion_id: row.ritual_completion_id,
      step_definition_id: row.step_definition_id,
      value: row.value,
      response_time_ms: row.response_time_ms,
      created_at: row.created_at,
      step_definition: {
        id: row.step_definition_id,
        ritual_id: row.ritual_id!,
        order_index: row.order_index!,
        type: row.type!,
        name: row.name!,
        config: row.config!,
        is_required: row.is_required!,
        created_at: row.created_at,
      } as AnyStepDefinition,
    }));

    return {
      ...createdCompletion,
      ritual_with_config: ritualWithConfig,
      step_responses: stepResponsesWithDefinition,
    };
  });

  return ok({
    data: completion,
    message: "Ritual completed successfully",
    status_code: 201,
    success: true,
  });
});

/**
 * PUT /rituals/:id/complete
 * Update a ritual completion
 */
export const updateRitualCompletion = asyncHandler(
  async function updateRitualCompletionHandler(req: Request) {
    if (!req.userId) {
      return new UnauthorizedError("Authentication required").neverThrow();
    }

    const { id } = req.params;
    if (!id) {
      return new BadRequestError("Ritual ID is required").neverThrow();
    }

    const completionData = { ...req.body, ritual_id: id };
    const validatedData = updateRitualCompletionSchema.parse(completionData);
    const transformedData = transformUpdateRitualCompletion(validatedData);

    const completion = await db.transaction().execute(async (trx) => {
      // Update ritual completion
      const updatedCompletion = await trx
        .updateTable("ritual_completions")
        .set(transformedData.ritual_completion)
        .where("id", "=", transformedData.ritual_completion.id!)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Update step responses
      for (const { id, ...stepResponse } of transformedData.step_responses) {
        await trx
          .updateTable("step_responses")
          .set(stepResponse)
          .where("id", "=", id!)
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      // Get ritual with config
      const ritualWithConfig = await getRitualWithConfig(id);

      // Get step responses with definitions
      const stepResponsesWithDef = await trx
        .selectFrom("step_responses")
        .leftJoin(
          "step_definitions",
          "step_responses.step_definition_id",
          "step_definitions.id"
        )
        .selectAll("step_responses")
        .selectAll("step_definitions")
        .where(
          "ritual_completion_id",
          "=",
          transformedData.ritual_completion.id!
        )
        .execute();

      const stepResponsesWithDefinition = stepResponsesWithDef.map((row) => ({
        id: row.id,
        ritual_completion_id: row.ritual_completion_id,
        step_definition_id: row.step_definition_id,
        value: row.value,
        response_time_ms: row.response_time_ms,
        created_at: row.created_at,
        step_definition: {
          id: row.step_definition_id,
          ritual_id: row.ritual_id!,
          order_index: row.order_index!,
          type: row.type!,
          name: row.name!,
          config: row.config!,
          is_required: row.is_required!,
          created_at: row.created_at,
        } as AnyStepDefinition,
      }));

      return {
        ...updatedCompletion,
        ritual_with_config: ritualWithConfig,
        step_responses: stepResponsesWithDefinition,
      };
    });

    return ok({
      data: completion,
      message: "Ritual completion updated successfully",
      status_code: 201,
      success: true,
    });
  }
);

// ===========================================
// QUICK STEP OPERATIONS
// ===========================================

/**
 * POST /rituals/:id/quick-step
 * Create a quick step response
 */
export const createQuickStepResponse = asyncHandler(
  async function createQuickStepResponseHandler(req: Request) {
    if (!req.userId) {
      return new UnauthorizedError("Authentication required").neverThrow();
    }

    const validatedData = quickStepResponseSchema.parse(req.body);
    const transformedData = transformQuickStepResponse(validatedData);

    const stepResponse = await db
      .insertInto("step_responses")
      .values(transformedData.step_response)
      .returningAll()
      .executeTakeFirstOrThrow();

    return ok({
      data: stepResponse,
      message: "Quick step response created successfully",
      status_code: 201,
      success: true,
    });
  }
);

/**
 * PUT /rituals/:id/quick-update
 * Update a step response
 */
export const updateQuickStepResponse = asyncHandler(
  async function updateQuickStepResponseHandler(req: Request) {
    if (!req.userId) {
      return new UnauthorizedError("Authentication required").neverThrow();
    }

    const validatedData = quickUpdateResponseSchema.parse(req.body);
    const transformedData = transformQuickUpdateResponse(validatedData);

    const stepResponse = await db
      .updateTable("step_responses")
      .set(transformedData.step_update)
      .where("id", "=", validatedData.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return ok({
      data: stepResponse,
      message: "Quick step response updated successfully",
      status_code: 200,
      success: true,
    });
  }
);

// ===========================================
// BATCH OPERATIONS
// ===========================================

/**
 * POST /rituals/batch-complete
 * Complete multiple rituals at once
 */
export const batchCompleteRituals = asyncHandler(
  async function batchCompleteRitualsHandler(req: Request) {
    if (!req.userId) {
      return new UnauthorizedError("Authentication required").neverThrow();
    }

    const validatedData = batchCompleteRitualsSchema.parse(req.body);
    const transformedData = transformBatchCompleteRituals(
      validatedData,
      req.userId
    );

    const completions = await db.transaction().execute(async (trx) => {
      // Create all ritual completions
      const createdCompletions = [];
      for (const completion of transformedData.ritual_completions) {
        const createdCompletion = await trx
          .insertInto("ritual_completions")
          .values(completion)
          .returningAll()
          .executeTakeFirstOrThrow();
        createdCompletions.push(createdCompletion);
      }

      // Create all step responses
      for (const stepResponse of transformedData.step_responses) {
        await trx
          .insertInto("step_responses")
          .values(stepResponse)
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      return createdCompletions;
    });

    return ok({
      data: {
        completions,
        total_completed: completions.length,
      },
      message: `${completions.length} rituals completed successfully!`,
      status_code: 201,
      success: true,
    });
  }
);

// ===========================================
// ADDITIONAL RITUAL ACTIONS
// ===========================================

/**
 * POST /rituals/:id/fork
 * Fork a public ritual to user's library
 */
export const forkRitual = asyncHandler(async function forkRitualHandler(
  req: Request
) {
  if (!req.userId) {
    return new UnauthorizedError("Authentication required").neverThrow();
  }

  const { id } = req.params;
  if (!id) {
    return new BadRequestError("Ritual ID is required").neverThrow();
  }

  const originalRitual = await getRitualWithConfig(id);

  // Check if ritual is public or user owns it
  if (!originalRitual.is_public && originalRitual.user_id !== req.userId) {
    return new ForbiddenError("Cannot fork private ritual").neverThrow();
  }

  const forkedRitual = await db.transaction().execute(async (trx) => {
    // Create new ritual
    const ritual = await trx
      .insertInto("rituals")
      .values({
        user_id: req.userId!,
        name: `${originalRitual.name} (Copy)`,
        description: originalRitual.description,
        category: originalRitual.category,
        location: originalRitual.location,
        gear: originalRitual.gear,
        is_public: false,
        is_active: true,
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
    const stepDefinitions: AnyStepDefinition[] = [];
    for (const step of originalRitual.step_definitions) {
      const stepDef = await trx
        .insertInto("step_definitions")
        .values({
          ritual_id: ritual.id,
          order_index: step.order_index,
          type: step.type,
          name: step.name,
          config: JSON.stringify(step.config),
          is_required: step.is_required,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      stepDefinitions.push(stepDef as AnyStepDefinition);
    }

    return {
      ...ritual,
      frequency,
      step_definitions: stepDefinitions,
    };
  });

  return ok({
    data: forkedRitual,
    message: "Ritual forked successfully",
    status_code: 201,
    success: true,
  });
});

/**
 * POST /rituals/:id/publish
 * Publish a ritual to make it public
 */
export const publishRitual = asyncHandler(async function publishRitualHandler(
  req: Request
) {
  if (!req.userId) {
    return new UnauthorizedError("Authentication required").neverThrow();
  }

  const { id } = req.params;
  if (!id) {
    return new BadRequestError("Ritual ID is required").neverThrow();
  }

  await db
    .updateTable("rituals")
    .set({ is_public: true })
    .where("id", "=", id)
    .where("user_id", "=", req.userId)
    .execute();

  const ritual = await getRitualWithConfig(id);

  return ok({
    data: ritual,
    message: "Ritual published successfully",
    status_code: 200,
    success: true,
  });
});

/**
 * POST /rituals/:id/unpublish
 * Unpublish a ritual to make it private
 */
export const unpublishRitual = asyncHandler(
  async function unpublishRitualHandler(req: Request) {
    if (!req.userId) {
      return new UnauthorizedError("Authentication required").neverThrow();
    }

    const { id } = req.params;
    if (!id) {
      return new BadRequestError("Ritual ID is required").neverThrow();
    }

    await db
      .updateTable("rituals")
      .set({ is_public: false })
      .where("id", "=", id)
      .where("user_id", "=", req.userId)
      .execute();

    const ritual = await getRitualWithConfig(id);

    return ok({
      data: ritual,
      message: "Ritual unpublished successfully",
      status_code: 200,
      success: true,
    });
  }
);

// ===========================================
// RITUAL STATISTICS
// ===========================================

/**
 * GET /rituals/:id/stats
 * Get ritual completion statistics
 */
export const getRitualStats = asyncHandler(async function getRitualStatsHandler(
  req: Request
) {
  if (!req.userId) {
    return new UnauthorizedError("Authentication required").neverThrow();
  }

  const { id } = req.params;
  if (!id) {
    return new BadRequestError("Ritual ID is required").neverThrow();
  }

  // Get basic completion stats
  const completions = await db
    .selectFrom("ritual_completions")
    .select([
      db.fn.count("id").as("total_completions"),
      db.fn.avg("duration_seconds").as("avg_duration"),
    ])
    .where("ritual_id", "=", id)
    .where("user_id", "=", req.userId)
    .groupBy("ritual_id")
    .executeTakeFirst();

  // Get recent completions
  const recentCompletions = await db
    .selectFrom("ritual_completions")
    .selectAll()
    .where("ritual_id", "=", id)
    .where("user_id", "=", req.userId)
    .orderBy("completed_at", "desc")
    .limit(10)
    .execute();

  const stats = {
    total_completions: Number(completions?.total_completions || 0),
    avg_duration: Number(completions?.avg_duration || 0),
    recent_completions: recentCompletions,
  };

  return ok({
    data: stats,
    message: "Ritual stats fetched successfully",
    status_code: 200,
    success: true,
  });
});
