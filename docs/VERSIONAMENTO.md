# Guia de Versionamento do Projeto

Este documento define o padrão oficial de versionamento, branches, commits e releases do sistema.

## 1) Estratégia de versão (SemVer)

Formato: MAJOR.MINOR.PATCH

- MAJOR: quebra de compatibilidade (rotas removidas, contrato alterado)
- MINOR: nova funcionalidade compatível
- PATCH: correção sem quebra de contrato

Exemplos:
- 1.2.0 = novo módulo sem quebrar API existente
- 1.2.3 = correção de bug de autenticação
- 2.0.0 = mudança incompatível em endpoints

## 2) Branching model

Branches fixas:
- main: sempre estável e pronta para produção

Branches de trabalho:
- feature/nome-curto
- fix/nome-curto
- hotfix/nome-curto
- chore/nome-curto
- docs/nome-curto

Fluxo:
1. Criar branch a partir de main
2. Desenvolver + abrir PR
3. Revisão e merge em main
4. Criar release/tag

## 3) Padrão de commits (Conventional Commits)

Formato:
- tipo(escopo opcional): descrição curta

Tipos principais:
- feat: nova funcionalidade
- fix: correção de bug
- refactor: refatoração sem alterar comportamento
- chore: tarefas de manutenção
- docs: documentação
- test: testes
- perf: otimização de performance
- build: build/dependências
- ci: pipeline/automação

Exemplos:
- feat(auth): adicionar refresh token por tenant
- fix(chamados): corrigir cálculo de prioridade
- docs(roadmap): atualizar plano do sprint 2

## 4) Política de Pull Request

Todo PR deve conter:
- objetivo claro
- impacto técnico
- evidência de teste
- impacto em banco/API
- checklist preenchido

Template de PR está em .github/pull_request_template.md.

## 4.1) Validação automática de commits

O repositório possui validação automática via GitHub Actions:

- Workflow: `.github/workflows/commitlint.yml`
- Configuração: `commitlint.config.cjs`

Regras principais:
- tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- tamanho máximo do header: 100 caracteres

Se o commit não seguir o padrão, o workflow falha e o PR não deve ser aprovado até ajuste.

## 5) Política de changelog

Arquivo oficial: CHANGELOG.md

Padrão recomendado por versão:
- Added
- Changed
- Fixed
- Security

Regras:
- toda release deve atualizar o changelog
- versão no changelog deve casar com a tag

## 6) Política de release

Recomendação:
- release por sprint (MINOR)
- PATCH sob demanda para correções
- MAJOR apenas com plano de migração

## 6.1) Cadência de versionamento (time)

Para este projeto, adotar:
- versionamento contínuo por modificação relevante (PATCH)
- fechamento formal de sprint com versão MINOR + tag + release

Exemplo prático:
- correção pontual no dia a dia: `1.2.0` -> `1.2.1`
- novo bloco de sprint concluído: `1.2.x` -> `1.3.0`

Benefícios:
- rastreabilidade fina por mudança
- histórico claro de entregas por sprint
- rollback mais simples em produção/homologação

Checklist de release:
1. main está verde
2. changelog atualizado
3. versão definida
4. tag criada (vX.Y.Z)
5. release publicada

## 7) Tags

Formato obrigatório:
- v1.2.0
- v1.2.1

Comandos úteis:
- git tag v1.2.0
- git push origin v1.2.0

## 8) Hotfix

Fluxo de urgência:
1. criar branch hotfix/* a partir de main
2. aplicar correção mínima
3. PR e merge rápido
4. gerar versão PATCH
5. publicar tag

## 9) Governança para este projeto

Padrão inicial sugerido:
- baseline atual: 1.1.0
- próxima release funcional: 1.2.0
- primeira patch de estabilização: 1.2.1

## 10) Critérios de pronto para merge

- sem erro crítico de execução
- login e rotas principais validadas
- changelog atualizado quando houver release
- aderência ao padrão de commit e PR
