#!/usr/bin/env python3
"""Fast, dependency-free structural smoke tests for the Grim_gg static site."""
from __future__ import annotations
import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)

html = (ROOT / "index.html").read_text(encoding="utf-8")
styles = (ROOT / "styles.css").read_text(encoding="utf-8")
talents_styles = (ROOT / "talents.css").read_text(encoding="utf-8")
wide_styles = (ROOT / "layout-wide.css").read_text(encoding="utf-8")
script = (ROOT / "script.js").read_text(encoding="utf-8")
combo_guides_extra = (ROOT / "combo-guides-extra.js").read_text(encoding="utf-8")
talents = (ROOT / "talents.js").read_text(encoding="utf-8")
talent_css = (ROOT / "talents.css").read_text(encoding="utf-8")

# Cache keys intentionally change during fixes; validate versioned asset paths without pinning versions.
for asset in ("styles.css", "talents.css", "layout-wide.css", "script.js", "combo-guides-extra.js", "talents.js"):
    require(any(f"{asset}?v=" in line for line in html.splitlines()),
            f"index.html must load {asset} with a versioned cache key")

# Validate navigation anchors and direct JavaScript DOM lookups against the static HTML.
id_set = set(re.findall(r"""\bid=["']([^"']+)["']""", html))
hash_targets = re.findall(r"""\bhref=["']#([^"']+)["']""", html)
require(all(target in id_set for target in hash_targets),
        "index.html contains an in-page link whose target ID does not exist")
direct_dom_ids = set(re.findall(r"""\$\(["']([^"']+)["']\)""", script))
require(direct_dom_ids.issubset(id_set),
        "script.js directly selects an element ID that is missing from index.html: "
        + ", ".join(sorted(direct_dom_ids - id_set)))
local_asset_refs = [
    ref for ref in re.findall(r"""\b(?:src|href)=["']([^"']+)["']""", html)
    if ref and not re.match(r"^(?:https?:|mailto:|tel:|data:|javascript:|#|\?)", ref)
    and re.search(r"\.(?:js|css|json|svg|png|jpe?g|webp|ico)(?:\?|$)", ref, re.I)
]
missing_local_assets = [
    ref for ref in local_asset_refs
    if not (ROOT / ref.split("?", 1)[0].lstrip("/")).is_file()
]
require(not missing_local_assets,
        "index.html references local assets that do not exist: " + ", ".join(missing_local_assets))

# Catch duplicate static IDs and accidentally unbalanced CSS before publishing.
static_ids = re.findall(r"""\bid=["']([^"']+)["']""", html)
require(len(static_ids) == len(set(static_ids)), "index.html contains duplicate element IDs")
for stylesheet_name, stylesheet in (
    ("styles.css", styles),
    ("talents.css", talents_styles),
    ("layout-wide.css", wide_styles),
):
    require(stylesheet.count("{") == stylesheet.count("}"),
            f"{stylesheet_name} has unbalanced CSS braces")


for section_id in ("home", "heroes", "tierlist", "items", "perks", "builds", "favorites", "guides", "esports"):
    require(f'id="{section_id}"' in html, f"Missing core section #{section_id}")

require('href="?page=builds">Сборки и таланты</a>' not in html
        and 'href="?page=builds#talentLab"' not in html
        and 'href="?page=heroes">Герои</a>' in html
        and 'Сборка и таланты героя' in html,
        "Builds and talents should be opened from each hero profile, not a separate navigation tab")
require('href="favicon.svg"' in html, "Main page favicon reference is missing")
require('id="counterpicks"' not in html and 'href="?page=counterpicks"' not in html,
        "Removed counterpick section must not reappear in the page or navigation")
not_found_page = (ROOT / "404.html").read_text(encoding="utf-8")
require("styles.css?v=" in not_found_page,
        "404 page must load a versioned main stylesheet")
require('href="/favicon.svg"' in not_found_page,
        "404 page must use the root-site favicon path")
