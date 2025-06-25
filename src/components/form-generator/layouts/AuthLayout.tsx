"use client";

import React from "react";
import { TrustedProviders } from "../components/TrustedProviders";

interface AuthLayoutProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  // Props spécifiques à l'authentification
  logo?: React.ReactNode | string;
  showSecurityBadge?: boolean;
  footerLinks?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  backgroundImage?: string;
  variant?: "centered" | "split" | "minimal";
  // Providers de confiance
  trustedProviders?: {
    enabled?: boolean;
    title?: string;
    providers?: Array<{
      name: string;
      label: string;
      icon?: React.ReactNode;
      onClick: () => void;
      bgColor?: string;
      textColor?: string;
      borderColor?: string;
    }>;
  };
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  description,
  actions,
  children,
  className = "",
  logo,
  showSecurityBadge = true,
  footerLinks = [],
  backgroundImage,
  variant = "centered",
  trustedProviders
}) => {
  const renderLogo = () => {
    if (!logo) return null;
    
    return (
      <div className="flex justify-center mb-8">
        {typeof logo === "string" ? (
          <img src={logo} alt="Logo" className="h-12 w-auto" />
        ) : (
          logo
        )}
      </div>
    );
  };

  const renderSecurityBadge = () => {
    if (!showSecurityBadge) return null;
    
    return (
      <div className="flex items-center justify-center text-sm text-gray-500 mb-6">
        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Connexion sécurisée
      </div>
    );
  };

  const renderFooterLinks = () => {
    if (footerLinks.length === 0) return null;
    
    return (
      <div className="mt-6 text-center">
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          {footerLinks.map((link, index) => (
            <React.Fragment key={index}>
              {link.href ? (
                <a
                  href={link.href}
                  className="text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={link.onClick}
                  className="text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  {link.label}
                </button>
              )}
              {index < footerLinks.length - 1 && (
                <span className="text-gray-300">•</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderTrustedProviders = () => {
    if (!trustedProviders?.enabled || !trustedProviders.providers) return null;
    
    // Transformer les providers pour s'assurer de la compatibilité des types
    const validProviders = trustedProviders.providers
      .filter(provider => provider.icon) // Filtrer seulement ceux qui ont une icône
      .map(provider => ({
        ...provider,
        icon: provider.icon!,
        bgColor: provider.bgColor || "bg-white",
        textColor: provider.textColor || "text-gray-700",
        borderColor: provider.borderColor
      }));
    
    if (validProviders.length === 0) return null;
    
    return (
      <TrustedProviders
        providers={validProviders}
        title={trustedProviders.title}
        className="mb-6"
      />
    );
  };

  const renderCenteredLayout = () => (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      backgroundImage ? 'bg-cover bg-center bg-no-repeat' : 'bg-gray-50'
    }`} style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}>
      {backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      )}
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {renderLogo()}
          
          <div className="text-center">
            {title && (
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-gray-600 mb-6">
                {description}
              </p>
            )}
          </div>

          {renderSecurityBadge()}

          <div className="space-y-6">
            {children}
            
            {actions && (
              <div className="flex flex-col space-y-3">
                {actions}
              </div>
            )}
            
            {renderTrustedProviders()}
          </div>

          {renderFooterLinks()}
        </div>
      </div>
    </div>
  );

  const renderSplitLayout = () => (
    <div className="min-h-screen flex">
      {/* Côté gauche - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-600 relative">
        {backgroundImage ? (
          <div 
            className="w-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
            <div className="absolute inset-0 bg-emerald-600 bg-opacity-75"></div>
          </div>
        ) : (
          <div className="w-full bg-gradient-to-br from-emerald-600 to-emerald-800"></div>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-white">
            {renderLogo()}
            <h1 className="text-4xl font-bold mb-4">
              Bienvenue sur Express Quote
            </h1>
            <p className="text-xl text-emerald-100">
              Votre plateforme de devis express et déménagement
            </p>
          </div>
        </div>
      </div>

      {/* Côté droit - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-12 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center lg:hidden">
            {renderLogo()}
          </div>
          
          <div className="text-center">
            {title && (
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-gray-600 mb-6">
                {description}
              </p>
            )}
          </div>

          {renderSecurityBadge()}

          <div className="space-y-6">
            {children}
            
            {actions && (
              <div className="flex flex-col space-y-3">
                {actions}
              </div>
            )}
            
            {renderTrustedProviders()}
          </div>

          {renderFooterLinks()}
        </div>
      </div>
    </div>
  );

  const renderMinimalLayout = () => (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-sm w-full space-y-8">
        {renderLogo()}
        
        <div className="text-center">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-gray-600 mb-6 text-sm">
              {description}
            </p>
          )}
        </div>

        <div className="space-y-6">
          {children}
          
          {actions && (
            <div className="flex flex-col space-y-2">
              {actions}
            </div>
          )}
          
          {renderTrustedProviders()}
        </div>

        {renderFooterLinks()}
      </div>
    </div>
  );

  return (
    <div className={className}>
      {variant === "split" && renderSplitLayout()}
      {variant === "minimal" && renderMinimalLayout()}
      {variant === "centered" && renderCenteredLayout()}
    </div>
  );
}; 