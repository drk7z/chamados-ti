require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
});

(async () => {
  try {
    const [cols] = await seq.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='ativos' ORDER BY ordinal_position"
    );
    const names = cols.map(c => c.column_name);
    console.log('Colunas ativos:', names.join(', '));
    console.log('Tem entidade_id?', names.includes('entidade_id'));

    if (!names.includes('entidade_id')) {
      console.log('Adicionando coluna entidade_id...');
      await seq.query("ALTER TABLE ativos ADD COLUMN entidade_id UUID REFERENCES entidades(id)");
      console.log('Coluna entidade_id adicionada com sucesso.');
    }
  } catch (e) {
    console.error('ERRO:', e.message);
  } finally {
    await seq.close();
  }
})();
