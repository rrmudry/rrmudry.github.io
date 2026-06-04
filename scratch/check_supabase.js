const https = require('https');

const SB_URL = "https://ddekegwvaunpsbxrwdqf.supabase.co/rest/v1/student_results?select=count";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZWtlZ3d2YXVucHNieHJ3ZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjI3NjAsImV4cCI6MjA5MDAzODc2MH0.9cP15n9olbF4TWO5Vc9Z3mnroE3FiQPcEYTtFtjNWRI";

const options = {
    headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Range': '0-0',
        'Prefer': 'count=exact'
    }
};

https.get(SB_URL, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Supabase Status:', res.statusCode);
        console.log('Supabase Content-Range:', res.headers['content-range']);
        console.log('Supabase Body:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
