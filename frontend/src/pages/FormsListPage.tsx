import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, FileText, Award, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/dropdown';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from '../components/ui/dialog';
import { toast } from '../components/ui/toast';
import api from '../api/client';
import { Form } from '../types';

const estadoBadge = {
  activo: 'success' as const,
  borrador: 'secondary' as const,
  cerrado: 'destructive' as const,
};

export default function FormsListPage() {
  const { user } = useAuthStore();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isProfesor = user?.rol === 'profesor';

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/forms', {
        params: { search: search || undefined, tipo: filterTipo || undefined, estado: filterEstado || undefined },
      });
      setForms(data.forms);
    } catch {
      toast.error('Error al cargar formularios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, filterTipo, filterEstado]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/forms/${deleteId}`);
      setForms((prev) => prev.filter((f) => f.id !== deleteId));
      toast.success('Formulario eliminado');
    } catch {
      toast.error('Error al eliminar el formulario');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredForms = forms.filter((f) =>
    f.titulo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isProfesor ? 'Mis Formularios' : 'Formularios Disponibles'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {filteredForms.length} formulario{filteredForms.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isProfesor && (
          <Link to="/formularios/nuevo">
            <Button className="gap-2">
              <Plus size={16} /> Nuevo Formulario
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar formularios..."
            leftIcon={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uat-blue bg-white"
        >
          <option value="">Todos los tipos</option>
          <option value="formulario">Formulario</option>
          <option value="examen">Examen</option>
        </select>
        {isProfesor && (
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uat-blue bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="activo">Activo</option>
            <option value="cerrado">Cerrado</option>
          </select>
        )}
      </div>

      {/* Forms list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredForms.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {search ? 'Sin resultados' : isProfesor ? 'No tienes formularios' : 'No hay formularios disponibles'}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {search ? `No se encontraron formularios para "${search}"` : isProfesor ? 'Crea tu primer formulario para comenzar' : 'Únete a un grupo para ver formularios'}
            </p>
            {isProfesor && (
              <Link to="/formularios/nuevo">
                <Button><Plus size={16} /> Crear Formulario</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredForms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              isProfesor={isProfesor}
              onDelete={() => setDeleteId(form.id)}
            />
          ))}
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogHeader>
          <DialogTitle>¿Eliminar formulario?</DialogTitle>
          <DialogClose onClose={() => setDeleteId(null)} />
        </DialogHeader>
        <DialogContent>
          <p className="text-gray-600">Esta acción no se puede deshacer. Se eliminarán todas las preguntas y respuestas asociadas.</p>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} isLoading={deleting}>Eliminar</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function FormCard({ form, isProfesor, onDelete }: { form: Form; isProfesor: boolean; onDelete: () => void }) {
  const hasResponded = form.respuestas && form.respuestas.length > 0;

  return (
    <Card className="hover:shadow-md transition-all duration-200 group">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            form.tipo === 'examen' ? 'bg-purple-100' : 'bg-blue-100'
          }`}>
            {form.tipo === 'examen' ? (
              <Award size={18} className="text-purple-600" />
            ) : (
              <FileText size={18} className="text-uat-blue" />
            )}
          </div>
          {isProfesor && (
            <Dropdown
              trigger={
                <button className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
              }
              items={[
                { label: 'Ver resultados', icon: <Eye size={14} />, onClick: () => window.location.href = `/formularios/${form.id}/resultados` },
                { label: 'Editar', icon: <Edit size={14} />, onClick: () => window.location.href = `/formularios/${form.id}/editar` },
                { label: 'Eliminar', icon: <Trash2 size={14} />, onClick: onDelete, destructive: true },
              ]}
            />
          )}
        </div>

        <div className="mt-3">
          <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2">{form.titulo}</h3>
          {form.descripcion && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{form.descripcion}</p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant={estadoBadge[form.estado as keyof typeof estadoBadge] || 'secondary'}>
            {form.estado}
          </Badge>
          <Badge variant={form.tipo === 'examen' ? 'purple' : 'default'}>
            {form.tipo}
          </Badge>
          {!isProfesor && hasResponded && (
            <Badge variant="success">Completado</Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{form._count?.preguntas || 0} preguntas</span>
            {isProfesor && <span>{form._count?.respuestas || 0} respuestas</span>}
            {form.tiempoLimite && <span>⏱ {form.tiempoLimite}min</span>}
          </div>
          {isProfesor ? (
            <Link to={`/formularios/${form.id}/resultados`} className="text-xs text-uat-blue hover:underline font-medium">
              Ver resultados →
            </Link>
          ) : form.estado === 'activo' && !hasResponded ? (
            <Link to={`/formularios/${form.id}/responder`} className="text-xs text-uat-blue hover:underline font-medium">
              Responder →
            </Link>
          ) : hasResponded ? (
            <span className="text-xs text-green-600 font-medium">✓ Completado</span>
          ) : (
            <span className="text-xs text-gray-400">{form.estado}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
