import { z } from "zod";
import { renderBrand, ApiError } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
import { v13 } from "@/server/v13-store";
const brandSchema = z.object({ orgName: z.string(), logoUrl: z.string(), primaryColor: z.string(), secondaryColor: z.string(), domain: z.string().optional(), emailFrom: z.string() });
export async function GET(_req: Request, { params }: { params: { orgId: string } }) {
  const rid = reqId(new Headers());
  try {
    const brand = v13.brands.get(params.orgId);
    if (!brand) return err("BRAND_NOT_FOUND", `No brand configured for org ${params.orgId}`, rid, 404);
    return ok({ brand: renderBrand(brand) }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
export async function POST(req: Request, { params }: { params: { orgId: string } }) {
  const rid = reqId(req.headers);
  try {
    const parsed = brandSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid brand body", rid, 400, parsed.error.issues);
    const rendered = renderBrand(parsed.data);
    v13.brands.set(params.orgId, parsed.data);
    return ok({ brand: rendered }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
