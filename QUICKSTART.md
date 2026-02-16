# 🚀 Guia de Início Rápido

## ⚡ Quick Start (5 minutos)

### 1. Pré-requisitos

- Node.js 18+
- PostgreSQL 14+

### 2. Clone e Instale

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/chamados-ti.git
cd chamados-ti

# Instalar backend
cd backend
npm install

# Instalar frontend (em outro terminal)
cd frontend
npm install
```

### 3. Configure o Banco

```sql
-- No PostgreSQL
CREATE DATABASE chamados_ti;

-- Execute o schema
\i database/schema.sql
```

### 4. Configure Variáveis de Ambiente

**Backend (.env):**

```env
DB_NAME=chamados_ti
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=sua-chave-secreta-minimo-32-caracteres
```

**Frontend (.env):**

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 5. Inicie os Servidores

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm start
```

### 6. Crie o Usuário Admin

```bash
cd backend
npm run migrate
npm run seed
```

Isso cria/atualiza:

- entidade padrão (multi-tenant)
- perfis base (Administrador, Gestor, Técnico, Solicitante, Auditor)
- usuário admin padrão
- vínculo do admin com perfil Administrador
- configurações iniciais por escopo

### 7. Faça Login

- URL: <http://localhost:3000/login>
- Usuário: `admin`
- Senha: `admin`

---

## 📚 Próximos Passos

1. ✅ **Configurar dados básicos**
   - Tipos de chamado
   - Status
   - Prioridades
   - Áreas de atendimento

2. ✅ **Criar usuários**
   - Técnicos
   - Solicitantes
   - Gestores

3. ✅ **Cadastrar clientes**
   - Empresa
   - Unidades
   - Departamentos

4. ✅ **Importar ativos**
   - Computadores
   - Impressoras
   - Equipamentos

5. ✅ **Configurar SLAs**
   - Definir tempos de resposta
   - Horários de atendimento
   - Feriados

---

## 🔧 Scripts Úteis

### Backend

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Executar migrations
npm run migrate

# Popular banco com dados de teste
npm run seed

# Testes
npm test
```

### Frontend

```bash
# Desenvolvimento
npm start

# Build para produção
npm run build

# Testes
npm test
```

---

## 📂 Estrutura de Pastas

```
chamados-ti/
├── backend/           # API Node.js + Express
│   ├── src/
│   │   ├── config/    # Configurações
│   │   ├── models/    # Modelos do banco
│   │   ├── modules/   # Módulos do sistema
│   │   └── server.js  # Entrada da aplicação
│   └── package.json
│
├── frontend/          # Interface React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
│
├── database/          # Scripts SQL
│   └── schema.sql
│
├── docs/              # Documentação
│   ├── API.md
│   ├── INSTALLATION.md
│   └── database-diagram.md
│
└── README.md
```

---

## 🎯 Funcionalidades Principais

### 🎫 Módulo de Chamados

- ✅ Abertura de chamados
- ✅ Gestão de filas
- ✅ Atribuição automática
- ✅ SLA com alertas
- ✅ Comentários e anexos
- ✅ Histórico completo
- ✅ Relatórios

### 📦 Módulo de Inventário

- ✅ Cadastro de ativos
- ✅ Controle de localização
- ✅ Histórico de movimentações
- ✅ Termos de responsabilidade
- ✅ Garantias
- ✅ Softwares e licenças

### 👥 Módulo de Clientes

- ✅ Multiempresa
- ✅ Unidades
- ✅ Departamentos
- ✅ Centros de custo

### ⚙ Módulo de Administração

- ✅ Usuários e perfis
- ✅ Permissões granulares
- ✅ Configurações do sistema
- ✅ Campos customizados
- ✅ Templates

---

## 🔐 Perfis de Usuário

| Perfil         | Nível | Permissões           |
| -------------- | ----- | -------------------- |
| Administrador  | 1     | Acesso total         |
| Gestor de Área | 2     | Gerencia sua área    |
| Técnico        | 3     | Atende chamados      |
| Solicitante    | 4     | Abre chamados        |
| Auditor        | 5     | Visualiza relatórios |

---

## 📊 Tecnologias

**Backend:**

- Node.js 18+
- Express 4
- PostgreSQL 14+
- Sequelize ORM
- JWT
- Winston (logs)

**Frontend:**

- React 18
- Material-UI (MUI)
- React Router
- Axios
- Zustand
- React Query

---

## 🐛 Solução de Problemas

### Porta já em uso

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
# Windows
sc query postgresql-x64-14

# Linux
sudo systemctl status postgresql
```

### Erro MODULE_NOT_FOUND

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Suporte

- 📧 **Email:** <suporte@chamados-ti.com>
- 💬 **GitHub Issues:** [Link](https://github.com/seu-usuario/chamados-ti/issues)
- 📚 **Documentação completa:** [docs/](./docs/)

---

## 📄 Licença

ISC License - Livre para uso comercial e pessoal

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## ⭐ Roadmap

- [ ] Notificações push
- [ ] App mobile
- [ ] Integração com Active Directory
- [ ] Chat em tempo real
- [ ] Dashboard avançado com BI
- [ ] Automações (baixa de ativos, fechamento automático)
- [ ] API GraphQL
- [ ] Webhooks
- [ ] Multi-idioma

---

**Desenvolvido com ❤️ para otimizar a gestão de TI**

**Versão:** 1.0.0  
**Data:** 13/02/2026
