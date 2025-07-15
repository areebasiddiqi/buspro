#!/bin/bash

# Bash script to install Supabase CLI and run migrations

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Installing..."
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo "Error: npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    # Install Supabase CLI globally using npm
    npm install -g supabase
    
    if [ $? -ne 0 ]; then
        echo "Error installing Supabase CLI. Please try manually: npm install -g supabase"
        exit 1
    fi
    
    echo "Supabase CLI installed successfully."
else
    echo "Supabase CLI is already installed."
fi

# Navigate to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
cd "$PROJECT_ROOT"

# Check if supabase folder exists
if [ ! -d "$PROJECT_ROOT/supabase" ]; then
    echo "Error: supabase folder not found. Make sure you're in the correct project directory."
    exit 1
fi

# Initialize Supabase project if not already initialized
if [ ! -f "$PROJECT_ROOT/supabase/config.toml" ]; then
    echo "Initializing Supabase project..."
    supabase init
    
    if [ $? -ne 0 ]; then
        echo "Error initializing Supabase project."
        exit 1
    fi
fi

# Start Supabase local development environment
echo "Starting Supabase local development environment..."
supabase start

if [ $? -ne 0 ]; then
    echo "Error starting Supabase local development environment."
    exit 1
fi

# Reset database and apply migrations and seed data
echo "Applying migrations and seed data..."
supabase db reset

if [ $? -ne 0 ]; then
    echo "Warning: Could not apply migrations and seed data. You may need to run 'supabase db reset' manually."
fi

# Get Supabase URL and key
SUPABASE_URL=$(supabase status | grep "API URL:" | awk '{print $3}')
SUPABASE_KEY=$(supabase status | grep "anon key:" | awk '{print $3}')

echo "Supabase URL: $SUPABASE_URL"
echo "Supabase Anon Key: $SUPABASE_KEY"

# Update supabase.ts with local development URL and key
SUPABASE_CONFIG_PATH="$PROJECT_ROOT/src/lib/supabase.ts"
if [ -f "$SUPABASE_CONFIG_PATH" ]; then
    sed -i "s|const supabaseUrl = '.*';|const supabaseUrl = '$SUPABASE_URL';|g" "$SUPABASE_CONFIG_PATH"
    sed -i "s|const supabaseAnonKey = '.*';|const supabaseAnonKey = '$SUPABASE_KEY';|g" "$SUPABASE_CONFIG_PATH"
    
    echo "Updated supabase.ts with local development URL and key."
else
    echo "Warning: Could not find supabase.ts to update with local development URL and key."
fi

echo "Supabase local development environment is running."
echo "You can now run your application with 'npm run dev'."

# Instructions for stopping Supabase
echo -e "\nTo stop the Supabase local development environment, run: supabase stop"

# Make the script executable
chmod +x "$PROJECT_ROOT/scripts/run-migrations.sh"