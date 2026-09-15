@echo off
title Instalador PetShop Pro Enterprise
chcp 65001 > nul

echo =============================================================
echo   🐾 BEM-VINDO AO INSTALADOR DO PETSHOP PRO ENTERPRISE 🐾
echo =============================================================
echo.

:: 1. Verifica se o Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js não foi encontrado. Tentando instalar automaticamente via winget...
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        echo [✓] Node.js instalado com sucesso! Reinicie este instalador se necessário.
    ) else (
        echo [X] Por favor, instale o Node.js v18 ou superior em https://nodejs.org antes de continuar.
        pause
        exit /b 1
    )
)

echo [✓] Node.js detectado:
node -v
echo.

:: 2. Instala dependências
echo [*] Instalando módulos e dependências do sistema...
cd /d "%~dp0"
call npm install
cd backend
call npm install
cd ../frontend
call npm install
cd ..

:: 3. Configuração de Variáveis de Ambiente
if not exist "backend\.env" (
    echo [*] Gerando arquivo de configuração local backend\.env...
    copy "backend\.env.example" "backend\.env" > nul
)

:: 4. Compilação do Frontend PWA
echo [*] Compilando interface PWA em modo nativo...
npm run build --prefix frontend

:: 4. Criação de Atalho na Área de Trabalho do Windows
echo [*] Criando atalho na Área de Trabalho...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\PetShop Pro.lnk'); $Shortcut.TargetPath = '%~dp0iniciar.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'PetShop Pro - Sistema de Gestão Empresarial'; $Shortcut.IconLocation = '%~dp0frontend\public\favicon.png'; $Shortcut.Save()"

echo.
echo =============================================================
echo   ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo   Um atalho 'PetShop Pro' foi adicionado à sua Área de Trabalho.
echo =============================================================
echo.
echo Pressione qualquer tecla para iniciar o PetShop Pro agora...
pause > nul

call "%~dp0iniciar.bat"
exit
