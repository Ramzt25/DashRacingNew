# DASH Racing - Comprehensive Rebuild and Deploy Script
# This script automates the complete development-to-deployment pipeline
# Version: 1.0.0
# Date: August 29, 2025

param(
    [switch]$SkipTests = $false,
    [switch]$SkipBackend = $false,
    [switch]$ProductionBuild = $false,
    [switch]$Verbose = $false
)

# Script configuration
$ScriptVersion = "1.0.0"
$ProjectRoot = "C:\Users\tramsey\Projects\DashRacingNew"
$MobileRoot = "$ProjectRoot\mobile"
$BackendRoot = "$ProjectRoot\backend"
$BuildsDir = "$ProjectRoot\builds"
$TestsDir = "$ProjectRoot\tests"
$MobileTestsDir = "$MobileRoot\tests\build-validation"

# Logging functions
function Write-Header {
    param($Message)
    Write-Host "`n$('=' * 80)" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Yellow
    Write-Host "$('=' * 80)" -ForegroundColor Cyan
}

function Write-Step {
    param($Message)
    Write-Host "`n🔹 $Message" -ForegroundColor Green
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️ $Message" -ForegroundColor Blue
}

# Process management
$Global:BackgroundProcesses = @()

function Start-BackgroundProcess {
    param(
        [string]$Name,
        [string]$Command,
        [string]$WorkingDirectory,
        [string]$WindowTitle
    )
    
    Write-Step "Starting $Name in separate window..."
    
    $ProcessInfo = @{
        Name = $Name
        Command = $Command
        WorkingDirectory = $WorkingDirectory
        WindowTitle = $WindowTitle
        Process = $null
    }
    
    try {
        $ProcessInfo.Process = Start-Process -FilePath "powershell.exe" `
            -ArgumentList "-NoExit", "-Command", "& { Set-Location '$WorkingDirectory'; $Host.UI.RawUI.WindowTitle = '$WindowTitle'; $Command }" `
            -PassThru `
            -WindowStyle Normal
        
        $Global:BackgroundProcesses += $ProcessInfo
        Write-Success "$Name started successfully (PID: $($ProcessInfo.Process.Id))"
        return $ProcessInfo
    } catch {
        Write-Error "Failed to start $Name`: $_"
        return $null
    }
}

function Stop-BackgroundProcesses {
    Write-Step "Stopping background processes..."
    
    foreach ($ProcessInfo in $Global:BackgroundProcesses) {
        try {
            if ($ProcessInfo.Process -and !$ProcessInfo.Process.HasExited) {
                Write-Info "Stopping $($ProcessInfo.Name)..."
                $ProcessInfo.Process.Kill()
                $ProcessInfo.Process.WaitForExit(5000)
                Write-Success "$($ProcessInfo.Name) stopped"
            }
        } catch {
            Write-Warning "Could not stop $($ProcessInfo.Name): $_"
        }
    }
    
    $Global:BackgroundProcesses = @()
}

