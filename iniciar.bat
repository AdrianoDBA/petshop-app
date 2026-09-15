@echo off
title PetShop Pro - Inicializador
chcp 65001 > nul

echo =============================================================
echo   🐾 INICIANDO PETSHOP PRO (MODO APLICATIVO NATIVO) 🐾
echo =============================================================
echo.

:: Inicia o servidor backend em segundo plano minimizado
start "PetShop Pro Server" /min cmd /c "npm run start"

:: Aguarda 2 segundos para o servidor subir
timeout /t 2 /nobreak > nul

:: Tenta abrir em modo Janela de Aplicativo Dedicada (Edge ou Chrome) com perfil isolado
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start msedge --app=http://localhost:3001 --window-size=1280,800 --user-data-dir="%LOCALAPPDATA%\PetShopProApp"
    goto :fim
)

where chrome >nul 2>nul
if %errorlevel% equ 0 (
    start chrome --app=http://localhost:3001 --window-size=1280,800 --user-data-dir="%LOCALAPPDATA%\PetShopProApp"
    goto :fim
)

:: Fallback para navegador padrão caso não encontre Edge ou Chrome
start http://localhost:3001

:fim
echo PetShop Pro iniciado com sucesso!
exit
