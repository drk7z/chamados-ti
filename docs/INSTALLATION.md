# 📘 Guia de Instalação Completo

## Pré-requisitos

Certifique-se de ter instalado:

- ✅ Node.js 18+ ([Download](https://nodejs.org/))
- ✅ PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- ✅ Git ([Download](https://git-scm.com/))
- ✅ Editor de código (VS Code recomendado)

## Passo 1: Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/chamados-ti.git
cd chamados-ti
```

## Passo 2: Configurar o Banco de Dados

### No Windows (PowerShell como Admin):

1. **Abrir o PostgreSQL:**
```powershell
psql -U postgres
```

2. **Criar o banco de dados:**
```sql
CREATE DATABASE chamados_ti;
\q
```

3. **Executar o schema:**
```powershell
psql -U postgres -d chamados_ti -f database\schema.sql
```

### No Linux/Mac:

```bash
sudo -u postgres psql
CREATE DATABASE chamados_ti;
\q

psql -U postgres -d chamados_ti -f database/schema.sql
```

## Passo 3: Configurar o Backend

```bash
cd backend
npm install
```

### Criar arquivo .env:

```bash
cp .env.example .env
```

Editar o arquivo `.env` com seus dados:

```env
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=chamados_ti
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_AQUI

JWT_SECRET=chave-secreta-super-forte-aqui-min-32-caracteres

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app

TIMEZONE=America/Sao_Paulo
```

### Testar o backend:

```bash
npm run dev
```

Deve aparecer:
```
🚀 Servidor rodando na porta 3001
📦 Conexão com banco de dados estabelecida
```

## Passo 4: Configurar o Frontend

Abrir novo terminal:

```bash
cd frontend
npm install
```

### Criar arquivo .env:

```bash
# No Windows
echo REACT_APP_API_URL=http://localhost:3001/api > .env

# No Linux/Mac
echo "REACT_APP_API_URL=http://localhost:3001/api" > .env
```

### Iniciar o frontend:

```bash
npm start
```

Deve abrir automaticamente em: http://localhost:3000

## Passo 5: Criar Usuário Administrador

Execute os scripts automáticos:

```bash
cd backend
npm run migrate
npm run seed
```

Os scripts acima preparam automaticamente:
- colunas e FKs multi-tenant essenciais
- entidade padrão
- perfis base do sistema
- usuário admin e vínculo com perfil Administrador
- configurações iniciais por tenant/global

## Passo 6: Fazer Login

1. Acesse: http://localhost:3000/login
2. Usuário: `admin`
3. Senha: `admin`

## Problemas Comuns

### Erro de conexão com banco

**Solução:**
- Verificar se o PostgreSQL está rodando
- Conferir usuário e senha no .env
- Testar conexão: `psql -U postgres -h localhost`

### Porta 3001 já em uso

**Solução:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <número_do_processo> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Erro "MODULE_NOT_FOUND"

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro de CORS

**Solução:**
- Verificar se o frontend está configurado como proxy no package.json
- Conferir origem permitida no backend (src/server.js)

## Verificação de Instalação

### ✅ Checklist Final

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados `chamados_ti` criado
- [ ] Tabelas criadas (schema.sql executado)
- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 3000
- [ ] Usuário admin criado
- [ ] Login funcionando

### Teste de API

```bash
# Testar health check
curl http://localhost:3001/health

# Deve retornar:
# {"status":"ok","timestamp":"...","version":"v1"}
```

## Próximos Passos

Após a instalação bem-sucedida:

1. [Configurar dados iniciais](DATA_SETUP.md)
2. [Conhecer a estrutura](ARCHITECTURE.md)
3. [Criar tipos de chamados](ADMIN_GUIDE.md)
4. [Configurar SLAs](SLA_GUIDE.md)
5. [Importar ativos](INVENTORY_GUIDE.md)

## Suporte

Problemas na instalação?
- 📧 Email: suporte@chamados-ti.com
- 💬 Issues: [GitHub Issues](https://github.com/seu-usuario/chamados-ti/issues)
- 📚 Wiki: [Documentação completa](https://github.com/seu-usuario/chamados-ti/wiki)
