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

## Última execução validada
- Data: `2026-02-16`
- Status: `OK`
- Endpoints validados: `entidades`, `clientes (list/create/update/delete)`, `inventario (list)`, `admin logs`.
- Endpoints validados: `clientes organizacional (unidades/departamentos/centros-custo)`.
