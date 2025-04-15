#!/bin/bash

echo "Compilando o servidor Go..."
go build -o server main.go

echo "Iniciando o servidor Go na porta 5001..."
./server &