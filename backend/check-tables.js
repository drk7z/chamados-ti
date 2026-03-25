const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'chamados-ti', user: 'postgres', password: 'admin' });

(async () => {
  const r = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('licencas','licencas_atribuicoes','instalacoes_software','ativo_garantias') ORDER BY tablename");
  console.log('Existing tables:', r.rows.map(x => x.tablename));
  await pool.end();
})().catch(e => { console.error('Error:', e.message); pool.end(); });