function Test-Prerequisites {
    Write-Header "CHECKING PREREQUISITES"
    
    $Prerequisites = @(
        @{ Name = "Node.js"; Command = "node --version"; MinVersion = "18.0.0" },
        @{ Name = "npm"; Command = "npm --version"; MinVersion = "8.0.0" },
        @{ Name = "Java"; Command = "java -version"; MinVersion = "17.0.0" },
        @{ Name = "Android SDK (ADB)"; Command = "adb version"; MinVersion = "1.0.0" }
    )
    
    $AllPrereqsMet = $true
    
    foreach ($Prereq in $Prerequisites) {
        try {
            $Output = Invoke-Expression $Prereq.Command 2>&1
            Write-Success "$($Prereq.Name) is available"
            if ($Verbose) {
                Write-Info "  Version: $($Output -split "`n" | Select-Object -First 1)"
            }
        } catch {
            Write-Error "$($Prereq.Name) not found or not in PATH"
            $AllPrereqsMet = $false
        }
    }
    
    # Check Android device connection
    try {
        $Devices = adb devices 2>&1
        $ConnectedDevices = ($Devices -split "`n" | Where-Object { $_ -match "device$" }).Count
        if ($ConnectedDevices -gt 0) {
            Write-Success "$ConnectedDevices Android device(s) connected"
        } else {
            Write-Warning "No Android devices connected via ADB"
        }
    } catch {
        Write-Warning "Could not check Android device status"
    }
    
    return $AllPrereqsMet
}

function Install-Dependencies {
    Write-Header "INSTALLING/UPDATING DEPENDENCIES"
    
    # Backend dependencies
    if (Test-Path $BackendRoot) {
        Write-Step "Installing backend dependencies..."
        Push-Location $BackendRoot
        try {
            npm install
            Write-Success "Backend dependencies installed"
        } catch {
            Write-Error "Failed to install backend dependencies: $_"
            return $false
        } finally {
            Pop-Location
        }
    }
    
    # Mobile dependencies
    Write-Step "Installing mobile dependencies..."
    Push-Location $MobileRoot
    try {
        npm install
        Write-Success "Mobile dependencies installed"
    } catch {
        Write-Error "Failed to install mobile dependencies: $_"
        return $false
    } finally {
        Pop-Location
    }
    
    # Test dependencies
    Write-Step "Installing test dependencies..."
    Push-Location $TestsDir
    try {
        npm install
        Write-Success "Test dependencies installed"
    } catch {
        Write-Warning "Failed to install test dependencies (continuing anyway): $_"
    } finally {
        Pop-Location
    }
    
    # Mobile test dependencies
    Push-Location $MobileTestsDir
    try {
        npm install
        Write-Success "Mobile test dependencies installed"
    } catch {
        Write-Warning "Failed to install mobile test dependencies (continuing anyway): $_"
    } finally {
        Pop-Location
    }
    
    return $true
}

function Start-BackendServices {
    if ($SkipBackend) {
        Write-Warning "Skipping backend startup (--SkipBackend flag set)"
        return $true
    }
    
    Write-Header "STARTING BACKEND SERVICES"
    
    if (!(Test-Path $BackendRoot)) {
        Write-Warning "Backend directory not found, skipping backend startup"
        return $true
    }
    
    # Start backend server
    $BackendProcess = Start-BackgroundProcess `
        -Name "Backend Server" `
        -Command "npm start" `
        -WorkingDirectory $BackendRoot `
        -WindowTitle "DASH Racing - Backend Server"
    
    if ($BackendProcess) {
        Write-Info "Waiting 10 seconds for backend to initialize..."
        Start-Sleep -Seconds 10
        
        # Test backend connectivity
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($Response.StatusCode -eq 200) {
                Write-Success "Backend server is responding"
            } else {
                Write-Warning "Backend server may not be ready (status: $($Response.StatusCode))"
            }
        } catch {
            Write-Warning "Could not connect to backend server (this may be normal if no health endpoint exists)"
        }
    }
    
    return $BackendProcess -ne $null
}

function Start-MetroServices {
    Write-Header "STARTING METRO BUNDLER"
    
    # Start Metro bundler
    $MetroProcess = Start-BackgroundProcess `
        -Name "Metro Bundler" `
        -Command "npx @react-native-community/cli start --reset-cache" `
        -WorkingDirectory $MobileRoot `
        -WindowTitle "DASH Racing - Metro Bundler"
    
    if ($MetroProcess) {
        Write-Info "Waiting 15 seconds for Metro to initialize..."
        Start-Sleep -Seconds 15
        
        # Test Metro connectivity
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($Response.StatusCode -eq 200) {
                Write-Success "Metro bundler is responding"
            } else {
                Write-Warning "Metro bundler may not be ready"
            }
        } catch {
            Write-Warning "Could not connect to Metro bundler endpoint"
        }
    }
    
    return $MetroProcess -ne $null
}

function Run-BackendTests {
    if ($SkipTests) {
        Write-Warning "Skipping backend tests (--SkipTests flag set)"
        return $true
    }
    
    Write-Header "RUNNING BACKEND VALIDATION TESTS"
    
    if (!(Test-Path $TestsDir)) {
        Write-Warning "Backend tests directory not found, skipping backend tests"
        return $true
    }
    
    Push-Location $TestsDir
    try {
        Write-Step "Running backend integration tests..."
        npm run test 2>&1 | ForEach-Object { 
            if ($Verbose -or $_ -match "(✅|❌|⚠️|PASS|FAIL|ERROR)") {
                Write-Host $_
            }
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend tests passed"
            return $true
        } else {
            Write-Error "Backend tests failed"
            return $false
        }
    } catch {
        Write-Error "Backend test execution failed: $_"
        return $false
    } finally {
        Pop-Location
    }
}

