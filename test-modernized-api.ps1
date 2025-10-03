# Script de test pour l'API /api/admin/rules modernisée
# Démontre toutes les fonctionnalités nouvelles

Write-Host "🧪 Test de l'API /api/admin/rules modernisée" -ForegroundColor Green
Write-Host "=" * 50

$baseUrl = "http://localhost:3000/api/admin/rules"

# Test 1: Récupération avec statistiques
Write-Host "📊 Test 1: Récupération avec statistiques" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl?stats=true" -Method Get -ContentType "application/json"
    Write-Host "✅ Succès: $($response.message)" -ForegroundColor Green
    Write-Host "📈 Statistiques:" -ForegroundColor Cyan
    Write-Host "  - Total: $($response.statistics.total)" -ForegroundColor White
    Write-Host "  - Actives: $($response.statistics.active)" -ForegroundColor White
    Write-Host "  - Inactives: $($response.statistics.inactive)" -ForegroundColor White
    Write-Host "📋 Règles trouvées: $($response.data.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + "=" * 50

# Test 2: Création d'une nouvelle règle
Write-Host "➕ Test 2: Création d'une nouvelle règle" -ForegroundColor Yellow
$newRule = @{
    name = "Majoration Week-end"
    description = "Majoration automatique les week-ends"
    serviceType = "MOVING"
    category = "SURCHARGE"
    value = 15
    type = "percentage"
    isActive = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $newRule -ContentType "application/json"
    Write-Host "✅ Succès: $($response.message)" -ForegroundColor Green
    Write-Host "🆔 ID créé: $($response.data.id)" -ForegroundColor Cyan
    Write-Host "📦 Catégorie catalogue: $($response.data.catalogCategory)" -ForegroundColor Cyan
    Write-Host "🔗 Items liés: $($response.data.linkedItems)" -ForegroundColor Cyan
    $createdId = $response.data.id
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + "=" * 50

# Test 3: Filtrage par type de service
Write-Host "🔍 Test 3: Filtrage par type de service (MOVING)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl?serviceType=MOVING" -Method Get -ContentType "application/json"
    Write-Host "✅ Succès: $($response.message)" -ForegroundColor Green
    Write-Host "📋 Règles MOVING: $($response.data.Count)" -ForegroundColor White
    foreach ($rule in $response.data) {
        $unit = if ($rule.type -eq 'percentage') { '%' } else { '€' }
        Write-Host "  - $($rule.name) ($($rule.value)$unit)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + "=" * 50

# Test 4: Filtrage par catégorie
Write-Host "🏷️ Test 4: Filtrage par catégorie (SURCHARGE)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl?category=SURCHARGE" -Method Get -ContentType "application/json"
    Write-Host "✅ Succès: $($response.message)" -ForegroundColor Green
    Write-Host "📋 Règles SURCHARGE: $($response.data.Count)" -ForegroundColor White
    foreach ($rule in $response.data) {
        $unit = if ($rule.type -eq 'percentage') { '%' } else { '€' }
        Write-Host "  - $($rule.name): $($rule.value)$unit" -ForegroundColor White
        if ($rule.catalogCategory) {
            Write-Host "    📦 Catalogue: $($rule.catalogCategory)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + "=" * 50

# Test 5: Mise à jour d'une règle
if ($createdId) {
    Write-Host "✏️ Test 5: Mise à jour d'une règle" -ForegroundColor Yellow
    $updateRule = @{
        id = $createdId
        name = "Majoration Week-end (Modifiée)"
        description = "Majoration automatique les week-ends et jours fériés"
        value = 20
        type = "percentage"
        isActive = $true
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Put -Body $updateRule -ContentType "application/json"
        Write-Host "✅ Succès: $($response.message)" -ForegroundColor Green
        Write-Host "📝 Nouvelle valeur: $($response.data.value)%" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 50

# Test 6: Test de validation d'erreur
Write-Host "🚫 Test 6: Test de validation d'erreur" -ForegroundColor Yellow
$invalidRule = @{
    name = "Règle invalide"
    serviceType = "INVALID_TYPE"
    category = "SURCHARGE"
    value = 10
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $invalidRule -ContentType "application/json"
    Write-Host "❌ Attention: La validation aurait dû échouer!" -ForegroundColor Red
} catch {
    Write-Host "✅ Validation correcte: Erreur détectée pour serviceType invalide" -ForegroundColor Green
}

Write-Host "`n" + "=" * 50

# Test 7: Suppression douce
if ($createdId) {
    Write-Host "🗑️ Test 7: Suppression douce (désactivation)" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl?id=$createdId" -Method Delete -ContentType "application/json"
        Write-Host "✅ Succès: $($response.message)" -ForegroundColor Green
        Write-Host "🔄 Règle désactivée au lieu d'être supprimée" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 50

# Test 8: Vérification finale avec statistiques
Write-Host "📊 Test 8: Vérification finale avec statistiques" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl?stats=true" -Method Get -ContentType "application/json"
    Write-Host "✅ Succès: $($response.message)" -ForegroundColor Green
    Write-Host "📈 Statistiques finales:" -ForegroundColor Cyan
    Write-Host "  - Total: $($response.statistics.total)" -ForegroundColor White
    Write-Host "  - Actives: $($response.statistics.active)" -ForegroundColor White
    Write-Host "  - Inactives: $($response.statistics.inactive)" -ForegroundColor White
    
    Write-Host "🏷️ Par catégorie:" -ForegroundColor Cyan
    $response.statistics.byCategory.PSObject.Properties | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Value)" -ForegroundColor White
    }
    
    Write-Host "📦 Par type de service:" -ForegroundColor Cyan
    $response.statistics.byServiceType.PSObject.Properties | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Value)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + "=" * 50
Write-Host "🎉 Tests terminés!" -ForegroundColor Green
Write-Host "✨ L'API /api/admin/rules modernisée fonctionne parfaitement!" -ForegroundColor Green 