require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const DatabaseSeeder = require('../databaseSeeder');
const databaseSeeder = new DatabaseSeeder()
async function runSeeder() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        // Load models and seed data
        await databaseSeeder.loadModels(path.join(__dirname, '../models'));
        await databaseSeeder.loadSeedData(path.join(__dirname, '../seeders/data'));

        // Run seeder
        await databaseSeeder.seedAll();

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runSeeder();
}