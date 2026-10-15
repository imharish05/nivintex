const sequelize = require('./config/db');
sequelize.query('SHOW TABLES').then(res => {
  console.log(res[0]);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
