# Backlog Executável — Sprint 2

## Objetivo do Sprint

Consolidar o domínio de **Empresas, Clientes e Estrutura Organizacional** com isolamento de dados por tenant e regras administrativas consistentes.

## Escopo

1. Fechar CRUD de entidades com regras global x tenant
2. Consolidar visibilidade e escrita de clientes por entidade
3. Preparar base de estrutura organizacional (unidades/departamentos/centros de custo)
4. Expandir auditoria para ações críticas dos módulos cobertos

## Histórias e Tarefas Técnicas

## US-01 — Entidades com governança de acesso

**Como** administrador global e administrador local  
**Quero** operar entidades conforme meu nível de acesso  
**Para** manter isolamento e governança do ambiente multiempresa

### Tarefas US-01

- [x] Revisar CRUD `/api/admin/entidades` com regras finais de permissão
- [x] Garantir filtros de listagem por perfil (global vê tudo, local vê apenas a própria)
- [x] Validar proteção contra alteração indevida de tenant por admin local
- [x] Registrar auditoria para criar/atualizar/inativar entidade

## US-02 — Clientes com isolamento por tenant

**Como** operador de atendimento  
**Quero** listar e manter clientes apenas do meu tenant  
**Para** evitar vazamento de dados entre entidades

### Tarefas US-02

- [x] Revisar `clientes.routes.js` para filtros obrigatórios por `entidade_id`
- [x] Garantir criação/edição respeitando `req.tenantId` para usuários não globais
- [x] Validar buscas e paginação sem romper escopo multi-tenant
- [x] Adicionar auditoria de create/update/delete em clientes

## US-03 — Estrutura organizacional mínima pronta

**Como** time de operação  
**Quero** estrutura básica de unidades/departamentos/centros de custo  
**Para** suportar roteamento e classificação de chamados

### Tarefas US-03

- [x] Confirmar modelos e relacionamentos necessários no backend
- [x] Expor endpoints mínimos para cadastro e listagem
- [x] Garantir escopo por tenant em todas as consultas
- [x] Definir seeds mínimos para ambiente local

## US-04 — Qualidade e observabilidade do sprint

**Como** equipe técnica  
**Quero** trilha de auditoria e validações básicas automatizadas  
**Para** reduzir regressão e aumentar rastreabilidade

### Tarefas US-04

- [x] Padronizar eventos de log em ações críticas de clientes e inventário
- [x] Criar smoke checks documentados para auth, ocorrências, SLA e logs
- [x] Atualizar changelog ao final do sprint

**Evidência:** `docs/SMOKE-CHECKS.md`

## Critério de Pronto (Sprint 2)

- Entidades e clientes operando com isolamento por tenant validado
- Ações críticas com registro de auditoria
- Endpoints principais com smoke test de sucesso
- Documentação de sprint atualizada

## Riscos e Mitigação

- **Risco:** divergência entre regra global/local em endpoints legados  
  **Mitigação:** validação central de tenant e revisão de rotas protegidas
- **Risco:** regressão em permissões após ajustes de filtros  
  **Mitigação:** smoke tests com usuário global e usuário local

## Sequência Recomendada de Execução

1. Fechar governança de entidades
2. Fechar isolamento em clientes
3. Estrutura organizacional mínima
4. Auditoria + validação final
