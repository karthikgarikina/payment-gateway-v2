const API = "http://localhost:8000/api/v1";

const headers = {
  "Content-Type": "application/json",
  "X-Api-Key": "key_test_abc123",
  "X-Api-Secret": "secret_test_xyz789",
};

export async function getWebhookConfig() {
  const res = await fetch(`${API}/dashboard/webhook`, { headers });
  return res.json();
}

export async function saveWebhookUrl(webhook_url) {
  const res = await fetch(`${API}/dashboard/webhook`, {
    method: "POST",
    headers,
    body: JSON.stringify({ webhook_url }),
  });
  return res.json();
}

export async function rotateWebhookSecret() {
  const res = await fetch(`${API}/dashboard/webhook/rotate-secret`, {
    method: "POST",
    headers,
  });
  return res.json();
}

export async function sendTestWebhook() {
  const res = await fetch(`${API}/dashboard/webhook/test`, {
    method: "POST",
    headers,
  });
  return res.json();
}

export async function getWebhookLogs(limit = 10, offset = 0) {
  const res = await fetch(
    `${API}/webhooks?limit=${limit}&offset=${offset}`,
    { headers }
  );
  return res.json();
}

export async function retryWebhook(id) {
  const res = await fetch(`${API}/webhooks/${id}/retry`, {
    method: "POST",
    headers,
  });
  return res.json();
}
