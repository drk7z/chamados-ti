const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  cpf: {
    type: DataTypes.STRING(14),
    unique: true,
    allowNull: true
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ultimo_acesso: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tentativas_login: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bloqueado_ate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  token_reset_senha: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  token_reset_expira: {
    type: DataTypes.DATE,
    allowNull: true
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
    references: {
      model: 'entidades',
      key: 'id'
    }
  }
}, {
  tableName: 'users',
  paranoid: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.senha) {
        user.senha = await bcrypt.hash(user.senha, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('senha')) {
        user.senha = await bcrypt.hash(user.senha, 10);
      }
    }
  }
});

// Métodos de instância
User.prototype.validarSenha = async function(senha) {
  return await bcrypt.compare(senha, this.senha);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.senha;
  delete values.token_reset_senha;
  return values;
};

module.exports = User;
