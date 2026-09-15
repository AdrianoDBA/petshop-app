#!/bin/bash

echo "🐾 Iniciando PetShop Pro Enterprise (Estilo Hashiko)..."

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Liberar porta 3001 se ocupada
kill -9 $(lsof -t -i:3001) 2>/dev/null || true

# Backend dependencies & DB check
echo "📦 Verificando dependências do backend..."
cd "$DIR/backend"
if [ ! -d "node_modules" ]; then
  npm install
fi

if [ ! -f "petshop.db" ]; then
  echo "🌱 Criando e populando banco de dados..."
  npm run seed
fi

# Frontend dependencies & build
echo "🎨 Compilando aplicativo PWA (Frontend)..."
cd "$DIR/frontend"
if [ ! -d "node_modules" ]; then
  npm install
fi
npm run build

# Volta para a raiz do projeto
cd "$DIR"

echo ""
echo "🚀 Iniciando servidor integrado PetShop Pro..."
cd "$DIR/backend"
npm run dev &
BACKEND_PID=$!

sleep 2

echo "🌐 Abrindo aplicativo no navegador..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  open http://localhost:3001
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  xdg-open http://localhost:3001
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
  start http://localhost:3001
else
  echo "👉 Acesse no seu navegador: http://localhost:3001"
fi

echo ""
echo "✅ PetShop Pro Enterprise rodando com sucesso!"
echo "📱 Acesse: http://localhost:3001"
echo "🌐 Link Público para Clientes: http://localhost:3001/agendar/patinhas-felizes"
echo "🔑 Login Administrador: admin / admin123"
echo "🔑 Login Médica Veterinária: carla / admin123"
echo "🔑 Login Atendente: maria / admin123"
echo "🔑 Login Tosador: joao / tosador123"
echo ""
echo "⚠️ Pressione Ctrl+C para encerrar o servidor"

wait $BACKEND_PID
