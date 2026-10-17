import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const APP = join(ROOT, "src/app");

function allPages(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) allPages(p, out);
    else if (e === "page.tsx") out.push(p);
  }
  return out;
}

describe("v1.4 design system", () => {
  it("tokens file declares the core M3 roles (light + dark)", () => {
    const css = readFileSync(join(APP, "globals.css"), "utf8");
    for (const role of ["--m3-primary:", "--m3-on-primary:", "--m3-primary-container:", "--m3-secondary:", "--m3-tertiary:", "--m3-error:", "--m3-surface:", "--m3-on-surface:", "--m3-surface-container-low:", "--m3-surface-container-high:", "--m3-outline:", "--m3-inverse-surface:", "--m3-elevation-1:", "--m3-radius-md:", "--m3-ease-emphasized:"]) {
      expect(css).toContain(role);
    }
    expect(css).toContain(".dark");
    expect(css).toContain("prefers-reduced-motion");
  });
  it("tailwind config maps M3 tokens to utilities", () => {
    const cfg = readFileSync(join(ROOT, "tailwind.config.ts"), "utf8");
    for (const token of ["primary-container", "on-surface", "surface-container-high", "elevation-2", "m3-lg"]) {
      expect(cfg).toContain(token);
    }
  });
  it("/design gallery is 404 in production", () => {
    const page = readFileSync(join(APP, "design/page.tsx"), "utf8");
    expect(page).toContain('process.env.NODE_ENV === "production"');
    expect(page).toContain("notFound()");
  });
  it("no page component contains a raw 'no data' string", () => {
    for (const p of allPages(APP)) {
      const src = readFileSync(p, "utf8");
      expect(src.toLowerCase()).not.toContain("no data");
    }
  });
  it("shell components exist", () => {
    for (const f of ["components/m3.tsx", "components/shell.tsx", "components/charts.tsx"]) {
      expect(() => readFileSync(join(ROOT, "src", f), "utf8")).not.toThrow();
    }
  });
  it("pages use PageHeader (breadcrumbs + header pattern) — full coverage except documented exemptions", () => {
    const pages = allPages(APP);
    expect(pages.length).toBeGreaterThanOrEqual(60);
    // Exemptions: marketing home (hero pattern) and auth pages (AuthShell centered-card pattern).
    const exempt = new Set(["page.tsx", "login/page.tsx", "signup/page.tsx", "magic-link/page.tsx", "verify-2fa/page.tsx"]);
    const missing = pages.filter((p) => !readFileSync(p, "utf8").includes("PageHeader") && !exempt.has(p.replace(`${APP}/`, "")));
    expect(missing).toEqual([]);
  });
  it("no page uses raw inline h1 fontSize styling (M3 type classes instead)", () => {
    for (const p of allPages(APP)) {
      const src = readFileSync(p, "utf8");
      expect(src).not.toMatch(/fontSize:\s*28/);
    }
  });
});
