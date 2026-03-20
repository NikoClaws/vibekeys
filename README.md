# 🔑 VibeKeys

**Unlock today's best tech deals**

A modern tech deals website built with pure HTML, CSS, and JavaScript. No frameworks, no bloat – just fast, static pages.

## 🚀 Features

- **Modern Design**: Clean, responsive layout with purple accents (#7C3AED)
- **6 Categories**: Electronics, Software, Gaming, Smart Home, PC Parts, Mobile
- **Search**: Client-side search with instant results
- **Automation**: Scripts to scrape, generate, and update deals automatically
- **Cloudflare Ready**: Deploys to Cloudflare Pages with one command

## 📁 Site Structure

```
vibekeys/
├── index.html              # Homepage
├── electronics.html        # Category pages
├── software.html
├── gaming.html
├── smart-home.html
├── pc-parts.html
├── mobile.html
├── search.html             # Search page
├── about.html              # About page
├── article1-10.html        # Deal articles
├── style.css               # Main stylesheet
├── search-index.json       # Search data
├── favicon.svg             # Key icon
├── ads.txt                 # AdSense verification
├── wrangler.toml           # Cloudflare config
├── worker.js               # Cloudflare Worker (optional API)
└── automation/
    ├── scrape-deals.js     # Deal scraper
    ├── generate-article.js # Article generator
    ├── update-homepage.js  # Homepage updater
    └── daily-cron.sh       # Daily automation script
```

## 🛠️ Local Development

Just open any HTML file in your browser – no build step required!

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .
```

## 🤖 Automation

```bash
# Scrape deals from Reddit
node automation/scrape-deals.js

# Generate article pages
node automation/generate-article.js 10

# Update search index
node automation/update-homepage.js

# Run all (daily cron)
./automation/daily-cron.sh
```

## ☁️ Cloudflare Deployment

```bash
# Install wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy to vibekeys.com
wrangler pages deploy . --project-name=vibekeys
```

## 🎨 Customization

Edit CSS variables in `style.css`:

```css
:root {
  --primary: #7C3AED;        /* Purple accent */
  --primary-dark: #5B21B6;
  --accent: #EC4899;         /* Pink accent */
}
```

## 📝 License

MIT License

---

🔑 **VibeKeys** - Your key to the best prices
