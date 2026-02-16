# Encerramento da Sprint 1 — Segurança, Autenticação e Base Multi-tenant

## Período
- Fechamento em: 2026-02-16

## Objetivo da Sprint
Entregar fundação técnica estável para evolução do sistema com foco em autenticação, previsibilidade de startup, base de isolamento por tenant e governança inicial de execução.

## Entregas Concluídas

### 1) Estabilidade de autenticação e RBAC
- Login `admin/admin` validado via API.
- Correção de relacionamentos N:N sem dependência indevida de `deleted_at`.
- Contexto de permissões deduplicado no middleware de autenticação.

### 2) Startup previsível local
- `sequelize.sync()` tornou-se opt-in (`DB_SYNC=true`) para evitar colisões de schema.
- `start.bat` evoluído para:
	- localizar `psql` (PATH, Laragon e Program Files),
	- preparar banco quando necessário,
	- liberar portas ocupadas (3000/3001),
	- suportar bootstrap de backend.

### 3) Base multi-tenant aplicada
- Middleware de tenant aplicado nas rotas protegidas.
- Propagação de `entidade_id` nos pontos críticos.
- Regra de admin global versus admin por entidade consolidada.

### 4) Núcleo operacional complementar
- Indicadores e cálculo básico de SLA no módulo de ocorrências.
- Endpoint de logs administrativos estabilizado (`/api/admin/logs`).

### 5) Governança/versionamento
- Guia de versionamento e convenção de commits formalizados.
- Template de PR e validação de commitlint em workflow.
- Workflow de release por tag estruturado.

## Evidências de Validação
- `POST /api/auth/login` → 200
- `GET /api/ocorrencias` → 200
- `GET /api/ocorrencias/metricas/sla` → 200
- `GET /api/admin/logs?limit=5` → 200

## Débito Técnico Residual (controlado)
- Expandir auditoria para ações críticas em `clientes` e `inventário`.
- Ampliar cobertura de testes de regressão de API.

## Decisão de Fechamento
Sprint 1 encerrada com objetivo atingido e base pronta para escalar execução do domínio organizacional/cliente na Sprint 2.

## Próxima Sprint
Ver backlog em `docs/BACKLOG-SPRINT-02.md`.

