const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'exovita_db',
  user: 'exovita',
  password: 'exovita_password',
});

client.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL successfully!');
    return client.query('SELECT version();');
  })
  .then(res => {
    console.log('✅ PostgreSQL version:', res.rows[0].version);
    return client.end();
  })
  .then(() => {
    console.log('✅ Connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  });
