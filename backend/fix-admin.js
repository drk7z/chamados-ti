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
    console.log('Colunas ativos:', cols.map(c => c.column_name).join(', '));
  } catch (e) {
    console.error('ERRO:', e.message);
  } finally {
    await seq.close();
  }
})();


const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
});

(async () => {
  try {
    // Tabelas de ativo
    const [ativoTables] = await seq.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE '%ativo%' ORDER BY tablename"
    );
    console.log('Tabelas ativo:', ativoTables.map(t => t.tablename).join(', '));

    // Conta tipos/status/categorias
    const [[tipos]] = await seq.query('SELECT COUNT(*) as n FROM ativo_tipos');
    const [[status]] = await seq.query('SELECT COUNT(*) as n FROM ativo_status');
    const [[cats]] = await seq.query('SELECT COUNT(*) as n FROM ativo_categorias');
    console.log('ativo_tipos:', tipos.n, '| ativo_status:', status.n, '| ativo_categorias:', cats.n);

    // Testa login e inventário via HTTP
    const loginBody = JSON.stringify({ email: process.env.DEFAULT_ADMIN_EMAIL, senha: process.env.DEFAULT_ADMIN_PASSWORD });
    const token = await new Promise((resolve, reject) => {
      const req = http.request({ hostname:'localhost', port:3001, path:'/api/v1/auth/login', method:'POST',
        headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(loginBody)} }, res => {
        let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
          try { resolve(JSON.parse(d).token); } catch(e) { reject(new Error('Login parse error: '+d)); }
        });
      });
      req.on('error', reject);
      req.write(loginBody); req.end();
    });

    if (!token) { console.log('Token vazio'); return; }
    console.log('Login OK, token obtido');

    // Testa inventario
    await new Promise((resolve) => {
      const req = http.request({ hostname:'localhost', port:3001, path:'/api/v1/inventario?page=1&limit=5&ativo=true',
        method:'GET', headers:{'Authorization':'Bearer '+token} }, res => {
        let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ console.log('inventario:', res.statusCode, d.substring(0,400)); resolve(); });
      });
      req.on('error', e => { console.log('inventario ERR:', e.message); resolve(); });
      req.end();
    });

    // Testa config/tipos
    await new Promise((resolve) => {
      const req = http.request({ hostname:'localhost', port:3001, path:'/api/v1/inventario/config/tipos',
        method:'GET', headers:{'Authorization':'Bearer '+token} }, res => {
        let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ console.log('config/tipos:', res.statusCode, d.substring(0,400)); resolve(); });
      });
      req.on('error', e => { console.log('config/tipos ERR:', e.message); resolve(); });
      req.end();
    });

  } catch (e) {
    console.error('ERRO:', e.message);
  } finally {
    await seq.close();
  }
})();

