# Payment Gateway – Async Processing System

## Overview
This project implements a **production-style payment gateway** with asynchronous processing, background workers, webhook delivery with retries, refund management, and an embeddable JavaScript checkout SDK.

The system is inspired by real-world payment platforms such as Stripe and Razorpay and focuses on **reliability, scalability, and correctness** rather than synchronous request handling.

---

## Architecture Overview

### Services
- **API Service** (Node.js + Express)
- **Worker Service** (BullMQ + Redis)
- **PostgreSQL Database**
- **Dashboard Frontend**
- **Checkout Page (iframe-based)**
- **Embeddable JavaScript SDK**

### High-Level Flow
1. Merchant creates a payment → status returned as `pending`
2. Payment processing job is queued in Redis
3. Worker service processes the payment asynchronously
4. Webhook events are generated and delivered with retry logic
5. Dashboard shows webhook configuration, logs, and retry controls

---

## Setup Instructions

### Prerequisites
- Docker
- Docker Compose

### Start the Application
```bash
docker-compose up -d
```

### Stop the Application
```bash
docker-compose down
```

### Exposed Ports
| Service    | Port |
|-----------|------|
| API       | 8000 |
| Dashboard | 3000 |
| Checkout  | 3001 |
| Redis     | 6379 |
| PostgreSQL| 5432 |

---

## Environment Variables

Example `.env` values:
```env
DATABASE_URL=postgresql://gateway_user:gateway_pass@postgres:5432/payment_gateway
REDIS_URL=redis://redis:6379
TEST_MODE=true
WEBHOOK_RETRY_INTERVALS_TEST=true
```

---

## API Documentation (Summary)

### Create Payment (Async)
```
POST /api/v1/payments
Headers:
X-Api-Key
X-Api-Secret
Idempotency-Key (optional)
```

### Capture Payment
```
POST /api/v1/payments/{payment_id}/capture
```

### Create Refund (Async)
```
POST /api/v1/payments/{payment_id}/refunds
```

### Get Refund
```
GET /api/v1/refunds/{refund_id}
```

### Webhook Logs
```
GET /api/v1/webhooks
```

### Retry Webhook
```
POST /api/v1/webhooks/{webhook_id}/retry
```

### Job Queue Status (Test Endpoint)
```
GET /api/v1/test/jobs/status
```

---

## Webhook Integration Guide

- Webhooks are signed using **HMAC-SHA256**
- Signature is sent in the `X-Webhook-Signature` header
- Merchants must verify the signature before trusting webhook data

### Retry Strategy
Production:
- Immediate
- 1 minute
- 5 minutes
- 30 minutes
- 2 hours

Test Mode:
- Immediate
- 5s
- 10s
- 15s
- 20s

Webhook delivery attempts and responses are stored in the `webhook_logs` table and visible in the dashboard.

---

## SDK Integration Guide

Include the SDK:
```html
<script src="http://localhost:3001/checkout.js"></script>
```

Usage:
```html
<script>
const checkout = new PaymentGateway({
  key: "key_test_abc123",
  orderId: "order_xyz",
  onSuccess: (response) => {
    console.log("Payment successful:", response.paymentId);
  },
  onFailure: (error) => {
    console.error("Payment failed:", error);
  },
  onClose: () => {
    console.log("Checkout closed");
  }
});

checkout.open();
</script>
```

The SDK opens an iframe-based checkout modal and communicates with the parent page using `postMessage`.

---

## Testing Instructions

1. Start all services:
```bash
docker-compose up -d
```

2. Verify worker and queue status:
```bash
curl http://localhost:8000/api/v1/test/jobs/status
```

3. Use the dashboard to:
- Configure webhook URL and secret
- Send test webhooks
- View webhook logs
- Retry failed webhooks

---

## Design Notes

- Payment processing is **fully asynchronous**
- Workers are stateless and horizontally scalable
- Webhooks are the **source of truth** for payment outcomes
- Idempotency keys prevent duplicate charges
- Retry logic ensures reliable delivery in failure scenarios

---

## Conclusion

This project demonstrates a **real-world payment gateway architecture** with async processing, event-driven design, and operational visibility, suitable for production-grade systems.
