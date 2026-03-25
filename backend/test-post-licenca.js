require('dotenv').config();
const http = require('http');

async function req(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3001, method, path,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', e => resolve({ status: 0, body: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const login = await req('POST', '/api/v1/auth/login', { email: 'admin@ti.com', senha: 'admin' });
  const token = JSON.parse(login.body).token;
  console.log('Login:', login.status);

  // Try POST to create a license
  const sw = await req('GET', '/api/v1/inventario/software?limit=1&ativo=true', null, token);
  console.log('Software list:', sw.status, sw.body.substring(0, 200));

  // Get tipo_licencas list
  const tipos = await req('GET', '/api/v1/inventario/software/config/tipos-licenca', null, token);
  console.log('Tipos licenca:', tipos.status, tipos.body.substring(0, 300));

  // Parse software and tipo_licenca ids
  const swData = JSON.parse(sw.body);
  const tiposData = JSON.parse(tipos.body);
  console.log('sw ids:', swData.softwares ? swData.softwares.map(x => x.id) : 'no swData.softwares');
  console.log('tipos ids:', Array.isArray(tiposData) ? tiposData.map(x => x.id) : tiposData);

  if ((swData.softwares && swData.softwares.length > 0) && tiposData.length > 0) {
    const software_id = swData.softwares[0].id;
    const tipo_licenca_id = tiposData[0].id;

    const post = await req('POST', '/api/v1/inventario/licencas', {
      software_id,
      tipo_licenca_id,
      quantidade_licencas: 5,
      observacoes: 'Teste'
    }, token);
    console.log('POST licenca:', post.status, post.body.substring(0, 500));
  }
})();
