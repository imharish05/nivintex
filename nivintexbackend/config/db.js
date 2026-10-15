const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS || null,
    {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 60000,
            idle: 10000,
        },
        dialectOptions: {
            connectTimeout: 60000,
            dateStrings: true,
            typeCast: true,
            // ── Disable strict mode so '0000-00-00' dates are allowed ──
            multipleStatements: true,
        },
        timezone: '+05:30',
    }
);

// ── Set sql_mode to allow zero dates after every new connection ────────
const origAuthenticate = sequelize.authenticate.bind(sequelize);
sequelize.authenticate = async () => {
    await origAuthenticate();
    await sequelize.query("SET sql_mode = 'NO_ENGINE_SUBSTITUTION'");
};

module.exports = sequelize;