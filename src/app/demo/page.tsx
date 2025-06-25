"use client";

import React, { useState } from "react";
// Auth Examples
import { 
  LoginFormExample, 
  RegisterFormExample, 
  ForgotPasswordFormExample 
} from "@/components/form-generator/examples/LoginFormExample";
import { 
  ImprovedLoginExample, 
  ImprovedRegisterExample, 
  FormFirstExample 
} from "@/components/form-generator/examples/ImprovedLoginExample";
import { 
  UltraMinimalRegisterExample, 
  UltraMinimalLoginExample, 
  UltraMinimalForgotExample 
} from "@/components/form-generator/examples/UltraMinimalAuthExample";
// Default Layout Examples
import { 
  SimpleFormExample, 
  BusinessFormExample 
} from "@/components/form-generator/examples/DefaultLayoutExample";
// Sidebar Layout Examples  
import ContactFormExample from "@/components/form-generator/presets/contact/example";
import { MovingFormExample } from "@/components/form-generator/presets/moving-service/example";
// Package Layout Examples
import PackageFormExample from "@/components/form-generator/presets/pack-service/example";
import PackageEditExample from "@/components/form-generator/presets/pack-service/edit-example";
import PackageCardsDemo from "./package-cards/page";
// Service Summary Layout Example
import ServiceSummaryDemo from "./service-summary/page";

type TabType = "auth" | "default" | "sidebar" | "package" | "service-summary";
type AuthFormType = "login" | "register" | "forgot";
type AuthVariantType = "standard" | "form-first" | "ultra-minimal";
type DefaultFormType = "simple" | "business";
type SidebarFormType = "contact" | "moving";
type PackageFormType = "selection" | "edit" | "cards";

