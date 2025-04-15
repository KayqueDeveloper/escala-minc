# Servidor Go para o Sistema de Agendamento de Voluntários

Este diretório contém a implementação do backend do sistema em Go, que substitui gradualmente o backend Node.js existente.

## Estrutura do Projeto

```
go-server/
  ├── db/               # Configuração e utilitários de banco de dados
  ├── handlers/         # Handlers para as rotas da API
  ├── models/           # Definições de modelos e estruturas de dados
  ├── utils/            # Funções e utilidades auxiliares
  ├── main.go           # Ponto de entrada do servidor
  ├── run.sh            # Script para compilar e executar o servidor
  └── README.md         # Documentação
```

## Funcionalidades Implementadas

- Autenticação de usuários (login/registro)
- Gerenciamento de equipes
- Gerenciamento de voluntários
- Gerenciamento de eventos
- Agendamento de voluntários
- Solicitações de troca
- Notificações
- Dashboard com estatísticas
- Detecção de conflitos

## Como Executar

Para compilar e executar o servidor:

```bash
cd go-server
./run.sh
```

O servidor Go será iniciado na porta 5001, mantendo a compatibilidade com o frontend existente que continua usando o servidor Node.js na porta 5000.

## Migração

Este servidor é parte de um processo de migração do backend Node.js para Go. As razões para esta migração incluem:

1. Melhor desempenho e eficiência
2. Tipagem forte e segurança 
3. Concorrência simplificada
4. Menor consumo de memória

## API

O servidor implementa as mesmas rotas de API que o servidor Node.js original, mantendo compatibilidade completa com o frontend React existente. As rotas principais incluem:

- Autenticação: `/api/auth/login`, `/api/auth/register`
- Equipes: `/api/teams`
- Voluntários: `/api/volunteers`
- Eventos: `/api/events`
- Agendamentos: `/api/schedules`
- Solicitações de troca: `/api/swap-requests`
- Notificações: `/api/notifications`
- Dashboard: `/api/dashboard/stats`

## Banco de Dados

O servidor usa PostgreSQL para armazenamento de dados, conectando-se através da variável de ambiente `DATABASE_URL`.