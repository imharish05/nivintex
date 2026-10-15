const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/db');
const Banner = require('../models/Banner');
const Offer = require('../models/Offerbanner');
const Instagram = require('../models/InstagramPost');
const Promo = require('../models/PromoBar');

const beach = 'uploads/banners/1783418035766-298751727.jfif';
const casual = 'uploads/banners/1783418080369-114747474.jfif';
const skirt = 'uploads/instagram/1783419708197-196865980.jfif';
const layers = 'uploads/instagram/1783419825214-889181529.jfif';
const dress = 'uploads/instagram/1783419838329-232423057.jfif';
const saree = 'uploads/instagram/1782294323140-167375132.jfif';

// Sample website content, using existing uploaded assets. No social posts are published.
const groups = [
    [Banner, 'title', [
        { title: 'Everyday Elegance', subtitle: 'The Nivintex edit', content: 'Discover your next favourite look', image: beach, section: 'hero', sortOrder: 1 },
        { title: 'Keep It Effortless', subtitle: 'Style for your everyday', content: 'Explore relaxed looks and fresh outfit ideas', image: casual, section: 'hero', sortOrder: 2 },
        { title: 'Dress Your Way', subtitle: 'Make it your own', content: 'Find inspiration for every occasion', image: dress, section: 'hero', sortOrder: 3 },
        { title: 'A Fresh Perspective', subtitle: 'Explore the collection', content: 'Discover the Nivintex wardrobe edit', image: layers, section: 'new_arrivals', sortOrder: 1 },
        { title: 'The Style Edit', subtitle: 'Find your signature look', content: 'Outfit inspiration, from day to evening', image: skirt, section: 'best_sellers', sortOrder: 1 },
    ].map(row => ({ ...row, link: '/shop', status: 'Active' }))],
    [Offer, 'title', [
        { title: 'Weekend Wardrobe', subtitle: 'Relaxed outfit inspiration', image: casual },
        { title: 'Prints with Personality', subtitle: 'Bring a little colour to your day', image: skirt },
        { title: 'Occasion Inspiration', subtitle: 'Celebrate your personal style', image: dress },
    ].map(row => ({ ...row, offerLabel: 'Explore the edit', btnText: 'Shop now', btnLink: '/shop', status: 'Active' }))],
    [Instagram, 'label', [
        { label: 'Nivintex style inspiration: printed skirts', tag: '#EverydayStyle', image: skirt },
        { label: 'Nivintex style inspiration: relaxed layers', tag: '#StyleYourWay', image: layers },
        { label: 'Nivintex style inspiration: evening dresses', tag: '#OccasionStyle', image: dress },
        { label: 'Nivintex style inspiration: festive colours', tag: '#FestiveInspiration', image: saree },
    ].map((row, i) => ({ ...row, mediaType: 'image', postUrl: null, status: 'Active', sortOrder: i + 1 }))],
    [Promo, 'message', [
        { message: 'Discover Nivintex | Explore the collection and find your next favourite look.', linkUrl: '/shop', sortOrder: 1 },
        { message: 'Make it your own | Everyday outfit inspiration from Nivintex.', linkUrl: '/shop', sortOrder: 2 },
    ].map(row => ({ ...row, code: null, codeLabel: null, bgGradient: 'linear-gradient(90deg, #165b4d 0%, #263d32 100%)', textColor: '#FFF8EC', isActive: true }))],
];

async function main() {
    for (const [, , rows] of groups) {
        for (const row of rows) {
            if (row.image && !fs.existsSync(path.join(__dirname, '..', row.image))) {
                throw new Error(`Missing content image: ${row.image}`);
            }
        }
    }
    await db.transaction(async transaction => {
        for (const [Model, key, rows] of groups) {
            let added = 0;
            for (const row of rows) {
                const [, created] = await Model.findOrCreate({ where: { [key]: row[key] }, defaults: row, transaction });
                if (created) added++;
            }
            console.log(`${Model.name}: added ${added}, already present ${rows.length - added}`);
        }
    });
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
}).finally(() => db.close());
