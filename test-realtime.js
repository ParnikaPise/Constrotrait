const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ucybdtbqvblbwdrsklki.supabase.co';
const supabaseKey = 'sb_publishable_Ru2t-3zNtZZ3mQKMKty7Ww_a6kqHT7J';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Subscribing to realtime_chats...');
const channel = supabase
  .channel('realtime_chats')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      console.log('INSERT event received:', payload);
    }
  )
  .subscribe((status, err) => {
    console.log('Subscription status:', status);
    if (err) console.error('Subscription error:', err);
  });

setTimeout(() => {
  console.log('Closing channel and exiting...');
  supabase.removeChannel(channel);
  process.exit(0);
}, 10000);
