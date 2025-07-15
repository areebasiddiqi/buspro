# PowerShell script to install Supabase CLI and run migrations

# Check if Supabase CLI is installed
$supabaseInstalled = $null
try {
    $supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
} catch {
    # Command not found
}

# Install Supabase CLI if not installed
if ($null -eq $supabaseInstalled) {
    Write-Host "Supabase CLI not found. Installing..."
    
    # Check if npm is installed
    try {
        npm --version | Out-Null
    } catch {
        Write-Host "Error: npm is not installed. Please install Node.js and npm first." -ForegroundColor Red
        exit 1
    }
    
    # Install Supabase CLI globally using npm
    npm install -g supabase
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error installing Supabase CLI. Please try manually: npm install -g supabase" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Supabase CLI installed successfully." -ForegroundColor Green
} else {
    Write-Host "Supabase CLI is already installed." -ForegroundColor Green
}

# Navigate to project root
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location -Path $projectRoot

# Check if supabase folder exists
if (-not (Test-Path "$projectRoot\supabase")) {
    Write-Host "Error: supabase folder not found. Make sure you're in the correct project directory." -ForegroundColor Red
    exit 1
}

# Initialize Supabase project if not already initialized
if (-not (Test-Path "$projectRoot\supabase\config.toml")) {
    Write-Host "Initializing Supabase project..."
    supabase init
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error initializing Supabase project." -ForegroundColor Red
        exit 1
    }
}

# Start Supabase local development environment
Write-Host "Starting Supabase local development environment..."
supabase start

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error starting Supabase local development environment." -ForegroundColor Red
    exit 1
}

# Reset database and apply migrations and seed data
Write-Host "Applying migrations and seed data..."
supabase db reset

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Could not apply migrations and seed data. You may need to run 'supabase db reset' manually." -ForegroundColor Yellow
}

# Get Supabase URL and key
$supabaseUrl = supabase status | Select-String -Pattern "API URL: (.*)" | ForEach-Object { $_.Matches.Groups[1].Value }
$supabaseKey = supabase status | Select-String -Pattern "anon key: (.*)" | ForEach-Object { $_.Matches.Groups[1].Value }

Write-Host "Supabase URL: $supabaseUrl"
Write-Host "Supabase Anon Key: $supabaseKey"

# Update supabase.ts with local development URL and key
$supabaseConfigPath = "$projectRoot\src\lib\supabase.ts"
if (Test-Path $supabaseConfigPath) {
    $supabaseConfig = Get-Content $supabaseConfigPath -Raw
    $supabaseConfig = $supabaseConfig -replace "const supabaseUrl = '.*';`r`n", "const supabaseUrl = '$supabaseUrl';`r`n"
    $supabaseConfig = $supabaseConfig -replace "const supabaseAnonKey = '.*';`r`n", "const supabaseAnonKey = '$supabaseKey';`r`n"
    Set-Content -Path $supabaseConfigPath -Value $supabaseConfig
    
    Write-Host "Updated supabase.ts with local development URL and key." -ForegroundColor Green
} else {
    Write-Host "Warning: Could not find supabase.ts to update with local development URL and key." -ForegroundColor Yellow
}

Write-Host "Supabase local development environment is running." -ForegroundColor Green
Write-Host "You can now run your application with 'npm run dev'." -ForegroundColor Green

# Instructions for stopping Supabase
Write-Host "`nTo stop the Supabase local development environment, run: supabase stop" -ForegroundColor Cyan