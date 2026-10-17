
import { ApiError } from "./errors";

/**
 * C7 — Warehouse sync.
 * Continuous sync of events, audit rows, and cost rollups to customer
 * warehouses via the WarehouseSink interface. Schema is documented in
 * docs/WAREHOUSE_SCHEMA.md. Backfill is exactly-once: idempotency keys
 * dedupe, so a duplicate backfill never double-writes.
 * PostgresSink executes parameterized INSERTs against an injected
 * DbClient — tests use an in-memory fake implementing the same interface;
 * no live Postgres is required. BigQuery/Snowflake adapters throw
 * NOT_CONFIGURED without credentials.
 */
export interface WarehouseRow { idempotencyKey: string; [col: string]: unknown }
export interface WarehouseSink {
  name: string;
  writeEvents(rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }>;
  writeAudit(rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }>;
  writeCosts(rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }>;
}
export interface DbClient { query(text: string, params: unknown[]): Promise<{ rowCount: number }>; }

/** In-memory fake DbClient for tests — implements the same interface as a real pg client. */
export class FakeDbClient implements DbClient {
  statements: { text: string; params: unknown[] }[] = [];
  seen = new Set<string>();
  async query(text: string, params: unknown[]): Promise<{ rowCount: number }> {
    this.statements.push({ text, params });
    return { rowCount: 1 };
  }
}

function dedupeKey(table: string, row: WarehouseRow): string { return `${table}:${row.idempotencyKey}`; }

/** Base class with exactly-once dedupe shared by all sinks. */
export abstract class BaseWarehouseSink implements WarehouseSink {
  abstract name: string;
  protected seen = new Set<string>();
  protected dedupe(table: string, rows: WarehouseRow[]): WarehouseRow[] {
    const fresh: WarehouseRow[] = [];
    for (const r of rows) {
      const k = dedupeKey(table, r);
      if (this.seen.has(k)) continue;
      this.seen.add(k);
      fresh.push(r);
    }
    return fresh;
  }
  abstract writeEvents(rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }>;
  abstract writeAudit(rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }>;
  abstract writeCosts(rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }>;
}

export const WAREHOUSE_TABLES = {
  events: ["idempotency_key", "trace_id", "agent_id", "org_id", "type", "input_redacted", "output_redacted", "model", "tokens_in", "tokens_out", "cost_usd", "created_at"],
  audit: ["idempotency_key", "row_id", "org_id", "action", "payload_json", "prev_hash", "row_hash", "created_at"],
  costs: ["idempotency_key", "org_id", "agent_id", "period", "total_cost_usd", "event_count", "created_at"],
} as const;

export class PostgresSink extends BaseWarehouseSink {
  name = "postgres";
  constructor(private db: DbClient) { super(); }
  private async insert(table: string, rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }> {
    const fresh = this.dedupe(table, rows);
    for (const row of fresh) {
      const cols = Object.keys(row).filter((c) => c !== "idempotencyKey");
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
      const text = `INSERT INTO ${table} (idempotency_key, ${cols.join(", ")}) VALUES ($1, ${placeholders}) ON CONFLICT (idempotency_key) DO NOTHING`;
      await this.db.query(text, [row.idempotencyKey, ...cols.map((c) => row[c])]);
    }
    return { written: fresh.length, duplicates: rows.length - fresh.length };
  }
  writeEvents(rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }> { return this.insert("warehouse_events", rows); }
  writeAudit(rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }> { return this.insert("warehouse_audit", rows); }
  writeCosts(rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }> { return this.insert("warehouse_costs", rows); }
}

export class BigQuerySink extends BaseWarehouseSink {
  name = "bigquery";
  private notConfigured(): never { throw new ApiError("BIGQUERY_NOT_CONFIGURED", 503, "BigQuery not configured: set BIGQUERY_PROJECT_ID + BIGQUERY_DATASET + BIGQUERY_CREDENTIALS. No rows are written until configured."); }
  async writeEvents(_rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }> { this.notConfigured(); }
  async writeAudit(_rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }> { this.notConfigured(); }
  async writeCosts(_rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }> { this.notConfigured(); }
}
export class SnowflakeSink extends BaseWarehouseSink {
  name = "snowflake";
  private notConfigured(): never { throw new ApiError("SNOWFLAKE_NOT_CONFIGURED", 503, "Snowflake not configured: set SNOWFLAKE_ACCOUNT + SNOWFLAKE_USER + SNOWFLAKE_PASSWORD + SNOWFLAKE_WAREHOUSE. No rows are written until configured."); }
  async writeEvents(_rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }> { this.notConfigured(); }
  async writeAudit(_rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }> { this.notConfigured(); }
  async writeCosts(_rows: WarehouseRow[]): Promise<{ written: number; duplicates: number }> { this.notConfigured(); }
}

export interface BackfillProgress { total: number; written: number; percent: number }

/** Historical backfill with progress + exactly-once (sink dedupes on idempotency keys). */
export async function backfill(
  sink: WarehouseSink,
  history: { events: WarehouseRow[]; audit: WarehouseRow[]; costs: WarehouseRow[] },
  onProgress?: (p: BackfillProgress) => void,
): Promise<BackfillProgress> {
  const total = history.events.length + history.audit.length + history.costs.length;
  let written = 0;
  const report = () => onProgress?.({ total, written, percent: total === 0 ? 100 : Math.round((written / total) * 100) });
  const e = await sink.writeEvents(history.events); written += e.written; report();
  const a = await sink.writeAudit(history.audit); written += a.written; report();
  const c = await sink.writeCosts(history.costs); written += c.written; report();
  return { total, written, percent: total === 0 ? 100 : Math.round((written / total) * 100) };
}

/** Buffered sync: when the sink is down, rows buffer and backfill on recovery — never lost, never double-written (idempotency keys). */
export class BufferedWarehouseSync {
  private buffer: { kind: "events" | "audit" | "costs"; row: WarehouseRow }[] = [];
  constructor(private sink: WarehouseSink) {}
  async sync(kind: "events" | "audit" | "costs", rows: WarehouseRow[]): Promise<{ written: number; buffered: number }> {
    try {
      const fn = kind === "events" ? this.sink.writeEvents.bind(this.sink) : kind === "audit" ? this.sink.writeAudit.bind(this.sink) : this.sink.writeCosts.bind(this.sink);
      const r = await fn(rows);
      return { written: r.written, buffered: this.buffer.length };
    } catch {
      this.buffer.push(...rows.map((row) => ({ kind, row })));
      return { written: 0, buffered: this.buffer.length };
    }
  }
  async flush(): Promise<{ written: number; buffered: number }> {
    let written = 0;
    const pending = this.buffer; this.buffer = [];
    for (const item of pending) {
      const r = await this.sync(item.kind, [item.row]);
      written += r.written;
      if (r.written === 0) { /* re-buffered inside sync on failure */ }
    }
    return { written, buffered: this.buffer.length };
  }
  bufferedCount(): number { return this.buffer.length; }
}
