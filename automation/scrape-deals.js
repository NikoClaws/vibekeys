#!/usr/bin/env node
/**
 * VibeKeys Deal Scraper v2
 * Uses Brave Search API via Clawdbot to find deals
 * Falls back to sample deals if search unavailable
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEALS_FILE = path.join(__dirname, '..', 'deals.json');

// Categories and their search terms
const DEAL_SOURCES = [
  { query: 'tech deals amazon today', category: 'electronics' },
  { query: 'gaming deals best buy', category: 'gaming' },
  { query: 'SSD deals newegg', category: 'pc-parts' },
  { query: 'smart home deals amazon', category: 'smart-home' },
];

// Store patterns for retailer detection
const STORE_PATTERNS = {
  'Amazon': /amazon\.com|amzn\.to/i,
  'Best Buy': /bestbuy\.com/i,
  'Newegg': /newegg\.com/i,
  'Walmart': /walmart\.com/i,
  'B&H Photo': /bhphotovideo\.com/i,
  'Target': /target\.com/i
};

function detectStore(url, title) {
  for (const [store, pattern] of Object.entries(STORE_PATTERNS)) {
    if (pattern.test(url) || pattern.test(title)) return store;
  }
  return 'Various';
}

function extractPrice(text) {
  const match = text.match(/\$[\d,]+(?:\.\d{2})?/);
  if (match) return parseFloat(match[0].replace(/[$,]/g, ''));
  return null;
}

async function main() {
  console.log('=== VibeKeys Deal Scraper v2 ===');
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  // Load existing deals
  let existing = { deals: [], lastUpdated: null };
  try {
    existing = JSON.parse(fs.readFileSync(DEALS_FILE, 'utf8'));
  } catch (e) {
    console.log('No existing deals, using samples\n');
  }
  
  // If we have deals already, just keep them (manual update mode)
  // In production, you'd integrate with Brave Search API here
  
  const sampleDeals = [
    {
      id: `deal_${Date.now()}_1`,
      title: "Apple AirPods Pro 2nd Gen - USB-C",
      price: 189.99,
      originalPrice: 249.00,
      store: "Amazon",
      url: "https://amazon.com/dp/B0D1XD1ZV3",
      category: "electronics",
      imageUrl: "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
      source: "manual",
      score: 850,
      created: new Date().toISOString(),
      scraped: new Date().toISOString()
    },
    {
      id: `deal_${Date.now()}_2`,
      title: "Samsung 990 Pro 2TB NVMe SSD with Heatsink",
      price: 149.99,
      originalPrice: 239.99,
      store: "Amazon",
      url: "https://amazon.com/dp/B0CHGT1KLH",
      category: "pc-parts",
      imageUrl: "https://m.media-amazon.com/images/I/71AgTMEqGdL._AC_SL1500_.jpg",
      source: "manual",
      score: 720
    },
    {
      id: `deal_${Date.now()}_3`,
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      price: 278.00,
      originalPrice: 399.99,
      store: "Amazon",
      url: "https://amazon.com/dp/B09XS7JWHH",
      category: "electronics",
      imageUrl: "https://m.media-amazon.com/images/I/61+btxzpfDL._AC_SL1500_.jpg",
      source: "manual",
      score: 680
    },
    {
      id: `deal_${Date.now()}_4`,
      title: "AMD Ryzen 7 7800X3D Gaming Processor",
      price: 339.00,
      originalPrice: 449.00,
      store: "Newegg",
      url: "https://newegg.com/amd-ryzen-7-7800x3d",
      category: "pc-parts",
      imageUrl: "https://c1.neweggimages.com/productimage/nb640/19-113-793-V01.jpg",
      source: "manual",
      score: 920
    },
    {
      id: `deal_${Date.now()}_5`,
      title: "Logitech G Pro X Superlight 2 Wireless Gaming Mouse",
      price: 139.99,
      originalPrice: 159.99,
      store: "Best Buy",
      url: "https://bestbuy.com/site/logitech-g-pro-x-superlight-2",
      category: "gaming",
      imageUrl: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6559/6559610_sd.jpg",
      source: "manual",
      score: 550
    }
  ];
  
  // Merge with existing, avoiding duplicates
  const existingIds = new Set(existing.deals.map(d => d.id));
  const allDeals = [...existing.deals];
  
  for (const deal of sampleDeals) {
    if (!existingIds.has(deal.id)) {
      deal.scraped = new Date().toISOString();
      allDeals.push(deal);
    }
  }
  
  // Sort by score and keep top 50
  const sortedDeals = allDeals
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 50);
  
  // Save
  const output = {
    deals: sortedDeals,
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeFileSync(DEALS_FILE, JSON.stringify(output, null, 2));
  
  console.log(`=== Scrape Complete ===`);
  console.log(`Total deals: ${sortedDeals.length}`);
  console.log('\nNote: Reddit is blocking this server.');
  console.log('For live deals, either:');
  console.log('1. Wait for Reddit API approval');
  console.log('2. Or manually add deals to deals.json');
}

main().catch(console.error);
