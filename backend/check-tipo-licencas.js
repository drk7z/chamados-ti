const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'chamados-ti', user: 'postgres', password: 'admin' });

(async () => {
  const cols = await pool.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'tipo_licencas' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  console.log('tipo_licencas columns:', cols.rows.map(c => `${c.column_name}(${c.data_type})`).join(', '));

  const rows = await pool.query('SELECT * FROM tipo_licencas');
  console.log('tipo_licencas full rows:', JSON.stringify(rows.rows, null, 2));

  // Also check software_categorias
  const catCols = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'software_categorias' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  console.log('software_categorias columns:', catCols.rows.map(c => c.column_name).join(', '));

  await pool.end();
})().catch(e => { console.error('Error:', e.message); pool.end(); });
