# Script de Diagnostic Vercel MCP pour Cursor (Windows)
# Ce script vérifie l'état de la configuration Vercel MCP

Write-Host "=== Diagnostic Vercel MCP ===" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier si Cursor est installé
Write-Host "1. Vérification de Cursor..." -ForegroundColor Yellow
$cursorPath = "$env:APPDATA\Cursor"
if (Test-Path $cursorPath) {
    Write-Host "   ✅ Cursor trouvé : $cursorPath" -ForegroundColor Green
} else {
    Write-Host "   ❌ Cursor non trouvé : $cursorPath" -ForegroundColor Red
    exit 1
}

# 2. Vérifier le dossier globalStorage
Write-Host ""
Write-Host "2. Vérification du dossier globalStorage..." -ForegroundColor Yellow
$globalStoragePath = "$cursorPath\User\globalStorage"
if (Test-Path $globalStoragePath) {
    Write-Host "   ✅ Dossier globalStorage existe : $globalStoragePath" -ForegroundColor Green
} else {
    Write-Host "   ❌ Dossier globalStorage manquant : $globalStoragePath" -ForegroundColor Red
    Write-Host "   💡 Création du dossier..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $globalStoragePath | Out-Null
    Write-Host "   ✅ Dossier créé" -ForegroundColor Green
}

# 3. Vérifier le fichier mcp.json
Write-Host ""
Write-Host "3. Vérification du fichier mcp.json..." -ForegroundColor Yellow
$mcpConfigPath = "$globalStoragePath\mcp.json"
if (Test-Path $mcpConfigPath) {
    Write-Host "   ✅ Fichier mcp.json existe : $mcpConfigPath" -ForegroundColor Green
    
    # Lire et afficher le contenu
    try {
        $config = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json
        Write-Host "   📄 Contenu du fichier :" -ForegroundColor Cyan
        Get-Content $mcpConfigPath | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
        
        # Vérifier la configuration Vercel
        if ($config.mcpServers.vercel) {
            Write-Host ""
            Write-Host "   ✅ Configuration Vercel trouvée" -ForegroundColor Green
            Write-Host "      URL : $($config.mcpServers.vercel.url)" -ForegroundColor Gray
            Write-Host "      Auth : $($config.mcpServers.vercel.auth.type)" -ForegroundColor Gray
        } else {
            Write-Host "   ❌ Configuration Vercel manquante dans mcp.json" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Erreur lors de la lecture du fichier JSON : $_" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Fichier mcp.json manquant : $mcpConfigPath" -ForegroundColor Red
    Write-Host "   💡 Exécutez scripts/configure-vercel-mcp.ps1 pour créer la configuration" -ForegroundColor Yellow
}

# 4. Vérifier la connectivité réseau
Write-Host ""
Write-Host "4. Vérification de la connectivité réseau..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://mcp.vercel.com" -Method Head -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Serveur MCP Vercel accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Impossible de contacter le serveur MCP Vercel : $_" -ForegroundColor Yellow
    Write-Host "      Vérifiez votre connexion Internet" -ForegroundColor Gray
}

# 5. Vérifier Vercel CLI
Write-Host ""
Write-Host "5. Vérification de Vercel CLI..." -ForegroundColor Yellow
$vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue
if ($vercelCmd) {
    Write-Host "   ✅ Vercel CLI installé : $($vercelCmd.Source)" -ForegroundColor Green
    
    # Tester la connexion
    try {
        $projects = vercel projects ls 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Vercel CLI connecté et fonctionnel" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Vercel CLI installé mais non connecté" -ForegroundColor Yellow
            Write-Host "      Exécutez 'vercel login' pour vous connecter" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ⚠️  Erreur lors de la vérification Vercel CLI" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Vercel CLI non installé (optionnel)" -ForegroundColor Yellow
}

# Résumé
Write-Host ""
Write-Host "=== Résumé ===" -ForegroundColor Cyan
Write-Host ""

if ((Test-Path $mcpConfigPath) -and (Test-Path $cursorPath)) {
    Write-Host "✅ Configuration MCP détectée" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes :" -ForegroundColor Cyan
    Write-Host "   1. Ouvrir Cursor" -ForegroundColor White
    Write-Host "   2. Appuyer sur Ctrl+Shift+P → 'MCP Settings'" -ForegroundColor White
    Write-Host "   3. Vérifier que le serveur 'vercel' est connecté" -ForegroundColor White
    Write-Host "   4. Compléter l'authentification OAuth si nécessaire" -ForegroundColor White
    Write-Host "   5. Redémarrer Cursor si le serveur n'est pas actif" -ForegroundColor White
    Write-Host ""
    Write-Host "Guide complet : docs/ACTIVER_VERCEL_MCP.md" -ForegroundColor Cyan
} else {
    Write-Host "❌ Configuration incomplète" -ForegroundColor Red
    Write-Host ""
    Write-Host "Actions recommandées :" -ForegroundColor Yellow
    Write-Host "   - Exécutez : scripts/configure-vercel-mcp.ps1" -ForegroundColor White
}

Write-Host ""
