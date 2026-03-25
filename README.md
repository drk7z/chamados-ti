# 🎫 Sistema de Gestão de Chamados e Inventário (ITSM + ITAM)

Sistema completo de **IT Service Management (ITSM)** e **IT Asset Management (ITAM)** inspirado em GLPI, desenvolvido com tecnologias modernas para gestão eficiente de chamados técnicos, inventário de ativos e base de conhecimento.

![Version](https://img.shields.io/badge/version-1.4.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)

**Linguagens:**
![JavaScript](https://img.shields.io/badge/javascript-ES2022-F7DF1E?logo=javascript&logoColor=black)
![SQL](https://img.shields.io/badge/sql-postgresql-336791?logo=postgresql&logoColor=white)

**Frameworks:**
![React](https://img.shields.io/badge/react-18.2-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/express-4.18-000000?logo=express&logoColor=white)

**Plataforma:**
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-14%2B-336791?logo=postgresql&logoColor=white)

---

## 📋 Índice

- [Características](#-características)
- [Módulos do Sistema](#-módulos-do-sistema)
- [Linguagens do Projeto](#-linguagens-do-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Documentação](#-documentação)
- [Changelog](#-changelog)

---

## ✨ Características

### 🎯 Principais Funcionalidades

- ✅ **Gestão Completa de Chamados** (Tickets ITSM)
  - Criação, atribuição, transferência e resolução
  - Sistema de SLA com alertas automáticos
  - Histórico completo de todas as ações
  - Comentários e atualizações em tempo real
  - **Tags personalizadas** com cores
  - **Anexos de arquivos** (imagens, PDFs, documentos)
  - **Roteiros de atendimento** passo a passo
  - **Soluções padrão** com busca por palavras-chave

- 📦 **Inventário de Ativos** (ITAM)
  - Cadastro completo de hardware e software
  - Controle de localização e movimentação
  - Histórico de movimentações
  - Gestão de licenças de software
  - **Termos de responsabilidade** com assinatura digital
  - Vinculação de ativos a chamados
  - **Fabricantes e fornecedores**
  - Garantias e contratos

- 💡 **Base de Conhecimento**
  - Artigos técnicos com editor rico
  - Categorias hierárquicas
  - Sistema de busca avançada
  - Palavras-chave e tags
  - Comentários com aprovação
  - Votação de utilidade (útil/não útil)
  - Contador de visualizações
  - Artigos em destaque

- 👥 **Gestão de Clientes**
  - Cadastro de clientes (pessoas e empresas)
  - Estrutura organizacional (Unidades → Departamentos → Centros de Custo)
  - Multi-entidade (suporte a múltiplas empresas)
  - Contatos e responsáveis

- 🔐 **Segurança e Controle**
  - Autenticação JWT com refresh token
  - Sistema de permissões baseado em papéis (RBAC)
  - Grupos técnicos com coordenadores
  - Auditoria completa de ações
  - Logs detalhados de sistema
  - Multi-tenant (isolamento por entidade)

- 📊 **Gestão Administrativa**
  - Dashboard com estatísticas em tempo real
  - Áreas de atendimento
  - Perfis de jornada de trabalho
  - Feriados e calendários
  - Campos customizados
  - Configurações globais

- 🔌 **API Externa**
  - Integração via Token API
  - Webhook para eventos
  - Criação automática de chamados
  - Consulta de status

---

## 📦 Módulos do Sistema

### 1. 🏠 **Home / Dashboard**
- Estatísticas de chamados
- SLA em risco
- Ativos críticos
- Atividades recentes

### 2. 🎫 **Ocorrências (Chamados)**
- CRUD completo de chamados
- Tipos, status e prioridades
- SLA dinâmico
- Fluxo de aprovação
- Tags e categorização
- Anexos e documentos
- Roteiros de atendimento
- Soluções padrão

### 3. 💻 **Inventário**
- Ativos (hardware e software)
- Tipos, modelos e categorias
- Localização e movimentação
- Licenças de software
- Fabricantes e fornecedores
- Termos de responsabilidade

### 4. 👤 **Clientes**
- Cadastro de clientes
- Unidades e departamentos
- Centros de custo
- Contatos e responsáveis
- Estrutura hierárquica

### 5. 💡 **Base de Conhecimento** *(NOVO)*
- Categorias e subcategorias
- Artigos técnicos
- Busca e filtros
- Comentários
- Sistema de votação

### 6. ⚙️ **Administrativo**
- Usuários e permissões
- Grupos técnicos
- Áreas de atendimento
- Configurações gerais
- Campos customizados
- Entidades (multi-tenant)
- Logs do sistema

### 7. 🔌 **API Externa**
- Tokens de acesso
- Webhooks
- Integração com terceiros

---

## 🧩 Linguagens do Projeto

- **JavaScript**: backend (Node.js/Express) e frontend (React)
- **SQL (PostgreSQL)**: schema, tabelas, índices, views e triggers
- **Batch (.bat)**: script de inicialização em ambiente Windows (`start.bat`)
- **Markdown**: documentação técnica e de produto em `README.md`, `docs/` e `CHANGELOG.md`

### Frameworks e bibliotecas principais

- **Frontend**: React, Material UI (MUI), React Router, Axios, Zustand, React Query
- **Backend**: Node.js, Express, Sequelize, JWT, Bcrypt, Multer, Winston, Nodemailer

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** 18+ - Runtime JavaScript
- **Express** 4.18 - Framework web
- **PostgreSQL** 14+ - Banco de dados relacional
- **Sequelize** 6.35 - ORM para Node.js
- **JWT** - Autenticação via tokens
- **Bcrypt** - Hash de senhas
- **Multer** - Upload de arquivos
- **Winston** - Sistema de logs
- **Nodemailer** - Envio de emails

### Frontend
- **React** 18.2 - Biblioteca UI
- **Material-UI (MUI)** 5.15 - Componentes visuais
- **React Router** 6.20 - Roteamento
- **Axios** - Cliente HTTP
- **Zustand** - Gerenciamento de estado
- **React Query** - Cache e sincronização de dados
- **React Hook Form** - Formulários

### Infraestrutura
- **Docker** - Containerização (opcional)
- **Nginx** - Servidor web/proxy reverso
- **PM2** - Gerenciador de processos Node.js

---

## 🏗️ Arquitetura

```
chamados-ti/
├── backend/                    # API Node.js
│   ├── src/
│   │   ├── config/            # Configurações (DB, JWT, etc)
│   │   ├── database/          # Migrations e seeds
│   │   ├── middlewares/       # Autenticação, validação, upload
│   │   ├── models/            # Modelos Sequelize (50+ tabelas)
│   │   ├── modules/           # Módulos da aplicação
│   │   │   ├── auth/         # Autenticação
│   │   │   ├── home/         # Dashboard
│   │   │   ├── ocorrencias/  # Chamados + Anexos
│   │   │   ├── inventario/   # Ativos
│   │   │   ├── clientes/     # Clientes
│   │   │   ├── conhecimento/ # Base de conhecimento ✨
│   │   │   ├── admin/        # Administrativo
│   │   │   └── api/          # API Externa
│   │   ├── routes/           # Rotas da API
│   │   ├── utils/            # Utilitários
│   │   └── server.js         # Entry point
│   ├── uploads/              # Arquivos enviados
│   └── package.json
│
├── frontend/                  # Aplicação React
│   ├── public/
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── layouts/          # Layouts (Main, Auth)
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── services/         # Serviços/API
│   │   ├── store/            # Zustand stores
│   │   ├── utils/            # Utilitários
│   │   └── App.js
│   └── package.json
│
├── database/
│   └── schema.sql            # Schema completo PostgreSQL
│
├── docs/                      # Documentação
│   ├── API.md
│   ├── INSTALLATION.md
│   └── database-diagram.md
│
├── CHANGELOG.md              # Histórico de versões
├── README.md                 # Este arquivo
└── .env.example              # Exemplo de variáveis de ambiente
```

### Banco de Dados

**50+ Tabelas Organizadas**:
- **Autenticação**: users, roles, permissions, user_roles, role_permissions
- **Chamados**: chamados, chamado_tipos, chamado_status, chamado_prioridades, chamado_historico, chamado_comentarios, chamado_tags ✨, chamado_anexos ✨
- **Inventário**: ativos, ativo_tipos, ativo_modelos, ativo_categorias, ativo_status, ativo_historico_localizacao
- **Software**: software, licencas, tipo_licencas, software_categorias
- **Clientes**: clientes, cliente_tipos, cliente_status, unidades, departamentos, centros_custo
- **Conhecimento** ✨: conhecimento_categorias, conhecimento_artigos, conhecimento_comentarios
- **Soluções** ✨: solucoes_padrao, roteiros_atendimento, roteiro_passos, roteiro_execucao
- **Admin**: areas_atendimento, perfis_jornada, feriados, campos_customizados, valores_customizados ✨, log_sistema
- **Fornecedores** ✨: fabricantes, fornecedores
- **Grupos** ✨: grupos_tecnicos, grupo_tecnico_usuarios
- **Multi-tenant** ✨: entidades, termos_responsabilidade
- **Tags** ✨: tags
- **SLA**: slas
- **API**: api_tokens

---

## 📋 Pré-requisitos

- **Node.js** 18.x ou superior
- **PostgreSQL** 14 ou superior
- **npm** ou **yarn**
- **Git** (para clone do repositório)

---

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/chamados-ti.git
cd chamados-ti
```

### 2. Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Configure as variáveis de ambiente:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chamados_ti
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_aqui
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Upload
UPLOAD_MAX_SIZE=10485760  # 10MB em bytes
UPLOAD_DIR=./uploads

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@seudominio.com
```

### 3. Banco de Dados

Crie o banco de dados PostgreSQL:

```bash
psql -U postgres
CREATE DATABASE chamados_ti;
\c chamados_ti
```


Execute o schema:

```bash
psql -U postgres -d chamados_ti -f database/schema.sql
```

Ou use as migrations (se configurado):

```bash
npm run migrate
npm run seed  # Dados iniciais (opcional)
```

### 4. Frontend

```bash
cd ../frontend
npm install
```

Crie o arquivo `.env`:

```bash
cp .env.example .env
```

```env
REACT_APP_API_URL=http://localhost:3001/api
```

---

## 🔒 Primeiro Acesso & Segurança

### ⚠️ Importante: Credenciais Padrão

**Credenciais padrão estão em `backend/.env.example`** — este arquivo **É versionado** no git para referência apenas.

Seu arquivo `.env` local **NÃO é versionado** (veja `.gitignore`) e deve conter suas credenciais reais.

**Nunca commite `.env` ou qualquer arquivo com senhas no repositório.**

### Primeiro Login

1. Execute o backend com seed para criar o usuário padrão:
   ```bash
   cd backend
   npm run seed
   ```

2. Acesse http://localhost:3000 e faça login com as credenciais do `backend/.env`

3. **Em Produção**: Altere TODAS as senhas antes de deploy:
   - Usuário admin da aplicação (edite `.env` e rode seed novamente)
   - Senha do PostgreSQL (execute `ALTER USER postgres WITH PASSWORD '...'`)
   - JWT_SECRET (gere uma chave forte)

---

## ▶️ Uso

### Iniciar Backend

```bash
cd backend
npm run dev  # Modo desenvolvimento com nodemon
# ou
npm start    # Modo produção
```

Servidor rodando em: `http://localhost:3001`

### Iniciar Frontend

```bash
cd frontend
npm start
```

Aplicação disponível em: `http://localhost:3000`

### Acesso administrativo inicial

- Configure `DEFAULT_ADMIN_EMAIL` e `DEFAULT_ADMIN_PASSWORD` no `backend/.env` antes de executar o seed.
- O sistema não deve usar credenciais padrão previsíveis como `admin/admin`.
- Use uma senha forte com no mínimo 12 caracteres.

---

## 📚 Documentação

### Documentação Completa

Veja a pasta `/docs` para documentação detalhada:

- **[API.md](docs/API.md)** - Documentação completa da API REST
- **[INSTALLATION.md](docs/INSTALLATION.md)** - Guia de instalação detalhado
- **[database-diagram.md](docs/database-diagram.md)** - Diagrama ER do banco
- **[ROADMAP-IMPLEMENTACAO.md](docs/ROADMAP-IMPLEMENTACAO.md)** - Plano de evolução por fases/sprints
- **[VERSIONAMENTO.md](docs/VERSIONAMENTO.md)** - Política de versionamento, commits, PRs e releases
- **[SPRINT-02-ENCERRAMENTO.md](docs/SPRINT-02-ENCERRAMENTO.md)** - Resumo técnico de fechamento da Sprint 2
- **[BACKLOG-SPRINT-03.md](docs/BACKLOG-SPRINT-03.md)** - Backlog executável da Sprint 3
- **[SECURITY-DEVOPS-BASELINE.md](docs/SECURITY-DEVOPS-BASELINE.md)** - Status atual de segurança e DevOps
- **[SAAS-SECURITY-DEVOPS-COMPLETE-KIT.md](docs/SAAS-SECURITY-DEVOPS-COMPLETE-KIT.md)** - Kit completo de referência para novos projetos
- **[GITHUB-SECRETS-ENVIRONMENTS.md](docs/GITHUB-SECRETS-ENVIRONMENTS.md)** - Guia de configuração de Repository/Environment secrets

### Principais Endpoints

#### Autenticação
```
POST   /api/auth/login           # Login
POST   /api/auth/refresh         # Refresh token
POST   /api/auth/logout          # Logout
```

#### Chamados
```
GET    /api/ocorrencias          # Listar chamados
POST   /api/ocorrencias          # Criar chamado
GET    /api/ocorrencias/:id      # Detalhes do chamado
PUT    /api/ocorrencias/:id      # Atualizar chamado
POST   /api/ocorrencias/:id/atribuir    # Atribuir técnico
POST   /api/ocorrencias/:id/resolver    # Resolver chamado
POST   /api/ocorrencias/:id/anexos      # Upload de anexo ✨
```

#### Base de Conhecimento ✨
```
GET    /api/conhecimento/artigos         # Listar artigos
GET    /api/conhecimento/artigos/buscar  # Buscar artigos
POST   /api/conhecimento/artigos         # Criar artigo
POST   /api/conhecimento/artigos/:id/votar  # Votar utilidade
```

#### Inventário
```
GET    /api/inventario/ativos    # Listar ativos
POST   /api/inventario/ativos    # Criar ativo
POST   /api/inventario/ativos/:id/movimentar  # Movimentar ativo
```

---

## 🔄 Changelog

Veja o [CHANGELOG.md](CHANGELOG.md) para histórico completo de versões e mudanças.

### Versão Atual: 1.1.0

**Novidades** ✨:
- Base de Conhecimento completa
- Sistema de Tags
- Anexos de arquivos
- Soluções padrão e roteiros
- Grupos técnicos
- Multi-entidade (multi-tenant)
- Termos de responsabilidade
- Fabricantes e fornecedores

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença ISC. Veja o arquivo LICENSE para mais detalhes.

---

## 👥 Autores

- **Equipe de Desenvolvimento** - Versão inicial e expansão

---

## 🙏 Agradecimentos

- Inspirado no [GLPI](https://glpi-project.org/)
- Comunidade Node.js e React
- Contribuidores open-source

---

## 📞 Suporte

Para reportar bugs ou solicitar features:
- Abra uma [Issue](https://github.com/seu-usuario/chamados-ti/issues)
- Entre em contato: suporte@seudominio.com

---

**⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!**
