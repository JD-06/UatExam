import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Save, Send, Trash2, GripVertical, ChevronDown, ChevronUp, Settings,
  AlignLeft, List, CheckSquare, Type, Star, Calendar, Upload, Minus, Eye,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from '../components/ui/toast';
import api from '../api/client';
import { Question, QuestionOption } from '../types';

type QuestionType = Question['tipo'];

interface EditorQuestion {
  id: string;
  tempId: string;
  orden: number;
  tipo: QuestionType;
  texto: string;
  puntaje: number;
  obligatoria: boolean;
  retroalimentacion: string;
  opciones: Array<{ tempId: string; texto: string; orden: number }>;
  respuestasCorrectas: string[];
}

const questionTypes: Array<{ type: QuestionType; label: string; icon: React.ReactNode }> = [
  { type: 'multiple', label: 'Opción múltiple', icon: <List size={14} /> },
  { type: 'checkbox', label: 'Casillas', icon: <CheckSquare size={14} /> },
  { type: 'corta', label: 'Respuesta corta', icon: <Type size={14} /> },
  { type: 'parrafo', label: 'Párrafo', icon: <AlignLeft size={14} /> },
  { type: 'escala', label: 'Escala lineal', icon: <Star size={14} /> },
  { type: 'fecha', label: 'Fecha', icon: <Calendar size={14} /> },
  { type: 'archivo', label: 'Carga de archivo', icon: <Upload size={14} /> },
  { type: 'seccion', label: 'Sección', icon: <Minus size={14} /> },
];

function newQuestion(orden: number): EditorQuestion {
  return {
    id: '',
    tempId: Math.random().toString(36).slice(2),
    orden,
    tipo: 'multiple',
    texto: '',
    puntaje: 0,
    obligatoria: false,
    retroalimentacion: '',
    opciones: [
      { tempId: Math.random().toString(36).slice(2), texto: 'Opción 1', orden: 0 },
      { tempId: Math.random().toString(36).slice(2), texto: 'Opción 2', orden: 1 },
    ],
    respuestasCorrectas: [],
  };
}

