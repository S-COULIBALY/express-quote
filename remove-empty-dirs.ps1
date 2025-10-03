# Script pour supprimer les dossiers vides
$emptyDirs = @(
    "certificates",
    "storage\documents", 
    "src\bookingAttribution\domain\entities",
    "src\notifications\notificationDoc",
    "src\notifications\config\grafana",
    "src\documents\interfaces\http\controllers"
)

foreach ($dir in $emptyDirs) {
    if (Test-Path $dir) {
        try {
            Remove-Item $dir -Force -Recurse
            Write-Host "Supprimé: $dir" -ForegroundColor Green
        } catch {
            Write-Host "Erreur lors de la suppression de $dir : $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Dossier non trouvé: $dir" -ForegroundColor Yellow
    }
}

Write-Host "Suppression des dossiers vides terminée." -ForegroundColor Cyan
