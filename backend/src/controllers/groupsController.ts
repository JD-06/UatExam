import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

function generateGroupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function uniqueCode(): Promise<string> {
  let code = generateGroupCode();
  let existing = await prisma.group.findUnique({ where: { codigo: code } });
  while (existing) {
    code = generateGroupCode();
    existing = await prisma.group.findUnique({ where: { codigo: code } });
  }
  return code;
}

export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, materia, semestre, carrera } = req.body;
    const codigo = await uniqueCode();

    const group = await prisma.group.create({
      data: {
        nombre,
        descripcion,
        materia,
        semestre,
        carrera,
        codigo,
        profesorId: req.user!.id,
      },
      include: {
        profesor: { select: { id: true, nombre: true, email: true } },
        _count: { select: { miembros: true } },
      },
    });

    res.status(201).json({ group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Error al crear el grupo' });
  }
};

export const getGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let groups;

    if (user.rol === 'profesor') {
      groups = await prisma.group.findMany({
        where: { profesorId: user.id },
        include: {
          profesor: { select: { id: true, nombre: true, email: true } },
          _count: { select: { miembros: true, formularios: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      groups = await prisma.group.findMany({
        where: { miembros: { some: { userId: user.id } } },
        include: {
          profesor: { select: { id: true, nombre: true, email: true } },
          _count: { select: { miembros: true, formularios: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json({ groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
};

export const getGroupById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        profesor: { select: { id: true, nombre: true, email: true } },
        miembros: {
          include: {
            user: { select: { id: true, nombre: true, email: true, matricula: true, carrera: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
        formularios: {
          include: {
            form: {
              select: {
                id: true,
                titulo: true,
                tipo: true,
                estado: true,
                fechaCierre: true,
                _count: { select: { respuestas: true } },
              },
            },
          },
        },
      },
    });

    if (!group) {
      res.status(404).json({ error: 'Grupo no encontrado' });
      return;
    }

    res.json({ group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Error al obtener el grupo' });
  }
};

export const joinGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { codigo } = req.body;
    const userId = req.user!.id;

    const group = await prisma.group.findUnique({ where: { codigo } });
    if (!group) {
      res.status(404).json({ error: 'Código de grupo inválido' });
      return;
    }

    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: group.id } },
    });

    if (existing) {
      res.status(400).json({ error: 'Ya eres miembro de este grupo' });
      return;
    }

    await prisma.groupMember.create({ data: { userId, groupId: group.id } });

    res.json({ message: 'Te has unido al grupo exitosamente', group });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Error al unirse al grupo' });
  }
};

export const joinGroupByCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { codigo } = req.params;
    const userId = req.user!.id;

    const group = await prisma.group.findUnique({ where: { codigo } });
    if (!group) {
      res.status(404).json({ error: 'Grupo no encontrado' });
      return;
    }

    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: group.id } },
    });

    if (existing) {
      res.json({ message: 'Ya eres miembro de este grupo', group, alreadyMember: true });
      return;
    }

    await prisma.groupMember.create({ data: { userId, groupId: group.id } });

    res.json({ message: 'Te has unido al grupo exitosamente', group });
  } catch (error) {
    console.error('Join group by code error:', error);
    res.status(500).json({ error: 'Error al unirse al grupo' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: groupId, userId } = req.params;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.profesorId !== req.user!.id) {
      res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
      return;
    }

    await prisma.groupMember.delete({
      where: { userId_groupId: { userId, groupId } },
    });

    res.json({ message: 'Miembro eliminado del grupo' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Error al eliminar miembro' });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const group = await prisma.group.findUnique({ where: { id } });

    if (!group || group.profesorId !== req.user!.id) {
      res.status(403).json({ error: 'No tienes permiso para modificar este grupo' });
      return;
    }

    const updated = await prisma.group.update({
      where: { id },
      data: req.body,
    });

    res.json({ group: updated });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Error al actualizar el grupo' });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const group = await prisma.group.findUnique({ where: { id } });

    if (!group || group.profesorId !== req.user!.id) {
      res.status(403).json({ error: 'No tienes permiso para eliminar este grupo' });
      return;
    }

    await prisma.group.delete({ where: { id } });
    res.json({ message: 'Grupo eliminado' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Error al eliminar el grupo' });
  }
};
