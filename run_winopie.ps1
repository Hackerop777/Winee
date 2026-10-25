# WINEE / WinOpie Native Windows 11 Radial Action Utility Launcher
# Strictly configured for D: drive execution

$ErrorActionPreference = "Stop"

$env:RUSTUP_HOME = "D:\.rustup"
$env:CARGO_HOME = "D:\.cargo"
$env:PATH = "D:\.cargo\bin;" + $env:PATH
$env:CARGO_TARGET_DIR = "D:\Nihal\Winopie\target"
$env:WEBVIEW2_USER_DATA_FOLDER = "D:\Nihal\Winopie\.webview_data"

$exePath = "D:\Nihal\Winopie\target\release\win-opie.exe"
if (-not (Test-Path $exePath)) {
    $exePath = "D:\Nihal\Winopie\target\debug\win-opie.exe"
}

# Stop any older instance gracefully
Get-Process -Name "win-opie" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Launching WINEE..." -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Primary Activation Shortcut   : [Ctrl + Space]" -ForegroundColor Yellow
Write-Host "Secondary Activation Shortcut : [Alt + O]" -ForegroundColor Yellow
Write-Host "Mouse Activation              : [Middle Mouse Button / Wheel Click]" -ForegroundColor Yellow
Write-Host "System Tray Activation        : [Left-Click WinOpie Tray Icon]" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

Start-Process $exePath
