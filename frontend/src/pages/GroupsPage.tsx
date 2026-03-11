import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, BookOpen, Hash, ChevronRight, Trash2, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { toast } from '../components/ui/toast';
import api from '../api/client';
import { Group } from '../types';

export default function GroupsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    nombre: '', descripcion: '', materia: '', semestre: '', carrera: '',
  });

  const isProfesor = user?.rol === 'profesor';

  const load = async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(data.groups);
    } catch {
      toast.error('Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newGroup.nombre || !newGroup.materia || !newGroup.semestre) {
      toast.error('Nombre, materia y semestre son requeridos');
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post('/groups', newGroup);
      setGroups((prev) => [data.group, ...prev]);
      setShowCreate(false);
      setNewGroup({ nombre: '', descripcion: '', materia: '', semestre: '', carrera: '' });
      toast.success('Grupo creado exitosamente');
      navigate(`/grupos/${data.group.id}`);
    } catch {
      toast.error('Error al crear el grupo');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const { data } = await api.post('/groups/join', { codigo: joinCode.toUpperCase() });
      toast.success(data.message);
      setShowJoin(false);
      setJoinCode('');
      load();
      navigate(`/grupos/${data.group.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Código inválido');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isProfesor ? 'Mis Grupos' : 'Mis Grupos'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{groups.length} grupo{groups.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {isProfesor ? (
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus size={16} /> Crear Grupo
            </Button>
          ) : (
            <Button onClick={() => setShowJoin(true)} className="gap-2">
              <UserPlus size={16} /> Unirse a Grupo
            </Button>
          )}
        </div>
      </div>

      {/* Groups grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {isProfesor ? 'No has creado grupos' : 'No estás en ningún grupo'}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {isProfesor ? 'Crea grupos para organizar a tus alumnos' : 'Únete a un grupo con el código de tu profesor'}
            </p>
            {isProfesor ? (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Crear Grupo
              </Button>
            ) : (
              <Button onClick={() => setShowJoin(true)}>
                <UserPlus size={16} /> Unirse con Código
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Link key={group.id} to={`/grupos/${group.id}`}>
              <Card className="hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-12 h-12 bg-uat-blue rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">{group.nombre.charAt(0)}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                      <Hash size={12} className="text-gray-500" />
                      <span className="text-xs font-mono font-bold text-gray-600">{group.codigo}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{group.nombre}</h3>
                  <p className="text-uat-blue font-medium text-sm mt-0.5">{group.materia}</p>
                  {group.descripcion && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{group.descripcion}</p>
                  )}

                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{group._count?.miembros || 0} alumnos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen size={12} />
                      <span>{group._count?.formularios || 0} formularios</span>
                    </div>
                    <Badge variant="secondary" className="ml-auto">{group.semestre}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Grupo</DialogTitle>
          <DialogClose onClose={() => setShowCreate(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <Input
              label="Nombre del grupo *"
              value={newGroup.nombre}
              onChange={(e) => setNewGroup((p) => ({ ...p, nombre: e.target.value }))}
              placeholder="Ej. Programación I - Grupo A"
            />
            <Input
              label="Materia *"
              value={newGroup.materia}
              onChange={(e) => setNewGroup((p) => ({ ...p, materia: e.target.value }))}
              placeholder="Ej. Programación Orientada a Objetos"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Semestre *"
                value={newGroup.semestre}
                onChange={(e) => setNewGroup((p) => ({ ...p, semestre: e.target.value }))}
                placeholder="Ej. 2024-1"
              />
              <Input
                label="Carrera"
                value={newGroup.carrera}
                onChange={(e) => setNewGroup((p) => ({ ...p, carrera: e.target.value }))}
                placeholder="Ej. ISC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={newGroup.descripcion}
                onChange={(e) => setNewGroup((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción opcional del grupo..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uat-blue resize-none"
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
          <Button onClick={handleCreate} isLoading={creating}>Crear Grupo</Button>
        </DialogFooter>
      </Dialog>

      {/* Join dialog */}
      <Dialog open={showJoin} onClose={() => setShowJoin(false)}>
        <DialogHeader>
          <DialogTitle>Unirse a un Grupo</DialogTitle>
          <DialogClose onClose={() => setShowJoin(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Ingresa el código que te proporcionó tu profesor</p>
            <Input
              label="Código del grupo"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Ej. ABC123"
              className="text-center text-2xl font-mono tracking-widest"
              maxLength={6}
            />
            <p className="text-xs text-gray-400 text-center">El código tiene 6 caracteres alfanuméricos</p>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowJoin(false)}>Cancelar</Button>
          <Button onClick={handleJoin} isLoading={joining} disabled={joinCode.length !== 6}>
            Unirse
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
