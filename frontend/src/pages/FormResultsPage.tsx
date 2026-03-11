import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Download, Users, CheckCircle2, Clock, Award, BarChart2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from '../components/ui/toast';
import api from '../api/client';
import { Form, Response, Question } from '../types';

const COLORS = ['#003087', '#F2A900', '#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function FormResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<{ totalResponses: number; avgGrade: number }>({ totalResponses: 0, avgGrade: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'responses'>('overview');

  useEffect(() => {
    Promise.all([
      api.get(`/forms/${id}`),
      api.get(`/forms/${id}/results`),
    ])
      .then(([formRes, resultsRes]) => {
        setForm(formRes.data.form);
        setResponses(resultsRes.data.responses);
        setQuestions(resultsRes.data.questions);
        setStats(resultsRes.data.stats);
      })
      .catch(() => toast.error('Error al cargar resultados'))
      .finally(() => setLoading(false));
  }, [id]);

  const exportToExcel = () => {
    const data = responses.map((r) => {
      const row: Record<string, unknown> = {
        'Nombre': r.user?.nombre,
        'Email': r.user?.email,
        'Matrícula': r.user?.matricula || '',
        'Fecha': new Date(r.completadoEn).toLocaleString('es-MX'),
        'Calificación': r.calificacion ?? '',
        'Tiempo (seg)': r.tiempoUsado ?? '',
      };
      questions.forEach((q) => {
        const answer = r.respuestas?.find((a) => a.questionId === q.id);
        row[q.texto] = answer?.valor || '';
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Respuestas');
    XLSX.writeFile(wb, `${form?.titulo || 'resultados'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Archivo exportado');
  };

  const getQuestionStats = (question: Question) => {
    if (!['multiple', 'checkbox'].includes(question.tipo)) return null;
    const qAnswers = responses.flatMap((r) =>
      r.respuestas?.filter((a) => a.questionId === question.id) || []
    );

    const counts: Record<string, number> = {};
    qAnswers.forEach((a) => {
      if (a.valor) {
        a.valor.split(',').forEach((v) => {
          const opt = question.opciones?.find((o) => o.id === v);
          if (opt) counts[opt.texto] = (counts[opt.texto] || 0) + 1;
        });
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-uat-blue" />
    </div>
  );

  if (!form) return null;

  const avgPercent = stats.avgGrade ? ((stats.avgGrade / 10) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{form.titulo}</h1>
          <p className="text-gray-500 text-sm mt-1">Resultados y estadísticas</p>
        </div>
        <Button variant="outline" onClick={exportToExcel} className="gap-2">
          <Download size={16} /> Exportar Excel
        </Button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18} className="text-uat-blue" />} label="Respuestas" value={stats.totalResponses} color="blue" />
        {form.tipo === 'examen' && (
          <StatCard icon={<Award size={18} className="text-uat-gold" />} label="Promedio" value={stats.avgGrade.toFixed(1)} color="gold" />
        )}
        <StatCard icon={<CheckCircle2 size={18} className="text-green-600" />} label="Preguntas" value={questions.length} color="green" />
        <StatCard icon={<BarChart2 size={18} className="text-purple-600" />} label="Progreso" value={`${avgPercent}%`} color="purple" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white text-uat-blue shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'responses' ? 'bg-white text-uat-blue shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Respuestas Individuales
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Grade distribution if exam */}
          {form.tipo === 'examen' && responses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Calificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={getGradeDistribution(responses)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#003087" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Per-question charts */}
          {questions.map((q) => {
            const data = getQuestionStats(q);
            if (!data || data.length === 0) return null;

            return (
              <Card key={q.id}>
                <CardHeader>
                  <CardTitle className="text-base">{q.texto}</CardTitle>
                  <p className="text-xs text-gray-400">{responses.length} respuestas</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#003087" radius={[0, 4, 4, 0]}>
                          {data.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                          {data.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'responses' && (
        <Card>
          <CardHeader>
            <CardTitle>Respuestas Individuales</CardTitle>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No hay respuestas aún</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Alumno</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                      {form.tipo === 'examen' && (
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Calificación</th>
                      )}
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Tiempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((r) => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">{r.user?.nombre}</td>
                        <td className="py-3 px-4 text-gray-500">{r.user?.email}</td>
                        {form.tipo === 'examen' && (
                          <td className="py-3 px-4">
                            {r.calificacion !== null && r.calificacion !== undefined ? (
                              <Badge variant={r.calificacion >= 6 ? 'success' : 'destructive'}>
                                {r.calificacion.toFixed(1)}
                              </Badge>
                            ) : '—'}
                          </td>
                        )}
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(r.completadoEn).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {r.tiempoUsado ? `${Math.round(r.tiempoUsado / 60)}min` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50',
    gold: 'bg-yellow-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${colors[color] || 'bg-gray-50'}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function getGradeDistribution(responses: Response[]) {
  const ranges = ['0-2', '2-4', '4-6', '6-8', '8-10'];
  const counts = ranges.map(() => 0);
  responses.forEach((r) => {
    const g = r.calificacion;
    if (g === null || g === undefined) return;
    const idx = Math.min(Math.floor(g / 2), 4);
    counts[idx]++;
  });
  return ranges.map((range, i) => ({ range, count: counts[i] }));
}
