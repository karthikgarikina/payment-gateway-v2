import { useEffect, useState } from "react";
import {
  getWebhookConfig,
  saveWebhookUrl,
  rotateWebhookSecret,
  sendTestWebhook,
  getWebhookLogs,
  retryWebhook,
} from "../services/webhookApi";

export default function Webhooks() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [logs, setLogs] = useState([]);

  /* ---------------- EFFECT (ASYNC INSIDE) ---------------- */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const config = await getWebhookConfig();
      if (!cancelled) {
        setWebhookUrl(config.webhook_url || "");
        setWebhookSecret(config.webhook_secret || "");
      }

      const logData = await getWebhookLogs();
      if (!cancelled) {
        setLogs(logData.data || []);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- helpers (NOT used in effect) ---------------- */

  async function reloadLogs() {
    const data = await getWebhookLogs();
    setLogs(data.data || []);
  }

  /* ---------------- UI ---------------- */

  return (
    <div data-test-id="webhook-config">
      <h2>Webhook Configuration</h2>

      <div>
        <label>Webhook URL</label>
        <br />
        <input
          data-test-id="webhook-url-input"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://yoursite.com/webhook"
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <label>Webhook Secret</label>
        <br />
        <span data-test-id="webhook-secret">{webhookSecret}</span>
        <br />
        <button
          data-test-id="regenerate-secret-button"
          onClick={async () => {
            const res = await rotateWebhookSecret();
            setWebhookSecret(res.webhook_secret);
          }}
        >
          Regenerate
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          data-test-id="save-webhook-button"
          onClick={() => saveWebhookUrl(webhookUrl)}
        >
          Save Configuration
        </button>

        <button
          data-test-id="test-webhook-button"
          onClick={async () => {
            await sendTestWebhook();
            setTimeout(reloadLogs, 1000);
          }}
          style={{ marginLeft: 10 }}
        >
          Send Test Webhook
        </button>
      </div>

      <h3 style={{ marginTop: 30 }}>Webhook Logs</h3>

      <table data-test-id="webhook-logs-table" border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Event</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Response Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              data-test-id="webhook-log-item"
              data-webhook-id={log.id}
            >
              <td data-test-id="webhook-event">{log.event}</td>
              <td data-test-id="webhook-status">{log.status}</td>
              <td data-test-id="webhook-attempts">{log.attempts}</td>
              <td data-test-id="webhook-response-code">
                {log.response_code || "-"}
              </td>
              <td>
                <button
                  data-test-id="retry-webhook-button"
                  onClick={async () => {
                    await retryWebhook(log.id);
                    setTimeout(reloadLogs, 1000);
                  }}
                >
                  Retry
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
