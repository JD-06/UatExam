import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

const router = Router();

router.use(authenticate);

router.get('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        matricula: true,
        carrera: true,
        departamento: true,
        createdAt: true,
        _count: { select: { formularios: true, respuestas: true, gruposCreados: true } },
      },
    });
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

router.put('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, matricula, carrera, departamento, password, newPassword } = req.body;

    if (password && newPassword) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        res.status(400).json({ error: 'Contraseña actual incorrecta' });
        return;
      }
      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { nombre, matricula, carrera, departamento, password: hashed },
      });
    } else {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { nombre, matricula, carrera, departamento },
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        matricula: true,
        carrera: true,
        departamento: true,
      },
    });

    res.json({ user: updated });
  } catch {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

export default router;
