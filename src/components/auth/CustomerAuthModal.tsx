import React, { useState, useRef } from 'react';
import { X, User, Phone, Mail, MapPin, ArrowRight, ShieldCheck, AlertCircle, LogIn, UserPlus, Eye, EyeOff, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { api } from '../../services/api';
import { isValidEmail, isValidPhone, HONEYPOT_FIELD } from '../../utils/validation';

const SECURITY_QUESTIONS = [
  'Quel est le nom de votre premier animal de compagnie ?',
  'Quelle est votre ville de naissance ?',
  'Quel est le prénom de votre mère ?',
  'Quel est le nom de votre école primaire ?',
  'Quel est votre plat malgache préféré ?',
  'Autre (à préciser)',
];

export const CustomerAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    authNotice,
    setAuthNotice,
    login,
    register,
  } = useCustomerAuth();

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [fullName, setFullName] = useState('');
  const [regType, setRegType] = useState<'phone' | 'email'>('phone');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAddress, setRegAddress] = useState('');
  const [regDistrict, setRegDistrict] = useState('Antanimena');
  const [regDistrictOther, setRegDistrictOther] = useState('');
  const [regSecurityQuestion, setRegSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [regSecurityQuestionOther, setRegSecurityQuestionOther] = useState('');
  const [regSecurityAnswer, setRegSecurityAnswer] = useState('');
  // Anti-spam : champ piège invisible + heure d'ouverture du formulaire
  const [regHoneypot, setRegHoneypot] = useState('');
  const regStartedAt = useRef(Date.now());
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Forgot password flow state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<'identifier' | 'answer' | 'done'>('identifier');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotQuestion, setForgotQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const resetForgotFlow = () => {
    setForgotMode(false);
    setForgotStep('identifier');
    setForgotIdentifier('');
    setForgotQuestion('');
    setForgotAnswer('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError(null);
  };

  const handleForgotIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotIdentifier.trim()) {
      setForgotError('Veuillez saisir votre numéro de téléphone ou votre adresse email.');
      return;
    }
    setForgotLoading(true);
    const res = await api.getSecurityQuestion(forgotIdentifier.trim());
    setForgotLoading(false);
    if (res.success && res.question) {
      setForgotQuestion(res.question);
      setForgotStep('answer');
    } else {
      setForgotError(res.error || 'Compte introuvable.');
    }
  };

  const handleForgotAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotAnswer.trim()) {
      setForgotError('Veuillez répondre à la question de sécurité.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setForgotLoading(true);
    const res = await api.resetPasswordWithSecurityAnswer(forgotIdentifier.trim(), forgotAnswer.trim(), forgotNewPassword);
    setForgotLoading(false);
    if (res.success) {
      setForgotStep('done');
    } else {
      setForgotError(res.error || 'Réponse incorrecte.');
    }
  };

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setAuthNotice(null);
    setLoginError(null);
    setRegError(null);
    resetForgotFlow();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!identifier.trim()) {
      setLoginError('Veuillez renseigner votre numéro de téléphone ou votre adresse email.');
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      setLoginError('Veuillez renseigner votre mot de passe (au moins 6 caractères).');
      return;
    }

    setLoginLoading(true);
    const result = await login(identifier.trim(), loginPassword);
    setLoginLoading(false);

    if (!result.success) {
      if (result.notFound) {
        setLoginError('Ce numéro ou cette adresse email n’est pas encore enregistré(e).');
      } else {
        setLoginError(result.error || 'Impossible de vous connecter. Vérifiez votre saisie.');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!fullName.trim()) {
      setRegError('Veuillez saisir votre nom complet.');
      return;
    }
    if (!regIdentifier.trim()) {
      setRegError(`Veuillez saisir votre ${regType === 'phone' ? 'numéro de téléphone' : 'adresse email'}.`);
      return;
    }
    if (regType === 'phone' && !isValidPhone(regIdentifier)) {
      setRegError('Le numéro de téléphone semble invalide (8 à 15 chiffres, ex. 034 12 345 67).');
      return;
    }
    if (regType !== 'phone' && !isValidEmail(regIdentifier)) {
      setRegError("L'adresse email semble invalide (ex. nom@exemple.com).");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError('Veuillez choisir un mot de passe d\'au moins 6 caractères.');
      return;
    }
    const finalDistrict = regDistrict === '__other__' ? regDistrictOther.trim() : regDistrict.trim();
    if (regDistrict === '__other__' && !finalDistrict) {
      setRegError('Veuillez préciser votre quartier / zone.');
      return;
    }
    const finalQuestion = regSecurityQuestion === 'Autre (à préciser)' ? regSecurityQuestionOther.trim() : regSecurityQuestion;
    if (regSecurityQuestion === 'Autre (à préciser)' && !finalQuestion) {
      setRegError('Veuillez préciser votre question de sécurité.');
      return;
    }
    if (!regSecurityAnswer.trim()) {
      setRegError('Veuillez répondre à votre question de sécurité (utile en cas de mot de passe oublié).');
      return;
    }

    setRegLoading(true);
    const payload: {
      fullName: string;
      phone?: string;
      email?: string;
      address?: string;
      district?: string;
      password: string;
      securityQuestion: string;
      securityAnswer: string;
      website?: string;
      formStartedAt?: number;
    } = {
      [HONEYPOT_FIELD]: regHoneypot,
      formStartedAt: regStartedAt.current,
      fullName: fullName.trim(),
      address: regAddress.trim(),
      district: finalDistrict,
      password: regPassword,
      securityQuestion: finalQuestion,
      securityAnswer: regSecurityAnswer.trim(),
    };

    if (regType === 'phone') {
      payload.phone = regIdentifier.trim();
    } else {
      payload.email = regIdentifier.trim();
    }

    const result = await register(payload);
    setRegLoading(false);

    if (!result.success) {
      setRegError(result.error || "Impossible d'enregistrer votre profil.");
    }
  };

  const switchToRegisterWithIdentifier = () => {
    const val = identifier.trim();
    if (val.includes('@')) {
      setRegType('email');
      setRegIdentifier(val);
    } else {
      setRegType('phone');
      setRegIdentifier(val);
    }
    setLoginError(null);
    setAuthModalMode('register');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] w-full max-w-lg rounded-3xl shadow-2xl border border-[#E6DECF] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-[#111111] to-[#000000] text-white p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xs">
              <User className="w-6 h-6 text-[#C62828]" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#E9D9B4] flex items-center gap-1.5">
                <span>Espace Client Gourmand</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-white">
                {authModalMode === 'login' ? 'Connexion Client' : 'Créer mon Profil'}
              </h3>
            </div>
          </div>

          <p className="mt-2 text-xs text-white/85 leading-relaxed">
            Pour commander vos spécialités, connectez-vous avec{' '}
            <strong className="text-[#E9D9B4]">votre numéro de téléphone ou email, et votre mot de passe</strong>.
          </p>
        </div>

        {/* Notice if prompted before ordering */}
        {authNotice && (
          <div className="p-3.5 bg-amber-100/70 border-b border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{authNotice}</p>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        {!forgotMode && (
        <div className="flex border-b border-[#E6DECF] bg-stone-100/50 p-1.5 m-4 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              authModalMode === 'login'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>J'ai déjà un compte</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('register');
              setRegError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              authModalMode === 'register'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nouveau client (Inscription)</span>
          </button>
        </div>
        )}

        {/* Modal Content */}
        <div className="px-6 pb-6 pt-1 flex-1 overflow-y-auto">
          {forgotMode ? (
            /* ================= FORGOT PASSWORD FLOW ================= */
            <div className="space-y-4 pt-4">
              <button
                type="button"
                onClick={resetForgotFlow}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1"
              >
                <span>← Retour à la connexion</span>
              </button>

              {forgotStep === 'identifier' && (
                <form onSubmit={handleForgotIdentifierSubmit} className="space-y-4">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-stone-800">
                    <HelpCircle className="w-4 h-4 text-[#111111]" />
                    <span>Mot de passe oublié</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Saisissez votre numéro de téléphone ou votre email pour récupérer votre question de sécurité.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      Téléphone ou email
                    </label>
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="034... ou votre@email.com"
                      className="w-full px-3.5 py-3 bg-white rounded-xl border border-[#E6DECF] text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] shadow-2xs"
                    />
                  </div>
                  {forgotError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-[#111111] hover:bg-[#000000] text-white py-3 px-4 rounded-xl font-bold text-xs shadow-md shadow-[#111111]/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? 'Recherche...' : 'Continuer'}
                  </button>
                </form>
              )}

              {forgotStep === 'answer' && (
                <form onSubmit={handleForgotAnswerSubmit} className="space-y-4">
                  <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl">
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                      Votre question de sécurité
                    </div>
                    <p className="text-sm font-semibold text-stone-800">{forgotQuestion}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      Votre réponse
                    </label>
                    <input
                      type="text"
                      required
                      value={forgotAnswer}
                      onChange={(e) => setForgotAnswer(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#E6DECF] text-sm text-stone-900 focus:outline-none focus:border-[#111111] shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Au moins 6 caractères"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 bg-white rounded-xl border border-[#E6DECF] text-sm text-stone-900 focus:outline-none focus:border-[#111111] shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700"
                        tabIndex={-1}
                      >
                        {showForgotPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type={showForgotPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#E6DECF] text-sm text-stone-900 focus:outline-none focus:border-[#111111] shadow-2xs"
                    />
                  </div>
                  {forgotError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-[#111111] hover:bg-[#000000] text-white py-3 px-4 rounded-xl font-bold text-xs shadow-md shadow-[#111111]/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? 'Vérification...' : 'Réinitialiser mon mot de passe'}
                  </button>
                </form>
              )}

              {forgotStep === 'done' && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800">Mot de passe réinitialisé !</h4>
                    <p className="text-xs text-stone-600 mt-1">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier(forgotIdentifier);
                      resetForgotFlow();
                      setAuthModalMode('login');
                    }}
                    className="w-full bg-[#1F1F1F] hover:bg-black text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Retour à la connexion
                  </button>
                </div>
              )}
            </div>
          ) : authModalMode === 'login' ? (
            /* ================= LOGIN TAB ================= */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Adresse email ou Numéro de téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: +261 34 12 345 67 ou aina@gmail.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-[#E6DECF] text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] shadow-2xs"
                  />
                </div>
                <p className="mt-1 text-[11px] text-stone-500">
                  Saisissez votre numéro mobile (034..., 032..., 033...) ou votre email.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotIdentifier(identifier);
                      setForgotMode(true);
                      setLoginError(null);
                    }}
                    className="text-[11px] font-semibold text-[#111111] hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-white rounded-xl border border-[#E6DECF] text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#111111]/20 focus:border-[#111111] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700"
                    tabIndex={-1}
                    title={showLoginPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={switchToRegisterWithIdentifier}
                    className="text-left font-semibold text-[#111111] hover:underline flex items-center gap-1 text-[11px] mt-0.5"
                  >
                    <span>Créer un profil avec « {identifier} » dès maintenant</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#111111] hover:bg-[#000000] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md shadow-[#111111]/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? (
                  <span>Vérification...</span>
                ) : (
                  <>
                    <span>Me connecter & Accéder au menu</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ================= REGISTER TAB ================= */
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Champ piège anti-robots : invisible et ignoré par les humains */}
              <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                <label>
                  Ne pas remplir
                  <input
                    type="text"
                    name={HONEYPOT_FIELD}
                    tabIndex={-1}
                    autoComplete="off"
                    value={regHoneypot}
                    onChange={(e) => setRegHoneypot(e.target.value)}
                  />
                </label>
              </div>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fanja Andrianarisoa"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#E6DECF] text-xs text-stone-900 focus:outline-none focus:border-[#111111] shadow-2xs"
                />
              </div>

              {/* Identifier choice: Phone OR Email */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-800">
                    Identifiant principal <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 text-[11px] font-medium">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="regType"
                        checked={regType === 'phone'}
                        onChange={() => setRegType('phone')}
                        className="text-[#111111] focus:ring-[#111111]"
                      />
                      <span>Numéro de téléphone</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="regType"
                        checked={regType === 'email'}
                        onChange={() => setRegType('email')}
                        className="text-[#111111] focus:ring-[#111111]"
                      />
                      <span>Adresse email</span>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    {regType === 'phone' ? <Phone className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                  </div>
                  <input
                    type={regType === 'phone' ? 'tel' : 'email'}
                    required
                    placeholder={regType === 'phone' ? 'Ex: 034 12 345 67 ou +261 32 00 000 00' : 'Ex: monadresse@gmail.com'}
                    value={regIdentifier}
                    onChange={(e) => setRegIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-[#E6DECF] text-xs text-stone-900 focus:outline-none focus:border-[#111111] shadow-2xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Au moins 6 caractères"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-white rounded-xl border border-[#E6DECF] text-xs text-stone-900 focus:outline-none focus:border-[#111111] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700"
                    tabIndex={-1}
                    title={showRegPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security Question (for password recovery) */}
              <div className="space-y-2 p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Pour récupérer votre mot de passe</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Question de sécurité <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={regSecurityQuestion}
                    onChange={(e) => setRegSecurityQuestion(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#E6DECF] text-xs text-stone-900 focus:outline-none focus:border-[#111111]"
                  >
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  {regSecurityQuestion === 'Autre (à préciser)' && (
                    <input
                      type="text"
                      required
                      placeholder="Votre propre question"
                      value={regSecurityQuestionOther}
                      onChange={(e) => setRegSecurityQuestionOther(e.target.value)}
                      className="w-full mt-2 px-3.5 py-2 bg-white rounded-xl border border-[#E6DECF] text-xs text-stone-900 focus:outline-none focus:border-[#111111]"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Votre réponse <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Réponse (pas sensible à la casse)"
                    value={regSecurityAnswer}
                    onChange={(e) => setRegSecurityAnswer(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white rounded-xl border border-[#E6DECF] text-xs text-stone-900 focus:outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Default Address */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Adresse de livraison habituelle (Optionnel)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Villa 12, Lot II M 45"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-[#E6DECF] text-xs text-stone-900 focus:outline-none focus:border-[#111111] shadow-2xs"
                  />
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Quartier / Zone
                </label>
                <select
                  value={regDistrict}
                  onChange={(e) => setRegDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#E6DECF] text-xs text-stone-900 focus:outline-none focus:border-[#111111]"
                >
                  <option value="Antanimena">Antanimena (Proche Restaurant)</option>
                  <option value="Ankorondrano">Ankorondrano</option>
                  <option value="Analakely">Analakely / Centre-ville</option>
                  <option value="Ivandry">Ivandry / Alarobia</option>
                  <option value="Isoraka">Isoraka / Antaninarenina</option>
                  <option value="Ambohijatovo">Ambohijatovo / Mahamasina</option>
                  <option value="__other__">Autre (à préciser)</option>
                </select>
                {regDistrict === '__other__' && (
                  <input
                    type="text"
                    required
                    placeholder="Précisez votre quartier / zone"
                    value={regDistrictOther}
                    onChange={(e) => setRegDistrictOther(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2 bg-white rounded-xl border border-[#E6DECF] text-xs text-stone-900 focus:outline-none focus:border-[#111111]"
                  />
                )}
              </div>

              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-[#111111] hover:bg-[#000000] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#111111]/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {regLoading ? (
                    <span>Création du profil en cours...</span>
                  ) : (
                    <>
                      <span>Créer mon profil & Valider</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="mt-3 text-[11px] text-stone-400 text-center leading-relaxed">
                  En créant votre profil, vous acceptez nos{' '}
                  <a href="/conditions-generales" target="_blank" className="underline hover:text-stone-600">conditions générales de vente</a>{' '}
                  et notre{' '}
                  <a href="/confidentialite" target="_blank" className="underline hover:text-stone-600">politique de confidentialité</a>.
                </p>
              </div>
            </form>
          )}

          <div className="mt-5 pt-3 border-t border-stone-200/70 text-center text-[11px] text-stone-500">
            <span>Vos informations restent strictement confidentielles pour votre livraison.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
