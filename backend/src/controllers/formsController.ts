import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const getForms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { estado, tipo, search } = req.query;
    let forms;

    if (user.rol === 'profesor') {
      forms = await prisma.form.findMany({
        where: {
          profesorId: user.id,
          ...(estado ? { estado: estado as string } : {}),
          ...(tipo ? { tipo: tipo as string } : {}),
          ...(search ? { titulo: { contains: search as string, mode: 'insensitive' } } : {}),
        },
        include: {
          _count: { select: { respuestas: true, preguntas: true } },
          grupos: { include: { group: { select: { id: true, nombre: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else {
      // Alumno: see forms assigned to their groups
      const userGroups = await prisma.groupMember.findMany({
        where: { userId: user.id },
        select: { groupId: true },
      });
      const groupIds = userGroups.map((g) => g.groupId);

      forms = await prisma.form.findMany({
        where: {
          grupos: { some: { groupId: { in: groupIds } } },
          estado: 'activo',
          ...(tipo ? { tipo: tipo as string } : {}),
          ...(search ? { titulo: { contains: search as string, mode: 'insensitive' } } : {}),
        },
        include: {
          profesor: { select: { id: true, nombre: true } },
          _count: { select: { respuestas: true, preguntas: true } },
          respuestas: {
            where: { userId: user.id },
            select: { id: true, calificacion: true, completadoEn: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    res.json({ forms });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: 'Error al obtener formularios' });
  }
};

export const getFormById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        profesor: { select: { id: true, nombre: true, email: true } },
        preguntas: {
          orderBy: { orden: 'asc' },
          include: {
            opciones: { orderBy: { orden: 'asc' } },
            respuestasCorrectas: true,
          },
        },
        grupos: {
          include: { group: { select: { id: true, nombre: true } } },
        },
      },
    });

    if (!form) {
      res.status(404).json({ error: 'Formulario no encontrado' });
      return;
    }

    // Alumnos can't see correct answers
    if (user.rol === 'alumno') {
      const cleanForm = {
        ...form,
        preguntas: form.preguntas.map((q) => ({
          ...q,
          respuestasCorrectas: [],
        })),
      };
      res.json({ form: cleanForm });
      return;
    }

    res.json({ form });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Error al obtener el formulario' });
  }
};

export const createForm = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      titulo,
      descripcion,
      tipo,
      estado,
      fechaInicio,
      fechaCierre,
      tiempoLimite,
      intentosMax,
      mostrarResultados,
      aleatorio,
      password,
      preguntas,
    } = req.body;

    const form = await prisma.form.create({
      data: {
        titulo,
        descripcion,
        tipo: tipo || 'formulario',
        estado: estado || 'borrador',
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaCierre: fechaCierre ? new Date(fechaCierre) : null,
        tiempoLimite,
        intentosMax: intentosMax || 1,
        mostrarResultados: mostrarResultados ?? true,
        aleatorio: aleatorio ?? false,
        password,
        profesorId: req.user!.id,
        preguntas: preguntas
          ? {
              create: preguntas.map(
                (q: {
                  orden: number;
                  tipo: string;
                  texto: string;
                  puntaje?: number;
                  obligatoria?: boolean;
                  retroalimentacion?: string;
                  mediaUrl?: string;
                  opciones?: Array<{ texto: string; orden: number }>;
                  respuestasCorrectas?: Array<{ optionId: string }>;
                }) => ({
                  orden: q.orden,
                  tipo: q.tipo,
                  texto: q.texto,
                  puntaje: q.puntaje || 0,
                  obligatoria: q.obligatoria ?? false,
                  retroalimentacion: q.retroalimentacion,
                  mediaUrl: q.mediaUrl,
                  opciones: q.opciones
                    ? { create: q.opciones.map((o) => ({ texto: o.texto, orden: o.orden })) }
                    : undefined,
                })
              ),
            }
          : undefined,
      },
      include: {
        preguntas: {
          include: { opciones: true },
          orderBy: { orden: 'asc' },
        },
      },
    });

    res.status(201).json({ form });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Error al crear el formulario' });
  }
};

export const updateForm = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const form = await prisma.form.findUnique({ where: { id } });

    if (!form || form.profesorId !== req.user!.id) {
      res.status(403).json({ error: 'No tienes permiso para modificar este formulario' });
      return;
    }

    const {
      titulo,
      descripcion,
      tipo,
      estado,
      fechaInicio,
      fechaCierre,
      tiempoLimite,
      intentosMax,
      mostrarResultados,
      aleatorio,
      password,
      preguntas,
    } = req.body;

    // Delete existing questions if new ones provided
    if (preguntas) {
      await prisma.question.deleteMany({ where: { formId: id } });
    }

    const updated = await prisma.form.update({
      where: { id },
      data: {
        ...(titulo !== undefined ? { titulo } : {}),
        ...(descripcion !== undefined ? { descripcion } : {}),
        ...(tipo !== undefined ? { tipo } : {}),
        ...(estado !== undefined ? { estado } : {}),
        ...(fechaInicio !== undefined ? { fechaInicio: fechaInicio ? new Date(fechaInicio) : null } : {}),
        ...(fechaCierre !== undefined ? { fechaCierre: fechaCierre ? new Date(fechaCierre) : null } : {}),
        ...(tiempoLimite !== undefined ? { tiempoLimite } : {}),
        ...(intentosMax !== undefined ? { intentosMax } : {}),
        ...(mostrarResultados !== undefined ? { mostrarResultados } : {}),
        ...(aleatorio !== undefined ? { aleatorio } : {}),
        ...(password !== undefined ? { password } : {}),
        ...(preguntas
          ? {
              preguntas: {
                create: preguntas.map(
                  (q: {
                    orden: number;
                    tipo: string;
                    texto: string;
                    puntaje?: number;
                    obligatoria?: boolean;
                    retroalimentacion?: string;
                    opciones?: Array<{ texto: string; orden: number }>;
                    respuestasCorrectas?: Array<{ optionId: string }>;
                  }) => ({
                    orden: q.orden,
                    tipo: q.tipo,
                    texto: q.texto,
                    puntaje: q.puntaje || 0,
                    obligatoria: q.obligatoria ?? false,
                    retroalimentacion: q.retroalimentacion,
                    opciones: q.opciones
                      ? { create: q.opciones.map((o) => ({ texto: o.texto, orden: o.orden })) }
                      : undefined,
                  })
                ),
              },
            }
          : {}),
      },
      include: {
        preguntas: {
          include: { opciones: true, respuestasCorrectas: true },
          orderBy: { orden: 'asc' },
        },
        grupos: { include: { group: true } },
      },
    });

    res.json({ form: updated });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ error: 'Error al actualizar el formulario' });
  }
};

