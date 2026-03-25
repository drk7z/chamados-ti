-- =============================================
-- Sistema de Gestão de Chamados e Inventário
-- Script de Criação do Banco de Dados
-- PostgreSQL 14+
-- =============================================

-- Criar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELAS DE AUTENTICAÇÃO E PERMISSÕES
-- =============================================

-- Usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    avatar VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_acesso TIMESTAMP,
    tentativas_login INTEGER DEFAULT 0,
    bloqueado_ate TIMESTAMP,
    token_reset_senha VARCHAR(500),
    token_reset_expira TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Perfis/Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    nivel INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 5),
    ativo BOOLEAN DEFAULT TRUE,
    criado_por UUID,
    atualizado_por UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Permissões
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modulo VARCHAR(50) NOT NULL,
    recurso VARCHAR(100) NOT NULL,
    acao VARCHAR(20) NOT NULL,
    descricao VARCHAR(255),
    UNIQUE(modulo, recurso, acao)
);

-- Usuário <-> Role (muitos para muitos)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role <-> Permission (muitos para muitos)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE
);

-- =============================================
-- TABELAS DE CLIENTES E ESTRUTURA
-- =============================================

-- Tipos de Cliente
CREATE TABLE cliente_tipos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Status de Cliente
CREATE TABLE cliente_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    cor VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    tipo_id UUID REFERENCES cliente_tipos(id),
    status_id UUID REFERENCES cliente_status(id),
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_por UUID,
    atualizado_por UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Unidades
CREATE TABLE unidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    telefone VARCHAR(20),
    responsavel_id UUID REFERENCES users(id),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Departamentos
CREATE TABLE departamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    responsavel_id UUID REFERENCES users(id),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Centros de Custo
CREATE TABLE centros_custo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    departamento_id UUID NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- =============================================
-- TABELAS DE CHAMADOS
-- =============================================

-- Áreas de Atendimento
CREATE TABLE areas_atendimento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    email VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Perfis de Jornada
CREATE TABLE perfis_jornada (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    horarios JSONB DEFAULT '{"segunda": {"inicio": "08:00", "fim": "18:00"}, "terca": {"inicio": "08:00", "fim": "18:00"}, "quarta": {"inicio": "08:00", "fim": "18:00"}, "quinta": {"inicio": "08:00", "fim": "18:00"}, "sexta": {"inicio": "08:00", "fim": "18:00"}, "sabado": null, "domingo": null}',
    fuso_horario VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- SLAs
CREATE TABLE slas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tempo_primeira_resposta INTEGER NOT NULL,
    tempo_resolucao INTEGER NOT NULL,
    horario_comercial BOOLEAN DEFAULT TRUE,
    considera_feriados BOOLEAN DEFAULT TRUE,
    perfil_jornada_id UUID REFERENCES perfis_jornada(id),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tipos de Chamado
CREATE TABLE chamado_tipos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    icone VARCHAR(50),
    cor VARCHAR(20),
    sla_padrao_id UUID REFERENCES slas(id),
    area_padrao_id UUID REFERENCES areas_atendimento(id),
    requer_aprovacao BOOLEAN DEFAULT FALSE,
    campos_obrigatorios JSONB DEFAULT '[]',
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Status de Chamado
CREATE TABLE chamado_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('aberto', 'em_andamento', 'aguardando', 'resolvido', 'fechado', 'cancelado')),
    cor VARCHAR(20),
    icone VARCHAR(50),
    pausa_sla BOOLEAN DEFAULT FALSE,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    status_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Prioridades de Chamado
CREATE TABLE chamado_prioridades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    nivel INTEGER NOT NULL,
    cor VARCHAR(20),
    icone VARCHAR(50),
    tempo_resposta_horas INTEGER,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Chamados
CREATE TABLE chamados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero SERIAL UNIQUE,
    titulo VARCHAR(500) NOT NULL,
    descricao TEXT NOT NULL,
    tipo_id UUID NOT NULL REFERENCES chamado_tipos(id),
    status_id UUID NOT NULL REFERENCES chamado_status(id),
    prioridade_id UUID NOT NULL REFERENCES chamado_prioridades(id),
    sla_id UUID REFERENCES slas(id),
    area_id UUID REFERENCES areas_atendimento(id),
    solicitante_id UUID NOT NULL REFERENCES users(id),
    tecnico_responsavel_id UUID REFERENCES users(id),
    cliente_id UUID REFERENCES clientes(id),
    unidade_id UUID REFERENCES unidades(id),
    departamento_id UUID REFERENCES departamentos(id),
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atribuicao TIMESTAMP,
    data_primeira_resposta TIMESTAMP,
    data_resolucao TIMESTAMP,
    data_fechamento TIMESTAMP,
    prazo_sla TIMESTAMP,
    tempo_pausado INTEGER DEFAULT 0,
    sla_vencido BOOLEAN DEFAULT FALSE,
    pausado BOOLEAN DEFAULT FALSE,
    motivo_pausa TEXT,
    solucao TEXT,
    origem VARCHAR(20) DEFAULT 'web' CHECK (origem IN ('web', 'email', 'telefone', 'api', 'chat')),
    avaliacao INTEGER CHECK (avaliacao BETWEEN 1 AND 5),
    comentario_avaliacao TEXT,
    campos_customizados JSONB DEFAULT '{}',
    criado_por UUID,
    atualizado_por UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Histórico de Chamados
