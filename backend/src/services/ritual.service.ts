import { v4 as uuidv4 } from "uuid";
import { db } from "../database/connection";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../middleware/error-handler";
import type {
  RitualRow,
  StepRow,
  WeightliftingConfig,
  CardioConfig,
  CustomConfig,
} from "../types/database";
import type { Ritual, Step } from "../types/api";
import type {
  CreateRitualRequest,
  UpdateRitualRequest,
  PublicRitualQuery,
} from "../utils/validation";

export class RitualService {
  /**
   * Convert API config to database config (undefined -> null)
   */
  private convertWeightliftingConfig(
    config?: CreateRitualRequest["steps"][number]["weightlifting_config"]
  ) {
    if (!config || config.length === 0) return null;
    return JSON.stringify(
      config.map((item) => ({
        reps: item.reps,
        weight: item.weight,
        completed: item.completed ?? null,
      }))
    ) as unknown as WeightliftingConfig[] | null;
  }

  private convertCardioConfig(
    config?: CreateRitualRequest["steps"][number]["cardio_config"]
  ) {
    if (!config || config.length === 0) return null;
    return JSON.stringify(
      config.map((item) => ({
        time: item.time,
        distance: item.distance,
        completed: item.completed ?? null,
      }))
    ) as unknown as CardioConfig[] | null;
  }

  private convertCustomConfig(
    config?: CreateRitualRequest["steps"][number]["custom_config"]
  ) {
    if (!config) return null;
    return JSON.stringify({
      label: config.label,
      unit: config.unit,
    }) as unknown as CustomConfig | null;
  }
  /**
   * Create a new ritual
   */
  async createRitual(
    userId: string,
    data: CreateRitualRequest
  ): Promise<Ritual> {
    const {
      name,
      description,
      category,
      location,
      gear,
      steps,
      is_public,
      frequency_interval,
      frequency_type,
      frequency_data,
    } = data;

    const ritualId = uuidv4();
    const now = new Date();

    // Start transaction
    return await db.transaction().execute(async (trx) => {
      // Create ritual
      const ritual = await trx
        .insertInto("rituals")
        .values({
          id: ritualId,
          user_id: userId,
          name,
          description: description || null,
          category: category || null,
          location: location || null,
          gear: gear || null,
          is_public: is_public,
          forked_from_id: null,
          fork_count: 0,
          completion_count: 0,
          created_at: now,
          updated_at: now,
          frequency_interval,
          frequency_type,
          frequency_data,
          is_active: false,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Create steps
      const stepInserts: StepRow[] = steps.map((step, index) => ({
        id: uuidv4(),
        ritual_id: ritualId,
        order_index: index,
        type: step.type,
        name: step.name,
        question: step.question || null,
        weightlifting_config: this.convertWeightliftingConfig(
          step.weightlifting_config
        ),
        cardio_config: this.convertCardioConfig(step.cardio_config),
        custom_config: this.convertCustomConfig(step.custom_config),
        created_at: now,
        updated_at: now,
      }));

      const createdSteps = await trx
        .insertInto("steps")
        .values(stepInserts)
        .returningAll()
        .execute();

      return this.formatRitualResponse(ritual, createdSteps);
    });
  }

  /**
   * Get user's private rituals
   */
  async getUserRituals(
    userId: string,
    query?: { category?: string; limit?: number; offset?: number }
  ): Promise<{ rituals: Ritual[]; total: number }> {
    const { category, limit = 50, offset = 0 } = query || {};

    let ritualsQuery = db
      .selectFrom("rituals")
      .selectAll()
      .where("user_id", "=", userId)
      .orderBy("created_at", "desc");

    if (category) {
      ritualsQuery = ritualsQuery.where("category", "=", category);
    }

    // Get total count with separate query
    let countQuery = db
      .selectFrom("rituals")
      .select(({ fn }) => [fn.count<number>("id").as("count")])
      .where("user_id", "=", userId);

    if (category) {
      countQuery = countQuery.where("category", "=", category);
    }

    const totalResult = await countQuery.executeTakeFirst();
    const total = totalResult?.count || 0;

    // Get paginated results
    const rituals = await ritualsQuery.limit(limit).offset(offset).execute();

    // Get steps for each ritual
    const ritualsWithSteps = await Promise.all(
      rituals.map(async (ritual) => {
        const steps = await db
          .selectFrom("steps")
          .selectAll()
          .where("ritual_id", "=", ritual.id)
          .orderBy("order_index", "asc")
          .execute();

        return this.formatRitualResponse(ritual, steps);
      })
    );

    return { rituals: ritualsWithSteps, total };
  }

  /**
   * Get public rituals library
   */
  async getPublicRituals(
    query: PublicRitualQuery
  ): Promise<{ rituals: Ritual[]; total: number }> {
    const {
      search,
      category,
      limit = 20,
      offset = 0,
      sort_by = "created_at",
      sort_order = "desc",
    } = query;

    let ritualsQuery = db
      .selectFrom("rituals")
      .selectAll()
      .where("is_public", "=", true);

    if (search) {
      ritualsQuery = ritualsQuery.where((eb) =>
        eb.or([
          eb("name", "ilike", `%${search}%`),
          eb("description", "ilike", `%${search}%`),
          eb("category", "ilike", `%${search}%`),
        ])
      );
    }

    if (category) {
      ritualsQuery = ritualsQuery.where("category", "=", category);
    }

    // Add sorting
    const sortColumn =
      sort_by === "name"
        ? "name"
        : sort_by === "fork_count"
        ? "fork_count"
        : sort_by === "completion_count"
        ? "completion_count"
        : "created_at";

    ritualsQuery = ritualsQuery.orderBy(sortColumn, sort_order || "desc");

    // Get total count with separate query
    let countQuery = db
      .selectFrom("rituals")
      .select(({ fn }) => [fn.count<number>("id").as("count")])
      .where("is_public", "=", true);

    if (search) {
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb("name", "ilike", `%${search}%`),
          eb("description", "ilike", `%${search}%`),
          eb("category", "ilike", `%${search}%`),
        ])
      );
    }

