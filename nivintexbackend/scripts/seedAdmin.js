require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');
const User = require('../models/User');

const email = 'fashionaura@gmail.com';
const name = process.env.ADMIN_NAME || 'Fashion Aura';
const password = process.env.ADMIN_PASSWORD;

async function main() {
  if (!password) throw new Error('Set ADMIN_PASSWORD for this run.');

  await sequelize.authenticate();
  const hashedPassword = await bcrypt.hash(password, 10);
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: { name, email, password: hashedPassword },
  });

  if (!created) {
    user.name = name;
    user.password = hashedPassword;
    await user.save();
  }

  console.log(`${created ? 'Created' : 'Updated'} admin account: ${email}`);
}

main()
  .catch((error) => {
    console.error('Admin seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
