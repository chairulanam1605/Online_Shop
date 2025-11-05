// src/components/distributor/DistributorSidebar.js
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {FaTachometerAlt, FaShoppingCart, FaTruck, FaFileInvoice, FaUser, FaSignOutAlt,} from "react-icons/fa";
import "../../styles/Distributor/components/DistributorSidebar.css";

const API_URL = "http://localhost/Online_Shop";

const DistributorSidebar = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await fetch(API_URL + "/logout", {
        method: "POST",
        credentials: "include",
      });

      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("role");

      navigate("/login");
    } catch (err) {
      console.error("Logout gagal:", err);
      navigate("/login");
    }
  };

  const menuItems = [
    { path: "/distributor/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { path: "/distributor/pesanan", label: "Pesanan", icon: <FaShoppingCart /> },
    { path: "/distributor/riwayat-pengiriman", label: "Riwayat Pengiriman", icon: <FaTruck /> },
    { path: "/distributor/refund", label: "Daftar Refund", icon: <FaFileInvoice /> },
    { path: "/distributor/profile", label: "Profil", icon: <FaUser /> },
  ];

  return (
    <div className="distributor-layout">
      <nav className="distributor-navbar">
        <h1>Distributor Panel</h1>
      </nav>
      <div className="distributor-main">
        <aside className="distributor-sidebar">
          <ul>
            {menuItems.map((item, idx) => (
              <li key={idx}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? "active" : ""}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button className="logout-btn" onClick={handleLogout}>
                <span className="icon"><FaSignOutAlt /></span>
                Logout
              </button>
            </li>
          </ul>
        </aside>
        <main className="distributor-content">{children}</main>
      </div>
    </div>
  );
};

export default DistributorSidebar;
