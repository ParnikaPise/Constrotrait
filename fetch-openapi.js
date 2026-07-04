async function run() {
  const url = 'https://ucybdtbqvblbwdrsklki.supabase.co/rest/v1/?apikey=sb_publishable_Ru2t-3zNtZZ3mQKMKty7Ww_a6kqHT7J';
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
