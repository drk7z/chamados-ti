const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const buildDialectOptions = () => {
  const sslEnabled = process.env.DB_SSL === 'true' || Boolean(process.env.DATABASE_URL);

  if (!sslEnabled) {
    return undefined;
  }

  // Nota: `require` não é uma opção nativa do driver pg — passá-lo causa o aviso
  // "libpq SSL mode definitions" e pode encerrar a conexão inesperadamente.
  // O sslmode=require já fica na DATABASE_URL; aqui só controlamos rejectUnauthorized.
  return {
    ssl: {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
    }
  };
};

// Para conexões cloud (DATABASE_URL), o pool.min alto causa picos de conexão na
// inicialização que o Render.com pode rejeitar. Usar valor menor nesses casos.
const poolMin = process.env.DATABASE_URL
  ? parseInt(process.env.DB_POOL_MIN_CLOUD, 10) || 1
  : parseInt(process.env.DB_POOL_MIN, 10) || 2;

const baseConfig = {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    min: poolMin,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE_MS, 10) || 60000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    paranoid: process.env.SOFT_DELETE === 'true',
    freezeTableName: false,
    charset: 'utf8',
    collate: 'utf8_general_ci'
  },
  timezone: process.env.TIMEZONE || '-03:00',
  dialectOptions: buildDialectOptions()
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, baseConfig)
  : new Sequelize({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ...baseConfig
    });

module.exports = { sequelize, Sequelize };
