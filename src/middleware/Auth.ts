import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { UserRole } from '../models/Usuario';

export type AuthTokenPayload = {
    userId: string;
    email: string;
    role: UserRole;
    name: string;
};

export const verifyToken = (req: Request, res: Response, next: NextFunction): Response | void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token is required' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
        res.locals.authUser = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const authorizeRoles = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): Response | void => {
        const authUser = res.locals.authUser as AuthTokenPayload | undefined;

        if (!authUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!roles.includes(authUser.role)) {
            return res.status(403).json({ message: 'Forbidden: insufficient role' });
        }

        next();
    };
};
