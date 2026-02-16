# Backlog Executável — Sprint 1

## Objetivo do Sprint
Entregar fundação de **Segurança e Autenticação** com base para **Multi-tenant**.

## Escopo
1. Corrigir pontos críticos de autenticação e estabilidade de startup
2. Introduzir contexto de tenant nas requisições autenticadas
3. Preparar base de governança para próximos sprints

## Histórias e Tarefas Técnicas

## US-01 — Login estável e seguro
**Como** usuário
**Quero** autenticar sem erro de infraestrutura/modelo
**Para** acessar o sistema com confiabilidade

### Tarefas
- [x] Corrigir joins N:N para não depender de `deleted_at` em tabelas sem paranoid
- [x] Garantir criação/ajuste do usuário admin para ambiente local
- [x] Validar login `admin/admin` por API

## US-02 — Startup previsível em ambiente local
**Como** dev
**Quero** backend iniciar sem crash por sync indevido
**Para** acelerar desenvolvimento

### Tarefas
- [x] Tornar `sequelize.sync()` opt-in via `DB_SYNC=true`
- [x] Ajustar script de inicialização para bootstrap de banco

## US-03 — Contexto Multi-tenant inicial
**Como** sistema
**Quero** resolver tenant em rotas protegidas
**Para** suportar isolamento por entidade

### Tarefas
- [x] Adicionar `entidade_id` explícito no modelo de usuário
- [x] Adicionar middleware `resolveTenant`
- [x] Aplicar middleware tenant nas rotas protegidas
- [x] Incluir `entidade_id` no payload do token JWT

## US-04 — Planejamento do programa completo
**Como** time
**Quero** roadmap claro por fases
**Para** executar com previsibilidade

### Tarefas
- [x] Criar roadmap técnico em `docs/ROADMAP-IMPLEMENTACAO.md`
- [x] Registrar backlog deste sprint

## Itens já prontos no Sprint
- Backend sobe com conexão de banco estável
- Login autenticando com sucesso
- Base de multi-tenant iniciada no backend

## Itens do Sprint 2 (pré-planejados)
- CRUD completo de `entidades`
- Regras de visibilidade por tenant em módulos (`clientes`, `chamados`, `inventário`)
- Admin global x admin da entidade
- Seeds por tenant
