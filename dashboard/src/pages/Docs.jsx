export default function Docs() {
  return (
    <div data-test-id="api-docs">
      <h2>Integration Guide</h2>

      <section data-test-id="section-create-order">
        <h3>1. Create Order</h3>
        <pre>
{`curl -X POST http://localhost:8000/api/v1/orders \\
  -H "X-Api-Key: key_test_abc123" \\
  -H "X-Api-Secret: secret_test_xyz789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "INR",
    "receipt": "receipt_123"
  }'`}
        </pre>
      </section>

      <section data-test-id="section-sdk-integration">
        <h3>2. SDK Integration</h3>
        <pre>
{`<script src="http://localhost:3000/checkout.js"></script>
<script>
const checkout = new PaymentGateway({
  key: 'key_test_abc123',
  orderId: 'order_xyz',
  onSuccess: (res) => console.log(res)
});
checkout.open();
</script>`}
        </pre>
      </section>

      <section data-test-id="section-webhook-verification">
        <h3>3. Verify Webhook Signature</h3>
        <pre>
{`const crypto = require("crypto");

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return signature === expected;
}`}
        </pre>
      </section>
    </div>
  );
}
