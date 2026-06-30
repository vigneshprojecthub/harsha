"""
Instagram Integration Service
Fetches posts/reels from Instagram Graph API (Business account required).

Setup:
1. Create Facebook App at developers.facebook.com
2. Add Instagram Graph API product
3. Connect your Instagram Business account
4. Generate a long-lived access token

Env vars:
  INSTAGRAM_ACCESS_TOKEN  — long-lived token (60 days, must be refreshed)
  INSTAGRAM_BUSINESS_ID   — your IG business account ID
"""

import httpx
import os
from typing import Optional

IG_TOKEN    = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
IG_BIZ_ID   = os.getenv("INSTAGRAM_BUSINESS_ID", "")
IG_VERSION  = "v21.0"
IG_BASE     = f"https://graph.facebook.com/{IG_VERSION}"

# In-memory cache (replace with Redis in production)
_post_cache: dict = {"data": [], "fetched_at": 0}
CACHE_TTL = 900  # 15 minutes — Instagram signed CDN URLs expire, keep cache short


async def fetch_instagram_posts(limit: int = 24, media_type: Optional[str] = None) -> list:
    """
    Fetch recent posts from Instagram Business account.
    Returns list of post objects with image_url, caption, permalink, media_type.
    Falls back to demo posts if API not configured.

    Note: Instagram Graph API returns posts in REVERSE-CHRONOLOGICAL order
    (newest first) by default — this matches your actual Instagram feed order.
    """
    import time

    # Return cache if fresh (cache stores up to 50, slice per-request)
    if _post_cache["data"] and time.time() - _post_cache["fetched_at"] < CACHE_TTL:
        posts = _post_cache["data"]
        if media_type:
            posts = [p for p in posts if p.get("media_type") == media_type.upper()]
        return posts[:limit]

    if not IG_TOKEN or not IG_BIZ_ID:
        return _demo_posts(limit, media_type)

    fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{media_type,media_url,thumbnail_url}"
    url    = f"{IG_BASE}/{IG_BIZ_ID}/media"
    # Fetch up to 50 — Instagram API max per page is 25, so we paginate once
    params = {"fields": fields, "limit": 50, "access_token": IG_TOKEN}

    try:
        all_raw = []
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            all_raw.extend(data.get("data", []))

            # Paginate if more posts exist and we need more than first page
            next_url = data.get("paging", {}).get("next")
            while next_url and len(all_raw) < 50:
                resp = await client.get(next_url)
                resp.raise_for_status()
                data = resp.json()
                all_raw.extend(data.get("data", []))
                next_url = data.get("paging", {}).get("next")

        posts = []
        for p in all_raw:
            media_type_val = p.get("media_type", "IMAGE")  # IMAGE | VIDEO | CAROUSEL_ALBUM

            # CRITICAL FIX: videos must use thumbnail_url for display (media_url is the raw .mp4 file
            # which CANNOT be rendered by an <img> tag — only thumbnail_url is a real image)
            if media_type_val == "VIDEO":
                display_url = p.get("thumbnail_url")  # NO fallback to media_url — that's a video file, not an image
                if not display_url:
                    print(f"[instagram] WARNING: VIDEO post {p.get('id')} has no thumbnail_url!")
            elif media_type_val == "CAROUSEL_ALBUM":
                # Use first child's image. If first child is itself a video, use ITS thumbnail (never its media_url)
                children = p.get("children", {}).get("data", [])
                if children:
                    first_child = children[0]
                    if first_child.get("media_type") == "VIDEO":
                        display_url = first_child.get("thumbnail_url")
                    else:
                        display_url = first_child.get("media_url") or first_child.get("thumbnail_url")
                else:
                    # No children data — carousel cover itself sometimes has thumbnail_url
                    display_url = p.get("thumbnail_url") or p.get("media_url")
            else:
                display_url = p.get("media_url")

            posts.append({
                "id":             p["id"],
                "caption":        (p.get("caption") or "")[:280],
                "media_type":     media_type_val,
                "media_url":      _proxy_url(display_url),
                "video_url":      p.get("media_url") if media_type_val == "VIDEO" else None,
                "permalink":      p.get("permalink", ""),
                "timestamp":      p.get("timestamp", ""),
                "like_count":     p.get("like_count", 0),
                "comments_count": p.get("comments_count", 0),
            })

        _post_cache["data"]       = posts
        _post_cache["fetched_at"] = time.time()

        if media_type:
            posts = [p for p in posts if p.get("media_type") == media_type.upper()]
        return posts[:limit]

    except Exception as e:
        print(f"[instagram] API error: {e}")
        return _demo_posts(limit, media_type)