require('href="/"' in not_found_page and "Страница не найдена" in not_found_page,
        "404 page must explain the missing page and link to the root homepage")
require("/Grim-gg-/" not in not_found_page and "window.location.replace" not in not_found_page,
        "Root-site 404 page must not redirect visitors to the old project path")
for route in ("home", "heroes", "tierlist", "items", "perks", "favorites", "guides", "esports"):
    require(f'href="?page={route}"' in html, f"Main navigation is missing route ?page={route}")
require('data-open-hero-full="${escapeHTML(hero.name)}"' in script
        and 'id="${profilePrefix}-hero-build"' in script
        and 'id="${profilePrefix}-hero-talents"' in script
        and 'id="${profilePrefix}-hero-skills"' in script,
        "Hero cards must open a profile that groups build, talents and skills in one place")
require('requestedPage === "talents" ? "builds"' in script,
        "Legacy talent links must route to the combined Builds + Talents workspace")

require('builds.appendChild(section)' in talents and 'id = "talentLab"' in talents,
        "Talent planner must be nested inside the combined builds workspace")
require('"perks","talents","builds"' in script, "Legacy talent route alias is missing from the page router")
require('requestedPage === "talents" ? "builds"' in script, "Legacy talent route must reveal the combined workspace")
require('builds: "Сборки и таланты"' in script, "Combined workspace title is missing")
require('id="talentHeroPortrait"' in talents and "heroArtByName" in talents,
        "Talent planner must render the selected hero portrait when the source is available")
extra_combo_keys = re.findall(r'\{hero:"([^"]+)",key:"([^"]+)",role:"([^"]+)"', combo_guides_extra)
require("battleSpellRecommendations" in combo_guides_extra and "Вспышка (Flicker)" in combo_guides_extra,
        "Combo guides must include battle-spell recommendations")
require("syncComboGuidesWithHeroCatalog" in combo_guides_extra and "generatedGuideTemplates" in combo_guides_extra,
        "Combo guides must generate a starter guide for every hero in the loaded catalog")
hero_catalog = json.loads((ROOT / "data" / "hero-catalog.json").read_text(encoding="utf-8"))
require(len(hero_catalog) >= 120,
        "Local hero catalog should contain the complete community roster for offline combo guide coverage")
require("syncComboGuidesWithHeroCatalog?.(heroes)" in script,
        "Combo guide generation must run for fallback and externally loaded hero catalogs")
require(len(extra_combo_keys) >= 40,
        "Expanded combo guide catalog should include at least 40 additional heroes")
extra_combo_names = [entry[1].casefold() for entry in extra_combo_keys]
require(len(extra_combo_names) == len(set(extra_combo_names)),
        "Expanded combo guide catalog contains duplicate hero keys")
require('combo-guides-extra.js?v=' in html,
        "Main page must load the expanded combo guide catalog with a versioned cache key")

require("GrimGGHeroImageUrl" in script and "GrimGGHeroImageUrl" in talents,
        "Talent planner must prefer the shared HD hero image resolver")
require("fallbackImage:catalogImage" in script and "hero.fallbackImage && hero.fallbackImage !== hero.image" in script,
        "Hero cards must retain the catalog portrait as an HD-image fallback")
require("this.dataset.retry!==this.src" in script,
        "Hero image fallback must not retry the same broken URL")
require('this.dataset.retry!==this.src' in script and "item-image" in script,
        "Item image fallback must avoid retrying the same broken URL")
require('img.dataset.fallback = catalogUrl && catalogUrl !== url ? catalogUrl : "";' in talents,
        "Talent portrait must retry the catalog image before showing a placeholder")
require('builds.appendChild(section)' in talents,
        "Talent Lab must remain inside the builds section and inherit its page visibility")
require('id="talentRole"' in talents and 'id="talentHero"' in talents and 'id="talentStyle"' in talents,
        "Talent planner must expose role, hero and playstyle selectors")
