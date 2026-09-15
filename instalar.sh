#!/usr/bin/env bash

# Instalador do PetShop Pro para macOS e Linux
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "============================================================="
echo "  🐾 BEM-VINDO AO INSTALADOR DO PETSHOP PRO ENTERPRISE 🐾"
echo "============================================================="

# 1. Checa se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[X] Node.js não foi encontrado. Por favor, instale o Node.js v18+ (https://nodejs.org)."
    exit 1
fi

echo "[✓] Node.js detectado: $(node -v)"

# 2. Instala dependências
echo "[*] Instalando dependências..."
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Configuração de Variáveis de Ambiente
if [ ! -f "backend/.env" ]; then
    echo "[*] Criando backend/.env a partir do modelo..."
    cp backend/.env.example backend/.env
fi

# 4. Compilação do Frontend PWA
echo "[*] Compilando interface PWA..."
npm run build --prefix frontend

# 4. Permissões de execução
chmod +x iniciar.command

echo ""
echo "============================================================="
echo "  ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "  Para iniciar a qualquer momento, execute ./iniciar.command"
echo "============================================================="
echo ""

./iniciar.command
