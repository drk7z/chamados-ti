require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
// unlock admin & diagnose 409 configs

const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
});

(async () => {
  try {
    // 0. List all tables
    const [tables] = await seq.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log('Tabelas:', tables.map(t => t.tablename).join(', '));

    // 1. Check admin user (try users first, then usuarios)
    const userTable = tables.find(t => t.tablename === 'users') ? 'users' : 'usuarios';
    const [[user]] = await seq.query(
      `SELECT id, email, senha, ativo FROM ${userTable} WHERE email = $1 LIMIT 1`,
      { bind: [process.env.DEFAULT_ADMIN_EMAIL] }
    );
    if (!user) {
      console.log('USUARIO NAO ENCONTRADO:', process.env.DEFAULT_ADMIN_EMAIL);
    } else {
      const match = await bcrypt.compare(process.env.DEFAULT_ADMIN_PASSWORD, user.senha);
      console.log('Email:', user.email);
      console.log('Ativo:', user.ativo);
      console.log('Senha bate?:', match);
    }

    // Show lockout state
    const [[lockInfo]] = await seq.query(
      `SELECT email, ativo, tentativas_login, bloqueado_ate FROM users WHERE email='${process.env.DEFAULT_ADMIN_EMAIL}'`
    );
    console.log('Lockout state:', lockInfo);

    // Unlock account
    await seq.query(
      `UPDATE users SET tentativas_login=0, bloqueado_ate=NULL WHERE email='${process.env.DEFAULT_ADMIN_EMAIL}'`
    );
    console.log('Conta desbloqueada!');

    // 2. Check real table names for config routes
    const [configTables] = await seq.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('ativo_tipos','tipos_ativo','software_categorias','categorias_software') ORDER BY tablename"
    );
    console.log('Config tables found:', configTables.map(t => t.tablename).join(', '));

  } catch (e) {
    console.error('ERRO:', e.message);
  } finally {
    await seq.close();
  }
})();