export const deleteForm = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const form = await prisma.form.findUnique({ where: { id } });

    if (!form || form.profesorId !== req.user!.id) {
      res.status(403).json({ error: 'No tienes permiso para eliminar este formulario' });
      return;
    }

    await prisma.form.delete({ where: { id } });
    res.json({ message: 'Formulario eliminado' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Error al eliminar el formulario' });
  }
};

export const assignFormToGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { groupIds, fechaLimite } = req.body;

    const form = await prisma.form.findUnique({ where: { id } });
    if (!form || form.profesorId !== req.user!.id) {
      res.status(403).json({ error: 'No tienes permiso' });
      return;
    }

    await prisma.formGroup.deleteMany({ where: { formId: id } });

    if (groupIds && groupIds.length > 0) {
      await prisma.formGroup.createMany({
        data: groupIds.map((gId: string) => ({
          formId: id,
          groupId: gId,
          fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
        })),
      });
    }

    res.json({ message: 'Formulario asignado a grupos exitosamente' });
  } catch (error) {
    console.error('Assign form error:', error);
    res.status(500).json({ error: 'Error al asignar el formulario' });
  }
};

export const getFormResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const form = await prisma.form.findUnique({ where: { id } });

    if (!form || form.profesorId !== req.user!.id) {
      res.status(403).json({ error: 'Acceso no autorizado' });
      return;
    }

    const responses = await prisma.response.findMany({
      where: { formId: id },
      include: {
        user: { select: { id: true, nombre: true, email: true, matricula: true } },
        respuestas: {
          include: { question: { select: { id: true, texto: true, tipo: true, puntaje: true } } },
        },
      },
      orderBy: { completadoEn: 'desc' },
    });

    const questions = await prisma.question.findMany({
      where: { formId: id },
      include: { opciones: true },
      orderBy: { orden: 'asc' },
    });

    // Compute stats
    const totalResponses = responses.length;
    const avgGrade =
      responses.length > 0
        ? responses.reduce((sum, r) => sum + (r.calificacion || 0), 0) / responses.length
        : 0;

    res.json({ responses, questions, stats: { totalResponses, avgGrade } });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Error al obtener resultados' });
  }
};
