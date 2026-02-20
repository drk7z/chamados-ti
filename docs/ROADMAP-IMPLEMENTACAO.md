# Roadmap de Implementação — Chamados TI (ITSM + ITAM)

## Status Atual
- Sprint 1: ✅ Concluída
- Sprint 2: ✅ Concluída
- Sprint 3: ✅ Concluída
- Sprint 4: ✅ Concluída
- Sprint 5: ✅ Concluída
- Sprint 6: 🚀 Em andamento
- Versão-alvo atual: `1.5.1`

## Objetivo
Transformar o projeto atual em uma plataforma completa de gestão de serviços e ativos de TI, cobrindo segurança, multi-tenant, operações ITSM, ativos/CMDB, conhecimento e governança.

## Fases e Marcos

## Fase 0 — Fundação Técnica (1 sprint)
**Meta:** estabilizar base para evolução segura.

- Corrigir `database/schema.sql` para execução limpa (sem erros parciais)
- Consolidar estratégia de bootstrap (`schema` + seed inicial + usuário admin)
- Padronizar variáveis de ambiente e validações de inicialização
- Revisar logs de erro e observabilidade mínima

**Critério de pronto:**
- Subida limpa em máquina nova com 1 comando
- Backend e frontend sem erros críticos no startup

## Fase 1 — Núcleo ITSM + Segurança (4 sprints)
**Meta:** plataforma operacional para chamados com autenticação e governança.

### Sprint 1 — Segurança e Autenticação + Multi-tenant
- JWT com contexto de tenant
- Middleware de tenant para rotas protegidas
- Ajustes de RBAC e vínculos usuário-perfil
- Política de senha, bloqueio e reset

**Status:** ✅ Concluída

### Sprint 2 — Empresas, Clientes e Estrutura Organizacional
- CRUD de entidades (matriz/filial)
- Clientes, unidades, departamentos e centros de custo
- Isolamento por tenant nas consultas

**Status:** ✅ Concluída

### Sprint 3 — Chamados e SLA
- Fluxo completo de chamados (abertura, atribuição, progresso, resolução)
- Comentários, histórico, anexos, tags e relacionamentos
- Regras de SLA e indicadores básicos

**Status:** ✅ Concluída

### Sprint 4 — Áreas/Grupos + Administração/Logs
- Áreas de atendimento e grupos técnicos
- Configurações administrativas essenciais
- Logs e auditoria de eventos críticos

**Status:** ⚙️ Em fechamento

**Critério de pronto da Fase 1:**
- Fluxo de chamado ponta a ponta funcional por tenant
- Controle de acesso e trilha de auditoria ativos

## Fase 2 — ITAM e CMDB (3 sprints)
**Meta:** gestão de ativos e relacionamentos de configuração.

### Sprint 5 — Ativos e Inventário
- CRUD completo de ativos, tipos, modelos e categorias
- Localização, responsáveis e histórico de movimentação

**Status:** ✅ Concluída

### Sprint 6 — Software e Licenças
- Catálogo de software
- Tipos de licença e atribuições
- Vínculo software ↔ ativo

**Status:** 🚀 Em andamento

**Progresso atual:** US-01 (catálogo de software) entregue.

### Sprint 7 — CMDB
- Serviços de negócio e dependências
- Relacionamentos ativo ↔ ativo e serviço ↔ ativo
- Visualizações e impactos

**Critério de pronto da Fase 2:**
- Inventário confiável e rastreável com dependências CMDB

## Fase 3 — Conhecimento, Soluções e Excelência Operacional (2 sprints)
**Meta:** ganho de produtividade e maturidade operacional.

### Sprint 8 — Base de Conhecimento + Soluções/Roteiros
- Artigos, categorias e busca
- Soluções padrão e roteiros operacionais

### Sprint 9 — Qualidade, Performance e Release
- Hardening de API
- Otimizações de queries
- Preparação de release e documentação final

**Critério de pronto da Fase 3:**
- Plataforma pronta para operação contínua com documentação atualizada

## Princípios de Execução
- Entrega incremental por sprint com demo funcional
- Feature flags para recursos sensíveis
- Testes mínimos por módulo (serviço + integração de API)
- Auditoria e segurança não opcionais

## Definição de Pronto (DoD)
Cada história só é concluída quando:
1. Código implementado e revisado
2. API documentada
3. Testes mínimos executados
4. Logs/auditoria para ação crítica
5. Validação multi-tenant (quando aplicável)
