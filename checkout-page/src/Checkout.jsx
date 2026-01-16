import { useEffect, useState } from "react";

const API = "http://localhost:8000";

/* ---------------- postMessage helper ---------------- */
function sendToParent(type, data = {}) {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type, data }, "*");
  }
}

export default function Checkout() {
  /* ---------------- params ---------------- */
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");
  const embedded = params.get("embedded") === "true";

  /* ---------------- state ---------------- */
  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState(null);

  // UPI
  const [vpa, setVpa] = useState("");

  // Card
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holderName, setHolderName] = useState("");

  // UI
  const [status, setStatus] = useState("idle"); // idle | processing | success | failed
  const [paymentId, setPaymentId] = useState(null);
  const [error, setError] = useState("");

  /* ---------------- load order ---------------- */
  useEffect(() => {
    if (!orderId) return;

    fetch(`${API}/api/v1/orders/${orderId}/public`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setOrder)
      .catch(() => setError("Failed to load order"));
  }, [orderId]);

  /* ---------------- poll payment ---------------- */
  useEffect(() => {
    if (!paymentId) return;

    const interval = setInterval(async () => {
      const res = await fetch(
        `${API}/api/v1/payments/${paymentId}/public`
      );
      const data = await res.json();

      if (data.status === "success") {
        clearInterval(interval);
        setStatus("success");
        sendToParent("payment_success", { paymentId });
      }

      if (data.status === "failed") {
        clearInterval(interval);
        setStatus("failed");
        sendToParent("payment_failed", { paymentId });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [paymentId]);

  /* ---------------- create payment ---------------- */
  async function createPayment(payload) {
    setError("");
    setStatus("processing");

    try {
      const res = await fetch(`${API}/api/v1/payments/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          ...payload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("idle");
        setError(data?.error?.description || "Payment failed");
        return;
      }

      setPaymentId(data.id);
    } catch {
      setStatus("idle");
      setError("Network error. Please try again.");
    }
  }

  /* ---------------- RENDER ---------------- */

  // Missing order_id UI (NO EARLY RETURN BEFORE HOOKS)
  if (!orderId) {
    return (
      <div data-test-id="error-state">
        <h3>Error</h3>
        <p>Missing order_id</p>
        {embedded && (
          <button onClick={() => sendToParent("close_modal")}>
            Close
          </button>
        )}
      </div>
    );
  }

  if (!order) return <h2>Loading order...</h2>;

  return (
    <div data-test-id="checkout-container">
      <h2>Complete Payment</h2>

      {/* Order Summary */}
      <div data-test-id="order-summary">
        <div>
          Amount: ₹{(order.amount / 100).toFixed(2)}
        </div>
        <div>Order ID: {order.id}</div>
      </div>

      {/* Error */}
      {error && (
        <div data-test-id="error-message" style={{ color: "red" }}>
          {error}
        </div>
      )}

      {/* Method selection */}
      {status === "idle" && (
        <>
          <button onClick={() => setMethod("upi")}>UPI</button>
          <button onClick={() => setMethod("card")}>Card</button>

          {method === "upi" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!vpa) {
                  setError("Enter valid UPI ID");
                  return;
                }
                createPayment({ method: "upi", vpa });
              }}
            >
              <input
                placeholder="username@bank"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
              />
              <button type="submit">Pay</button>
            </form>
          )}

          {method === "card" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!cardNumber || !expiry || !cvv || !holderName) {
                  setError("All fields required");
                  return;
                }

                const [mm, yy] = expiry.split("/");

                createPayment({
                  method: "card",
                  card: {
                    number: cardNumber.replace(/\s+/g, ""),
                    expiry_month: mm,
                    expiry_year: yy,
                    cvv,
                    holder_name: holderName,
                  },
                });
              }}
            >
              <input
                placeholder="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
              <input
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
              <input
                placeholder="CVV"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
              />
              <input
                placeholder="Name on Card"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
              />
              <button type="submit">Pay</button>
            </form>
          )}
        </>
      )}

      {status === "processing" && <p>Processing payment...</p>}

      {status === "success" && (
        <p>Payment successful 🎉 (ID: {paymentId})</p>
      )}

      {status === "failed" && <p>Payment failed</p>}

      {embedded && (
        <button onClick={() => sendToParent("close_modal")}>
          Close
        </button>
      )}
    </div>
  );
}
