const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/documind_ai');
  const hash = await bcrypt.hash('password123', 10);
  await mongoose.connection.collection('users').updateOne(
    { email: 'testuser@gmail.com' },
    { $set: { password: hash, name: 'Test User' } },
    { upsert: true }
  );
  console.log('Successfully set password for testuser@gmail.com to password123');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
