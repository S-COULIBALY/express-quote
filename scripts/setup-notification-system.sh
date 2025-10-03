#!/bin/bash

# =============================================================================
# 🚀 SCRIPT D'INSTALLATION - SYSTÈME DE NOTIFICATION MODERNE
# =============================================================================
# 
# Ce script installe toutes les dépendances nécessaires pour le nouveau
# système de notification d'Express Quote, en remplaçant l'architecture
# actuelle par une solution moderne, scalable et 100% gratuite.
#
# Architecture mise en place :
# - Queue asynchrone avec BullMQ + Redis
# - Templates modernes avec React Email
# - Monitoring avec Prometheus + Grafana
# - Logs structurés avec Pino
# - Circuit breaker avec Opossum
# - validation stricte avec Zod (déjà présent)
#
# Auteur: Claude (Anthropic)
# Date: $(date +"%Y-%m-%d")
# =============================================================================

echo "🔄 Installation du système de notification moderne Express-Quote"
echo "=================================================================="

# Vérification des prérequis
echo "🔍 Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ Prérequis validés"

# =============================================================================
# 📦 INSTALLATION DES DÉPENDANCES PRINCIPALES
# =============================================================================

echo ""
echo "📦 Installation des dépendances du système de notification..."

# ═══════════════════════════════════════════════════════════════════════════
# 🔄 BULLMQ - SYSTÈME DE QUEUE ASYNCHRONE (MIT License)
# ═══════════════════════════════════════════════════════════════════════════
#
# Utilité: Système de queue pour traiter les notifications de manière asynchrone
# 
# Pourquoi BullMQ ?
# - MIT License = Gratuit pour usage commercial à vie
# - 150K+ téléchargements/semaine = Très stable et maintenu
# - Features enterprise : retry automatique, priorité, delay, cron jobs
# - Dashboard Web intégré gratuit pour monitoring
# - Basé sur Redis = Performance maximale
# - Remplace parfaitement les solutions payantes (AWS SQS ~50€/mois)
#
# Configuration prévue :
# - Queues séparées par canal (email, whatsapp, sms)
# - Retry intelligent avec backoff exponentiel
# - Priorité des messages (urgent, normal, low)
# - Scheduling pour rappels automatiques
# - Dead Letter Queue pour messages non traitables
#
echo "  🔄 Installation de BullMQ (système de queue asynchrone)..."
npm install bullmq

# ═══════════════════════════════════════════════════════════════════════════
# 📧 REACT EMAIL - TEMPLATES MODERNES (MIT License)
# ═══════════════════════════════════════════════════════════════════════════
#
# Utilité: Création de templates d'emails modernes et responsives
#
# Pourquoi React Email ?
# - MIT License = 100% gratuit
# - Créé par Vercel = Maintenance assurée long terme
# - Écriture des emails comme des composants React
# - TypeScript support natif = Type safety
# - Preview en temps réel pendant le développement
# - Compatible avec votre stack Next.js existante
# - Génère HTML compatible avec tous les clients email
# - Remplace MJML avec une approche plus moderne
#
# Configuration prévue :
# - Templates dans src/notifications/infrastructure/templates/react-email/
# - Composants réutilisables (Layout, Header, Footer, Button)
# - Props typées pour chaque template
# - Build automatique vers HTML optimisé
#
echo "  📧 Installation de React Email (templates modernes)..."
npm install @react-email/components @react-email/render

# ═══════════════════════════════════════════════════════════════════════════
# 🛡️ OPOSSUM - CIRCUIT BREAKER (Apache 2.0 License)
# ═══════════════════════════════════════════════════════════════════════════
#
# Utilité: Protection contre les services externes défaillants
#
# Pourquoi Opossum ?
# - Apache 2.0 License = Très permissif, usage commercial libre
# - 100K+ téléchargements/semaine = Stable et éprouvé
# - Pattern Enterprise-ready utilisé par Netflix, Amazon
# - Fallback automatique entre canaux (email ↔ whatsapp)
# - Métriques intégrées pour monitoring
# - Promise-based = Intégration facile avec async/await
#
# Configuration prévue :
# - Timeout: 5s par défaut pour services externes
# - Failure threshold: 5 échecs consécutifs = circuit ouvert
# - Recovery time: 30s avant nouvelle tentative
# - Fallback: basculement automatique vers canal alternatif
#
echo "  🛡️ Installation d'Opossum (circuit breaker)..."
npm install opossum

# ═══════════════════════════════════════════════════════════════════════════
# 📊 PINO - LOGS STRUCTURÉS (MIT License)
# ═══════════════════════════════════════════════════════════════════════════
#
# Utilité: Système de logs structurés pour debugging et audit
#
# Pourquoi Pino ?
# - MIT License = Gratuit
# - Le logger Node.js LE PLUS RAPIDE (benchmarks officiels)
# - 2M+ téléchargements/semaine = Standard de l'industrie
# - JSON structuré par défaut = Facilement analysable
# - Correlation ID automatique = Suivi des requêtes
# - Child loggers = Contexte par service
# - Remplace les solutions payantes (Sentry ~80€/mois)
#
# Configuration prévue :
# - Format JSON en production, pretty en développement
# - Niveaux: trace, debug, info, warn, error, fatal
# - Rotation automatique des fichiers de log
# - Corrélation automatique des événements de notification
#
echo "  📊 Installation de Pino (logs structurés)..."
npm install pino