async def refresh_instagram_token() -> Optional[str]:
    """
    Refresh a long-lived access token before it expires (do this monthly via cron).
    Returns new token or None on failure.
    """
    if not IG_TOKEN:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{IG_BASE}/refresh_access_token",
                params={"grant_type": "ig_refresh_token", "access_token": IG_TOKEN}
            )
            resp.raise_for_status()
            new_token = resp.json().get("access_token")
            print(f"[instagram] Token refreshed successfully")
            return new_token
    except Exception as e:
        print(f"[instagram] Token refresh failed: {e}")
        return None


def _proxy_url(raw_url: str) -> str:
    """Route an Instagram CDN URL through our backend proxy to avoid hotlink blocks/expiry."""
    if not raw_url:
        return raw_url
    import urllib.parse
    return f"/api/instagram/image-proxy?url={urllib.parse.quote(raw_url, safe='')}"


def clear_cache():
    """Force-clear the in-memory post cache (call after manual refresh)."""
    _post_cache["data"] = []
    _post_cache["fetched_at"] = 0


def _demo_posts(limit: int, media_type: Optional[str]) -> list:
    """Return realistic demo posts when Instagram API is not configured."""
    demo = [
        {
            "id": f"demo_{i}", "media_type": "IMAGE",
            "media_url": None,  # frontend shows placeholder
            "caption": cap,
            "permalink": "https://instagram.com/harsha_art_gallery",
            "timestamp": f"2025-0{(i%9)+1}-15T10:00:00+0000",
            "like_count": 45 + i * 17,
            "comments_count": 3 + i * 2,
        }
        for i, cap in enumerate([
            "✨ Bridal blouse Aari work — pure gold and silk threads 🪡 Every stitch crafted with love #HarshaArtGallery #AariWork",
            "🎨 Custom thread embroidery on silk dupatta — peacock motif in vibrant hues 💛 #ThreadEmbroidery #Handmade",
            "💎 Bead work saree border — 2,400 individually placed crystal beads ✨ #BeadWork #IndianCraft",
            "🌸 Wedding frame with couple name in Aari embroidery — personalised gift idea 💕 #WeddingGifts #WeddingFrames",
            "⚡ Behind the scenes — our artisan working on a bridal lehenga sequence panel 🪡 #ArtisanLife #SequenceWork",
            "🎉 Customer testimonial! So happy to see this bridal blouse bring joy on her wedding day 💍 #CustomerLove",
            "🌟 Diwali collection drop — festive motifs with gold zari work 🪔 DM to order! #DiwaliCollection",
            "🧵 Thread embroidery cushion covers — makes the perfect home décor gift 🏠 #HomeDecor #ThreadWork",
            "👑 Heavy Aari blouse with mirror work — royal bridal look 👸 #MirrorWork #BridalLook",
            "📦 Orders dispatched! Your handcrafted pieces are on their way 🚚 Track at harshaartgallery.com #OrderUpdate",
            "✨ New: Wedding memory frame with photo embroidery — your moment, stitched forever 💕 #WeddingMemories",
            "🌺 Intricate border work on a pattu saree — 15 hours of dedication in every inch 🧵 #SilkSaree #BorderWork",
        ])
    ]
    if media_type and media_type.upper() != "IMAGE":
        return []
    return demo[:limit]
