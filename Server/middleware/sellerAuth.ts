import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY || 'your-secret-key-change-in-production';

export const sellerAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as any).seller = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
