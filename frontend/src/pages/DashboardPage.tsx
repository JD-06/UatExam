import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Users, CheckCircle2, Clock, Plus, BookOpen,
  TrendingUp, Award, ArrowRight, Calendar,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import api from '../api/client';
import { Form, Group, Response } from '../types';

interface DashboardStats {
  forms?: Form[];
  groups?: Group[];
  responses?: Response[];
  recentForms?: Form[];
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [formsRes, groupsRes] = await Promise.all([
          api.get('/forms'),
          api.get('/groups'),
        ]);
        setStats({
          forms: formsRes.data.forms,
          groups: groupsRes.data.groups,
        });
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const forms = stats.forms || [];
  const groups = stats.groups || [];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isProfesor = user?.rol === 'profesor';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Hola, {user?.nombre?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {isProfesor
              ? 'Gestiona tus formularios y grupos académicos'
              : 'Aquí están tus formularios y grupos'}
          </p>
        </div>
        {isProfesor && (
          <Link to="/formularios/nuevo">
            <Button className="gap-2">
              <Plus size={16} />
              Nuevo Formulario
            </Button>
          </Link>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isProfesor ? (
          <>
            <StatCard
              title="Total Formularios"
              value={forms.length}
              icon={<FileText size={20} className="text-uat-blue" />}
              color="blue"
              subtitle={`${forms.filter(f => f.estado === 'activo').length} activos`}
            />
            <StatCard
              title="Grupos"
              value={groups.length}
              icon={<Users size={20} className="text-purple-600" />}
              color="purple"
              subtitle={`${groups.reduce((sum, g) => sum + (g._count?.miembros || 0), 0)} alumnos`}
            />
            <StatCard
              title="Exámenes"
              value={forms.filter(f => f.tipo === 'examen').length}
              icon={<Award size={20} className="text-uat-gold" />}
              color="gold"
              subtitle="En total"
            />
            <StatCard
              title="Respuestas"
              value={forms.reduce((sum, f) => sum + (f._count?.respuestas || 0), 0)}
              icon={<CheckCircle2 size={20} className="text-green-600" />}
              color="green"
              subtitle="Recibidas"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Formularios Pendientes"
              value={forms.filter(f => !(f.respuestas?.length)).length}
              icon={<Clock size={20} className="text-uat-blue" />}
              color="blue"
              subtitle="Sin responder"
            />
            <StatCard
              title="Completados"
              value={forms.filter(f => f.respuestas?.length).length}
              icon={<CheckCircle2 size={20} className="text-green-600" />}
              color="green"
              subtitle="Respondidos"
            />
            <StatCard
              title="Mis Grupos"
              value={groups.length}
              icon={<Users size={20} className="text-purple-600" />}
              color="purple"
              subtitle="Grupos activos"
            />
            <StatCard
              title="Total Formularios"
              value={forms.length}
              icon={<BookOpen size={20} className="text-uat-gold" />}
              color="gold"
              subtitle="Disponibles"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Forms */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText size={18} className="text-uat-blue" />
                  {isProfesor ? 'Formularios Recientes' : 'Formularios Disponibles'}
                </CardTitle>
                <Link to="/formularios" className="text-sm text-uat-blue hover:underline flex items-center gap-1">
                  Ver todos <ArrowRight size={14} />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {forms.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">
                    {isProfesor ? 'No has creado formularios aún' : 'No tienes formularios disponibles'}
                  </p>
                  {isProfesor && (
                    <Link to="/formularios/nuevo">
                      <Button size="sm" className="mt-3">
                        <Plus size={14} /> Crear Formulario
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {forms.slice(0, 5).map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        form.tipo === 'examen' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        {form.tipo === 'examen' ? (
                          <Award size={18} className="text-purple-600" />
                        ) : (
                          <FileText size={18} className="text-uat-blue" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{form.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={form.estado === 'activo' ? 'success' : form.estado === 'cerrado' ? 'destructive' : 'secondary'}>
                            {form.estado}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {form._count?.preguntas || 0} preguntas
                          </span>
                        </div>
                      </div>
                      <Link
                        to={isProfesor ? `/formularios/${form.id}/editar` : `/formularios/${form.id}/responder`}
                        className="text-uat-blue hover:text-uat-blue-dark"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Groups */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users size={18} className="text-purple-600" />
                  {isProfesor ? 'Mis Grupos' : 'Grupos Inscritos'}
                </CardTitle>
                <Link to="/grupos" className="text-sm text-uat-blue hover:underline flex items-center gap-1">
                  Ver todos <ArrowRight size={14} />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <div className="text-center py-6">
                  <Users size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">
                    {isProfesor ? 'No has creado grupos' : 'No estás en ningún grupo'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.slice(0, 5).map((group) => (
                    <Link
                      key={group.id}
                      to={`/grupos/${group.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold text-sm">
                          {group.nombre.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{group.nombre}</p>
                        <p className="text-xs text-gray-400 truncate">{group.materia}</p>
                      </div>
                      <span className="text-xs text-gray-400">{group._count?.miembros || 0} 👤</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={18} className="text-uat-gold" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isProfesor ? (
                  <>
                    <Link to="/formularios/nuevo">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <Plus size={14} /> Crear Formulario
                      </Button>
                    </Link>
                    <Link to="/grupos">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <Users size={14} /> Crear Grupo
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/formularios">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <BookOpen size={14} /> Ver Formularios
                      </Button>
                    </Link>
                    <Link to="/grupos">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <Users size={14} /> Unirse a Grupo
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'gold';
  subtitle: string;
}) {
  const colorMap = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    green: 'bg-green-50',
    gold: 'bg-yellow-50',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-xl ${colorMap[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
