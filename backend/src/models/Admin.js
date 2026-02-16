const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AreaAtendimento = sequelize.define('AreaAtendimento', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'areas_atendimento',
  paranoid: true
});

const PerfilJornada = sequelize.define('PerfilJornada', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  horarios: {
    type: DataTypes.JSONB,
    defaultValue: {
      segunda: { inicio: '08:00', fim: '18:00' },
      terca: { inicio: '08:00', fim: '18:00' },
      quarta: { inicio: '08:00', fim: '18:00' },
      quinta: { inicio: '08:00', fim: '18:00' },
      sexta: { inicio: '08:00', fim: '18:00' },
      sabado: null,
      domingo: null
    }
  },
  fuso_horario: {
    type: DataTypes.STRING(50),
    defaultValue: 'America/Sao_Paulo'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'perfis_jornada',
  paranoid: true
});

const Feriado = sequelize.define('Feriado', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('nacional', 'estadual', 'municipal'),
    defaultValue: 'nacional'
  },
  recorrente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'feriados',
  paranoid: true
});

const CampoCustomizado = sequelize.define('CampoCustomizado', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  modulo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'chamado, ativo, cliente, etc'
  },
  entidade_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID do tipo/categoria específico'
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  label: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('texto', 'numero', 'data', 'select', 'checkbox', 'textarea', 'arquivo'),
    allowNull: false
  },
  opcoes: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Para campos tipo select'
  },
  obrigatorio: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ordem: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'campos_customizados',
  paranoid: true
});

const LogSistema = sequelize.define('LogSistema', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  modulo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  acao: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entidade: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  entidade_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ip: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dados_antes: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  dados_depois: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'logs_sistema',
  updatedAt: false,
  paranoid: false
});

module.exports = { 
  AreaAtendimento, 
  PerfilJornada, 
  Feriado, 
  CampoCustomizado, 
  LogSistema 
};
