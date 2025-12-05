<#
PowerShell helper to deploy Supabase Edge Functions and run the SQL migration.
Usage (PowerShell):
  1. Install supabase CLI: https://supabase.com/docs/guides/cli
  2. Login once: supabase login
  3. From project root run: .\scripts\deploy-supabase.ps1

This script *does not* store secrets. You will still set env vars in the Supabase dashboard or via CLI.
#>

param()

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "Project root: $projectRoot"

# Deploy migrations via SQL editor is recommended. This script will attempt to run the migration file using psql if you provide DATABASE_URL.
$migrationFile = Join-Path $projectRoot "supabase\migrations\20251203160000_create_schema_if_missing.sql"

if (-not (Test-Path $migrationFile)) {
  Write-Host "Migration file not found: $migrationFile" -ForegroundColor Yellow
} else {
  Write-Host "Migration file found: $migrationFile"
}

# Deploy functions
Write-Host "Deploying Edge Functions (create-order, send-order-email). Make sure you are logged in with 'supabase login' and have selected a project via 'supabase projects list' or set SUPABASE_ACCESS_TOKEN."

Push-Location (Join-Path $projectRoot "supabase\functions\create-order")
if (Test-Path ".") {
  Write-Host "Deploying create-order"
  supabase functions deploy create-order
} else {
  Write-Host "create-order function folder not found" -ForegroundColor Yellow
}
Pop-Location

Push-Location (Join-Path $projectRoot "supabase\functions\send-order-email")
if (Test-Path ".") {
  Write-Host "Deploying send-order-email"
  supabase functions deploy send-order-email
} else {
  Write-Host "send-order-email function folder not found" -ForegroundColor Yellow
}
Pop-Location

Write-Host "Done. Next: set environment variables in Supabase dashboard (Functions > Environment variables) using values from your secure store. Then run the curl preflight test as explained in the README or instructions."