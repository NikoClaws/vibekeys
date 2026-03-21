#!/usr/bin/env node
/**
 * VibeKeys Article Generator
 * Generates article pages from deals.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEALS_FILE = path.join(__dirname, '..', 'deals.json');
const ARTICLES_DIR = path.join(__dirname, '..');
const IMAGES_DIR = path.join(__dirname, '..', 'images');
const TRACKING_FILE = path.join(__dirname, 'generated-articles.json');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Category display names and icons
const CATEGORY_INFO = {
  'electronics': { name: 'Electronics', icon: '📱' },
  'software': { name: 'Software', icon: '💻' },
  'gaming': { name: 'Gaming', icon: '🎮' },
  'smart-home': { name: 'Smart Home', icon: '🏡' },
  'pc-parts': { name: 'PC Parts', icon: '🖥️' },
  'mobile': { name: 'Mobile', icon: '📲' }
};

/**
 * Download image from URL
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    if (!url || !url.startsWith('http')) {
      resolve(null);
      return;
    }
    
    const file = fs.createWriteStream(filepath);
    
    https.get(url, { headers: { 'User-Agent': 'VibeKeys/1.0' } }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filepath);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(filepath);
        resolve(null);
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      resolve(null);
    });
  });
}

/**
 * Generate article HTML
 */
function generateArticleHTML(deal, articleNum, imagePath) {
  const category = CATEGORY_INFO[deal.category] || CATEGORY_INFO['electronics'];
  const discount = deal.originalPrice 
    ? Math.round((1 - deal.price / deal.originalPrice) * 100)
    : 0;
  
  const imageTag = imagePath 
    ? `<img src="${imagePath}" alt="${deal.title}" onerror="this.parentElement.style.background='linear-gradient(135deg, #7C3AED, #EC4899)';">`
    : '';
  
  const createdDate = new Date(deal.created || deal.scraped);
  const dateStr = createdDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deal.title} - VibeKeys Deal</title>
  <meta name="description" content="Get ${deal.title} for just $${deal.price}. Save ${discount}% on this amazing deal!">
  <link rel="stylesheet" href="style.css">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9902886208446482" crossorigin="anonymous"></script>
</head>
<body>
  <header>
    <div class="container">
      <div class="header-top">
        <a href="index.html" class="logo">
          <span class="logo-icon">🔑</span>
          Vibe<span>Keys</span>
        </a>
        <form class="header-search" action="search.html" method="get">
          <input type="text" name="q" placeholder="Search deals...">
          <button type="submit">Search</button>
        </form>
      </div>
    </div>
    <nav>
      <div class="container">
        <ul id="nav-menu">
          <li><a href="index.html">🏠 Home</a></li>
          <li><a href="electronics.html">📱 Electronics</a></li>
          <li><a href="software.html">💻 Software</a></li>
          <li><a href="gaming.html">🎮 Gaming</a></li>
          <li><a href="smart-home.html">🏡 Smart Home</a></li>
          <li><a href="pc-parts.html">🖥️ PC Parts</a></li>
          <li><a href="mobile.html">📲 Mobile</a></li>
        </ul>
      </div>
    </nav>
  </header>

  <main class="container">
    <article class="article-page">
      <div class="breadcrumb">
        <a href="index.html">Home</a> / 
        <a href="${deal.category}.html">${category.name}</a> / 
        <span>Deal</span>
      </div>

      <header class="article-header">
        <span class="article-category">${category.icon} ${category.name}</span>
        <h1>${deal.title}</h1>
        <div class="article-meta">
          <span>📅 ${dateStr}</span>
          <span>🛒 ${deal.store}</span>
          ${deal.source ? `<span>📍 ${deal.source}</span>` : ''}
        </div>
      </header>

      <div class="article-deal-card">
        <div class="article-deal-image">
          ${imageTag}
          ${discount > 0 ? `<span class="deal-badge">-${discount}% OFF</span>` : ''}
        </div>
        <div class="article-deal-info">
          <div class="article-deal-prices">
            <span class="price-current">$${deal.price.toFixed(2)}</span>
            ${deal.originalPrice ? `<span class="price-original">$${deal.originalPrice.toFixed(2)}</span>` : ''}
            ${discount > 0 ? `<span class="savings">Save $${(deal.originalPrice - deal.price).toFixed(2)}</span>` : ''}
          </div>
          <a href="${deal.url}" class="btn btn-primary btn-large" target="_blank" rel="noopener sponsored">
            🛒 Get This Deal at ${deal.store} →
          </a>
          <p class="deal-note">⚡ Prices can change at any time. Click to verify current price.</p>
        </div>
      </div>

      <div class="article-content">
        <h2>Deal Details</h2>
        <p>We found this great deal on <strong>${deal.title}</strong> at <strong>${deal.store}</strong>!</p>
        
        ${discount > 0 ? `<p>This is a <strong>${discount}% discount</strong> from the original price of $${deal.originalPrice.toFixed(2)}, saving you <strong>$${(deal.originalPrice - deal.price).toFixed(2)}</strong>.</p>` : ''}
        
        <h2>Why This Deal Is Great</h2>
        <ul>
          <li>✅ Great price from a trusted retailer</li>
          <li>✅ ${discount > 0 ? `${discount}% off the regular price` : 'Competitive pricing'}</li>
          <li>✅ Available at ${deal.store}</li>
          ${deal.score && deal.score > 50 ? '<li>✅ Highly rated by the community</li>' : ''}
        </ul>

        <h2>How to Get This Deal</h2>
        <ol>
          <li>Click the "Get This Deal" button above</li>
          <li>You'll be redirected to ${deal.store}</li>
          <li>Add the item to your cart</li>
          <li>Complete checkout at the discounted price</li>
        </ol>

        <div class="disclaimer">
          <h3>⚠️ Important Notice</h3>
          <p>Prices and availability are subject to change. We recommend acting quickly on deals as they may expire or sell out. Always verify the final price at checkout.</p>
          <p><strong>Affiliate Disclosure:</strong> VibeKeys may earn a commission from purchases made through our links at no extra cost to you.</p>
        </div>
      </div>

      <!-- Ad Slot -->
      <div class="ad-container">
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="ca-pub-9902886208446482"
             data-ad-slot="auto"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      </div>

    </article>
  </main>

  <footer>
    <div class="container">
      <div class="footer-links">
        <a href="about.html">About</a>
        <a href="privacy.html">Privacy Policy</a>
        <a href="terms.html">Terms of Service</a>
        <a href="dmca.html">DMCA</a>
        <a href="contact.html">Contact</a>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 VibeKeys. All rights reserved.</p>
        <p class="affiliate-disclosure">Affiliate Disclosure: We earn commissions from qualifying purchases.</p>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

