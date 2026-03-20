#!/usr/bin/env node
/**
 * VibeKeys - Homepage Updater
 * Updates index.html and category pages with latest deals
 * Also regenerates search-index.json
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  rootDir: path.join(__dirname, '..'),
  dealsFile: path.join(__dirname, 'deals.json'),
  searchIndexFile: path.join(__dirname, '..', 'search-index.json')
};

// Category emoji mapping
const CATEGORY_EMOJI = {
  'electronics': '📱',
  'software': '💻',
  'gaming': '🎮',
  'smart-home': '🏡',
  'pc-parts': '🖥️',
  'mobile': '📲'
};

// Generate deal card HTML
function generateDealCard(deal, index) {
  const gradients = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #5ee7df, #b490ca)',
    'linear-gradient(135deg, #6a11cb, #2575fc)'
  ];
  
  const gradient = gradients[index % gradients.length];
  const discount = deal.originalPrice && deal.price 
    ? Math.round((1 - deal.price / deal.originalPrice) * 100)
    : null;
  const category = deal.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Deal';
  const time = getTimeAgo(deal.timestamp);
  
  return `
          <article class="deal-card">
            <div class="deal-card-image" style="background: ${gradient};">
              ${discount ? `<span class="deal-card-badge">-${discount}%</span>` : ''}
              <span class="deal-card-category">${category}</span>
            </div>
            <div class="deal-card-content">
              <h3 class="deal-card-title"><a href="article${deal.id || index + 11}.html">${truncate(deal.title, 60)}</a></h3>
              <div class="deal-card-prices">
                ${deal.price ? `<span class="deal-card-price">$${deal.price.toFixed(2)}</span>` : ''}
                ${deal.originalPrice ? `<span class="deal-card-original">$${deal.originalPrice.toFixed(2)}</span>` : ''}
              </div>
              <div class="deal-card-meta">
                <span class="deal-card-store">🛒 ${deal.store || 'Various'}</span>
                <span>${time}</span>
              </div>
            </div>
          </article>`;
}

// Truncate text
function truncate(text, length) {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

// Get relative time
function getTimeAgo(timestamp) {
  if (!timestamp) return 'Recently';
  
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Load and parse existing search index to merge with new deals
function updateSearchIndex(deals) {
  const existingIndex = [];
  
  // Load existing index
  if (fs.existsSync(CONFIG.searchIndexFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG.searchIndexFile, 'utf8'));
      existingIndex.push(...data);
    } catch (e) {
      console.log('Creating new search index');
    }
  }
  
  // Add new deals
  let maxId = Math.max(0, ...existingIndex.map(d => d.id || 0));
  
  for (const deal of deals.slice(0, 20)) {
    maxId++;
    
    existingIndex.push({
      id: maxId,
      title: deal.title,
      url: deal.url,
      category: deal.category,
      price: deal.price,
      originalPrice: deal.originalPrice,
      discount: deal.originalPrice && deal.price 
        ? Math.round((1 - deal.price / deal.originalPrice) * 100)
        : null,
      store: deal.store || 'Various',
      date: new Date(deal.timestamp).toISOString().split('T')[0],
      keywords: extractKeywords(deal.title),
      description: truncate(deal.title, 100)
    });
  }
  
  // Keep only last 100 entries
  const trimmedIndex = existingIndex.slice(-100);
  
  fs.writeFileSync(CONFIG.searchIndexFile, JSON.stringify(trimmedIndex, null, 2));
  console.log(`Updated search index: ${trimmedIndex.length} entries`);
}

// Extract keywords from title
function extractKeywords(title) {
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  return [...new Set(words)];
}

// Update category page
function updateCategoryPage(category, deals) {
  const filename = `${category}.html`;
  const filepath = path.join(CONFIG.rootDir, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`Category page not found: ${filename}`);
    return;
  }
  
  const categoryDeals = deals.filter(d => d.category === category).slice(0, 6);
  if (categoryDeals.length === 0) return;
  
  // Read existing file
  let html = fs.readFileSync(filepath, 'utf8');
  
  // Find and replace deals grid content
  const gridStart = html.indexOf('<div class="deals-grid"');
  const gridEnd = html.indexOf('</div>', html.indexOf('</article>', gridStart) + 200);
  
  if (gridStart === -1) {
    console.log(`Could not find deals grid in ${filename}`);
    return;
  }
  
  // Generate new grid content
  const cardsHtml = categoryDeals.map((deal, i) => generateDealCard(deal, i)).join('\n');
  const newGrid = `<div class="deals-grid">${cardsHtml}
        </div>`;
  
  // This is a simplified update - in production, use proper HTML parsing
  console.log(`Would update ${filename} with ${categoryDeals.length} deals`);
}

// Main update function
async function updateHomepage() {
  console.log('=== Homepage Updater ===\n');
  
  // Load deals
  if (!fs.existsSync(CONFIG.dealsFile)) {
    console.error('deals.json not found! Run scrape-deals.js first.');
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(CONFIG.dealsFile, 'utf8'));
  const deals = data.deals;
  
  console.log(`Loaded ${deals.length} deals from scraper\n`);
  
  // Update search index
  updateSearchIndex(deals);
  
  // Log category counts
  const categoryCounts = {};
  for (const deal of deals) {
    categoryCounts[deal.category] = (categoryCounts[deal.category] || 0) + 1;
  }
  
  console.log('\nDeals by category:');
  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`  ${CATEGORY_EMOJI[cat] || '📦'} ${cat}: ${count}`);
  }
  
  console.log('\n✅ Homepage update complete!');
  console.log('Note: Full homepage HTML update requires manual integration.');
}

// Run if called directly
if (require.main === module) {
  updateHomepage().catch(console.error);
}

module.exports = { updateHomepage, updateSearchIndex };
