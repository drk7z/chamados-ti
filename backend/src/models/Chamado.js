const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chamado = sequelize.define('Chamado', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true
  },
  titulo: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tipo_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'chamado_tipos', key: 'id' }
  },
  status_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'chamado_status', key: 'id' }
  },
  prioridade_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'chamado_prioridades', key: 'id' }
  },
  sla_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'slas', key: 'id' }
  },
  area_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'areas_atendimento', key: 'id' }
  },
  solicitante_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  tecnico_responsavel_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  cliente_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'clientes', key: 'id' }
  },
  unidade_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'unidades', key: 'id' }
  },
  departamento_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'departamentos', key: 'id' }
  },
  data_abertura: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  data_atribuicao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_primeira_resposta: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_resolucao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_fechamento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prazo_sla: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tempo_pausado: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Tempo em minutos'
  },
  sla_vencido: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pausado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  motivo_pausa: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  solucao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  origem: {
    type: DataTypes.ENUM('web', 'email', 'telefone', 'api', 'chat'),
    defaultValue: 'web'
  },
  avaliacao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 }
  },
  comentario_avaliacao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  campos_customizados: {
    type: DataTypes.JSONB,
    defaultValue: {}
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
  tableName: 'chamados',
  paranoid: true,
  indexes: [
    { fields: ['numero'] },
    { fields: ['status_id'] },
    { fields: ['solicitante_id'] },
    { fields: ['tecnico_responsavel_id'] },
    { fields: ['data_abertura'] },
    { fields: ['prazo_sla'] }
  ]
});

module.exports = Chamado;
