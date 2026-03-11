import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

export const submitResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { formId, grupoId, respuestas, tiempoUsado } = req.body;
    const userId = req.user!.id;

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        preguntas: {
          include: { respuestasCorrectas: true, opciones: true },
        },
      },
    });

    if (!form) {
      res.status(404).json({ error: 'Formulario no encontrado' });
      return;
    }

    if (form.estado !== 'activo') {
      res.status(400).json({ error: 'Este formulario no está activo' });
      return;
    }

    // Check max attempts
    const existingResponses = await prisma.response.count({
      where: { formId, userId },
    });

    if (existingResponses >= form.intentosMax) {
      res.status(400).json({ error: 'Has alcanzado el máximo de intentos permitidos' });
      return;
    }

    // Calculate grade if exam type
    let calificacion: number | null = null;
    let calificacionMax: number | null = null;

    if (form.tipo === 'examen') {
      let totalPuntos = 0;
      let puntosObtenidos = 0;

      for (const pregunta of form.preguntas) {
        totalPuntos += pregunta.puntaje;
        const respuesta = respuestas.find(
          (r: { questionId: string; valor?: string }) => r.questionId === pregunta.id
        );

        if (respuesta && pregunta.respuestasCorrectas.length > 0) {
          const correctOptionIds = pregunta.respuestasCorrectas.map((ca) => ca.optionId);
          if (correctOptionIds.includes(respuesta.valor)) {
            puntosObtenidos += pregunta.puntaje;
          }
        }
      }

      calificacion = totalPuntos > 0 ? (puntosObtenidos / totalPuntos) * 10 : 0;
      calificacionMax = 10;
    }

    const response = await prisma.response.create({
      data: {
        formId,
        userId,
        grupoId,
        calificacion,
        calificacionMax,
        tiempoUsado,
        respuestas: {
          create: respuestas.map((r: { questionId: string; valor?: string; archivos?: string[] }) => ({
            questionId: r.questionId,
            valor: r.valor,
            archivos: r.archivos || [],
          })),
        },
      },
      include: {
        respuestas: true,
      },
    });

    // Notify professor
    await prisma.notification.create({
      data: {
        userId: form.profesorId,
        tipo: 'nueva_respuesta',
        mensaje: `${req.user!.nombre} respondió el formulario "${form.titulo}"`,
        data: { formId, responseId: response.id },
      },
    });

    res.status(201).json({ response, calificacion, calificacionMax });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ error: 'Error al enviar la respuesta' });
  }
};

export const getResponses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { formId } = req.params;
    const form = await prisma.form.findUnique({ where: { id: formId } });

    if (!form || form.profesorId !== req.user!.id) {
      res.status(403).json({ error: 'Acceso no autorizado' });
      return;
    }

    const responses = await prisma.response.findMany({
      where: { formId },
      include: {
        user: { select: { id: true, nombre: true, email: true, matricula: true } },
        respuestas: {
          include: {
            question: { select: { id: true, texto: true, tipo: true } },
          },
        },
      },
      orderBy: { completadoEn: 'desc' },
    });

    res.json({ responses });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Error al obtener respuestas' });
  }
};

export const getMyResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { formId } = req.params;
    const userId = req.user!.id;

    const responses = await prisma.response.findMany({
      where: { formId, userId },
      include: {
        respuestas: true,
      },
      orderBy: { completadoEn: 'desc' },
    });

    res.json({ responses });
  } catch (error) {
    console.error('Get my response error:', error);
    res.status(500).json({ error: 'Error al obtener tu respuesta' });
  }
};
