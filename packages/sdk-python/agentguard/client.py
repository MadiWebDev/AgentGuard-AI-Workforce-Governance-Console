import functools, json, urllib.request, uuid
class AgentGuard:
    def __init__(self, api_key, base_url="http://localhost:3000", fail_mode="fail-closed"):
        if not api_key: raise ValueError("api_key required")
        self.api_key=api_key; self.base_url=base_url.rstrip("/"); self.fail_mode=fail_mode
    def _post(self, path, body):
        req=urllib.request.Request(self.base_url+path, data=json.dumps(body).encode(), headers={"content-type":"application/json","x-api-key":self.api_key}, method="POST")
        try:
            import urllib.request as _u
            with _u.urlopen(req, timeout=2) as r: return json.loads(r.read().decode())
        except Exception:
            if self.fail_mode=="fail-open": return {"decision":"allow","reason":"fail-open fallback","matched_rule_ids":[]}
            raise
    def track(self, event): return self._post("/api/v1/ingest", {"events":[event]})
    def check_policy(self, action): return self._post("/api/v1/policy/check", action)
    def request_approval(self, action): return self._post("/api/v1/approvals", action)
    def flush(self): return {"flushed": True}
    def guard(self, func=None, **kwargs):
        def deco(fn):
            @functools.wraps(fn)
            def wrapper(*a, **kw):
                return fn(*a, **kw)
            return wrapper
        return deco(func) if func else deco
def guard(func=None, **kwargs):
    def deco(fn):
        @functools.wraps(fn)
        def wrapper(*a, **kw): return fn(*a, **kw)
        return wrapper
    return deco(func) if func else deco
