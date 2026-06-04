const https = require('https');

const url = "https://firestore.googleapis.com/v1/projects/site-6e500/databases/(default)/documents/student_results";

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
