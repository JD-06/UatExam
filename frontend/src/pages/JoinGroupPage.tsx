import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { toast } from '../components/ui/toast';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import { Group } from '../types';

export default function JoinGroupPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState(codigo || '');

  const lookupGroup = async (code: string) => {
    if (!code || code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/groups/join/${code.toUpperCase()}`);
      if (data.alreadyMember) {
        setJoined(true);
        setGroup(data.group);
      } else {
        setGroup(data.group);
        setJoined(true);
        toast.success(data.message);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codigo) {
      lookupGroup(codigo);
    }
  }, [codigo]);

  if (joined && group) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-fadeIn">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Te has unido al grupo!</h2>
        <p className="text-gray-500 mb-2">{group.nombre}</p>
        <p className="text-gray-400 text-sm mb-8">{group.materia} — {group.semestre}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate('/grupos')}>Ver todos los grupos</Button>
          <Button onClick={() => navigate(`/grupos/${group.id}`)} className="gap-2">
            Ir al grupo <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-uat-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserPlus size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Unirse a un Grupo</h1>
        <p className="text-gray-500 mt-2">Ingresa el código de 6 caracteres que te proporcionó tu profesor</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input
            label="Código del grupo"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="Ej. ABC123"
            className="text-center text-2xl font-mono tracking-widest h-14"
            maxLength={6}
          />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            className="w-full h-11 gap-2"
            onClick={() => lookupGroup(manualCode)}
            isLoading={loading}
            disabled={manualCode.length !== 6}
          >
            <UserPlus size={16} /> Unirse al Grupo
          </Button>

          <p className="text-center text-sm text-gray-400">
            ¿No tienes un código?{' '}
            <button onClick={() => navigate('/grupos')} className="text-uat-blue hover:underline">
              Ver tus grupos
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
