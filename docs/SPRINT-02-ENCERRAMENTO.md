# Encerramento da Sprint 2 — Empresas, Clientes e Estrutura Organizacional

## Período

- Fechamento em: 2026-02-16

## Objetivo da Sprint

Consolidar domínio organizacional multi-tenant com governança de entidades, isolamento de clientes, estrutura de unidades/departamentos/centros de custo e trilha de auditoria.

## Entregas Concluídas

### 1) Governança de entidades

- Regras global x local validadas no módulo administrativo.
- Inativação segura de entidade com auditoria.

### 2) Clientes com isolamento multi-tenant

- CRUD completo de clientes com validação de tenant.
- Busca e paginação opcionais sem quebrar resposta legada.
- Auditoria de create/update/delete.

### 3) Estrutura organizacional mínima

- Endpoints mínimos para unidades, departamentos e centros de custo.
- Escopo tenant aplicado em consultas encadeadas.
- Auditoria de ações críticas em toda a estrutura.

### 4) Seed mínimo para ambiente local

- Seed passou a garantir base organizacional padrão:
  - cliente base
  - unidade base
  - departamento base
  - centro de custo base
- Seed passou a garantir tipo de chamado padrão para abertura inicial.

### 5) Evolução inicial da Sprint 3 (adiantamento técnico)

- Persistência de eventos em `sla_eventos` no fluxo de chamados.
- Endpoint de timeline de SLA por chamado: `GET /api/ocorrencias/:id/sla-eventos`.

## Evidências de Validação

- Fluxo completo com 200/201:
  - cliente -> unidade -> departamento -> centro de custo
  - update e delete de toda a cadeia
- Seed executado com sucesso e dados base disponíveis por API.
- Validação SLA:
  - `POST /api/ocorrencias` -> 201
  - `POST /api/ocorrencias/:id/resolver` -> 200
  - `GET /api/ocorrencias/:id/sla-eventos` -> 200 (`total >= 2`)

## Débito Técnico Residual (controlado)

- Expandir cálculo de SLA para regras condicionais (`sla_regras`) por tipo/prioridade/cliente.
- Adicionar métricas temporais de SLA por período e por técnico.
- Cobrir comentários/anexos de chamados com auditoria dedicada (além do histórico funcional).

## Decisão de Fechamento

Sprint 2 encerrada com objetivo atingido e plataforma pronta para aprofundamento do núcleo de chamados/SLA na Sprint 3.

## Próxima Sprint

Ver backlog em `docs/BACKLOG-SPRINT-03.md`.
