#!/bin/bash

# Este script compara as respostas dos servidores Node.js e Go para as mesmas rotas

# Definir cores para melhor visualização
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sem cor

# Definir as portas dos servidores
NODEJS_PORT=5000
GO_PORT=5001

# Lista de rotas para testar
ROUTES=(
  "/api/health"
  "/api/teams"
  "/api/teams/1"
  "/api/roles"
  "/api/roles/1"
  "/api/volunteers"
  "/api/volunteers/1"
  "/api/events"
  "/api/events/1"
  "/api/schedules"
  "/api/schedules/1"
  "/api/swap-requests"
  "/api/swap-requests/1"
  "/api/notifications"
  "/api/notifications/1"
)

# Criar diretório para armazenar respostas
mkdir -p go-server/test_responses

echo -e "${YELLOW}Iniciando comparação de endpoints entre Node.js e Go...${NC}"
echo "======================================================="

# Comparar cada rota
for route in "${ROUTES[@]}"; do
  echo -e "${YELLOW}Testando rota: ${route}${NC}"
  
  # Fazer requisição para o Node.js
  echo "Chamando servidor Node.js..."
  curl -s "http://localhost:${NODEJS_PORT}${route}" > "go-server/test_responses/nodejs_$(basename ${route}).json"
  NODEJS_STATUS=$?
  
  # Fazer requisição para o Go
  echo "Chamando servidor Go..."
  curl -s "http://localhost:${GO_PORT}${route}" > "go-server/test_responses/go_$(basename ${route}).json"
  GO_STATUS=$?
  
  # Verificar se as requisições foram bem-sucedidas
  if [ $NODEJS_STATUS -ne 0 ]; then
    echo -e "${RED}Erro ao acessar servidor Node.js para ${route}${NC}"
  fi
  
  if [ $GO_STATUS -ne 0 ]; then
    echo -e "${RED}Erro ao acessar servidor Go para ${route}${NC}"
  fi
  
  # Comparar as respostas (simplificado para verificar apenas se são iguais)
  if [ $NODEJS_STATUS -eq 0 ] && [ $GO_STATUS -eq 0 ]; then
    # Usar jq para formatar e comparar os JSONs se disponível
    if command -v jq &> /dev/null; then
      jq -S . "go-server/test_responses/nodejs_$(basename ${route}).json" > "go-server/test_responses/nodejs_$(basename ${route})_sorted.json"
      jq -S . "go-server/test_responses/go_$(basename ${route}).json" > "go-server/test_responses/go_$(basename ${route})_sorted.json"
      
      if diff -q "go-server/test_responses/nodejs_$(basename ${route})_sorted.json" "go-server/test_responses/go_$(basename ${route})_sorted.json" &> /dev/null; then
        echo -e "${GREEN}✓ Respostas são idênticas para ${route}${NC}"
      else
        echo -e "${RED}✗ Respostas são diferentes para ${route}${NC}"
        echo "  Diferenças:"
        diff -u "go-server/test_responses/nodejs_$(basename ${route})_sorted.json" "go-server/test_responses/go_$(basename ${route})_sorted.json" | grep -E "^[\+\-]" | head -10
      fi
    else
      # Comparação simples se jq não estiver disponível
      if cmp -s "go-server/test_responses/nodejs_$(basename ${route}).json" "go-server/test_responses/go_$(basename ${route}).json"; then
        echo -e "${GREEN}✓ Respostas são idênticas para ${route}${NC}"
      else
        echo -e "${RED}✗ Respostas são diferentes para ${route}${NC}"
      fi
    fi
  fi
  
  echo "-------------------------------------------------------"
done

echo -e "${YELLOW}Testes concluídos. As respostas estão em go-server/test_responses/${NC}"