export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'alumno' | 'profesor';
  matricula?: string;
  carrera?: string;
  departamento?: string;
  createdAt?: string;
}

export interface Group {
  id: string;
  nombre: string;
  descripcion?: string;
  materia: string;
  semestre: string;
  carrera?: string;
  codigo: string;
  profesorId: string;
  createdAt: string;
  profesor?: { id: string; nombre: string; email: string };
  miembros?: GroupMember[];
  formularios?: FormGroup[];
  _count?: { miembros: number; formularios: number };
}

export interface GroupMember {
  userId: string;
  groupId: string;
  joinedAt: string;
  user?: User;
}

export interface Form {
  id: string;
  titulo: string;
  descripcion?: string;
  profesorId: string;
  tipo: 'formulario' | 'examen';
  estado: 'borrador' | 'activo' | 'cerrado';
  fechaInicio?: string;
  fechaCierre?: string;
  tiempoLimite?: number;
  intentosMax: number;
  mostrarResultados: boolean;
  aleatorio: boolean;
  password?: string;
  createdAt: string;
  updatedAt: string;
  profesor?: { id: string; nombre: string; email?: string };
  preguntas?: Question[];
  grupos?: FormGroup[];
  respuestas?: Response[];
  _count?: { respuestas: number; preguntas: number };
}

export interface FormGroup {
  formId: string;
  groupId: string;
  fechaLimite?: string;
  form?: Form;
  group?: Group;
}

export interface Question {
  id: string;
  formId: string;
  orden: number;
  tipo: 'multiple' | 'checkbox' | 'corta' | 'parrafo' | 'escala' | 'fecha' | 'archivo' | 'seccion';
  texto: string;
  puntaje: number;
  obligatoria: boolean;
  retroalimentacion?: string;
  mediaUrl?: string;
  opciones?: QuestionOption[];
  respuestasCorrectas?: CorrectAnswer[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  texto: string;
  orden: number;
}

export interface CorrectAnswer {
  id: string;
  questionId: string;
  optionId: string;
}

export interface Response {
  id: string;
  formId: string;
  userId: string;
  grupoId?: string;
  calificacion?: number;
  calificacionMax?: number;
  completadoEn: string;
  tiempoUsado?: number;
  user?: User;
  respuestas?: Answer[];
}

export interface Answer {
  id: string;
  responseId: string;
  questionId: string;
  valor?: string;
  archivos?: string[];
  question?: Question;
}

export interface Notification {
  id: string;
  userId: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  matricula?: string;
  carrera?: string;
  departamento?: string;
}
