import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { api } from '../../services/api';

interface AdminLoginProps {
  onLoginSuccess: (user: any) => void;
  onClose: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login(email, password);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Identifiants invalides');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFF9F0] w-full max-w-md rounded-3xl shadow-2xl border border-[#EBDCC5] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1F1F1F] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-stone-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[#C62828] text-white flex items-center justify-center mb-3 shadow-md">
            <Lock className="w-6 h-6 text-[#FFE082]" />
          </div>
          <h3 className="font-serif text-xl font-bold text-white">
            Espace d'Administration
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Gestion du menu, des commandes en direct et des paramètres du restaurant.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#C62828]"
                placeholder="votre@email.mg"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#C62828]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C62828] hover:bg-[#8E1B1B] text-white py-3 px-4 rounded-xl font-bold text-xs shadow-md shadow-[#C62828]/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authentification...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#F4C542]" />
                <span>Accéder au Back-Office</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
