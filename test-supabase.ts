import 'dotenv/config';
import { supabase } from './server/supabase';

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('Key prefix:', process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Connection successful!');
    console.log('Data:', data);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

testConnection();
