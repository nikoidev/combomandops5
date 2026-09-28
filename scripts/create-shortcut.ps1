# Crea el acceso directo "Combo Mando PS5" en el escritorio.
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$desktop = [Environment]::GetFolderPath('Desktop')
$link = Join-Path $desktop 'Combo Mando PS5.lnk'

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($link)
$shortcut.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$root\scripts\launch.ps1`""
$shortcut.WorkingDirectory = "$root"
$shortcut.IconLocation = "$root\public\favicon.ico,0"
$shortcut.Description = 'Crea y practica tus combos de BDO con el mando de PS5'
$shortcut.WindowStyle = 7 # terminal minimizada
$shortcut.Save()

Write-Host "Acceso directo creado: $link"