function Run-MobileTests {
    if ($SkipTests) {
        Write-Warning "Skipping mobile tests (--SkipTests flag set)"
        return $true
    }
    
    Write-Header "RUNNING MOBILE BUILD VALIDATION TESTS"
    
    Push-Location $MobileTestsDir
    try {
        Write-Step "Running comprehensive mobile build validation..."
        npm run validate 2>&1 | ForEach-Object { 
            Write-Host $_
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Mobile build validation passed"
            return $true
        } else {
            Write-Error "Mobile build validation failed"
            Write-Info "Check the validation output above for specific issues"
            return $false
        }
    } catch {
        Write-Error "Mobile test execution failed: $_"
        return $false
    } finally {
        Pop-Location
    }
}

function Build-AndroidAPK {
    Write-Header "BUILDING ANDROID APK"
    
    $BuildType = if ($ProductionBuild) { "Release" } else { "Debug" }
    $GradleTask = if ($ProductionBuild) { "assembleRelease" } else { "assembleDebug" }
    
    Write-Step "Building $BuildType APK..."
    
    Push-Location "$MobileRoot\android"
    try {
        # Clean build
        Write-Info "Cleaning previous build..."
        .\gradlew clean
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Gradle clean failed"
            return $false
        }
        
        # Build APK
        Write-Info "Building APK (this may take a few minutes)..."
        .\gradlew $GradleTask
        if ($LASTEXITCODE -ne 0) {
            Write-Error "APK build failed"
            return $false
        }
        
        # Verify APK was created
        $APKPath = if ($ProductionBuild) {
            "app\build\outputs\apk\release\app-release.apk"
        } else {
            "app\build\outputs\apk\debug\app-debug.apk"
        }
        
        if (Test-Path $APKPath) {
            $APKSize = [math]::Round((Get-Item $APKPath).Length / 1MB, 2)
            Write-Success "$BuildType APK built successfully ($APKSize MB)"
            return $APKPath
        } else {
            Write-Error "APK file not found after build"
            return $false
        }
    } catch {
        Write-Error "APK build process failed: $_"
        return $false
    } finally {
        Pop-Location
    }
}

function Copy-APKToBuilds {
    param([string]$APKPath)
    
    Write-Header "COPYING APK TO BUILDS DIRECTORY"
    
    if (!(Test-Path $BuildsDir)) {
        New-Item -ItemType Directory -Path $BuildsDir -Force | Out-Null
    }
    
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $BuildType = if ($ProductionBuild) { "release" } else { "debug" }
    $DestinationName = "DashRacing-v1.0.0-$BuildType-$Timestamp.apk"
    $DestinationPath = "$BuildsDir\$DestinationName"
    
    try {
        Copy-Item -Path "$MobileRoot\android\$APKPath" -Destination $DestinationPath -Force
        Write-Success "APK copied to: $DestinationPath"
        
        # Also copy to user directory for easy access
        $UserAPKPath = "$env:USERPROFILE\DashRacing-latest-$BuildType.apk"
        Copy-Item -Path $DestinationPath -Destination $UserAPKPath -Force
        Write-Success "APK also copied to: $UserAPKPath"
        
        return $UserAPKPath
    } catch {
        Write-Error "Failed to copy APK: $_"
        return $false
    }
}

function Install-APKOnDevice {
    param([string]$APKPath)
    
    Write-Header "INSTALLING APK ON CONNECTED DEVICES"
    
    # Check for connected devices
    try {
        $Devices = adb devices 2>&1
        $ConnectedDevices = $Devices -split "`n" | Where-Object { $_ -match "\s+device$" }
        
        if ($ConnectedDevices.Count -eq 0) {
            Write-Warning "No Android devices connected via ADB"
            Write-Info "To install manually:"
            Write-Info "1. Copy $APKPath to your device"
            Write-Info "2. Enable 'Install unknown apps' in Settings"
            Write-Info "3. Open the APK file to install"
            return $true
        }
        
        Write-Step "Installing on $($ConnectedDevices.Count) connected device(s)..."
        
        foreach ($Device in $ConnectedDevices) {
            $DeviceID = ($Device -split "\s+")[0]
            Write-Info "Installing on device: $DeviceID"
            
            try {
                adb -s $DeviceID install -r $APKPath
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "✅ Installation successful on $DeviceID"
                } else {
                    Write-Error "❌ Installation failed on $DeviceID"
                }
            } catch {
                Write-Error "❌ Installation error on $DeviceID`: $_"
            }
        }
        
        return $true
    } catch {
        Write-Error "Failed to install APK: $_"
        return $false
    }
}

