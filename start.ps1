# SupportAI - Docker start script
Set-Location $PSScriptRoot

Write-Host "Starting SupportAI with Docker..." -ForegroundColor Cyan

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker Desktop is not running." -ForegroundColor Red
    Write-Host "1. Open Docker Desktop from Start menu"
    Write-Host "2. Wait until it says 'Running'"
    Write-Host "3. Run this script again"
    exit 1
}

docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "App running:" -ForegroundColor Green
    Write-Host "  Frontend: http://localhost:5173"
    Write-Host "  Backend:  http://localhost:3001/api/health"
    Write-Host "  Login:    agent1@aisupport.com / password123"
}
