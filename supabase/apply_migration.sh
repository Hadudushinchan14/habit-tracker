#!/bin/bash
# Apply Phase 3 Production Gate Migration
# Run this with: bash supabase/apply_migration.sh
#
# Prerequisites:
# 1. Supabase CLI installed: npm install -g supabase
# 2. Authenticated: supabase login
# 3. Or set SUPABASE_ACCESS_TOKEN environment variable

echo "Applying Phase 3 Production Gate Migration..."
echo "Project: wjkqnoygmeymqiuatyyt"
echo ""

# Try to use Supabase CLI if available
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    
    # Try to link and push
    supabase link --project-ref wjkqnoygmeymqiuatyyt 2>&1 || {
        echo "Error: Cannot link project. Please authenticate first:"
        echo "  supabase login"
        exit 1
    }
    
    supabase db push --linked 2>&1
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "=== MIGRATION APPLIED SUCCESSFULLY ==="
    else
        echo "Error: Migration failed"
        exit 1
    fi
else
    echo "Supabase CLI not found. Please run the SQL manually:"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/project/wjkqnoygmeymqiuatyyt"
    echo "2. Navigate to Database > SQL Editor"
    echo "3. Paste the contents of supabase/migrations/20260921_phase3_production_gate.sql"
    echo "4. Click Run"
fi
