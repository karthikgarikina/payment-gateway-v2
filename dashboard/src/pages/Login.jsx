import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    localStorage.setItem("merchant_email", email);
    navigate("/dashboard");
  }

  return (
    <form data-test-id="login-form" onSubmit={handleSubmit}>
      <input
        data-test-id="email-input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        data-test-id="password-input"
        type="password"
        placeholder="Password"
      />
      <button data-test-id="login-button">Login</button>
    </form>
  );
}
