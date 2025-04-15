#!/bin/bash

# Compilar o servidor Go
echo "Compilando o servidor Go..."
go build -o server

# Executar o servidor
echo "Iniciando o servidor Go na porta 5001..."
DATABASE_URL=$DATABASE_URL PORT=5001 ./server