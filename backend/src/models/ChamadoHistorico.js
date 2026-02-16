const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChamadoHistorico = sequelize.define('ChamadoHistorico', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chamado_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'chamados', key: 'id' }
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  tipo: {
    type: DataTypes.ENUM(
      'criacao', 'atribuicao', 'mudanca_status', 'mudanca_prioridade',
      'comentario', 'anexo', 'transferencia', 'escalonamento',
      'resolucao', 'fechamento', 'reabertura', 'pausa', 'retomada'
    ),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  valor_anterior: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  valor_novo: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  visivel_solicitante: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  tempo_decorrido: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tempo em minutos desde última movimentação'
  }
}, {
  tableName: 'chamado_historico',
  updatedAt: false,
  paranoid: false
});

module.exports = ChamadoHistorico;
