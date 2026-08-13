import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { auditLogs } from '../db/schema/audit_logs';

/**
 * Audit Logging Middleware
 * Intercepts requests and responses to log actions to the audit_logs table.
 */
export const auditMiddleware = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Intercept res.json to capture response payload
    const originalJson = res.json;
    res.json = function (body) {
      res.locals.body = body;
      return originalJson.call(this, body);
    };

    res.on('finish', async () => {
      try {
        const userId = req.user?.id || null;
        const statusCode = res.statusCode;
        const ipAddress = req.ip || req.socket.remoteAddress || null;

        // Scrub sensitive fields from request payload
        let requestPayload = null;
        if (req.body && typeof req.body === 'object') {
          // Create a shallow copy to avoid mutating the original req.body
          const bodyCopy = { ...req.body };
          
          // Remove sensitive fields
          const sensitiveKeys = ['password', 'passwordConfirm', 'token', 'secret'];
          for (const key of sensitiveKeys) {
            if (key in bodyCopy) {
              bodyCopy[key] = '***REDACTED***';
            }
          }
          requestPayload = bodyCopy;
        }

        let responsePayload = null;
        if (res.locals.body) {
          responsePayload = res.locals.body;
        }

        await db.insert(auditLogs).values({
          action,
          userId,
          method: req.method,
          endpoint: req.originalUrl,
          statusCode,
          ipAddress: ipAddress ? ipAddress.substring(0, 45) : null,
          requestPayload,
          responsePayload,
        });
      } catch (error) {
        console.error(`[Audit Middleware] Error logging action ${action}:`, error);
      }
    });

    next();
  };
};
