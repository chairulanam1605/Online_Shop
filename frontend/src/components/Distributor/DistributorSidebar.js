// src/components/distributor/DistributorSidebar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Distributor/components/DistributorSidebard.css";

const API_URL = "http://localhost/Online_Shop";

const DistributorSidebar = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(API_URL + "/logout", {
        method: "POST",
        credentials: "include", // hapus session di server
      });

      // Bersihkan local storage
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("role");

      // Redirect ke login
      navigate("/login");
    } catch (err) {
      console.error("Logout gagal:", err);
      navigate("/login"); // fallback redirect
    }
  };

  return (
    <div className="distributor-layout">
      <nav className="distributor-navbar">
        <h1>Distributor Panel</h1>
      </nav>
      <div className="distributor-main">
        <aside className="distributor-sidebar">
          <ul>
            <li>
              <Link to="/distributor/dashboard">
                <span className="icon">📊</span>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/distributor/pesanan">
                <span className="icon">🛒</span>
                Pesanan
              </Link>
            </li>
            <li>
              <Link to="/distributor/riwayat-pengiriman">
                <span className="icon">🚚</span>
                Riwayat Pengiriman
              </Link>
            </li>
            <li>
              <Link to="/distributor/profile">
                <span className="icon">👤</span>
                Profil
              </Link>
            </li>
            <li onClick={handleLogout}>
              <Link to="/login">
                <span className="icon">🚪</span>
                Logout
              </Link>
            </li>
          </ul>
        </aside>
        <main className="distributor-content">{children}</main>
      </div>
    </div>
  );
};

export default DistributorSidebar;
