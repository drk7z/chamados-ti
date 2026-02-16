# Backlog Executável — Sprint 3

## Objetivo do Sprint

Consolidar o núcleo de **Chamados + SLA** com eventos rastreáveis, evolução de métricas e fortalecimento do fluxo operacional ponta a ponta.

## Escopo

1. Fechar fluxo operacional de chamados (abertura, atribuição, transferência, resolução, fechamento, reabertura)
2. Evoluir SLA para regras condicionais e eventos consistentes
3. Disponibilizar visões de métricas SLA para acompanhamento operacional
4. Reforçar auditoria nas ações críticas do módulo de ocorrências

## Histórias e Tarefas Técnicas

## US-01 — Fluxo completo de chamados

**Como** equipe de atendimento  
**Quero** operar todo o ciclo de vida do chamado  
**Para** manter controle operacional do atendimento

### Tarefas US-01

- [x] Garantir endpoints principais do ciclo de chamado
- [x] Validar escopo tenant nas operações principais
- [ ] Revisar padronização de histórico por evento de ciclo
- [ ] Cobrir cenários de erro/retorno para operações de estado

## US-02 — SLA com eventos rastreáveis

**Como** gestor de operação  
**Quero** rastrear eventos de SLA por chamado  
**Para** analisar cumprimento e desvios

### Tarefas US-02

- [x] Persistir eventos de SLA em `sla_eventos`
- [x] Expor timeline `GET /api/ocorrencias/:id/sla-eventos`
- [x] Aplicar regras condicionais de SLA (`sla_regras`) na definição de prazo
- [ ] Incluir marcações de pausa/retomada com impacto no tempo efetivo

## US-03 — Métricas operacionais de SLA

**Como** liderança técnica  
**Quero** métricas por período e operador  
**Para** acompanhar desempenho e risco

### Tarefas US-03

- [x] Manter endpoint de métricas gerais de SLA
- [x] Adicionar filtros por período (`data_inicio`, `data_fim`)
- [x] Adicionar visão por técnico e por área
- [x] Expor violação/cumprimento por faixa temporal

## US-04 — Observabilidade e auditoria de ocorrências

**Como** time de governança  
**Quero** trilha auditável nas ações críticas de chamados  
**Para** rastreabilidade e conformidade

### Tarefas US-04

- [x] Log de eventos críticos de SLA em `logs_sistema`
- [ ] Auditar ações de atribuição, transferência e comentários
- [ ] Consolidar smoke checks de chamados + SLA avançado
- [ ] Atualizar changelog ao final do sprint

## Critério de Pronto (Sprint 3)

- Fluxo operacional de chamados estável e validado
- Eventos de SLA rastreáveis por chamado
- Métricas com filtros operacionais mínimos
- Ações críticas com trilha de auditoria

## Riscos e Mitigação

- **Risco:** divergência entre regra de SLA padrão e condicional  
  **Mitigação:** centralizar cálculo em helper único com testes de cenário
- **Risco:** regressão de performance em métricas  
  **Mitigação:** filtros por período e paginação/limites em endpoints analíticos

## Sequência Recomendada de Execução

1. Fechar consistência do fluxo de chamados
2. Aplicar regras condicionais de SLA
3. Expandir métricas operacionais
4. Auditoria complementar + validação final
