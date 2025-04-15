#!/bin/bash

# Este script inicia o servidor Node.js, o servidor Go e o proxy para gerenciar as solicitações

# Definir as portas
NODEJS_PORT=5000
GO_PORT=5001
PROXY_PORT=3000

# Definir as URLs e rotas que serão usadas pelo proxy
NODEJS_URL="http://localhost:$NODEJS_PORT"
GO_URL="http://localhost:$GO_PORT"
GO_ROUTES="/api/health,/api/teams,/api/events,/api/volunteers,/api/schedules,/api/swap-requests,/api/notifications"

# Iniciar o servidor Node.js em segundo plano
echo "Iniciando servidor Node.js na porta $NODEJS_PORT..."
npm run dev &
NODEJS_PID=$!

# Verificar se o diretório go-server/bin existe e criar se necessário
mkdir -p go-server/bin

# Compilar o servidor Go
echo "Compilando servidor Go..."
cd go-server && go build -o bin/server main.go
if [ $? -ne 0 ]; then
    echo "Erro ao compilar o servidor Go. Encerrando."
    kill $NODEJS_PID
    exit 1
fi

# Iniciar o servidor Go em segundo plano
echo "Iniciando servidor Go na porta $GO_PORT..."
cd go-server && ./bin/server --port $GO_PORT &
GO_PID=$!

# Aguardar um pouco para os servidores inicializarem
sleep 5

# Compilar o proxy
echo "Compilando proxy..."
cd go-server/proxy && go build -o ../bin/proxy
if [ $? -ne 0 ]; then
    echo "Erro ao compilar o proxy. Encerrando servidores..."
    kill $NODEJS_PID
    kill $GO_PID
    exit 1
fi

# Iniciar o proxy
echo "Iniciando proxy na porta $PROXY_PORT..."
cd go-server && ./bin/proxy --nodejs $NODEJS_URL --go $GO_URL --routes "$GO_ROUTES" --port $PROXY_PORT

# Encerrar os processos em segundo plano antes de sair
cleanup() {
    echo "Encerrando servidores..."
    kill $NODEJS_PID
    kill $GO_PID
    exit 0
}

# Registrar trap para Ctrl+C
trap cleanup SIGINT

# Manter o script em execução
wait