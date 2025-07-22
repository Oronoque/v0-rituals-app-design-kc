import { Request, Response } from "express";
import { DailyRitualService } from "../services/daily-ritual.service";
import {
  validateRequestBody,
  validateQuery,
  ValidationError,
} from "../utils/validation";
import { asyncHandler } from "../middleware/error-handler";
import { z } from "zod";
import { UpdateDailyRitualRequest } from "@/types/api";

const dailyRitualService = new DailyRitualService();

// Validation schemas
const createDailyRitualSchema = z.object({
  ritual_id: z.string().uuid("Valid ritual ID required"),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  scheduled_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .optional(),
});

const updateDailyRitualSchema = z.object({
  scheduled_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .optional(),
  steps: z
    .array(
      z.object({
        step_id: z.string().uuid(),
        completed: z.boolean().optional(),
        skipped: z.boolean().optional(),
        answer: z.any().optional(),
        was_modified: z.boolean().optional(),
      })
    )
    .optional(),
});

/**
 * POST /daily-rituals
 * Create a new daily ritual instance
 */
export const createDailyRitual = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.userId) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    const validated = validateRequestBody(createDailyRitualSchema, req.body);
    const data = {
      ritual_id: validated.ritual_id,
      scheduled_date: validated.scheduled_date,
      ...(validated.scheduled_time && {
        scheduled_time: validated.scheduled_time,
      }),
    };
    const dailyRitual = await dailyRitualService.createDailyRitual(
      req.userId,
      data
    );

    res.status(201).json(dailyRitual);
  }
);

/**
 * GET /daily-rituals/:date
 * Get daily rituals for a specific date
 */
export const getDailyRitualsByDate = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.userId) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    const { date } = req.params;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({
        error: "BAD_REQUEST",
        message: "Valid date in YYYY-MM-DD format required",
      });
      return;
    }

    const dailyRituals = await dailyRitualService.getDailyRitualsByDate(
      req.userId,
      date
    );
    res.status(200).json({ dailyRituals });
  }
);

/**
 * PUT /daily-rituals/:id
 * Update a daily ritual
 */
export const updateDailyRitual = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.userId) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        error: "BAD_REQUEST",
        message: "Daily ritual ID is required",
      });
      return;
    }
    const validated = validateRequestBody(updateDailyRitualSchema, req.body);
    const data: UpdateDailyRitualRequest = {
      scheduled_time: validated.scheduled_time,
      steps: validated.steps?.map((step) => ({
        step_id: step.step_id,
        completed: step.completed ?? false,
        skipped: step.skipped ?? false,
        answer: step.answer,
        was_modified: step.was_modified ?? false,
      })),
    };
    const dailyRitual = await dailyRitualService.updateDailyRitual(
      req.userId,
      id,
      data
    );

    res.status(200).json(dailyRitual);
  }
);

/**
 * DELETE /daily-rituals/:id
 * Delete a daily ritual
 */
export const deleteDailyRitual = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.userId) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        error: "BAD_REQUEST",
        message: "Daily ritual ID is required",
      });
      return;
    }

    await dailyRitualService.deleteDailyRitual(req.userId, id);
    res.status(204).send();
  }
);
