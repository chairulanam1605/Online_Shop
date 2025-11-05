import React, { useState } from "react";
import "../../styles/Auth/AuthForm.css";
import forgotBg from "../../assets/bg_auth.jpg";

const API_URL = "http://localhost/Online_Shop";

const ForgotPassword = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Gagal request reset:", text);
        setError("Respons server tidak valid");
        return;
      }

      const result = await response.json();
      setMessage(result.message || "Permintaan reset dikirim");
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat menghubungi server");
    }
  };

  return (
    <div
      className="auth-container overlay-strong"
      style={{ backgroundImage: `url(${forgotBg})` }}
    >
      <div className="auth-card">
        <h2>Lupa Password</h2>
        <p className="auth-sub">Masukkan email atau username untuk mereset password</p>
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-success">{message}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Email atau Username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
            className="auth-input"
          />
          <button type="submit" className="auth-button">Reset Password</button>
        </form>
        <p className="auth-link"><a href="/login">Kembali ke Login</a></p>
      </div>
    </div>
  );
};

export default ForgotPassword;
