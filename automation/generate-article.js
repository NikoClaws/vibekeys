#!/usr/bin/env node
/**
 * VibeKeys - Article Generator
 * Generates HTML articles from deal data
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  dealsFile: path.join(__dirname, 'deals.json'),
  outputDir: path.join(__dirname, '..'),
  articlePrefix: 'article'
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

// Store name mapping
const STORE_MAP = {
  'amazon.com': 'Amazon',
  'bestbuy.com': 'Best Buy',
  'newegg.com': 'Newegg',
  'walmart.com': 'Walmart',
  'bhphotovideo.com': 'B&H Photo',
  'target.com': 'Target',
  'slickdeals': 'Various'
};

// Get store name from URL
function getStoreName(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return STORE_MAP[hostname] || hostname;
  } catch {
    return 'Retailer';
  }
}

// Format price
function formatPrice(price) {
  if (!price) return 'See Deal';
  return `$${price.toFixed(2)}`;
}

// Generate article HTML
function generateArticleHTML(deal, articleId) {
  const emoji = CATEGORY_EMOJI[deal.category] || '🔥';
  const store = getStoreName(deal.url);
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Calculate discount if we have both prices
  let discountBadge = '';
  if (deal.originalPrice && deal.price) {
    const discount = Math.round((1 - deal.price / deal.originalPrice) * 100);
    discountBadge = `<span class="discount-badge">-${discount}% OFF</span>`;
  }
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deal.title} - VibeKeys</title>
  <meta name="description" content="${deal.title}. ${deal.price ? `Now ${formatPrice(deal.price)}!` : 'Great deal available now!'}">
  <link rel="stylesheet" href="style.css">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <header>
    <div class="container">
      <div class="header-top">
        <a href="index.html" class="logo"><span class="logo-icon">🔥</span>Vibe<span>Keys</span></a>
        <form class="header-search" action="search.html" method="get">
          <input type="text" name="q" placeholder="Search deals...">
          <button type="submit">Search</button>
        </form>
      </div>
    </div>
    <nav><div class="container"><ul id="nav-menu">
      <li><a href="index.html">🏠 Home</a></li>
      <li><a href="electronics.html">📱 Electronics</a></li>
      <li><a href="software.html">💻 Software</a></li>
      <li><a href="gaming.html">🎮 Gaming</a></li>
      <li><a href="smart-home.html">🏡 Smart Home</a></li>
      <li><a href="pc-parts.html">🖥️ PC Parts</a></li>
      <li><a href="mobile.html">📲 Mobile</a></li>
    </ul></div></nav>
  </header>

  <article class="article-container">
    <header class="article-header">
      <a href="${deal.category}.html" class="article-category">${emoji} ${deal.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</a>
      <h1>${deal.title}</h1>
      <div class="article-meta">
        <span>📅 ${date}</span>
        <span>🏪 ${store}</span>
        <span>🔥 Hot Deal</span>
      </div>
    </header>

    <div class="article-deal-box">
      <h2>${deal.title}</h2>
      <div class="article-deal-prices">
        ${deal.price ? `<span class="price-current">${formatPrice(deal.price)}</span>` : ''}
        ${deal.originalPrice ? `<span class="price-original">${formatPrice(deal.originalPrice)}</span>` : ''}
        ${discountBadge}
      </div>
      <div class="deal-details">
        <div class="deal-detail"><label>Store</label><span>${store}</span></div>
        <div class="deal-detail"><label>Source</label><span>${deal.source || 'Web'}</span></div>
        ${deal.comments ? `<div class="deal-detail"><label>Discussion</label><span>${deal.comments} comments</span></div>` : ''}
        <div class="deal-detail"><label>Posted</label><span>${new Date(deal.timestamp).toLocaleDateString()}</span></div>
      </div>
      <a href="${deal.url}" target="_blank" rel="nofollow noopener" class="btn btn-success">🛒 Get This Deal →</a>
      ${deal.permalink ? `<a href="${deal.permalink}" target="_blank" rel="noopener" class="btn btn-outline" style="margin-left: 10px;">💬 Discussion</a>` : ''}
    </div>

    <div class="article-content">
      <h2>About This Deal</h2>
      <p>We found this deal and wanted to share it with you! Click the button above to go directly to the retailer and claim this offer before it expires.</p>
      
      <h2>Deal Tips</h2>
      <ul>
        <li>Prices and availability can change quickly - act fast!</li>
        <li>Check for additional coupons or promo codes at checkout</li>
        <li>Compare prices across multiple retailers</li>
        <li>Read reviews before purchasing</li>
      </ul>
    </div>

    <section class="comments-section">
      <h2 class="section-title">Comments</h2>
      <div id="disqus_thread"></div>
    </section>
  </article>

  <footer><div class="container"><div class="footer-bottom"><p>&copy; 2025 VibeKeys. All rights reserved.</p></div></div></footer>
</body>
</html>`;

  return html;
}

// Find next available article number
function getNextArticleNumber() {
  const files = fs.readdirSync(CONFIG.outputDir);
  const articleFiles = files.filter(f => f.match(/^article\d+\.html$/));
  
  if (articleFiles.length === 0) return 11; // Start after our template articles
  
  const numbers = articleFiles.map(f => parseInt(f.match(/\d+/)[0]));
  return Math.max(...numbers) + 1;
}

// Generate articles from deals
async function generateArticles(limit = 10) {
  console.log('=== Article Generator ===\n');
  
  // Load deals
  if (!fs.existsSync(CONFIG.dealsFile)) {
    console.error('deals.json not found! Run scrape-deals.js first.');
    return [];
  }
  
  const data = JSON.parse(fs.readFileSync(CONFIG.dealsFile, 'utf8'));
  const deals = data.deals.slice(0, limit);
  
  const generated = [];
  let articleNum = getNextArticleNumber();
  
  for (const deal of deals) {
    // Skip deals without prices (probably not good deals)
    if (!deal.price && !deal.title.includes('$')) continue;
    
    const filename = `${CONFIG.articlePrefix}${articleNum}.html`;
    const filepath = path.join(CONFIG.outputDir, filename);
    
    const html = generateArticleHTML(deal, articleNum);
    fs.writeFileSync(filepath, html);
    
    console.log(`Generated: ${filename} - ${deal.title.substring(0, 50)}...`);
    
    generated.push({
      id: articleNum,
      filename,
      deal
    });
    
    articleNum++;
  }
  
  console.log(`\nGenerated ${generated.length} articles`);
  return generated;
}

// Run if called directly
if (require.main === module) {
  const limit = parseInt(process.argv[2]) || 10;
  generateArticles(limit).catch(console.error);
}

module.exports = { generateArticles, generateArticleHTML };
