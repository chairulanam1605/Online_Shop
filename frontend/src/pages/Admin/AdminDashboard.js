import React, { useEffect, useState } from "react";
import "../../styles/Admin/AdminDashboard.css";
import Sidebard from "../../components/Admin/Sidebar";
import { FaBox, FaUsers, FaArrowDown, FaArrowUp } from "react-icons/fa";

const API_URL = "http://localhost/Online_Shop";

const AdminDashboard = () => {
  const [data, setData] = useState({
    total_products: 0,
    total_users: 0,
    barang_masuk: 0,
    barang_keluar: 0,
  });

  useEffect(() => {
    fetch(`${API_URL}/Admin/dashboard-data`)
      .then((res) => res.json())
      .then((result) => setData(result))
      .catch((err) => console.error("Gagal ambil data dashboard:", err));
  }, []);

  return (
    <Sidebard>
      <div className="dashboard-wrapper">
        <header className="dashboard-header">
          <h2>Dashboard Admin</h2>
          <p className="dashboard-subtitle">
            Selamat datang kembali 👋, berikut ringkasan data toko Anda
          </p>
        </header>

        <div className="dashboard-grid">
          <div className="dashboard-card card-blue">
            <div className="card-icon"><FaBox /></div>
            <div>
              <h3>Jumlah Produk</h3>
              <p>{data.total_products}</p>
            </div>
          </div>

          <div className="dashboard-card card-green">
            <div className="card-icon"><FaUsers /></div>
            <div>
              <h3>Jumlah Pengguna</h3>
              <p>{data.total_users}</p>
            </div>
          </div>

          <div className="dashboard-card card-yellow">
            <div className="card-icon"><FaArrowDown /></div>
            <div>
              <h3>Barang Masuk</h3>
              <p>{data.barang_masuk}</p>
            </div>
          </div>

          <div className="dashboard-card card-red">
            <div className="card-icon"><FaArrowUp /></div>
            <div>
              <h3>Barang Keluar</h3>
              <p>{data.barang_keluar}</p>
            </div>
          </div>
        </div>
      </div>
    </Sidebard>
  );
};

export default AdminDashboard;
