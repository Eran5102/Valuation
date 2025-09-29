# PowerShell script to switch between test and production environments

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("test", "production", "status")]
    [string]$Environment
)

$envLocal = ".env.local"
$envTest = ".env.test.local"
$envProd = ".env.production.local"

function Show-Status {
    Write-Host "`n📊 Current Environment Status:" -ForegroundColor Cyan

    if (Test-Path $envLocal) {
        $content = Get-Content $envLocal -Raw
        if ($content -match "NEXT_PUBLIC_ENVIRONMENT=test") {
            Write-Host "✅ Currently using: TEST environment" -ForegroundColor Green
        } else {
            Write-Host "✅ Currently using: PRODUCTION environment" -ForegroundColor Yellow
        }

        if ($content -match "NEXT_PUBLIC_SUPABASE_URL=([^\s]+)") {
            $url = $matches[1]
            Write-Host "📍 Supabase URL: $url" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ No .env.local file found!" -ForegroundColor Red
    }

    Write-Host "`n📁 Available environment files:" -ForegroundColor Cyan
    if (Test-Path $envTest) {
        Write-Host "  ✓ .env.test.local" -ForegroundColor Green
    } else {
        Write-Host "  ✗ .env.test.local (not found)" -ForegroundColor Red
    }

    if (Test-Path $envProd) {
        Write-Host "  ✓ .env.production.local" -ForegroundColor Green
    } else {
        Write-Host "  ✗ .env.production.local (not found)" -ForegroundColor Red
    }
}

switch ($Environment) {
    "test" {
        # First, backup current production env if it doesn't exist
        if ((Test-Path $envLocal) -and !(Test-Path $envProd)) {
            Write-Host "📦 Backing up current .env.local to .env.production.local..." -ForegroundColor Yellow
            Copy-Item $envLocal $envProd
        }

        if (Test-Path $envTest) {
            Write-Host "🔄 Switching to TEST environment..." -ForegroundColor Cyan
            Copy-Item $envTest $envLocal -Force
            Write-Host "✅ Switched to TEST environment!" -ForegroundColor Green
            Write-Host "⚠️  Remember to restart your dev server!" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Test environment file not found!" -ForegroundColor Red
            Write-Host "📝 Please create .env.test.local first with your test database credentials" -ForegroundColor Yellow

            # Offer to create template
            Write-Host "`nWould you like to create a template .env.test.local? (y/n)" -ForegroundColor Cyan
            $response = Read-Host
            if ($response -eq 'y') {
                if (Test-Path $envLocal) {
                    Copy-Item $envLocal $envTest
                    Add-Content $envTest "`n# TEST ENVIRONMENT FLAG`nNEXT_PUBLIC_ENVIRONMENT=test"
                    Write-Host "✅ Template created at .env.test.local" -ForegroundColor Green
                    Write-Host "📝 Please update it with your test database credentials" -ForegroundColor Yellow
                }
            }
        }
    }

    "production" {
        if (Test-Path $envProd) {
            Write-Host "🔄 Switching to PRODUCTION environment..." -ForegroundColor Cyan
            Copy-Item $envProd $envLocal -Force
            Write-Host "✅ Switched to PRODUCTION environment!" -ForegroundColor Green
            Write-Host "⚠️  Remember to restart your dev server!" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Production environment file not found!" -ForegroundColor Red
            Write-Host "📝 Looking for backup..." -ForegroundColor Yellow

            if (Test-Path $envLocal) {
                $content = Get-Content $envLocal -Raw
                if ($content -notmatch "NEXT_PUBLIC_ENVIRONMENT=test") {
                    Write-Host "📦 Current .env.local appears to be production. Creating backup..." -ForegroundColor Yellow
                    Copy-Item $envLocal $envProd
                    Write-Host "✅ Created .env.production.local from current environment" -ForegroundColor Green
                }
            }
        }
    }

    "status" {
        Show-Status
    }
}

Write-Host ""
Show-Status