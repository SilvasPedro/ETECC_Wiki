import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Image as ImageIcon, AlertCircle, Sparkles, Briefcase, Building } from 'lucide-react';
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../firebase/wikiService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_AVATARS = [
  { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80' },
  { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80' },
  { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80' },
  { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80' },
  { label: 'Avatar 5', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80' },
  { label: 'Avatar 6', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [photoURL, setPhotoURL] = useState(PRESET_AVATARS[0].url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      console.error('Google auth error:', fbErr);
      if (fbErr.code === 'auth/popup-closed-by-user') {
        setError('Login com Google cancelado pelo usuário.');
      } else if (fbErr.code === 'auth/popup-blocked') {
        setError('O pop-up de login foi bloqueado pelo navegador. Por favor, permita pop-ups.');
      } else {
        setError(fbErr.message || 'Erro ao autenticar com o Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!displayName.trim()) {
          setError('Por favor, informe seu nome corporativo.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, displayName, photoURL, role, department);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      console.error('Auth error:', fbErr);
      if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (fbErr.code === 'auth/user-not-found') {
        setError('Colaborador não encontrado com este e-mail.');
      } else if (fbErr.code === 'auth/email-already-in-use') {
        setError('Este e-mail corporativo já possui conta cadastrada.');
      } else if (fbErr.code === 'auth/weak-password') {
        setError('A senha deve ter no mínimo 6 caracteres.');
      } else if (fbErr.code === 'auth/invalid-email') {
        setError('Formato de e-mail inválido.');
      } else {
        setError(fbErr.message || 'Erro ao autenticar. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('colaborador@etecc.com.br');
    setPassword('etecc123456');
    setDisplayName('Colaborador ETECC');
    try {
      setLoading(true);
      await loginWithEmail('colaborador@etecc.com.br', 'etecc123456');
      onSuccess();
      onClose();
    } catch {
      try {
        await registerWithEmail(
          'colaborador@etecc.com.br', 
          'etecc123456', 
          'Colaborador ETECC', 
          PRESET_AVATARS[0].url,
          'Engenheiro de Soluções',
          'Tecnologia da Informação'
        );
        onSuccess();
        onClose();
      } catch (e: unknown) {
        const error = e as { message?: string };
        setError(error.message || 'Erro no login demonstrativo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-8">
        {/* Header with Red Accent */}
        <div className="bg-gradient-to-r from-[#e4022c] to-[#b30020] p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white text-[#e4022c] flex items-center justify-center font-black text-2xl mx-auto mb-2 shadow-md">
            E
          </div>
          <h2 className="text-xl font-bold tracking-tight">ETECC Wiki Corporativo</h2>
          <p className="text-xs text-white/80 mt-1">
            {mode === 'login' ? 'Entre com seu e-mail corporativo ou Google' : 'Cadastre-se para publicar e editar no Wiki'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#e4022c]" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-100 font-semibold text-xs sm:text-sm shadow-xs transition mb-4 active:scale-[0.99]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar com o Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-stone-900 px-2 text-stone-400">ou com e-mail corporativo</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ex: Mariana Silva"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Cargo Atual
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 w-3.5 h-3.5 text-stone-400" />
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Ex: Analista de TI"
                        className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Setor / Depto
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 w-3.5 h-3.5 text-stone-400" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Ex: Operações"
                        className="w-full pl-8 pr-2 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Foto de Perfil (photoURL)
                  </label>
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={photoURL}
                      alt="Preview"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-[#e4022c]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                      }}
                    />
                    <div className="flex-1">
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
                        <input
                          type="url"
                          value={photoURL}
                          onChange={(e) => setPhotoURL(e.target.value)}
                          placeholder="URL da sua foto"
                          className="w-full pl-8 pr-2 py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {PRESET_AVATARS.map((av, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setPhotoURL(av.url)}
                        className={`relative rounded-full shrink-0 transition ${
                          photoURL === av.url ? 'ring-2 ring-[#e4022c] scale-105' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={av.url} alt={av.label} className="w-7 h-7 rounded-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@etecc.com.br"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#e4022c] hover:bg-[#c30024] active:scale-[0.98] text-white font-semibold text-sm transition shadow-md shadow-red-600/20 disabled:opacity-50"
            >
              {loading ? 'Processando...' : mode === 'login' ? 'Entrar no Wiki' : 'Criar Conta Corporativa'}
            </button>
          </form>

          {/* Quick Demo Access Button */}
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#e4022c]" />
              <span>Acesso Rápido de Teste (Colaborador ETECC)</span>
            </button>
          </div>

          {/* Switch Login / Register */}
          <div className="mt-4 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Ainda não tem cadastro?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="font-semibold text-[#e4022c] hover:underline"
                >
                  Criar conta com foto
                </button>
              </p>
            ) : (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Já possui conta corporativa?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="font-semibold text-[#e4022c] hover:underline"
                >
                  Fazer login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

