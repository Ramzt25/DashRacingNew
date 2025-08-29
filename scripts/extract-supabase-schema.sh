#!/bin/bash

# Supabase Schema Extraction Script
# Run this from the project root directory

echo "🚀 DASH RACING - Supabase Schema Extraction"
echo "==========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/.env" ]; then
    echo "❌ Please run this script from the project root directory (where backend/.env exists)"
    exit 1
fi

# Create scripts directory if it doesn't exist
if [ ! -d "scripts" ]; then
    mkdir -p scripts
    echo "📁 Created scripts directory"
fi

# Create docs directory if it doesn't exist  
if [ ! -d "docs" ]; then
    mkdir -p docs
    echo "📁 Created docs directory"
fi

echo "📦 Installing required dependencies..."

# Install dependencies for the extraction script
cd scripts

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    cat > package.json << EOF
{
  "name": "supabase-extraction",
  "version": "1.0.0",
  "description": "Supabase schema extraction utilities",
  "main": "extract-supabase-schema.js",
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "dotenv": "^16.4.5"
  }
}
EOF
    echo "📄 Created package.json for extraction script"
fi

# Install dependencies
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""
echo "🔍 Running schema extraction..."

# Run the extraction script
node extract-supabase-schema.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema extraction completed successfully!"
    echo "📄 Generated files:"
    echo "   - docs/supabase-schema-dump.json (Complete JSON data)"
    echo "   - docs/supabase-schema-report.md (Human-readable report)"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Review the generated files"
    echo "   2. Share the schema dump with your development team"
    echo "   3. Update your tests to match the actual database structure"
else
    echo "❌ Schema extraction failed"
    exit 1
fi

# Return to project root
cd ..

echo ""
echo "🏁 DASH RACING Schema Extraction Complete!"