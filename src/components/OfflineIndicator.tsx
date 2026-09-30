import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 dark:bg-amber-700 px-3.5 py-2 text-xs font-medium text-white shadow-xl shadow-amber-900/20 backdrop-blur-md animate-bounce">
      <WifiOff className="w-4 h-4" />
      <span>Modo Offline — Exibindo cache local do ETECC Wiki</span>
    </div>
  );
};
