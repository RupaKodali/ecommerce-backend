const Category = require('../models/categorySchema');
const Product = require('../models/productSchema');

const { sample_products } = require('./product');

// Mapping of categories to their corresponding names in the database
const categoryMappings = {
    "/books": "Books & Stationery" ,
    "/books/business": "Books & Stationery" ,
    "/books/history": "Books & Stationery" ,
    "/books/programming": "Books & Stationery" ,
    "/books/cooking": "Home & Kitchen" ,
    "/games": "Toys & Games" ,
    "/games/pc": "Toys & Games" ,
    "/games/ps3": "Toys & Games" ,
    "/games/ps4": "Toys & Games" ,
    "/games/wiiu": "Toys & Games" ,
    "/games/xbox360": "Toys & Games"
}

// Example product data
const products = sample_products

async function mapAndSaveProducts() {
    try {
        console.log("111111111111111111");
        // Map and save each product
        for (const product of products) {
            const categoryName = categoryMappings[product.category];
            if (!categoryName) {
                console.error(`No mapping found for category: ${product.category}`);
                continue;
            }

            // Find the category ObjectId from the database
            const category = await Category.findOne({ name: categoryName });
            if (!category) {
                console.error(`Category not found for name: ${categoryName}`);
                continue;
            }

            // Map product data to the schema
            const newProduct = new Product({
                name: product.title,
                description: product.description.join(' '), // Join array to string
                images: product.images ? Object.values(product.images).map(image => image.url):[], // Convert images object to array
                price: product.price,
                stock_quantity: Math.floor(Math.random() * (100 - 50 + 1)) + 50, // Random stock quantity between 50 and 100
                category: category._id // Reference to the Category ObjectId
            });

            // Save the product to the database
            await newProduct.save();
            console.log(`Product saved: ${newProduct.name}`);
        }

        console.log('All products mapped and saved!');
    } catch (err) {
        console.error('Error mapping and saving products:', err);
    }
}


module.exports={
    mapAndSaveProducts
}