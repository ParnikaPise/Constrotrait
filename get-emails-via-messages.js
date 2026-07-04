const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ucybdtbqvblbwdrsklki.supabase.co';
const supabaseKey = 'sb_publishable_Ru2t-3zNtZZ3mQKMKty7Ww_a6kqHT7J';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:sender_id(firstName, lastName, email), receiver:receiver_id(firstName, lastName, email)')
    .limit(5);

  if (error) {
    console.error('Error fetching joined messages:', error);
  } else {
    console.log('Joined Messages:', JSON.stringify(data, null, 2));
  }
}
run();
