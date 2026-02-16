require('dotenv').config();

const { DataTypes } = require('sequelize');
const { sequelize } = require('../models');
const logger = require('../utils/logger');

const ensureColumn = async (queryInterface, tableName, columnName, definition) => {
  const table = await queryInterface.describeTable(tableName);
  if (!table[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
    logger.info(`🛠️ Coluna criada: ${tableName}.${columnName}`);
  } else {
    logger.info(`🛠️ Coluna já existe: ${tableName}.${columnName}`);
  }
};

const ensureForeignKey = async (queryInterface, tableName, columnName, constraintName) => {
  await sequelize.query(`ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${constraintName};`);
  await queryInterface.addConstraint(tableName, {
    fields: [columnName],
    type: 'foreign key',
    name: constraintName,
    references: {
      table: 'entidades',
      field: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });
  logger.info(`🛠️ FK aplicada: ${constraintName}`);
};

const run = async () => {
  try {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();

    logger.info('🛠️ Iniciando migrações essenciais (multi-tenant)...');

    await ensureColumn(queryInterface, 'users', 'entidade_id', {
      type: DataTypes.UUID,
      allowNull: true
    });

    await ensureColumn(queryInterface, 'clientes', 'entidade_id', {
      type: DataTypes.UUID,
      allowNull: true
    });

    await ensureColumn(queryInterface, 'chamados', 'entidade_id', {
      type: DataTypes.UUID,
      allowNull: true
    });

    await ensureColumn(queryInterface, 'ativos', 'entidade_id', {
      type: DataTypes.UUID,
      allowNull: true
    });

    await ensureForeignKey(queryInterface, 'users', 'entidade_id', 'users_entidade_id_fkey');
    await ensureForeignKey(queryInterface, 'clientes', 'entidade_id', 'clientes_entidade_id_fkey');
    await ensureForeignKey(queryInterface, 'chamados', 'entidade_id', 'chamados_entidade_id_fkey');
    await ensureForeignKey(queryInterface, 'ativos', 'entidade_id', 'ativos_entidade_id_fkey');

    logger.info('✅ Migrações concluídas com sucesso');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro nas migrações:', error);
    process.exit(1);
  }
};

run();