require('id="talentCopy"' in talents and 'id="talentReset"' in talents,
        "Talent planner copy/reset actions are missing")
require("const emblemNames" in talents and "КЛЮЧЕВОЙ" in talents and "Weapon Master" in talents,
        "Talent planner must include emblem families and talent tiers")
require("https://openmlbb.fastapicloud.dev/api/academy/emblems?lang=en&size=100" in talents and "https://mlbb.rone.dev/api/academy/emblems?lang=en&size=100" in talents,
        "Talent planner must try both public academy endpoints for original talent icons")
require("skill?.skillicon" in talents and "talent-original-icon" in talents and "talent-icon-fallback-hidden" in talents,
        "Talent planner must load original talent icons and retain a visible fallback")
require("new MutationObserver" in talents and "refreshIcons" in talents,
        "Dynamically rendered talent icons must be enhanced after the API responds")

require("@media(max-width:700px)" in talent_css, "Talent planner needs a mobile layout")

require("object-fit: contain" in wide_styles and "focus-visible" in wide_styles,
        "Responsive polish must preserve artwork and keyboard focus visibility")
require("@media (max-width: 650px)" in wide_styles and "grid-template-columns: minmax(0, 1fr)" in wide_styles,
        "Mobile hero actions must stack cleanly on narrow screens")
require("prefers-reduced-motion: reduce" in wide_styles,
        "Reduced-motion preference must be respected")
require("object-fit: contain" in talent_css and "min-height: 42px" in talent_css,
        "Talent icons and controls must remain clear and touch-friendly")

require(".hero-image-wrap::after" in styles and "display: none !important" in styles and "background: none !important" in styles,
        "Hero portrait cards must not retain a dark overlay after labels are removed")
require("linear-gradient(145deg, #30232d 0%, #241b27 58%, #30212a 100%)" in styles,
        "Hero portrait background must be brighter than the previous near-black tint")
require("translateEquipmentName(name)" in script and "ru:translateEquipmentName(name)" in script,
        "External equipment catalog names must be translated to Russian")
require("EQUIPMENT_RU_NAMES" in script and "Original" not in script,
        "Russian equipment-name dictionary must exist without a hardcoded English card label")
require('class="item-original-name"' in script and 'summary>Оригинальное название</summary>' in script,
        "Original equipment names should remain available on demand")
require("onerror" in script and "hero-image-fallback" in script,
        "Hero image errors must have a visible fallback")
require('"lesley": "Lesley/Deadly Sniper.png"' in script and "images.weserv.nl/?url=" in script,
        "Lesley must use optimized high-resolution splash artwork with a CDN fallback")
require('item.id === "retribution"\n      ? new URL("assets/retribution.svg", window.location.href).href' in script
        and 'const retrySource = item.id === "retribution" ? ""' in script
        and (ROOT / "assets" / "retribution.svg").is_file(),
        "Base Retribution must use its local icon and avoid retrying a known-missing remote icon")
require("Array.isArray(payload?.records)" in talents and "skill?.icon_url" in talents,
        "Talent icon loader must handle alternate public API response shapes")
require("grid-template-columns: repeat(3, minmax(0, 1fr))" in wide_styles and "object-fit: cover" in wide_styles,
        "Hero directory must show larger game-like portraits in a three-column phone grid")
require("font-size: 10px; line-height: 1.25; min-height: 40px" in wide_styles,
        "Mobile hero-card actions must remain readable and touch-friendly")
require("counterpick" not in script.lower() and "enemySelect" not in script and "ownHeroSelect" not in script,
        "Removed counterpick functionality must not leave stale script references")
require(".hero-grid .hero-card-actions { grid-template-columns: repeat(2, minmax(0, 1fr))" in wide_styles,
        "Three-column hero cards must keep build and 3D actions in a compact two-column row")

