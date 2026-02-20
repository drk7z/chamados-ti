# Smoke Checks — API Core

Checklist rápido para validação funcional após mudanças de backend.

## Pré-condição
- Backend em execução na porta `3001`
- Usuário admin válido (`admin` / `admin`)

## Script PowerShell (Windows)

```powershell
$body = @{ email='admin'; senha='admin' } | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -ContentType 'application/json' -Body $body
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }

Invoke-WebRequest -Uri 'http://localhost:3001/api/ocorrencias' -Headers $headers -SkipHttpErrorCheck
Invoke-WebRequest -Uri 'http://localhost:3001/api/ocorrencias/metricas/sla' -Headers $headers -SkipHttpErrorCheck
Invoke-WebRequest -Uri 'http://localhost:3001/api/admin/logs?limit=5' -Headers $headers -SkipHttpErrorCheck
Invoke-WebRequest -Uri 'http://localhost:3001/api/admin/entidades' -Headers $headers -SkipHttpErrorCheck
Invoke-WebRequest -Uri 'http://localhost:3001/api/clientes' -Headers $headers -SkipHttpErrorCheck
Invoke-WebRequest -Uri 'http://localhost:3001/api/inventario' -Headers $headers -SkipHttpErrorCheck
```

## Resultado esperado
- Todos os endpoints acima devem retornar `200`.
- Se algum endpoint retornar `401/403`, validar token/permissão/tenant.
- Se retornar `500`, consultar logs no endpoint `/api/admin/logs` e no console backend.

## Validação extra de CRUD clientes
1. Criar cliente temporário
2. Atualizar cliente temporário
3. Excluir cliente temporário
4. Confirmar registros no `/api/admin/logs?modulo=clientes`

## Validação de estrutura organizacional (Sprint 2)
1. Criar cliente
2. Criar unidade em `/api/clientes/:clienteId/unidades`
3. Criar departamento em `/api/clientes/unidades/:unidadeId/departamentos`
4. Criar centro de custo em `/api/clientes/departamentos/:departamentoId/centros-custo`
5. Validar listagens e atualizações
6. Excluir em cadeia (centro de custo -> departamento -> unidade -> cliente)
7. Confirmar logs em `/api/admin/logs?modulo=clientes`

## Validação de ciclo de chamados + SLA avançado (Sprint 3)
1. Criar chamado em `/api/ocorrencias`
2. Atribuir técnico em `/api/ocorrencias/:id/atribuir`
3. Transferir área em `/api/ocorrencias/:id/transferir`
4. Pausar chamado em `/api/ocorrencias/:id/pausar` com `motivo`
5. Retomar chamado em `/api/ocorrencias/:id/retomar`
6. Adicionar comentário em `/api/ocorrencias/:id/comentar`
7. Resolver chamado em `/api/ocorrencias/:id/resolver` com `solucao`
8. Fechar chamado em `/api/ocorrencias/:id/fechar`
9. Consultar histórico em `/api/ocorrencias/:id/historico`
10. Consultar timeline em `/api/ocorrencias/:id/sla-eventos`
11. Validar auditoria em `/api/admin/logs?modulo=ocorrencias`

## Cenários de erro esperados (operações de estado)
- `400` para payload obrigatório ausente (`tecnico_id`, `area_id`, `comentario`, `motivo`, `solucao`).
- `404` para chamado inexistente.
- `409` para transição inválida de estado (ex.: fechar já fechado, retomar não pausado).

## Validação administrativa mínima (Sprint 4)
1. Listar áreas em `GET /api/admin/areas`
2. Criar área em `POST /api/admin/areas`
3. Atualizar área em `PUT /api/admin/areas/:id`
4. Inativar área em `DELETE /api/admin/areas/:id`
5. Listar grupos em `GET /api/admin/grupos-tecnicos`
6. Criar grupo em `POST /api/admin/grupos-tecnicos`
7. Vincular usuário em `POST /api/admin/grupos-tecnicos/:id/usuarios`
8. Consultar logs em `GET /api/admin/logs?limit=20`
9. Validar trilha de auditoria por módulo:
	- `GET /api/admin/logs?modulo=admin`
	- `GET /api/admin/logs?entidade=area_atendimento`
	- `GET /api/admin/logs?entidade=grupo_tecnico`

## Validação inventário operacional (Sprint 5)
1. Consultar catálogos de inventário:
	- `GET /api/inventario/config/tipos`
	- `GET /api/inventario/config/status`
	- `GET /api/inventario/config/categorias`
	- `GET /api/inventario/config/responsaveis`
	- `GET /api/inventario/config/unidades`
2. Criar ativo mínimo em `POST /api/inventario` com `codigo`, `nome`, `tipo_id`, `status_id`
3. Movimentar ativo em `POST /api/inventario/:id/movimentar` com `localizacao_nova_id` e `motivo`
4. Consultar histórico em `GET /api/inventario/:id/historico`
5. Validar auditoria em `GET /api/admin/logs?modulo=inventario`

## Validação catálogo de software (Sprint 6)
1. Consultar catálogos:
	- `GET /api/inventario/software/config/categorias`
	- `GET /api/inventario/software/config/tipos-licenca`
2. Criar software em `POST /api/inventario/software`
3. Atualizar software em `PUT /api/inventario/software/:id`
4. Inativar software em `DELETE /api/inventario/software/:id`
5. Validar listagem em `GET /api/inventario/software`
6. Validar auditoria em `GET /api/admin/logs?modulo=inventario&entidade=software`

## Última execução validada
- Data: `2026-02-20`
- Status: `Execução parcial concluída (admin Sprint 4 + inventário Sprint 5 + catálogo software Sprint 6 US-01); pendente execução completa dos cenários Sprint 3`
- Endpoints validados anteriormente: `entidades`, `clientes (list/create/update/delete)`, `inventario (list)`, `admin logs`.
- Escopo validado nesta execução: `auth/login`, `admin/areas`, `admin/grupos-tecnicos`, `admin/logs`, `inventario/config/*`, `inventario create/movimentar/historico`, `inventario/software CRUD`.
- Escopo pendente para validação completa: `ocorrencias (atribuir/transferir/pausar/retomar/comentar/resolver/fechar)`, `historico`, `sla-eventos`.
