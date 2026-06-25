import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to authenticate requests to protected DB routes.
 * 
 * In a real app, this should verify a JWT.
 * For this refactor, we check `x-session-uid` header.
 * - Allows access if `x-session-uid` matches the docId (for user profiles, orders, etc.)
 * - Allows read access to public collections (products)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionUid = req.headers['x-session-uid'] as string;
  const collection = req.query.collection || req.body.collection;
  const docId = req.query.docId || req.body.docId;

  // If there's no session token, reject the request (unless it's an open route)
  if (!sessionUid) {
    // We can allow unauthenticated access to fetch products for guest browsing
    if (req.method === 'GET' && collection === 'products') {
      return next();
    }
    return res.status(401).json({ error: "Unauthorized: Missing session token" });
  }

  // Basic authorization rule: if operating on the 'users' collection, the docId must match the sessionUid
  if (collection === 'users') {
    if (docId && docId !== sessionUid) {
       return res.status(403).json({ error: "Forbidden: Cannot access other users' data" });
    }
  }

  next();
}
