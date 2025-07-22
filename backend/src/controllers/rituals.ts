import { Request, Response } from "express";
import { RitualService } from "../services/ritual.service";
import {
  validateRequestBody,
  validateQuery,
  ValidationError,
  CreateRitualRequest,
} from "../utils/validation";
import {
  createRitualSchema,
  updateRitualSchema,
  publicRitualQuerySchema,
} from "../utils/validation";
import { asyncHandler } from "../middleware/error-handler";

const ritualService = new RitualService();

/**
 * POST /rituals
 * Create a new ritual
 */
export const createRitual = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.userId) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    const data = validateRequestBody(createRitualSchema, req.body);
    const ritual = await ritualService.createRitual(req.userId, data);

    res.status(201).json(ritual);
  }
);

/**
 * GET /rituals
 * Get user's private rituals
 */
export const getUserRituals = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.userId) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }

    const { category, limit, offset } = req.query;

    const query: { category?: string; limit?: number; offset?: number } = {};
    if (category) query.category = category as string;
    if (limit) query.limit = parseInt(limit as string);
    if (offset) query.offset = parseInt(offset as string);

    const result = await ritualService.getUserRituals(req.userId, query);

    res.status(200).json(result);
  }
);

/**
 * GET /rituals/public
 * Get public rituals library
 */
export const getPublicRituals = asyncHandler(
  async (req: Request, res: Response) => {
    const result = publicRitualQuerySchema.safeParse(req.query);
    if (!result.success) {
      throw new ValidationError(result.error.issues);
    }
    const validatedQuery = result.data;
    const publicRituals = await ritualService.getPublicRituals(validatedQuery);
    res.status(200).json(publicRituals);
  }
);

/**
 * GET /rituals/:id
 * Get ritual by ID
 */
export const getRitualById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        error: "BAD_REQUEST",
        message: "Ritual ID is required",
      });
      return;
    }

    const ritual = await ritualService.getRitualById(id, req.userId);

    res.status(200).json(ritual);
  }
);

/**
 * PUT /rituals/:id
 * Update ritual
 */
export const updateRitual = asyncHandler(
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
        message: "Ritual ID is required",
      });
      return;
    }

    const data = validateRequestBody(updateRitualSchema, req.body);
    const ritual = await ritualService.updateRitual(id, req.userId, data);

    res.status(200).json(ritual);
  }
);

/**
 * DELETE /rituals/:id
 * Delete ritual
 */
export const deleteRitual = asyncHandler(
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
        message: "Ritual ID is required",
      });
      return;
    }

    await ritualService.deleteRitual(id, req.userId);
    res.status(204).send();
  }
);

/**
 * POST /rituals/:id/fork
 * Fork a public ritual
 */
export const forkRitual = asyncHandler(async (req: Request, res: Response) => {
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
      message: "Ritual ID is required",
    });
    return;
  }

  const ritual = await ritualService.forkRitual(id, req.userId);
  res.status(201).json(ritual);
});

/**
 * POST /rituals/:id/publish
 * Publish ritual to public library
 */
export const publishRitual = asyncHandler(
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
        message: "Ritual ID is required",
      });
      return;
    }

    const ritual = await ritualService.publishRitual(id, req.userId);
    res.status(200).json(ritual);
  }
);

/**
 * POST /rituals/:id/unpublish
 * Remove ritual from public library
 */
export const unpublishRitual = asyncHandler(
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
        message: "Ritual ID is required",
      });
      return;
    }

    const ritual = await ritualService.unpublishRitual(id, req.userId);
    res.status(200).json(ritual);
  }
);
