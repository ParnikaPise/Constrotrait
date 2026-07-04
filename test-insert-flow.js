const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ucybdtbqvblbwdrsklki.supabase.co';
const supabaseKey = 'sb_publishable_Ru2t-3zNtZZ3mQKMKty7Ww_a6kqHT7J';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Subscribing to realtime_chats...');
  let eventReceived = false;

  const channel = supabase
    .channel('realtime_chats')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        console.log('--- INSERT EVENT RECEIVED IN REALTIME ---');
        console.log(payload);
        eventReceived = true;
      }
    )
    .subscribe((status, err) => {
      console.log('Subscription status:', status);
      if (err) console.error('Subscription error:', err);
    });

  // Wait 3 seconds for subscription to settle
  await new Promise(resolve => setTimeout(resolve, 3000));

  const testMessageId = '99999999-9999-9999-9999-999999999999';
  console.log('Inserting test message...');
  const { data, error } = await supabase.from('messages').insert({
    id: testMessageId,
    sender_id: '46f33027-7cd3-40ba-9048-e362c58079c6',
    receiver_id: '8900bee9-ae74-410d-9d34-91a95b627dd9',
    subject: 'Chat Message',
    content: 'Realtime test message'
  }).select();

  if (error) {
    console.error('Error inserting message:', error);
  } else {
    console.log('Message inserted successfully:', data);
  }

  // Wait 5 seconds to see if we get the realtime notification
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Cleaning up test message...');
  await supabase.from('messages').delete().eq('id', testMessageId);

  console.log('Event received status:', eventReceived);
  supabase.removeChannel(channel);
  process.exit(0);
}

run();
