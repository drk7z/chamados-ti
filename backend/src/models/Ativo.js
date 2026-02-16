const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ativo = sequelize.define('Ativo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  codigo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'ativo_tipos', key: 'id' }
  },
  modelo_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'ativo_modelos', key: 'id' }
  },
  categoria_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'ativo_categorias', key: 'id' }
  },
  status_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'ativo_status', key: 'id' }
  },
  numero_serie: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  numero_patrimonio: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  localizacao_atual_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'unidades', key: 'id' }
  },
  localizacao_anterior_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'unidades', key: 'id' }
  },
  responsavel_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  cliente_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'clientes', key: 'id' }
  },
  departamento_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'departamentos', key: 'id' }
  },
  data_aquisicao: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  data_garantia_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  data_garantia_fim: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  garantia_ativa: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  valor_aquisicao: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  fornecedor: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  nota_fiscal: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  termo_responsabilidade: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  termo_aceito_em: {
    type: DataTypes.DATE,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  caracteristicas: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'RAM, HD, CPU, etc'
  },
  campos_customizados: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  descontinuado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Auditoria
  criado_por: {
    type: DataTypes.UUID,
    allowNull: true
  },
  atualizado_por: {
    type: DataTypes.UUID,
    allowNull: true
  },
  entidade_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'entidades', key: 'id' }
  }
}, {
  tableName: 'ativos',
  paranoid: true,
  indexes: [
    { fields: ['codigo'] },
    { fields: ['numero_serie'] },
    { fields: ['numero_patrimonio'] },
    { fields: ['responsavel_id'] },
    { fields: ['status_id'] }
  ]
});

module.exports = Ativo;
