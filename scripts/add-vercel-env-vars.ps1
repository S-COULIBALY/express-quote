# Script PowerShell pour ajouter les variables d'environnement sur Vercel
# Usage: .\scripts\add-vercel-env-vars.ps1

Write-Host "Configuration des variables d'environnement Vercel" -ForegroundColor Cyan
Write-Host ""

# Liste des variables requises
$requiredVars = @(
    "DATABASE_URL",
    "DIRECT_URL",
    "NEXT_PUBLIC_BASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "REDIS_URL"
)

Write-Host "Variables a configurer:" -ForegroundColor Yellow
foreach ($var in $requiredVars) {
    Write-Host "  - $var"
}

Write-Host ""
Write-Host "Pour chaque variable, vous pouvez:" -ForegroundColor Green
Write-Host "  1. Entrer la valeur directement"
Write-Host "  2. Appuyer sur Entree pour ignorer (si deja configuree)"
Write-Host "  3. Taper 'skip' pour ignorer"
Write-Host ""

$envToAdd = @{}

foreach ($var in $requiredVars) {
    Write-Host ""
    $value = Read-Host "Entrez la valeur pour $var (ou 'skip' pour ignorer)"
    
    if ($value -and $value -ne "skip") {
        $envToAdd[$var] = $value
        Write-Host "[OK] $var sera ajoutee" -ForegroundColor Green
    } else {
        Write-Host "[SKIP] $var ignoree" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Resume des variables a ajouter:" -ForegroundColor Cyan
foreach ($key in $envToAdd.Keys) {
    Write-Host "  - $key"
}

Write-Host ""
$confirm = Read-Host "Confirmez-vous l'ajout de ces variables sur Vercel Production? (oui/non)"

if ($confirm -eq "oui" -or $confirm -eq "o" -or $confirm -eq "y" -or $confirm -eq "yes") {
    Write-Host ""
    Write-Host "Ajout des variables sur Vercel..." -ForegroundColor Yellow
    
    foreach ($key in $envToAdd.Keys) {
        $value = $envToAdd[$key]
        Write-Host "Ajout de $key..." -ForegroundColor Cyan
        echo $value | vercel env add $key production
    }
    
    Write-Host ""
    Write-Host "[SUCCESS] Variables ajoutees avec succes!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vous pouvez maintenant relancer le deploiement:" -ForegroundColor Cyan
    Write-Host "  git push" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Operation annulee" -ForegroundColor Red
}
