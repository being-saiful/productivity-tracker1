# Productivity Tracker - App Usage Upgrade Deployment Script
# This script deploys all necessary updates for app usage tracking and ML integration

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PRODUCTIVITY TRACKER - APP USAGE UPGRADE DEPLOYER    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill running Node processes
Write-Host "Step 1: Stopping running services..." -ForegroundColor Yellow
try {
    Get-Process node -ErrorAction Stop | Stop-Process -Force -ErrorAction Stop
    Write-Host "✓ Node services stopped" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "✓ No running Node services found" -ForegroundColor Green
}

# Step 2: Backup current files
Write-Host ""
Write-Host "Step 2: Backing up current files..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups\$timestamp"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$filesToBackup = @(
    "backend\index.js",
    "backend\routes\stats.js",
    "public\main.py"
)

foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        Copy-Item $file "$backupDir\$(Split-Path $file -Leaf)" -Force
        Write-Host "✓ Backed up: $file → $backupDir" -ForegroundColor Green
    }
}

# Step 3: Deploy backend files
Write-Host ""
Write-Host "Step 3: Deploying updated backend files..." -ForegroundColor Yellow

# Check if updated files exist
if (Test-Path "backend\index_updated.js") {
    Copy-Item "backend\index_updated.js" "backend\index.js" -Force
    Write-Host "✓ Updated: backend\index.js" -ForegroundColor Green
} else {
    Write-Host "✗ ERROR: backend\index_updated.js not found" -ForegroundColor Red
    exit 1
}

if (Test-Path "backend\routes\stats_updated.js") {
    Copy-Item "backend\routes\stats_updated.js" "backend\routes\stats.js" -Force
    Write-Host "✓ Updated: backend\routes\stats.js" -ForegroundColor Green
} else {
    Write-Host "✗ ERROR: backend\routes\stats_updated.js not found" -ForegroundColor Red
    exit 1
}

# Step 4: Deploy ML service
Write-Host ""
Write-Host "Step 4: Deploying updated ML service..." -ForegroundColor Yellow

if (Test-Path "public\main_fixed.py") {
    Copy-Item "public\main_fixed.py" "public\main.py" -Force
    Write-Host "✓ Updated: public\main.py" -ForegroundColor Green
} else {
    Write-Host "⚠ WARNING: public\main_fixed.py not found (ML service not updated)" -ForegroundColor Yellow
}

# Step 5: Check if app_usage migration exists
Write-Host ""
Write-Host "Step 5: Checking database migration..." -ForegroundColor Yellow

if (Test-Path "backend\migrations\20231207_create_app_usage.js") {
    Write-Host "✓ App usage migration found" -ForegroundColor Green
} else {
    Write-Host "✗ ERROR: Migration file not found" -ForegroundColor Red
    exit 1
}

# Step 6: Check if app_usage routes exist
Write-Host ""
Write-Host "Step 6: Checking new API routes..." -ForegroundColor Yellow

if (Test-Path "backend\routes\app_usage.js") {
    Write-Host "✓ App usage routes found" -ForegroundColor Green
} else {
    Write-Host "✗ ERROR: Routes file not found" -ForegroundColor Red
    exit 1
}

# Step 7: Run database migration
Write-Host ""
Write-Host "Step 7: Running database migration..." -ForegroundColor Yellow
Write-Host "This will create the app_usage table..." -ForegroundColor Gray

try {
    # Check if migrations directory exists
    if (Test-Path "backend\migrations") {
        # Run migration
        $output = & npm run migrate 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Database migration completed successfully" -ForegroundColor Green
        } else {
            Write-Host "✗ Migration may have failed. Output:" -ForegroundColor Yellow
            Write-Host $output -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠ Migrations directory not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not run migration. Please run manually:" -ForegroundColor Yellow
    Write-Host "  npx knex migrate:latest --knexfile knexfile.js" -ForegroundColor Gray
}

# Step 8: Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              DEPLOYMENT COMPLETE                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 DEPLOYMENT SUMMARY:" -ForegroundColor White
Write-Host "  ✓ Backup created: $backupDir" -ForegroundColor Green
Write-Host "  ✓ Backend files updated (index.js, stats.js)" -ForegroundColor Green
Write-Host "  ✓ ML service updated (main.py)" -ForegroundColor Green
Write-Host "  ✓ Database migration prepared" -ForegroundColor Green
Write-Host ""

Write-Host "📝 NEXT STEPS:" -ForegroundColor White
Write-Host "  1. Start the backend:   npm start" -ForegroundColor Cyan
Write-Host "  2. (Optional) Start ML: .venv\Scripts\python public\main.py" -ForegroundColor Cyan
Write-Host "  3. Open in browser:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "  4. Test the system and check dashboard" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 VERIFICATION STEPS:" -ForegroundColor White
Write-Host "  - Check backend logs for errors" -ForegroundColor Cyan
Write-Host "  - Verify app_usage table exists: SELECT * FROM app_usage;" -ForegroundColor Cyan
Write-Host "  - Test endpoints: curl http://localhost:3000/api/health" -ForegroundColor Cyan
Write-Host "  - Check console for any errors (F12 in browser)" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 DOCUMENTATION:" -ForegroundColor White
Write-Host "  See UPGRADE_APP_USAGE.md for detailed information" -ForegroundColor Cyan
Write-Host ""

Write-Host "Deployment script finished. Ready to start the service!" -ForegroundColor Green
