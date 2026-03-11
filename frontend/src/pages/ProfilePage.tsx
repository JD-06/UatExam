import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Hash, BookOpen, Building2, Lock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from '../components/ui/toast';
import api from '../api/client';

const profileSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  matricula: z.string().optional(),
  carrera: z.string().optional(),
  departamento: z.string().optional(),
});

const passwordSchema = z.object({
  password: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmNew: z.string(),
}).refine((d) => d.newPassword === d.confirmNew, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmNew'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [stats, setStats] = useState<{ formularios: number; respuestas: number; grupos: number }>({
    formularios: 0, respuestas: 0, grupos: 0,
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre: user?.nombre || '',
      matricula: user?.matricula || '',
      carrera: user?.carrera || user?.departamento || '',
      departamento: user?.departamento || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    api.get('/users/profile').then(({ data }) => {
      const u = data.user;
      setStats({
        formularios: u._count?.formularios || 0,
        respuestas: u._count?.respuestas || 0,
        grupos: u._count?.gruposCreados || 0,
      });
      profileForm.reset({
        nombre: u.nombre,
        matricula: u.matricula || '',
        carrera: u.carrera || '',
        departamento: u.departamento || '',
      });
    }).catch(() => {});
  }, []);

  const onSaveProfile = async (data: ProfileForm) => {
    setSaving(true);
    try {
      const { data: res } = await api.put('/users/profile', data);
      updateUser(res.user);
      toast.success('Perfil actualizado exitosamente');
    } catch {
      toast.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setSavingPassword(true);
    try {
      await api.put('/users/profile', {
        password: data.password,
        newPassword: data.newPassword,
      });
      toast.success('Contraseña cambiada exitosamente');
      passwordForm.reset();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Error al cambiar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tu información personal</p>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-uat-blue flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl">
                {user?.nombre?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.nombre}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <Badge variant={user?.rol === 'profesor' ? 'default' : 'secondary'} className="mt-1 capitalize">
                {user?.rol}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {user?.rol === 'profesor' ? (
              <>
                <StatItem value={stats.formularios} label="Formularios" />
                <StatItem value={stats.grupos} label="Grupos" />
                <StatItem value={stats.respuestas} label="Respuestas" />
              </>
            ) : (
              <>
                <StatItem value={stats.respuestas} label="Completados" />
                <StatItem value={0} label="Grupos" />
                <StatItem value={0} label="Promedio" suffix="/10" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={16} className="text-uat-blue" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <Input
              label="Nombre completo"
              leftIcon={<User size={16} />}
              error={profileForm.formState.errors.nombre?.message}
              {...profileForm.register('nombre')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={user?.rol === 'profesor' ? 'No. Empleado' : 'Matrícula'}
                leftIcon={<Hash size={16} />}
                {...profileForm.register('matricula')}
              />
              <Input
                label={user?.rol === 'profesor' ? 'Departamento' : 'Carrera'}
                leftIcon={<BookOpen size={16} />}
                {...profileForm.register('carrera')}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" isLoading={saving} className="gap-2">
                <CheckCircle2 size={14} /> Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={16} className="text-uat-blue" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <Input
              label="Contraseña actual"
              type="password"
              leftIcon={<Lock size={16} />}
              error={passwordForm.formState.errors.password?.message}
              {...passwordForm.register('password')}
            />
            <Input
              label="Nueva contraseña"
              type="password"
              leftIcon={<Lock size={16} />}
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              label="Confirmar nueva contraseña"
              type="password"
              leftIcon={<Lock size={16} />}
              error={passwordForm.formState.errors.confirmNew?.message}
              {...passwordForm.register('confirmNew')}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={savingPassword} variant="outline" className="gap-2">
                <Lock size={14} /> Cambiar Contraseña
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Mail size={16} className="text-gray-400" />
            Información de Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Correo electrónico</span>
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rol</span>
              <Badge variant={user?.rol === 'profesor' ? 'default' : 'secondary'} className="capitalize">
                {user?.rol}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              El correo electrónico no puede ser modificado. Para cambios de cuenta contacta al administrador.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatItem({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className="text-2xl font-bold text-uat-blue">{value}{suffix}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
