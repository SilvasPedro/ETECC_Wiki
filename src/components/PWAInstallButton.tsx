import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    }
  };

  if (installSuccess) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Instalado com sucesso!</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (compact) {
      return (
        <button
          onClick={handleInstall}
          title="Instalar App no dispositivo"
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-[#e4022c] hover:bg-[#c30024] active:scale-95 transition-all rounded-lg shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar App</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-[#e4022c] hover:bg-[#c30024] active:scale-95 transition-all rounded-xl shadow-sm shadow-red-500/20"
      >
        <Download className="w-4 h-4" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-lg transition"
          title="Instalar no iPhone/iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#e4022c]" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#e4022c] flex items-center justify-center text-white font-bold text-sm">
                    E
                  </div>
                  <h3 className="text-base font-semibold text-stone-900 dark:text-white">Instalar no iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-stone-600 dark:text-stone-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#e4022c]/10 text-[#e4022c] font-bold text-xs shrink-0">1</span>
                  <p>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Safari.</p>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#e4022c]/10 text-[#e4022c] font-bold text-xs shrink-0">2</span>
                  <p>Role para baixo na lista e selecione <strong>Adicionar à Tela de Início</strong>.</p>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#e4022c]/10 text-[#e4022c] font-bold text-xs shrink-0">3</span>
                  <p>Toque em <strong>Adicionar</strong> no canto superior direito para acessar o Wiki direto da sua tela inicial como app nativo!</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#e4022c] hover:bg-[#c30024] text-white py-2.5 text-sm font-semibold transition shadow-sm"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
