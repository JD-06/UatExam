import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    rol: string;
    nombre: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticación requerido' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      rol: string;
      nombre: string;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }

    req.user = { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const requireProfesor = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.rol !== 'profesor') {
    res.status(403).json({ error: 'Acceso restringido a profesores' });
    return;
  }
  next();
};

export const requireAlumno = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.rol !== 'alumno') {
    res.status(403).json({ error: 'Acceso restringido a alumnos' });
    return;
  }
  next();
};
