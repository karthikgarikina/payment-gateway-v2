import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8000";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    amount: 0,
    successRate: 0,
  });

  useEffect(() => {
    async function load() {
      const res = await axios.get(`${API}/api/v1/payments`, {
        headers: {
          "X-Api-Key": "key_test_abc123",
          "X-Api-Secret": "secret_test_xyz789",
        },
      });

      const payments = res.data || [];
      const success = payments.filter(p => p.status === "success");

      setStats({
        total: payments.length,
        amount: success.reduce((s, p) => s + p.amount, 0),
        successRate: payments.length
          ? Math.round((success.length / payments.length) * 100)
          : 0,
      });
    }

    load();
  }, []);

  return (
    <div data-test-id="dashboard">
      <div data-test-id="api-credentials">
        <div>
          <label>API Key</label>
          <span data-test-id="api-key">key_test_abc123</span>
        </div>
        <div>
          <label>API Secret</label>
          <span data-test-id="api-secret">secret_test_xyz789</span>
        </div>
      </div>

      <div data-test-id="stats-container">
        <div data-test-id="total-transactions">{stats.total}</div>
        <div data-test-id="total-amount">₹{stats.amount}</div>
        <div data-test-id="success-rate">{stats.successRate}%</div>
      </div>
    </div>
  );
}
