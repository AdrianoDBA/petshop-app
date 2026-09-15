#!/usr/bin/env bash

# Muda para o diretório onde o script está localizado
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "============================================================="
echo "  🐾 INICIANDO PETSHOP PRO (MODO APLICATIVO NATIVO) 🐾"
echo "============================================================="

# Inicia o servidor em segundo plano
npm run start &
SERVER_PID=$!

# Aguarda 2 segundos
sleep 2

# Abre o Google Chrome ou Edge em modo Janela de Aplicativo (sem barra de URL e sem abas)
if [ -d "/Applications/Google Chrome.app" ]; then
    open -na "Google Chrome" --args --app=http://localhost:3001 --window-size=1280,800
elif [ -d "/Applications/Microsoft Edge.app" ]; then
    open -na "Microsoft Edge" --args --app=http://localhost:3001 --window-size=1280,800
elif [ -d "/Applications/Brave Browser.app" ]; then
    open -na "Brave Browser" --args --app=http://localhost:3001 --window-size=1280,800
else
    open http://localhost:3001
fi

echo "PetShop Pro rodando em http://localhost:3001"