# Validate the central hero-art catalogs: duplicate keys and malformed source paths
# can silently overwrite mappings or create broken images despite valid JavaScript syntax.
for catalog_name in ("HERO_HD_IMAGE_FILES", "HERO_SPLASH_ART_OVERRIDES"):
    match = re.search(
        rf"const\s+{catalog_name}\s*=\s*\{{(.*?)^\}};",
        script,
        re.MULTILINE | re.DOTALL,
    )
    require(match is not None, f"Missing hero image catalog: {catalog_name}")
    if match:
        body = match.group(1)
        keys = re.findall(r'^\s*"([^"]+)"\s*:', body, re.MULTILINE)
        require(len(keys) == len(set(keys)),
                f"{catalog_name} contains duplicate keys that overwrite earlier images")
        values = re.findall(r'^\s*"([^"]+)"\s*:\s*"(.+)"\s*,?\s*$', body, re.MULTILINE)
        require(bool(values), f"{catalog_name} contains no image mappings")
        for key, path in values:
            require(bool(key.strip()), f"{catalog_name} contains an empty hero key")
            require(not path.startswith("/") and ".." not in path.split("/"),
                    f"{catalog_name} has an unsafe relative image path for {key}: {path}")
            require(path.lower().endswith((".png", ".webp", ".jpg", ".jpeg")),
                    f"{catalog_name} has an unexpected image file type for {key}: {path}")
            if catalog_name == "HERO_SPLASH_ART_OVERRIDES":
                require("/" in path, f"Splash artwork should include its hero folder: {key}: {path}")

require('loading="lazy"' in script and 'decoding="async"' in script and 'alt="\u0024{escapeHTML(hero.name)}"' in script,
        "Hero images must have accessible alt text and efficient loading hints")
require("this.naturalWidth > this.naturalHeight * 0.82" in script and "data-shape-fallback" in script,
        "Near-square portrait files must switch to available tall hero artwork")
require("assets/retribution.svg" in script and (ROOT / "assets" / "retribution.svg").is_file(),
        "The local Retribution icon used in builds must exist")

# Ensure every first-party script/style/icon referenced by index.html exists.
for attr, value in re.findall(r'\b(href|src)="([^"]+)"', html):
    if attr not in {"href", "src"} or value.startswith(("#", "?", "http://", "https://", "data:", "mailto:", "tel:")):
        continue
    path = urlparse(value).path
    if not path:
        continue
    local_path = ROOT / path
    if local_path.is_dir():
        local_path = local_path / "index.html"
    require(local_path.is_file(), f"Broken local {attr} reference: {value}")

# Keep full local catalog snapshots so a third-party API outage does not collapse the site to a short list.
require("fetchCatalogWithLocalFallback" in script
        and '"data/hero-catalog.json"' in script
        and '"data/equipment-catalog.json"' in script,
        "Hero and equipment loaders must fall back to local catalog snapshots")