/**
 * Load tracking data
 */
function loadTracking() {
  try {
    if (fs.existsSync(TRACKING_FILE)) {
      return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('No tracking file found, creating new one');
  }
  return { generated: {}, nextArticleNum: 11, lastRun: null };
}

/**
 * Save tracking data
 */
function saveTracking(data) {
  data.lastRun = new Date().toISOString();
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(data, null, 2));
}

/**
 * Main function
 */
async function main() {
  console.log('=== VibeKeys Article Generator ===\n');
  
  // Load deals
  if (!fs.existsSync(DEALS_FILE)) {
    console.log('No deals.json found. Run scrape-deals.js first.');
    return;
  }
  
  const dealsData = JSON.parse(fs.readFileSync(DEALS_FILE, 'utf8'));
  const deals = dealsData.deals || [];
  
  if (deals.length === 0) {
    console.log('No deals to process');
    return;
  }
  
  // Load tracking
  const tracking = loadTracking();
  
  let generated = 0;
  
  // Process top deals (up to 10 new articles per run)
  const topDeals = deals.slice(0, 20);
  
  for (const deal of topDeals) {
    // Skip if already generated
    if (tracking.generated[deal.id]) {
      continue;
    }
    
    // Limit new articles per run
    if (generated >= 5) {
      console.log('Generated 5 articles this run, stopping');
      break;
    }
    
    const articleNum = tracking.nextArticleNum;
    const articleFile = `article${articleNum}.html`;
    const articlePath = path.join(ARTICLES_DIR, articleFile);
    
    console.log(`Generating ${articleFile}: ${deal.title.substring(0, 50)}...`);
    
    // Download image if available
    let imagePath = null;
    if (deal.imageUrl) {
      // Check if it's already a local path
      if (deal.imageUrl.startsWith('images/')) {
        imagePath = deal.imageUrl;
      } else {
        const ext = deal.imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg';
        const imageFile = `deal-${articleNum}.${ext}`;
        const fullImagePath = path.join(IMAGES_DIR, imageFile);
        
        const downloaded = await downloadImage(deal.imageUrl, fullImagePath);
        if (downloaded) {
          imagePath = `images/${imageFile}`;
          console.log(`  Downloaded image: ${imagePath}`);
        }
      }
    }
    
    // Generate HTML
    const html = generateArticleHTML(deal, articleNum, imagePath);
    fs.writeFileSync(articlePath, html);
    
    // Update tracking
    tracking.generated[deal.id] = {
      articleNum,
      articleFile,
      title: deal.title,
      generatedAt: new Date().toISOString()
    };
    tracking.nextArticleNum = articleNum + 1;
    
    generated++;
    console.log(`  ✓ Generated ${articleFile}`);
  }
  
  // Save tracking
  saveTracking(tracking);
  
  console.log(`\n=== Generation Complete ===`);
  console.log(`Articles generated this run: ${generated}`);
  console.log(`Total articles tracked: ${Object.keys(tracking.generated).length}`);
  
  return { generated, tracking };
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, generateArticleHTML };
