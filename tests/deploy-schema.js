#!/usr/bin/env node

/**
 * Deploy Database Schema - Creates complete DASH RACING database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function deploySchema() {
  console.log('🚀 DASH RACING Database Schema Deployment');
  console.log('=========================================\n');

  const supabaseUrl = 'https://zwmwvwjrmtetntvdnftc.supabase.co';
  const serviceRoleKey = 'sb_secret_bJWXdORSWL9-lzz2L8wRSg_DyL_MjaW';
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Test connection first
    console.log('1️⃣ Testing connection to new Supabase project...');
    const { data, error } = await supabase
      .from('_test_connection_')
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, which is expected
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Connected to Supabase successfully!');

    // Read and execute schema
    console.log('\n2️⃣ Reading database schema...');
    const schemaPath = path.join(__dirname, '..', 'database', 'complete-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema loaded:', schema.length, 'characters');

    // Execute schema in chunks (Supabase has query size limits)
    console.log('\n3️⃣ Executing database schema...');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('📋 Found', statements.length, 'SQL statements to execute');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        // Use RPC to execute raw SQL
        const { data: result, error: execError } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (execError) {
          // If exec_sql function doesn't exist, try direct execution
          if (execError.code === 'PGRST202') {
            console.log('   Using fallback execution method...');
            // For some statements, we'll need to handle them differently
            // This is a limitation of Supabase's REST API
            console.log('⚠️  Statement needs manual execution:', statement.substring(0, 50) + '...');
            errorCount++;
          } else {
            console.error(`   ❌ Error in statement ${i + 1}:`, execError.message);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`   💥 Exception in statement ${i + 1}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n4️⃣ Schema deployment summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. You may need to run the schema manually in Supabase SQL Editor.');
      console.log('   Schema file location:', schemaPath);
    }

    // Test table creation
    console.log('\n5️⃣ Verifying table creation...');
    const { data: tables, error: tableError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      console.error('❌ Users table not accessible:', tableError.message);
    } else {
      console.log('✅ Users table created and accessible!');
    }

    console.log('\n🎉 Database deployment completed!');
    console.log('Next steps:');
    console.log('1. Restart your backend server to use new credentials');
    console.log('2. Run authentication tests');
    console.log('3. Execute comprehensive test suite');

  } catch (error) {
    console.error('💥 Deployment failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

deploySchema().catch(console.error);