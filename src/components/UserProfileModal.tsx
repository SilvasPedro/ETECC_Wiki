import React, { useState, useEffect } from 'react';
import { X, Check, Camera, LogOut, User as UserIcon, Briefcase, Building } from 'lucide-react';
import { User } from 'firebase/auth';
import { updateUserPhotoAndName, logoutUser, getUserProfile, saveUserProfile } from '../firebase/wikiService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onProfileUpdated: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [photoURL, setPhotoURL] = useState(
    user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
  );
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || PRESET_AVATARS[0]);
      getUserProfile(user.uid).then((prof) => {
        if (prof) {
          if (prof.role) setRole(prof.role);
          if (prof.department) setDepartment(prof.department);
        }
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const finalRole = role.trim();
      const finalDept = department.trim();

      await updateUserPhotoAndName(displayName.trim(), photoURL.trim(), finalRole, finalDept);

      await saveUserProfile({
        uid: user.uid,
        displayName: displayName.trim(),
        email: user.email || '',
        photoURL: photoURL.trim(),
        role: finalRole,
        department: finalDept,
        updatedAt: Date.now(),
      });

      setFeedback('Perfil corporativo e foto atualizados com sucesso no Firebase!');
      onProfileUpdated();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFeedback(`Erro ao salvar: ${error.message || 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#e4022c] text-white flex items-center justify-center font-bold text-sm">
              E
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">Perfil do Colaborador</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Avatar Preview & photoURL change */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img
                src={photoURL}
                alt={displayName || 'Avatar'}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-[#e4022c]/20 border-2 border-[#e4022c] shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                }}
              />
              <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#e4022c] text-white shadow-md">
                <Camera className="w-3 h-3" />
              </div>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 font-mono">{user.email}</p>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Escolher Foto de Perfil Corporativa
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AVATARS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPhotoURL(preset)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition ${
                    photoURL === preset
                      ? 'border-[#e4022c] ring-2 ring-[#e4022c]/40 scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100 hover:scale-102'
                  }`}
                >
                  <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  {photoURL === preset && (
                    <div className="absolute inset-0 bg-[#e4022c]/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom photoURL field */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Ou inserir URL da Foto (Firebase photoURL)
            </label>
            <input
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://exemplo.com/minha-foto.jpg"
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Nome de Exibição
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
              />
            </div>
          </div>

          {/* Cargo Atual (Role) */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Cargo Atual na Empresa *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Engenheiro de Software Pleno"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
              />
            </div>
          </div>

          {/* Setor Atual (Department) */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Setor / Departamento Atual *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: Tecnologia da Informação"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e4022c]"
              />
            </div>
          </div>

          {feedback && (
            <p className="text-xs text-center font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              {feedback}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#e4022c] hover:bg-[#c30024] text-white font-semibold text-sm transition shadow-sm shadow-red-500/20 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
