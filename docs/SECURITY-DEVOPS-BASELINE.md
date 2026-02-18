# Security & DevOps Baseline — Chamados TI

## Resumo
Este documento compara o estado atual do projeto com um baseline de SaaS seguro e escalável e registra ações de melhoria.

## Status rápido

### Segurança Node.js
- ✅ `.env` fora do versionamento (`.gitignore`).
- ✅ `helmet()` habilitado.
- ✅ Rate limiting global e de login.
- ✅ Senhas com `bcryptjs`.
- ✅ RBAC com middleware de autorização.
- ✅ Auditoria de ações sensíveis em módulos críticos.
- ✅ Logger estruturado com `winston`.
- ⚠️ Refresh token com rotação ainda não implementado.
- ⚠️ Cookies `httpOnly/secure` não aplicados (auth atual usa Bearer token).
- ⚠️ Validação de entrada usa `express-validator`; sem schema central (Zod/Joi).

### DevOps / CI-CD
- ✅ CI com backend + frontend em `.github/workflows/ci.yml`.
- ✅ Release por tag em `.github/workflows/release-on-tag.yml`.
- ✅ Commitlint em PR.
- ✅ Pipeline dedicado de segurança em `.github/workflows/security.yml`:
  - `dependency-review` em Pull Requests;
  - `npm audit` backend/frontend com threshold de severidade alta;
  - análise estática com CodeQL.
- ✅ Dockerfile de backend com `npm ci --omit=dev`.
- ✅ `.dockerignore` no backend.
- ⚠️ Não há pipeline de deploy automatizado.
- ⚠️ DAST ativo ainda não implementado (SAST básico com CodeQL já ativo).

### Hardening aplicado nesta rodada
- ✅ Validação de baseline de segurança no startup do backend:
  - `JWT_SECRET` mínimo de 32 chars (bloqueia produção se inválido).
  - aviso quando `ENFORCE_HTTPS` está desabilitado em produção.
- ✅ Docker backend endurecido:
  - execução como usuário não-root;
  - `HEALTHCHECK` em `/health`.
- ✅ Automação de dependências com Dependabot:
  - npm backend/frontend e GitHub Actions (`.github/dependabot.yml`).
- ✅ Templates de variáveis por ambiente para backend:
  - `.env.example` (dev), `.env.staging.example`, `.env.production.example`.
- ✅ Guia operacional de secrets no GitHub:
  - `docs/GITHUB-SECRETS-ENVIRONMENTS.md`.

## Recomendações prioritárias (próximo sprint)
1. Implementar refresh token com rotação e revogação (tabela de sessão/token).
2. Definir política de segredo forte em todos ambientes (dev/stage/prod) com gestor de segredos.
3. Adicionar workflow de security audit no CI (`npm audit` com política por severidade).
4. Introduzir validação por schema (Zod/Joi) para payloads críticos.
5. Padronizar resposta e mascaramento de dados sensíveis em logs.

## Critério mínimo para produção
- `NODE_ENV=production`
- `JWT_SECRET` >= 32 chars
- `ENFORCE_HTTPS=true`
- rate limit habilitado
- backup e política de restauração de banco definida
- pipeline CI verde + revisões de dependência em dia
