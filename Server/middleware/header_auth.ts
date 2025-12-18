import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// ✅ Load JWT secret ONCE
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;
if (!JWT_SECRET) {
  throw new Error('JWT_ENCRYPTION_KEY is not defined');
}

interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

// ✅ Routes that don't require authentication
const publicRoutes = [
  '/api/authentication',
  '/api/seller/login',
  '/api/seller/register',
  '/api/homeData',
  '/api/products',
  '/api/categories',
  '/api/sitedata',
];

function extractTokenFromRequest(req: Request): string | null {
  const authHeader =
    req.headers['authorization'] || (req.headers as any).Authorization;
  if (typeof authHeader === 'string') {
    const parts = authHeader.trim().split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
    if (parts.length === 1) return parts[0];
  }

  const xAccess =
    req.headers['x-access-token'] || (req.headers as any)['X-Access-Token'];
  if (typeof xAccess === 'string') return xAccess;

  const tokenHeader = req.headers['token'] || (req.headers as any).Token;
  if (typeof tokenHeader === 'string') return tokenHeader;

  if (req.query && typeof req.query.token === 'string') return req.query.token;

  if ((req as any).cookies?.token) return (req as any).cookies.token;

  return null;
}

function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (req.method === 'OPTIONS') return next();

  const pathLower = (req.path || '').toLowerCase();
  const isPublicRoute = publicRoutes.some(route =>
    pathLower.startsWith(route.toLowerCase())
  );
  if (isPublicRoute || pathLower === '/') return next();

  const token = extractTokenFromRequest(req);

  if (!token) {
    console.warn(
      '[auth] No Authorization token provided. headers:',
      Object.keys(req.headers)
    );
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }

  try {
    // ✅ TypeScript safe verification
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(
      '[auth] JWT verification failed:',
      err instanceof Error ? err.message : err
    );
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export default authenticateToken;