try:
    hero_catalog = json.loads((ROOT / "data" / "hero-catalog.json").read_text(encoding="utf-8"))
    equipment_catalog = json.loads((ROOT / "data" / "equipment-catalog.json").read_text(encoding="utf-8"))
    require(isinstance(hero_catalog, list) and len(hero_catalog) >= 130,
            "Local hero snapshot must retain the full 130+ hero community catalog")
    require(isinstance(equipment_catalog, list) and len(equipment_catalog) >= 100,
            "Local equipment snapshot must retain the full 100+ item community catalog")
    equipment_names = [str(row.get("name-equipment", "")).strip().casefold() for row in equipment_catalog]
    require(all(equipment_names), "Local equipment fallback contains an unnamed item")
    require(len(equipment_names) == len(set(equipment_names)),
            "Local equipment fallback contains duplicate item names")
    require(all(isinstance(row.get("name_hero"), str) and row.get("images-hero") for row in hero_catalog),
            "Every local hero catalog entry must include a name and image filename")
    require(all(isinstance(row.get("name-equipment"), str) and row.get("logo-equipment") for row in equipment_catalog),
            "Every local equipment entry must include a name and image filename")
    hero_ids = [row.get("id_hero") for row in hero_catalog]
    hero_names = [str(row.get("name_hero", "")).casefold() for row in hero_catalog]
    equipment_ids = [row.get("id_equip") for row in equipment_catalog]
    require(len(hero_ids) == len(set(hero_ids)) and len(hero_names) == len(set(hero_names)),
            "Local hero snapshot must not contain duplicate IDs or names")

    # Every catalog hero should have a verified portrait or splash-art mapping.
    # Hirara's source folder is spelled Hiara in the community splash repository.
    verified_hero_art: dict[str, str] = {}
    for map_name in ("HERO_HD_IMAGE_FILES", "HERO_SPLASH_ART_OVERRIDES"):
        map_start = script.find(f"const {map_name} = {{")
        map_end = script.find("\n};", map_start)
        map_text = script[map_start:map_end] if map_start >= 0 and map_end >= 0 else ""
        require(bool(map_text), f"Could not locate {map_name} for portrait coverage validation")
        if map_text:
            entries = re.findall(r"""["']([^"']+)["']\s*:\s*["']([^"']+)["']""", map_text)
            verified_hero_art.update({
                re.sub(r"[^a-z0-9]", "", key.casefold()): value.strip()
                for key, value in entries
            })
            require(all(value.strip() for _, value in entries),
                    f"{map_name} must not contain empty image paths")
    heroes_without_verified_art = sorted(
        str(row.get("name_hero", "")).strip()
        for row in hero_catalog
        if re.sub(r"[^a-z0-9]", "", str(row.get("name_hero", "")).casefold())
        not in verified_hero_art
    )
    require(heroes_without_verified_art == [],
            "Hero artwork coverage changed unexpectedly; verify new image paths instead of guessing: "
            + ", ".join(heroes_without_verified_art))

    # Guard against item icon filenames drifting away from the names in the local equipment snapshot.
    item_icon_overrides = {
        "Magic Boots": "magic_boots", "Demon Boots": "demon_boots",
        "Retribution": "retribution", "Ice Retribution": "ice_retribution",
        "Flame Retribution": "flame_retribution", "Bloody Retribution": "bloody_retribution",
        "Conceal": "conceal", "Encourage": "encourage", "Favor": "favor", "Dire Hit": "dire_hit",
    }
    for row in equipment_catalog:
        item_name = str(row.get("name-equipment", "")).strip()
        icon_slug = item_icon_overrides.get(
            item_name,
            re.sub(r"[^a-z0-9]+", "_", re.sub(r"['’]", "", item_name.casefold())).strip("_")
        )
        require(str(row.get("logo-equipment", "")).strip().casefold() == f"{icon_slug}.png",
                f"Equipment icon mapping does not match the local catalog: {item_name}")
    featured_build_block = re.search(r"const featuredHeroBuilds = \{(.*?)\n\};", script, re.S)
    if featured_build_block:
        featured_build_names = {
            name.casefold() for name in re.findall(r"""^\s*"([^"]+)"\s*:\s*\{""",
                                                   featured_build_block.group(1), re.M)
        }
        require(featured_build_names.issubset(set(hero_names)),
                "Featured builds reference heroes absent from the local hero catalog: "
                + ", ".join(sorted(featured_build_names - set(hero_names))))
    else:
        require(False, "Could not locate featured hero builds for catalog validation")
    require(len(equipment_ids) == len(set(equipment_ids)),
            "Local equipment snapshot must not contain duplicate item IDs")
    require('existingNames.add(name.toLocaleLowerCase())' in script,
            "Equipment loader must deduplicate repeated names in the community catalog")
except (OSError, json.JSONDecodeError, AttributeError) as exc:
    errors.append(f"Could not validate local catalog snapshots: {exc}")

require('name:"Magic Boots"' in script and 'name:"Demon Boots"' in script
        and 'name:"Magic Shoes"' not in script and 'name:"Demon Shoes"' not in script,
        "The equipment catalog must use the current boots names without stale duplicate aliases")
