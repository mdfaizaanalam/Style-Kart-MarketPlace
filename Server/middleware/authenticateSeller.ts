import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ✅ MUST MATCH the JWT_SECRET in seller.ts
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY || 'myothertestsecret';

// Extend Request type to include seller property
declare global {
  namespace Express {
    interface Request {
      seller?: {
        seller_id: number;
        email: string;
        role: string;
      };
    }
  }
}

const authenticateSeller = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('[SELLER AUTH] Headers:', req.headers.authorization ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[SELLER AUTH] No valid authorization header');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log('[SELLER AUTH] Token verified for seller:', decoded.seller_id);
      
      req.seller = {
        seller_id: decoded.seller_id,
        email: decoded.email,
        role: decoded.role
      };
      
      next();
    } catch (jwtError: any) {
      console.log('[SELLER AUTH] JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        error: 'Invalid token',
        message: jwtError.message 
      });
    }
  } catch (error: any) {
    console.error('[SELLER AUTH] Error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: error.message 
    });
  }
};

export default authenticateSeller;