export default function FormGeneratorDemo() {
  const [currentTab, setCurrentTab] = useState<TabType>("auth");
  
  // Auth states
  const [authVariant, setAuthVariant] = useState<AuthVariantType>("standard");
  const [authForm, setAuthForm] = useState<AuthFormType>("login");
  
  // Default states
  const [defaultForm, setDefaultForm] = useState<DefaultFormType>("simple");
  
  // Sidebar states
  const [sidebarForm, setSidebarForm] = useState<SidebarFormType>("contact");

  // Package states
  const [packageForm, setPackageForm] = useState<PackageFormType>("selection");

  const renderForm = () => {
    if (currentTab === "auth") {
      if (authVariant === "standard") {
        switch (authForm) {
          case "login": return <LoginFormExample />;
          case "register": return <RegisterFormExample />;
          case "forgot": return <ForgotPasswordFormExample />;
        }
      }
      
      if (authVariant === "form-first") {
        switch (authForm) {
          case "login": return <ImprovedLoginExample />;
          case "register": return <ImprovedRegisterExample />;
          case "forgot": return <FormFirstExample />;
        }
      }
      
      if (authVariant === "ultra-minimal") {
        switch (authForm) {
          case "login": return <UltraMinimalLoginExample />;
          case "register": return <UltraMinimalRegisterExample />;
          case "forgot": return <UltraMinimalForgotExample />;
        }
      }
    }
    
    if (currentTab === "default") {
      switch (defaultForm) {
        case "simple": return <SimpleFormExample />;
        case "business": return <BusinessFormExample />;
      }
    }
    
    if (currentTab === "sidebar") {
      switch (sidebarForm) {
        case "contact": return <ContactFormExample />;
        case "moving": return <MovingFormExample />;
      }
    }
    
    if (currentTab === "package") {
      switch (packageForm) {
        case "selection": return <PackageFormExample />;
        case "edit": return <PackageEditExample />;
        case "cards": return <PackageCardsDemo />;
      }
    }
    
    if (currentTab === "service-summary") {
      return <ServiceSummaryDemo />;
    }
  };

  const getTabDescription = () => {
    switch (currentTab) {
      case "auth":
        switch (authVariant) {
          case "standard": return "Formulaires d'authentification classiques avec tous les éléments";
          case "form-first": return "Approche optimisée : formulaire d'abord, providers ensuite";
          case "ultra-minimal": return "Version ultra-simplifiée pour maximiser la conversion";
        }
        break;
      case "default":
        return "Layout par défaut avec design clean et structure simple";
      case "sidebar":
        return "Layout avec sidebar pour résumé automatique et presets métier";
      case "package":
        return "Layout spécialisé pour forfaits prédéfinis avec personnalisation";
      case "service-summary":
        return "Layout de récapitulatif de devis avec formulaire client intégré";
    }
  };

  const getFormDescription = () => {
    if (currentTab === "auth") {
      if (authVariant === "standard") {
        switch (authForm) {
          case "login": return "Connexion avec variant centered + badge sécurité";
          case "register": return "Inscription avec variant split + image de fond";
          case "forgot": return "Récupération avec variant minimal";
        }
      }
      
      if (authVariant === "form-first") {
        switch (authForm) {
          case "login": return "Connexion améliorée Form-First";
          case "register": return "Inscription optimisée sans checkbox";
          case "forgot": return "Connexion prioritaire (exemple minimal)";
        }
      }
      
      if (authVariant === "ultra-minimal") {
        switch (authForm) {
          case "login": return "2 champs seulement + 2 providers";
          case "register": return "4 champs sans confirmation ni conditions";
          case "forgot": return "1 champ email uniquement";
        }
      }
    }
    
    if (currentTab === "default") {
      switch (defaultForm) {
        case "simple": return "Formulaire basique avec 3 champs essentiels";
        case "business": return "Formulaire professionnel avec sections et validation";
      }
    }
    
    if (currentTab === "sidebar") {
      switch (sidebarForm) {
        case "contact": return "Preset contact avec sidebar automatique et résumé";
        case "moving": return "Preset déménagement avec composants métier spécialisés";
      }
    }
    
    if (currentTab === "package") {
      switch (packageForm) {
        case "selection": return "Sélection de forfaits avec comparaison visuelle";
        case "edit": return "Édition de pack avec formulaire prérempli et récapitulatif";
        case "cards": return "Démonstration des cartes de forfaits";
      }
    }
    
    if (currentTab === "service-summary") {
      return "Récapitulatif complet avec détails service, calculs prix, assurance et validation client";
    }
  };

  const getImpactStats = () => {
    if (currentTab === "auth" && authVariant === "ultra-minimal") {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2 text-sm">Impact Conversion :</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div>📈 +50% taux de complétion</div>
            <div>⚡ -70% temps de remplissage</div>
            <div>🎯 +35% conversions mobiles</div>
            <div>💡 -80% abandon de formulaire</div>
            <div>🚀 Zéro friction juridique</div>
          </div>
        </div>
      );
    }
    
    if (currentTab === "auth" && authVariant === "form-first") {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="font-medium text-green-900 mb-2 text-sm">Avantages Form-First :</h4>
          <div className="text-xs text-green-700 space-y-1">
            <div>✓ Encourage l'utilisation d'identifiants propres</div>
            <div>✓ Contrôle total sur l'authentification</div>
            <div>✓ OAuth comme alternative pratique</div>
            <div>✓ Meilleur pour la collecte de données</div>
          </div>
        </div>
      );
    }
    
    if (currentTab === "sidebar") {
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <h4 className="font-medium text-purple-900 mb-2 text-sm">Avantages Sidebar :</h4>
          <div className="text-xs text-purple-700 space-y-1">
            <div>✓ Résumé en temps réel</div>
            <div>✓ Presets métier intégrés</div>
            <div>✓ UX optimisée pour formulaires longs</div>
            <div>✓ Validation visuelle continue</div>
          </div>
        </div>
      );
    }
    
    if (currentTab === "default") {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Layout Default :</h4>
          <div className="text-xs text-gray-700 space-y-1">
            <div>• Design clean et épuré</div>
            <div>• Structure simple et flexible</div>
            <div>• Idéal pour formulaires standards</div>
            <div>• Responsive par défaut</div>
          </div>
        </div>
      );
    }
    
    if (currentTab === "package") {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <h4 className="font-medium text-orange-900 mb-2 text-sm">Avantages Package :</h4>
          <div className="text-xs text-orange-700 space-y-1">
            <div>✓ Comparaison visuelle des forfaits</div>
            <div>✓ Sélection intuitive avec prix</div>
            <div>✓ Personnalisation conditionnelle</div>
            <div>✓ UX optimisée pour l'e-commerce</div>
            <div>✓ Conversion améliorée</div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderSubNavigation = () => {
    if (currentTab === "auth") {
      return (
        <div className="space-y-4">
          {/* Auth Variants */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setAuthVariant("standard")}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                authVariant === "standard"
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setAuthVariant("form-first")}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                authVariant === "form-first"
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              Form-First
            </button>
            <button
              onClick={() => setAuthVariant("ultra-minimal")}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                authVariant === "ultra-minimal"
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              Ultra-Minimal
            </button>
          </div>
          
          {/* Auth Forms */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setAuthForm("login")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                authForm === "login"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setAuthForm("register")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                authForm === "register"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Inscription
            </button>
            <button
              onClick={() => setAuthForm("forgot")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                authForm === "forgot"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {authVariant === "form-first" ? "Prioritaire" : "Mot de passe oublié"}
            </button>
          </div>
        </div>
      );
    }
    
    if (currentTab === "default") {
      return (
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setDefaultForm("simple")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              defaultForm === "simple"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Formulaire Simple
          </button>
          <button
            onClick={() => setDefaultForm("business")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              defaultForm === "business"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Formulaire Business
          </button>
        </div>
      );
    }
    
    if (currentTab === "sidebar") {
      return (
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setSidebarForm("contact")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              sidebarForm === "contact"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Preset Contact
          </button>
          <button
            onClick={() => setSidebarForm("moving")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              sidebarForm === "moving"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Preset Déménagement
          </button>
        </div>
      );
    }
    
    if (currentTab === "package") {
      return (
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setPackageForm("selection")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              packageForm === "selection"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Sélection de pack
          </button>
          <button
            onClick={() => setPackageForm("edit")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              packageForm === "edit"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Édition de pack
          </button>
          <button
            onClick={() => setPackageForm("cards")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              packageForm === "cards"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Cartes de forfaits
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header avec titre principal */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Démonstration Générateur de Formulaires
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Tous les layouts et exemples en un seul endroit
            </p>
          </div>
        </div>
      </div>

      {/* Navigation par onglets principaux */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setCurrentTab("auth")}
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                currentTab === "auth"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🔐 Layout Auth
            </button>
            <button
              onClick={() => setCurrentTab("default")}
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                currentTab === "default"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📄 Layout Default
            </button>
            <button
              onClick={() => setCurrentTab("sidebar")}
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                currentTab === "sidebar"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📊 Layout Sidebar
            </button>
            <button
              onClick={() => setCurrentTab("package")}
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                currentTab === "package"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📦 Layout Package
            </button>
            <button
              onClick={() => setCurrentTab("service-summary")}
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                currentTab === "service-summary"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📋 Service Summary
            </button>
          </div>
        </div>
      </div>

      {/* Description de l'onglet actuel */}
      <div className="bg-emerald-50 border-b border-emerald-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-emerald-900">
                {getTabDescription()}
              </h3>
              <p className="text-sm text-emerald-700 mt-1">
                {getFormDescription()}
              </p>
            </div>
            <div className="hidden lg:block">
              {getImpactStats()}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation secondaire */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {renderSubNavigation()}
        </div>
      </div>

      {/* Formulaire actuel */}
      <div className="relative">
        {renderForm()}
        
        {/* Indicateurs flottants */}
        <div className="absolute top-4 right-4 space-y-2">
          <div className="bg-emerald-600 bg-opacity-90 text-white px-3 py-1 rounded text-sm">
            {currentTab === "auth" ? authVariant.charAt(0).toUpperCase() + authVariant.slice(1) :
             currentTab === "package" ? "Package" :
             currentTab === "service-summary" ? "Service Summary" :
             currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
          </div>
          <div className="bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
            {currentTab === "auth" && authForm === "register" && authVariant === "standard" ? "Split" :
             currentTab === "auth" && authForm === "login" && authVariant === "standard" ? "Centered" :
             currentTab === "auth" && authForm === "forgot" ? "Minimal" :
             currentTab === "sidebar" && sidebarForm === "contact" ? "Contact Preset" :
             currentTab === "sidebar" && sidebarForm === "moving" ? "Moving Preset" :
             currentTab === "default" && defaultForm === "simple" ? "Simple" :
             currentTab === "default" && defaultForm === "business" ? "Business" :
             currentTab === "package" && packageForm === "selection" ? "Sélection" :
             currentTab === "package" && packageForm === "edit" ? "Édition" :
             currentTab === "package" && packageForm === "cards" ? "Cartes" :
             currentTab === "service-summary" ? "Récapitulatif" :
             "Optimisé"}
          </div>
        </div>

        {/* Stats mobiles */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4">
          {getImpactStats()}
        </div>
      </div>
    </div>
  );
} 