@echo off
setlocal enabledelayedexpansion

set COMPOSE_FILE=docker-compose.notification.yml

if "%1"=="" goto show_help
if "%1"=="start" goto start_services
if "%1"=="stop" goto stop_services
if "%1"=="status" goto show_status
if "%1"=="test" goto test_system
if "%1"=="restart" goto restart_services
goto show_help

:start_services
echo 🚀 Démarrage des services de notification...
docker-compose -f %COMPOSE_FILE% up -d
if %ERRORLEVEL% EQU 0 (
    echo ✅ Services démarrés avec succès
    timeout /t 3 /nobreak >nul
    goto show_status
) else (
    echo ❌ Erreur lors du démarrage des services
)
goto end

:stop_services
echo 🛑 Arrêt des services de notification...
docker-compose -f %COMPOSE_FILE% down
if %ERRORLEVEL% EQU 0 (
    echo ✅ Services arrêtés avec succès
) else (
    echo ❌ Erreur lors de l'arrêt des services
)
goto end

:restart_services
echo 🔄 Redémarrage des services de notification...
call :stop_services
timeout /t 2 /nobreak >nul
call :start_services
goto end

:show_status
echo 📊 Statut des services:
docker ps --filter "name=express-quote" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
echo 🌐 Accès aux services:
echo    • Prometheus: http://localhost:9090
echo    • Grafana:   http://localhost:3001 ^(admin/admin^)
echo    • Redis:     localhost:6379
goto end

:test_system
echo 🧪 Test du système de notification...
if exist "scripts\verify-notification-system.js" (
    node scripts\verify-notification-system.js
) else (
    echo ❌ Script de test introuvable
)
goto end

:show_help
echo Gestionnaire du système de notification Express-Quote
echo.
echo Usage: %0 [commande]
echo.
echo Commandes disponibles:
echo   start   - Démarrer les services
echo   stop    - Arrêter les services
echo   restart - Redémarrer les services
echo   status  - Afficher le statut
echo   test    - Tester le système
echo.
echo Exemples:
echo   %0 start
echo   %0 status
echo   %0 test
goto end

:end
endlocal
