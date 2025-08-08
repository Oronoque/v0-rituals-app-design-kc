import { AsyncLocalStorage } from "async_hooks";
import { NextFunction, Request, Response } from "express";

interface RequestContextData {
  request_id: string;
}

class RequestContext {
  private static _instance: RequestContext;
  private storage = new AsyncLocalStorage<RequestContextData>();

  private constructor() {}

  public static get instance(): RequestContext {
    if (!this._instance) {
      this._instance = new RequestContext();
    }
    return this._instance;
  }

  run(request_id: string, callback: () => void) {
    this.storage.run({ request_id }, callback);
  }

  get requestId(): string {
    return this.storage.getStore()?.request_id ?? this.generateRequestId();
  }

  private generateRequestId(): string {
    return crypto.randomUUID();
  }
}

export const requestContext = RequestContext.instance;

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const reqId = req.headers["x-request-id"]?.toString() || crypto.randomUUID();

  requestContext.run(reqId, function requestIdMiddleware() {
    res.setHeader("x-request-id", reqId);
    next();
  });
}
