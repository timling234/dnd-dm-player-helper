Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host $msg }
function Write-Warn([string]$msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Err([string]$msg) { Write-Host $msg -ForegroundColor Red }

function Find-CloudflaredExe {
  # 1) PATH
  $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($cmd -and $cmd.Source) { return $cmd.Source }

  # 2) Common install locations
  $candidates = @(
    "C:\Program Files\Cloudflare\cloudflared\cloudflared.exe",
    "C:\Program Files (x86)\Cloudflare\cloudflared\cloudflared.exe",
    (Join-Path $env:LOCALAPPDATA "Programs\cloudflared\cloudflared.exe")
  )
  foreach ($p in $candidates) {
    if ($p -and (Test-Path -LiteralPath $p)) { return $p }
  }

  # 3) Limited recursive search (stop after first match)
  $roots = @(
    "C:\Program Files",
    (Join-Path $env:LOCALAPPDATA "Programs")
  )
  foreach ($root in $roots) {
    if (-not (Test-Path -LiteralPath $root)) { continue }

    try {
      $topDirs = Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue
    } catch { $topDirs = @() }

    foreach ($d in $topDirs) {
      try {
        $match = Get-ChildItem -LiteralPath $d.FullName -Recurse -File -Filter "cloudflared.exe" -ErrorAction SilentlyContinue |
          Select-Object -First 1
        if ($match) { return $match.FullName }
      } catch {
        # ignore access errors
      }
    }
  }

  return $null
}

$exe = Find-CloudflaredExe
if (-not $exe) {
  Write-Err "cloudflared.exe not found. Please reinstall via winget or download from Cloudflare, then re-run this script."
  exit 1
}

Write-Info "Found cloudflared at: $exe"
Write-Info "Verifying..."
& $exe --version

$dir = Split-Path -Parent $exe
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (-not $userPath) { $userPath = "" }

function PathContains([string]$pathList, [string]$needle) {
  $parts = $pathList -split ";" | Where-Object { $_ -and $_.Trim() -ne "" }
  foreach ($p in $parts) {
    if ($p.Trim().ToLowerInvariant() -eq $needle.Trim().ToLowerInvariant()) { return $true }
  }
  return $false
}

if (PathContains -pathList $userPath -needle $dir) {
  Write-Info "User PATH already contains: $dir"
} else {
  $newPath = if ($userPath.Trim() -eq "") { $dir } else { "$userPath;$dir" }
  [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
  Write-Info "Added to USER PATH: $dir"
}

Write-Info "Done. Please open a NEW PowerShell and run: cloudflared --version"


