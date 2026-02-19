const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const buildDialectOptions = () => {
  const sslEnabled = process.env.DB_SSL === 'true' || Boolean(process.env.DATABASE_URL);

  if (!sslEnabled) {
    return undefined;
  }

  return {
    ssl: {
      require: true,
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
    }
  };
};

const baseConfig = {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
    acquire: 30000,
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
