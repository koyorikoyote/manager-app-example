import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Request interface to include timing properties
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      requestId?: string;
    }
  }
}

export const requestTiming = (req: Request, res: Response, next: NextFunction) => {
  // Add request ID and start time
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers for debugging
  res.setHeader('X-Request-ID', req.requestId);

  // Log request start
  console.log(`[${req.requestId}] ${req.method} ${req.url} - Request started`);

  // Override res.end to log completion time
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
    const duration = Date.now() - (req.startTime || Date.now());
    
    console.log(`[${req.requestId}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`[${req.requestId}] Slow request detected: ${duration}ms`);
    }

    // Call original end method with proper return
    return originalEnd(chunk, encoding, cb);
  } as any;

  next();
};