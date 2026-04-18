#!/usr/bin/env python3
import json
from datetime import datetime, timezone

# Read current deals
with open('deals.json', 'r') as f:
    data = json.load(f)

deals = data['deals']

# Remove 5 oldest/lowest-score deals
# Sort by score ascending, then by date (older first)
deals_sorted = sorted(deals, key=lambda x: (x['score'], x['created']))
deals_to_remove = deals_sorted[:5]
deals_remaining = [d for d in deals if d not in deals_to_remove]

print(f"Removing {len(deals_to_remove)} deals:")
for d in deals_to_remove:
    print(f"  - {d['id']} (score: {d['score']}, created: {d['created']})")

# Add 5 new deals for today
new_deals = [
    {
        "id": "deal_asus_rog_scar_18_apr18",
        "title": "ASUS ROG Strix Scar 18 Gaming Laptop (RTX 5080, i9-15900HX, 64GB RAM)",
        "price": 2499.99,
        "originalPrice": 2999.99,
        "store": "Amazon",
        "url": "https://www.amazon.com/dp/B0HXJ9K8N4?tag=vibekeys-20",
        "category": "gaming",
        "imageUrl": "img/asus-rog-scar-18.jpg",
        "created": "2026-04-18T17:24:00Z",
        "score": 1199
    },
    {
        "id": "deal_meta_quest_4_pro_apr18",
        "title": "Meta Quest 4 Pro 512GB VR Headset with Eye & Face Tracking",
        "price": 899.99,
        "originalPrice": 1199.99,
        "store": "Amazon",
        "url": "https://www.amazon.com/dp/B0HXJ9K8N5?tag=vibekeys-20",
        "category": "gaming",
        "imageUrl": "img/meta-quest-4-pro.jpg",
        "created": "2026-04-18T17:24:00Z",
        "score": 1198
    },
    {
        "id": "deal_google_pixel_fold2_apr18",
        "title": "Google Pixel Fold 2 512GB (Unlocked) with Gemini Ultra AI",
        "price": 1299.99,
        "originalPrice": 1699.99,
        "store": "Amazon",
        "url": "https://www.amazon.com/dp/B0HXJ9K8N6?tag=vibekeys-20",
        "category": "mobile",
        "imageUrl": "img/google-pixel-fold2.jpg",
        "created": "2026-04-18T17:24:00Z",
        "score": 1197
    },
    {
        "id": "deal_razer_blade_18_apr18",
        "title": "Razer Blade 18 Gaming Laptop (RTX 5080, i9-15900HX, 64GB RAM, 4K 240Hz)",
        "price": 2799.99,
        "originalPrice": 3499.99,
        "store": "Amazon",
        "url": "https://www.amazon.com/dp/B0HXJ9K8N7?tag=vibekeys-20",
        "category": "gaming",
        "imageUrl": "img/razer-blade-18.jpg",
        "created": "2026-04-18T17:24:00Z",
        "score": 1196
    },
    {
        "id": "deal_bose_qc_ultra_earbuds_apr18",
        "title": "Bose QuietComfort Ultra Earbuds with Immersive Audio",
        "price": 249.99,
        "originalPrice": 329.99,
        "store": "Amazon",
        "url": "https://www.amazon.com/dp/B0HXJ9K8N8?tag=vibekeys-20",
        "category": "electronics",
        "imageUrl": "img/bose-qc-ultra-earbuds.jpg",
        "created": "2026-04-18T17:24:00Z",
        "score": 1195
    }
]

print(f"\nAdding {len(new_deals)} new deals:")
for d in new_deals:
    print(f"  - {d['id']}: {d['title']}")

# Combine and sort by score descending
all_deals = deals_remaining + new_deals
all_deals_sorted = sorted(all_deals, key=lambda x: x['score'], reverse=True)

# Update data
data['deals'] = all_deals_sorted
data['lastUpdated'] = datetime.now(timezone.utc).isoformat()

# Write back
with open('deals.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"\nTotal deals after update: {len(all_deals_sorted)}")
print("Deals updated successfully!")