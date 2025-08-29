// Quick Database Schema Verification
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTables() {
  console.log('🔍 Verifying database schema...\n');
  
  const requiredTables = [
    'users', 'vehicles', 'vehicle_modifications', 'friendships', 
    'races', 'race_participants', 'race_results', 'messages', 
    'achievements', 'notifications'
  ];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Table exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n🏁 Schema verification complete!');
}

verifyTables().catch(console.error);