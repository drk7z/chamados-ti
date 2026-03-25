require('dotenv').config();
const http = require('http');

function post(path, body, token) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: 'localhost', port: 3001, method: 'POST', path,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    };
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', e => resolve({ status: 0, body: e.message }));
    r.write(data);
    r.end();
  });
}

(async () => {
  const login = await post('/api/v1/auth/login', { email: 'admin@ti.com', senha: 'admin' });
  const token = JSON.parse(login.body).token;
  console.log('Token OK:', !!token);

  const SOFTWARE_ID = 'd40df612-05a1-4c98-8ad8-007f993ca81e';
  const TIPO_LICENCA_ID = '74ac3872-9307-4cce-a50d-569c10802e3a';

  // Exact replica of what the frontend form sends (including id: null)
  const formPayload = {
    id: null,
    software_id: SOFTWARE_ID,
    tipo_licenca_id: TIPO_LICENCA_ID,
    quantidade_licencas: 1,
    em_uso: 0,
    data_aquisicao: null,
    data_expiracao: null,
    valor: null,
    fornecedor: null,
    observacoes: null,
    ativo: true
  };
  const r1 = await post('/api/v1/inventario/licencas', formPayload, token);
  console.log('with id:null:', r1.status, r1.body.substring(0, 100));

  // With empty strings like the form might send
  const formPayload2 = {
    software_id: SOFTWARE_ID,
    tipo_licenca_id: TIPO_LICENCA_ID,
    quantidade_licencas: 1,
    em_uso: 0,
    data_aquisicao: '',
    data_expiracao: '',
    valor: '',
    fornecedor: '',
    observacoes: '',
    ativo: true
  };
  const r2 = await post('/api/v1/inventario/licencas', formPayload2, token);
  console.log('with empty strings:', r2.status, r2.body.substring(0, 200));
})();
