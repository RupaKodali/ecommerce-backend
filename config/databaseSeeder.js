// seeders/index.js
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

class DatabaseSeeder {
    constructor() {
        this.seedData = {};
        this.models = {};
    }

    // Load all models from models directory
    async loadModels(modelsPath) {
        try {
            const files = await fs.readdir(modelsPath);
            for (const file of files) {
                if (file.endsWith('.model.js')) {
                    const modelName = path.parse(file).name.replace('.model', '');
                    this.models[modelName] = require(path.join(modelsPath, file));
                }
            }
        } catch (error) {
            console.error('Error loading models:', error);
            throw error;
        }
    }

    // Load all seed data from data directory
    async loadSeedData(dataPath) {
        try {
            const files = await fs.readdir(dataPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const collectionName = path.parse(file).name;
                    const data = await fs.readFile(path.join(dataPath, file), 'utf8');
                    this.seedData[collectionName] = JSON.parse(data);
                }
            }
        } catch (error) {
            console.error('Error loading seed data:', error);
            throw error;
        }
    }

    // Convert string IDs to ObjectIds in the data
    convertIds(data) {
        return data.map(item => {
            const newItem = { ...item };
            if (item._id && item._id.$oid) {
                newItem._id = new mongoose.Types.ObjectId(item._id.$oid);
            }
            // Handle references to other collections
            Object.keys(newItem).forEach(key => {
                if (newItem[key] && newItem[key].$oid) {
                    newItem[key] = new mongoose.Types.ObjectId(newItem[key].$oid);
                }
            });
            return newItem;
        });
    }

    // Seed a single collection
    async seedCollection(collectionName, data) {
        try {
            const Model = this.models[collectionName];
            if (!Model) {
                throw new Error(`Model not found for collection: ${collectionName}`);
            }

            const convertedData = this.convertIds(data);
            
            // Clear existing data
            await Model.deleteMany({});
            
            // Insert new data
            await Model.insertMany(convertedData);
            
            console.log(`✓ ${collectionName} seeded successfully`);
        } catch (error) {
            console.error(`Error seeding ${collectionName}:`, error);
            throw error;
        }
    }

    // Check if a collection needs seeding
    async needsSeeding(collectionName) {
        const Model = this.models[collectionName];
        if (!Model) return false;
        
        const count = await Model.countDocuments();
        return count === 0;
    }

    // Seed all collections
    async seedAll(force = false) {
        try {
            for (const [collectionName, data] of Object.entries(this.seedData)) {
                if (force || await this.needsSeeding(collectionName)) {
                    await this.seedCollection(collectionName, data);
                } else {
                    console.log(`⚠ ${collectionName} already has data, skipping...`);
                }
            }
        } catch (error) {
            console.error('Error in seedAll:', error);
            throw error;
        }
    }
}


module.exports = DatabaseSeeder;