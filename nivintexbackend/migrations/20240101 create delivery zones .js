'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('delivery_zones', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            state: {
                type: Sequelize.STRING(100),
                allowNull: false,
                defaultValue: '',
            },
            district: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },
            charge: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            },
        });

        await queryInterface.bulkInsert('delivery_zones', [
            { state: 'Tamil Nadu', district: 'Chennai',          charge: 0.00,  is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Coimbatore',       charge: 50.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Madurai',          charge: 60.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Tiruchirappalli',  charge: 50.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Salem',            charge: 55.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Tirunelveli',      charge: 70.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Vellore',          charge: 45.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Erode',            charge: 55.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Thanjavur',        charge: 60.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Tiruppur',         charge: 55.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Dindigul',         charge: 65.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Kancheepuram',     charge: 30.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Thoothukudi',      charge: 75.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Namakkal',         charge: 55.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Virudhunagar',     charge: 70.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Karur',            charge: 55.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Pudukkottai',      charge: 60.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Ramanathapuram',   charge: 75.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Sivaganga',        charge: 70.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Villupuram',       charge: 45.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Cuddalore',        charge: 45.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Nagapattinam',     charge: 65.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Tiruvarur',        charge: 65.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Perambalur',       charge: 60.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Ariyalur',         charge: 60.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Krishnagiri',      charge: 50.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Dharmapuri',       charge: 55.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'The Nilgiris',     charge: 80.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Tenkasi',          charge: 75.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Chengalpattu',     charge: 30.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Kallakurichi',     charge: 50.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Ranipet',          charge: 45.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Tirupattur',       charge: 50.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
            { state: 'Tamil Nadu', district: 'Mayiladuthurai',   charge: 65.00, is_active: true, createdAt: new Date(), updatedAt: new Date() },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('delivery_zones');
    },
};