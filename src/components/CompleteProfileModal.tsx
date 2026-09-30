import React, { useState } from 'react';
import { Briefcase, Building, ShieldCheck, Sparkles, Check, ArrowRight } from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types/wiki';
import { saveUserProfile, updateUserPhotoAndName } from '../firebase/wikiService';

interface CompleteProfileModalProps {
  isOpen: boolean;
  user: User | null;
  onComplete: (profile: UserProfile) => void;
}

const COMMON_DEPARTMENTS = [
  'Tecnologia da Informação (TI)',
  'Engenharia & DevOps',
  'Design & Criação',
  'Gente & Gestão (RH)',
  'Operações & Logística',
  'Comercial & Vendas',
  'Financeiro & Controladoria',
  'Diretoria Executiva',
];

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  isOpen,
  user,
  onComplete,
}) => {
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState(COMMON_DEPARTMENTS[0]);
  const [customDept, setCustomDept] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = role.trim();
    const finalDept = department === 'outro' ? customDept.trim() : department.trim();

    if (!finalRole) {
      setError('Por favor, informe seu cargo atual na ETECC.');
      return;
    }

    if (!finalDept) {
      setError('Por favor, informe seu setor ou departamento.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalName = displayName.trim() || user.displayName || user.email?.split('@')[0] || 'Colaborador ETECC';
      const photoURL = user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`;

      await updateUserPhotoAndName(finalName, photoURL, finalRole, finalDept);

      const profile: UserProfile = {
        uid: user.uid,
        displayName: finalName,
        email: user.email || '',
        photoURL: photoURL,
        role: finalRole,
        department: finalDept,
        updatedAt: Date.now(),
      };

      await saveUserProfile(profile);
      onComplete(profile);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Erro ao salvar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Banner with ETECC Red */}
        <div className="bg-gradient-to-r from-[#e4022c] to-[#b30020] p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#e4022c] flex items-center justify-center font-black text-2xl mx-auto mb-2 shadow-md">
            E
          </div>
          <h2 className="text-xl font-bold tracking-tight">Complete seu Perfil Corporativo</h2>
          <p className="text-xs text-white/85 mt-1 max-w-sm mx-auto">
            Para publicar e participar do Wiki da ETECC, é necessário preencher seu <strong>cargo</strong> e <strong>setor atual</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {/* User Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800">
            <img
              src={
                user.photoURL ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || 'ETECC')}`
              }
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#e4022c]"
            />
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-semibold text-stone-500 mb-0.5">Nome no Wiki</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="w-full text-xs font-bold text-stone-900 dark:text-white bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-[#e4022c]"
              />
              <p className="text-[11px] text-stone-400 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Cargo Atual (Role) */}
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
              Cargo Atual na Empresa *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 w-4 h-4 text-[#e4022c]" />
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Engenheiro de Software Pleno, Analista de RH, Coordenador de TI..."
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Este cargo será exibido logo abaixo do seu nome em todos os artigos e comentários.</p>
          </div>

          {/* Setor Atual (Department) */}
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
              Setor / Departamento Atual *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-3 w-4 h-4 text-[#e4022c]" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
              >
                {COMMON_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
                <option value="outro">Outro setor (especificar)...</option>
              </select>
            </div>

            {department === 'outro' && (
              <input
                type="text"
                required
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                placeholder="Digite o nome do seu setor..."
                className="w-full mt-2 px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
              />
            )}
          </div>

          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 flex items-start gap-2.5 text-xs text-stone-600 dark:text-stone-300">
            <ShieldCheck className="w-4 h-4 text-[#e4022c] shrink-0 mt-0.5" />
            <span>
              Suas informações são vinculadas à sua conta Firebase corporativa e garantem a autoria e integridade das publicações no Wiki.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#e4022c] hover:bg-[#c30024] active:scale-[0.99] text-white font-bold text-xs sm:text-sm transition shadow-md shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Salvando Perfil...' : 'Confirmar e Acessar o Wiki'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
