#!/usr/bin/env node
/**
 * VibeKeys - Deal Scraper
 * Scrapes deals from multiple sources and outputs deals.json
 * 
 * Sources:
 * - Slickdeals RSS
 * - Reddit r/buildapcsales
 * - Reddit r/gamedeals
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  outputFile: path.join(__dirname, 'deals.json'),
  sources: {
    slickdeals: 'https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1',
    buildapcsales: 'https://www.reddit.com/r/buildapcsales/hot.json?limit=25',
    gamedeals: 'https://www.reddit.com/r/GameDeals/hot.json?limit=25'
  },
  categories: {
    'gpu': 'pc-parts',
    'graphics card': 'pc-parts',
    'cpu': 'pc-parts',
    'ram': 'pc-parts',
    'ssd': 'pc-parts',
    'laptop': 'pc-parts',
    'monitor': 'pc-parts',
    'headphone': 'electronics',
    'headset': 'gaming',
    'keyboard': 'gaming',
    'mouse': 'gaming',
    'controller': 'gaming',
    'game': 'gaming',
    'playstation': 'gaming',
    'xbox': 'gaming',
    'nintendo': 'gaming',
    'echo': 'smart-home',
    'alexa': 'smart-home',
    'ring': 'smart-home',
    'nest': 'smart-home',
    'smart': 'smart-home',
    'phone': 'mobile',
    'iphone': 'mobile',
    'samsung': 'mobile',
    'pixel': 'mobile',
    'tablet': 'mobile',
    'ipad': 'mobile',
    'software': 'software',
    'microsoft': 'software',
    'adobe': 'software',
    'subscription': 'software'
  }
};

// Utility: HTTP GET request
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'VibeKeys/1.0 (Deal Aggregator)'
      }
    };
    
    client.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Parse price from text
function parsePrice(text) {
  const match = text.match(/\$[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/[$,]/g, ''));
  }
  return null;
}

// Detect category from title
function detectCategory(title) {
  const lowerTitle = title.toLowerCase();
  for (const [keyword, category] of Object.entries(CONFIG.categories)) {
    if (lowerTitle.includes(keyword)) {
      return category;
    }
  }
  return 'electronics';
}

// Parse Reddit JSON
async function scrapeReddit(subreddit, url) {
  console.log(`Scraping r/${subreddit}...`);
  const deals = [];
  
  try {
    const data = await httpGet(url);
    const json = JSON.parse(data);
    
    for (const post of json.data.children) {
      const item = post.data;
      
      // Skip stickied posts and non-deal posts
      if (item.stickied || item.is_self) continue;
      
      const price = parsePrice(item.title);
      
      deals.push({
        title: item.title,
        url: item.url,
        source: `reddit/${subreddit}`,
        price: price,
        category: detectCategory(item.title),
        score: item.score,
        timestamp: new Date(item.created_utc * 1000).toISOString(),
        comments: item.num_comments,
        permalink: `https://reddit.com${item.permalink}`
      });
    }
  } catch (err) {
    console.error(`Error scraping r/${subreddit}:`, err.message);
  }
  
  return deals;
}

// Parse Slickdeals RSS
async function scrapeSlickdeals() {
  console.log('Scraping Slickdeals...');
  const deals = [];
  
  try {
    const data = await httpGet(CONFIG.sources.slickdeals);
    
    // Simple XML parsing for RSS
    const items = data.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    for (const item of items) {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || [])[1] || 
                    (item.match(/<title>(.*?)<\/title>/) || [])[1] || '';
      const link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      
      if (title && link) {
        const price = parsePrice(title);
        
        deals.push({
          title: title.trim(),
          url: link.trim(),
          source: 'slickdeals',
          price: price,
          category: detectCategory(title),
          timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error('Error scraping Slickdeals:', err.message);
  }
  
  return deals;
}

// Main scraper
async function scrapeAll() {
  console.log('=== VibeKeys Deal Scraper ===');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  const allDeals = [];
  
  // Scrape all sources
  const slickdeals = await scrapeSlickdeals();
  allDeals.push(...slickdeals);
  
  const buildapcsales = await scrapeReddit('buildapcsales', CONFIG.sources.buildapcsales);
  allDeals.push(...buildapcsales);
  
  const gamedeals = await scrapeReddit('GameDeals', CONFIG.sources.gamedeals);
  allDeals.push(...gamedeals);
  
  // Sort by timestamp (newest first)
  allDeals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Deduplicate by URL
  const seen = new Set();
  const uniqueDeals = allDeals.filter(deal => {
    if (seen.has(deal.url)) return false;
    seen.add(deal.url);
    return true;
  });
  
  // Write output
  const output = {
    scraped_at: new Date().toISOString(),
    total_deals: uniqueDeals.length,
    sources: {
      slickdeals: slickdeals.length,
      buildapcsales: buildapcsales.length,
      gamedeals: gamedeals.length
    },
    deals: uniqueDeals
  };
  
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(output, null, 2));
  
  console.log(`\n=== Scraping Complete ===`);
  console.log(`Total deals: ${uniqueDeals.length}`);
  console.log(`Output: ${CONFIG.outputFile}`);
  
  return output;
}

// Run if called directly
if (require.main === module) {
  scrapeAll().catch(console.error);
}

module.exports = { scrapeAll, parsePrice, detectCategory };
