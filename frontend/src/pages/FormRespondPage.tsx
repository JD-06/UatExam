import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2, ChevronRight, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from '../components/ui/dialog';
import { toast } from '../components/ui/toast';
import api from '../api/client';
import { Form, Question } from '../types';

interface AnswerMap {
  [questionId: string]: string | string[];
}

export default function FormRespondPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ calificacion: number | null; calificacionMax: number | null } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<number | null>(null);
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    api.get(`/forms/${id}`)
      .then(({ data }) => {
        setForm(data.form);
        if (data.form.tiempoLimite) {
          setTimeLeft(data.form.tiempoLimite * 60);
        }
      })
      .catch(() => {
        toast.error('Error al cargar el formulario');
        navigate('/formularios');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (timeLeft === null) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timeLeft !== null]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, value: string, type: Question['tipo']) => {
    if (type === 'checkbox') {
      const current = (answers[questionId] as string[]) || [];
      const exists = current.includes(value);
      setAnswers((prev) => ({
        ...prev,
        [questionId]: exists ? current.filter((v) => v !== value) : [...current, value],
      }));
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }
  };

  const getProgress = () => {
    if (!form?.preguntas) return 0;
    const answerable = form.preguntas.filter((q) => q.tipo !== 'seccion');
    const answered = answerable.filter((q) => {
      const a = answers[q.id];
      return a !== undefined && a !== '' && (Array.isArray(a) ? a.length > 0 : true);
    }).length;
    return answerable.length > 0 ? Math.round((answered / answerable.length) * 100) : 0;
  };

  const handleSubmit = async (auto = false) => {
    if (!form) return;
    const tiempoUsado = Math.round((Date.now() - startTime) / 1000);

    // Validate required questions
    if (!auto) {
      const required = form.preguntas?.filter((q) => q.obligatoria && q.tipo !== 'seccion') || [];
      const unanswered = required.filter((q) => {
        const a = answers[q.id];
        return !a || (Array.isArray(a) ? a.length === 0 : a === '');
      });
      if (unanswered.length > 0) {
        toast.error(`${unanswered.length} pregunta(s) obligatoria(s) sin responder`);
        setShowConfirm(false);
        return;
      }
    }

    setSubmitting(true);
    try {
      const respuestas = Object.entries(answers).map(([questionId, valor]) => ({
        questionId,
        valor: Array.isArray(valor) ? valor.join(',') : valor,
      }));

      const { data } = await api.post('/responses', {
        formId: id,
        respuestas,
        tiempoUsado,
      });

      setSubmitted(true);
      setResult({ calificacion: data.calificacion, calificacionMax: data.calificacionMax });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Error al enviar la respuesta');
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-uat-blue" />
    </div>
  );

  if (!form) return null;

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 animate-fadeIn">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Respuesta enviada!</h2>
        <p className="text-gray-500 mb-6">Tu respuesta ha sido registrada exitosamente.</p>

        {result?.calificacion !== null && result?.calificacion !== undefined && form.mostrarResultados && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <p className="text-blue-700 font-medium text-lg">Tu calificación</p>
            <p className="text-4xl font-bold text-uat-blue mt-2">
              {result.calificacion.toFixed(1)}
              <span className="text-xl text-gray-400"> / {result.calificacionMax?.toFixed(1)}</span>
            </p>
          </div>
        )}

        <Button onClick={() => navigate('/formularios')} className="gap-2">
          Volver a Formularios <ChevronRight size={16} />
        </Button>
      </div>
    );
  }

  const preguntas = form.preguntas || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Timer */}
      {timeLeft !== null && (
        <div className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-mono text-lg font-bold ${
          timeLeft < 300 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-uat-blue border border-blue-100'
        }`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
          {timeLeft < 300 && <span className="text-sm font-normal">¡Menos de 5 minutos!</span>}
        </div>
      )}

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{form.titulo}</h1>
              {form.descripcion && <p className="text-gray-500 mt-2">{form.descripcion}</p>}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Progreso</span>
              <span>{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-uat-blue h-2 rounded-full transition-all duration-500"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {preguntas.map((question, idx) => (
          <QuestionRenderer
            key={question.id}
            question={question}
            index={idx + 1}
            answer={answers[question.id]}
            onAnswer={(value) => handleAnswer(question.id, value, question.tipo)}
          />
        ))}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-4 pb-8">
        <p className="text-sm text-gray-400">
          {getProgress()}% completado
        </p>
        <Button onClick={() => setShowConfirm(true)} className="gap-2" size="lg">
          <Send size={16} /> Enviar Respuesta
        </Button>
      </div>

      {/* Confirm dialog */}
      <Dialog open={showConfirm} onClose={() => setShowConfirm(false)}>
        <DialogHeader>
          <DialogTitle>¿Enviar respuesta?</DialogTitle>
          <DialogClose onClose={() => setShowConfirm(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="space-y-3">
            <p className="text-gray-600">
              Estás a punto de enviar tu respuesta. Esta acción no se puede deshacer.
            </p>
            {getProgress() < 100 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle size={16} className="text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  Tienes preguntas sin responder ({100 - getProgress()}% incompleto)
                </p>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowConfirm(false)}>Revisar</Button>
          <Button onClick={() => handleSubmit(false)} isLoading={submitting}>Enviar</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function QuestionRenderer({
  question, index, answer, onAnswer,
}: {
  question: Question;
  index: number;
  answer: string | string[] | undefined;
  onAnswer: (value: string) => void;
}) {
  if (question.tipo === 'seccion') {
    return (
      <div className="border-b-2 border-uat-blue pb-2 mt-6">
        <h2 className="text-xl font-bold text-gray-800">{question.texto}</h2>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="w-7 h-7 bg-uat-blue text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            {index}
          </span>
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {question.texto}
              {question.obligatoria && <span className="text-red-500 ml-1">*</span>}
            </p>
          </div>
        </div>

        <div className="ml-10">
          {question.tipo === 'multiple' && question.opciones && (
            <div className="space-y-2">
              {question.opciones.map((opt) => (
                <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    value={opt.id}
                    checked={answer === opt.id}
                    onChange={() => onAnswer(opt.id)}
                    className="w-4 h-4 accent-uat-blue"
                  />
                  <span className={`text-sm ${answer === opt.id ? 'text-uat-blue font-medium' : 'text-gray-700'} group-hover:text-uat-blue`}>
                    {opt.texto}
                  </span>
                </label>
              ))}
            </div>
          )}

          {question.tipo === 'checkbox' && question.opciones && (
            <div className="space-y-2">
              {question.opciones.map((opt) => {
                const checked = Array.isArray(answer) ? answer.includes(opt.id) : false;
                return (
                  <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      value={opt.id}
                      checked={checked}
                      onChange={() => onAnswer(opt.id)}
                      className="w-4 h-4 rounded accent-uat-blue"
                    />
                    <span className={`text-sm ${checked ? 'text-uat-blue font-medium' : 'text-gray-700'}`}>
                      {opt.texto}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {question.tipo === 'corta' && (
            <input
              type="text"
              value={(answer as string) || ''}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder="Tu respuesta..."
              className="w-full border-b border-gray-300 focus:border-uat-blue focus:outline-none py-2 text-sm bg-transparent"
            />
          )}

          {question.tipo === 'parrafo' && (
            <textarea
              value={(answer as string) || ''}
              onChange={(e) => onAnswer(e.target.value)}
              placeholder="Tu respuesta..."
              rows={4}
              className="w-full border border-gray-200 rounded-lg focus:border-uat-blue focus:outline-none p-3 text-sm resize-y"
            />
          )}

          {question.tipo === 'escala' && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-500">1</span>
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  onClick={() => onAnswer(n.toString())}
                  className={`w-10 h-10 rounded-full border-2 font-medium text-sm transition-all ${
                    answer === n.toString()
                      ? 'bg-uat-blue border-uat-blue text-white'
                      : 'border-gray-300 text-gray-600 hover:border-uat-blue'
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-gray-500">5</span>
            </div>
          )}

          {question.tipo === 'fecha' && (
            <input
              type="date"
              value={(answer as string) || ''}
              onChange={(e) => onAnswer(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uat-blue"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
