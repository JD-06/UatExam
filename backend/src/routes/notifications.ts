import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, leida: false },
    });
    res.json({ notifications, unreadCount });
  } catch {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

router.put('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { leida: true },
    });
    res.json({ message: 'Notificación marcada como leída' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
});

router.put('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, leida: false },
      data: { leida: true },
    });
    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar notificaciones' });
  }
});

export default router;