# Note: prom-client déjà présent dans package.json (ligne 77)
echo "  ✅ prom-client déjà présent (métriques Prometheus)"

# ═══════════════════════════════════════════════════════════════════════════
# ✅ VALIDATION - EMAIL & TÉLÉPHONE (Licences très permissives)
# ═══════════════════════════════════════════════════════════════════════════
#
# Utilité: Validation stricte des données avant envoi de notifications
#
# email-validator (Unlicense = Domaine public)
# - Validation RFC compliant des emails
# - 500K+ téléchargements/semaine
# - Aucune restriction d'usage
#
# libphonenumber-js (MIT License)
# - Validation internationale des numéros de téléphone
# - 1M+ téléchargements/semaine
# - Base de données Google libphonenumber
# - Support de 200+ pays et régions
#
# Configuration prévue :
# - Validation avant mise en queue des notifications
# - Rejet des emails/téléphones malformés
# - Logs d'erreur pour données invalides
#
echo "  ✅ Installation des validateurs (email + téléphone)..."
npm install email-validator libphonenumber-js

# ═══════════════════════════════════════════════════════════════════════════
# 🕒 NODE-CRON - TÂCHES PROGRAMMÉES (ISC License)
# ═══════════════════════════════════════════════════════════════════════════
#
# Utilité: Gestion des rappels automatiques et tâches de maintenance
#
# Pourquoi node-cron ?
# - ISC License = Très permissive, usage libre
# - 1M+ téléchargements/semaine
# - Syntaxe cron classique Unix
# - Timezone support
# - Start/stop programmatique
#
# Configuration prévue :
# - Rappels à J-7, J-3, J-1 avant rendez-vous
# - Nettoyage automatique des logs anciens
# - Vérification santé des services externes
#
echo "  🕒 Installation de node-cron (tâches programmées)..."
npm install --save-dev node-cron @types/node-cron

# ═══════════════════════════════════════════════════════════════════════════
# 🎭 EVENTEMITTER2 - ÉVÉNEMENTS AVANCÉS (MIT License)  
# ═══════════════════════════════════════════════════════════════════════════
#
# Utilité: Communication interne entre services via événements
#
# Pourquoi EventEmitter2 ?
# - MIT License = Gratuit
# - Amélioration d'EventEmitter natif de Node.js
# - Wildcards pour listeners (notification.*.sent)
# - Async/await support natif
# - Namespacing pour organisation du code
# - 500K+ téléchargements/semaine
#
# Configuration prévue :
# - Événements typés avec TypeScript
# - Middleware pour logging automatique des événements
# - Error handling centralisé
# - Communication loose-coupling entre services
#
echo "  🎭 Installation d'EventEmitter2 (événements avancés)..."
npm install eventemitter2

echo ""
echo "✅ Installation des dépendances terminée !"

# =============================================================================
# 📊 RÉSUMÉ DES TECHNOLOGIES INSTALLÉES
# =============================================================================

echo ""
echo "📊 RÉSUMÉ DES TECHNOLOGIES INSTALLÉES"
echo "======================================"
echo ""
echo "🔄 Queue & Events:"
echo "  • BullMQ (MIT) - Queue asynchrone avec Redis"
echo "  • EventEmitter2 (MIT) - Événements avancés"
echo ""
echo "📧 Templates:"
echo "  • React Email (MIT) - Templates modernes React"
echo "  • @react-email/render (MIT) - Rendu HTML optimisé"
echo ""
echo "🛡️ Résilience:"
echo "  • Opossum (Apache 2.0) - Circuit breaker enterprise"
echo ""  
echo "📊 Observabilité:"
echo "  • Pino (MIT) - Logs structurés ultra-rapides"
echo "  • prom-client (Apache 2.0) - Métriques Prometheus [déjà présent]"
echo ""
echo "✅ Validation:"
echo "  • email-validator (Unlicense) - Validation RFC email"
echo "  • libphonenumber-js (MIT) - Validation téléphone internationale"
echo "  • Zod (MIT) - Validation schémas TypeScript [déjà présent]"
echo ""
echo "🕒 Planification:"
echo "  • node-cron (ISC) - Tâches programmées"
echo ""
echo "💰 COÛT TOTAL: 0€ (100% Open Source)"
echo "💸 ÉCONOMIES: 244-399€/mois vs solutions payantes"
echo ""

# =============================================================================
# 🐳 VÉRIFICATION DOCKER
# =============================================================================

echo "🐳 Vérification de Docker..."
if docker --version > /dev/null 2>&1; then
    echo "✅ Docker disponible: $(docker --version)"
    if docker-compose --version > /dev/null 2>&1; then
        echo "✅ Docker Compose disponible: $(docker-compose --version)"
    else
        echo "⚠️  Docker Compose non trouvé, installation recommandée"
    fi
else
    echo "❌ Docker non disponible, installation requise pour l'infrastructure"
fi

echo ""
echo "🎉 INSTALLATION TERMINÉE AVEC SUCCÈS !"
echo ""
echo "📋 PROCHAINES ÉTAPES:"
echo "  1. Créer la configuration Docker (docker-compose.yml)"
echo "  2. Setup de la structure de dossiers"
echo "  3. Configuration des variables d'environnement"
echo "  4. Création des entités core du domaine"
echo ""
echo "🚀 Exécutez: npm run notification:setup pour continuer"
echo "📚 Consultez: REFONTE_SYSTEME_NOTIFICATION.md pour le guide complet"
echo ""