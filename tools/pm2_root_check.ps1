param()

Write-Host "Current directory:" (Get-Location).Path

$root = Get-Location

$serverPath = Join-Path $root "server"
$webPath = Join-Path $root "web"
$ecosystemPath = Join-Path $root "ecosystem.config.cjs"

$ok = $true

if (-not (Test-Path -LiteralPath $serverPath)) {
  Write-Host "Missing 'server' directory."
  $ok = $false
}

if (-not (Test-Path -LiteralPath $webPath)) {
  Write-Host "Missing 'web' directory."
  $ok = $false
}

if (-not (Test-Path -LiteralPath $ecosystemPath)) {
  Write-Host "Missing 'ecosystem.config.cjs' file."
  $ok = $false
}

if (-not $ok) {
  Write-Host "You are not in the project root."
  exit 1
}

Write-Host "OK: project root detected."


