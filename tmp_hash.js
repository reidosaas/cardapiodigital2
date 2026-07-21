const bcrypt = require('/app/node_modules/bcryptjs');
bcrypt.hash('123456', 10).then(function(h) { console.log(h); process.exit(0); });
