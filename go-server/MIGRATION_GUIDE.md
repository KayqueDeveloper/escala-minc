# Guia de Migração Node.js para Go

Este documento contém informações sobre a migração da API de gestão de voluntários de Node.js para Go.

## Visão Geral

A migração está sendo feita de forma gradual, permitindo que ambos os servidores operem simultaneamente enquanto o desenvolvimento progride. Isso é feito usando um proxy reverso para redirecionar seletivamente solicitações para o servidor Go.

## Componentes da Migração

1. **Servidor Node.js (Legado)**: Servidor Express em execução na porta 5000
2. **Servidor Go (Novo)**: Servidor Gin em execução na porta 5001
3. **Proxy Reverso**: Proxy em Go para gerenciar o roteamento entre os servidores

## Estrutura de Diretórios

```
go-server/
  ├── main.go                    # Ponto de entrada principal do servidor Go
  ├── models/                    # Definições de modelos Go
  │   └── models.go              # Estruturas equivalentes ao schema.ts
  ├── db/                        # Camada de acesso a dados
  │   └── db.go                  # Conexão com o banco de dados e funções de acesso
  ├── handlers/                  # Manipuladores HTTP
  │   ├── team_handler.go        # Manipuladores para equipes
  │   ├── event_handler.go       # Manipuladores para eventos
  │   └── ...                    # Outros manipuladores
  ├── proxy/                     # Implementação do proxy reverso
  │   ├── proxy.go               # Implementação do proxy
  │   └── main.go                # Ponto de entrada do proxy
  ├── bin/                       # Arquivos binários compilados
  ├── test_responses/            # Armazena respostas de teste para comparação
  ├── compare_endpoints.sh       # Script para comparar respostas dos servidores
  └── start_migration_services.sh # Script para iniciar servidores e proxy
```

## Estratégia de Migração

A migração está seguindo estas etapas:

1. **Preparação**:
   - Definir estruturas de dados equivalentes em Go
   - Configurar conexão com o banco de dados PostgreSQL
   - Implementar um servidor básico com o Gin

2. **Migração de Endpoints**:
   - Implementar endpoints no servidor Go que correspondam aos existentes
   - Manter a mesma estrutura de URL para compatibilidade
   - Validar respostas para garantir consistência

3. **Integração Gradual**:
   - Configurar um proxy reverso para gerenciar o roteamento
   - Redirecionar seletivamente endpoints para o servidor Go
   - Validar em produção cada rota antes de migrar a próxima

4. **Transição Completa**:
   - Após validar todos os endpoints, migrar todo o tráfego para o servidor Go
   - Monitorar a estabilidade e desempenho
   - Desativar o servidor Node.js

## Como Executar o Ambiente de Migração

Para executar o ambiente de migração completo (Node.js, Go e proxy):

```bash
./go-server/start_migration_services.sh
```

Este script inicia:
1. O servidor Node.js na porta 5000
2. O servidor Go na porta 5001
3. O proxy reverso na porta 3000

## Como Testar a Compatibilidade

Para testar se os endpoints Go fornecem as mesmas respostas que os endpoints Node.js:

```bash
./go-server/compare_endpoints.sh
```

Este script:
1. Faz solicitações para ambos os servidores
2. Salva as respostas no diretório `test_responses`
3. Compara os resultados para detectar diferenças

## Rotas Atualmente Migradas

- [ ] `/api/health`
- [x] `/api/teams`
- [x] `/api/roles`
- [x] `/api/volunteers`
- [x] `/api/events`
- [x] `/api/schedules`
- [x] `/api/swap-requests`
- [x] `/api/notifications`

## Próximos Passos

1. Implementar autenticação no servidor Go
2. Migrar rotas auxiliares restantes
3. Configurar testes automatizados
4. Realizar testes de carga

## Considerações Importantes

- Ambos os servidores acessam o mesmo banco de dados PostgreSQL
- O tratamento de datas pode variar entre Node.js e Go, confirme a formatação correta
- O proxy de migração deve ser considerado temporário até a migração completa