CREATE TABLE chamado_historico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES users(id),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('criacao', 'atribuicao', 'mudanca_status', 'mudanca_prioridade', 'comentario', 'anexo', 'transferencia', 'escalonamento', 'resolucao', 'fechamento', 'reabertura', 'pausa', 'retomada')),
    descricao TEXT NOT NULL,
    valor_anterior JSONB,
    valor_novo JSONB,
    visivel_solicitante BOOLEAN DEFAULT TRUE,
    tempo_decorrido INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comentários de Chamados
CREATE TABLE chamado_comentarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES users(id),
    comentario TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'publico' CHECK (tipo IN ('publico', 'interno')),
    editado BOOLEAN DEFAULT FALSE,
    data_edicao TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    cor VARCHAR(20),
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Chamado <-> Tags (muitos para muitos)
CREATE TABLE chamado_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anexos de Chamados
CREATE TABLE chamado_anexos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES users(id),
    nome_arquivo VARCHAR(255) NOT NULL,
    caminho_arquivo VARCHAR(500) NOT NULL,
    tamanho_bytes BIGINT,
    tipo_mime VARCHAR(100),
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Soluções Padrão
CREATE TABLE solucoes_padrao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    solucao TEXT NOT NULL,
    tipo_id UUID REFERENCES chamado_tipos(id),
    categoria VARCHAR(100),
    palavras_chave TEXT[],
    visualizacoes INTEGER DEFAULT 0,
    util INTEGER DEFAULT 0,
    nao_util INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    criado_por UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Roteiros de Atendimento
CREATE TABLE roteiros_atendimento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo_id UUID REFERENCES chamado_tipos(id),
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Passos dos Roteiros
CREATE TABLE roteiro_passos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roteiro_id UUID NOT NULL REFERENCES roteiros_atendimento(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    obrigatorio BOOLEAN DEFAULT FALSE,
    tempo_estimado_minutos INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Execução de Roteiros (histórico)
CREATE TABLE roteiro_execucao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    roteiro_id UUID NOT NULL REFERENCES roteiros_atendimento(id),
    passo_id UUID NOT NULL REFERENCES roteiro_passos(id),
    usuario_id UUID NOT NULL REFERENCES users(id),
    concluido BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    tempo_gasto_minutos INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELAS DE INVENTÁRIO
-- =============================================

-- Tipos de Ativo
CREATE TABLE ativo_tipos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    icone VARCHAR(50),
    campos_obrigatorios JSONB DEFAULT '[]',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Modelos de Ativo
CREATE TABLE ativo_modelos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    fabricante VARCHAR(100),
    tipo_id UUID NOT NULL REFERENCES ativo_tipos(id),
    especificacoes JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Categorias de Ativo
CREATE TABLE ativo_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    pai_id UUID REFERENCES ativo_categorias(id),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Status de Ativo
CREATE TABLE ativo_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    cor VARCHAR(20),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('disponivel', 'em_uso', 'manutencao', 'estoque', 'baixado', 'emprestado')),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Ativos
CREATE TABLE ativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo_id UUID NOT NULL REFERENCES ativo_tipos(id),
    modelo_id UUID REFERENCES ativo_modelos(id),
    categoria_id UUID REFERENCES ativo_categorias(id),
    status_id UUID NOT NULL REFERENCES ativo_status(id),
    numero_serie VARCHAR(255) UNIQUE,
    numero_patrimonio VARCHAR(100) UNIQUE,
    localizacao_atual_id UUID REFERENCES unidades(id),
    localizacao_anterior_id UUID REFERENCES unidades(id),
    responsavel_id UUID REFERENCES users(id),
    cliente_id UUID REFERENCES clientes(id),
    departamento_id UUID REFERENCES departamentos(id),
    data_aquisicao DATE,
    data_garantia_inicio DATE,
    data_garantia_fim DATE,
    garantia_ativa BOOLEAN DEFAULT FALSE,
    valor_aquisicao DECIMAL(15,2),
    fornecedor VARCHAR(255),
    nota_fiscal VARCHAR(100),
    termo_responsabilidade BOOLEAN DEFAULT FALSE,
    termo_aceito_em TIMESTAMP,
    observacoes TEXT,
    caracteristicas JSONB DEFAULT '{}',
    campos_customizados JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    descontinuado BOOLEAN DEFAULT FALSE,
    criado_por UUID,
    atualizado_por UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Histórico de Localização de Ativos
