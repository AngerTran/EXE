# Chạy FE khi terminal chưa nhận "npm" (PATH chưa refresh sau cài Node.js)
$nodeDir = "C:\Program Files\nodejs"
$npm = Join-Path $nodeDir "npm.cmd"

if (-not (Test-Path $npm)) {
    Write-Host "Chua co Node.js. Cai bang lenh:" -ForegroundColor Red
    Write-Host "  winget install OpenJS.NodeJS.LTS" -ForegroundColor Yellow
    exit 1
}

$env:Path = "$nodeDir;$env:Path"
Set-Location $PSScriptRoot

if (-not (Test-Path "node_modules")) {
    Write-Host "Dang npm install..." -ForegroundColor Cyan
    & $npm install
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
}

Write-Host "FE: http://localhost:5173" -ForegroundColor Green
& $npm run dev
