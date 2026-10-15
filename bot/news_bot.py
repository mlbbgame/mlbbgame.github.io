#!/usr/bin/env python3
"""Collect MLBB news from Google News RSS queries and send review drafts to Telegram.

This tool does NOT publish directly to a public channel. It sends candidates to a
private review chat so a human can verify and publish them.
"""
from __future__ import annotations

import hashlib
import html
import json
import logging
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("mlbb-news")

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
REVIEW_CHAT_ID = os.getenv("REVIEW_CHAT_ID", "").strip()
STATE_FILE = Path(os.getenv("STATE_FILE", "bot/state/seen.json"))
MAX_PER_RUN = int(os.getenv("MAX_PER_RUN", "5"))
MAX_AGE_HOURS = int(os.getenv("MAX_AGE_HOURS", "72"))

# Search feeds are scoped to trusted publisher domains. We still validate the
# publisher metadata before accepting a candidate; the feed aggregator itself
# is not treated as the source.
FEED_QUERIES = [
    ('Official MOONTON', 'site:en.moonton.com/news Mobile Legends OR MLBB'),
    ('Official Mobile Legends', 'site:mobilelegends.com Mobile Legends news update patch'),
    ('ONE Esports', 'site:oneesports.gg/mobile-legends Mobile Legends'),
    ('Esports.gg', 'site:esports.gg Mobile Legends Bang Bang'),
    ('AFK Gaming', 'site:afkgaming.com Mobile Legends Bang Bang'),
]
ALLOWED_DOMAINS = {
    "en.moonton.com", "moonton.com", "mobilelegends.com",
    "oneesports.gg", "esports.gg", "afkgaming.com",
}
KEYWORDS = (
    "mobile legends", "mobile legends: bang bang", "mlbb", "m8 world championship",
    "mpl", "mid season cup", "msc", "patch", "hero", "moonton",
)
NEWS_GOOGLE = "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"


def get_text(parent: ET.Element, tag: str) -> str:
    node = parent.find(tag)
    return (node.text or "").strip() if node is not None and node.text else ""


def domain_allowed(url: str) -> bool:
    try:
        host = (urlparse(url).hostname or "").lower().rstrip(".")
        return any(host == d or host.endswith("." + d) for d in ALLOWED_DOMAINS)
    except ValueError:
        return False


def clean_text(value: str) -> str:
    value = re.sub(r"<[^>]*>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def parse_pubdate(value: str) -> float | None:
    if not value:
        return None
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.timestamp()
    except (TypeError, ValueError, OverflowError):
        return None


def fetch_feed(label: str, query: str) -> list[dict[str, Any]]:
    url = NEWS_GOOGLE.format(query=urllib.parse.quote(query))
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "MLBBGameNewsBot/1.0 (+https://mlbbgame.github.io/)"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        xml_data = response.read(2_000_000)
    root = ET.fromstring(xml_data)
    results = []
    for item in root.findall("./channel/item"):
        title = clean_text(get_text(item, "title"))
        link = get_text(item, "link")
        pubdate = get_text(item, "pubDate")
        source_node = item.find("source")
        source_name = clean_text(source_node.text or "") if source_node is not None else label
        source_url = source_node.attrib.get("url", "") if source_node is not None else ""
        if not title or not link or not domain_allowed(source_url):
            continue
        if not any(k in title.lower() for k in KEYWORDS):
            continue
        timestamp = parse_pubdate(pubdate)
        if timestamp and time.time() - timestamp > MAX_AGE_HOURS * 3600:
            continue
        digest = hashlib.sha256((title.lower().strip() + "|" + link).encode()).hexdigest()
        results.append({
            "id": digest,
            "title": title,
            "link": link,
            "source": source_name or label,
            "source_url": source_url,
            "published": pubdate,
            "timestamp": timestamp or time.time(),
        })
    return results


def load_seen() -> set[str]:
    try:
        data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        return set(data.get("seen", []))
    except FileNotFoundError:
        return set()
    except (OSError, json.JSONDecodeError, AttributeError):
        log.warning("Could not read deduplication state; starting with an empty set")
        return set()


def save_seen(seen: set[str]) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = {"updated_at": datetime.now(timezone.utc).isoformat(), "seen": sorted(seen)[-2000:]}
    STATE_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def telegram_send(text: str) -> None:
    if not TOKEN or not REVIEW_CHAT_ID:
        raise RuntimeError("Missing TELEGRAM_BOT_TOKEN or REVIEW_CHAT_ID secret")
    endpoint = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    payload = urllib.parse.urlencode({
        "chat_id": REVIEW_CHAT_ID,
        "text": text,
        "disable_web_page_preview": "true",
    }).encode()
    request = urllib.request.Request(endpoint, data=payload, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))
        if not result.get("ok"):
            raise RuntimeError("Telegram API returned ok=false")
    except urllib.error.HTTPError as exc:
        # Never log request URLs because Telegram bot tokens are embedded in them.
        raise RuntimeError(f"Telegram API HTTP error: {exc.code}") from None


def format_draft(article: dict[str, Any]) -> str:
    title = article["title"]
    link = article["link"]
    source = article["source"]
    published = article.get("published") or "Дата не указана"
    return (
        "📝 ЧЕРНОВИК НОВОСТИ MLBB — ПРОВЕРИТЬ ПЕРЕД ПУБЛИКАЦИЕЙ\n\n"
        f"📰 {title}\n\n"
        f"Источник: {source}\n"
        f"Дата в ленте: {published}\n"
        f"Ссылка для проверки: {link}\n\n"
        "Проверь содержание и дату по первоисточнику. Этот бот не публикует "
        "материал в публичный канал автоматически."
    )


def main() -> int:
    if not TOKEN or not REVIEW_CHAT_ID:
        log.error("Required secrets missing: TELEGRAM_BOT_TOKEN and REVIEW_CHAT_ID")
        return 2

    seen = load_seen()
    candidates: dict[str, dict[str, Any]] = {}
    for label, query in FEED_QUERIES:
        try:
            for article in fetch_feed(label, query):
                if article["id"] not in seen:
                    candidates[article["id"]] = article
        except (urllib.error.URLError, TimeoutError, ET.ParseError, OSError, ValueError) as exc:
            log.warning("Feed failed (%s): %s", label, type(exc).__name__)

    ordered = sorted(candidates.values(), key=lambda x: x["timestamp"], reverse=True)
    selected = ordered[:MAX_PER_RUN]
    log.info("Found %d new candidates; sending up to %d review drafts", len(ordered), len(selected))

    failures = 0
    for article in selected:
        try:
            telegram_send(format_draft(article))
            seen.add(article["id"])
            log.info("Draft sent for review: %s", article["id"][:12])
        except Exception as exc:
            failures += 1
            log.error("Failed to send draft %s: %s", article["id"][:12], type(exc).__name__)

    save_seen(seen)
    if failures:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
