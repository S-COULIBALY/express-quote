#!/bin/bash

# Script cron pour le traitement automatique des devis expirés
# À exécuter toutes les heures : 0 * * * *

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/expire-quotes.log"
LOCK_FILE="/tmp/expire-quotes.lock"

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Vérifier qu'un autre processus n'est pas déjà en cours
if [ -f "$LOCK_FILE" ]; then
    log "❌ Un processus d'expiration est déjà en cours (lock file exists)"
    exit 1
fi

# Créer le lock file
touch "$LOCK_FILE"

# Fonction de nettoyage
cleanup() {
    rm -f "$LOCK_FILE"
    log "🧹 Nettoyage terminé"
}

# S'assurer que le nettoyage se fait même en cas d'erreur
trap cleanup EXIT

# Démarrer le processus
log "🚀 Démarrage du processus d'expiration des devis"

# Changer vers le répertoire du projet
cd "$PROJECT_DIR" || {
    log "❌ Impossible de changer vers le répertoire du projet: $PROJECT_DIR"
    exit 1
}

# Vérifier que le fichier de script existe
if [ ! -f "src/scripts/expire-quotes.ts" ]; then
    log "❌ Script d'expiration introuvable: src/scripts/expire-quotes.ts"
    exit 1
fi

# Exécuter le script TypeScript
log "🔄 Exécution du script d'expiration..."

# Utiliser npx pour exécuter le script
if command -v npx &> /dev/null; then
    npx tsx src/scripts/expire-quotes.ts >> "$LOG_FILE" 2>&1
    EXIT_CODE=$?
else
    log "❌ npx non trouvé, essai avec node directement"
    node --loader ts-node/esm src/scripts/expire-quotes.ts >> "$LOG_FILE" 2>&1
    EXIT_CODE=$?
fi

# Vérifier le code de sortie
if [ $EXIT_CODE -eq 0 ]; then
    log "✅ Processus d'expiration terminé avec succès"
else
    log "❌ Processus d'expiration échoué avec le code: $EXIT_CODE"
    
    # Optionnel : Envoyer une alerte email en cas d'erreur
    # mail -s "Erreur processus expiration devis" admin@example.com < "$LOG_FILE"
fi

log "🏁 Fin du processus d'expiration"
exit $EXIT_CODE 