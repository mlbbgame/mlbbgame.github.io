import { chromium } from "playwright";

const BASE_URL = "https://mlbbgame.github.io/";
const failures = [];
const checks = [];
const check = (name, condition, detail = "") => {
  checks.push({ name, passed: Boolean(condition), detail });
  if (!condition) failures.push(`${name}${detail ? ": " + detail : ""}`);
};

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    permissions: ["clipboard-read", "clipboard-write"]
  });
  const page = await context.newPage();
  // Disable decorative motion during automated tests so continuously animated cards
  // do not appear "unstable" to Playwright's real-user click checks.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.setAttribute("data-playwright-motion-reset", "true");
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    }, { once: true });
  });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(JSON.stringify({name: error.name, message: error.message, stack: error.stack || "", url: page.url()})));

  // Wait for the role-first homepage revision instead of accidentally testing cached HTML.
  let publishedRevision = false;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await page.goto(BASE_URL + "?page=home&smoke=" + Date.now(), {
      waitUntil: "domcontentloaded", timeout: 60000
    });
    if (await page.locator(".home-hub").count() > 0
      && await page.locator("#main-content").getAttribute("data-ui-version") === "grim-mlbb-home-2"
      && (await page.locator(".brand").first().innerText()).includes("MLBB GAME")) {
      publishedRevision = true;
      break;
    }
    await page.waitForTimeout(5000);
  }
  check("Latest Grim_MLBB homepage revision is published", publishedRevision,
    "waiting for the role-first homepage to appear on GitHub Pages");
  if (!publishedRevision) throw new Error("GitHub Pages did not publish the expected Grim_MLBB homepage revision in time");

  // Check crawlable static SEO pages by their clean URLs (not only query-string variants).
  for (const [path, heading, canonical] of [
    ["hero-guide/", "Герои Mobile Legends: роли, линии и тактика", "https://mlbbgame.github.io/hero-guide/"],
    ["combo-guides/", "Комбо и гайды по Mobile Legends", "https://mlbbgame.github.io/combo-guides/"]
  ]) {
    const response = await page.goto(BASE_URL + path, { waitUntil: "domcontentloaded", timeout: 60000 });
    check("SEO page returns HTTP 200: " + path, response?.status() === 200,
      "received HTTP " + (response?.status() ?? "no response"));
    check("SEO page has its expected heading: " + path,
      (await page.locator("h1").first().innerText().catch(() => "")).includes(heading));
    check("SEO page canonical is correct: " + path,
      await page.locator('link[rel="canonical"]').getAttribute("href").catch(() => "") === canonical);
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    check("SEO page fits mobile viewport: " + path,
      dimensions.scrollWidth <= dimensions.width + 2, JSON.stringify(dimensions));
  }
  await page.goto(BASE_URL + "?page=home&smoke=" + Date.now(), {
    waitUntil: "domcontentloaded", timeout: 60000
  });
  await page.locator("#home").waitFor({ state: "visible", timeout: 20000 });
  check("Homepage renders", await page.locator("#home").isVisible());
  check("Main navigation exists", await page.locator("#nav a").count() >= 8);
  const hub = page.locator(".home-hub");
  check("Four featured hero cards are removed", await hub.isVisible()
    && await page.locator(".roster-card").count() === 0);
  const hubText = await hub.innerText();
  check("Homepage shows all five lanes", await page.locator(".home-lane-card").count() === 5
    && ["EXP Lane", "Jungle", "Mid Lane", "Gold Lane", "Roam"].every(name => hubText.includes(name)));
  check("Homepage sends build/talent discovery through the hero catalogue",
    await page.locator(".home-feature-link[href='?page=heroes']").count() === 1
    && await page.locator(".home-feature-link[href='?page=guides']").count() === 1
    && await page.locator(".home-all-heroes[href='?page=heroes']").count() === 1
    && await page.locator("#nav a[href='?page=builds']").count() === 0);

  // New Premium Dark Esports quick search: a Russian alias should narrow results to one hero,
  // and choosing that result must open the correct profile.
  const quickSearch = page.locator("#quickHeroSearch");
  check("Homepage quick hero search exists", await quickSearch.count() === 1);
  await quickSearch.fill("Клинт");
  await page.waitForFunction(() => {
    const results = Array.from(document.querySelectorAll("#quickHeroResults .quick-hero-result"));
    return results.length === 1 && /clint/i.test(results[0].innerText);
  }, { timeout: 10000 });
  const quickResults = await page.locator("#quickHeroResults .quick-hero-result").count();
  check("Quick hero search filters Russian alias to Clint", quickResults === 1);
  await page.locator("#quickHeroResults .quick-hero-result").first().click();
  await page.locator("#hero-detail").waitFor({ state: "visible", timeout: 20000 });
  await page.waitForFunction(() => /clint/i.test(document.querySelector("#heroDetailPage")?.innerText || ""), { timeout: 10000 });
  check("Quick search opens the selected hero profile", /clint/i.test(await page.locator("#heroDetailPage").innerText()));

  // Role shortcuts should open the full catalogue with the selected class filter.
  await page.goto(BASE_URL + "?page=home", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator(".home-lane-card[data-home-role='Убийца']").click();
  await page.locator("#heroes").waitFor({ state: "visible", timeout: 20000 });
  await page.waitForFunction(() => document.querySelector("#heroCount")?.innerText.includes("Показано:"), { timeout: 15000 });
  check("Jungle shortcut opens the hero catalogue with assassin filter",
    new URL(page.url()).searchParams.get("role") === "Убийца"
    && await page.locator("#roleFilters [data-role='Убийца']").getAttribute("aria-pressed") === "true");
  await page.goto(BASE_URL + "?page=home", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator(".home-all-heroes").click();
  await page.locator("#heroes").waitFor({ state: "visible", timeout: 20000 });
  check("All heroes shortcut opens the unfiltered catalogue",
    !new URL(page.url()).searchParams.has("role")
    && await page.locator("#roleFilters [data-role='Все']").getAttribute("aria-pressed") === "true");

  const routes = [
    ["heroes", "#heroes"],
    ["tierlist", "#tierlist"],
    ["items", "#items"],
    ["perks", "#perks"],
    ["talents", "#talentLab"],
    ["builds", "#builds"],
    ["favorites", "#favorites"],
    ["guides", "#guides"],
    ["esports", "#esports"]
  ];

  for (const [route, selector] of routes) {
    await page.goto(BASE_URL + "?page=" + route, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator(selector).waitFor({ state: "visible", timeout: 20000 });
    check("Route renders: " + route, await page.locator(selector).isVisible());
  }

  // Verify the hero and item search controls actually update their catalogs.
  await page.goto(BASE_URL + "?page=heroes", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#heroGrid").waitFor({ state: "visible", timeout: 20000 });
  await page.waitForFunction(() => {
    const count = document.querySelector("#heroCount")?.innerText || "";
    return /Показано:/i.test(count) && document.querySelectorAll("#heroGrid .hero-card").length > 0;
  }, { timeout: 30000 });
  const heroCardsBefore = await page.locator("#heroGrid .hero-card").count();
  check("Hero catalogue cards include image artwork",
    await page.locator("#heroGrid .hero-card .hero-image").count() > 0
    && await page.locator("#heroGrid .hero-card .hero-image[src]").count() > 0);
  check("Hero catalogue avatars are circular and fill the frame",
    await page.locator("#heroGrid .hero-image-wrap").first().evaluate(el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.borderRadius === "50%" && Math.abs(r.width - r.height) < 2
        && getComputedStyle(el.querySelector(".hero-image")).objectFit === "cover";
    }));
  // Perks are a separate route in the single-page shell; open it before interacting.
  await page.goto(BASE_URL + "?page=perks", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#perkGrid").waitFor({ state: "visible", timeout: 20000 });
  await page.locator('#perkFilters [data-perk-category="Roam"]').click();
  await page.waitForTimeout(250);
  check("Roam blessing has a visible dedicated icon",
    await page.locator('#perkGrid .item-image-vector[aria-label="Роум-благословение"]').count() > 0
    && await page.locator('#perkGrid .item-image-vector[aria-label="Роум-благословение"]').isVisible());
  check("Known spell and Roam perk cards use local vector artwork",
    await page.locator('#perkGrid .item-image-vector').count() > 0);
  await page.locator('#perkFilters [data-perk-category="Все"]').click();

  // Return to hero catalog before role filtering checks.
  await page.goto(BASE_URL + "?page=heroes", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#heroGrid").waitFor({ state: "visible", timeout: 20000 });

  // Tank and support roles are the core of many roam picks; make sure filtering them
  // does not hide or remove the associated hero artwork.
  for (const role of ["Танк", "Поддержка"]) {
    const roleButton = page.locator(`#roleFilters [data-role="${role}"]`);
    await roleButton.click();
    await page.waitForTimeout(250);
    const visibleCards = page.locator("#heroGrid .hero-card");
    check(`Roam-relevant role keeps hero images: ${role}`,
      await visibleCards.count() > 0
      && await page.locator("#heroGrid .hero-card .hero-image[src]").count() > 0);
  }
  await page.locator('#roleFilters [data-role="Все"]').click();
  await page.waitForTimeout(250);
  await page.goto(BASE_URL + "?page=builds", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#buildHeroAvatars .build-hero-avatar").first().waitFor({ state: "visible", timeout: 20000 });
  check("Build hero picker uses circular avatar frames",
    await page.locator(".build-hero-avatar-art").first().evaluate(el =>
      getComputedStyle(el).borderRadius === "50%"
      && Math.abs(el.getBoundingClientRect().width - el.getBoundingClientRect().height) < 1));
  check("Build hero picker artwork fills its avatar frame",
    await page.locator(".build-hero-avatar-art .hero-image").count() > 0
    && await page.locator(".build-hero-avatar-art .hero-image").first().evaluate(img =>
      getComputedStyle(img).objectFit === "cover"));
  await page.goto(BASE_URL + "?page=heroes", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#heroGrid").waitFor({ state: "visible", timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll("#heroGrid .hero-card .hero-image").length > 0, { timeout: 30000 });
  const heroGridLayout = await page.locator("#heroGrid").evaluate(grid => {
    const style = getComputedStyle(grid);
    return {
      columns: style.gridTemplateColumns.split(" ").filter(Boolean).length,
      gridWidth: Math.round(grid.getBoundingClientRect().width),
      cardWidths: Array.from(grid.querySelectorAll(".hero-card")).slice(0, 3)
        .map(card => Math.round(card.getBoundingClientRect().width))
    };
  });
  check("Mobile hero catalogue uses three columns", heroGridLayout.columns === 3,
    JSON.stringify(heroGridLayout));
  check("Hero cards fit within the mobile grid", heroGridLayout.cardWidths.length === 3
    && heroGridLayout.cardWidths.every(width => width > 0 && width < heroGridLayout.gridWidth / 2),
    JSON.stringify(heroGridLayout));
  await page.locator("#heroSearch").fill("Клинт");
  await page.waitForFunction(() => document.querySelectorAll("#heroGrid .hero-card").length === 1,
    { timeout: 10000 });
  const heroGridAfter = await page.locator("#heroGrid").innerText();
  check("Hero search supports Russian aliases", heroCardsBefore > 1
    && await page.locator("#heroGrid .hero-card").count() === 1
    && /clint/i.test(heroGridAfter),
    "searching for Клинт should return the Clint hero card");
  await page.locator("#heroGrid .hero-image-open").click();
  await page.locator("#hero-detail").waitFor({ state: "visible", timeout: 20000 });
  await page.locator("#profile-hero-build").waitFor({ state: "visible", timeout: 10000 });
  await page.locator("#profile-hero-talents").waitFor({ state: "visible", timeout: 10000 });
  check("Tapping a hero opens one profile with build and talents together",
    new URL(page.url()).searchParams.get("page") === "hero"
    && /Клинт|clint/i.test(await page.locator("#heroDetailPage").innerText())
    && await page.locator("#profile-hero-build").isVisible()
    && await page.locator("#profile-hero-talents").isVisible()
    && await page.locator(".hero-profile-jump-links a").count() === 3);
  const profileDimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  check("Hero profile fits the mobile viewport without horizontal overflow",
    profileDimensions.scrollWidth <= profileDimensions.width + 2,
    JSON.stringify(profileDimensions));

  await page.goto(BASE_URL + "?page=items", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#itemGrid").waitFor({ state: "visible", timeout: 20000 });
  await page.waitForFunction(() => {
    const count = document.querySelector("#itemCount")?.innerText || "";
    return /Предметов в справочнике:/i.test(count) && document.querySelectorAll("#itemGrid .item-card").length > 0;
  }, { timeout: 30000 });
  const itemCardsBefore = await page.locator("#itemGrid .item-card").count();
  await page.locator("#itemSearch").fill("Berserker");
  await page.waitForFunction(() => {
    const grid = document.querySelector("#itemGrid");
    return Boolean(grid?.innerText.includes("Ярость берсерка"))
      && document.querySelectorAll("#itemGrid .item-card").length > 0;
  }, { timeout: 10000 });
  const itemGridAfter = await page.locator("#itemGrid").innerText();
  check("Item search responds in English and displays Russian names", itemCardsBefore > 1
    && await page.locator("#itemGrid .item-card").count() < itemCardsBefore
    && /Ярость берсерка/i.test(itemGridAfter),
    "searching for Berserker should show Ярость берсерка and narrow the list");

  // Talent planner: hero/role/style controls, expandable descriptions, reset and icon rendering.
  await page.goto(BASE_URL + "?page=talents", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#talentLab").waitFor({ state: "visible", timeout: 20000 });
  await page.locator(".talent-slot-toggle").first().waitFor({ state: "visible", timeout: 20000 });
  const talentButton = page.locator(".talent-slot-toggle").first();
  await talentButton.click();
  check("Talent descriptions expand", await talentButton.getAttribute("aria-expanded") === "true"
    && await page.locator("#talent-description-0").isVisible());
  await page.locator("#talentRole").selectOption({ label: "Убийца" });
  check("Talent role changes recommendations", await page.locator("#talentRole").inputValue() === "Убийца"
    && await page.locator(".talent-slot-toggle").count() === 3);
  await page.locator("#talentStyle").selectOption({ label: "Выживаемость" });
  check("Talent style control responds", await page.locator("#talentStyle").inputValue() === "Выживаемость");
  check("Talent icons have a visible real-image or fallback", await page.locator(".talent-icon").count() === 3
    && await page.locator(".talent-icon svg, .talent-icon img").count() >= 3);
  await page.locator("#talentReset").click();
  check("Talent reset restores defaults", await page.locator("#talentRole").inputValue() === "Стрелок"
    && await page.locator("#talentStyle").inputValue() === "Агрессивно");

  // Mobile navigation must open and close after a route is chosen.
  await page.goto(BASE_URL + "?page=home", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.setViewportSize({ width: 360, height: 800 });
  const menuToggle = page.locator("#menuToggle");
  await menuToggle.click();
  check("Mobile menu opens accessibly", await menuToggle.getAttribute("aria-expanded") === "true"
    && await page.locator("#nav").evaluate(node => node.classList.contains("open")));
  await page.locator("#nav a[href='?page=heroes']").click();
  await page.locator("#heroes").waitFor({ state: "visible", timeout: 20000 });
  check("Mobile navigation closes after selection", await menuToggle.getAttribute("aria-expanded") === "false"
    && !(await page.locator("#nav").evaluate(node => node.classList.contains("open"))));

  for (const route of ["home", "heroes", "talents", "items", "builds"]) {
    await page.goto(BASE_URL + "?page=" + route, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(250);
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    check("No horizontal overflow on mobile: " + route, dimensions.scrollWidth <= dimensions.width + 2,
      JSON.stringify(dimensions));
  }

  check("No uncaught JavaScript exceptions", pageErrors.length === 0, pageErrors.join(" | "));
  console.log(JSON.stringify({ result: failures.length ? "FAIL" : "PASS", checks, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
  await context.close();
} finally {
  await browser.close();
}