export default function FormEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'formulario' | 'examen'>('formulario');
  const [estado, setEstado] = useState<'borrador' | 'activo' | 'cerrado'>('borrador');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaCierre, setFechaCierre] = useState('');
  const [tiempoLimite, setTiempoLimite] = useState('');
  const [intentosMax, setIntentosMax] = useState('1');
  const [mostrarResultados, setMostrarResultados] = useState(true);
  const [aleatorio, setAleatorio] = useState(false);
  const [password, setPassword] = useState('');
  const [questions, setQuestions] = useState<EditorQuestion[]>([newQuestion(0)]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      api.get(`/forms/${id}`)
        .then(({ data }) => {
          const form = data.form;
          setTitulo(form.titulo);
          setDescripcion(form.descripcion || '');
          setTipo(form.tipo);
          setEstado(form.estado);
          setFechaInicio(form.fechaInicio ? form.fechaInicio.slice(0, 16) : '');
          setFechaCierre(form.fechaCierre ? form.fechaCierre.slice(0, 16) : '');
          setTiempoLimite(form.tiempoLimite?.toString() || '');
          setIntentosMax(form.intentosMax?.toString() || '1');
          setMostrarResultados(form.mostrarResultados);
          setAleatorio(form.aleatorio);
          setPassword(form.password || '');
          if (form.preguntas?.length) {
            setQuestions(
              form.preguntas.map((q: Question) => ({
                id: q.id,
                tempId: q.id,
                orden: q.orden,
                tipo: q.tipo,
                texto: q.texto,
                puntaje: q.puntaje,
                obligatoria: q.obligatoria,
                retroalimentacion: q.retroalimentacion || '',
                opciones: (q.opciones || []).map((o: QuestionOption) => ({
                  tempId: o.id,
                  texto: o.texto,
                  orden: o.orden,
                })),
                respuestasCorrectas: (q.respuestasCorrectas || []).map((c) => c.optionId),
              }))
            );
          }
        })
        .catch(() => toast.error('Error al cargar el formulario'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Auto-save debounce
  useEffect(() => {
    if (!isEditing) return;
    setAutoSaveStatus('unsaved');
    const timer = setTimeout(() => {
      handleSave(false);
    }, 30000);
    return () => clearTimeout(timer);
  }, [titulo, descripcion, questions]);

  const buildPayload = () => ({
    titulo,
    descripcion,
    tipo,
    estado,
    fechaInicio: fechaInicio || null,
    fechaCierre: fechaCierre || null,
    tiempoLimite: tiempoLimite ? parseInt(tiempoLimite) : null,
    intentosMax: parseInt(intentosMax) || 1,
    mostrarResultados,
    aleatorio,
    password: password || null,
    preguntas: questions.map((q, idx) => ({
      orden: idx,
      tipo: q.tipo,
      texto: q.texto,
      puntaje: q.puntaje,
      obligatoria: q.obligatoria,
      retroalimentacion: q.retroalimentacion || null,
      opciones: q.opciones.map((o, i) => ({ texto: o.texto, orden: i })),
    })),
  });

  const handleSave = async (redirect = true) => {
    if (!titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      if (isEditing) {
        await api.put(`/forms/${id}`, buildPayload());
        setAutoSaveStatus('saved');
        if (redirect) {
          toast.success('Formulario actualizado');
          navigate('/formularios');
        }
      } else {
        const { data } = await api.post('/forms', buildPayload());
        toast.success('Formulario creado');
        navigate(`/formularios/${data.form.id}/editar`);
      }
    } catch {
      toast.error('Error al guardar el formulario');
      setAutoSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!titulo.trim()) { toast.error('El título es requerido'); return; }
    setSaving(true);
    try {
      const payload = { ...buildPayload(), estado: 'activo' };
      if (isEditing) {
        await api.put(`/forms/${id}`, payload);
      } else {
        await api.post('/forms', payload);
      }
      toast.success('Formulario publicado exitosamente');
      navigate('/formularios');
    } catch {
      toast.error('Error al publicar');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const q = newQuestion(questions.length);
    setQuestions((prev) => [...prev, q]);
    setActiveQuestion(q.tempId);
  };

  const updateQuestion = (tempId: string, updates: Partial<EditorQuestion>) => {
    setQuestions((prev) => prev.map((q) => q.tempId === tempId ? { ...q, ...updates } : q));
  };

  const removeQuestion = (tempId: string) => {
    setQuestions((prev) => prev.filter((q) => q.tempId !== tempId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex((q) => q.tempId === active.id);
      const newIndex = questions.findIndex((q) => q.tempId === over?.id);
      setQuestions(arrayMove(questions, oldIndex, newIndex));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-uat-blue" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Formulario' : 'Nuevo Formulario'}
          </h1>
          {isEditing && (
            <p className="text-xs text-gray-400 mt-0.5">
              {autoSaveStatus === 'saved' && '✓ Guardado automáticamente'}
              {autoSaveStatus === 'saving' && '⟳ Guardando...'}
              {autoSaveStatus === 'unsaved' && '● Cambios sin guardar'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={14} /> Configuración
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSave(true)} isLoading={saving}>
            <Save size={14} /> Guardar
          </Button>
          <Button size="sm" variant="gold" onClick={handlePublish} isLoading={saving}>
            <Send size={14} /> Publicar
          </Button>
        </div>
      </div>

      {/* Form info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título del formulario..."
            className="w-full text-2xl font-bold text-gray-900 border-0 border-b-2 border-gray-200 focus:border-uat-blue focus:outline-none pb-2 bg-transparent"
          />
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción (opcional)..."
            rows={2}
            className="w-full text-sm text-gray-600 border-0 focus:outline-none resize-none bg-transparent placeholder-gray-400"
          />
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'formulario' | 'examen')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-uat-blue"
            >
              <option value="formulario">Formulario</option>
              <option value="examen">Examen</option>
            </select>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as 'borrador' | 'activo' | 'cerrado')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-uat-blue"
            >
              <option value="borrador">Borrador</option>
              <option value="activo">Activo</option>
              <option value="cerrado">Cerrado</option>
            </select>
            <Badge variant={tipo === 'examen' ? 'purple' : 'default'}>{tipo}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Settings panel */}
      {showSettings && (
        <Card className="animate-fadeIn">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings size={16} /> Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Fecha de inicio" type="datetime-local" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              <Input label="Fecha de cierre" type="datetime-local" value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} />
              <Input label="Tiempo límite (minutos)" type="number" value={tiempoLimite} onChange={(e) => setTiempoLimite(e.target.value)} placeholder="Sin límite" />
              <Input label="Intentos máximos" type="number" min="1" value={intentosMax} onChange={(e) => setIntentosMax(e.target.value)} />
              <Input label="Contraseña (opcional)" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sin contraseña" />
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={mostrarResultados} onChange={(e) => setMostrarResultados(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">Mostrar resultados al alumno</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={aleatorio} onChange={(e) => setAleatorio(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">Orden de preguntas aleatorio</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map((q) => q.tempId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <SortableQuestion
                key={q.tempId}
                question={q}
                index={idx + 1}
                isExamen={tipo === 'examen'}
                isActive={activeQuestion === q.tempId}
                onActivate={() => setActiveQuestion(q.tempId)}
                onUpdate={(updates) => updateQuestion(q.tempId, updates)}
                onRemove={() => removeQuestion(q.tempId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add question */}
      <button
        onClick={addQuestion}
        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-uat-blue hover:text-uat-blue transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Plus size={18} /> Añadir pregunta
      </button>

      {/* Bottom actions */}
      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => navigate('/formularios')}>Cancelar</Button>
        <Button variant="outline" onClick={() => handleSave(true)} isLoading={saving}>
          <Save size={14} /> Guardar como borrador
        </Button>
        <Button variant="gold" onClick={handlePublish} isLoading={saving}>
          <Send size={14} /> Publicar
        </Button>
      </div>
    </div>
  );
}

function SortableQuestion({
  question, index, isExamen, isActive, onActivate, onUpdate, onRemove,
}: {
  question: EditorQuestion;
  index: number;
  isExamen: boolean;
  isActive: boolean;
  onActivate: () => void;
  onUpdate: (updates: Partial<EditorQuestion>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.tempId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const addOption = () => {
    onUpdate({
      opciones: [
        ...question.opciones,
        { tempId: Math.random().toString(36).slice(2), texto: `Opción ${question.opciones.length + 1}`, orden: question.opciones.length },
      ],
    });
  };

  const removeOption = (tempId: string) => {
    onUpdate({ opciones: question.opciones.filter((o) => o.tempId !== tempId) });
  };

  const updateOption = (tempId: string, texto: string) => {
    onUpdate({ opciones: question.opciones.map((o) => o.tempId === tempId ? { ...o, texto } : o) });
  };

  if (question.tipo === 'seccion') {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab">
          <GripVertical size={16} />
        </button>
        <input
          value={question.texto}
          onChange={(e) => onUpdate({ texto: e.target.value })}
          placeholder="Título de sección..."
          className="flex-1 text-lg font-semibold text-gray-700 bg-transparent border-0 border-b-2 border-gray-200 focus:border-uat-blue focus:outline-none py-2"
        />
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`transition-all ${isActive ? 'ring-2 ring-uat-blue shadow-md' : 'hover:shadow-sm'}`}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab mt-2">
              <GripVertical size={16} />
            </button>

            <div className="flex-1 space-y-3" onClick={onActivate}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {index}
                </span>
                <select
                  value={question.tipo}
                  onChange={(e) => onUpdate({ tipo: e.target.value as QuestionType, opciones: question.tipo !== e.target.value ? [] : question.opciones })}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-uat-blue"
                  onClick={(e) => e.stopPropagation()}
                >
                  {questionTypes.map((qt) => (
                    <option key={qt.type} value={qt.type}>{qt.label}</option>
                  ))}
                </select>
                {isExamen && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={question.puntaje}
                      onChange={(e) => onUpdate({ puntaje: parseInt(e.target.value) || 0 })}
                      className="w-14 text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-uat-blue"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-gray-400">pts</span>
                  </div>
                )}
              </div>

              <input
                value={question.texto}
                onChange={(e) => onUpdate({ texto: e.target.value })}
                placeholder="Escribe la pregunta aquí..."
                className="w-full text-sm font-medium text-gray-800 bg-transparent border-0 border-b border-gray-100 focus:border-uat-blue focus:outline-none py-1"
              />

              {/* Options */}
              {(question.tipo === 'multiple' || question.tipo === 'checkbox') && (
                <div className="space-y-2 mt-2">
                  {question.opciones.map((opt) => (
                    <div key={opt.tempId} className="flex items-center gap-2">
                      {isExamen ? (
                        <input
                          type={question.tipo === 'checkbox' ? 'checkbox' : 'radio'}
                          name={`correct-${question.tempId}`}
                          checked={question.respuestasCorrectas.includes(opt.tempId)}
                          onChange={(e) => {
                            if (question.tipo === 'checkbox') {
                              onUpdate({
                                respuestasCorrectas: e.target.checked
                                  ? [...question.respuestasCorrectas, opt.tempId]
                                  : question.respuestasCorrectas.filter((id) => id !== opt.tempId),
                              });
                            } else {
                              onUpdate({ respuestasCorrectas: [opt.tempId] });
                            }
                          }}
                          className="w-4 h-4 accent-uat-blue"
                        />
                      ) : (
                        <div className={`w-4 h-4 border-2 border-gray-300 flex-shrink-0 ${question.tipo === 'checkbox' ? 'rounded' : 'rounded-full'}`} />
                      )}
                      <input
                        value={opt.texto}
                        onChange={(e) => updateOption(opt.tempId, e.target.value)}
                        className="flex-1 text-sm text-gray-700 bg-transparent border-0 border-b border-gray-100 focus:border-uat-blue focus:outline-none py-0.5"
                      />
                      <button onClick={() => removeOption(opt.tempId)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addOption}
                    className="text-xs text-uat-blue hover:underline flex items-center gap-1 mt-1"
                  >
                    <Plus size={12} /> Añadir opción
                  </button>
                </div>
              )}

              {question.tipo === 'escala' && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">1</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center text-xs text-gray-400">{n}</div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">5</span>
                </div>
              )}

              {question.tipo === 'corta' && (
                <div className="mt-2">
                  <div className="h-8 border-b border-gray-200 text-xs text-gray-400 flex items-end pb-1">Respuesta corta...</div>
                </div>
              )}

              {question.tipo === 'parrafo' && (
                <div className="mt-2">
                  <div className="h-16 border-b border-gray-200 text-xs text-gray-400 flex items-end pb-1">Respuesta larga...</div>
                </div>
              )}

              {question.tipo === 'fecha' && (
                <div className="mt-2">
                  <div className="h-8 border border-gray-200 rounded px-2 flex items-center text-xs text-gray-400">dd/mm/aaaa</div>
                </div>
              )}

              {isActive && (
                <div className="pt-3 border-t border-gray-100 flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={question.obligatoria}
                      onChange={(e) => onUpdate({ obligatoria: e.target.checked })}
                      className="w-3.5 h-3.5 accent-uat-blue"
                    />
                    <span className="text-xs text-gray-600">Obligatoria</span>
                  </label>
                  <input
                    value={question.retroalimentacion}
                    onChange={(e) => onUpdate({ retroalimentacion: e.target.value })}
                    placeholder="Retroalimentación (opcional)..."
                    className="flex-1 text-xs text-gray-500 bg-transparent border-0 border-b border-gray-100 focus:border-uat-blue focus:outline-none py-0.5"
                  />
                </div>
              )}
            </div>

            <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors mt-1 flex-shrink-0">
              <Trash2 size={16} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
