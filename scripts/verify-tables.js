require('dotenv').config({ path: '../backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyTables() {
  console.log('🔍 Verifying database tables...\n');
  
  const expectedTables = [
    'users',
    'vehicles', 
    'races',
    'race_participants',
    'meetups',
    'meetup_participants',
    'friends',
    'friend_requests',
    'notifications',
    'performance_records',
    'race_results'
  ];
  
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: Table exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }
  
  // Test a few key functions
  console.log('\n🔧 Testing utility functions...');
  
  try {
    const { data, error } = await supabase.rpc('get_user_friends', { user_uuid: '00000000-0000-0000-0000-000000000000' });
    if (error && !error.message.includes('does not exist')) {
      console.log(`❌ get_user_friends function: ${error.message}`);
    } else {
      console.log(`✅ get_user_friends function: Available`);
    }
  } catch (err) {
    console.log(`❌ get_user_friends function: ${err.message}`);
  }
  
  console.log('\n🎉 Database verification complete!');
}

verifyTables().catch(console.error);