function Generate-BuildReport {
    param(
        [bool]$Success,
        [string]$APKPath,
        [datetime]$StartTime
    )
    
    Write-Header "BUILD REPORT"
    
    $Duration = (Get-Date) - $StartTime
    $DurationString = "{0:mm}m {0:ss}s" -f $Duration
    
    Write-Host "📊 Build Statistics:" -ForegroundColor Cyan
    Write-Host "   Script Version: $ScriptVersion"
    Write-Host "   Build Type: $(if ($ProductionBuild) { 'Release' } else { 'Debug' })"
    Write-Host "   Total Duration: $DurationString"
    Write-Host "   Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    
    if ($Success) {
        Write-Host "🎉 BUILD SUCCESSFUL!" -ForegroundColor Green
        if ($APKPath) {
            Write-Host "📱 APK Location: $APKPath" -ForegroundColor Green
        }
    } else {
        Write-Host "💥 BUILD FAILED!" -ForegroundColor Red
    }
    
    Write-Host "`n🔧 Background Services:" -ForegroundColor Cyan
    foreach ($Process in $Global:BackgroundProcesses) {
        $Status = if ($Process.Process -and !$Process.Process.HasExited) { "Running" } else { "Stopped" }
        Write-Host "   $($Process.Name): $Status"
    }
}

# Main execution
function Main {
    $StartTime = Get-Date
    
    Write-Header "DASH RACING - COMPREHENSIVE REBUILD AND DEPLOY SCRIPT v$ScriptVersion"
    Write-Info "Starting automated development-to-deployment pipeline..."
    
    if ($Verbose) {
        Write-Info "Verbose logging enabled"
    }
    
    try {
        # Prerequisites check
        if (!(Test-Prerequisites)) {
            Write-Error "Prerequisites check failed. Please install missing tools."
            exit 1
        }
        
        # Install dependencies
        if (!(Install-Dependencies)) {
            Write-Error "Dependency installation failed."
            exit 1
        }
        
        # Start backend services
        if (!(Start-BackendServices)) {
            Write-Warning "Backend startup failed, continuing without backend..."
        }
        
        # Start Metro
        if (!(Start-MetroServices)) {
            Write-Error "Metro startup failed. Cannot continue without Metro."
            exit 1
        }
        
        # Run tests
        $BackendTestsOK = Run-BackendTests
        $MobileTestsOK = Run-MobileTests
        
        if (!$BackendTestsOK -or !$MobileTestsOK) {
            Write-Error "Tests failed. Build aborted."
            Write-Info "Use --SkipTests to bypass test failures"
            exit 1
        }
        
        # Build APK
        $APKPath = Build-AndroidAPK
        if (!$APKPath) {
            Write-Error "APK build failed."
            exit 1
        }
        
        # Copy APK
        $FinalAPKPath = Copy-APKToBuilds -APKPath $APKPath
        if (!$FinalAPKPath) {
            Write-Error "APK copy failed."
            exit 1
        }
        
        # Install on device
        Install-APKOnDevice -APKPath $FinalAPKPath
        
        # Generate report
        Generate-BuildReport -Success $true -APKPath $FinalAPKPath -StartTime $StartTime
        
        Write-Success "`n🎯 DEPLOYMENT COMPLETE! Your DASH Racing app is ready!"
        
    } catch {
        Write-Error "Script execution failed: $_"
        Generate-BuildReport -Success $false -APKPath "" -StartTime $StartTime
        exit 1
    } finally {
        # Cleanup
        Write-Info "`nPress any key to stop background services and exit..."
        $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
        Stop-BackgroundProcesses
    }
}

# Script entry point
if ($MyInvocation.InvocationName -ne '.') {
    Main
}