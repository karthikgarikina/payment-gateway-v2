import { useEffect, useState } from "react";

const API = "http://localhost:8000";

export default function Checkout() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");

  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState(null);

  // UPI
  const [vpa, setVpa] = useState("");

  // Card
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holderName, setHolderName] = useState("");

  // UI state
  const [status, setStatus] = useState("idle"); // idle | processing | success | failed
  const [paymentId, setPaymentId] = useState(null);
  const [error, setError] = useState("");

  /* ---------------- Load order ---------------- */
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

  /* ---------------- Poll payment ---------------- */
  useEffect(() => {
    if (!paymentId) return;

    const interval = setInterval(async () => {
      const res = await fetch(
        `${API}/api/v1/payments/${paymentId}/public`
      );
      const data = await res.json();

      if (data.status === "success") {
        setStatus("success");
        clearInterval(interval);
      } else if (data.status === "failed") {
        setStatus("failed");
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [paymentId]);

  /* ---------------- Create payment ---------------- */
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

  /* ---------------- UI guards ---------------- */
  if (!order) return <h2>Loading order...</h2>;

  return (
    <div data-test-id="checkout-container">
      <h2>Complete Payment</h2>

      {/* Order Summary */}
      <div data-test-id="order-summary">
        <div>
          Amount:{" "}
          <span data-test-id="order-amount">
            ₹{(order.amount / 100).toFixed(2)}
          </span>
        </div>
        <div>
          Order ID:{" "}
          <span data-test-id="order-id">{order.id}</span>
        </div>
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
          <div data-test-id="payment-methods">
            <button data-test-id="method-upi" onClick={() => setMethod("upi")}>
              UPI
            </button>
            <button data-test-id="method-card" onClick={() => setMethod("card")}>
              Card
            </button>
          </div>

          {/* UPI FORM */}
          {method === "upi" && (
            <form
              data-test-id="upi-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!vpa) {
                  setError("Please enter a valid UPI ID");
                  return;
                }
                createPayment({ method: "upi", vpa });
              }}
            >
              <input
                data-test-id="vpa-input"
                placeholder="username@bank (e.g. raju@paytm)"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
              />
              <button data-test-id="pay-button" type="submit">
                Pay ₹{(order.amount / 100).toFixed(0)}
              </button>
            </form>
          )}

          {/* CARD FORM */}
          {method === "card" && (
            <form
              data-test-id="card-form"
              onSubmit={(e) => {
                e.preventDefault();

                if (!cardNumber || !expiry || !cvv || !holderName) {
                  setError("All card fields are required");
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
                data-test-id="card-number-input"
                placeholder="Card Number (e.g. 4111 1111 1111 1111)"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />

              <input
                data-test-id="expiry-input"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />

              <input
                data-test-id="cvv-input"
                placeholder="CVV"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
              />

              <input
                data-test-id="cardholder-name-input"
                placeholder="Name on Card"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
              />

              <button data-test-id="pay-button" type="submit">
                Pay ₹{(order.amount / 100).toFixed(0)}
              </button>
            </form>
          )}
        </>
      )}

      {/* Processing */}
      {status === "processing" && (
        <div data-test-id="processing-state">
          Processing payment...
        </div>
      )}

      {/* Success */}
      {status === "success" && (
        <div data-test-id="success-state">
          <h3>Payment Successful 🎉</h3>
          <div>
            Payment ID:{" "}
            <span data-test-id="payment-id">{paymentId}</span>
          </div>
        </div>
      )}

      {/* Failure */}
      {status === "failed" && (
        <div data-test-id="error-state">
          Payment Failed. Please try again.
        </div>
      )}
    </div>
  );
}
