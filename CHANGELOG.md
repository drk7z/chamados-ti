# Changelog - Sistema de Chamados TI

## [1.3.1] - Sprint 3 (SLA Regras + Métricas Filtradas)

### Added (1.3.1)

- Resolução condicional de SLA via `sla_regras` no fluxo de criação/atualização de chamados.
- Filtros de métricas SLA por `data_inicio`, `data_fim`, `tecnico_id` e `area_id`.
- Visões agregadas de métricas por técnico e por área no endpoint `/api/ocorrencias/metricas/sla`.

### Changed (1.3.1)

- Cálculo de prazo SLA passou a priorizar regra condicional e fallback para SLA padrão por tipo.

### Fixed (1.3.1)

- Ajuste de `SlaRegra` para `paranoid: false` (compatibilidade com tabela sem `deleted_at`).

## [1.3.0] - Encerramento Sprint 2 e Início Sprint 3

### Added (1.3.0)

- Documento de encerramento da sprint em `docs/SPRINT-02-ENCERRAMENTO.md`.
- Backlog executável da Sprint 3 em `docs/BACKLOG-SPRINT-03.md`.
- Persistência de eventos de SLA em `sla_eventos` no fluxo de chamados.
- Endpoint de timeline de SLA por chamado: `GET /api/ocorrencias/:id/sla-eventos`.
- Seed com tipo de chamado padrão para abertura inicial.

### Changed (1.3.0)

- Roadmap atualizado com Sprint 2 concluída e Sprint 3 em andamento.
- Seed local ampliado para base organizacional mínima e dados de chamados.

### Fixed (1.3.0)

- Ajuste de `ChamadoHistorico` para `paranoid: false` (compatibilidade com tabela sem `deleted_at`).

## [1.2.1] - Sprint 2 (Core Organizacional + Auditoria)

### Added (1.2.1)

- CRUD mínimo de estrutura organizacional:
  - unidades (`/api/clientes/:clienteId/unidades`)
  - departamentos (`/api/clientes/unidades/:unidadeId/departamentos`)
  - centros de custo (`/api/clientes/departamentos/:departamentoId/centros-custo`)
- Auditoria padronizada via utilitário `backend/src/utils/audit.js`.
- Documentação de smoke checks em `docs/SMOKE-CHECKS.md`.

### Changed (1.2.1)

- Listagem de clientes com busca e paginação opcional sem quebrar resposta legada.
- Seed local agora inclui base organizacional mínima (cliente, unidade, departamento e centro de custo).

### Fixed (1.2.1)

- Reforço de escopo tenant em consultas encadeadas de estrutura organizacional.

## [1.2.0] - Fechamento da Sprint 1 e Abertura da Sprint 2

### Added (1.2.0)

- Documentação de encerramento da sprint em `docs/SPRINT-01-ENCERRAMENTO.md`.
- Backlog executável da próxima sprint em `docs/BACKLOG-SPRINT-02.md`.

### Changed (1.2.0)

- Roadmap atualizado com status de execução:
  - Sprint 1 marcada como concluída.
  - Sprint 2 marcada como em andamento.

### Fixed (1.2.0)

- Consolidação da trilha documental de governança para fechamento e transição entre sprints.

## [1.1.0] - Expansão do Sistema (Novas Funcionalidades)

### ✨ Novos Recursos

#### 📌 Sistema de Tags
- **Tabelas**: `tags`, `chamado_tags`
- **Modelos**: Tag.js (Tag, ChamadoTag)
- **Funcionalidades**:
  - Criação e gerenciamento de tags personalizadas com cores
  - Associação múltipla de tags aos chamados (relacionamento N:N)
  - Filtros e organização por tags

