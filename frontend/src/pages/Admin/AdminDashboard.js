import React, { useEffect, useState } from "react";
import "../../styles/Admin/AdminDashboard.css";
import Sidebard from "../../components/Admin/Sidebar";

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
      .then(res => res.json())
      .then(result => setData(result))
      .catch(err => console.error("Gagal ambil data dashboard:", err));
  }, []);

  return (
    <Sidebard>
      <div className="dashboard-container">
        <h2>Dashboard Admin</h2>
        <div className="dashboard-cards">
          <div className="dashboard-card blue">
            <h3>Jumlah Produk</h3>
            <p>{data.total_products}</p>
          </div>
          <div className="dashboard-card green">
            <h3>Jumlah Pengguna</h3>
            <p>{data.total_users}</p>
          </div>
          <div className="dashboard-card yellow">
            <h3>Barang Masuk</h3>
            <p>{data.barang_masuk}</p>
          </div>
          <div className="dashboard-card red">
            <h3>Barang Keluar</h3>
            <p>{data.barang_keluar}</p>
          </div>
        </div>
      </div>
    </Sidebard>
  );
};

export default AdminDashboard;
