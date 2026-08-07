# Seeds the inventory_system database from backend/sql/*.sql
# Usage: .\scripts\setup-db.ps1 -Password "your_mysql_root_password"

param(
    [Parameter(Mandatory = $true)]
    [string]$Password
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$sqlDir = Join-Path $root "sql"
$envFile = Join-Path $root ".env"

Write-Host "Testing MySQL connection..."
& mysql -u root "-p$Password" -e "SELECT 1" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Could not connect to MySQL as root. Check that MySQL is running and the password is correct."
}

Write-Host "Running schema..."
Get-Content (Join-Path $sqlDir "01_schema.sql") -Raw | & mysql -u root "-p$Password"
if ($LASTEXITCODE -ne 0) { Write-Error "01_schema.sql failed" }

Write-Host "Running triggers and stored procedures..."
Get-Content (Join-Path $sqlDir "02_triggers.sql") -Raw | & mysql -u root "-p$Password"
if ($LASTEXITCODE -ne 0) {
    Write-Warning "02_triggers.sql failed via pipe. If DELIMITER errors occur, run this file in MySQL Workbench instead."
}

Write-Host "Running seed data..."
Get-Content (Join-Path $sqlDir "03_seed.sql") -Raw | & mysql -u root "-p$Password"
if ($LASTEXITCODE -ne 0) { Write-Error "03_seed.sql failed" }

Write-Host "Updating backend/.env..."
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $root ".env.example") $envFile
}
$content = Get-Content $envFile -Raw
$content = $content -replace 'DB_PASSWORD=.*', "DB_PASSWORD=$Password"
Set-Content $envFile $content -NoNewline

Write-Host "Verifying seed data..."
$count = & mysql -u root "-p$Password" -N -e "USE inventory_system; SELECT COUNT(*) FROM products;"
Write-Host "Done. Products in database: $count"
Write-Host "Restart the backend (npm run dev) if it is already running."
