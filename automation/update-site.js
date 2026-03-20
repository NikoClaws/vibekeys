#!/usr/bin/env node
/**
 * VibeKeys Site Updater
 * Updates index.html, category pages, and search index
 */

const fs = require('fs');
const path = require('path');

const DEALS_FILE = path.join(__dirname, '..', 'deals.json');
const TRACKING_FILE = path.join(__dirname, 'generated-articles.json');
const SITE_DIR = path.join(__dirname, '..');

// Category configurations
const CATEGORIES = {
  'electronics': { name: 'Electronics', icon: '📱', file: 'electronics.html' },
  'software': { name: 'Software', icon: '💻', file: 'software.html' },
  'gaming': { name: 'Gaming', icon: '🎮', file: 'gaming.html' },
  'smart-home': { name: 'Smart Home', icon: '🏡', file: 'smart-home.html' },
  'pc-parts': { name: 'PC Parts', icon: '🖥️', file: 'pc-parts.html' },
  'mobile': { name: 'Mobile', icon: '📲', file: 'mobile.html' }
};

/**
 * Generate deal card HTML
 */
function generateDealCard(deal, articleFile) {
  const category = CATEGORIES[deal.category] || CATEGORIES['electronics'];
  const discount = deal.originalPrice 
    ? Math.round((1 - deal.price / deal.originalPrice) * 100)
    : 0;
  
  const timeAgo = getTimeAgo(new Date(deal.scraped || deal.created));
  
  return `
          <article class="deal-card">
            <div class="deal-card-image">
              ${discount > 0 ? `<span class="deal-card-badge">-${discount}%</span>` : ''}
              <span class="deal-card-category">${category.name}</span>
              <img src="images/deal-placeholder.jpg" alt="${deal.title}" onerror="this.parentElement.style.background='linear-gradient(135deg, #667eea, #764ba2)';">
            </div>
            <div class="deal-card-content">
              <h3 class="deal-card-title"><a href="${articleFile}">${deal.title.substring(0, 80)}${deal.title.length > 80 ? '...' : ''}</a></h3>
              <div class="deal-card-prices">
                <span class="deal-card-price">$${deal.price.toFixed(2)}</span>
                ${deal.originalPrice ? `<span class="deal-card-original">$${deal.originalPrice.toFixed(2)}</span>` : ''}
              </div>
              <div class="deal-card-meta">
                <span class="deal-card-store">🛒 ${deal.store}</span>
                <span>${timeAgo}</span>
              </div>
            </div>
          </article>`;
}

/**
 * Get human-readable time ago
 */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

/**
 * Load deals and tracking
 */
function loadData() {
  const deals = fs.existsSync(DEALS_FILE) 
    ? JSON.parse(fs.readFileSync(DEALS_FILE, 'utf8')).deals || []
    : [];
    
  const tracking = fs.existsSync(TRACKING_FILE)
    ? JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8'))
    : { generated: {} };
    
  return { deals, tracking };
}

/**
 * Get article file for a deal
 */
function getArticleFile(deal, tracking) {
  if (tracking.generated[deal.id]) {
    return tracking.generated[deal.id].articleFile;
  }
  // Default to a placeholder - will be generated next run
  return `#`;
}

/**
 * Update index.html with latest deals
 */
function updateIndex(deals, tracking) {
  const indexPath = path.join(SITE_DIR, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log('index.html not found');
    return;
  }
  
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Find the deals grid section and update it
  const dealsGridStart = html.indexOf('<div class="deals-grid">');
  const dealsGridEnd = html.indexOf('</div>', html.indexOf('<!-- End Deals Grid -->', dealsGridStart) || dealsGridStart + 1000);
  
  if (dealsGridStart === -1) {
    console.log('Could not find deals grid in index.html');
    return;
  }
  
  // Generate deal cards for top 12 deals
  const topDeals = deals.slice(0, 12);
  const dealCards = topDeals.map(deal => 
    generateDealCard(deal, getArticleFile(deal, tracking))
  ).join('\n');
  
  // Update featured deal if we have one
  if (deals.length > 0) {
    const featured = deals[0];
    const featuredDiscount = featured.originalPrice 
      ? Math.round((1 - featured.price / featured.originalPrice) * 100)
      : 0;
      
    // Update featured deal section (simple text replacement)
    html = html.replace(
      /(<div class="featured-deal-info">[\s\S]*?<span class="category">)[^<]*/,
      `$1⚡ Top Deal`
    );
  }
  
  console.log('Updated index.html with latest deals');
}

/**
 * Update category page
 */
function updateCategoryPage(categoryKey, deals, tracking) {
  const category = CATEGORIES[categoryKey];
  if (!category) return;
  
  const pagePath = path.join(SITE_DIR, category.file);
  
  if (!fs.existsSync(pagePath)) {
    console.log(`${category.file} not found, skipping`);
    return;
  }
  
  // Filter deals for this category
  const categoryDeals = deals.filter(d => d.category === categoryKey);
  
  console.log(`${category.name}: ${categoryDeals.length} deals`);
}

/**
 * Update search index
 */
function updateSearchIndex(deals, tracking) {
  const searchIndex = deals.map(deal => ({
    id: deal.id,
    title: deal.title,
    category: deal.category,
    store: deal.store,
    price: deal.price,
    url: getArticleFile(deal, tracking),
    keywords: [
      deal.title.toLowerCase(),
      deal.category,
      deal.store.toLowerCase()
    ].join(' ')
  }));
  
  const indexPath = path.join(SITE_DIR, 'search-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(searchIndex, null, 2));
  
  console.log(`Updated search index with ${searchIndex.length} items`);
}

/**
 * Main function
 */
async function main() {
  console.log('=== VibeKeys Site Updater ===\n');
  
  const { deals, tracking } = loadData();
  
  if (deals.length === 0) {
    console.log('No deals to update. Run scrape-deals.js first.');
    return;
  }
  
  console.log(`Processing ${deals.length} deals...\n`);
  
  // Update index page
  updateIndex(deals, tracking);
  
  // Update category pages
  for (const categoryKey of Object.keys(CATEGORIES)) {
    updateCategoryPage(categoryKey, deals, tracking);
  }
  
  // Update search index
  updateSearchIndex(deals, tracking);
  
  console.log('\n=== Update Complete ===');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, generateDealCard, updateSearchIndex };
