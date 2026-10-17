
export class ApiError extends Error {
  code: string; status: number; details?: unknown; requestId: string;
  constructor(code: string, status: number, message: string, details?: unknown, requestId = "req_local") {
    super(message); this.code = code; this.status = status; this.details = details; this.requestId = requestId;
  }
  toJSON() { return { error: { code: this.code, message: this.message, details: this.details ?? null, request_id: this.requestId } }; }
}
export function errorResponse(err: unknown, requestId = "req_local"): { status: number; body: unknown } {
  if (err instanceof ApiError) { const e = new ApiError(err.code, err.status, err.message, err.details, requestId); return { status: e.status, body: e.toJSON() }; }
  const msg = err instanceof Error ? err.message : "Internal error";
  return { status: 500, body: { error: { code: "INTERNAL_ERROR", message: msg, details: null, request_id: requestId } } };
}
export function newRequestId(): string { return `req_${Math.random().toString(36).slice(2,10)}${Date.now().toString(36)}`; }
