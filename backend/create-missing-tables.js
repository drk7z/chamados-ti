require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
});

const run = async () => {
  try {
    // 1. licencas
    await seq.query(`
      CREATE TABLE IF NOT EXISTS licencas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )
    `);
    console.log('licencas OK');

    // 2. licencas_atribuicoes
    await seq.query(`
      CREATE TABLE IF NOT EXISTS licencas_atribuicoes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        licenca_id UUID NOT NULL REFERENCES licencas(id),
        usuario_id UUID REFERENCES users(id),
        ativo_id UUID REFERENCES ativos(id),
        data_atribuicao DATE NOT NULL DEFAULT CURRENT_DATE,
        data_revogacao DATE,
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('licencas_atribuicoes OK');

    // 3. instalacoes_software
    await seq.query(`
      CREATE TABLE IF NOT EXISTS instalacoes_software (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        software_id UUID NOT NULL REFERENCES softwares(id),
        ativo_id UUID NOT NULL REFERENCES ativos(id),
        versao_instalada VARCHAR(50),
        data_instalacao DATE,
        chave_produto VARCHAR(255),
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )
    `);
    console.log('instalacoes_software OK');

    // 4. ativo_garantias (if missing)
    await seq.query(`
      CREATE TABLE IF NOT EXISTS ativo_garantias (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ativo_id UUID NOT NULL REFERENCES ativos(id),
        descricao VARCHAR(255),
        data_inicio DATE,
        data_fim DATE,
        fornecedor VARCHAR(255),
        numero_contrato VARCHAR(100),
        observacoes TEXT,
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      )
    `);
    console.log('ativo_garantias OK');

    console.log('\nTodas as tabelas criadas com sucesso!');
  } catch (e) {
    console.error('ERRO:', e.message);
  } finally {
    await seq.close();
  }
};

run();
