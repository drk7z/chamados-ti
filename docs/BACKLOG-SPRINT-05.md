# Backlog Executável — Sprint 5

## Objetivo do Sprint

Consolidar o módulo de **Ativos e Inventário** com governança operacional, rastreabilidade de movimentações e consistência multi-tenant.

## Escopo

1. Fechar CRUD operacional de ativos com validações de negócio
2. Consolidar histórico de localização e responsável
3. Reforçar trilha de auditoria do inventário
4. Disponibilizar fluxo mínimo operacional no frontend

## Histórias e Tarefas Técnicas

## US-01 — CRUD completo de ativos

**Como** equipe de inventário  
**Quero** cadastrar, atualizar e consultar ativos com consistência  
**Para** manter base patrimonial confiável

### Tarefas US-01

- [x] Revisar endpoints de ativos (`/api/inventario`) com validações obrigatórias
- [x] Garantir consistência de vínculos (tipo, fabricante, responsável, localização)
- [x] Padronizar filtros por status, criticidade e termo de busca
- [x] Garantir escopo tenant/global em listagem e detalhe

## US-02 — Movimentação e histórico de ativos

**Como** operação de TI  
**Quero** registrar mudanças de localização e responsável  
**Para** rastrear ciclo de vida do ativo

### Tarefas US-02

- [x] Implementar/ajustar operação de transferência de ativo
- [x] Persistir histórico em `ativo_historico_localizacao`
- [x] Registrar usuário, data e motivo da movimentação
- [x] Expor timeline de movimentações no endpoint de detalhe

## US-03 — Auditoria e observabilidade de inventário

**Como** governança  
**Quero** rastrear ações críticas no inventário  
**Para** conformidade e diagnóstico operacional

### Tarefas US-03

- [x] Auditar create/update/inactivate de ativos em `logs_sistema`
- [x] Ampliar filtros de `/api/admin/logs` para consultas de inventário
- [x] Definir smoke checks específicos de inventário
- [x] Atualizar changelog com evidências da sprint

## US-04 — Frontend mínimo de operação de ativos

**Como** analista de inventário  
**Quero** operar ativos sem chamadas manuais de API  
**Para** agilizar rotina de gestão

### Tarefas US-04

- [x] Evoluir telas `frontend/src/pages/Inventario` (listagem + detalhe + atualização)
- [x] Incluir ação de movimentação com motivo e responsável
- [x] Exibir histórico de localização no detalhe
- [x] Integrar mensagens de erro/feedback consistentes

## Critério de Pronto (Sprint 5)

- CRUD de ativos validado com regras mínimas de negócio
- Histórico de movimentação funcional e auditável
- Trilha de logs de inventário consultável
- Frontend de inventário cobrindo fluxo operacional mínimo

## Riscos e Mitigação

- **Risco:** divergência entre estado atual e histórico do ativo  
  **Mitigação:** centralizar atualização de ativo + histórico em operação transacional
- **Risco:** perda de rastreabilidade em mudanças críticas  
  **Mitigação:** auditoria obrigatória para ações de escrita

## Sequência Recomendada de Execução

1. Fechar consistência do backend de ativos (US-01)
2. Implementar movimentação + histórico (US-02)
3. Reforçar auditoria e smoke checks (US-03)
4. Consolidar frontend operacional de inventário (US-04)

## Atualização de Progresso

- 2026-02-20: US-01 concluída com validações de payload, filtros avançados, paginação segura e correção de roteamento `/inventario/config/*`.
- 2026-02-20: US-02 concluída com movimentação transacional, motivo obrigatório e histórico enriquecido com referências de localização/responsável.
- 2026-02-20: US-03 concluída com trilha de auditoria de inventário + smoke checks dedicados.
- 2026-02-20: US-04 concluída com frontend de inventário (listagem, detalhe, atualização, movimentação e histórico).
