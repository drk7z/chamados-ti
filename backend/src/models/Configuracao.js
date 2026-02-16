const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// CampoCustomizadoOpcao - Opções para campos select/radio/checkbox
const CampoCustomizadoOpcao = sequelize.define('CampoCustomizadoOpcao', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  campo_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'campos_customizados', key: 'id' }
  },
  valor: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  label: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  ordem: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  tableName: 'campos_customizados_opcoes',
  updatedAt: false,
  paranoid: false
});

// ConfiguracaoSistema - Configurações globais
const ConfiguracaoSistema = sequelize.define('ConfiguracaoSistema', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chave: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  valor: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.STRING(50),
    defaultValue: 'string'
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  editavel: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'configuracoes_sistema',
  paranoid: false
});

// EmailSmtp - Configurações de SMTP
const EmailSmtp = sequelize.define('EmailSmtp', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  host: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  porta: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  seguranca: {
    type: DataTypes.STRING(20),
    comment: 'tls, ssl, none'
  },
  usuario: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  remetente_nome: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  remetente_email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  padrao: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'email_smtp',
  paranoid: true
});

// EmailTemplate - Templates de email
const EmailTemplate = sequelize.define('EmailTemplate', {
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
  assunto: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  corpo: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  variaveis_disponiveis: {
    type: DataTypes.JSONB,
    comment: '{{nome_usuario}}, {{numero_chamado}}, etc'
  },
  tipo: {
    type: DataTypes.STRING(50),
    comment: 'chamado, ativo, usuario, sistema'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'email_templates'
});

// ListaDistribuicao - Grupos de email
const ListaDistribuicao = sequelize.define('ListaDistribuicao', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emails: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  tipo: {
    type: DataTypes.STRING(50),
    comment: 'area, departamento, personalizada'
  },
  area_id: {
    type: DataTypes.UUID,
    references: { model: 'areas_atendimento', key: 'id' }
  },
  departamento_id: {
    type: DataTypes.UUID,
    references: { model: 'departamentos', key: 'id' }
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'listas_distribuicao',
  paranoid: true
});

module.exports = {
  CampoCustomizadoOpcao,
  ConfiguracaoSistema,
  EmailSmtp,
  EmailTemplate,
  ListaDistribuicao
};
