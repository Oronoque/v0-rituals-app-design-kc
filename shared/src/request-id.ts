// Browser-safe imports and implementations
import { NextFunction, Request, Response } from "express";
let AsyncLocalStorage: any;

// Only import Node.js modules on server side
if (typeof window === "undefined" && typeof process !== "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    AsyncLocalStorage = require("async_hooks").AsyncLocalStorage;
  } catch {
    // Fallback if modules not available
  }
}

interface RequestContextData {
  request_id: string;
}

class RequestContext {
  private static _instance: RequestContext;
  private storage: any;

  private constructor() {
    // Only create AsyncLocalStorage on server side
    if (AsyncLocalStorage) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      this.storage = new AsyncLocalStorage();
    }
  }

  public static get instance(): RequestContext {
    if (!this._instance) {
      this._instance = new RequestContext();
    }
    return this._instance;
  }

  run(request_id: string, callback: () => void) {
    if (this.storage) {
      const contextData: RequestContextData = { request_id };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.storage.run(contextData, callback);
    } else {
      // Browser fallback - just execute callback
      callback();
    }
  }

  get requestId(): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.storage?.getStore()?.request_id;
  }
}

export const requestContext = RequestContext.instance;

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Only work on server side
  if (typeof window !== "undefined") {
    // Browser fallback - do nothing
    return;
  }

  const reqId = req.headers["x-request-id"]?.toString() || crypto.randomUUID();

  requestContext.run(reqId, function requestIdMiddleware() {
    res.setHeader("x-request-id", reqId);
    next();
  });
}
