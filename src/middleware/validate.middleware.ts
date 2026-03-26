import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { validationErrorResponse } from '../utils/response.js';

export function validate(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body, query, and params
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Replace with validated data
      req.body = validated.body;
      req.query = validated.query as any;
      req.params = validated.params as any;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return validationErrorResponse(res, 'Validation failed', errorMessages);
      }
      next(error);
    }
  };
}

// Validate only body
export function validateBody(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return validationErrorResponse(res, 'Validation failed', errorMessages);
      }
      next(error);
    }
  };
}

// Validate only query params
export function validateQuery(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return validationErrorResponse(res, 'Validation failed', errorMessages);
      }
      next(error);
    }
  };
}
