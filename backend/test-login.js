require('dotenv').config();
const http = require('http');

function httpPost(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const opts = {
      hostname: 'localhost', port: process.env.PORT || 3001, path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr), ...headers }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function httpGet(path, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost', port: process.env.PORT || 3001, path,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, body: data }); } });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const base = `/api/${process.env.API_VERSION || 'v1'}`;
  const loginRes = await httpPost(`${base}/auth/login`, { email: process.env.DEFAULT_ADMIN_EMAIL, senha: process.env.DEFAULT_ADMIN_PASSWORD });
  console.log('Login:', loginRes.status);
  if (loginRes.status !== 200) { console.log(loginRes.body); return; }

  const token = loginRes.body.token;
  const inv = await httpGet(`${base}/inventario?page=1&limit=5&ativo=true`, token);
  console.log('Inventario ativos:', inv.status, JSON.stringify(inv.body).substring(0, 80));

  const lic = await httpGet(`${base}/inventario/licencas`, token);
  console.log('Inventario licencas:', lic.status, JSON.stringify(lic.body).substring(0, 150));

  const lic2 = await httpGet(`${base}/inventario/licencas/proximas-expiracao`, token);
  console.log('Proximas expiracao:', lic2.status, JSON.stringify(lic2.body).substring(0, 80));
})();
