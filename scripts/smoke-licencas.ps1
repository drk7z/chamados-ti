$ErrorActionPreference = 'Stop'

$loginBody = @{ email='admin@chamados-ti.com'; senha='admin' } | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -ContentType 'application/json' -Body $loginBody
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }

$tiposLicenca = Invoke-RestMethod -Uri 'http://localhost:3001/api/inventario/software/config/tipos-licenca' -Headers $headers -Method Get
$tipo = $tiposLicenca | Select-Object -First 1
$softwaresResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/inventario/software?page=1&limit=1&ativo=true' -Headers $headers -Method Get
$software = $softwaresResp.softwares | Select-Object -First 1

if (-not $software -or -not $tipo) {
  throw 'faltou software ativo ou tipo_licenca para smoke'
}

$createBody = @{
  software_id = $software.id
  tipo_licenca_id = $tipo.id
  quantidade_licencas = 10
  em_uso = 2
  data_aquisicao = '2026-01-01'
  data_expiracao = '2026-12-31'
  fornecedor = 'Fornecedor Smoke'
  observacoes = 'Criado por smoke check'
  ativo = $true
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri 'http://localhost:3001/api/inventario/licencas' -Headers $headers -Method Post -ContentType 'application/json' -Body $createBody
$licId = $created.id

$updateBody = @{ em_uso = 3; observacoes = 'Atualizado por smoke check' } | ConvertTo-Json
$updated = Invoke-RestMethod -Uri "http://localhost:3001/api/inventario/licencas/$licId" -Headers $headers -Method Put -ContentType 'application/json' -Body $updateBody

$list = Invoke-RestMethod -Uri 'http://localhost:3001/api/inventario/licencas?page=1&limit=10&ativo=true' -Headers $headers -Method Get
$expira = Invoke-RestMethod -Uri 'http://localhost:3001/api/inventario/licencas/proximas-expiracao?dias=365' -Headers $headers -Method Get

$null = Invoke-RestMethod -Uri "http://localhost:3001/api/inventario/licencas/$licId" -Headers $headers -Method Delete

Write-Output "CREATE_OK:$licId"
Write-Output "UPDATE_OK:$($updated.em_uso)"
Write-Output "LIST_OK:$($list.licencas.Count)"
Write-Output "EXPIRACAO_OK:$($expira.Count)"
Write-Output "DELETE_OK:$licId"
