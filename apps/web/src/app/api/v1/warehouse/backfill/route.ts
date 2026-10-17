import { z } from "zod";
import { backfill, ApiError } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
import { warehouseSink } from "@/server/v13-store";
const rowSchema = z.object({ idempotencyKey: z.string() }).catchall(z.unknown());
const bodySchema = z.object({ history: z.object({ events: z.array(rowSchema), audit: z.array(rowSchema), costs: z.array(rowSchema) }) });
export async function POST(req: Request) {
  const rid = reqId(req.headers);
  try {
    if (process.env.NODE_ENV === "production" && !process.env.WAREHOUSE_DATABASE_URL) return err("WAREHOUSE_NOT_CONFIGURED", "Warehouse backfill in production requires WAREHOUSE_DATABASE_URL and a real warehouse sink", rid, 503);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid backfill body", rid, 400, parsed.error.issues);
    const progress = await backfill(warehouseSink, parsed.data.history as never);
    return ok({ progress }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