#### 📎 Sistema de Anexos
- **Tabelas**: `chamado_anexos`
- **Modelos**: Tag.js (ChamadoAnexo)
- **Controllers**: anexos.controller.js
- **Funcionalidades**:
  - Upload de múltiplos arquivos por chamado
  - Suporte a diversos formatos (imagens, PDFs, documentos, compactados)
  - Limite de tamanho configurável (padrão 10MB)
  - Download seguro de arquivos
  - Rastreamento de usuário que enviou o anexo
  - Armazenamento organizado por entidade e ID

#### 💡 Base de Conhecimento (Knowledge Base)
- **Tabelas**: `conhecimento_categorias`, `conhecimento_artigos`, `conhecimento_comentarios`
- **Modelos**: Conhecimento.js (ConhecimentoCategoria, ConhecimentoArtigo, ConhecimentoComentario)
- **Controllers**: conhecimento.controller.js
- **Routes**: /conhecimento/*
- **Funcionalidades**:
  - Categorias hierárquicas (categorias e subcategorias)
  - Artigos com editor de conteúdo rico
  - Sistema de rascunho → publicado → arquivado
  - Busca por palavras-chave e tags
  - Contador de visualizações
  - Sistema de votação (útil/não útil)
  - Comentários com aprovação
  - Artigos em destaque
  - Controle de visibilidade (público/privado)

#### 📋 Soluções Padrão e Roteiros
- **Tabelas**: `solucoes_padrao`, `roteiros_atendimento`, `roteiro_passos`, `roteiro_execucao`
- **Modelos**: Solucao.js (SolucaoPadrao, RoteiroAtendimento, RoteiroPasso, RoteiroExecucao)
- **Funcionalidades**:
  - Biblioteca de soluções comuns com busca por palavras-chave
  - Roteiros de atendimento passo a passo
  - Acompanhamento de execução de roteiros
  - Tempo estimado e real por passo
  - Observações em cada etapa

#### 👥 Grupos Técnicos
- **Tabelas**: `grupos_tecnicos`, `grupo_tecnico_usuarios`
- **Modelos**: GrupoTecnico.js (GrupoTecnico, GrupoTecnicoUsuario)
- **Funcionalidades**:
  - Organização de técnicos em grupos/times
  - Coordenadores de grupo
  - Vinculação com áreas de atendimento
  - Email do grupo para notificações

#### 🏢 Multi-Entidade (Multi-Tenant)
- **Tabelas**: `entidades`
- **Modelos**: Entidade.js
- **Funcionalidades**:
  - Suporte a múltiplas empresas/entidades
  - Relacionamento matriz/filial
  - Isolamento de dados por entidade
  - Associação de usuários, clientes, chamados e ativos à entidade

#### 🏭 Fabricantes e Fornecedores
- **Tabelas**: `fabricantes`, `fornecedores`
- **Modelos**: Fabricante.js (Fabricante, Fornecedor)
- **Funcionalidades**:
  - Cadastro completo de fabricantes
  - Cadastro de fornecedores com CNPJ
  - Informações de contato e endereço

#### 📝 Termo de Responsabilidade
- **Tabelas**: `termos_responsabilidade`
- **Modelos**: Fabricante.js (TermoResponsabilidade)
- **Funcionalidades**:
  - Termos de responsabilidade para ativos
  - Assinatura digital
  - Rastreamento de IP de assinatura
  - Períodos de vigência

#### 🔧 Campos Customizados (Valores)
- **Tabelas**: `valores_customizados`
- **Modelos**: ValorCustomizado.js
- **Funcionalidades**:
  - Armazenamento de valores de campos customizados
  - Suporte a múltiplas entidades (chamados, ativos, clientes)

### 🗄️ Banco de Dados
- **Total de Tabelas**: 50+ (anteriormente 42)
- **Novas Tabelas**: 10+
- **Features**:
  - UUID como chave primária em todas as tabelas
  - Soft delete (deleted_at) onde aplicável
  - Campos de auditoria (created_at, updated_at)
  - Índices otimizados
  - Relacionamentos complexos (1:N, N:N, auto-relacionamento)
  - Suporte a JSONB para flexibilidade
  - Arrays para tags e palavras-chave
  - ENUMs para status e tipos

### 🔌 Backend (APIs)
- **Novos Módulos**:
  - `/conhecimento/*` - 15 endpoints para base de conhecimento
  - Anexos integrados em `/ocorrencias/:id/anexos`
  
- **Novos Middlewares**:
  - `upload.js` - Upload de arquivos com multer
  - Validação de tipos de arquivo
  - Limite de tamanho configurável

- **Modelos Sequelize**: 15 novos modelos
- **Relacionamentos**: 30+ novos relacionamentos definidos

### 📋 Endpoints Adicionados

#### Base de Conhecimento
```
GET    /conhecimento/categorias              - Listar categorias
POST   /conhecimento/categorias              - Criar categoria
PUT    /conhecimento/categorias/:id          - Atualizar categoria
DELETE /conhecimento/categorias/:id          - Deletar categoria

GET    /conhecimento/artigos                 - Listar artigos (com paginação)
GET    /conhecimento/artigos/buscar          - Buscar artigos
GET    /conhecimento/artigos/:id             - Obter artigo completo
POST   /conhecimento/artigos                 - Criar artigo
PUT    /conhecimento/artigos/:id             - Atualizar artigo
DELETE /conhecimento/artigos/:id             - Deletar artigo
POST   /conhecimento/artigos/:id/votar       - Votar utilidade

POST   /conhecimento/artigos/:id/comentarios - Adicionar comentário
PUT    /conhecimento/comentarios/:id/aprovar - Aprovar comentário
GET    /conhecimento/comentarios/pendentes   - Listar pendentes
```

#### Anexos
```
GET    /ocorrencias/:id/anexos               - Listar anexos do chamado
POST   /ocorrencias/:id/anexos               - Upload de anexo
GET    /ocorrencias/anexos/:id/download      - Download de anexo
DELETE /ocorrencias/anexos/:id               - Deletar anexo
```

### 🛠️ Melhorias Técnicas
- ✅ Separação de responsabilidades (controllers específicos)
- ✅ Validação de tipos MIME em uploads
- ✅ Soft delete em entidades principais
- ✅ Paginação em listagens
- ✅ Busca full-text em artigos
- ✅ Contadores automáticos (visualizações, votos)
- ✅ Sistema de aprovação de comentários
- ✅ Relacionamentos otimizados no Sequelize

### 📦 Dependências
- **multer** 1.4.5 - Upload de arquivos (já incluído)
- Todas as dependências já estavam no package.json

### 🔄 Próximos Passos Recomendados
1. **Frontend**: Criar páginas React para base de conhecimento
2. **Frontend**: Componente de upload de anexos
3. **Frontend**: Gerenciamento de tags visuais
4. **Backend**: Implementar notificações por email
5. **Backend**: Sistema de busca avançada
6. **Testes**: Criar testes unitários para novos módulos
7. **Documentação**: Atualizar Swagger/OpenAPI
8. **Deploy**: Configurar uploads em produção (S3, etc)

### 📊 Estatísticas da Expansão
- **Tabelas Adicionadas**: 10+
- **Modelos Sequelize**: 15 novos
- **Controllers**: 2 novos (conhecimento, anexos)
- **Rotas/Endpoints**: 20+ novos
- **Relacionamentos**: 30+ novos
- **Middlewares**: 1 novo (upload)
- **Linhas de Código**: ~1500+ novas linhas

---

## [1.0.0] - Versão Inicial

### Base do Sistema
- ✅ Autenticação JWT
- ✅ Gestão de Chamados completa
- ✅ Inventário de Ativos
- ✅ Gestão de Clientes
- ✅ Sistema de Permissões (RBAC)
- ✅ Dashboard com estatísticas
- ✅ Histórico e auditoria
- ✅ 42 tabelas no banco
- ✅ 30+ modelos Sequelize
- ✅ Frontend React com Material-UI
- ✅ 7 módulos principais
