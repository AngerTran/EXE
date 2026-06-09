# Chạy BE + FE cùng lúc (một terminal)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

$nodeDir = "C:\Program Files\nodejs"
$npm = Join-Path $nodeDir "npm.cmd"
if (Test-Path $npm) {
    $env:Path = "$nodeDir;$env:Path"
}

Set-Location $root

if (-not (Test-Path "node_modules")) {
    Write-Host "Dang npm install (root)..." -ForegroundColor Cyan
    npm install
}

$feDir = Join-Path $root "FE\AssetServiceInterfaceDesign"
if (-not (Test-Path (Join-Path $feDir "node_modules"))) {
    Write-Host "Dang npm install (FE)..." -ForegroundColor Cyan
    npm install --prefix $feDir
}

if (-not (Test-Path (Join-Path $feDir ".env"))) {
    Copy-Item (Join-Path $feDir ".env.example") (Join-Path $feDir ".env") -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "BE: http://localhost:5180/swagger" -ForegroundColor Cyan
Write-Host "FE: http://localhost:5173" -ForegroundColor Magenta
Write-Host "Nhan Ctrl+C de dung ca hai." -ForegroundColor DarkGray
Write-Host ""

npm run dev
