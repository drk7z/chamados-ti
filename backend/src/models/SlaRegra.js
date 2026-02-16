const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// SlaRegra - Regras condicionais de SLA
const SlaRegra = sequelize.define('SlaRegra', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sla_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'slas', key: 'id' }
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  ordem: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  condicoes: {
    type: DataTypes.JSONB,
    comment: '{tipo_id: [], prioridade_id: [], cliente_id: []}'
  },
  tempo_resposta_minutos: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tempo_resolucao_minutos: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tempo_fechamento_minutos: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'sla_regras',
  paranoid: false
});

// SlaEvento - Eventos de SLA (violações, cumprimentos)
const SlaEvento = sequelize.define('SlaEvento', {
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
  sla_id: {
    type: DataTypes.UUID,
    references: { model: 'slas', key: 'id' }
  },
  tipo_evento: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'resposta, resolucao, fechamento'
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'cumprido, violado, pausado, retomado'
  },
  tempo_previsto: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tempo_real: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tempo_pausado_minutos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  percentual_cumprimento: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  criado_por: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'sla_eventos',
  updatedAt: false,
  paranoid: false
});

// CalendarioSla - Horários de expediente por dia da semana
const CalendarioSla = sequelize.define('CalendarioSla', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  perfil_jornada_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'perfis_jornada', key: 'id' }
  },
  dia_semana: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 6
    },
    comment: '0=Domingo, 6=Sábado'
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false
  },
  hora_fim: {
    type: DataTypes.TIME,
    allowNull: false
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'calendario_sla',
  updatedAt: false,
  paranoid: false
});

module.exports = { SlaRegra, SlaEvento, CalendarioSla };
