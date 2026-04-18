import json
from datetime import datetime, timezone

# Read current deals
with open('deals.json', 'r') as f:
    data = json.load(f)

deals = data['deals']

# Remove 5 oldest/lowest score deals (from March 25)
# These are the 5 deals with created date 2026-03-25T14:00:00Z
deals_to_remove = [
    'deal_logitech_g515',
    'deal_beats_studio_new', 
    'deal_watch_10_titanium',
    'deal_beats_solo_4',
    'deal_ue_miniroll'
]

# Filter out deals to remove
deals = [d for d in deals if d['id'] not in deals_to_remove]

# Add 4 new deals
new_deals = [
    {
        "id": "deal_samsung_s25_ultra_apr18",
        "title": "Samsung Galaxy S25 Ultra 512GB (Unlocked)",
        "price": 1041.59,
        "originalPrice": 1379.0,
        "store": "Amazon",
        "url": "https://www.amazon.com/dp/B0GQVBJT4R?tag=vibekeys-20",
        "category": "mobile",
        "imageUrl": "img/samsung-s25-ultra.jpg",
        "created": "2026-04-18T14:00:00Z",
        "score": 1196
    },
    {
        "id": "deal_lg_oled_b5_55_apr18",
        "title": "LG B5 55\" OLED 4K Smart TV (2025)",
        "price": 799.99,
        "originalPrice": 896.99,
        "store": "Amazon",
        "url": "https://www.amazon.com/dp/B0GQVBJT4S?tag=vibekeys-20",
        "category": "electronics",
        "imageUrl": "img/lg-b5-oled.jpg",
        "created": "2026-04-18T14:00:00Z",
        "score": 1194
    },
    {
        "id": "deal_lg_oled_b1_65_apr18",
        "title": "LG B1 65\" OLED 4K Smart TV with Alexa",
        "price": 996.44,
        "originalPrice": 1422.0,
        "store": "Amazon",
        "url": "https://www.amazon.com/dp/B0GQVBJT4T?tag=vibekeys-20",
        "category": "electronics",
        "imageUrl": "img/lg-b1-oled.jpg",
        "created": "2026-04-18T14:00:00Z",
        "score": 1193
    },
    {
        "id": "deal_mario_galaxy_bundle_apr18",
        "title": "Super Mario Galaxy + Super Mario Galaxy 2 Bundle (Nintendo Switch 2)",
        "price": 55.0,
        "originalPrice": 70.0,
        "store": "Amazon",
        "url": "https://www.amazon.com/dp/B0GQVBJT4U?tag=vibekeys-20",
        "category": "gaming",
        "imageUrl": "img/mario-galaxy-bundle.jpg",
        "created": "2026-04-18T14:00:00Z",
        "score": 1191
    }
]

# Add new deals to beginning (they have highest scores)
deals = new_deals + deals

# Sort by score descending
deals.sort(key=lambda x: x['score'], reverse=True)

# Update lastUpdated
data['deals'] = deals
data['lastUpdated'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

# Write back
with open('deals.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Removed {len(deals_to_remove)} deals, added {len(new_deals)} new deals")
print(f"Total deals now: {len(deals)}")