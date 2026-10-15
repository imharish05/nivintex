require('dotenv').config();
const sequelize = require('./config/db');
const FranchiseUser = require('./models/FranchiseUser');
const bcrypt = require('bcryptjs');

async function createFranchise() {
    try {
        await sequelize.authenticate();
        await FranchiseUser.sync(); // ensure table exists
        
        const email = "vikramn.sts@gmail.com";
        const password = "password123";
        
        const existing = await FranchiseUser.findOne({ where: { email } });
        if (existing) {
            console.log("Franchise user already exists!");
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await FranchiseUser.create({
            franchise_id: 1,
            franchise_name: 'coimbatore',
            email: email,
            password: hashedPassword
        });

        console.log("Franchise user Coimbatore created successfully!");
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createFranchise();
