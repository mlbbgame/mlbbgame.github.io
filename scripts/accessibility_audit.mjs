import { chromium } from "playwright";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const BASE_URL = "https://mlbbgame.github.io/";
const routes = [
  ["home", "#home"],
  ["heroes", "#heroes"],
  ["talents", "#talentLab"],
  ["items", "#items"],
  ["builds", "#builds"],
  ["guides", "#guides"],
  ["esports", "#esports"]
];

const browser = await chromium.launch({ headless: true });
const results = [];
const pageErrors = [];

try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1
  });
  page.on("pageerror", error => pageErrors.push(error.message));

  for (const [route, selector] of routes) {
    const url = new URL(BASE_URL);
    url.searchParams.set("page", route);
    url.searchParams.set("axeAudit", String(Date.now()));

    await page.goto(url.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });
    await page.locator(selector).waitFor({ state: "visible", timeout: 20000 });
    await page.addScriptTag({ path: axePath });

    const audit = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]
        }
      });
      return {
        violations: result.violations.map(item => ({
          id: item.id,
          impact: item.impact,
          help: item.help,
          helpUrl: item.helpUrl,
          nodes: item.nodes.map(node => ({
            target: node.target,
            summary: node.failureSummary
          }))
        })),
        passes: result.passes.length,
        incomplete: result.incomplete.length
      };
    });

    results.push({ route, ...audit });
    console.log(JSON.stringify({
      route,
      violations: audit.violations.length,
      critical: audit.violations.filter(item => item.impact === "critical").length,
      serious: audit.violations.filter(item => item.impact === "serious").length,
      passes: audit.passes,
      incomplete: audit.incomplete
    }));
  }

  const critical = results.flatMap(result =>
    result.violations
      .filter(item => item.impact === "critical")
      .map(item => ({ route: result.route, ...item }))
  );
  const summary = {
    result: critical.length || pageErrors.length ? "FAIL" : "PASS",
    routesAudited: results.length,
    violationGroups: results.reduce((sum, result) => sum + result.violations.length, 0),
    criticalViolations: critical.length,
    seriousViolations: results.reduce((sum, result) =>
      sum + result.violations.filter(item => item.impact === "serious").length, 0),
    pageErrors,
    details: results
  };

  console.log(JSON.stringify(summary, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFile } = await import("node:fs/promises");
    const lines = [
      "# GRIM_MLBB accessibility audit",
      "",
      "- Result: **" + summary.result + "**",
      "- Routes audited: " + summary.routesAudited,
      "- Violation groups: " + summary.violationGroups,
      "- Critical violations (fail build): " + summary.criticalViolations,
      "- Serious violations (reported for follow-up): " + summary.seriousViolations,
      "",
      "## Findings by page",
      ...results.map(result => "### " + result.route + "\n" +
        (result.violations.length
          ? result.violations.map(item => "- **" + item.impact + "** " + item.id + ": " + item.help + " (" + item.nodes.length + " elements)").join("\n")
          : "- No axe-core violations detected."))
    ];
    await appendFile(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
  }

  if (critical.length || pageErrors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
