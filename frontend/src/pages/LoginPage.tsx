import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, GraduationCap, Mail, Lock, User, BookOpen, Hash, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
  remember: z.boolean().optional(),
});

const registerSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z
    .string()
    .email('Correo inválido')
    .refine(
      (email) => email.endsWith('@uat.edu.mx') || email.endsWith('@alumnos.uat.edu.mx'),
      'Solo se permiten correos @uat.edu.mx o @alumnos.uat.edu.mx'
    ),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  matricula: z.string().optional(),
  carrera: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, register, isLoading } = useAuthStore();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const emailValue = registerForm.watch('email') || '';
  const isAlumno = emailValue.endsWith('@alumnos.uat.edu.mx');
  const isProfesor = emailValue.endsWith('@uat.edu.mx') && !emailValue.endsWith('@alumnos.uat.edu.mx');

  const onLogin = async (data: LoginForm) => {
    setError('');
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Credenciales incorrectas');
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setError('');
    try {
      await register({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        matricula: data.matricula,
        carrera: data.carrera,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Error al crear la cuenta');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-uat-gradient flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full" />
        </div>

        <div className="relative z-10 text-center max-w-md">
          {/* UAT Logo */}
          <div className="w-24 h-24 bg-uat-gold rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <GraduationCap size={48} className="text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-3">UAT Forms</h1>
          <p className="text-xl text-blue-100 mb-2">Universidad Autónoma de Tamaulipas</p>
          <p className="text-blue-200 text-sm mb-10">
            Plataforma de exámenes y formularios institucionales
          </p>

          {/* Features */}
          <div className="space-y-4 text-left">
            {[
              { icon: '📋', title: 'Crea formularios y exámenes', desc: 'Editor visual intuitivo con múltiples tipos de preguntas' },
              { icon: '👥', title: 'Gestión de grupos', desc: 'Organiza a tus alumnos y asigna formularios fácilmente' },
              { icon: '📊', title: 'Resultados en tiempo real', desc: 'Visualiza estadísticas y exporta datos a Excel' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-white font-medium text-sm">{f.title}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-uat-blue rounded-xl flex items-center justify-center">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-uat-blue">UAT Forms</h1>
              <p className="text-gray-500 text-xs">Universidad Autónoma de Tamaulipas</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <Tabs defaultValue="login">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="login" className="flex-1">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register" className="flex-1">Registrarse</TabsTrigger>
              </TabsList>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Login Tab */}
              <TabsContent value="login">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
                  <p className="text-gray-500 text-sm mt-1">Ingresa con tu correo institucional</p>
                </div>

                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <Input
                    label="Correo institucional"
                    type="email"
                    placeholder="usuario@uat.edu.mx"
                    leftIcon={<Mail size={16} />}
                    error={loginForm.formState.errors.email?.message}
                    {...loginForm.register('email')}
                  />

                  <div>
                    <Input
                      label="Contraseña"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      leftIcon={<Lock size={16} />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                      error={loginForm.formState.errors.password?.message}
                      {...loginForm.register('password')}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 rounded border-gray-300 text-uat-blue focus:ring-uat-blue"
                      {...loginForm.register('remember')}
                    />
                    <label htmlFor="remember" className="text-sm text-gray-600">Recordarme</label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11"
                    isLoading={isLoading}
                  >
                    Iniciar Sesión
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">Dominios permitidos:</p>
                  <p className="text-xs text-blue-600 mt-1">
                    @uat.edu.mx → Profesores<br />
                    @alumnos.uat.edu.mx → Alumnos
                  </p>
                </div>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
                  <p className="text-gray-500 text-sm mt-1">Regístrate con tu correo institucional UAT</p>
                </div>

                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <Input
                    label="Nombre completo"
                    type="text"
                    placeholder="Ej. Juan García López"
                    leftIcon={<User size={16} />}
                    error={registerForm.formState.errors.nombre?.message}
                    {...registerForm.register('nombre')}
                  />

                  <div>
                    <Input
                      label="Correo institucional"
                      type="email"
                      placeholder="usuario@uat.edu.mx"
                      leftIcon={<Mail size={16} />}
                      error={registerForm.formState.errors.email?.message}
                      {...registerForm.register('email')}
                    />
                    {(isAlumno || isProfesor) && (
                      <div className={`mt-1 flex items-center gap-1 text-xs ${isProfesor ? 'text-green-600' : 'text-blue-600'}`}>
                        <span className="w-3 h-3 rounded-full bg-current inline-block" />
                        {isProfesor ? 'Rol: Profesor' : 'Rol: Alumno'}
                      </div>
                    )}
                  </div>

                  <Input
                    label={isProfesor ? 'Número de empleado' : 'Matrícula'}
                    type="text"
                    placeholder={isProfesor ? 'Ej. EMP12345' : 'Ej. 2020123456'}
                    leftIcon={<Hash size={16} />}
                    {...registerForm.register('matricula')}
                  />

                  <Input
                    label={isProfesor ? 'Departamento' : 'Carrera'}
                    type="text"
                    placeholder={isProfesor ? 'Ej. Sistemas Computacionales' : 'Ej. Ingeniería en Sistemas'}
                    leftIcon={<BookOpen size={16} />}
                    {...registerForm.register('carrera')}
                  />

                  <Input
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    leftIcon={<Lock size={16} />}
                    rightIcon={
                      <button type="button" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    error={registerForm.formState.errors.password?.message}
                    {...registerForm.register('password')}
                  />

                  <Input
                    label="Confirmar contraseña"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    leftIcon={<Lock size={16} />}
                    error={registerForm.formState.errors.confirmPassword?.message}
                    {...registerForm.register('confirmPassword')}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11"
                    isLoading={isLoading}
                  >
                    Crear Cuenta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Universidad Autónoma de Tamaulipas. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
