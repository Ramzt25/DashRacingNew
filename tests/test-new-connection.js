#!/usr/bin/env node

/**
 * Test New Supabase Connection
 */

const { createClient } = require('@supabase/supabase-js');

async function testNewConnection() {
  console.log('🔍 Testing new Supabase project connection...');

  const supabaseUrl = 'https://zwmwvwjrmtetntvdnftc.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3bXd2d2pybXRldG50dmRuZnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MDU2MDIsImV4cCI6MjA3MTk4MTYwMn0.V_jPg5GxNgpJG7TqDCjYEvAI83yBnNiOOv7yxSY_DwA';
  const serviceRoleKey = 'sb_secret_bJWXdORSWL9-lzz2L8wRSg_DyL_MjaW';

  // Test with anon key
  console.log('\n1️⃣ Testing with ANON key...');
  const supabaseAnon = createClient(supabaseUrl, anonKey);
  
  try {
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey
      }
    });
    console.log('Anon key status:', response.status);
    if (response.status === 200) {
      console.log('✅ Anon key working!');
    }
  } catch (error) {
    console.error('❌ Anon key error:', error.message);
  }

  // Test with service role key  
  console.log('\n2️⃣ Testing with SERVICE ROLE key...');
  const supabaseService = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });
    console.log('Service role status:', response.status);
    if (response.status === 200) {
      console.log('✅ Service role key working!');
    }
  } catch (error) {
    console.error('❌ Service role error:', error.message);
  }

  // Test auth signup (will fail until schema is deployed, but should not give key errors)
  console.log('\n3️⃣ Testing auth signup (expects schema error)...');
  try {
    const { data, error } = await supabaseAnon.auth.signUp({
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    if (error) {
      console.log('Auth error (expected):', error.message);
      if (error.message.includes('Invalid API key')) {
        console.error('❌ Key issue detected!');
      } else {
        console.log('✅ Keys work - just need schema deployment');
      }
    } else {
      console.log('✅ Auth signup worked:', data.user?.id);
    }
  } catch (error) {
    console.error('💥 Auth test error:', error.message);
  }

  console.log('\n🎯 Next steps:');
  console.log('1. Copy the complete-schema.sql content');
  console.log('2. Go to Supabase Dashboard > SQL Editor');
  console.log('3. Paste and run the schema');
  console.log('4. Test authentication again');
}

testNewConnection().catch(console.error);