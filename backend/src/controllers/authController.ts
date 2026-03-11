import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';

const ALLOWED_DOMAINS = ['uat.edu.mx', 'alumnos.uat.edu.mx'];

const registerSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  matricula: z.string().optional(),
  carrera: z.string().optional(),
  departamento: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function getDomainRole(email: string): string | null {
  const domain = email.split('@')[1];
  if (domain === 'alumnos.uat.edu.mx') return 'alumno';
  if (domain === 'uat.edu.mx') return 'profesor';
  return null;
}

function generateTokens(payload: { id: string; email: string; rol: string; nombre: string }) {
  const secret = process.env.JWT_SECRET || 'secret';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

  const token = jwt.sign(payload, secret, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });

  return { token, refreshToken };
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const rol = getDomainRole(data.email);

    if (!rol) {
      res.status(400).json({
        error: `Correo no permitido. Solo se aceptan correos @uat.edu.mx (profesores) o @alumnos.uat.edu.mx (alumnos)`,
      });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(400).json({ error: 'Este correo ya está registrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: hashedPassword,
        rol,
        matricula: data.matricula,
        carrera: data.carrera,
        departamento: data.departamento,
      },
    });

    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
    });

    res.status(201).json({
      ...tokens,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        matricula: user.matricula,
        carrera: user.carrera,
        departamento: user.departamento,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', details: error.flatten().fieldErrors });
      return;
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
    });

    res.json({
      ...tokens,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        matricula: user.matricula,
        carrera: user.carrera,
        departamento: user.departamento,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', details: error.flatten().fieldErrors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Refresh token requerido' });
      return;
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
    const decoded = jwt.verify(token, refreshSecret) as {
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

    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
    });

    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Refresh token inválido' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        matricula: true,
        carrera: true,
        departamento: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};
