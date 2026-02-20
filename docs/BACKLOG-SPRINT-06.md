# Backlog Executável — Sprint 6

## Objetivo do Sprint

Implementar núcleo de **Software e Licenças** com controle de atribuição por ativo/usuário, validade de licenças e rastreabilidade operacional.

## Escopo

1. Fechar cadastro e governança de software
2. Implementar controle de licenças e contratos
3. Integrar atribuições software ↔ ativo/usuário
4. Expor visões operacionais mínimas no frontend

## Histórias e Tarefas Técnicas

## US-01 — Catálogo de software

**Como** equipe de ativos  
**Quero** manter catálogo de softwares padronizado  
**Para** controlar uso e padronização do parque

### Tarefas US-01

- [x] Revisar CRUD de software (`/api/inventario/software` ou equivalente)
- [x] Validar campos obrigatórios (nome, versão, fabricante/categoria)
- [ ] Garantir escopo tenant nas operações
- [x] Auditar operações de create/update/inactivate

## US-02 — Licenças e conformidade

**Como** governança de TI  
**Quero** controlar licenças e datas de vencimento  
**Para** reduzir risco de não conformidade

### Tarefas US-02

- [ ] Modelar/validar entidade de licença (quantidade, tipo, validade)
- [ ] Implementar operações de cadastro/atualização/inativação
- [ ] Expor visão de licenças próximas do vencimento
- [ ] Adicionar logs de auditoria para alterações críticas

## US-03 — Atribuição software ↔ ativo/usuário

**Como** operação  
**Quero** vincular softwares licenciados aos ativos/usuários  
**Para** rastrear consumo de licenças

### Tarefas US-03

- [ ] Implementar vínculo de licença com ativo e/ou usuário
- [ ] Validar consumo de quantidade licenciada
- [ ] Bloquear atribuições acima do limite contratado
- [ ] Expor histórico de atribuição e revogação

## US-04 — Frontend mínimo de software/licenças

**Como** analista de inventário  
**Quero** consultar e operar software/licenças no painel  
**Para** evitar operação manual por API

### Tarefas US-04

- [ ] Criar página de catálogo de software no frontend
- [ ] Criar página de licenças com status (vigente/próxima do vencimento/vencida)
- [ ] Criar fluxo de atribuição e revogação
- [ ] Integrar feedback visual e tratamento de erro padrão

## Critério de Pronto (Sprint 6)

- Catálogo de software operando com regras mínimas
- Licenças com controle de quantidade e validade
- Atribuições com bloqueio de over-allocation
- Frontend operacional cobrindo software e licenças

## Riscos e Mitigação

- **Risco:** inconsistência entre quantidade licenciada e atribuída  
  **Mitigação:** validação centralizada e transacional nas operações de vínculo
- **Risco:** baixa visibilidade de vencimentos  
  **Mitigação:** endpoint dedicado e filtros por janela de vencimento

## Sequência Recomendada de Execução

1. Consolidar catálogo de software (US-01)
2. Entregar núcleo de licenças (US-02)
3. Implementar atribuições com limites (US-03)
4. Disponibilizar frontend operacional mínimo (US-04)

## Atualização de Progresso

- 2026-02-20: US-01 parcialmente concluída com catálogo de software operacional (CRUD, filtros, validações, auditoria e frontend mínimo).
- Pendência US-01: fechamento de escopo tenant para `softwares` depende de estratégia de persistência com `entidade_id` (não presente na modelagem atual).