CREATE TABLE ativo_historico_localizacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ativo_id UUID NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
    localizacao_anterior_id UUID REFERENCES unidades(id),
    localizacao_nova_id UUID NOT NULL REFERENCES unidades(id),
    responsavel_anterior_id UUID REFERENCES users(id),
    responsavel_novo_id UUID REFERENCES users(id),
    motivo TEXT,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    realizado_por_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fabricantes
CREATE TABLE fabricantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL UNIQUE,
    site VARCHAR(500),
    contato VARCHAR(255),
    telefone VARCHAR(20),
    email VARCHAR(255),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Fornecedores
CREATE TABLE fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    contato VARCHAR(255),
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Termos de Responsabilidade
CREATE TABLE termos_responsabilidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ativo_id UUID NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES users(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    termo_texto TEXT NOT NULL,
    assinatura_digital VARCHAR(500),
    ip_assinatura VARCHAR(45),
    data_assinatura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELAS DE SOFTWARE E LICENÇAS
-- =============================================

-- Categorias de Software
CREATE TABLE software_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tipos de Licença
CREATE TABLE tipo_licencas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Softwares
CREATE TABLE softwares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    fabricante VARCHAR(255),
    versao VARCHAR(100),
    categoria_id UUID REFERENCES software_categorias(id),
    tipo_licenca_id UUID REFERENCES tipo_licencas(id),
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
); tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('texto', 'numero', 'data', 'select', 'checkbox', 'textarea', 'arquivo')),
    opcoes JSONB,
    obrigatorio BOOLEAN DEFAULT FALSE,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Valores dos Campos Customizados
CREATE TABLE valores_customizados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campo_id UUID NOT NULL REFERENCES campos_customizados(id) ON DELETE CASCADE,
    entidade_tipo VARCHAR(50) NOT NULL,
    entidade_id UUID NOT NULL,
    valor TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Base de Conhecimento - Categorias
CREATE TABLE conhecimento_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    pai_id UUID REFERENCES conhecimento_categorias(id),
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Base de Conhecimento - Artigos
CREATE TABLE conhecimento_artigos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(500) NOT NULL,
    conteudo TEXT NOT NULL,
    resumo TEXT,
    categoria_id UUID REFERENCES conhecimento_categorias(id),
    autor_id UUID NOT NULL REFERENCES users(id),
    palavras_chave TEXT[],
    tags TEXT[],
    publico BOOLEAN DEFAULT FALSE,
    destaque BOOLEAN DEFAULT FALSE,
    visualizacoes INTEGER DEFAULT 0,
    util INTEGER DEFAULT 0,
    nao_util INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
    publicado_em TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Comentários dos Artigos
CREATE TABLE conhecimento_comentarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artigo_id UUID NOT NULL REFERENCES conhecimento_artigos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES users(id),
    comentario TEXT NOT NULL,
    aprovado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grupos Técnicos
CREATE TABLE grupos_tecnicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL UNIQUE,
    descricao TEXT,
    area_id UUID REFERENCES areas_atendimento(id),
    responsavel_id UUID REFERENCES users(id),
    email VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Usuários <-> Grupos Técnicos
CREATE TABLE grupo_tecnico_usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos_tecnicos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coordenador BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entidades (Multi-empresa/Multi-entidade)
CREATE TABLE entidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    matriz_id UUID REFERENCES entidades(id),
    endereco TEXT,
    telefone VARCHAR(20),
    email VARCHAR(255),
    logo VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Relacionar entidades com outras tabelas
ALTER TABLE users ADD COLUMN IF NOT EXISTS entidade_id UUID REFERENCES entidades(id);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS entidade_id UUID REFERENCES entidades(id);
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS entidade_id UUID REFERENCES entidades(id);
ALTER TABLE ativos ADD COLUMN IF NOT EXISTS entidade_id UUID REFERENCES entidades(id);

-- Licenças de Software
CREATE TABLE IF NOT EXISTS licencas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    software_id UUID NOT NULL REFERENCES softwares(id),
    chave_licenca VARCHAR(500),
    tipo_licenca_id UUID NOT NULL REFERENCES tipo_licencas(id),
    quantidade_licencas INTEGER DEFAULT 1,
    em_uso INTEGER DEFAULT 0,
    data_aquisicao DATE,
    data_expiracao DATE,
    valor DECIMAL(15,2),
    fornecedor VARCHAR(255),
    nota_fiscal VARCHAR(100),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Atribuições de Licenças
