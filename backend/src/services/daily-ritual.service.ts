import { v4 } from "uuid";
import { db } from "../database/connection";
import {
  CreateDailyRitualRequest,
  UpdateDailyRitualRequest,
  DailyRitual,
  DailyStep,
  Ritual,
  Step,
} from "../types/api";
import {
  DailyRitualRow,
  DailyStepRow,
  RitualRow,
  StepRow,
  StepAnswer,
} from "../types/database";
import { NotFoundError, ValidationError } from "../utils/errors";

export class DailyRitualService {
  async createDailyRitual(
    userId: string,
    data: CreateDailyRitualRequest
  ): Promise<DailyRitual> {
    // First check if ritual exists and belongs to user or is public
    const ritual = await db
      .selectFrom("rituals")
      .selectAll()
      .where("id", "=", data.ritual_id)
      .where((eb) =>
        eb.or([
          eb("user_id", "=", userId), // User's own ritual
          eb("is_public", "=", true), // Public ritual
        ])
      )
      .executeTakeFirst();

    if (!ritual) {
      throw new NotFoundError("Ritual not found or access denied");
    }

    // Check if daily ritual already exists for this date
    const existingDailyRitual = await db
      .selectFrom("daily_rituals")
      .select("id")
      .where("user_id", "=", userId)
      .where("ritual_id", "=", data.ritual_id)
      .where("scheduled_date", "=", new Date(data.scheduled_date))
      .executeTakeFirst();

    if (existingDailyRitual) {
      throw new ValidationError("Daily ritual already exists for this date");
    }

    let now = new Date();
    // Create daily ritual instance
    const dailyRitual = await db
      .insertInto("daily_rituals")
      .values({
        user_id: userId,
        ritual_id: data.ritual_id,
        scheduled_date: new Date(data.scheduled_date),
        scheduled_time: data.scheduled_time || null,
        completed: false,
        created_at: now,
        id: v4(),
        updated_at: now,
        was_modified: false,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Get ritual steps
    const steps = await db
      .selectFrom("steps")
      .selectAll()
      .where("ritual_id", "=", data.ritual_id)
      .orderBy("order_index", "asc")
      .execute();

    // Create daily step instances
    const dailyStepPromises = steps.map((step) =>
      db
        .insertInto("daily_steps")
        .values({
          daily_ritual_id: dailyRitual.id,
          step_id: step.id,
          completed: false,
          created_at: now,
          id: v4(),
          skipped: false,
          updated_at: now,
          was_modified: false,
        })
        .returningAll()
        .executeTakeFirstOrThrow()
    );

    const dailySteps = await Promise.all(dailyStepPromises);

    return this.formatDailyRitual(dailyRitual, ritual, steps, dailySteps);
  }

  async getDailyRitualsByDate(
    userId: string,
    date: string
  ): Promise<DailyRitual[]> {
    const dailyRituals = await db
      .selectFrom("daily_rituals")
      .selectAll()
      .where("user_id", "=", userId)
      .where("scheduled_date", "=", new Date(date))
      .execute();

    const results: DailyRitual[] = [];

    for (const dailyRitual of dailyRituals) {
      // Get ritual details
      const ritual = await db
        .selectFrom("rituals")
        .selectAll()
        .where("id", "=", dailyRitual.ritual_id)
        .executeTakeFirstOrThrow();

      // Get ritual steps
      const steps = await db
        .selectFrom("steps")
        .selectAll()
        .where("ritual_id", "=", dailyRitual.ritual_id)
        .orderBy("order_index", "asc")
        .execute();

      // Get daily step instances
      const dailySteps = await db
        .selectFrom("daily_steps")
        .selectAll()
        .where("daily_ritual_id", "=", dailyRitual.id)
        .execute();

      results.push(
        this.formatDailyRitual(dailyRitual, ritual, steps, dailySteps)
      );
    }

    return results;
  }

  async updateDailyRitual(
    userId: string,
    dailyRitualId: string,
    data: UpdateDailyRitualRequest
  ): Promise<DailyRitual> {
    // Verify ownership
    const dailyRitual = await db
      .selectFrom("daily_rituals")
      .selectAll()
      .where("id", "=", dailyRitualId)
      .where("user_id", "=", userId)
      .executeTakeFirst();

    if (!dailyRitual) {
      throw new NotFoundError("Daily ritual not found");
    }

    // Update daily ritual basic info
    let updatedDailyRitual = dailyRitual;
    if (data.scheduled_time !== undefined) {
      updatedDailyRitual = await db
        .updateTable("daily_rituals")
        .set({
          scheduled_time: data.scheduled_time,
        })
        .where("id", "=", dailyRitualId)
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    // Update steps if provided
    if (data.steps) {
      for (const stepUpdate of data.steps) {
        await db
          .updateTable("daily_steps")
          .set({
            completed: stepUpdate.completed,
            skipped: stepUpdate.skipped,
            answer: stepUpdate.answer as any, // Type assertion for JSONB
            was_modified: stepUpdate.was_modified,
            completed_at: stepUpdate.completed ? new Date() : undefined,
          })
          .where("daily_ritual_id", "=", dailyRitualId)
          .where("step_id", "=", stepUpdate.step_id)
          .execute();
      }

      // Check if all steps are completed to mark ritual as completed
      const allSteps = await db
        .selectFrom("daily_steps")
        .select(["completed", "skipped"])
        .where("daily_ritual_id", "=", dailyRitualId)
        .execute();

      const allCompleted = allSteps.every(
        (step) => step.completed || step.skipped
      );
      if (allCompleted && !updatedDailyRitual.completed) {
        updatedDailyRitual = await db
          .updateTable("daily_rituals")
          .set({
            completed: true,
            completed_at: new Date(),
          })
          .where("id", "=", dailyRitualId)
          .returningAll()
          .executeTakeFirstOrThrow();
      }
    }

    // Get updated data for response
    const ritual = await db
      .selectFrom("rituals")
      .selectAll()
      .where("id", "=", updatedDailyRitual.ritual_id)
      .executeTakeFirstOrThrow();

    const steps = await db
      .selectFrom("steps")
      .selectAll()
      .where("ritual_id", "=", updatedDailyRitual.ritual_id)
      .orderBy("order_index", "asc")
      .execute();

    const dailySteps = await db
      .selectFrom("daily_steps")
      .selectAll()
      .where("daily_ritual_id", "=", dailyRitualId)
      .execute();

    return this.formatDailyRitual(
      updatedDailyRitual,
      ritual,
      steps,
      dailySteps
    );
  }

  async deleteDailyRitual(
    userId: string,
    dailyRitualId: string
  ): Promise<void> {
    const result = await db
      .deleteFrom("daily_rituals")
      .where("id", "=", dailyRitualId)
      .where("user_id", "=", userId)
      .execute();

    if (result.length === 0) {
      throw new NotFoundError("Daily ritual not found");
    }
  }

  private formatDailyRitual(
    dailyRitual: DailyRitualRow,
    ritual: RitualRow,
    steps: StepRow[],
    dailySteps: DailyStepRow[]
  ): DailyRitual {
    // Format ritual
    const formattedRitual: Ritual = {
      id: ritual.id,
      name: ritual.name,
      description: ritual.description || undefined,
      category: ritual.category || undefined,
      location: ritual.location || undefined,
      gear: ritual.gear || undefined,
      is_public: ritual.is_public,
      forked_from_id: ritual.forked_from_id || undefined,
      fork_count: ritual.fork_count,
      completion_count: ritual.completion_count,
      frequency_type: ritual.frequency_type,
      frequency_interval: ritual.frequency_interval,
      frequency_data: ritual.frequency_data || undefined,
      is_active: ritual.is_active,
      steps: [], // Will be filled below
      user_id: ritual.user_id,
      created_at: ritual.created_at.toISOString(),
      updated_at: ritual.updated_at.toISOString(),
    };

    // Format daily steps
    const formattedDailySteps: DailyStep[] = steps.map((step) => {
      const dailyStep = dailySteps.find((ds) => ds.step_id === step.id);

      return {
        id: step.id,
        type: step.type,
        name: step.name,
        question: step.question || undefined,
        weightlifting_config: step.weightlifting_config || undefined,
        cardio_config: step.cardio_config || undefined,
        custom_config: step.custom_config || undefined,
        order_index: step.order_index,
        completed: dailyStep?.completed || false,
        skipped: dailyStep?.skipped || false,
        answer: dailyStep?.answer || undefined,
        was_modified: dailyStep?.was_modified || false,
        completed_at: dailyStep?.completed_at?.toISOString(),
      };
    });

    // Add steps to ritual
    formattedRitual.steps = steps.map((step) => ({
      id: step.id,
      type: step.type,
      name: step.name,
      question: step.question || undefined,
      weightlifting_config: step.weightlifting_config || undefined,
      cardio_config: step.cardio_config || undefined,
      custom_config: step.custom_config || undefined,
      order_index: step.order_index,
    }));

    return {
      id: dailyRitual.id,
      user_id: dailyRitual.user_id,
      ritual: formattedRitual,
      scheduled_date: dailyRitual.scheduled_date.toISOString().split("T")[0],
      scheduled_time: dailyRitual.scheduled_time || undefined,
      completed: dailyRitual.completed,
      was_modified: dailyRitual.was_modified,
      completed_at: dailyRitual.completed_at?.toISOString(),
      steps: formattedDailySteps,
    };
  }
}
