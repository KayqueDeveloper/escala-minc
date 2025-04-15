#!/bin/bash

# Este script compara as respostas das APIs Node.js e Go para verificar compatibilidade
# Os resultados são salvos em arquivos para comparação

NODEJS_PORT=5000
GO_PORT=5001
ENDPOINTS=(
  "/api/health"
  "/api/teams"
  "/api/events"
  "/api/volunteers"
  "/api/schedules"
  "/api/swap-requests"
)

mkdir -p tests/results

echo "Iniciando comparação entre APIs..."

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Testando endpoint: $endpoint"
  
  # Testar Node.js API
  echo "  -> Solicitando API Node.js..."
  curl -s "http://localhost:$NODEJS_PORT$endpoint" > "tests/results/nodejs_$(echo $endpoint | tr '/' '_').json"
  
  # Testar Go API
  echo "  -> Solicitando API Go..."
  curl -s "http://localhost:$GO_PORT$endpoint" > "tests/results/go_$(echo $endpoint | tr '/' '_').json"
  
  # Comparar resultados
  echo "  -> Comparando resultados..."
  diff -q "tests/results/nodejs_$(echo $endpoint | tr '/' '_').json" "tests/results/go_$(echo $endpoint | tr '/' '_').json" > /dev/null
  if [ $? -eq 0 ]; then
    echo "  ✓ Resultados idênticos para $endpoint"
  else
    echo "  ✗ Resultados diferentes para $endpoint"
  fi
  
  echo ""
done

echo "Comparação concluída. Os resultados estão no diretório tests/results."