import unittest
from agentguard.client import AgentGuard
class TestSDK(unittest.TestCase):
    def test_requires_key(self):
        with self.assertRaises(ValueError): AgentGuard(api_key="")
    def test_fail_open(self):
        ag=AgentGuard(api_key="ag_live_x", base_url="http://127.0.0.1:1", fail_mode="fail-open")
        r=ag.check_policy({"tool":"deploy"}); self.assertEqual(r["decision"],"allow")
    def test_guard_decorator(self):
        ag=AgentGuard(api_key="ag_live_x", base_url="http://127.0.0.1:1", fail_mode="fail-open")
        @ag.guard(agent_id="a1")
        def fn(): return 42
        self.assertEqual(fn(),42)
if __name__=="__main__": unittest.main()
