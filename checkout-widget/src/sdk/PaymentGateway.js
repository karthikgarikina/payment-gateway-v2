import { createModal } from "./modal";

class PaymentGateway {
  constructor(options) {
    if (!options || !options.key || !options.orderId) {
      throw new Error("key and orderId are required");
    }

    this.key = options.key;
    this.orderId = options.orderId;
    this.onSuccess = options.onSuccess;
    this.onFailure = options.onFailure;
    this.onClose = options.onClose;

    this.modal = null;
    this.messageListener = this.handleMessage.bind(this);
  }

  open() {
    console.log("PaymentGateway.open called");

    const iframeSrc = `http://localhost:3001/?order_id=${this.orderId}&embedded=true`;


    this.modal = createModal(iframeSrc, () => this.close());
    document.body.appendChild(this.modal);

    window.addEventListener("message", this.messageListener);
  }

  handleMessage(event) {
    if (!event.data || !event.data.type) return;

    if (event.data.type === "payment_success") {
      this.onSuccess && this.onSuccess(event.data.data);
      this.close();
    }

    if (event.data.type === "payment_failed") {
      this.onFailure && this.onFailure(event.data.data);
    }

    if (event.data.type === "close_modal") {
      this.close();
    }
  }

  close() {
    if (this.modal) {
      document.body.removeChild(this.modal);
      this.modal = null;
    }

    window.removeEventListener("message", this.messageListener);
    this.onClose && this.onClose();
  }
}

// FORCE GLOBAL EXPORT (NO WEBPACK CONFUSION)
window.PaymentGateway = PaymentGateway;
