import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Auth/AuthForm.css";
import loginBg from "../../assets/bg_auth.jpg";

const API_URL = "http://localhost/Online_Shop";

const Login = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, password })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Gagal login, respons dari server:", text);
        setError("Respons server tidak valid");
        return;
      }

      const result = await response.json();

      if (result.status === "success") {
        localStorage.setItem("user_id", result.user_id);
        localStorage.setItem("user_name", result.name);
        localStorage.setItem("user_role", result.role);
        if (result.role === "admin") {
          navigate("/admin");
        } else if (result.role === "distributor") {
          navigate("/distributor/dashboard");
        } else {
          navigate("/");
        }
      } else {
        setError(result.message || "Login gagal");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat login");
    }
  };

  return (
    <div
      className="auth-container overlay-strong"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="auth-card">
        <h2>Login</h2>
        <p className="auth-sub">Masuk menggunakan username dan password Anda</p>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          <div className="auth-row">
            <div style={{ flex: 1 }} />
            <div style={{ textAlign: "right" }}>
              <a href="/forgot-password" className="auth-link">Lupa password?</a>
            </div>
          </div>
          <button type="submit" className="auth-button">Login</button>
        </form>
        <p className="auth-link">Belum punya akun? <a href="/register">Daftar</a></p>
      </div>
    </div>
  );
};

export default Login;
