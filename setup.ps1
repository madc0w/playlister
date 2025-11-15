# Quick Setup Script for Windows PowerShell

Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "`nTo start development server, run:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host "`nTo build for production, run:" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor Cyan
Write-Host "  npm start" -ForegroundColor Cyan
