# GitHub Secrets & Environments

Este guia padroniza a configuração de segredos para CI/CD e deploy do projeto.

## Estratégia recomendada

- Use **Repository Secrets** para segredos globais (iguais para todos os ambientes).
- Use **Environment Secrets** para segredos por ambiente (`dev`, `staging`, `production`).
- Proteja `production` com **required reviewers** e **branch rules**.

## Repository Secrets (globais)

Use quando o mesmo valor é usado em todos os ambientes.

- `NPM_TOKEN` (se necessário para registry privado)
- `SNYK_TOKEN` (opcional, caso adote Snyk)

## Environment Secrets (por ambiente)

Crie os environments no GitHub: `dev`, `staging`, `production`.

Exemplos de secrets por ambiente:

- `APP_BASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`

## Variáveis de ambiente por estágio

- `backend/.env.example` → desenvolvimento local
- `backend/.env.staging.example` → staging
- `backend/.env.production.example` → produção

## Checklist de segurança para secrets

- Nunca commitar `.env` real no repositório.
- Rotacionar segredos periodicamente.
- Usar chaves JWT com no mínimo 32 caracteres.
- Evitar reutilização da mesma senha/chave entre ambientes.
- Revogar segredos imediatamente após suspeita de exposição.

## Como configurar no GitHub (passo a passo)

1. Acesse `Settings` do repositório.
2. Entre em `Secrets and variables`.
3. Configure `Actions` → `Repository secrets` para segredos globais.
4. Em `Environments`, crie `dev`, `staging`, `production`.
5. Em cada environment, adicione `Environment secrets` específicos.
6. Em `production`, habilite aprovadores obrigatórios.

## Observação importante

A configuração de `Repository/Environment secrets` não é feita por arquivo versionado; ela deve ser realizada na interface do GitHub por motivos de segurança.
