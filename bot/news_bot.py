#!/usr/bin/env python3
"""Collect MLBB news from Google News RSS queries and send review drafts to Telegram.

This tool does NOT publish directly to a public channel. It sends candidates to a
private review chat so a human can verify and publish them.
"""
from __future__ import annotations

import hashlib
from html.parser import HTMLParser
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


class ArticleMetadataParser(HTMLParser):
    """Extract common metadata without executing page scripts."""
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.canonical = ""
        self.json_ld: list[str] = []
        self._in_json_ld = False
        self._json_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {k.lower(): (v or "") for k, v in attrs}
        if tag.lower() == "meta":
            key = values.get("property") or values.get("name") or values.get("itemprop")
            value = values.get("content", "").strip()
            if key and value:
                self.meta[key.lower()] = value
        elif tag.lower() == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonical = values.get("href", "").strip()
        elif tag.lower() == "script" and "ld+json" in values.get("type", "").lower():
            self._in_json_ld = True
            self._json_parts = []

    def handle_data(self, data: str) -> None:
        if self._in_json_ld:
            self._json_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "script" and self._in_json_ld:
            self.json_ld.append("".join(self._json_parts))
            self._in_json_ld = False
            self._json_parts = []


def parse_any_date(value: str) -> datetime | None:
    if not value:
        return None
    value = value.strip()
    if value.upper().endswith(" UTC"):
        value = value[:-4].strip() + "+00:00"
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        try:
            from email.utils import parsedate_to_datetime
            dt = parsedate_to_datetime(value)
        except (TypeError, ValueError, OverflowError):
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def metadata_from_jsonld(raw_values: list[str]) -> dict[str, str]:
    found: dict[str, str] = {}
    def visit(value: Any) -> None:
        if isinstance(value, dict):
            for key in ("datePublished", "dateCreated", "headline", "description", "url"):
                item = value.get(key)
                if isinstance(item, str) and item.strip() and key not in found:
                    found[key] = item.strip()
            for item in value.values():
                visit(item)
        elif isinstance(value, list):
            for item in value:
                visit(item)
    for raw in raw_values:
        try:
            visit(json.loads(raw))
        except (json.JSONDecodeError, TypeError):
            continue
    return found


def inspect_article(article_url: str, feed_summary: str = "") -> dict[str, str]:
    """Best-effort original URL/date/summary lookup; never treats failure as verification."""
    result = {"original_url": "", "article_date": "", "summary": "", "verification": "⚠️ Первоисточник не подтверждён"}
    if not article_url.startswith(("https://", "http://")):
        return result
    request = urllib.request.Request(article_url, headers={"User-Agent": "Mozilla/5.0 (compatible; MLBBGameNewsBot/1.0)"})
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            final_url = response.geturl()
            content_type = response.headers.get("Content-Type", "")
            page = response.read(1_500_000).decode("utf-8", errors="replace") if "html" in content_type.lower() or not content_type else ""
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        return result
    parser = ArticleMetadataParser()
    try:
        parser.feed(page)
    except Exception:
        pass
    ld = metadata_from_jsonld(parser.json_ld)
    candidates = [parser.canonical, parser.meta.get("og:url", ""), ld.get("url", ""), final_url]
    original = next((urllib.parse.urljoin(final_url, u) for u in candidates if u and domain_allowed(urllib.parse.urljoin(final_url, u))), "")
    if original:
        result["original_url"] = original
        result["verification"] = "✅ Домен первоисточника найден"
    date_value = next((parser.meta.get(k, "") for k in ("article:published_time", "datepublished", "date", "pubdate", "parsely-pub-date") if parser.meta.get(k)), "") or ld.get("datePublished", "") or ld.get("dateCreated", "")
    parsed = parse_any_date(date_value)
    if parsed:
        result["article_date"] = parsed.strftime("%Y-%m-%d %H:%M UTC")
    summary = parser.meta.get("og:description", "") or parser.meta.get("description", "") or ld.get("description", "") or feed_summary
    result["summary"] = clean_text(summary)[:500]
    return result


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
        feed_summary = clean_text(get_text(item, "description"))
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
            "feed_summary": feed_summary,
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
    source = article["source"]
    published = article.get("published") or "Дата не указана"
    check = inspect_article(article["link"], article.get("feed_summary", ""))
    article_date = check["article_date"] or "Не удалось автоматически определить"
    summary = check["summary"] or "Краткое описание не найдено — проверь статью вручную."
    original_link = check["original_url"] or article["link"]
    feed_dt = parse_any_date(published)
    page_dt = parse_any_date(article_date)
    if feed_dt and page_dt:
        date_status = "✅ Даты близки" if abs((feed_dt - page_dt).total_seconds()) <= 36 * 3600 else "⚠️ Даты расходятся — проверь вручную"
    elif page_dt:
        date_status = "⚠️ Дата в ленте не распознана"
    else:
        date_status = "⚠️ Дата оригинала не подтверждена автоматически"
    return (
        "📝 ЧЕРНОВИК НОВОСТИ MLBB — ПРОВЕРИТЬ ПЕРЕД ПУБЛИКАЦИЕЙ\n\n"
        f"📰 {title}\n\n"
        f"Источник из ленты: {source}\n"
        f"Дата в ленте: {published}\n"
        f"Дата на странице: {article_date}\n"
        f"Проверка даты: {date_status}\n"
        f"Проверка ссылки: {check['verification']}\n\n"
        f"Кратко: {summary}\n\n"
        f"Ссылка на страницу: {original_link}\n"
        f"Ссылка RSS для диагностики: {article['link']}\n\n"
        "Проверь содержание и дату перед публикацией. Этот бот не публикует "
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