CREATE TABLE IF NOT EXISTS licencas_atribuicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    licenca_id UUID NOT NULL REFERENCES licencas(id),
    usuario_id UUID REFERENCES users(id),
    ativo_id UUID REFERENCES ativos(id),
    data_atribuicao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_revogacao DATE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Instalações de Software em Ativos
CREATE TABLE IF NOT EXISTS instalacoes_software (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    software_id UUID NOT NULL REFERENCES softwares(id),
    ativo_id UUID NOT NULL REFERENCES ativos(id),
    versao_instalada VARCHAR(50),
    data_instalacao DATE,
    chave_produto VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Garantias de Ativos
CREATE TABLE IF NOT EXISTS ativo_garantias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ativo_id UUID NOT NULL REFERENCES ativos(id),
    fornecedor_id UUID REFERENCES fornecedores(id),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    tipo_garantia TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- TABELAS DE ADMINISTRAÇÃO
-- =============================================

-- Feriados
CREATE TABLE feriados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    tipo VARCHAR(20) DEFAULT 'nacional' CHECK (tipo IN ('nacional', 'estadual', 'municipal')),
    recorrente BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Campos Customizados
CREATE TABLE campos_customizados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modulo VARCHAR(50) NOT NULL,
    entidade_id UUID,
    nome VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
   tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('texto', 'numero', 'data', 'select', 'checkbox', 'textarea', 'arquivo')),
    opcoes JSONB,
    obrigatorio BOOLEAN DEFAULT FALSE,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Logs do Sistema
CREATE TABLE logs_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES users(id),
    modulo VARCHAR(50) NOT NULL,
    acao VARCHAR(50) NOT NULL,
    entidade VARCHAR(100),
    entidade_id UUID,
    descricao TEXT NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    dados_antes JSONB,
    dados_depois JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_chamados_numero ON chamados(numero);
CREATE INDEX idx_chamados_status ON chamados(status_id);
CREATE INDEX idx_chamados_solicitante ON chamados(solicitante_id);
CREATE INDEX idx_chamados_tecnico ON chamados(tecnico_responsavel_id);
CREATE INDEX idx_chamados_data_abertura ON chamados(data_abertura);
CREATE INDEX idx_chamados_prazo_sla ON chamados(prazo_sla);

CREATE INDEX idx_ativos_codigo ON ativos(codigo);
CREATE INDEX idx_ativos_numero_serie ON ativos(numero_serie);
CREATE INDEX idx_ativos_responsavel ON ativos(responsavel_id);
CREATE INDEX idx_ativos_status ON ativos(status_id);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_logs_usuario ON logs_sistema(usuario_id);
CREATE INDEX idx_logs_criado_em ON logs_sistema(created_at);

-- =============================================
-- TABELAS ADICIONAIS DO SISTEMA
-- =============================================

-- Sessões de usuário
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    refresh_token VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs de acesso
CREATE TABLE logs_acesso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    acao VARCHAR(100) NOT NULL, -- login, logout, tentativa_falha
    sucesso BOOLEAN DEFAULT TRUE,
    detalhes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configurações da empresa
CREATE TABLE empresas_configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entidade_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
    chave VARCHAR(100) NOT NULL,
    valor TEXT,
    tipo VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    descricao TEXT,
    categoria VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entidade_id, chave)
);

-- Relacionamentos entre chamados
CREATE TABLE chamados_relacionados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_origem_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    chamado_destino_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    tipo_relacao VARCHAR(50) NOT NULL, -- pai, filho, duplicado, relacionado, bloqueado_por
    descricao TEXT,
    criado_por UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chamado_origem_id, chamado_destino_id, tipo_relacao)
);

-- Vínculos de chamados com ativos
CREATE TABLE chamados_vinculos_ativo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    ativo_id UUID NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
    tipo_vinculo VARCHAR(50) DEFAULT 'afetado', -- afetado, relacionado, causa
    descricao TEXT,
    criado_por UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chamado_id, ativo_id)
);

-- Templates de checklist para tipos de chamado
CREATE TABLE chamados_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_id UUID NOT NULL REFERENCES chamado_tipos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    ordem INTEGER DEFAULT 0,
    obrigatorio BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Execução de checklist em chamados
CREATE TABLE chamado_checklist_execucao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES chamados_checklist(id) ON DELETE CASCADE,
    concluido BOOLEAN DEFAULT FALSE,
    usuario_id UUID REFERENCES users(id),
    observacoes TEXT,
    concluido_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Regras de distribuição automática de chamados
CREATE TABLE distribuicao_automatica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    prioridade INTEGER DEFAULT 0,
    
    -- Condições (JSONB para flexibilidade)
    condicoes JSONB NOT NULL, -- {tipo_id: [], area_id: [], prioridade_id: [], palavras_chave: []}
    
    -- Ação
    acao_tipo VARCHAR(50) NOT NULL, -- atribuir_usuario, atribuir_grupo, definir_area
    acao_valor JSONB NOT NULL, -- {usuario_id: '', grupo_id: '', area_id: ''}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Filas de chamados
