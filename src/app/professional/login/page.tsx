/**
 * Page de connexion unifiée pour tous les professionnels (internes et externes)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function ProfessionalLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'auth' | 'network' | 'validation' | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Validation frontend
  const validateForm = () => {
    if (!email || !password) {
      setError('Veuillez saisir votre email et mot de passe');
      setErrorType('validation');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format d\'email invalide');
      setErrorType('validation');
      return false;
    }

    if (password.length < 3) {
      setError('Le mot de passe doit contenir au moins 3 caractères');
      setErrorType('validation');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setErrorType(null);

    // Validation frontend
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/professional/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await response.json();

      if (data.success) {
        // ÉTAPE CRITIQUE : Stocker le token JWT dans localStorage
        if (data.token) {
          localStorage.setItem('professionalToken', data.token);
          console.log('🔐 Token JWT stocké dans localStorage');
        } else {
          console.error('❌ ERREUR: Aucun token reçu dans la réponse API');
        }

        // Toast de succès avec type d'utilisateur
        const userTypeLabel = data.userType === 'external' ? 'Professionnel Externe' :
                             data.userType === 'internal' ? 'Staff Interne' : 'Utilisateur';

        toast({
          title: "🎉 Connexion réussie !",
          description: `Bienvenue ${userTypeLabel} - ${data.user?.name || data.user?.companyName}`,
          variant: "default",
        });

        console.log(`✅ Connexion réussie - Type: ${data.userType}, Redirection: ${data.redirectUrl}`);

        // Maintenir l'état de loading pendant la redirection
        // Délai pour permettre l'affichage du toast puis redirection
        setTimeout(() => {
          router.push(data.redirectUrl);
        }, 1000);
      } else {
        // Gestion d'erreurs spécifiques
        if (response.status === 401) {
          setError('Email ou mot de passe incorrect');
          setErrorType('auth');
        } else if (response.status === 403) {
          setError(data.error || 'Compte non autorisé');
          setErrorType('auth');
        } else if (response.status === 500) {
          setError('Erreur serveur. Réessayez dans quelques instants.');
          setErrorType('network');
        } else {
          setError(data.error || 'Erreur de connexion');
          setErrorType('auth');
        }
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('Impossible de se connecter. Vérifiez votre connexion internet.');
      setErrorType('network');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Espace Professionnel
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous à votre tableau de bord Express Quote
          </p>
          
          {/* Info badges */}
          <div className="mt-4 flex justify-center space-x-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              🏢 Staff Interne
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🤝 Partenaires Externes
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message avec types spécifiques */}
            {error && (
              <div className={`px-4 py-3 rounded-lg flex items-center ${
                errorType === 'validation'
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                  : errorType === 'network'
                  ? 'bg-orange-50 border border-orange-200 text-orange-800'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {errorType === 'validation' ? (
                  <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : errorType === 'network' ? (
                  <svg className="w-5 h-5 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <div>
                  <div className="font-medium">
                    {errorType === 'validation' && '⚠️ Validation'}
                    {errorType === 'network' && '🌐 Connexion'}
                    {errorType === 'auth' && '🔒 Authentification'}
                  </div>
                  <div className="text-sm">{error}</div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email professionnelle
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 focus:z-10 sm:text-sm transition-all ${
                  errorType === 'validation' && error.includes('email')
                    ? 'border-yellow-300 focus:ring-yellow-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="votre-email@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 focus:z-10 sm:text-sm transition-all ${
                  errorType === 'validation' && error.includes('mot de passe')
                    ? 'border-yellow-300 focus:ring-yellow-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <a href="mailto:support@express-quote.com?subject=Mot de passe oublié" className="font-medium text-blue-600 hover:text-blue-500">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion en cours...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Se connecter
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <strong>Staff interne :</strong> Accès aux missions et documents
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Partenaires externes :</strong> Missions disponibles et gestion
              </p>
            </div>
          </div>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Problème de connexion ?{' '}
            <a href="mailto:support@express-quote.com" className="font-medium text-blue-600 hover:text-blue-500">
              Contactez le support technique
            </a>
          </p>
          
          <div className="flex justify-center space-x-4 text-xs text-gray-500">
            <a href="/contact" className="hover:text-blue-600">Devenir partenaire</a>
            <span>•</span>
            <a href="/legal/privacy" className="hover:text-blue-600">Confidentialité</a>
            <span>•</span>
            <a href="/legal/terms" className="hover:text-blue-600">CGU</a>
          </div>
        </div>

        {/* Demo Credentials (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="p-4 bg-yellow-50 border border-yellow-200">
            <div className="text-center">
              <p className="text-sm font-medium text-yellow-800 mb-2">🔧 Environnement de développement</p>
              <div className="text-xs text-yellow-700 space-y-1">
                <p><strong>Admin :</strong> admin@express-quote.com</p>
                <p><strong>Manager déménagement :</strong> moving.manager@express-quote.com</p>
                <p><strong>Professionnel externe :</strong> contact@demenagements-express.com</p>
                <p><strong>Ménage :</strong> contact@menage-pro.com</p>
                <p><em>Mot de passe : demo123</em></p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}