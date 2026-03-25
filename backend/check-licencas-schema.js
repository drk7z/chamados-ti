const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'chamados-ti', user: 'postgres', password: 'admin' });

(async () => {
  // Check tipo_licencas table
  const tipo = await pool.query("SELECT id, nome FROM tipo_licencas LIMIT 10");
  console.log('tipo_licencas rows:', tipo.rows);

  // Check licencas columns
  const cols = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'licencas' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  console.log('licencas columns:', cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

  // Check softwares
  const sw = await pool.query("SELECT id, nome FROM softwares WHERE ativo = true LIMIT 5");
  console.log('softwares:', sw.rows);

  await pool.end();
})().catch(e => { console.error('Error:', e.message); pool.end(); });