CREATE TABLE filas_chamados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    area_id UUID REFERENCES areas_atendimento(id),
    grupo_id UUID REFERENCES grupos_tecnicos(id),
    
    -- Critérios da fila (JSONB)
    criterios JSONB, -- {status: [], prioridades: [], tipos: []}
    
    ordem INTEGER DEFAULT 0,
    cor VARCHAR(20),
    icone VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Regras de SLA (condicionais)
CREATE TABLE sla_regras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sla_id UUID NOT NULL REFERENCES slas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    ordem INTEGER DEFAULT 0,
    
    -- Condições para aplicar a regra
    condicoes JSONB, -- {tipo_id: [], prioridade_id: [], cliente_id: []}
    
    -- Tempos específicos
    tempo_resposta_minutos INTEGER,
    tempo_resolucao_minutos INTEGER,
    tempo_fechamento_minutos INTEGER,
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eventos de SLA (histórico de violações e cumprimentos)
CREATE TABLE sla_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_id UUID NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    sla_id UUID REFERENCES slas(id),
    tipo_evento VARCHAR(50) NOT NULL, -- resposta, resolucao, fechamento
    status VARCHAR(50) NOT NULL, -- cumprido, violado, pausado, retomado
    tempo_previsto TIMESTAMP,
    tempo_real TIMESTAMP,
    tempo_pausado_minutos INTEGER DEFAULT 0,
    percentual_cumprimento DECIMAL(5,2),
    criado_por UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendário de SLA (horários de expediente)
CREATE TABLE calendario_sla (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    perfil_jornada_id UUID NOT NULL REFERENCES perfis_jornada(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CMDB - Configuration Management Database
-- =============================================

-- Serviços de TI
CREATE TABLE servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(100), -- aplicacao, infraestrutura, negocio
    criticidade VARCHAR(50), -- baixa, media, alta, critica
    status VARCHAR(50) DEFAULT 'ativo', -- ativo, inativo, manutencao
    responsavel_id UUID REFERENCES users(id),
    area_id UUID REFERENCES areas_atendimento(id),
    
    -- Informações adicionais
    url VARCHAR(500),
    documentacao_url VARCHAR(500),
    sla_id UUID REFERENCES slas(id),
    
    -- Métricas
    disponibilidade_meta DECIMAL(5,2), -- %
    tempo_resposta_meta INTEGER, -- ms
    
    dados_adicionais JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Relacionamentos entre ativos (CMDB)
CREATE TABLE relacionamentos_ativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ativo_origem_id UUID NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
    ativo_destino_id UUID NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
    tipo_relacao VARCHAR(50) NOT NULL, -- conectado_a, depende_de, parte_de, hospeda
    descricao TEXT,
    porta_origem VARCHAR(50),
    porta_destino VARCHAR(50),
    criado_por UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ativo_origem_id, ativo_destino_id, tipo_relacao)
);

-- Dependências entre serviços
CREATE TABLE dependencias_servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servico_origem_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    servico_destino_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    ativo_id UUID REFERENCES ativos(id), -- Ativo que faz a ligação
    tipo_dependencia VARCHAR(50) NOT NULL, -- forte, fraca, bidirecional
    criticidade VARCHAR(50), -- baixa, media, alta
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(servico_origem_id, servico_destino_id)
);

-- =============================================
-- CAMPOS CUSTOMIZADOS AVANÇADOS
-- =============================================

-- Opções predefinidas para campos customizados (select, radio, checkbox)
CREATE TABLE campos_customizados_opcoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campo_id UUID NOT NULL REFERENCES campos_customizados(id) ON DELETE CASCADE,
    valor VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    ordem INTEGER DEFAULT 0,
    cor VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ADMINISTRAÇÃO E CONFIGURAÇÕES
-- =============================================

-- Configurações globais do sistema
CREATE TABLE configuracoes_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    tipo VARCHAR(50) DEFAULT 'string',
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT,
    editavel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuração SMTP para envio de emails
CREATE TABLE email_smtp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    porta INTEGER NOT NULL,
    seguranca VARCHAR(20), -- tls, ssl, none
    usuario VARCHAR(255),
    senha VARCHAR(255),
    remetente_nome VARCHAR(255),
    remetente_email VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    padrao BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Templates de email
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    assunto VARCHAR(500) NOT NULL,
    corpo TEXT NOT NULL,
    variaveis_disponiveis JSONB, -- {{nome_usuario}}, {{numero_chamado}}, etc
    tipo VARCHAR(50), -- chamado, ativo, usuario, sistema
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Listas de distribuição (grupos de email)
CREATE TABLE listas_distribuicao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    emails TEXT[], -- Array de emails
    tipo VARCHAR(50), -- area, departamento, personalizada
    area_id UUID REFERENCES areas_atendimento(id),
    departamento_id UUID REFERENCES departamentos(id),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Sessions
