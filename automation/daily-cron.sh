#!/bin/bash
#
# VibeKeys - Daily Automation Script
# Run via cron: 0 6 * * * /path/to/daily-cron.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$SCRIPT_DIR/daily.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

log "=== VibeKeys Daily Update ==="
cd "$PROJECT_DIR"

# Step 1: Scrape deals
log "Step 1: Scraping deals..."
node automation/scrape-deals.js || { log "Scraping failed"; exit 1; }

# Step 2: Generate articles
log "Step 2: Generating articles..."
node automation/generate-article.js 10 || { log "Article generation failed"; exit 1; }

# Step 3: Update search index
log "Step 3: Updating homepage..."
node automation/update-homepage.js || { log "Update failed"; exit 1; }

# Step 4: Git operations
log "Step 4: Git commit and push..."
if [ -d ".git" ]; then
  git add -A
  if ! git diff --staged --quiet; then
    git commit -m "Daily update: $(date '+%Y-%m-%d %H:%M')"
    git push origin main 2>/dev/null || git push origin master 2>/dev/null || log "Push skipped"
  fi
fi

# Step 5: Deploy to Cloudflare
log "Step 5: Deploying..."
if command -v wrangler &> /dev/null; then
  wrangler pages deploy . --project-name=vibekeys 2>/dev/null || log "Deploy skipped"
fi

log "=== Daily update complete! ==="
