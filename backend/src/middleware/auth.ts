import jwt from 'jsonwebtoken';

export interface AuthPayload {
  address: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest {
  user?: AuthPayload;
  headers: any;
  [key: string]: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'satsid-dev-secret-change-in-production-abc123';

export function requireAuth(req: any, res: any, next: any): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Missing or invalid Authorization header. Use Bearer <token>.',
      });
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please authenticate again.',
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid.',
      });
      return;
    }

    res.status(500).json({
      error: 'Authentication error',
      message: 'An unexpected error occurred during authentication.',
    });
  }
}