require('if (/retribution/.test(value)) return "Jungle";' in script
        and 'if (/conceal|dire hit|encourage|favor/.test(value)) return "Roam";' in script
        and 'if (/allow throw|broken heart|throw forbidden/.test(value)) return "Movement";' in script,
        "Jungle spells, roaming effects and special movement items must use the right categories")
require('endless battle|golden staff|rose gold meteor|sea halberd|war axe|javelin|magic blade' in script
        and 'fleeting time|winter crown|flask of the oasis|magic potion' in script,
        "Core equipment names must not fall into the generic Other category")
require('let itemDataSource = "static";' in script
        and 'itemDataSource = catalogSource;' in script
        and 'itemDataSource === "local" ? " · резервный каталог" : ""' in script,
        "Item count must disclose local fallback while retaining the active filter count")
require('renderItems();\n    renderPerks();\n    renderBuilds();\n    renderFavorites();\n    // renderItems() owns the visible count' in script,
        "Catalog refresh must not overwrite the active item-filter count")
require(not (ROOT / "section-tabs.js").exists() and "section-tabs.js" not in html,
        "Obsolete hash-based section router must not be reintroduced")
require("контрпик" not in html.lower(),
        "Page metadata must not advertise the removed counterpick section")
require("AbortController" in script and "window.setTimeout(() => controller.abort(), 7000)" in script,
        "Remote catalog requests must time out before using the local fallback")

# Every item named by role templates, featured hero builds and situational variants
# must exist in either the built-in catalog or the full local fallback catalog.
static_items_match = re.search(r"const items = \[(.*?)\n\];", script, re.S)
if static_items_match:
    static_item_names = {
        name.casefold() for name in re.findall(r'\bname:\s*"([^"]+)"', static_items_match.group(1))
    }
    available_item_names = static_item_names | {
        str(row.get("name-equipment", "")).strip().casefold() for row in equipment_catalog
    }
    build_item_arrays = re.findall(r'\bitems\s*:\s*\[([^\]]*)\]', script)
    build_item_names = [
        name.casefold()
        for block in build_item_arrays
        for name in re.findall(r'"([^"]+)"', block)
    ]
    missing_build_items = sorted(set(build_item_names) - available_item_names)
    require(not missing_build_items,
            "Hero builds reference items absent from all catalogs: " + ", ".join(missing_build_items))
else:
    require(False, "Could not locate the built-in item catalog for build validation")

# The base Retribution spell uses a local SVG so it remains visible even when the remote
# equipment icon CDN has no matching asset.
require((ROOT / "assets" / "retribution.svg").is_file()
        and 'new URL("assets/retribution.svg", window.location.href).href' in script,
        "Retribution must retain its local fallback icon asset")

# The latest hero additions with verified art in the splash repository must not fall back
# to low-resolution catalog thumbnails.
require('"chip": "Chip/Nexus Engineer.png"' in script
        and '"kalea": "Kalea/Sakura Haruno.png"' in script
        and '"lukas": "Lukas/Naruto Uzumaki.png"' in script,
        "Chip, Kalea and Lukas need verified high-resolution splash artwork mappings")

# The talent planner must populate all roles from the full community catalog and avoid
# injecting externally sourced hero names into HTML.
require("const roleLabels = {" in talents and "discoveredByRole" in talents and "heroesByRole[role].splice" in talents,
        "Talent planner must merge the full external hero catalog into all role lists")
require("heroSelect.replaceChildren(...availableHeroes.map(name => new Option(name, name)))" in talents,
        "Talent planner must refresh hero choices safely after catalog loading")
require("heroSelect.replaceChildren(...names.map(name => new Option(name, name)))" in talents
        and "heroSelect.innerHTML = heroesByRole[role]" not in talents,
        "External hero names must be inserted as text options, not HTML")
