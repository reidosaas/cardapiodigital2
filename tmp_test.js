const http = require('http');

const data = JSON.stringify({ email: 'admin@cardapio.digital', senha: 'admin123' });

const options = {
  hostname: 'backend',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => { console.log('STATUS:', res.statusCode); console.log('BODY:', body.substring(0, 500)); process.exit(0); });
});
req.on('error', (e) => { console.error('ERROR:', e.message); process.exit(1); });
req.write(data);
req.end();
