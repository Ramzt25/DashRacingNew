# Supabase Schema Extraction PowerShell Script
# Run this from the project root directory

Write-Host "🚀 DASH RACING - Supabase Schema Extraction" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend\.env")) {
    Write-Host "❌ Please run this script from the project root directory (where backend/.env exists)" -ForegroundColor Red
    exit 1
}

# Create scripts directory if it doesn't exist
if (-not (Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts" -Force
    Write-Host "📁 Created scripts directory" -ForegroundColor Yellow
}

# Create docs directory if it doesn't exist  
if (-not (Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" -Force
    Write-Host "📁 Created docs directory" -ForegroundColor Yellow
}

Write-Host "📦 Installing required dependencies..." -ForegroundColor Blue

# Install dependencies for the extraction script
try {
    Set-Location "scripts"
    
    # Create package.json if it doesn't exist
    if (-not (Test-Path "package.json")) {
        $packageJson = @{
            name = "supabase-extraction"
            version = "1.0.0"
            description = "Supabase schema extraction utilities"
            main = "extract-supabase-schema.js"
            dependencies = @{
                "@supabase/supabase-js" = "^2.45.4"
                "dotenv" = "^16.4.5"
            }
        } | ConvertTo-Json -Depth 3
        
        $packageJson | Out-File -FilePath "package.json" -Encoding UTF8
        Write-Host "📄 Created package.json for extraction script" -ForegroundColor Yellow
    }
    
    # Install dependencies
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error installing dependencies: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Running schema extraction..." -ForegroundColor Blue

# Run the extraction script
try {
    node extract-supabase-schema.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Schema extraction completed successfully!" -ForegroundColor Green
        Write-Host "📄 Generated files:" -ForegroundColor Cyan
        Write-Host "   - docs/supabase-schema-dump.json (Complete JSON data)" -ForegroundColor White
        Write-Host "   - docs/supabase-schema-report.md (Human-readable report)" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Review the generated files" -ForegroundColor White
        Write-Host "   2. Share the schema dump with your development team" -ForegroundColor White
        Write-Host "   3. Update your tests to match the actual database structure" -ForegroundColor White
    } else {
        Write-Host "❌ Schema extraction failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error running extraction script: $_" -ForegroundColor Red
    exit 1
} finally {
    # Return to project root
    Set-Location ".."
}

Write-Host ""
Write-Host "🏁 DASH RACING Schema Extraction Complete!" -ForegroundColor Green