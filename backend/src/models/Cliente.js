const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  razao_social: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cnpj: {
    type: DataTypes.STRING(18),
    unique: true,
    allowNull: true
  },
  tipo_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'cliente_tipos', key: 'id' }
  },
  status_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'cliente_status', key: 'id' }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  endereco: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cidade: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  estado: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  cep: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'clientes',
  paranoid: true
});

const ClienteTipo = sequelize.define('ClienteTipo', {
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
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'cliente_tipos',
  paranoid: true
});

const ClienteStatus = sequelize.define('ClienteStatus', {
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
  cor: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'cliente_status',
  paranoid: true
});

module.exports = { Cliente, ClienteTipo, ClienteStatus };
