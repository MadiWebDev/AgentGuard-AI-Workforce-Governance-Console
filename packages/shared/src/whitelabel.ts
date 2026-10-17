
import { ApiError } from "./errors";

/**
 * C3 — White-label console.
 * Per-org rebrand: logo, colors, custom domain, branded emails, and a
 * client portal scoped to one org. Rendered branded output must never
 * contain AgentGuard branding — leakCheck asserts that.
 */
export interface Brand {
  orgName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  domain?: string;
  emailFrom: string;
}
export interface BrandedPageProps {
  title: string;
  orgName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  emailFrom: string;
  footer: string;
}
const HEX = /^#[0-9a-fA-F]{6}$/;

export function validateBrand(brand: Brand): void {
  if (!brand.orgName.trim()) throw new ApiError("INVALID_BRAND", 400, "orgName is required");
  if (!HEX.test(brand.primaryColor) || !HEX.test(brand.secondaryColor)) throw new ApiError("INVALID_BRAND", 400, "Colors must be #rrggbb hex");
  if (!/^https?:\/\/.+/.test(brand.logoUrl)) throw new ApiError("INVALID_BRAND", 400, "logoUrl must be an http(s) URL");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.emailFrom)) throw new ApiError("INVALID_BRAND", 400, "emailFrom must be an email address");
  if (brand.domain) validateCustomDomain(brand.domain);
}

export function renderBrand(brand: Brand): BrandedPageProps {
  validateBrand(brand);
  return {
    title: `${brand.orgName} Console`,
    orgName: brand.orgName,
    logoUrl: brand.logoUrl,
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    emailFrom: brand.emailFrom,
    footer: `© ${brand.orgName}`,
  };
}

/** True when the rendered output contains no AgentGuard branding. */
export function leakCheck(rendered: unknown): boolean {
  return !JSON.stringify(rendered).includes("AgentGuard");
}

export function brandedEmail(brand: Brand, subject: string, body: string): { from: string; subject: string; body: string } {
  validateBrand(brand);
  return { from: brand.emailFrom, subject: `${brand.orgName}: ${subject}`, body: `${body}\n\n— ${brand.orgName}` };
}

/** Custom-domain config validation. Live TLS is a deployer step (see RUNBOOK): DNS CNAME + provisioned certificate; no live TLS is performed in the VM. */
export function validateCustomDomain(domain: string): { valid: true; domain: string } {
  const d = domain.trim().toLowerCase();
  const HOST = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/;
  if (!HOST.test(d) || !/\.[a-z]{2,}$/.test(d)) throw new ApiError("INVALID_DOMAIN", 400, "Custom domain must be a valid hostname with a TLD (e.g. console.client.com)");
  if (d === "localhost" || d.endsWith(".localhost") || d.endsWith(".local") || d.endsWith(".internal")) {
    throw new ApiError("INVALID_DOMAIN", 400, "Custom domain must be a public hostname");
  }
  return { valid: true, domain: d };
}

/** Client portal data: strictly scoped to one org — reports + approvals for that org only. */
export function portalDataForOrg<T extends { orgId: string }>(orgId: string, reports: T[], approvals: T[]): { orgId: string; reports: T[]; approvals: T[] } {
  return { orgId, reports: reports.filter((r) => r.orgId === orgId), approvals: approvals.filter((a) => a.orgId === orgId) };
}
