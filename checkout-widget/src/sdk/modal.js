import "./styles.css";

export function createModal(iframeSrc, onCloseClick) {
  const modal = document.createElement("div");
  modal.id = "payment-gateway-modal";
  modal.setAttribute("data-test-id", "payment-modal");

  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <iframe
          data-test-id="payment-iframe"
          src="${iframeSrc}"
        ></iframe>
        <button
          class="close-button"
          data-test-id="close-modal-button"
        >
          ×
        </button>
      </div>
    </div>
  `;

  modal
    .querySelector("[data-test-id='close-modal-button']")
    .addEventListener("click", onCloseClick);

  return modal;
}
