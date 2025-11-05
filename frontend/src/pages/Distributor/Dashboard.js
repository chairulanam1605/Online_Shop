import React, { useEffect, useState } from "react";
import DistributorSidebar from "../../components/Distributor/DistributorSidebar";
import { FaTasks, FaTruck, FaCheckCircle } from "react-icons/fa";
import "../../styles/Distributor/Dashboard.css";

const API_URL = "http://localhost/Online_Shop";

const DistributorDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/distributor/dashboard`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setStats(data || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching stats:", err);
        setLoading(false);
      });
  }, []);

  return (
    <DistributorSidebar>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard Distributor</h1>
            <p className="subtitle">Selamat datang di panel distributor Anda 🎉</p>
          </div>
        </header>

        {loading ? (
          <div className="loading">Memuat data...</div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card pending">
              <div className="stat-icon"><FaTasks /></div>
              <div>
                <h3>Ditugaskan</h3>
                <p>{stats.total_assigned || 0}</p>
              </div>
            </div>
            <div className="stat-card in-delivery">
              <div className="stat-icon"><FaTruck /></div>
              <div>
                <h3>Dikirim</h3>
                <p>{stats.total_dikirim || 0}</p>
              </div>
            </div>
            <div className="stat-card completed">
              <div className="stat-icon"><FaCheckCircle /></div>
              <div>
                <h3>Selesai</h3>
                <p>{stats.total_completed || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DistributorSidebar>
  );
};

export default DistributorDashboard;
