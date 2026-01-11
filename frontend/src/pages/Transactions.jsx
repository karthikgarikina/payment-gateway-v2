import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8000";

export default function Transactions() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await axios.get(`${API}/api/v1/payments`, {
        headers: {
          "X-Api-Key": "key_test_abc123",
          "X-Api-Secret": "secret_test_xyz789",
        },
      });
      setPayments(res.data || []);
    }
    load();
  }, []);

  return (
    <table data-test-id="transactions-table">
      <thead>
        <tr>
          <th>Payment ID</th>
          <th>Order ID</th>
          <th>Amount</th>
          <th>Method</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {payments.map(p => (
          <tr
            key={p.id}
            data-test-id="transaction-row"
            data-payment-id={p.id}
          >
            <td data-test-id="payment-id">{p.id}</td>
            <td data-test-id="order-id">{p.order_id}</td>
            <td data-test-id="amount">{p.amount}</td>
            <td data-test-id="method">{p.method}</td>
            <td data-test-id="status">{p.status}</td>
            <td data-test-id="created-at">
              {new Date(p.created_at).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
