import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Auth/AuthForm.css";
import registerBg from "../../assets/bg_auth.jpg";

const API_URL = "http://localhost/Online_Shop";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Gagal register, respons server:", text);
        setError("Respons server tidak valid");
        return;
      }

      const data = await res.json();

      if (data.status === "success") {
        setSuccess("Registrasi berhasil. Mengarahkan ke login...");
        setTimeout(() => navigate("/login"), 1000);
      } else {
        setError(data.message || "Registrasi gagal");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat menghubungi server");
    }
  };

  return (
    <div
      className="auth-container overlay-strong"
      style={{ backgroundImage: `url(${registerBg})` }}
    >
      <div className="auth-card">
        <h2>Register</h2>
        <p className="auth-sub">Buat akun baru untuk melanjutkan</p>
        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          <button type="submit" className="auth-button">Register</button>
        </form>
        <p className="auth-link">Sudah punya akun? <a href="/login">Login</a></p>
      </div>
    </div>
  );
};

export default Register;
