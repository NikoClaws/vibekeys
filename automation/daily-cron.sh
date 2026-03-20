#!/bin/bash
#
# VibeKeys Daily Update Script
# Run this via cron to keep the site updated with fresh deals
#
# Cron example (run daily at 9 AM):
# 0 9 * * * /home/user/workspace/vibekeys/automation/daily-cron.sh >> /var/log/vibekeys-cron.log 2>&1
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$SCRIPT_DIR/daily-cron.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== VibeKeys Daily Update Starting ==="

# Change to site directory
cd "$SITE_DIR"
log "Working directory: $SITE_DIR"

# Step 1: Scrape new deals
log "Step 1: Scraping deals..."
if node automation/scrape-deals.js; then
    log "✓ Deals scraped successfully"
else
    log "✗ Error scraping deals"
    exit 1
fi

# Step 2: Generate article pages
log "Step 2: Generating articles..."
if node automation/generate-article.js; then
    log "✓ Articles generated successfully"
else
    log "✗ Error generating articles"
    exit 1
fi

# Step 3: Update site (index, categories, search)
log "Step 3: Updating site..."
if node automation/update-site.js; then
    log "✓ Site updated successfully"
else
    log "✗ Error updating site"
    exit 1
fi

# Step 4: Git commit and push
log "Step 4: Committing changes..."
if git diff --quiet && git diff --staged --quiet; then
    log "No changes to commit"
else
    git add -A
    git commit -m "Daily deals update $(date +%Y-%m-%d)"
    
    if git push; then
        log "✓ Changes pushed to git"
    else
        log "⚠ Could not push to git (might need auth)"
    fi
fi

# Step 5: Deploy to Cloudflare
log "Step 5: Deploying to Cloudflare..."

# Set up environment
export PATH="$HOME/.local/bin:$PATH"

# Load Cloudflare credentials if available
if [ -f "$HOME/.cloudflare-token" ]; then
    export CLOUDFLARE_API_TOKEN=$(cat "$HOME/.cloudflare-token")
fi

if [ -f "$HOME/.cloudflare-account-id" ]; then
    export CLOUDFLARE_ACCOUNT_ID=$(cat "$HOME/.cloudflare-account-id")
fi

# Deploy with wrangler
if command -v wrangler &> /dev/null; then
    if wrangler deploy 2>&1 | tee -a "$LOG_FILE"; then
        log "✓ Deployed to Cloudflare successfully"
    else
        log "⚠ Cloudflare deployment had issues (check logs)"
    fi
else
    log "⚠ Wrangler not found, skipping Cloudflare deploy"
fi

log "=== VibeKeys Daily Update Complete ==="
log ""
