import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ADMIN_API_ERROR_EVENT } from '../../services/api';

/**
 * Alerte affichée quand une modification admin n'a pas été enregistrée
 * par le serveur (serveur injoignable, erreur, image trop lourde...).
 */
export const AdminErrorToast: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handler = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail || "La modification n'a pas été enregistrée.");
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 8000);
    };
    window.addEventListener(ADMIN_API_ERROR_EVENT, handler);
    return () => {
      window.removeEventListener(ADMIN_API_ERROR_EVENT, handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md bg-red-700 text-white rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 text-sm"
    >
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="flex-1 font-semibold leading-snug">{message}</p>
      <button
        type="button"
        onClick={() => setMessage(null)}
        className="text-white/80 hover:text-white cursor-pointer"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
