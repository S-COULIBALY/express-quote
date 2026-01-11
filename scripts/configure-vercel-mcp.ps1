# Script de Configuration Vercel MCP pour Cursor (Windows)
# Ce script aide a configurer Vercel MCP dans Cursor

Write-Host "Configuration Vercel MCP pour Cursor" -ForegroundColor Cyan
Write-Host ""

# Verifier si Cursor est installe
$cursorPath = "$env:APPDATA\Cursor"
if (-not (Test-Path $cursorPath)) {
    Write-Host "Cursor n'est pas installe ou le dossier de configuration n'existe pas." -ForegroundColor Red
    Write-Host "   Chemin attendu : $cursorPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "Cursor trouve : $cursorPath" -ForegroundColor Green

# Creer le dossier globalStorage si necessaire
$globalStoragePath = "$cursorPath\User\globalStorage"
if (-not (Test-Path $globalStoragePath)) {
    Write-Host "Creation du dossier globalStorage..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $globalStoragePath | Out-Null
    Write-Host "Dossier cree" -ForegroundColor Green
}

# Chemin du fichier de configuration MCP
$mcpConfigPath = "$globalStoragePath\mcp.json"

# Configuration MCP pour Vercel (JSON)
$mcpConfigJson = @'
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com",
      "auth": {
        "type": "oauth"
      }
    }
  }
}
'@

# Verifier si le fichier existe deja
if (Test-Path $mcpConfigPath) {
    Write-Host "Le fichier mcp.json existe deja." -ForegroundColor Yellow
    Write-Host "   Chemin : $mcpConfigPath" -ForegroundColor Gray
    
    $response = Read-Host "Voulez-vous le remplacer ? (O/N)"
    if ($response -ne "O" -and $response -ne "o") {
        Write-Host "Configuration annulee." -ForegroundColor Red
        exit 0
    }
    
    # Sauvegarder l'ancien fichier
    $backupPath = "$mcpConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $mcpConfigPath $backupPath
    Write-Host "Ancien fichier sauvegarde : $backupPath" -ForegroundColor Cyan
}

# Ecrire la configuration
Write-Host "Ecriture de la configuration MCP..." -ForegroundColor Yellow
$mcpConfigJson | Out-File -FilePath $mcpConfigPath -Encoding UTF8
Write-Host "Configuration ecrite dans : $mcpConfigPath" -ForegroundColor Green

Write-Host ""
Write-Host "Configuration creee :" -ForegroundColor Cyan
Write-Host $mcpConfigJson -ForegroundColor Gray

Write-Host ""
Write-Host "Configuration terminee !" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes :" -ForegroundColor Cyan
Write-Host "   1. Redemarrer Cursor" -ForegroundColor White
Write-Host "   2. Cursor ouvrira automatiquement votre navigateur pour l'authentification OAuth" -ForegroundColor White
Write-Host "   3. Connectez-vous avec votre compte Vercel" -ForegroundColor White
Write-Host "   4. Autorisez l'acces a Cursor" -ForegroundColor White
Write-Host "   5. Testez avec : 'Liste mes projets Vercel'" -ForegroundColor White
Write-Host ""
Write-Host "Documentation : docs/CONFIGURATION_VERCEL_MCP_CURSOR.md" -ForegroundColor Cyan
