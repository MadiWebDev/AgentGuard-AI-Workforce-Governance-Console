/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const csp = ["default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: https:", "connect-src 'self'", "font-src 'self' data:", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"].join("; ");
const headers = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: csp },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];
if (isProd) headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
const nextConfig = { output: "standalone", transpilePackages: ["@agentguard/shared"], async headers() { return [{ source: "/(.*)", headers }]; } };
export default nextConfig;
