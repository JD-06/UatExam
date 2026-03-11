import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users, BookOpen, Copy, Trash2, UserMinus, ClipboardList,
  Hash, ArrowLeft, CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from '../components/ui/dialog';
import { toast } from '../components/ui/toast';
import api from '../api/client';
import { Group, GroupMember, Form } from '../types';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const isProfesor = user?.rol === 'profesor';
  const joinUrl = `${window.location.origin}/unirse/${group?.codigo}`;

  useEffect(() => {
    api.get(`/groups/${id}`)
      .then(({ data }) => setGroup(data.group))
      .catch(() => toast.error('Error al cargar el grupo'))
      .finally(() => setLoading(false));
  }, [id]);

  const copyCode = () => {
    navigator.clipboard.writeText(group?.codigo || '');
    toast.success('Código copiado al portapapeles');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(joinUrl);
    toast.success('Enlace copiado al portapapeles');
  };

  const handleRemoveMember = async (userId: string) => {
    setRemovingMember(userId);
    try {
      await api.delete(`/groups/${id}/members/${userId}`);
      setGroup((prev) => prev ? {
        ...prev,
        miembros: prev.miembros?.filter((m) => m.userId !== userId),
      } : null);
      toast.success('Miembro eliminado del grupo');
    } catch {
      toast.error('Error al eliminar miembro');
    } finally {
      setRemovingMember(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-uat-blue" />
    </div>
  );

  if (!group) return (
    <div className="text-center py-16">
      <p className="text-gray-400">Grupo no encontrado</p>
      <Link to="/grupos"><Button variant="outline" className="mt-4">Volver</Button></Link>
    </div>
  );

  const members = group.miembros || [];
  const forms = (group.formularios || []).map((fg) => fg.form).filter(Boolean) as Form[];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back */}
      <Link to="/grupos" className="flex items-center gap-2 text-uat-blue hover:underline text-sm font-medium w-fit">
        <ArrowLeft size={16} /> Volver a Grupos
      </Link>

      {/* Group header */}
      <div className="bg-uat-gradient rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-16 h-16 bg-uat-gold rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">{group.nombre.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{group.nombre}</h1>
            <p className="text-blue-100 font-medium mt-0.5">{group.materia}</p>
            {group.descripcion && <p className="text-blue-200 text-sm mt-1">{group.descripcion}</p>}
            <div className="flex flex-wrap gap-3 mt-3">
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                Semestre: {group.semestre}
              </Badge>
              {group.carrera && (
                <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                  {group.carrera}
                </Badge>
              )}
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1 text-xs">
                <Users size={12} />
                {members.length} miembros
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Group code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash size={16} className="text-uat-blue" />
                Código de Acceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-uat-blue tracking-widest mb-3">
                  {group.codigo}
                </div>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={copyCode} className="gap-1.5">
                    <Copy size={12} /> Copiar código
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowQR(true)} className="gap-1.5">
                    Ver QR
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Comparte este código con tus alumnos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total miembros</span>
                  <span className="font-semibold text-gray-900">{members.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Formularios asignados</span>
                  <span className="font-semibold text-gray-900">{forms.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Profesor</span>
                  <span className="font-semibold text-gray-900 text-xs">{group.profesor?.nombre}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Forms */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen size={16} className="text-uat-blue" />
                  Formularios Asignados
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {forms.length === 0 ? (
                <div className="text-center py-6">
                  <ClipboardList size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">No hay formularios asignados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {forms.map((form) => (
                    <div key={form?.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        form?.tipo === 'examen' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        <ClipboardList size={14} className={form?.tipo === 'examen' ? 'text-purple-600' : 'text-uat-blue'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{form?.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={form?.estado === 'activo' ? 'success' : 'secondary'}>
                            {form?.estado}
                          </Badge>
                        </div>
                      </div>
                      {isProfesor ? (
                        <Link to={`/formularios/${form?.id}/resultados`} className="text-xs text-uat-blue hover:underline">
                          Resultados
                        </Link>
                      ) : form?.estado === 'activo' ? (
                        <Link to={`/formularios/${form?.id}/responder`} className="text-xs text-uat-blue hover:underline">
                          Responder
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={16} className="text-uat-blue" />
                Miembros ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-6">
                  <Users size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">No hay miembros en el grupo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member: GroupMember) => (
                    <div key={member.userId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="w-9 h-9 rounded-full bg-uat-blue/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-uat-blue font-semibold text-sm">
                          {member.user?.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{member.user?.nombre}</p>
                        <p className="text-xs text-gray-400 truncate">{member.user?.email}</p>
                      </div>
                      {member.user?.matricula && (
                        <span className="text-xs text-gray-400 hidden sm:block">{member.user.matricula}</span>
                      )}
                      {isProfesor && user?.id !== member.userId && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={removingMember === member.userId}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-400 transition-all rounded"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Dialog */}
      <Dialog open={showQR} onClose={() => setShowQR(false)}>
        <DialogHeader>
          <DialogTitle>Código QR del Grupo</DialogTitle>
          <DialogClose onClose={() => setShowQR(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <QRCodeSVG value={joinUrl} size={200} level="H" includeMargin />
            </div>
            <div className="text-center">
              <p className="font-bold text-2xl font-mono text-uat-blue tracking-widest">{group.codigo}</p>
              <p className="text-sm text-gray-500 mt-1">Escanea el QR para unirte al grupo</p>
            </div>
            <div className="w-full bg-gray-50 rounded-lg p-3 flex items-center gap-2">
              <p className="text-xs text-gray-500 flex-1 truncate">{joinUrl}</p>
              <button onClick={copyUrl} className="text-uat-blue hover:text-uat-blue-dark flex-shrink-0">
                <Copy size={14} />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
