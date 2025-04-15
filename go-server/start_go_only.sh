#!/bin/bash

# Este script inicia apenas o servidor Go na porta padrão 5000 (mesma usada pelo Node.js)
# para que o frontend possa se comunicar diretamente com ele sem alterações

# Definir a porta
GO_PORT=5000

# Verificar se o diretório go-server/bin existe e criar se necessário
mkdir -p go-server/bin

# Compilar o servidor Go
echo "Compilando servidor Go..."
cd go-server && go build -o bin/server main.go
if [ $? -ne 0 ]; then
    echo "Erro ao compilar o servidor Go. Encerrando."
    exit 1
fi

# Iniciar o servidor Go
echo "Iniciando servidor Go na porta $GO_PORT..."
cd go-server && PORT=$GO_PORT ./bin/server

# O script termina quando o servidor Go for encerrado