require('fetch("data/hero-catalog.json"' in talents
        and 'window.setTimeout(() => controller.abort(), 7000)' in talents,
        "Talent planner must use the local hero snapshot if the external image/catalog source times out")
require("heroEnglishNames[select.value] || select.value" in talents,
        "Talent planner must resolve portraits for heroes without a Russian display-name mapping")

scraper = (ROOT / "scripts" / "update_esports_news.py").read_text(encoding="utf-8")
require('heading = anchor.find(["h1", "h2", "h3", "h4", "h5"])' in scraper
        and "if not published:" in scraper and "continue" in scraper,
        "News scraper must extract clean headings and exclude undated footer pages")

feed_path = ROOT / "data" / "esports-news.json"
try:
    feed = json.loads(feed_path.read_text(encoding="utf-8"))
    articles = feed.get("articles")
    require(isinstance(articles, list) and len(articles) > 0, "Esports feed must contain at least one article")
    for article in articles or []:
        require(isinstance(article.get("title"), str) and bool(article["title"].strip()),
                "Every esports article needs a title")
        url = article.get("url", "")
        require(re.fullmatch(r"https://en\.moonton\.com/news/\d+\.html", url) is not None,
                f"Unexpected esports source URL or non-article page: {url}")
        published = article.get("published", "")
        require(re.fullmatch(r"20\d{2}-\d{2}-\d{2}", published) is not None,
                f"Esports article is missing a valid publication date: {url}")
        require(re.match(r"^20\d{2}[/-]\d{1,2}[/-]\d{1,2}\s", article["title"]) is None,
                f"Esports headline must not include a date prefix: {url}")
except (OSError, json.JSONDecodeError, AttributeError) as exc:
    errors.append(f"Could not validate esports feed: {exc}")


# Validate standalone SEO guide pages and their sitemap discovery.
clint_guide_path = ROOT / "clint-gold-lane" / "index.html"
require(clint_guide_path.is_file(), "Standalone Clint Gold Lane guide is missing")
if clint_guide_path.is_file():
    clint_guide = clint_guide_path.read_text(encoding="utf-8")
    require('<link rel="canonical" href="https://mlbbgame.github.io/clint-gold-lane/">' in clint_guide,
            "Clint guide must declare its canonical URL")
    require("<title>Клинт на Gold Lane: сборка и тактика — MLBB Game</title>" in clint_guide,
            "Clint guide needs a specific page title")
    require("усиленная атака" in clint_guide.casefold() and "критический урон" in clint_guide.casefold(),
            "Clint guide must retain its core practical topics")
    require('href="../hero-guide/"' in clint_guide and 'href="../combo-guides/"' in clint_guide,
            "Clint guide must link to related first-party guides")
    require('href="../privacy.html"' in clint_guide and 'href="../contact.html"' in clint_guide,
            "Clint guide must retain privacy and contact links")
    require("href=\"../clint-gold-lane/\"" in (ROOT / "hero-guide" / "index.html").read_text(encoding="utf-8"),
            "Hero directory must link to the Clint guide")
    require("href=\"../clint-gold-lane/\"" in (ROOT / "combo-guides" / "index.html").read_text(encoding="utf-8"),
            "Combo guides must link to the Clint guide")

try:
    import xml.etree.ElementTree as ET
    sitemap_root = ET.fromstring((ROOT / "sitemap.xml").read_text(encoding="utf-8"))
    sitemap_urls = {
        element.text
        for element in sitemap_root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    }
    require("https://mlbbgame.github.io/clint-gold-lane/" in sitemap_urls,
            "Clint guide must be discoverable through sitemap.xml")
except (OSError, ET.ParseError) as exc:
    errors.append(f"Could not validate sitemap.xml: {exc}")

if errors:
    print("GRIM_GG SMOKE TEST: FAILED")
    for error in errors:
        print(f"- {error}")
    raise SystemExit(1)

print("GRIM_GG SMOKE TEST: PASS")
print("Checked core sections, hero profile build/talent navigation, local asset references and esports feed.")
