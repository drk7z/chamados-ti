# Validação DevOps & Cybersecurity — Baseline SaaS

Data: 2026-02-16

## Escopo Avaliado

- Backend Node.js/Express
- Frontend React
- Pipelines GitHub Actions
- Containerização

## Status por Controle

### 1) Node.js Security Checklist

- Environment Variables: **PARCIAL**
  - OK: `.env` está no `.gitignore`.
  - OK: uso de `process.env` no backend.
  - Ajustado: adicionadas variáveis `FRONTEND_URL`, `ENFORCE_HTTPS`, limites dedicados de auth em `backend/.env.example`.
  - Gap: falta política formal de segredo por ambiente no repositório (GitHub Environments/Secrets documentado).

- Authentication: **PARCIAL**
  - OK: JWT com expiração.
  - Ajustado: proteção dedicada de brute force em `/api/auth/login`.
  - Gap: rotação de refresh token ainda não implementada de forma stateful.
  - Gap: auth ainda baseada em bearer token; cookies `httpOnly/secure` não aplicados.

- Password Security: **OK (com observação)**
  - OK: bcrypt em uso com 10 rounds.
  - OK: senha não é logada.
  - Ajustado: validação de complexidade na troca de senha.

- Authorization: **OK**
  - OK: RBAC com middleware.
  - OK: auditoria de ações sensíveis nos módulos críticos.

- Input Validation: **PARCIAL**
  - Ajustado: validação robusta de entrada no módulo de auth (`login` e `alterar-senha`).
  - Gap: padronizar validação em demais módulos críticos.

- Rate Limiting: **OK**
  - OK: rate limit global de API.
  - Ajustado: rate limit específico de login.

- HTTP Security: **OK (com observação)**
  - OK: `helmet()` habilitado.
  - Ajustado: enforcement opcional de HTTPS em produção (`ENFORCE_HTTPS=true`).

- Logging: **OK (com observação)**
  - OK: Winston estruturado.
  - Gap: política de mascaramento de PII/segredos ainda pode ser reforçada.

- Database: **PARCIAL**
  - OK: scripts de migração/seed existentes.
  - Gap: backup, restrição de rede e least privilege são controles de infraestrutura (fora do código atual).

### 2) DevOps Pipeline (CI/CD)

- Status: **IMPLEMENTADO**
  - Arquivo adicionado: `.github/workflows/ci.yml`
  - Jobs separados para backend/frontend com install/build/test e lint opcional.

### 3) Docker Production Baseline

- Status: **IMPLEMENTADO (backend)**
  - Arquivos adicionados:
    - `backend/Dockerfile`
    - `backend/.dockerignore`

### 4) Arquitetura Segura SaaS

- Status: **PARCIAL**
  - Presente: API, camada de serviço (modular), banco PostgreSQL, RBAC, auditoria, CI.
  - Pendente recomendado: Redis (cache), reverse proxy explícito com TLS termination, monitoramento ativo (APM + métricas + alertas).

## Mudanças Aplicadas nesta Validação

- Segurança
  - `backend/src/modules/auth/auth.validators.js` (novo)
  - `backend/src/modules/auth/auth.routes.js` (rate limit + validação)
  - `backend/src/server.js` (HTTPS enforcement opcional em produção)
  - `backend/.env.example` (variáveis de segurança/cors/rate-limit auth)

- DevOps
  - `.github/workflows/ci.yml` (novo)
  - `backend/Dockerfile` (novo)
  - `backend/.dockerignore` (novo)

## Próximas Prioridades (Sprint de Segurança)

1. Implementar refresh token com rotação e revogação via tabela `sessions`.
2. Migrar autenticação web para cookie `httpOnly` + `secure` + `sameSite` em produção.
3. Expandir validação de entrada para clientes/ocorrências/inventário (schema centralizado).
4. Adicionar varredura SAST/dependências no CI (CodeQL + npm audit).
5. Definir baseline de monitoramento e alertas (health, erros 5xx, latência, auth failures).