CREATE INDEX idx_sessions_usuario ON sessions(usuario_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Logs de acesso
CREATE INDEX idx_logs_acesso_usuario ON logs_acesso(usuario_id);
CREATE INDEX idx_logs_acesso_criado ON logs_acesso(created_at);
CREATE INDEX idx_logs_acesso_acao ON logs_acesso(acao);

-- Relacionamentos de chamados
CREATE INDEX idx_chamados_rel_origem ON chamados_relacionados(chamado_origem_id);
CREATE INDEX idx_chamados_rel_destino ON chamados_relacionados(chamado_destino_id);

-- Vínculos ativos
CREATE INDEX idx_vinculos_chamado ON chamados_vinculos_ativo(chamado_id);
CREATE INDEX idx_vinculos_ativo ON chamados_vinculos_ativo(ativo_id);

-- Checklist
CREATE INDEX idx_checklist_tipo ON chamados_checklist(tipo_id);
CREATE INDEX idx_checklist_exec_chamado ON chamado_checklist_execucao(chamado_id);

-- SLA eventos
CREATE INDEX idx_sla_eventos_chamado ON sla_eventos(chamado_id);
CREATE INDEX idx_sla_eventos_tipo ON sla_eventos(tipo_evento);
CREATE INDEX idx_sla_eventos_status ON sla_eventos(status);

-- Serviços
CREATE INDEX idx_servicos_tipo ON servicos(tipo);
CREATE INDEX idx_servicos_status ON servicos(status);
CREATE INDEX idx_servicos_responsavel ON servicos(responsavel_id);

-- Relacionamentos ativos
CREATE INDEX idx_rel_ativos_origem ON relacionamentos_ativos(ativo_origem_id);
CREATE INDEX idx_rel_ativos_destino ON relacionamentos_ativos(ativo_destino_id);

-- Dependências serviços
CREATE INDEX idx_dep_servicos_origem ON dependencias_servicos(servico_origem_id);
CREATE INDEX idx_dep_servicos_destino ON dependencias_servicos(servico_destino_id);

-- Email templates
CREATE INDEX idx_email_templates_codigo ON email_templates(codigo);
CREATE INDEX idx_email_templates_tipo ON email_templates(tipo);

-- =============================================
-- TRIGGERS DE AUDITORIA
-- =============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at em todas as tabelas principais
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER set_timestamp
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        ', t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para log automático de alterações
CREATE OR REPLACE FUNCTION trigger_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO logs_sistema (
        usuario_id,
        modulo,
        acao,
        entidade_tipo,
        entidade_id,
        dados_anteriores,
        dados_novos,
        ip,
        user_agent
    ) VALUES (
        COALESCE(NEW.atualizado_por, NEW.criado_por),
        TG_TABLE_NAME,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
        inet_client_addr()::text,
        current_setting('application_name', true)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS PARA RELATÓRIOS
-- =============================================

-- View: Chamados com informações completas
CREATE OR REPLACE VIEW vw_chamados_completo AS
SELECT 
    c.id,
    c.numero,
    c.titulo,
    c.descricao,
    c.status_id,
    cs.nome AS status_nome,
    cs.cor AS status_cor,
    c.prioridade_id,
    cp.nome AS prioridade_nome,
    cp.nivel AS prioridade_nivel,
    cp.cor AS prioridade_cor,
    c.tipo_id,
    ct.nome AS tipo_nome,
    c.solicitante_id,
    us.nome AS solicitante_nome,
    us.email AS solicitante_email,
    c.tecnico_responsavel_id,
    ut.nome AS tecnico_nome,
    c.area_id,
    aa.nome AS area_nome,
    c.cliente_id,
    cli.nome AS cliente_nome,
    c.unidade_id,
    un.nome AS unidade_nome,
    c.sla_id,
    sla.nome AS sla_nome,
    c.data_abertura,
    c.data_vencimento_sla,
    c.data_resolucao,
    c.data_fechamento,
    c.tempo_primeira_resposta,
    c.tempo_resolucao,
    c.satisfacao_avaliacao,
    c.satisfacao_comentario,
    -- Cálculo de SLA
    CASE 
        WHEN c.data_fechamento IS NOT NULL THEN 
            CASE WHEN c.data_fechamento <= c.data_vencimento_sla THEN 'ok' ELSE 'violado' END
        WHEN CURRENT_TIMESTAMP > c.data_vencimento_sla THEN 'vencido'
        WHEN c.data_vencimento_sla - INTERVAL '2 hours' < CURRENT_TIMESTAMP THEN 'atencao'
        ELSE 'ok'
    END AS sla_status,
    -- Tempo decorrido
    EXTRACT(EPOCH FROM (COALESCE(c.data_fechamento, CURRENT_TIMESTAMP) - c.data_abertura))/3600 AS horas_decorridas,
    c.created_at,
    c.updated_at
FROM chamados c
LEFT JOIN chamado_status cs ON c.status_id = cs.id
LEFT JOIN chamado_prioridades cp ON c.prioridade_id = cp.id
LEFT JOIN chamado_tipos ct ON c.tipo_id = ct.id
LEFT JOIN users us ON c.solicitante_id = us.id
LEFT JOIN users ut ON c.tecnico_responsavel_id = ut.id
LEFT JOIN areas_atendimento aa ON c.area_id = aa.id
LEFT JOIN clientes cli ON c.cliente_id = cli.id
LEFT JOIN unidades un ON c.unidade_id = un.id
LEFT JOIN slas sla ON c.sla_id = sla.id
WHERE c.deleted_at IS NULL;

-- View: Estatísticas de chamados por status
CREATE OR REPLACE VIEW vw_chamados_estatisticas_status AS
SELECT 
    cs.id AS status_id,
    cs.nome AS status_nome,
    cs.cor AS status_cor,
    cs.tipo AS status_tipo,
    COUNT(c.id) AS total_chamados,
    COUNT(CASE WHEN c.prioridade_id IN (
        SELECT id FROM chamado_prioridades WHERE nivel <= 2
    ) THEN 1 END) AS total_alta_prioridade,
    AVG(EXTRACT(EPOCH FROM (c.data_fechamento - c.data_abertura))/3600) AS media_horas_resolucao
FROM chamado_status cs
LEFT JOIN chamados c ON cs.id = c.status_id AND c.deleted_at IS NULL
WHERE cs.deleted_at IS NULL
GROUP BY cs.id, cs.nome, cs.cor, cs.tipo;

-- View: Performance de técnicos
CREATE OR REPLACE VIEW vw_tecnicos_performance AS
SELECT 
    u.id AS tecnico_id,
    u.nome AS tecnico_nome,
    COUNT(c.id) AS total_chamados,
    COUNT(CASE WHEN cs.tipo = 'fechado' THEN 1 END) AS total_fechados,
    COUNT(CASE WHEN cs.tipo = 'em_andamento' THEN 1 END) AS total_em_andamento,
    COUNT(CASE WHEN c.data_fechamento <= c.data_vencimento_sla THEN 1 END) AS total_sla_cumprido,
    COUNT(CASE WHEN c.data_fechamento > c.data_vencimento_sla THEN 1 END) AS total_sla_violado,
    AVG(c.satisfacao_avaliacao) AS media_satisfacao,
    AVG(EXTRACT(EPOCH FROM (c.data_fechamento - c.data_abertura))/3600) AS media_horas_resolucao
FROM users u
INNER JOIN chamados c ON u.id = c.tecnico_responsavel_id AND c.deleted_at IS NULL
LEFT JOIN chamado_status cs ON c.status_id = cs.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.nome;

-- View: Ativos por status e tipo
CREATE OR REPLACE VIEW vw_ativos_resumo AS
SELECT 
    at.id AS tipo_id,
    at.nome AS tipo_nome,
    ast.id AS status_id,
    ast.nome AS status_nome,
    ast.cor AS status_cor,
    COUNT(a.id) AS total_ativos,
    SUM(CASE WHEN a.valor_aquisicao IS NOT NULL THEN a.valor_aquisicao ELSE 0 END) AS valor_total
FROM ativo_tipos at
LEFT JOIN ativos a ON at.id = a.tipo_id AND a.deleted_at IS NULL
LEFT JOIN ativo_status ast ON a.status_id = ast.id
WHERE at.deleted_at IS NULL
GROUP BY at.id, at.nome, ast.id, ast.nome, ast.cor;

-- View: Licenças de software vencendo
CREATE OR REPLACE VIEW vw_licencas_vencendo AS
SELECT 
    l.id,
    l.chave_licenca,
    l.data_aquisicao,
    l.data_expiracao,
    l.quantidade_total,
    l.quantidade_utilizada,
    (l.quantidade_total - l.quantidade_utilizada) AS disponivel,
    s.nome AS software_nome,
    s.versao AS software_versao,
    tl.nome AS tipo_licenca,
    EXTRACT(day FROM (l.data_expiracao - CURRENT_DATE)) AS dias_para_vencer
FROM licencas l
INNER JOIN softwares s ON l.software_id = s.id
INNER JOIN tipos_licencas tl ON l.tipo_licenca_id = tl.id
WHERE l.data_expiracao IS NOT NULL
  AND l.data_expiracao BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
  AND l.deleted_at IS NULL
ORDER BY l.data_expiracao;

-- View: Inventário por localização
CREATE OR REPLACE VIEW vw_inventario_localizacao AS
SELECT 
    u.id AS unidade_id,
    u.nome AS unidade_nome,
    d.id AS departamento_id,
    d.nome AS departamento_nome,
    at.id AS tipo_ativo_id,
    at.nome AS tipo_ativo_nome,
    COUNT(a.id) AS quantidade,
    SUM(CASE WHEN ast.tipo = 'disponivel' THEN 1 ELSE 0 END) AS disponiveis,
    SUM(CASE WHEN ast.tipo = 'em_uso' THEN 1 ELSE 0 END) AS em_uso,
    SUM(CASE WHEN ast.tipo = 'manutencao' THEN 1 ELSE 0 END) AS manutencao
FROM unidades u
LEFT JOIN ativos a ON u.id = a.localizacao_atual_id AND a.deleted_at IS NULL
LEFT JOIN departamentos d ON a.departamento_id = d.id
LEFT JOIN ativo_tipos at ON a.tipo_id = at.id
LEFT JOIN ativo_status ast ON a.status_id = ast.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.nome, d.id, d.nome, at.id, at.nome;

-- View: SLA - Chamados em risco
CREATE OR REPLACE VIEW vw_chamados_sla_risco AS
SELECT 
    c.id,
    c.numero,
    c.titulo,
    c.data_abertura,
    c.data_vencimento_sla,
    EXTRACT(EPOCH FROM (c.data_vencimento_sla - CURRENT_TIMESTAMP))/3600 AS horas_restantes,
    u.nome AS tecnico_nome,
    cli.nome AS cliente_nome,
    cs.nome AS status_nome,
    cp.nome AS prioridade_nome
FROM chamados c
INNER JOIN chamado_status cs ON c.status_id = cs.id
INNER JOIN chamado_prioridades cp ON c.prioridade_id = cp.id
LEFT JOIN users u ON c.tecnico_responsavel_id = u.id
LEFT JOIN clientes cli ON c.cliente_id = cli.id
WHERE c.deleted_at IS NULL
  AND cs.tipo NOT IN ('fechado', 'cancelado')
  AND c.data_vencimento_sla BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '4 hours'
ORDER BY c.data_vencimento_sla;

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Inserir perfis padrão
INSERT INTO roles (id, nome, descricao, nivel) VALUES
(uuid_generate_v4(), 'Administrador', 'Acesso total ao sistema', 1),
(uuid_generate_v4(), 'Gestor de Área', 'Gerencia área específica', 2),
(uuid_generate_v4(), 'Técnico', 'Atende chamados', 3),
(uuid_generate_v4(), 'Solicitante', 'Abre chamados', 4),
(uuid_generate_v4(), 'Auditor', 'Visualiza relatórios', 5);

-- Inserir status padrão de chamado
INSERT INTO chamado_status (id, nome, tipo, cor, ordem) VALUES
(uuid_generate_v4(), 'Aberto', 'aberto', '#FF9800', 1),
(uuid_generate_v4(), 'Em Andamento', 'em_andamento', '#2196F3', 2),
(uuid_generate_v4(), 'Aguardando Cliente', 'aguardando', '#FFC107', 3),
(uuid_generate_v4(), 'Resolvido', 'resolvido', '#4CAF50', 4),
(uuid_generate_v4(), 'Fechado', 'fechado', '#9E9E9E', 5),
(uuid_generate_v4(), 'Cancelado', 'cancelado', '#F44336', 6);

-- Inserir prioridades padrão
INSERT INTO chamado_prioridades (id, nome, nivel, cor, tempo_resposta_horas) VALUES
(uuid_generate_v4(), 'Crítica', 1, '#F44336', 1),
(uuid_generate_v4(), 'Alta', 2, '#FF9800', 4),
(uuid_generate_v4(), 'Média', 3, '#FFC107', 8),
(uuid_generate_v4(), 'Baixa', 4, '#4CAF50', 24);

-- Inserir status padrão de ativo
INSERT INTO ativo_status (id, nome, tipo, cor) VALUES
(uuid_generate_v4(), 'Disponível', 'disponivel', '#4CAF50'),
(uuid_generate_v4(), 'Em Uso', 'em_uso', '#2196F3'),
(uuid_generate_v4(), 'Manutenção', 'manutencao', '#FF9800'),
(uuid_generate_v4(), 'Estoque', 'estoque', '#9E9E9E'),
(uuid_generate_v4(), 'Baixado', 'baixado', '#F44336'),
(uuid_generate_v4(), 'Emprestado', 'emprestado', '#FFC107');

-- =============================================
-- FIM DO SCRIPT
-- =============================================