    if (category) {
      countQuery = countQuery.where("category", "=", category);
    }

    const totalResult = await countQuery.executeTakeFirst();
    const total = totalResult?.count || 0;

    // Get paginated results
    const rituals = await ritualsQuery
      .limit(limit || 20)
      .offset(offset || 0)
      .execute();

    // Get steps for each ritual
    const ritualsWithSteps = await Promise.all(
      rituals.map(async (ritual) => {
        const steps = await db
          .selectFrom("steps")
          .selectAll()
          .where("ritual_id", "=", ritual.id)
          .orderBy("order_index", "asc")
          .execute();

        return this.formatRitualResponse(ritual, steps);
      })
    );

    return { rituals: ritualsWithSteps, total };
  }

  /**
   * Get ritual by ID
   */
  async getRitualById(ritualId: string, userId?: string): Promise<Ritual> {
    const ritual = await db
      .selectFrom("rituals")
      .selectAll()
      .where("id", "=", ritualId)
      .executeTakeFirst();

    if (!ritual) {
      throw new NotFoundError("Ritual");
    }

    // Check access permissions
    if (!ritual.is_public && (!userId || ritual.user_id !== userId)) {
      throw new ForbiddenError("Access denied to this ritual");
    }

    const steps = await db
      .selectFrom("steps")
      .selectAll()
      .where("ritual_id", "=", ritualId)
      .orderBy("order_index", "asc")
      .execute();

    return this.formatRitualResponse(ritual, steps);
  }

  /**
   * Update ritual
   */
  async updateRitual(
    ritualId: string,
    userId: string,
    data: UpdateRitualRequest
  ): Promise<Ritual> {
    const { name, description, category, location, gear, steps } = data;

    // Check ownership
    const existingRitual = await db
      .selectFrom("rituals")
      .select(["user_id"])
      .where("id", "=", ritualId)
      .executeTakeFirst();

    if (!existingRitual) {
      throw new NotFoundError("Ritual");
    }

    if (existingRitual.user_id !== userId) {
      throw new ForbiddenError("You can only update your own rituals");
    }

    return await db.transaction().execute(async (trx) => {
      const now = new Date();

      // Update ritual
      const updatedRitual = await trx
        .updateTable("rituals")
        .set({
          name: name !== undefined ? name : undefined,
          description: description !== undefined ? description : undefined,
          category: category !== undefined ? category : undefined,
          location: location !== undefined ? location : undefined,
          gear: gear !== undefined ? gear : undefined,
          updated_at: now,
        })
        .where("id", "=", ritualId)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Update steps if provided
      if (steps) {
        // Delete existing steps
        await trx
          .deleteFrom("steps")
          .where("ritual_id", "=", ritualId)
          .execute();

        // Create new steps
        const stepInserts = steps.map((step, index) => ({
          id: uuidv4(),
          ritual_id: ritualId,
          order_index: index,
          type: step.type,
          name: step.name,
          question: step.question,
          weightlifting_config: this.convertWeightliftingConfig(
            step.weightlifting_config
          ),
          cardio_config: this.convertCardioConfig(step.cardio_config),
          custom_config: this.convertCustomConfig(step.custom_config),
          created_at: now,
          updated_at: now,
        }));

        const newSteps = await trx
          .insertInto("steps")
          .values(stepInserts)
          .returningAll()
          .execute();

        return this.formatRitualResponse(updatedRitual, newSteps);
      }

      // Get existing steps if not updating them
      const existingSteps = await trx
        .selectFrom("steps")
        .selectAll()
        .where("ritual_id", "=", ritualId)
        .orderBy("order_index", "asc")
        .execute();

      return this.formatRitualResponse(updatedRitual, existingSteps);
    });
  }

  /**
   * Delete ritual
   */
  async deleteRitual(ritualId: string, userId: string): Promise<void> {
    // Check ownership
    const ritual = await db
      .selectFrom("rituals")
      .select(["user_id"])
      .where("id", "=", ritualId)
      .executeTakeFirst();

    if (!ritual) {
      throw new NotFoundError("Ritual");
    }

    if (ritual.user_id !== userId) {
      throw new ForbiddenError("You can only delete your own rituals");
    }

    // Delete ritual (steps will be deleted by cascade)
    await db.deleteFrom("rituals").where("id", "=", ritualId).execute();
  }

  /**
   * Fork a public ritual
   */
  async forkRitual(originalRitualId: string, userId: string): Promise<Ritual> {
    // Get original ritual
    const originalRitual = await this.getRitualById(originalRitualId);

    if (!originalRitual.is_public) {
      throw new ForbiddenError("Cannot fork private ritual");
    }

    return await db.transaction().execute(async (trx) => {
      const now = new Date();
      const newRitualId = uuidv4();

      // Create forked ritual
      const forkedRitual = await trx
        .insertInto("rituals")
        .values({
          id: newRitualId,
          user_id: userId,
          name: originalRitual.name,
          description: originalRitual.description || null,
          category: originalRitual.category || null,
          location: originalRitual.location || null,
          gear: originalRitual.gear || null,
          is_public: false,
          forked_from_id: originalRitualId,
          fork_count: 0,
          completion_count: 0,
          created_at: now,
          updated_at: now,
          frequency_interval: originalRitual.frequency_interval,
          frequency_type: originalRitual.frequency_type,
          is_active: originalRitual.is_active,
          frequency_data: originalRitual.frequency_data,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Copy steps
      const stepInserts = originalRitual.steps.map((step, index) => ({
        id: uuidv4(),
        ritual_id: newRitualId,
        order_index: index,
        type: step.type,
        name: step.name,
        question: step.question || null,
        weightlifting_config: step.weightlifting_config || null,
        cardio_config: step.cardio_config || null,
        custom_config: step.custom_config || null,
        created_at: now,
        updated_at: now,
      }));

      const forkedSteps = await trx
        .insertInto("steps")
        .values(stepInserts)
        .returningAll()
        .execute();

      // Increment fork count on original ritual
      await trx
        .updateTable("rituals")
        .set({
          fork_count: (eb) => eb("fork_count", "+", 1),
          updated_at: now,
        })
        .where("id", "=", originalRitualId)
        .execute();

      return this.formatRitualResponse(forkedRitual, forkedSteps);
    });
  }

  /**
   * Publish ritual to public library
   */
  async publishRitual(ritualId: string, userId: string): Promise<Ritual> {
    // Check ownership
    const ritual = await db
      .selectFrom("rituals")
      .selectAll()
      .where("id", "=", ritualId)
      .executeTakeFirst();

    if (!ritual) {
      throw new NotFoundError("Ritual");
    }

    if (ritual.user_id !== userId) {
      throw new ForbiddenError("You can only publish your own rituals");
    }

    if (ritual.is_public) {
      throw new ConflictError("Ritual is already public");
    }

    const updatedRitual = await db
      .updateTable("rituals")
      .set({
        is_public: true,
        updated_at: new Date(),
      })
      .where("id", "=", ritualId)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Get steps
    const steps = await db
      .selectFrom("steps")
      .selectAll()
      .where("ritual_id", "=", ritualId)
      .orderBy("order_index", "asc")
      .execute();

    return this.formatRitualResponse(updatedRitual, steps);
  }

  /**
   * Unpublish ritual from public library
   */
  async unpublishRitual(ritualId: string, userId: string): Promise<Ritual> {
    // Check ownership
    const ritual = await db
      .selectFrom("rituals")
      .selectAll()
      .where("id", "=", ritualId)
      .executeTakeFirst();

    if (!ritual) {
      throw new NotFoundError("Ritual");
    }

    if (ritual.user_id !== userId) {
      throw new ForbiddenError("You can only unpublish your own rituals");
    }

    if (!ritual.is_public) {
      throw new ConflictError("Ritual is already private");
    }

    const updatedRitual = await db
      .updateTable("rituals")
      .set({
        is_public: false,
        updated_at: new Date(),
      })
      .where("id", "=", ritualId)
      .returningAll()
      .executeTakeFirstOrThrow();

    // Get steps
    const steps = await db
      .selectFrom("steps")
      .selectAll()
      .where("ritual_id", "=", ritualId)
      .orderBy("order_index", "asc")
      .execute();

    return this.formatRitualResponse(updatedRitual, steps);
  }

  /**
   * Format ritual response from database rows
   */
  private formatRitualResponse(ritual: RitualRow, steps: StepRow[]): Ritual {
    const formattedSteps: Step[] = steps.map((step) => {
      const formattedStep: Step = {
        id: step.id,
        type: step.type,
        name: step.name,
        order_index: step.order_index,
      };

      // Only add optional fields if they exist
      if (step.question) formattedStep.question = step.question;
      if (step.weightlifting_config)
        formattedStep.weightlifting_config = step.weightlifting_config;
      if (step.cardio_config) formattedStep.cardio_config = step.cardio_config;
      if (step.custom_config) formattedStep.custom_config = step.custom_config;

      return formattedStep;
    });

    const formattedRitual: Ritual = {
      id: ritual.id,
      name: ritual.name,
      is_public: ritual.is_public,
      fork_count: ritual.fork_count,
      completion_count: ritual.completion_count,
      steps: formattedSteps,
      user_id: ritual.user_id,
      created_at: ritual.created_at.toISOString(),
      updated_at: ritual.updated_at.toISOString(),
      frequency_interval: ritual.frequency_interval,
      frequency_type: ritual.frequency_type,
      is_active: ritual.is_active,
      frequency_data: ritual.frequency_data || undefined,
      category: ritual.category || undefined,
      description: ritual.description || undefined,
      forked_from_id: ritual.forked_from_id || undefined,
      gear: ritual.gear || undefined,
      location: ritual.location || undefined,
    };

    // Only add optional fields if they exist
    if (ritual.description) formattedRitual.description = ritual.description;
    if (ritual.category) formattedRitual.category = ritual.category;
    if (ritual.location) formattedRitual.location = ritual.location;
    if (ritual.gear) formattedRitual.gear = ritual.gear;
    if (ritual.forked_from_id)
      formattedRitual.forked_from_id = ritual.forked_from_id;

    return formattedRitual;
  }
}
