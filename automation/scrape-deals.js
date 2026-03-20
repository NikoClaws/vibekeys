#!/usr/bin/env node
/**
 * VibeKeys Deal Scraper
 * Scrapes deals from Reddit and other sources
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DEALS_FILE = path.join(__dirname, '..', 'deals.json');
const USER_AGENT = 'VibeKeys Deal Scraper/1.0 (Tech Deal Aggregator)';

// Category mapping based on keywords
const CATEGORY_KEYWORDS = {
  'gaming': ['gaming', 'controller', 'mouse', 'keyboard', 'headset', 'xbox', 'playstation', 'ps5', 'ps4', 'nintendo', 'game', 'steam', 'gamepad'],
  'electronics': ['headphone', 'speaker', 'tv', 'monitor', 'camera', 'audio', 'earbuds', 'bluetooth', 'wireless'],
  'software': ['software', 'microsoft', 'office', 'vpn', 'antivirus', 'adobe', 'windows', 'subscription', 'license'],
  'smart-home': ['echo', 'alexa', 'ring', 'smart', 'nest', 'thermostat', 'light', 'bulb', 'doorbell', 'hub'],
  'pc-parts': ['gpu', 'cpu', 'ram', 'ssd', 'nvme', 'motherboard', 'psu', 'case', 'graphics card', 'processor', 'memory', 'storage', 'rtx', 'radeon', 'ryzen', 'intel'],
  'mobile': ['phone', 'iphone', 'android', 'tablet', 'ipad', 'watch', 'samsung', 'pixel', 'charger', 'cable']
};

// Store keywords for retailer detection
const STORE_PATTERNS = {
  'Amazon': /amazon\.com|amzn\.to/i,
  'Best Buy': /bestbuy\.com/i,
  'Newegg': /newegg\.com/i,
  'Walmart': /walmart\.com/i,
  'B&H Photo': /bhphotovideo\.com/i,
  'Target': /target\.com/i,
  'GameStop': /gamestop\.com/i,
  'Micro Center': /microcenter\.com/i,
  'Costco': /costco\.com/i
};

/**
 * Fetch JSON from URL
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: { 
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };
    
    https.get(options, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJSON(res.headers.location).then(resolve).catch(reject);
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Check if we got HTML instead of JSON
          if (data.trim().startsWith('<')) {
            reject(new Error('Received HTML instead of JSON - may be rate limited'));
            return;
          }
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Detect category from title
 */
function detectCategory(title) {
  const lowerTitle = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return category;
      }
    }
  }
  return 'electronics'; // default
}

/**
 * Detect store from URL
 */
function detectStore(url) {
  for (const [store, pattern] of Object.entries(STORE_PATTERNS)) {
    if (pattern.test(url)) {
      return store;
    }
  }
  return 'Various';
}

/**
 * Extract price from title
 */
function extractPrice(title) {
  // Match patterns like $29.99, $299, etc.
  const priceMatch = title.match(/\$(\d+(?:\.\d{2})?)/g);
  if (priceMatch && priceMatch.length >= 1) {
    const prices = priceMatch.map(p => parseFloat(p.replace('$', '')));
    // Sort to find current (lowest) and original (highest)
    prices.sort((a, b) => a - b);
    return {
      current: prices[0],
      original: prices.length > 1 ? prices[prices.length - 1] : Math.round(prices[0] * 1.3)
    };
  }
  return null;
}

/**
 * Scrape deals from Reddit subreddit
 */
async function scrapeReddit(subreddit) {
  console.log(`Scraping r/${subreddit}...`);
  
  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
    const data = await fetchJSON(url);
    
    if (!data.data || !data.data.children) {
      console.log(`No data from r/${subreddit}`);
      return [];
    }
    
    const deals = [];
    
    for (const post of data.data.children) {
      const item = post.data;
      
      // Skip stickied posts and non-deal posts
      if (item.stickied || item.is_self) continue;
      
      const prices = extractPrice(item.title);
      if (!prices) continue; // Skip if no price found
      
      const deal = {
        id: item.id,
        title: item.title.replace(/\[.*?\]/g, '').trim(),
        price: prices.current,
        originalPrice: prices.original,
        store: detectStore(item.url),
        url: item.url,
        category: detectCategory(item.title),
        imageUrl: item.thumbnail && item.thumbnail.startsWith('http') ? item.thumbnail : null,
        source: `r/${subreddit}`,
        score: item.score,
        created: new Date(item.created_utc * 1000).toISOString(),
        scraped: new Date().toISOString()
      };
      
      deals.push(deal);
    }
    
    console.log(`Found ${deals.length} deals from r/${subreddit}`);
    return deals;
    
  } catch (error) {
    console.error(`Error scraping r/${subreddit}:`, error.message);
    return [];
  }
}

/**
 * Load existing deals
 */
function loadExistingDeals() {
  try {
    if (fs.existsSync(DEALS_FILE)) {
      return JSON.parse(fs.readFileSync(DEALS_FILE, 'utf8'));
    }
  } catch (error) {
    console.log('No existing deals file or error reading it');
  }
  return { deals: [], lastUpdated: null };
}

/**
 * Save deals to file
 */
function saveDeals(deals) {
  const data = {
    deals: deals,
    lastUpdated: new Date().toISOString(),
    totalDeals: deals.length
  };
  fs.writeFileSync(DEALS_FILE, JSON.stringify(data, null, 2));
  console.log(`Saved ${deals.length} deals to ${DEALS_FILE}`);
}

/**
 * Main scraping function
 */
async function main() {
  console.log('=== VibeKeys Deal Scraper ===\n');
  console.log('Starting deal scrape at', new Date().toISOString());
  
  // Load existing deals
  const existing = loadExistingDeals();
  const existingIds = new Set(existing.deals.map(d => d.id));
  
  // Scrape from multiple sources
  const sources = [
    'buildapcsales',
    'GameDeals'
  ];
  
  let allDeals = [];
  
  for (const source of sources) {
    const deals = await scrapeReddit(source);
    allDeals = allDeals.concat(deals);
    
    // Rate limiting - wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Filter out duplicates and merge with existing
  const newDeals = allDeals.filter(d => !existingIds.has(d.id));
  console.log(`\nFound ${newDeals.length} new deals`);
  
  // Combine new deals with existing (new first)
  const combinedDeals = [...newDeals, ...existing.deals];
  
  // Keep only last 100 deals and remove old ones (> 7 days)
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const filteredDeals = combinedDeals
    .filter(d => new Date(d.scraped).getTime() > oneWeekAgo)
    .slice(0, 100);
  
  // Sort by score (popularity)
  filteredDeals.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  // Save deals
  saveDeals(filteredDeals);
  
  console.log('\n=== Scrape Complete ===');
  console.log(`Total deals: ${filteredDeals.length}`);
  console.log(`New deals added: ${newDeals.length}`);
  
  // Return stats
  return {
    total: filteredDeals.length,
    new: newDeals.length,
    deals: filteredDeals
  };
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, scrapeReddit, detectCategory, detectStore };
