# Backlog Executável — Sprint 4

## Objetivo do Sprint

Consolidar o eixo de **administração operacional** com foco em **áreas de atendimento, grupos técnicos, configuração administrativa e observabilidade por logs**, cobrindo backend e frontend mínimo.

## Escopo

1. Disponibilizar CRUD de áreas de atendimento com regras de segurança e tenant
2. Disponibilizar CRUD de grupos técnicos e vínculo de usuários
3. Fortalecer módulo administrativo (configurações e usuários) com auditoria consistente
4. Evoluir consumo operacional no frontend para administração básica

## Histórias e Tarefas Técnicas

## US-01 — Áreas de atendimento administráveis

**Como** administrador
**Quero** gerenciar áreas de atendimento
**Para** organizar triagem e transferência de chamados

### Tarefas US-01

- [ ] Criar rotas administrativas de áreas (`/api/admin/areas`) com list/create/update/inactivate
- [ ] Aplicar validação de payload obrigatório e conflitos de nome
- [ ] Garantir escopo multi-tenant/global conforme perfil administrativo
- [ ] Auditar create/update/inactivate em `logs_sistema`

## US-02 — Grupos técnicos e membros

**Como** coordenação técnica
**Quero** gerenciar grupos técnicos e seus membros
**Para** distribuir atendimento por especialidade

### Tarefas US-02

- [ ] Criar rotas administrativas de grupos (`/api/admin/grupos-tecnicos`) com list/create/update/inactivate
- [ ] Criar operações de vínculo e desvínculo de usuários no grupo
- [ ] Permitir marcação de coordenador por grupo
- [ ] Validar consistência entre `grupo.area_id` e domínio da área
- [ ] Auditar operações de grupos e vínculos em `logs_sistema`

## US-03 — Administração e observabilidade

**Como** time de governança
**Quero** aumentar visibilidade e rastreabilidade administrativa
**Para** facilitar operação e conformidade

### Tarefas US-03

- [x] Evoluir consultas de `/api/admin/logs` com filtros operacionais adicionais (quando aplicável)
- [x] Garantir paginação segura e limites máximos padronizados
- [x] Revisar auditoria das rotas `/api/admin/usuarios` e `/api/admin/configuracoes`
- [x] Atualizar smoke checks para cobrir fluxo admin (áreas, grupos, logs)

## US-04 — Frontend administrativo mínimo

**Como** administrador
**Quero** telas mínimas de operação administrativa
**Para** não depender somente de chamadas manuais de API

### Tarefas US-04

- [x] Expandir módulo `frontend/src/pages/Admin` além de `Configuracoes`
- [x] Criar página de Áreas (listagem + cadastro/edição/inativação)
- [x] Criar página de Grupos Técnicos (listagem + membros)
- [x] Criar página de Logs (consulta com filtros principais)
- [x] Integrar com API existente mantendo padrão de layout atual

## Critério de Pronto (Sprint 4)

- CRUD de áreas e grupos técnicos disponível e auditado
- Vínculo de membros em grupos operando com regras básicas
- Trilha de logs administrativos consultável com filtros mínimos
- Frontend admin com telas operacionais mínimas para áreas/grupos/logs

## Riscos e Mitigação

- **Risco:** conflito entre escopo global e tenant em rotas admin
  **Mitigação:** centralizar validação por helper de autorização/escopo
- **Risco:** inconsistência de vínculo usuário-grupo-área
  **Mitigação:** validar domínio de área e existência de usuário antes de persistir vínculo
- **Risco:** crescimento de volume em `logs_sistema`
  **Mitigação:** impor limites de paginação e filtros por período

## Sequência Recomendada de Execução

1. Implementar backend de áreas (US-01)
2. Implementar backend de grupos + membros (US-02)
3. Reforçar observabilidade admin e smoke checks (US-03)
4. Entregar frontend administrativo mínimo (US-04)

## Atualização de Progresso

- 2026-02-19: US-04 concluída com telas operacionais mínimas de Admin (Áreas, Grupos Técnicos e Logs) integradas ao backend.
- 2026-02-20: US-03 concluída com filtros avançados/paginação segura em logs, auditoria de usuários/configurações e smoke local (`admin/areas`, `admin/grupos-tecnicos`, `admin/logs`).
