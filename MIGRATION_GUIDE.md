# Guia de Migração para Go

Este guia explica o processo de migração da aplicação de Node.js/TypeScript para Go.

## Por que Migrar para Go?

1. **Desempenho:** Go é compilado e geralmente mais eficiente que Node.js
2. **Tipagem Estática:** Go oferece segurança de tipos em tempo de compilação
3. **Paralelismo Simples:** Goroutines facilitam operações concorrentes
4. **Uso de Memória:** Go geralmente usa menos memória que Node.js

## Estratégia de Migração Gradual

Em vez de reescrever toda a aplicação de uma vez, estamos adotando uma abordagem incremental:

### Fase 1: Desenvolvimento Paralelo (Atual)

- O servidor Go e o servidor Node.js existem lado a lado
- O servidor Node.js continua atendendo o frontend
- O servidor Go é desenvolvido e testado separadamente

### Fase 2: Migração por Recurso

- Mover um recurso de cada vez para o servidor Go
- Redirecionar chamadas de API específicas para o servidor Go
- Manter o restante dos recursos no servidor Node.js

### Fase 3: Substituição Completa

- Migrar todos os recursos para o servidor Go
- Desativar o servidor Node.js
- Reconfigurações para que Go atenda diretamente o frontend

## Executando os Servidores em Paralelo

Durante a migração, você pode executar ambos os servidores em paralelo:

1. **Servidor Node.js na porta 5000:**
   ```bash
   npm run dev  # Inicia o servidor Node.js existente
   ```

2. **Servidor Go na porta 5001:**
   ```bash
   cd go-server
   ./run.sh     # Compila e inicia o servidor Go
   ```

## Testando a Compatibilidade das APIs

Para garantir que a API Go seja compatível com a API Node.js existente, criamos scripts de teste:

1. **Teste Básico dos Handlers:**
   ```bash
   cd go-server
   go run test_handlers.go  # Testa se os handlers respondem corretamente
   ```

2. **Comparação de Respostas:**
   ```bash
   cd go-server
   ./compare_endpoints.sh   # Compara as respostas das APIs Node.js e Go
   ```

Esses testes ajudam a verificar se a implementação em Go está funcionando corretamente e se produz resultados equivalentes à implementação Node.js existente.

## Atualizando a Proxy de API

Para redirecionar chamadas específicas para o servidor Go:

1. Modifique o frontend para enviar certas chamadas para a porta 5001 em vez de 5000
2. Ou configure um proxy reverso para redirecionar automaticamente URLs específicas

## Comparação da Implementação

### Node.js com TypeScript

```typescript
// Exemplo de endpoint em Node.js
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await storage.getAllTeams();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar equipes' });
  }
});
```

### Go

```go
// Exemplo equivalente em Go
func GetTeams(c *gin.Context) {
  rows, err := db.DB.Query(context.Background(), "SELECT id, name, description, leader_id FROM teams")
  if err != nil {
    c.JSON(http.StatusInternalServerError, models.ApiResponse{
      Success: false,
      Error:   "Erro ao buscar equipes",
    })
    return
  }
  defer rows.Close()

  var teams []models.Team
  for rows.Next() {
    var team models.Team
    if err := rows.Scan(&team.ID, &team.Name, &team.Description, &team.LeaderID); err != nil {
      c.JSON(http.StatusInternalServerError, models.ApiResponse{
        Success: false,
        Error:   "Erro ao processar equipes",
      })
      return
    }
    teams = append(teams, team)
  }

  c.JSON(http.StatusOK, models.ApiResponse{
    Success: true,
    Data:    teams,
  })
}
```

## Benefícios Já Obtidos

- Melhora na estrutura do código com separação clara de preocupações
- Definições de rotas mais organizadas
- Melhor tratamento de erros
- Redução no uso de memória

## Próximos Passos

1. Continuar implementando handlers em Go para todos os endpoints
2. Adicionar testes unitários
3. Configurar um proxy reverso ou atualizar o frontend para usar o servidor Go
4. Monitorar e comparar o desempenho entre Node.js e Go