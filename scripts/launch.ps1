# Abre Combo Mando PS5 como una aplicación de escritorio.
# Levanta el servidor local, abre una ventana de Edge/Chrome en modo app y,
# al cerrar esa ventana, apaga el servidor y cierra esta terminal.

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'Combo Mando PS5'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

$port = 4173
$url = "http://localhost:$port/"
$profileDir = Join-Path $env:LOCALAPPDATA 'combomandops5\browser'

function Get-AppWindows {
  Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe' OR Name = 'chrome.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profileDir) }
}

function Find-Browser {
  $candidates = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  )
  $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

$browser = Find-Browser
if (-not $browser) {
  Write-Host 'No se encontró Microsoft Edge ni Google Chrome.' -ForegroundColor Red
  Read-Host 'Pulsa Enter para salir'
  exit 1
}

# Si la app ya está abierta, solo la traemos al frente
if (Get-AppWindows) {
  Start-Process $browser "--user-data-dir=`"$profileDir`" --app=$url"
  exit 0
}

Write-Host 'Combo Mando PS5' -ForegroundColor Cyan

if (-not (Test-Path 'node_modules')) {
  Write-Host 'Instalando dependencias (solo la primera vez)...'
  npm ci
}

# Recompilar si hay cambios más nuevos que el build
$built = if (Test-Path 'dist\index.html') { (Get-Item 'dist\index.html').LastWriteTime } else { [datetime]::MinValue }
$newest = Get-ChildItem 'src', 'index.html', 'vite.config.ts', 'package.json' -Recurse -File |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($newest.LastWriteTime -gt $built) {
  Write-Host 'Preparando la aplicación...'
  npm run build | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'Falló la compilación. Ejecuta "npm run build" para ver el error.' -ForegroundColor Red
    Read-Host 'Pulsa Enter para salir'
    exit 1
  }
}

$server = Start-Process node -ArgumentList 'node_modules/vite/bin/vite.js', 'preview', '--port', $port, '--strictPort' `
  -WindowStyle Hidden -PassThru

try {
  # Esperar a que el servidor responda
  $ready = $false
  for ($i = 0; $i -lt 40 -and -not $ready; $i++) {
    Start-Sleep -Milliseconds 500
    try {
      Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2 | Out-Null
      $ready = $true
    } catch { }
  }
  if (-not $ready) { throw "El servidor no respondió en $url" }

  Start-Process $browser "--user-data-dir=`"$profileDir`" --app=$url --window-size=1280,860 --no-first-run"
  Write-Host 'Aplicación abierta. Cierra su ventana para salir.' -ForegroundColor Green

  # Esperar a que el usuario cierre la ventana de la app
  Start-Sleep -Seconds 3
  while (Get-AppWindows) { Start-Sleep -Seconds 1 }
}
catch {
  Write-Host $_ -ForegroundColor Red
  Read-Host 'Pulsa Enter para salir'
}
finally {
  if ($server -and -not $server.HasExited) {
    taskkill /T /F /PID $server.Id | Out-Null
  }
}
